// ==============================================================================
// TINYWORLD - MOTOR INTELIGENTE DE RESPUESTAS PARA MATERNIDAD, CRIANZA Y PRODUCTOS
// Responde directamente a la consulta del usuario (pañales, marcas, cuidados, salud, cartas)
// utilizando el contexto del bebé solo como referencia de apoyo cuando sea pertinente.
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
  1: { length: 0.1, weight: 0.1, fruit: "Célula", emoji: "✨", desc: "El óvulo es fertilizado y comienza su división celular." },
  2: { length: 0.1, weight: 0.2, fruit: "Blastocisto", emoji: "✨", desc: "Las células continúan multiplicándose formando una esfera." },
  3: { length: 0.1, weight: 0.3, fruit: "Embrión Inicial", emoji: "✨", desc: "El blastocisto se adhiere a la pared uterina." },
  4: { length: 0.2, weight: 1, fruit: "Semilla de Amapola", emoji: "🌱", desc: "Se implanta en el útero e inicia la formación del tubo neural." },
  5: { length: 0.3, weight: 1, fruit: "Semilla de Sésamo", emoji: "🌱", desc: "El corazón primitivo comienza a latir rítmicamente." },
  6: { length: 0.5, weight: 1, fruit: "Lenteja", emoji: "🌱", desc: "Facciones del rostro empiezan a definirse." },
  7: { length: 1.2, weight: 2, fruit: "Arándano", emoji: "🫐", desc: "El cerebro se divide en hemisferios y se forman articulaciones." },
  8: { length: 1.6, weight: 3, fruit: "Frambuesa", emoji: "🍓", desc: "Brazos y piernas brotan; corazón latiendo a 150-170 lpm." },
  9: { length: 2.3, weight: 4, fruit: "Uva", emoji: "🍇", desc: "Dedos de manos y pies formándose claramente." },
  10: { length: 3.1, weight: 5, fruit: "Kumquat", emoji: "🍊", desc: "El feto se mueve en el líquido amniótico y los riñones producen orina." },
  11: { length: 4.1, weight: 7, fruit: "Higo", emoji: "🫒", desc: "Uñas en crecimiento y órganos vitales funcionando." },
  12: { length: 5.4, weight: 14, fruit: "Limón", emoji: "🍋", desc: "Dedos separados y reflejos de succión activos." },
  13: { length: 7.4, weight: 23, fruit: "Vaina de Guisante", emoji: "🫛", desc: "Huellas dactilares formándose en las yemas de sus dedos." },
  14: { length: 8.7, weight: 43, fruit: "Limón Verde", emoji: "🍋", desc: "Tiroides produciendo hormonas y práctica de respiración." },
  15: { length: 10.1, weight: 70, fruit: "Manzana", emoji: "🍎", desc: "Piel fina; el bebé flexiona todas sus articulaciones." },
  16: { length: 11.6, weight: 100, fruit: "Aguacate", emoji: "🥑", desc: "Ojos con movimiento bajo párpados; escucha sonidos." },
  17: { length: 13.0, weight: 140, fruit: "Nectarina", emoji: "🍑", desc: "El esqueleto se transforma de cartílago a hueso firme." },
  18: { length: 14.2, weight: 190, fruit: "Camote", emoji: "🍠", desc: "Bostezos, deglución de líquido amniótico e hipo." },
  19: { length: 15.3, weight: 240, fruit: "Mango", emoji: "🥭", desc: "Se forma la vérnix caseosa protectora sobre la piel." },
  20: { length: 25.6, weight: 300, fruit: "Plátano", emoji: "🍌", desc: "Mitad del embarazo; desarrollo de áreas sensoriales." },
  21: { length: 26.7, weight: 360, fruit: "Zanahoria", emoji: "🥕", desc: "Entrenamiento continuo del sistema digestivo fetal." },
  22: { length: 27.8, weight: 430, fruit: "Papaya", emoji: "🥭", desc: "Párpados y cejas formados; ciclos de sueño definidos." },
  23: { length: 28.9, weight: 500, fruit: "Pomelo", emoji: "🍊", desc: "Desarrollo del sentido del equilibrio en el oído interno." },
  24: { length: 30.0, weight: 600, fruit: "Berenjena", emoji: "🍆", desc: "Producción de surfactante en pulmones; reacciona a ruidos." },
  25: { length: 34.6, weight: 660, fruit: "Nabo", emoji: "🥬", desc: "Piel más suave al acumular grasa subcutánea protectora." },
  26: { length: 35.6, weight: 760, fruit: "Pepino", emoji: "🥒", desc: "Apertura ocular y actividad cerebral rítmica." },
  27: { length: 36.6, weight: 875, fruit: "Coliflor", emoji: "🥦", desc: "Reconoce la voz de mamá y papá con claridad." },
  28: { length: 37.6, weight: 1000, fruit: "Calabaza Butternut", emoji: "🎃", desc: "Crecimiento cerebral acelerado con pliegues característicos." },
  29: { length: 38.6, weight: 1150, fruit: "Piña", emoji: "🍍", desc: "Ojos parpadeando y pestañas totalmente formadas." },
  30: { length: 39.9, weight: 1300, fruit: "Repollo", emoji: "🥬", desc: "Médula espinal asume la producción de glóbulos rojos." },
  31: { length: 41.1, weight: 1500, fruit: "Coco", emoji: "🥥", desc: "Giro de cabeza y movimientos activos en el útero." },
  32: { length: 42.4, weight: 1700, fruit: "Jícama", emoji: "🍈", desc: "Uñas completas y práctica respiratoria constante." },
  33: { length: 43.7, weight: 1900, fruit: "Piña Mediana", emoji: "🍍", desc: "Huesos fuertes y cráneo flexible para el canal de parto." },
  34: { length: 45.0, weight: 2100, fruit: "Cantalupo", emoji: "🍈", desc: "Transferencia activa de anticuerpos maternos." },
  35: { length: 46.2, weight: 2380, fruit: "Melón Honeydew", emoji: "🍈", desc: "Lanugo disminuyendo y aumento de grasa corporal." },
  36: { length: 47.4, weight: 2600, fruit: "Lechuga Romana", emoji: "🥬", desc: "Mejillas rellenas; habitualmente encajado de cabeza." },
  37: { length: 48.6, weight: 2860, fruit: "Acelga", emoji: "🥬", desc: "Bebé a término temprano; pulmones maduros." },
  38: { length: 49.8, weight: 3100, fruit: "Puerro", emoji: "🥦", desc: "Acumulación final de grasa para termorregulación." },
  39: { length: 50.7, weight: 3290, fruit: "Sandía Pequeña", emoji: "🍉", desc: "Maduración final de sistema respiratorio y nervioso." },
  40: { length: 51.2, weight: 3400, fruit: "Sandía Grande", emoji: "🍉", desc: "¡Desarrollo completo! Listo para nacer." },
  41: { length: 51.7, weight: 3550, fruit: "Calabaza Gigante", emoji: "🎃", desc: "Listo para el parto en cualquier instante." },
  42: { length: 52.2, weight: 3700, fruit: "Melón Gigante", emoji: "🍈", desc: "Dulce espera en su fase final." }
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

  // =========================================================================
  // 1. MODO CARTA: Redacción poética y amorosa
  // =========================================================================
  if (mode === "letter") {
    if (isPregnancy) {
      return `💌 **Carta de Amor para ${childName}** ✨\n\n` +
        `Mi pequeño milagro,\n\n` +
        `Hoy cerramos los ojos y te sentimos más presente que nunca. Cada día que pasa en esta dulce espera nos llena de una ilusión inmensa, imaginando tu carita, tus manitas y la forma en que iluminarás nuestro hogar.\n\n` +
        `*${prompt.includes("carta") ? "Queremos prometerte que siempre seremos tu refugio, tu guía y tu lugar seguro en cada paso de tu camino." : prompt}*\n\n` +
        `Sabemos que ya puedes escuchar nuestras voces y sentir el calor de nuestros abrazos sobre la pancita. No hay mayor felicidad que saber que muy pronto podremos sostenerte en brazos.\n\n` +
        `Con todo nuestro amor infinito,\n` +
        `**${parents}** ❤️✨\n\n` +
        `*(Dedicado a ${childName} • Semana ${weekNum} de gestación)*`;
    } else {
      return `💌 **Carta de Amor para ${childName}** ✨\n\n` +
        `Mi amado/a ${childName},\n\n` +
        `Verte crecer día a día es el regalo más hermoso de nuestras vidas. Cada una de tus sonrisas, tus miradas curiosas y tus pequeños logros nos recuerdan lo afortunados que somos de ser tus padres.\n\n` +
        `*${prompt}*\n\n` +
        `Prometemos caminar a tu lado, cuidar de tus sueños y recordarte en cada amanecer lo profundamente amado y valioso que eres.\n\n` +
        `Con todo nuestro amor eterno,\n` +
        `**${parents}** ❤️✨`;
    }
  }

  // =========================================================================
  // 2. PRODUCTOS PARA BEBÉS: PAÑALES Y CUIDADO DE PIEL
  // =========================================================================
  if (lower.includes("pañal") || lower.includes("panal") || lower.includes("pampers") || lower.includes("huggies") || lower.includes("dodot")) {
    return `🧷 **Guía y Comparativa de Marcas de Pañales Recomendadas** ✨\n\n` +
      `Elegir el pañal adecuado depende de la sensibilidad de la piel, absorción nocturna y el ajuste al cuerpo del bebé:\n\n` +
      `🥇 **Principales Marcas y sus Puntos Fuertes:**\n` +
      `• **Pampers Swaddlers / Pure Protection:**\n` +
      `  - *Lo mejor:* Máxima suavidad, excelente indicador de humedad y corte umbilical para recién nacidos. La línea *Pure* es libre de fragancias y parabenos.\n` +
      `  - *Ideal para:* Pieles delicadas y uso hospitalario en los primeros meses.\n\n` +
      `• **Huggies Special Delivery / Natural Care:**\n` +
      `  - *Lo mejor:* Banda elástica trasera antiescapes muy flexible y materiales hipoalergénicos basados en plantas.\n` +
      `  - *Ideal para:* Bebés activos con tendencia a fugas por la espalda.\n\n` +
      `• **Dodot Sensitive / Bebé-Seco:**\n` +
      `  - *Lo mejor:* Capa ultra absorbente con canales de aire que mantienen la piel seca hasta por 12 horas.\n` +
      `  - *Ideal para:* Dormir toda la noche sin interrupciones por humedad.\n\n` +
      `• **Bambo Nature / Eco by Naty (Ecológicos):**\n` +
      `  - *Lo mejor:* 100% biodegradables, sin cloro, blanqueadores ni perfumes.\n` +
      `  - *Ideal para:* Bebés propensos a dermatitis atópica severa.\n\n` +
      `💡 **Consejo Práctico de Compra:**\n` +
      `No compres demasiados paquetes de talla **Recién Nacido (RN / Talla 0-1)** por adelantado. Los bebés crecen muy rápido en sus primeras semanas; es más seguro comprar 1-2 paquetes de RN y tener más stock de **Talla 1 y 2** (${isPregnancy ? `para cuando nazca ${childName}` : `para ${childName}`}).`;
  }

  // =========================================================================
  // 3. PRODUCTOS: BIBERONES, CHUPONES, EXTRACTORES Y FÓRMULAS
  // =========================================================================
  if (lower.includes("biberon") || lower.includes("biberón") || lower.includes("mamila") || lower.includes("tetero") || lower.includes("chupo") || lower.includes("formula") || lower.includes("fórmula") || lower.includes("sacaleche") || lower.includes("extractor")) {
    return `🍼 **Guía de Biberones, Chupones y Alimentación** ✨\n\n` +
      `• **Mejores Biberones Anti-Cólicos:**\n` +
      `  - **Dr. Brown's Options+:** El sistema de ventilación interna reduce significativamente la ingesta de aire, cólicos y reflujo.\n` +
      `  - **Philips Avent Natural Response:** La tetina solo libera leche cuando el bebé succiona activamente, facilitando la lactancia mixta sin confusión tetina-pezón.\n` +
      `  - **Comotomo / MAM:** Cuerpo de silicona suave y tetinas ortodónticas de fácil agarre.\n\n` +
      `• **Extractores de Leche (Sacaleches):**\n` +
      `  - **Spectra S1/S2:** Grado hospitalario, ultra silencioso y muy eficiente para banco de leche.\n` +
      `  - **Momcozy / Elvie:** Extractores manos libres inalámbricos, ideales para trabajar o moverse con comodidad.\n\n` +
      `• **Fórmulas Infantiles:**\n` +
      `  - Las marcas líderes (*Enfamil NeuroPro, Similac Pro-Advance, Nan Pro*) ofrecen perfiles nutricionales completos con DHA y prebióticos. Siempre consulta con el pediatra antes de elegir una fórmula específica (convencional vs confort/gentlease).`;
  }

  // =========================================================================
  // 4. PRODUCTOS: COCHES, SILLAS DE AUTO, CUNAS Y CARGADORES (PORTEO)
  // =========================================================================
  if (lower.includes("coche") || lower.includes("carriola") || lower.includes("stroller") || lower.includes("silla") || lower.includes("cuna") || lower.includes("moises") || lower.includes("moisés") || lower.includes("porteo") || lower.includes("fular") || lower.includes("mochila")) {
    return `🚗 **Coches, Sillas de Auto y Cunas Recomendadas** ✨\n\n` +
      `• **Sillas de Auto (Seguridad es prioridad #1):**\n` +
      `  - **Chicco KeyFit 30 / 35:** Reconocida mundialmente como una de las más fáciles de instalar correctamente con sistema LATCH/ISOFIX.\n` +
      `  - **Graco Extend2Fit:** Silla convertible que permite viajar a contramarcha hasta los 22 kg (la posición más segura).\n\n` +
      `• **Coches y Sistemas de Viaje (Travel Systems):**\n` +
      `  - **Chicco Bravo / Graco Modes:** Gran relación calidad-precio, plegado con una sola mano y compatibles con portabebés.\n` +
      `  - **Uppababy Vista V2 / Nuna Mixx:** Gama alta, amortiguación superior y adaptabilidad para 1 o 2 niños.\n\n` +
      `• **Cunas de Colecho y Moisés:**\n` +
      `  - **Chicco Next2Me / Halo BassiNest:** Facilitan las tomas nocturnas manteniendo al bebé a la altura de la cama con total seguridad.\n\n` +
      `• **Porteo Ergonómico:**\n` +
      `  - Para recién nacidos: Fular elástico (tipo *Boba Wrap* o *Moby*).\n` +
      `  - Para bebés mayores de 3 meses: Mochilas ergonómicas con posición en "M" o ranita (tipo *Ergobaby Omni 360* o *BabyBjörn Harmony*).`;
  }

  // =========================================================================
  // 5. TOALLITAS, CREMAS Y BAÑO DEL BEBÉ
  // =========================================================================
  if (lower.includes("toallita") || lower.includes("crema") || lower.includes("pomada") || lower.includes("bano") || lower.includes("baño") || lower.includes("shampoo") || lower.includes("jabon") || lower.includes("jabón") || lower.includes("cordon") || lower.includes("cordón")) {
    return `🛁 **Higiene, Toallitas y Cuidado de la Piel del Bebé** ✨\n\n` +
      `• **Toallitas Húmedas:**\n` +
      `  - **WaterWipes (99.9% agua):** La opción más pura y recomendada para recién nacidos y pieles con dermatitis.\n` +
      `  - **Huggies Natural Care / Pampers Aqua Pure:** Libres de alcohol y perfume, muy resistentes.\n\n` +
      `• **Cremas para la Rozadura del Pañal:**\n` +
      `  - **Prevención diaria:** *Bepanthen Baby* o crema hidratante con caléndula/óxido de zinc ligero.\n` +
      `  - **Tratamiento intensivo:** *Desitin Máxima Protección (tapa morada con 40% óxido de zinc)* o *Aquaphor Baby*.\n\n` +
      `• **Rutina del Baño:**\n` +
      `  - Usar agua tibia (36°C - 37°C) y jabón neutro syndet sin sulfatos (*Mustela, Bioderma Atoderm, Aveeno Baby*).\n` +
      `  - El cordón umbilical se limpia solo con agua y gasa seca, manteniéndolo fuera del pañal hasta que caiga de forma natural (7 a 15 días).`;
  }

  // =========================================================================
  // 6. DESARROLLO Y TAMAÑO DEL BEBÉ (SÓLO SI PREGUNTA POR DESARROLLO/MEDIDAS)
  // =========================================================================
  if (lower.includes("desarrollo") || lower.includes("tamaño") || lower.includes("medida") || lower.includes("peso") || lower.includes("como esta") || lower.includes("cómo está") || lower.includes("crecimiento") || lower.includes("semana 25") || lower.includes("cuanto mide") || lower.includes("cuánto mide")) {
    if (isPregnancy) {
      return `👶 **Desarrollo de ${childName} en la Semana ${weekNum} de Gestación** ✨\n\n` +
        `Actualmente te encuentras en el **${trimester}° Trimestre** (${weekNum} semanas y ${pregnancyDays} días de gestación):\n\n` +
        `📏 **Medidas y Comparación:**\n` +
        `• **Longitud promedio:** Aprox. **${weekMetric.length} cm** (de coronilla a talón).\n` +
        `• **Peso estimado:** Alrededor de **${weekMetric.weight} gramos**.\n` +
        `• **Tamaño comparativo:** Es del tamaño aproximado de un/a **${weekMetric.fruit} ${weekMetric.emoji}**.\n\n` +
        `🧠 **Hitos de esta semana:**\n` +
        `• **${weekMetric.desc}**\n` +
        `• **Sentidos:** Sus reflejos auditivos y táctiles se agudizan; ya puede reconocer las voces familiares.\n` +
        `• **Movimientos:** Ciclos de sueño y vigilia más activos con pataditas rítmicas.\n\n` +
        `🩺 **Consejo de Salud para Mamá:** ${weekAdvice.health}`;
    } else {
      return `👶 **Hitos de Desarrollo para ${childName} (${babyAge || "Recién nacido"})** ✨\n\n` +
        `• **Desarrollo motor:** Mayor control cefálico (cuello), seguimiento visual de objetos y agarre con las manitas.\n` +
        `• **Social y emocional:** Sonrisas de respuesta, balbuceos y conexión con sus cuidadores.\n` +
        `• **Estimulación:** Colocar al bebé boca abajo (*tummy time*) unos minutos al día para fortalecer espalda y cuello.`;
    }
  }

  // =========================================================================
  // 7. NUTRICIÓN Y ALIMENTACIÓN (MAMÁ O BEBÉ)
  // =========================================================================
  if (lower.includes("comer") || lower.includes("aliment") || lower.includes("nutri") || lower.includes("dieta") || lower.includes("vitamina") || lower.includes("hierro") || lower.includes("calcio") || lower.includes("blw") || lower.includes("papilla")) {
    if (isPregnancy) {
      return `🥗 **Nutrición Clave en el Embarazo** 🥑\n\n` +
        `• **Nutrientes Indispensables:**\n` +
        `  - **Hierro + Vitamina C:** Para prevenir la anemia y apoyar el volumen sanguíneo (carnes magras, lentejas, espinacas con limón).\n` +
        `  - **Calcio + Vitamina D:** Para la calcificación de los huesos y dientes del bebé (lácteos pasteurizados, semillas de sésamo, almendras).\n` +
        `  - **DHA (Omega-3):** Fundamental para la maduración del cerebro y la retina.\n` +
        `  - **Agua:** 2.5 a 3 litros diarios para renovar el líquido amniótico.\n\n` +
        `🚫 **Evitar:** Carnes o pescados crudos (sushi, carpaccio), quesos no pasteurizados y exceso de cafeína.`;
    } else {
      return `🍼 **Alimentación del Bebé** ✨\n\n` +
        `• **0 a 6 meses:** Lactancia materna exclusiva o fórmula infantil a libre demanda. No requiere agua ni infusiones.\n` +
        `• **6 meses en adelante:** Inicio de alimentación complementaria (método tradicional con papillas o *Baby-Led Weaning / BLW*), priorizando alimentos ricos en hierro.\n` +
        `• **Prohibido antes del primer año:** Miel de abeja (riesgo de botulismo), sal, azúcar y leche de vaca entera.`;
    }
  }

  // =========================================================================
  // 8. SÍNTOMAS, MOLESTIAS Y SALUD
  // =========================================================================
  if (lower.includes("sintoma") || lower.includes("síntoma") || lower.includes("dolor") || lower.includes("molestia") || lower.includes("nausea") || lower.includes("fiebre") || lower.includes("vomito") || lower.includes("vómito") || lower.includes("contraccion") || lower.includes("espalda")) {
    return `🩺 **Orientación sobre Síntomas y Cuidados de Salud** 🌸\n\n` +
      `• **Alivio de molestias comunes:**\n` +
      `  - **Dolor lumbar o pélvico:** Descansar de lado izquierdo con una almohada entre las piernas; calzado con soporte ergonómico.\n` +
      `  - **Acidez y reflujo:** Comidas pequeñas frecuentes, no acostarse de inmediato tras comer y evitar alimentos grasos o muy picantes.\n` +
      `  - **Contracciones de Braxton Hicks:** Endurecimientos indoloros del útero que ceden con reposo e hidratación.\n\n` +
      `⚠️ **Cuándo acudir a urgencias médicas de inmediato:**\n` +
      `• Sangrado vaginal abundante.\n` +
      `• Pérdida continua de líquido por vagina.\n` +
      `• Dolor de cabeza severo con visión borrosa o zumbido en oídos.\n` +
      `• Fiebre alta o disminución notable de movimientos fetales.`;
  }

  // =========================================================================
  // 9. CÓLICOS, SUEÑO Y LLANTO
  // =========================================================================
  if (lower.includes("colic") || lower.includes("gases") || lower.includes("llanto") || lower.includes("dormir") || lower.includes("sueño") || lower.includes("sueno") || lower.includes("rutina")) {
    return `🌙 **Sueño Seguro y Alivio de Cólicos / Gases** 👶✨\n\n` +
      `• **Alivio de Gases y Cólicos:**\n` +
      `  1. **Masaje de bicicleta:** Mover suavemente las piernas del bebé simulando pedalear para expulsar aire.\n` +
      `  2. **Contacto piel con piel:** El calor corporal relaja la musculatura abdominal del bebé.\n` +
      `  3. **Porteo ergonómico:** La posición vertical ayuda a la digestión y calma el llanto.\n\n` +
      `• **Pautas de Sueño Seguro:**\n` +
      `  - Colocar al bebé siempre boca arriba sobre una superficie firme y despejada.\n` +
      `  - Temperatura agradable en la habitación (20°C a 22°C).\n` +
      `  - Ruido blanco continuo y luces tenues para ayudar a conciliar el sueño.`;
  }

  // =========================================================================
  // 10. RESPUESTA GENERAL Y CONVERSACIONAL DIRECTA
  // =========================================================================
  return `¡Hola! Con gusto te oriento sobre tu consulta: **"${prompt}"** 🌸✨\n\n` +
    `En el cuidado de **${childName}** y el bienestar familiar, es clave contar con información clara y práctica:\n\n` +
    `• Si buscas recomendaciones de marcas, productos o equipamiento (coches, cunas, pañales o biberones), indícame qué opciones estás evaluando y te daré una comparativa detallada.\n` +
    `• Si tienes dudas sobre salud, nutrición o cuidados diarios, dime el síntoma o tema específico y te brindaré pautas médicas de apoyo.\n` +
    `• También puedes redactar cartas personalizadas pasando a la pestaña *"Cartas"* arriba.\n\n` +
    `¿Hay algún detalle puntual que te gustaría profundizar?`;
}
