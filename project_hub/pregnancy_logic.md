# Bitácora de Desarrollo: Módulo Embarazo

Este documento detalla la lógica acordada para las tres funcionalidades principales del apartado de Embarazo.

## 1. Gestión de Recuerdos (Memories)
- **Flujo:** El usuario selecciona una fecha (pasada o presente), añade título, descripción y hasta 3 archivos multimedia.
- **Validaciones:** 
  - Videos limitados a 12 segundos (validación en cliente).
  - Máximo 3 imágenes por entrada.
- **Persistencia:** Tabla `pregnancy_memories` en Supabase con ordenación cronológica por- **Recuerdos (Listado):** Vista de filas finas con fecha, titulo y miniatura. Botones de editar/borrar.
- **Formulario Maestro:** Usado tanto para crear como para editar recuerdos existentes.
- **Conexion Supabase:** Persistencia real en la tabla `pregnancy_memories`.
- **Calendario (Vista):** Cuadricula interactiva con seleccion de fotos de los recuerdos guardados.cción de foto destacada del mes.
  - Edición de "Pie de foto" (Ej: Semanas 1 a 3).
  - Capa de stickers (posicionamiento absoluto sobre el canvas).
- **Tecnología de Exportación:** Conversión de DOM a Imagen (PNG/JPG) para descarga local, separando la vista de edición de los datos de base de datos.

## 3. Álbum de Embarazo (Libro Digital)
- **Interfaz:** Basada en la animación de apertura de libro de Heyzine.
- **Contenido:** Poblado automáticamente por los datos del punto #1.
- **Customización:**
  - Marcos dinámicos para las fotos.
  - Cambio de temas y fondos por página.
  - Modo edición vs Modo lectura.

---
## 🌟 Estándar Global de Interfaz (Molde Maestro)
Se ha definido que el diseño del **MemoryForm** (Cabecera con fecha custom + Tarjetas multimedia finas) será el estándar para todos los ingresos de datos en la aplicación para mantener coherencia visual.

*Plan detallado el 13 de mayo de 2026.*
