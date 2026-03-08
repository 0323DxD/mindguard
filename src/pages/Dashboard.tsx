import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { FaRobot, FaWind, FaUsers, FaCalendarCheck, FaBook } from 'react-icons/fa';
import styles from './Dashboard.module.css';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h2 className={styles.greeting}>Hi, {user?.fullname.split(' ')[0] || 'Friend'}</h2>
          <p className={styles.date}>{date}</p>
        </div>
        <div className={styles.headerActions}>
          {/* Placeholder for notifications/profile */}
        </div>
      </header>

      <Card title="How are you feeling?" className={styles.moodCard}>
        <div className={styles.moodGrid}>
          {['Great', 'Good', 'Okay', 'Down', 'Crisis'].map((mood) => (
            <button key={mood} className={styles.moodBtn}>
              <span className={styles.moodEmoji}>
                {mood === 'Great' ? '😄' : mood === 'Good' ? '🙂' : mood === 'Okay' ? '😐' : mood === 'Down' ? '😔' : '😫'}
              </span>
              <span className={styles.moodLabel}>{mood}</span>
            </button>
          ))}
        </div>
      </Card>

      <h3 className={styles.sectionTitle}>Quick Actions</h3>
      <div className={styles.actionGrid}>
        <Card className={styles.actionCard} padding={false}>
          <button className={styles.actionBtn} onClick={() => navigate('/chat')}>
            <FaRobot className={styles.actionIcon} />
            <span>AI Chat</span>
          </button>
        </Card>
        <Card className={styles.actionCard} padding={false}>
          <button className={styles.actionBtn} onClick={() => navigate('/wellness')}>
            <FaWind className={styles.actionIcon} />
            <span>Breathe</span>
          </button>
        </Card>
        <Card className={styles.actionCard} padding={false}>
          <button className={styles.actionBtn} onClick={() => navigate('/groups')}>
            <FaUsers className={styles.actionIcon} />
            <span>Peers</span>
          </button>
        </Card>
        <Card className={styles.actionCard} padding={false}>
          <button className={styles.actionBtn} onClick={() => navigate('/resources')}>
            <FaBook className={styles.actionIcon} />
            <span>Library</span>
          </button>
        </Card>
        <Card className={styles.actionCard} padding={false}>
          <button className={styles.actionBtn} onClick={() => navigate('/booking')}>
            <FaCalendarCheck className={styles.actionIcon} />
            <span>Counselor</span>
          </button>
        </Card>
      </div>

      <Card className={styles.emergencyCard}>
        <strong className={styles.emergencyTitle}>Need immediate help?</strong>
        <p className={styles.emergencyText}>LSPU Safety & Security is available 24/7.</p>
        <Button variant="alert" size="sm" className="w-full" onClick={() => navigate('/emergency')}>Call Emergency</Button>
      </Card>
    </div>
  );
};
