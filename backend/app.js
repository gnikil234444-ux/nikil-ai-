require("dotenv").config();

const express = require("express");
const path = require("path");
const multer = require("multer");

const { askNikAI } = require("./services/ai");
const { readPDF } = require("./services/pdf");
const { splitText } = require("./services/chunk");

const {
    addMemory,
    addChatMemory,
    searchMemory
} = require("./services/memory");

const app = express();

app.use(express.json());

/* =========================
   FRONTEND
========================= */

app.use(
    express.static(
        path.join(__dirname, "../frontend")
    )
);

/* =========================
   FILE UPLOAD
========================= */

const upload = multer({
    storage: multer.memoryStorage()
});

/* =========================
   HOME PAGE
========================= */

app.get("/", (req, res) => {
    res.sendFile(
        path.join(
            __dirname,
            "../frontend/index.html"
        )
    );
});

/* =========================
   PDF UPLOAD
========================= */

app.post(
    "/upload-pdf",
    upload.single("pdf"),
    async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: "Please upload a PDF."
                });
            }

            console.log(
                "📄 Reading PDF:",
                req.file.originalname
            );

            const text = await readPDF(
                req.file.buffer
            );

            const chunks = splitText(text);

            await addMemory(
                req.file.originalname,
                chunks
            );

            console.log(
                "✅ PDF learned:",
                req.file.originalname
            );

            res.json({
                success: true,
                filename: req.file.originalname,
                message: "PDF uploaded and learned."
            });

        } catch (error) {
            console.error(
                "❌ PDF Error:",
                error
            );

            res.status(500).json({
                success: false,
                message: "Could not read PDF."
            });
        }
    }
);

/* =========================
   CHAT
========================= */

app.post(
    "/chat",
    async (req, res) => {
        try {
            const {
                message,
                chatId
            } = req.body;

            if (!message || !message.trim()) {
                return res.json({
                    reply: "Please type a message."
                });
            }

            console.log(
                "👤 User:",
                message
            );

            /*
             * Search permanent memory
             */
            const results =
                await searchMemory(message);

            let prompt = message;

            /*
             * Add relevant memories
             */
            if (results.length > 0) {

                let context = "";

                for (const item of results) {

                    if (item.type === "pdf") {

                        context +=
                            "\nPDF DOCUMENT: " +
                            item.filename +
                            "\nCONTENT:\n" +
                            item.text +
                            "\n";

                    } else {

                        context +=
                            "\nPREVIOUS MEMORY:\n" +
                            item.text +
                            "\n";
                    }
                }

                prompt =
                    "You are NikAI.\n\n" +

                    "Use the saved information below " +
                    "ONLY when it is relevant to the " +
                    "user's current question.\n\n" +

                    "Do NOT mention unrelated memories.\n" +
                    "Do NOT randomly tell the user what " +
                    "you remember about them.\n\n" +

                    "SAVED INFORMATION:\n" +
                    context +

                    "\nCURRENT USER MESSAGE:\n" +
                    message +

                    "\n\nIMPORTANT RULES:\n" +
                    "- Use relevant information when helpful.\n" +
                    "- Ignore unrelated information.\n" +
                    "- Do not invent memories.\n" +
                    "- Answer the user's actual question.\n" +
                    "- Be clear, helpful and natural.";
            }

            /*
             * Ask NikAI using the current chat ID
             */
            const reply =
                await askNikAI(
                    prompt,
                    chatId
                );

            console.log(
                "🤖 NikAI:",
                reply
            );

            /*
             * Save conversation permanently
             */
            await addChatMemory(
                "User: " +
                message +
                "\nNikAI: " +
                reply
            );

            res.json({
                reply: reply
            });

        } catch (error) {

            console.error(
                "❌ NikAI Error:",
                error
            );

            res.status(500).json({
                reply:
                    "❌ Sorry, I couldn't contact NikAI right now."
            });
        }
    }
);

/* =========================
   SERVER
========================= */

const PORT =
    process.env.PORT || 3000;

app.listen(
    PORT,
    () => {
        console.log(
            "🤖 NikAI running on port " +
            PORT
        );
    }
);