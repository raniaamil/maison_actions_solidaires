import React from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import styles from './actualite.module.css';

interface Article {
  id: number;
  type: 'événement' | 'témoignage' | 'numérique' | 'administratif' | 'soutien' | 'bien-être' | 'junior';
  title: string;
  description: string;
  content: string;
  date: string;
  updatedDate?: string;
  author: {
    firstName: string;
    lastName: string;
    bio?: string;
  };
  image: string;
}

// Données simulées - en production, cela viendrait d'une API ou base de données
const articles: Article[] = [
  {
    id: 1,
    type: 'numérique',
    title: 'Atelier numérique : Découverte des tablettes',
    description: 'Un atelier interactif pour apprendre à utiliser les tablettes en toute autonomie. Places limitées !',
    content: `
      <p>Dans un monde de plus en plus connecté, savoir utiliser les outils numériques devient essentiel pour maintenir son autonomie et rester en contact avec ses proches. Notre atelier "Découverte des tablettes" s'adresse à toutes les personnes souhaitant s'initier ou perfectionner leur utilisation de ces appareils intuitifs.</p>
      
      <h3>Au programme de cet atelier :</h3>
      <ul>
        <li>Prise en main de la tablette : allumage, extinction, navigation de base</li>
        <li>Découverte de l'interface : icônes, applications, paramètres</li>
        <li>Navigation sur internet : recherche, consultation de sites</li>
        <li>Communication : emails, messagerie, appels vidéo</li>
        <li>Loisirs numériques : photos, musique, jeux simples</li>
        <li>Applications utiles au quotidien : météo, actualités, santé</li>
      </ul>
      
      <p>L'atelier se déroule en petit groupe pour permettre un accompagnement personnalisé. Chaque participant dispose d'une tablette pour la durée de la session. Nos animateurs expérimentés adaptent le rythme selon les besoins de chacun.</p>
      
      <h3>Pourquoi participer ?</h3>
      <p>Les tablettes offrent une interface simple et intuitive, parfaite pour débuter dans le numérique. Plus légères qu'un ordinateur portable, avec un écran tactile facile à utiliser, elles constituent souvent le premier pas idéal vers l'autonomie numérique.</p>
      
      <p>Nos participants repartent avec des fiches pratiques et la possibilité de poser leurs questions lors de nos permanences hebdomadaires.</p>
    `,
    date: '15 février 2024',
    author: {
      firstName: 'Sophie',
      lastName: 'Martin',
      bio: 'Animatrice numérique depuis 8 ans, Sophie accompagne les seniors dans leur découverte des outils digitaux.'
    },
    image: '/images/actualites/tablettes.jpg',
  },
  {
    id: 2,
    type: 'témoignage',
    title: 'Marie témoigne de son parcours',
    description: 'Après 6 mois d\'accompagnement, Marie retrouve confiance en elle et autonomie dans ses démarches administratives.',
    content: `
      <p><em>"Quand je suis arrivée ici il y a six mois, j'étais complètement perdue face à toutes ces démarches administratives dématérialisées. Aujourd'hui, je peux dire que j'ai retrouvé ma confiance et mon autonomie."</em></p>
      
      <p>Marie, 68 ans, nous livre son témoignage sur son parcours d'accompagnement au sein de notre association. Son histoire illustre parfaitement notre mission : redonner confiance et autonomie à chacun.</p>
      
      <h3>Le début des difficultés</h3>
      <p>Tout a commencé quand Marie a dû renouveler sa carte d'identité en ligne. <em>"Avant, on allait à la mairie avec ses papiers, et c'était fait. Maintenant, il faut tout faire sur internet, et moi, je ne comprenais rien à tous ces sites."</em></p>
      
      <p>Comme beaucoup de personnes de sa génération, Marie s'est retrouvée démunie face à la dématérialisation des services publics. Les démarches s'accumulent : impôts, sécurité sociale, retraite... tout semble exiger une maîtrise du numérique qu'elle n'avait pas.</p>
      
      <h3>L'accompagnement personnalisé</h3>
      <p>Orientée vers notre association par sa fille, Marie a d'abord été réticente. <em>"Je me disais que j'étais trop vieille pour apprendre tout ça."</em> Mais l'accueil chaleureux de notre équipe et l'approche progressive l'ont rapidement mise en confiance.</p>
      
      <p>Pendant six mois, Marie a bénéficié d'un accompagnement individuel hebdomadaire. Étape par étape, elle a appris à :</p>
      <ul>
        <li>Naviguer sur les sites administratifs</li>
        <li>Créer et gérer ses comptes en ligne</li>
        <li>Télécharger et envoyer des documents</li>
        <li>Utiliser sa messagerie électronique</li>
        <li>Effectuer ses démarches en toute sécurité</li>
      </ul>
      
      <h3>Une nouvelle autonomie</h3>
      <p><em>"Maintenant, je fais mes déclarations d'impôts toute seule, je consulte mes remboursements de sécurité sociale, et j'envoie même des emails à mes petits-enfants !"</em> raconte Marie avec fierté.</p>
      
      <p>Au-delà des compétences techniques, c'est surtout la confiance en elle que Marie a retrouvée. Elle participe désormais aux ateliers collectifs et n'hésite plus à explorer de nouvelles fonctionnalités.</p>
      
      <p><em>"Cette association m'a redonné mon indépendance. Je ne me sens plus exclue du monde moderne."</em></p>
    `,
    date: '10 février 2024',
    author: {
      firstName: 'Marie',
      lastName: 'Dubois',
      bio: 'Bénéficiaire de nos services depuis 6 mois, Marie souhaite partager son expérience pour encourager d\'autres personnes.'
    },
    image: '/images/actualites/vieilledame.jpg',
  },
  {
    id: 3,
    type: 'événement',
    title: 'Nouveau partenariat avec la Mairie',
    description: 'Signature d\'un partenariat pour étendre nos actions de soutien aux aidants sur tout le territoire communal.',
    content: `
      <p>C'est avec une grande fierté que nous annonçons la signature officielle d'un partenariat stratégique avec la Mairie de notre commune. Cette collaboration marque une étape importante dans le développement de nos actions de soutien aux aidants sur l'ensemble du territoire communal.</p>
      
      <h3>Un partenariat ambitieux</h3>
      <p>Signé en présence du Maire et de notre équipe dirigeante, ce partenariat vise à structurer et amplifier nos interventions auprès des aidants familiaux et professionnels. Il s'articule autour de plusieurs axes majeurs :</p>
      
      <ul>
        <li><strong>Extension géographique :</strong> Nos services seront désormais accessibles dans tous les quartiers de la commune</li>
        <li><strong>Diversification des lieux d'accueil :</strong> Utilisation des équipements municipaux pour nos ateliers</li>
        <li><strong>Communication renforcée :</strong> Diffusion de nos actions via les canaux municipaux</li>
        <li><strong>Formation des agents :</strong> Sensibilisation du personnel municipal aux enjeux de l'aide</li>
      </ul>
      
      <h3>De nouveaux services</h3>
      <p>Grâce à ce partenariat, nous pourrons proposer :</p>
      
      <p><strong>Des permanences de proximité :</strong> Une fois par semaine dans chaque quartier, pour rapprocher nos services des habitants.</p>
      
      <p><strong>Des ateliers décentralisés :</strong> Organisation de nos formations dans les centres sociaux, bibliothèques et salles communales.</p>
      
      <p><strong>Un dispositif d'urgence :</strong> Mise en place d'une ligne directe pour les situations d'aidants en détresse.</p>
      
      <p><strong>Des événements thématiques :</strong> Conférences et journées d'information sur les sujets liés à l'aide et à l'accompagnement.</p>
      
      <h3>Un engagement mutuel</h3>
      <p>La commune s'engage à mettre à disposition ses équipements et à faciliter nos démarches administratives. En contrepartie, notre association apporte son expertise et son réseau pour répondre aux besoins identifiés par les services municipaux.</p>
      
      <p>Ce partenariat s'inscrit dans une démarche de service public de proximité, où l'action associative complète l'offre municipale pour créer un écosystème de soutien cohérent et efficace.</p>
      
      <h3>Perspectives d'avenir</h3>
      <p>Cette collaboration ouvre de nouvelles perspectives pour notre association. Nous espérons que ce modèle pourra inspirer d'autres communes et contribuer à essaimer nos pratiques sur un territoire plus large.</p>
      
      <p>Les premiers effets de ce partenariat se feront sentir dès le mois prochain avec l'ouverture de deux nouvelles permanences et l'organisation du premier atelier décentralisé.</p>
    `,
    date: '8 février 2024',
    updatedDate: '12 février 2024',
    author: {
      firstName: 'Jean',
      lastName: 'Dupont',
      bio: 'Directeur de l\'association, Jean coordonne les partenariats institutionnels et le développement territorial.'
    },
    image: '/images/actualites/mairiechampigny.jpg',
  },
  {
    id: 4,
    type: 'bien-être',
    title: 'Groupe de parole : Burn-out parental',
    description: 'Un espace d\'écoute et d\'échange pour les parents en situation d\'épuisement. Animé par notre psychologue.',
    content: `
      <p>L'épuisement parental, communément appelé "burn-out parental", touche de plus en plus de familles. Face à ce constat, notre association propose un groupe de parole spécialement dédié aux parents en situation de détresse.</p>
      
      <h3>Comprendre le burn-out parental</h3>
      <p>Le burn-out parental se caractérise par un épuisement physique et émotionnel lié au rôle de parent. Il se manifeste par :</p>
      
      <ul>
        <li>Une fatigue extrême et persistante</li>
        <li>Une perte de plaisir dans la relation avec ses enfants</li>
        <li>Un sentiment d'inefficacité parentale</li>
        <li>Une distance émotionnelle avec ses enfants</li>
        <li>Des troubles du sommeil et de l'appétit</li>
      </ul>
      
      <p>Ce phénomène, longtemps tabou, est aujourd'hui reconnu comme un véritable enjeu de santé publique nécessitant un accompagnement spécialisé.</p>
      
      <h3>Un espace de parole bienveillant</h3>
      <p>Notre groupe de parole offre un cadre sécurisé où les parents peuvent :</p>
      
      <p><strong>Exprimer leurs difficultés sans jugement :</strong> Partager ses doutes, ses peurs et ses questionnements dans un environnement compréhensif.</p>
      
      <p><strong>Échanger avec d'autres parents :</strong> Découvrir qu'ils ne sont pas seuls et bénéficier de l'expérience d'autres familles.</p>
      
      <p><strong>Développer des stratégies d'adaptation :</strong> Apprendre des techniques de gestion du stress et de prévention de l'épuisement.</p>
      
      <p><strong>Retrouver confiance en leurs compétences parentales :</strong> Reconnaître leurs forces et leurs ressources.</p>
      
      <h3>Animation professionnelle</h3>
      <p>Les séances sont animées par Dr. Claire Rousseau, psychologue clinicienne spécialisée dans l'accompagnement des familles. Son approche combine :</p>
      
      <ul>
        <li>Techniques de régulation émotionnelle</li>
        <li>Outils de gestion du stress</li>
        <li>Exercices de mindfulness adaptés aux parents</li>
        <li>Stratégies de communication familiale</li>
      </ul>
      
      <h3>Modalités pratiques</h3>
      <p>Le groupe se réunit chaque mardi soir de 19h à 20h30, dans un format de 8 séances. L'effectif est volontairement limité à 8 participants pour favoriser la qualité des échanges.</p>
      
      <p>Chaque séance suit une structure définie :</p>
      <ul>
        <li>Temps d'accueil et de présentation (15 min)</li>
        <li>Partage d'expériences (45 min)</li>
        <li>Apport théorique ou exercice pratique (20 min)</li>
        <li>Synthèse et perspectives (10 min)</li>
      </ul>
      
      <h3>Un accompagnement complémentaire</h3>
      <p>Ce groupe de parole peut être complété par un suivi individuel si nécessaire. Notre psychologue peut également orienter vers d'autres professionnels en cas de besoins spécifiques.</p>
      
      <p>L'objectif est de permettre à chaque parent de retrouver un équilibre familial et de redécouvrir le plaisir d'être parent, tout en prenant soin de son propre bien-être.</p>
    `,
    date: '20 février 2024',
    author: {
      firstName: 'Dr. Claire',
      lastName: 'Rousseau',
      bio: 'Psychologue clinicienne spécialisée dans l\'accompagnement des familles et la prévention de l\'épuisement parental.'
    },
    image: '/images/actualites/burnoutparental.jpg',
  }
];

