'use client';

import React, { useState } from 'react';
import { ArrowLeft, Save, FileText, Upload, Calendar } from 'lucide-react';
import styles from './create.module.css';
import Link from 'next/link';

const NouvelleActualite = () => {
  const [formData, setFormData] = useState({
    titre: '',
    contenu: '',
    statut: 'Brouillon',
    datePublication: '26/07/2025',
    categorie: 'administratif'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReturn = () => {
    console.log('Retour à la liste des actualités');
  };

  const handleSave = () => {
    console.log('Sauvegarde:', formData);
  };

  const handlePublish = () => {
    console.log('Publication:', formData);
  };

  const handleSaveDraft = () => {
    console.log('Sauvegarde en brouillon:', formData);
  };

  const handlePublishNow = () => {
    console.log('Publier maintenant:', formData);
  };

  const handleMediaUpload = () => {
    console.log('Upload de média');
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
          <button className={styles.saveButton} onClick={handleSave}>
            <Save className={styles.buttonIcon} />
            Sauvegarder
          </button>
          <button className={styles.publishButton} onClick={handlePublish}>
            <FileText className={styles.buttonIcon} />
            Publier
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
                className={styles.input}
              />
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
                className={styles.textarea}
                rows={8}
              />
            </div>
          </div>

          <div className={styles.mediaCard}>
            <h2 className={styles.sectionTitle}>Média</h2>
            <p className={styles.sectionSubtitle}>Ajoutez une image ou une vidéo à votre actualité</p>

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
              >
                <option value="Brouillon">Brouillon</option>
                <option value="Publié">Publié</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Date de publication</label>
              <div className={styles.dateInput}>
                <input
                  type="text"
                  name="datePublication"
                  value={formData.datePublication}
                  onChange={handleInputChange}
                  className={styles.input}
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

            <button className={styles.draftButton} onClick={handleSaveDraft}>
              <Save className={styles.buttonIcon} />
              Sauvegarder en brouillon
            </button>

            <button className={styles.publishNowButton} onClick={handlePublishNow}>
              <FileText className={styles.buttonIcon} />
              Publier maintenant
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NouvelleActualite;