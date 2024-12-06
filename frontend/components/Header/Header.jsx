"use client";

// Header.jsx

import { useState } from "react";
import { Body } from '@leafygreen-ui/typography';
import Link from 'next/link';
import Image from 'next/image';
import IconButton from '@leafygreen-ui/icon-button';
import Icon from '@leafygreen-ui/icon';

import UserProfile from '@/components/UserProfile/UserProfile';

import styles from "./Header.module.css";

function Header({ onLogout }) {
  const [isMenuOpen, setMenuOpen] = useState(false);

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem('user');
    localStorage.removeItem('accounts');
    localStorage.removeItem('transactions');
    onLogout();
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
        <Link href="/user" className={styles.linkHideDesktop}>
          <Body className={styles.linkHideDesktop}>Log Out</Body>
        </Link>
      </div>

      <div className={styles["right-container"]}>
        <UserProfile />
        <IconButton
          aria-label="LogOut"
          onClick={handleLogout}
          className={styles.logoutIcon}
        >
          <Icon glyph="LogOut" />
        </IconButton>
        <IconButton aria-label="Menu" onClick={toggleMenu} className={styles.hamburgerIcon}>
          <Icon glyph={isMenuOpen ? "X" : "Menu"} />
        </IconButton>
      </div>
    </div>
  );
}

export default Header;
