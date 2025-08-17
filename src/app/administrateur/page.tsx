'use client';

import React, { useEffect, useState } from 'react';
import { User, FileText, Users, Edit, Trash2, Plus, X } from 'lucide-react';
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
      
      const response = await fetch('/api/actualites', { 
        headers,
        cache: 'no-store'
      });
      
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
        const errorText = await response.text();
        console.error('❌ Erreur lors du chargement des actualités:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ Erreur réseau lors du chargement des actualités:', error);
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
      
      const response = await fetch('/api/users', { 
        headers,
        cache: 'no-store'
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        console.error('❌ Erreur lors du chargement des utilisateurs');
      }
    } catch (error) {
      console.error('❌ Erreur réseau:', error);
    } finally {
      setLoading(false);
    }
  };

  const goTab = (tab: Tab) => {
    // Vérifier les permissions avant de changer d'onglet
    if ((tab === 'utilisateurs' || tab === 'informations') && !isAdmin()) {
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
      } else {
        console.error('❌ Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('❌ Erreur réseau:', error);
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

  return (
    <ProtectedRoute>
      <div className="bg-gray-50 min-h-screen font-sans">
        <div className="max-w-7xl mx-auto p-8">
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
            Actualités
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

            {/* Onglet Informations - Maintenant visible pour TOUS les utilisateurs */}
            {activeTab === 'informations' && (
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Informations personnelles</h2>
                <p className="text-gray-600 mb-8">
                  Modifiez vos informations de profil et vos paramètres de sécurité
                </p>

                {/* Section Informations générales */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-6">
                    <User className="w-5 h-5 text-blue-600" />
                    <h3 className="text-xl font-semibold text-gray-900">Informations générales</h3>
                  </div>

                  {/* Section Avatar */}
                  <div className="flex items-start gap-6 mb-8 p-6 bg-gray-50 rounded-lg">
                    <div className="flex flex-col items-center">
                      <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-white shadow-md mb-4 flex items-center justify-center overflow-hidden">
                        {user?.photo ? (
                          <img 
                            src={user.photo} 
                            alt="Avatar" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <span className="text-sm text-gray-600">Photo de profil</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700 mb-2">URL de la photo</label>
                        <input
                          type="url"
                          defaultValue={user?.photo || ''}
                          placeholder="https://exemple.com/photo.jpg"
                          className="px-3 py-3 border border-gray-300 rounded-md text-base bg-white transition-all duration-200 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
                        />
                        <p className="text-sm text-gray-600 mt-1">
                          Vous pouvez utiliser une URL d'image existante ou télécharger une nouvelle photo.
                        </p>
                      </div>
                      <button className="mt-3 flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-200">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        Télécharger une image
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                      <input
                        type="text"
                        defaultValue={user?.prenom || ''}
                        className="w-full px-3 py-3 border border-gray-300 rounded-md text-base bg-gray-50 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                      <input
                        type="text"
                        defaultValue={user?.nom || ''}
                        className="w-full px-3 py-3 border border-gray-300 rounded-md text-base bg-gray-50 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Email
                      </label>
                      <input
                        type="email"
                        defaultValue={user?.email || ''}
                        className="w-full px-3 py-3 border border-gray-300 rounded-md text-base bg-gray-50 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Téléphone
                      </label>
                      <input
                        type="tel"
                        placeholder="+33 6 12 34 56 78"
                        className="w-full px-3 py-3 border border-gray-300 rounded-md text-base bg-gray-50 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  {/* Section Biographie */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Biographie</label>
                    <textarea
                      defaultValue={user?.bio || ''}
                      rows={4}
                      placeholder="Parlez-nous un peu de vous, votre rôle dans l'association, vos expériences..."
                      className="w-full px-3 py-3 border border-gray-300 rounded-md text-base bg-gray-50 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100 resize-vertical"
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      Cette biographie sera visible dans vos articles.
                    </p>
                  </div>

                  <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 cursor-pointer">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Sauvegarder le profil
                  </button>
                </div>

                {/* Section Sécurité */}
                <div className="border-t pt-8">
                  <div className="flex items-center gap-3 mb-6">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-900">Sécurité</h3>
                  </div>
                  <p className="text-gray-600 mb-6">Modifiez votre mot de passe pour sécuriser votre compte</p>

                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe actuel</label>
                      <div className="relative">
                        <input
                          type="password"
                          className="w-full px-3 py-3 border border-gray-300 rounded-md text-base bg-gray-50 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100"
                        />
                        <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau mot de passe</label>
                        <div className="relative">
                          <input
                            type="password"
                            className="w-full px-3 py-3 border border-gray-300 rounded-md text-base bg-gray-50 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100"
                          />
                          <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le mot de passe</label>
                        <input
                          type="password"
                          className="w-full px-3 py-3 border border-gray-300 rounded-md text-base bg-gray-50 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100"
                        />
                      </div>
                    </div>
                  </div>

                  <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 cursor-pointer">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Changer le mot de passe
                  </button>
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
                          className="bg-white border border-gray-300 rounded-lg p-6 transition-shadow duration-200 hover:shadow-md"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex-1 mr-4">
                              {article.titre || article.title}
                            </h3>
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                (article.statut || article.status) === 'Publié' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-200 text-gray-800'
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
                              className="flex items-center gap-2 px-4 py-2 bg-none border border-gray-400 rounded-md text-sm cursor-pointer transition-all duration-200 text-gray-700 hover:bg-gray-200 hover:border-gray-500 no-underline"
                            >
                              <Edit className="w-4 h-4" />
                              Modifier
                            </Link>
                            <button
                              className="flex items-center gap-2 px-4 py-2 bg-none border border-red-300 rounded-md text-sm cursor-pointer transition-all duration-200 text-red-600 hover:bg-red-50 hover:border-red-400"
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
                        <p className="text-sm text-gray-500 mb-4">
                          Vos actualités apparaîtront ici une fois créées.
                        </p>
                        <Link
                          href="/administrateur/actualites/create"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors no-underline"
                        >
                          <Plus className="w-4 h-4" />
                          Créer votre première actualité
                        </Link>
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
                          <div key={user.id} className="bg-gray-100 border border-gray-300 rounded-lg p-6">
                            <div className="flex items-center mb-4">
                              <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mr-4">
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
                                className="flex items-center gap-1 px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition-colors no-underline"
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
      </div>
    </ProtectedRoute>
  );
};

export default EspaceAdministrateurPage;