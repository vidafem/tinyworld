-- Migración para añadir la columna de configuración de estilos a la tabla pregnancy_events
ALTER TABLE public.pregnancy_events
    ADD COLUMN IF NOT EXISTS style_settings JSONB DEFAULT '{}'::jsonb;
