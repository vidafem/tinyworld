# Guía Maestra: Pregnancy Calendar "Artesanal" v1.5

Este documento es la fuente de verdad para el desarrollo y mantenimiento del módulo de Calendario de Embarazo. **REGLA DE ORO:** Cualquier IA que trabaje en este archivo debe respetar la estética artesanal, la libertad de movimiento de los stickers y la composición ultra-panorámica.

## 🎨 ADN del Diseño (Look & Feel)
- **Tablero "Cine-Scope":** Ancho fijo de **2100px**. Es un lienzo masivo diseñado para navegación fluida mediante `drag-to-pan`.
- **Fondo:** `#FDFBF7` (crema artesanal) con textura de papel sutil.
- **Marcos de Fotos (Grilla):** Proporción horizontal **1.2:1** (aspect-ratio). Bordes blancos de 14px con sombras internas y externas que simulan profundidad real.
- **Marco Hero (Retrato):** Foto "Mi primer día" con proporción **3.2:5** (alargada). Es el ancla visual del tablero.
- **Tipografía:** 
  - Título: *Outfit Black* (tracking extremo 1em).
  - Nombre: *Dancing Script* (fluido y elegante).

## 🛠️ Sistema de Edición de Objetos (Contextual)
- **Independencia Total:** El Título y el Nombre son objetos separados. Cada uno tiene sus propios controles de **Color** y **Tamaño de Fuente**.
- **Activación por Selección:** Los controles de edición (sliders y paletas) solo aparecen en la barra superior cuando el usuario hace clic en el objeto específico (Título o Nombre).
- **Barra Superior Inteligente:** 
  - **Nivel 1:** Navegación, Zoom y Guardar.
  - **Nivel 2 (Dinámico):** Controles de edición que se deslizan hacia abajo solo cuando hay un objeto seleccionado. Soporta swipe lateral en móviles.

## 🐝 Gestión de Stickers y Elementos Hero
- **Stickers de Grilla:** Sistema de anclaje de 7 puntos por foto.
- **Sticker Hero (Abeja):** Elemento de gran escala nivelado horizontalmente con la foto Hero. No debe tener sombras artificiales (`drop-shadow`) para mantener la pureza del arte.
- **Controles XL:** Todos los botones de edición de stickers (agrandar, rotar, borrar) son de tamaño aumentado para facilitar el uso táctil.

## 💾 Persistencia de Datos (Supabase)
- **Tabla:** `pregnancy_calendars`
- **Configuración JSONB (`layout_config`):** Se almacenan aquí todos los estados visuales para evitar rigidez en el esquema:
  ```json
  {
    "rows": 3,
    "cols": 4,
    "heroSize": 450,
    "heroRotation": 0,
    "nameColor": "#E91E63",
    "nameFontSize": 200,
    "titleColor": "#4A4238",
    "titleFontSize": 50
  }
  ```

## 📸 Exportación (Download)
- La función `downloadImage` clona el tablero a tamaño real (2100px), purga todos los elementos de UI con la clase `.no-export` y genera un PNG a escala 2x para calidad de impresión.

---
*Nota: Siempre verificar la alineación de la abeja con la foto hero tras cambios estructurales.*
