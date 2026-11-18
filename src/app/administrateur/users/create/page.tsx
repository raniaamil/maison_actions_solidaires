'use client';

import React, { useState } from 'react';
import { User, ArrowLeft, Send, Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '../../../../components/ProtectedRoute';

// Types
interface CreateUserFormData {
  prenom: string;
  nom: string;
  email: string;
  bio: string;
  role: string; // 'Utilisateur' | 'Rédacteur' | 'Administrateur'
}
type FieldName = keyof CreateUserFormData;
type ErrorKeys = FieldName;
type Errors = Partial<Record<ErrorKeys, string>>;

export default function CreateUserPage() {
  const router = useRouter();

  const [formData, setFormData] = useState<CreateUserFormData>({
    prenom: '',
    nom: '',
    email: '',
    bio: '',
    role: 'Utilisateur',
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [emailSent, setEmailSent] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const key = name as FieldName;

    setFormData(prev => ({
      ...prev,
      [key]: value,
    }));

    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => {
        const { [key]: _removed, ...rest } = prev;
        return rest;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Errors = {};

    if (!formData.prenom.trim()) {
      newErrors.prenom = 'Le prénom est requis';
    }

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis';
    }

    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "L'adresse e-mail n'est pas valide";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateUser = async () => {
    if (!validateForm()) return;

    setIsCreating(true);

    try {
      const payload = {
        prenom: formData.prenom,
        nom: formData.nom,
        email: formData.email,
        bio: formData.bio || null,
        role: formData.role,
      };

      const response = await fetch('/api/users', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Utilisateur créé avec succès');
        setEmailSent(data?.emailSent !== false);
        setShowSuccessModal(true);
      } else {
        console.log('❌ Erreur du serveur:', data?.message || data?.error);
        if (data.errors) {
          setErrors(data.errors as Errors);
        } else {
          alert(data.message || "Une erreur est survenue lors de la création de l'utilisateur");
        }
      }
    } catch (error) {
      console.error('❌ Erreur réseau:', (error as Error)?.message);
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
      bio: '',
      role: 'Utilisateur',
    });
    setErrors({});
  };

  const handleBackToList = () => {
    router.push('/administrateur?tab=utilisateurs');
  };

  const isFormValid =
    Boolean(formData.prenom) &&
    Boolean(formData.nom) &&
    Boolean(formData.email);

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
              Ajoutez un nouveau membre. Il recevra par e-mail un lien pour définir lui-même son mot de passe.
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
                      className={`px-3 py-3 border border-gray-300 rounded-md text-base bg-gray-50 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100 ${
                        errors.prenom ? 'border-red-500' : ''
                      }`}
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
                      className={`px-3 py-3 border border-gray-300 rounded-md text-base bg-gray-50 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100 ${
                        errors.nom ? 'border-red-500' : ''
                      }`}
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
                      className={`px-3 py-3 border border-gray-300 rounded-md text-base bg-gray-50 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100 ${
                        errors.email ? 'border-red-500' : ''
                      }`}
                      disabled={isCreating}
                      required
                    />
                    {errors.email && <span className="text-red-500 text-sm mt-1">{errors.email}</span>}
                    <p className="text-sm text-gray-600 mt-1">
                      Le lien de définition du mot de passe sera envoyé à cette adresse.
                    </p>
                  </div>
                  <div className="flex flex-col">
                    <label htmlFor="role" className="text-sm font-medium text-gray-700 mb-2">Rôle</label>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="px-3 py-3 border border-gray-300 rounded-md text-base bg-gray-50 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100"
                      disabled={isCreating}
                    >
                      <option value="Utilisateur">Utilisateur</option>
                      <option value="Rédacteur">Rédacteur</option>
                      <option value="Administrateur">Administrateur</option>
                    </select>
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
                    isFormValid && !isCreating
                      ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
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
                      <span className="text-sm font-medium text-green-800">
                        {emailSent ? 'Email envoyé' : "Email non envoyé"}
                      </span>
                    </div>
                    <p className="text-sm text-green-700">
                      {emailSent ? (
                        <>Un email contenant un lien pour définir son mot de passe a été envoyé à <strong>{formData.email}</strong>. Le lien est valable 1 heure.</>
                      ) : (
                        <>L&apos;email n&apos;a pas pu être envoyé. La personne peut utiliser « Mot de passe oublié » sur la page de connexion avec l&apos;adresse <strong>{formData.email}</strong>.</>
                      )}
                    </p>
                  </div>

                  <div className="text-sm text-gray-600 mb-6">
                    <h4 className="font-medium mb-2">Prochaines étapes :</h4>
                    <ul className="space-y-1">
                      <li>• La personne définit son mot de passe grâce au lien reçu par e-mail</li>
                      <li>• Si le lien a expiré, elle utilise « Mot de passe oublié »</li>
                      <li>• Elle pourra ensuite se connecter</li>
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
