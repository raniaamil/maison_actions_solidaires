'use client';

import styles from './cgu.module.css';

export default function ConditionsUtilisation() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Conditions Générales d’Utilisation (CGU)</h1>
      <p className={styles.date}>Dernière mise à jour : 30/07/2025</p>

      <p className={styles.paragraph}>
        Les présentes Conditions Générales d’Utilisation (CGU) ont pour objet de définir les modalités d’accès et d’utilisation du site internet
        de l’Association Maison d’Actions Solidaires (MAACSO), accessible à l’adresse : [adresse du site à compléter].
        En accédant au site, l’utilisateur accepte sans réserve les présentes CGU.
      </p>

      <h2 className={styles.heading}>1. Informations légales</h2>
      <p className={styles.paragraph}>
        Le présent site est édité par :<br />
        Maison d’Actions Solidaires (MAACSO)<br />
        Association déclarée selon la loi du 1er juillet 1901<br />
        Siège social : 12 rue de la Corne de Bœuf, 94500 Champigny-sur-Marne<br />
        Email : maisondactionsolidaire@gmail.com<br />
        Téléphone : 07 82 16 90 08<br />
        SIREN (si disponible) : [à compléter]
      </p>
      <p className={styles.paragraph}>
        Le site est hébergé par :<br />
        [Nom de l’hébergeur]<br />
        Adresse : [à compléter]<br />
        Email : [à compléter]
      </p>

      <h2 className={styles.heading}>2. Objet du site</h2>
      <ul className={styles.list}>
        <li className={styles.listItem}>Présenter l’association MAACSO, ses actions, sa mission et ses valeurs</li>
        <li className={styles.listItem}>Proposer des moyens d’adhérer, de faire un don ou de participer aux événements</li>
        <li className={styles.listItem}>Mettre à disposition des informations pratiques (contact, actualités, ressources)</li>
      </ul>
      <p className={styles.paragraph}>
        L’utilisation du site est gratuite. Certains services peuvent nécessiter une inscription.
      </p>

      <h2 className={styles.heading}>3. Accès au site</h2>
      <p className={styles.paragraph}>
        Le site est accessible gratuitement à tout utilisateur disposant d’un accès à Internet. Tous les frais afférents à l’accès au service
        (matériel informatique, connexion Internet, etc.) sont à la charge de l’utilisateur.
        MAACSO se réserve le droit de suspendre, interrompre ou limiter sans préavis l’accès à tout ou partie du site, notamment pour des opérations de maintenance.
      </p>

      <h2 className={styles.heading}>4. Propriété intellectuelle</h2>
      <p className={styles.paragraph}>
        L’ensemble des éléments du site (textes, images, graphismes, logo, vidéos, documents téléchargeables, structure, code source, etc.) est protégé
        par le droit d’auteur et la propriété intellectuelle. Ils sont la propriété exclusive de l’Association MAACSO ou de tiers ayant autorisé leur usage.
        Toute reproduction, diffusion, modification ou exploitation, même partielle, sans autorisation écrite préalable est interdite.
      </p>

      <h2 className={styles.heading}>5. Responsabilités</h2>
      <p className={styles.paragraph}>
        MAACSO met en œuvre tous les moyens raisonnables pour assurer l’exactitude et la mise à jour des informations diffusées sur son site, mais ne saurait être tenue responsable :
      </p>
      <ul className={styles.list}>
        <li className={styles.listItem}>des erreurs, omissions ou inexactitudes pouvant y figurer ;</li>
        <li className={styles.listItem}>de l’indisponibilité temporaire du site ;</li>
        <li className={styles.listItem}>des dommages directs ou indirects liés à l’utilisation du site.</li>
      </ul>
      <p className={styles.paragraph}>
        L’utilisateur reste seul responsable de l’usage qu’il fait des informations et contenus disponibles.
      </p>

      <h2 className={styles.heading}>6. Données personnelles</h2>
      <p className={styles.paragraph}>
        La collecte et le traitement de vos données personnelles sont régis par notre [Politique de Confidentialité] accessible ici : [lien à insérer].
        Conformément au RGPD, vous disposez d’un droit d’accès, de rectification, de suppression, de limitation et d’opposition concernant vos données.
      </p>

      <h2 className={styles.heading}>7. Liens hypertextes</h2>
      <p className={styles.paragraph}>
        Le site peut contenir des liens vers d’autres sites internet. MAACSO décline toute responsabilité quant au contenu de ces sites externes, sur lesquels elle n’a aucun contrôle.
        Tout lien vers le site de MAACSO depuis un site tiers doit faire l’objet d’une autorisation écrite préalable.
      </p>

      <h2 className={styles.heading}>8. Engagements de l’utilisateur</h2>
      <ul className={styles.list}>
        <li className={styles.listItem}>Utiliser le site dans le respect des lois et règlements en vigueur</li>
        <li className={styles.listItem}>Ne pas porter atteinte aux droits de tiers ou à l’intégrité du site</li>
        <li className={styles.listItem}>Ne pas utiliser le site à des fins malveillantes ou commerciales non autorisées</li>
      </ul>
      <p className={styles.paragraph}>
        En cas de non-respect, MAACSO se réserve le droit de prendre toute mesure appropriée, y compris de restreindre l’accès au site.
      </p>

      <h2 className={styles.heading}>9. Modification des CGU</h2>
      <p className={styles.paragraph}>
        MAACSO se réserve le droit de modifier les présentes CGU à tout moment. Les nouvelles conditions entreront en vigueur dès leur publication sur le site.
        L’utilisateur est invité à les consulter régulièrement.
      </p>

      <h2 className={styles.heading}>10. Droit applicable et juridiction compétente</h2>
      <p className={styles.paragraph}>
        Les présentes CGU sont régies par le droit français.
        En cas de litige, et après échec de toute tentative amiable, compétence exclusive est attribuée aux tribunaux français.
      </p>
    </div>
  );
}
