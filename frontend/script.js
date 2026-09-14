// ===============================
// NikAI FRONTEND
// ===============================

let currentChatId = "chat-" + Date.now();

let chats = {};
let titles = {};

let recognition = null;

let voiceMode = false;
let listening = false;
let speaking = false;


// ===============================
// ELEMENTS
// ===============================

const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");
const newChatBtn = document.getElementById("newChat");
const chatHistory = document.getElementById("chat-history");
const chatTitle = document.getElementById("chat-title");
const pdfFile = document.getElementById("pdfFile");
const uploadPdf = document.getElementById("uploadPdf");


// ===============================
// STATUS MESSAGE
// ===============================

const status = document.createElement("div");

status.style.position = "fixed";
status.style.bottom = "90px";
status.style.left = "50%";
status.style.transform = "translateX(-50%)";
status.style.padding = "10px 18px";
status.style.borderRadius = "12px";
status.style.background = "#222";
status.style.color = "white";
status.style.fontSize = "14px";
status.style.zIndex = "9999";
status.style.display = "none";

document.body.appendChild(status);


function showStatus(message) {

    status.textContent = message;
    status.style.display = "block";

    setTimeout(() => {
        status.style.display = "none";
    }, 2500);
}


// ===============================
// LOAD SAVED CHATS
// ===============================

try {

    chats =
        JSON.parse(
            localStorage.getItem("nikaiChat") || "{}"
        );

    titles =
        JSON.parse(
            localStorage.getItem("nikaiTitles") || "{}"
        );

} catch {

    chats = {};
    titles = {};

}


// ===============================
// SAVE CHATS
// ===============================

function saveChats() {

    localStorage.setItem(
        "nikaiChat",
        JSON.stringify(chats)
    );

    localStorage.setItem(
        "nikaiTitles",
        JSON.stringify(titles)
    );
}


// ===============================
// DISPLAY MESSAGE
// ===============================

function addMessage(text, sender) {

    const message = document.createElement("div");

    message.className =
        sender === "user"
            ? "message user-message"
            : "message bot-message";

    if (sender === "bot" && typeof marked !== "undefined") {

        message.innerHTML =
            marked.parse(text);

    } else {

        message.textContent = text;

    }

    chatBox.appendChild(message);

    chatBox.scrollTop =
        chatBox.scrollHeight;
}


// ===============================
// CREATE CHAT
// ===============================

function createNewChat() {

    currentChatId =
        "chat-" + Date.now();

    chats[currentChatId] = [
        {
            sender: "bot",
            text: "Hello! I am NikAI. How can I help you?"
        }
    ];

    titles[currentChatId] = "New Chat";

    saveChats();

    renderChat();

    renderHistory();
}


// ===============================
// RENDER CURRENT CHAT
// ===============================

function renderChat() {

    chatBox.innerHTML = "";

    const messages =
        chats[currentChatId] || [];

    for (const message of messages) {

        addMessage(
            message.text,
            message.sender
        );

    }

    chatTitle.textContent =
        titles[currentChatId] || "NikAI";
}


// ===============================
// RENDER CHAT HISTORY
// ===============================

function renderHistory() {

    chatHistory.innerHTML = "";

    for (const id in chats) {

        const item =
            document.createElement("div");

        item.className = "history-item";

        item.textContent =
            titles[id] || "New Chat";

        item.onclick = () => {

            currentChatId = id;

            renderChat();

        };

        chatHistory.appendChild(item);
    }
}


// ===============================
// SAVE MESSAGE
// ===============================

function saveMessage(sender, text) {

    if (!chats[currentChatId]) {

        chats[currentChatId] = [];

    }

    chats[currentChatId].push({
        sender,
        text
    });

    saveChats();
}


// ===============================
// IMAGE REQUEST DETECTOR
// ===============================

function isImageRequest(text) {

    const lower =
        text.toLowerCase();

    return (
        lower.includes("generate an image") ||
        lower.includes("create an image") ||
        lower.includes("make an image") ||
        lower.includes("draw an image") ||
        lower.includes("generate a picture") ||
        lower.includes("create a picture") ||
        lower.startsWith("draw ")
    );
}


// ===============================
// BETTER IMAGE PROMPT
// ===============================

function buildImagePrompt(idea) {

    return `
Create a high-quality detailed image based exactly on this request:

${idea}

IMPORTANT:

- Follow the user's description precisely.
- Make the requested subject the main focus.
- Do not add unrelated objects.
- Keep proportions realistic.
- Use accurate perspective.
- Use natural lighting and shadows.
- Create strong depth and composition.
- Make the environment match the request.
- Preserve requested colors.
- Preserve requested clothing.
- Preserve requested characters.
- Preserve requested objects.
- Preserve requested location.
- Preserve requested weather.
- Preserve requested time of day.
- Preserve requested camera angle.
- Preserve requested artistic style.

QUALITY:

- highly detailed
- sharp subject
- clean composition
- realistic textures
- coherent background
- professional lighting
- correct anatomy
- no duplicated objects
- no distorted faces
- no extra limbs
- no extra fingers
- no random objects
- no random text
- no watermark

The final image should closely match the user's original request.
`.trim();
}


