import React from 'react';
import Link from 'next/link';
import styles from './Footer.module.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        <div className={styles.footerContent}>
          {/* Section Légal */}
          <div className={styles.footerSection}>
            <h3>Informations Légales</h3>
            <ul className={styles.footerLinks}>
              <li>
                <Link href="/politiquedeconfidentialite">
                  Politique de Confidentialité
                </Link>
              </li>
              <li>
                <Link href="/cgu">
                  Conditions Générales d'Utilisation
                </Link>
              </li>
              <li>
                <Link href="/mentionslegales">
                  Mentions Légales
                </Link>
              </li>
            </ul>
          </div>

          {/* Section Contact */}
          <div className={styles.footerSection}>
            <h3>Contact</h3>
            <div className={styles.footerInfo}>
              <p><strong>Email :</strong> maisondactionsolidaire@gmail.com</p>
              <p><strong>Téléphone :</strong> 07 82 16 90 08</p>
              <p><strong>Adresse :</strong> 12 rue de la Corne de Bœuf, 94500 Champigny-sur-Marne, France</p>
            </div>
          </div>

          {/* Section À Propos */}
          <div className={styles.footerSection}>
            <h3>À Propos</h3>
            <div className={styles.footerInfo}>
              <p>
                Maison d'Actions Solidaires œuvre pour la{' '}
                <span className={styles.highlight}>solidarité</span> et l'entraide communautaire.
              </p>
              <p>Ensemble, construisons un monde plus solidaire.</p>
            </div>
          </div>
        </div>

        {/* Ligne de séparation */}
        <hr className={styles.footerDivider} />

        {/* Copyright */}
        <div className={styles.footerBottom}>
          <p className={styles.copyright}>
            © {currentYear} Maison d'Actions Solidaires - Tous droits réservés
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;