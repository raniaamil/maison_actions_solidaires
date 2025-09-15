'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';

interface Article {
  id: number;
  type?: string;
  titre?: string;
  title?: string;
  description?: string;
  date_creation?: string;
  date?: string;
  auteur?: {
    prenom?: string;
    nom?: string;
  };
  author?: {
    firstName?: string;
    lastName?: string;
  };
  image?: string;
  [key: string]: any;
}

const HomePage: React.FC = () => {
  const [latestArticles, setLatestArticles] = useState<Article[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Animation au scroll
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add(styles.visible);
        }
      });
    }, observerOptions);

    document.querySelectorAll(`.${styles.animateOnScroll}`).forEach(el => {
      observer.observe(el);
    });

    // Smooth scroll
    const handleSmoothScroll = (e: Event) => {
      const target = e.target as HTMLAnchorElement;
      const href = target.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const targetElement = document.querySelector(href);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    };

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', handleSmoothScroll);
    });

    return () => {
      observer.disconnect();
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.removeEventListener('click', handleSmoothScroll);
      });
    };
  }, []);

  // Récupérer les actualités
  useEffect(() => {
    const loadLatestArticles = async () => {
      try {
        setLoadingArticles(true);
        setFetchError(null);

        const response = await fetch('/api/actualites?statut=Publié&limit=3', {
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const data = await response.json();

          if (Array.isArray(data) && data.length > 0) {
            const validArticles = data.filter((article: Article) => {
              const hasTitle = !!(article.titre || article.title);
              const hasDescription = !!article.description;
              return hasTitle && hasDescription;
            });

            const sorted = validArticles
              .sort((a: Article, b: Article) => {
                const dateA = new Date(a.date_creation || a.date || '1970-01-01').getTime();
                const dateB = new Date(b.date_creation || b.date || '1970-01-01').getTime();
                return dateB - dateA;
              })
              .slice(0, 3);

            setLatestArticles(sorted);
          } else {
            setLatestArticles([]);
          }
        } else {
          const errorText = await response.text().catch(() => 'Erreur inconnue');
          setFetchError(`Erreur lors du chargement des actualités (${response.status})`);
          console.error('Erreur API:', response.status, response.statusText, errorText);
        }
      } catch (error) {
        console.error('Erreur réseau:', error);
        setFetchError('Erreur de connexion au serveur');
      } finally {
        setLoadingArticles(false);
      }
    };

    loadLatestArticles();
  }, []);

  const getTypeColor = (type?: string) => {
    if (!type) return '';
    switch (type) {
      case 'numérique': return styles.categoryNumerique;
      case 'administratif': return styles.categoryAdministratif;
      case 'soutien': return styles.categorySoutien;
      case 'bien-être': return styles.categoryBienEtre;
      case 'junior': return styles.categoryJunior;
      case 'événement': return styles.categoryEvenement;
      case 'témoignage': return styles.categoryTemoignage;
      default: return '';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Date inconnue';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      return date.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return 'Date invalide';
    }
  };

  const getAuthorName = (article: Article) => {
    if (article.auteur?.prenom && article.auteur?.nom) {
      return `${article.auteur.prenom} ${article.auteur.nom}`;
    }
    if (article.author?.firstName && article.author?.lastName) {
      return `${article.author.firstName} ${article.author.lastName}`;
    }
    return 'Équipe MAS';
  };

  return (
    <div className={styles.homePage}> 
      {/* Bannière Hero */}
      <section className={styles.heroBanner}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Maison d'Actions Solidaires</h1>
          <p className={styles.heroSubtitle}>
            Ensemble, nous créons un monde plus inclusif où chacun trouve sa place, son autonomie et son bien-être
          </p>
          <div className={styles.heroCta}>
            <Link href="/nosactions" className={`${styles.btn} ${styles.btnPrimary}`}>
              Découvrir nos actions
            </Link>
            <Link href="/contact" className={`${styles.btn} ${styles.btnSecondary}`}>
              Nous rejoindre
            </Link>
          </div>
        </div>
      </section>

      {/* Section Mission */}
      <section id="mission" className={styles.missionSection}>
        <div className={styles.container}>
          <div className={`${styles.sectionHeader} ${styles.animateOnScroll}`}>
            <h2 className={styles.sectionTitle}>Notre Mission</h2>
            <p className={styles.sectionDescription}>
              Basée à Champigny-sur-Marne, l'association Maison d'Actions Solidaires s'engage à créer un environnement inclusif et bienveillant pour tous. Nous développons des actions concrètes pour répondre aux besoins spécifiques de chaque personne accompagnée.
            </p>
          </div>

          <div className={styles.valuesGrid}>
            <div className={`${styles.valueCard} ${styles.animateOnScroll}`}>
              <div className={styles.valueIcon}>🤗</div>
              <h3 className={styles.valueTitle}>Inclusion</h3>
              <p className={styles.valueDesc}>
                Nous croyons en une société où chacun trouve sa place, quels que soient ses défis ou ses différences.
              </p>
            </div>
            <div className={`${styles.valueCard} ${styles.animateOnScroll}`}>
              <div className={styles.valueIcon}>🌱</div>
              <h3 className={styles.valueTitle}>Autonomie</h3>
              <p className={styles.valueDesc}>
                Nous accompagnons chaque personne vers plus d'indépendance et de confiance en soi.
              </p>
            </div>
            <div className={`${styles.valueCard} ${styles.animateOnScroll}`}>
              <div className={styles.valueIcon}>🤝</div>
              <h3 className={styles.valueTitle}>Solidarité</h3>
              <p className={styles.valueDesc}>
                Nous favorisons l'entraide et le soutien mutuel au sein de notre communauté.
              </p>
            </div>
            <div className={`${styles.valueCard} ${styles.animateOnScroll}`}>
              <div className={styles.valueIcon}>💝</div>
              <h3 className={styles.valueTitle}>Bienveillance</h3>
              <p className={styles.valueDesc}>
                Nous plaçons l'écoute, le respect et la compassion au cœur de toutes nos actions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section Actualités */}
      <section className={styles.newsSection}>
        <div className={styles.container}>
          <div className={`${styles.sectionHeader} ${styles.animateOnScroll}`}>
            <h2 className={styles.sectionTitle}>Nos Dernières Actualités</h2>
            <p className={styles.sectionDescription}>
              Restez informés de nos dernières actions, événements et témoignages
            </p>
          </div>

          {fetchError ? (
            <div style={{
              textAlign: 'center',
              color: '#dc2626',
              padding: '2rem 0',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '0.5rem',
              margin: '1rem 0'
            }}>
              <p style={{ margin: '0', fontWeight: '500' }}>
                {fetchError}
              </p>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#7f1d1d' }}>
                Veuillez réessayer plus tard ou contactez l'administrateur si le problème persiste.
              </p>
            </div>
          ) : loadingArticles ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem 0' }}>
              <div className={styles.spinner}></div>
              <span style={{ marginLeft: '1rem', color: '#6b7280' }}>
                Chargement des actualités...
              </span>
            </div>
          ) : latestArticles.length > 0 ? (
            <div
              className={styles.newsGrid}
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '2rem',
                marginTop: '3rem',
                minHeight: '400px',
                border: '2px dashed red',
                padding: '1rem'
              }}
            >
              {latestArticles.map((article, index) => (
                <article
                  key={article.id}
                  className={`${styles.newsCard} ${styles.animateOnScroll}`}
                  style={{
                    background: 'white',
                    borderRadius: '15px',
                    overflow: 'hidden',
                    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.08)',
                    minHeight: '400px',
                    display: 'block',
                    opacity: 1,
                    transform: 'translateY(0)',
                    border: `3px solid ${index === 0 ? 'blue' : index === 1 ? 'green' : 'purple'}`
                  }}
                >
                  <div
                    className={styles.newsImage}
                    style={{
                      position: 'relative',
                      height: '200px',
                      overflow: 'hidden',
                      backgroundColor: '#f3f4f6'
                    }}
                  >
                    <img
                      src={article.image || '/images/actualites/default.jpg'}
                      alt={article.titre || article.title || 'Article'}
                      width={400}
                      height={200}
                      className={styles.newsImg}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        console.warn('Erreur chargement image:', e.currentTarget.src);
                        e.currentTarget.src = '/images/actualites/default.jpg';
                      }}
                    />
                    {article.type && (
                      <span
                        className={`${styles.newsCategory} ${getTypeColor(article.type)}`}
                        style={{
                          position: 'absolute',
                          top: '12px',
                          left: '12px',
                          padding: '6px 12px',
                          borderRadius: '20px',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          textTransform: 'lowercase',
                          color: 'white',
                          backgroundColor: '#8b7355'
                        }}
                      >
                        {article.type}
                      </span>
                    )}
                  </div>
                  <div className={styles.newsContent} style={{ padding: '1.5rem' }}>
                    <div
                      className={styles.newsMeta}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1rem',
                        fontSize: '0.875rem',
                        color: '#6b7280'
                      }}
                    >
                      <span className={styles.newsDate} style={{ fontWeight: '500' }}>
                        {formatDate(article.date_creation || article.date)}
                      </span>
                      <span className={styles.newsAuthor} style={{ color: '#8b7355', fontWeight: '600' }}>
                        Par {getAuthorName(article)}
                      </span>
                    </div>
                    <h3
                      className={styles.newsTitle}
                      style={{
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        color: '#1f2937',
                        marginBottom: '1rem',
                        lineHeight: '1.4'
                      }}
                    >
                      {article.titre || article.title || 'Titre non disponible'}
                    </h3>
                    <p
                      className={styles.newsExcerpt}
                      style={{
                        color: '#4b5563',
                        lineHeight: '1.6',
                        marginBottom: '1.5rem',
                        fontSize: '0.95rem'
                      }}
                    >
                      {article.description || 'Description non disponible'}
                    </p>
                    <Link href={`/actualites/${article.id}`} className={styles.newsLink}>
                      <span className={styles.readMoreText}>Lire la suite</span>
                      <span className={styles.readMoreIcon}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '3rem 0',
              color: '#6b7280',
              backgroundColor: '#f9fafb',
              borderRadius: '0.5rem',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📰</div>
              <p style={{ fontSize: '1.125rem', fontWeight: '500', margin: '0 0 0.5rem 0' }}>
                Aucune actualité disponible pour le moment.
              </p>
              <p style={{ margin: '0', fontSize: '0.875rem' }}>
                Revenez bientôt pour découvrir nos dernières nouvelles !
              </p>
            </div>
          )}

          <div className={`${styles.newsCta} ${styles.animateOnScroll}`}>
            <Link href="/actualites" className={`${styles.btn} ${styles.btnSecondaryAlt}`}>
              Voir toutes les actualités
            </Link>
          </div>
        </div>
      </section>

      {/* Section Statistiques */}
      <section className={styles.statsSection}>
        <div className={styles.container}>
          <div className={`${styles.sectionHeader} ${styles.animateOnScroll}`}>
            <h2 className={`${styles.sectionTitle} ${styles.sectionTitleWhite}`}>
              Notre Impact en Chiffres
            </h2>
            <p className={`${styles.sectionDescription} ${styles.sectionDescriptionWhite}`}>
              Depuis notre création, nous nous engageons quotidiennement pour transformer des vies
            </p>
          </div>

          <div className={styles.statsGrid}>
            <div className={`${styles.statItem} ${styles.animateOnScroll}`}>
              <div className={styles.statNumber}>5</div>
              <div className={styles.statLabel}>Pôles d'Action</div>
            </div>
            <div className={`${styles.statItem} ${styles.animateOnScroll}`}>
              <div className={styles.statNumber}>50+</div>
              <div className={styles.statLabel}>Bénéficiaires</div>
            </div>
            <div className={`${styles.statItem} ${styles.animateOnScroll}`}>
              <div className={styles.statNumber}>75</div>
              <div className={styles.statLabel}>Appels mensuels</div>
            </div>
            {/* ✅ Carte ajoutée : 100% Bienveillance */}
            <div className={`${styles.statItem} ${styles.animateOnScroll}`}>
              <div className={styles.statNumber}>100%</div>
              <div className={styles.statLabel}>Bienveillance</div>
            </div>
          </div>
        </div>
      </section>

      {/* Section Call to Action */}
      <section className={styles.ctaSection}>
        <div className={styles.container}>
          <div className={`${styles.ctaContent} ${styles.animateOnScroll}`}>
            <h2 className={styles.ctaTitle}>Rejoignez Notre Mission</h2>
            <p className={styles.ctaText}>
              Ensemble, nous pouvons créer un monde plus inclusif. Découvrez comment vous pouvez nous aider à faire la différence dans la vie de personnes en situation de handicap, d'aidants et de familles.
            </p>
            <div className={styles.ctaButtons}>
              <Link href="/faireundon" className={`${styles.btn} ${styles.btnPrimary}`}>
                Faire un don
              </Link>
              <Link href="/association" className={`${styles.btn} ${styles.btnSecondaryAlt}`}>
                Découvrir l'équipe
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;