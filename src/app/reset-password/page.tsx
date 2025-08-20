'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './reset-password.module.css';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [errors, setErrors] = useState({});
  const [tokenValid, setTokenValid] = useState(null);

  useEffect(() => {
    // Vérifier si le token est présent
    if (!token) {
      setMessage('Lien de réinitialisation invalide ou expiré');
      setMessageType('error');
      setTokenValid(false);
      return;
    }

    // Vérifier la validité du token
    const verifyToken = async () => {
      try {
        const response = await fetch('/api/auth/verify-reset-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token })
        });

        if (response.ok) {
          setTokenValid(true);
        } else {
          const data = await response.json();
          setMessage(data.error || 'Lien de réinitialisation invalide ou expiré');
          setMessageType('error');
          setTokenValid(false);
        }
      } catch (error) {
        setMessage('Erreur de vérification du lien');
        setMessageType('error');
        setTokenValid(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Clear messages
    if (message) {
      setMessage('');
      setMessageType('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Veuillez confirmer votre mot de passe';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
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
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          token, 
          password: formData.password 
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.');
        setMessageType('success');
        
        // Rediriger vers la page de connexion après 3 secondes
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setMessage(data.error || 'Une erreur est survenue lors de la réinitialisation');
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

  const togglePasswordVisibility = (field) => {
    if (field === 'password') {
      setShowPassword(!showPassword);
    } else {
      setShowConfirmPassword(!showConfirmPassword);
    }
  };

  // Si le token n'est pas valide, afficher un message d'erreur
  if (tokenValid === false) {
    return (
      <div className={styles.container}>
        <div className={styles.formCard}>
          <h1 className={styles.title}>Lien invalide</h1>
          <div className={styles.errorMessage}>
            {message}
          </div>
          <div className={styles.backToLogin}>
            <Link href="/forgot-password" className={styles.link}>
              Demander un nouveau lien
            </Link>
            {' | '}
            <Link href="/login" className={styles.link}>
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Si en cours de vérification du token
  if (tokenValid === null) {
    return (
      <div className={styles.container}>
        <div className={styles.formCard}>
          <h1 className={styles.title}>Vérification...</h1>
          <p className={styles.description}>
            Vérification du lien de réinitialisation en cours...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        <h1 className={styles.title}>Nouveau mot de passe</h1>
        
        <p className={styles.description}>
          Choisissez un nouveau mot de passe sécurisé pour votre compte.
        </p>

        {message && (
          <div className={messageType === 'success' ? styles.successMessage : styles.errorMessage}>
            {message}
          </div>
        )}
        
        {messageType !== 'success' && (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Nouveau mot de passe"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`${styles.input} ${styles.passwordInput} ${errors.password ? styles.inputError : ''}`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => togglePasswordVisibility('password')}
                  disabled={isLoading}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? "👁️‍🗨️" : "👁️"}
                </button>
              </div>
              {errors.password && <span className={styles.errorText}>{errors.password}</span>}
            </div>

            <div className={styles.inputGroup}>
              <div className={styles.passwordWrapper}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirmer le nouveau mot de passe"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`${styles.input} ${styles.passwordInput} ${errors.confirmPassword ? styles.inputError : ''}`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => togglePasswordVisibility('confirmPassword')}
                  disabled={isLoading}
                  aria-label={showConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showConfirmPassword ? "👁️‍🗨️" : "👁️"}
                </button>
              </div>
              {errors.confirmPassword && <span className={styles.errorText}>{errors.confirmPassword}</span>}
            </div>

            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
            </button>
          </form>
        )}

        <div className={styles.backToLogin}>
          <Link href="/login" className={styles.link}>← Retour à la connexion</Link>
        </div>
      </div>
    </div>
  );
}