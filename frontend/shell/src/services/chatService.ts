import { StreamEvent } from '../types';

const CHAT_SERVICE_URL = process.env.CHAT_SERVICE_URL || 'http://localhost:8000';

export async function* streamChat(
  conversationId: string,
  message: string,
  userId: string = 'user-001'
): AsyncGenerator<StreamEvent> {
  const response = await fetch(`${CHAT_SERVICE_URL}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversation_id: conversationId, user_id: userId, message }),
  });

  if (!response.ok) {
    throw new Error(`Chat service error: ${response.status}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6).trim();
        if (!jsonStr) continue;
        try {
          const event: StreamEvent = JSON.parse(jsonStr);
          yield event;
        } catch {
          // skip malformed events
        }
      }
    }
  }
}
