-- Création de la base de données
CREATE DATABASE IF NOT EXISTS maison_actions_solidaires 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE maison_actions_solidaires;

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  prenom VARCHAR(100) NOT NULL,
  nom VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  mot_de_passe VARCHAR(255) NOT NULL,
  photo TEXT DEFAULT NULL,
  bio TEXT DEFAULT NULL,
  role ENUM('Administrateur', 'Rédacteur') DEFAULT 'Rédacteur',
  date_inscription DATETIME DEFAULT CURRENT_TIMESTAMP,
  date_modification DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  actif BOOLEAN DEFAULT TRUE,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_actif (actif)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des actualités
CREATE TABLE IF NOT EXISTS actualites (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titre VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  contenu LONGTEXT NOT NULL,
  type ENUM('événement', 'témoignage', 'numérique', 'administratif', 'soutien', 'bien-être', 'junior') NOT NULL,
  statut ENUM('Brouillon', 'Publié') DEFAULT 'Brouillon',
  image TEXT DEFAULT NULL,
  auteur_id INT NOT NULL,
  date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
  date_publication DATETIME DEFAULT NULL,
  date_modification DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  tags JSON DEFAULT NULL,
  lieu VARCHAR(255) DEFAULT NULL,
  places_disponibles INT DEFAULT NULL,
  inscription_requise BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (auteur_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_type (type),
  INDEX idx_statut (statut),
  INDEX idx_auteur (auteur_id),
  INDEX idx_date_publication (date_publication),
  INDEX idx_date_creation (date_creation),
  FULLTEXT idx_recherche (titre, description, contenu)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertion d'un utilisateur administrateur par défaut
-- Mot de passe: admin123 (hashé avec bcrypt - $2a$12$)
INSERT IGNORE INTO users (id, prenom, nom, email, mot_de_passe, role, bio, photo) VALUES
(1, 'Jean', 'Dupont', 'admin@maacso.fr', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeWqHv4WdFsaXhDfO', 'Administrateur', 'Administrateur principal de l\'association', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face');

-- Insertion d'un rédacteur par défaut
-- Mot de passe: redacteur123
INSERT IGNORE INTO users (id, prenom, nom, email, mot_de_passe, role, bio, photo) VALUES
(2, 'Marie', 'Martin', 'redacteur@maacso.fr', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeWqHv4WdFsaXhDfO', 'Rédacteur', 'Rédactrice en charge des actualités', 'https://images.unsplash.com/photo-1494790108755-2616b612b3ab?w=150&h=150&fit=crop&crop=face');

-- Insertion de quelques actualités d'exemple
INSERT IGNORE INTO actualites (id, titre, description, contenu, type, statut, auteur_id, date_publication, image, lieu, places_disponibles, inscription_requise) VALUES
(1, 'Atelier numérique : Découverte des tablettes', 'Un atelier interactif pour apprendre à utiliser les tablettes en toute autonomie. Places limitées !', 
'<p>Dans un monde de plus en plus connecté, savoir utiliser les outils numériques devient essentiel pour maintenir son autonomie et rester en contact avec ses proches. Notre atelier "Découverte des tablettes" s\'adresse à toutes les personnes souhaitant s\'initier ou perfectionner leur utilisation de ces appareils intuitifs.</p>

<h3>Au programme de cet atelier :</h3>
<ul>
<li>Prise en main de la tablette : allumage, extinction, navigation de base</li>
<li>Découverte de l\'interface : icônes, applications, paramètres</li>
<li>Navigation sur internet : recherche, consultation de sites</li>
<li>Communication : emails, messagerie, appels vidéo</li>
<li>Loisirs numériques : photos, musique, jeux simples</li>
<li>Applications utiles au quotidien : météo, actualités, santé</li>
</ul>

<p>L\'atelier se déroule en petit groupe pour permettre un accompagnement personnalisé. Chaque participant dispose d\'une tablette pour la durée de la session. Nos animateurs expérimentés adaptent le rythme selon les besoins de chacun.</p>', 
'numérique', 'Publié', 1, '2024-02-15 10:00:00', '/images/actualites/tablettes.jpg', 'Salle informatique MAACSO', 12, 1),

(2, 'Marie témoigne de son parcours', 'Après 6 mois d\'accompagnement, Marie retrouve confiance en elle et autonomie dans ses démarches administratives.',
'<p><em>"Quand je suis arrivée ici il y a six mois, j\'étais complètement perdue face à toutes ces démarches administratives dématérialisées. Aujourd\'hui, je peux dire que j\'ai retrouvé ma confiance et mon autonomie."</em></p>

<p>Marie, 68 ans, nous livre son témoignage sur son parcours d\'accompagnement au sein de notre association. Son histoire illustre parfaitement notre mission : redonner confiance et autonomie à chacun.</p>

<h3>Le début des difficultés</h3>
<p>Tout a commencé quand Marie a dû renouveler sa carte d\'identité en ligne. <em>"Avant, on allait à la mairie avec ses papiers, et c\'était fait. Maintenant, il faut tout faire sur internet, et moi, je ne comprenais rien à tous ces sites."</em></p>

<h3>L\'accompagnement personnalisé</h3>
<p>Pendant six mois, Marie a bénéficié d\'un accompagnement individuel hebdomadaire. Étape par étape, elle a appris à naviguer sur les sites administratifs, créer et gérer ses comptes en ligne, et effectuer ses démarches en toute sécurité.</p>

<h3>Une nouvelle autonomie</h3>
<p><em>"Maintenant, je fais mes déclarations d\'impôts toute seule, je consulte mes remboursements de sécurité sociale, et j\'envoie même des emails à mes petits-enfants !"</em> raconte Marie avec fierté.</p>', 
'témoignage', 'Publié', 2, '2024-02-10 14:30:00', '/images/actualites/vieilledame.jpg', NULL, NULL, 0),

(3, 'Nouveau partenariat avec la Mairie', 'Signature d\'un partenariat pour étendre nos actions de soutien aux aidants sur tout le territoire communal.',
'<p>C\'est avec une grande fierté que nous annonçons la signature officielle d\'un partenariat stratégique avec la Mairie de notre commune. Cette collaboration marque une étape importante dans le développement de nos actions de soutien aux aidants sur l\'ensemble du territoire communal.</p>

<h3>Un partenariat ambitieux</h3>
<p>Signé en présence du Maire et de notre équipe dirigeante, ce partenariat vise à structurer et amplifier nos interventions auprès des aidants familiaux et professionnels.</p>

<h3>De nouveaux services</h3>
<p>Grâce à ce partenariat, nous pourrons proposer des permanences de proximité une fois par semaine dans chaque quartier, pour rapprocher nos services des habitants.</p>', 
'événement', 'Publié', 1, '2024-02-08 09:00:00', '/images/actualites/mairiechampigny.jpg', 'Mairie de Champigny-sur-Marne', NULL, 0),

(4, 'Groupe de parole : Burn-out parental', 'Un espace d\'écoute et d\'échange pour les parents en situation d\'épuisement. Animé par notre psychologue.',
'<p>L\'épuisement parental, communément appelé "burn-out parental", touche de plus en plus de familles. Face à ce constat, notre association propose un groupe de parole spécialement dédié aux parents en situation de détresse.</p>

<h3>Comprendre le burn-out parental</h3>
<p>Le burn-out parental se caractérise par un épuisement physique et émotionnel lié au rôle de parent.</p>

<h3>Un espace de parole bienveillant</h3>
<p>Notre groupe de parole offre un cadre sécurisé où les parents peuvent exprimer leurs difficultés sans jugement, échanger avec d\'autres parents, et développer des stratégies d\'adaptation.</p>

<h3>Animation professionnelle</h3>
<p>Les séances sont animées par Dr. Claire Rousseau, psychologue clinicienne spécialisée dans l\'accompagnement des familles.</p>', 
'bien-être', 'Publié', 2, '2024-02-20 16:00:00', '/images/actualites/burnoutparental.jpg', 'Centre MAACSO', 8, 1);

-- Vérification de l'insertion
SELECT 'Tables créées et données insérées avec succès' as statut;