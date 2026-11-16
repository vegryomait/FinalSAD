import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export const PRESET_USERS = [
  { role: 'Mahasiswa', name: 'Nadia Putri', email: 'nadia.putri@kampus.ac.id', idNum: '2204101021' },
  { role: 'Dosen Pengampu', name: 'Dr. Budi Santoso', email: 'budi@kampus.ac.id', idNum: '198603121' },
  { role: 'Dosen', name: 'Dr. Maya Dewi', email: 'maya@kampus.ac.id', idNum: '198904053' },
  { role: 'Laboran', name: 'Sinta Rahma', email: 'sinta@kampus.ac.id', idNum: 'LAB-001' },
  { role: 'Kepala Laboratorium', name: 'Prof. Hendra Kusuma', email: 'hendra@kampus.ac.id', idNum: '197508151' },
  { role: 'Dekan', name: 'Dr. Ratna Sari', email: 'ratna.sari@kampus.ac.id', idNum: '197001011' },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const savedToken = localStorage.getItem('labora_token');
      if (savedToken) {
        try {
          const profile = await api.get('/api/auth/me');
          setUser(profile);
        } catch (err) {
          localStorage.removeItem('labora_token');
          setUser(null);
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const login = async (username, password) => {
    const data = await api.post('/api/auth/login', { username, password });
    localStorage.setItem('labora_token', data.access_token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('labora_token');
    setUser(null);
  };

  const quickLoginAs = async (email) => {
    return await login(email, 'password123');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, quickLoginAs }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