// ===============================
// GENERATE IMAGE
// ===============================

async function generateImage(idea) {

    const prompt =
        buildImagePrompt(idea);

    const url =
        "https://image.pollinations.ai/prompt/" +
        encodeURIComponent(prompt) +
        "?width=1024&height=1024&nologo=true";

    const image =
        document.createElement("img");

    image.src = url;

    image.style.maxWidth = "100%";
    image.style.borderRadius = "15px";
    image.style.marginTop = "10px";

    chatBox.appendChild(image);

    chatBox.scrollTop =
        chatBox.scrollHeight;

    return url;
}


// ===============================
// SEND MESSAGE
// ===============================

async function sendMessage(fromVoice = false) {

    const message =
        userInput.value.trim();

    if (!message) {

        return;

    }


    // Clear input
    userInput.value = "";


    // Show user message
    addMessage(
        message,
        "user"
    );

    saveMessage(
        "user",
        message
    );


    // Image generation
    if (isImageRequest(message)) {

        showStatus("🎨 Creating your image...");

        try {

            await generateImage(message);

            saveMessage(
                "bot",
                "[Image generated]"
            );

        } catch (error) {

            console.error(
                "Image error:",
                error
            );

            addMessage(
                "Sorry, I couldn't generate the image.",
                "bot"
            );

        }

        return;
    }


    // Disable send button
    sendBtn.disabled = true;

    sendBtn.textContent =
        "Thinking...";


    try {

        console.log(
            "📤 Sending message to NikAI:",
            message
        );


        const response =
            await fetch(
                "/chat",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({

                        message: message,

                        chatId:
                            currentChatId

                    })
                }
            );


        console.log(
            "📥 Server status:",
            response.status
        );


        if (!response.ok) {

            throw new Error(
                "Server returned " +
                response.status
            );

        }


        const data =
            await response.json();


        console.log(
            "🤖 NikAI reply:",
            data.reply
        );


        const reply =
            data.reply ||
            "I didn't receive a reply.";


        addMessage(
            reply,
            "bot"
        );


        saveMessage(
            "bot",
            reply
        );


        // IMPORTANT:
        // Only voice messages are spoken.
        // Normal typed messages stay silent.

        if (
            fromVoice &&
            voiceMode
        ) {

            speakResponse(reply);

        }


    } catch (error) {

        console.error(
            "❌ Chat error:",
            error
        );


        addMessage(
            "❌ I couldn't connect to NikAI. Please check that the backend is running.",
            "bot"
        );


        if (fromVoice) {

            voiceMode = false;

        }

    } finally {

        sendBtn.disabled = false;

        sendBtn.textContent =
            "Send";

    }

}


// ===============================
// ENTER KEY
// ===============================

userInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter"
        ) {

            event.preventDefault();

            sendMessage(false);

        }

    }
);


// ===============================
// SEND BUTTON
// ===============================

sendBtn.addEventListener(
    "click",
    () => {

        sendMessage(false);

    }
);


// ===============================
// VOICE RECOGNITION
// ===============================

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;


if (!SpeechRecognition) {

    console.error(
        "Speech recognition is not supported."
    );

    micBtn.onclick = () => {

        showStatus(
            "❌ Voice recognition is not supported in this browser."
        );

    };

} else {

    recognition =
        new SpeechRecognition();


    recognition.continuous =
        false;


    recognition.interimResults =
        false;


    recognition.lang =
        "en-IN";


    // ===========================
    // VOICE START
    // ===========================

    recognition.onstart = () => {

        listening = true;

        micBtn.textContent =
            "🔴";

        showStatus(
            "🎤 Listening..."
        );

        console.log(
            "🎤 Voice listening started"
        );

    };


    // ===========================
    // VOICE RESULT
    // ===========================

    recognition.onresult =
        async event => {

            try {

                const result =
                    event.results[
                        event.results.length - 1
                    ];


                const text =
                    result[0]
                        .transcript
                        .trim();


                console.log(
                    "🎤 You said:",
                    text
                );


                if (!text) {

                    return;

                }


                listening = false;


                userInput.value =
                    text;


                // THIS IS THE IMPORTANT PART
                // It actually sends the voice
                // message to /chat.

                await sendMessage(true);


            } catch (error) {

                console.error(
                    "❌ Voice result error:",
                    error
                );

            }

        };


    // ===========================
    // VOICE END
    // ===========================

    recognition.onend = () => {

        listening = false;

        micBtn.textContent =
            "🎙️";


        console.log(
            "🎤 Voice listening ended"
        );


        // If voice mode is still active
        // and NikAI isn't speaking,
        // listen again.

        if (
            voiceMode &&
            !speaking
        ) {

            setTimeout(
                startListening,
                500
            );

        }

    };


    // ===========================
    // VOICE ERROR
    // ===========================

    recognition.onerror =
        event => {

            console.error(
                "❌ Voice error:",
                event.error
            );


            listening = false;

            micBtn.textContent =
                "🎙️";


            if (
                event.error ===
                "not-allowed"
            ) {

                voiceMode = false;

                showStatus(
                    "❌ Microphone permission denied. Allow microphone access in Chrome."
                );

            }

            else if (
                event.error ===
                "audio-capture"
            ) {

                voiceMode = false;

                showStatus(
                    "❌ No microphone was detected."
                );

            }

            else if (
                event.error ===
                "network"
            ) {

                voiceMode = false;

                showStatus(
                    "❌ Voice recognition network error."
                );

            }

            else if (
                event.error ===
                "service-not-allowed"
            ) {

                voiceMode = false;

                showStatus(
                    "❌ Voice recognition service is unavailable."
                );

            }

            else if (
                event.error !==
                "aborted" &&
                event.error !==
                "no-speech"
            ) {

                showStatus(
                    "❌ Voice error: " +
                    event.error
                );

            }

        };

}


