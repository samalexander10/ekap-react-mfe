import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, ActionCard } from '../types';
import { ChatBubble } from './ChatBubble';
import { SidePanel } from './SidePanel';
import { streamChat } from '../services/chatService';

const generateId = () => Math.random().toString(36).slice(2, 10);
const generateConversationId = () => `conv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

export const ChatPanel: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hello! I'm **EKAP**, your Enterprise Knowledge & Action Platform assistant. I can help you with HR policies, benefits, time-off questions, and self-service tasks like name changes.\n\nHow can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [conversationId] = useState(generateConversationId);
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleActionOpen = useCallback((action: ActionCard) => {
    if (action.type === 'name-change') {
      setSidePanelOpen(true);
    }
  }, []);

  const handleNameChangeComplete = useCallback(
    (requestId: string) => {
      const confirmMsg: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: `Your name change request has been submitted successfully! \n\n**Request ID:** \`${requestId}\`\n\nHR will verify your document and update your records within 5 business days. You'll receive email confirmation at each step.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, confirmMsg]);
    },
    []
  );

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    setInput('');

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    const assistantId = generateId();
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setIsStreaming(true);
    setStreamingMsgId(assistantId);

    try {
      for await (const event of streamChat(conversationId, text)) {
        if (event.type === 'text' && event.data) {
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantId ? { ...m, content: m.content + event.data } : m
            )
          );
        } else if (event.type === 'action' && event.action) {
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantId ? { ...m, actionCard: event.action } : m
            )
          );
        } else if (event.type === 'done') {
          break;
        } else if (event.type === 'error') {
          setMessages(prev =>
            prev.map(m =>
              m.id === assistantId
                ? { ...m, content: m.content || 'An error occurred. Please try again.' }
                : m
            )
          );
          break;
        }
      }
    } catch (err) {
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, content: 'Could not reach the chat service. Please check your connection.' }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
      setStreamingMsgId(null);
    }
  }, [input, isStreaming, conversationId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.25rem 1rem',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {messages.map(msg => (
          <ChatBubble
            key={msg.id}
            message={msg}
            isStreaming={isStreaming && msg.id === streamingMsgId}
            onActionOpen={handleActionOpen}
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div
        style={{
          borderTop: '1px solid #e5e7eb',
          padding: '0.85rem 1rem',
          background: '#f9fafb',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'flex-end',
            background: '#fff',
            border: '1.5px solid #d1d5db',
            borderRadius: 12,
            padding: '0.5rem 0.75rem',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about policies, benefits, name changes…"
            rows={1}
            disabled={isStreaming}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              resize: 'none',
              fontSize: '0.9rem',
              lineHeight: 1.5,
              background: 'transparent',
              color: '#111827',
              maxHeight: 140,
              overflowY: 'auto',
            }}
          />
          <button
            onClick={sendMessage}
            disabled={isStreaming || !input.trim()}
            aria-label="Send message"
            style={{
              background: isStreaming || !input.trim() ? '#d1d5db' : '#6366f1',
              border: 'none',
              borderRadius: 8,
              width: 36,
              height: 36,
              cursor: isStreaming || !input.trim() ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '1rem',
              flexShrink: 0,
              transition: 'background 0.15s',
            }}
          >
            {isStreaming ? '⋯' : '↑'}
          </button>
        </div>
        <div style={{ fontSize: '0.72rem', color: '#9ca3af', marginTop: '0.4rem', textAlign: 'center' }}>
          Press Enter to send · Shift+Enter for new line
        </div>
      </div>

      {/* Module Federation side panel — renders remote React component directly */}
      <SidePanel
        isOpen={sidePanelOpen}
        onClose={() => setSidePanelOpen(false)}
        onComplete={handleNameChangeComplete}
      />
    </div>
  );
};
