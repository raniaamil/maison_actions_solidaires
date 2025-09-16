'use client';

import React, { useState, ChangeEvent, FormEvent } from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import styles from './register.module.css';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  acceptTerms: boolean;
}

type FormErrors = Partial<Record<keyof FormData | 'general', string>>;

export default function RegisterPage() {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    acceptTerms: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // clear error du champ en cours
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    // clear le message succès si on modifie le formulaire
    if (successMessage) setSuccessMessage('');
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Le prénom est requis';
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = 'Le prénom doit contenir au moins 2 caractères';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Le nom est requis';
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = 'Le nom doit contenir au moins 2 caractères';
    }

    if (!formData.email) {
      newErrors.email = "L'adresse email est requise";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Veuillez entrer une adresse email valide';
    }

    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'La confirmation du mot de passe est requise';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    if (formData.phone && !/^[\d\s\-\+\(\)]{10,}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Veuillez entrer un numéro de téléphone valide';
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = "Vous devez accepter les conditions d'utilisation";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors(prev => ({ ...prev, general: undefined }));

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.toLowerCase().trim(),
          password: formData.password,
          phone: formData.phone?.trim() || null,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMessage('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: '',
          phone: '',
          acceptTerms: false,
        });
        setErrors({});
      } else {
        setErrors({
          general: data?.message || 'Erreur lors de la création du compte. Veuillez réessayer.',
        });
      }
    } catch {
      setErrors({
        general:
          'Erreur de connexion. Veuillez vérifier votre connexion internet et réessayer.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        <h1 className={styles.title}>Créer un compte</h1>

        {errors.general && <div className={styles.generalError}>{errors.general}</div>}

        {successMessage && (
          <div
            style={{
              background: '#ecfdf5',
              border: '1px solid #6ee7b7',
              borderRadius: 8,
              padding: '12px 16px',
              marginBottom: 20,
              color: '#065f46',
              fontSize: 14,
              fontWeight: 500,
              textAlign: 'center',
            }}
          >
            {successMessage}
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.formGrid}>
            {/* Prénom */}
            <div className={styles.inputGroup}>
              <label htmlFor="firstName">Prénom *</label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                placeholder="Votre prénom"
                value={formData.firstName}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`${styles.input} ${errors.firstName ? styles.inputError : ''}`}
                required
              />
              {errors.firstName && <p className={styles.errorText}>{errors.firstName}</p>}
            </div>

            {/* Nom */}
            <div className={styles.inputGroup}>
              <label htmlFor="lastName">Nom *</label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                placeholder="Votre nom"
                value={formData.lastName}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`${styles.input} ${errors.lastName ? styles.inputError : ''}`}
                required
              />
              {errors.lastName && <p className={styles.errorText}>{errors.lastName}</p>}
            </div>

            {/* Email (pleine largeur) */}
            <div className={`${styles.inputGroup} ${styles.formGridFull}`}>
              <label htmlFor="email">Adresse email *</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="votre.email@exemple.com"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                required
              />
              {errors.email && <p className={styles.errorText}>{errors.email}</p>}
            </div>

            {/* Téléphone (pleine largeur) */}
            <div className={`${styles.inputGroup} ${styles.formGridFull}`}>
              <label htmlFor="phone">Téléphone (optionnel)</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                placeholder="06 12 34 56 78"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={isLoading}
                className={`${styles.input} ${errors.phone ? styles.inputError : ''}`}
              />
              {errors.phone && <p className={styles.errorText}>{errors.phone}</p>}
            </div>

            {/* Mot de passe */}
            <div className={styles.inputGroup}>
              <label htmlFor="password">Mot de passe *</label>
              <div className={styles.passwordWrapper}>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Minimum 8 caractères"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className={`${styles.input} ${styles.passwordInput} ${
                    errors.password ? styles.inputError : ''
                  }`}
                  required
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword(v => !v)}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className={styles.errorText}>{errors.password}</p>}
              <p style={{ marginTop: 4, fontSize: 12, color: '#6b7280' }}>
                Le mot de passe doit contenir au moins 8 caractères avec une minuscule, une majuscule et un chiffre.
              </p>
            </div>

            {/* Confirmation mot de passe */}
            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword">Confirmer le mot de passe *</label>
              <div className={styles.passwordWrapper}>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Confirmez votre mot de passe"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className={`${styles.input} ${styles.passwordInput} ${
                    errors.confirmPassword ? styles.inputError : ''
                  }`}
                  required
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  aria-label={
                    showConfirmPassword ? 'Masquer la confirmation' : 'Afficher la confirmation'
                  }
                  aria-pressed={showConfirmPassword}
                  onClick={() => setShowConfirmPassword(v => !v)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className={styles.errorText}>{errors.confirmPassword}</p>
              )}
            </div>

            {/* Conditions (pleine largeur) */}
            <div className={`${styles.formGridFull}`}>
              <label htmlFor="acceptTerms" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  id="acceptTerms"
                  name="acceptTerms"
                  type="checkbox"
                  checked={formData.acceptTerms}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
                <span>
                  J&apos;accepte les{' '}
                  <Link href="/conditions" className={styles.link}>
                    conditions d&apos;utilisation
                  </Link>{' '}
                  et la{' '}
                  <Link href="/confidentialite" className={styles.link}>
                    politique de confidentialité
                  </Link>
                </span>
              </label>
              {errors.acceptTerms && <p className={styles.errorText}>{errors.acceptTerms}</p>}
            </div>
          </div>

          <button type="submit" disabled={isLoading} className={styles.submitButton}>
            {isLoading ? 'Création en cours...' : 'Créer mon compte'}
          </button>

          <p className={styles.loginLink}>
            Déjà un compte ?{' '}
            <Link href="/login" className={styles.link}>
              Se connecter
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
