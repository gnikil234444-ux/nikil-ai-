const fs = require("fs");
const path = require("path");
const { createEmbedding } = require("./embeddings");

const memoryFile = path.join(__dirname, "../data/memory.json");

// Load saved memories
let memories = [];

try {
    if (fs.existsSync(memoryFile)) {
        const data = fs.readFileSync(memoryFile, "utf8");
        memories = JSON.parse(data);
    }
} catch (error) {
    console.log("Could not load memory file:", error.message);
    memories = [];
}

// Save memories permanently
function saveMemories() {
    fs.writeFileSync(
        memoryFile,
        JSON.stringify(memories, null, 2)
    );
}

// Calculate similarity between vectors
function cosineSimilarity(a, b) {

    let dot = 0;
    let magA = 0;
    let magB = 0;

    for (let i = 0; i < a.length; i++) {
        dot += a[i] * b[i];
        magA += a[i] * a[i];
        magB += b[i] * b[i];
    }

    if (magA === 0 || magB === 0) {
        return 0;
    }

    return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

// Add a normal chat memory
async function addChatMemory(text) {

    const embedding = await createEmbedding(text);

    memories.push({
        type: "chat",
        text: text,
        embedding: embedding,
        createdAt: new Date().toISOString()
    });

    saveMemories();
}

// Add PDF chunks
async function addMemory(filename, chunks) {

    for (const chunk of chunks) {

        const embedding = await createEmbedding(chunk);

        memories.push({
            type: "pdf",
            filename: filename,
            text: chunk,
            embedding: embedding,
            createdAt: new Date().toISOString()
        });
    }

    saveMemories();
}

// Search memories by meaning
async function searchMemory(query) {

    if (memories.length === 0) {
        return [];
    }

    const queryEmbedding = await createEmbedding(query);

    const results = memories.map((item) => {

        return {
            type: item.type,
            filename: item.filename || null,
            text: item.text,
            score: cosineSimilarity(
                queryEmbedding,
                item.embedding
            )
        };

    });

    results.sort((a, b) => b.score - a.score);

    return results.slice(0, 5);
}

module.exports = {
    addMemory,
    addChatMemory,
    searchMemory
};