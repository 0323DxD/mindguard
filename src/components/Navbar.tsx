import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaHome, FaCommentDots, FaChartBar, FaUser, FaBook } from 'react-icons/fa';
import styles from './Navbar.module.css';

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className={styles.navbar}>
      <button
        className={`${styles.navBtn} ${isActive('/dashboard') ? styles.active : ''}`}
        onClick={() => navigate('/dashboard')}
      >
        <FaHome />
        <span className={styles.label}>Home</span>
      </button>
      <button
        className={`${styles.navBtn} ${isActive('/chat') ? styles.active : ''}`}
        onClick={() => navigate('/chat')}
      >
        <FaCommentDots />
        <span className={styles.label}>Chat</span>
      </button>
      <button
        className={`${styles.navBtn} ${isActive('/journal') ? styles.active : ''}`}
        onClick={() => navigate('/journal')}
      >
        <FaBook />
        <span className={styles.label}>Journal</span>
      </button>
      <button
        className={`${styles.navBtn} ${isActive('/wellness') ? styles.active : ''}`}
        onClick={() => navigate('/wellness')}
      >
        <FaChartBar />
        <span className={styles.label}>Wellness</span>
      </button>
      <button
        className={`${styles.navBtn} ${isActive('/resources') ? styles.active : ''}`}
        onClick={() => navigate('/resources')}
      >
        <FaBook />
        <span className={styles.label}>Resources</span>
      </button>
      <button
        className={`${styles.navBtn} ${isActive('/profile') ? styles.active : ''}`}
        onClick={() => navigate('/profile')}
      >
        <FaUser />
        <span className={styles.label}>Profile</span>
      </button>
    </nav>
  );
};
