import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaLightbulb, FaArrowLeft, FaSync, FaHeart, FaTrash } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const affirmationsPool: Record<string, string[]> = {
  general: [
    "You are stronger than you think.",
    "Progress is better than perfection.",
    "You deserve patience and kindness.",
    "Small steps still move you forward.",
    "This moment will pass.",
    "You are capable of handling whatever comes your way.",
    "Your potential is limitless.",
    "Every day is a fresh start.",
    "You are enough, exactly as you are.",
    "Be proud of how far you've come.",
  ],
  sad: [
    "It's okay to take things one step at a time.",
    "You are not alone in what you feel.",
    "Be gentle with yourself today.",
    "Even the darkest night will end and the sun will rise.",
    "Your value isn't defined by your productivity.",
    "Healing is not linear, and that's okay.",
  ],
  anxious: [
    "Breathe slowly. You are safe right now.",
    "You can handle this moment.",
    "Focus on what you can control. Let go of the rest.",
    "This feeling is temporary.",
    "One breath at a time.",
    "You have survived every hard day so far.",
  ],
  happy: [
    "Celebrate your progress today.",
    "Your positivity makes a difference.",
    "Embrace the joy in this moment.",
    "You are a light to those around you.",
    "Keep shining — the world needs your energy.",
  ],
};

interface SavedAffirmation {
  id: number;
  text: string;
  created_at: string;
}

export const Affirmations: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [current, setCurrent] = useState("");
  const [mood, setMood] = useState<string>("general");
  const [saved, setSaved] = useState<SavedAffirmation[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const getRandomAffirmation = useCallback(() => {
    const pool = affirmationsPool[mood] || affirmationsPool.general;
    const idx = Math.floor(Math.random() * pool.length);
    setCurrent(pool[idx]);
  }, [mood]);

  useEffect(() => {
    // Detect mood from localStorage
    try {
      const moods = JSON.parse(localStorage.getItem('mood_history') || '[]');
      if (moods.length > 0) {
        const lastMood = moods[moods.length - 1].mood;
        if (lastMood === 'Down' || lastMood === 'Crisis') setMood('sad');
        else if (lastMood === 'Great' || lastMood === 'Good') setMood('happy');
        else setMood('general');
      }
    } catch {}
    getRandomAffirmation();
  }, []);

  useEffect(() => {
    getRandomAffirmation();
  }, [mood]);

  // Load saved affirmations from API
  useEffect(() => {
    if (user?.id) {
      axios.get(`/api/affirmations/${user.id}`).then(r => {
        setSaved(r.data);
        setSavedIds(new Set(r.data.map((a: SavedAffirmation) => a.text)));
      }).catch(() => {});
    }
  }, [user?.id]);

  const handleSave = async () => {
    if (!user?.id || !current || savedIds.has(current)) return;
    setSaving(true);
    try {
      const { data } = await axios.post(`/api/affirmations/${user.id}`, { text: current });
      const newItem: SavedAffirmation = { id: data.id, text: current, created_at: new Date().toISOString() };
      setSaved(prev => [newItem, ...prev]);
      setSavedIds(prev => new Set([...prev, current]));
    } catch (e: any) {
      if (e.response?.data?.detail === 'Already saved') {
        // already tracked, just update local set
        setSavedIds(prev => new Set([...prev, current]));
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (affirmation: SavedAffirmation) => {
    if (!user?.id) return;
    try {
      await axios.delete(`/api/affirmations/${user.id}/${affirmation.id}`);
      setSaved(prev => prev.filter(a => a.id !== affirmation.id));
      setSavedIds(prev => {
        const next = new Set(prev);
        next.delete(affirmation.text);
        return next;
      });
    } catch {}
  };

  const isCurrentSaved = savedIds.has(current);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4"
      style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '40px' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0f766e', fontSize: '1.1rem', padding: '8px' }}
        >
          <FaArrowLeft />
        </button>
        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#0f766e' }}>Daily Affirmations</h2>
      </div>

      {/* Affirmation Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.96 }}
          transition={{ duration: 0.35 }}
          style={{
            background: 'linear-gradient(135deg, #f0fdfa 0%, #e6f7f5 100%)',
            border: '2px solid #99f6e4',
            borderRadius: '20px',
            padding: '36px 28px',
            textAlign: 'center',
            marginBottom: '24px',
            boxShadow: '0 4px 20px rgba(15,118,110,0.1)',
            position: 'relative',
          }}
        >
          <FaLightbulb size={28} color="#0f766e" style={{ marginBottom: '16px', opacity: 0.5 }} />
          <p style={{ fontSize: '1.2rem', fontWeight: 600, color: '#134e4a', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
            "{current}"
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '40px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          onClick={getRandomAffirmation}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: '#f1f5f9', border: '1.5px solid #e2e8f0', borderRadius: '999px', fontWeight: 600, color: '#334155', cursor: 'pointer', fontSize: '0.9rem' }}
        >
          <FaSync style={{ fontSize: '0.85rem' }} /> Refresh
        </button>
        <button
          onClick={handleSave}
          disabled={saving || isCurrentSaved}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px',
            background: isCurrentSaved ? '#fce7f3' : '#0f766e',
            border: 'none', borderRadius: '999px', fontWeight: 600,
            color: isCurrentSaved ? '#db2777' : '#fff', cursor: isCurrentSaved ? 'default' : 'pointer', fontSize: '0.9rem',
            opacity: saving ? 0.7 : 1,
          }}
        >
          <FaHeart /> {isCurrentSaved ? 'Saved ♡' : 'Save'}
        </button>
      </div>

      {/* Saved Affirmations */}
      {saved.length > 0 && (
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#334155', marginBottom: '16px', letterSpacing: '-0.01em' }}>
            Saved Affirmations
          </h3>
          <AnimatePresence>
            {saved.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.96 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '16px 20px',
                  marginBottom: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}
              >
                <p style={{ margin: 0, color: '#374151', fontSize: '0.9rem', fontStyle: 'italic', flex: 1, paddingRight: '12px' }}>
                  "{a.text}"
                </p>
                <button
                  onClick={() => handleRemove(a)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e11d48', padding: '6px', borderRadius: '8px', flexShrink: 0 }}
                  title="Remove"
                >
                  <FaTrash size={15} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '11px', color: '#94a3b8', letterSpacing: '0.5px', fontWeight: 500 }}>
        🔒 All data is encrypted and protected for your privacy.
      </div>
    </motion.div>
  );
};
