'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './actualites.module.css';

interface Article {
  id: number;
  type: 'événement' | 'témoignage' | 'numérique' | 'administratif' | 'soutien' | 'bien-être' | 'junior';
  titre: string;
  title?: string;
  description: string;
  date_creation?: string;
  date?: string;
  date_modification?: string;
  updatedDate?: string;
  auteur: {
    prenom: string;
    nom: string;
  };
  author?: {
    firstName: string;
    lastName: string;
  };
  image: string;
  lieu?: string;
  location?: string;
  places_disponibles?: number;
  places?: number;
  inscription_requise?: boolean;
  hasRegistration?: boolean;
}

const Page: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // États des filtres
  const [selectedCategory, setSelectedCategory] = useState<string>('toutes');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('toutes');

  // Options des filtres
  const categories = [
    { value: 'toutes', label: 'Toutes les catégories' },
    { value: 'numérique', label: 'Numérique' },
    { value: 'administratif', label: 'Administratif' },
    { value: 'soutien', label: 'Soutien' },
    { value: 'bien-être', label: 'Bien-être' },
    { value: 'junior', label: 'Junior' },
    { value: 'événement', label: 'Événement' },
    { value: 'témoignage', label: 'Témoignage' }
  ];

  const dateFilters = [
    { value: 'toutes', label: 'Toutes les dates' },
    { value: 'semaine', label: 'Cette semaine' },
    { value: 'mois', label: 'Ce mois' },
    { value: 'trimestre', label: 'Ce trimestre' }
  ];

  // Charger les actualités depuis l'API
  useEffect(() => {
    const loadActualites = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/actualites?statut=Publié', {
          cache: 'no-store'
        });
        
        if (response.ok) {
          const data = await response.json();
          setArticles(data);
          setFilteredArticles(data);
        } else {
          setError('Erreur lors du chargement des actualités');
        }
      } catch (error) {
        setError('Erreur de connexion');
      } finally {
        setLoading(false);
      }
    };

    loadActualites();
  }, []);

  // Fonction pour filtrer les articles
  useEffect(() => {
    let filtered = [...articles];

    // Filtre par catégorie
    if (selectedCategory !== 'toutes') {
      filtered = filtered.filter(article => article.type === selectedCategory);
    }

    // Filtre par date
    if (selectedDateFilter !== 'toutes') {
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);

      filtered = filtered.filter(article => {
        const articleDate = new Date(article.date_creation || article.date || '');
        
        switch (selectedDateFilter) {
          case 'semaine':
            return articleDate >= startOfWeek;
          case 'mois':
            return articleDate >= startOfMonth;
          case 'trimestre':
            return articleDate >= startOfQuarter;
          default:
            return true;
        }
      });
    }

    setFilteredArticles(filtered);
  }, [articles, selectedCategory, selectedDateFilter]);

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

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = '/images/actualites/default.jpg';
  };

  const resetFilters = () => {
    setSelectedCategory('toutes');
    setSelectedDateFilter('toutes');
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.contentWrapper}>
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
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.contentWrapper}>
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
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <h1 className={styles.title}>Nos Actualités</h1>
        
{/* Section des filtres */}
        <div className={styles.filtersSection}>
          <div className={styles.filtersContainer}>
            <div className={styles.filtersLeft}>
              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Catégorie :</label>
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={styles.filterSelect}
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label className={styles.filterLabel}>Période :</label>
                <select 
                  value={selectedDateFilter} 
                  onChange={(e) => setSelectedDateFilter(e.target.value)}
                  className={styles.filterSelect}
                >
                  {dateFilters.map(filter => (
                    <option key={filter.value} value={filter.value}>
                      {filter.label}
                    </option>
                  ))}
                </select>
              </div>

              <button 
                onClick={resetFilters}
                className={styles.resetButton}
              >
                Réinitialiser
              </button>
            </div>

            {/* Compteur de résultats */}
            <div className={styles.resultsCounter}>
              {filteredArticles.length} actualité{filteredArticles.length !== 1 ? 's' : ''} trouvée{filteredArticles.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        
        {filteredArticles.length === 0 ? (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            padding: '3rem 0', 
            textAlign: 'center' 
          }}>
            <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>
              Aucune actualité ne correspond à vos critères.
            </p>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Essayez de modifier vos filtres ou de les réinitialiser.
            </p>
          </div>
        ) : (
          <div className={styles.articlesGrid}>
            {filteredArticles.map((article) => (
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
                  </div>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Page;