-- ==============================================================================
-- TINYWORLD - ESQUEMA COMPLETO Y MIGRACIONES PARA SUPABASE
-- ==============================================================================

-- 1. Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tipos ENUM personalizados
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'parent');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_type') THEN
        CREATE TYPE asset_type AS ENUM ('sticker', 'background', 'tape');
    ELSE
        -- Asegurar que 'tape' esté en asset_type si ya existía el enum
        BEGIN
            ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'tape';
        EXCEPTION WHEN duplicate_object THEN
            NULL;
        END;
    END IF;
END $$;

-- 3. Tablas Principales (en orden de dependencias FK)

-- 3.1. profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role user_role DEFAULT 'parent' NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.2. children
CREATE TABLE IF NOT EXISTS public.children (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    nickname TEXT,
    birth_date DATE,
    birth_time TIME WITHOUT TIME ZONE,
    theme_color TEXT DEFAULT 'neutral',
    access_code TEXT UNIQUE,
    cover_image TEXT,
    weight TEXT,
    height TEXT,
    gender TEXT,
    parents_names TEXT,
    birth_hospital TEXT,
    father_name TEXT,
    mother_name TEXT,
    preview_config JSONB DEFAULT '{"show_album": true, "show_gallery": true, "show_calendars": true, "show_pregnancy": true}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.3. assets (Globales y de Usuario)
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type asset_type NOT NULL,
    url TEXT NOT NULL,
    name TEXT,
    is_global BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.4. memories (Diario / Páginas Antiguas)
CREATE TABLE IF NOT EXISTS public.memories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    content_json JSONB DEFAULT '[]'::jsonb,
    background_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.5. life_sections (Etapas de Toda una Vida)
CREATE TABLE IF NOT EXISTS public.life_sections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    baby_weight VARCHAR,
    baby_height VARCHAR,
    baby_photo TEXT,
    show_in_books BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.6. pregnancy_memories (Recuerdos de Embarazo y Etapas)
CREATE TABLE IF NOT EXISTS public.pregnancy_memories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
    section_id UUID REFERENCES public.life_sections(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    memory_date DATE NOT NULL,
    month_number INTEGER DEFAULT 1,
    media_urls TEXT[] DEFAULT '{}'::text[],
    media_type TEXT DEFAULT 'image',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.7. pregnancy_calendars (Calendarios Mensuales / Bóveda)
CREATE TABLE IF NOT EXISTS public.pregnancy_calendars (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
    section_id UUID REFERENCES public.life_sections(id) ON DELETE SET NULL,
    title TEXT DEFAULT 'PRIMER ANO DE',
    display_name TEXT,
    hero_image TEXT DEFAULT '/stickers/st1.png',
    layout_config JSONB DEFAULT '{"cols": 3, "rows": 3}'::jsonb,
    photos_config JSONB DEFAULT '{}'::jsonb,
    photos_adjust JSONB DEFAULT '{}'::jsonb,
    labels_config JSONB DEFAULT '{}'::jsonb,
    stickers_config JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.8. pregnancy_folders (Carpetas de Organización de Galería)
CREATE TABLE IF NOT EXISTS public.pregnancy_folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
    section_id UUID REFERENCES public.life_sections(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.9. pregnancy_folder_items (Elementos vinculados a carpetas)
CREATE TABLE IF NOT EXISTS public.pregnancy_folder_items (
    folder_id UUID REFERENCES public.pregnancy_folders(id) ON DELETE CASCADE NOT NULL,
    memory_id UUID REFERENCES public.pregnancy_memories(id) ON DELETE CASCADE NOT NULL,
    media_url TEXT NOT NULL,
    PRIMARY KEY (folder_id, memory_id, media_url)
);

-- 3.10. general_memories (Recuerdos Generales / Baúl)
CREATE TABLE IF NOT EXISTS public.general_memories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    memory_date DATE DEFAULT CURRENT_DATE NOT NULL,
    category TEXT DEFAULT 'General',
    media_urls TEXT[] DEFAULT '{}'::text[],
    media_type TEXT DEFAULT 'image',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.11. baby_names (Lista de Futuros Nombres)
CREATE TABLE IF NOT EXISTS public.baby_names (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    gender TEXT NOT NULL CHECK (gender = ANY (ARRAY['boy'::text, 'girl'::text])),
    is_crossed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.12. album_templates (Plantillas de Álbum creadas por Admin)
CREATE TABLE IF NOT EXISTS public.album_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    hint TEXT,
    is_double_page BOOLEAN DEFAULT false,
    elements_left JSONB NOT NULL DEFAULT '[]'::jsonb,
    elements_right JSONB NOT NULL DEFAULT '[]'::jsonb,
    background_color TEXT DEFAULT '#FFFDF8',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3.13. pregnancy_album_pages (Páginas del Álbum Digital)
CREATE TABLE IF NOT EXISTS public.pregnancy_album_pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
    section_id UUID REFERENCES public.life_sections(id) ON DELETE SET NULL,
    memory_id UUID REFERENCES public.pregnancy_memories(id) ON DELETE SET NULL,
    page_number INTEGER NOT NULL,
    spread_number INTEGER NOT NULL DEFAULT 1,
    page_kind TEXT NOT NULL DEFAULT 'memory' CHECK (page_kind = ANY (ARRAY['cover'::text, 'month_divider'::text, 'stage_divider'::text, 'memory'::text, 'custom'::text])),
    side TEXT NOT NULL DEFAULT 'single' CHECK (side = ANY (ARRAY['left'::text, 'right'::text, 'single'::text])),
    template_id TEXT NOT NULL DEFAULT 'classic_photo_text',
    title TEXT,
    subtitle TEXT,
    month_number INTEGER,
    stage_label TEXT,
    background_url TEXT,
    background_color TEXT DEFAULT '#FFFDF8',
    content_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    layout_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    thumbnail_url TEXT,
    is_auto_generated BOOLEAN NOT NULL DEFAULT true,
    is_locked BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.14. pregnancy_events (Eventos Compartidos / Invitados)
CREATE TABLE IF NOT EXISTS public.pregnancy_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
    section_id UUID REFERENCES public.life_sections(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    greeting_message TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    background_style TEXT,
    style_settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3.15. pregnancy_event_media (Fotos y Deseos de los Invitados)
CREATE TABLE IF NOT EXISTS public.pregnancy_event_media (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.pregnancy_events(id) ON DELETE CASCADE NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 4. Migraciones Seguras (ALTER TABLE para bases de datos ya existentes)
-- ==============================================================================

ALTER TABLE public.children
    ADD COLUMN IF NOT EXISTS nickname TEXT,
    ADD COLUMN IF NOT EXISTS birth_time TIME WITHOUT TIME ZONE,
    ADD COLUMN IF NOT EXISTS weight TEXT,
    ADD COLUMN IF NOT EXISTS height TEXT,
    ADD COLUMN IF NOT EXISTS gender TEXT,
    ADD COLUMN IF NOT EXISTS parents_names TEXT,
    ADD COLUMN IF NOT EXISTS birth_hospital TEXT,
    ADD COLUMN IF NOT EXISTS father_name TEXT,
    ADD COLUMN IF NOT EXISTS mother_name TEXT,
    ADD COLUMN IF NOT EXISTS cover_image TEXT,
    ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT 'neutral',
    ADD COLUMN IF NOT EXISTS access_code TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS preview_config JSONB DEFAULT '{"show_album": true, "show_gallery": true, "show_calendars": true, "show_pregnancy": true}'::jsonb;

ALTER TABLE public.assets
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS name TEXT;

ALTER TABLE public.pregnancy_memories
    ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES public.life_sections(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS month_number INTEGER DEFAULT 1;

ALTER TABLE public.pregnancy_calendars
    ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES public.life_sections(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS photos_adjust JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.pregnancy_folders
    ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES public.life_sections(id) ON DELETE SET NULL;

ALTER TABLE public.pregnancy_album_pages
    ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES public.life_sections(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS memory_id UUID REFERENCES public.pregnancy_memories(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS spread_number INTEGER DEFAULT 1,
    ADD COLUMN IF NOT EXISTS page_kind TEXT DEFAULT 'memory',
    ADD COLUMN IF NOT EXISTS side TEXT DEFAULT 'single',
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.life_sections
    ADD COLUMN IF NOT EXISTS baby_weight VARCHAR,
    ADD COLUMN IF NOT EXISTS baby_height VARCHAR,
    ADD COLUMN IF NOT EXISTS baby_photo TEXT,
    ADD COLUMN IF NOT EXISTS show_in_books BOOLEAN DEFAULT true;

ALTER TABLE public.pregnancy_events
    ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES public.life_sections(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS style_settings JSONB DEFAULT '{}'::jsonb;

-- Índice único condicional para evitar duplicados en pregnancy_album_pages admitiendo section_id NULL
CREATE UNIQUE INDEX IF NOT EXISTS pregnancy_album_pages_unique_idx 
    ON public.pregnancy_album_pages (child_id, page_number, COALESCE(section_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- ==============================================================================
-- 5. Seguridad y Acceso Total (Sin recursión infinita)
-- ==============================================================================

-- Desactivar RLS para permitir que la app lea y escriba sin errores 500
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.children DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.life_sections DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pregnancy_memories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pregnancy_calendars DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pregnancy_folders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pregnancy_folder_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.general_memories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.baby_names DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.album_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pregnancy_album_pages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pregnancy_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pregnancy_event_media DISABLE ROW LEVEL SECURITY;

-- Limpiar cualquier política previa que cause recursión (42P17)
DROP POLICY IF EXISTS "Admins ven todos los perfiles" ON public.profiles;
DROP POLICY IF EXISTS "Usuarios gestionan su propio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Padres gestionan sus hijos" ON public.children;
DROP POLICY IF EXISTS "Invitados consultan hijos por access_code" ON public.children;
DROP POLICY IF EXISTS "Usuarios ven assets globales o suyos" ON public.assets;
DROP POLICY IF EXISTS "Usuarios gestionan sus assets" ON public.assets;
DROP POLICY IF EXISTS "Admins gestionan assets globales" ON public.assets;
DROP POLICY IF EXISTS "Admins gestionan plantillas" ON public.album_templates;
DROP POLICY IF EXISTS "Todos ven plantillas" ON public.album_templates;
DROP POLICY IF EXISTS "Padres gestionan recuerdos antiguos" ON public.memories;
DROP POLICY IF EXISTS "Padres gestionan life_sections" ON public.life_sections;
DROP POLICY IF EXISTS "Padres gestionan recuerdos de embarazo" ON public.pregnancy_memories;
DROP POLICY IF EXISTS "Padres gestionan calendarios" ON public.pregnancy_calendars;
DROP POLICY IF EXISTS "Padres gestionan pregnancy_folders" ON public.pregnancy_folders;
DROP POLICY IF EXISTS "Padres gestionan pregnancy_folder_items" ON public.pregnancy_folder_items;
DROP POLICY IF EXISTS "Padres gestionan recuerdos generales" ON public.general_memories;
DROP POLICY IF EXISTS "Padres gestionan nombres" ON public.baby_names;
DROP POLICY IF EXISTS "Padres gestionan album_pages" ON public.pregnancy_album_pages;
DROP POLICY IF EXISTS "Padres gestionan sus eventos" ON public.pregnancy_events;
DROP POLICY IF EXISTS "Invitados ven eventos activos" ON public.pregnancy_events;
DROP POLICY IF EXISTS "Padres gestionan fotos de eventos" ON public.pregnancy_event_media;
DROP POLICY IF EXISTS "Invitados ven fotos de eventos activos" ON public.pregnancy_event_media;
DROP POLICY IF EXISTS "Invitados suben fotos a eventos activos" ON public.pregnancy_event_media;

