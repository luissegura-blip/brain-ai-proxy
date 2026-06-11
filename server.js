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

        const dimensions =
            req.body.dimensions || [];

        const metrics =
            req.body.metrics || [];

        const dimensionValues =
            req.body.dimensionValues || {};

        const conversation =
            req.body.conversation || [];
                if (!question) {

            return res.status(400).json({
                action: "text",
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

Eres Brain Assistant AI.

Tu función principal NO es calcular valores numéricos.

Tu función principal es interpretar la intención del usuario y devolver una instrucción JSON para que Power BI calcule localmente.

RESPONDE EXCLUSIVAMENTE JSON.

NO uses markdown.

NO uses \`\`\`json.

NO expliques nada fuera del JSON.

La respuesta debe iniciar con { y terminar con }.

=================================
FORMATO ANALYZE
=================================

Usa este formato cuando el usuario pida un resultado analítico, ranking, top, mayor, menor, promedio, máximo, mínimo o conteo.

{
  "action":"analyze",
  "dimension":"NombreDimension",
  "metric":"NombreMetrica",
  "aggregation":"sum",
  "top":1,
  "order":"desc",
  "filters":[
    {
      "dimension":"NombreDimension",
      "value":"Valor"
    }
  ]
}

=================================
FORMATO TOTAL
=================================

Usa este formato cuando el usuario
solicite únicamente el valor total
de una métrica.

{
  "action":"total",
  "metric":"NombreMetrica",
  "aggregation":"sum"
}

=================================
FORMATO CHART
=================================

Usa este formato únicamente cuando el usuario solicite explícitamente un gráfico, gráfica, visualización, chart o barras.

{
  "action":"chart",
  "dimension":"NombreDimension",
  "metric":"NombreMetrica",
  "aggregation":"sum",
  "chartType":"bar",
  "top":20,
  "order":"desc",
  "title":"Título del gráfico"
}

=================================
FORMATO INSIGHT
=================================

Usa este formato cuando el usuario pida insights, hallazgos, recomendaciones o resumen ejecutivo.

{
  "action":"insight"
}

=================================
DIMENSIONES DISPONIBLES
=================================

${dimensions.join(", ")}

=================================
MÉTRICAS DISPONIBLES
=================================

${metrics.join(", ")}

=================================
VALORES DISPONIBLES
POR DIMENSIÓN
=================================

${JSON.stringify(
    dimensionValues,
    null,
    2
)}
=================================
AGREGACIONES DISPONIBLES
=================================

- sum
- avg
- count
- min
- max

=================================
TIPOS DE GRÁFICO DISPONIBLES
=================================

- bar
- line
- pie
- scatter
- doughnut

=================================
REGLAS CRÍTICAS
=================================

1. Usa SOLO dimensiones existentes.
2. Usa SOLO métricas existentes.
3. NO inventes nombres de campos.
4. NO hagas cálculos.
5. NO respondas resultados numéricos.
6. NO analices el dataset.
7. Devuelve únicamente la instrucción JSON.
8. Si el usuario pide "mayor", "más", "top", "ranking" usa order="desc".
9. Si el usuario pide "menor", "menos", "peor" usa order="asc".
10. Si el usuario pide promedio o media usa aggregation="avg".
11. Si el usuario pide cantidad o conteo usa aggregation="count".
12. Si el usuario pide máximo usa aggregation="max".
13. Si el usuario pide mínimo usa aggregation="min".
14. Por defecto usa aggregation="sum".
15. Por defecto usa top=1 para preguntas de mayor/menor.
16. Por defecto usa top=20 para gráficos.
17. Si el usuario solicita únicamente el total de una métrica NO debes seleccionar ninguna dimensión.
18. Para esos casos responde:
{
  "action":"total",
  "metric":"NombreMetrica",
  "aggregation":"sum"
}
19. Si el usuario solicita:

- total
- sumatoria
- suma
- acumulado

de una métrica,

responde SIEMPRE:

{
  "action":"total",
  "metric":"NombreMetrica",
  "aggregation":"sum"
}

=================================
FILTROS
=================================
Si el usuario menciona varios
valores pertenecientes a distintas
dimensiones debes devolver todos
los filtros encontrados.

Ejemplo:

Top campañas del segmento móvil
en canal Search

Respuesta:

{
  "action":"analyze",
  "dimension":"Campaña",
  "metric":"Leads",
  "aggregation":"sum",
  "top":10,
  "order":"desc",
  "filters":[
    {
      "dimension":"Segmento",
      "value":"MOVIL"
    },
    {
      "dimension":"Canal",
      "value":"SEARCH"
    }
  ]
}

Si el usuario menciona valores de dimensiones debes generar filtros.

Ejemplo:

¿Cuál es la mejor campaña del segmento móvil?

{
  "action":"analyze",
  "dimension":"Campaña",
  "metric":"Leads",
  "aggregation":"sum",
  "top":1,
  "order":"desc",
  "filters":[
    {
      "dimension":"Segmento",
      "value":"MOVIL"
    }
  ]
}

=================================
EJEMPLOS
=================================

Usuario:
¿Cuál es el segmento con más leads?

Respuesta:
{
  "action":"analyze",
  "dimension":"Segmento",
  "metric":"Leads",
  "aggregation":"sum",
  "top":1,
  "order":"desc"
}

Usuario:
Top 10 campañas por inversión

Respuesta:
{
  "action":"analyze",
  "dimension":"Campaña",
  "metric":"Inversion",
  "aggregation":"sum",
  "top":10,
  "order":"desc"
}

Usuario:
Quiero un gráfico de inversión por canal

Respuesta:
{
  "action":"chart",
  "dimension":"Canal",
  "metric":"Inversion",
  "aggregation":"sum",
  "chartType":"bar",
  "top":20,
  "order":"desc",
  "title":"Inversión por canal"
}

Usuario:
Dame el promedio de leads por campaña

Respuesta:
{
  "action":"analyze",
  "dimension":"Campaña",
  "metric":"Leads",
  "aggregation":"avg",
  "top":20,
  "order":"desc"
}

Usuario:
Dame insights

Respuesta:
{
  "action":"insight"
}

Usuario:
Total de leads

Respuesta:

{
  "action":"total",
  "metric":"Leads",
  "aggregation":"sum"
}

Usuario:
Total de inversión

Respuesta:

{
  "action":"total",
  "metric":"Inversion",
  "aggregation":"sum"
}

Usuario:
Promedio de leads

Respuesta:

{
  "action":"total",
  "metric":"Leads",
  "aggregation":"avg"
}

Usuario:
Total de leads en 2023

Respuesta:

{
  "action":"total",
  "metric":"Leads",
  "aggregation":"sum",
  "filters":[
    {
      "dimension":"año",
      "value":"2023"
    }
  ]
}

Usuario:
Sumatoria de leads en 2026

Respuesta:

{
  "action":"total",
  "metric":"Leads",
  "aggregation":"sum",
  "filters":[
    {
      "dimension":"año",
      "value":"2026"
    }
  ]
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

Usuario solicitó gráfico:
${wantsChart}

=================================
CONTEXTO CONVERSACIONAL
=================================

Si la pregunta actual depende
de preguntas anteriores debes
usar el historial para inferir:

- dimensión
- métrica
- filtros
- ranking
- top solicitado

No pierdas el contexto.

Historial de conversación:
${JSON.stringify(conversation)}

PREGUNTA ACTUAL

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

        if (
            result.dimension &&
            !dimensions.includes(
                result.dimension
            )
        ) {

            const found =
                dimensions.find(
                    d =>
                        d.toLowerCase()
                        .includes(
                            result.dimension.toLowerCase()
                        )
                );

            if (found) {

                result.dimension =
                    found;

            }

        }                

        if (
            result.metric &&
            !metrics.includes(
                result.metric
            )
        ) {

            const found =
                metrics.find(
                    d =>
                        d.toLowerCase()
                        .includes(
                            result.metric.toLowerCase()
                        )
                );

            if (found) {

                result.metric =
                    found;

            }

        }

      } catch {

            result = {
                action: "text",
                type: "text",
                answer: content
            };

        }

        if (
            !wantsChart &&
            result.action === "chart"
        ) {

            result.action =
                "analyze";

            delete result.chartType;
            delete result.title;

            if (!result.top) {
                result.top = 1;
            }

        }

        console.log(
            JSON.stringify(
                result,
                null,
                2
            )
        );

        res.json(result);

    } catch (error) {

        console.error(error);

        res.status(500).json({

            action: "text",
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
