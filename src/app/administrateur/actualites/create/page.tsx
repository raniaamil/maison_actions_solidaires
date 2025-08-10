'use client';

import React, { useState } from 'react';
import { ArrowLeft, Save, FileText, Upload, Calendar } from 'lucide-react';
import styles from './create.module.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const NouvelleActualite = () => {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    contenu: '',
    statut: 'Brouillon',
    datePublication: new Date().toISOString().split('T')[0],
    categorie: 'administratif',
    image: '',
    tags: [],
    lieu: '',
    places_disponibles: '',
    inscription_requise: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
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
  };

  const validateForm = () => {
    const newErrors = {};

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

  const handleSave = async (statut = 'Brouillon') => {
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
        statut: statut,
        image: formData.image || null,
        auteur_id: 1, // TODO: Récupérer l'ID de l'utilisateur connecté
        date_publication: statut === 'Publié' ? formData.datePublication : null,
        tags: formData.tags.length > 0 ? formData.tags : null,
        lieu: formData.lieu || null,
        places_disponibles: formData.places_disponibles ? parseInt(formData.places_disponibles) : null,
        inscription_requise: formData.inscription_requise
      };

      const response = await fetch('/api/actualites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Actualité créée avec succès:', data);
        alert(`Actualité ${statut === 'Publié' ? 'publiée' : 'sauvegardée'} avec succès !`);
        router.push('/administrateur?tab=actualites');
      } else {
        console.log('❌ Erreur du serveur:', data);
        alert(data.error || 'Une erreur est survenue lors de la création de l\'actualité');
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

  const handleMediaUpload = () => {
    console.log('Upload de média - fonctionnalité à implémenter');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/administrateur?tab=actualites" className={styles.backButton}>
          <ArrowLeft className={styles.backIcon} />
          Retour
        </Link>
        <div className={styles.titleSection}>
          <h1 className={styles.pageTitle}>Nouvelle actualité</h1>
          <p className={styles.pageSubtitle}>Créez un nouvel article</p>
        </div>
        <div className={styles.headerActions}>
          <button 
            className={styles.saveButton} 
            onClick={handleSaveDraft}
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
                placeholder="Saisissez le titre de l'actualité"
                className={`${styles.input} ${errors.titre ? 'border-red-500' : ''}`}
                disabled={isLoading}
              />
              {errors.titre && <span className="text-red-500 text-sm mt-1">{errors.titre}</span>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Description <span className={styles.required}>*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Brève description de l'actualité..."
                className={`${styles.textarea} ${errors.description ? 'border-red-500' : ''}`}
                rows={3}
                disabled={isLoading}
              />
              {errors.description && <span className="text-red-500 text-sm mt-1">{errors.description}</span>}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>
                Contenu <span className={styles.required}>*</span>
              </label>
              <textarea
                name="contenu"
                value={formData.contenu}
                onChange={handleInputChange}
                placeholder="Rédigez le contenu de votre actualité..."
                className={`${styles.textarea} ${errors.contenu ? 'border-red-500' : ''}`}
                rows={8}
                disabled={isLoading}
              />
              {errors.contenu && <span className="text-red-500 text-sm mt-1">{errors.contenu}</span>}
            </div>

            {/* Informations pour les événements */}
            {(formData.categorie === 'événement' || formData.categorie === 'numérique' || formData.categorie === 'bien-être') && (
              <>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Lieu</label>
                  <input
                    type="text"
                    name="lieu"
                    value={formData.lieu}
                    onChange={handleInputChange}
                    placeholder="Lieu de l'événement"
                    className={styles.input}
                    disabled={isLoading}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Nombre de places disponibles</label>
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
                  <label className="flex items-center gap-2">
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
              </>
            )}
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

            <div className={styles.uploadArea} onClick={handleMediaUpload}>
              <Upload className={styles.uploadIcon} />
              <p className={styles.uploadText}>Cliquez pour télécharger</p>
              <p className={styles.uploadSubtext}>Images et vidéos acceptées</p>
            </div>
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

export default NouvelleActualite;