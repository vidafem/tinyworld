# Análisis Técnico: Animación Flipbook Heyzine

Este documento contiene los detalles capturados por el agente del navegador sobre el comportamiento del flipbook de Heyzine para su replicación en TinyWorld.

## 1. Cinemática del Giro (Page Flip)
- **Tipo:** Deformación geométrica + Rotación 3D.
- **Curvatura:** El borde de la página no se mantiene recto; se curva hacia el centro durante el giro, simulando la flexibilidad del papel.
- **Timing:** 600ms - 800ms por página.
- **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` (similar a Material Design).

## 2. Iluminación y Sombras (Depth)
- **Sombra Proyectada:** Una sombra paralela (drop-shadow) que se ensancha y se desvanece a medida que la página se aleja de la base.
- **Sombra del Lomo (Spine Shadow):** Un gradiente lineal en el centro del libro: `linear-gradient(to right, transparent, rgba(0,0,0,0.1) 45%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.1) 55%, transparent)`.
- **Brillo de Página:** Un ligero gradiente blanco en el "pico" de la curvatura para simular el reflejo de la luz en el papel doblado.

## 3. Comportamiento Responsive
- **Escritorio:** Spread de dos páginas (vista de libro abierto).
- **Móvil:** Transición a vista de una sola página (Single page flip). El lomo se desplaza al borde izquierdo o derecho.

## 4. Micro-interacciones
- **Peeling:** Al hacer hover en las esquinas, la página se levanta 5px.
- **Inercia:** Si sueltas la página a mitad del camino, esta regresa a su posición original o completa el giro según el ángulo (>45°).

---
*Información recolectada el 13 de mayo de 2026 mediante agente de navegación.*
