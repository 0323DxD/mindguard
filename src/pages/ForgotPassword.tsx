import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import styles from './Auth.module.css';

export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Mock API call delay
    setTimeout(() => {
      setMessage(`If an account matches ${email}, a password reset link has been sent.`);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2 className={styles.title}>Reset Password</h2>
        <p className={styles.subtitle}>Enter your email to receive recovery instructions.</p>

        {message ? (
          <div style={{ backgroundColor: "#dcfce7", color: "#166534", padding: "1rem", borderRadius: "0.5rem", marginBottom: "1.5rem", textAlign: "center", fontSize: "0.875rem" }}>
            {message}
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <Input
              label="Rescue Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@lspu.edu.ph"
              required
              fullWidth
            />
            <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full mt-4">
              Send Reset Link
            </Button>
          </form>
        )}

        <div className={styles.footer} style={{ marginTop: "1.5rem" }}>
          <p><span className={styles.link} onClick={() => navigate('/login')}>Back to Log In</span></p>
        </div>
      </div>
    </div>
  );
};
