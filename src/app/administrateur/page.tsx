'use client';

import React, { useEffect, useState } from 'react';
import { User, FileText, Users, LogOut, Edit, Trash2, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';

type Tab = 'informations' | 'actualites' | 'utilisateurs';

const EspaceAdministrateurPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout, isAdmin, getToken } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>('informations');
  const [articles, setArticles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [deleteType, setDeleteType] = useState<'article' | 'user' | null>(null);

  // Initialiser l'onglet selon les paramètres URL et les permissions
  useEffect(() => {
    const tab = (searchParams.get('tab') as Tab) || 'informations';
    
    // Si c'est un rédacteur qui essaie d'accéder aux utilisateurs ou informations
    if (!isAdmin() && (tab === 'utilisateurs' || tab === 'informations')) {
      setActiveTab('actualites');
      router.replace('/administrateur?tab=actualites');
      return;
    }
    
    // Pour les rédacteurs, commencer par les actualités
    if (!isAdmin() && tab === 'informations') {
      setActiveTab('actualites');
      router.replace('/administrateur?tab=actualites');
      return;
    }
    
    setActiveTab(tab);
  }, [searchParams, isAdmin, router]);

  // Charger les données selon l'onglet actif
  useEffect(() => {
    if (activeTab === 'actualites') {
      loadActualites();
    } else if (activeTab === 'utilisateurs' && isAdmin()) {
      loadUsers();
    }
  }, [activeTab, isAdmin]);

  const loadActualites = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const headers: any = { 'Content-Type': 'application/json' };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/actualites', { headers });
      
      if (response.ok) {
        const data = await response.json();
        // Filtrer les actualités par auteur pour les rédacteurs
        let filteredArticles = data;
        if (user?.role === 'Rédacteur') {
          filteredArticles = data.filter((article: any) => 
            (article.auteur?.id || article.auteur_id) === user.id
          );
        }
        setArticles(filteredArticles);
      } else {
        console.error('Erreur lors du chargement des actualités');
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    if (!isAdmin()) return;
    
    try {
      setLoading(true);
      const token = getToken();
      const headers: any = { 'Content-Type': 'application/json' };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/users', { headers });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        console.error('Erreur lors du chargement des utilisateurs');
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
    } finally {
      setLoading(false);
    }
  };

  const goTab = (tab: Tab) => {
    // Vérifier les permissions avant de changer d'onglet
    if ((tab === 'utilisateurs' || tab === 'informations') && !isAdmin()) {
      alert('Accès refusé : Vous n\'avez pas les permissions pour accéder à cette section.');
      return;
    }
    
    setActiveTab(tab);
    router.replace(`?tab=${tab}`, { scroll: false });
  };

  const handleDeleteClick = (item: any, type: 'article' | 'user') => {
    setItemToDelete(item);
    setDeleteType(type);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete || !deleteType) return;

    try {
      const token = getToken();
      const headers: any = {};
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const endpoint = deleteType === 'article' 
        ? `/api/actualites/${itemToDelete.id}`
        : `/api/users/${itemToDelete.id}`;
        
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers
      });
      
      if (response.ok) {
        if (deleteType === 'article') {
          setArticles(prev => prev.filter((a: any) => a.id !== itemToDelete.id));
        } else {
          setUsers(prev => prev.filter((u: any) => u.id !== itemToDelete.id));
        }
        console.log(`${deleteType === 'article' ? 'Actualité' : 'Utilisateur'} supprimé avec succès`);
      } else {
        console.error('Erreur lors de la suppression');
        alert('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
      alert('Erreur de connexion lors de la suppression');
    } finally {
      setShowDeleteModal(false);
      setItemToDelete(null);
      setDeleteType(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
    setDeleteType(null);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch {
      return dateString;
    }
  };

  const handleLogout = () => {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      logout();
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto p-8 bg-gray-50 min-h-screen font-sans">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Espace {isAdmin() ? 'Administrateur' : 'Rédacteur'}
            </h1>
            <p className="text-gray-600">
              Bienvenue, {user?.prenom} {user?.nom} ({user?.role})
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>

        {/* Onglets */}
        <div className="flex mb-8 border-b border-gray-200">
          {/* Onglet Informations - Visible pour les admins uniquement */}
          {isAdmin() && (
            <button
              className={`flex items-center gap-2 px-0 py-4 mr-8 bg-none border-none text-base cursor-pointer border-b-2 transition-all duration-200 ${
                activeTab === 'informations'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
              onClick={() => goTab('informations')}
            >
              <User className="w-5 h-5" />
              Informations personnelles
            </button>
          )}

          {/* Onglet Actualités - Visible pour tous */}
          <button
            className={`flex items-center gap-2 px-0 py-4 mr-8 bg-none border-none text-base cursor-pointer border-b-2 transition-all duration-200 ${
              activeTab === 'actualites'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-500 border-transparent hover:text-gray-700'
            }`}
            onClick={() => goTab('actualites')}
          >
            <FileText className="w-5 h-5" />
            Mes actualités
          </button>

          {/* Onglet Utilisateurs - Visible pour les admins uniquement */}
          {isAdmin() && (
            <button
              className={`flex items-center gap-2 px-0 py-4 mr-8 bg-none border-none text-base cursor-pointer border-b-2 transition-all duration-200 ${
                activeTab === 'utilisateurs'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
              onClick={() => goTab('utilisateurs')}
            >
              <Users className="w-5 h-5" />
              Utilisateurs
            </button>
          )}
        </div>

        {/* Contenu des onglets */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-8">
            {/* Onglet Informations */}
            {activeTab === 'informations' && isAdmin() && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Informations personnelles</h2>
                <p className="text-gray-600 mb-8">
                  Modifiez vos informations de profil et vos paramètres de sécurité
                </p>
                <div className="bg-gray-50 p-8 rounded-lg">
                  <p className="text-gray-600">Fonctionnalité en cours de développement...</p>
                </div>
              </div>
            )}

            {/* Onglet Actualités */}
            {activeTab === 'actualites' && (
              <div>
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">Mes actualités</h2>
                    <p className="text-gray-600 mb-2">Gérez vos articles et actualités</p>
                    <p className="text-gray-600">
                      Vous avez {articles.length} article{articles.length > 1 ? 's' : ''}
                    </p>
                  </div>
                  <Link
                    href="/administrateur/actualites/create"
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white border-none rounded-md text-base font-medium transition-colors duration-200 hover:bg-blue-700 no-underline"
                  >
                    <Plus className="w-4 h-4" />
                    Nouvelle actualité
                  </Link>
                </div>

                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    {articles.length > 0 ? (
                      articles.map((article: any) => (
                        <div
                          key={article.id}
                          className="bg-white border border-gray-200 rounded-lg p-6 transition-shadow duration-200 hover:shadow-md"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex-1 mr-4">
                              {article.titre || article.title}
                            </h3>
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                (article.statut || article.status) === 'Publié' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {article.statut || article.status}
                            </span>
                          </div>
                          <div className="flex gap-4 mb-4">
                            <span className="text-sm text-gray-600 flex items-center gap-2">
                              📅 {formatDate(article.date_creation) || article.date}
                            </span>
                            <span className="text-sm text-gray-600 flex items-center gap-2">
                              🏷️ {article.type}
                            </span>
                            <span className="text-sm text-gray-600 flex items-center gap-2">
                              👤 {article.auteur?.prenom} {article.auteur?.nom}
                            </span>
                          </div>
                          <p className="text-gray-600 leading-relaxed mb-6">{article.description}</p>
                          <div className="flex gap-4">
                            <Link
                              href={`/administrateur/actualites/edit/${article.id}`}
                              className="flex items-center gap-2 px-4 py-2 bg-none border border-gray-300 rounded-md text-sm cursor-pointer transition-all duration-200 text-gray-700 hover:bg-gray-50 hover:border-gray-400 no-underline"
                            >
                              <Edit className="w-4 h-4" />
                              Modifier
                            </Link>
                            <button
                              className="flex items-center gap-2 px-4 py-2 bg-none border border-red-200 rounded-md text-sm cursor-pointer transition-all duration-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                              onClick={() => handleDeleteClick(article, 'article')}
                            >
                              <Trash2 className="w-4 h-4" />
                              Supprimer
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center text-gray-600">
                        <p className="mb-6 text-lg">Aucune actualité trouvée.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Onglet Utilisateurs */}
            {activeTab === 'utilisateurs' && isAdmin() && (
              <div>
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">Utilisateurs</h2>
                    <p className="text-gray-600 mb-2">Gérez les comptes utilisateurs</p>
                    <p className="text-gray-600">
                      {users.length} utilisateur{users.length > 1 ? 's' : ''} enregistré{users.length > 1 ? 's' : ''}
                    </p>
                  </div>
                  <Link
                    href="/administrateur/users/create"
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white border-none rounded-md text-base font-medium transition-colors duration-200 hover:bg-blue-700 no-underline"
                  >
                    <Plus className="w-4 h-4" />
                    Nouvel utilisateur
                  </Link>
                </div>

                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div>
                    {users.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {users.map((user: any) => (
                          <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-6">
                            <div className="flex items-center mb-4">
                              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                                {user.photo ? (
                                  <img src={user.photo} alt={user.prenom} className="w-12 h-12 rounded-full object-cover" />
                                ) : (
                                  <span className="text-gray-500 font-medium">
                                    {user.prenom?.[0]}{user.nom?.[0]}
                                  </span>
                                )}
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900">{user.prenom} {user.nom}</h3>
                                <p className="text-sm text-gray-600">{user.email}</p>
                              </div>
                            </div>
                            <div className="mb-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                user.role === 'Administrateur' 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {user.role}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Link
                                href={`/administrateur/users/edit/${user.id}`}
                                className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors no-underline"
                              >
                                <Edit className="w-3 h-3" />
                                Modifier
                              </Link>
                              <button
                                onClick={() => handleDeleteClick(user, 'user')}
                                className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                                Supprimer
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-center text-gray-600">
                        <p className="mb-6 text-lg">Aucun utilisateur trouvé.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Modal de confirmation de suppression */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-11/12 max-h-screen overflow-hidden">
              <div className="flex items-center justify-between p-6 pb-0">
                <h3 className="text-xl font-semibold text-gray-800 m-0">Confirmer la suppression</h3>
                <button
                  className="bg-none border-none text-gray-500 cursor-pointer p-1 rounded-md transition-all duration-200 hover:text-gray-700 hover:bg-gray-100"
                  onClick={handleCancelDelete}
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <p className="mb-4 text-gray-700 leading-relaxed">
                  {deleteType === 'article'
                    ? `Êtes-vous sûr de vouloir supprimer l'actualité "${itemToDelete?.titre || itemToDelete?.title}" ?`
                    : `Êtes-vous sûr de vouloir supprimer l'utilisateur "${itemToDelete?.prenom} ${itemToDelete?.nom}" ?`}
                </p>
                <p className="text-sm text-red-600 font-medium">Cette action est irréversible.</p>
              </div>
              <div className="flex gap-3 p-6 pt-0 justify-end">
                <button
                  className="px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-md text-base font-medium cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:border-gray-400"
                  onClick={handleCancelDelete}
                >
                  Annuler
                </button>
                <button
                  className="px-6 py-3 bg-red-600 text-white border-none rounded-md text-base font-medium cursor-pointer transition-colors duration-200 hover:bg-red-700"
                  onClick={handleConfirmDelete}
                >
                  Oui, supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default EspaceAdministrateurPage;