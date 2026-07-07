# 📋 Gestión de Tareas: TinyWorld

## 🚀 Próximas Tareas (Backlog)
- [ ] **Desarrollo del Álbum:** Interfaz de las hojas de diario y componentes base (Canva-like).
- [ ] **Funcionalidad Editor:** Arrastrar, soltar (Drag & Drop) y redimensionar elementos en la "página".
- [ ] **Configuración de API Externa:** Integrar consejos (Advice Slip API) o datos extra.
- [ ] **Moderación Admin:** Vista específica para borrar contenido inapropiado de usuarios.

## ✅ Tareas Completadas
- [x] **Organización y Arquitectura:** Estructura base, identidad visual (Colores, Glow, Parallax).
- [x] **Base de Datos:** Configuración inicial de Supabase, tablas, roles, enums y triggers.
- [x] **Autenticación (Supabase Auth):** Login unificado para Admin y Familias.
- [x] **Identidad y Navegación Maestra:**
  - Logo Central unificado en todas las interfaces.
  - Menú Maestro con navegación jerárquica (Mis Bebés vs Inicio del Bebé).
  - Lógica de visibilidad condicional para maximizar espacio de edición.
- [x] **Centro Creativo (Perfil Padre):**
  - Gestión de activos privada vs global.
  - Segmentación de Stickers y Fondos.
  - Subida de archivos con validación y visualización instantánea.
- [x] **Panel Administrativo (Desktop & Mobile):**
  - CRUD de Usuarios completo y seguro (Service Role Key).
  - Sistema de modales y toasts para UX premium.
- [x] **Almacenamiento (Cloudflare R2):**
  - Integración total para assets.
  - Sincronización de borrado DB + R2.
