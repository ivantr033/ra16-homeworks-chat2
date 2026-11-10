import { useState, useEffect, useRef } from 'react';
import { type MessageItem } from './types';
import MessageBubble from './components/MessageBubble';
import ChatForm from './components/ChatForm';
import './App.css';

// Persistent single-session initialization
const getOrCreateUserId = (): string => {
  let uId = localStorage.getItem('userId');

  if (!uId) {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      uId = crypto.randomUUID();
    } else {
      uId = 'user-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 9);
    }
    localStorage.setItem('userId', uId);
  }
  return uId;
};

// Backend URL: configurable or default localhost:7070
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:7070/messages';

export default function App() {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Lazy initialization to avoid accessing localStorage on every render
  const [currentUserId] = useState<string>(() => getOrCreateUserId());

  // Track the ID of the last received message without triggering re-renders
  const lastMessageIdRef = useRef<number>(0);
  const isFetchingRef = useRef<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Smart polling with 'from' parameter
  const fetchNewMessages = async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const response = await fetch(`${API_URL}?from=${lastMessageIdRef.current}`);
      if (!response.ok) throw new Error('Ошибка подключения к серверу чата');

      const newBatch: MessageItem[] = await response.json();

      if (newBatch.length > 0) {
        // Update the maximum ID received
        const maxId = Math.max(...newBatch.map((m) => m.id));
        if (maxId > lastMessageIdRef.current) {
          lastMessageIdRef.current = maxId;
        }

        // Filter duplicates to avoid echoes
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const uniqueNew = newBatch.filter((m) => !existingIds.has(m.id));
          return uniqueNew.length > 0 ? [...prev, ...uniqueNew] : prev;
        });
      }
      setError(null);
    } catch (err: unknown) {
      console.error('Error fetching messages:', err);
      setError('Проблема с подключением к серверу. Повторная попытка...');
    } finally {
      isFetchingRef.current = false;
    }
  };

  const handleSendMessage = async (content: string) => {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 0,
        userId: currentUserId,
        content,
      }),
    });

    if (!response.ok) {
      throw new Error('Сообщение не удалось отправить. Пожалуйста, попробуйте еще раз.');
    }

    // Immediate processing upon submission so that the message appears quickly
    void fetchNewMessages();
  };

  // Lifecycle: Polling every 2 seconds with strict cleanup
  useEffect(() => {
    let isMounted = true;

    const runFetch = async () => {
      if (isMounted) await fetchNewMessages();
    };

    void runFetch();

    const intervalId = setInterval(() => {
      if (isMounted) void fetchNewMessages();
    }, 2000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  // Auto-scroll to the bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chat-container">
      <h2 className="chat-title">Anonymous Chat</h2>

      {error && <div className="chat-error-banner">{error}</div>}

      <div className="chat-messages-box">
        {messages.length === 0 && (
          <p className="chat-empty">Сообщений пока нет. Будьте первым, кто напишет!</p>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            currentUserId={currentUserId}
          />
        ))}
        <div ref={chatEndRef} />
      </div>

      <ChatForm onSendMessage={handleSendMessage} />
    </div>
  );
}