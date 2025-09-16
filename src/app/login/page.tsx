'use client';

import React, { useState, ChangeEvent, FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import styles from './login.module.css';

interface FormData {
  email: string;
  password: string;
}

type FormErrors = Partial<Record<'email' | 'password' | 'general', string>>;

export default function LoginPage() {
  const [formData, setFormData] = useState<FormData>({ email: '', password: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);

  const { login } = useAuth();

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error on typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.email) {
      newErrors.email = "L'adresse email est requise";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Veuillez entrer une adresse email valide';
    }

    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
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
      await login(formData.email, formData.password);
      // Redirection gérée par le contexte si besoin
      if (rememberMe) {
        // Si tu veux réellement mémoriser l'email, tu peux utiliser localStorage ici
        // localStorage.setItem('rememberEmail', formData.email);
      }
    } catch (error: any) {
      setErrors({
        general: error?.message || 'Erreur de connexion. Vérifiez vos identifiants.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        <h1 className={styles.title}>Connexion</h1>

        {errors.general && (
          <div
            role="alert"
            aria-live="assertive"
            className={styles.errorText}
            style={{ marginBottom: 12 }}
          >
            {errors.general}
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className={styles.inputGroup}>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Adresse e-mail"
              value={formData.email}
              onChange={handleInputChange}
              disabled={isLoading}
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              required
            />
            {errors.email && <p className={styles.errorText}>{errors.email}</p>}
          </div>

          {/* Password */}
          <div className={styles.inputGroup}>
            <div className={styles.passwordWrapper}>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Mot de passe"
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
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                className={styles.togglePassword}
                onClick={() => setShowPassword(v => !v)}
                disabled={isLoading}
              >
                {showPassword ? '👁️‍🗨️' : '👁️'}
              </button>
            </div>
            {errors.password && <p className={styles.errorText}>{errors.password}</p>}
          </div>

          {/* Options */}
          <div className={styles.optionsRow}>
            <label className={styles.checkboxContainer} htmlFor="remember-me">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                className={styles.checkbox}
                disabled={isLoading}
              />
              <span className={styles.checkboxLabel}>Se souvenir de moi</span>
            </label>

            <Link href="/forgot-password" className={styles.forgotPassword}>
              Mot de passe oublié ?
            </Link>
          </div>

          {/* Submit */}
          <button type="submit" disabled={isLoading} className={styles.submitButton}>
            {isLoading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
          
        </form>
      </div>
    </div>
  );
}
