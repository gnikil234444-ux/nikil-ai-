const { createEmbedding } = require("./embeddings");


const memories = [];



// Calculate similarity between vectors

function cosineSimilarity(a, b) {


    let dot = 0;

    let magA = 0;

    let magB = 0;



    for(let i = 0; i < a.length; i++){


        dot += a[i] * b[i];


        magA += a[i] * a[i];


        magB += b[i] * b[i];


    }



    return dot / (Math.sqrt(magA) * Math.sqrt(magB));

}





// Add PDF chunks

async function addMemory(filename, chunks){


    for(const chunk of chunks){


        const embedding = await createEmbedding(chunk);



        memories.push({

            filename: filename,

            text: chunk,

            embedding: embedding

        });


    }


}





// Search by meaning

async function searchMemory(query){


    const queryEmbedding = await createEmbedding(query);



    const results = memories.map((item)=>{


        return {

            filename:item.filename,

            text:item.text,

            score: cosineSimilarity(
                queryEmbedding,
                item.embedding
            )

        };


    });



    results.sort((a,b)=> b.score - a.score);



    return results.slice(0,5);


}





module.exports = {

    addMemory,

    searchMemory

};