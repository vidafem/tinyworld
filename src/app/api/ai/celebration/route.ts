import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/serverAuth";
import { FETUS_WEEK_DATA } from "@/lib/clinicalAiEngine";
import { getPersonalizedFallbackMessage, MilestoneInfo } from "@/lib/celebrationEngine";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      childId,
      childName = "el Bebé",
      gender = "",
      motherName = "",
      fatherName = "",
      parentsNames = "",
      milestoneKey,
      milestoneType,
      milestoneNumber,
      targetDate,
      title,
      targetRoute,
      sectionId = null,
      clientApiKey
    } = body;

    if (!childId || !milestoneKey || !milestoneType || milestoneNumber === undefined) {
      return NextResponse.json({ error: "Faltan parámetros requeridos." }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Verificar si ya existe en la base de datos
    try {
      const { data: existing } = await supabaseAdmin
        .from("milestone_celebrations")
        .select("*")
        .eq("child_id", childId)
        .eq("milestone_key", milestoneKey)
        .maybeSingle();

      if (existing && existing.message) {
        return NextResponse.json({ success: true, celebration: existing });
      }
    } catch (err) {
      console.warn("Tabla milestone_celebrations aún no lista o error al consultar:", err);
    }

    // 2. Preparar el contexto de la familia para la IA
    const parents = parentsNames 
      ? parentsNames 
      : (motherName && fatherName ? `${motherName} y ${fatherName}` : motherName || fatherName || "papá y mamá");

    const milestoneObj: MilestoneInfo = {
      milestoneKey,
      milestoneType,
      milestoneNumber,
      targetDate: targetDate || new Date().toISOString().split("T")[0],
      title: title || `Celebración de Hito`,
      badgeEmoji: "🎉",
      targetRoute: targetRoute || `/dashboard/child/${childId}`,
      sectionId
    };

    // 3. Fallback personalizado garantizado
    let generatedMessage = getPersonalizedFallbackMessage(
      { name: childName, nickname: childName, gender, mother_name: motherName, father_name: fatherName, parents_names: parentsNames },
      milestoneObj
    );

    // 4. Intentar generar con Gemini si hay API Key disponible
    const rawApiKey = (clientApiKey || process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || "").trim();

    if (rawApiKey && rawApiKey.length >= 20) {
      let stageContext = "";
      if (milestoneType === "pregnancy_week") {
        const fetus = FETUS_WEEK_DATA[milestoneNumber];
        const fetusDesc = fetus ? `En esta semana se asemeja al tamaño de un ${fetus.fruit} (${fetus.length}cm, ${fetus.weight}g). Rasgos: ${fetus.desc}` : "";
        stageContext = `El bebé está en el vientre materno cumpliendo la Semana ${milestoneNumber} de gestación. ${fetusDesc}`;
      } else if (milestoneType === "born_month") {
        stageContext = `El bebé tiene exactamente ${milestoneNumber} ${milestoneNumber === 1 ? 'mes' : 'meses'} de vida extrauterina. Sonrisas, balbuceos, descubrimientos cotidianos con sus padres.`;
      } else {
        stageContext = `¡El bebé está celebrando su ${milestoneNumber === 1 ? 'primer añito' : `${milestoneNumber}° cumpleaños`}! Toda una gran fiesta y motivo de orgullo familiar.`;
      }

      const promptText = `Escribe un mensaje de celebración tierno, emotivo, alegre y profundamente personalizado (de 45 a 65 palabras) para la app de recuerdos familiares TinyWorld.
Bebé: "${childName}" ${gender ? `(género: ${gender})` : ""}.
Familia / Padres: "${parents}".
Hito a celebrar: "${title}".
Detalles del hito: ${stageContext}

REGLAS OBLIGATORIAS:
- Habla con amor directo hacia la familia y menciona explícitamente a "${childName}".
- Resalta el hito alcanzado y anima a papá y mamá a atesorar una foto o recuerdo de este día tan especial.
- NO agregues introducciones robóticas como "Aquí está tu mensaje:" ni comillas externas. Escribe directamente el texto conmovedor y festivo.`;

      const candidateEndpoints = [
        { url: `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${rawApiKey}`, model: "gemini-2.5-flash" },
        { url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${rawApiKey}`, model: "gemini-2.0-flash" },
        { url: `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${rawApiKey}`, model: "gemini-1.5-flash" }
      ];

      for (const ep of candidateEndpoints) {
        try {
          const res = await fetch(ep.url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: promptText }] }],
              generationConfig: {
                temperature: 0.75,
                maxOutputTokens: 250
              }
            })
          });

          if (res.ok) {
            const data = await res.json();
            const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (candidateText && candidateText.trim().length > 20) {
              generatedMessage = candidateText.trim();
              break;
            }
          }
        } catch (apiErr) {
          console.warn(`Error en endpoint ${ep.model}:`, apiErr);
        }
      }
    }

    const celebrationRecord = {
      child_id: childId,
      milestone_key: milestoneKey,
      milestone_type: milestoneType,
      milestone_number: milestoneNumber,
      target_date: milestoneObj.targetDate,
      title: title || milestoneObj.title,
      message: generatedMessage,
      target_route: targetRoute || milestoneObj.targetRoute,
      section_id: sectionId || null
    };

    // 5. Guardar en la tabla `milestone_celebrations`
    let savedInTable = false;
    try {
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from("milestone_celebrations")
        .upsert(celebrationRecord, { onConflict: "child_id,milestone_key" })
        .select()
        .single();

      if (!insertError && inserted) {
        savedInTable = true;
        return NextResponse.json({ success: true, celebration: inserted });
      }
    } catch (saveErr) {
      console.warn("No se pudo guardar en tabla milestone_celebrations, guardando en preview_config:", saveErr);
    }

    // 6. Respaldo en preview_config del niño si la tabla aún no fue creada
    if (!savedInTable) {
      try {
        const { data: childData } = await supabaseAdmin
          .from("children")
          .select("preview_config")
          .eq("id", childId)
          .single();

        const currentConfig = childData?.preview_config || {};
        const celebrationsMap = currentConfig.milestone_celebrations || {};
        celebrationsMap[milestoneKey] = celebrationRecord;

        await supabaseAdmin
          .from("children")
          .update({
            preview_config: {
              ...currentConfig,
              milestone_celebrations: celebrationsMap
            }
          })
          .eq("id", childId);
      } catch (childErr) {
        console.warn("No se pudo respaldar en preview_config:", childErr);
      }
    }

    return NextResponse.json({
      success: true,
      celebration: celebrationRecord
    });
  } catch (error: any) {
    console.error("Error en POST /api/ai/celebration:", error);
    return NextResponse.json({ error: error.message || "Error interno." }, { status: 500 });
  }
}
