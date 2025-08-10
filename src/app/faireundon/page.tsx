import Image from 'next/image';
import styles from './faireundon.module.css';

export default function FaireUnDonPage() {
  const reasons = [
    {
      icon: '🤗',
      title: 'Briser l\'isolement',
      description: 'Nous tissons des liens précieux et accompagnons avec tendresse les personnes en situation de handicap et leurs aidants pour créer une communauté bienveillante.'
    },
    {
      icon: '🌱',
      title: 'Cultiver l\'autonomie',
      description: 'Nos ateliers personnalisés et notre accompagnement attentionné permettent à chacun de grandir et de s\'épanouir à son rythme, dans la joie et la confiance.'
    },
    {
      icon: '☀️',
      title: 'Rayonner de bonheur',
      description: 'Nous créons des moments magiques et des activités inclusives qui réchauffent les cœurs et illuminent le quotidien de toutes les familles.'
    }
  ];

  const impacts = [
    {
      amount: '20 €',
      description: 'Finance un atelier d\'initiation numérique plein de découvertes'
    },
    {
      amount: '50 €',
      description: 'Offre une bulle de réconfort avec une consultation psychologique'
    },
    {
      amount: '100 €',
      description: 'Soutient un aidant grâce à une formation enrichissante'
    }
  ];

  return (
    <div className={styles.donationContainer}>
      <section className={styles.hero}>
        <h1>Ensemble pour l&apos;inclusion et la solidarité</h1>
      </section>

      <section className={styles.whySupport}>
        <div className={styles.container2}>
          <div className={styles.sectionContent}>
            <h2 className={styles.sectionTitle}>Pourquoi nous soutenir ?</h2>
            <p className={styles.sectionSubtitle}>
              « La solidarité est la tendresse des peuples » – Che Guevara
            </p>
            <div className={styles.reasonsGrid}>
              {reasons.map((reason, index) => (
                <div key={index} className={styles.reasonCard}>
                  <div className={styles.reasonIcon}>{reason.icon}</div>
                  <h3>{reason.title}</h3>
                  <p>{reason.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.impactSection}>
        <div className={styles.container2}>
          <h2 className={styles.sectionTitle}>Votre impact, notre fierté</h2>
          <p className={styles.sectionSubtitle}>
            Avec chaque euro, vous semez l&apos;entraide et récoltez le bonheur
          </p>
          <div className={styles.impactGrid}>
            {impacts.map((impact, index) => (
              <div key={index} className={styles.impactCard}>
                <div className={styles.amount}>{impact.amount}</div>
                <div className={styles.description}>{impact.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.donationSection}>
        <div className={styles.container2}>
          <div className={styles.donationContent}>
            <div className={styles.donationInfo}>
              <h2>Donner avec le cœur</h2>
              <p className={styles.donationDescription}>
                Grâce à votre générosité, nous pouvons continuer à développer nos actions solidaires 
                et accompagner toujours plus de personnes vers l&apos;autonomie et le bien-être.
              </p>
              <div className={styles.donationMethods}>
                <h3>Vos options de don</h3>
                <ul>
                  <li>En ligne via notre plateforme sécurisée</li>
                  <li>Par chèque à l&apos;ordre de « Maison d&apos;Actions Solidaires »</li>
                  <li>Par virement bancaire en toute simplicité</li>
                </ul>
              </div>
            </div>
            <div className={styles.qrCodeSection}>
              <div className={styles.qrCodeContainer}>
                <h3>Un scan, un sourire !</h3>
                <div className={styles.qrCodeFrame}>
                  <Image
                    src="/images/faireundon/qrcodedon.png"
                    alt="QR Code pour faire un don"
                    width={200}
                    height={200}
                  />
                </div>
                <p className={styles.qrInstruction}>
                  Scannez ce code avec votre téléphone pour accéder directement à notre plateforme de don
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.associationInfo}>
        <div className={styles.container2}>
          <div className={styles.contactInfo}>
            <p>
              <strong>Votre don est déductible des impôts selon la réglementation fiscale en vigueur.</strong>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}