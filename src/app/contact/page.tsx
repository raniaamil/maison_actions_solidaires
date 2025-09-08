'use client';

import React, { useState } from 'react';
import styles from './contact.module.css';
import { FaFacebookF } from 'react-icons/fa';

type SubmitStatus = 'success' | 'error' | null;

interface ContactForm {
  firstname: string;
  surname: string;
  email: string;
  subject: string;
  message: string;
  notRobot: boolean;
}

type Errors = Partial<Record<keyof ContactForm, string>>;

const Contact: React.FC = () => {
  const [formData, setFormData] = useState<ContactForm>({
    firstname: '',
    surname: '',
    email: '',
    subject: '',
    message: '',
    notRobot: false,
  });

  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>(null); // 'success', 'error', null

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    // Narrowing explicite pour pouvoir lire "checked" uniquement sur les checkbox
    const target = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const key = target.name as keyof ContactForm;

    const nextValue =
      target instanceof HTMLInputElement && target.type === 'checkbox'
        ? (target.checked as ContactForm[typeof key])
        : (target.value as ContactForm[typeof key]);

    setFormData(prev => {
      const updated = { ...prev, [key]: nextValue } as ContactForm;
      return updated;
    });

    // Clear error when user starts typing
    if (errors[key]) {
      setErrors(prev => {
        const { [key]: _removed, ...rest } = prev;
        return rest;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Errors = {};

    if (!formData.firstname.trim()) {
      newErrors.firstname = 'Le prénom est requis';
    }

    if (!formData.surname.trim()) {
      newErrors.surname = 'Le nom est requis';
    }

    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "L'adresse e-mail n'est pas valide";
    }

    if (!formData.subject.trim()) {
      newErrors.subject = 'Le sujet est requis';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Le message est requis';
    }

    if (!formData.notRobot) {
      newErrors.notRobot = "Veuillez confirmer que vous n'êtes pas un robot";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      console.log('📤 Envoi du formulaire de contact...');

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data?.success) {
        console.log('✅ Message envoyé avec succès');
        setSubmitStatus('success');

        // Réinitialiser le formulaire
        setFormData({
          firstname: '',
          surname: '',
          email: '',
          subject: '',
          message: '',
          notRobot: false,
        });
        setErrors({});
      } else {
        console.error("❌ Erreur lors de l'envoi:", data);
        setSubmitStatus('error');

        if (data?.errors) {
          setErrors(data.errors as Errors);
        }
      }
    } catch (error) {
      console.error('❌ Erreur réseau:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <section className={styles.contactContainer}>
        <div className={styles.contactInfo}>
          <p className={styles.title}>NOUS CONTACTER</p>
          <p className={styles.mainTitle}>Contactez-nous aujourd&apos;hui</p>
          <p className={styles.description}>
            Nous apprécions les questions et les retours – et nous sommes toujours ravis d&apos;aider ! 
            Voici quelques moyens de nous contacter.
          </p>

          <div className={styles.contactItem}>
            <div className={`${styles.iconBox} ${styles.emailIcon}`}>
              <i className="fa-solid fa-envelope" />
            </div>
            <div>
              <p className={styles.contactType}>Email</p>
              <p className={styles.contactDetail}>maisondactionsolidaire@gmail.com</p>
            </div>
          </div>

          <div className={styles.contactItem}>
            <div className={`${styles.iconBox} ${styles.phoneIcon}`}>
              <i className="fa-solid fa-phone" />
            </div>
            <div>
              <p className={styles.contactType}>Téléphone</p>
              <p className={styles.contactDetail}>(+33) 07 82 16 90 08</p>
            </div>
          </div>

          <p className={styles.followUs}>Suivez-nous sur:</p>
          <div className={styles.socialIcons}>
            <a href="#" className={styles.socialIcon} aria-label="Facebook">
              <FaFacebookF size={24} color="#838C58" />
            </a>
          </div>
        </div>

        <div className={styles.contactForm}>
          {/* Messages de statut */}
          {submitStatus === 'success' && (
            <div
              style={{
                backgroundColor: '#d4edda',
                border: '1px solid #c3e6cb',
                color: '#155724',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '20px',
                textAlign: 'center',
              }}
            >
              ✅ Votre message a été envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.
            </div>
          )}

          {submitStatus === 'error' && (
            <div
              style={{
                backgroundColor: '#f8d7da',
                border: '1px solid #f5c6cb',
                color: '#721c24',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '20px',
                textAlign: 'center',
              }}
            >
              ❌ Une erreur est survenue lors de l&apos;envoi de votre message. Veuillez réessayer.
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label htmlFor="firstname">Prénom</label>
            <input
              type="text"
              id="firstname"
              name="firstname"
              placeholder="Votre prénom"
              value={formData.firstname}
              onChange={handleInputChange}
              className={errors.firstname ? 'error' : ''}
              disabled={isSubmitting}
              required
            />
            {errors.firstname && (
              <span style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '4px', display: 'block' }}>
                {errors.firstname}
              </span>
            )}

            <label htmlFor="surname">Nom</label>
            <input
              type="text"
              id="surname"
              name="surname"
              placeholder="Votre nom"
              value={formData.surname}
              onChange={handleInputChange}
              className={errors.surname ? 'error' : ''}
              disabled={isSubmitting}
              required
            />
            {errors.surname && (
              <span style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '4px', display: 'block' }}>
                {errors.surname}
              </span>
            )}

            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Votre adresse email"
              value={formData.email}
              onChange={handleInputChange}
              className={errors.email ? 'error' : ''}
              disabled={isSubmitting}
              required
            />
            {errors.email && (
              <span style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '4px', display: 'block' }}>
                {errors.email}
              </span>
            )}

            <label htmlFor="subject">Sujet</label>
            <input
              type="text"
              id="subject"
              name="subject"
              placeholder="Votre sujet"
              value={formData.subject}
              onChange={handleInputChange}
              className={errors.subject ? 'error' : ''}
              disabled={isSubmitting}
              required
            />
            {errors.subject && (
              <span style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '4px', display: 'block' }}>
                {errors.subject}
              </span>
            )}

            <label htmlFor="message">Laissez-nous un message</label>
            <textarea
              id="message"
              name="message"
              placeholder="Écrivez votre message ici..."
              value={formData.message}
              onChange={handleInputChange}
              className={errors.message ? 'error' : ''}
              disabled={isSubmitting}
              required
            />
            {errors.message && (
              <span style={{ color: '#dc2626', fontSize: '0.875rem', marginTop: '4px', display: 'block' }}>
                {errors.message}
              </span>
            )}

            <div className={styles.captcha}>
              <input
                type="checkbox"
                className={styles.checkbox}
                id="notRobot"
                name="notRobot"
                checked={formData.notRobot}
                onChange={handleInputChange}
                disabled={isSubmitting}
                required
              />
              <label htmlFor="notRobot" className={styles.checkboxText}>
                Je ne suis pas un robot
              </label>
              <img src="/images/contact/recaptcha_sans_fond-removebg-preview.png" alt="image recaptcha" />
              {errors.notRobot && (
                <span
                  style={{
                    color: '#dc2626',
                    fontSize: '0.875rem',
                    marginTop: '4px',
                    display: 'block',
                    width: '100%',
                    textAlign: 'center',
                  }}
                >
                  {errors.notRobot}
                </span>
              )}
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
              style={{ opacity: isSubmitting ? 0.6 : 1, cursor: isSubmitting ? 'not-allowed' : 'pointer' }}
            >
              {isSubmitting ? 'Envoi en cours...' : 'Envoyer le message'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Contact;

