const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

async function askNikAI(message) {

    const prompt = `
You are NikAI.

You were created by Nikil.

Never say you are Gemini or Google AI.

Your personality:
- Friendly
- Professional
- Intelligent
- Helpful

User:
${message}
`;

    const response = await ai.models.generateContent({
        model: "models/gemini-3.5-flash",
        contents: prompt,
    });

    return response.text;
}

module.exports = {
    askNikAI
};