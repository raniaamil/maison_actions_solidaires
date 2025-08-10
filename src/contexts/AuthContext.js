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
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté au chargement
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        // CORRECTION: Ajouter le token dans les données utilisateur
        userData.token = storedToken;
        setToken(storedToken);
        setUser(userData);
        console.log('✅ Utilisateur restauré depuis localStorage:', userData);
      } catch (error) {
        console.error('Erreur parsing user data:', error);
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      console.log('🔐 Tentative de connexion pour:', email);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      console.log('📡 Réponse de connexion:', response.status, data);

      if (response.ok) {
        // CORRECTION: Inclure le token dans l'objet user
        const userWithToken = { ...data.user, token: data.token };
        
        setUser(userWithToken);
        setToken(data.token);
        localStorage.setItem('user', JSON.stringify(userWithToken));
        localStorage.setItem('token', data.token);
        
        console.log('✅ Connexion réussie, utilisateur:', userWithToken);
        
        // Rediriger vers l'espace administrateur
        router.push('/administrateur');
        return { success: true };
      } else {
        console.error('❌ Erreur de connexion:', data.error);
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('❌ Erreur réseau lors de la connexion:', error);
      return { success: false, error: 'Erreur de connexion au serveur' };
    }
  };

  const logout = () => {
    console.log('🚪 Déconnexion utilisateur');
    setUser(null);
    setToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  const isAuthenticated = () => {
    const isAuth = !!user && !!token;
    console.log('🔍 Vérification authentification:', isAuth, { user: !!user, token: !!token });
    return isAuth;
  };

  const hasRole = (role) => {
    const hasRoleResult = user?.role === role;
    console.log('👤 Vérification rôle:', role, '→', hasRoleResult, '(utilisateur:', user?.role, ')');
    return hasRoleResult;
  };

  const isAdmin = () => {
    return hasRole('Administrateur');
  };

  const isRedacteur = () => {
    return hasRole('Rédacteur');
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated,
    hasRole,
    isAdmin,
    isRedacteur
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};