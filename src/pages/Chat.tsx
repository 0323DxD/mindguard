import React, { useState, useEffect, useRef } from 'react';
import { FaArrowLeft, FaPaperPlane } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export const Chat: React.FC = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
      setIsTyping(true);
      const timer = setTimeout(() => {
        addMessage("Hello. I'm MindGuard. I'm here to listen without judgment. How are things going today?", 'ai');
        setIsTyping(false);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  const addMessage = (text: string, sender: 'user' | 'ai') => {
    const newMessage: Message = {
      id: Date.now().toString() + Math.random().toString(),
      text,
      sender,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
  };

  const processAIResponse = (text: string) => {
    setIsTyping(true);
    
    // Simple delay to simulate thinking
    setTimeout(() => {
      const lower = text.toLowerCase();
      
      const crisisPatterns = [
        /(?:kill(?:ing)?\s?myself|\bkill myself\b|\bsuicide\b|\bend it all\b|\bwant to die\b|\bi will die\b|\bi'm going to die\b|\bworthless\b|\bhurt myself\b)/i
      ];

      if (crisisPatterns.some(rx => rx.test(text))) {
        addMessage("I'm listening. This sounds serious. Are you safe right now? If you are in immediate danger, please call local emergency services (911).", 'ai');
        setIsTyping(false);
        return;
      }

      if (/\b(sad|depressed|unhappy|crying|lonely)\b/i.test(text)) {
        addMessage("I'm sorry you're feeling sad. Would you like to tell me more about what's been happening?", 'ai');
        setIsTyping(false);
        return;
      }

      if (/\b(anxious|panic|scared|worried)\b/i.test(text)) {
        addMessage("That sounds stressful. Do you want to try a short breathing exercise together?", 'ai');
        setIsTyping(false);
        return;
      }

      const generic = [
        "I hear you. Tell me more about that.",
        "Thank you for sharing that with me. How does that make you feel?",
        "It's okay to feel this way. I'm here to listen."
      ];
      
      addMessage(generic[Math.floor(Math.random() * generic.length)], 'ai');
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const text = inputValue;
    setInputValue('');
    addMessage(text, 'user');
    processAIResponse(text);
  };



// ... (keep interfaces and state logic same)

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 shrink-0">
        <button 
          onClick={() => navigate('/dashboard')}
          className="w-10 h-10 flex items-center justify-center bg-primary text-white rounded-full shadow-sm hover:bg-primary-light transition-colors"
        >
          <FaArrowLeft size={16} />
        </button>
        <h3 className="text-xl font-bold text-gray-800 m-0">MindGuard AI</h3>
      </div>

      {/* Chat Card */}
      <div className="flex-1 mx-4 mb-4 bg-white rounded-[32px] shadow-sm flex flex-col overflow-hidden relative border border-gray-100">
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 pb-24">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`max-w-[85%] p-4 rounded-2xl text-[15px] leading-relaxed break-words ${
                msg.sender === 'user'
                  ? 'bg-primary text-white self-end rounded-br-sm'
                  : 'bg-white border border-gray-100 text-gray-800 self-start rounded-bl-sm shadow-sm'
              }`}
            >
              {msg.text}
            </div>
          ))}
          {isTyping && (
            <div className="text-sm text-gray-400 italic p-2 self-start animate-pulse">
              MindGuard is typing...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
          <form onSubmit={handleSend} className="flex gap-3 items-center">
            <div className="flex-1">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type here..."
                className="w-full rounded-full border-gray-200 focus:border-primary bg-transparent"
                style={{ marginBottom: 0, fontSize: '15px' }} 
              />
            </div>
            <button 
              type="submit" 
              className="w-12 h-12 flex items-center justify-center bg-primary text-white rounded-xl shadow-md hover:bg-primary-light transition-colors shrink-0"
            >
              <FaPaperPlane size={18} className="-ml-1" /> {/* Slight offset for visual center */}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
