import { ChatMessage } from '../types';

export const ChatService = {
  // Simple session ID generator
  getSessionId: () => {
    let sid = sessionStorage.getItem('chat_session_id');
    if (!sid) {
      sid = Math.random().toString(36).substring(2) + Date.now().toString(36);
      sessionStorage.setItem('chat_session_id', sid);
    }
    return sid;
  },

  async sendMessage(message: string, history: ChatMessage[]): Promise<{ response: string; sentiment: string; action?: string }> {
    try {
      // Prepare history in the format Python expects (list of dicts)
      const formattedHistory = history.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message,
          history: history.map(h => h.content), 
          session_id: ChatService.getSessionId()
        }),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();
      return data;
    } catch (error) {
      console.error('Chat API Error:', error);
      // Fallback for demo if backend isn't running
      return {
        response: "I'm having trouble connecting to my empathy engine right now. Please ensure the Python backend is running.",
        sentiment: "neutral",
        action: "none"
      };
    }
  }
};
