import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

export const Wellness: React.FC = () => {
  const navigate = useNavigate();
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathText, setBreathText] = useState('Start Exercise');
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isBreathing) {
      // Simple 4-7-8 cycle simulation
      const cycle = 19; // 4+7+8
      interval = setInterval(() => {
        setTimer((t) => {
          const val = (t + 1) % cycle;
          if (val < 4) setBreathText(`Inhale... ${4 - val}`);
          else if (val < 11) setBreathText(`Hold... ${11 - val}`);
          else setBreathText(`Exhale... ${19 - val}`);
          return t + 1;
        });
      }, 1000);
    } else {
      setBreathText('Start Exercise');
      setTimer(0);
    }
    return () => clearInterval(interval);
  }, [isBreathing]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
          ←
        </Button>
        <h3 className="text-xl font-bold text-primary m-0">My Wellness</h3>
      </div>

      <Card className="bg-primary text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="text-3xl">💨</div>
          <div>
            <strong className="block text-lg">4-7-8 Breathing</strong>
            <p className="text-sm text-blue-100 m-0">Calm anxiety in under a minute.</p>
          </div>
        </div>
        
        <div className="text-center mt-4">
          <Button 
            onClick={() => setIsBreathing(!isBreathing)}
            className="bg-white text-primary hover:bg-gray-100 border-none w-full"
          >
            {isBreathing ? 'Stop Exercise' : 'Start Exercise'}
          </Button>
          {isBreathing && (
            <p className="text-2xl font-bold mt-4 animate-pulse">{breathText}</p>
          )}
        </div>
      </Card>

      <h4 className="font-bold text-gray-700 mt-2">Mood History</h4>
      <Card>
        <div className="text-center py-8 text-gray-500">
          <p>No moods logged yet.</p>
        </div>
      </Card>
    </div>
  );
};
