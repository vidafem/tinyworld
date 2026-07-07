# 🎨 Características y Funcionalidades: TinyWorld

## 🏠 Home (Pantalla de Inicio)
- **Efecto Parallax 3D:** Los objetos (nubes, estrellas, stickers) se desvanecen y mueven al hacer scroll.
- **Sección Informativa:** Explica la propuesta de valor (álbum interactivo, cápsula del tiempo).
- **Responsive:** Diseño diferenciado para `DesktopHome` y `MobileHome`.

## 🔑 Acceso y Usuarios
- **Admin (Padre/Madre):** Control total (crear perfiles, subir stickers globales, gestionar hijos, moderación de activos de todos los usuarios).
- **Padres (Usuarios Normales):** Gestión de sus propios hijos y centro creativo personal (subida de stickers y fondos privados).
- **Invitados (Código):** Acceso de solo lectura a un perfil específico.

## 🧭 Navegación e Identidad
- **Logo Institucional:** Presencia central en todas las cabeceras para reforzar la identidad de marca.
- **Menú Maestro Abatible:** Acceso universal a Inicio, Perfil y Logout desde cualquier punto de la app.
- **Navegación Inteligente:** Flujo jerárquico que permite moverse entre subsecciones del bebé sin perder el contexto.

## 📖 El Álbum Virtual y Calendario
- **Efecto de Página:** Simulación de paso de hoja física.
- **Editor tipo Canva:**
    - **Stickers:** Imágenes PNG arrastrables y escalables.
    - **Fondos:** Diseños que se ajustan al tamaño de la hoja.
    - **Marcos y Texto:** Decoración personalizada para cada foto (Clásico, Polaroid, Madera, Oro, etc.).
- **Sincronización:** Los activos del Admin son globales; los de usuarios son privados.

## ☁️ Infraestructura
- **Supabase:** Base de datos relacional y autenticación.
- **Cloudflare R2:** Almacenamiento optimizado para stickers y fotos de alta calidad.
