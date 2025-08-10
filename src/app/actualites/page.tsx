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

  if (loading) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Nos Actualités</h1>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Nos Actualités</h1>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-gray-600 text-lg">Aucune actualité publiée pour le moment.</p>
          <p className="text-gray-500 text-sm mt-2">Revenez bientôt pour découvrir nos dernières nouvelles !</p>
        </div>
      ) : (
        <div className={styles.articlesGrid}>
          {articles.map((article) => (
            <article key={article.id} className={styles.articleCard}>
              <Link href={`/actualites/${article.id}`} className="block">
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
                
                <div className={styles.cardContent}>
                  <div className={styles.dateContainer}>
                    <span className={styles.clockIcon}>🕐</span>
                    <span className={styles.date}>
                      {formatDate(article.date_creation || article.date)}
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
                        Mis à jour le {formatDate(article.date_modification || article.updatedDate)}
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
                    <button className={styles.registerButton} onClick={(e) => e.preventDefault()}>
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