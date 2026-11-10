-- ==============================================================================
-- SCRIPT SQL PARA SUPABASE: CLUB INFANTIL RESTAURANTE
-- ==============================================================================
-- Este script realiza tres tareas principales:
-- 1. Actualiza y asegura el esquema y las políticas de RLS para acceso total
-- 2. Limpia los datos de prueba previos si se desea
-- 3. Contiene la data semilla (mockup) con nomenclatura BK-00000 y UUIDs válidos
-- ==============================================================================

-- 1. ASEGURAR EXTENSIONES Y TABLAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de membresías (Soporta cuota única de afiliación + mensualidad recurrente)
CREATE TABLE IF NOT EXISTS public.membresias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    precio_usd NUMERIC(10,2) NOT NULL DEFAULT 10.00,
    precio_afiliacion_usd NUMERIC(10,2) NOT NULL DEFAULT 15.00,
    precio_mensualidad_usd NUMERIC(10,2) NOT NULL DEFAULT 10.00,
    duracion_dias INTEGER NOT NULL DEFAULT 30,
    moneda VARCHAR(10) NOT NULL DEFAULT 'USD',
    estado VARCHAR(20) NOT NULL DEFAULT 'activa',
    descripcion TEXT,
    beneficios JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurar columnas en bases de datos ya existentes
ALTER TABLE public.membresias ADD COLUMN IF NOT EXISTS precio_afiliacion_usd NUMERIC(10,2) DEFAULT 15.00;
ALTER TABLE public.membresias ADD COLUMN IF NOT EXISTS precio_mensualidad_usd NUMERIC(10,2) DEFAULT 10.00;

-- Tabla de socios (niños afiliados - esquema normalizado sin duplicidad de pagos)
CREATE TABLE IF NOT EXISTS public.socios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo TEXT UNIQUE NOT NULL,
    nombre_nino TEXT NOT NULL,
    foto_perfil TEXT,
    fecha_nacimiento DATE NOT NULL,
    tutor_nombre TEXT NOT NULL,
    tutor_cedula TEXT,
    parentesco_tutor TEXT DEFAULT 'Padre',
    tutor_telefono TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'pendiente',
    plan_membresia TEXT DEFAULT 'Estándar',
    fecha_inicio DATE,
    fecha_vencimiento DATE,
    alergias TEXT,
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    membresia_id UUID REFERENCES public.membresias(id) ON DELETE SET NULL
);

-- Índices recomendados para alto rendimiento
CREATE INDEX IF NOT EXISTS idx_socios_codigo ON public.socios USING btree (codigo);
CREATE INDEX IF NOT EXISTS idx_socios_tutor_cedula ON public.socios USING btree (tutor_cedula);
CREATE INDEX IF NOT EXISTS idx_socios_estado ON public.socios USING btree (estado);
CREATE INDEX IF NOT EXISTS idx_socios_membresia_id ON public.socios USING btree (membresia_id);

-- Tabla de pagos (relacionada con socios mediante socio_id)
CREATE TABLE IF NOT EXISTS public.pagos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaccion_id TEXT NOT NULL UNIQUE,
    socio_id UUID REFERENCES public.socios(id) ON DELETE CASCADE,
    codigo_socio TEXT NOT NULL,
    monto_usd NUMERIC NOT NULL,
    metodo_pago TEXT NOT NULL,
    referencia_pago TEXT,
    numero_factura TEXT NOT NULL,
    tasa_cambio NUMERIC,
    monto_bs NUMERIC,
    concepto TEXT DEFAULT 'Cobro de Membresía VIP (30 Días)',
    cajero TEXT DEFAULT 'Caja Restaurante Principal',
    fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,
    hora_pago TIME WITHOUT TIME ZONE DEFAULT CURRENT_TIME,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Tabla de configuración general (tasa de cambio en Bs., etc.)
