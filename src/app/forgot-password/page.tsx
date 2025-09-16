'use client';

import React, { useState, ChangeEvent, FormEvent } from 'react';
import Link from 'next/link';
import styles from './forgot-password.module.css';

interface FormErrors {
  [key: string]: string;
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState<string>('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);

    // Nettoyer l'erreur du champ en cours
    if (errors.email) {
      setErrors(prev => ({ ...prev, email: '' }));
    }

    // Nettoyer le message succès si on retape
    if (message) setMessage('');
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!email) {
      newErrors.email = "L'adresse email est requise";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Veuillez entrer une adresse email valide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setMessage('Un email de récupération a été envoyé à votre adresse email.');
        setEmail('');
        setErrors({});
      } else {
        const errorData = await response.json();
        setErrors({
          email: errorData?.message || 'Une erreur est survenue',
        });
      }
    } catch {
      setErrors({ email: 'Erreur de connexion. Veuillez réessayer.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        <h1 className={styles.title}>Mot de passe oublié</h1>
        <p className={styles.description}>
          Entrez votre adresse email pour recevoir un lien de récupération.
        </p>

        {message && <div className={styles.successMessage}>{message}</div>}

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Adresse email</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Adresse email"
              value={email}
              onChange={handleInputChange}
              disabled={isLoading}
              required
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
            />
            {errors.email && <p className={styles.errorText}>{errors.email}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={styles.submitButton}
          >
            {isLoading ? 'Envoi en cours...' : 'Envoyer le lien de récupération'}
          </button>

          <div className={styles.backToLogin}>
            <Link href="/login" className={styles.link}>
              Retour à la connexion
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
