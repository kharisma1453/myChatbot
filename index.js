import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

import 'dotenv/config';

// mulai persiapkan project kita
//
// 1.inisialisasi express

const app = express();
const ai = new GoogleGenAI({});

//2.Inisialisasi middleware

app.use(cors());
//app.use(multer());
app.use(express.json());


// 3.Inisialisasi endpoint
// [HTTP method : GET, POST, PUT, PATCH, DELETE]
// .get() --> utamanya untuk mengambil data atau search
// .post() --> utamanya untuk menaruh (post) data baru kedalam server
// .put() --> utamanya untuk menimpa data yang suda ada didalam server
// .patch() --> utamanya untuk "menambal" data yang sudah ada dalam server 
// .delete() --> utamanya untuk menghapus data yang ada didalam server

// endpoint POST /chat
app.post(
    '/chat', //http://localhost:3000/chat
    async (req, res) => {
       
        const { body } = req;
        const { prompt } = body;

         // guard clause -- satpam
         if (!prompt || typeof prompt !== 'string') {
            res.status(400).json({
                message:"Prompt harus diisi dan berupa string!",
                data: null,
                success:false
            });
            return;
    }
    // Dagingnya
    try {
    //3rd party API -- Google AI
    const aiResponse  = await ai.models.generateContent({
        model:'gemini-2.5-flash',
        contents : [
            { parts:[
                { text:prompt}
            ] 
        }
        ]
    });



    res.status(200).json({
        success: true,
        data: aiResponse.text,
        message: "Berhasil ditanggapi oleh google gemini flash!"

    });
    } catch (e) {
        console.log(e);
        res.status(500).json({
            succes:false,
            data:null,
            message: e.massage || "Ada masalah di server nih !"
        })
    }
  }
);

// entry point
app.listen(3000, () => {
    console.log("I LOVE YOU 3000")
});