CREATE TABLE IF NOT EXISTS public.configuracion (
    clave VARCHAR(50) PRIMARY KEY,
    valor TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de tasas diarias de cambio (USD y EUR en la misma fila)
CREATE TABLE IF NOT EXISTS public.tasas_cambio (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    tasa_usd NUMERIC(10, 2) NOT NULL,
    tasa_eur NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT tasas_cambio_pkey PRIMARY KEY (id),
    CONSTRAINT tasas_cambio_fecha_key UNIQUE (fecha)
);

-- Índice para ordenar y consultar rápidamente el día más reciente
CREATE INDEX IF NOT EXISTS idx_tasas_fecha ON public.tasas_cambio (fecha DESC);

-- 2. HABILITAR POLÍTICAS DE ACCESO TOTAL (RLS) PARA LA APP
ALTER TABLE public.socios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membresias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasas_cambio ENABLE ROW LEVEL SECURITY;

-- Políticas para tasas_cambio
DROP POLICY IF EXISTS "Allow public full access tasas_cambio" ON public.tasas_cambio;
CREATE POLICY "Allow public full access tasas_cambio" 
ON public.tasas_cambio 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- Políticas para socios (Lectura, Inserción, Actualización y Eliminación pública/anónima)
DROP POLICY IF EXISTS "Allow public full access socios" ON public.socios;
CREATE POLICY "Allow public full access socios" 
ON public.socios 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- Políticas para pagos
DROP POLICY IF EXISTS "Allow public full access pagos" ON public.pagos;
CREATE POLICY "Allow public full access pagos" 
ON public.pagos 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- Políticas para membresias
DROP POLICY IF EXISTS "Allow public full access membresias" ON public.membresias;
CREATE POLICY "Allow public full access membresias" 
ON public.membresias 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- Políticas para configuracion
DROP POLICY IF EXISTS "Allow public full access configuracion" ON public.configuracion;
CREATE POLICY "Allow public full access configuracion" 
ON public.configuracion 
FOR ALL 
TO anon, authenticated 
USING (true) 
WITH CHECK (true);

-- Tasa referencial por defecto
INSERT INTO public.configuracion (clave, valor)
VALUES ('tasa_dolar', '65.00'), ('tasa_euro', '70.00')
ON CONFLICT (clave) DO NOTHING;

-- Registro de tasas del día (USD y EUR)
INSERT INTO public.tasas_cambio (fecha, tasa_usd, tasa_eur)
VALUES (CURRENT_DATE, 65.00, 70.00)
ON CONFLICT (fecha) DO UPDATE SET
    tasa_usd = EXCLUDED.tasa_usd,
    tasa_eur = EXCLUDED.tasa_eur;

-- 3. PLAN DE MEMBRESÍA BASE (Con cuota única de afiliación y mensualidad recurrente)
INSERT INTO public.membresias (
    id, codigo, nombre, precio_usd, precio_afiliacion_usd, precio_mensualidad_usd, duracion_dias, moneda, estado, descripcion, beneficios
) VALUES (
    '1fd3cb06-6dc4-4393-bf5e-da17c60c7523',
    'VIP-10USD',
    'Membresía Oficial Club Infantil',
    10.00,
    15.00,
    10.00,
    30,
    'USD',
    'activa',
    'Membresía con cuota única de afiliación ($15.00 USD) que cubre los primeros 30 días, y mensualidad de renovación recurrente ($10.00 USD).',
    '[
      "Acceso libre al Área de Juegos Inflables",
      "Helado o postre infantil de cortesía en consumo familiar",
      "Carnet Oficial Vertical con foto de perfil",
      "10% de descuento en reserva de Fiestas y Cumpleaños",
      "Atención preferencial y asignación de mesa en restaurante"
    ]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    codigo = EXCLUDED.codigo,
    nombre = EXCLUDED.nombre,
    precio_usd = EXCLUDED.precio_usd,
    precio_afiliacion_usd = EXCLUDED.precio_afiliacion_usd,
    precio_mensualidad_usd = EXCLUDED.precio_mensualidad_usd,
    duracion_dias = EXCLUDED.duracion_dias,
    descripcion = EXCLUDED.descripcion,
    beneficios = EXCLUDED.beneficios;

-- ==============================================================================
-- OPCIONAL: COMANDO PARA ELIMINAR LA DATA MOCKUP ANTIGUA (KID-XXX) EN SUPABASE
-- (Deja intactos los registros reales de n8n / Tally como JOSE y Bashar)
-- ==============================================================================
-- DELETE FROM public.socios WHERE codigo IN ('KID-101', 'KID-102', 'KID-103', 'KID-104', 'BK-TEST1');

-- ==============================================================================
-- DATA SEMILLA / MOCKUP CON NOMENCLATURA BK-00000 (INSERTAR O RESTAURAR SI DESEAS)
-- ==============================================================================

INSERT INTO public.socios (
    id,
    codigo,
    nombre_nino,
    foto_perfil,
    fecha_nacimiento,
    tutor_nombre,
    tutor_cedula,
    parentesco_tutor,
    tutor_telefono,
    estado,
    plan_membresia,
    fecha_inicio,
    fecha_vencimiento,
    monto_pagado,
    metodo_pago,
    referencia_pago,
    numero_factura,
    tasa_cambio,
    monto_bs,
    alergias,
    notas,
    historial_pagos,
    membresia_id
) VALUES 
(
    'a0000001-0000-0000-0000-000000000001',
    'BK-00001',
    'Mateo González',
    'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=400&q=80',
    '2020-05-14',
    'Carlos González',
    'V-18.452.901',
    'Padre',
    '5512345678',
    'activa',
    'Estándar',
    CURRENT_DATE - INTERVAL '15 days',
    CURRENT_DATE + INTERVAL '15 days',
    25.00,
    'Pago Móvil',
    'PM-894120',
    'FAC-2026-001',
    65.00,
    1625.00,
    'Ninguna conocida',
    'Le encanta pintar manteles y el jugo de manzana',
    '[
      {
        "id": "TXN-BK-00001-01",
        "fecha": "2026-10-15",
        "hora": "14:30",
        "montoUSD": 25.0,
        "metodoPago": "Pago Móvil",
        "referenciaPago": "PM-894120",
        "numeroFactura": "FAC-2026-001",
        "tasaCambio": 65.0,
        "montoBs": 1625.0,
        "concepto": "Membresía Oficial Club Infantil (30 Días)",
        "cajero": "Caja Restaurante Principal"
      }
    ]'::jsonb,
    '1fd3cb06-6dc4-4393-bf5e-da17c60c7523'
),
(
    'a0000002-0000-0000-0000-000000000002',
    'BK-00002',
    'Sofía Rodríguez',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    '2018-03-14',
    'Mariana Pérez',
    'V-20.119.432',
    'Madre',
    '5587654321',
    'activa',
    'Estándar',
    CURRENT_DATE - INTERVAL '5 days',
    CURRENT_DATE + INTERVAL '25 days',
    25.00,
    'Tarjeta',
    'REF-4821',
    'FAC-2026-002',
    65.00,
    1625.00,
    'Intolerancia a la lactosa (leche deslactosada)',
    'Mesa preferida cerca del área de juegos',
    '[
      {
        "id": "TXN-BK-00002-01",
        "fecha": "2026-10-25",
        "hora": "12:45",
        "montoUSD": 25.0,
        "metodoPago": "Tarjeta",
        "referenciaPago": "REF-4821",
        "numeroFactura": "FAC-2026-002",
        "tasaCambio": 65.0,
        "montoBs": 1625.0,
        "concepto": "Membresía Oficial Club Infantil (30 Días)",
        "cajero": "Caja Restaurante Principal"
      }
    ]'::jsonb,
    '1fd3cb06-6dc4-4393-bf5e-da17c60c7523'
),
(
    'a0000003-0000-0000-0000-000000000003',
    'BK-00003',
    'Lucas Morales',
    'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=400&q=80',
    '2021-07-22',
    'Alejandro Morales',
    'V-24.891.055',
    'Hermano',
    '5543219876',
    'pendiente',
    'Estándar',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    0.00,
    '',
    '',
    '',
    NULL,
    0.00,
    'Alergia severa al maní / cacahuate',
    'Pendiente de registrar pago y referencia en caja',
    '[]'::jsonb,
    '1fd3cb06-6dc4-4393-bf5e-da17c60c7523'
),
(
    'a0000004-0000-0000-0000-000000000004',
    'BK-00004',
    'Valentina Ruiz',
    'https://images.unsplash.com/photo-1595454223600-91fb571348ec?auto=format&fit=crop&w=400&q=80',
    '2017-11-05',
    'Patricia Mendoza',
    'V-16.782.340',
    'Madre',
    '5599887766',
    'vencida',
    'Estándar',
    CURRENT_DATE - INTERVAL '45 days',
    CURRENT_DATE - INTERVAL '10 days',
    25.00,
    'Transferencia',
    'TRF-0019284',
    'FAC-2026-003',
    65.00,
    1625.00,
    'Ninguna',
    'Socia frecuente de fin de semana',
    '[
      {
        "id": "TXN-BK-00004-01",
        "fecha": "2026-09-15",
        "hora": "16:00",
        "montoUSD": 25.0,
        "metodoPago": "Transferencia",
        "referenciaPago": "TRF-0019284",
        "numeroFactura": "FAC-2026-003",
        "tasaCambio": 65.0,
        "montoBs": 1625.0,
        "concepto": "Membresía Oficial Club Infantil (30 Días)",
        "cajero": "Caja Restaurante Principal"
      }
    ]'::jsonb,
    '1fd3cb06-6dc4-4393-bf5e-da17c60c7523'
),
(
    'a0000005-0000-0000-0000-000000000005',
    'BK-00005',
    'Emma Castro',
    'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=400&q=80',
    '2022-09-19',
    'Roberto Castro',
    'V-11.450.892',
    'Abuelo',
    '5533221100',
    'activa',
    'Estándar',
    CURRENT_DATE - INTERVAL '10 days',
    CURRENT_DATE + INTERVAL '20 days',
    25.00,
    'Sended',
    'SND-77123',
    'FAC-2026-004',
    65.00,
    1625.00,
    'Celiaquía (sin gluten)',
    'Siempre pedir menú sin TACC',
    '[
      {
        "id": "TXN-BK-00005-01",
        "fecha": "2026-10-20",
        "hora": "13:10",
        "montoUSD": 25.0,
        "metodoPago": "Sended",
        "referenciaPago": "SND-77123",
        "numeroFactura": "FAC-2026-004",
        "tasaCambio": 65.0,
        "montoBs": 1625.0,
        "concepto": "Membresía Oficial Club Infantil (30 Días)",
        "cajero": "Caja Restaurante Principal"
      }
    ]'::jsonb,
    '1fd3cb06-6dc4-4393-bf5e-da17c60c7523'
),
(
    'a0000006-0000-0000-0000-000000000006',
    'BK-00006',
    'Emiliano Vargas',
    'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=400&q=80',
    '2019-01-30',
    'Lucía Fernández',
    'V-21.345.678',
    'Tía',
    '5566778899',
    'pendiente',
    'Estándar',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '30 days',
    0.00,
    '',
    '',
    '',
    NULL,
    0.00,
    'Ninguna',
    'Registro express online',
    '[]'::jsonb,
    '1fd3cb06-6dc4-4393-bf5e-da17c60c7523'
)
ON CONFLICT (id) DO UPDATE SET
    codigo = EXCLUDED.codigo,
    nombre_nino = EXCLUDED.nombre_nino,
    foto_perfil = EXCLUDED.foto_perfil,
    fecha_nacimiento = EXCLUDED.fecha_nacimiento,
    tutor_nombre = EXCLUDED.tutor_nombre,
    tutor_cedula = EXCLUDED.tutor_cedula,
    parentesco_tutor = EXCLUDED.parentesco_tutor,
    tutor_telefono = EXCLUDED.tutor_telefono,
    estado = EXCLUDED.estado,
    fecha_inicio = EXCLUDED.fecha_inicio,
    fecha_vencimiento = EXCLUDED.fecha_vencimiento,
    monto_pagado = EXCLUDED.monto_pagado,
    metodo_pago = EXCLUDED.metodo_pago,
    referencia_pago = EXCLUDED.referencia_pago,
    numero_factura = EXCLUDED.numero_factura,
    tasa_cambio = EXCLUDED.tasa_cambio,
    monto_bs = EXCLUDED.monto_bs,
    alergias = EXCLUDED.alergias,
    notas = EXCLUDED.notas,
    historial_pagos = EXCLUDED.historial_pagos;

