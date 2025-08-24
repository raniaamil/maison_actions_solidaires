'use client';

import React, { useState } from 'react';
import { User, Mail, ArrowLeft, Key, Send, Check, Copy, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../../../components/ProtectedRoute';

export default function CreateUserPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    photo: '',
    bio: '',
    role: 'Administrateur'
  });

  const [tempPassword, setTempPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [passwordCopied, setPasswordCopied] = useState(false);
  const [errors, setErrors] = useState({});

  const generateTempPassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    const specialChars = '!@#$%';
    let password = '';
    // au moins 1 majuscule, 1 minuscule, 1 chiffre, 1 spécial
    password += chars.charAt(Math.floor(Math.random() * 26)); // Majuscule
    password += chars.charAt(Math.floor(Math.random() * 26) + 26); // Minuscule
    password += chars.charAt(Math.floor(Math.random() * 10) + 52); // Chiffre
    password += specialChars.charAt(Math.floor(Math.random() * specialChars.length)); // Spécial
    for (let i = 4; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleGeneratePassword = () => {
    const newPassword = generateTempPassword();
    setTempPassword(newPassword);
    setPasswordCopied(false);
  };

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(tempPassword);
      setPasswordCopied(true);
      setTimeout(() => setPasswordCopied(false), 2000);
    } catch {
      console.log('Erreur lors de la copie');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.prenom.trim()) {
      newErrors.prenom = 'Le prénom est requis';
    }

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'L\'adresse e-mail n\'est pas valide';
    }

    if (!tempPassword) {
      newErrors.password = 'Veuillez générer un mot de passe';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateUser = async () => {
    if (!validateForm()) {
      return;
    }

    setIsCreating(true);

    try {
      const payload = {
        prenom: formData.prenom,
        nom: formData.nom,
        email: formData.email,
        password: tempPassword,
        photo: formData.photo || null,
        bio: formData.bio || null,
        role: formData.role
      };

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Utilisateur créé avec succès:', data);
        setShowSuccessModal(true);
      } else {
        console.log('❌ Erreur du serveur:', data);
        if (data.errors) {
          setErrors(data.errors);
        } else {
          alert(data.message || 'Une erreur est survenue lors de la création de l\'utilisateur');
        }
      }
    } catch (error) {
      console.error('❌ Erreur réseau:', error);
      alert('Erreur de connexion au serveur. Veuillez réessayer.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccessModal(false);
    setFormData({
      prenom: '',
      nom: '',
      email: '',
      photo: '',
      bio: '',
      role: 'Administrateur'
    });
    setTempPassword('');
    setPasswordCopied(false);
    setErrors({});
  };

  const handleBackToList = () => {
    router.push('/administrateur?tab=utilisateurs');
  };

  const isFormValid = formData.prenom && formData.nom && formData.email && tempPassword;

  return (
    <ProtectedRoute requiredRole="Administrateur">
      <div className="bg-gray-50 min-h-screen font-sans">
        <div className="max-w-7xl mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <button
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors duration-200 cursor-pointer"
                onClick={handleBackToList}
                type="button"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Retour à la liste</span>
              </button>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Créer un nouvel utilisateur</h1>
            <p className="text-gray-600">
              Ajoutez un nouveau membre à l'équipe. Un mot de passe temporaire sera généré et envoyé par email.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-8">
              {/* Informations personnelles */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <User className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Informations personnelles</h2>
                </div>

                {/* Photo de profil */}
                <div className="flex items-start gap-6 mb-8 p-6 bg-gray-50 rounded-lg">
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-gray-200 border-4 border-white shadow-md mb-4 flex items-center justify-center overflow-hidden">
                      {formData.photo ? (
                        <img src={formData.photo} alt="Aperçu" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                    <span className="text-sm text-gray-600">Photo de profil</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col">
                      <label className="text-sm font-medium text-gray-700 mb-2">URL de la photo (optionnelle)</label>
                      <input
                        type="url"
                        name="photo"
                        value={formData.photo}
                        onChange={handleInputChange}
                        className="px-3 py-3 border border-gray-300 rounded-md text-base bg-white transition-all duration-200 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
                        placeholder="https://exemple.com/photo.jpg"
                        disabled={isCreating}
                      />
                      <p className="text-sm text-gray-600 mt-1">
                        L'utilisateur pourra modifier sa photo de profil après sa première connexion.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-2">
                      Prénom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="prenom"
                      value={formData.prenom}
                      onChange={handleInputChange}
                      className={`px-3 py-3 border border-gray-300 rounded-md text-base bg-gray-50 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100 ${errors.prenom ? 'border-red-500' : ''}`}
                      disabled={isCreating}
                      required
                    />
                    {errors.prenom && <span className="text-red-500 text-sm mt-1">{errors.prenom}</span>}
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-2">
                      Nom <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nom"
                      value={formData.nom}
                      onChange={handleInputChange}
                      className={`px-3 py-3 border border-gray-300 rounded-md text-base bg-gray-50 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100 ${errors.nom ? 'border-red-500' : ''}`}
                      disabled={isCreating}
                      required
                    />
                    {errors.nom && <span className="text-red-500 text-sm mt-1">{errors.nom}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-2">
                      Adresse email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`px-3 py-3 border border-gray-300 rounded-md text-base bg-gray-50 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100 ${errors.email ? 'border-red-500' : ''}`}
                      disabled={isCreating}
                      required
                    />
                    {errors.email && <span className="text-red-500 text-sm mt-1">{errors.email}</span>}
                    <p className="text-sm text-gray-600 mt-1">
                      Les identifiants de connexion seront envoyés à cette adresse.
                    </p>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-2">Rôle</label>
                    <input
                      type="text"
                      name="role"
                      value={formData.role}
                      readOnly
                      className="px-3 py-3 border border-gray-300 rounded-md text-base bg-gray-100 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="flex flex-col mb-6">
                  <label className="text-sm font-medium text-gray-700 mb-2">Biographie (optionnelle)</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={3}
                    className="px-3 py-3 border border-gray-300 rounded-md text-base bg-gray-50 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100 resize-vertical"
                    placeholder="Une courte description de l'utilisateur..."
                    disabled={isCreating}
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    L'utilisateur pourra modifier sa biographie après sa première connexion.
                  </p>
                </div>
              </div>

              {/* Génération du mot de passe */}
              <div className="mb-8 border-t pt-8 px-8">
                <div className="flex items-center gap-3 mb-6">
                  <Key className="w-5 h-5 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Mot de passe temporaire</h2>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 text-yellow-600 mt-0.5">⚠️</div>
                    <div>
                      <h3 className="font-medium text-yellow-800 mb-1">Important</h3>
                      <p className="text-sm text-yellow-700">
                        Un mot de passe temporaire sera généré automatiquement et envoyé par email. L'utilisateur devra
                        obligatoirement le changer lors de sa première connexion.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 items-end mb-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Mot de passe généré</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={tempPassword}
                        readOnly
                        className={`w-full px-3 py-3 pr-20 border border-gray-300 rounded-md text-base bg-gray-100 font-mono ${errors.password ? 'border-red-500' : ''}`}
                        placeholder="Cliquez sur 'Générer' pour créer un mot de passe"
                      />
                      {tempPassword && (
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      )}
                    </div>
                    {errors.password && <span className="text-red-500 text-sm mt-1">{errors.password}</span>}
                  </div>
                  <button
                    type="button"
                    onClick={handleGeneratePassword}
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 cursor-pointer"
                    disabled={isCreating}
                  >
                    Générer
                  </button>
                  {tempPassword && (
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className={`px-4 py-3 rounded-md transition-colors duration-200 ${
                        passwordCopied ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      disabled={isCreating}
                    >
                      {passwordCopied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                  )}
                </div>

                {tempPassword && (
                  <div className="text-sm text-gray-600">
                    <p className="mb-1">✅ Mot de passe généré avec succès</p>
                    <p>• Longueur : 12 caractères</p>
                    <p>• Contient : majuscules, minuscules, chiffres et caractères spéciaux</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-6 border-t px-8 pb-8">
                <button
                  type="button"
                  className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                  onClick={handleBackToList}
                  disabled={isCreating}
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={handleCreateUser}
                  disabled={!isFormValid || isCreating}
                  className={`px-8 py-3 rounded-md font-medium transition-all duration-200 ${
                    isFormValid && !isCreating ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isCreating ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Création en cours...</span>
                    </div>
                  ) : (
                    "Créer l'utilisateur"
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Modal de succès */}
          {showSuccessModal && (
            <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-11/12 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Utilisateur créé avec succès !</h3>
                      <p className="text-sm text-gray-600">
                        {formData.prenom} {formData.nom}
                      </p>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Send className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">Email envoyé</span>
                    </div>
                    <p className="text-sm text-green-700">
                      Un email contenant les identifiants de connexion a été envoyé à <strong>{formData.email}</strong>
                    </p>
                  </div>

                  <div className="text-sm text-gray-600 mb-6">
                    <h4 className="font-medium mb-2">Prochaines étapes :</h4>
                    <ul className="space-y-1">
                      <li>• L'utilisateur recevra ses identifiants par email</li>
                      <li>• Il devra changer son mot de passe à la première connexion</li>
                      <li>• Il pourra ensuite compléter son profil</li>
                    </ul>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleCloseSuccess}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                    >
                      Créer un autre utilisateur
                    </button>
                    <button
                      onClick={() => {
                        handleCloseSuccess();
                        handleBackToList();
                      }}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                    >
                      Retour à la liste
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}