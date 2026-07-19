require("dotenv").config();
console.log("MY KEY:", process.env.GEMINI_API_KEY);
const express = require("express");
const path = require("path");
const multer = require("multer");

const { askNikAI } = require("./services/ai");
const { readPDF } = require("./services/pdf");
const { splitText } = require("./services/chunk");
const { addMemory, searchMemory } = require("./services/memory");


const app = express();


app.use(express.json());

app.use(express.static(path.join(__dirname, "../frontend")));



// Store uploaded PDFs

let pdfMemory = [];



// PDF upload setup

const upload = multer({

    storage: multer.memoryStorage()

});




// Home page

app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "../frontend/index.html")
    );

});





// Upload PDF + Embedding Memory

app.post("/upload-pdf", upload.single("pdf"), async (req, res) => {

    try {


        if (!req.file) {

            return res.json({

                success:false,

                message:"No PDF uploaded."

            });

        }



        const text = await readPDF(req.file.buffer);



        // Split PDF into chunks

        const chunks = splitText(text);



        // Create embeddings and store memory

        await addMemory(

            req.file.originalname,

            chunks

        );



        // Keep PDF record

        pdfMemory.push({

            name:req.file.originalname,

            content:text

        });



        res.json({

            success:true,

            filename:req.file.originalname,

            message:"PDF uploaded and learned."

        });



    } catch(error) {


        console.error("PDF Error:", error);



        res.status(500).json({

            success:false,

            message:"Could not read PDF."

        });


    }


});








// NikAI Chat with Embedding Search

app.post("/chat", async (req,res)=>{


    try {


        const { message } = req.body;



        if(!message){

            return res.json({

                reply:"Please type a message."

            });

        }



        let prompt = message;



        // Search using AI meaning

        const results = await searchMemory(message);




        if(results.length > 0){



            let context = results.map((item)=>{


                return `

DOCUMENT:

${item.filename}



CONTENT:

${item.text}

`;

            }).join("\n\n");





            prompt = `

You are NikAI.



Answer the user's question using the document information below.



DOCUMENT INFORMATION:

${context}



USER QUESTION:

${message}



Rules:

- Use the document information when possible.
- Do not invent answers.
- If the answer is not found, say:
"I could not find that information in the uploaded documents."

`;

        }




        const reply = await askNikAI(prompt);



        res.json({

            reply

        });





    } catch(error){



        console.error("NikAI Error:",error);



        res.status(500).json({

            reply:"❌ Sorry, I couldn't contact NikAI right now."

        });


    }


});








const PORT = 3000;



app.listen(PORT,()=>{


    console.log(`🤖 NikAI running at http://localhost:${PORT}`);


});