-- ==============================================================================
-- 6. REGISTROS DE PAGO EN TABLA RELACIONAL public.pagos (vinculados por socio_id)
-- ==============================================================================
INSERT INTO public.pagos (
    transaccion_id,
    socio_id,
    codigo_socio,
    monto_usd,
    metodo_pago,
    referencia_pago,
    numero_factura,
    tasa_cambio,
    monto_bs,
    concepto,
    cajero,
    fecha_pago
) VALUES
(
    'TXN-BK-00001-01',
    'a0000001-0000-0000-0000-000000000001',
    'BK-00001',
    25.00,
    'Pago Móvil',
    'PM-894120',
    'FAC-2026-102',
    52.50,
    1312.50,
    'Inscripción + Carnet VIP',
    'Caja Restaurante Principal',
    CURRENT_DATE - INTERVAL '15 days'
),
(
    'TXN-BK-00002-01',
    'a0000002-0000-0000-0000-000000000002',
    'BK-00002',
    10.00,
    'Efectivo $',
    'EFE-CONTADO',
    'FAC-2026-105',
    null,
    null,
    'Renovación Membresía',
    'Caja Restaurante Principal',
    CURRENT_DATE - INTERVAL '5 days'
),
(
    'TXN-BK-00003-01',
    'a0000003-0000-0000-0000-000000000003',
    'BK-00003',
    10.00,
    'Tarjeta Débito',
    'POS-449102',
    'FAC-2026-088',
    null,
    null,
    'Cobro Membresía Mensual',
    'Caja Restaurante Principal',
    CURRENT_DATE - INTERVAL '40 days'
),
(
    'TXN-BK-00005-01',
    'a0000005-0000-0000-0000-000000000005',
    'BK-00005',
    10.00,
    'Zelle',
    'ZEL-99120',
    'FAC-2026-109',
    null,
    null,
    'Cobro Membresía Mensual',
    'Caja Restaurante Principal',
    CURRENT_DATE - INTERVAL '2 days'
)
ON CONFLICT (transaccion_id) DO UPDATE SET
    monto_usd = EXCLUDED.monto_usd,
    metodo_pago = EXCLUDED.metodo_pago,
    referencia_pago = EXCLUDED.referencia_pago,
    numero_factura = EXCLUDED.numero_factura,
    tasa_cambio = EXCLUDED.tasa_cambio,
    monto_bs = EXCLUDED.monto_bs;

