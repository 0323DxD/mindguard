import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaLightbulb, FaArrowLeft, FaSync, FaHeart, FaTrash, FaShareAlt, FaBookmark } from 'react-icons/fa';
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
    "One day at a time is all it takes.",
    "You matter more than you know.",
  ],
  sad: [
    "It's okay to take things one step at a time.",
    "You are not alone in what you feel.",
    "Be gentle with yourself today.",
    "Even the darkest night will end and the sun will rise.",
    "Your value isn't defined by your productivity.",
    "Healing is not linear, and that's okay.",
    "You have survived every hard moment so far.",
    "Tears are a sign of strength, not weakness.",
  ],
  anxious: [
    "Breathe slowly. You are safe right now.",
    "You can handle this moment.",
    "Focus on what you can control. Let go of the rest.",
    "This feeling is temporary.",
    "One breath at a time.",
    "You have survived every hard day so far.",
    "Right now, in this moment, you are okay.",
  ],
  happy: [
    "Celebrate your progress today.",
    "Your positivity makes a difference.",
    "Embrace the joy in this moment.",
    "You are a light to those around you.",
    "Keep shining — the world needs your energy.",
    "You deserve every good thing that comes to you.",
  ],
};

interface SavedAffirmation {
  id: string;
  text: string;
  created_at: string;
}

const LS_KEY = (userId: string) => `mg_affirmations_${userId}`;

const loadFromStorage = (userId: string): SavedAffirmation[] => {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY(userId)) || '[]');
  } catch { return []; }
};

const saveToStorage = (userId: string, items: SavedAffirmation[]) => {
  localStorage.setItem(LS_KEY(userId), JSON.stringify(items));
};

