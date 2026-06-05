import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.get("/", (req, res) => {
  res.send("Proxy activo");
});

app.post("/ai", async (req, res) => {

  try {

    const question = req.body.question || "";
    const dataset = req.body.dataset || [];

    if (!question) {
      return res.status(400).json({
        error: "No llegó ninguna pregunta"
      });
    }

    const response = await client.chat.completions.create({

      model: "gpt-4o-mini",

      messages: [

        {
          role: "system",
          content: `
Eres Brain AI.

Eres un analista senior de Power BI especializado en marketing, medios e inversión.

Analiza únicamente los datos entregados.

Responde en español.

Sé breve, ejecutivo y orientado a insights.
`
        },

        {
          role: "user",
          content: `
Dataset:

${JSON.stringify(dataset, null, 2)}

Pregunta:

${question}
`
        }

      ]

    });

    res.json({
      answer: response.choices[0].message.content
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      error: error.message
    });

  }

});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor activo en puerto ${PORT}`);
});
