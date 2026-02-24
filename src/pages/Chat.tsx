import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ChatMessage, ChatResponse } from '../types';
import { ChatService } from '../services/chat';
import { FaPaperPlane, FaRobot, FaExclamationTriangle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import styles from './Chat.module.css';

// Initial greeting from the empathy bot
const INITIAL_MESSAGE: ChatMessage = {
  id: 'init',
  role: 'ai',
  content: "Hello. I'm MindGuard, your safe space. How are you feeling today?",
  timestamp: new Date().toISOString()
};

const ThinkingIndicator = () => (
  <div className={styles.thinking}>
    <span>.</span><span>.</span><span>.</span>
  </div>
);

export const Chat: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // Call the Python backend via ChatService
      const { response, action } = await ChatService.sendMessage(input, messages);
      
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: response,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, aiMsg]);

      // Handle Actions
      if (action === 'crisis_resource') {
        const crisisMsg: ChatMessage = {
          id: (Date.now() + 2).toString(),
          role: 'system',
          content: "System Alert: If you are in immediate danger, please call 988 or 911 immediately.",
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, crisisMsg]);
      } else if (action === 'breathing_promo' || action === 'gratitude') {
         // Optionally handle other interactive triggers
      }
    } catch (error) {
      console.error('Failed to get response', error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: "I'm having trouble connecting right now. Please try again later.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h3>Empathy Companion</h3>
        <p className={styles.subtitle}>Powered by Python AI</p>
      </header>

      <Card className={styles.chatArea} padding={false}>
        <div className={styles.messages} ref={scrollRef}>
          {messages.map((msg) => (
            <div key={msg.id} className={`${styles.message} ${msg.role === 'user' ? styles.user : (msg.role === 'system' ? styles.system : styles.ai)}`}>
              {msg.role === 'ai' && <div className={styles.avatar}><FaRobot /></div>}
              {msg.role === 'system' && <div className={styles.avatar}><FaExclamationTriangle color="red"/></div>}
              <div className={styles.bubble}>
                {msg.content}
                {msg.role === 'ai' && msg.content.includes("breathing") && (
                   <div style={{marginTop: '8px'}}>
                     <Button size="sm" variant="outline" onClick={() => navigate('/wellness')}>Go to Breathing Exercise</Button>
                   </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
             <div className={`${styles.message} ${styles.ai}`}>
               <div className={styles.avatar}><FaRobot /></div>
               <div className={styles.bubble}><ThinkingIndicator /></div>
             </div>
          )}
        </div>

        <div className={styles.inputArea}>
          <input
            type="text"
            className={styles.input}
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            disabled={isTyping}
          />
          <Button 
            className={styles.sendBtn} 
            onClick={handleSend} 
            disabled={!input.trim() || isTyping}
          >
            <FaPaperPlane />
          </Button>
        </div>
      </Card>
      
      <p className={styles.disclaimer}>
        MindGuard is an AI companion, not a replacement for professional help.
        <br />If you are in crisis, please contact emergency services.
      </p>
    </div>
  );
};
