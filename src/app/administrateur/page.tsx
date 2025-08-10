'use client';

import React, { useEffect, useState } from 'react';
import { User, FileText, Eye, EyeOff, Lock, X, Users, Mail } from 'lucide-react';
import styles from './administrateur.module.css';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

type Tab = 'informations' | 'actualites' | 'utilisateurs';

const EspaceAdministrateurPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<Tab>('informations');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<any>(null);
  const [userToDelete, setUserToDelete] = useState<any>(null);

  const [formData, setFormData] = useState({
    prenom: 'Jean',
    nom: 'Dupont',
    email: 'jean.dupont@example.com',
    telephone: '+33 6 12 34 56 78',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    bio: "Administrateur principal de l'association, passionné par la gestion de projets et la communication.",
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [articles, setArticles] = useState([
    {
      id: 120,
      title: 'Lancement de notre nouvelle application',
      status: 'Publié',
      date: '15/01/2024',
      type: 'Image',
      description:
        "Nous sommes ravis d'annoncer le lancement de notre nouvelle application mobile qui révolutionne l'expérience utilisateur..."
    },
    {
      id: 121,
      title: 'Mise à jour importante des fonctionnalités',
      status: 'Publié',
      date: '10/01/2024',
      type: 'Vidéo',
      description:
        'Cette mise à jour apporte de nombreuses améliorations demandées par nos utilisateurs...'
    },
    {
      id: 122,
      title: 'Article en brouillon',
      status: 'Brouillon',
      date: '20/01/2024',
      type: null,
      description: "Ceci est un brouillon d'article qui n'est pas encore publié..."
    }
  ]);

  const [users, setUsers] = useState([
    {
      id: 1,
      photo:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      prenom: 'Marie',
      nom: 'Dubois',
      bio: "Rédactrice passionnée par les nouvelles technologies et l'innovation digitale.",
      email: 'marie.dubois@example.com',
      role: 'Administrateur'
    },
    {
      id: 2,
      photo:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      prenom: 'Thomas',
      nom: 'Martin',
      bio: "Rédacteur spécialisé dans la communication et les événements de l'association.",
      email: 'thomas.martin@example.com',
      role: 'Rédacteur'
    },
    {
      id: 3,
      photo:
        'https://images.unsplash.com/photo-1494790108755-2616b15259d4?w=150&h=150&fit=crop&crop=face',
      prenom: 'Sophie',
      nom: 'Bernard',
      bio:
        'Rédactrice en charge des actualités et de la promotion des activités associatives.',
      email: 'sophie.bernard@example.com',
      role: 'Rédacteur'
    },
    {
      id: 4,
      photo:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      prenom: 'Lucas',
      nom: 'Petit',
      bio:
        'Rédacteur bénévole passionné par la vie associative et l’engagement social.',
      email: 'lucas.petit@example.com',
      role: 'Rédacteur'
    }
  ]);

  // Lire l’onglet depuis l’URL
  useEffect(() => {
    const tab = (searchParams.get('tab') as Tab) || 'informations';
    setActiveTab(tab);
  }, [searchParams]);

  const goTab = (tab: Tab) => {
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
    setUserToDelete(user);
    setArticleToDelete(null);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (articleToDelete) {
      setArticles(prev => prev.filter(a => a.id !== articleToDelete.id));
    } else if (userToDelete) {
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
    }
    setShowDeleteModal(false);
    setArticleToDelete(null);
    setUserToDelete(null);
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

  return (
    <div className="max-w-7xl mx-auto p-8 bg-gray-50 min-h-screen font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Espace Administrateur</h1>
        <p className="text-gray-600">
          Gérez vos informations personnelles, les actualités et les utilisateurs
        </p>
      </div>

      <div className="flex mb-8 border-b border-gray-200">
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
      </div>

      {/* Onglet Informations */}
      {activeTab === 'informations' && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-8">
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Informations personnelles</h2>
              <p className="text-gray-600 mb-8">
                Modifiez vos informations de profil et vos paramètres de sécurité
              </p>

              {/* Photo de profil + infos (inchangé) */}
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <User className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Informations générales</h3>
                </div>

                <div className="flex items-start gap-6 mb-8 p-6 bg-gray-50 rounded-lg">
                  <div className="flex flex-col items-center">
                    <img
                      src={formData.photo}
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
                    <p className="text-sm text-gray-600">
                      Ajoutez une URL vers votre photo de profil ou utilisez le bouton "Changer la photo" pour en
                      télécharger une nouvelle.
                    </p>
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

                <div className="flex flex-col mb-8">
                  <label className="text-sm font-medium text-gray-700 mb-2">Biographie</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={4}
                    className="px-3 py-3 border border-gray-300 rounded-md text-base bg-gray-50 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100 resize-vertical"
                    placeholder="Décrivez-vous en quelques mots..."
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Cette biographie apparaîtra dans la liste des utilisateurs (maximum 200 caractères recommandés).
                  </p>
                </div>

                <button
                  onClick={handleSaveProfile}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white border-none rounded-md text-base font-medium cursor-pointer transition-colors duration-200 hover:bg-blue-700"
                >
                  Sauvegarder le profil
                </button>
              </div>

              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Lock className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Sécurité</h3>
                </div>
                <p className="text-gray-600 mb-8">Modifiez votre mot de passe pour sécuriser votre compte</p>

                <div className="max-w-2xl">
                  <div className="flex flex-col mb-6">
                    <label className="text-sm font-medium text-gray-700 mb-2">Mot de passe actuel</label>
                    <div className="relative flex items-center">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleInputChange}
                        className="flex-1 pr-12 px-3 py-3 border border-gray-300 rounded-md text-base bg-gray-50 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100"
                      />
                      <button
                        type="button"
                        className="absolute right-3 bg-none border-none text-gray-500 cursor-pointer p-1 flex items-center justify-center hover:text-gray-700"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-2">Nouveau mot de passe</label>
                      <div className="relative flex items-center">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleInputChange}
                          className="flex-1 pr-12 px-3 py-3 border border-gray-300 rounded-md text-base bg-gray-50 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100"
                        />
                        <button
                          type="button"
                          className="absolute right-3 bg-none border-none text-gray-500 cursor-pointer p-1 flex items-center justify-center hover:text-gray-700"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-2">Confirmer le mot de passe</label>
                      <div className="relative flex items-center">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          className="flex-1 pr-12 px-3 py-3 border border-gray-300 rounded-md text-base bg-gray-50 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100"
                        />
                        <button
                          type="button"
                          className="absolute right-3 bg-none border-none text-gray-500 cursor-pointer p-1 flex items-center justify-center hover:text-gray-700"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleChangePassword}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-gray-700 border border-gray-300 rounded-md text-base font-medium cursor-pointer transition-all duration-200 hover:bg-gray-50 hover:border-gray-400"
                  >
                    <Lock size={16} />
                    Changer le mot de passe
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Onglet Actualités */}
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

            <div className="flex flex-col gap-6">
              {articles.map(article => (
                <div
                  key={article.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 transition-shadow duration-200 hover:shadow-md"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex-1 mr-4">{article.title}</h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        article.status === 'Publié' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {article.status}
                    </span>
                  </div>
                  <div className="flex gap-4 mb-4">
                    <span className="text-sm text-gray-600 flex items-center gap-2">{article.date}</span>
                    {article.type && (
                      <span className="text-sm text-gray-600 flex items-center gap-2">{article.type}</span>
                    )}
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

              {articles.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center text-gray-600">
                  <p className="mb-6 text-lg">Aucune actualité trouvée.</p>
                  <Link
                    href="/administrateur/actualites/create"
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white border-none rounded-md text-base font-medium transition-colors duration-200 hover:bg-blue-700 no-underline"
                  >
                    Créer votre première actualité
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Onglet Utilisateurs */}
      {activeTab === 'utilisateurs' && (
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

              {/* ➜ Lien vers la page de création */}
              <Link
                href="/administrateur/users/create"
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white border-none rounded-md text-base font-medium transition-colors duration-200 hover:bg-blue-700"
              >
                + Nouvel utilisateur
              </Link>
            </div>

            <div className="grid gap-6">
              {users.map(user => (
                <div
                  key={user.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 transition-shadow duration-200 hover:shadow-md"
                >
                  <div className="flex items-start gap-6">
                    <img
                      src={user.photo}
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

                      <p className="text-gray-600 leading-relaxed mb-4">{user.bio}</p>

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

              {users.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center text-gray-600">
                  <p className="mb-6 text-lg">Aucun utilisateur trouvé.</p>
                  <Link
                    href="/administrateur/users/create"
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white border-none rounded-md text-base font-medium transition-colors duration-200 hover:bg-blue-700"
                  >
                    Ajouter le premier utilisateur
                  </Link>
                </div>
              )}
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
                  ? `Êtes-vous sûr de vouloir supprimer l'actualité "${articleToDelete.title}" ?`
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
  );
};

export default EspaceAdministrateurPage;
