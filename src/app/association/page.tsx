import React from 'react';
import styles from './association.module.css';

const MaisonActionsSolidaires = () => {
  return (
    <div className={styles.container}>
      {/* Section Hero avec image de fond */}
      <div className={styles.heroSection}>
        {/* Image de fond simulée avec gradient et overlay */}
        <div className={styles.heroBackground}>
          <div className={styles.heroOverlay}></div>
          <div className={styles.heroContent}>
            <div className={styles.heroText}>
              <h1 className={styles.heroTitle}>
                Ensemble pour l'inclusion et la solidarité
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Section Notre Mission */}
      <div className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          <h2 className={styles.sectionTitle}>
            Notre Mission
            <div className={styles.titleUnderline}></div>
          </h2>
          
          <p className={styles.sectionDescription}>
            L'association Maison d'Actions Solidaires s'engage à créer un environnement inclusif et bienveillant pour tous. Basée à 
            Champigny-sur-Marne, notre association développe des actions concrètes pour répondre aux besoins spécifiques de 
            chaque personne accompagnée.
          </p>

          {/* Section Nos Valeurs */}
          <h3 className={styles.subsectionTitle}>Nos Valeurs</h3>
          
          <div className={styles.valuesGrid}>
            <div className={styles.valueCard}>
              <h4 className={styles.valueTitle}>Inclusion</h4>
              <p className={styles.valueDescription}>
                Nous croyons en une société où chacun trouve sa place, quels que soient ses défis ou ses différences.
              </p>
            </div>
            
            <div className={styles.valueCard}>
              <h4 className={styles.valueTitle}>Autonomie</h4>
              <p className={styles.valueDescription}>
                Nous accompagnons chaque personne vers plus d'indépendance et de confiance en soi.
              </p>
            </div>
            
            <div className={styles.valueCard}>
              <h4 className={styles.valueTitle}>Solidarité</h4>
              <p className={styles.valueDescription}>
                Nous favorisons l'entraide et le soutien mutuel au sein de notre communauté.
              </p>
            </div>
            
            <div className={styles.valueCard}>
              <h4 className={styles.valueTitle}>Bienveillance</h4>
              <p className={styles.valueDescription}>
                Nous plaçons l'écoute, le respect et la compassion au cœur de toutes nos actions.
              </p>
            </div>
          </div>

          {/* Section Notre Équipe */}
          <h2 className={styles.sectionTitle}>
            Notre Équipe
            <div className={styles.titleUnderline}></div>
          </h2>
          
          <p className={styles.sectionDescription}>
            Notre équipe passionnée et dévouée met son expertise au service de notre mission commune. Chaque membre apporte ses 
            compétences uniques pour créer un accompagnement personnalisé et de qualité.
          </p>

          <div className={styles.teamGrid}>
            {/* Alvine NGUEMCHE */}
            <div className={styles.teamCard}>
              <div className={styles.teamAvatar}>
                <span className={styles.teamInitials}>AN</span>
              </div>
              <h4 className={styles.teamName}>Alvine NGUEMCHE</h4>
              <p className={styles.teamRole}>Présidente & Coordinatrice</p>
              <p className={styles.teamBio}>
                Passionnée par l'accompagnement social, Alvine pilote les projets de 
                l'association et coordonne les différents pôles d'activité. Elle veille à 
                ce que chaque action serve notre mission d'inclusion.
              </p>
            </div>

            {/* Marie ROUSSEAU */}
            <div className={styles.teamCard}>
              <div className={styles.teamAvatar}>
                <span className={styles.teamInitials}>MR</span>
              </div>
              <h4 className={styles.teamName}>Marie ROUSSEAU</h4>
              <p className={styles.teamRole}>Responsable Pôle Numérique</p>
              <p className={styles.teamBio}>
                Formatrice expérimentée en informatique, Marie anime nos 
                ateliers de formation numérique et accompagne les bénéficiaires vers 
                l'autonomie digitale. Elle développe des méthodes pédagogiques 
                adaptées à chacun.
              </p>
            </div>

            {/* Jean DUBOIS */}
            <div className={styles.teamCard}>
              <div className={styles.teamAvatar}>
                <span className={styles.teamInitials}>JD</span>
              </div>
              <h4 className={styles.teamName}>Jean DUBOIS</h4>
              <p className={styles.teamRole}>Psychologue & Coordinateur Pôle Soutien</p>
              <p className={styles.teamBio}>
                Psychologue clinicien spécialisé dans l'accompagnement des 
                aidants, Jean anime nos groupes de parole et assure le suivi 
                psychologique individuel. Il coordonne notre plateforme 
                d'écoute téléphonique.
              </p>
            </div>
          </div>

          {/* Section Notre Impact */}
          <h2 className={styles.sectionTitle}>
            Notre Impact
            <div className={styles.titleUnderline}></div>
          </h2>
          
          <p className={styles.sectionDescription}>
            Depuis notre création, nous nous engageons quotidiennement pour briser l'isolement, renforcer l'autonomie et promouvoir le 
            bien-être de chaque personne accompagnée. Nos actions concrètes transforment des vies et renforcent les liens 
            communautaires.
          </p>

          {/* Objectifs 2025 */}
          <div className={styles.objectivesCard}>
            <h3 className={styles.objectivesTitle}>Objectifs 2025</h3>
            <p className={styles.objectivesDescription}>
              Cette année, nous ambitionnons de doubler le nombre de bénéficiaires formés en informatique avec un objectif de 50 
              personnes accompagnées. Nous souhaitons également améliorer la disponibilité de notre plateforme d'écoute téléphonique 
              pour atteindre 75 appels mensuels et développer de nouveaux cercles de parole thématiques.
            </p>
          </div>
        </div>
      </div>

      {/* Bouton d'accessibilité en bas à droite */}
      <div className={styles.accessibilityButton}>
        <span className={styles.accessibilityIcon}>♿</span>
      </div>
    </div>
  );
};

export default MaisonActionsSolidaires;