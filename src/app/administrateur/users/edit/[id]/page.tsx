'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, Save, User, Mail } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import ProtectedRoute from '../../../../../components/ProtectedRoute';
import { useAuth } from '../../../../../contexts/AuthContext';

type Role = 'Rédacteur' | 'Administrateur';

type UserRecord = {
  id: number;
  prenom: string;
  nom: string;
  email: string;
  photo: string;
  bio: string;
  role: Role;
};

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { getToken } = useAuth(); // Ajout de l'authentification
  const userId = useMemo(() => Number(params?.id), [params?.id]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formData, setFormData] = useState<UserRecord>({
    id: userId,
    prenom: '',
    nom: '',
    email: '',
    photo: '',
    bio: '',
    role: 'Rédacteur',
  });

  // Chargement depuis l'API avec token
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const token = getToken();
        const headers: any = { 'Content-Type': 'application/json' };
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`/api/users/${userId}`, { 
          cache: 'no-store',
          headers
        });
        
        if (res.ok) {
          const data = await res.json();
          if (mounted) setFormData(data);
        } else if (res.status === 401) {
          console.error('Token invalide ou expiré');
          router.push('/login');
        } else {
          console.error('Utilisateur non trouvé');
          router.push('/administrateur?tab=utilisateurs');
        }
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
        router.push('/administrateur?tab=utilisateurs');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [userId, router, getToken]);

  const handleBackToList = () => {
    router.push('/administrateur?tab=utilisateurs');
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const isFormValid = formData.prenom && formData.nom && formData.email;

  const handleSave = async () => {
    if (!isFormValid) return;
    setSaving(true);
    try {
      const token = getToken();
      const headers: any = { 'Content-Type': 'application/json' };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowSuccessModal(true);
      } else if (response.status === 401) {
        alert('Session expirée. Veuillez vous reconnecter.');
        router.push('/login');
      } else {
        const data = await response.json();
        alert(data.error || 'Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRole="Administrateur">
        <div className="bg-gray-50 min-h-screen font-sans">
          <div className="max-w-4xl mx-auto p-8 min-h-screen flex items-center justify-center">
            <div className="flex items-center gap-3 text-gray-600">
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
              <span>Chargement de l'utilisateur…</span>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Modifier l'utilisateur #{userId}
            </h1>
            <p className="text-gray-600">Mettez à jour les informations de ce compte.</p>
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
                        <img
                          src={formData.photo}
                          alt="Aperçu"
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
                        value={formData.photo}
                        onChange={handleInputChange}
                        className="px-3 py-3 border border-gray-300 rounded-md text-base bg-white transition-all duration-200 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100"
                        placeholder="https://exemple.com/photo.jpg"
                      />
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
                      className="px-3 py-3 border border-gray-300 rounded-md text-base bg-gray-50 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100"
                      required
                    />
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
                      className="px-3 py-3 border border-gray-300 rounded-md text-base bg-gray-50 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100"
                      required
                    />
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
                      className="px-3 py-3 border border-gray-300 rounded-md text-base bg-gray-50 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100"
                      required
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      Cette adresse sera utilisée pour la connexion et les notifications.
                    </p>
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-700 mb-2">Rôle</label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="px-3 py-3 border border-gray-300 rounded-md text-base bg-gray-50 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100"
                    >
                      <option value="Rédacteur">Rédacteur</option>
                      <option value="Administrateur">Administrateur</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col mb-6">
                  <label className="text-sm font-medium text-gray-700 mb-2">Biographie</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={3}
                    className="px-3 py-3 border border-gray-300 rounded-md text-base bg-gray-50 transition-all duration-200 focus:outline-none focus:border-blue-600 focus:bg-white focus:ring-3 focus:ring-blue-100 resize-vertical"
                    placeholder="Une courte description de l'utilisateur..."
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-6 border-t px-8 pb-8">
                <button
                  type="button"
                  className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
                  onClick={handleBackToList}
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!isFormValid || saving}
                  className={`px-8 py-3 rounded-md font-medium transition-all duration-200 ${
                    isFormValid && !saving
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Enregistrement…
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      Enregistrer
                    </span>
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
                      <h3 className="text-lg font-semibold text-gray-900">Modifications enregistrées</h3>
                      <p className="text-sm text-gray-600">
                        {formData.prenom} {formData.nom}
                      </p>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mb-6">
                    Les informations de l'utilisateur ont été mises à jour.
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowSuccessModal(false)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                    >
                      Continuer l'édition
                    </button>
                    <button
                      onClick={handleBackToList}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
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