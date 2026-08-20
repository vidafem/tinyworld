// ==============================================================================
// TINYWORLD - MOTOR INTELIGENTE DE ANÁLISIS MÉDICO, GESTACIONAL Y PEDIÁTRICO
// Proporciona respuestas instantáneas, análisis por semanas exactas y redacción de cartas
// ==============================================================================

import { PREGNANCY_ADVICE } from "./pregnancyAdvice";

export interface WeekMetric {
  length: number; // cm
  weight: number; // gramos
  fruit: string;
  emoji: string;
  desc: string;
}

export const FETUS_WEEK_DATA: Record<number, WeekMetric> = {
  1: { length: 0.1, weight: 0.1, fruit: "Célula", emoji: "✨", desc: "El óvulo es fertilizado y comienza su división mitótica en su viaje hacia el útero." },
  2: { length: 0.1, weight: 0.2, fruit: "Blastocisto", emoji: "✨", desc: "Las células continúan multiplicándose rápidamente formando una esfera que busca implantarse." },
  3: { length: 0.1, weight: 0.3, fruit: "Embrión Inicial", emoji: "✨", desc: "El blastocisto se adhiere a la pared uterina; se forman las primeras capas celulares del bebé." },
  4: { length: 0.2, weight: 1, fruit: "Semilla de Amapola", emoji: "🌱", desc: "El embrión se implanta en el útero y empieza a formarse el tubo neural, inicio del cerebro." },
  5: { length: 0.3, weight: 1, fruit: "Semilla de Sésamo", emoji: "🌱", desc: "El embrión crece y el corazón primitivo comienza a latir de manera rítmica." },
  6: { length: 0.5, weight: 1, fruit: "Lenteja", emoji: "🌱", desc: "Las facciones del rostro empiezan a definirse y brotan los esbozos de los brazos." },
  7: { length: 1.2, weight: 2, fruit: "Arándano", emoji: "🫐", desc: "El cerebro se divide en hemisferios y las extremidades se alargan formando las articulaciones." },
  8: { length: 1.6, weight: 3, fruit: "Frambuesa", emoji: "🍓", desc: "Brazos y piernas brotan. El corazón ya late con fuerza a unos 150-170 latidos por minuto." },
  9: { length: 2.3, weight: 4, fruit: "Uva", emoji: "🍇", desc: "Los dedos de las manos y de los pies comienzan a formarse y la cola vestigial desaparece." },
  10: { length: 3.1, weight: 5, fruit: "Kumquat", emoji: "🍊", desc: "El feto empieza a moverse en el líquido amniótico y sus riñones comienzan a producir orina." },
  11: { length: 4.1, weight: 7, fruit: "Higo", emoji: "🫒", desc: "Las uñas empiezan a crecer y casi todos los órganos vitales ya están funcionando." },
  12: { length: 5.4, weight: 14, fruit: "Limón", emoji: "🍋", desc: "El bebé ya tiene sus dedos separados, gesticula y sus reflejos de succión comienzan." },
  13: { length: 7.4, weight: 23, fruit: "Vaina de Guisante", emoji: "🫛", desc: "Las huellas dactilares se forman en las yemas de sus dedos y el cuerpo crece más rápido." },
  14: { length: 8.7, weight: 43, fruit: "Limón Verde", emoji: "🍋", desc: "La glándula tiroides comienza a secretar hormonas y el bebé empieza a practicar la respiración." },
  15: { length: 10.1, weight: 70, fruit: "Manzana", emoji: "🍎", desc: "La piel es muy delgada y transparente; el bebé puede mover todas sus articulaciones." },
  16: { length: 11.6, weight: 100, fruit: "Aguacate", emoji: "🥑", desc: "Los ojos se mueven bajo los párpados cerrados y el bebé ya puede oír voces externas." },
  17: { length: 13.0, weight: 140, fruit: "Nectarina", emoji: "🍑", desc: "El esqueleto del bebé está cambiando de cartílago blando a hueso duro." },
  18: { length: 14.2, weight: 190, fruit: "Camote", emoji: "🍠", desc: "El bebé bosteza, traga líquido amniótico y puede experimentar hipo." },
  19: { length: 15.3, weight: 240, fruit: "Mango", emoji: "🥭", desc: "Se forma la vérnix caseosa, una capa grasa que protege la piel del líquido amniótico." },
  20: { length: 25.6, weight: 300, fruit: "Plátano", emoji: "🍌", desc: "¡Punto medio! El cerebro desarrolla las áreas sensoriales: oído, vista, gusto y tacto." },
  21: { length: 26.7, weight: 360, fruit: "Zanahoria", emoji: "🥕", desc: "El bebé traga líquido amniótico para entrenar su sistema digestivo en desarrollo." },
  22: { length: 27.8, weight: 430, fruit: "Papaya", emoji: "🥭", desc: "Los párpados y cejas están completamente formados y el bebé tiene ciclos de sueño." },
  23: { length: 28.9, weight: 500, fruit: "Pomelo", emoji: "🍊", desc: "El sentido del equilibrio en el oído interno se desarrolla; el bebé nota su posición." },
  24: { length: 30.0, weight: 600, fruit: "Berenjena", emoji: "🍆", desc: "Los pulmones desarrollan surfactante para respirar al nacer. Reacciona a ruidos fuertes." },
  25: { length: 34.6, weight: 660, fruit: "Nabo", emoji: "🥬", desc: "La piel se vuelve menos arrugada a medida que se acumula grasa subcutánea protectora." },
  26: { length: 35.6, weight: 760, fruit: "Pepino", emoji: "🥒", desc: "El bebé puede inhalar, exhalar y abrir los ojos. Se detecta actividad cerebral activa." },
  27: { length: 36.6, weight: 875, fruit: "Coliflor", emoji: "🥦", desc: "El bebé empieza a reconocer tu voz y la de tu pareja con total claridad." },
  28: { length: 37.6, weight: 1000, fruit: "Calabaza Butternut", emoji: "🎃", desc: "El cerebro crece a paso acelerado y forma los pliegues cerebrales característicos." },
  29: { length: 38.6, weight: 1150, fruit: "Piña", emoji: "🍍", desc: "Los ojos ya se abren y se cierran, y las pestañas están completamente formadas." },
  30: { length: 39.9, weight: 1300, fruit: "Repollo", emoji: "🥬", desc: "La médula espinal asume la producción de glóbulos rojos en lugar del bazo." },
  31: { length: 41.1, weight: 1500, fruit: "Coco", emoji: "🥥", desc: "El bebé puede girar la cabeza de un lado a otro y se mueve activamente en el útero." },
  32: { length: 42.4, weight: 1700, fruit: "Jícama", emoji: "🍈", desc: "Uñas de manos y pies terminadas. El bebé practica la respiración constantemente." },
  33: { length: 43.7, weight: 1900, fruit: "Piña Mediana", emoji: "🍍", desc: "Los huesos se endurecen pero los del cráneo siguen flexibles para facilitar el parto." },
  34: { length: 45.0, weight: 2100, fruit: "Cantalupo", emoji: "🍈", desc: "El sistema inmunológico del bebé recibe anticuerpos protectores de la madre." },
  35: { length: 46.2, weight: 2380, fruit: "Melón Honeydew", emoji: "🍈", desc: "La mayoría del lanugo (vello fino) ha desaparecido de su piel suave." },
  36: { length: 47.4, weight: 2600, fruit: "Lechuga Romana", emoji: "🥬", desc: "El bebé acumula grasa en sus mejillas y extremidades. Suele colocarse de cabeza." },
  37: { length: 48.6, weight: 2860, fruit: "Acelga", emoji: "🥬", desc: "El bebé se considera a término temprano; sus pulmones están listos para respirar." },
  38: { length: 49.8, weight: 3100, fruit: "Puerro", emoji: "🥦", desc: "El bebé sigue acumulando grasa para regular su temperatura corporal al nacer." },
  39: { length: 50.7, weight: 3290, fruit: "Sandía Pequeña", emoji: "🍉", desc: "El cerebro y los pulmones continúan madurando en sus etapas finales." },
  40: { length: 51.2, weight: 3400, fruit: "Sandía Grande", emoji: "🍉", desc: "¡Desarrollo completo! El bebé está 100% listo para nacer y conocer a su familia." },
  41: { length: 51.7, weight: 3550, fruit: "Calabaza Gigante", emoji: "🎃", desc: "El bebé está listo para nacer en cualquier momento. ¡Monitorea las contracciones rítmicas!" },
  42: { length: 52.2, weight: 3700, fruit: "Melón Gigante", emoji: "🍈", desc: "¡Cualquier día es el nacimiento! Felicidades y paciencia en la dulce espera." }
};

