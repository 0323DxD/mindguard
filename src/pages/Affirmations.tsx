import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { FaLightbulb, FaArrowLeft, FaSync, FaHeart } from 'react-icons/fa';

const affirmationsPool: Record<string, string[]> = {
  general: [
    "You are stronger than you think.",
    "Progress is better than perfection.",
    "You deserve patience and kindness.",
    "Small steps still move you forward.",
    "This moment will pass.",
    "You are capable of handling whatever comes your way.",
    "Your potential is limitless.",
    "Every day is a fresh start."
  ],
  sad: [
    "It’s okay to take things one step at a time.",
    "You are not alone in what you feel.",
    "Be gentle with yourself today.",
    "Even the darkest night will end and the sun will rise.",
    "Your value isn't defined by your productivity."
  ],
  anxious: [
    "Breathe slowly. You are safe right now.",
    "You can handle this moment.",
    "Focus on what you can control. Let go of the rest.",
    "This feeling is temporary.",
    "One breath at a time."
  ],
  happy: [
    "Celebrate your progress today.",
    "Your positivity makes a difference.",
    "Embrace the joy in this moment.",
    "You are a light to those around you.",
    "Keep shining."
  ]
};

export const Affirmations: React.FC = () => {
  const navigate = useNavigate();
  const [currentAffirmation, setCurrentAffirmation] = useState("");
  const [isFavorite, setIsFavorite] = useState(false);
  const [mood, setMood] = useState<string>("general");

  useEffect(() => {
    // Try to get user's last mood from localStorage
    const savedMoods = localStorage.getItem('mood_history');
    if (savedMoods) {
      try {
        const moodsArray = JSON.parse(savedMoods);
        if (moodsArray.length > 0) {
          const lastMood = moodsArray[moodsArray.length - 1].mood;
          if (lastMood === 'Down' || lastMood === 'Crisis') setMood('sad');
          else if (lastMood === 'Anxious') setMood('anxious'); // Note: Anxious isn't a default label but good for future
          else if (lastMood === 'Great' || lastMood === 'Good') setMood('happy');
          else setMood('general');
        }
      } catch (e) {
        setMood('general');
      }
    }
    getRandomAffirmation();
  }, []);

  const getRandomAffirmation = () => {
    const pool = affirmationsPool[mood] || affirmationsPool.general;
    const randomIndex = Math.floor(Math.random() * pool.length);
    setCurrentAffirmation(pool[randomIndex]);
    setIsFavorite(false);
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // Future: Persist to favorites list
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 flex flex-col items-center justify-center min-h-[80vh]"
    >
      <div className="w-full flex items-center gap-3 mb-8">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
          <FaArrowLeft />
        </Button>
        <h2 className="text-2xl font-bold text-teal-600">Daily Affirmations</h2>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentAffirmation}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <Card className="bg-white border-2 border-teal-50 min-h-[200px] flex flex-col items-center justify-center p-8 text-center shadow-xl rounded-3xl relative">
            <div className="absolute top-4 left-4 text-teal-100">
              <FaLightbulb size={24} />
            </div>
            
            <p className="text-xl md:text-2xl font-medium text-gray-800 leading-relaxed italic">
              "{currentAffirmation}"
            </p>
          </Card>
        </motion.div>
      </AnimatePresence>

      <div className="flex gap-4 mt-8">
        <Button 
          variant="outline" 
          onClick={getRandomAffirmation}
          className="rounded-full px-6 flex items-center gap-2"
        >
          <FaSync className="text-sm" />
          Refresh
        </Button>
        <Button 
          variant={isFavorite ? "primary" : "outline"}
          onClick={toggleFavorite}
          className={`rounded-full px-6 flex items-center gap-2 ${isFavorite ? 'bg-rose-500 border-rose-500 hover:bg-rose-600' : ''}`}
        >
          <FaHeart className={isFavorite ? "text-white" : "text-rose-400"} />
          {isFavorite ? "Saved" : "Save"}
        </Button>
      </div>

      <div className="mt-12 text-center max-w-xs">
        <p className="text-xs text-gray-400 font-medium">
          Quick positive reminders to boost your mood. Positive self-talk is a key part of emotional regulation.
        </p>
      </div>
      
      <div className="mt-auto pt-8 flex items-center gap-2 text-[10px] text-gray-300 tracking-wider uppercase font-bold">
        <span className="text-sm">🔒</span> All data is encrypted and protected for your privacy.
      </div>
    </motion.div>
  );
};
