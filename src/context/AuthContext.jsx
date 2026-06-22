import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => ({
    isLoggedIn: localStorage.getItem('hlm_logged_in') === 'true',
    userId: localStorage.getItem('hlm_user_id') || null,
  }));

  const login = (userId) => {
    localStorage.setItem('hlm_logged_in', 'true');
    localStorage.setItem('hlm_user_id', userId);
    setAuth({ isLoggedIn: true, userId });
  };

  const logout = () => {
    localStorage.removeItem('hlm_logged_in');
    localStorage.removeItem('hlm_user_id');
    setAuth({ isLoggedIn: false, userId: null });
  };

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
