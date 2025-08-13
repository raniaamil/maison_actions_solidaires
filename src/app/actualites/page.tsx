'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './actualites.module.css';

interface Article {
  id: number;
  type: 'événement' | 'témoignage' | 'numérique' | 'administratif' | 'soutien' | 'bien-être' | 'junior';
  titre: string;
  title?: string; // Alias pour compatibilité
  description: string;
  date_creation?: string;
  date?: string; // Alias pour compatibilité
  date_modification?: string;
  updatedDate?: string; // Alias pour compatibilité
  auteur: {
    prenom: string;
    nom: string;
  };
  author?: { // Alias pour compatibilité
    firstName: string;
    lastName: string;
  };
  image: string;
  lieu?: string;
  location?: string; // Alias pour compatibilité
  places_disponibles?: number;
  places?: number; // Alias pour compatibilité
  inscription_requise?: boolean;
  hasRegistration?: boolean; // Alias pour compatibilité
}

const Page: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les actualités depuis l'API
  useEffect(() => {
    const loadActualites = async () => {
      try {
        const response = await fetch('/api/actualites?statut=Publié');
        if (response.ok) {
          const data = await response.json();
          setArticles(data);
        } else {
          setError('Erreur lors du chargement des actualités');
        }
      } catch (error) {
        console.error('Erreur:', error);
        setError('Erreur de connexion');
      } finally {
        setLoading(false);
      }
    };

    loadActualites();
  }, []);

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
      return dateString; // Retourner la chaîne originale si le parsing échoue
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = '/images/actualites/default.jpg';
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Nos Actualités</h1>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem 0' }}>
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

  if (error) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Nos Actualités</h1>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '3rem 0', 
          textAlign: 'center' 
        }}>
          <p style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#2563eb',
              color: 'white',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Nos Actualités</h1>
      
      {articles.length === 0 ? (
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          padding: '3rem 0', 
          textAlign: 'center' 
        }}>
          <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>
            Aucune actualité publiée pour le moment.
          </p>
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.5rem' }}>
            Revenez bientôt pour découvrir nos dernières nouvelles !
          </p>
        </div>
      ) : (
        <div className={styles.articlesGrid}>
          {articles.map((article) => (
            <article key={article.id} className={styles.articleCard}>
              <Link href={`/actualites/${article.id}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                <div className={styles.imageContainer}>
                  <img 
                    src={article.image || '/images/actualites/default.jpg'} 
                    alt={article.titre || article.title}
                    className={styles.articleImage}
                    onError={handleImageError}
                  />
                  <span className={`${styles.typeTag} ${getTypeColor(article.type)}`}>
                    {article.type}
                  </span>
                </div>
                
                <div className={styles.cardContent}>
                  <div className={styles.dateContainer}>
                    <span className={styles.clockIcon}>🕐</span>
                    <span className={styles.date}>
                      {formatDate(article.date_creation || article.date || '')}
                    </span>
                  </div>
                  
                  <h2 className={styles.articleTitle}>
                    {article.titre || article.title}
                  </h2>
                  
                  <p className={styles.articleDescription}>{article.description}</p>
                  
                  <div className={styles.articleMeta}>
                    <div className={styles.authorInfo}>
                      <span className={styles.authorName}>
                        {article.auteur ? 
                          `${article.auteur.prenom} ${article.auteur.nom}` : 
                          `${article.author?.firstName} ${article.author?.lastName}`
                        }
                      </span>
                    </div>
                    
                    {(article.date_modification || article.updatedDate) && (
                      <div className={styles.updatedDate}>
                        Mis à jour le {formatDate(article.date_modification || article.updatedDate || '')}
                      </div>
                    )}
                  </div>

                  {/* Informations pour les événements */}
                  {(article.lieu || article.location || article.places_disponibles || article.places) && (
                    <div className={styles.eventDetails}>
                      {(article.lieu || article.location) && (
                        <div className={styles.location}>
                          <span className={styles.locationIcon}>📍</span>
                          <span>{article.lieu || article.location}</span>
                        </div>
                      )}
                      {(article.places_disponibles || article.places) && (
                        <div className={styles.places}>
                          <span className={styles.placesIcon}>👥</span>
                          <span>{article.places_disponibles || article.places} places</span>
                        </div>
                      )}
                    </div>
                  )}

                  {(article.inscription_requise || article.hasRegistration) && (
                    <button 
                      className={styles.registerButton} 
                      onClick={(e) => {
                        e.preventDefault();
                        // Logique d'inscription à implémenter
                        alert('Fonctionnalité d\'inscription en cours de développement');
                      }}
                    >
                      S'inscrire
                    </button>
                  )}
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default Page;