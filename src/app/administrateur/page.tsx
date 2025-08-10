// src/app/administrateur/page.tsx - VERSION AVEC DEBUG RENFORCÉ
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
    console.log('🔍 === CHARGEMENT ACTUALITÉS - DEBUG COMPLET ===');
    
    try {
      setLoading(true);
      console.log('🔄 Début du chargement des actualités...');
      console.log('👤 Utilisateur actuel:', user);
      console.log('🔐 Token disponible:', !!user?.token);
      
      // Préparer les headers
      const headers = {
        'Content-Type': 'application/json',
      };
      
      // Ajouter le token si disponible (même si pas requis pour GET)
      const token = user?.token || localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('✅ Token ajouté aux headers');
      } else {
        console.log('⚠️ Aucun token disponible');
      }
      
      console.log('📡 Headers finaux:', headers);
      console.log('🌐 URL: /api/actualites');
      
      const response = await fetch('/api/actualites', {
        method: 'GET',
        headers,
      });
      
      console.log('📡 === RÉPONSE SERVEUR ===');
      console.log('📊 Statut HTTP:', response.status);
      console.log('📊 Status Text:', response.statusText);
      console.log('📊 Headers réponse:', Object.fromEntries(response.headers.entries()));
      
      // Vérifier le content-type
      const contentType = response.headers.get('content-type');
      console.log('📄 Content-Type:', contentType);
      
      if (response.ok) {
        let data;
        
        try {
          if (contentType && contentType.includes('application/json')) {
            data = await response.json();
            console.log('📥 Données JSON reçues:', data);
            console.log('📊 Nombre d\'actualités:', Array.isArray(data) ? data.length : 'Format incorrect');
          } else {
            const textData = await response.text();
            console.log('📥 Données texte reçues (non-JSON):', textData);
            throw new Error(`Réponse non-JSON: ${textData}`);
          }
        } catch (parseError) {
          console.error('❌ Erreur parsing réponse:', parseError);
          throw new Error(`Impossible de parser la réponse: ${parseError.message}`);
        }
        
        // Vérifier que data est un tableau
        if (!Array.isArray(data)) {
          console.error('❌ Format de données incorrect:', typeof data, data);
          throw new Error('Format de données incorrect - tableau attendu');
        }
        
        console.log('🔍 Analyse des actualités reçues:');
        data.forEach((article, index) => {
          console.log(`📰 Article ${index + 1}:`, {
            id: article.id,
            titre: article.titre || article.title,
            auteur: article.auteur?.prenom + ' ' + article.auteur?.nom,
            auteur_id: article.auteur?.id || article.auteur_id,
            statut: article.statut || article.status
          });
        });
        
        // Filtrer les actualités par auteur côté client pour les rédacteurs
        let filteredArticles = data;
        if (user?.role === 'Rédacteur') {
          console.log('👤 Filtrage pour rédacteur, ID utilisateur:', user.id);
          const beforeFilter = filteredArticles.length;
          filteredArticles = data.filter(article => {
            const authorId = article.auteur?.id || article.auteur_id;
            const match = authorId === user.id;
            console.log(`🔍 Article "${article.titre}" - Auteur ID: ${authorId}, User ID: ${user.id}, Match: ${match}`);
            return match;
          });
          console.log(`📊 Filtrage: ${beforeFilter} → ${filteredArticles.length} articles`);
        }
        
        setArticles(filteredArticles);
        console.log('✅ Articles chargés dans le state:', filteredArticles.length);
        
      } else {
        console.log('❌ === ERREUR SERVEUR ===');
        console.error('❌ Erreur lors du chargement des actualités, statut:', response.status);
        
        let errorData;
        try {
          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
          } else {
            const textError = await response.text();
            errorData = { error: textError };
          }
        } catch (parseError) {
          console.error('❌ Impossible de parser l\'erreur:', parseError);
          errorData = { error: `Erreur ${response.status}: ${response.statusText}` };
        }
        
        console.error('❌ Détails de l\'erreur:', errorData);
        
        // Afficher l'erreur à l'utilisateur
        if (response.status === 500) {
          alert('Erreur serveur lors du chargement des actualités. Vérifiez la console pour plus de détails.');
        } else if (response.status === 401) {
          alert('Session expirée. Veuillez vous reconnecter.');
          logout();
        } else if (response.status === 403) {
          alert('Accès refusé pour charger les actualités.');
        } else {
          alert(`Erreur ${response.status}: ${errorData.error || response.statusText}`);
        }
        
        setArticles([]);
      }
    } catch (error) {
      console.log('❌ === ERREUR RÉSEAU/CATCH ===');
      console.error('❌ Erreur réseau lors du chargement des actualités:', error);
      console.error('❌ Message:', error.message);
      console.error('❌ Stack:', error.stack);
      
      alert(`Erreur de connexion: ${error.message}`);
      setArticles([]);
    } finally {
      setLoading(false);
      console.log('🔄 === FIN CHARGEMENT ACTUALITÉS ===');
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      console.log('🔄 Chargement des utilisateurs...');
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      const token = user?.token || localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/users', {
        method: 'GET',
        headers,
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        console.log('✅ Utilisateurs chargés:', data.length);
      } else {
        console.error('Erreur lors du chargement des utilisateurs, statut:', response.status);
        const errorData = await response.json().catch(() => ({}));
        console.error('Détails erreur utilisateurs:', errorData);
      }
    } catch (error) {
      console.error('Erreur réseau utilisateurs:', error);
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
        const headers = {};
        const token = user?.token || localStorage.getItem('token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`/api/actualites/${articleToDelete.id}`, {
          method: 'DELETE',
          headers
        });
        
        if (response.ok) {
          setArticles(prev => prev.filter((a: any) => a.id !== articleToDelete.id));
          console.log('Actualité supprimée avec succès');
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Erreur lors de la suppression de l\'actualité:', errorData);
          alert('Erreur lors de la suppression de l\'actualité');
        }
      } else if (userToDelete && isAdmin()) {
        const headers = {};
        const token = user?.token || localStorage.getItem('token');
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`/api/users/${userToDelete.id}`, {
          method: 'DELETE',
          headers
        });
        
        if (response.ok) {
          setUsers(prev => prev.filter((u: any) => u.id !== userToDelete.id));
          console.log('Utilisateur supprimé avec succès');
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Erreur lors de la suppression de l\'utilisateur:', errorData);
          alert('Erreur lors de la suppression de l\'utilisateur');
        }
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur de connexion lors de la suppression');
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
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch {
      return dateString; // Retourner la chaîne originale si le parsing échoue
    }
  };

  const handleLogout = () => {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      logout();
    }
  };

  // Debug info au chargement
  useEffect(() => {
    console.log('🔍 === ÉTAT INITIAL PAGE ADMIN ===');
    console.log('👤 User:', user);
    console.log('🏷️ Onglet actif:', activeTab);
    console.log('🔐 Token présent:', !!user?.token);
    console.log('🔐 Token localStorage:', !!localStorage.getItem('token'));
    console.log('📊 Articles actuels:', articles.length);
  }, [user, activeTab]);

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
            {/* Debug info */}
            <p className="text-xs text-gray-400 mt-1">
              Debug: User ID: {user?.id}, Token: {user?.token ? 'Oui' : 'Non'}
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
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Informations personnelles</h2>
              <p className="text-gray-600 mb-8">
                Modifiez vos informations de profil et vos paramètres de sécurité
              </p>
              {/* Contenu des informations personnelles */}
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
                  {/* Debug info détaillé */}
                  <p className="text-xs text-gray-400 mt-2">
                    Debug: {loading ? 'Chargement...' : `${articles.length} articles chargés`} | 
                    Rôle: {user?.role} | 
                    Tab actif: {activeTab}
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
                              (article.statut || article.status) === 'Publié' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
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
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-gray-600">
                      <p className="mb-6 text-lg">Aucune actualité trouvée.</p>
                      <p className="text-sm text-gray-500 mb-4">
                        {loading ? 'Chargement des actualités...' : 'Créez votre première actualité !'}
                      </p>
                      <Link
                        href="/administrateur/actualites/create"
                        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white border-none rounded-md text-base font-medium transition-colors duration-200 hover:bg-blue-700 no-underline"
                      >
                        + Créer une actualité
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reste du contenu des autres onglets... */}

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