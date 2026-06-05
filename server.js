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

                response_format: {
                    type: "json_object"
                },

                messages: [

                    {
                        role: "system",
                        content: `

Eres Brain AI.

Eres especialista senior en:

- Power BI
- Marketing Intelligence
- Media Analytics
- Business Intelligence
- Performance Digital
- Share of Voice
- Share of Investment

REGLAS

1. Analiza únicamente los datos entregados.
2. No inventes información.
3. No asumas métricas inexistentes.
4. Responde siempre en español.
5. Sé ejecutivo y orientado a negocio.
6. Entrega hallazgos accionables.

TIPOS DE RESPUESTA

RESPUESTA TEXTO

{
  "type": "text",
  "answer": "respuesta aquí"
}

RESPUESTA GRÁFICO

Si el usuario solicita:

- gráfico
- grafico
- chart
- visualización
- visualizacion
- barras
- línea
- linea
- pie
- torta
- donut
- dispersión

responde exclusivamente:

{
  "type": "chart",
  "chartType": "bar",
  "title": "Título",
  "dimension": "NombreDimension",
  "metric": "NombreMetrica"
}

chartType permitidos:

- bar
- line
- pie
- scatter

IMPORTANTE

dimension debe existir dentro de:

${dimensions.join(", ")}

metric debe existir dentro de:

${metrics.join(", ")}

Si no existen, responde tipo text explicando el problema.

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

${JSON.stringify(dataset)}

PREGUNTA

${question}

`
                    }

                ]

            });

        const content =
            response.choices?.[0]?.message?.content || "{}";

        let result;

        try {

            result = JSON.parse(content);

        } catch {

            result = {
                type: "text",
                answer: content
            };

        }

        res.json(result);

    } catch (error) {

        console.error(error);

        res.status(500).json({

            type: "text",

            error:
                error?.message ||
                "Error interno del servidor"

        });

    }

});

const PORT =
    process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(
        `Servidor activo en puerto ${PORT}`
    );

});

