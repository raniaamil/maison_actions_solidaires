// src/app/administrateur/page.tsx - Page avec gestion des rôles
'use client';

import React, { useEffect, useState } from 'react';
import { User, FileText, Eye, EyeOff, Lock, X, Users, Mail, LogOut } from 'lucide-react';
import styles from './administrateur.module.css';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';

type Tab = 'informations' | 'actualites' | 'utilisateurs';

const EspaceAdministrateurPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout, isAdmin, isRedacteur } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>('informations');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<any>(null);
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    prenom: user?.prenom || '',
    nom: user?.nom || '',
    email: user?.email || '',
    telephone: '',
    photo: user?.photo || '',
    bio: user?.bio || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [articles, setArticles] = useState([]);
  const [users, setUsers] = useState([]);

  // Mettre à jour formData quand user change
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        prenom: user.prenom || '',
        nom: user.nom || '',
        email: user.email || '',
        photo: user.photo || '',
        bio: user.bio || ''
      }));
    }
  }, [user]);

  // Gérer l'onglet depuis l'URL et les permissions
  useEffect(() => {
    const tab = (searchParams.get('tab') as Tab) || 'informations';
    
    // Si c'est un rédacteur qui essaie d'accéder aux utilisateurs
    if (tab === 'utilisateurs' && !isAdmin()) {
      setActiveTab('actualites');
      router.replace('/administrateur?tab=actualites');
      return;
    }
    
    // Pour les rédacteurs, commencer par les actualités
    if (isRedacteur() && tab === 'informations') {
      setActiveTab('actualites');
      router.replace('/administrateur?tab=actualites');
      return;
    }
    
    setActiveTab(tab);
  }, [searchParams, isAdmin, isRedacteur, router]);

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
      const response = await fetch('/api/actualites');
      if (response.ok) {
        const data = await response.json();
        setArticles(data);
      } else {
        console.error('Erreur lors du chargement des actualités');
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        console.error('Erreur lors du chargement des utilisateurs');
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const goTab = (tab: Tab) => {
    // Vérifier les permissions avant de changer d'onglet
    if (tab === 'utilisateurs' && !isAdmin()) {
      alert('Accès refusé : Vous n\'avez pas les permissions pour accéder à cette section.');
      return;
    }
    
    setActiveTab(tab);
    router.replace(`?tab=${tab}`, { scroll: false });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = () => {
    console.log('Sauvegarde du profil:', formData);
  };

  const handleChangePassword = () => {
    console.log('Changement de mot de passe');
  };

  const handleDeleteClick = (article: any) => {
    setArticleToDelete(article);
    setUserToDelete(null);
    setShowDeleteModal(true);
  };

  const handleDeleteUserClick = (user: any) => {
    if (!isAdmin()) {
      alert('Accès refusé : Seuls les administrateurs peuvent supprimer des utilisateurs.');
      return;
    }
    setUserToDelete(user);
    setArticleToDelete(null);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      if (articleToDelete) {
        const response = await fetch(`/api/actualites/${articleToDelete.id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          setArticles(prev => prev.filter((a: any) => a.id !== articleToDelete.id));
          console.log('Actualité supprimée avec succès');
        } else {
          console.error('Erreur lors de la suppression de l\'actualité');
        }
      } else if (userToDelete && isAdmin()) {
        const response = await fetch(`/api/users/${userToDelete.id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          setUsers(prev => prev.filter((u: any) => u.id !== userToDelete.id));
          console.log('Utilisateur supprimé avec succès');
        } else {
          console.error('Erreur lors de la suppression de l\'utilisateur');
        }
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    } finally {
      setShowDeleteModal(false);
      setArticleToDelete(null);
      setUserToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setArticleToDelete(null);
    setUserToDelete(null);
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'Administrateur':
        return 'bg-red-100 text-red-800';
      case 'Rédacteur':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const handleLogout = () => {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      logout();
    }
  };

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto p-8 bg-gray-50 min-h-screen font-sans">
        {/* Header avec info utilisateur et déconnexion */}
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

        {/* Onglets avec permissions */}
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
              Liste des Utilisateurs
            </button>
          )}
        </div>

        {/* Contenu des onglets */}
        {/* Onglet Informations - Admins seulement */}
        {activeTab === 'informations' && isAdmin() && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-8">
              <div className="mb-12">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Informations personnelles</h2>
                <p className="text-gray-600 mb-8">
                  Modifiez vos informations de profil et vos paramètres de sécurité
                </p>

                {/* Contenu des informations personnelles (identique au code original) */}
                <div className="mb-12">
                  <div className="flex items-center gap-3 mb-6">
                    <User className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Informations générales</h3>
                  </div>

                  <div className="flex items-start gap-6 mb-8 p-6 bg-gray-50 rounded-lg">
                    <div className="flex flex-col items-center">
                      <img
                        src={formData.photo || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
                        alt="Photo de profil"
                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md mb-4"
                      />
                      <button className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200">
                        Changer la photo
                      </button>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col mb-4">
                        <label className="text-sm font-medium text-gray-700 mb-2">URL de la photo</label>
                        <input
                          type="url"
                          name="photo"
                          value={formData.photo}
                          onChange={handleInputChange}
                          className="px-3 py-3 border border-gray-300 rounded-md text-base bg-white transition-all duration-200 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
                          placeholder="https://exemple.com/photo.jpg"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-2">Prénom</label>
                      <input
                        type="text"
                        name="prenom"
                        value={formData.prenom}
                        onChange={handleInputChange}
                        className="px-3 py-3 border border-gray-300 rounded-md text-base bg-gray-50 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-2">Nom</label>
                      <input
                        type="text"
                        name="nom"
                        value={formData.nom}
                        onChange={handleInputChange}
                        className="px-3 py-3 border border-gray-300 rounded-md text-base bg-gray-50 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="px-3 py-3 border border-gray-300 rounded-md text-base bg-gray-50 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                      <input
                        type="tel"
                        name="telephone"
                        value={formData.telephone}
                        onChange={handleInputChange}
                        className="px-3 py-3 border border-gray-300 rounded-md text-base bg-gray-50 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white border-none rounded-md text-base font-medium cursor-pointer transition-colors duration-200 hover:bg-blue-700"
                  >
                    Sauvegarder le profil
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Onglet Actualités - Accessible à tous les utilisateurs connectés */}
        {activeTab === 'actualites' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-8">
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
                  + Nouvelle actualité
                </Link>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  {articles.map((article: any) => (
                    <div
                      key={article.id}
                      className="bg-white border border-gray-200 rounded-lg p-6 transition-shadow duration-200 hover:shadow-md"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex-1 mr-4">{article.titre || article.title}</h3>
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            (article.statut || article.status) === 'Publié' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {article.statut || article.status}
                        </span>
                      </div>
                      <div className="flex gap-4 mb-4">
                        <span className="text-sm text-gray-600 flex items-center gap-2">
                          {formatDate(article.date_creation) || article.date}
                        </span>
                        <span className="text-sm text-gray-600 flex items-center gap-2">
                          {article.type}
                        </span>
                      </div>
                      <p className="text-gray-600 leading-relaxed mb-6">{article.description}</p>
                      <div className="flex gap-4">
                        <Link
                          href={`/administrateur/actualites/edit/${article.id}`}
                          className="flex items-center gap-2 px-4 py-2 bg-none border border-gray-300 rounded-md text-sm cursor-pointer transition-all duration-200 text-gray-700 hover:bg-gray-50 hover:border-gray-400 no-underline"
                        >
                          Modifier
                        </Link>
                        <button
                          className="flex items-center gap-2 px-4 py-2 bg-none border border-red-200 rounded-md text-sm cursor-pointer transition-all duration-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                          onClick={() => handleDeleteClick(article)}
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}

                  {articles.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-gray-600">
                      <p className="mb-6 text-lg">Aucune actualité trouvée.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Onglet Utilisateurs - Admins seulement */}
        {activeTab === 'utilisateurs' && isAdmin() && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-8">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-2">Liste des Utilisateurs</h2>
                  <p className="text-gray-600 mb-2">Gérez les comptes utilisateurs de la plateforme</p>
                  <p className="text-gray-600">
                    {users.length} utilisateur{users.length > 1 ? 's' : ''} enregistré{users.length > 1 ? 's' : ''}
                  </p>
                </div>

                <Link
                  href="/administrateur/users/create"
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white border-none rounded-md text-base font-medium transition-colors duration-200 hover:bg-blue-700 no-underline"
                >
                  + Nouvel utilisateur
                </Link>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="grid gap-6">
                  {users.map((user: any) => (
                    <div
                      key={user.id}
                      className="bg-white border border-gray-200 rounded-lg p-6 transition-shadow duration-200 hover:shadow-md"
                    >
                      <div className="flex items-start gap-6">
                        <img
                          src={user.photo || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}
                          alt={`Photo de ${user.prenom} ${user.nom}`}
                          className="w-20 h-20 rounded-full object-cover border-2 border-gray-100"
                        />

                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                                {user.prenom} {user.nom}
                              </h3>
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeClass(
                                  user.role
                                )}`}
                              >
                                {user.role}
                              </span>
                            </div>
                          </div>

                          <p className="text-gray-600 leading-relaxed mb-4">{user.bio || 'Aucune biographie renseignée'}</p>

                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                            <Mail className="w-4 h-4" />
                            <span>{user.email}</span>
                          </div>

                          <div className="flex gap-4">
                            <Link
                              href={`/administrateur/users/edit/${user.id}`}
                              className="flex items-center gap-2 px-4 py-2 bg-none border border-gray-300 rounded-md text-sm cursor-pointer transition-all duration-200 text-gray-700 hover:bg-gray-50 hover:border-gray-400 no-underline"
                            >
                              Modifier
                            </Link>
                            <button
                              className="flex items-center gap-2 px-4 py-2 bg-none border border-red-200 rounded-md text-sm cursor-pointer transition-all duration-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                              onClick={() => handleDeleteUserClick(user)}
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {users.length === 0 && !loading && (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-gray-600">
                      <p className="mb-6 text-lg">Aucun utilisateur trouvé.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Message d'accès refusé pour les rédacteurs qui tentent d'accéder aux utilisateurs */}
        {activeTab === 'utilisateurs' && !isAdmin() && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="mb-4">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                    <X className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Accès refusé</h3>
                <p className="text-sm text-gray-500">
                  Vous n'avez pas les permissions nécessaires pour accéder à la gestion des utilisateurs. 
                  Cette section est réservée aux administrateurs.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Modale de confirmation de suppression */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-11/12 max-h-screen overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
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
                  {articleToDelete
                    ? `Êtes-vous sûr de vouloir supprimer l'actualité "${articleToDelete.titre || articleToDelete.title}" ?`
                    : `Êtes-vous sûr de vouloir supprimer l'utilisateur "${userToDelete?.prenom} ${userToDelete?.nom}" ?`}
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