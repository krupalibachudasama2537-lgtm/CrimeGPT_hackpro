import { get, set, del } from 'idb-keyval';
import { casesAPI } from './api';

const CASES_CACHE_KEY = 'crimegpt_cached_cases';
const SYNC_QUEUE_KEY = 'crimegpt_sync_queue';

// Get all cases from cache
export const getAllCases = async () => {
  try {
    const cases = await get(CASES_CACHE_KEY);
    return cases || [];
  } catch (err) {
    console.error('Failed to get cached cases:', err);
    return [];
  }
};

// Get a single case by ID from cache
export const getCase = async (id) => {
  try {
    const cases = await getAllCases();
    return cases.find(c => c._id === id || c.firNo === id) || null;
  } catch (err) {
    console.error('Failed to get cached case:', err);
    return null;
  }
};

// Save or update a case in cache
export const saveCase = async (caseData) => {
  if (!caseData || !caseData._id) return;
  try {
    const cases = await getAllCases();
    const index = cases.findIndex(c => c._id === caseData._id);
    if (index !== -1) {
      cases[index] = { ...cases[index], ...caseData, updatedAt: new Date().toISOString() };
    } else {
      cases.push(caseData);
    }
    await set(CASES_CACHE_KEY, cases);
  } catch (err) {
    console.error('Failed to cache case:', err);
  }
};

// Mirror multiple cases from API to cache
export const cacheAllCases = async (casesList) => {
  try {
    await set(CASES_CACHE_KEY, casesList);
  } catch (err) {
    console.error('Failed to cache cases list:', err);
  }
};

// Delete a case from cache
export const deleteCase = async (id) => {
  try {
    const cases = await getAllCases();
    const updated = cases.filter(c => c._id !== id && c.firNo !== id);
    await set(CASES_CACHE_KEY, updated);
  } catch (err) {
    console.error('Failed to delete cached case:', err);
  }
};

// Get pending sync queue
export const getSyncQueue = async () => {
  try {
    const queue = await get(SYNC_QUEUE_KEY);
    return queue || [];
  } catch (err) {
    console.error('Failed to read sync queue:', err);
    return [];
  }
};

// Add an operation to the sync queue
export const addToSyncQueue = async (action) => {
  // Action format: { type: 'CREATE' | 'UPDATE' | 'DELETE', id, data }
  try {
    const queue = await getSyncQueue();
    // If there is already an update for the same case, check if we can merge or replace
    if (action.type === 'UPDATE') {
      const existingIdx = queue.findIndex(item => item.id === action.id && item.type === 'UPDATE');
      if (existingIdx !== -1) {
        queue[existingIdx].data = { ...queue[existingIdx].data, ...action.data };
        await set(SYNC_QUEUE_KEY, queue);
        return;
      }
    }
    queue.push(action);
    await set(SYNC_QUEUE_KEY, queue);
    console.log('Offline action added to sync queue:', action);
  } catch (err) {
    console.error('Failed to add action to sync queue:', err);
  }
};

// Clear sync queue
export const clearSyncQueue = async () => {
  try {
    await del(SYNC_QUEUE_KEY);
  } catch (err) {
    console.error('Failed to clear sync queue:', err);
  }
};

// Flush sync queue to server when connection returns
export const flushSyncQueue = async () => {
  const queue = await getSyncQueue();
  if (queue.length === 0) return;

  console.log(`Connection restored! Flushing ${queue.length} offline mutations...`);
  
  const failedItems = [];
  
  for (const action of queue) {
    try {
      if (action.type === 'CREATE') {
        await casesAPI.createCase(action.data);
      } else if (action.type === 'UPDATE') {
        await casesAPI.updateCase(action.id, action.data);
      } else if (action.type === 'DELETE') {
        await casesAPI.deleteCase(action.id);
      }
    } catch (err) {
      console.error(`Failed to sync action:`, action, err);
      // Keep in queue to retry later if it is a network failure again
      failedItems.push(action);
    }
  }

  if (failedItems.length > 0) {
    await set(SYNC_QUEUE_KEY, failedItems);
  } else {
    await clearSyncQueue();
    console.log('Offline sync queue successfully flushed and cleared.');
  }
};
