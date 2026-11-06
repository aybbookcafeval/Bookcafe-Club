# Especificación Técnica y Funcional: Sistema de Gestión Club Infantil

## 1. Visión General del Proyecto

**Club Infantil - Panel Operativo Restaurante** es una aplicación web integral diseñada para la administración, control de membresías, validación de beneficios en mesa y cobranza en caja para clubes infantiles en restaurantes familiares.

El sistema permite operar con doble moneda: **Dólares Americanos ($ USD)** como divisa base de contabilidad y cálculo con conversión en tiempo real a **Bolívares (Bs.)** basada en una tasa oficial configurable. Cuenta con sincronización bidireccional en la nube a través de **Supabase (PostgreSQL + Storage)**, automatizaciones con **n8n**, capturas de leads mediante formularios **Tally**, emisión e impresión de **carnets físicos CR80 (300 DPI)** y recibos auditables de caja.

---

## 2. Arquitectura del Sistema

```
                      ┌───────────────────────────────────────┐
                      │    Formulario Externo Padres (Tally)  │
                      │        https://tally.so/r/2jjW1V      │
                      └──────────────────┬────────────────────┘
                                         │ Webhook HTTP
                                         ▼
                      ┌───────────────────────────────────────┐
                      │            Flujo n8n                  │
                      │  - Captura variables                  │
                      │  - Sube foto a Supabase Storage       │
                      │  - Normaliza payload y genera KID-XXX │
                      └──────────────────┬────────────────────┘
                                         │ REST API / SDK
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          Supabase Backend (Cloud)                               │
│  - Storage Bucket: "afiliados" (fotos de perfil)                                │
│  - Tablas PostgreSQL: "socios" y "membresias"                                   │
└────────────────────────────────────────┬────────────────────────────────────────┘
                                         │ Sincronización en tiempo real / fallback local
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    Frontend SPA (React 19 + Vite + Tailwind CSS v4)              │
│                                                                                 │
│  [1. Terminal Meseros]  [2. Caja / POS]    [3. Expedientes CRUD] [4. Config]   │
│  Validación con código   Cobros USD/Bs      Fotos, cámara web     Planes y tasa │
│  Alertas de alergias     Anti-duplicados    Historial pagos       del día       │
│  Cumpleañero del mes     Recibos auditables Generador Carnet CR80               │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Modelo de Datos y Esquema de Base de Datos

### 3.1. Tabla `socios` (Supabase / PostgreSQL)

| Campo | Tipo SQL | Tipo JS | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` / `text` | `string` | Identificador único del socio (`PRIMARY KEY`). |
| `codigo` | `varchar(30)` | `string` | Código visible de socio (ej: `KID-101`). |
| `nombre_nino` | `text` | `string` | Nombre y apellido del menor. |
| `foto_perfil` | `text` | `string` | URL pública de la imagen en Supabase Storage o Unsplash. |
| `fecha_nacimiento` | `date` | `string (YYYY-MM-DD)` | Fecha de nacimiento para cálculo de edad y cumpleaños. |
| `tutor_nombre` | `text` | `string` | Nombre del representante legal / tutor. |
| `tutor_cedula` | `varchar(30)` | `string` | Cédula de identidad del tutor (ej: `V-18.452.901`). |
| `parentesco_tutor` | `varchar(50)` | `string` | Parentesco (Madre, Padre, Abuelo, Tío, Hermano). |
| `tutor_telefono` | `varchar(50)` | `string` | Número telefónico o WhatsApp de contacto. |
| `estado` | `varchar(20)` | `string` | Estado actual: `'activa'`, `'pendiente'`, `'vencida'`. |
| `fecha_inicio` | `date` | `string (YYYY-MM-DD)` | Fecha de inicio de la membresía activa. |
| `fecha_vencimiento` | `date` | `string (YYYY-MM-DD)` | Fecha de corte/expiración (30 días tras pago). |
| `monto_pagado` | `numeric(12,2)` | `number` | Total acumulado pagado en Dólares ($ USD). |
| `metodo_pago` | `varchar(50)` | `string` | Último método de pago utilizado. |
| `referencia_pago` | `varchar(100)` | `string` | Número de referencia bancaria o comprobante. |
| `numero_factura` | `varchar(50)` | `string` | Número de factura o recibo emitido. |
| `tasa_cambio` | `numeric(12,2)` | `number` | Tasa de cambio Bs./USD aplicada en el último pago. |
| `monto_bs` | `numeric(14,2)` | `number` | Monto equivalente cobrado en Bolívares. |
| `alergias` | `text` | `string` | Restricciones alimentarias, celiaquía o intolerancias. |
| `notas` | `text` | `string` | Observaciones especiales o preferencias del menor. |
| `historial_pagos` | `jsonb` | `Array<Transaction>` | Lista detallada de todas las transacciones históricas. |