interface PageProps {
  params: {
    id: string;
  };
}

const Page: React.FC<PageProps> = ({ params }) => {
  const article = articles.find(a => a.id === parseInt(params.id));

  if (!article) {
    notFound();
  }

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
              src={article.image} 
              alt={article.title}
              className={styles.articleImage}
            />
            <span className={`${styles.typeTag} ${getTypeColor(article.type)}`}>
              {article.type}
            </span>
          </div>

          <div className={styles.headerContent}>
            <h1 className={styles.articleTitle}>{article.title}</h1>
            
            <div className={styles.articleMeta}>
              <div className={styles.dateContainer}>
                <span className={styles.clockIcon}>🕐</span>
                <span className={styles.date}>Publié le {formatDate(article.date)}</span>
                {article.updatedDate && (
                  <span className={styles.updatedDate}>
                    • Mis à jour le {formatDate(article.updatedDate)}
                  </span>
                )}
              </div>
              
              <div className={styles.authorContainer}>
                <div className={styles.authorInfo}>
                  <span className={styles.authorName}>
                    Par {article.author.firstName} {article.author.lastName}
                  </span>
                  {article.author.bio && (
                    <span className={styles.authorBio}>{article.author.bio}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Contenu de l'article */}
        <div className={styles.articleContent}>
          <div className={styles.leadParagraph}>
            {article.description}
          </div>
          
          <div 
            className={styles.mainContent}
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </div>
      </article>
    </div>
  );
};

export default Page;