import React, { useState, useEffect } from 'react';
import { FaBook, FaTrash, FaPlus, FaTimes, FaHeart } from 'react-icons/fa';
import styles from './Journal.module.css';

interface JournalEntry {
  id: string;
  text: string;
  date: string;
  mood?: string;
}

const PROMPTS = [
  "Take a deep breath. Write as little or as much as you need...",
  "What's one thing you want to let go of today?",
  "Right now, I'm feeling overwhelmed by...",
  "If my mood was the weather, it would be...",
  "What made you smile today, even just a little?"
];

const MOODS = [
  { emoji: '😊', label: 'Okay' },
  { emoji: '😔', label: 'Sad' },
  { emoji: '😡', label: 'Frustrated' },
  { emoji: '🌸', label: 'Hopeful' },
  { emoji: '😞', label: 'Tired' },
  { emoji: '😶', label: 'Numb' }
];

export const Journal: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [currentText, setCurrentText] = useState('');
  const [isWriting, setIsWriting] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState(PROMPTS[0]);
  const [showSaveMessage, setShowSaveMessage] = useState(false);

  // Load entries from localStorage on mount
  useEffect(() => {
    const savedEntries = localStorage.getItem('mindguard_journal_entries');
    if (savedEntries) {
      try {
        setEntries(JSON.parse(savedEntries));
      } catch (e) {
        console.error("Failed to parse journal entries", e);
      }
    }
  }, []);

  // Save entries to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('mindguard_journal_entries', JSON.stringify(entries));
  }, [entries]);

  const handleStartWriting = () => {
    setCurrentPrompt(PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
    setIsWriting(true);
    setShowSaveMessage(false);
  };

  const handleSave = () => {
    if (!currentText.trim() && !selectedMood) return;

    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      text: currentText.trim(),
      date: new Date().toLocaleString(),
      mood: selectedMood || undefined
    };

    setEntries([newEntry, ...entries]);
    setCurrentText('');
    setSelectedMood(null);
    setIsWriting(false);
    
    // Show encouraging feedback
    setShowSaveMessage(true);
    setTimeout(() => setShowSaveMessage(false), 4000);
  };

  const handleDelete = (id: string) => {
    setEntries(entries.filter(entry => entry.id !== id));
  };

  return (
    <div className={styles.journalContainer}>
      <header className={styles.header}>
        <div className={styles.headerIcon}>
          <FaBook />
        </div>
        <div className={styles.headerText}>
          <h2>Private Sanctuary</h2>
          <p>Your feelings matter. Only you can see this.</p>
        </div>
      </header>

      {showSaveMessage && (
        <div className={styles.saveFeedback}>
          <FaHeart className={styles.heartIcon} />
          You did well sharing today. Thank you for expressing yourself.
        </div>
      )}

      {!isWriting && (
        <button 
          className={styles.newEntryBtn}
          onClick={handleStartWriting}
        >
          <FaPlus /> Open a New Page
        </button>
      )}

      {isWriting && (
        <div className={styles.editorCard}>
          <div className={styles.editorHeader}>
            <span className={styles.validationText}>This is your safe space. No judgment here.</span>
            <button 
              className={styles.discardBtn}
              onClick={() => {
                setIsWriting(false);
                setCurrentText('');
                setSelectedMood(null);
              }}
              title="Discard"
            >
              <FaTimes />
            </button>
          </div>

          <div className={styles.moodSelector}>
            <p className={styles.moodLabel}>How are you feeling?</p>
            <div className={styles.moodsList}>
              {MOODS.map((mood) => (
                <button
                  key={mood.label}
                  className={`${styles.moodBtn} ${selectedMood === mood.emoji ? styles.moodSelected : ''}`}
                  onClick={() => setSelectedMood(mood.emoji)}
                  title={mood.label}
                >
                  {mood.emoji}
                </button>
              ))}
            </div>
          </div>

          <textarea
            className={styles.textarea}
            value={currentText}
            onChange={(e) => setCurrentText(e.target.value)}
            placeholder={currentPrompt}
            rows={5}
            autoFocus
          />
          
          <div className={styles.editorActions}>
            <button 
              className={styles.saveBtn}
              onClick={handleSave}
              disabled={!currentText.trim() && !selectedMood}
            >
              Save Entry
            </button>
          </div>
        </div>
      )}

      <div className={styles.entriesList}>
        {entries.length === 0 && !isWriting ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}><FaBook /></div>
            <p>Your journal is currently empty.</p>
            <p className={styles.emptySub}>Even a single word or emoji is enough. You can write whenever you're ready.</p>
          </div>
        ) : (
          entries.map(entry => (
            <div key={entry.id} className={styles.entryCard}>
              <div className={styles.entryHeader}>
                <div className={styles.entryMeta}>
                  {entry.mood && <span className={styles.entryMood}>{entry.mood}</span>}
                  <span className={styles.entryDate}>{entry.date}</span>
                </div>
                <button 
                  className={styles.deleteBtn}
                  onClick={() => handleDelete(entry.id)}
                  title="Delete Entry"
                >
                  <FaTrash />
                </button>
              </div>
              {entry.text && (
                <div className={styles.entryText}>
                  {entry.text}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className={styles.crisisFooter}>
        <p>Need immediate support? <button className={styles.crisisLink} onClick={() => alert("Please contact Hopeline at 0917-558-4673 or the DSWD at 02-8735-1370. You are not alone.")}>Tap here for emergency resources.</button></p>
      </div>
    </div>
  );
};
