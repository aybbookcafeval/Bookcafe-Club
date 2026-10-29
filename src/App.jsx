/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  CreditCard, 
  Sparkles, 
  CheckCircle, 
  Webhook, 
  RotateCcw, 
  Store, 
  ChefHat,
  X,
  Bell,
  Users
} from 'lucide-react';
import Scanner from './components/Scanner.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import ChildProfileCRUD from './components/ChildProfileCRUD.jsx';
import { 
  getAfiliadosFromStorage, 
  saveAfiliadosToStorage, 
  generateWebhookDummy, 
  INITIAL_AFILIADOS 
} from './mockData.js';

export default function App() {
  // Pestaña activa: 'scanner' (Meseros) o 'admin' (Caja)
  const [activeTab, setActiveTab] = useState('scanner');
  
  // Estado global de afiliados cargado desde localStorage
  const [afiliados, setAfiliados] = useState(() => getAfiliadosFromStorage());

  // Estado para pre-filtrar o saltar a un afiliado al cambiar de pestaña
  const [targetCodeForAdmin, setTargetCodeForAdmin] = useState('');

  // Estado para abrir una ficha específica en el módulo CRUD
  const [targetIdForFicha, setTargetIdForFicha] = useState(null);

  // Notificaciones flotantes tipo Toast
  const [toast, setToast] = useState(null);

  // Guardar en localStorage cada vez que cambie la lista de afiliados
  useEffect(() => {
    saveAfiliadosToStorage(afiliados);
  }, [afiliados]);

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
          updatedMember = {
            ...item,
            estado: 'activa',
            fechaInicio: fechaInicioStr,
            fechaVencimiento: fechaVencimientoStr,
            montoPagado: nuevoMontoUSD, // Siempre registrado y almacenado en $ USD
            metodoPago: details.metodo || 'Efectivo $',
            referenciaPago: details.referencia || '',
            tasaCambio: details.tasaCambio || null,
            montoBs: details.montoBs || null
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
   * Simula un registro entrante desde un Webhook (ej: formulario online o n8n)
   */
  const handleSimulateWebhook = () => {
    const newMember = generateWebhookDummy(afiliados.length);
    setAfiliados((prev) => [newMember, ...prev]);

    // Simular recepción de webhook en consola
    console.log(
      '%c[Webhook n8n - INCOMING REGISTRATION: club_infantil.new_lead]',
      'color: #6366f1; font-weight: bold;',
      newMember
    );

    setToast({
      type: 'webhook',
      title: 'Nuevo Afiliado desde Webhook (n8n)',
      message: `Se recibió registro de ${newMember.nombreNino} (${newMember.codigo}). Estado: PENDIENTE de pago en Caja.`
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
              <QrCode className="w-4 h-4" />
              <span>Meseros (Scanner)</span>
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
            onSimulateWebhook={handleSimulateWebhook}
            initialFilterCode={targetCodeForAdmin}
            onViewChildProfile={handleViewChildProfile}
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
