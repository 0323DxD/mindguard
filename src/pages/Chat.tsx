import React, { useState, useEffect, useRef } from 'react';
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

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
          ←
        </Button>
        <h3 className="text-xl font-bold text-primary m-0">MindGuard AI</h3>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm break-words ${
                msg.sender === 'user'
                  ? 'bg-primary text-white self-end rounded-br-md'
                  : 'bg-gray-100 text-gray-800 self-start rounded-bl-md'
              }`}
            >
              {msg.text}
            </div>
          ))}
          {isTyping && (
            <div className="text-xs text-gray-500 italic p-2">
              MindGuard is typing...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-100 p-3 bg-white">
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type here..."
              className="flex-1 rounded-full"
            />
            <Button type="submit" className="rounded-xl px-4">
              Send
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
};
