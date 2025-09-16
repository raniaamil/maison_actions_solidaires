'use client';

import React, { useState, useEffect, ChangeEvent, FormEvent, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import styles from './reset-password.module.css';

interface FormData {
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  [key: string]: string;
}

// Icônes inline (pas de lib externe)
const Eye = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const EyeOff = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
    <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.8 20.8 0 0 1 5.06-6.94m3.27-1.67A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a20.7 20.7 0 0 1-3.24 4.52" />
    <path d="M1 1l22 22" />
  </svg>
);

// Écran de chargement (simple, sans Tailwind)
function ResetPasswordLoading() {
  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        <h1 className={styles.title}>Vérification du lien…</h1>
        <p className={styles.description}>Merci de patienter un instant.</p>
      </div>
    </div>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<FormData>({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [token, setToken] = useState<string>('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Vérifie le token à l'ouverture
  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');

    if (!tokenFromUrl) {
      setMessage('Lien de réinitialisation invalide ou expiré');
      setMessageType('error');
      setTokenValid(false);
      return;
    }

    setToken(tokenFromUrl);

    const verifyToken = async () => {
      try {
        const response = await fetch('/api/auth/verify-reset-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: tokenFromUrl }),
        });

        if (response.ok) {
          setTokenValid(true);
        } else {
          const data = await response.json();
          setMessage(data.message || 'Lien de réinitialisation invalide ou expiré');
          setMessageType('error');
          setTokenValid(false);
        }
      } catch {
        setMessage('Erreur de vérification du lien');
        setMessageType('error');
        setTokenValid(false);
      }
    };

    verifyToken();
  }, [searchParams]);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    if (message) {
      setMessage('');
      setMessageType('');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.password) {
      newErrors.password = 'Le nouveau mot de passe est requis';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'La confirmation du mot de passe est requise';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: formData.password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Mot de passe réinitialisé avec succès ! Vous pouvez maintenant vous connecter.');
        setMessageType('success');
        setFormData({ password: '', confirmPassword: '' });
      } else {
        setMessage(data.message || 'Erreur lors de la réinitialisation du mot de passe');
        setMessageType('error');
      }
    } catch {
      setMessage('Erreur de connexion. Veuillez réessayer.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  // En cours de vérification
  if (tokenValid === null) return <ResetPasswordLoading />;

  // Token invalide
  if (tokenValid === false) {
    return (
      <div className={styles.container}>
        <div className={styles.formCard}>
          <h1 className={styles.title}>Lien invalide</h1>
          <div className={styles.errorMessage}>{message}</div>
          <div className={styles.backToLogin}>
            <Link href="/forgot-password" className={styles.link}>
              Demander un nouveau lien de réinitialisation
            </Link>
          </div>
          <div className={styles.backToLogin}>
            <Link href="/login" className={styles.link}>
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Formulaire principal
  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        <h1 className={styles.title}>Nouveau mot de passe</h1>
        <p className={styles.description}>Choisissez un nouveau mot de passe sécurisé pour votre compte.</p>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          {message && (
            <div className={messageType === 'success' ? styles.successMessage : styles.errorMessage}>
              {message}
            </div>
          )}

          {messageType === 'success' ? (
            <div className={styles.backToLogin}>
              <Link href="/login" className={styles.link}>
                Se connecter
              </Link>
            </div>
          ) : (
            <>
              {/* Mot de passe */}
              <div className={styles.inputGroup}>
                <div className={styles.passwordWrapper}>
                  <input
                    id="password"
                    name="password"
                    type={showPwd ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Nouveau mot de passe"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    required
                    className={`${styles.input} ${styles.passwordInput} ${errors.password ? styles.inputError : ''}`}
                  />
                  <button
                    type="button"
                    aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    className={styles.togglePassword}
                    onClick={() => setShowPwd(s => !s)}
                    disabled={isLoading}
                  >
                    {showPwd ? "👁️‍🗨️" : "👁️"}
                  </button>
                </div>
                {errors.password && <p className={styles.errorText}>{errors.password}</p>}
              </div>

              {/* Confirmation */}
              <div className={styles.inputGroup}>
                <div className={styles.passwordWrapper}>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Confirmez le nouveau mot de passe"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    disabled={isLoading}
                    required
                    className={`${styles.input} ${styles.passwordInput} ${errors.confirmPassword ? styles.inputError : ''}`}
                  />
                  <button
                    type="button"
                    aria-label={showConfirm ? 'Masquer la confirmation' : 'Afficher la confirmation'}
                    className={styles.togglePassword}
                    onClick={() => setShowConfirm(s => !s)}
                    disabled={isLoading}
                  >
                    {showConfirm ? "👁️‍🗨️" : "👁️"}
                  </button>
                </div>
                {errors.confirmPassword && <p className={styles.errorText}>{errors.confirmPassword}</p>}
              </div>

              <button type="submit" disabled={isLoading} className={styles.submitButton}>
                {isLoading ? 'Réinitialisation en cours...' : 'Mettre à jour le mot de passe'}
              </button>
            </>
          )}

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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
