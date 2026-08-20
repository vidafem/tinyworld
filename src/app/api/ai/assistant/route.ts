import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/serverAuth";
import { generateInstantClinicalResponse, ClinicalContext } from "@/lib/clinicalAiEngine";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const user = await getRequestUser(req);
    if (!user) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { 
      prompt, 
      mode = "chat", 
      history = [], 
      childName = "el Bebé", 
      childContext = {},
      clientApiKey
    } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json({ error: "Prompt es requerido." }, { status: 400 });
    }

    const sanitizedPrompt = prompt.trim().slice(0, 2500);
    const rawApiKey = (clientApiKey || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "").trim();

    const clinicalCtx: ClinicalContext = {
      childName: childName || "el Bebé",
      gender: childContext.gender,
      isPregnancy: childContext.isPregnancy !== false,
      pregnancyWeeks: childContext.pregnancyWeeks || 24,
      pregnancyDays: childContext.pregnancyDays || 0,
      trimester: childContext.trimester || 2,
      fpp: childContext.fpp,
      babyAge: childContext.babyAge,
      totalDays: childContext.totalDays,
      motherName: childContext.motherName,
      fatherName: childContext.fatherName,
      parentsNames: childContext.parentsNames
    };

    // Si hay una API Key disponible
    if (rawApiKey && rawApiKey.length >= 20) {
      const stageReference = clinicalCtx.isPregnancy
        ? `Actualmente el embarazo está en la Semana ${clinicalCtx.pregnancyWeeks} de gestación (Trimestre ${clinicalCtx.trimester}).`
        : `El bebé ${clinicalCtx.childName} tiene ${clinicalCtx.babyAge || "pocos meses"} de edad.`;

      const systemInstructionText = mode === "letter"
        ? `Eres TinyAI 🤖✨, un redactor literario y poético para la familia de "${clinicalCtx.childName}". Escribe una carta profunda, hermosa y conmovedora adaptada a lo que los padres quieran expresar.`
        : `Eres TinyAI 🤖✨, un asistente cálido, inteligente, empático y conversacional para la aplicación TinyWorld, especializado en embarazo, maternidad, pediatría, productos infantiles (pañales, coches, biberones), crianza y bienestar de la familia de "${clinicalCtx.childName}".
Contexto de referencia: ${stageReference}

INSTRUCCIONES CLAVE:
1. Responde de forma 100% natural, directa y útil a lo que el usuario pregunte.
2. Si el usuario te saluda ("hola como estas"), responde cordialmente presentándote como su asistente.
3. Si pregunta sobre marcas (pañales, biberones, coches, cunas), brinda una comparativa detallada, pros y contras, y consejos de compra.
4. Si pregunta sobre salud o nutrición, responde con empatía y claridad médica estructurada.
5. Usa formato markdown limpio (negritas, viñetas).`;

      const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

      if (Array.isArray(history)) {
        const recentHistory = history.slice(-6);
        for (const msg of recentHistory) {
          if (!msg.text || typeof msg.text !== "string") continue;
          if (msg.role === "ai" && msg.text.includes("¡Hola! Soy TinyAI")) continue;

          const role = msg.role === "user" ? "user" : "model";
          contents.push({
            role,
            parts: [{ text: msg.text.trim().slice(0, 2000) }]
          });
        }
      }

      contents.push({
        role: "user",
        parts: [{ text: sanitizedPrompt }]
      });

      // Probar modelos compatibles con la API de Google Gemini en v1 y v1beta
      const candidateEndpoints = [
        { url: `https://generativelanguage.googleapis.com/v1/models/gemini-3.5-flash:generateContent?key=${rawApiKey}`, model: "gemini-3.5-flash" },
        { url: `https://generativelanguage.googleapis.com/v1/models/gemini-3.1-flash-lite:generateContent?key=${rawApiKey}`, model: "gemini-3.1-flash-lite" },
        { url: `https://generativelanguage.googleapis.com/v1/models/gemini-3.7-flash:generateContent?key=${rawApiKey}`, model: "gemini-3.7-flash" },
        { url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${rawApiKey}`, model: "gemini-2.0-flash" }
      ];

      for (const endpoint of candidateEndpoints) {
        try {
          const res = await fetch(endpoint.url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [{ text: `${systemInstructionText}\n\nConsulta del usuario: ${sanitizedPrompt}` }]
                }
              ],
              generationConfig: {
                temperature: mode === "letter" ? 0.85 : 0.7,
                maxOutputTokens: 1500
              }
            })
          });

          if (res.ok) {
            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text && text.trim().length > 0) {
              return NextResponse.json({ 
                reply: text.trim(),
                isAiGenerated: true,
                modelUsed: endpoint.model,
                stageAnalyzed: clinicalCtx.isPregnancy ? `Semana ${clinicalCtx.pregnancyWeeks}` : clinicalCtx.babyAge
              });
            }
          }
        } catch (apiErr) {
          console.warn(`[TinyAI] Falló endpoint ${endpoint.model}:`, apiErr);
        }
      }
    }

    // Motor de respaldo autónomo si no hay API key o si se cae la conexión externa
    const fallbackReply = generateInstantClinicalResponse(sanitizedPrompt, mode, clinicalCtx);

    return NextResponse.json({
      reply: fallbackReply,
      isAiGenerated: true,
      modelUsed: "TinyClinical-Engine",
      stageAnalyzed: clinicalCtx.isPregnancy ? `Semana ${clinicalCtx.pregnancyWeeks}` : clinicalCtx.babyAge
    });

  } catch (err: any) {
    console.error("Error crítico en TinyAI Assistant:", err);
    return NextResponse.json({ error: "Error en el asistente de IA." }, { status: 500 });
  }
}
