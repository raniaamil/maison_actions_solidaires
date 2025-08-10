'use client';

import styles from './politiquedeconfidentialite.module.css';

export default function PolitiqueConfidentialite() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Politique de Confidentialité</h1>
      <p className={styles.date}>Dernière mise à jour : 30/07/2025</p>

      <p className={styles.paragraph}>
        L’Association Maison d’Actions Solidaires (MAACSO), dont le siège est situé au 12 rue de la Corne de Bœuf – 94500 Champigny-sur-Marne,
        s’engage à protéger votre vie privée et à assurer la sécurité des données personnelles que vous nous confiez.
        La présente politique de confidentialité a pour but de vous informer de la manière dont nous collectons, utilisons,
        partageons et protégeons vos données personnelles dans le cadre de votre utilisation de notre site Internet.
      </p>

      <h2 className={styles.heading}>1. Responsable du traitement</h2>
      <p className={styles.paragraph}>
        Le responsable du traitement des données personnelles est :<br />
        Maison d’Actions Solidaires (MAACSO)<br />
        12 rue de la Corne de Bœuf, 94500 Champigny-sur-Marne<br />
        Email : maisondactionsolidaire@gmail.com<br />
        Téléphone : 07 82 16 90 08
      </p>

      <h2 className={styles.heading}>2. Données personnelles collectées</h2>
      <ul className={styles.list}>
        <li className={styles.listItem}>Données d'identité : nom, prénom</li>
        <li className={styles.listItem}>Coordonnées : adresse email, numéro de téléphone, adresse postale</li>
        <li className={styles.listItem}>Données de connexion : adresse IP, type de navigateur, pages visitées</li>
        <li className={styles.listItem}>Données relatives à l’adhésion ou au don : montant, moyen de paiement, date</li>
      </ul>
      <p className={styles.paragraph}>Aucune donnée sensible n’est collectée sans votre consentement explicite.</p>

      <h2 className={styles.heading}>3. Finalités du traitement</h2>
      <ul className={styles.list}>
        <li className={styles.listItem}>Gestion des adhésions, dons et participations à nos actions</li>
        <li className={styles.listItem}>Réponse aux demandes envoyées via nos formulaires de contact</li>
        <li className={styles.listItem}>Envoi de communications d’information et de sensibilisation sur nos activités (newsletter)</li>
        <li className={styles.listItem}>Statistiques de fréquentation anonymisées</li>
        <li className={styles.listItem}>Respect de nos obligations légales et réglementaires</li>
      </ul>

      <h2 className={styles.heading}>4. Base légale des traitements</h2>
      <ul className={styles.list}>
        <li className={styles.listItem}>Sur votre consentement (newsletter, formulaire de contact)</li>
        <li className={styles.listItem}>Sur l’exécution d’un contrat (adhésion ou don)</li>
        <li className={styles.listItem}>Sur notre intérêt légitime à promouvoir nos actions solidaires</li>
        <li className={styles.listItem}>Ou sur une obligation légale (comptabilité, gestion des dons)</li>
      </ul>

      <h2 className={styles.heading}>5. Destinataires des données</h2>
      <p className={styles.paragraph}>
        Vos données sont exclusivement destinées à MAACSO et ne sont jamais vendues ni cédées à des tiers.
        Elles peuvent toutefois être transmises à nos prestataires techniques (hébergement web, outil de newsletter),
        strictement encadrés par contrat et situés dans l’Union européenne.
      </p>

      <h2 className={styles.heading}>6. Durée de conservation</h2>
      <ul className={styles.list}>
        <li className={styles.listItem}>Pour les demandes de contact : 12 mois après le dernier échange</li>
        <li className={styles.listItem}>Pour les dons et adhésions : 6 ans (obligations comptables)</li>
        <li className={styles.listItem}>Pour les abonnements à la newsletter : jusqu’au retrait de votre consentement</li>
      </ul>

      <h2 className={styles.heading}>7. Sécurité des données</h2>
      <p className={styles.paragraph}>
        Nous mettons en œuvre toutes les mesures techniques et organisationnelles appropriées pour assurer la sécurité
        et la confidentialité de vos données personnelles, notamment contre la perte, la mauvaise utilisation ou l’accès non autorisé.
      </p>

      <h2 className={styles.heading}>8. Vos droits</h2>
      <ul className={styles.list}>
        <li className={styles.listItem}>Droit d’accès à vos données</li>
        <li className={styles.listItem}>Droit de rectification ou de suppression</li>
        <li className={styles.listItem}>Droit d’opposition ou de limitation du traitement</li>
        <li className={styles.listItem}>Droit à la portabilité de vos données</li>
        <li className={styles.listItem}>Droit de retrait de votre consentement à tout moment</li>
      </ul>
      <p className={styles.paragraph}>
        Vous pouvez exercer ces droits en nous contactant par email à maisondactionsolidaire@gmail.com, en joignant une pièce d’identité.<br />
        En cas de non-respect de vos droits, vous avez également la possibilité de déposer une réclamation auprès de la CNIL (www.cnil.fr).
      </p>

      <h2 className={styles.heading}>9. Cookies</h2>
      <p className={styles.paragraph}>
        Notre site utilise des cookies strictement nécessaires au fonctionnement du site, ainsi que des cookies de mesure d’audience.
        Vous pouvez les gérer à tout moment via la bannière de gestion des cookies lors de votre première visite.
      </p>

      <h2 className={styles.heading}>10. Modifications de la politique</h2>
      <p className={styles.paragraph}>
        Cette politique est susceptible d’être modifiée à tout moment en fonction des évolutions légales ou des services proposés par le site.
        La date de la dernière mise à jour sera indiquée en haut de cette page.
      </p>
    </div>
  );
}
