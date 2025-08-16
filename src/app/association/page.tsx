import React from 'react';
import Image from 'next/image';
import styles from './association.module.css';

const MaisonActionsSolidaires = () => {
  return (
    <div className={styles.container}>
      {/* Section Hero avec image de fond */}
      <div className={styles.heroSection}>
        <div className={styles.heroBackground}>
          <div className={styles.heroOverlay}></div>
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
            {/* Alvine NGUEMCHE avec photo et présentation complète */}
            <div className={styles.teamCard}>
              <div className={styles.teamAvatar}>
                <Image
                  src="/images/association/photo_alvine.jpg"
                  alt="Alvine NGUEMCHE"
                  width={96}
                  height={96}
                  className={styles.teamPhoto}
                />
              </div>
              <h4 className={styles.teamName}>Alvine NGUEMCHE</h4>
              <p className={styles.teamRole}>Présidente & Fondatrice</p>
              <div className={styles.teamBioExtended}>
                <p>
                  "Permettez-moi de partager avec vous un peu de mon histoire. Issue d'une fratrie de 18 enfants, 
                  j'ai grandi dans un environnement où la solidarité, l'entraide et le partage étaient des valeurs 
                  fondamentales. Ces principes m'ont accompagnée tout au long de ma vie."
                </p>
                <p>
                  "Depuis 2015, lors de mes différentes missions en tant qu'aide-soignante dans des maisons d'accueil 
                  spécialisées, des maisons de retraite, des services de soins à domicile, ou encore des centres de 
                  rééducation, j'ai eu l'occasion de prendre soin des personnes âgées, des personnes en situation de 
                  handicap, ainsi que des aidants."
                </p>
                <p>
                  "Ces expériences m'ont ouvert les yeux sur les besoins criants de ces publics et m'ont amenée à 
                  réfléchir à des solutions pour leur venir en aide. C'est au cours de cette réflexion que j'ai eu 
                  le déclic de créer une association."
                </p>
                <p>
                  "Ce déclic s'est concrétisé grâce à mon intégration à la MDPH (Maison Départementale des Personnes 
                  Handicapées). En écoutant les doléances des usagers et lors d'un séminaire de la MDPH, j'ai fait une 
                  rencontre décisive : la directrice de l'association Solidaire Internationale. Elle m'a rappelé 
                  l'importance de ne pas repousser ses projets."
                </p>
                <p>
                  "Ce conseil a marqué un tournant dans ma vie, me convainquant qu'il était temps de me lancer. J'ai 
                  ensuite pris contact avec d'autres personnes partageant cet esprit associatif. Leur soutien et leur 
                  engagement m'ont permis de concrétiser ce projet."
                </p>
                <p>
                  "En un an seulement, avec une équipe dynamique et motivée, nous avons accompli de belles choses. 
                  Et nous espérons faire encore mieux en 2025, notamment grâce à votre précieux soutien. Ensemble, 
                  nous avons accompli tant de choses, et je suis impatiente de voir ce que nous réaliserons à l'avenir."
                </p>
              </div>
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
    </div>
  );
};

export default MaisonActionsSolidaires;