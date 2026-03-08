import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { motion } from 'framer-motion';
import { FaPhoneAlt, FaExclamationTriangle, FaArrowLeft, FaShieldAlt } from 'react-icons/fa';

const emergencyContacts = [
  {
    name: 'National Hopeline',
    number: '0917-558-4673',
    desc: 'Available 24/7 for crisis support.',
    primary: true
  },
  {
    name: 'DSWD Childline',
    number: '02-8735-1370',
    desc: 'Specialized support for abuse and harassment cases.',
    primary: false
  },
  {
    name: 'LSPU Campus Security',
    number: '049-501-1234',
    desc: 'For immediate assistance on campus.',
    primary: true
  },
  {
    name: 'Medical Emergency',
    number: '911',
    desc: 'General emergency number for ambulance or police.',
    primary: false
  }
];

export const Emergency: React.FC = () => {
  const navigate = useNavigate();

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      className="p-4 flex flex-col items-center justify-center min-h-[80vh]"
    >
      <div className="w-full flex items-center gap-3 mb-8">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
          <FaArrowLeft />
        </Button>
        <h2 className="text-2xl font-bold text-red-600">Immediate Support</h2>
      </div>

      <div className="bg-red-50 text-red-600 p-6 rounded-2xl text-center mb-8 border-2 border-red-200">
        <div className="flex justify-center mb-4">
          <FaExclamationTriangle size={48} className="animate-pulse" />
        </div>
        <h3 className="text-xl font-bold mb-2">You are not alone.</h3>
        <p className="text-sm font-medium">Please reach out to any of the numbers below if you are in immediate danger or feeling overwhelmed.</p>
      </div>

      <div className="w-full space-y-4">
        {emergencyContacts.map((contact, idx) => (
          <Card key={idx} className={`shadow-sm ${contact.primary ? 'border-2 border-red-200 bg-white' : ''}`}>
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                  {contact.name} {contact.primary && <FaShieldAlt className="text-red-500 text-sm" />}
                </h4>
                <p className="text-xs text-gray-500 mt-1">{contact.desc}</p>
                <div className="text-lg font-bold text-red-600 mt-2">{contact.number}</div>
              </div>
              <a 
                href={`tel:${contact.number.replace(/[^0-9]/g, '')}`} 
                className="p-4 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"
              >
                <FaPhoneAlt size={20} />
              </a>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8 text-center text-gray-400 text-xs">
        <p>Your mental health matters. These services are confidential and ready to help.</p>
      </div>
    </motion.div>
  );
};
