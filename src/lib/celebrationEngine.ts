// ==============================================================================
// TINYWORLD - MOTOR DE CELEBRACIONES DE HITOS Y PRE-GENERACIÓN SILENCIOSA
// Gestiona hitos de gestación (semanas), meses de vida (1 a 12 meses) y cumpleaños
// anuales con mensajes personalizados por IA y enrutamiento inteligente de recuerdos.
// ==============================================================================

import { supabase } from "./supabase";
import { FETUS_WEEK_DATA } from "./clinicalAiEngine";

export interface MilestoneInfo {
  milestoneKey: string;      // ej: "pregnancy_week_30", "born_month_1", "born_year_1"
  milestoneType: "pregnancy_week" | "born_month" | "born_year";
  milestoneNumber: number;
  targetDate: string;        // YYYY-MM-DD
  title: string;
  badgeEmoji: string;
  targetRoute: string;
  sectionId?: string | null;
  daysLeft?: number;
}

export interface StoredMilestoneCelebration {
  id?: string;
  child_id: string;
  milestone_key: string;
  milestone_type: string;
  milestone_number: number;
  target_date: string;
  title: string;
  message: string;
  target_route: string;
  section_id?: string | null;
  created_at?: string;
}

/** Formatea una fecha como YYYY-MM-DD en hora local */
export function formatDateToLocalISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Helper para saber si dos fechas corresponden al mismo día del mes */
function isSameDayOfMonth(target: Date, base: Date): boolean {
  const targetDay = target.getDate();
  const baseDay = base.getDate();
  if (targetDay === baseDay) return true;

  // Manejar meses con menos días (ej. 31 de base en meses de 30 o 28 días)
  const lastDayOfTargetMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  if (baseDay > lastDayOfTargetMonth && targetDay === lastDayOfTargetMonth) {
    return true;
  }
  return false;
}

/** Convierte número ordinal a español para meses */
function getOrdinalMonth(month: number): string {
  const ordinals: Record<number, string> = {
    1: "1er",
    2: "2do",
    3: "3er",
    4: "4to",
    5: "5to",
    6: "6to",
    7: "7mo",
    8: "8vo",
    9: "9no",
    10: "10mo",
    11: "11vo",
    12: "1er Año (12vo)"
  };
  return ordinals[month] || `${month}°`;
}

/** Encuentra una etapa de vida adecuada para el hito (ej: "Primer Año", "Segundo Año") */
function findMatchingLifeSection(sections: any[], milestoneType: string, number: number): any | null {
  if (!sections || !Array.isArray(sections) || sections.length === 0) return null;

  const normalize = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  if (milestoneType === "born_month" || (milestoneType === "born_year" && number === 1)) {
    const match = sections.find(s => {
      const t = normalize(s.title || "");
      return t.includes("primer ano") || t.includes("primer ano") || t.includes("1er ano") || t.includes("ano 1") || t.includes("1 ano");
    });
    if (match) return match;
  }

  if (milestoneType === "born_year" && number === 2) {
    const match = sections.find(s => {
      const t = normalize(s.title || "");
      return t.includes("segundo ano") || t.includes("2do ano") || t.includes("ano 2") || t.includes("2 anos");
    });
    if (match) return match;
  }

  if (milestoneType === "born_year" && number === 3) {
    const match = sections.find(s => {
      const t = normalize(s.title || "");
      return t.includes("tercer ano") || t.includes("3er ano") || t.includes("ano 3") || t.includes("3 anos");
    });
    if (match) return match;
  }

  return sections[0] || null;
}

/**
 * Determina si en una fecha específica hay un hito para el bebé dado.
 */
