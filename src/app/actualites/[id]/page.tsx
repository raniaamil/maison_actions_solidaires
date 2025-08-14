'use client';

import React, { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import styles from './actualite.module.css';

interface Article {
  id: number;
  type: 'événement' | 'témoignage' | 'numérique' | 'administratif' | 'soutien' | 'bien-être' | 'junior';
  titre: string;
  title?: string;
  description: string;
  contenu: string;
  content?: string;
  date_creation: string;
  date?: string;
  date_modification?: string;
  updatedDate?: string;
  auteur: {
    prenom: string;
    nom: string;
    bio?: string;
  };
  author?: {
    firstName: string;
    lastName: string;
    bio?: string;
  };
  image: string;
  lieu?: string;
  places_disponibles?: number;
  inscription_requise?: boolean;
}

const Page: React.FC = () => {
  const params = useParams();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadArticle = async () => {
      try {
        const response = await fetch(`/api/actualites/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setArticle(data);
        } else if (response.status === 404) {
          setError('Article non trouvé');
        } else {
          setError('Erreur lors du chargement de l\'article');
        }
      } catch (error) {
        console.error('Erreur:', error);
        setError('Erreur de connexion');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadArticle();
    }
  }, [params.id]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'numérique':
        return styles.typeNumerique;
      case 'administratif':
        return styles.typeAdministratif;
      case 'soutien':
        return styles.typeSoutien;
      case 'bien-être':
        return styles.typeBienEtre;
      case 'junior':
        return styles.typeJunior;
      case 'événement':
        return styles.typeEvenement;
      case 'témoignage':
        return styles.typeTemoignage;
      default:
        return '';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('fr-FR');
    } catch {
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh' 
        }}>
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

  if (error || !article) {
    notFound();
  }

  return (
    <div className={styles.container}>
      {/* Breadcrumb */}
      <nav className={styles.breadcrumb}>
        <Link href="/actualites" className={styles.breadcrumbLink}>
          ← Retour aux actualités
        </Link>
      </nav>

      <article className={styles.article}>
        {/* Header de l'article */}
        <header className={styles.articleHeader}>
          <div className={styles.imageContainer}>
            <img 
              src={article.image || '/images/actualites/default.jpg'} 
              alt={article.titre || article.title}
              className={styles.articleImage}
              onError={(e) => {
                e.currentTarget.src = '/images/actualites/default.jpg';
              }}
            />
            <span className={`${styles.typeTag} ${getTypeColor(article.type)}`}>
              {article.type}
            </span>
          </div>

          <div className={styles.headerContent}>
            <h1 className={styles.articleTitle}>
              {article.titre || article.title}
            </h1>
            
            <div className={styles.articleMeta}>
              <div className={styles.dateContainer}>
                <span className={styles.date}>
                  Publié le {formatDate(article.date_creation || article.date || '')}
                </span>
                {(article.date_modification || article.updatedDate) && (
                  <span className={styles.updatedDate}>
                    • Mis à jour le {formatDate(article.date_modification || article.updatedDate || '')}
                  </span>
                )}
              </div>
              
              <div className={styles.authorContainer}>
                <div className={styles.authorInfo}>
                  <span className={styles.authorName}>
                    Par {article.auteur ? 
                      `${article.auteur.prenom} ${article.auteur.nom}` : 
                      `${article.author?.firstName} ${article.author?.lastName}`
                    }
                  </span>
                  {(article.auteur?.bio || article.author?.bio) && (
                    <span className={styles.authorBio}>
                      {article.auteur?.bio || article.author?.bio}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Informations pour les événements */}
            {(article.lieu || article.places_disponibles || article.inscription_requise) && (
              <div className={styles.eventInfo}>
                {article.lieu && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoIcon}>📍</span>
                    <span>Lieu : {article.lieu}</span>
                  </div>
                )}
                {article.places_disponibles && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoIcon}>👥</span>
                    <span>Places disponibles : {article.places_disponibles}</span>
                  </div>
                )}
                {article.inscription_requise && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoIcon}>✅</span>
                    <span>Inscription requise</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Contenu de l'article */}
        <div className={styles.articleContent}>
          <div className={styles.leadParagraph}>
            {article.description}
          </div>
          
          <div 
            className={styles.mainContent}
            dangerouslySetInnerHTML={{ 
              __html: article.contenu || article.content || '' 
            }}
          />
        </div>

        {/* Section d'inscription pour les événements */}
        {article.inscription_requise && (
          <div className={styles.registrationSection}>
            <h3>Inscription à l'événement</h3>
            <button 
              className={styles.registerButton}
              onClick={() => {
                alert('Fonctionnalité d\'inscription en cours de développement. Veuillez nous contacter par téléphone ou email.');
              }}
            >
              S'inscrire maintenant
            </button>
            <p className={styles.registrationNote}>
              Vous pouvez également nous contacter directement pour vous inscrire.
            </p>
          </div>
        )}
      </article>
    </div>
  );
};

export default Page;