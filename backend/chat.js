import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables from your .env file
dotenv.config();

const router = express.Router();

// Initialize the Google Gen AI SDK with your API key
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// POST route to handle chat messages
router.post('/chat', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        console.log(`📩 Backend received message: "${message}"`);

        // Call the Gemini model (using gemini-2.5-flash for fast web text responses)
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: message,
        });

        console.log("📤 Gemini responded successfully!");

        // Send the AI's response text back to the frontend
        res.json({ reply: response.text });

    } catch (error) {
        console.error("❌ Backend Error:", error);
        res.status(500).json({ error: "Something went wrong on the server." });
    }
});

export default router;