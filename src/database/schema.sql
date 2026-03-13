-- ============================================================
-- SCHÉMA PostgreSQL pour Maison d'Actions Solidaires
-- Compatible Supabase
-- ============================================================

-- Table des utilisateurs
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  prenom VARCHAR(100) NOT NULL,
  nom VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  mot_de_passe VARCHAR(255) NOT NULL,
  photo TEXT DEFAULT NULL,
  bio TEXT DEFAULT NULL,
  role VARCHAR(20) DEFAULT 'Utilisateur' 
    CHECK (role IN ('Administrateur', 'Rédacteur', 'Utilisateur')),
  date_inscription TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  date_modification TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  actif BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);
CREATE INDEX IF NOT EXISTS idx_users_actif ON users (actif);

-- Table des actualités
CREATE TABLE IF NOT EXISTS actualites (
  id SERIAL PRIMARY KEY,
  titre VARCHAR(500) NOT NULL,
  description TEXT NOT NULL,
  contenu TEXT NOT NULL,
  type VARCHAR(20) NOT NULL 
    CHECK (type IN ('événement', 'témoignage', 'numérique', 'administratif', 'soutien', 'bien-être', 'junior')),
  statut VARCHAR(10) DEFAULT 'Brouillon' 
    CHECK (statut IN ('Brouillon', 'Publié')),
  image TEXT DEFAULT NULL,
  auteur_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date_creation TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  date_publication TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  date_modification TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  tags JSONB DEFAULT NULL,
  lieu VARCHAR(255) DEFAULT NULL,
  places_disponibles INTEGER DEFAULT NULL,
  inscription_requise BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_actualites_type ON actualites (type);
CREATE INDEX IF NOT EXISTS idx_actualites_statut ON actualites (statut);
CREATE INDEX IF NOT EXISTS idx_actualites_auteur ON actualites (auteur_id);
CREATE INDEX IF NOT EXISTS idx_actualites_date_pub ON actualites (date_publication);
CREATE INDEX IF NOT EXISTS idx_actualites_date_crea ON actualites (date_creation);

-- Table des commentaires
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  article_id INTEGER NOT NULL REFERENCES actualites(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id INTEGER DEFAULT NULL REFERENCES comments(id) ON DELETE CASCADE,
  contenu TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comments_article ON comments (article_id);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments (user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments (parent_id);

-- Table des tokens de réinitialisation de mot de passe
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reset_token ON password_reset_tokens (token);
CREATE INDEX IF NOT EXISTS idx_reset_user ON password_reset_tokens (user_id);

-- Table des messages de contact
CREATE TABLE IF NOT EXISTS contact_messages (
  id SERIAL PRIMARY KEY,
  prenom VARCHAR(100) NOT NULL,
  nom VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  sujet VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  date_creation TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  statut VARCHAR(10) DEFAULT 'nouveau' CHECK (statut IN ('nouveau', 'lu', 'traite'))
);

CREATE INDEX IF NOT EXISTS idx_contact_email ON contact_messages (email);
CREATE INDEX IF NOT EXISTS idx_contact_date ON contact_messages (date_creation);
CREATE INDEX IF NOT EXISTS idx_contact_statut ON contact_messages (statut);
