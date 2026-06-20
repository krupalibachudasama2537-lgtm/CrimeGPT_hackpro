import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_DIR = path.resolve(__dirname, '..');

const USERS_FILE = path.resolve(BACKEND_DIR, 'users_db.json');
const CASES_FILE = path.resolve(BACKEND_DIR, 'cases_db.json');
const AUDIT_LOGS_FILE = path.resolve(BACKEND_DIR, 'audit_logs_db.json');


// Helper to ensure file exists with default content
function ensureFileExists(filePath, defaultContent) {
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(defaultContent, null, 2), 'utf-8');
  }
}

// Initial seed cases mapping to the initialCaseData from frontend/src/data/mockData.js
const SEED_CASES = [];

// Helper: Seed initial users
async function getSeedUsers() {
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);
  return [
    {
      _id: "65e8a156e9c60e3cc4a12301",
      username: "IO-9982",
      name: "Inspector Rajesh V. Parmar",
      email: "rajesh.parmar@police.gov.in",
      badge: "IO-9982",
      password: hashedPassword,
      role: "io",
      createdAt: new Date().toISOString()
    },
    {
      _id: "65e8a156e9c60e3cc4a12302",
      username: "SHO-8891",
      name: "Senior Inspector M. K. Jadeja",
      email: "mk.jadeja@police.gov.in",
      badge: "SHO-8891",
      password: hashedPassword,
      role: "sho",
      createdAt: new Date().toISOString()
    },
    {
      _id: "65e8a156e9c60e3cc4a12303",
      username: "LA-1102",
      name: "Advocate P. D. Vyas",
      email: "pd.vyas@legal.gov.in",
      badge: "LA-1102",
      password: hashedPassword,
      role: "legal",
      createdAt: new Date().toISOString()
    }
  ];
}

// Initialization function
export async function initializeOfflineDb() {
  try {
    ensureFileExists(CASES_FILE, SEED_CASES);
    ensureFileExists(AUDIT_LOGS_FILE, []);
    
    if (!fs.existsSync(USERS_FILE)) {
      const seedUsers = await getSeedUsers();
      fs.writeFileSync(USERS_FILE, JSON.stringify(seedUsers, null, 2), 'utf-8');
      console.log('Seeded offline users in users_db.json successfully.');
    }
    console.log('Offline JSON Database initialized.');
  } catch (error) {
    console.error('Failed to initialize offline database:', error);
  }
}

// Sync Read Helpers
function readUsers() {
  ensureFileExists(USERS_FILE, []);
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
}

function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

function readCases() {
  ensureFileExists(CASES_FILE, SEED_CASES);
  return JSON.parse(fs.readFileSync(CASES_FILE, 'utf-8'));
}

function writeCases(cases) {
  fs.writeFileSync(CASES_FILE, JSON.stringify(cases, null, 2), 'utf-8');
}

function readLogs() {
  ensureFileExists(AUDIT_LOGS_FILE, []);
  return JSON.parse(fs.readFileSync(AUDIT_LOGS_FILE, 'utf-8'));
}

function writeLogs(logs) {
  fs.writeFileSync(AUDIT_LOGS_FILE, JSON.stringify(logs, null, 2), 'utf-8');
}

// Expose CRUD interfaces mirroring Mongoose behavior
export const offlineDb = {
  // USER OPERATIONS
  users: {
    find: async () => {
      return readUsers();
    },
    findOne: async (query) => {
      const users = readUsers();
      return users.find(u => {
        // Simple query matching logic for user authentication checks
        if (query.$or) {
          return query.$or.some(q => {
            return (q.username && u.username === q.username) || 
                   (q.badge && u.badge === q.badge) || 
                   (q.email && u.email === q.email) ||
                   (q.badge === query.$or[1]?.badge); // handles fallback {badge: username}
          });
        }
        if (query.username) return u.username === query.username;
        if (query.badge) return u.badge === query.badge;
        if (query.email) return u.email === query.email;
        return false;
      });
    },
    findById: async (id) => {
      const users = readUsers();
      return users.find(u => u._id === id);
    },
    create: async (userData) => {
      const users = readUsers();
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      const newUser = {
        _id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        ...userData,
        password: hashedPassword,
        createdAt: new Date().toISOString()
      };
      users.push(newUser);
      writeUsers(users);
      return newUser;
    }
  },

  // CASE OPERATIONS
  cases: {
    find: async () => {
      const cases = readCases();
      // Sort by updatedAt descending
      return cases.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    },
    findOne: async (query) => {
      const cases = readCases();
      if (query.firNo) {
        return cases.find(c => c.firNo === query.firNo);
      }
      return null;
    },
    findById: async (id) => {
      const cases = readCases();
      return cases.find(c => c._id === id || c.firNo === id);
    },
    create: async (caseData) => {
      const cases = readCases();
      const newCase = {
        _id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        ...caseData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      cases.push(newCase);
      writeCases(cases);
      return newCase;
    },
    findByIdAndUpdate: async (id, updateData, options = {}) => {
      const cases = readCases();
      const caseIdx = cases.findIndex(c => c._id === id || c.firNo === id);
      if (caseIdx === -1) return null;

      const updatedCase = {
        ...cases[caseIdx],
        ...updateData.$set,
        updatedAt: new Date().toISOString()
      };

      cases[caseIdx] = updatedCase;
      writeCases(cases);
      return updatedCase;
    },
    findByIdAndDelete: async (id) => {
      let cases = readCases();
      const initialLength = cases.length;
      cases = cases.filter(c => c._id !== id && c.firNo !== id);
      writeCases(cases);
      return cases.length < initialLength;
    }
  },

  // AUDIT LOG OPERATIONS
  auditLogs: {
    find: async () => {
      return readLogs();
    },
    create: async (logData) => {
      const logs = readLogs();
      const newLog = {
        _id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        ...logData,
        timestamp: new Date().toISOString()
      };
      logs.push(newLog);
      writeLogs(logs);
      return newLog;
    }
  }
};
