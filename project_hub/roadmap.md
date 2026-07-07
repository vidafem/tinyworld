# 🗺️ Roadmap Estratégico: TinyWorld

Este plan divide la ejecución en fases lógicas para asegurar la estabilidad y el diseño premium.

## Fase 1: Motor Administrativo e Infraestructura (✅ Completado)
1. **Configuración de Supabase:** Diseño de tablas (`users`, `assets`), roles y RLS.
2. **Sistema de Auth:** Implementación de Login para Admin y Padres.
3. **Gestión de Contenido y R2:** Integración con Cloudflare R2 para subir/borrar globalmente (stickers, fondos, cintas). Panel Admin Finalizado (sin alertas nativas).

## Fase 2: Cimientos del Álbum y Editor (🚧 En Progreso / Próximo)
1. **Perfiles de Hijos:** Lógica para que un `parent` pueda crear perfiles de sus hijos.
2. **Librería de Componentes:** Creación de componentes base para el Álbum (Hoja, Contenedor, Transiciones).
3. **Editor Básico (Canva-like):** Drag & Drop y redimensionamiento sobre la "página" consumiendo los assets desde R2.

## Fase 3: Integración Externa y Detalles (Pendiente)
1. **Integración de API Externa:** Implementación de API de consejos o clima histórico para memorias.
2. **Sistema de Memoria:** Guardar la posición, rotación y tamaño de los stickers colocados por los usuarios en la base de datos.

## Fase 4: Pulido y Experiencia Móvil (Pendiente)
1. **Micro-animaciones:** Refinar transiciones del Álbum.
2. **Optimización Táctil:** Asegurar que el Drag & Drop funcione de manera impecable en dispositivos móviles.
3. **QA y Pruebas:** Verificación final de seguridad, límites de R2 y permisos.
