import { Router, Request, Response } from 'express';
import { aiService, ChatRequest } from '../services/aiService';

export const aiRouter = Router();

/**
 * POST /api/ai/chat
 * Secure AI chat endpoint with conversation memory
 */
aiRouter.post('/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    const { messages, sessionId } = req.body as ChatRequest;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({
        error: 'Invalid request: "messages" array is required and cannot be empty.'
      });
      return;
    }

    const latestMessage = messages[messages.length - 1];
    if (!latestMessage?.content || latestMessage.content.trim() === '') {
      res.status(400).json({
        error: 'Empty message: Please enter a description or question.'
      });
      return;
    }

    const response = await aiService.generateResponse({ messages, sessionId });
    res.json(response);
  } catch (error: any) {
    console.error('AI chat endpoint error:', error);
    res.status(500).json({
      error: error?.message || 'An unexpected error occurred while communicating with the AI service.'
    });
  }
});
