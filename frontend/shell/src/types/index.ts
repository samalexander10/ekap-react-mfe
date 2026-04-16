export type MessageRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  actionCard?: ActionCard;
}

export interface ActionCard {
  type: string;
  label: string;
  payload: Record<string, unknown>;
}

export interface StreamEvent {
  type: 'text' | 'action' | 'done' | 'error';
  data?: string;
  action?: ActionCard;
}
