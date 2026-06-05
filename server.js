import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "20mb" }));

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
                type: "text",
                error: "No llegó ninguna pregunta"
            });

        }

        const lowerQuestion =
            question.toLowerCase();

        const wantsChart =

            lowerQuestion.includes("gráfico") ||
            lowerQuestion.includes("grafico") ||
            lowerQuestion.includes("chart") ||
            lowerQuestion.includes("visualización") ||
            lowerQuestion.includes("visualizacion") ||
            lowerQuestion.includes("grafica") ||
            lowerQuestion.includes("gráfica") ||
            lowerQuestion.includes("barras") ||
            lowerQuestion.includes("línea") ||
            lowerQuestion.includes("linea") ||
            lowerQuestion.includes("pie") ||
            lowerQuestion.includes("donut") ||
            lowerQuestion.includes("torta") ||
            lowerQuestion.includes("scatter");

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

Especialista senior en:

- Power BI
- Marketing Intelligence
- Media Analytics
- Business Intelligence
- Performance Digital
- Share of Voice
- Share of Investment

IMPORTANTE

Debes responder SIEMPRE JSON válido.

Nunca respondas texto plano.

FORMATO RESPUESTA TEXTO

{
  "type": "text",
  "answer": "respuesta"
}

FORMATO RESPUESTA GRÁFICO

{
  "type": "chart",
  "chartType": "bar",
  "title": "Título",
  "dimension": "NombreDimension",
  "metric": "NombreMetrica"
}

TIPOS PERMITIDOS

- bar
- line
- pie
- scatter

REGLAS

1. Analiza únicamente los datos entregados.
2. No inventes información.
3. No asumas métricas inexistentes.
4. Responde siempre en español.
5. Sé ejecutivo.
6. Entrega insights accionables.

Dimensiones disponibles:

${dimensions.join(", ")}

Métricas disponibles:

${metrics.join(", ")}

REGLA DE ORO

ÚNICAMENTE responde con type="chart"
cuando el usuario solicite explícitamente
una visualización.

Ejemplos:

- Quiero un gráfico
- Muéstrame una gráfica
- Haz un chart
- Visualiza los datos
- Grafica la inversión
- Quiero una visualización

Si el usuario pregunta:

- Top
- Ranking
- Top 5
- Resumen
- Hallazgos
- Insights
- Recomendaciones
- Mejor campaña
- Peor campaña
- Mejor canal
- Análisis
- Comparativo
- Eficiencia

Debes responder con:

{
  "type": "text",
  "answer": "..."
}

Nunca generes gráficos para preguntas analíticas normales.

`
                    },

                    {
                        role: "user",
                        content: `

CONTEXTO

Dimensiones:
${dimensions.join(", ")}

Métricas:
${metrics.join(", ")}

Cantidad de registros:
${dataset.length}

El usuario solicitó gráfico:

${wantsChart}

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

        if (
            !wantsChart &&
            result.type === "chart"
        ) {

            result = {
                type: "text",
                answer:
                    "La solicitud corresponde a un análisis. No se requiere gráfico."
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
