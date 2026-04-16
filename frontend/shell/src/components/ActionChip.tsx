import React from 'react';
import { ActionCard } from '../types';

interface ActionChipProps {
  action: ActionCard;
  onOpen: (action: ActionCard) => void;
}

const ACTION_ICONS: Record<string, string> = {
  'name-change': '✏️',
  'benefits': '🏥',
  'pto': '🌴',
  'policy': '📋',
};

export const ActionChip: React.FC<ActionChipProps> = ({ action, onOpen }) => {
  const icon = ACTION_ICONS[action.type] ?? '⚡';

  return (
    <button
      onClick={() => onOpen(action)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.4rem 0.85rem',
        marginTop: '0.5rem',
        border: '1.5px solid #6366f1',
        borderRadius: '999px',
        background: '#eef2ff',
        color: '#4338ca',
        fontSize: '0.82rem',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'background 0.15s, box-shadow 0.15s',
      }}
      onMouseOver={e => {
        (e.currentTarget as HTMLButtonElement).style.background = '#e0e7ff';
        (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(99,102,241,0.2)';
      }}
      onMouseOut={e => {
        (e.currentTarget as HTMLButtonElement).style.background = '#eef2ff';
        (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
      }}
    >
      <span>{icon}</span>
      <span>{action.label}</span>
      <span style={{ fontSize: '0.75rem' }}>→</span>
    </button>
  );
};
