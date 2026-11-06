# AGENT.md - Guía Operativa para Agentes de Desarrollo

## 1. Identidad y Misión del Proyecto

Este repositorio contiene la aplicación **Club Infantil - Panel Operativo Restaurante**, un sistema diseñado para la gestión de membresías infantiles en restaurantes familiares, validación de beneficios en comanda para meseros y punto de venta (POS) para caja con cálculo dual en **USD** y **Bolívares (Bs.)**.

Cualquier agente que modifique este código debe priorizar:
1. **Velocidad de operación en el restaurante**: Interfaz de meseros y cajeros sin fricciones.
2. **Consistencia financiera bimoneda**: Base contable estricta en USD con registro histórico de tasa de cambio y equivalencia en Bs.
3. **Resiliencia de datos**: Sincronización transparente con Supabase y respaldo inmediato en `localStorage`.
4. **Seguridad y auditoría**: Validación anti-duplicados de referencias bancarias e IDs únicos de transacción.

---

## 2. Pila Tecnológica y Convenciones

* **Framework**: React 19 (SPA) sobre Vite 8.
* **Lenguaje**: JavaScript (JSX) y TypeScript para definiciones y linting (`tsc --noEmit`).
* **Estilos**: Tailwind CSS v4 con importación `@import "tailwindcss";` en `src/index.css`.
* **Tema corporativo**: Paleta `--color-corporate-*` definida en el theme de CSS. No inventar paletas desalineadas.
* **Iconografía**: `lucide-react`.
* **Exportación documental**: `jspdf` y Canvas 2D nativo (ver `src/utils/carnetRenderer.js`). **Prohibido** usar `html2canvas` debido a bloqueos de CORS, fallas con colores modernos (oklch) y problemas de canvas teñido (*tainted canvas*).
* **Base de datos**: `@supabase/supabase-js`.

---

## 3. Estructura del Código

```
/
├── index.html                    # Entrada HTML con metadatos y fuentes Google Fonts
├── metadata.json                 # Metadatos de la aplicación
├── package.json                  # Dependencias y scripts de construcción
├── spec.md                       # Especificación técnica detallada del sistema
├── AGENT.md                      # Esta guía operativa para agentes
└── src/
    ├── main.tsx                  # Punto de entrada de React
    ├── App.jsx                   # Orquestador principal, estado global y sync Supabase
    ├── index.css                 # Configuración de Tailwind CSS y reglas @media print
    ├── mockData.js               # Semilla inicial, utilidades de fecha y formateo
    ├── components/
    │   ├── Scanner.jsx           # Terminal de consulta rápida para meseros
    │   ├── AdminPanel.jsx        # Caja POS, cobros, tasa del día y Tally/WhatsApp
    │   ├── ChildProfileCRUD.jsx  # Ficha de socios, cámara web y galería
    │   ├── AdminSettings.jsx     # Configuración de membresías y tasa del dólar
    │   ├── CarnetModal.jsx       # Modal de visualización y descarga de carnet
    │   └── PaymentReceiptModal.jsx # Recibo de pago imprimible para auditoría
    └── utils/
        ├── carnetRenderer.js     # Motor Canvas 2D nativo 300 DPI para credenciales CR80
        └── supabaseClient.js     # Inicialización del cliente Supabase
```

---

## 4. Reglas Críticas de Negocio

### 4.1. Moneda Base y Conversiones
* Toda membresía y contabilidad interna se calcula en **Dólares Americanos ($ USD)**.
* Los pagos en Bolívares (Pago Móvil, Tarjeta, Transferencia) se convierten dividiendo o multiplicando según la `tasaDolar` configurada.
* Al aprobar un pago, se deben guardar tanto `montoPagado` ($ USD) como `tasaCambio` y `montoBs` para congelar la transacción auditada.

### 4.2. Fechas de Inicio y Vencimiento
* Al aprobar un pago en caja (`handleApprovePayment` en `App.jsx`):
  * `fechaInicio` = Fecha actual del día (`YYYY-MM-DD`).
  * `fechaVencimiento` = Fecha actual + **30 días continuos** (`fechaInicio + 30`).
  * `estado` = `'activa'`.
