# Modelo de Afiliación Única y Mensualidad Recurrente

Plan de diseño e implementación técnica para incorporar en el Club Infantil el modelo de cobro en dos etapas: una **cuota única de afiliación/inscripción** que activa al socio y cubre sus primeros 30 días de membresía, y el cobro recurrente de **mensualidades posteriores** cada 30 días, configurable por plan y con detección automática en Caja.

## User Review & Critical Decisions

> [!IMPORTANT]
> **Decisiones confirmadas por el usuario:**
> 1. **Cobertura de la Afiliación**: El pago único de afiliación activa al socio y **cubre los primeros 30 días de membresía**.
> 2. **Configuración de Planes**: Los planes tendrán dos campos de precio explícitos: **Precio de Afiliación** (pago único) y **Precio de Mensualidad** (cuota recurrente).
> 3. **Operación en Caja**: El sistema detectará **automáticamente** si el socio está pagando por primera vez (cobra Afiliación) o si está renovando su período (cobra Mensualidad).

---

## 1. Overview & Core Concept

* **Objetivo de Negocio**: Permitir que el restaurante cobre una tarifa de entrada/afiliación diferenciada (por ejemplo $25 USD por carnet, bienvenida y kit inicial que incluye el primer mes), y posteriormente una tarifa de mantenimiento mensual más accesible (por ejemplo $10 USD cada 30 días).
* **Flujo Operativo**:
  * **Nuevo Registro (Tally / n8n / Manual)**: El socio entra en estado `pendiente` con saldo $0 y 0 pagos en `public.pagos`.
  * **Primer Cobro en Caja**: La caja detecta automáticamente `0 pagos previos`. Sugiere el monto del **Precio de Afiliación**. Al aprobarse, genera la transacción de tipo *"Afiliación Oficial (Primeros 30 días)"* en `public.pagos`, activa al socio y fija su vencimiento en `hoy + 30 días`.
  * **Cobros Posteriores (Renovaciones)**: Cuando la membresía está por vencer o vencida (o el socio renueva), la caja detecta que ya cuenta con su pago de afiliación en historial. Sugiere automáticamente el monto del **Precio de Mensualidad** con concepto *"Renovación Mensualidad (30 días)"*.

---

## 2. User Experience & Visual Design

### A. Módulo de Configuración de Planes (`AdminSettings.jsx`)
* **Tarjetas de Plan**:
  * Visualización clara y desacoplada de ambos precios:
    * Tag sutil: `Afiliación Inicial: $XX USD (Único pago, incluye 30 días)`
    * Tag sutil: `Mensualidad: $YY USD / mes`
* **Formulario Modal de Creación / Edición de Plan**:
  * **Campo 1**: *Precio de Afiliación / Inscripción ($ USD)*: Explicación contextual de que es el cobro inicial único que activa el carnet y cubre los primeros 30 días.
  * **Campo 2**: *Precio de Mensualidad ($ USD)*: Explicación de que es el cobro recurrente que se cobrará cada 30 días a partir de la renovación.
  * **Cálculo en Bolívares en tiempo real**: Muestra a cuánto equivale tanto la afiliación como la mensualidad a la tasa oficial del día.

### B. Módulo de Caja (`AdminPanel.jsx`)
* **Detección Automática Inteligente**:
  * Al seleccionar a un socio en el modal de cobro:
    * Si el socio no registra pagos en `public.pagos`, la caja preselecciona el **Precio de Afiliación** y el concepto *"Pago Único de Afiliación / Inscripción (Primeros 30 días)"*, destacando un indicador *"Primer Cobro: Afiliación"*.
    * Si el socio ya cuenta con pagos registrados, la caja preselecciona el **Precio de Mensualidad** y el concepto *"Renovación Mensualidad Club Infantil (30 Días)"*, destacando *"Cobro Recurrente: Mensualidad"*.
  * **Selector Rápido de Concepto**: Pestañas o botones segmentados limpios para que el cajero pueda conmutar con un clic si por alguna razón especial desea cobrar mensualidad o afiliación.

### C. Recibo y Comprobante Fiscal (`PaymentReceiptModal.jsx`)
* El comprobante y recibo digital especificará con precisión si el cobro correspondió a **Afiliación / Inscripción Inicial** o a **Mensualidad Recurrente**, junto a la fecha de vencimiento resultante.

---

## 3. Key Product Decisions & Trade-Offs

* **Decisión 1: Compatibilidad de Esquema en Supabase (`public.membresias`)**
  * *Estrategia*: Agregar las columnas `precio_afiliacion_usd numeric` y `precio_mensualidad_usd numeric` a la tabla `public.membresias`, manteniendo `precio_usd` sincronizado con la mensualidad para retrocompatibilidad total con consultas legacy.
* **Decisión 2: Detección Autorizada por `public.pagos`**
  * *Estrategia*: La condición para clasificar un cobro como "Afiliación" vs "Mensualidad" no se basa en un texto volátil, sino en la presencia de pagos previos asociados al `socio_id` en `public.pagos`.
* **Decisión 3: Flexibilidad del Cajero**
  * *Estrategia*: Aunque el sistema preselecciona automáticamente el monto y concepto correcto, el cajero puede editar el monto o conmutar el concepto en caso de promociones, cortesías o regularizaciones.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                 CONFIGURACIÓN DE PLANES                     │
│  • precioAfiliacionUSD ($25)   • precioMensualidadUSD ($10) │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       CAJA (PAGOS)                          │
│                                                             │
│   ¿Socio tiene pagos previos en public.pagos?               │
│   ├── NO  ──► Sugiere Precio Afiliación ($25)              │
│   │           Concepto: "Afiliación Oficial (Primer mes)"   │
│   └── SÍ  ──► Sugiere Precio Mensualidad ($10)              │
│               Concepto: "Renovación Mensualidad (30 Días)"  │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE POSTGRESQL                      │
│                                                             │
│  • public.membresias (precio_afiliacion_usd,                │
│                       precio_mensualidad_usd)               │
│  • public.pagos      (concepto, monto_usd, socio_id)        │
│  • public.socios     (estado: activa, fecha_vencimiento)    │
└─────────────────────────────────────────────────────────────┘
```

### Componentes a Modificar:
1. `src/utils/memberHelpers.js`:
   * Actualizar `DEFAULT_MEMBERSHIP_CONFIG` con `precioAfiliacionUSD` (ej. $15.00) y `precioMensualidadUSD` (ej. $10.00).
2. `src/components/AdminSettings.jsx`:
   * Agregar campos de Afiliación y Mensualidad al modal de creación/edición de planes.
   * Mostrar ambos precios en las tarjetas de planes.
3. `src/components/AdminPanel.jsx`:
   * Actualizar modal de cobro con detección automática (Afiliación vs Mensualidad) basada en el historial relacional de `pagos`.
4. `src/App.jsx`:
   * Mapeo de `precio_afiliacion_usd` y `precio_mensualidad_usd` al consultar y guardar en `supabase.from('membresias')`.
5. `supabase-seed-mockup.sql`:
   * `ALTER TABLE public.membresias ADD COLUMN IF NOT EXISTS precio_afiliacion_usd NUMERIC;`
   * `ALTER TABLE public.membresias ADD COLUMN IF NOT EXISTS precio_mensualidad_usd NUMERIC;`
