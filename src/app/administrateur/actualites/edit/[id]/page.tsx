'use client';

import React, { useMemo, useRef, useState, useCallback, useEffect, ChangeEvent } from 'react';
import { ArrowLeft, Save, FileText, Calendar, UploadCloud, Image as ImageIcon, Trash2 } from 'lucide-react';
import styles from './edit.module.css';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '../../../../../contexts/AuthContext';

// import dynamique Jodit pour éviter SSR
import dynamic from 'next/dynamic';
const JoditEditor = dynamic(() => import('jodit-react').then(m => m.default), { ssr: false });

// même limite client que l’endpoint /api/upload/image
const MAX_CLIENT_IMAGE_SIZE = 5 * 1024 * 1024; // 5 Mo

type Errors = {
  [key: string]: string | undefined;
  titre?: string;
  description?: string;
  contenu?: string;
};

const ModifierActualite: React.FC = () => {
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
    image: '', // URL publique (image principale)
    tags: [] as string[],
    lieu: '',
    places_disponibles: '',
    inscription_requise: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Errors>({});

  // Upload image principale
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [uploadedCoverFilename, setUploadedCoverFilename] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  // tampon non contrôlé pour l’éditeur (évite le caret jump)
  const editorContentRef = useRef<string>('');

  // ---- Helpers contenu (liens & vidéos) ----
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

  // ---- Upload inséré via le bouton "fichier" de la barre Jodit ----
  const handleInsertLocalFile = useCallback(
    (editorInstance: any) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,video/*';
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;

        // limite image
        if (file.type.startsWith('image/') && file.size > MAX_CLIENT_IMAGE_SIZE) {
          const mb = (MAX_CLIENT_IMAGE_SIZE / (1024 * 1024)).toFixed(0);
          alert(`L’image est trop volumineuse. Taille max: ${mb} Mo.`);
          input.value = '';
          return;
        }

        try {
          const form = new FormData();
          let endpoint = '';
          let fieldName = '';

          if (file.type.startsWith('image/')) { endpoint = '/api/upload/image'; fieldName = 'image'; }
          else if (file.type.startsWith('video/')) { endpoint = '/api/upload/video'; fieldName = 'video'; }
          else { alert('Type de fichier non pris en charge.'); return; }

          form.append(fieldName, file, file.name);

          const token = getToken?.();
          const headers: Record<string, string> = {};
          if (token) headers['Authorization'] = `Bearer ${token}`;

          const res = await fetch(endpoint, { method: 'POST', body: form, headers });
          const data = await res.json();
          if (!res.ok) throw new Error(data?.error || `Upload échoué (${res.status})`);

          const url: string = data.url;
          const safeAlt = file.name.replace(/"/g, '&quot;');

          if (file.type.startsWith('image/')) {
            editorInstance.selection.insertHTML(`<img src="${url}" alt="${safeAlt}" style="max-width:100%;height:auto;" />`);
          } else {
            editorInstance.selection.insertHTML(`<video controls playsinline preload="metadata" contenteditable="false" src="${url}" style="max-width:100%;height:auto;display:block;"></video>`);
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

  // ---- Config Jodit (identique à la création) ----
  const joditConfig = useMemo(
    () => ({
      autofocus: true,
      spellcheck: true,
      width: '100%',
      height: 400,
      placeholder: 'Rédigez votre contenu ici...',
      style: {
        maxWidth: '100%',
        width: '100%',
        boxSizing: 'border-box',
        overflowWrap: 'anywhere',
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap',
      } as React.CSSProperties,
      safeJavaScriptLink: true,
      // @ts-ignore
      link: {
        processPastedLink: true,
        openInNewTabCheckbox: true,
        followOnDblClick: true,
      },
      // @ts-ignore
      allowTags: {
        video: [
          'controls', 'src', 'poster', 'preload', 'autoplay', 'loop', 'muted',
          'playsinline', 'width', 'height', 'style', 'contenteditable'
        ],
        source: ['src', 'type']
      },
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

  // ---- Helpers formulaire ----
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

  const handleEditorChange = useCallback((content: string) => {
    editorContentRef.current = content;
  }, []);

  const handleEditorBlur = useCallback((content: string) => {
    let fixed = ensureLinksOpenNewTab(content);
    fixed = ensureMediaPlayable(fixed);
    editorContentRef.current = fixed;
    setFormData(prev => ({ ...prev, contenu: fixed }));
    if (errors.contenu) setErrors(prev => ({ ...prev, contenu: '' }));
  }, [ensureLinksOpenNewTab, ensureMediaPlayable, errors.contenu]);

  // ---- Image principale (upload direct) ----
  const onClickSelectCover = useCallback(() => {
    coverInputRef.current?.click();
  }, []);

  const handlePrimaryImageFile = useCallback(async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Veuillez sélectionner un fichier image.'); return; }
    if (file.size > MAX_CLIENT_IMAGE_SIZE) {
      const mb = (MAX_CLIENT_IMAGE_SIZE / (1024 * 1024)).toFixed(0);
      alert(`L’image est trop volumineuse. Taille max: ${mb} Mo.`);
      return;
    }

    setIsUploadingCover(true);
    try {
      // si on avait déjà une image uploadée pendant cette session, on tente de la supprimer
      if (uploadedCoverFilename) {
        try { await fetch(`/api/upload/image?filename=${encodeURIComponent(uploadedCoverFilename)}`, { method: 'DELETE' }); } catch {}
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
  }, [getToken, uploadedCoverFilename]);

  const onCoverChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handlePrimaryImageFile(file);
    e.target.value = '';
  }, [handlePrimaryImageFile]);

  const handleRemoveCover = useCallback(async () => {
    if (!formData.image) return;
    if (uploadedCoverFilename) {
      try { await fetch(`/api/upload/image?filename=${encodeURIComponent(uploadedCoverFilename)}`, { method: 'DELETE' }); } catch {}
      setUploadedCoverFilename(null);
    }
    setFormData(prev => ({ ...prev, image: '' }));
  }, [formData.image, uploadedCoverFilename]);

  // ---- Charger l’actualité ----
  useEffect(() => {
    const loadActualite = async () => {
      try {
        const response = await fetch(`/api/actualites/${actualiteId}`);
        if (!response.ok) throw new Error('Chargement impossible');
        const data = await response.json();

        // nettoyer/sécuriser le contenu entrant pour l’éditeur
        const initialContent = ensureMediaPlayable(ensureLinksOpenNewTab(data.contenu || data.content || ''));

        setFormData({
          titre: data.titre || data.title || '',
          description: data.description || '',
          contenu: initialContent,
          statut: data.statut || data.status || 'Brouillon',
          datePublication: data.date_publication ? new Date(data.date_publication).toISOString().split('T')[0] : '',
          categorie: data.type || 'administratif',
          image: data.image || '',
          tags: data.tags || [],
          lieu: data.lieu || data.location || '',
          places_disponibles: data.places_disponibles?.toString() || data.places?.toString() || '',
          inscription_requise: data.inscription_requise || data.hasRegistration || false
        });

        editorContentRef.current = initialContent;

        // si l’image vient de /uploads/images, on récupère le filename pour pouvoir la supprimer si on la remplace
        if (data.image && typeof data.image === 'string') {
          const match = /\/uploads\/images\/([^\/?#]+)/.exec(data.image);
          if (match) setUploadedCoverFilename(match[1]);
        }
      } catch (e) {
        console.error(e);
        router.push('/administrateur?tab=actualites');
      } finally {
        setLoading(false);
      }
    };

    if (actualiteId) loadActualite();
  }, [actualiteId, router, ensureLinksOpenNewTab, ensureMediaPlayable]);

  // ---- Validation + sauvegarde ----
  const validateForm = () => {
    const newErrors: Errors = {};
    if (!formData.titre.trim()) newErrors.titre = 'Le titre est requis';
    if (!formData.description.trim()) newErrors.description = 'La description est requise';
    if (!formData.contenu || isHtmlEmpty(formData.contenu)) newErrors.contenu = 'Le contenu est requis';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (forceStatut: 'Brouillon' | 'Publié' | null = null) => {
    // sécuriser le dernier contenu avant envoi
    let safeContent = editorContentRef.current ?? formData.contenu;
    safeContent = ensureMediaPlayable(ensureLinksOpenNewTab(safeContent));

    const ok = validateForm();
    if (!ok) return;

    setIsLoading(true);
    try {
      const payload = {
        titre: formData.titre.trim(),
        description: formData.description.trim(),
        contenu: safeContent,
        type: formData.categorie,
        statut: (forceStatut || formData.statut) as 'Brouillon' | 'Publié',
        image: formData.image.trim() || null,
        date_publication: ((forceStatut || formData.statut) === 'Publié') ? formData.datePublication : null,
        tags: formData.tags.length > 0 ? formData.tags : [],
        lieu: formData.lieu.trim() || null,
        places_disponibles: formData.places_disponibles ? parseInt(formData.places_disponibles, 10) : null,
        inscription_requise: formData.inscription_requise
      };

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const token = getToken?.();
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/actualites/${actualiteId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Erreur ${res.status}`);

      router.push('/administrateur?tab=actualites');
    } catch (e: any) {
      alert(e?.message || 'Erreur lors de la mise à jour');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = () => handleSave('Publié');
  const handleSaveDraft = () => handleSave('Brouillon');

  // ---- UI ----
  if (loading) {
    return (
      <div className="bg-gray-50 min-h-screen font-sans">
        <div className="max-w-7xl mx-auto p-8">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '16rem' }}>
            <div className={styles.loadingSpinner} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <div className="max-w-7xl mx-auto p-8">
        <div className={styles.header}>
          <Link href="/administrateur?tab=actualites" className={styles.backButton}>
            <ArrowLeft className={styles.backIcon} />
            Retour
          </Link>

          <div className={styles.titleSection}>
            <h1 className={styles.pageTitle}>Modifier l&apos;actualité</h1>
            <p className={styles.pageSubtitle}>Modifiez votre article existant</p>
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
              <p className={styles.sectionSubtitle}>Modifiez le titre et le contenu de votre actualité</p>

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
                {errors.titre && <span className={styles.errorMessage}>{errors.titre}</span>}
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
                {errors.description && <span className={styles.errorMessage}>{errors.description}</span>}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Contenu <span className={styles.required}>*</span>
                </label>

                <div
                  className={styles.joditFix}
                  style={{
                    maxWidth: '100%',
                    overflow: 'hidden',
                    borderRadius: '.375rem',
                    border: errors.contenu ? '1px solid #ef4444' : '1px solid transparent',
                  }}
                >
                  <JoditEditor
                    value={formData.contenu}
                    onChange={handleEditorChange}
                    onBlur={handleEditorBlur}
                    // @ts-ignore
                    config={joditConfig}
                  />
                </div>

                {errors.contenu && <span className={styles.errorMessage}>{errors.contenu}</span>}
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

              {/* input fichier caché */}
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
              <p className={styles.sectionSubtitle}>Ne pas toucher cette section.</p>

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
      </div>
    </div>
  );
};

export default ModifierActualite;
