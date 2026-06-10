import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "20mb" }));

const client = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
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
            lowerQuestion.includes("gráfica") ||
            lowerQuestion.includes("grafica") ||
            lowerQuestion.includes("chart") ||
            lowerQuestion.includes("visualización") ||
            lowerQuestion.includes("visualizacion") ||
            lowerQuestion.includes("visualiza") ||
            lowerQuestion.includes("barras") ||
            lowerQuestion.includes("barra") ||
            lowerQuestion.includes("línea") ||
            lowerQuestion.includes("linea") ||
            lowerQuestion.includes("pie") ||
            lowerQuestion.includes("donut") ||
            lowerQuestion.includes("torta") ||
            lowerQuestion.includes("scatter");

        const systemPrompt = `

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

RESPONDE EXCLUSIVAMENTE JSON.

NO uses markdown.

NO uses \`\`\`json.

NO expliques nada fuera del JSON.

La respuesta debe iniciar con { y terminar con }.

=================================
FORMATO RESPUESTA TEXTO
=================================

{
  "type": "text",
  "answer": "respuesta"
}

=================================
FORMATO RESPUESTA GRÁFICO
=================================

{
  "type":"chart",
  "chartType":"bar",
  "title":"Título",
  "dimension":"NombreDimension",
  "metric":"NombreMetrica",
  "aggregation":"sum",
  "top":20
}

=================================
TIPOS DE GRÁFICO
=================================

- bar
- line
- pie
- scatter

=================================
AGREGACIONES
=================================

- sum
- avg
- count
- min
- max

=================================
REGLAS
=================================

1. Analiza únicamente los datos entregados.
2. No inventes información.
3. No asumas métricas inexistentes.
4. Responde siempre en español.
5. Sé ejecutivo.
6. Entrega insights accionables.
7. Usa SOLO dimensiones y métricas existentes.

=================================
DIMENSIONES DISPONIBLES
=================================

${dimensions.join(", ")}

=================================
MÉTRICAS DISPONIBLES
=================================

${metrics.join(", ")}

=================================
REGLA DE ORO
=================================

Genera type="chart" únicamente cuando el usuario solicite explícitamente una visualización.

=================================
TOP N
=================================

Si el usuario solicita:

- Top 5
- Top 10
- Top 20

extrae el valor y úsalo en "top".

Si no lo especifica:

top = 20

=================================
AGREGACIÓN
=================================

Por defecto utiliza:

aggregation = "sum"

Si el usuario pide:

- promedio → avg
- media → avg
- cantidad → count
- conteo → count
- mínimo → min
- máximo → max

=================================
PREGUNTAS ANALÍTICAS
=================================

Para preguntas como:

- Top canal
- Mejor campaña
- Ranking
- Hallazgos
- Insights
- Recomendaciones
- Resumen
- Comparativo
- Análisis

responde SIEMPRE:

{
  "type":"text",
  "answer":"..."
}

`;

        const prompt = `

${systemPrompt}

=================================

CONTEXTO

Dimensiones:
${dimensions.join(", ")}

Métricas:
${metrics.join(", ")}

Cantidad de registros:
${dataset.length}

Usuario solicitó gráfico:
${wantsChart}

DATOS

${JSON.stringify(dataset)}

PREGUNTA

${question}

`;

        const response =
            await client.models.generateContent({

                model: "gemini-2.5-flash",

                contents: prompt

            });

        let content =
            response.text || "{}";

        content = content
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        let result;

        try {

            result =
                JSON.parse(content);

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

