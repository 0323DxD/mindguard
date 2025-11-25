import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';
import styles from './Landing.module.css';

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { startAnonymous } = useAuth();

  const handleAnonymous = () => {
    startAnonymous();
    navigate('/dashboard');
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <img src={logo} alt="MindGuard Logo" className={styles.logo} />
        <h1 className={styles.title}>MindGuard</h1>
        <p className={styles.subtitle}>Empathetic AI & Crisis Support for LSPU students</p>

        <div className={styles.actions}>
          <Button variant="primary" size="lg" onClick={handleAnonymous}>
            Continue as Guest
          </Button>

          <div className={styles.divider}>
            <span>OR</span>
          </div>

          <div className={styles.row}>
            <Button variant="outline" className={styles.half} onClick={() => navigate('/login')}>
              Login
            </Button>
            <Button variant="outline" className={styles.half} onClick={() => navigate('/signup')}>
              Sign Up
            </Button>
          </div>
          
          <p className={styles.disclaimer}>
            <strong>⚠️ Security Notice:</strong> This is a secure demo. Data is encrypted locally.
          </p>
        </div>
      </div>
    </div>
  );
};