### 3.2. Estructura del Objeto Transacción (`historial_pagos`)

```json
{
  "id": "TXN-KID-101-9X8F2",
  "fecha": "2026-11-03",
  "hora": "02:30 p. m.",
  "montoUSD": 10.00,
  "metodoPago": "Pago Móvil",
  "referenciaPago": "PM-894120",
  "numeroFactura": "FAC-2026-105",
  "tasaCambio": 65.00,
  "montoBs": 650.00,
  "concepto": "Cobro de Membresía Oficial (30 Días)",
  "cajero": "Caja Restaurante Principal"
}
```

### 3.3. Tabla `membresias` (Supabase / PostgreSQL)

| Campo | Tipo SQL | Descripción |
| :--- | :--- | :--- |
| `id` | `text` / `uuid` | Identificador del plan (ej: `mem-vip-10`). |
| `nombre` | `text` | Nombre público de la membresía (ej: "Membresía Oficial Club Infantil"). |
| `codigo` | `varchar(50)` | Código de referencia (ej: `VIP-10USD`). |
| `precio_usd` | `numeric(10,2)` | Precio en Dólares ($ USD), por defecto `$10.00`. |
| `duracion_dias` | `integer` | Días continuos de vigencia (30 días por defecto). |
| `estado` | `varchar(20)` | `'activa'` o `'inactiva'`. |
| `moneda` | `varchar(10)` | Divisa base (`'USD'`). |
| `descripcion` | `text` | Alcance y detalles del plan. |
| `beneficios` | `text[]` / `jsonb` | Lista de beneficios incluidos en el restaurante y juegos. |

---

## 4. Módulos y Funcionalidades Principales

### 4.1. Terminal de Servicio para Meseros (`Scanner.jsx`)
* **Búsqueda Rápida y Tolerante**: Permite buscar socios por:
  * Código de socio (`KID-101`, ignorando guiones, mayúsculas o espacios).
  * Teléfono del representante.
  * Cédula de identidad del tutor.
* **Tarjeta Gigante de Estado**:
  * **Verde (Activa y Vigente)**: Acceso concedido al área de juegos, 10% de descuento en mesa y postre o bebida infantil.
  * **Ámbar (Pendiente)**: Registro creado, pero requiere pago en caja.
  * **Roja (Vencida)**: Membresía expirada; beneficios bloqueados hasta renovación.
* **Alertas de Seguridad Alimentaria**: Visualización prioritaria de **Alergias** en color de advertencia para protección del comensal.
* **Alerta de Cumpleaños**: Detecta automáticamente si el mes de nacimiento coincide con el mes en curso y muestra una notificación destacada de postre cumpleañero de cortesía.

### 4.2. Módulo de Administración & Caja POS (`AdminPanel.jsx`)
* **KPIs Financieros**: Afiliados totales, activas, pendientes y recaudación total en USD y su equivalente en Bolívares.
* **Registro de Pagos y Renovaciones**:
  * Formulario de cobro con precio base en USD y conversión automática a Bs. según la tasa del día.
  * Métodos de pago disponibles:
    1. **Pago Móvil (Bs.)** - Requiere número de referencia bancaria.
    2. **Tarjeta / Punto (Bs.)** - Requiere número de lote o aprobación.
    3. **Transferencia (Bs.)** - Requiere número de comprobante.
    4. **Sended ($ USD)** - Requiere referencia o ID Sended.
    5. **Efectivo ($ USD)** - Cobro en efectivo con referencia opcional.
* **Control Anti-Fraude de Referencias Duplicadas**:
  * Bloquea la transacción si un cajero intenta reutilizar una referencia bancaria ya registrada en cualquier socio del sistema.
* **Generación de ID y Factura Única**:
  * Cada pago recibe un identificador irrevocable (`TXN-KID-XXX-...`) y número de factura correlativo.
* **Historial General Auditado**:
  * Buscador y filtros por método de pago para auditar cada transacción realizada en el restaurante.
* **Compartir y Captar Socios**:
  * Botón directo a **Formulario Tally** (`https://tally.so/r/2jjW1V`).
  * Botón de compartir enlace por **WhatsApp**.

### 4.3. Gestión de Expedientes de Socios (`ChildProfileCRUD.jsx`)
* **Vistas Duales**: Vista en Cuadrícula (Tarjetas con foto) o Vista en Tabla densa.
* **Captura de Foto**:
  * Integración con la **Cámara Web / Dispositivo móvil** mediante `navigator.mediaDevices.getUserMedia`.
  * Opción de subir archivos de imagen desde el disco.
  * Selección de avatares predeterminados.
* **Edición Integral**: Edición de datos del niño, tutor, cédula, teléfono, notas médicas y alergias.
* **Acceso a Comprobantes**: Consulta directa del carnet y de los recibos de pago anteriores.

