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
                  fondamentales. Ces principes m'ont accompagnée tout au long de ma vie.
                </p>
                <p>
                  Depuis 2015, lors de mes différentes missions en tant qu'aide-soignante dans des maisons d'accueil 
                  spécialisées, des maisons de retraite, des services de soins à domicile, ou encore des centres de 
                  rééducation, j'ai eu l'occasion de prendre soin des personnes âgées, des personnes en situation de 
                  handicap, ainsi que des aidants.
                </p>
                <p>
                  Ces expériences m'ont ouvert les yeux sur les besoins criants de ces publics et m'ont amenée à 
                  réfléchir à des solutions pour leur venir en aide. C'est au cours de cette réflexion que j'ai eu 
                  le déclic de créer une association.
                </p>
                <p>
                  Ce déclic s'est concrétisé grâce à mon intégration à la MDPH (Maison Départementale des Personnes 
                  Handicapées). En écoutant les doléances des usagers et lors d'un séminaire de la MDPH, j'ai fait une 
                  rencontre décisive : la directrice de l'association Solidaire Internationale. Elle m'a rappelé 
                  l'importance de ne pas repousser ses projets.
                </p>
                <p>
                  Ce conseil a marqué un tournant dans ma vie, me convainquant qu'il était temps de me lancer. J'ai 
                  ensuite pris contact avec d'autres personnes partageant cet esprit associatif. Leur soutien et leur 
                  engagement m'ont permis de concrétiser ce projet.
                </p>
                <p>
                  En un an seulement, avec une équipe dynamique et motivée, nous avons accompli de belles choses. 
                  Et nous espérons faire encore mieux, notamment grâce à votre précieux soutien. Ensemble, 
                  nous avons accompli tant de choses, et je suis impatiente de voir ce que nous réaliserons à l'avenir."
                </p>
              </div>
            </div>

            {/* Kimberley */}
            <div className={styles.teamCard}>
              <div className={styles.teamAvatar}>
                <Image
                  src="/images/association/photo_kimberley.jpg"
                  alt="Kimberley"
                  width={96}
                  height={96}
                  className={styles.teamPhoto}
                />
              </div>
              <h4 className={styles.teamName}>Kimberley</h4>
              <p className={styles.teamRole}>Responsable Pôle Administratif</p>
              <div className={styles.teamBioExtended}>
                <p>
                  "Bonjour je suis.... Je suis... KIMBERLEY !
                </p>
                <p>
                  Vous avez la trouille de faire des CV, lettres de motivation, relances, lettres à la CAF...? 
                </p>
                <p>
                  Vous ne savez pas envoyer des mails ? Google vous fait peur ? Pas de soucis, nous sommes là pour vous aider.
                </p>
                <p>
                  Je travaille en tant que commerciale, donc Word, Google, Outlook fait parti de mon quotidien. 
                  Au plaisir de vous rencontrer !"
                </p>
              </div>
            </div>

            {/* Stéphane AURIAULT */}
            <div className={styles.teamCard}>
              <div className={styles.teamAvatar}>
                <Image
                  src="/images/association/photo_stéphane.jpg"
                  alt="Stéphane AURIAULT"
                  width={96}
                  height={96}
                  className={styles.teamPhoto}
                />
              </div>
              <h4 className={styles.teamName}>Stéphane AURIAULT</h4>
              <p className={styles.teamRole}>Praticien de Bien-être - Pôle Bien-être</p>
              <div className={styles.teamBioExtended}>
                <p>
                  "Bonjour, je suis Stéphane Auriault, je suis praticien de bien-être.
                </p>
                <p>
                  J'exerce la Podoréflexologie appliquée à la Médecine Traditionnelle Chinoise, la Réflexologie palmaire 
                  avec des conseils de Podoréflexologie pour amoindrir voire quelquefois faire disparaître les douleurs, 
                  la réflexologie plantaire couplée parfois au shiatsu de bien-être pour traiter les émotions.
                </p>
                <p>
                  Je pratique également le guasha-ventouses, guasha-moxa et moxa-ventouses, la réflexologie plantaire 
                  avec la moxibution. Je suis également certifié pour donner des conseils de base en naturopathie."
                </p>
              </div>
            </div>

            {/* Romain */}
            <div className={styles.teamCard}>
              <div className={styles.teamAvatar}>
                <Image
                  src="/images/association/photo_romain.jpg"
                  alt="Romain"
                  width={96}
                  height={96}
                  className={styles.teamPhoto}
                />
              </div>
              <h4 className={styles.teamName}>Romain</h4>
              <p className={styles.teamRole}>Formateur Numérique</p>
              <div className={styles.teamBioExtended}>
                <p>
                  "Hello ! Moi c'est Romain, et j'ai envie de donner un coup de pouce à toutes celles et ceux qui 
                  veulent se sentir plus à l'aise avec le numérique.
                </p>
                <p>
                  Que ce soit pour mieux utiliser Word, Excel, Google, créer facilement avec Canva, ou encore 
                  s'organiser dans des papiers administratifs en ligne, je suis là pour partager mes astuces et 
                  rendre tout ça plus simple et accessible.
                </p>
                <p>
                  L'idée, c'est d'apprendre ensemble, sans prise de tête, et de montrer que le numérique peut 
                  vraiment être utile à tout le monde.
                </p>
                <p>
                  Au plaisir de vous rencontrer et de vous aider ! :)"
                </p>
              </div>
            </div>
          </div>

          {/* Section Autres Membres */}
          <h3 className={styles.subsectionTitle}>Autres Membres de l'Équipe</h3>
          
          <div className={styles.otherMembersGrid}>
            <div className={styles.otherMemberCard}>
              <h4 className={styles.otherMemberName}>Audrey KAGO</h4>
              <p className={styles.otherMemberRole}>Secrétaire</p>
            </div>
            
            <div className={styles.otherMemberCard}>
              <h4 className={styles.otherMemberName}>Hippolyte NGOUAJO</h4>
              <p className={styles.otherMemberRole}>Trésorier</p>
            </div>
            
            <div className={styles.otherMemberCard}>
              <h4 className={styles.otherMemberName}>Cataracte SMARTINS</h4>
              <p className={styles.otherMemberRole}>AESH/Enseignante - Pôle Junior</p>
              <p className={styles.otherMemberDescription}>Accompagnante des enfants en situation de handicap par des ateliers récréatifs</p>
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
            <h3 className={styles.objectivesTitle}>Objectifs</h3>
            <p className={styles.objectivesDescription}>
              Cette année, nous ambitionnons de doubler le nombre de bénéficiaires formés en informatique avec un objectif de 50 
              personnes accompagnées. Nous souhaitons également améliorer la disponibilité de notre plateforme d'écoute téléphonique 
              pour atteindre 75 appels mensuels et développer de nouveaux cercles de parole thématiques.
            </p>
          </div>

          {/* Section Téléchargement PDF */}
          <div className={styles.downloadSection}>
            <h3 className={styles.subsectionTitle}>Découvrez qui nous sommes</h3>
            <p className={styles.sectionDescription}>
              Téléchargez notre plaquette de présentation pour en savoir plus sur nos services et découvrir comment nous pouvons vous accompagner.
            </p>
            <a 
              href="/documents/plaquette-maison-actions-solidaires.pdf" 
              download="Plaquette-Maison-Actions-Solidaires.pdf"
              className={styles.downloadButton}
            >
              📄 Télécharger notre plaquette (PDF)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaisonActionsSolidaires;