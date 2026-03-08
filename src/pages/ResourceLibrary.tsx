import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { motion } from 'framer-motion';
import { FaBook, FaLightbulb, FaHeartbeat, FaLeaf, FaArrowLeft } from 'react-icons/fa';

const resources = [
  {
    category: 'Anxiety',
    icon: <FaHeartbeat />,
    color: 'text-rose-500',
    bg: 'bg-rose-50',
    tips: [
      { title: 'Grounding Technique', content: '5-4-3-2-1: Name 5 things you see, 4 you feel, 3 you hear, 2 you smell, and 1 you taste.' },
      { title: 'Belly Breathing', content: 'Inhale deeply through your nose for 4 seconds, hold for 4, exhale for 4.' },
    ]
  },
  {
    category: 'Depression',
    icon: <FaLeaf />,
    color: 'text-indigo-500',
    bg: 'bg-indigo-50',
    tips: [
      { title: 'Small Steps', content: 'Break tasks into tiny, manageable steps. Focus on just getting through the next hour.' },
      { title: 'Self-Compassion', content: 'Treat yourself with the same kindness you would show a dear friend.' },
    ]
  },
  {
    category: 'Academic Stress',
    icon: <FaBook />,
    color: 'text-teal-500',
    bg: 'bg-teal-50',
    tips: [
      { title: 'Pomodoro Technique', content: 'Study for 25 minutes, then take a 5-minute break. It helps maintain focus.' },
      { title: 'Ask for Help', content: 'Reach out to your professors or peers if you are feeling overwhelmed.' },
    ]
  },
  {
    category: 'Self-Care',
    icon: <FaLightbulb />,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    tips: [
      { title: 'Sleep Hygiene', content: 'Maintain a consistent sleep schedule and avoid screens 1 hour before bed.' },
      { title: 'Digital Detox', content: 'Unplug from social media for an hour today to give your mind a rest.' },
    ]
  }
];

export const ResourceLibrary: React.FC = () => {
  const navigate = useNavigate();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="p-4 pb-24"
    >
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
          <FaArrowLeft />
        </Button>
        <h2 className="text-2xl font-bold text-gray-800">Resource Library</h2>
      </div>

      <div className="space-y-6">
        {resources.map((section, idx) => (
          <div key={idx}>
            <div className="flex items-center gap-2 mb-3">
              <span className={`p-2 rounded-lg ${section.bg} ${section.color} text-xl`}>
                {section.icon}
              </span>
              <h3 className="text-lg font-bold text-gray-700">{section.category}</h3>
            </div>
            
            <div className="grid gap-4">
              {section.tips.map((tip, tipIdx) => (
                <Card key={tipIdx} className="border-l-4 border-teal-500 hover:shadow-md transition-shadow">
                  <h4 className="font-bold text-teal-700 mb-1">{tip.title}</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">{tip.content}</p>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-teal-50 rounded-xl border border-teal-100 text-center">
        <p className="text-sm text-teal-700 font-medium">
          Always remember: You are not alone. Reach out to the Guidance Office for more personalized support.
        </p>
      </div>
    </motion.div>
  );
};