export function getMilestoneForChild(
  child: any,
  date: Date = new Date(),
  lifeSections: any[] = []
): MilestoneInfo | null {
  if (!child) return null;

  const config = child.preview_config || {};
  const isPregnancy = config.status !== "born" && !child.birth_date;
  const childName = child.nickname || child.name || "tu bebé";
  const dateStr = formatDateToLocalISO(date);

  // -------------------------------------------------------------
  // CASO 1: EN GESTACIÓN (Semanas completas de embarazo)
  // -------------------------------------------------------------
  if (isPregnancy && config.fum) {
    const fum = new Date(config.fum + "T12:00:00");
    const checkDate = new Date(dateStr + "T12:00:00");
    const diffMs = checkDate.getTime() - fum.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      const weeks = Math.floor(diffDays / 7);
      const remDays = diffDays % 7;

      // Cada 7 días exactos se completa una semana
      if (remDays === 0 && weeks >= 1 && weeks <= 42) {
        const fetus = FETUS_WEEK_DATA[weeks];
        const fruitInfo = fetus ? ` (${fetus.emoji} ${fetus.fruit})` : "";
        const title = weeks >= 37 
          ? `¡${weeks} Semanas de Gestación! 🐣 ¡${childName} está listo para nacer!` 
          : `¡${childName} cumple ${weeks} semanas de gestación! 🎉${fruitInfo}`;

        const targetRoute = `/dashboard/child/${child.id}/pregnancy?action=new-memory&week=${weeks}&title=${encodeURIComponent(`Semana ${weeks} de gestación`)}`;

        return {
          milestoneKey: `pregnancy_week_${weeks}`,
          milestoneType: "pregnancy_week",
          milestoneNumber: weeks,
          targetDate: dateStr,
          title,
          badgeEmoji: fetus?.emoji || "🌱",
          targetRoute,
          sectionId: null
        };
      }
    }
  }

  // -------------------------------------------------------------
  // CASO 2: NACIDO (Meses 1..12 y Cumpleaños Anuales)
  // -------------------------------------------------------------
  if (child.birth_date) {
    const birth = new Date(child.birth_date + "T12:00:00");
    const checkDate = new Date(dateStr + "T12:00:00");

    if (checkDate >= birth && isSameDayOfMonth(checkDate, birth)) {
      const monthsElapsed = (checkDate.getFullYear() - birth.getFullYear()) * 12 + (checkDate.getMonth() - birth.getMonth());

      // 2A. Meses 1 a 11 de vida
      if (monthsElapsed >= 1 && monthsElapsed < 12) {
        const ord = getOrdinalMonth(monthsElapsed);
        const title = `¡Feliz ${ord} mes de vida, ${childName}! 🎈✨`;

        const matchingSection = findMatchingLifeSection(lifeSections, "born_month", monthsElapsed);
        let targetRoute = `/dashboard/child/${child.id}/memories?action=new-memory&category=Mes%20a%20Mes&title=${encodeURIComponent(`Recuerdo del ${ord} mes de vida`)}`;
        let sectionId: string | null = null;

        if (matchingSection) {
          sectionId = matchingSection.id;
          targetRoute = `/dashboard/child/${child.id}/lifetime?section=${matchingSection.id}&action=new-memory&month=${monthsElapsed}&title=${encodeURIComponent(`Recuerdo del ${ord} mes`)}`;
        }

        return {
          milestoneKey: `born_month_${monthsElapsed}`,
          milestoneType: "born_month",
          milestoneNumber: monthsElapsed,
          targetDate: dateStr,
          title,
          badgeEmoji: "🍼",
          targetRoute,
          sectionId
        };
      }

      // 2B. Cumpleaños Anuales (1 año, 2 años, 3 años...)
      if (monthsElapsed >= 12 && monthsElapsed % 12 === 0) {
        const yearsElapsed = monthsElapsed / 12;
        const yearWord = yearsElapsed === 1 ? "1 añito" : `${yearsElapsed} años`;
        const title = `¡Feliz Cumpleaños ${childName}! 🎂🎈 ¡Hoy cumples ${yearWord}!`;

        const matchingSection = findMatchingLifeSection(lifeSections, "born_year", yearsElapsed);
        let targetRoute = `/dashboard/child/${child.id}/memories?action=new-memory&category=Cumplea%C3%B1os&title=${encodeURIComponent(`¡Celebrando sus ${yearWord}!`)}`;
        let sectionId: string | null = null;

        if (matchingSection) {
          sectionId = matchingSection.id;
          targetRoute = `/dashboard/child/${child.id}/lifetime?section=${matchingSection.id}&action=new-memory&title=${encodeURIComponent(`Celebración: ${yearWord}`)}`;
        }

        return {
          milestoneKey: `born_year_${yearsElapsed}`,
          milestoneType: "born_year",
          milestoneNumber: yearsElapsed,
          targetDate: dateStr,
          title,
          badgeEmoji: "🎂",
          targetRoute,
          sectionId
        };
      }
    }
  }

  return null;
}

