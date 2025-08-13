'use client';

import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (loading) return;

    const isAuth = isAuthenticated();
    
    if (!isAuth) {
      console.log('❌ Utilisateur non authentifié, redirection vers /login');
      router.push('/login');
      return;
    }

    if (requiredRole && user?.role !== requiredRole) {
      console.log(`❌ Rôle insuffisant. Requis: ${requiredRole}, Utilisateur: ${user?.role}`);
      
      // Rediriger selon le rôle de l'utilisateur
      if (user?.role === 'Rédacteur') {
        router.push('/administrateur?tab=actualites');
      } else {
        router.push('/administrateur');
      }
      return;
    }

    // Si toutes les vérifications passent, autoriser le rendu
    setShouldRender(true);
  }, [loading, user, isAuthenticated, requiredRole, router]);

  // Affichage du loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Si l'utilisateur n'est pas authentifié ou n'a pas les bonnes permissions
  if (!shouldRender) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Vérification des permissions...</p>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;