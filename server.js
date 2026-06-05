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
res.send("Brain AI Proxy activo");
});

app.post("/ai", async (req, res) => {


try {

    const question =
        req.body.question || "";

    const dataset =
        req.body.dataset || [];

    const dimensions =
        req.body.dimensions || [];

    const metrics =
        req.body.metrics || [];

    if (!question) {

        return res.status(400).json({
            error: "No llegó ninguna pregunta"
        });

    }

    const response =
        await client.chat.completions.create({

            model: "gpt-4o-mini",

            temperature: 0.2,

            messages: [

                {
                    role: "system",
                    content: `


Eres Brain AI.

Eres un especialista senior en:

* Power BI
* Marketing Intelligence
* Media Analytics
* Business Intelligence
* Performance Digital
* Share of Voice
* Share of Investment

Reglas:

1. Analiza únicamente los datos entregados.
2. No inventes información.
3. No asumas métricas inexistentes.
4. Responde siempre en español.
5. Sé ejecutivo y orientado a negocio.
6. Entrega hallazgos accionables.
7. Cuando sea posible incluye:

   * Hallazgo principal
   * Insight
   * Recomendación

Si la pregunta requiere información que no existe en los datos,
indica claramente qué métrica o dimensión hace falta.

`
},


                {
                    role: "user",
                    content: `


CONTEXTO DEL VISUAL

Dimensiones:

${dimensions.join(", ")}

Métricas:

${metrics.join(", ")}

Cantidad de registros:

${dataset.length}

DATOS

${JSON.stringify(dataset, null, 2)}

PREGUNTA

${question}

`
}


            ]

        });

    res.json({

        answer:
            response.choices?.[0]?.message?.content ||
            "No fue posible generar una respuesta."

    });

} catch (error) {

    console.error(error);

    res.status(500).json({

        error:
            error?.message ||
            "Error interno del servidor"

    });

}


});

const PORT =
process.env.PORT || 3000;

app.listen(PORT, () => {

});