// ===============================
// START LISTENING
// ===============================

function startListening() {

    if (
        !recognition ||
        !voiceMode ||
        speaking ||
        listening
    ) {

        return;

    }


    try {

        recognition.start();

    } catch (error) {

        console.log(
            "Recognition start skipped:",
            error.message
        );

    }

}


// ===============================
// STOP VOICE
// ===============================

function stopVoice() {

    voiceMode = false;

    listening = false;

    speaking = false;


    if (recognition) {

        try {

            recognition.stop();

        } catch {}

    }


    speechSynthesis.cancel();


    micBtn.textContent =
        "🎙️";


    showStatus(
        "🔇 Voice chat stopped"
    );

}


// ===============================
// SPEAK NIKAI RESPONSE
// ===============================

function speakResponse(text) {

    if (
        !voiceMode
    ) {

        return;

    }


    speechSynthesis.cancel();


    const utterance =
        new SpeechSynthesisUtterance(
            text
        );


    utterance.lang =
        "en-IN";


    utterance.rate =
        1;


    utterance.pitch =
        1;


    speaking = true;


    micBtn.textContent =
        "⏹️";


    showStatus(
        "🔊 NikAI is speaking..."
    );


    utterance.onend = () => {

        speaking = false;

        micBtn.textContent =
            "🎙️";


        if (voiceMode) {

            setTimeout(
                startListening,
                300
            );

        }

    };


    utterance.onerror = () => {

        speaking = false;

        micBtn.textContent =
            "🎙️";

    };


    speechSynthesis.speak(
        utterance
    );

}


// ===============================
// MIC BUTTON
// ===============================

micBtn.addEventListener(
    "click",
    () => {

        // If NikAI is speaking,
        // stop speaking and listen.

        if (speaking) {

            speechSynthesis.cancel();

            speaking = false;

            micBtn.textContent =
                "🎙️";


            setTimeout(
                startListening,
                200
            );

            return;

        }


        // If currently listening,
        // stop voice mode.

        if (listening) {

            stopVoice();

            return;

        }


        // Start voice mode.

        voiceMode = true;

        showStatus(
            "🎤 Starting voice chat..."
        );

        startListening();

    }
);


// ===============================
// NEW CHAT
// ===============================

newChatBtn.addEventListener(
    "click",
    () => {

        createNewChat();

    }
);


// ===============================
// PDF UPLOAD
// ===============================

uploadPdf.addEventListener(
    "click",
    async () => {

        const file =
            pdfFile.files[0];


        if (!file) {

            showStatus(
                "📄 Please choose a PDF first."
            );

            return;

        }


        const formData =
            new FormData();


        formData.append(
            "pdf",
            file
        );


        uploadPdf.disabled =
            true;


        uploadPdf.textContent =
            "Learning...";


        try {

            const response =
                await fetch(
                    "/upload-pdf",
                    {
                        method: "POST",
                        body: formData
                    }
                );


            const data =
                await response.json();


            if (
                data.success
            ) {

                showStatus(
                    "✅ PDF learned successfully!"
                );

            } else {

                showStatus(
                    "❌ " +
                    (
                        data.message ||
                        "PDF upload failed."
                    )
                );

            }

        } catch (error) {

            console.error(
                "PDF error:",
                error
            );

            showStatus(
                "❌ Could not upload PDF."
            );

        } finally {

            uploadPdf.disabled =
                false;

            uploadPdf.textContent =
                "📎 Upload PDF";

        }

    }
);


// ===============================
// INITIAL CHAT
// ===============================

if (
    Object.keys(chats).length === 0
) {

    createNewChat();

} else {

    if (
        !chats[currentChatId]
    ) {

        currentChatId =
            Object.keys(chats)[0];

    }

    renderChat();

    renderHistory();

}