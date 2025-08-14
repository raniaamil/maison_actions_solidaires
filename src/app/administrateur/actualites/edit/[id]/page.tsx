'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, FileText, X, Calendar, Image as ImageIcon, Upload } from 'lucide-react';
import styles from './edit.module.css';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../../contexts/AuthContext';

const ModifierActualite = () => {
  const params = useParams();
  const router = useRouter();
  const { getToken } = useAuth();
  const actualiteId = params.id as string;

  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    contenu: '',
    statut: 'Brouillon',
    datePublication: '',
    categorie: 'administratif',
    image: '',
    tags: [] as string[],
    lieu: '',
    places_disponibles: '',
    inscription_requise: false
  });

  const [hasImage, setHasImage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Charger les données de l'actualité
  useEffect(() => {
    const loadActualite = async () => {
      try {
        const response = await fetch(`/api/actualites/${actualiteId}`);
        if (response.ok) {
          const data = await response.json();
          setFormData({
            titre: data.titre || data.title || '',
            description: data.description || '',
            contenu: data.contenu || data.content || '',
            statut: data.statut || data.status || 'Brouillon',
            datePublication: data.date_publication ? new Date(data.date_publication).toISOString().split('T')[0] : '',
            categorie: data.type || 'administratif',
            image: data.image || '',
            tags: data.tags || [],
            lieu: data.lieu || data.location || '',
            places_disponibles: data.places_disponibles?.toString() || data.places?.toString() || '',
            inscription_requise: data.inscription_requise || data.hasRegistration || false
          });
          setHasImage(!!data.image);
        } else {
          console.error('Erreur lors du chargement de l\'actualité');
          alert('Actualité non trouvée');
          router.push('/administrateur?tab=actualites');
        }
      } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors du chargement de l\'actualité');
      } finally {
        setLoading(false);
      }
    };

    if (actualiteId) {
      loadActualite();
    }
  }, [actualiteId, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Update hasImage when image URL changes
    if (name === 'image') {
      setHasImage(!!value);
    }
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.titre.trim()) {
      newErrors.titre = 'Le titre est requis';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La description est requise';
    }

    if (!formData.contenu.trim()) {
      newErrors.contenu = 'Le contenu est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (statut: string | null = null) => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        titre: formData.titre,
        description: formData.description,
        contenu: formData.contenu,
        type: formData.categorie,
        statut: statut || formData.statut,
        image: formData.image || null,
        date_publication: (statut === 'Publié' || formData.statut === 'Publié') ? formData.datePublication : null,
        tags: formData.tags.length > 0 ? formData.tags : null,
        lieu: formData.lieu || null,
        places_disponibles: formData.places_disponibles ? parseInt(formData.places_disponibles) : null,
        inscription_requise: formData.inscription_requise
      };

      const headers: {[key: string]: string} = {
        'Content-Type': 'application/json',
      };

      const token = getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/actualites/${actualiteId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Actualité mise à jour avec succès:', data);
        alert(`Actualité ${statut === 'Publié' ? 'publiée' : 'mise à jour'} avec succès !`);
        router.push('/administrateur?tab=actualites');
      } else {
        console.log('❌ Erreur du serveur:', data);
        alert(data.error || 'Une erreur est survenue lors de la mise à jour de l\'actualité');
      }
    } catch (error) {
      console.error('❌ Erreur réseau:', error);
      alert('Erreur de connexion au serveur. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = () => handleSave('Publié');
  const handleSaveDraft = () => handleSave('Brouillon');

  const handleRemoveImage = () => {
    setFormData(prev => ({ ...prev, image: '' }));
    setHasImage(false);
  };

  const handleMediaUpload = () => {
    console.log('Upload de média - fonctionnalité à implémenter');
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '16rem' }}>
          <div style={{ 
            animation: 'spin 1s linear infinite', 
            borderRadius: '50%', 
            height: '3rem', 
            width: '3rem', 
            borderBottomWidth: '2px', 
            borderBottomColor: '#2563eb' 
          }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/administrateur?tab=actualites" className={styles.backButton}>
          <ArrowLeft className={styles.backIcon} />
          Retour
        </Link>
        <div className={styles.titleSection}>
          <h1 className={styles.pageTitle}>Modifier l'actualité</h1>
          <p className={styles.pageSubtitle}>Modifiez votre article existant</p>
        </div>
        <div className={styles.headerActions}>
          <button 
            className={styles.saveButton} 
            onClick={() => handleSave()}
            disabled={isLoading}
          >
            <Save className={styles.buttonIcon} />
            {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
          <button 
            className={styles.publishButton} 
            onClick={handlePublish}
            disabled={isLoading}
          >
            <FileText className={styles.buttonIcon} />
            {isLoading ? 'Publication...' : 'Publier'}
          </button>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.mainSection}>
          <div className={styles.contentCard}>
            <h2 className={styles.sectionTitle}>Contenu de l'article</h2>
            <p className={styles.sectionSubtitle}>Saisissez le titre et le contenu de votre actualité</p>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Titre <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                name="titre"
                value={formData.titre}
                onChange={handleInputChange}
                className={`${styles.input} ${errors.titre ? styles.inputError : ''}`}
                disabled={isLoading}
              />
              {errors.titre && (
                <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {errors.titre}
                </span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Description <span className={styles.required}>*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
                rows={3}
                disabled={isLoading}
              />
              {errors.description && (
                <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {errors.description}
                </span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Contenu <span className={styles.required}>*</span>
              </label>
              <textarea
                name="contenu"
                value={formData.contenu}
                onChange={handleInputChange}
                className={`${styles.textarea} ${errors.contenu ? styles.inputError : ''}`}
                rows={8}
                disabled={isLoading}
              />
              {errors.contenu && (
                <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {errors.contenu}
                </span>
              )}
            </div>

            {/* Informations complémentaires - toujours visibles */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Lieu (optionnel)</label>
              <input
                type="text"
                name="lieu"
                value={formData.lieu}
                onChange={handleInputChange}
                placeholder="Lieu de l'événement ou de l'activité"
                className={styles.input}
                disabled={isLoading}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Nombre de places disponibles (optionnel)</label>
              <input
                type="number"
                name="places_disponibles"
                value={formData.places_disponibles}
                onChange={handleInputChange}
                placeholder="Ex: 25"
                className={styles.input}
                min="1"
                disabled={isLoading}
              />
            </div>

            <div className={styles.formGroup}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input
                  type="checkbox"
                  name="inscription_requise"
                  checked={formData.inscription_requise}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
                <span className={styles.label}>Inscription requise</span>
              </label>
            </div>
          </div>

          <div className={styles.mediaCard}>
            <h2 className={styles.sectionTitle}>Média</h2>
            <p className={styles.sectionSubtitle}>Ajoutez une image ou une vidéo à votre actualité</p>

            <div className={styles.formGroup}>
              <label className={styles.label}>URL de l'image</label>
              <input
                type="url"
                name="image"
                value={formData.image}
                onChange={handleInputChange}
                placeholder="https://exemple.com/image.jpg"
                className={styles.input}
                disabled={isLoading}
              />
            </div>

            {hasImage && formData.image ? (
              <div className={styles.imagePreview}>
                <img 
                  src={formData.image} 
                  alt="Aperçu"
                  className={styles.previewImage}
                />
                <button 
                  className={styles.removeButton} 
                  onClick={handleRemoveImage}
                  disabled={isLoading}
                >
                  <X className={styles.removeIcon} />
                </button>
                <div className={styles.imageInfo}>
                  <ImageIcon className={styles.imageInfoIcon} />
                  <span className={styles.imageInfoText}>Image attachée</span>
                </div>
              </div>
            ) : (
              <div className={styles.uploadArea} onClick={handleMediaUpload}>
                <Upload className={styles.uploadIcon} />
                <p className={styles.uploadText}>Cliquez pour télécharger</p>
                <p className={styles.uploadSubtext}>Images et vidéos acceptées</p>
              </div>
            )}
          </div>
        </div>

        <div className={styles.sidebar}>
          <div className={styles.publicationCard}>
            <h2 className={styles.sectionTitle}>Publication</h2>
            <p className={styles.sectionSubtitle}>Paramètres de publication de l'article</p>

            <div className={styles.formGroup}>
              <label className={styles.label}>Statut</label>
              <select
                name="statut"
                value={formData.statut}
                onChange={handleInputChange}
                className={styles.select}
                disabled={isLoading}
              >
                <option value="Brouillon">Brouillon</option>
                <option value="Publié">Publié</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Date de publication</label>
              <div className={styles.dateInput}>
                <input
                  type="date"
                  name="datePublication"
                  value={formData.datePublication}
                  onChange={handleInputChange}
                  className={styles.input}
                  disabled={isLoading}
                />
                <Calendar className={styles.calendarIcon} />
              </div>
            </div>
          </div>

          <div className={styles.categoryCard}>
            <h2 className={styles.sectionTitle}>Catégorie</h2>
            <p className={styles.sectionSubtitle}>Sélectionnez la catégorie de votre actualité</p>

            <div className={styles.formGroup}>
              <label className={styles.label}>Catégorie</label>
              <select
                name="categorie"
                value={formData.categorie}
                onChange={handleInputChange}
                className={styles.select}
                disabled={isLoading}
              >
                <option value="administratif">Administratif</option>
                <option value="numérique">Numérique</option>
                <option value="soutien">Soutien</option>
                <option value="bien-être">Bien-être</option>
                <option value="junior">Junior</option>
                <option value="événement">Événement</option>
                <option value="témoignage">Témoignage</option>
              </select>
            </div>
          </div>

          <div className={styles.actionsCard}>
            <h2 className={styles.sectionTitle}>Actions</h2>

            <button 
              className={styles.draftButton} 
              onClick={handleSaveDraft}
              disabled={isLoading}
            >
              <Save className={styles.buttonIcon} />
              {isLoading ? 'Sauvegarde...' : 'Sauvegarder en brouillon'}
            </button>

            <button 
              className={styles.publishNowButton} 
              onClick={handlePublish}
              disabled={isLoading}
            >
              <FileText className={styles.buttonIcon} />
              {isLoading ? 'Publication...' : 'Publier maintenant'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModifierActualite;