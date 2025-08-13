'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = () => {
    try {
      if (typeof window === 'undefined') {
        setLoading(false);
        return;
      }

      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');

      if (storedUser && storedToken) {
        const userData = JSON.parse(storedUser);
        // Ajouter le token aux données utilisateur
        userData.token = storedToken;
        setUser(userData);
        console.log('✅ Utilisateur restauré depuis localStorage:', userData.email);
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation de l\'auth:', error);
      clearAuthData();
    } finally {
      setLoading(false);
    }
  };

  const clearAuthData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    setUser(null);
  };

  const login = async (email, password) => {
    try {
      console.log('🔐 Tentative de connexion pour:', email);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const userWithToken = { ...data.user, token: data.token };
        
        setUser(userWithToken);
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(userWithToken));
          localStorage.setItem('token', data.token);
        }
        
        console.log('✅ Connexion réussie:', userWithToken.email);
        
        // Redirection vers l'espace administrateur (plus de distinction de rôle)
        router.push('/administrateur');
        return { success: true };
      } else {
        console.error('❌ Erreur de connexion:', data.error);
        return { success: false, error: data.error || 'Identifiants incorrects' };
      }
    } catch (error) {
      console.error('❌ Erreur réseau lors de la connexion:', error);
      return { success: false, error: 'Erreur de connexion au serveur' };
    }
  };

  const logout = () => {
    console.log('🚪 Déconnexion utilisateur');
    clearAuthData();
    router.push('/login');
  };

  const isAuthenticated = () => {
    return !!user && !!user.token;
  };

  const hasRole = (role) => {
    return user?.role === role;
  };

  const isAdmin = () => {
    // Maintenant tous les utilisateurs connectés sont des administrateurs
    return isAuthenticated();
  };

  // Fonction pour obtenir le token actuel
  const getToken = () => {
    return user?.token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated,
    hasRole,
    isAdmin,
    getToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};