
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
  INDEX idx_role (role)
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
  FULLTEXT idx_recherche (titre, description, contenu)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertion d'un utilisateur administrateur par défaut
-- Mot de passe: admin123 (hashé avec bcrypt)
INSERT IGNORE INTO users (prenom, nom, email, mot_de_passe, role, bio, photo) VALUES
('Jean', 'Dupont', 'admin@maacso.fr', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeWqHv4WdFsaXhDfO', 'Administrateur', 'Administrateur principal de l\'association', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face');

-- Insertion de quelques actualités d'exemple
INSERT IGNORE INTO actualites (id, titre, description, contenu, type, statut, auteur_id, date_publication, image) VALUES
(1, 'Atelier numérique : Découverte des tablettes', 'Un atelier interactif pour apprendre à utiliser les tablettes en toute autonomie. Places limitées !', '<p>Dans un monde de plus en plus connecté, savoir utiliser les outils numériques devient essentiel pour maintenir son autonomie et rester en contact avec ses proches. Notre atelier "Découverte des tablettes" s\'adresse à toutes les personnes souhaitant s\'initier ou perfectionner leur utilisation de ces appareils intuitifs.</p><h3>Au programme de cet atelier :</h3><ul><li>Prise en main de la tablette : allumage, extinction, navigation de base</li><li>Découverte de l\'interface : icônes, applications, paramètres</li><li>Navigation sur internet : recherche, consultation de sites</li></ul>', 'numérique', 'Publié', 1, '2024-02-15 10:00:00', '/images/actualites/tablettes.jpg'),
(2, 'Marie témoigne de son parcours', 'Après 6 mois d\'accompagnement, Marie retrouve confiance en elle et autonomie dans ses démarches administratives.', '<p><em>"Quand je suis arrivée ici il y a six mois, j\'étais complètement perdue face à toutes ces démarches administratives dématérialisées. Aujourd\'hui, je peux dire que j\'ai retrouvé ma confiance et mon autonomie."</em></p><p>Marie, 68 ans, nous livre son témoignage sur son parcours d\'accompagnement au sein de notre association.</p>', 'témoignage', 'Publié', 1, '2024-02-10 14:30:00', '/images/actualites/vieilledame.jpg'),
(3, 'Nouveau partenariat avec la Mairie', 'Signature d\'un partenariat pour étendre nos actions de soutien aux aidants sur tout le territoire communal.', '<p>C\'est avec une grande fierté que nous annonçons la signature officielle d\'un partenariat stratégique avec la Mairie de notre commune.</p>', 'événement', 'Publié', 1, '2024-02-08 09:00:00', '/images/actualites/mairiechampigny.jpg'),
(4, 'Groupe de parole : Burn-out parental', 'Un espace d\'écoute et d\'échange pour les parents en situation d\'épuisement. Animé par notre psychologue.', '<p>L\'épuisement parental, communément appelé "burn-out parental", touche de plus en plus de familles. Face à ce constat, notre association propose un groupe de parole spécialement dédié aux parents en situation de détresse.</p>', 'bien-être', 'Publié', 1, '2024-02-20 16:00:00', '/images/actualites/burnoutparental.jpg');