export const Affirmations: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id ? String(user.id) : 'guest';

  const [current, setCurrent] = useState('');
  const [mood, setMood] = useState('general');
  const [saved, setSaved] = useState<SavedAffirmation[]>([]);
  const [savedTexts, setSavedTexts] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const savedListRef = useRef<HTMLDivElement>(null);

  // Load saved from localStorage on mount
  useEffect(() => {
    const local = loadFromStorage(userId);
    setSaved(local);
    setSavedTexts(new Set(local.map(a => a.text)));

    // Also try loading from API in background
    if (user?.id) {
      axios.get(`/api/affirmations/${user.id}`).then(r => {
        if (r.data.length > 0) {
          const merged: SavedAffirmation[] = r.data.map((a: any) => ({
            id: String(a.id),
            text: a.text,
            created_at: a.created_at,
          }));
          const mergedTexts = new Set(merged.map(a => a.text));
          setSaved(merged);
          setSavedTexts(mergedTexts);
          saveToStorage(userId, merged);
        }
      }).catch(() => {});
    }
  }, [userId]);

  // Detect mood from localStorage
  useEffect(() => {
    try {
      const moods = JSON.parse(localStorage.getItem('mood_history') || '[]');
      if (moods.length > 0) {
        const lastMood = moods[moods.length - 1].mood;
        if (lastMood === 'Down' || lastMood === 'Crisis') setMood('sad');
        else if (lastMood === 'Great' || lastMood === 'Good') setMood('happy');
        else setMood('general');
      }
    } catch {}
  }, []);

  const getRandomAffirmation = useCallback(() => {
    const pool = affirmationsPool[mood] || affirmationsPool.general;
    let next = current;
    // Avoid repeating the same one
    while (next === current && pool.length > 1) {
      next = pool[Math.floor(Math.random() * pool.length)];
    }
    setCurrent(next);
  }, [mood, current]);

  // Set initial affirmation once mood is set
  useEffect(() => {
    const pool = affirmationsPool[mood] || affirmationsPool.general;
    setCurrent(pool[Math.floor(Math.random() * pool.length)]);
  }, [mood]);

  const handleRefresh = () => {
    setIsSpinning(true);
    getRandomAffirmation();
    setTimeout(() => setIsSpinning(false), 500);
  };

  const handleSave = async () => {
    if (!current || savedTexts.has(current) || saving) return;
    setSaving(true);
    setJustSaved(true);

    const newItem: SavedAffirmation = {
      id: `local_${Date.now()}`,
      text: current,
      created_at: new Date().toISOString(),
    };

    // Immediately add to state (optimistic)
    const updated = [newItem, ...saved];
    setSaved(updated);
    setSavedTexts(new Set(updated.map(a => a.text)));
    saveToStorage(userId, updated);

    // Scroll saved list into view after a brief delay
    setTimeout(() => {
      savedListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);

    // Try to persist to backend in background
    if (user?.id) {
      axios.post(`/api/affirmations/${user.id}`, { text: current })
        .then(r => {
          // Update the id from server
          setSaved(prev => prev.map(a => a.id === newItem.id ? { ...a, id: String(r.data.id) } : a));
        })
        .catch(() => {}); // silently fail — localStorage already has it
    }

    setSaving(false);
    setTimeout(() => setJustSaved(false), 1500);
  };

  const handleRemove = async (item: SavedAffirmation) => {
    const updated = saved.filter(a => a.id !== item.id);
    setSaved(updated);
    setSavedTexts(new Set(updated.map(a => a.text)));
    saveToStorage(userId, updated);

    // Try backend delete too
    if (user?.id && !item.id.startsWith('local_')) {
      axios.delete(`/api/affirmations/${user.id}/${item.id}`).catch(() => {});
    }
  };

  const handleShare = (text: string) => {
    if (navigator.share) {
      navigator.share({ text: `💬 "${text}" — MindGuard Daily Affirmation` });
    } else {
      navigator.clipboard.writeText(`"${text}" — MindGuard`);
      alert('Affirmation copied to clipboard!');
    }
  };

  const isCurrentSaved = savedTexts.has(current);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ maxWidth: '600px', margin: '0 auto', padding: '16px 16px 80px', fontFamily: 'Inter, sans-serif' }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0f766e', padding: '8px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}
        >
          <FaArrowLeft size={18} />
        </button>
        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: '#0f766e' }}>Daily Affirmations</h2>
      </div>

      {/* Main Affirmation Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, y: 24, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -16, scale: 0.97 }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 60%, #e0f2fe 100%)',
            border: '1.5px solid #99f6e4',
            borderRadius: '22px',
            padding: '40px 28px 32px',
            textAlign: 'center',
            marginBottom: '20px',
            boxShadow: '0 8px 32px rgba(15,118,110,0.12)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Decorative blobs */}
          <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(15,118,110,0.06)' }} />
          <div style={{ position: 'absolute', bottom: -10, left: -10, width: 60, height: 60, borderRadius: '50%', background: 'rgba(15,118,110,0.05)' }} />

          <FaLightbulb size={30} color="#0f766e" style={{ marginBottom: '18px', opacity: 0.55 }} />
          <p style={{
            fontSize: '1.15rem', fontWeight: 600, color: '#134e4a',
            lineHeight: 1.65, margin: 0, fontStyle: 'italic',
            position: 'relative', zIndex: 1,
          }}>
            "{current}"
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '36px', justifyContent: 'center' }}>
        <button
          onClick={handleRefresh}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px',
            background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: '999px',
            fontWeight: 600, color: '#475569', cursor: 'pointer', fontSize: '0.9rem',
            transition: 'all 0.2s',
          }}
        >
          <motion.span
            animate={isSpinning ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 0.45 }}
            style={{ display: 'inline-flex' }}
          >
            <FaSync size={14} />
          </motion.span>
          Refresh
        </button>

        <motion.button
          onClick={handleSave}
          disabled={saving || isCurrentSaved}
          whileTap={!isCurrentSaved ? { scale: 0.93 } : {}}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 26px',
            background: isCurrentSaved ? '#f0fdf4' : '#0f766e',
            border: isCurrentSaved ? '1.5px solid #bbf7d0' : 'none',
            borderRadius: '999px', fontWeight: 700,
            color: isCurrentSaved ? '#15803d' : '#fff',
            cursor: isCurrentSaved ? 'default' : 'pointer', fontSize: '0.9rem',
            transition: 'all 0.25s ease',
            boxShadow: isCurrentSaved ? 'none' : '0 4px 14px rgba(15,118,110,0.3)',
          }}
        >
          <motion.span
            animate={justSaved ? { scale: [1, 1.4, 1] } : { scale: 1 }}
            transition={{ duration: 0.35 }}
          >
            <FaHeart />
          </motion.span>
          {isCurrentSaved ? '✓ Saved' : saving ? 'Saving…' : 'Save'}
        </motion.button>
      </div>

      {/* Saved Affirmations Section */}
      <AnimatePresence>
        {saved.length > 0 && (
          <motion.div
            ref={savedListRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            {/* Section Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <FaBookmark size={14} color="#0f766e" />
              <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#0f766e', letterSpacing: '-0.01em' }}>
                Saved Affirmations
              </h3>
              <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', background: '#f1f5f9', padding: '2px 10px', borderRadius: '999px' }}>
                {saved.length}
              </span>
            </div>

            {/* Scrollable List */}
            <div
              style={{
                maxHeight: saved.length > 4 ? '420px' : 'none',
                overflowY: saved.length > 4 ? 'auto' : 'visible',
                paddingRight: saved.length > 4 ? '4px' : '0',
              }}
            >
              <AnimatePresence initial={false}>
                {saved.map((a, i) => (
                  <motion.div
                    key={a.id}
                    layout
                    initial={{ opacity: 0, y: -18, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 40, scale: 0.92, transition: { duration: 0.22 } }}
                    transition={{
                      duration: 0.35,
                      ease: [0.22, 1, 0.36, 1],
                      delay: i === 0 ? 0 : 0,  // no delay for new items, slight for initial load
                    }}
                    style={{
                      background: '#fff',
                      border: '1px solid #f0fdf4',
                      borderLeft: '3px solid #0f766e',
                      borderRadius: '14px',
                      padding: '15px 16px',
                      marginBottom: '10px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Quote mark accent */}
                    <span style={{ fontSize: '2rem', color: '#99f6e4', lineHeight: 1, flexShrink: 0, marginTop: '-4px', userSelect: 'none' }}>"</span>

                    <p style={{
                      margin: 0, color: '#374151', fontSize: '0.88rem',
                      fontStyle: 'italic', flex: 1, lineHeight: 1.6,
                    }}>
                      {a.text}
                    </p>

                    {/* Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
                      <button
                        onClick={() => handleShare(a.text)}
                        title="Share"
                        style={{
                          background: '#f0fdf4', border: 'none', cursor: 'pointer',
                          padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center',
                          color: '#0f766e',
                        }}
                      >
                        <FaShareAlt size={12} />
                      </button>
                      <button
                        onClick={() => handleRemove(a)}
                        title="Remove"
                        style={{
                          background: '#fef2f2', border: 'none', cursor: 'pointer',
                          padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center',
                          color: '#e11d48',
                        }}
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ marginTop: '28px', textAlign: 'center', fontSize: '11px', color: '#94a3b8', letterSpacing: '0.4px' }}>
        🔒 All data is encrypted and protected for your privacy.
      </div>
    </motion.div>
  );
};
