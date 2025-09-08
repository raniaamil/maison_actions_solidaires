'use client';

import React from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * @param {{ requiredRole?: 'Administrateur'|'Rédacteur'|string|null, children: any }} props
 */
export default function ProtectedRoute({ requiredRole = null, children }) {
  const auth = useAuth() || {};
  const user = auth.user;

  // Aucune contrainte de rôle → on laisse passer
  if (requiredRole == null) {
    return <>{children}</>;
  }

  // En cours de chargement (si ton contexte met un certain temps à remplir user)
  if (typeof user === 'undefined') {
    return (
      <div className="min-h-[40vh] grid place-items-center text-gray-600">
        Chargement...
      </div>
    );
  }

  // Non connecté
  if (!user) {
    return (
      <div className="min-h-[40vh] grid place-items-center text-gray-600">
        Accès restreint — veuillez vous connecter.
      </div>
    );
  }

  // Rôle non autorisé
  if (user.role !== requiredRole) {
    return (
      <div className="min-h-[40vh] grid place-items-center text-red-600">
        Accès refusé — rôle « {String(requiredRole)} » requis.
      </div>
    );
  }

  // Autorisé
  return <>{children}</>;
}
