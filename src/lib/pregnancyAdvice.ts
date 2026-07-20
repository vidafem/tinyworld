export interface WeekAdvice {
  health: string;
  love: string;
  todo: string[];
}

export const PREGNANCY_ADVICE: Record<number, WeekAdvice> = {
  1: {
    health: "Comienza a tomar ácido fólico diariamente si aún no lo haces. Mantén una buena hidratación y evita el alcohol y el tabaco por completo.",
    love: "Hablen en pareja sobre sus ilusiones y expectativas iniciales para esta nueva etapa que comienza.",
    todo: ["Comprar prenatal multivitaminas", "Calcular fecha probable de parto aproximada"]
  },
  2: {
    health: "Mantén una dieta equilibrada rica en hierro, calcio y grasas saludables (como aguacate y frutos secos).",
    love: "Tómense un momento para disfrutar de una cena tranquila y conectar emocionalmente antes de que los síntomas físicos aparezcan.",
    todo: ["Establecer hábitos de sueño saludables", "Reducir el consumo de cafeína"]
  },
  3: {
    health: "El cuerpo lúteo está produciendo progesterona para mantener el embarazo. Puedes sentir cansancio extremo; descansa todo lo que necesites.",
    love: "El apoyo emocional empieza ahora. Compañero/a: sé paciente y atento/a con los cambios sutiles de energía.",
    todo: ["Comprar un diario de embarazo para anotar sensaciones", "Evitar pescados con alto contenido de mercurio"]
  },
  4: {
    health: "¡La implantación se ha completado! Bebe al menos 2 litros de agua al día para ayudar al aumento del volumen sanguíneo.",
    love: "Celebren juntos de forma íntima esta primera gran confirmación del embarazo.",
    todo: ["Realizar prueba de embarazo casera si hay retraso", "Agendar primera cita con el obstetra"]
  },
  5: {
    health: "El corazón del embrión empieza a latir. Prioriza alimentos ricos en vitamina C para mejorar la absorción de hierro.",
    love: "Compartan sus miedos y alegrías de forma abierta. La comunicación es clave para afrontar la incertidumbre.",
    todo: ["Hacer una lista de preguntas para el doctor", "Evitar carnes crudas y lácteos no pasteurizados"]
  },
  6: {
    health: "Las náuseas matutinas pueden comenzar. Haz comidas pequeñas y frecuentes para mantener estables los niveles de azúcar.",
    love: "Un masaje suave en la espalda o pies puede ayudar a aliviar el malestar físico inicial.",
    todo: ["Comprar galletas saladas para comer antes de levantarse", "Investigar seguros médicos y coberturas"]
  },
  7: {
    health: "El útero está creciendo del tamaño de un limón. Evita ejercicios de alto impacto y prefiere caminatas suaves.",
    love: "Planeen una cita especial de fin de semana para despejar la mente y enfocarse en ustedes dos.",
    todo: ["Comenzar a tomar fotos de la pancita semana a semana", "Descargar una app de seguimiento de embarazo"]
  },
  8: {
    health: "La progesterona puede ralentizar la digestión causando estreñimiento. Aumenta el consumo de fibra con frutas y verduras.",
    love: "Escuchen música relajante juntos por las noches para reducir el estrés del día.",
    todo: ["Elegir ropa interior cómoda y sin costuras", "Revisar qué medicamentos en casa son seguros"]
  },
  9: {
    health: "El volumen de sangre sigue aumentando y puedes sentir mareos. Levántate despacio después de estar sentada o acostada.",
    love: "Dediquen tiempo a hablar del futuro bebé y qué valores les gustaría transmitirle.",
    todo: ["Anotar dudas sobre los exámenes del primer trimestre", "Mantenerse bien abrigada y evitar cambios bruscos de temperatura"]
  },
  10: {
    health: "Tus hormonas están en su punto máximo. Si tienes antojos extraños, intenta satisfacerlos con opciones saludables.",
    love: "Hagan una caminata corta al atardecer tomados de la mano para conectar con la naturaleza.",
    todo: ["Planificar cómo dar la noticia a familiares cercanos", "Comenzar a usar crema antiestrías en abdomen y pecho"]
  },
  11: {
    health: "Los riñones del bebé ya producen orina. Mantente bien hidratada para renovar constantemente el líquido amniótico.",
    love: "Compañero/a: asume más tareas del hogar esta semana para que mamá descanse adecuadamente.",
    todo: ["Confirmar fecha para la ecografía genética (semana 11-14)", "Investigar ejercicios de suelo pélvico (Kegel)"]
  },
  12: {
    health: "El riesgo de aborto espontáneo disminuye drásticamente ahora. Continúa con tus suplementos de ácido fólico y hierro.",
    love: "¡Momento de celebrar! Compartan la gran noticia con sus amigos cercanos e inmortalicen el día con una foto.",
    todo: ["Disfrutar de ver al bebé moverse en la ecografía de la semana 12", "Escribir una carta al bebé sobre cómo se enteraron de su llegada"]
  },
  13: {
    health: "Entras al segundo trimestre. Tu energía debería empezar a volver. Aprovecha para realizar actividad física moderada.",
    love: "Es un buen momento para planear una escapada romántica de fin de semana ('babymoon').",
    todo: ["Agendar cita con el dentista (la salud dental es vital en el embarazo)", "Comenzar a buscar ropa de maternidad cómoda"]
  },
  14: {
    health: "El bebé practica movimientos respiratorios. Consume suficiente calcio (yogurt, ajonjolí, almendras) para sus huesos.",
    love: "Comiencen a armar una lista conjunta de nombres favoritos para el bebé.",
    todo: ["Actualizar el álbum de fotos del primer trimestre", "Realizar estiramientos suaves de espalda por la mañana"]
  },
  15: {
    health: "La piel del bebé es muy delgada. Protégete del sol con bloqueador físico, ya que las hormonas pueden causar manchas en la piel.",
    love: "Lean un libro sobre paternidad o crianza juntos y comenten sus puntos de vista.",
    todo: ["Comprar una almohada de lactancia o de cuerpo entero para dormir", "Monitorear la presión arterial de vez en cuando"]
  },
  16: {
    health: "El bebé ya puede oír. Háblale y ponle música suave. Evita la exposición a ruidos extremadamente fuertes.",
    love: "Canten o léanle cuentos al bebé en pareja por las noches. Él ya reconoce sus voces.",
    todo: ["Agendar la ecografía morfológica del segundo trimestre (semana 20)", "Hacer una lista de artículos esenciales para el cuarto del bebé"]
  },
  17: {
    health: "El esqueleto del bebé se está endureciendo. Asegúrate de consumir suficiente vitamina D para ayudar a fijar el calcio.",
    love: "Tómense fotos juntos mostrando el crecimiento de la pancita en un lugar especial.",
    todo: ["Hacer ejercicios de respiración para relajación", "Revisar los requisitos de licencia de maternidad/paternidad"]
  },
  18: {
    health: "Los movimientos del bebé se vuelven más coordinados. Duerme del lado izquierdo para mejorar el flujo de sangre a la placenta.",
    love: "Tengan una conversación honesta sobre cómo planean dividir los roles al inicio de la llegada del bebé.",
    todo: ["Comenzar a buscar cunas y sistemas de retención infantil para el auto", "Evitar estar de pie por periodos prolongados"]
  },
  19: {
    health: "Se forma la capa protectora vernix caseosa. Si sientes picazón en la panza, aplica crema hidratante con masajes circulares suaves.",
    love: "Planifiquen una tarde de juegos o películas relajantes en casa, desconectados de las preocupaciones diarias.",
    todo: ["Inscribirse en un curso de preparación para el parto", "Hacer compras de prendas básicas para el bebé"]
  },
  20: {
    health: "¡Llegaste a la mitad del camino! Si sientes dolor en la pelvis o espalda baja, un cinturón de soporte de maternidad puede ayudar.",
    love: "Disfruten del hito de la semana 20. Hagan algo especial para consentirse mutuamente.",
    todo: ["Asistir a la ecografía morfológica detallada", "Verificar las medidas de la cuna y espacio en la habitación"]
  },
  21: {
    health: "El sistema digestivo del bebé absorbe nutrientes del líquido amniótico. Prioriza grasas saludables como omega-3 para su cerebro.",
    love: "Compañero/a: acaricia la pancita con aceites naturales y habla con el bebé.",
    todo: ["Hacer caminatas diarias de 20 a 30 minutos", "Comprar los primeros pañales para recién nacido"]
  },
  22: {
    health: "Las cejas y pestañas están terminadas. Vigila la hinchazón en pies y tobillos; descansa con las piernas elevadas.",
    love: "Dedíquense palabras de aliento y reconocimiento. El embarazo requiere un gran esfuerzo físico y mental.",
    todo: ["Preparar la lista de regalos o Baby Shower si planean hacer uno", "Hacer una sesión de fotos casera del embarazo"]
  },
  23: {
    health: "El bebé nota su posición gracias al desarrollo del oído interno. Mantén una postura erguida para evitar dolores de espalda.",
    love: "Escuchen los latidos del corazón del bebé apoyando el oído en la panza (es un momento mágico).",
    todo: ["Averiguar sobre la prueba de tolerancia a la glucosa (semana 24-28)", "Elegir la temática de colores para el cuarto del bebé"]
  },
  24: {
    health: "Los pulmones empiezan a producir surfactante. Bebe agua de coco o infusiones permitidas para evitar infecciones urinarias.",
    love: "Salgan a cenar a su restaurante favorito y hablen de temas no relacionados al embarazo para mantener viva la chispa.",
    todo: ["Realizar el test de O'Sullivan (glucosa)", "Empezar a diseñar las invitaciones para el Baby Shower"]
  },
  25: {
    health: "La grasa subcutánea empieza a acumularse. Si tienes acidez estomacal, evita comer justo antes de acostarte y disminuye condimentos.",
    love: "Hagan planes individuales con amigos también para mantener sus espacios personales sanos.",
    todo: ["Buscar un pediatra de confianza recomendado por amigos", "Comprar el bolso que llevarán a la clínica"]
  },
  26: {
    health: "El bebé abre los ojos por primera vez. Realiza estiramientos diarios de pantorrillas para evitar los molestos calambres nocturnos.",
    love: "Preparen juntos una cena especial en casa y decoren la mesa con velas.",
    todo: ["Practicar posturas de yoga prenatal para abrir la pelvis", "Lavar la primera tanda de ropita de bebé con jabón neutro"]
  },
  27: {
    health: "El bebé reconoce claramente tu voz. Cántale canciones de cuna sencillas que luego puedas usar para calmarlo al nacer.",
    love: "Compartan un momento de meditación conjunta enfocados en respirar al mismo ritmo.",
    todo: ["Agendar vacuna correspondiente al tercer trimestre", "Comenzar a armar el botiquín básico del bebé"]
  },
  28: {
    health: "Entras en el tercer trimestre. El peso del bebé puede dificultar tu respiración. Tómate las cosas con más calma y disminuye el ritmo.",
    love: "Es normal sentir ansiedad por el parto. Apóyense mutuamente y recuerden que son un equipo.",
    todo: ["Revisar el plan de parto y opciones de anestesia con el médico", "Comprar protectores de lactancia y cremas para pezones"]
  },
  29: {
    health: "El bebé se mueve con fuerza. Lleva un registro mental de sus movimientos diarios. Si notas una disminución drástica, consulta al médico.",
    love: "Disfruten de una tarde de masajes relajantes mutuos en un ambiente tranquilo.",
    todo: ["Dejar listos los documentos de identidad para el ingreso hospitalario", "Comenzar a congelar algunas comidas saludables para el posparto"]
  },
  30: {
    health: "La médula espinal produce glóbulos rojos. Aumenta alimentos ricos en hierro combinados con cítricos para evitar la anemia.",
    love: "Escriban juntos una carta de bienvenida que leerán al bebé el día de su nacimiento.",
    todo: ["Instalar la silla del auto para el bebé y practicar cómo ajustarla", "Comprar el extractor de leche si planean usar uno"]
  },
  31: {
    health: "El bebé ya gira la cabeza. Si tienes retención de líquidos, disminuye el exceso de sal en las comidas y consume piña natural.",
    love: "Hagan una lista de canciones suaves que les gustaría escuchar durante el trabajo de parto.",
    todo: ["Tener listo el bolso del hospital para mamá, papá y el bebé", "Comprar camisas de maternidad con botones al frente"]
  },
  32: {
    health: "El bebé practica la respiración constantemente. Realiza ejercicios de respiración consciente 10 minutos al día para prepararte.",
    love: "Tómense un día completo de descanso absoluto en cama, consintiéndose con el desayuno a la cama.",
    todo: ["Definir quién cuidará de las mascotas o hijos mayores durante el parto", "Confirmar los datos de contacto de emergencia de tu médico"]
  },
  33: {
    health: "Los huesos del cráneo siguen flexibles. Si sientes acidez severa, duerme con la cabeza ligeramente elevada usando dos almohadas.",
    love: "Hagan un repaso mental de todo el camino recorrido hasta ahora y siéntanse orgullosos/as.",
    todo: ["Comenzar masajes perineales para preparar los tejidos para el parto", "Agendar ecografía de crecimiento del tercer trimestre"]
  },
  34: {
    health: "El bebé recibe tus anticuerpos protectores. Mantén una dieta rica en nutrientes y evita lugares con aglomeraciones y personas enfermas.",
    love: "Tengan una sesión de abrazos prolongados para liberar oxitocina, la hormona del amor y del parto.",
    todo: ["Asegurar pañales, toallitas húmedas y cremas protectoras en casa", "Hacer un simulacro de ruta al hospital midiendo tiempos"]
  },
  35: {
    health: "El lanugo desaparece casi por completo. Sigue moviéndote de forma suave; el yoga en silla o estiramientos sencillos son ideales.",
    love: "Disfruten de su Baby Shower si se realiza esta semana y agradezcan el cariño de sus seres queridos.",
    todo: ["Organizar los regalos recibidos y lavar lo que el bebé usará primero", "Esterilizar biberones y chupones de repuesto"]
  },
  36: {
    health: "El bebé suele colocarse de cabeza para nacer. Si sientes contracciones de Braxton Hicks (falsas), cambia de posición o descansa.",
    love: "Dediquen tiempo a mimarse a solas antes de la llegada del bebé. Su relación es la base de la nueva familia.",
    todo: ["Agendar citas de control semanales con el obstetra", "Hacer compras de alimentos no perecederos para la despensa"]
  },
  37: {
    health: "El bebé se considera a término. Si rompes bolsa o tienes contracciones regulares cada 5 minutos por 1 hora, acude al hospital.",
    love: "Mantengan la calma ante el inminente nacimiento. Todo saldrá bien si confían en su instinto.",
    todo: ["Tener cargada la batería del celular y cámara", "Revisar que la cuna esté completamente vestida y lista"]
  },
  38: {
    health: "El bebé sigue acumulando grasa. Come alimentos ligeros y de fácil digestión para no recargar tu estómago.",
    love: "Abrácense fuerte y disfruten de los últimos días de la pancita.",
    todo: ["Descansar y tomar siestas durante el día si pasas mala noche", "Tener a mano el número de una asesora de lactancia de confianza"]
  },
  39: {
    health: "El cuello uterino puede empezar a borrarse y dilatarse. Camina distancias cortas y realiza círculos suaves sobre una pelota de pilates.",
    love: "Hagan un pacto de paciencia y comprensión mutua para las primeras semanas de posparto.",
    todo: ["Monitorear contracciones con una app de cronómetro si inician", "Mantener la mente positiva y visualizar un parto tranquilo"]
  },
  40: {
    health: "¡Llegó la fecha estimada! Solo el 5% de los bebés nace exactamente hoy. Mantente activa pero sin agotarte física ni mentalmente.",
    love: "¡Cualquier momento es el indicado! Manténganse unidos, listos y emocionados.",
    todo: ["Disfrutar de los últimos momentos de paz y silencio", "Hacer una comida especial de celebración en casa"]
  },
  41: {
    health: "El bebé está completamente desarrollado. Tu médico controlará el líquido amniótico y los latidos con más frecuencia.",
    love: "Apóyense mutuamente frente a las preguntas ansiosas de familiares. Mantengan su burbuja de paz.",
    todo: ["Caminar sobre superficies planas para estimular de forma natural", "Tomar duchas de agua templada para relajar los músculos"]
  },
  42: {
    health: "¡La dulce espera llega a su fin! Confía en tu equipo médico si es necesario programar una inducción para el bienestar de ambos.",
    love: "¡Felicidades! Han hecho un trabajo increíble. Comienza la aventura más hermosa de sus vidas.",
    todo: ["Ingresar al hospital con tranquilidad y alegría", "Dar la bienvenida a su hermoso bebé con los brazos abiertos"]
  }
};
