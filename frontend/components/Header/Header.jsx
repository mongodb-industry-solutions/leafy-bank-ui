"use client";

// Header.jsx

import { useState, useEffect } from "react";
import { Body } from '@leafygreen-ui/typography';
import Link from 'next/link';
import Image from 'next/image';
import IconButton from '@leafygreen-ui/icon-button';
import Icon from '@leafygreen-ui/icon';
import { usePathname } from 'next/navigation';
import UserProfile from '@/components/UserProfile/UserProfile';
import RiskProfileSelector from '@/components/RiskProfileSelector/RiskProfileSelector';
import styles from "./Header.module.css";

function Header({ onLogout = () => { } }) {

  const [isMenuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const [selectedUser, setSelectedUser] = useState(null);
  const [isPortfolioManager, setIsPortfolioManager] = useState(false);

  useEffect(() => {
    const storedUserString = localStorage.getItem('selectedUser');
    const user = storedUserString ? JSON.parse(storedUserString) : null;
    setSelectedUser(user);
    setIsPortfolioManager(user?.role === 'Portfolio Manager');
  }, []);

  console.log("Selected user:", selectedUser);
  console.log("Is portfolio manager:", isPortfolioManager);

  // Updated handleLogout function
  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('user');
    localStorage.removeItem('accounts');
    localStorage.removeItem('transactions');
    // Clear previous external data
    localStorage.removeItem('external_accounts');
    localStorage.removeItem('external_products');
    localStorage.removeItem('connected_external_accounts');
    localStorage.removeItem('connected_external_products');
    onLogout(); // Calls the logout function passed as prop
  };

  const toggleMenu = () => {
    setMenuOpen(!isMenuOpen);
  };

  return (
    <div className={styles["layout-header"]}>
      <div className={styles["logo-container"]}>
        <Image className={styles.leafyLogo} src={'/images/logo.png'} alt="Logo" width={200} height={50} />
      </div>

      <div className={`${styles["pages-container"]} ${isMenuOpen ? styles.show : ''}`}>


        {/**  {pathname === '/' && (
          <Link
            href="/"
            className={`${styles.navLink} ${pathname === '/' ? styles.activeLink : ''}`}
          >
            <Body className={styles.navLinkText}>Accounts & Transactions</Body>
          </Link>
        )} */}

        {!isPortfolioManager && (
          <Link
            href="/"
            className={`${styles.navLink} ${pathname === '/' ? styles.activeLink : ''}`}
          >
            <Body className={styles.navLinkText}>Accounts & Transactions</Body>
          </Link>
        )}

        <Link
          href="/asset-portfolio"
          className={`${styles.navLink} ${pathname === '/asset-portfolio' ? styles.activeLink : ''}`}
        >
          <Body className={styles.navLinkText}>Investment Portfolio</Body>
        </Link>

        <Link
          href="/crypto-portfolio"
          className={`${styles.navLink} ${pathname === '/crypto-portfolio' ? styles.activeLink : ''}`}
        >
          <Body className={styles.navLinkText}>Crypto Portfolio</Body>
        </Link>

        {/* Updated Mobile Logout - Directly using onClick */}
        <div className={styles.linkHideDesktop} onClick={handleLogout}>
          <Body>Log Out</Body>
        </div>
      </div>

      <div className={styles["right-container"]}>


        {['/asset-portfolio', '/crypto-portfolio'].includes(pathname) && (
          <>
            <RiskProfileSelector />
          </>
        )}

        <UserProfile></UserProfile>

        {/* Desktop Logout Icon Button */}
        <IconButton
          aria-label="LogOut"
          onClick={handleLogout}
          className={styles.logoutIcon}
        >
          <Icon glyph="LogOut" />
        </IconButton>

        {/* Hamburger Menu Button */}
        <IconButton aria-label="Menu" onClick={toggleMenu} className={styles.hamburgerIcon}>
          <Icon glyph={isMenuOpen ? "X" : "Menu"} />
        </IconButton>
      </div>
    </div >
  );
}

export default Header;
