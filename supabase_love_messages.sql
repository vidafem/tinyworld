-- ==============================================================================
-- TINYWORLD - MIGRACIÓN: EL ÁRBOL DE LOS MENSAJES CON AMOR
-- ==============================================================================

-- 1. Crear la tabla para almacenar los mensajes del árbol
CREATE TABLE IF NOT EXISTS public.love_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
    leaf_id TEXT NOT NULL, -- Identificador de la hoja en el SVG/Canvas
    author_name TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Aseguramos que solo haya un mensaje por hoja en el árbol de un bebé específico
    UNIQUE(child_id, leaf_id)
);

-- 2. Desactivar RLS (Row Level Security) para permitir lectura/escritura pública
-- (Ya que los familiares usarán un enlace público sin iniciar sesión)
ALTER TABLE public.love_messages DISABLE ROW LEVEL SECURITY;

-- 3. Limpiar políticas previas si existieran para evitar conflictos
DROP POLICY IF EXISTS "Public access to love messages" ON public.love_messages;
