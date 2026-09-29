-- ==============================================================================
-- TINYWORLD - MIGRACIÓN: CELEBRACIONES DE HITOS CON TINYAI
-- Tabla para almacenar mensajes personalizados de hitos (semanas de gestación,
-- meses de vida y cumpleaños) generados silenciosamente con días de anticipación.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.milestone_celebrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    child_id UUID REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
    milestone_key TEXT NOT NULL,          -- ej: 'pregnancy_week_30', 'born_month_1', 'born_year_1'
    milestone_type TEXT NOT NULL,         -- 'pregnancy_week' | 'born_month' | 'born_year'
    milestone_number INT NOT NULL,        -- número de semana, mes o año
    target_date DATE NOT NULL,            -- fecha exacta del hito (YYYY-MM-DD)
    title TEXT NOT NULL,                  -- ej: '¡30 Semanas de Gestación!'
    message TEXT NOT NULL,                -- Mensaje personalizado generado por IA
    target_route TEXT NOT NULL,           -- Ruta para anotar el recuerdo según edad
    section_id UUID,                      -- ID de la etapa (si aplica en Lifetime)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Asegurar que solo exista un registro por hito para cada bebé
    UNIQUE(child_id, milestone_key)
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_milestone_celebrations_child_key 
    ON public.milestone_celebrations(child_id, milestone_key);

CREATE INDEX IF NOT EXISTS idx_milestone_celebrations_target_date 
    ON public.milestone_celebrations(child_id, target_date);

-- Desactivar RLS para permitir lecturas y escrituras tanto desde cliente autenticado como APIs
ALTER TABLE public.milestone_celebrations DISABLE ROW LEVEL SECURITY;
