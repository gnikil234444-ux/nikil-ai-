const chatBox = document.getElementById("chat-box");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const newChatBtn = document.getElementById("newChat");
const micBtn = document.getElementById("micBtn");

const pdfFile = document.getElementById("pdfFile");
const uploadPdfBtn = document.getElementById("uploadPdf");

const chatTitle = document.getElementById("chat-title");
const chatHistory = document.getElementById("chat-history");



let messages = JSON.parse(localStorage.getItem("nikaiChat")) || [];

let chatTitles = JSON.parse(localStorage.getItem("nikaiTitles")) || [];

let currentTitle = localStorage.getItem("nikaiCurrentTitle") || "NikAI";





function saveChat(){

    localStorage.setItem(
        "nikaiChat",
        JSON.stringify(messages)
    );

}





function saveTitles(){

    localStorage.setItem(
        "nikaiTitles",
        JSON.stringify(chatTitles)
    );

}





function updateTitle(title){

    currentTitle = title;

    chatTitle.textContent = title;

    localStorage.setItem(
        "nikaiCurrentTitle",
        title
    );


}







function generateTitle(text){


    let title = text
        .replace(/[^\w\s]/gi,"")
        .split(" ")
        .slice(0,4)
        .join(" ");


    if(title.length > 25){

        title = title.substring(0,25) + "...";

    }



    return title || "New Chat";


}









function addToHistory(title){


    const item = document.createElement("p");


    item.innerHTML = "💬 " + title;



    chatHistory.prepend(item);


}







function loadHistory(){


    chatHistory.innerHTML = "";


    chatTitles.forEach(title=>{


        addToHistory(title);


    });


}





function createMessage(text, sender){


    const row = document.createElement("div");


    row.className =
        sender === "user"
        ? "user-row"
        : "bot-row";





    const avatar = document.createElement("div");


    avatar.className = "avatar";


    avatar.textContent =
        sender === "user"
        ? "👤"
        : "🤖";






    const bubble = document.createElement("div");



    bubble.className =
        sender === "user"
        ? "user-message"
        : "bot-message";







    if(sender === "bot"){


        bubble.innerHTML = marked.parse(text);



        bubble.querySelectorAll("pre code")
        .forEach((block)=>{


            hljs.highlightElement(block);


        });






        const copyBtn = document.createElement("button");


        copyBtn.className="copy-btn";


        copyBtn.textContent="📑 Copy";




        copyBtn.onclick = async()=>{


            await navigator.clipboard.writeText(text);


            copyBtn.textContent="✔️ Copied!";


            setTimeout(()=>{


                copyBtn.textContent="📑 Copy";


            },2000);



        };



        bubble.appendChild(copyBtn);



    }

    else{


        bubble.textContent=text;


    }







    if(sender==="user"){


        row.appendChild(bubble);

        row.appendChild(avatar);


    }

    else{


        row.appendChild(avatar);

        row.appendChild(bubble);


    }





    chatBox.appendChild(row);


    chatBox.scrollTop =
        chatBox.scrollHeight;



}






messages.forEach(msg=>{


    createMessage(
        msg.text,
        msg.sender
    );


});



loadHistory();



updateTitle(currentTitle);








async function sendMessage(){


    const message =
        userInput.value.trim();



    if(!message) return;





    if(messages.length === 0){


        const title =
            generateTitle(message);



        updateTitle(title);



        chatTitles.push(title);


        saveTitles();


        addToHistory(title);



    }







    createMessage(
        message,
        "user"
    );



    messages.push({

        text:message,

        sender:"user"

    });



    saveChat();




    userInput.value="";





    const row =
        document.createElement("div");


    row.className="bot-row";



    const avatar =
        document.createElement("div");



    avatar.className="avatar";


    avatar.textContent="🤖";





    const thinking =
        document.createElement("div");



    thinking.className="bot-message";



    thinking.innerHTML=`

        <div class="typing">

            <span></span>

            <span></span>

            <span></span>

        </div>

    `;



    row.appendChild(avatar);

    row.appendChild(thinking);



    chatBox.appendChild(row);
        try {


        const response = await fetch("/chat", {

            method:"POST",

            headers:{

                "Content-Type":"application/json"

            },

            body:JSON.stringify({

                message

            })

        });





        const data =
            await response.json();





        row.remove();





        createMessage(

            data.reply,

            "bot"

        );





        messages.push({

            text:data.reply,

            sender:"bot"

        });





        saveChat();




    }

    catch(error){


        row.remove();



        createMessage(

            "❌ Error contacting NikAI.",

            "bot"

        );


    }



}








sendBtn.onclick = sendMessage;






userInput.addEventListener(
    "keydown",
    (e)=>{


        if(e.key==="Enter"){


            sendMessage();


        }


    }
);









// NEW CHAT BUTTON


newChatBtn.onclick = ()=>{


    if(confirm("Start a new chat?")){


        messages=[];


        saveChat();



        chatBox.innerHTML="";



        updateTitle("NikAI");



        createMessage(

            "👋 Hello! I am NikAI. How can I help you today?",

            "bot"

        );


    }


};









// 🎙️ VOICE INPUT


const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;





if(SpeechRecognition && micBtn){



    const recognition =
        new SpeechRecognition();




    recognition.lang="en-US";


    recognition.continuous=false;





    micBtn.onclick=()=>{


        recognition.start();


        micBtn.textContent="🔴";


    };






    recognition.onresult=(event)=>{


        const voiceText =
            event.results[0][0].transcript;



        userInput.value=voiceText;



        micBtn.textContent="🎙️";


    };






    recognition.onerror=()=>{


        micBtn.textContent="🎙️";


    };



}

else{


    console.log(
        "Voice recognition not supported"
    );


}









// 📎 PDF UPLOAD


uploadPdfBtn.onclick = async()=>{


    const file =
        pdfFile.files[0];



    if(!file){


        alert(
            "Please select a PDF first."
        );


        return;


    }






    const formData =
        new FormData();





    formData.append(
        "pdf",
        file
    );







    createMessage(

        "📎 Uploading PDF...",

        "user"

    );







    try{


        const response =
            await fetch(
                "/upload-pdf",
                {

                    method:"POST",

                    body:formData

                }

            );





        const data =
            await response.json();






        if(data.success){



            createMessage(


`✅ ${data.filename} loaded!

📚 NikAI has learned this document.

You can now ask questions about this PDF.`,

                "bot"

            );



        }

        else{



            createMessage(

                "❌ PDF upload failed.",

                "bot"

            );


        }



    }



    catch(error){



        console.error(error);




        createMessage(

            "❌ Error uploading PDF.",

            "bot"

        );


    }


};