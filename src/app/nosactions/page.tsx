import Image from 'next/image';
import styles from './nosactions.module.css';

export default function NosActionsPage() {
  const poles = [
    {
      id: 'numerique',
      icon: '/images/nosactions/pôle-numérique.jpg',
      title: 'Pôle Numérique',
      items: [
        'Initiation informatique pour les novices',
        'Utilisation des outils bureautiques (Word, Excel, etc.)',
        'Création et gestion de comptes administratifs en ligne (CAF, MDPH)',
        'Rédaction et envoi de courriels',
        'Assistance dans les démarches complexes (dossiers MDPH, déclarations en ligne)'
      ],
      objectif: {
        title: 'Objectif',
        description: 'Doubler le nombre de bénéficiaires formés en informatique (50 bénéficiaires), augmenter la fréquence des ateliers et aménager une salle informatique dédiée'
      }
    },
    {
      id: 'administratif',
      icon: '/images/nosactions/pôle-administratif.jpg',
      title: 'Pôle Administratif',
      items: [
        'Accompagnement individualisé',
        'Permanence MDPH pour accompagnement et vérification des dossiers',
        'Remplissage de dossiers administratifs (MDPH, CAF, sécurité sociale)',
        'Vérification et suivi des demandes',
        'Accompagnement à la domiciliation administrative (sous réserve d\'un local fixe)'
      ],
      objectif: {
        title: 'Services spécialisés',
        description: 'Domiciliation pour les personnes sans domicile stable et renfort de personnel administratif (conseiller en autonomie)'
      }
    },
    {
      id: 'soutien',
      icon: '/images/nosactions/pôle-soutien.jpg',
      title: 'Pôle Soutien',
      items: [
        'Plateforme d\'écoute téléphonique pour aidants en burnout',
        'Orientation vers les structures adaptées',
        'Groupes de parole thématiques (épuisement parental, etc.)',
        'Accompagnement psychologique individuel (15 séances avec psychologue)',
        'Cours de langue française et aide aux devoirs'
      ],
      objectif: {
        title: 'Objectif',
        description: '75 appels mensuels, 2 groupes de parole mensuels avec 8 participants et développement de cercles de parole thématiques'
      }
    },
    {
      id: 'bien-etre',
      icon: '/images/nosactions/pôle-bien-être.jpg',
      title: 'Pôle Bien-être',
      items: [
        'Ateliers de relaxation et musicothérapie',
        'Formation aux techniques de gestion du stress',
        'Prévention du burn-out des aidants avec sessions de sensibilisation',
        'Conférences santé animées par des professionnels',
        'Soutien holistique : diététique, danse, art-thérapie'
      ],
      objectif: {
        title: 'Approche globale',
        description: 'Soutien physique, mental et émotionnel adapté avec espaces calmes et intervenants spécialisés'
      }
    },
    {
      id: 'familles',
      icon: '/images/nosactions/pôle-junior.jpg',
      title: 'Pôle Familles',
      items: [
        'Accompagnement AESH personnalisé pour enfants à besoins spécifiques',
        'Ateliers éducatifs et ludiques adaptés pour stimuler créativité et capacités cognitives',
        'Atelier "Découverte des métiers" par jeu de rôle avec expériences sensorielles',
        'Événements inclusifs et sorties collectives',
        'Sensibilisation à la diversité pour favoriser l\'inclusion'
      ],
      objectif: {
        title: 'Mission',
        description: 'Favoriser l\'inclusion des enfants à besoins spécifiques, stimuler la curiosité et créer du lien intergénérationnel'
      }
    }
  ];

  return (
    <div className={styles.nosActionsBody}>
      <div className={styles.nosActionsContainer}>
        <div className={styles.nosActionsHeader}>
          <h1>Nos Actions</h1>
          <p>
            Découvrez nos 5 pôles d&apos;intervention dédiés à l&apos;amélioration de l&apos;inclusion, 
            de l&apos;autonomie et du bien-être des personnes en situation de handicap, des personnes âgées, 
            des aidants et des familles.
          </p>
        </div>

        <div className={styles.polesGrid}>
          {poles.map((pole) => (
            <div key={pole.id} className={`${styles.poleCard} ${styles[`pole${pole.id.charAt(0).toUpperCase() + pole.id.slice(1).replace('-', '')}`]}`}>
              <div className={styles.poleImageContainer}>
                <Image
                  src={pole.icon}
                  alt={`${pole.title}`}
                  width={400}
                  height={180}
                  className={styles.poleImage}
                />
              </div>
              <div className={styles.poleCardContent}>
                <h3>{pole.title}</h3>
                <ul>
                  {pole.items.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
                <div className={styles.objectif}>
                  <h4>{pole.objectif.title}</h4>
                  <p>{pole.objectif.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Section Appel à l'action */}
        <div className={styles.ctaSection}>
          <h2>Agissons Ensemble !</h2>
          <p>
            Chaque jour, notre association agit pour briser l'isolement, renforcer l'autonomie 
            et promouvoir le bien-être à travers des activités inclusives et adaptées.
          </p>
          <a href="/contact" className={styles.nosActionsBtn}>
            Nous soutenir
          </a>
        </div>
      </div>
    </div>
  );
}