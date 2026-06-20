import { create } from 'zustand';
import { casesAPI } from '../services/api';
import * as offlineCache from '../services/offlineCache';
import api from '../services/api'; // Import your configured instance

// In your fetchCases action:
fetchCases: async () => {
  const response = await api.get('/cases'); // This will automatically use the baseURL
  setStore({ cases: response.data });
}
export const useCaseStore = create((setStore, getStore) => ({
  cases: [],
  activeCaseId: null,
  activeCase: null,
  isLoading: false,
  isOfflineMode: !window.navigator.onLine,

  // Set active case ID and update activeCase reference
  setActiveCaseId: (id) => {
    const { cases } = getStore();
    const activeCase = cases.find(c => c._id === id || c.firNo === id) || null;
    setStore({ activeCaseId: id, activeCase });
  },

  // Set activeCase directly
  setActiveCase: (activeCase) => {
    setStore({ activeCase, activeCaseId: activeCase?._id || null });
  },

  // Fetch all cases
  fetchCases: async () => {
    setStore({ isLoading: true });
    try {
      const casesList = await casesAPI.getCases();
      // On success, update store and mirror to IndexedDB cache
      setStore({ cases: casesList, isLoading: false, isOfflineMode: false });
      await offlineCache.cacheAllCases(casesList);

      // Restore active case reference if it was set
      const { activeCaseId } = getStore();
      if (activeCaseId) {
        const activeCase = casesList.find(c => c._id === activeCaseId || c.firNo === activeCaseId);
        if (activeCase) setStore({ activeCase });
      } else if (casesList.length > 0) {
        setStore({ activeCaseId: casesList[0]._id, activeCase: casesList[0] });
      }
    } catch (err) {
      console.warn('Network fetch failed, loading from IndexedDB:', err);
      // Fallback to offline cache
      const cachedCases = await offlineCache.getAllCases();
      setStore({ cases: cachedCases, isLoading: false, isOfflineMode: true });

      const { activeCaseId } = getStore();
      if (activeCaseId) {
        const activeCase = cachedCases.find(c => c._id === activeCaseId || c.firNo === activeCaseId);
        if (activeCase) setStore({ activeCase });
      } else if (cachedCases.length > 0) {
        setStore({ activeCaseId: cachedCases[0]._id, activeCase: cachedCases[0] });
      }
    }
  },

  // Fetch a single case by ID
  fetchCase: async (id) => {
    setStore({ isLoading: true });
    try {
      const caseItem = await casesAPI.getCaseById(id);
      setStore({ activeCase: caseItem, activeCaseId: caseItem._id, isLoading: false, isOfflineMode: false });
      await offlineCache.saveCase(caseItem);

      // Update in cases array
      const { cases } = getStore();
      const index = cases.findIndex(c => c._id === caseItem._id);
      if (index !== -1) {
        const updatedCases = [...cases];
        updatedCases[index] = caseItem;
        setStore({ cases: updatedCases });
      }
      return caseItem;
    } catch (err) {
      console.warn(`Failed to fetch case ${id} from API, loading from cache:`, err);
      const cachedCase = await offlineCache.getCase(id);
      if (cachedCase) {
        setStore({ activeCase: cachedCase, activeCaseId: cachedCase._id, isLoading: false, isOfflineMode: true });
        return cachedCase;
      }
      setStore({ isLoading: false });
      throw err;
    }
  },

  // Create a new case
  createCase: async (caseData) => {
    setStore({ isLoading: true });
    try {
      const newCase = await casesAPI.createCase(caseData);
      const { cases } = getStore();
      setStore({
        cases: [newCase, ...cases],
        activeCase: newCase,
        activeCaseId: newCase._id,
        isLoading: false,
        isOfflineMode: false
      });
      await offlineCache.saveCase(newCase);
      return newCase;
    } catch (err) {
      console.warn('Failed to create case on server, running offline:', err);
      
      // Generate temporary local ID if offline
      const tempId = 'temp_' + Date.now();
      const offlineNewCase = {
        _id: tempId,
        ...caseData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { cases } = getStore();
      setStore({
        cases: [offlineNewCase, ...cases],
        activeCase: offlineNewCase,
        activeCaseId: tempId,
        isLoading: false,
        isOfflineMode: true
      });

      // Cache locally and push to sync queue
      await offlineCache.saveCase(offlineNewCase);
      await offlineCache.addToSyncQueue({
        type: 'CREATE',
        id: tempId,
        data: caseData
      });

      return offlineNewCase;
    }
  },

  // Update a case
  updateCase: async (id, caseData) => {
    try {
      const updatedCase = await casesAPI.updateCase(id, caseData);
      
      const { cases, activeCaseId } = getStore();
      const updatedCases = cases.map(c => (c._id === id || c.firNo === id) ? updatedCase : c);
      
      setStore({
        cases: updatedCases,
        isOfflineMode: false
      });

      if (activeCaseId === id || (getStore().activeCase && getStore().activeCase.firNo === id)) {
        setStore({ activeCase: updatedCase });
      }

      await offlineCache.saveCase(updatedCase);
      return updatedCase;
    } catch (err) {
      console.warn(`Failed to update case ${id} on server, queuing update offline:`, err);
      
      const localUpdatedCase = {
        ...caseData,
        _id: id,
        updatedAt: new Date().toISOString()
      };

      const { cases, activeCaseId } = getStore();
      const updatedCases = cases.map(c => (c._id === id || c.firNo === id) ? localUpdatedCase : c);

      setStore({
        cases: updatedCases,
        isOfflineMode: true
      });

      if (activeCaseId === id || (getStore().activeCase && getStore().activeCase.firNo === id)) {
        setStore({ activeCase: localUpdatedCase });
      }

      await offlineCache.saveCase(localUpdatedCase);
      await offlineCache.addToSyncQueue({
        type: 'UPDATE',
        id: id,
        data: caseData
      });

      return localUpdatedCase;
    }
  },

  // Delete a case
  deleteCase: async (id) => {
    try {
      await casesAPI.deleteCase(id);
      
      const { cases, activeCaseId } = getStore();
      const filteredCases = cases.filter(c => c._id !== id && c.firNo !== id);
      
      setStore({
        cases: filteredCases,
        isOfflineMode: false
      });

      if (activeCaseId === id) {
        setStore({
          activeCaseId: filteredCases.length > 0 ? filteredCases[0]._id : null,
          activeCase: filteredCases.length > 0 ? filteredCases[0] : null
        });
      }

      await offlineCache.deleteCase(id);
    } catch (err) {
      console.warn(`Failed to delete case ${id} on server, queueing deletion offline:`, err);

      const { cases, activeCaseId } = getStore();
      const filteredCases = cases.filter(c => c._id !== id && c.firNo !== id);

      setStore({
        cases: filteredCases,
        isOfflineMode: true
      });

      if (activeCaseId === id) {
        setStore({
          activeCaseId: filteredCases.length > 0 ? filteredCases[0]._id : null,
          activeCase: filteredCases.length > 0 ? filteredCases[0] : null
        });
      }

      await offlineCache.deleteCase(id);
      await offlineCache.addToSyncQueue({
        type: 'DELETE',
        id: id
      });
    }
  },

  // Set offline mode state directly
  setOfflineMode: (isOffline) => {
    setStore({ isOfflineMode: isOffline });
  },

  // Flush offline queue when network is back
  syncOfflineMutations: async () => {
    try {
      await offlineCache.flushSyncQueue();
      // Reload cases list to get actual IDs from server
      await getStore().fetchCases();
    } catch (err) {
      console.error('Error syncing offline mutations:', err);
    }
  }
}));

// Setup window listener for online status
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useCaseStore.getState().setOfflineMode(false);
    useCaseStore.getState().syncOfflineMutations();
  });
  window.addEventListener('offline', () => {
    useCaseStore.getState().setOfflineMode(true);
  });
}
