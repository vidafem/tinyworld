import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/serverAuth";

export const runtime = "nodejs";

interface ChildContext {
  childName?: string;
  nickname?: string;
  gender?: string;
  isPregnancy?: boolean;
  pregnancyWeeks?: number;
  pregnancyDays?: number;
  trimester?: number;
  fpp?: string;
  birthDate?: string;
  babyAge?: string;
  totalDays?: number;
  stageLabel?: string;
  motherName?: string;
  fatherName?: string;
  parentsNames?: string;
}

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
      childContext = {} as ChildContext,
      clientApiKey
    } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json({ error: "Prompt es requerido." }, { status: 400 });
    }

    const sanitizedPrompt = prompt.trim().slice(0, 2500);
    const apiKey = clientApiKey || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    const {
      isPregnancy = true,
      pregnancyWeeks,
      pregnancyDays = 0,
      trimester,
      fpp,
      babyAge,
      stageLabel,
      gender,
      motherName,
      fatherName,
      parentsNames
    } = childContext;

    // Si no hay API key, informamos claramente que se requiere la clave para la IA en tiempo real
    if (!apiKey) {
      const stageText = stageLabel || (pregnancyWeeks ? `Semana ${pregnancyWeeks} de gestación` : babyAge ? `Edad: ${babyAge}` : "tu bebé");
      return NextResponse.json({ 
        reply: `⚠️ **Clave de IA Requerida para Análisis en Tiempo Real**\n\n` +
          `Para que TinyAI pueda analizar con Inteligencia Artificial real la **${stageText}** de **${childName}** y responderte con precisión médica y contextual:\n\n` +
          `1. Obtén tu clave 100% gratuita en [Google AI Studio (aistudio.google.com)](https://aistudio.google.com/).\n` +
          `2. Agrégala en tu archivo \`.env.local\` en la raíz del proyecto:\n` +
          `\`\`\`env\nGEMINI_API_KEY=AIzaSy...\n\`\`\`\n` +
          `*(O haz clic en el botón ⚙️ **Configurar Clave** en la parte superior de esta ventana para pegarla directamente).*`,
        isAiGenerated: false,
        keyMissing: true
      });
    }

    // Construcción del System Prompt con contexto ultra-específico de semanas/edad
    let systemInstructionText = "";

    if (mode === "letter") {
      systemInstructionText = `Eres TinyAI 🤖✨, un redactor literario, poético y profundamente conmovedor de cartas para bebés de parte de sus padres en la aplicación TinyWorld.
INFORMACIÓN DE LA ETAPA ACTUAL:
- Nombre del bebé: "${childName}" ${gender ? `(género: ${gender})` : ""}
${isPregnancy ? `
- ESTADO: EMBARAZO EN CURSO
- SEMANA DE GESTACIÓN EXACTA: SEMANA ${pregnancyWeeks || 24} (con ${pregnancyDays} días adicionales).
- TRIMESTRE: ${trimester ? `Trimestre ${trimester}` : "Segundo trimestre"}.
- FECHA PROBABLE DE PARTO (FPP): ${fpp || "Próximamente"}.
- REGLA DE REDACCIÓN: La carta DEBE hacer referencia íntima a estar actualmente en la SEMANA ${pregnancyWeeks || 24} en el vientre materno, los movimientos que se sienten, la emoción de la dulce espera y los preparativos para su nacimiento.` : `
- ESTADO: BEBÉ NACIDO
- EDAD EXACTA: ${babyAge || "Recién nacido"}.
- REGLA DE REDACCIÓN: La carta DEBE capturar la ternura de sus ${babyAge || "primeros días"} de vida, sus sonrisas, miradas y el amor incondicional que sus padres le profesan.`}
${parentsNames || motherName || fatherName ? `- Nombres de los padres: ${parentsNames || [motherName, fatherName].filter(Boolean).join(" y ")}` : ""}

REGLAS DE ESTILO:
1. Escribe con poesía, emoción genuina, calidez y belleza literaria.
2. Usa formato Markdown limpio y elegante (negritas, saltos de línea poéticos).
3. Adapta el tono y mensaje específico a lo que el usuario pida en su instrucción.`;
    } else {
      systemInstructionText = `Eres TinyAI 🤖✨, el asistente inteligente especializado en obstetricia, ginecología, embarazo, maternidad, lactancia y pediatría básica para la aplicación TinyWorld.

INFORMACIÓN OBLIGATORIA DEL BEBÉ Y ETAPA ACTUAL:
- Nombre del bebé: "${childName}" ${gender ? `(género: ${gender})` : ""}
${isPregnancy ? `
- ESTADO: EMBARAZO ACTIVO
- SEMANA DE GESTACIÓN EXACTA: SEMANA ${pregnancyWeeks || 24} (exactamente ${pregnancyWeeks || 24} semanas y ${pregnancyDays} días).
- TRIMESTRE: ${trimester ? `Trimestre ${trimester}` : "2do trimestre"}.
- FECHA PROBABLE DE PARTO: ${fpp || "Por definir"}.
- REGLA OBLIGATORIA DE CONTEXTO: En TODAS tus respuestas DEBES considerar y mencionar explícitamente qué sucede en la SEMANA ${pregnancyWeeks || 24} de gestación:
  * Desarrollo anatómico y sensorial del feto en esta semana (tamaño aproximado, órganos en maduración, movimientos fetales).
  * Síntomas y cambios habituales en el cuerpo de la madre en la semana ${pregnancyWeeks || 24} (presión pélvica, descanso, nutrición recomendada).
  * Responde la duda del usuario aplicando las recomendaciones específicas para la SEMANA ${pregnancyWeeks || 24}.` : `
- ESTADO: BEBÉ NACIDO
- EDAD ACTUAL: ${babyAge || "Recién nacido"}.
- REGLA OBLIGATORIA DE CONTEXTO: En TODAS tus respuestas DEBES adaptar tus consejos a la edad exacta de ${babyAge || "recién nacido"} (hitos motores, sueño según edad, lactancia o alimentación complementaria, vacunas e higiene apropiadas para esta etapa).`}

DIRECTRICES DE RESPUESTA:
1. NUNCA des respuestas predeterminadas o genéricas. Analiza la consulta y contextualízala a la etapa actual de ${childName}.
2. Sé cálido, empático, motivador y científicamente riguroso.
3. Estructura con viñetas (•), negritas y pasos numerados para facilitar la lectura rápida de los padres.
4. Si se consultan síntomas de urgencia (sangrados abundantes, pérdida de líquido, fiebre alta en lactantes, dolor abdominal severo o falta de movimientos fetales), aconseja acudir de inmediato al obstetra o guardia pediátrica.
5. Responde siempre en español.`;
    }

    // Formatear historial para Gemini
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(history)) {
      const recentHistory = history.slice(-8);
      for (const msg of recentHistory) {
        if (!msg.text || typeof msg.text !== "string") continue;
        if (msg.role === "ai" && msg.text.includes("¡Hola! Soy TinyAI")) continue;

        const role = msg.role === "user" ? "user" : "model";
        contents.push({
          role,
          parts: [{ text: msg.text.trim().slice(0, 2500) }]
        });
      }
    }

    // Agregar la consulta del usuario
    contents.push({
      role: "user",
      parts: [{ text: sanitizedPrompt }]
    });

    // Modelos a consultar
    const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        const payload = {
          system_instruction: {
            parts: [{ text: systemInstructionText }]
          },
          contents,
          generationConfig: {
            temperature: mode === "letter" ? 0.85 : 0.6,
            maxOutputTokens: 1500,
            topP: 0.95
          }
        };

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text && text.trim().length > 0) {
            return NextResponse.json({ 
              reply: text.trim(),
              isAiGenerated: true,
              modelUsed: model,
              stageAnalyzed: isPregnancy ? `Semana ${pregnancyWeeks || 24}` : babyAge
            });
          }
        } else {
          const errorBody = await res.text().catch(() => "");
          console.warn(`[TinyAI] Falló modelo ${model} con status ${res.status}:`, errorBody);
        }
      } catch (modelErr) {
        console.warn(`[TinyAI] Excepción al llamar ${model}:`, modelErr);
      }
    }

    return NextResponse.json({
      error: "API_ERROR",
      reply: `⚠️ Ocurrió un inconveniente al conectar con la API de Google Gemini. Verifica que tu clave de API sea válida y tenga cuota activa en [Google AI Studio](https://aistudio.google.com/).`,
      isAiGenerated: false
    }, { status: 502 });

  } catch (err: any) {
    console.error("Error crítico en TinyAI Assistant:", err);
    return NextResponse.json({ error: "Error interno en el asistente de IA." }, { status: 500 });
  }
}