### 4.4. Motor de Renderizado de Carnets (`carnetRenderer.js` y `CarnetModal.jsx`)
* **Canvas 2D Nativo a 300 DPI**:
  * Renderiza credenciales en formato estándar **CR80 (54 × 85.6 mm / 1080 × 1712 px)** o **Gafete XL (70 × 100 mm)**.
  * Soluciona problemas de CORS y *Tainted Canvas* precargando imágenes de forma anónima con fallbacks vectoriales.
  * Incluye muesca para lanyard, foto de perfil enmarcada, datos del tutor, código de barra/validación en mesa y resumen de beneficios.
* **Exportación y Descarga**:
  * Descarga individual en PNG o PDF con dimensiones exactas para impresoras de tarjetas de PVC (Zebra, Evolis, Fargo).
  * Modo Hoja A4 con marcas de corte punteadas para impresoras convencionales.

### 4.5. Auditoría e Impresión de Recibos (`PaymentReceiptModal.jsx`)
* Comprobante térmico/formal de caja con desglose de divisa base ($ USD), tasa aplicada, monto en Bolívares, hora, método y referencia bancaria.
* Soporte nativo para impresión térmica con `@media print`.

### 4.6. Configuración y Ajuste de Membresías (`AdminSettings.jsx`)
* Configuración de la tasa referencial del Dólar (Bs. por USD).
* Configuración de los planes de membresía, precios en USD, duración en días y lista de beneficios.

---

## 5. Integración con Servicios Externos

### 5.1. Supabase (Base de Datos y Almacenamiento)
* **Cliente**: `src/utils/supabaseClient.js`.
* **Variables de Entorno**:
  * `VITE_SUPABASE_URL`: Endpoint de la instancia de Supabase.
  * `VITE_SUPABASE_PUBLISHABLE_KEY`: Clave pública anónima de la API.
* **Almacenamiento de Imágenes**: Bucket público `afiliados`.

### 5.2. Flujo de Trabajo con n8n
* **Recepción de Leads / Registros**:
  * n8n procesa el formulario Tally mediante webhook, sube la foto binaria al bucket `afiliados` de Supabase, construye la URL pública limpia del archivo y guarda el socio en estado `'pendiente'`.
* **Notificación de Pago Aprobado**:
  * Cuando se cobra en la app, la app emite el payload `club_infantil.payment_approved` a la URL interna de webhook de n8n para enviar el carnet o comprobante por WhatsApp al tutor.

---

## 6. Lógica de Ciclo de Vida de Membresías

```
                                ┌─────────────────────────┐
                                │   Registro Inicial      │
                                │   (Tally / Form / n8n)  │
                                └────────────┬────────────┘
                                             │ Estado: 'pendiente'
                                             ▼
                                ┌─────────────────────────┐
                                │   Pago en Caja POS      │
                                │   USD o Bs.             │
                                └────────────┬────────────┘
                                             │ fecha_inicio = Hoy
                                             │ fecha_vencimiento = Hoy + 30 días
                                             ▼
 ┌──────────────────────┐       ┌─────────────────────────┐
 │   Socio Vencido      │       │     Membresía Activa    │
 │ Beneficios bloqueados│◄──────┤     Beneficios en mesa  │
 └──────────┬───────────┘       └─────────────────────────┘
            │                                ▲
            │ Renovación en Caja             │
            └────────────────────────────────┘
```

1. **Fecha de Inicio**: Se fija en la fecha del sistema en que se procesa y aprueba el pago en caja (`YYYY-MM-DD`).
2. **Fecha de Vencimiento**: Se calcula sumando 30 días continuos a la fecha de inicio.
3. **Condición de Vencimiento**: Si la fecha actual sobrepasa la `fecha_vencimiento`, `checkIsActiveAndValid()` evalúa a `false`, alertando al personal del restaurante.
4. **Renovación**: El socio conserva su ID, su código `KID-XXX` y sus datos; al renovar, se extiende la vigencia por 30 días y se agrega una nueva entrada al `historial_pagos`.

---

## 7. Pila Tecnológica

* **Lenguaje**: JavaScript / TypeScript.
* **Framework**: React 19 SPA.
* **Empaquetador**: Vite 8.
* **Estilos**: Tailwind CSS v4 con variables corporativas (`--color-corporate-*`).
* **Iconografía**: `lucide-react`.
* **Generación Documental**: `jspdf`, Canvas 2D nativo y `@media print`.
* **Persistencia**: `@supabase/supabase-js` con respaldo de resiliencia en `localStorage`.

---

## 8. Verificación y Calidad de Código

* **Compilación**: `npm run build` verificado con Vite.
* **Tipado y Lint**: `npm run lint` (`tsc --noEmit`) sin errores ni dependencias rotas.
