-- 1. Tipos
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'parent');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'asset_type') THEN
        CREATE TYPE asset_type AS ENUM ('sticker', 'background');
    END IF;
END $$;

-- 2. Tablas
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role user_role DEFAULT 'parent' NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.children (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    nickname TEXT,
    birth_date DATE,
    birth_time TIME,
    theme_color TEXT DEFAULT 'neutral',
    access_code TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type asset_type NOT NULL,
    url TEXT NOT NULL,
    is_global BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.memories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    content_json JSONB DEFAULT '[]'::jsonb,
    background_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pregnancy_memories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    memory_date DATE NOT NULL,
    media_urls TEXT[] DEFAULT '{}',
    media_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pregnancy_calendars (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE,
    title TEXT DEFAULT 'PRIMER ANO DE',
    display_name TEXT,
    hero_image TEXT DEFAULT '/stickers/st1.png',
    layout_config JSONB DEFAULT '{"rows": 3, "cols": 3}',
    photos_config JSONB DEFAULT '{}',
    labels_config JSONB DEFAULT '{}',
    stickers_config JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2.1. Migraciones seguras para bases ya creadas
ALTER TABLE public.pregnancy_calendars
    ADD COLUMN IF NOT EXISTS photos_adjust JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.pregnancy_memories
    ADD COLUMN IF NOT EXISTS month_number INTEGER DEFAULT 1;

-- Compatibilidad con pantallas que separan assets globales y del usuario.
ALTER TABLE public.assets
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES public.profiles(id);

-- 3. Seguridad
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pregnancy_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pregnancy_calendars ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Padres gestionan sus hijos') THEN
        CREATE POLICY "Padres gestionan sus hijos" ON public.children FOR ALL USING (parent_id = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Padres gestionan recuerdos') THEN
        CREATE POLICY "Padres gestionan recuerdos" ON public.pregnancy_memories FOR ALL USING (child_id IN (SELECT id FROM public.children WHERE parent_id = auth.uid()));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Padres gestionan calendarios') THEN
        CREATE POLICY "Padres gestionan calendarios" ON public.pregnancy_calendars FOR ALL USING (child_id IN (SELECT id FROM public.children WHERE parent_id = auth.uid()));
    END IF;
END $$;

-- 4. Tablas Faltantes para Características Completas
CREATE TABLE IF NOT EXISTS public.life_sections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    baby_weight TEXT,
    baby_height TEXT,
    baby_photo TEXT,
    show_in_books BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.album_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    is_double_page BOOLEAN DEFAULT false NOT NULL,
    elements_left JSONB DEFAULT '[]'::jsonb,
    elements_right JSONB DEFAULT '[]'::jsonb,
    background_color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pregnancy_album_pages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
    section_id UUID REFERENCES public.life_sections(id) ON DELETE CASCADE,
    page_number INTEGER NOT NULL,
    month_number INTEGER,
    stage_label TEXT,
    background_url TEXT,
    background_color TEXT DEFAULT '#FFFDF8',
    content_json JSONB DEFAULT '[]'::jsonb,
    layout_json JSONB DEFAULT '{}'::jsonb,
    thumbnail_url TEXT,
    is_auto_generated BOOLEAN DEFAULT false,
    is_locked BOOLEAN DEFAULT false,
    page_kind TEXT,
    side TEXT,
    template_id UUID REFERENCES public.album_templates(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT pregnancy_album_pages_unique UNIQUE (child_id, page_number, section_id)
);

CREATE TABLE IF NOT EXISTS public.pregnancy_folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
    section_id UUID REFERENCES public.life_sections(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pregnancy_folder_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    folder_id UUID REFERENCES public.pregnancy_folders(id) ON DELETE CASCADE NOT NULL,
    memory_id UUID REFERENCES public.pregnancy_memories(id) ON DELETE CASCADE NOT NULL,
    media_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.general_memories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    memory_date DATE NOT NULL,
    category TEXT DEFAULT 'General',
    media_urls TEXT[] DEFAULT '{}',
    media_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.baby_names (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    gender TEXT NOT NULL,
    is_crossed BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Habilitación de RLS para Tablas Nuevas
ALTER TABLE public.life_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pregnancy_album_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pregnancy_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pregnancy_folder_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.general_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.album_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.baby_names ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS Adicionales y Completas
DO $$ BEGIN
    -- profiles
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuarios gestionan su propio perfil') THEN
        CREATE POLICY "Usuarios gestionan su propio perfil" ON public.profiles FOR ALL USING (id = auth.uid());
    END IF;

    -- assets
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuarios ven assets globales o suyos') THEN
        CREATE POLICY "Usuarios ven assets globales o suyos" ON public.assets FOR SELECT USING (is_global = true OR user_id = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Usuarios gestionan sus assets') THEN
        CREATE POLICY "Usuarios gestionan sus assets" ON public.assets FOR ALL USING (user_id = auth.uid());
    END IF;

    -- memories
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Padres gestionan recuerdos antiguos') THEN
        CREATE POLICY "Padres gestionan recuerdos antiguos" ON public.memories FOR ALL USING (child_id IN (SELECT id FROM public.children WHERE parent_id = auth.uid()));
    END IF;

    -- life_sections
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Padres gestionan life_sections') THEN
        CREATE POLICY "Padres gestionan life_sections" ON public.life_sections FOR ALL USING (child_id IN (SELECT id FROM public.children WHERE parent_id = auth.uid()));
    END IF;

    -- pregnancy_album_pages
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Padres gestionan album_pages') THEN
        CREATE POLICY "Padres gestionan album_pages" ON public.pregnancy_album_pages FOR ALL USING (child_id IN (SELECT id FROM public.children WHERE parent_id = auth.uid()));
    END IF;

    -- pregnancy_folders
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Padres gestionan pregnancy_folders') THEN
        CREATE POLICY "Padres gestionan pregnancy_folders" ON public.pregnancy_folders FOR ALL USING (child_id IN (SELECT id FROM public.children WHERE parent_id = auth.uid()));
    END IF;

    -- pregnancy_folder_items
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Padres gestionan pregnancy_folder_items') THEN
        CREATE POLICY "Padres gestionan pregnancy_folder_items" ON public.pregnancy_folder_items FOR ALL USING (folder_id IN (SELECT id FROM public.pregnancy_folders WHERE child_id IN (SELECT id FROM public.children WHERE parent_id = auth.uid())));
    END IF;

    -- general_memories
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Padres gestionan recuerdos generales') THEN
        CREATE POLICY "Padres gestionan recuerdos generales" ON public.general_memories FOR ALL USING (child_id IN (SELECT id FROM public.children WHERE parent_id = auth.uid()));
    END IF;

    -- baby_names
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Padres gestionan nombres') THEN
        CREATE POLICY "Padres gestionan nombres" ON public.baby_names FOR ALL USING (child_id IN (SELECT id FROM public.children WHERE parent_id = auth.uid()));
    END IF;

    -- album_templates
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Todos ven plantillas') THEN
        CREATE POLICY "Todos ven plantillas" ON public.album_templates FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins gestionan plantillas') THEN
        CREATE POLICY "Admins gestionan plantillas" ON public.album_templates FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE role = 'admin'));
    END IF;
END $$;

-- 7. Tablas para Eventos Compartidos (Invitados)
CREATE TABLE IF NOT EXISTS public.pregnancy_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
    section_id UUID REFERENCES public.life_sections(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    greeting_message TEXT,
    is_active BOOLEAN DEFAULT true NOT NULL,
    background_style TEXT, -- color plano o URL de imagen
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.pregnancy_events
    ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES public.life_sections(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS public.pregnancy_event_media (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES public.pregnancy_events(id) ON DELETE CASCADE NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL, -- 'image' | 'video'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.pregnancy_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pregnancy_event_media ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para Eventos Compartidos
DO $$ BEGIN
    -- pregnancy_events: Creadores gestionan todo
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Padres gestionan sus eventos') THEN
        CREATE POLICY "Padres gestionan sus eventos" ON public.pregnancy_events FOR ALL 
        USING (child_id IN (SELECT id FROM public.children WHERE parent_id = auth.uid()));
    END IF;

    -- pregnancy_events: Invitados ven eventos activos
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Invitados ven eventos activos') THEN
        CREATE POLICY "Invitados ven eventos activos" ON public.pregnancy_events FOR SELECT 
        USING (is_active = true);
    END IF;

    -- pregnancy_event_media: Creadores gestionan todo
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Padres gestionan fotos de eventos') THEN
        CREATE POLICY "Padres gestionan fotos de eventos" ON public.pregnancy_event_media FOR ALL 
        USING (event_id IN (SELECT id FROM public.pregnancy_events WHERE child_id IN (SELECT id FROM public.children WHERE parent_id = auth.uid())));
    END IF;

    -- pregnancy_event_media: Invitados ven fotos de eventos activos
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Invitados ven fotos de eventos activos') THEN
        CREATE POLICY "Invitados ven fotos de eventos activos" ON public.pregnancy_event_media FOR SELECT 
        USING (event_id IN (SELECT id FROM public.pregnancy_events WHERE is_active = true));
    END IF;

    -- pregnancy_event_media: Invitados pueden subir fotos a eventos activos
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Invitados suben fotos a eventos activos') THEN
        CREATE POLICY "Invitados suben fotos a eventos activos" ON public.pregnancy_event_media FOR INSERT 
        WITH CHECK (event_id IN (SELECT id FROM public.pregnancy_events WHERE is_active = true));
    END IF;
END $$;
