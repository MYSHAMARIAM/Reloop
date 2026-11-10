import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api';
import { useMockData } from './MockDataContext';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const { users, mockApi } = useMockData();
  
  // Default to mock mode in this cloud sandbox environment, but let user toggle freely
  const [isMockMode, setIsMockMode] = useState(() => {
    const saved = localStorage.getItem('reloop_use_mock_mode');
    return saved !== null ? saved === 'true' : false;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('reloop_current_user');
    if (!saved) return null;
    try { return JSON.parse(saved); } catch { return null; }
  });

  const [loading, setLoading] = useState(true);
  const [backendStatus, setBackendStatus] = useState('checking'); // 'connected', 'offline', 'mock'

  // Check real backend connectivity on mount
  useEffect(() => {
    let isMounted = true;
    async function checkBackend() {
      try {
        await api.checkHealth();
        if (isMounted) setBackendStatus('connected');
      } catch {
        if (isMounted) setBackendStatus('offline');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    checkBackend();
    return () => { isMounted = false; };
  }, []);

  // Restore the authoritative account from the HttpOnly session after refresh.
  useEffect(() => {
    if (isMockMode) return;
    let isMounted = true;
    api.auth.getMe()
      .then((user) => { if (isMounted) setCurrentUser(user); })
      .catch(() => { if (isMounted) setCurrentUser(null); });
    return () => { isMounted = false; };
  }, [isMockMode]);

  // Save current user to localStorage for preview persistence
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('reloop_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('reloop_current_user');
    }
  }, [currentUser]);

  // Save mock mode flag
  const toggleMockMode = (enableMock) => {
    setIsMockMode(enableMock);
    localStorage.setItem('reloop_use_mock_mode', String(enableMock));
  };

  const login = async (email, password) => {
    if (isMockMode) {
      const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (!found) {
        throw new Error('Invalid email or password. (Demo: try rohit.verma@campus.edu or aarav.sharma@campus.edu)');
      }
      setCurrentUser(found);
      return found;
    } else {
      // Step 1 of 2: password check. Backend replies { require_otp: true } and sets NO cookie yet.
      const res = await api.auth.login({ email, password });
      if (res && res.require_otp) return res;
      setCurrentUser(res);
      return res;
    }
  };

  // Step 2 of 2: OTP check. This is what actually sets the session cookie.
  const verifyOtp = async (email, code) => {
    const user = await api.auth.verifyOtp({ email, code });
    setCurrentUser(user);
    return user;
  };

  const register = async (formData) => {
    if (isMockMode) {
      const existing = users.find(u => u.email.toLowerCase() === formData.email.toLowerCase());
      if (existing) {
        throw new Error('A student with this college email already exists.');
      }
      const newUser = {
        id: Date.now(),
        email: formData.email.toLowerCase(),
        display_name: formData.display_name,
        college_id: formData.college_id || null,
        campus_location: formData.campus_location || null,
        bio: formData.bio || null,
        created_at: new Date().toISOString(),
      };
      setCurrentUser(newUser);
      return newUser;
    } else {
      const user = await api.auth.register(formData);
      setCurrentUser(user);
      return user;
    }
  };

  const logout = async () => {
    if (!isMockMode) {
      try {
        await api.auth.logout();
      } catch (e) {
        console.error('Logout error:', e);
      }
    }
    setCurrentUser(null);
  };

  // Switch demo user quickly for college presentation
  const switchDemoUser = (user) => {
    setCurrentUser(user);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        isMockMode,
        backendStatus,
        toggleMockMode,
        login,
        verifyOtp,
        register,
        logout,
        switchDemoUser,
        availableDemoUsers: users,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
