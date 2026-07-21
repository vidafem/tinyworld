import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { prompt, mode } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt es requerido." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (apiKey) {
      const systemInstruction = mode === "letter"
        ? "Eres un escritor poético y amoroso de cartas para bebés de parte de sus padres. Escribe cartas emotivas e inolvidables."
        : "Eres TinyAI, un asistente experto en maternidad, embarazo y pediatría básica. Responde de forma amable, empática y científicamente orientada.";

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemInstruction}\n\nConsulta del usuario: ${prompt}` }] }]
        })
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          return NextResponse.json({ reply: text });
        }
      }
    }

    let fallbackReply = "";
    if (mode === "letter") {
      fallbackReply = `✨ Carta para mi amado bebé ✨\n\n${prompt}\n\nQuerido hijo/a, hoy quiero decirte lo profundamente amado que eres desde el primer instante. Cada día que pasa es un regalo maravilloso esperando el momento de abrazarte y acompañarte en cada paso de tu vida.\n\nCon todo el amor del mundo,\nMamá y Papá ❤️`;
    } else {
      fallbackReply = `Hola mamá y papá. Respecto a tu consulta sobre "${prompt}": Durante el embarazo y los primeros meses del bebé, es muy importante mantener una hidratación constante, descansar adecuadamente y consultar siempre con tu médico obstetra o pediatra ante cualquier síntoma inusual. ¡Estás haciendo un trabajo increíble cuidando a tu bebé! ✨`;
    }

    return NextResponse.json({ reply: fallbackReply });
  } catch (err: any) {
    console.error("Error en TinyAI Assistant:", err);
    return NextResponse.json({ error: "Error en el asistente de IA." }, { status: 500 });
  }
}
