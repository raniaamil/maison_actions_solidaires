import styles from './nosactions.module.css';

export default function NosActionsPage() {
  const poles = [
    {
      id: 'numerique',
      icon: 'N',
      title: 'Pôle Numérique',
      items: [
        'Initiation informatique pour les novices',
        'Utilisation des outils bureautiques (Word, Excel, etc.)',
        'Création et gestion de comptes administratifs en ligne',
        'Rédaction et envoi de courriels',
        'Assistance dans les démarches complexes'
      ],
      objectif: {
        title: 'Objectif 2025',
        description: 'Doubler le nombre de bénéficiaires formés en informatique (50 bénéficiaires)'
      }
    },
    {
      id: 'administratif',
      icon: 'A',
      title: 'Pôle Administratif',
      items: [
        'Accompagnement individualisé',
        'Permanence MDPH',
        'Remplissage de dossiers administratifs',
        'Vérification et suivi des demandes',
        'Accompagnement à la domiciliation administrative'
      ],
      objectif: {
        title: 'Services spécialisés',
        description: 'Domiciliation pour les personnes sans domicile stable'
      }
    },
    {
      id: 'soutien',
      icon: 'S',
      title: 'Pôle Soutien',
      items: [
        'Plateforme d\'écoute téléphonique',
        'Orientation vers les structures adaptées',
        'Groupes de parole thématiques',
        'Accompagnement psychologique individuel',
        'Cours de langue française'
      ],
      objectif: {
        title: 'Objectif 2025',
        description: '75 appels mensuels et 15 séances individuelles avec psychologue'
      }
    },
    {
      id: 'bien-etre',
      icon: 'B',
      title: 'Pôle Bien-être',
      items: [
        'Ateliers de relaxation et musicothérapie',
        'Formation aux techniques de gestion du stress',
        'Prévention du burn-out des aidants',
        'Conférences santé animées par des professionnels',
        'Soutien holistique : diététique, danse, art-thérapie'
      ],
      objectif: {
        title: 'Approche globale',
        description: 'Soutien physique, mental et émotionnel adapté'
      }
    },
    {
      id: 'junior',
      icon: 'J',
      title: 'Pôle Junior',
      items: [
        'Accompagnement AESH personnalisé',
        'Ateliers éducatifs et ludiques adaptés',
        'Stimulation de la créativité et des capacités cognitives',
        'Événements inclusifs et sorties collectives',
        'Sensibilisation à la diversité'
      ],
      objectif: {
        title: 'Mission',
        description: 'Favoriser l\'inclusion des enfants à besoins spécifiques'
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
              <div className={styles.poleIcon}>{pole.icon}</div>
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
          ))}
        </div>
      </div>
    </div>
  );
}