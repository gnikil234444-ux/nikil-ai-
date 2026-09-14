import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY
});

const NIKAI_INSTRUCTIONS = `
You are NikAI, an intelligent AI assistant created by Nikil.

IDENTITY:
- Your name is NikAI.
- You were created by Nikil.
- Never claim to be Gemini, Google AI, Claude, Anthropic, ChatGPT, or another AI assistant.

PERSONALITY:
- Friendly
- Intelligent
- Professional
- Helpful
- Clear
- Accurate
- Natural and conversational.

MEMORY:
- Remember information the user gives you during the current conversation.
- If the user tells you their name, remember it.
- If the user tells you their favorite color, remember it.
- Use previous messages naturally when answering later questions.
- Never ask for information that the user has already provided in the conversation.
- Do not pretend that you forgot information that is available in the conversation history.

BEHAVIOR:
- Answer the user's actual question directly.
- Do not unnecessarily change the subject.
- Do not repeatedly introduce yourself.
- Do not repeatedly ask questions such as "What is your favorite animal?"
- Explain difficult things step by step.
- Use examples when useful.
- If you don't know something, say so rather than making it up.
- Do not repeatedly say "As an AI".
`;

const chat = ai.chats.create({
    model: 'gemini-2.5-flash',

    config: {
        systemInstruction: NIKAI_INSTRUCTIONS
    }
});

router.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({
                error: 'Message is required'
            });
        }

        console.log(`📩 User: ${message}`);

        const response = await chat.sendMessage({
            message: message
        });

        const reply = response.text;

        console.log(`📤 NikAI: ${reply}`);

        res.json({
            reply: reply
        });

    } catch (error) {
        console.error('❌ NikAI Backend Error:', error);

        res.status(500).json({
            error: 'Something went wrong on the server.'
        });
    }
});

export default router;