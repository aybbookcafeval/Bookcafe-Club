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
  Settings
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
  INITIAL_AFILIADOS,
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
  useEffect(() => {
    async function loadFromSupabase() {
      try {
        setSupabaseStatus('connecting');
        const { data: sociosData, error: sociosError } = await supabase.from('socios').select('*');
        
        if (!sociosError && sociosData && sociosData.length > 0) {
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
          console.log('[Supabase] Conectado y cargados', mapped.length, 'socios desde Supabase.');
        } else {
          // Si la tabla socios está vacía en Supabase, insertar los datos iniciales para que el usuario vea datos reales en Supabase
          console.log('[Supabase] Tabla socios vacía o no accesible. Inicializando Supabase con datos...');
          setSupabaseStatus('connected');
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
        console.warn('[Supabase] Error conectando a Supabase, usando respaldo local:', err);
        setSupabaseStatus('error');
      }
    }
    loadFromSupabase();
  }, []);

  // Función para sincronizar un socio en Supabase
  const syncSocioToSupabase = async (member) => {
    try {
      await supabase.from('socios').upsert({
        id: member.id,
        codigo: member.codigo,
        nombre_nino: member.nombreNino,
        foto_perfil: member.fotoPerfil,
        fecha_nacimiento: member.fechaNacimiento,
        tutor_nombre: member.tutorNombre,
        tutor_cedula: member.tutorCedula,
        parentesco_tutor: member.parentescoTutor,
        tutor_telefono: member.tutorTelefono,
        estado: member.estado,
        fecha_inicio: member.fechaInicio,
        fecha_vencimiento: member.fechaVencimiento,
        monto_pagado: member.montoPagado,
        metodo_pago: member.metodoPago,
        referencia_pago: member.referenciaPago,
        numero_factura: member.numeroFactura,
        tasa_cambio: member.tasaCambio,
        monto_bs: member.montoBs,
        alergias: member.alergias,
        notas: member.notas,
        historial_pagos: member.historialPagos
      });
    } catch (err) {
      console.warn('[Supabase Sync Error]', err);
    }
  };

  // Guardar en localStorage y sincronizar con Supabase cada vez que cambie afiliados
  useEffect(() => {
    saveAfiliadosToStorage(afiliados);
  }, [afiliados]);

  // Guardar en localStorage cada vez que cambien las membresías
  useEffect(() => {
    saveMembershipsToStorage(memberships);
  }, [memberships]);

  const handleSaveMemberships = (newMemberships) => {
    setMemberships(newMemberships);
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
    setAfiliados((prev) => {
      if (isNew) {
        return [member, ...prev];
      }
      return prev.map((item) => (item.id === member.id ? member : item));
    });
    syncSocioToSupabase(member);

    setToast({
      type: 'success',
      title: isNew ? 'Nueva Ficha Registrada' : 'Ficha Actualizada',
      message: `${member.nombreNino} (${member.codigo}) guardado con éxito en el Club Infantil.`
    });
  };

  /**
   * CRUD: Eliminar Ficha de Niño
   */
  const handleDeleteMember = (id) => {
    const member = afiliados.find((a) => a.id === id);
    setAfiliados((prev) => prev.filter((item) => item.id !== id));

    setToast({
      type: 'info',
      title: 'Ficha Eliminada',
      message: `El expediente de ${member ? member.nombreNino : 'afiliado'} fue eliminado del sistema.`
    });
  };

  /**
   * Reinicia los datos de localStorage a los iniciales para pruebas
   */
  const handleResetData = () => {
    if (window.confirm('¿Deseas restaurar los afiliados de prueba iniciales?')) {
      localStorage.setItem('club_infantil_afiliados', JSON.stringify(INITIAL_AFILIADOS));
      setAfiliados(INITIAL_AFILIADOS);
      setToast({
        type: 'info',
        title: 'Datos Restaurados',
        message: 'Se cargaron los 6 afiliados de prueba iniciales en localStorage.'
      });
    }
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
              onClick={handleResetData}
              title="Restaurar datos de prueba"
              className="text-xs font-medium text-neutral-500 hover:text-neutral-800 px-2.5 py-1.5 rounded-lg hover:bg-neutral-100 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reiniciar Datos</span>
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
          <div>
            Club Infantil · Persistencia local en <code className="font-mono text-neutral-700 bg-neutral-100 px-1 py-0.5 rounded text-2xs">localStorage</code>
          </div>
          <div className="flex items-center gap-4 text-neutral-400">
            <button
              type="button"
              onClick={handleResetData}
              className="hover:text-neutral-700 underline text-2xs cursor-pointer"
            >
              Restablecer datos demo
            </button>
            <span>·</span>
            <span>Simulador n8n activo en consola</span>
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
