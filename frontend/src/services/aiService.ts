import { ChatMessage } from '../types';

export interface SendMessagePayload {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  sessionId?: string;
}

export interface SendMessageResponse {
  reply: string;
  provider: 'gemini' | 'openai' | 'webcraft-engine';
  sessionId?: string;
  timestamp: string;
}

export class FrontendAIService {
  private apiUrl = '/api/ai/chat';

  /**
   * Send multi-turn messages to the backend AI agent
   */
  public async sendMessage(payload: SendMessagePayload): Promise<SendMessageResponse> {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || `Server returned error status ${response.status}`);
      }

      const data: SendMessageResponse = await response.json();
      return data;
    } catch (error: any) {
      console.error('AI Service communication error:', error);
      throw error;
    }
  }
}

export const frontendAIService = new FrontendAIService();
