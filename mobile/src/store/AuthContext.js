// Global auth state: holds the logged-in user, restores the session on launch,
// and exposes signIn / signOut. Persona drives which navigator renders.
import React, { createContext, useContext, useEffect, useState } from 'react';

import * as authApi from '../api/auth';
import { setForceLogout } from '../api/client';
import { K, secureDelete, secureGet, secureSet } from '../storage/secure';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null); // e.g. forced-logout message

  // Restore a persisted session on cold start (offline-friendly).
  useEffect(() => {
    (async () => {
      try {
        const raw = await secureGet(K.USER);
        if (raw) setUser(JSON.parse(raw));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Let the API layer trigger a logout (expired session / device unbound).
  useEffect(() => {
    setForceLogout((message) => {
      setUser(null);
      setNotice(message || null);
    });
  }, []);

  async function persistSession(tokens, userObj) {
    await secureSet(K.ACCESS, tokens.access);
    await secureSet(K.REFRESH, tokens.refresh);
    await secureSet(K.USER, JSON.stringify(userObj));
    setUser(userObj);
  }

  async function signIn(identifier, password) {
    const data = await authApi.login(identifier, password);
    await persistSession(data.tokens, data.user);
    return data;
  }

  async function signOut() {
    await Promise.all([
      secureDelete(K.ACCESS),
      secureDelete(K.REFRESH),
      secureDelete(K.USER),
    ]);
    setUser(null);
  }

  const value = {
    user,
    loading,
    notice,
    clearNotice: () => setNotice(null),
    signIn,
    signOut,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
