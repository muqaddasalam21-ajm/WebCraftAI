import { ChatMessage } from '../types';
import { getAuthToken } from '../utils/token';
import { safeApiRequest } from '../utils/apiConfig';

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
  /**
   * Send multi-turn messages to the backend AI agent
   */
  public async sendMessage(payload: SendMessagePayload): Promise<SendMessageResponse> {
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const data = await safeApiRequest<SendMessageResponse>('/api/ai/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      return data;
    } catch (error: any) {
      console.error('AI Service communication error:', error);
      throw error;
    }
  }
}

export const frontendAIService = new FrontendAIService();
