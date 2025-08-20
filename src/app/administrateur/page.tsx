
'use client';

import React, { useEffect, useState } from 'react';
import { User, FileText, Users, Edit, Trash2, Plus, X, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import AdminActualitesFilters from '../../components/AdminActualitesFilters';

type Tab = 'informations' | 'actualites' | 'utilisateurs';

const EspaceAdministrateurPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout, isAdmin, getToken, updateUser } = useAuth(); // Ajout d'updateUser

  const [activeTab, setActiveTab] = useState<Tab>('informations');
  const [articles, setArticles] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const [deleteType, setDeleteType] = useState<'article' | 'user' | null>(null);
  const [filteredArticles, setFilteredArticles] = useState([]);

  // États pour le profil utilisateur
  const [profileData, setProfileData] = useState({
    prenom: '',
    nom: '',
    email: '',
    photo: '',
    bio: ''
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});

  // États pour le changement de mot de passe
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // États pour les messages de succès
  const [successMessage, setSuccessMessage] = useState('');

  // Initialiser les données du profil
  useEffect(() => {
    if (user) {
      setProfileData({
        prenom: user.prenom || '',
        nom: user.nom || '',
        email: user.email || '',
        photo: user.photo || '',
        bio: user.bio || ''
      });
    }
  }, [user]);

  // Fonction pour afficher un message de succès temporaire
  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 5000); // Disparaît après 5 secondes
  };

  // Fonction pour gérer les changements dans le formulaire profil
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (profileErrors[name]) {
      setProfileErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Fonction pour gérer les changements dans le formulaire mot de passe
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (passwordErrors[name]) {
      setPasswordErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validation du profil
  const validateProfile = () => {
    const errors = {};
    
    if (!profileData.prenom.trim()) {
      errors.prenom = 'Le prénom est requis';
    }
    
    if (!profileData.nom.trim()) {
      errors.nom = 'Le nom est requis';
    }
    
    if (!profileData.email.trim()) {
      errors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      errors.email = 'L\'adresse email n\'est pas valide';
    }

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validation du mot de passe
  const validatePassword = () => {
    const errors = {};
    
    if (!passwordData.currentPassword) {
      errors.currentPassword = 'Le mot de passe actuel est requis';
    }
    
    if (!passwordData.newPassword) {
      errors.newPassword = 'Le nouveau mot de passe est requis';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'Le mot de passe doit contenir au moins 6 caractères';
    }
    
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Veuillez confirmer le nouveau mot de passe';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Fonction pour sauvegarder le profil
  const handleSaveProfile = async () => {
    if (!validateProfile()) {
      return;
    }

    setProfileLoading(true);

    try {
      const token = getToken();
      const headers = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          prenom: profileData.prenom.trim(),
          nom: profileData.nom.trim(),
          email: profileData.email.trim(),
          photo: profileData.photo.trim() || null,
          bio: profileData.bio.trim() || null
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Mettre à jour les données utilisateur dans le contexte
        updateUser({
          prenom: profileData.prenom.trim(),
          nom: profileData.nom.trim(),
          email: profileData.email.trim(),
          photo: profileData.photo.trim() || null,
          bio: profileData.bio.trim() || null
        });
        
        showSuccessMessage('Profil mis à jour avec succès !');
        console.log('✅ Profil mis à jour:', data);
      } else {
        if (response.status === 401) {
          alert('Session expirée. Veuillez vous reconnecter.');
          router.push('/login');
        } else {
          alert(data.error || 'Erreur lors de la mise à jour du profil');
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde du profil:', error);
      alert('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setProfileLoading(false);
    }
  };

  // Fonction pour changer le mot de passe
  const handleChangePassword = async () => {
    if (!validatePassword()) {
      return;
    }

    setPasswordLoading(true);

    try {
      const token = getToken();
      const headers = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          password: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        showSuccessMessage('Mot de passe modifié avec succès !');
        console.log('✅ Mot de passe modifié');
        
        // Réinitialiser le formulaire
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        if (response.status === 401) {
          alert('Session expirée. Veuillez vous reconnecter.');
          router.push('/login');
        } else {
          alert(data.error || 'Erreur lors du changement de mot de passe');
        }
      }
    } catch (error) {
      console.error('❌ Erreur lors du changement de mot de passe:', error);
      alert('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Fonction pour basculer la visibilité des mots de passe
  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Initialiser l'onglet selon les paramètres URL et les permissions
  useEffect(() => {
    const tab = (searchParams.get('tab') as Tab) || 'informations';
    
    if (!isAdmin() && (tab === 'utilisateurs' || tab === 'informations')) {
      setActiveTab('actualites');
      router.replace('/administrateur?tab=actualites');
      return;
    }
    
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
          {/* Message de succès */}
          {successMessage && (
            <div className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg shadow-lg z-50">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {successMessage}
              </div>
            </div>
          )}

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

              {/* Onglet Informations avec fonctionnalités complètes */}
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
                          {profileData.photo ? (
                            <img 
                              src={profileData.photo} 
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
                            name="photo"
                            value={profileData.photo}
                            onChange={handleProfileChange}
                            placeholder="https://exemple.com/photo.jpg"
                            className={`px-3 py-3 border border-gray-300 rounded-md text-base bg-white transition-all duration-200 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 ${
                              profileErrors.photo ? 'border-red-500' : ''
                            }`}
                            disabled={profileLoading}
                          />
                          {profileErrors.photo && (
                            <span className="text-red-500 text-sm mt-1">{profileErrors.photo}</span>
                          )}
                          <p className="text-sm text-gray-600 mt-1">
                            Vous pouvez utiliser une URL d'image existante ou télécharger une nouvelle photo.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                        <input
                          type="text"
                          name="prenom"
                          value={profileData.prenom}
                          onChange={handleProfileChange}
                          className={`w-full px-3 py-3 border border-gray-300 rounded-md text-base bg-gray-50 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100 ${
                            profileErrors.prenom ? 'border-red-500' : ''
                          }`}
                          disabled={profileLoading}
                        />
                        {profileErrors.prenom && (
                          <span className="text-red-500 text-sm mt-1">{profileErrors.prenom}</span>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                        <input
                          type="text"
                          name="nom"
                          value={profileData.nom}
                          onChange={handleProfileChange}
                          className={`w-full px-3 py-3 border border-gray-300 rounded-md text-base bg-gray-50 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100 ${
                            profileErrors.nom ? 'border-red-500' : ''
                          }`}
                          disabled={profileLoading}
                        />
                        {profileErrors.nom && (
                          <span className="text-red-500 text-sm mt-1">{profileErrors.nom}</span>
                        )}
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
                          name="email"
                          value={profileData.email}
                          onChange={handleProfileChange}
                          className={`w-full px-3 py-3 border border-gray-300 rounded-md text-base bg-gray-50 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100 ${
                            profileErrors.email ? 'border-red-500' : ''
                          }`}
                          disabled={profileLoading}
                        />
                        {profileErrors.email && (
                          <span className="text-red-500 text-sm mt-1">{profileErrors.email}</span>
                        )}
                      </div>
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Biographie</label>
                      <textarea
                        name="bio"
                        value={profileData.bio}
                        onChange={handleProfileChange}
                        rows={4}
                        placeholder="Parlez-nous un peu de vous, votre rôle dans l'association, vos expériences..."
                        className="w-full px-3 py-3 border border-gray-300 rounded-md text-base bg-gray-50 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100 resize-vertical"
                        disabled={profileLoading}
                      />
                      <p className="text-sm text-gray-600 mt-1">
                        Cette biographie sera visible dans vos articles.
                      </p>
                    </div>

                    <button 
                      onClick={handleSaveProfile}
                      disabled={profileLoading}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      {profileLoading ? 'Sauvegarde...' : 'Sauvegarder le profil'}
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
                            type={showPasswords.current ? "text" : "password"}
                            name="currentPassword"
                            value={passwordData.currentPassword}
                            onChange={handlePasswordChange}
                            className={`w-full px-3 py-3 pr-10 border border-gray-300 rounded-md text-base bg-gray-50 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100 ${
                              passwordErrors.currentPassword ? 'border-red-500' : ''
                            }`}
                            disabled={passwordLoading}
                          />
                          <button 
                            type="button"
                            onClick={() => togglePasswordVisibility('current')}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            disabled={passwordLoading}
                          >
                            {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                        {passwordErrors.currentPassword && (
                          <span className="text-red-500 text-sm mt-1">{passwordErrors.currentPassword}</span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau mot de passe</label>
                          <div className="relative">
                            <input
                              type={showPasswords.new ? "text" : "password"}
                              name="newPassword"
                              value={passwordData.newPassword}
                              onChange={handlePasswordChange}
                              className={`w-full px-3 py-3 pr-10 border border-gray-300 rounded-md text-base bg-gray-50 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100 ${
                                passwordErrors.newPassword ? 'border-red-500' : ''
                              }`}
                              disabled={passwordLoading}
                            />
                            <button 
                              type="button"
                              onClick={() => togglePasswordVisibility('new')}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                              disabled={passwordLoading}
                            >
                              {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                          {passwordErrors.newPassword && (
                            <span className="text-red-500 text-sm mt-1">{passwordErrors.newPassword}</span>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le mot de passe</label>
                          <div className="relative">
                            <input
                              type={showPasswords.confirm ? "text" : "password"}
                              name="confirmPassword"
                              value={passwordData.confirmPassword}
                              onChange={handlePasswordChange}
                              className={`w-full px-3 py-3 pr-10 border border-gray-300 rounded-md text-base bg-gray-50 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100 ${
                                passwordErrors.confirmPassword ? 'border-red-500' : ''
                              }`}
                              disabled={passwordLoading}
                            />
                            <button 
                              type="button"
                              onClick={() => togglePasswordVisibility('confirm')}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                              disabled={passwordLoading}
                            >
                              {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                          {passwordErrors.confirmPassword && (
                            <span className="text-red-500 text-sm mt-1">{passwordErrors.confirmPassword}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={handleChangePassword}
                      disabled={passwordLoading}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      {passwordLoading ? 'Modification...' : 'Changer le mot de passe'}
                    </button>
                  </div>
                </div>
              )}

{/* Onglet Actualités */}
              {activeTab === 'actualites' && (
                <div>
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-900 mb-2">Les actualités</h2>
                      <p className="text-gray-600 mb-2">Gérez les articles et actualités</p>
                    </div>
                    <Link
                      href="/administrateur/actualites/create"
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white border-none rounded-md text-base font-medium transition-colors duration-200 hover:bg-blue-700 no-underline"
                    >
                      <Plus className="w-4 h-4" />
                      Nouvelle actualité
                    </Link>
                  </div>

                  {/* Barre de filtres */}
                  <AdminActualitesFilters
                    articles={articles}
                    onFilteredArticlesChange={setFilteredArticles}
                    currentUser={user}
                    loading={loading}
                  />

                  {loading ? (
                    <div className="flex justify-center items-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      {filteredArticles.length > 0 ? (
                        filteredArticles.map((article: any) => (
                          <div
                            key={article.id}
                            className="bg-white border border-green-500 rounded-lg p-6 transition-shadow duration-200 hover:shadow-md"
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
                          <p className="mb-6 text-lg">
                            {articles.length === 0 
                              ? "Aucune actualité trouvée." 
                              : "Aucune actualité ne correspond à vos critères."
                            }
                          </p>
                          <p className="text-sm text-gray-500 mb-4">
                            {articles.length === 0 
                              ? "Vos actualités apparaîtront ici une fois créées."
                              : "Modifiez vos filtres ou créez une nouvelle actualité."
                            }
                          </p>
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
                            <div key={user.id} className="bg-white border border-gray-300 rounded-lg p-6">
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