export interface ClinicalContext {
  childName: string;
  gender?: string;
  isPregnancy: boolean;
  pregnancyWeeks?: number;
  pregnancyDays?: number;
  trimester?: number;
  fpp?: string;
  babyAge?: string;
  totalDays?: number;
  motherName?: string;
  fatherName?: string;
  parentsNames?: string;
}

export function generateInstantClinicalResponse(
  prompt: string, 
  mode: "chat" | "letter", 
  ctx: ClinicalContext
): string {
  const {
    childName = "el Bebé",
    isPregnancy = true,
    pregnancyWeeks = 24,
    pregnancyDays = 0,
    trimester = 2,
    fpp,
    babyAge,
    motherName,
    fatherName,
    parentsNames
  } = ctx;

  const weekNum = Math.max(1, Math.min(42, pregnancyWeeks));
  const weekMetric = FETUS_WEEK_DATA[weekNum] || FETUS_WEEK_DATA[24];
  const weekAdvice = PREGNANCY_ADVICE[weekNum] || PREGNANCY_ADVICE[24];
  const parents = parentsNames || [motherName, fatherName].filter(Boolean).join(" y ") || "Mamá y Papá";

  const lower = prompt.toLowerCase();

  // MODO 1: REDACCIÓN DE CARTAS POÉTICAS
  if (mode === "letter") {
    if (isPregnancy) {
      return `💌 **Carta de Amor para ${childName} en la Semana ${weekNum}** ✨\n\n` +
        `Mi pequeño milagro,\n\n` +
        `Hoy cerramos los ojos y te sentimos más presente que nunca. Llevas ya **${weekNum} semanas** creciendo en el vientre, midiendo aproximadamente **${weekMetric.length} cm** y pesando unos **${weekMetric.weight} gramos**, como un dulce **${weekMetric.fruit} ${weekMetric.emoji}** lleno de vida.\n\n` +
        `Cada patadita y cada movimiento tuyo nos recuerdan el inmenso regalo que eres. Sabemos que ya puedes escuchar nuestras voces y sentir el latido de nuestro corazón al abrazar la pancita. Nos preparamos día a día con amor, paciencia y emoción para el momento en que podamos mirarte a los ojos.\n\n` +
        `*${prompt.includes("carta") ? "Queremos prometerte que siempre seremos tu refugio, tu guía y tus mayores admiradores en cada paso de tu camino." : prompt}*\n\n` +
        `Gracias por elegirnos como tus padres y llenar nuestro hogar de una alegría que no sabíamos que existía.\n\n` +
        `Con amor infinito e incondicional,\n` +
        `**${parents}** ❤️✨\n\n` +
        `*(Semana ${weekNum} de Gestación • FPP estimada: ${fpp || "Próximamente"})*`;
    } else {
      return `💌 **Carta de Amor para ${childName}** ✨\n\n` +
        `Mi amado/a ${childName},\n\n` +
        `Verte crecer durante tus primeros **${babyAge || "meses"}** de vida es el viaje más hermoso que jamás hayamos emprendido. Cada sonrisa tuya ilumina nuestro mundo y cada pequeño logro es una fiesta en nuestro corazón.\n\n` +
        `*${prompt}*\n\n` +
        `Prometemos tomarte de la mano, celebrar tus risas, secar tus lágrimas y recordarte siempre lo profundamente valioso y amado que eres.\n\n` +
        `Con todo nuestro amor eterno,\n` +
        `**${parents}** ❤️✨`;
    }
  }

  // MODO 2: CONSULTAS MÉDICAS Y DE DESARROLLO GESTACIONAL

  // A) DESARROLLO Y TAMAÑO DEL BEBÉ
  if (lower.includes("desarrollo") || lower.includes("tamaño") || lower.includes("medida") || lower.includes("peso") || lower.includes("como esta") || lower.includes("cómo está") || lower.includes("crecimiento")) {
    if (isPregnancy) {
      return `👶 **Desarrollo de ${childName} en la Semana ${weekNum} de Gestación** ✨\n\n` +
        `Actualmente te encuentras en el **${trimester}° Trimestre** (${weekNum} semanas y ${pregnancyDays} días de gestación):\n\n` +
        `📏 **Medidas y Comparación Anatómica:**\n` +
        `• **Longitud promedio:** Aprox. **${weekMetric.length} cm** (desde la coronilla al talón).\n` +
        `• **Peso estimado:** Alrededor de **${weekMetric.weight} gramos**.\n` +
        `• **Tamaño comparativo:** Es del tamaño aproximado de un/a **${weekMetric.fruit} ${weekMetric.emoji}**.\n\n` +
        `🧠 **Hitos Clave de esta Semana:**\n` +
        `• **${weekMetric.desc}**\n` +
        `• **Desarrollo sensorial:** Sus reflejos auditivos y táctiles se agudizan; ya puede reconocer la voz de mamá y papá con nitidez.\n` +
        `• **Movimientos fetales:** Sus ciclos de sueño y vigilia son más claros. Es normal sentir períodos de pataditas intensas seguidos de calma.\n\n` +
        `🩺 **Consejo de Salud para Mamá:**\n` +
        `• ${weekAdvice.health}\n\n` +
        `📋 **Pendiente Recomendado:**\n` +
        `• ${weekAdvice.todo.join("\n• ")}`;
    } else {
      return `👶 **Hitos de Desarrollo para ${childName} (${babyAge || "Recién nacido"})** ✨\n\n` +
        `A esta edad, ${childName} está atravesando etapas maravillosas de desarrollo psicomotor:\n\n` +
        `• **Desarrollo motor:** Fortalecimiento del cuello, seguimiento visual de objetos con la mirada y mayor coordinación de manitas y pies.\n` +
        `• **Comunicación:** Sonrisas sociales, balbuceos iniciales y reconocimiento claro de rostros y voces familiares.\n` +
        `• **Descanso y alimentación:** Rutinas estructuradas de sueño y tomas frecuentes según demanda.\n\n` +
        `💡 *Consejo:* Dedica 10 a 15 minutos diarios a "tummy time" (boca abajo sobre una superficie segura) mientras esté despierto/a para fortalecer su espalda.`;
    }
  }

  // B) NUTRICIÓN Y ALIMENTACIÓN
  if (lower.includes("comer") || lower.includes("aliment") || lower.includes("nutri") || lower.includes("dieta") || lower.includes("antojo") || lower.includes("vitamina") || lower.includes("hierro")) {
    if (isPregnancy) {
      return `🥗 **Nutrición Clave en la Semana ${weekNum} (Trimestre ${trimester})** 🥑\n\n` +
        `En esta etapa del embarazo, los requerimientos de nutrientes son fundamentales para el desarrollo de **${childName}**:\n\n` +
        `🥩 **Nutrientes Indispensables:**\n` +
        `• **Hierro y Vitamina C:** Para prevenir la anemia gestacional y respaldar el aumento del volumen sanguíneo de ${childName}. (Legumbres, espinacas, carnes magras combinadas con cítricos).\n` +
        `• **Calcio y Vitamina D:** El esqueleto del bebé continúa calcificándose a paso firme. (Yogur, quesos pasteurizados, semillas de sésamo, almendras).\n` +
        `• **DHA (Omega-3):** Esencial para la maduración de la retina y las conexiones neuronales del cerebro.\n` +
        `• **Hidratación:** Bebe entre 2.5 y 3 litros de agua al día para mantener un volumen óptimo de líquido amniótico.\n\n` +
        `🚫 **Alimentos a evitar estrictamente:**\n` +
        `• Carnes, pescados o huevos crudos o poco cocidos (riesgo de toxoplasmosis y salmonela).\n` +
        `• Quesos no pasteurizados o de leche cruda (riesgo de listeria).\n` +
        `• Pescados de gran tamaño ricos en mercurio (atún rojo, pez espada, tiburón).`;
    } else {
      return `🍼 **Guía de Alimentación para ${childName} (${babyAge || "Lactante"})** ✨\n\n` +
        `• **0 a 6 meses:** Lactancia materna exclusiva a libre demanda o fórmula infantil según indicación pediátrica. No se requiere agua adicional.\n` +
        `• **6 meses en adelante:** Inicio de alimentación complementaria respetando señales de saciedad, priorizando alimentos ricos en hierro (carnes suaves, legumbres, verduras y frutas al vapor).\n` +
        `• **Evitar antes del año:** Miel de abeja (riesgo de botulismo), sal añadida, azúcar y leche entera de vaca.`;
    }
  }

  // C) SÍNTOMAS, MOLESTIAS Y CUIDADOS DE MAMÁ
  if (lower.includes("sintoma") || lower.includes("síntoma") || lower.includes("dolor") || lower.includes("molestia") || lower.includes("espalda") || lower.includes("panza") || lower.includes("nausea") || lower.includes("cansancio") || lower.includes("contraccion") || lower.includes("hinch")) {
    return `🩺 **Cuidados y Manejo de Síntomas en la Semana ${weekNum}** 🌸\n\n` +
      `En la **Semana ${weekNum}**, el cuerpo experimenta adaptaciones fisiológicas intensas:\n\n` +
      `• **Presión lumbar y pélvica:** El centro de gravedad cambia a medida que ${childName} crece (${weekMetric.weight}g). Usa calzado cómodo y duerme de lado izquierdo con una almohada entre las rodillas.\n` +
      `• **Contracciones de Braxton Hicks:** Son endurecimientos esporádicos y no dolorosos del útero que preparan el músculo. Ceden al descansar o cambiar de postura.\n` +
      `• **Digestión y reflujo:** La progesterona ralentiza el tránsito. Come porciones pequeñas varias veces al día y evita acostarte inmediatamente después de comer.\n\n` +
      `⚠️ **Señales de Alerta que requieren consulta médica urgente:**\n` +
      `1. Sangrado vaginal similar a una regla.\n` +
      `2. Pérdida continua de líquido amniótico por vagina.\n` +
      `3. Dolor de cabeza severo acompañado de visión borrosa o zumbido en los oídos (sospecha de preeclampsia).\n` +
      `4. Ausencia notable o disminución marcada de movimientos fetales de ${childName}.\n` +
      `5. Contracciones dolorosas, rítmicas y frecuentes (más de 4 en 1 hora).`;
  }

  // D) CÓLICOS, SUEÑO Y GASES
  if (lower.includes("colic") || lower.includes("gases") || lower.includes("llanto") || lower.includes("dormir") || lower.includes("sueño") || lower.includes("sueno") || lower.includes("rutina")) {
    return `🌙 **Guía de Sueño Seguro y Alivio de Cólicos / Gases** 👶✨\n\n` +
      `Para acompañar el bienestar de **${childName}**:\n\n` +
      `1. **Técnica del masaje en bicicleta:** Mueve suavemente las piernitas del bebé flexionándolas hacia su abdomen de forma rítmica para liberar gases atrapados.\n` +
      `2. **Contacto piel con piel (Método Canguro):** El calor del pecho de mamá o papá regula la temperatura, ritmo cardíaco y relaja el sistema digestivo.\n` +
      `3. **Ambiente de sueño seguro:**\n` +
      `   • Siempre boca arriba sobre un colchón firme y despejado.\n` +
      `   • Temperatura ambiente agradable (entre 20°C y 22°C).\n` +
      `   • Ruido blanco suave y luz muy tenue durante la noche para sincronizar su ritmo circadiano.`;
  }

  // E) EXÁMENES MÉDICOS Y CONTROLES
  if (lower.includes("examen") || lower.includes("eco") || lower.includes("cita") || lower.includes("glucosa") || lower.includes("analisis") || lower.includes("hospital") || lower.includes("parto")) {
    return `📋 **Exámenes Médicos y Planificación en la Semana ${weekNum}** 🩺\n\n` +
      `Para garantizar la salud de mamá y de **${childName}** en este período:\n\n` +
      `• **Prueba de O'Sullivan (Glucosa):** Si estás entre las semanas 24 y 28, es el momento estándar para evaluar el metabolismo del azúcar y descartar diabetes gestacional.\n` +
      `• **Control de Presión Arterial:** En cada consulta prenatal se debe registrar la tensión para prevenir preeclampsia.\n` +
      `• **Movimientos Fetales:** Es recomendable dedicar 1 hora tras las comidas principales a percibir y contar las pataditas de ${childName}.\n\n` +
      `📌 **Checklist sugerido para esta semana:**\n` +
      `• ${weekAdvice.todo.join("\n• ")}\n\n` +
      `💡 **Amor y Pareja:** ${weekAdvice.love}`;
  }

  // F) RESPUESTA HOLÍSTICA GENERAL INTEGRADA CON SEMANA EXACTA
  return `✨ **Análisis para ${childName} en la Semana ${weekNum} de Gestación** ✨\n\n` +
    `Respecto a tu consulta: *"**${prompt}**"*\n\n` +
    `🌱 **Estado actual del bebé:**\n` +
    `• **Semana:** ${weekNum} semanas (${weekNum} sem + ${pregnancyDays} días • ${trimester}° Trimestre).\n` +
    `• **Dimensiones:** Mide unos **${weekMetric.length} cm** y pesa aprox. **${weekMetric.weight} gramos** (${weekMetric.fruit} ${weekMetric.emoji}).\n` +
    `• **Desarrollo biológico:** ${weekMetric.desc}\n\n` +
    `🩺 **Orientación para esta etapa:**\n` +
    `• ${weekAdvice.health}\n\n` +
    `💡 **Recomendación para los padres (${parents}):**\n` +
    `• ${weekAdvice.love}\n\n` +
    `*(Si deseas redactar una carta conmovedora para ${childName}, puedes cambiar a la pestaña "Cartas" en la parte superior).*`;
}
