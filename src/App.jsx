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
  getAfiliadosFromStorage, 
  saveAfiliadosToStorage, 
  generateWebhookDummy, 
  getMembershipsFromStorage,
  saveMembershipsToStorage,
  getTasaDolarFromStorage,
  saveTasaDolarToStorage
} from './mockData.js';

export default function App() {
  // Pestaña activa: 'scanner' (Meseros) o 'admin' (Caja)
  const [activeTab, setActiveTab] = useState('scanner');
  
  // Estado global de afiliados cargado desde Supabase o localStorage como fallback
  const [afiliados, setAfiliados] = useState(() => getAfiliadosFromStorage());

  // Estado global de tipos de membresías
  const [memberships, setMemberships] = useState(() => getMembershipsFromStorage());

  // Estado de tasa referencial del dólar
  const [tasaDolar, setTasaDolar] = useState(() => getTasaDolarFromStorage());

  // Estado para pre-filtrar o saltar a un afiliado al cambiar de pestaña
  const [targetCodeForAdmin, setTargetCodeForAdmin] = useState('');

  // Estado para abrir una ficha específica en el módulo CRUD
  const [targetIdForFicha, setTargetIdForFicha] = useState(null);

  // Estado de conexión Supabase
  const [supabaseStatus, setSupabaseStatus] = useState('connecting'); // 'connected' | 'error' | 'connecting'

  // Notificaciones flotantes tipo Toast
  const [toast, setToast] = useState(null);

  // Cargar datos reales directamente desde Supabase en el montaje
  const loadFromSupabase = async () => {
    try {
      setSupabaseStatus('connecting');
      const { data: sociosData, error: sociosError } = await supabase
        .from('socios')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!sociosError && sociosData) {
        const mapped = sociosData.map(s => ({
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
          fechaInicio: s.fecha_inicio || s.fechaInicio || '',
          fechaVencimiento: s.fecha_vencimiento || s.fechaVencimiento || '',
          montoPagado: s.monto_pagado !== undefined ? Number(s.monto_pagado) : 0,
          metodoPago: s.metodo_pago || s.metodoPago || '',
          referenciaPago: s.referencia_pago || s.referenciaPago || '',
          numeroFactura: s.numero_factura || s.numeroFactura || '',
          tasaCambio: s.tasa_cambio !== undefined ? s.tasa_cambio : null,
          montoBs: s.monto_bs !== undefined ? s.monto_bs : 0,
          alergias: s.alergias || '',
          notas: s.notas || '',
          historialPagos: s.historial_pagos || s.historialPagos || []
        }));
        setAfiliados(mapped);
        setSupabaseStatus('connected');
        console.log('[Supabase] Conectado y cargados', mapped.length, 'socios reales desde Supabase.');
      } else if (sociosError) {
        console.warn('[Supabase Socios Error]', sociosError.message);
        setSupabaseStatus('error');
      }

      const { data: memData, error: memError } = await supabase.from('membresias').select('*');
      if (!memError && memData && memData.length > 0) {
        const mappedMem = memData.map(m => ({
          id: m.id,
          nombre: m.nombre,
          codigo: m.codigo,
          precioUSD: Number(m.precio_usd || m.precioUSD || 10),
          duracionDias: m.duracion_dias || m.duracionDias || 30,
          estado: m.estado || 'activa',
          moneda: m.moneda || 'USD',
          descripcion: m.descripcion || '',
          beneficios: m.beneficios || []
        }));
        setMemberships(mappedMem);
      }
    } catch (err) {
      console.warn('[Supabase] Error conectando a Supabase:', err);
      setSupabaseStatus('error');
    }
  };

  useEffect(() => {
    loadFromSupabase();
  }, []);

  // Función para sincronizar un socio en Supabase
  const syncSocioToSupabase = async (member) => {
    try {
      const isValidUUID = member.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(member.id);
      const socioId = isValidUUID ? member.id : crypto.randomUUID();

      const payload = {
        id: socioId,
        codigo: member.codigo,
        nombre_nino: member.nombreNino,
        foto_perfil: member.fotoPerfil || '',
        fecha_nacimiento: member.fechaNacimiento || '2020-01-01',
        tutor_nombre: member.tutorNombre || 'Tutor',
        tutor_cedula: member.tutorCedula || '',
        parentesco_tutor: member.parentescoTutor || 'Padre',
        tutor_telefono: member.tutorTelefono || '',
        estado: member.estado || 'pendiente',
        fecha_inicio: member.fechaInicio || null,
        fecha_vencimiento: member.fechaVencimiento || null,
        monto_pagado: Number(member.montoPagado) || 0,
        metodo_pago: member.metodoPago || '',
        referencia_pago: member.referenciaPago || '',
        numero_factura: member.numeroFactura || '',
        tasa_cambio: member.tasaCambio || null,
        monto_bs: member.montoBs || null,
        alergias: member.alergias || '',
        notas: member.notas || '',
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase.from('socios').upsert({
        ...payload,
        historial_pagos: member.historialPagos || []
      });

      if (error) {
        if (error.message?.includes('historial_pagos')) {
          await supabase.from('socios').upsert(payload);
        } else {
          console.warn('[Supabase Sync Error]', error.message);
        }
      }
    } catch (err) {
      console.warn('[Supabase Sync Exception]', err);
    }
  };

  // Guardar en localStorage como respaldo offline
  useEffect(() => {
    saveAfiliadosToStorage(afiliados);
  }, [afiliados]);

  useEffect(() => {
    saveMembershipsToStorage(memberships);
  }, [memberships]);

  const handleSaveMemberships = async (newMemberships) => {
    setMemberships(newMemberships);
    try {
      for (const m of newMemberships) {
        const isUUID = m.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(m.id);
        const memId = isUUID ? m.id : '1fd3cb06-6dc4-4393-bf5e-da17c60c7523';
        await supabase.from('membresias').upsert({
          id: memId,
          codigo: m.codigo,
          nombre: m.nombre,
          precio_usd: Number(m.precioUSD) || 10,
          duracion_dias: Number(m.duracionDias) || 30,
          estado: m.estado || 'activa',
          moneda: m.moneda || 'USD',
          descripcion: m.descripcion || '',
          beneficios: m.beneficios || [],
          updated_at: new Date().toISOString()
        });
      }
    } catch (err) {
      console.warn('[Supabase Membresias Sync Error]', err);
    }
  };

  const handleUpdateTasa = (newTasa) => {
    setTasaDolar(newTasa);
    saveTasaDolarToStorage(newTasa);
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
   * actualiza en localStorage y emite console.log simulando webhook POST a n8n.
   */
  const handleApprovePayment = (id, monto, details = {}) => {
    const today = new Date();
    const fechaInicioStr = today.toISOString().split('T')[0];

    // Calcular fecha de vencimiento sumando 30 días a la fecha actual
    const fechaVencimiento = new Date(today);
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);
    const fechaVencimientoStr = fechaVencimiento.toISOString().split('T')[0];

    let updatedMember = null;

    setAfiliados((prev) => {
      const updated = prev.map((item) => {
        if (item.id === id) {
          const nuevoMontoUSD = (Number(item.montoPagado) || 0) + Number(monto);
          const now = new Date();
          const timeStr = now.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', hour12: true });

          const facNum = details.numeroFactura && details.numeroFactura.trim() !== ''
            ? details.numeroFactura.trim()
            : `FAC-2026-${Math.floor(100 + Math.random() * 900)}`;

          const newTransaction = {
            id: `TXN-${item.codigo}-${Date.now().toString(36).substring(3).toUpperCase()}`,
            fecha: fechaInicioStr,
            hora: timeStr,
            montoUSD: Number(monto),
            metodoPago: details.metodo || 'Efectivo $',
            referenciaPago: details.referencia || 'EFE-CONTADO',
            numeroFactura: facNum,
            tasaCambio: details.tasaCambio || null,
            montoBs: details.montoBs || null,
            concepto: details.concepto || 'Cobro de Membresía VIP (30 Días)',
            cajero: 'Caja Restaurante Principal'
          };

          const prevHistory = Array.isArray(item.historialPagos) ? item.historialPagos : [];

          updatedMember = {
            ...item,
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
          return updatedMember;
        }
        return item;
      });
      return updated;
    });

    if (updatedMember) {
      syncSocioToSupabase(updatedMember);
    }

    // Simulación de Webhook n8n vía console.log (con datos completos en USD y equivalencia en Bolívares)
    const n8nPayload = {
      event: 'club_infantil.payment_approved',
      timestamp: new Date().toISOString(),
      source: 'pos_caja_restaurante',
      data: {
        afiliadoId: id,
        codigo: updatedMember ? updatedMember.codigo : '',
        nombreNino: updatedMember ? updatedMember.nombreNino : '',
        tutorNombre: updatedMember ? updatedMember.tutorNombre : '',
        tutorCedula: updatedMember ? updatedMember.tutorCedula : '',
        parentescoTutor: updatedMember ? updatedMember.parentescoTutor : '',
        tutorTelefono: updatedMember ? updatedMember.tutorTelefono : '',
        monedaBase: 'USD',
        montoPagadoUSD: Number(monto),
        tasaCambioBsUSD: details.tasaCambio || null,
        montoEquivalenteBs: details.montoBs || null,
        metodoPago: details.metodo || 'Efectivo $',
        referenciaPago: details.referencia || 'N/A',
        numeroFactura: updatedMember ? updatedMember.numeroFactura : 'N/A',
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
      message: `Cobro de $ ${Number(monto).toFixed(2)} USD vía ${details.metodo || 'Efectivo'}${detalleBs}${details.referencia ? ' [Ref: ' + details.referencia + ']' : ''} registrado para ${updatedMember?.nombreNino}. Membresía activa hasta el ${fechaVencimientoStr}.`
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
   * CRUD: Crear o Actualizar Ficha de Niño
   */
  const handleSaveMember = (member, isNew) => {
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
    syncSocioToSupabase(finalizedMember);

    setToast({
      type: 'success',
      title: isNew ? 'Nueva Ficha Registrada' : 'Ficha Actualizada',
      message: `${finalizedMember.nombreNino} (${finalizedMember.codigo}) guardado con éxito en el Club Infantil.`
    });
  };

  /**
   * CRUD: Eliminar Ficha de Niño
   */
  const handleDeleteMember = async (id) => {
    const member = afiliados.find((a) => a.id === id);
    setAfiliados((prev) => prev.filter((item) => item.id !== id));

    try {
      await supabase.from('socios').delete().eq('id', id);
    } catch (err) {
      console.warn('[Supabase Delete Exception]', err);
    }

    setToast({
      type: 'info',
      title: 'Ficha Eliminada',
      message: `El expediente de ${member ? member.nombreNino : 'afiliado'} fue eliminado del sistema.`
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
            onUpdateTasa={handleUpdateTasa}
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
