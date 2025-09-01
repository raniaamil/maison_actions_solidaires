// src/app/administrateur/actualites/create/page.tsx
'use client';

import React, { useMemo, useRef, useState, useCallback, ChangeEvent } from 'react';
import { ArrowLeft, Save, FileText, Calendar, UploadCloud, Image as ImageIcon, Trash2 } from 'lucide-react';
import styles from './create.module.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';

// (import dynamique pour éviter les erreurs SSR)
import dynamic from 'next/dynamic';
const JoditEditor = dynamic(() => import('jodit-react').then(m => m.default), { ssr: false });

// ⚙️ Limite côté client (gardez-la en phase avec l’API /api/upload/image)
const MAX_CLIENT_IMAGE_SIZE = 5 * 1024 * 1024; // 5 Mo

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
    contenu: '', // valeur initiale (sync au blur)
    statut: 'Brouillon',
    datePublication: new Date().toISOString().split('T')[0],
    categorie: 'administratif',
    image: '', // ← URL publique renvoyée par /api/upload/image
    tags: [] as string[],
    lieu: '',
    places_disponibles: '',
    inscription_requise: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  // Etat pour l'image principale (upload en cours + suivi du filename pour suppression)
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [uploadedCoverFilename, setUploadedCoverFilename] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  // Tampon non contrôlé pour éviter le "caret jump"
  const editorContentRef = useRef<string>(formData.contenu);

  // ✅ helper: liens cliquables, nouvel onglet + soulignement
  const ensureLinksOpenNewTab = useCallback((html: string) => {
    if (!html) return html;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;

    wrapper.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(a => {
      const href = (a.getAttribute('href') || '').trim();
      if (!href || href.startsWith('#') || /^javascript:/i.test(href)) return;
      a.setAttribute('target', '_blank');
      const rel = a.getAttribute('rel') || '';
      const set = new Set(rel.split(/\s+/).filter(Boolean));
      set.add('noopener'); set.add('noreferrer');
      a.setAttribute('rel', Array.from(set).join(' '));
      const style = a.getAttribute('style') || '';
      if (!/text-decoration\s*:/i.test(style)) {
        a.setAttribute('style', `${style ? style + '; ' : ''}text-decoration: underline; text-underline-offset: 2px;`);
      }
    });

    return wrapper.innerHTML;
  }, []);

  // ✅ helper: rendre les vidéos "jouables" dans l’éditeur
  const ensureMediaPlayable = useCallback((html: string) => {
    if (!html) return html;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;

    wrapper.querySelectorAll<HTMLVideoElement>('video').forEach(v => {
      v.setAttribute('controls', '');
      v.setAttribute('playsinline', '');
      v.setAttribute('preload', 'metadata');
      v.setAttribute('contenteditable', 'false');
      const style = v.getAttribute('style') || '';
      const needsMax = !/max-width\s*:/i.test(style);
      const needsHeight = !/height\s*:/i.test(style);
      const needsDisplay = !/display\s*:/i.test(style);
      if (needsMax || needsHeight || needsDisplay) {
        v.setAttribute(
          'style',
          `${style ? style + '; ' : ''}${needsMax ? 'max-width:100%;' : ''}${needsHeight ? 'height:auto;' : ''}${needsDisplay ? 'display:block;' : ''}`
        );
      }
    });

    return wrapper.innerHTML;
  }, []);

  // ⬇️ Upload local (image/vidéo) + insertion dans l'éditeur
  const handleInsertLocalFile = useCallback(
    (editorInstance: any) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,video/*';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;

        // ✅ Vérif taille pour les images (5 Mo)
        if (file.type.startsWith('image/')) {
          if (file.size > MAX_CLIENT_IMAGE_SIZE) {
            const mb = (MAX_CLIENT_IMAGE_SIZE / (1024 * 1024)).toFixed(0);
            alert(`L’image sélectionnée est trop volumineuse. Taille max: ${mb} Mo.
Conseil: compressez l’image (JPEG/WebP) ou réduisez sa résolution, puis réessayez.`);
            input.value = '';
            return;
          }
        }

        try {
          const form = new FormData();
          let endpoint = '';
          let fieldName = '';

          if (file.type.startsWith('image/')) {
            endpoint = '/api/upload/image';
            fieldName = 'image';
          } else if (file.type.startsWith('video/')) {
            endpoint = '/api/upload/video';
            fieldName = 'video';
          } else {
            alert('Type de fichier non pris en charge.');
            return;
          }

          form.append(fieldName, file, file.name);

          const token = getToken?.();
          const headers: Record<string, string> = {};
          if (token) headers['Authorization'] = `Bearer ${token}`;

          const res = await fetch(endpoint, { method: 'POST', body: form, headers });
          const data = await res.json();

          if (!res.ok) {
            throw new Error(data?.error || `Upload échoué (${res.status})`);
          }

          const url: string = data.url;
          const safeAlt = file.name.replace(/"/g, '&quot;');

          if (file.type.startsWith('image/')) {
            editorInstance.selection.insertHTML(
              `<img src="${url}" alt="${safeAlt}" style="max-width:100%;height:auto;" />`
            );
          } else {
            editorInstance.selection.insertHTML(
              `<video controls playsinline preload="metadata" contenteditable="false" src="${url}" style="max-width:100%;height:auto;display:block;"></video>`
            );
          }
        } catch (e: any) {
          alert(`Erreur upload: ${e?.message || e}`);
        } finally {
          input.value = '';
        }
      };
      input.click();
    },
    [getToken]
  );

  // ✅ Upload de l'image principale (sans URL)
  const handlePrimaryImageFile = useCallback(
    async (file: File) => {
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner un fichier image (JPG, PNG, GIF, WebP).');
        return;
      }
      if (file.size > MAX_CLIENT_IMAGE_SIZE) {
        const mb = (MAX_CLIENT_IMAGE_SIZE / (1024 * 1024)).toFixed(0);
        alert(`L’image est trop volumineuse. Taille max: ${mb} Mo.`);
        return;
      }

      setIsUploadingCover(true);
      try {
        // Optionnel: supprimer l’ancienne image du serveur si on en avait uploadé une dans cette session
        if (uploadedCoverFilename) {
          try {
            await fetch(`/api/upload/image?filename=${encodeURIComponent(uploadedCoverFilename)}`, { method: 'DELETE' });
          } catch {
            /* ignore */
          }
        }

        const form = new FormData();
        form.append('image', file, file.name);

        const token = getToken?.();
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch('/api/upload/image', { method: 'POST', body: form, headers });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || `Upload échoué (${res.status})`);

        setFormData(prev => ({ ...prev, image: data.url }));
        setUploadedCoverFilename(data.filename || null);
      } catch (e: any) {
        alert(`Erreur upload de l'image: ${e?.message || e}`);
      } finally {
        setIsUploadingCover(false);
      }
    },
    [getToken, uploadedCoverFilename]
  );

  const onClickSelectCover = useCallback(() => {
    coverInputRef.current?.click();
  }, []);

  const onCoverChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handlePrimaryImageFile(file);
      // reset la valeur pour pouvoir re-sélectionner le même fichier si besoin
      e.target.value = '';
    },
    [handlePrimaryImageFile]
  );

  const handleRemoveCover = useCallback(async () => {
    if (!formData.image) return;
    // Tentative de suppression côté serveur (si on connaît le filename renvoyé par l’API)
    if (uploadedCoverFilename) {
      try {
        await fetch(`/api/upload/image?filename=${encodeURIComponent(uploadedCoverFilename)}`, { method: 'DELETE' });
      } catch {
        /* ignore */
      }
    }
    setFormData(prev => ({ ...prev, image: '' }));
    setUploadedCoverFilename(null);
  }, [formData.image, uploadedCoverFilename]);

  // ✅ Config Jodit (toolbar par défaut). On **surcharge** seulement le contrôle "file"
  const joditConfig = useMemo(
    () => ({
      autofocus: true,
      spellcheck: true,
      width: '100%',
      height: 400,
      placeholder: 'Rédigez votre contenu ici...',
      // style anti-débordement
      style: {
        maxWidth: '100%',
        width: '100%',
        boxSizing: 'border-box',
        overflowWrap: 'anywhere',
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap',
      } as React.CSSProperties,

      safeJavaScriptLink: true,

      // Lien: comportement par défaut + options utiles
      // @ts-ignore
      link: {
        processPastedLink: true,
        openInNewTabCheckbox: true,
        followOnDblClick: true,
      },

      // Autoriser explicitement les attributs vidéo pour éviter un nettoyage trop agressif
      // @ts-ignore
      allowTags: {
        video: [
          'controls', 'src', 'poster', 'preload', 'autoplay', 'loop', 'muted',
          'playsinline', 'width', 'height', 'style', 'contenteditable'
        ],
        source: ['src', 'type']
      },

      // ⬇️ Remplace le comportement du bouton "insérer un fichier"
      // @ts-ignore
      controls: {
        file: {
          tooltip: 'Insérer un fichier (image/vidéo) depuis l’ordinateur',
          exec: (editor: any) => handleInsertLocalFile(editor),
        },
      },
    }),
    [handleInsertLocalFile]
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

  // NE pas setState à chaque frappe -> on stocke seulement dans le ref
  const handleEditorChange = useCallback((content: string) => {
    editorContentRef.current = content;
  }, []);

  // Au blur, on sécurise liens + médias, puis on sync le state
  const handleEditorBlur = useCallback(
    (content: string) => {
      let fixed = ensureLinksOpenNewTab(content);
      fixed = ensureMediaPlayable(fixed);
      editorContentRef.current = fixed;
      setFormData(prev => ({ ...prev, contenu: fixed }));
      if (errors.contenu) setErrors(prev => ({ ...prev, contenu: '' }));
    },
    [ensureLinksOpenNewTab, ensureMediaPlayable, errors.contenu]
  );

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
    // Toujours prendre la dernière version + sécuriser avant envoi
    const latestContent = editorContentRef.current ?? formData.contenu;
    let safeContent = ensureLinksOpenNewTab(latestContent);
    safeContent = ensureMediaPlayable(safeContent);

    if (!validateForm(safeContent)) return;
    if (!user?.id) { router.push('/login'); return; }

    setIsLoading(true);
    try {
      const payload = {
        titre: formData.titre.trim(),
        description: formData.description.trim(),
        contenu: safeContent, // HTML final
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

                {/* Wrapper anti-débordement + classe locale pour :global(...) */}
                <div
                  className={styles.joditFix}
                  style={{
                    maxWidth: '100%',
                    overflow: 'hidden',
                    borderRadius: '.375rem',
                    border: errors.contenu ? '1px solid #ef4444' : '1px solid transparent',
                  }}
                >
                  {/* Jodit (non contrôlé pendant la frappe) */}
                  <JoditEditor
                    value={formData.contenu}
                    onChange={handleEditorChange}
                    onBlur={handleEditorBlur}
                    // @ts-ignore
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
              <p className={styles.sectionSubtitle}>Téléversez une image d&apos;en-tête (JPG, PNG, GIF, WebP – max 5 Mo)</p>

              {/* Input de fichier caché */}
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={onCoverChange}
                style={{ display: 'none' }}
              />

              {!formData.image ? (
                <div
                  className={styles.uploadArea}
                  onClick={onClickSelectCover}
                  role="button"
                  aria-label="Choisir une image principale"
                  style={{ cursor: isUploadingCover ? 'not-allowed' : 'pointer', opacity: isUploadingCover ? 0.6 : 1 }}
                >
                  <UploadCloud className={styles.uploadIcon} />
                  <p className={styles.uploadText}>
                    {isUploadingCover ? 'Téléversement en cours…' : 'Cliquez pour choisir une image'}
                  </p>
                  <p className={styles.uploadSubtext}>Formats acceptés: JPG, PNG, GIF, WebP — 5 Mo max</p>
                </div>
              ) : (
                <div>
                  <img
                    src={formData.image}
                    alt="Image principale"
                    style={{ maxWidth: '100%', height: 'auto', borderRadius: '.375rem', display: 'block' }}
                  />
                  <div style={{ display: 'flex', gap: '.5rem', marginTop: '.75rem' }}>
                    <button
                      type="button"
                      onClick={onClickSelectCover}
                      disabled={isUploadingCover || isLoading}
                      className={styles.saveButton}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem' }}
                    >
                      <ImageIcon className={styles.buttonIcon} />
                      Changer l’image
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveCover}
                      disabled={isUploadingCover || isLoading}
                      className={styles.draftButton}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '.5rem', marginBottom: 0 }}
                    >
                      <Trash2 className={styles.buttonIcon} />
                      Supprimer
                    </button>
                  </div>
                </div>
              )}
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



