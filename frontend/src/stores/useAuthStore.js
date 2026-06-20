import { create } from 'zustand';
import { get, set, del } from 'idb-keyval';
import { authAPI } from '../services/api';

export const useAuthStore = create((setStore) => ({
  user: (() => {
    try {
      return JSON.parse(localStorage.getItem('crimegpt_user'));
    } catch (e) {
      return null;
    }
  })() || null,
  token: localStorage.getItem('crimegpt_token') || null,
  role: localStorage.getItem('crimegpt_role') || null,
  isAuthenticated: !!localStorage.getItem('crimegpt_token'),
  lang: (() => {
    const stored = localStorage.getItem('crimegpt_lang');
    return (stored === 'en' || stored === 'hi' || stored === 'gu') ? stored : 'en';
  })(),

  setLang: (lang) => {
    localStorage.setItem('crimegpt_lang', lang);
    setStore({ lang });
  },

  login: async (username, password) => {
    try {
      const data = await authAPI.login(username, password);
      localStorage.setItem('crimegpt_token', data.token);
      localStorage.setItem('crimegpt_user', JSON.stringify(data.user));
      localStorage.setItem('crimegpt_role', data.user.role);

      // IndexedDB persistence as fallback/parallel cache
      try {
        await set('crimegpt_token', data.token);
        await set('crimegpt_user', data.user);
      } catch (idbErr) {
        console.error('IndexedDB write failed:', idbErr);
      }

      setStore({
        user: data.user,
        token: data.token,
        role: data.user.role,
        isAuthenticated: true
      });
      return data.user;
    } catch (err) {
      throw err;
    }
  },

  register: async (userData) => {
    try {
      const data = await authAPI.register(userData);
      localStorage.setItem('crimegpt_token', data.token);
      localStorage.setItem('crimegpt_user', JSON.stringify(data.user));
      localStorage.setItem('crimegpt_role', data.user.role);

      try {
        await set('crimegpt_token', data.token);
        await set('crimegpt_user', data.user);
      } catch (idbErr) {
        console.error('IndexedDB write failed:', idbErr);
      }

      setStore({
        user: data.user,
        token: data.token,
        role: data.user.role,
        isAuthenticated: true
      });
      return data.user;
    } catch (err) {
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('crimegpt_token');
    localStorage.removeItem('crimegpt_user');
    localStorage.removeItem('crimegpt_role');

    try {
      del('crimegpt_token');
      del('crimegpt_user');
    } catch (idbErr) {
      console.error('IndexedDB delete failed:', idbErr);
    }

    setStore({
      user: null,
      token: null,
      role: null,
      isAuthenticated: false
    });
  },

  initializeAuth: async () => {
    try {
      let token = localStorage.getItem('crimegpt_token');
      let user = null;
      try {
        user = JSON.parse(localStorage.getItem('crimegpt_user'));
      } catch (e) {}

      if (!token) {
        token = await get('crimegpt_token');
        user = await get('crimegpt_user');
      }

      if (token && user) {
        localStorage.setItem('crimegpt_token', token);
        localStorage.setItem('crimegpt_user', JSON.stringify(user));
        localStorage.setItem('crimegpt_role', user.role);

        setStore({
          user,
          token,
          role: user.role,
          isAuthenticated: true
        });
      }
    } catch (err) {
      console.error('Auth initialization from IDB failed:', err);
    }
  }
}));
