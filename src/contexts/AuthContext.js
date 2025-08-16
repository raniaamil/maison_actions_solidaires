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
        userData.storageType = storageType; // Mémoriser le type de stockage utilisé
        setUser(userData);
        console.log(`✅ Utilisateur restauré depuis ${storageType}:`, userData.email);
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
      // Nettoyer les deux types de stockage
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
            // "Se souvenir de moi" activé : utiliser localStorage (persistant)
            localStorage.setItem('user', JSON.stringify(userWithToken));
            localStorage.setItem('token', data.token);
            console.log('💾 Données stockées dans localStorage (persistant)');
          } else {
            // "Se souvenir de moi" désactivé : utiliser sessionStorage (temporaire)
            sessionStorage.setItem('user', JSON.stringify(userWithToken));
            sessionStorage.setItem('token', data.token);
            console.log('💾 Données stockées dans sessionStorage (temporaire)');
          }
        }
        
        console.log('✅ Connexion réussie:', userWithToken.email);
        
        // Redirection vers l'espace administrateur
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
    if (user?.token) {
      return user.token;
    }
    
    if (typeof window !== 'undefined') {
      // Vérifier d'abord localStorage puis sessionStorage
      return localStorage.getItem('token') || sessionStorage.getItem('token');
    }
    
    return null;
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