/** Verifica si hoy es un día de hito */
export function checkTodayMilestone(child: any, lifeSections: any[] = []): MilestoneInfo | null {
  return getMilestoneForChild(child, new Date(), lifeSections);
}

/**
 * Busca si habrá un hito en los próximos 1 a 5 días para pre-generar el mensaje silenciosamente.
 */
export function checkUpcomingMilestone(
  child: any,
  lifeSections: any[] = [],
  maxDaysAhead: number = 5
): MilestoneInfo | null {
  const today = new Date();
  for (let d = 1; d <= maxDaysAhead; d++) {
    const futureDate = new Date(today.getTime() + d * 86400000);
    const m = getMilestoneForChild(child, futureDate, lifeSections);
    if (m) {
      return { ...m, daysLeft: d };
    }
  }
  return null;
}

/**
 * Genera un mensaje poético, cálido y personalizado como fallback instantáneo
 * asegurando que el nombre del bebé y de los padres siempre estén presentes.
 */
export function getPersonalizedFallbackMessage(child: any, milestone: MilestoneInfo): string {
  const babyName = child?.nickname || child?.name || "tu bebé";
  const mother = child?.mother_name || child?.preview_config?.mother_name || "";
  const father = child?.father_name || child?.preview_config?.father_name || "";
  const parents = mother && father 
    ? `${mother} y ${father}` 
    : mother 
    ? `mamá ${mother}` 
    : father 
    ? `papá ${father}` 
    : "papá y mamá";

  if (milestone.milestoneType === "pregnancy_week") {
    const week = milestone.milestoneNumber;
    const fetus = FETUS_WEEK_DATA[week];
    const fruitDesc = fetus ? ` Su tamaño se asemeja al de un ${fetus.fruit.toLowerCase()} (${fetus.length} cm y ${fetus.weight} g aprox).` : "";
    
    if (week >= 37) {
      return `¡Qué emoción tan inmensa para ${parents}! Hoy ${babyName} alcanza las ${week} semanas de gestación. Su desarrollo está prácticamente completado y cada latido anuncia el momento más hermoso: el día en que por fin estará en sus brazos. ¡Inmortalicen este recuerdo hoy! 💕✨`;
    }
    return `¡Felicidades a ${parents}! Hoy ${babyName} cumple ${week} semanas en el vientre materno.${fruitDesc} Cada día siente más su amor, su ternura y sus voces. Es un día mágico para guardar fotos y atesorar este hermoso instante para toda la vida. 🌟👶`;
  }

  if (milestone.milestoneType === "born_month") {
    const month = milestone.milestoneNumber;
    const ord = getOrdinalMonth(month);
    return `¡Feliz ${ord} mes de vida para ${babyName}! Verle sonreír, descubrir el mundo y llenar de luz el hogar de ${parents} es el regalo más preciado. Cada día es una aventura de caricias, balbuceos y amor infinito. ¡No olviden capturar y guardar una foto de este hermoso mes! 🎈🧸`;
  }

  if (milestone.milestoneType === "born_year") {
    const year = milestone.milestoneNumber;
    const yearText = year === 1 ? "primer añito" : `${year} años`;
    return `¡Hoy es un día de fiesta total! ${babyName} celebra su ${yearText} de pura felicidad. Para ${parents}, cada paso y cada risa han sido un viaje inolvidable. ¡Que este día quede grabado en el corazón y en su libro de recuerdos para siempre con sus mejores fotos y memorias! 🎂🎉🥳`;
  }

  return `¡Un día muy especial para celebrar cada instante de amor junto a ${babyName} y toda su hermosa familia! ✨`;
}

/**
 * Consulta la base de datos (o la API) para obtener la celebración ya generada.
 * Si no existe, invoca la API para generarla y guardarla en la tabla `milestone_celebrations`.
 */
