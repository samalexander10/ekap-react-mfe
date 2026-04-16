import React from 'react';
import ReactMarkdown from 'react-markdown';
import { ChatMessage, ActionCard } from '../types';
import { ActionChip } from './ActionChip';

interface ChatBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
  onActionOpen: (action: ActionCard) => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isStreaming, onActionOpen }) => {
  const isUser = message.role === 'user';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        marginBottom: '1rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.5rem',
          flexDirection: isUser ? 'row-reverse' : 'row',
          maxWidth: '80%',
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: isUser ? '#6366f1' : '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.8rem',
            color: '#fff',
            flexShrink: 0,
            fontWeight: 700,
          }}
        >
          {isUser ? 'U' : 'AI'}
        </div>

        {/* Bubble */}
        <div
          style={{
            padding: '0.75rem 1rem',
            borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            background: isUser ? '#6366f1' : '#f3f4f6',
            color: isUser ? '#fff' : '#111827',
            fontSize: '0.9rem',
            lineHeight: 1.6,
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}
        >
          {isUser ? (
            <span>{message.content}</span>
          ) : (
            <div className="markdown-content">
              <ReactMarkdown>{message.content}</ReactMarkdown>
              {isStreaming && (
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 16,
                    background: '#10b981',
                    marginLeft: 2,
                    animation: 'blink 1s step-end infinite',
                    verticalAlign: 'text-bottom',
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action chip below assistant bubble */}
      {!isUser && message.actionCard && (
        <div style={{ marginLeft: 40, marginTop: '0.25rem' }}>
          <ActionChip action={message.actionCard} onOpen={onActionOpen} />
        </div>
      )}
    </div>
  );
};
