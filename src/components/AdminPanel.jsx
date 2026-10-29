/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  CreditCard, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  PlusCircle, 
  Webhook, 
  UserPlus, 
  DollarSign, 
  Users, 
  Calendar, 
  Phone, 
  X,
  Sparkles,
  ArrowUpDown,
  Filter,
  Calculator,
  RefreshCw,
  Coins,
  History,
  Receipt,
  FileText,
  Eye,
  Clock,
  Building2
} from 'lucide-react';
import { 
  calculateAge, 
  checkIsActiveAndValid, 
  getTasaDolarFromStorage, 
  saveTasaDolarToStorage, 
  DEFAULT_TASA_DOLAR, 
  formatUSD, 
  formatBs,
  getKidAvatar
} from '../mockData.js';
import PaymentReceiptModal from './PaymentReceiptModal.jsx';

export default function AdminPanel({
  afiliados,
  onApprovePayment,
  onSimulateWebhook,
  initialFilterCode = '',
  onViewChildProfile,
  memberships = []
}) {
  const [searchTerm, setSearchTerm] = useState(initialFilterCode || '');
  const [statusFilter, setStatusFilter] = useState('todas'); // 'todas' | 'activa' | 'pendiente' | 'vencida'

  // Tasa del dólar en Bs. (se puede modificar manualmente en el modal y se almacena en memoria/storage)
  const [tasaDolar, setTasaDolar] = useState(() => getTasaDolarFromStorage());

  // Formas de pago disponibles y configuración de referencia
  const METODOS_PAGO = [
    { 
      id: 'Pago Móvil', 
      label: 'Pago Móvil (Bs.)', 
      requiresRef: true, 
      isBs: true, 
      placeholder: 'Ej: Últimos 6 dígitos (894120)' 
    },
    { 
      id: 'Tarjeta', 
      label: 'Tarjeta / Punto (Bs.)', 
      requiresRef: true, 
      isBs: true, 
      placeholder: 'Ej: Nro. de Aprobación o Lote' 
    },
    { 
      id: 'Transferencia', 
      label: 'Transferencia (Bs.)', 
      requiresRef: true, 
      isBs: true, 
      placeholder: 'Ej: Nro. de Comprobante' 
    },
    { 
      id: 'Sended', 
      label: 'Sended', 
      requiresRef: true, 
      isBs: false, 
      placeholder: 'Ej: Referencia o ID Sended' 
    },
    { 
      id: 'Efectivo $', 
      label: 'Efectivo ($ USD)', 
      requiresRef: false, 
      isBs: false, 
      placeholder: 'Opcional' 
    }
  ];

  const defaultPriceUSD = memberships && memberships.length > 0 ? String(memberships[0].precioUSD || '10.00') : '10.00';

  // Modal de Registrar Pago
  const [selectedMember, setSelectedMember] = useState(null);
  const [montoUSD, setMontoUSD] = useState(defaultPriceUSD); // Monto base estándar en $ USD ($10.00)
  const [modalTasa, setModalTasa] = useState(String(tasaDolar)); // Tasa editable manualmente en el modal
  const [metodoPago, setMetodoPago] = useState('Pago Móvil');
  const [referenciaPago, setReferenciaPago] = useState('');
  const [numeroFactura, setNumeroFactura] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modo de pestaña en el módulo de pagos: 'cobros' | 'historial_general'
  const [activeTab, setActiveTab] = useState('cobros');

  // Filtro para el Historial General
  const [historySearchTerm, setHistorySearchTerm] = useState('');
  const [historyMethodFilter, setHistoryMethodFilter] = useState('todos');

  // Modal para ver Comprobante Auditado de un Pago
  const [selectedReceipt, setSelectedReceipt] = useState(null); // { transaction, member }

  // Modal para ver Historial de Pagos de un Socio Individual
  const [memberHistoryModal, setMemberHistoryModal] = useState(null); // member object

  // Lista aplanada de todas las transacciones financieras del sistema
  const allTransactions = useMemo(() => {
    const list = [];
    afiliados.forEach((member) => {
      const history = Array.isArray(member.historialPagos) ? member.historialPagos : [];
      history.forEach((txn) => {
        list.push({
          transaction: txn,
          member
        });
      });
    });

    // Ordenar descendente por fecha/hora
    return list.sort((a, b) => {
      const dateA = a.transaction.fecha || '';
      const dateB = b.transaction.fecha || '';
      return dateB.localeCompare(dateA);
    });
  }, [afiliados]);

  // Transacciones filtradas para el Historial General
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(({ transaction, member }) => {
      if (historyMethodFilter !== 'todos' && transaction.metodoPago !== historyMethodFilter) {
        return false;
      }

      if (!historySearchTerm.trim()) return true;
      const term = historySearchTerm.toLowerCase();

      return (
        (transaction.id || '').toLowerCase().includes(term) ||
        (member.codigo || '').toLowerCase().includes(term) ||
        (member.nombreNino || '').toLowerCase().includes(term) ||
        (member.tutorNombre || '').toLowerCase().includes(term) ||
        (member.tutorCedula || '').toLowerCase().includes(term) ||
        (transaction.referenciaPago || '').toLowerCase().includes(term) ||
        (transaction.numeroFactura || '').toLowerCase().includes(term) ||
        (transaction.concepto || '').toLowerCase().includes(term)
      );
    });
  }, [allTransactions, historySearchTerm, historyMethodFilter]);

  // Filtro de lista
  const filteredAfiliados = afiliados.filter((af) => {
    if (statusFilter !== 'todas') {
      if (statusFilter === 'activa' && !checkIsActiveAndValid(af)) return false;
      if (statusFilter === 'pendiente' && af.estado !== 'pendiente') return false;
      if (statusFilter === 'vencida' && (af.estado !== 'vencida' && checkIsActiveAndValid(af))) return false;
    }

    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const matchCodigo = af.codigo.toLowerCase().includes(term);
    const matchNino = af.nombreNino.toLowerCase().includes(term);
    const matchTutor = af.tutorNombre.toLowerCase().includes(term);
    const matchCedula = (af.tutorCedula || '').toLowerCase().includes(term);
    const matchTel = af.tutorTelefono.toLowerCase().includes(term);
    const matchRef = (af.referenciaPago || '').toLowerCase().includes(term);
    const matchFac = (af.numeroFactura || '').toLowerCase().includes(term);

    return matchCodigo || matchNino || matchTutor || matchCedula || matchTel || matchRef || matchFac;
  });

  // Métricas globales en Dólar Americano ($ USD)
  const totalAfiliados = afiliados.length;
  const activasCount = afiliados.filter((a) => checkIsActiveAndValid(a)).length;
  const pendientesCount = afiliados.filter((a) => a.estado === 'pendiente').length;
  const vencidasCount = afiliados.filter((a) => a.estado === 'vencida' || (!checkIsActiveAndValid(a) && a.estado !== 'pendiente')).length;
  
  // Suma total recaudada acumulada estrictamente en Dólares ($ USD)
  const totalRecaudadoUSD = afiliados.reduce((acc, curr) => acc + (Number(curr.montoPagado) || 0), 0);
  const totalRecaudadoBsEquivalente = totalRecaudadoUSD * (Number(tasaDolar) || DEFAULT_TASA_DOLAR);

  const openPaymentModal = (member) => {
    setSelectedMember(member);
    setMontoUSD(defaultPriceUSD); // Monto sugerido de membresía en $ USD
    setModalTasa(String(tasaDolar));
    setMetodoPago('Pago Móvil');
    setReferenciaPago('');
    setNumeroFactura(`FAC-2026-${Math.floor(100 + Math.random() * 900)}`);
  };

  const closePaymentModal = () => {
    setSelectedMember(null);
    setReferenciaPago('');
    setNumeroFactura('');
    setIsSubmitting(false);
  };

  // Cálculo en tiempo real para el modal
  const parsedMontoUSD = parseFloat(montoUSD) || 0;
  const parsedModalTasa = parseFloat(modalTasa) || 0;
  const calculadoBs = parsedMontoUSD * parsedModalTasa;
  const isSelectedMethodBs = METODOS_PAGO.find((m) => m.id === metodoPago)?.isBs;

  const handleConfirmPayment = (e) => {
    e.preventDefault();
    if (!selectedMember) return;

    if (isNaN(parsedMontoUSD) || parsedMontoUSD <= 0) {
      alert('Por favor ingresa un monto válido en Dólares ($ USD).');
      return;
    }

    if (isNaN(parsedModalTasa) || parsedModalTasa <= 0) {
      alert('Por favor ingresa una tasa de cambio válida (Bs. / USD).');
      return;
    }

    const currentMetodo = METODOS_PAGO.find((m) => m.id === metodoPago);
    if (currentMetodo?.requiresRef && !referenciaPago.trim()) {
      alert(`Para la forma de pago "${metodoPago}" es obligatorio registrar el número de referencia.`);
      return;
    }

    if (!numeroFactura.trim()) {
      alert('Por favor ingresa el número de factura.');
      return;
    }

    // Actualizar y recordar la tasa editada manualmente para futuros cobros
    setTasaDolar(parsedModalTasa);
    saveTasaDolarToStorage(parsedModalTasa);

    setIsSubmitting(true);

    // Se guarda estrictamente en USD, pasando los detalles de conversión, referencia y factura
    onApprovePayment(selectedMember.id, parsedMontoUSD, { 
      metodo: metodoPago, 
      referencia: referenciaPago.trim(),
      numeroFactura: numeroFactura.trim(),
      tasaCambio: parsedModalTasa,
      montoBs: calculadoBs
    });

    closePaymentModal();
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-4 md:py-8 space-y-6">
      {/* Encabezado y acción de webhook */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-700 bg-slate-100 px-3 py-1 rounded-full mb-2">
            <DollarSign className="w-3.5 h-3.5" />
            Módulo de Administración & Caja
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight">
            Gestión de Membresías y Cobros
          </h1>
          <p className="text-sm text-neutral-600 mt-0.5">
            Cobro en ventanilla en <strong className="text-neutral-900 font-bold">$ USD</strong> con conversión en tiempo real a <strong className="text-neutral-900 font-bold">Bolívares (Bs.)</strong>.
          </p>
        </div>

        {/* Acciones superiores: Tasa actual y Webhook */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Badge Informativo de la Tasa del Día */}
          <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
            <Coins className="w-4 h-4 text-emerald-700" />
            <div>
              <span className="text-emerald-700 font-medium">Tasa del día: </span>
              <span className="font-mono font-extrabold text-emerald-950">
                Bs. {Number(tasaDolar).toLocaleString('es-VE', { minimumFractionDigits: 2 })} / USD
              </span>
            </div>
          </div>

          {/* Botón Simular Webhook (Requerimiento explícito) */}
          <button
            type="button"
            onClick={onSimulateWebhook}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-corporate-600 hover:bg-corporate-700 active:bg-corporate-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            <Webhook className="w-4 h-4 text-corporate-200" />
            <span>Simular registro desde Webhook</span>
          </button>
        </div>
      </div>

      {/* KPI Cards de resumen de caja en Dólar Americano ($ USD) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Total Afiliados</span>
            <Users className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-neutral-900 tabular-nums">
            {totalAfiliados}
          </div>
          <div className="text-xs text-neutral-400 mt-1">Registrados en sistema</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold">
            <span>Membresías Activas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-700 tabular-nums">
            {activasCount}
          </div>
          <div className="text-xs text-emerald-600 mt-1">Con beneficios habilitados</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-amber-700 text-xs font-semibold">
            <span>Pendientes de Pago</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-700 tabular-nums">
            {pendientesCount}
          </div>
          <div className="text-xs text-amber-600 mt-1">Esperando activación en caja</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Total Recaudado ($ USD)</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-700 tabular-nums">
            $ {totalRecaudadoUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-neutral-500 mt-1 truncate" title={`Bs. ${totalRecaudadoBsEquivalente.toLocaleString('es-VE', { minimumFractionDigits: 2 })}`}>
            ≈ Bs. {totalRecaudadoBsEquivalente.toLocaleString('es-VE', { minimumFractionDigits: 2 })} (al cambio)
          </div>
        </div>
      </div>

      {/* Pestañas de Sub-Navegación: Registrar Cobros en Caja vs Vista General de Historial */}
      <div className="flex items-center border-b border-neutral-200 gap-4 pt-1">
        <button
          type="button"
          onClick={() => setActiveTab('cobros')}
          className={`pb-3 px-2 text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'cobros'
              ? 'border-corporate-600 text-corporate-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Registrar Cobro en Caja</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('historial_general')}
          className={`pb-3 px-2 text-sm font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'historial_general'
              ? 'border-corporate-600 text-corporate-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Vista General - Historial de Pagos</span>
          <span className="font-mono text-2xs font-bold bg-neutral-200 text-neutral-800 px-2 py-0.5 rounded-full">
            {allTransactions.length}
          </span>
        </button>
      </div>

      {/* PESTAÑA 1: REGISTRAR COBROS EN CAJA Y LISTA DE MIEMBROS */}
      {activeTab === 'cobros' && (
        <div className="space-y-4">
          {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white p-3 md:p-4 rounded-xl border border-neutral-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Input de búsqueda */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código, nombre del niño, tutor, C.I., teléfono o referencia..."
              className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-corporate-500 focus:bg-white transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-700"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Segmented control para estados */}
          <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg shrink-0">
            <button
              type="button"
              onClick={() => setStatusFilter('todas')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statusFilter === 'todas'
                  ? 'bg-white text-neutral-900 shadow-xs font-bold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Todas ({totalAfiliados})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('activa')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statusFilter === 'activa'
                  ? 'bg-white text-emerald-800 shadow-xs font-bold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Activas ({activasCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pendiente')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statusFilter === 'pendiente'
                  ? 'bg-white text-amber-800 shadow-xs font-bold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Pendientes ({pendientesCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('vencida')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                statusFilter === 'vencida'
                  ? 'bg-white text-rose-800 shadow-xs font-bold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              Vencidas ({vencidasCount})
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Afiliados */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-neutral-50/80 border-b border-neutral-200 text-xs font-bold uppercase tracking-wider text-neutral-500">
                <th className="py-3.5 px-4">Código</th>
                <th className="py-3.5 px-4">Niño / Edad</th>
                <th className="py-3.5 px-4">Representante & C.I.</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4">Vigencia (Vencimiento)</th>
                <th className="py-3.5 px-4 text-right">Monto Pagado ($ USD)</th>
                <th className="py-3.5 px-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredAfiliados.length > 0 ? (
                filteredAfiliados.map((af) => {
                  const isActive = checkIsActiveAndValid(af);
                  const isPending = af.estado === 'pendiente';
                  const isExpired = af.estado === 'vencida' || (!isActive && !isPending);
                  const age = calculateAge(af.fechaNacimiento);
                  const montoUSDNum = Number(af.montoPagado) || 0;
                  const montoBsEquiv = af.montoBs || montoUSDNum * (af.tasaCambio || Number(tasaDolar) || DEFAULT_TASA_DOLAR);

                  return (
                    <tr
                      key={af.id}
                      className="hover:bg-neutral-50/70 transition-colors"
                    >
                      {/* Código */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-neutral-900 bg-neutral-100 px-2.5 py-1 rounded-md text-xs border border-neutral-200">
                          {af.codigo}
                        </span>
                      </td>

                      {/* Niño */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={getKidAvatar(af)}
                            alt={af.nombreNino}
                            className="w-9 h-9 rounded-xl object-cover border border-neutral-200 shadow-2xs shrink-0"
                          />
                          <div>
                            <div className="font-bold text-neutral-900">{af.nombreNino}</div>
                            <div className="text-xs text-neutral-500">
                              {age !== null ? `${age} años` : 'N/D'} · Nac. {af.fechaNacimiento}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Representante & Teléfono */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-medium text-neutral-800">{af.tutorNombre}</span>
                          <span className="text-[10px] bg-neutral-100 border border-neutral-200 text-neutral-600 font-medium px-1.5 py-0.5 rounded">
                            {af.parentescoTutor || 'Representante'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-500 font-mono flex-wrap">
                          {af.tutorCedula && (
                            <span className="font-semibold text-neutral-700 bg-neutral-100 px-1.5 py-0.2 rounded text-2xs border border-neutral-200">
                              C.I. {af.tutorCedula}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-neutral-400" />
                            <span>{af.tutorTelefono}</span>
                          </span>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isActive && (
                          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Activa</span>
                          </div>
                        )}
                        {isPending && (
                          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Pendiente</span>
                          </div>
                        )}
                        {isExpired && (
                          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Vencida</span>
                          </div>
                        )}
                      </td>

                      {/* Vigencia */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-mono text-xs font-medium text-neutral-800">
                          {af.fechaVencimiento || 'Sin vigencia'}
                        </div>
                        <div className="text-2xs text-neutral-400">
                          Inicio: {af.fechaInicio || 'N/D'}
                        </div>
                      </td>

                      {/* Monto Pagado en Dólares ($ USD) y referencia en Bs. */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="font-mono font-bold text-neutral-900 tabular-nums">
                          $ {montoUSDNum.toFixed(2)} USD
                        </div>
                        {montoUSDNum > 0 && (
                          <div className="text-2xs text-emerald-700 font-mono">
                            ≈ Bs. {montoBsEquiv.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        )}
                        {af.metodoPago && (
                          <div className="text-2xs text-corporate-700 font-semibold">
                            {af.metodoPago}
                          </div>
                        )}
                        {af.referenciaPago && (
                          <div className="text-2xs text-neutral-500 font-mono">
                            Ref: {af.referenciaPago}
                          </div>
                        )}
                      </td>

                      {/* Acción de Caja: Registrar Pago, Ficha e Historial */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onViewChildProfile && onViewChildProfile(af.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors cursor-pointer"
                            title="Ver Ficha Completa del Niño"
                          >
                            <span>Ficha</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setMemberHistoryModal(af)}
                            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-semibold text-corporate-800 bg-corporate-50 hover:bg-corporate-100 border border-corporate-200/80 rounded-lg transition-colors cursor-pointer"
                            title="Ver Historial de Pagos de este Socio"
                          >
                            <History className="w-3.5 h-3.5 text-corporate-700" />
                            <span>Historial</span>
                          </button>

                          {isPending || isExpired ? (
                            <button
                              type="button"
                              onClick={() => openPaymentModal(af)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-lg transition-colors shadow-2xs cursor-pointer"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Registrar Pago</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openPaymentModal(af)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors cursor-pointer"
                              title="Renovar anticipadamente"
                            >
                              <span>Renovar</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-neutral-500">
                    No se encontraron afiliados que coincidan con los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )}

      {/* ========================================================
          PESTAÑA 2: VISTA GENERAL DEL HISTORIAL DE PAGOS (TODAS LAS TRANSACCIONES)
          ======================================================== */}
      {activeTab === 'historial_general' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Barra de Filtros para el Historial General */}
          <div className="bg-white p-3 md:p-4 rounded-xl border border-neutral-200 shadow-2xs space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              {/* Input de búsqueda en historial */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={historySearchTerm}
                  onChange={(e) => setHistorySearchTerm(e.target.value)}
                  placeholder="Buscar en historial por Nro. Transacción, Código, Niño, Tutor o Referencia..."
                  className="w-full pl-9 pr-4 py-2 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-corporate-500 focus:bg-white transition-all"
                />
                {historySearchTerm && (
                  <button
                    type="button"
                    onClick={() => setHistorySearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-700"
                  >
                    Limpiar
                  </button>
                )}
              </div>

              {/* Filtro por Forma de Pago */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-2xs font-bold uppercase tracking-wider text-neutral-400">Forma de Pago:</span>
                <select
                  value={historyMethodFilter}
                  onChange={(e) => setHistoryMethodFilter(e.target.value)}
                  className="px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-corporate-500 cursor-pointer"
                >
                  <option value="todos">Todos los métodos</option>
                  <option value="Pago Móvil">Pago Móvil</option>
                  <option value="Tarjeta">Tarjeta / Punto</option>
                  <option value="Transferencia">Transferencia</option>
                  <option value="Sended">Sended</option>
                  <option value="Efectivo $">Efectivo ($ USD)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tabla General de Transacciones Financieras */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-500 font-bold uppercase tracking-wider border-b border-neutral-200">
                  <tr>
                    <th className="py-3 px-4">Fecha / Hora</th>
                    <th className="py-3 px-4">Nro. Transacción</th>
                    <th className="py-3 px-4">Nº Factura</th>
                    <th className="py-3 px-4">Socio Niño</th>
                    <th className="py-3 px-4">Representante</th>
                    <th className="py-3 px-4">Método & Referencia</th>
                    <th className="py-3 px-4 text-right">Monto ($ USD)</th>
                    <th className="py-3 px-4 text-right">Equivalencia (Bs.)</th>
                    <th className="py-3 px-4 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map(({ transaction, member }) => {
                      return (
                        <tr key={transaction.id || Math.random()} className="hover:bg-neutral-50/80 transition-colors">
                          {/* Fecha */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-mono font-bold text-neutral-900">
                              {transaction.fecha}
                            </div>
                            {transaction.hora && (
                              <div className="text-2xs text-neutral-400 font-mono">
                                {transaction.hora}
                              </div>
                            )}
                          </td>

                          {/* ID Transacción */}
                          <td className="py-3 px-4 font-mono font-bold text-neutral-700 whitespace-nowrap">
                            <span className="bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded text-2xs">
                              {transaction.id}
                            </span>
                          </td>

                          {/* Nº Factura */}
                          <td className="py-3 px-4 font-mono font-bold text-emerald-900 whitespace-nowrap">
                            <span className="bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-2xs">
                              {transaction.numeroFactura || 'FAC-2026-001'}
                            </span>
                          </td>

                          {/* Socio Niño */}
                          <td className="py-3 px-4 font-medium text-neutral-900">
                            <div className="flex items-center gap-2">
                              <img
                                src={getKidAvatar(member)}
                                alt={member.nombreNino}
                                className="w-8 h-8 rounded-lg object-cover border border-neutral-200 shrink-0"
                              />
                              <div>
                                <div className="font-bold text-neutral-900 leading-tight">
                                  {member.nombreNino}
                                </div>
                                <span className="font-mono text-2xs text-corporate-700">
                                  {member.codigo}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Representante */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-medium text-neutral-800">{member.tutorNombre}</div>
                            {member.tutorCedula && (
                              <div className="text-2xs text-neutral-500 font-mono">
                                C.I. {member.tutorCedula}
                              </div>
                            )}
                          </td>

                          {/* Método & Referencia */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-bold text-corporate-900 bg-corporate-50 border border-corporate-200/80 px-2 py-0.5 rounded text-2xs">
                              {transaction.metodoPago}
                            </span>
                            <div className="font-mono text-2xs text-neutral-600 mt-0.5">
                              Ref: {transaction.referenciaPago || 'N/A'}
                            </div>
                          </td>

                          {/* Monto USD */}
                          <td className="py-3 px-4 text-right font-mono font-bold text-neutral-900 whitespace-nowrap">
                            {formatUSD(transaction.montoUSD)}
                          </td>

                          {/* Monto Bs. */}
                          <td className="py-3 px-4 text-right font-mono font-bold text-emerald-800 whitespace-nowrap">
                            {transaction.montoBs 
                              ? formatBs(transaction.montoBs) 
                              : formatBs((transaction.montoUSD || 0) * (transaction.tasaCambio || DEFAULT_TASA_DOLAR))}
                            {transaction.tasaCambio && (
                              <div className="text-[10px] text-neutral-400 font-normal">
                                @ {transaction.tasaCambio.toFixed(2)} Bs/$
                              </div>
                            )}
                          </td>

                          {/* Ver Comprobante */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setSelectedReceipt({ transaction, member })}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-2xs rounded-lg transition-colors shadow-2xs cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Ver Comprobante</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-sm text-neutral-500">
                        No hay registros de pagos que coincidan con la búsqueda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL PARA REGISTRAR PAGO EN CAJA ($ USD + CONVERSIÓN BS)
          ======================================================== */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-neutral-200 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[94vh] flex flex-col">
            {/* Header del Modal */}
            <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-900">Registrar Pago en Caja</h3>
                  <p className="text-xs text-neutral-500">Membresía en Dólares ($ USD) con conversión a Bolívares</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closePaymentModal}
                className="w-8 h-8 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Formulario de Pago */}
            <form onSubmit={handleConfirmPayment} className="p-6 space-y-4 overflow-y-auto">
              {/* Resumen del afiliado a pagar */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-500 font-medium">Socio a activar:</span>
                  <span className="font-mono font-bold text-neutral-900 bg-neutral-200/80 px-2 py-0.5 rounded text-2xs">
                    {selectedMember.codigo}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <img
                    src={getKidAvatar(selectedMember)}
                    alt={selectedMember.nombreNino}
                    className="w-12 h-12 rounded-xl object-cover border border-neutral-200 shadow-2xs shrink-0"
                  />
                  <div>
                    <div className="text-base font-extrabold text-neutral-900 leading-tight">
                      {selectedMember.nombreNino}
                    </div>
                    <div className="text-xs text-neutral-600 flex items-center gap-1.5 flex-wrap mt-0.5">
                      <span>Representante ({selectedMember.parentescoTutor || 'Tutor'}): <strong>{selectedMember.tutorNombre}</strong></span>
                      {selectedMember.tutorCedula && (
                        <span className="font-mono bg-neutral-200/80 text-neutral-800 px-1.5 py-0.5 rounded text-2xs font-semibold">
                          C.I. {selectedMember.tutorCedula}
                        </span>
                      )}
                      <span>· Tel: {selectedMember.tutorTelefono}</span>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-amber-700 pt-1 font-medium border-t border-neutral-200/60">
                  Estado actual: <span className="uppercase font-bold">{selectedMember.estado}</span>
                </div>
              </div>

              {/* Tasa del Dólar y Monto en USD (Lado a Lado) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Tasa del Dólar manual */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-neutral-700 uppercase tracking-wide">
                      Tasa del Dólar (Bs./USD) *
                    </label>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-bold text-xs">
                      Bs.
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      value={modalTasa}
                      onChange={(e) => setModalTasa(e.target.value)}
                      required
                      placeholder="65.00"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-neutral-300 rounded-xl font-mono text-base font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-corporate-500"
                    />
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Editable manualmente en cada cobro.
                  </p>
                </div>

                {/* Monto a Registrar en Dólar Americano ($ USD) */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wide">
                    Monto en Dólares ($ USD) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-700 font-bold text-base">
                      $
                    </span>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={montoUSD}
                      onChange={(e) => setMontoUSD(e.target.value)}
                      required
                      className="w-full pl-8 pr-14 py-2 bg-white border border-neutral-300 rounded-xl font-mono text-base font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="25.00"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">
                      USD
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Se almacena y registra en $ USD.
                  </p>
                </div>
              </div>

              {/* Selector de Forma de Cobro */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5 uppercase tracking-wide">
                  Forma de Cobro *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {METODOS_PAGO.map((m) => {
                    const isSelected = metodoPago === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setMetodoPago(m.id);
                          if (!m.requiresRef) {
                            setReferenciaPago('');
                          }
                        }}
                        className={`py-2 px-2.5 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-corporate-50 border-corporate-600 text-corporate-900 font-bold shadow-2xs'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        {m.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CARD DE CONVERSIÓN EN TIEMPO REAL A BOLÍVARES (Requerimiento explícito) */}
              {isSelectedMethodBs ? (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-xl p-4 shadow-2xs space-y-1 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 flex items-center gap-1.5">
                      <Calculator className="w-4 h-4 text-emerald-700" />
                      Monto a cobrar en Bolívares ({metodoPago})
                    </span>
                    <span className="text-2xs bg-emerald-200 text-emerald-900 font-mono px-2 py-0.5 rounded font-bold">
                      Tasa: Bs. {parsedModalTasa.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="text-2xl font-black font-mono text-emerald-900 tracking-tight pt-1">
                    Bs. {calculadoBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>

                  <div className="text-2xs text-emerald-800 flex items-center justify-between border-t border-emerald-200/80 pt-1.5 mt-1 font-medium">
                    <span>Cálculo: ${parsedMontoUSD.toFixed(2)} USD × Bs. {parsedModalTasa.toFixed(2)}</span>
                    <span className="font-bold">Guardará: ${parsedMontoUSD.toFixed(2)} USD</span>
                  </div>
                </div>
              ) : metodoPago === 'Sended' ? (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 space-y-1 text-xs text-blue-950 animate-in fade-in duration-150">
                  <div className="font-bold flex items-center justify-between">
                    <span>Cobro vía Sended:</span>
                    <span className="font-mono font-bold">$ {parsedMontoUSD.toFixed(2)} USD</span>
                  </div>
                  <div className="text-2xs text-blue-800">
                    Equivalente referencial en Bs.: <strong className="font-mono">Bs. {calculadoBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</strong>
                  </div>
                </div>
              ) : (
                <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-xs text-neutral-700">
                  <div className="font-bold flex items-center justify-between">
                    <span>Cobro en Efectivo directo en Dólares:</span>
                    <span className="font-mono font-bold text-neutral-900">$ {parsedMontoUSD.toFixed(2)} USD</span>
                  </div>
                  <p className="text-2xs text-neutral-500 mt-0.5">
                    No requiere comprobante bancario.
                  </p>
                </div>
              )}

              {/* Campo: Número de Factura Fiscal / Control POS */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-3.5 space-y-1.5">
                <label className="block text-xs font-bold text-neutral-800 uppercase tracking-wide">
                  Número de Factura Fiscal / POS *
                </label>
                <input
                  type="text"
                  value={numeroFactura}
                  onChange={(e) => setNumeroFactura(e.target.value)}
                  required
                  placeholder="Ej: FAC-2026-0012"
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg font-mono text-sm font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-corporate-500"
                />
                <p className="text-2xs text-neutral-500">
                  Número comprobante fiscal/recibo de caja emitido.
                </p>
              </div>

              {/* Campo: Número de Referencia (Obligatorio para Pago Móvil, Tarjeta, Transferencia, Sended) */}
              {METODOS_PAGO.find((m) => m.id === metodoPago)?.requiresRef && (
                <div className="bg-amber-50/80 border border-amber-300 rounded-xl p-3.5 space-y-1.5 animate-in fade-in duration-150">
                  <label className="block text-xs font-bold text-amber-950 uppercase tracking-wide">
                    Número de Referencia ({metodoPago}) *
                  </label>
                  <input
                    type="text"
                    value={referenciaPago}
                    onChange={(e) => setReferenciaPago(e.target.value)}
                    required
                    placeholder={METODOS_PAGO.find((m) => m.id === metodoPago)?.placeholder}
                    className="w-full px-3 py-2 bg-white border border-amber-300 rounded-lg font-mono text-sm font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:font-normal placeholder:text-neutral-400"
                  />
                  <p className="text-2xs text-amber-800">
                    Obligatorio para conciliar pagos de {metodoPago}.
                  </p>
                </div>
              )}

              {/* Nota informativa de la activación */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900">
                <p className="font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Activará 30 días continuos de beneficios</span>
                </p>
                <p className="text-emerald-700 mt-0.5 pl-5 text-2xs">
                  Cambiará el estado a <strong className="uppercase">activa</strong>, guardará el cobro de ${parsedMontoUSD.toFixed(2)} USD en la ficha y emitirá el webhook a n8n.
                </p>
              </div>

              {/* Botones de acción */}
              <div className="pt-2 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={closePaymentModal}
                  className="px-4 py-2.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Procesando...' : `Confirmar y Cobrar $${parsedMontoUSD.toFixed(2)} USD`}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: HISTORIAL INDIVIDUAL DE PAGOS DE UN SOCIO
          ======================================================== */}
      {memberHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-neutral-200 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <img
                  src={getKidAvatar(memberHistoryModal)}
                  alt={memberHistoryModal.nombreNino}
                  className="w-10 h-10 rounded-xl object-cover border border-neutral-200 shadow-2xs"
                />
                <div>
                  <h3 className="text-base font-extrabold text-neutral-900 leading-tight">
                    Historial de Pagos: {memberHistoryModal.nombreNino}
                  </h3>
                  <p className="text-2xs text-neutral-500 font-mono">
                    Código: {memberHistoryModal.codigo} · Representante: {memberHistoryModal.tutorNombre}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMemberHistoryModal(null)}
                className="w-8 h-8 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido con lista de pagos del socio */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between text-xs bg-neutral-50 p-3 rounded-2xl border border-neutral-200">
                <div>
                  <span className="text-neutral-500 block text-2xs">Total Historico Abonado:</span>
                  <span className="font-mono font-black text-neutral-900 text-sm">
                    {formatUSD(memberHistoryModal.montoPagado || 0)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-neutral-500 block text-2xs">Estado Actual:</span>
                  <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded text-2xs uppercase">
                    {memberHistoryModal.estado}
                  </span>
                </div>
              </div>

              {/* Lista de transacciones del socio */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Registros de Pago del Socio:
                </div>

                {Array.isArray(memberHistoryModal.historialPagos) && memberHistoryModal.historialPagos.length > 0 ? (
                  memberHistoryModal.historialPagos.map((txn) => (
                    <div
                      key={txn.id || Math.random()}
                      className="p-3.5 bg-white border border-neutral-200 hover:border-corporate-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors shadow-2xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-2xs font-bold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                            {txn.id}
                          </span>
                          <span className="font-mono text-2xs font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {txn.numeroFactura || 'FAC-2026-001'}
                          </span>
                          <span className="text-2xs text-neutral-400 font-mono">
                            {txn.fecha} {txn.hora ? `· ${txn.hora}` : ''}
                          </span>
                        </div>
                        <div className="text-xs font-extrabold text-neutral-900">
                          {txn.concepto || 'Cobro de Membresía VIP'}
                        </div>
                        <div className="text-2xs text-neutral-500 flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-corporate-800 bg-corporate-50 px-1.5 py-0.2 rounded border border-corporate-200/60">
                            {txn.metodoPago}
                          </span>
                          <span>· Ref: <strong className="font-mono">{txn.referenciaPago || 'N/A'}</strong></span>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-baseline sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                        <div className="font-mono font-black text-sm text-neutral-900">
                          {formatUSD(txn.montoUSD)}
                        </div>
                        <div className="text-2xs text-emerald-800 font-mono font-bold">
                          {txn.montoBs ? formatBs(txn.montoBs) : ''}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedReceipt({ transaction: txn, member: memberHistoryModal });
                          }}
                          className="mt-1 inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-lg text-2xs transition-colors cursor-pointer"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Ver Comprobante</span>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 bg-neutral-50 rounded-2xl text-center text-neutral-500 text-xs">
                    Sin historial de pagos anteriores registrado.
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setMemberHistoryModal(null)}
                className="px-4 py-2 bg-neutral-900 text-white font-bold text-xs rounded-xl hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: COMPROBANTE AUDITADO DE PAGO (RECIBO OFICIAL)
          ======================================================== */}
      {selectedReceipt && (
        <PaymentReceiptModal
          transaction={selectedReceipt.transaction}
          member={selectedReceipt.member}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
}
