'use client';

import styles from './politiquedeconfidentialite.module.css';

export default function PolitiqueConfidentialite() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Politique de confidentialité</h1>

      <h2 className={styles.heading}>1. Qui est responsable de vos données ?</h2>
      <p className={styles.paragraph}>
        Maison d&apos;Actions Solidaires, association, représentée par sa présidente.<br />
        Contact : maisondactionsolidaire@gmail.com. Adresse postale : 12 rue de la Corne de Bœuf, 94500 Champigny-sur-Marne.
      </p>

      <h2 className={styles.heading}>2. Quelles données, pourquoi et combien de temps ?</h2>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Ce que vous faites</th>
              <th scope="col">Données utilisées</th>
              <th scope="col">Pourquoi</th>
              <th scope="col">Base légale</th>
              <th scope="col">Conservation</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Créer un compte</td>
              <td>Prénom, nom, e-mail, mot de passe (stocké sous forme hachée), photo et biographie (facultatives)</td>
              <td>Gérer votre compte et vous permettre de commenter</td>
              <td>Intérêt légitime de l&apos;association</td>
              <td>Tant que le compte existe ; suppression sur simple demande</td>
            </tr>
            <tr>
              <td>Commenter un article</td>
              <td>Contenu du commentaire, nom et prénom affichés</td>
              <td>Permettre la discussion</td>
              <td>Intérêt légitime</td>
              <td>Tant que le compte et l&apos;article existent</td>
            </tr>
            <tr>
              <td>Réinitialiser votre mot de passe</td>
              <td>Un lien temporaire envoyé par e-mail</td>
              <td>Sécuriser votre compte</td>
              <td>Intérêt légitime</td>
              <td>1 heure</td>
            </tr>
            <tr>
              <td>Nous écrire (formulaire de contact)</td>
              <td>Prénom, nom, e-mail, sujet, message</td>
              <td>Répondre à votre demande</td>
              <td>Intérêt légitime</td>
              <td>12 mois</td>
            </tr>
            <tr>
              <td>Faire un don</td>
              <td>
                Aucune donnée n&apos;est conservée par ce site : vous êtes redirigé vers PayPal ou HelloAsso, qui appliquent
                leur propre politique de confidentialité
              </td>
              <td>Permettre le don</td>
              <td>Sans objet</td>
              <td>Sans objet</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className={styles.paragraph}>
        Pour limiter le spam du formulaire de contact, une empreinte de votre adresse IP est conservée au plus une heure en mémoire du serveur, sans être enregistrée.
      </p>
      <p className={styles.paragraph}>
        Nous n&apos;envoyons pas de newsletter et nous n&apos;utilisons aucun outil de mesure d&apos;audience.
      </p>

      <h2 className={styles.heading}>3. Cookies</h2>
      <p className={styles.paragraph}>
        Ce site utilise un seul cookie, nécessaire à la connexion (<code>mas_session</code>, 7 jours). Il ne sert ni à la
        publicité ni au suivi.
      </p>

      <h2 className={styles.heading}>4. Qui reçoit vos données ?</h2>
      <ul className={styles.list}>
        <li className={styles.listItem}>Les administrateurs de l&apos;association, dans la limite de leurs fonctions.</li>
        <li className={styles.listItem}>
          Nos prestataires techniques : Vercel (hébergement du site), Supabase (base de données, située à Paris), Google
          (envoi des e-mails), OVH (nom de domaine).
        </li>
      </ul>
      <p className={styles.paragraph}>Ils n&apos;utilisent pas vos données pour leurs propres besoins.</p>

      <h2 className={styles.heading}>5. Vos données sortent-elles de l&apos;Union européenne ?</h2>
      <p className={styles.paragraph}>
        Notre base de données est en France. Certains prestataires sont des sociétés américaines ; leurs engagements de
        protection sont décrits dans leurs accords de traitement.
      </p>

      <h2 className={styles.heading}>6. Vos droits</h2>
      <p className={styles.paragraph}>
        Vous pouvez demander l&apos;accès à vos données, leur correction, leur effacement, la limitation ou l&apos;opposition
        à leur traitement, et la portabilité de celles que vous nous avez fournies. Écrivez à maisondactionsolidaire@gmail.com :
        nous répondons sous un mois. Si vous estimez ne pas avoir obtenu satisfaction, vous pouvez saisir la CNIL (cnil.fr).
      </p>

      <h2 className={styles.heading}>7. Sécurité</h2>
      <p className={styles.paragraph}>
        Les mots de passe sont stockés sous forme hachée (illisibles, même pour nous), l&apos;accès aux données est limité selon les rôles et la base de données est
        protégée. Aucun système n&apos;est infaillible : en cas de fuite de données vous concernant, nous vous informerons
        selon la loi.
      </p>

      <p className={styles.date}>Dernière mise à jour : 18/11/2026.</p>
    </div>
  );
}
