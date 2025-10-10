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

      // Vérifier d'abord localStorage (se souvenir de moi activé)
      let storedUser = localStorage.getItem('user');
      let storedToken = localStorage.getItem('token');
      let storageType = 'localStorage';

      // Si pas trouvé dans localStorage, vérifier sessionStorage
      if (!storedUser || !storedToken) {
        storedUser = sessionStorage.getItem('user');
        storedToken = sessionStorage.getItem('token');
        storageType = 'sessionStorage';
      }

      if (storedUser && storedToken) {
        const userData = JSON.parse(storedUser);
        userData.token = storedToken;
        userData.storageType = storageType;
        setUser(userData);
        console.log(`✅ Utilisateur restauré depuis ${storageType}:`, userData.email, '| Rôle:', userData.role);
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
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('token');
    }
    setUser(null);
  };

  const login = async (email, password, rememberMe = false) => {
    try {
      console.log('🔐 Tentative de connexion pour:', email, '| Se souvenir:', rememberMe);
      
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
          if (rememberMe) {
            localStorage.setItem('user', JSON.stringify(userWithToken));
            localStorage.setItem('token', data.token);
            console.log('💾 Données stockées dans localStorage (persistant)');
          } else {
            sessionStorage.setItem('user', JSON.stringify(userWithToken));
            sessionStorage.setItem('token', data.token);
            console.log('💾 Données stockées dans sessionStorage (temporaire)');
          }
        }
        
        console.log('✅ Connexion réussie:', userWithToken.email, '| Rôle:', userWithToken.role);
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

  // Mise à jour des données utilisateur
  const updateUser = (updatedData) => {
    if (!user) return;

    try {
      const updatedUser = { ...user, ...updatedData };
      setUser(updatedUser);
      
      if (typeof window !== 'undefined') {
        // Déterminer quel type de stockage utiliser
        const useLocalStorage = localStorage.getItem('user') !== null;
        const storage = useLocalStorage ? localStorage : sessionStorage;
        
        // Mettre à jour les données stockées
        storage.setItem('user', JSON.stringify(updatedUser));
        
        console.log('✅ Données utilisateur mises à jour dans le contexte');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour des données utilisateur:', error);
    }
  };

  const logout = () => {
    console.log('🚪 Déconnexion utilisateur');
    clearAuthData();
    router.push('/se-connecter');
  };

  const isAuthenticated = () => {
    return !!user && !!user.token;
  };

  // ✅ CORRIGÉ : Vérifier le rôle réel de l'utilisateur
  const isAdmin = () => {
    if (!isAuthenticated()) return false;
    return user.role === 'Administrateur';
  };

  // ✅ CORRIGÉ : Vérifier le rôle spécifique
  const hasRole = (role) => {
    if (!isAuthenticated()) return false;
    return user.role === role;
  };

  const getToken = () => {
    if (user?.token) {
      return user.token;
    }
    
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token') || sessionStorage.getItem('token');
    }
    
    return null;
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser, 
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