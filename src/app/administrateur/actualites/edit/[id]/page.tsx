'use client';

import React, { useState } from 'react';
import { ArrowLeft, Save, FileText, X, Calendar, Image as ImageIcon, Upload } from 'lucide-react';
import styles from './edit.module.css';
import Link from 'next/link';

const ModifierActualite = () => {
  const [formData, setFormData] = useState({
    titre: 'Lancement de notre nouvelle application',
    contenu: 'Nous sommes ravis d\'annoncer le lancement de notre nouvelle application mobile qui révolutionne l\'expérience utilisateur...',
    statut: 'Publié',
    datePublication: '15/01/2024',
    categorie: 'numérique'
  });

  const [hasImage, setHasImage] = useState(true);

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

  const handleRemoveImage = () => {
    setHasImage(false);
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
          <h1 className={styles.pageTitle}>Modifier l'actualité</h1>
          <p className={styles.pageSubtitle}>Modifiez votre article existant</p>
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
                className={styles.textarea}
                rows={8}
              />
            </div>
          </div>

          <div className={styles.mediaCard}>
            <h2 className={styles.sectionTitle}>Média</h2>
            <p className={styles.sectionSubtitle}>Ajoutez une image ou une vidéo à votre actualité</p>

            {hasImage ? (
              <div className={styles.imagePreview}>
                <img 
                  src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNzVMMTI1IDEwMEg3NUwxMDAgNzVaIiBmaWxsPSIjOUNBM0FGIi8+CjxjaXJjbGUgY3g9IjE1MCIgY3k9IjUwIiByPSIxMCIgZmlsbD0iIzlDQTNBRiIvPgo8dGV4dCB4PSIxMDAiIHk9IjEzMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzZCNzI4MCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiPkFwZXLDp3U8L3RleHQ+Cjwvc3ZnPgo=" 
                  alt="Aperçu"
                  className={styles.previewImage}
                />
                <button className={styles.removeButton} onClick={handleRemoveImage}>
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
              <label className={styles.label}>Catégorie</label>
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

export default ModifierActualite;