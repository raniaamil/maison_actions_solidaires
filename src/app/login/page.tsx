'use client';

import { useState } from 'react';
import styles from './login.module.css';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.email.trim()) {
      newErrors.email = 'L\'adresse e-mail est requise';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'L\'adresse e-mail n\'est pas valide';
    }

    if (!formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsLoading(true);
      try {
        // Simulation d'une requête de connexion
        await new Promise(resolve => setTimeout(resolve, 1500));
        console.log('Connexion:', { ...formData, rememberMe });
        alert('Connexion réussie !');
      } catch (error) {
        console.error('Erreur de connexion:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleRememberMeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRememberMe(e.target.checked);
  };

  return (
    <div className={styles.container}>
      <div className={styles.formCard}>
        <h1 className={styles.title}>Connexion</h1>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <input
              type="email"
              name="email"
              placeholder="Adresse e-mail"
              value={formData.email}
              onChange={handleInputChange}
              className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
              disabled={isLoading}
            />
            {errors.email && <span className={styles.errorText}>{errors.email}</span>}
          </div>

          <div className={styles.inputGroup}>
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Mot de passe"
                value={formData.password}
                onChange={handleInputChange}
                className={`${styles.input} ${styles.passwordInput} ${errors.password ? styles.inputError : ''}`}
                disabled={isLoading}
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={togglePasswordVisibility}
                disabled={isLoading}
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? "👁️‍🗨️" : "👁️"}
              </button>
            </div>
            {errors.password && <span className={styles.errorText}>{errors.password}</span>}
          </div>

          <div className={styles.optionsRow}>
            <label className={styles.checkboxContainer}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={handleRememberMeChange}
                className={styles.checkbox}
                disabled={isLoading}
              />
              <span className={styles.checkboxLabel}>Se souvenir de moi</span>
            </label>
            
            <a href="/forgot-password" className={styles.forgotPassword}>
              Mot de passe oublié ?
            </a>
          </div>

          <button 
            type="submit" 
            className={`${styles.submitButton} ${isLoading ? styles.loading : ''}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <span className={styles.loadingContent}>
                <span className={styles.spinner}></span>
                Connexion...
              </span>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        <div className={styles.registerLink}>
          <span>Pas encore de compte ? </span>
          <a href="/register" className={styles.link}>S'inscrire</a>
        </div>
      </div>
    </div>
  );
}