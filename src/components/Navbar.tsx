'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '../contexts/AuthContext';
import styles from './Navbar.module.css';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleUserDropdown = () => {
    setIsUserDropdownOpen(!isUserDropdownOpen);
  };

  const handleLogout = () => {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      logout();
    }
    setIsMobileMenuOpen(false);
    setIsUserDropdownOpen(false);
  };

  const closeMenus = () => {
    setIsMobileMenuOpen(false);
    setIsUserDropdownOpen(false);
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <Link href="/">
              <Image
                src="/images/navbar/logo_mas.png"
                className={styles.logoImage}
                alt="Logo Maison d'Actions Solidaires"
                width={200}
                height={60}
                priority
              />
            </Link>
          </div>

          <div className={styles.desktopMenu}>
            <div className={styles.desktopMenuItems}>
              <Link href="/association" className={styles.navLink}>
                L'association
              </Link>
              <Link href="/nosactions" className={styles.navLink}>
                Nos Actions
              </Link>
              <Link href="/actualites" className={styles.navLink}>
                Actualités
              </Link>
              <Link href="/contact" className={styles.navLink}>
                Contact
              </Link>
            </div>
            <div className={styles.desktopButtons}>
              {/* Menu déroulant utilisateur pour desktop */}
              <div className={styles.dropdown}>
                <input 
                  type="checkbox" 
                  id="user-dropdown-checkbox" 
                  className={styles.dropdownCheckbox}
                  checked={isUserDropdownOpen}
                  onChange={toggleUserDropdown}
                />
                <label htmlFor="user-dropdown-checkbox" className={styles.dropdownToggle}>
                  <svg className={styles.userIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span className={styles.dropdownArrow}>▼</span>
                </label>
                <div className={styles.dropdownMenu}>
                  {isAuthenticated() ? (
                    <>
                      <Link href="/administrateur" className={styles.dropdownItem} onClick={closeMenus}>
                        Espace Admin
                      </Link>
                      <button onClick={handleLogout} className={styles.dropdownItem}>
                        Déconnexion
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/register" className={styles.dropdownItem} onClick={closeMenus}>
                        Inscription
                      </Link>
                      <Link href="/login" className={styles.dropdownItem} onClick={closeMenus}>
                        Connexion
                      </Link>
                    </>
                  )}
                </div>
              </div>
              
              <Link href="/faireundon" className={styles.donateButton}>
                Faire un don
              </Link>
            </div>
          </div>

          <div className={styles.hamburgerContainer}>
            <button 
              className={styles.hamburgerButton}
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
            >
              <svg className={styles.hamburgerIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  className={!isMobileMenuOpen ? '' : styles.hidden}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
                <path
                  className={isMobileMenuOpen ? '' : styles.hidden}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.mobileMenuOpen : styles.mobileMenuClosed}`}>
          <div className={styles.mobileMenuContent}>
            <Link href="/association" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>
              L'association
            </Link>
            <Link href="/nosactions" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>
              Nos Actions
            </Link>
            <Link href="/actualites" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>
              Actualités
            </Link>
            <Link href="/contact" className={styles.mobileNavLink} onClick={() => setIsMobileMenuOpen(false)}>
              Contact
            </Link>

            <div className={styles.mobileButtons}>
              {/* Menu déroulant utilisateur pour mobile */}
              <div className={styles.mobileDropdown}>
                <input 
                  type="checkbox" 
                  id="mobile-user-dropdown-checkbox" 
                  className={styles.dropdownCheckbox}
                  checked={isUserDropdownOpen}
                  onChange={toggleUserDropdown}
                />
                <label htmlFor="mobile-user-dropdown-checkbox" className={styles.mobileDropdownToggle}>
                  <svg className={styles.mobileUserIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span>
                    {isAuthenticated() ? `${user?.prenom} ${user?.nom}` : 'Mon compte'}
                  </span>
                  <span className={styles.dropdownArrow}>▼</span>
                </label>
                <div className={styles.mobileDropdownMenu}>
                  {isAuthenticated() ? (
                    <>
                      <Link href="/administrateur" className={styles.mobileDropdownItem} onClick={closeMenus}>
                        Espace Admin
                      </Link>
                      <button onClick={handleLogout} className={styles.mobileDropdownItem}>
                        Déconnexion
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/register" className={styles.mobileDropdownItem} onClick={closeMenus}>
                        Inscription
                      </Link>
                      <Link href="/login" className={styles.mobileDropdownItem} onClick={closeMenus}>
                        Connexion
                      </Link>
                    </>
                  )}
                </div>
              </div>
              
              <Link href="/faireundon" className={styles.mobileDonateButton} onClick={() => setIsMobileMenuOpen(false)}>
                Faire un don
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;