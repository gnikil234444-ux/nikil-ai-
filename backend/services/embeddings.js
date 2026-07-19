const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

async function createEmbedding(text) {

    const result = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: text
    });

    return result.embeddings[0].values;
}

module.exports = {
    createEmbedding
};