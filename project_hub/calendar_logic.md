# Diseño y Lógica: Calendario "TinyWorld Board"

Este documento define la estructura para el calendario mensual interactivo basado en las referencias de cuadros físicos de madera.

## 🎨 Estética Visual
- **Fondo:** Textura de arena (#F5F2EB) con bordes de "madera blanca" (border-8 white).
- **Tipografía:** 
  - Título: Sans-serif elegante en mayúsculas.
  - Nombre: Script/Manuscrita de gran tamaño con colores del tema.
- **Marca de Agua:** Logo `public/logo.png` en el footer derecho, tamaño 40px, opacidad 0.1.

## 🏗️ Estructura del Componente
- **Sección Superior:**
  - Foto "Hito 0" (3/4 aspect ratio).
  - Título y Nombre dinámicos.
  - Ilustración PNG central (Bee/Rainbow/etc).
- **Grid de Fotos:**
  - Configuración inicial: 3x3 (9 meses).
  - Configuración extendida: 3x4 (12 meses) o 4x3.
  - Cada slot de foto tiene una sombra interior y un marco sutil.

## 🛠️ Herramientas de Edición
- **Selector de Imagen:** Modal con carrusel filtrado por los recuerdos guardados en `pregnancy_memories`.
- **Sistema de Stickers:** Capa absoluta (`z-index`) para posicionar elementos decorativos con `framer-motion` (drag).
- **Edición Inline:** Clic en el texto para cambiar el título o el nombre del bebé.

## 💾 Persistencia de Datos
- Tabla `pregnancy_calendars`:
  - `child_id`: FK.
  - `layout`: JSON (posiciones de fotos y textos).
  - `elements`: JSON (posiciones y tipos de stickers).
  - `base_image`: URL del resultado final generado.

---
*Planificación aprobada el 13 de mayo de 2026.*
