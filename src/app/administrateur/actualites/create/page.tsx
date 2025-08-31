// src/app/administrateur/actualites/create/page.tsx
'use client';

import React, { useMemo, useRef, useState, useCallback } from 'react';
import { ArrowLeft, Save, FileText, Calendar } from 'lucide-react';
import styles from './create.module.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';

// ⬇️ Jodit (exactement la même lib que ton extrait)
// (import dynamique pour éviter les erreurs SSR)
import dynamic from 'next/dynamic';
const JoditEditor = dynamic(() => import('jodit-react').then(m => m.default), { ssr: false });

type Errors = {
  [key: string]: string | undefined;
  titre?: string;
  description?: string;
  contenu?: string;
  auteur?: string;
};

const NouvelleActualite: React.FC = () => {
  const router = useRouter();
  const { user, getToken } = useAuth();

  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    contenu: '', // valeur initiale (sera sync au blur)
    statut: 'Brouillon',
    datePublication: new Date().toISOString().split('T')[0],
    categorie: 'administratif',
    image: '',
    tags: [] as string[],
    lieu: '',
    places_disponibles: '',
    inscription_requise: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  // 🔒 Tampon non-contrôlé pour éviter les re-renders à chaque frappe
  const editorContentRef = useRef<string>(formData.contenu);

  // ✅ Config Jodit (stable) + styles anti-débordement
  const joditConfig = useMemo(
    () => ({
      autofocus: true,
      spellcheck: true,
      width: '100%',
      height: 400,
      placeholder: "Rédigez votre contenu ici...",
      style: {
        maxWidth: '100%',
        width: '100%',
        boxSizing: 'border-box',
        overflowWrap: 'anywhere',
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap',
      } as React.CSSProperties,
    }),
    []
  );

  // helper: détecter contenu vide (vrai texte)
  const isHtmlEmpty = (html: string) => {
    const text = (html || '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return text.length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  // 🧠 IMPORTANT : on NE met pas à jour le state à chaque frappe.
  // onChange ➜ juste MAJ du ref (pas de re-render donc pas de "caret jump")
  const handleEditorChange = useCallback((content: string) => {
    editorContentRef.current = content;
  }, []);

  // Au blur, on synchronise le state (utile pour validations/preview)
  const handleEditorBlur = useCallback((content: string) => {
    editorContentRef.current = content;
    setFormData(prev => ({ ...prev, contenu: content }));
    if (errors.contenu) setErrors(prev => ({ ...prev, contenu: '' }));
  }, [errors.contenu]);

  const validateForm = (contentForValidation?: string) => {
    const content = contentForValidation ?? editorContentRef.current ?? formData.contenu;
    const newErrors: Errors = {};

    if (!formData.titre.trim()) newErrors.titre = 'Le titre est requis';
    if (!formData.description.trim()) newErrors.description = 'La description est requise';
    if (!content || isHtmlEmpty(content)) newErrors.contenu = 'Le contenu est requis';
    if (!user?.id) newErrors.auteur = 'Utilisateur non connecté';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (statut: 'Brouillon' | 'Publié' = 'Brouillon') => {
    // 🔁 On récupère TOUJOURS la dernière version depuis le ref
    const latestContent = editorContentRef.current ?? formData.contenu;

    if (!validateForm(latestContent)) return;
    if (!user?.id) { router.push('/login'); return; }

    setIsLoading(true);
    try {
      const payload = {
        titre: formData.titre.trim(),
        description: formData.description.trim(),
        contenu: latestContent, // garder le HTML tel quel
        type: formData.categorie,
        statut,
        image: formData.image.trim() || null,
        auteur_id: user.id,
        date_publication: statut === 'Publié' ? formData.datePublication : null,
        tags: formData.tags.length > 0 ? formData.tags : [],
        lieu: formData.lieu.trim() || null,
        places_disponibles: formData.places_disponibles ? parseInt(formData.places_disponibles, 10) : null,
        inscription_requise: formData.inscription_requise,
      };

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const token = getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const response = await fetch('/api/actualites', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/administrateur?tab=actualites');
      } else {
        if (response.status === 401) router.push('/login');
        else if (response.status === 403) alert("Erreur: Vous n'avez pas les permissions pour créer une actualité.");
        else if (data?.error) alert(`Erreur: ${data.error}`);
        else alert(`Erreur ${response.status}: Une erreur est survenue`);
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
      alert('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = () => handleSave('Publié');
  const handleSaveDraft = () => handleSave('Brouillon');

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto p-8">
        <div className={styles.header}>
          <Link href="/administrateur?tab=actualites" className={styles.backButton}>
            <ArrowLeft className={styles.backIcon} />
            Retour
          </Link>

          <div className={styles.titleSection}>
            <h1 className={styles.pageTitle}>Nouvelle actualité</h1>
            <p className={styles.pageSubtitle}>Créez un nouvel article avec l&apos;éditeur</p>
          </div>

          <div className={styles.headerActions}>
            <button className={styles.saveButton} onClick={handleSaveDraft} disabled={isLoading}>
              <Save className={styles.buttonIcon} />
              {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
            <button className={styles.publishButton} onClick={handlePublish} disabled={isLoading}>
              <FileText className={styles.buttonIcon} />
              {isLoading ? 'Publication...' : 'Publier'}
            </button>
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.mainSection}>
            <div className={styles.contentCard}>
              <h2 className={styles.sectionTitle}>Contenu de l&apos;article</h2>
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
                  className={`${styles.input} ${errors.titre ? styles.inputError : ''}`}
                  disabled={isLoading}
                />
                {errors.titre && <span style={{ color: '#ef4444', fontSize: '.875rem' }}>{errors.titre}</span>}
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
                  className={`${styles.textarea} ${errors.description ? styles.inputError : ''}`}
                  rows={3}
                  disabled={isLoading}
                />
                {errors.description && <span style={{ color: '#ef4444', fontSize: '.875rem' }}>{errors.description}</span>}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Contenu <span className={styles.required}>*</span>
                </label>

                {/* ✅ Wrapper anti-débordement + classe locale pour :global(...) */}
                <div
                  className={styles.joditFix}
                  style={{
                    maxWidth: '100%',
                    overflow: 'hidden',
                    borderRadius: '.375rem',
                    border: errors.contenu ? '1px solid #ef4444' : '1px solid transparent',
                  }}
                >
                  {/* ⬇️ ÉDITEUR JODIT (non-contrôlé pendant la frappe) */}
                  <JoditEditor
                    value={formData.contenu}   // valeur initiale / réhydratation si besoin
                    onChange={handleEditorChange} // maj ref (pas de state ➜ pas de caret jump)
                    onBlur={handleEditorBlur}     // sync state au blur
                    // @ts-ignore — la lib tolère des clés supplémentaires comme "style"
                    config={joditConfig}
                  />
                </div>

                {errors.contenu && <span style={{ color: '#ef4444', fontSize: '.875rem' }}>{errors.contenu}</span>}
              </div>

              {/* Infos complémentaires */}
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
              <h2 className={styles.sectionTitle}>Image principale</h2>
              <p className={styles.sectionSubtitle}>Ajoutez une image d&apos;en-tête à votre actualité</p>

              <div className={styles.formGroup}>
                <label className={styles.label}>URL de l&apos;image (optionnel)</label>
                <input
                  type="url"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  placeholder="https://exemple.com/image.jpg"
                  className={styles.input}
                  disabled={isLoading}
                />
                <p style={{ fontSize: '.875rem', color: '#6b7280', marginTop: '.25rem' }}>
                  Vous pouvez aussi insérer des images directement dans le contenu via l’éditeur.
                </p>
              </div>
            </div>
          </div>

          <div className={styles.sidebar}>
            <div className={styles.publicationCard}>
              <h2 className={styles.sectionTitle}>Publication</h2>
              <p className={styles.sectionSubtitle}>Paramètres de publication de l&apos;article</p>

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

              <button className={styles.draftButton} onClick={handleSaveDraft} disabled={isLoading}>
                <Save className={styles.buttonIcon} />
                {isLoading ? 'Sauvegarde...' : 'Sauvegarder en brouillon'}
              </button>

              <button className={styles.publishNowButton} onClick={handlePublish} disabled={isLoading}>
                <FileText className={styles.buttonIcon} />
                {isLoading ? 'Publication...' : 'Publier maintenant'}
              </button>
            </div>
          </div>
        </div>

        {errors.auteur && (
          <div
            style={{
              position: 'fixed',
              bottom: '1rem',
              right: '1rem',
              backgroundColor: '#fee2e2',
              border: '1px solid #fca5a5',
              color: '#dc2626',
              padding: '0.75rem 1rem',
              borderRadius: '0.375rem',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
              zIndex: 50,
            }}
          >
            {errors.auteur}
          </div>
        )}
      </div>
    </div>
  );
};

export default NouvelleActualite;

