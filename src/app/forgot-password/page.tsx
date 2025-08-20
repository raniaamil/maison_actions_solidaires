'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './forgot-password.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' | 'error'
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    setEmail(e.target.value);
    
    // Clear error when user starts typing
    if (errors.email) {
      setErrors({});
    }
    
    // Clear messages
    if (message) {
      setMessage('');
      setMessageType('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'L\'adresse e-mail est requise';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'L\'adresse e-mail n\'est pas valide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setMessage('');
    setMessageType('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Un email de réinitialisation a été envoyé à votre adresse. Vérifiez votre boîte de réception.');
        setMessageType('success');
        setEmail(''); // Clear form
      } else {
        setMessage(data.error || 'Une erreur est survenue lors de l\'envoi de l\'email');
        setMessageType('error');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setMessage('Erreur de connexion au serveur. Veuillez réessayer.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        <h1 className={styles.title}>Mot de passe oublié</h1>
        
        <p className={styles.description}>
          Entrez votre adresse e-mail et nous vous enverrons un lien pour réinitialiser votre mot de passe.
        </p>

        {message && (
          <div className={messageType === 'success' ? styles.successMessage : styles.errorMessage}>
            {message}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <input
              type="email"
              placeholder="Adresse e-mail"
              value={email}
              onChange={handleInputChange}
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              disabled={isLoading}
            />
            {errors.email && <span className={styles.errorText}>{errors.email}</span>}
          </div>

          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={isLoading || messageType === 'success'}
          >
            {isLoading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
          </button>
        </form>

        <div className={styles.backToLogin}>
          <Link href="/login" className={styles.link}>← Retour à la connexion</Link>
        </div>
      </div>
    </div>
  );
}