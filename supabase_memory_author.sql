-- ==============================================================================
-- TINYWORLD - MIGRACIÓN: AUTOR DEL RECUERDO (PAPÁ O MAMÁ)
-- ==============================================================================

-- Añadir columna 'author' a la tabla pregnancy_memories si no existe
ALTER TABLE public.pregnancy_memories 
ADD COLUMN IF NOT EXISTS author TEXT;

-- Añadir columna 'author' a la tabla general_memories si no existe
ALTER TABLE public.general_memories 
ADD COLUMN IF NOT EXISTS author TEXT;

-- Comentario explicativo
COMMENT ON COLUMN public.pregnancy_memories.author IS 'Indica quién compartió el recuerdo (dad / mom)';
COMMENT ON COLUMN public.general_memories.author IS 'Indica quién compartió el recuerdo (dad / mom)';