* La función `checkIsActiveAndValid(afiliado)` evalúa contra la medianoche actual. Si la fecha actual supera el vencimiento, la membresía expira automáticamente sin requerir un cron job en el cliente.

### 4.3. Validación Anti-Duplicados en Caja
* En `AdminPanel.jsx`, antes de procesar un pago con forma de pago que requiera referencia (Pago Móvil, Tarjeta, Transferencia, Sended):
  * Se verifica contra todas las transacciones históricas (`allTransactions`).
  * Si la referencia bancaria ya existe en cualquier registro previo, el sistema **debe alertar y bloquear el pago** para evitar fraudes o doble uso de un comprobante.

### 4.4. Modelo de Transacción
Cada cobro debe generar un objeto con esta firma:
```javascript
{
  id: `TXN-${codigo}-${Date.now().toString(36).substring(3).toUpperCase()}`,
  fecha: fechaInicioStr,
  hora: timeStr,
  montoUSD: Number(monto),
  metodoPago: details.metodo,
  referenciaPago: details.referencia,
  numeroFactura: details.numeroFactura,
  tasaCambio: details.tasaCambio,
  montoBs: details.montoBs,
  concepto: 'Cobro de Membresía Oficial (30 Días)',
  cajero: 'Caja Restaurante Principal'
}
```

---

## 5. Integración con Supabase y n8n

### 5.1. Sincronización con Supabase
* Al montar `App.jsx`, se consulta la tabla `socios` y la tabla `membresias`.
* Cualquier cambio o nuevo socio llama a `syncSocioToSupabase(member)`, realizando un `upsert` mapeando camelCase a snake_case (`nombre_nino`, `foto_perfil`, `tutor_cedula`, `historial_pagos`).
* Si Supabase está desconectado o sin red, la aplicación continúa funcionando gracias a `localStorage`.

### 5.2. Manejo de URLs en Storage de n8n
* Al subir fotos de afiliados desde un nodo HTTP en n8n hacia Supabase Storage, el nodo de código debe extraer la propiedad de nombre de archivo con fallbacks múltiples:
```javascript
const rawFileName = 
  upload.name || 
  upload.fileName || 
  upload.Key || 
  upload.path || 
  upload.file?.name || 
  `foto_${Date.now()}.jpg`;
const fileName = rawFileName.includes('/') ? rawFileName.split('/').pop() : rawFileName;
```
* Esto previene que se almacene la ruta con `undefined` en la columna `foto_perfil`.

### 5.3. Enlaces Externos
* **Formulario Tally**: `https://tally.so/r/2jjW1V`
* **Envío WhatsApp**: URL formateada con `https://api.whatsapp.com/send?text=...`

---

## 6. Flujo de Trabajo para el Agente (Comandos y Validación)

Siempre que realices modificaciones en el código:

1. **Editar los archivos necesarios** de forma limpia y coherente con las convenciones descritas.
2. **Validar tipos y sintaxis**:
   ```bash
   npm run lint
   ```
   *(Ejecuta `tsc --noEmit`, asegurando que no haya errores de TypeScript ni imports faltantes).*
3. **Verificar compilación**:
   Ejecuta `compile_applet` o `npm run build` para garantizar que la aplicación construya perfectamente para producción.
4. **No reintroducir mocks cuando se haya solicitado uso real**: Respetar las conexiones de Supabase y no eliminar las validaciones de negocio.

---

## 7. Directrices de UI/UX

* **Terminal de Meseros**:
  * Diseñada para uso rápido en teléfonos y tablets.
  * Tarjetas de gran contraste visual con colores universales (Verde = Activo, Ámbar = Pendiente, Rojo = Vencido).
  * Las alergias son prioridad de seguridad; nunca ocultarlas ni minimizarlas.
* **Caja POS**:
  * La conversión Bs./USD debe actualizarse reactivamente en cada tipeo.
  * El comprobante de pago debe poder visualizarse e imprimirse de inmediato con formato térmico.
* **Carnet de Socio**:
  * Renderizado exacto a 54 × 85.6 mm (ISO CR80) a 300 DPI.
  * Mantener la ranura de lanyard y los datos del tutor visibles.
