/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  CreditCard, 
  Sparkles, 
  CheckCircle, 
  Webhook, 
  RotateCcw, 
  Store, 
  ChefHat,
  X,
  Bell,
  Users,
  Settings,
  RefreshCw
} from 'lucide-react';
import Scanner from './components/Scanner.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import ChildProfileCRUD from './components/ChildProfileCRUD.jsx';
import AdminSettings from './components/AdminSettings.jsx';
import { supabase } from './utils/supabaseClient.js';
import { 
  DEFAULT_MEMBERSHIP_CONFIG,
  DEFAULT_TASA_DOLAR,
  DEFAULT_TASA_EURO
} from './utils/memberHelpers.js';

export default function App() {
  // Pestaña activa: 'scanner' (Meseros) o 'admin' (Caja)
  const [activeTab, setActiveTab] = useState('scanner');
  
  // Estado global de afiliados cargado 100% desde la base de datos Supabase
  const [afiliados, setAfiliados] = useState([]);

  // Estado global de tipos de membresías desde Supabase
  const [memberships, setMemberships] = useState(DEFAULT_MEMBERSHIP_CONFIG);

  // Estado de tasa referencial del dólar y euro desde Supabase (tabla tasas_cambio)
  const [tasaDolar, setTasaDolar] = useState(0);
  const [tasaEuro, setTasaEuro] = useState(0);
  const [fechaTasas, setFechaTasas] = useState('');
  const [historialTasas, setHistorialTasas] = useState([]);

  // Estado para pre-filtrar o saltar a un afiliado al cambiar de pestaña
  const [targetCodeForAdmin, setTargetCodeForAdmin] = useState('');

  // Estado para abrir una ficha específica en el módulo CRUD
  const [targetIdForFicha, setTargetIdForFicha] = useState(null);

  // Estado de conexión Supabase
  const [supabaseStatus, setSupabaseStatus] = useState('connecting'); // 'connected' | 'error' | 'connecting'
  const [isLoading, setIsLoading] = useState(true);

  // Notificaciones flotantes tipo Toast
  const [toast, setToast] = useState(null);

  // Cargar datos reales directamente desde Supabase (socios, pagos, membresias, configuracion)
  const loadFromSupabase = async () => {
    try {
      setSupabaseStatus('connecting');

      // 1. Consultar tabla de socios
      const { data: sociosData, error: sociosError } = await supabase
        .from('socios')
        .select('*')
        .order('created_at', { ascending: false });

      // 2. Consultar tabla relacional de pagos
      const { data: pagosData, error: pagosError } = await supabase
        .from('pagos')
        .select('*')
        .order('created_at', { ascending: false });

      if (pagosError) {
        console.warn('[Supabase Pagos Error]', pagosError.message);
      }

      // Agrupar los pagos por socio_id (clave foránea)
      const pagosBySocio = {};
      (pagosData || []).forEach((p) => {
        if (!p.socio_id) return;
        if (!pagosBySocio[p.socio_id]) {
          pagosBySocio[p.socio_id] = [];
        }
        pagosBySocio[p.socio_id].push({
          id: p.transaccion_id || p.id,
          pagoId: p.id,
          socioId: p.socio_id,
          codigoSocio: p.codigo_socio,
          fecha: p.fecha_pago,
          hora: p.hora_pago ? String(p.hora_pago).substring(0, 5) : '',
          montoUSD: Number(p.monto_usd) || 0,
          metodoPago: p.metodo_pago || 'Efectivo $',
          referenciaPago: p.referencia_pago || '',
          numeroFactura: p.numero_factura || '',
          tasaCambio: p.tasa_cambio ? Number(p.tasa_cambio) : null,
          montoBs: p.monto_bs ? Number(p.monto_bs) : null,
          concepto: p.concepto || 'Cobro de Membresía VIP (30 Días)',
          cajero: p.cajero || 'Caja Restaurante Principal',
          createdAt: p.created_at
        });
      });
      
      if (!sociosError && sociosData) {
        const mapped = sociosData.map((s) => {
          // Relación directa mediante socio_id con la tabla pagos
          const historialRelacional = pagosBySocio[s.id] || [];
          const historialFallback = Array.isArray(s.historial_pagos) ? s.historial_pagos : [];
          const historialFinal = historialRelacional.length > 0 ? historialRelacional : historialFallback;
          const totalPagadoUSD = historialFinal.reduce((sum, p) => sum + (Number(p.montoUSD) || 0), 0);
          const ultimoPago = historialFinal[0] || null;

          return {
            id: s.id,
            codigo: s.codigo,
            nombreNino: s.nombre_nino || s.nombreNino || 'Socio',
            fotoPerfil: s.foto_perfil || s.fotoPerfil || '',
            fechaNacimiento: s.fecha_nacimiento || s.fechaNacimiento || '2015-01-01',
            tutorNombre: s.tutor_nombre || s.tutorNombre || 'Tutor',
            tutorCedula: s.tutor_cedula || s.tutorCedula || '',
            parentescoTutor: s.parentesco_tutor || s.parentescoTutor || 'Padre',
            tutorTelefono: s.tutor_telefono || s.tutorTelefono || '',
            estado: s.estado || 'pendiente',
            planMembresia: s.plan_membresia || 'Estándar',
            fechaInicio: s.fecha_inicio || s.fechaInicio || '',
            fechaVencimiento: s.fecha_vencimiento || s.fechaVencimiento || '',
            montoPagado: totalPagadoUSD > 0 ? totalPagadoUSD : (Number(s.monto_pagado) || 0),
            metodoPago: ultimoPago ? ultimoPago.metodoPago : (s.metodo_pago || ''),
            referenciaPago: ultimoPago ? ultimoPago.referenciaPago : (s.referencia_pago || ''),
            numeroFactura: ultimoPago ? ultimoPago.numeroFactura : (s.numero_factura || ''),
            tasaCambio: ultimoPago ? ultimoPago.tasaCambio : (s.tasa_cambio || null),
            montoBs: ultimoPago ? ultimoPago.montoBs : (s.monto_bs || 0),
            alergias: s.alergias || '',
            notas: s.notas || '',
            historialPagos: historialFinal
          };
        });
        setAfiliados(mapped);
        setSupabaseStatus('connected');
        console.log('[Supabase] Conectado. Socios:', mapped.length, '| Pagos en tabla pagos:', (pagosData || []).length);
      } else if (sociosError) {
        console.warn('[Supabase Socios Error]', sociosError.message);
        setSupabaseStatus('error');
      }

      // Membresías desde Supabase
      const { data: memData, error: memError } = await supabase.from('membresias').select('*');
      if (!memError && memData && memData.length > 0) {
        const mappedMem = memData.map((m) => {
          const precioAfiliacion = m.precio_afiliacion_usd !== null && m.precio_afiliacion_usd !== undefined
            ? Number(m.precio_afiliacion_usd)
            : (m.precioAfiliacionUSD !== undefined ? Number(m.precioAfiliacionUSD) : 15);
          const precioMensualidad = m.precio_mensualidad_usd !== null && m.precio_mensualidad_usd !== undefined
            ? Number(m.precio_mensualidad_usd)
            : (Number(m.precio_usd || m.precioUSD || 10));

          return {
            id: m.id,
            nombre: m.nombre,
            codigo: m.codigo,
            precioAfiliacionUSD: precioAfiliacion,
            precioMensualidadUSD: precioMensualidad,
            precioUSD: precioMensualidad,
            duracionDias: m.duracion_dias || m.duracionDias || 30,
            estado: m.estado || 'activa',
            moneda: m.moneda || 'USD',
            descripcion: m.descripcion || '',
            beneficios: m.beneficios || []
          };
        });
        setMemberships(mappedMem);
      }

      // Cargar tasas oficiales de cambio (USD y EUR) desde public.tasas_cambio
      try {
        const { data: tasasData, error: tasasError } = await supabase
          .from('tasas_cambio')
          .select('*')
          .order('fecha', { ascending: false })
          .limit(10);

        if (!tasasError && Array.isArray(tasasData) && tasasData.length > 0) {
          const latest = tasasData[0];
          const valUSD = Number(latest.tasa_usd);
          const valEUR = Number(latest.tasa_eur);
          if (!isNaN(valUSD) && valUSD > 0) setTasaDolar(valUSD);
          if (!isNaN(valEUR) && valEUR > 0) setTasaEuro(valEUR);
          if (latest.fecha) setFechaTasas(latest.fecha);
          setHistorialTasas(tasasData);
          console.log('[Supabase] Tasas cargadas exitosamente desde public.tasas_cambio:', {
            usd: valUSD,
            eur: valEUR,
            fecha: latest.fecha,
            totalRegistros: tasasData.length
          });
        } else {
          console.info('[Supabase] public.tasas_cambio no tiene registros aún o devolvió lista vacía.');
        }
      } catch (e) {
        console.warn('[Supabase Tasas Exception]', e);
      }
    } catch (err) {
      console.warn('[Supabase] Error conectando a Supabase:', err);
      setSupabaseStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFromSupabase();

    // Suscripción en tiempo real a las tablas de socios, pagos y tasas_cambio
    const realTimeChannel = supabase
      .channel('db-realtime-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'socios' }, () => {
        loadFromSupabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pagos' }, () => {
        loadFromSupabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasas_cambio' }, () => {
        loadFromSupabase();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(realTimeChannel);
    };
  }, []);

  // Función para sincronizar un socio en Supabase
  const syncSocioToSupabase = async (member) => {
    try {
      const isValidUUID = member.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(member.id);
      const socioId = isValidUUID ? member.id : crypto.randomUUID();

      // Buscar membresia_id correspondiente en las membresías registradas
      const matchedMembresia = (memberships || []).find(
        (m) => m.id === member.membresiaId || m.codigo === member.planMembresia || m.nombre === member.planMembresia
      );
      const isValidMemUUID = matchedMembresia?.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(matchedMembresia.id);

      const payload = {
        id: socioId,
        codigo: member.codigo,
        nombre_nino: member.nombreNino,
        foto_perfil: member.fotoPerfil || null,
        fecha_nacimiento: member.fechaNacimiento || '2020-01-01',
        tutor_nombre: member.tutorNombre || 'Tutor',
        tutor_cedula: member.tutorCedula || null,
        parentesco_tutor: member.parentescoTutor || 'Padre',
        tutor_telefono: member.tutorTelefono || '',
        estado: member.estado || 'pendiente',
        plan_membresia: member.planMembresia || 'Estándar',
        fecha_inicio: member.fechaInicio || null,
        fecha_vencimiento: member.fechaVencimiento || null,
        alergias: member.alergias || null,
        notas: member.notas || null,
        membresia_id: isValidMemUUID ? matchedMembresia.id : (member.membresiaId || null),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase.from('socios').upsert(payload);
      if (error) {
        console.warn('[Supabase Sync Error]', error.message);
      }
    } catch (err) {
      console.warn('[Supabase Sync Exception]', err);
    }
  };

  const handleSaveMemberships = async (newMemberships) => {
    setMemberships(newMemberships);
    try {
      for (const m of newMemberships) {
        const isUUID = m.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(m.id);
        const memId = isUUID ? m.id : '1fd3cb06-6dc4-4393-bf5e-da17c60c7523';
        const precioAfiliacion = Number(m.precioAfiliacionUSD !== undefined ? m.precioAfiliacionUSD : 15);
        const precioMensualidad = Number(m.precioMensualidadUSD !== undefined ? m.precioMensualidadUSD : (m.precioUSD || 10));

        const fullPayload = {
          id: memId,
          codigo: m.codigo,
          nombre: m.nombre,
          precio_afiliacion_usd: precioAfiliacion,
          precio_mensualidad_usd: precioMensualidad,
          precio_usd: precioMensualidad,
          duracion_dias: Number(m.duracionDias) || 30,
          estado: m.estado || 'activa',
          moneda: m.moneda || 'USD',
          descripcion: m.descripcion || '',
          beneficios: m.beneficios || [],
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase.from('membresias').upsert(fullPayload);
        if (error && error.message?.includes('precio_afiliacion_usd')) {
          // Fallback seguro si las columnas nuevas no han sido creadas en Supabase
          await supabase.from('membresias').upsert({
            id: memId,
            codigo: m.codigo,
            nombre: m.nombre,
            precio_usd: precioMensualidad,
            duracion_dias: Number(m.duracionDias) || 30,
            estado: m.estado || 'activa',
            moneda: m.moneda || 'USD',
            descripcion: m.descripcion || '',
            beneficios: m.beneficios || [],
            updated_at: new Date().toISOString()
          });
        }
      }
    } catch (err) {
      console.warn('[Supabase Membresias Sync Error]', err);
    }
  };

  const handleRefreshTasas = async (showToast = true) => {
    try {
      const { data: tasasData, error: tasasError } = await supabase
        .from('tasas_cambio')
        .select('*')
        .order('fecha', { ascending: false })
        .limit(10);

      if (tasasError) {
        if (showToast) {
          setToast({
            type: 'error',
            title: 'Error al consultar BD',
            message: tasasError.message
          });
        }
        return;
      }

      if (tasasData && tasasData.length > 0) {
        const latest = tasasData[0];
        const valUSD = Number(latest.tasa_usd);
        const valEUR = Number(latest.tasa_eur);
        if (!isNaN(valUSD) && valUSD > 0) setTasaDolar(valUSD);
        if (!isNaN(valEUR) && valEUR > 0) setTasaEuro(valEUR);
        if (latest.fecha) setFechaTasas(latest.fecha);
        setHistorialTasas(tasasData);

        if (showToast) {
          setToast({
            type: 'success',
            title: 'Tasas Cargadas de Base de Datos',
            message: `Dólar: Bs. ${valUSD.toFixed(2)} | Euro: Bs. ${valEUR.toFixed(2)} (Fecha: ${latest.fecha})`
          });
        }
      } else {
        if (showToast) {
          setToast({
            type: 'info',
            title: 'Tabla tasas_cambio sin registros',
            message: 'La tabla existe en Supabase pero aún no contiene filas. Puedes registrar la tasa inicial del día o ejecutar el comando INSERT en SQL Editor.'
          });
        }
      }
    } catch (e) {
      console.warn('[Error Refresh Tasas]', e);
    }
  };

  const handleUpdateTasa = async (params) => {
    const todayStr = new Date().toISOString().split('T')[0];
    let newUSD = tasaDolar;
    let newEUR = tasaEuro;
    let newFecha = fechaTasas || todayStr;

    if (typeof params === 'object' && params !== null) {
      if (params.tasaUSD !== undefined) newUSD = Number(params.tasaUSD) || newUSD;
      if (params.tasaEUR !== undefined) newEUR = Number(params.tasaEUR) || newEUR;
      if (params.fecha) newFecha = params.fecha;
    } else if (typeof params === 'number' || typeof params === 'string') {
      newUSD = Number(params) || newUSD;
    }

    setTasaDolar(newUSD);
    setTasaEuro(newEUR);
    setFechaTasas(newFecha);

    try {
      // 1. Guardar o actualizar en la tabla oficial public.tasas_cambio (USD y EUR en la misma fila)
      const { error: tasaErr } = await supabase.from('tasas_cambio').upsert(
        {
          fecha: newFecha,
          tasa_usd: newUSD,
          tasa_eur: newEUR,
          created_at: new Date().toISOString()
        },
        { onConflict: 'fecha' }
      );

      if (tasaErr) {
        console.warn('[Supabase tasas_cambio Error]', tasaErr.message);
        if (tasaErr.code === '42501' || tasaErr.message?.includes('security policy') || tasaErr.message?.includes('violates row-level security')) {
          setToast({
            type: 'error',
            title: 'Permiso RLS en Supabase',
            message: 'Supabase bloqueó el registro por políticas de seguridad (RLS). Ejecuta en Supabase SQL Editor: ALTER TABLE public.tasas_cambio DISABLE ROW LEVEL SECURITY;'
          });
          return;
        }
      }

      // Refrescar lista de historial de tasas
      const { data: updatedList } = await supabase
        .from('tasas_cambio')
        .select('*')
        .order('fecha', { ascending: false })
        .limit(10);
      if (updatedList) {
        setHistorialTasas(updatedList);
      }

      setToast({
        type: 'success',
        title: 'Tasas de Cambio Actualizadas',
        message: `Dólar: Bs. ${newUSD.toFixed(2)} | Euro: Bs. ${newEUR.toFixed(2)} (${newFecha}) registradas en base de datos.`
      });
    } catch (err) {
      console.warn('[Supabase Config/Tasas Save Exception]', err);
    }
  };

  // Limpiar toast automáticamente
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  /**
   * Función requerida: handleApprovePayment
   * Cambia el estado a 'activa', calcula fechaVencimiento sumando 30 días a hoy,
   * sincroniza con Supabase y emite console.log para el flujo de pagos.
   */
  const handleApprovePayment = async (id, monto, details = {}) => {
    const today = new Date();
    const fechaInicioStr = today.toISOString().split('T')[0];

    // Calcular fecha de vencimiento sumando 30 días a la fecha actual
    const fechaVencimiento = new Date(today);
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);
    const fechaVencimientoStr = fechaVencimiento.toISOString().split('T')[0];

    const existing = afiliados.find((item) => item.id === id);
    if (!existing) return;

    const nuevoMontoUSD = (Number(existing.montoPagado) || 0) + Number(monto);
    const now = new Date();
    const timeStr = now.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true });

    const facNum = details.numeroFactura && details.numeroFactura.trim() !== ''
      ? details.numeroFactura.trim()
      : `FAC-2026-${Math.floor(100 + Math.random() * 900)}`;

    const newTransaction = {
      id: `TXN-${existing.codigo}-${Date.now().toString(36).substring(3).toUpperCase()}`,
      fecha: fechaInicioStr,
      hora: timeStr,
      montoUSD: Number(monto),
      moneda: details.moneda || (details.metodo === 'Efectivo €' ? 'EUR' : 'USD'),
      metodoPago: details.metodo || 'Efectivo $',
      referenciaPago: details.referencia || 'EFE-CONTADO',
      numeroFactura: facNum,
      tasaCambio: details.tasaCambio || null,
      montoBs: details.montoBs || null,
      concepto: details.concepto || 'Cobro de Membresía VIP (30 Días)',
      cajero: 'Caja Restaurante Principal'
    };

    const prevHistory = Array.isArray(existing.historialPagos) ? existing.historialPagos : [];

    const updatedMember = {
      ...existing,
      estado: 'activa',
      fechaInicio: fechaInicioStr,
      fechaVencimiento: fechaVencimientoStr,
      montoPagado: nuevoMontoUSD, // Siempre registrado y almacenado en $ USD
      metodoPago: details.metodo || 'Efectivo $',
      referenciaPago: details.referencia || '',
      numeroFactura: facNum,
      tasaCambio: details.tasaCambio || null,
      montoBs: details.montoBs || null,
      historialPagos: [newTransaction, ...prevHistory]
    };

    // Actualizar estado en UI inmediatamente
    setAfiliados((prev) => prev.map((item) => (item.id === id ? updatedMember : item)));

    // 1. Insertar el cobro en la tabla relacional public.pagos vinculada por socio_id
    const pagoRecord = {
      transaccion_id: newTransaction.id,
      socio_id: id,
      codigo_socio: existing.codigo,
      monto_usd: Number(monto),
      moneda: details.moneda || (details.metodo === 'Efectivo €' ? 'EUR' : 'USD'),
      metodo_pago: details.metodo || 'Efectivo $',
      referencia_pago: details.referencia || 'EFE-CONTADO',
      numero_factura: facNum,
      tasa_cambio: details.tasaCambio ? Number(details.tasaCambio) : null,
      monto_bs: details.montoBs ? Number(details.montoBs) : null,
      concepto: details.concepto || 'Cobro de Membresía VIP (30 Días)',
      cajero: 'Caja Restaurante Principal',
      fecha_pago: fechaInicioStr
    };

    try {
      const { error: pagoErr } = await supabase.from('pagos').insert(pagoRecord);
      if (pagoErr) {
        console.warn('[Supabase Pagos Insert Error]', pagoErr.message);
      }
    } catch (e) {
      console.warn('[Supabase Pagos Insert Exception]', e);
    }

    // 2. Actualizar estado y fecha de vencimiento en public.socios
    await syncSocioToSupabase(updatedMember);

    // Simulación de Webhook n8n vía console.log (con datos completos en USD y equivalencia en Bolívares)
    const n8nPayload = {
      event: 'club_infantil.payment_approved',
      timestamp: new Date().toISOString(),
      source: 'pos_caja_restaurante',
      data: {
        afiliadoId: id,
        codigo: updatedMember.codigo,
        nombreNino: updatedMember.nombreNino,
        tutorNombre: updatedMember.tutorNombre,
        tutorCedula: updatedMember.tutorCedula,
        parentescoTutor: updatedMember.parentescoTutor,
        tutorTelefono: updatedMember.tutorTelefono,
        monedaBase: 'USD',
        montoPagadoUSD: Number(monto),
        tasaCambioBsUSD: details.tasaCambio || null,
        montoEquivalenteBs: details.montoBs || null,
        metodoPago: details.metodo || 'Efectivo $',
        referenciaPago: details.referencia || 'N/A',
        numeroFactura: updatedMember.numeroFactura,
        nuevoEstado: 'activa',
        fechaInicio: fechaInicioStr,
        fechaVencimiento: fechaVencimientoStr,
        duracionDias: 30
      }
    };

    console.log(
      '%c[Webhook n8n - POST https://n8n.webhook.internal/club-infantil/pago-aprobado]',
      'color: #10b981; font-weight: bold; font-size: 12px;',
      n8nPayload
    );

    const detalleBs = details.montoBs 
      ? ` (Equivalente: Bs. ${Number(details.montoBs).toLocaleString('es-VE', { minimumFractionDigits: 2 })} a tasa Bs. ${Number(details.tasaCambio).toFixed(2)})`
      : '';

    setToast({
      type: 'success',
      title: 'Pago Registrado en Dólares ($ USD)',
      message: `Cobro de $ ${Number(monto).toFixed(2)} USD vía ${details.metodo || 'Efectivo'}${detalleBs}${details.referencia ? ' [Ref: ' + details.referencia + ']' : ''} registrado para ${updatedMember.nombreNino}. Membresía activa hasta el ${fechaVencimientoStr}.`
    });
  };

  /**
   * Navega desde el Scanner a Caja con el código preseleccionado
   */
  const handleSwitchToCaja = (code) => {
    setTargetCodeForAdmin(code);
    setActiveTab('admin');
  };

  /**
   * Navega a la vista de Fichas abriendo el expediente del niño
   */
  const handleViewChildProfile = (id) => {
    setTargetIdForFicha(id);
    setActiveTab('fichas');
  };

  /**
   * CRUD: Crear o Actualizar Ficha de Niño directamente en la base de datos
   */
  const handleSaveMember = async (member, isNew) => {
    const isValidUUID = member.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(member.id);
    const finalizedMember = {
      ...member,
      id: isValidUUID ? member.id : crypto.randomUUID()
    };

    setAfiliados((prev) => {
      if (isNew) {
        return [finalizedMember, ...prev];
      }
      return prev.map((item) => (item.id === finalizedMember.id ? finalizedMember : item));
    });

    await syncSocioToSupabase(finalizedMember);

    // Si es un nuevo miembro, enviar el payload al Webhook de n8n configurado en variables de entorno
    if (isNew) {
      const webhookUrl = import.meta.env.VITE_N8N_WEBHOOK_CREAR_SOCIO || 'https://aybbookcafe.app.n8n.cloud/webhook/crear-nuevo-socio';

      const matchedMem = (memberships || []).find(
        (m) => m.id === finalizedMember.membresiaId || m.codigo === finalizedMember.planMembresia || m.nombre === finalizedMember.planMembresia
      );
      const memId = matchedMem?.id || null;

      const webhookPayload = {
        event: 'club_infantil.nuevo_socio_creado',
        timestamp: new Date().toISOString(),
        source: 'club_infantil_app',
        // Estructura anidada para n8n ($json.data.nombre_nino, etc.)
        data: {
          id: finalizedMember.id,
          codigo: finalizedMember.codigo,
          nombre_nino: finalizedMember.nombreNino,
          nombreNino: finalizedMember.nombreNino,
          foto_perfil: finalizedMember.fotoPerfil || null,
          fotoPerfil: finalizedMember.fotoPerfil || null,
          fecha_nacimiento: finalizedMember.fechaNacimiento || '',
          fechaNacimiento: finalizedMember.fechaNacimiento || '',
          tutor_nombre: finalizedMember.tutorNombre || '',
          tutorNombre: finalizedMember.tutorNombre || '',
          tutor_cedula: finalizedMember.tutorCedula || null,
          tutorCedula: finalizedMember.tutorCedula || null,
          parentesco_tutor: finalizedMember.parentescoTutor || 'Padre',
          parentescoTutor: finalizedMember.parentescoTutor || 'Padre',
          tutor_telefono: finalizedMember.tutorTelefono || '',
          tutorTelefono: finalizedMember.tutorTelefono || '',
          estado: finalizedMember.estado || 'pendiente',
          plan_membresia: finalizedMember.planMembresia || 'Estándar',
          planMembresia: finalizedMember.planMembresia || 'Estándar',
          fecha_inicio: finalizedMember.fechaInicio || null,
          fecha_vencimiento: finalizedMember.fechaVencimiento || null,
          alergias: finalizedMember.alergias || null,
          notas: finalizedMember.notas || null,
          membresia_id: memId,
          created_at: new Date().toISOString()
        },
        // Estructura plana en la raíz para acceso directo en nodos n8n ($json.codigo, $json.nombre_nino, etc.)
        id: finalizedMember.id,
        codigo: finalizedMember.codigo,
        nombre_nino: finalizedMember.nombreNino,
        nombreNino: finalizedMember.nombreNino,
        foto_perfil: finalizedMember.fotoPerfil || null,
        fecha_nacimiento: finalizedMember.fechaNacimiento || '',
        tutor_nombre: finalizedMember.tutorNombre || '',
        tutor_cedula: finalizedMember.tutorCedula || null,
        parentesco_tutor: finalizedMember.parentescoTutor || 'Padre',
        tutor_telefono: finalizedMember.tutorTelefono || '',
        estado: finalizedMember.estado || 'pendiente',
        plan_membresia: finalizedMember.planMembresia || 'Estándar',
        fecha_inicio: finalizedMember.fechaInicio || null,
        fecha_vencimiento: finalizedMember.fechaVencimiento || null,
        alergias: finalizedMember.alergias || null,
        notas: finalizedMember.notas || null,
        membresia_id: memId
      };

      console.log(
        '%c[Webhook n8n - POST ' + webhookUrl + ']',
        'color: #6366f1; font-weight: bold; font-size: 12px;',
        webhookPayload
      );

      try {
        fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookPayload)
        })
          .then((res) => {
            console.log('[Webhook n8n - Crear Nuevo Socio] Respuesta recibida HTTP status:', res.status);
          })
          .catch((err) => {
            console.warn('[Webhook n8n - Crear Nuevo Socio] Aviso de envío a webhook:', err.message);
          });
      } catch (err) {
        console.warn('[Webhook n8n - Crear Nuevo Socio Exception]', err);
      }
    }

    setToast({
      type: isNew ? 'webhook' : 'success',
      title: isNew ? 'Nuevo Miembro Registrado & Webhook Emitido' : 'Ficha Actualizada',
      message: `${finalizedMember.nombreNino} (${finalizedMember.codigo}) guardado en base de datos${isNew ? ' y notificado a n8n.' : '.'}`
    });
  };

  /**
   * CRUD: Eliminar Ficha de Niño directamente en la base de datos
   */
  const handleDeleteMember = async (id) => {
    const member = afiliados.find((a) => a.id === id);
    setAfiliados((prev) => prev.filter((item) => item.id !== id));

    try {
      // 1. Eliminar pagos relacionados en la tabla public.pagos primero
      await supabase.from('pagos').delete().eq('socio_id', id);
      // 2. Eliminar socio en la tabla public.socios
      await supabase.from('socios').delete().eq('id', id);
    } catch (err) {
      console.warn('[Supabase Delete Exception]', err);
    }

    setToast({
      type: 'info',
      title: 'Ficha Eliminada',
      message: `El expediente de ${member ? member.nombreNino : 'afiliado'} y sus pagos fueron eliminados de la base de datos.`
    });
  };

  /**
   * Refresca los datos en vivo directamente desde Supabase
   */
  const handleRefreshSupabase = async () => {
    await loadFromSupabase();
    setToast({
      type: 'success',
      title: 'Sincronizado con Supabase',
      message: 'Los datos de afiliados y membresías se sincronizaron con la base de datos en tiempo real.'
    });
  };

  return (
    <div className="min-h-screen bg-neutral-100 flex flex-col text-neutral-900 font-sans antialiased selection:bg-emerald-200 selection:text-emerald-900">
      {/* Top Bar Contract de 3 Zonas */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Zona 1: Brand Wordmark (1 línea, single element) */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-corporate-600 text-white flex items-center justify-center font-black shadow-xs">
              <ChefHat className="w-5 h-5" />
            </div>
            <div className="leading-none">
              <span className="text-base font-extrabold tracking-tight text-neutral-900 whitespace-nowrap block">
                Club Infantil
              </span>
              <span className="text-2xs text-neutral-500 font-medium tracking-wide uppercase">
                Panel Operativo
              </span>
            </div>
          </div>

          {/* Zona 2: Segmented Navigation Tabs (Meseros vs Caja vs Fichas) */}
          <nav className="flex items-center gap-1 p-1 bg-neutral-100 rounded-xl border border-neutral-200 shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveTab('scanner');
                setTargetCodeForAdmin('');
              }}
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'scanner'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Validar con Código</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-white text-corporate-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Caja (Pagos)</span>
              {afiliados.filter((a) => a.estado === 'pendiente').length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="Hay pagos pendientes" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('fichas');
                setTargetIdForFicha(null);
              }}
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'fichas'
                  ? 'bg-white text-corporate-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Users className="w-4 h-4 text-corporate-700" />
              <span>Miembros</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('config')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'config'
                  ? 'bg-white text-corporate-900 shadow-xs'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Settings className="w-4 h-4 text-corporate-700" />
              <span>Configuración</span>
            </button>
          </nav>

          {/* Zona 3: Acción primaria / Utilidad */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRefreshSupabase}
              title="Sincronizar datos con Supabase"
              className="text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden md:inline">Sincronizar Supabase</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Dinámico según la pestaña activa */}
      <main className="flex-1 pb-16">
        {activeTab === 'scanner' && (
          <Scanner 
            afiliados={afiliados} 
            onSwitchToCaja={handleSwitchToCaja} 
            onViewChildProfile={handleViewChildProfile}
          />
        )}
        {activeTab === 'admin' && (
          <AdminPanel
            afiliados={afiliados}
            onApprovePayment={handleApprovePayment}
            initialFilterCode={targetCodeForAdmin}
            onViewChildProfile={handleViewChildProfile}
            memberships={memberships}
            tasaDolar={tasaDolar}
            tasaEuro={tasaEuro}
            fechaTasas={fechaTasas}
            onUpdateTasa={handleUpdateTasa}
          />
        )}
        {activeTab === 'fichas' && (
          <ChildProfileCRUD
            afiliados={afiliados}
            onSaveMember={handleSaveMember}
            onDeleteMember={handleDeleteMember}
            onOpenPayment={handleSwitchToCaja}
            initialSelectedId={targetIdForFicha}
          />
        )}
        {activeTab === 'config' && (
          <AdminSettings
            memberships={memberships}
            onSaveMemberships={handleSaveMemberships}
            tasaDolar={tasaDolar}
            tasaEuro={tasaEuro}
            fechaTasas={fechaTasas}
            historialTasas={historialTasas}
            onUpdateTasa={handleUpdateTasa}
            onRefreshTasas={handleRefreshTasas}
            onShowToast={(t) => setToast(t)}
          />
        )}
      </main>

      {/* Footer Operativo limpio */}
      <footer className="border-t border-neutral-200 bg-white py-4 text-center text-xs text-neutral-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span>Club Infantil · Conectado en vivo a</span>
            <span className="inline-flex items-center gap-1 font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-2xs font-semibold border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Supabase PostgreSQL
            </span>
          </div>
          <div className="flex items-center gap-4 text-neutral-500">
            <button
              type="button"
              onClick={handleRefreshSupabase}
              className="hover:text-emerald-700 underline text-2xs cursor-pointer flex items-center gap-1 font-medium"
            >
              <RefreshCw className="w-3 h-3 text-emerald-600" />
              <span>Sincronizar ahora</span>
            </button>
            <span>·</span>
            <span>n8n Webhook / Tally sync</span>
          </div>
        </div>
      </footer>

      {/* Toast Notification Flotante */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md w-[calc(100vw-2rem)] animate-in slide-in-from-bottom-3 duration-200">
          <div className={`p-4 rounded-xl shadow-xl border flex items-start gap-3 bg-white ${
            toast.type === 'success' 
              ? 'border-emerald-300 text-neutral-900' 
              : toast.type === 'webhook'
              ? 'border-indigo-300 text-neutral-900'
              : 'border-neutral-300 text-neutral-900'
          }`}>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              toast.type === 'success'
                ? 'bg-emerald-100 text-emerald-700'
                : toast.type === 'webhook'
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-neutral-100 text-neutral-700'
            }`}>
              {toast.type === 'webhook' ? <Webhook className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            </div>
            <div className="flex-1 pr-2">
              <div className="text-xs font-bold text-neutral-900">{toast.title}</div>
              <div className="text-xs text-neutral-600 mt-0.5 leading-snug">{toast.message}</div>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-neutral-400 hover:text-neutral-700 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
