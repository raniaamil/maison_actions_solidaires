'use client';

import React, { useState } from 'react';
import styles from './contact.module.css';
import { FaFacebookF } from 'react-icons/fa';

const Contact = () => {
  const [formData, setFormData] = useState({
    firstname: '',
    surname: '',
    email: '',
    subject: '',
    message: '',
    notRobot: false
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Traitement du formulaire ici
    console.log('Form submitted:', formData);
  };

  return (
    <section className={styles.contactContainer}>
      <div className={styles.contactInfo}>
        <p className={styles.title}>NOUS CONTACTER</p>
        <p className={styles.mainTitle}>Contactez-nous aujourd'hui</p>
        <p className={styles.description}>
          Nous apprécions les questions et les retours – et nous sommes toujours ravis d'aider ! 
          Voici quelques moyens de nous contacter.
        </p>

        <div className={styles.contactItem}>
          <div className={`${styles.iconBox} ${styles.emailIcon}`}>
            <i className="fa-solid fa-envelope"></i>
          </div>
          <div>
            <p className={styles.contactType}>Email</p>
            <p className={styles.contactDetail}>maisondactionsolidaire@gmail.com</p>
          </div>
        </div>

        <div className={styles.contactItem}>
          <div className={`${styles.iconBox} ${styles.phoneIcon}`}>
            <i className="fa-solid fa-phone"></i>
          </div>
          <div>
            <p className={styles.contactType}>Téléphone</p>
            <p className={styles.contactDetail}>(+33) 07 82 16 90 08</p>
          </div>
        </div>

        <p className={styles.followUs}>Suivez-nous sur:</p>
        <div className={styles.socialIcons}>
          <a href="#" className={styles.socialIcon}>
            <FaFacebookF size={24} color="#838C58"/>
          </a>
          {/* <a href="#" className={styles.socialIcon}>
            <FaTwitter size={24} />
          </a>
          <a href="#" className={styles.socialIcon}>
            <FaInstagram size={24} />
          </a> */}
        </div>
      </div>

      <div className={styles.contactForm}>
        <form onSubmit={handleSubmit}>
          <label htmlFor="firstname">Prénom</label>
          <input
            type="text"
            id="firstname"
            name="firstname"
            placeholder="Votre prénom"
            value={formData.firstname}
            onChange={handleInputChange}
            required
          />

          <label htmlFor="surname">Nom</label>
          <input
            type="text"
            id="surname"
            name="surname"
            placeholder="Votre nom"
            value={formData.surname}
            onChange={handleInputChange}
            required
          />

          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Votre adresse email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />

          <label htmlFor="subject">Sujet</label>
          <input
            type="text"
            id="subject"
            name="subject"
            placeholder="Votre sujet"
            value={formData.subject}
            onChange={handleInputChange}
            required
          />

          <label htmlFor="message">Laissez-nous un message</label>
          <textarea
            id="message"
            name="message"
            placeholder="Écrivez votre message ici..."
            value={formData.message}
            onChange={handleInputChange}
            required
          />

          <div className={styles.captcha}>
            <input
              type="checkbox"
              className={styles.checkbox}
              id="notRobot"
              name="notRobot"
              checked={formData.notRobot}
              onChange={handleInputChange}
              required
            />
            <label htmlFor="notRobot" className={styles.checkboxText}>
              Je ne suis pas un robot
            </label>
            <img 
              src="/images/contact/recaptcha_sans_fond-removebg-preview.png" 
              alt="image recaptcha" 
            />
          </div>

          <button type="submit" className={styles.submitButton}>
            Envoyer le message
          </button>
        </form>
      </div>
    </section>
  );
};

export default Contact;