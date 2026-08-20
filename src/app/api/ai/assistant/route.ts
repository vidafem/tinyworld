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

    // Si hay una API Key que comience con el formato estándar de Google AI Studio (AIzaSy...)
    const isStandardGeminiKey = rawApiKey.startsWith("AIzaSy") && rawApiKey.length >= 35;

    if (isStandardGeminiKey) {
      const systemInstructionText = mode === "letter"
        ? `Eres TinyAI 🤖✨, un redactor literario y poético para la familia de "${clinicalCtx.childName}". Escribe una carta hermosa y conmovedora adaptada a lo que los padres quieran expresar.`
        : `Eres TinyAI 🤖✨, un asistente experto en maternidad, pediatría, productos infantiles (pañales, coches, biberones), crianza y bienestar familiar para la familia de "${clinicalCtx.childName}".
REGLA CLAVE: Responde directamente y con detalle a la pregunta específica del usuario. El estado actual del bebé (${clinicalCtx.isPregnancy ? `Semana ${clinicalCtx.pregnancyWeeks} de gestación` : `Edad: ${clinicalCtx.babyAge}`}) es una referencia de apoyo para personalizar la respuesta cuando sea relevante, pero responde primero y con claridad a la duda puntual planteada.`;

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

      const models = ["gemini-2.0-flash", "gemini-1.5-flash"];

      for (const model of models) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${rawApiKey}`;
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: systemInstructionText }] },
              contents,
              generationConfig: {
                temperature: mode === "letter" ? 0.85 : 0.6,
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
                modelUsed: model,
                stageAnalyzed: clinicalCtx.isPregnancy ? `Semana ${clinicalCtx.pregnancyWeeks}` : clinicalCtx.babyAge
              });
            }
          }
        } catch (apiErr) {
          console.warn(`[TinyAI] Fallo al llamar API externa ${model}, usando motor clínico autónomo:`, apiErr);
        }
      }
    }

    // Motor Clínico Autónomo: Genera análisis instantáneo preciso con toda la información de la semana
    const instantReply = generateInstantClinicalResponse(sanitizedPrompt, mode, clinicalCtx);

    return NextResponse.json({
      reply: instantReply,
      isAiGenerated: true,
      modelUsed: "TinyClinical-Engine",
      stageAnalyzed: clinicalCtx.isPregnancy ? `Semana ${clinicalCtx.pregnancyWeeks}` : clinicalCtx.babyAge
    });

  } catch (err: any) {
    console.error("Error crítico en TinyAI Assistant:", err);
    return NextResponse.json({ error: "Error en el asistente de IA." }, { status: 500 });
  }
}
