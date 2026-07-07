# 👨‍👩‍👧 Modo Padre (Parent Mode) - TinyWorld

Este documento detalla las funciones específicas que tiene la aplicación para los usuarios con rol `parent`. Toda esta información debe considerarse para construir la interfaz principal (Dashboard) del padre y los flujos hacia el diario.

## 1. Selección de Perfiles (Home del Padre)
Al iniciar sesión, el usuario entra a un panel de selección de perfiles (estilo Netflix/Disney+ pero con diseño premium, cálido y minimalista).
- **Aislamiento de Datos:** Cada padre solo ve los perfiles de sus propios hijos. Ninguna información se comparte con otros usuarios.
- **Avatares Circulares:** Los hijos se muestran como avatares circulares grandes.
- **Estética por Hijo:** Cada hijo tiene un "tema de color" asignado (ej. celeste/verde agua para niño, rosado/amarillo para niña, o neutro taupe/dorado). Esto dicta el color de su avatar, marco y el color principal de su propio diario.
- **Botón "+ Crear Perfil":** Un círculo especial para añadir un nuevo hijo.
- **Gestión:** Botones para editar el nombre, fecha de nacimiento o tema de color del hijo antes de entrar a su diario.

## 2. El Diario Virtual (El Espacio del Hijo)
Una vez que el padre selecciona a un hijo, ingresa al Diario específico de ese hijo.
- **Vista de Álbum:** Una interfaz que simula un libro/álbum físico con hojas que se pueden pasar.
- **Lienzo de Diseño:** Cada página del diario es un lienzo donde el padre puede crear memorias.

## 3. Creador de Memorias (El Editor)
- **Consumo de Assets Globales:** El editor tiene una barra lateral o inferior con pestañas para `Stickers`, `Fondos` y `Cintas`. Estos elementos son los mismos que el Administrador subió a Cloudflare R2 de manera global.
- **Drag & Drop:** Capacidad de arrastrar estos assets desde el menú y soltarlos en la página.
- **Subida de Fotos Personales:** El padre puede subir una o varias fotos locales. Estas fotos se suben y se enlazan específicamente a este hijo (no son globales).
- **Edición Interactiva:**
  - Redimensionar (hacer más grande/pequeño un sticker o foto).
  - Rotar libremente.
  - Superponer (z-index) para poner cintas sobre las fotos.
- **Texto:** Poder añadir cuadros de texto con fuentes tipo "handwriting" (escritura a mano) o premium.

## 4. Compartir y Privacidad
- **Códigos de Acceso:** El padre puede generar un código secreto o link.
- **Vista de Invitado:** Si alguien ingresa con ese código, solo puede *ver* el diario (modo solo lectura), no editar ni ver los otros hijos del padre.

## 5. Estructura de Base de Datos (Relacionada al Padre)
- `profiles`: Tabla principal del usuario (`role: 'parent'`).
- `children`: Tabla con la info de cada hijo (`parent_id`, `name`, `birth_date`, `theme_color`, `avatar_url`).
- `assets`: Las fotos personales subidas por el padre tendrán `is_global = false` y estarán vinculadas a su `created_by`.
- `memories`: Guarda el estado (JSON) de todo lo colocado en una página específica del diario de un niño.
