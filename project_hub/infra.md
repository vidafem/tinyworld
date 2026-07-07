# 🛠️ Infraestructura y Base de Datos

## 🗄️ Supabase (Esquema de Tablas)

### 1. `profiles`
- `id`: UUID (FK a auth.users)
- `role`: enum ('admin', 'parent')
- `full_name`: text

### 2. `children`
- `id`: UUID (PK)
- `parent_id`: UUID (FK a profiles)
- `name`: text
- `birth_date`: date
- `access_code`: text (unique)

### 3. `assets` (Stickers y Fondos)
- `id`: UUID (PK)
- `type`: enum ('sticker', 'background')
- `url`: text (Cloudflare R2)
- `is_global`: boolean (true si lo sube el admin)
- `created_by`: UUID (FK a profiles)

### 4. `memories` (Páginas del Álbum)
- `id`: UUID (PK)
- `child_id`: UUID (FK a children)
- `content_json`: jsonb (Posiciones de fotos, stickers, textos)

## ☁️ Cloudflare R2
- **Bucket:** `tinyworld-assets`
- **Estructura:**
    - `/global/stickers/`
    - `/global/backgrounds/`
    - `/users/[user_id]/stickers/`
    - `/children/[child_id]/photos/`
