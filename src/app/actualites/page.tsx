import React from 'react';
import styles from './actualites.module.css';

interface Article {
  id: number;
  type: 'événement' | 'témoignage' | 'numérique' | 'administratif' | 'soutien' | 'bien-être' | 'junior';
  title: string;
  description: string;
  date: string;
  updatedDate?: string;
  author: {
    firstName: string;
    lastName: string;
  };
  image: string;
  location?: string;
  places?: number;
  age?: number;
  hasRegistration?: boolean;
}

const Page: React.FC = () => {
  const articles: Article[] = [
    {
      id: 1,
      type: 'numérique',
      title: 'Atelier numérique : Découverte des tablettes',
      description: 'Un atelier interactif pour apprendre à utiliser les tablettes en toute autonomie. Places limitées !',
      date: '15 février 2024',
      author: {
        firstName: 'Sophie',
        lastName: 'Martin'
      },
      image: '/images/actualites/tablettes.jpg',
    },
    {
      id: 2,
      type: 'témoignage',
      title: 'Marie témoigne de son parcours',
      description: 'Après 6 mois d\'accompagnement, Marie retrouve confiance en elle et autonomie dans ses démarches administratives.',
      date: '10 février 2024',
      author: {
        firstName: 'Marie',
        lastName: 'Dubois'
      },
      image: '/images/actualites/vieilledame.jpg',
    },
    {
      id: 3,
      type: 'événement',
      title: 'Nouveau partenariat avec la Mairie',
      description: 'Signature d\'un partenariat pour étendre nos actions de soutien aux aidants sur tout le territoire communal.',
      date: '8 février 2024',
      updatedDate: '12 février 2024',
      author: {
        firstName: 'Jean',
        lastName: 'Dupont'
      },
      image: '/images/actualites/mairiechampigny.jpg',
    },
    {
      id: 4,
      type: 'bien-être',
      title: 'Groupe de parole : Burn-out parental',
      description: 'Un espace d\'écoute et d\'échange pour les parents en situation d\'épuisement. Animé par notre psychologue.',
      date: '20 février 2024',
      author: {
        firstName: 'Dr. Claire',
        lastName: 'Rousseau'
      },
      image: '/images/actualites/burnoutparental.jpg',
    }
  ];

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
    return dateString;
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Nos Actualités</h1>
      
      <div className={styles.articlesGrid}>
        {articles.map((article) => (
          <article key={article.id} className={styles.articleCard}>
            <div className={styles.imageContainer}>
              <img 
                src={article.image} 
                alt={article.title}
                className={styles.articleImage}
              />
              <span className={`${styles.typeTag} ${getTypeColor(article.type)}`}>
                {article.type}
              </span>
            </div>
            
            <div className={styles.cardContent}>
              <div className={styles.dateContainer}>
                <span className={styles.clockIcon}>🕐</span>
                <span className={styles.date}>{formatDate(article.date)}</span>
              </div>
              
              <h2 className={styles.articleTitle}>{article.title}</h2>
              
              <p className={styles.articleDescription}>{article.description}</p>
              
              <div className={styles.articleMeta}>
                <div className={styles.authorInfo}>
                  <span className={styles.authorName}>
                    {article.author.firstName} {article.author.lastName}
                  </span>
                </div>
                
                {article.updatedDate && (
                  <div className={styles.updatedDate}>
                    Mis à jour le {formatDate(article.updatedDate)}
                  </div>
                )}
              </div>
              {article.hasRegistration && (
                <button className={styles.registerButton}>
                  S'inscrire
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default Page;