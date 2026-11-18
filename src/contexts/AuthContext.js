'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

  // 🔐 La session vit dans un cookie HttpOnly : le JavaScript ne peut ni le lire ni
  // l'écrire. L'identité de l'utilisateur est donc demandée au serveur au montage,
  // et non plus relue depuis localStorage (qui était exfiltrable par XSS et, en prime,
  // modifiable par l'utilisateur pour se donner un faux rôle côté affichage).
  const refreshSession = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'same-origin',
        cache: 'no-store',
      });
      const data = await res.json();

      if (res.ok && data.authenticated && data.user) {
        setUser(data.user);
        return data.user;
      }
      setUser(null);
      return null;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération de la session:', error?.message);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = async (email, password, rememberMe = false) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Le token n'est plus renvoyé au client : il est posé par le serveur dans
        // un cookie HttpOnly. On ne conserve ici que le profil affichable.
        setUser(data.user);
        setLoading(false);
        console.log('✅ Connexion réussie');
        router.push('/administrateur');
        return { success: true };
      }

      console.error('❌ Erreur de connexion:', data.error);
      return { success: false, error: data.error || 'Identifiants incorrects' };
    } catch (error) {
      console.error('❌ Erreur réseau lors de la connexion:', error?.message);
      return { success: false, error: 'Erreur de connexion au serveur' };
    }
  };

  // Mise à jour locale du profil affiché (après édition de son propre compte).
  // Ne touche pas à la session : celle-ci reste portée par le cookie.
  const updateUser = (updatedData) => {
    if (!user) return;
    setUser((prev) => ({ ...prev, ...updatedData }));
  };

  // 🔐 Le cookie étant HttpOnly, seul le serveur peut l'expirer.
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
      });
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error?.message);
    } finally {
      setUser(null);
      router.push('/se-connecter');
    }
  };

  const isAuthenticated = () => !!user;

  const isAdmin = () => isAuthenticated() && user.role === 'Administrateur';

  const hasRole = (role) => isAuthenticated() && user.role === role;

  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
    refreshSession,
    isAuthenticated,
    hasRole,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