export async function fetchOrGenerateCelebration(
  child: any,
  milestone: MilestoneInfo,
  authToken?: string
): Promise<StoredMilestoneCelebration> {
  // 1. Intentar consultar la tabla `milestone_celebrations`
  try {
    const { data, error } = await supabase
      .from("milestone_celebrations")
      .select("*")
      .eq("child_id", child.id)
      .eq("milestone_key", milestone.milestoneKey)
      .maybeSingle();

    if (!error && data && data.message) {
      return data as StoredMilestoneCelebration;
    }
  } catch (err) {
    // Si la tabla aún no existe o hay error de conexión, continuamos con fallback
    console.warn("Tabla milestone_celebrations aún no disponible o sin registro:", err);
  }

  // 2. Verificar si está en `preview_config.milestone_celebrations`
  const cachedInChild = child.preview_config?.milestone_celebrations?.[milestone.milestoneKey];
  if (cachedInChild && cachedInChild.message) {
    return {
      child_id: child.id,
      milestone_key: milestone.milestoneKey,
      milestone_type: milestone.milestoneType,
      milestone_number: milestone.milestoneNumber,
      target_date: milestone.targetDate,
      title: cachedInChild.title || milestone.title,
      message: cachedInChild.message,
      target_route: cachedInChild.target_route || milestone.targetRoute,
      section_id: milestone.sectionId || null
    };
  }

  // 3. Generar a través de la API con TinyAI y persistir
  try {
    const res = await fetch("/api/ai/celebration", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      },
      body: JSON.stringify({
        childId: child.id,
        childName: child.nickname || child.name || "el Bebé",
        gender: child.gender,
        motherName: child.mother_name || child.preview_config?.mother_name,
        fatherName: child.father_name || child.preview_config?.father_name,
        parentsNames: child.parents_names || child.preview_config?.parents_names,
        milestoneKey: milestone.milestoneKey,
        milestoneType: milestone.milestoneType,
        milestoneNumber: milestone.milestoneNumber,
        targetDate: milestone.targetDate,
        title: milestone.title,
        targetRoute: milestone.targetRoute,
        sectionId: milestone.sectionId || null
      })
    });

    if (res.ok) {
      const payload = await res.json();
      if (payload.celebration) {
        return payload.celebration;
      }
    }
  } catch (err) {
    console.error("Error solicitando celebración a la API de IA:", err);
  }

  // 4. Fallback instantáneo con mensaje personalizado
  const fallbackMessage = getPersonalizedFallbackMessage(child, milestone);
  return {
    child_id: child.id,
    milestone_key: milestone.milestoneKey,
    milestone_type: milestone.milestoneType,
    milestone_number: milestone.milestoneNumber,
    target_date: milestone.targetDate,
    title: milestone.title,
    message: fallbackMessage,
    target_route: milestone.targetRoute,
    section_id: milestone.sectionId || null
  };
}

/**
 * Pre-generación silenciosa en segundo plano:
 * Si hay un hito próximo en los siguientes 1 a 5 días y aún no está guardado,
 * solicita discretamente su generación para que el día del hito cargue instantáneamente.
 */
export async function triggerSilentUpcomingGeneration(
  child: any,
  lifeSections: any[] = [],
  authToken?: string
): Promise<void> {
  try {
    const upcoming = checkUpcomingMilestone(child, lifeSections, 5);
    if (!upcoming) return;

    // Verificar si ya está en tabla
    const { data } = await supabase
      .from("milestone_celebrations")
      .select("id")
      .eq("child_id", child.id)
      .eq("milestone_key", upcoming.milestoneKey)
      .maybeSingle();

    if (data && data.id) {
      // Ya existe, nada que hacer
      return;
    }

    // Si no existe, invocar la API silenciosamente en background
    fetch("/api/ai/celebration", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {})
      },
      body: JSON.stringify({
        childId: child.id,
        childName: child.nickname || child.name || "el Bebé",
        gender: child.gender,
        motherName: child.mother_name || child.preview_config?.mother_name,
        fatherName: child.father_name || child.preview_config?.father_name,
        parentsNames: child.parents_names || child.preview_config?.parents_names,
        milestoneKey: upcoming.milestoneKey,
        milestoneType: upcoming.milestoneType,
        milestoneNumber: upcoming.milestoneNumber,
        targetDate: upcoming.targetDate,
        title: upcoming.title,
        targetRoute: upcoming.targetRoute,
        sectionId: upcoming.sectionId || null
      })
    }).catch(e => console.warn("Silent milestone pre-gen warning:", e));
  } catch (err) {
    // Proceso silencioso, no debe interferir con la navegación del usuario
  }
}
