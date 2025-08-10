'use client';

import styles from './mentionslegales.module.css';

export default function MentionsLegales() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Mentions légales</h1>
      <p className={styles.paragraph}>
        Conformément aux dispositions des articles 6-III et 19 de la Loi n°2004-575 du 21 juin 2004 pour la confiance dans l’économie numérique (LCEN),
        il est porté à la connaissance des utilisateurs du site les présentes mentions légales.
      </p>

      <h2 className={styles.heading}>1. Éditeur du site</h2>
      <p className={styles.paragraph}>
        Nom de l'association : Maison d’Actions Solidaires (MAACSO)<br />
        Forme juridique : Association déclarée régie par la loi du 1er juillet 1901<br />
        SIREN : [à compléter si disponible]<br />
        Adresse du siège social :<br />
        12 rue de la Corne de Bœuf,<br />
        94500 Champigny-sur-Marne, France<br />
        Téléphone : 07 82 16 90 08<br />
        Adresse e-mail : maisondactionsolidaire@gmail.com
      </p>

      <h2 className={styles.heading}>2. Hébergeur</h2>
      <p className={styles.paragraph}>
        Nom de l’hébergeur : [exemple : OVH, Hostinger, Infomaniak, etc.]<br />
        Raison sociale : [à compléter]<br />
        Adresse : [à compléter]<br />
        Téléphone : [à compléter]<br />
        Site web : [à compléter]
      </p>

      <h2 className={styles.heading}>3. Développement et maintenance du site</h2>
      <p className={styles.paragraph}>
        Le site a été développé par : Rania AMIL<br />
        Adresse : 26/ rue de l’abbé Glatz, 92600 Asnières-sur-Seine<br />
        Email : mademoiselleamil@gmail.com<br />
        Téléphone : 07 61 39 90 82
      </p>

      <h2 className={styles.heading}>4. Propriété intellectuelle</h2>
      <p className={styles.paragraph}>
        Le contenu du site (textes, images, graphismes, logo, documents, vidéos, etc.) est protégé par le Code de la propriété intellectuelle.
        Sauf mention contraire, il est la propriété exclusive de l’association MAACSO.
        Toute reproduction ou représentation, totale ou partielle, sans autorisation expresse de l’association est interdite et constituerait
        une contrefaçon sanctionnée par les articles L.335-2 et suivants du Code de la propriété intellectuelle.
      </p>

      <h2 className={styles.heading}>5. Données personnelles</h2>
      <p className={styles.paragraph}>
        Les données personnelles collectées via le site sont traitées dans le respect du Règlement Général sur la Protection des Données (RGPD).
        Pour plus d’informations, consultez notre Politique de confidentialité.
        Vous disposez d’un droit d’accès, de rectification, de suppression, d’opposition, et de portabilité de vos données.
      </p>

      <h2 className={styles.heading}>6. Cookies</h2>
      <p className={styles.paragraph}>
        Le site peut utiliser des cookies pour améliorer l’expérience utilisateur et mesurer l’audience.
        Lors de votre première visite, un bandeau vous informe et vous permet de gérer vos préférences.
      </p>

      <h2 className={styles.heading}>7. Limitation de responsabilité</h2>
      <p className={styles.paragraph}>MAACSO s’efforce de fournir des informations fiables et à jour, mais ne peut garantir l’absence d’erreurs.</p>
      <p className={styles.paragraph}>Elle ne saurait être tenue pour responsable en cas :</p>
      <ul className={styles.list}>
        <li className={styles.listItem}>D’interruption temporaire du site</li>
        <li className={styles.listItem}>D’erreurs ou omissions dans les contenus</li>
        <li className={styles.listItem}>De dommages liés à l’utilisation du site</li>
      </ul>

      <h2 className={styles.heading}>8. Droit applicable</h2>
      <p className={styles.paragraph}>
        Les présentes mentions légales sont régies par le droit français.
        Tout litige relatif à l’utilisation du site est soumis à la compétence exclusive des juridictions françaises.
      </p>
    </div>
  );
}
