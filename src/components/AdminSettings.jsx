import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  DollarSign,
  Calendar,
  Layers,
  Sparkles,
  Save,
  AlertCircle,
  Coins,
  FileText,
  X,
  Check,
  Tag,
  Gift,
  HelpCircle,
  Info,
  Database,
  Euro,
  ArrowUpRight,
  RefreshCw,
  Clock,
  AlertTriangle
} from 'lucide-react';

export default function AdminSettings({
  memberships = [],
  onSaveMemberships,
  tasaDolar = 0,
  tasaEuro = 0,
  fechaTasas = '',
  historialTasas = [],
  onUpdateTasa,
  onRefreshTasas,
  onShowToast
}) {
  // Estado local para la membresía seleccionada para edición o creación
  const [editingPlan, setEditingPlan] = useState(null); // null, or plan object
  const [isCreating, setIsCreating] = useState(false);

  // Estados locales para administración de tasas de cambio (Dólar y Euro)
  const [formTasaUSD, setFormTasaUSD] = useState(tasaDolar ? String(tasaDolar) : '');
  const [formTasaEUR, setFormTasaEUR] = useState(tasaEuro ? String(tasaEuro) : '');
  const [formFechaTasa, setFormFechaTasa] = useState(fechaTasas || new Date().toISOString().split('T')[0]);
  const [isEditingTasasManually, setIsEditingTasasManually] = useState(false);
  const [isSavingTasa, setIsSavingTasa] = useState(false);
  const [isRefreshingTasas, setIsRefreshingTasas] = useState(false);

  useEffect(() => {
    if (!isEditingTasasManually) {
      setFormTasaUSD(tasaDolar ? String(tasaDolar) : '');
      setFormTasaEUR(tasaEuro ? String(tasaEuro) : '');
      setFormFechaTasa(fechaTasas || new Date().toISOString().split('T')[0]);
    }
  }, [tasaDolar, tasaEuro, fechaTasas, isEditingTasasManually]);

  // Estado para un nuevo beneficio agregándose directamente en tarjeta
  const [newBenefitInputs, setNewBenefitInputs] = useState({});

  // Modal para editar o crear un plan
  const [planForm, setPlanForm] = useState({
    id: '',
    nombre: '',
    codigo: '',
    precioAfiliacionUSD: 15.0,
    precioMensualidadUSD: 10.0,
    precioUSD: 10.0,
    duracionDias: 30,
    estado: 'activa',
    descripcion: '',
    beneficios: []
  });

  const [formNewBenefit, setFormNewBenefit] = useState('');

  // Abrir modal de edición
  const handleOpenEdit = (plan) => {
    const pAfiliacion = plan.precioAfiliacionUSD !== undefined && plan.precioAfiliacionUSD !== null
      ? plan.precioAfiliacionUSD
      : 15.0;
    const pMensualidad = plan.precioMensualidadUSD !== undefined && plan.precioMensualidadUSD !== null
      ? plan.precioMensualidadUSD
      : (plan.precioUSD !== undefined ? plan.precioUSD : 10.0);

    setPlanForm({
      id: plan.id,
      nombre: plan.nombre || '',
      codigo: plan.codigo || '',
      precioAfiliacionUSD: pAfiliacion,
      precioMensualidadUSD: pMensualidad,
      precioUSD: pMensualidad,
      duracionDias: plan.duracionDias || 30,
      estado: plan.estado || 'activa',
      descripcion: plan.descripcion || '',
      beneficios: Array.isArray(plan.beneficios) ? [...plan.beneficios] : []
    });
    setIsCreating(false);
    setEditingPlan(plan);
  };

  // Abrir modal de creación
  const handleOpenCreate = () => {
    setPlanForm({
      id: `mem-${Date.now().toString(36)}`,
      nombre: 'Nueva Membresía Club',
      codigo: `VIP-${Math.floor(10 + Math.random() * 90)}USD`,
      precioAfiliacionUSD: 15.0,
      precioMensualidadUSD: 10.0,
      precioUSD: 10.0,
      duracionDias: 30,
      estado: 'activa',
      descripcion: 'Membresía con cuota única de afiliación que cubre los primeros 30 días, y mensualidad de mantenimiento.',
      beneficios: [
        'Acceso libre al Área de Juegos Infantiles',
        'Cortesía en consumo familiar',
        'Carnet Oficial de Socio'
      ]
    });
    setIsCreating(true);
    setEditingPlan({});
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setEditingPlan(null);
    setIsCreating(false);
  };

  // Guardar cambios del formulario de membresía
  const handleSavePlanForm = (e) => {
    e.preventDefault();

    if (!planForm.nombre.trim()) {
      if (onShowToast) {
        onShowToast({
          type: 'error',
          title: 'Error de Validación',
          message: 'El nombre de la membresía no puede estar vacío.'
        });
      }
      return;
    }

    const pAfiliacion = Math.max(0, parseFloat(planForm.precioAfiliacionUSD) || 0);
    const pMensualidad = Math.max(0, parseFloat(planForm.precioMensualidadUSD) || 0);

    const updatedPlan = {
      ...planForm,
      precioAfiliacionUSD: pAfiliacion,
      precioMensualidadUSD: pMensualidad,
      precioUSD: pMensualidad
    };

    let newMemberships = [];
    if (isCreating) {
      newMemberships = [...memberships, updatedPlan];
    } else {
      newMemberships = memberships.map((item) =>
        item.id === updatedPlan.id ? updatedPlan : item
      );
    }

    onSaveMemberships(newMemberships);
    handleCloseModal();

    if (onShowToast) {
      onShowToast({
        type: 'success',
        title: isCreating ? 'Membresía Creada' : 'Membresía Actualizada',
        message: `Plan "${updatedPlan.nombre}" ($${updatedPlan.precioUSD.toFixed(2)} USD) guardado correctamente.`
      });
    }
  };

  // Guardar tasas diarias en public.tasas_cambio (USD y EUR)
  const handleSaveTasasForm = async (e) => {
    e.preventDefault();
    const valUSD = parseFloat(formTasaUSD);
    const valEUR = parseFloat(formTasaEUR);

    if (isNaN(valUSD) || valUSD <= 0) {
      if (onShowToast) {
        onShowToast({
          type: 'error',
          title: 'Tasa Dólar Inválida',
          message: 'Ingresa un valor numérico válido para la tasa en Dólares ($ USD).'
        });
      }
      return;
    }

    if (isNaN(valEUR) || valEUR <= 0) {
      if (onShowToast) {
        onShowToast({
          type: 'error',
          title: 'Tasa Euro Inválida',
          message: 'Ingresa un valor numérico válido para la tasa en Euros (€ EUR).'
        });
      }
      return;
    }

    setIsSavingTasa(true);
    if (onUpdateTasa) {
      await onUpdateTasa({
        tasaUSD: valUSD,
        tasaEUR: valEUR,
        fecha: formFechaTasa || new Date().toISOString().split('T')[0]
      });
    }
    setIsSavingTasa(false);
    setIsEditingTasasManually(false);
  };

  // Agregar beneficio dentro del formulario
  const handleAddFormBenefit = () => {
    if (!formNewBenefit.trim()) return;
    setPlanForm((prev) => ({
      ...prev,
      beneficios: [...prev.beneficios, formNewBenefit.trim()]
    }));
    setFormNewBenefit('');
  };

  // Eliminar beneficio dentro del formulario
  const handleRemoveFormBenefit = (index) => {
    setPlanForm((prev) => ({
      ...prev,
      beneficios: prev.beneficios.filter((_, i) => i !== index)
    }));
  };

  // Agregar beneficio rápido en vivo a un plan existente
  const handleQuickAddBenefit = (planId) => {
    const text = newBenefitInputs[planId];
    if (!text || !text.trim()) return;

    const updatedMemberships = memberships.map((p) => {
      if (p.id === planId) {
        return {
          ...p,
          beneficios: [...(p.beneficios || []), text.trim()]
        };
      }
      return p;
    });

    onSaveMemberships(updatedMemberships);
    setNewBenefitInputs((prev) => ({ ...prev, [planId]: '' }));

    if (onShowToast) {
      onShowToast({
        type: 'success',
        title: 'Beneficio Añadido',
        message: `Se agregó el beneficio al plan de membresía.`
      });
    }
  };

  // Eliminar beneficio en vivo
  const handleQuickRemoveBenefit = (planId, indexToRemove) => {
    const updatedMemberships = memberships.map((p) => {
      if (p.id === planId) {
        return {
          ...p,
          beneficios: p.beneficios.filter((_, i) => i !== indexToRemove)
        };
      }
      return p;
    });

    onSaveMemberships(updatedMemberships);

    if (onShowToast) {
      onShowToast({
        type: 'info',
        title: 'Beneficio Eliminado',
        message: 'El beneficio ha sido removido del tipo de membresía.'
      });
    }
  };

  // Cambiar estado activo/inactivo de plan rápido
  const handleTogglePlanStatus = (planId) => {
    const updatedMemberships = memberships.map((p) => {
      if (p.id === planId) {
        return {
          ...p,
          estado: p.estado === 'activa' ? 'inactiva' : 'activa'
        };
      }
      return p;
    });

    onSaveMemberships(updatedMemberships);

    if (onShowToast) {
      onShowToast({
        type: 'info',
        title: 'Estado Actualizado',
        message: 'Se cambió la disponibilidad de la membresía.'
      });
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-4 md:py-8 space-y-6">
      {/* Encabezado Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-corporate-800 bg-corporate-50 border border-corporate-200/80 px-3 py-1 rounded-full mb-2">
            <Settings className="w-3.5 h-3.5 text-corporate-600" />
            Configuración del Sistema & Membresías
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight">
            Tipos de Membresías y Beneficios
          </h1>
          <p className="text-sm text-neutral-600 mt-0.5">
            Administra los planes de suscripción para niños socios, sus tarifas en <strong className="text-neutral-900 font-bold">$ USD</strong> y los beneficios incluidos.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-corporate-600 hover:bg-corporate-700 active:bg-corporate-800 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Nuevo Plan de Membresía</span>
        </button>
      </div>

      {/* KPI Cards Informativas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Planes Configurados</span>
            <Layers className="w-4 h-4 text-corporate-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-neutral-900 tabular-nums">
            {memberships.length} {memberships.length === 1 ? 'Plan' : 'Planes'}
          </div>
          <div className="text-xs text-neutral-400 mt-1">Suscripciones para niños</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-indigo-900 text-xs font-semibold">
            <span>Afiliación Inicial ($ USD)</span>
            <DollarSign className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-indigo-700 tabular-nums">
            $ {memberships[0]?.precioAfiliacionUSD !== undefined ? Number(memberships[0].precioAfiliacionUSD).toFixed(2) : '15.00'} USD
          </div>
          <div className="text-xs text-indigo-800 mt-1 font-medium">Pago único · Cubre primeros 30 días</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-900 text-xs font-semibold">
            <span>Mensualidad ($ USD)</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-700 tabular-nums">
            $ {memberships[0]?.precioMensualidadUSD !== undefined ? Number(memberships[0].precioMensualidadUSD).toFixed(2) : (memberships[0]?.precioUSD !== undefined ? Number(memberships[0].precioUSD).toFixed(2) : '10.00')} USD
          </div>
          <div className="text-xs text-emerald-800 mt-1 font-medium">Renovación cada 30 días</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Tasas Oficiales (Día)</span>
            <Coins className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-sm font-bold font-mono text-neutral-900 tabular-nums flex items-center justify-between gap-1 flex-wrap">
            <span>$: <strong className="text-emerald-700">{tasaDolar && Number(tasaDolar) > 0 ? `Bs. ${Number(tasaDolar).toFixed(2)}` : 'Sin datos'}</strong></span>
            <span>€: <strong className="text-blue-700">{tasaEuro && Number(tasaEuro) > 0 ? `Bs. ${Number(tasaEuro).toFixed(2)}` : 'Sin datos'}</strong></span>
          </div>
          <div className="text-[11px] text-neutral-500 mt-1 flex items-center justify-between">
            <span>Fecha: {fechaTasas || 'Esperando BD'}</span>
            <span className="font-mono text-indigo-700 font-semibold">
              {tasaDolar && Number(tasaDolar) > 0 
                ? `Afil: Bs. ${((memberships[0]?.precioAfiliacionUSD || 15) * Number(tasaDolar)).toLocaleString('es-VE', { maximumFractionDigits: 0 })}`
                : 'Afil: --'}
            </span>
          </div>
        </div>
      </div>

      {/* Tarjeta de Lista de Tipos de Membresías */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-neutral-900 flex items-center gap-2">
            <Tag className="w-5 h-5 text-corporate-600" />
            <span>Planes de Membresía Registrados</span>
          </h2>
          <span className="text-2xs font-bold text-neutral-500 bg-neutral-200 px-2.5 py-1 rounded-full uppercase">
            Moneda Base: $ USD
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {memberships.map((plan) => {
            const isActiva = plan.estado === 'activa';
            const precioAfiliacionUSD = Number(plan.precioAfiliacionUSD !== undefined && plan.precioAfiliacionUSD !== null ? plan.precioAfiliacionUSD : 15.0);
            const precioMensualidadUSD = Number(plan.precioMensualidadUSD !== undefined && plan.precioMensualidadUSD !== null ? plan.precioMensualidadUSD : (plan.precioUSD || 10.0));
            const tasaActual = tasaDolar || 65;
            const bsAfiliacion = precioAfiliacionUSD * tasaActual;
            const bsMensualidad = precioMensualidadUSD * tasaActual;

            return (
              <div
                key={plan.id}
                className="bg-white rounded-3xl border-2 border-neutral-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                {/* Header de la Membresía */}
                <div>
                  <div className="p-6 bg-gradient-to-br from-neutral-900 via-slate-900 to-neutral-950 text-white flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-2xs font-bold bg-white/20 text-white px-2 py-0.5 rounded border border-white/30">
                          {plan.codigo || 'VIP-10'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleTogglePlanStatus(plan.id)}
                          className={`text-2xs font-extrabold px-2.5 py-0.5 rounded-full uppercase transition-colors cursor-pointer ${
                            isActiva
                              ? 'bg-emerald-500 text-white'
                              : 'bg-rose-500 text-white'
                          }`}
                        >
                          {isActiva ? 'Activa' : 'Inactiva / Suspendida'}
                        </button>
                      </div>
                      <h3 className="text-xl font-black text-white leading-tight">
                        {plan.nombre}
                      </h3>
                      <p className="text-xs text-neutral-300 leading-relaxed line-clamp-2">
                        {plan.descripcion}
                      </p>
                    </div>

                    {/* Precios Dobles: Afiliación Única + Mensualidad */}
                    <div className="shrink-0 flex sm:flex-col gap-2">
                      {/* Cuota de Afiliación */}
                      <div className="bg-indigo-950/70 border border-indigo-400/40 p-2.5 rounded-xl text-right flex-1 sm:flex-none">
                        <div className="text-[10px] uppercase tracking-wider text-indigo-300 font-bold">
                          1er Pago (Afiliación)
                        </div>
                        <div className="text-lg font-black font-mono text-indigo-300">
                          ${precioAfiliacionUSD.toFixed(2)} <span className="text-[10px] font-sans font-normal text-indigo-200">USD</span>
                        </div>
                        <div className="text-[10px] text-indigo-200 font-medium">
                          Cubre primeros 30 días
                        </div>
                      </div>

                      {/* Mensualidad Recurrente */}
                      <div className="bg-emerald-950/70 border border-emerald-400/40 p-2.5 rounded-xl text-right flex-1 sm:flex-none">
                        <div className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold">
                          Mensualidad Recurrente
                        </div>
                        <div className="text-lg font-black font-mono text-emerald-300">
                          ${precioMensualidadUSD.toFixed(2)} <span className="text-[10px] font-sans font-normal text-emerald-200">USD/mes</span>
                        </div>
                        <div className="text-[10px] text-emerald-200 font-medium">
                          Cada {plan.duracionDias || 30} días
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Franja de Conversión a Bolívares */}
                  <div className="bg-slate-50 border-y border-neutral-200 px-6 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-neutral-700">
                      <Coins className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Equivalencias en Caja (Tasa Bs. {Number(tasaActual).toFixed(2)}):</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <span className="text-indigo-900 font-bold">
                        Afiliación: <strong>Bs. {bsAfiliacion.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                      </span>
                      <span className="text-neutral-300">|</span>
                      <span className="text-emerald-900 font-bold">
                        Mensual: <strong>Bs. {bsMensualidad.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                      </span>
                    </div>
                  </div>

                  {/* Cuerpo: Lista de Beneficios */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                        <Gift className="w-4 h-4 text-corporate-600" />
                        <span>Beneficios Incluidos ({plan.beneficios?.length || 0}):</span>
                      </h4>
                    </div>

                    {/* Items de Beneficios */}
                    <div className="space-y-2">
                      {Array.isArray(plan.beneficios) && plan.beneficios.length > 0 ? (
                        plan.beneficios.map((beneficio, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2.5 bg-neutral-50 border border-neutral-200/80 rounded-xl text-xs text-neutral-800 hover:border-corporate-300 transition-colors group"
                          >
                            <div className="flex items-center gap-2.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span className="font-medium">{beneficio}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleQuickRemoveBenefit(plan.id, idx)}
                              title="Eliminar beneficio"
                              className="text-neutral-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-colors opacity-80 group-hover:opacity-100 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-neutral-400 italic">
                          Sin beneficios configurados para esta membresía.
                        </p>
                      )}
                    </div>

                    {/* Agregar Beneficio Rápido */}
                    <div className="pt-2 flex items-center gap-2">
                      <input
                        type="text"
                        value={newBenefitInputs[plan.id] || ''}
                        onChange={(e) =>
                          setNewBenefitInputs({
                            ...newBenefitInputs,
                            [plan.id]: e.target.value
                          })
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleQuickAddBenefit(plan.id);
                          }
                        }}
                        placeholder="Ej: Acceso gratis a evento navideño..."
                        className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-corporate-500 focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleQuickAddBenefit(plan.id)}
                        className="px-3 py-2 bg-corporate-600 hover:bg-corporate-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Añadir</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer de Acciones de la Tarjeta */}
                <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
                  <div className="text-2xs text-neutral-500">
                    Duración: <strong>{plan.duracionDias || 30} Días Continuos</strong>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(plan)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer shadow-2xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Editar Plan (${precioAfiliacionUSD.toFixed(2)} / ${precioMensualidadUSD.toFixed(2)} USD)</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Card de Configuración de Tasas Oficiales (Dólar USD y Euro EUR) */}
      <div className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-2xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <Coins className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-extrabold text-neutral-900">
                  Tasas Referenciales Diarias (USD & EUR)
                </h3>
                <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                  <Database className="w-3 h-3 text-emerald-600" />
                  public.tasas_cambio
                </span>
              </div>
              <p className="text-2xs text-neutral-500 mt-0.5">
                Utiliza las tasas registradas en la base de datos o ajusta manualmente los valores oficiales del día.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isRefreshingTasas}
              onClick={async () => {
                setIsRefreshingTasas(true);
                if (onRefreshTasas) await onRefreshTasas(true);
                setIsRefreshingTasas(false);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 shadow-2xs transition-all cursor-pointer disabled:opacity-50"
              title="Consultar la base de datos Supabase para cargar el valor más reciente de public.tasas_cambio"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-corporate-600 ${isRefreshingTasas ? 'animate-spin' : ''}`} />
              <span>{isRefreshingTasas ? 'Cargando de BD...' : 'Cargar Tasa de BD'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsEditingTasasManually(!isEditingTasasManually)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isEditingTasasManually
                  ? 'bg-neutral-200 text-neutral-800 hover:bg-neutral-300'
                  : 'bg-corporate-600 text-white hover:bg-corporate-700 shadow-xs'
              }`}
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>{isEditingTasasManually ? 'Cancelar Edición' : 'Ajustar Tasas del Día'}</span>
            </button>
          </div>
        </div>

        {/* Vista Actual de las Tasas Activas en Base de Datos */}
        {!isEditingTasasManually ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tarjeta Tasa Dólar */}
              <div className="p-4 bg-gradient-to-br from-emerald-50/70 to-teal-50/70 rounded-2xl border border-emerald-200 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-700" />
                    Dólar Americano ($ USD)
                  </span>
                  <span className="text-[10px] font-bold bg-emerald-200/80 text-emerald-950 px-2 py-0.5 rounded-full font-mono">
                    {fechaTasas ? `Fecha: ${fechaTasas}` : 'Consultando...'}
                  </span>
                </div>
                <div className="text-2xl font-black font-mono text-emerald-950 tabular-nums">
                  {tasaDolar && Number(tasaDolar) > 0 ? (
                    `Bs. ${Number(tasaDolar).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  ) : (
                    <span className="text-base text-amber-800 font-bold">Bloqueado por RLS en Supabase</span>
                  )}
                </div>
                <p className="text-[11px] text-emerald-800 font-medium">
                  {tasaDolar && Number(tasaDolar) > 0 ? 'Tasa oficial leída desde public.tasas_cambio.' : 'Requiere habilitar acceso público en Supabase.'}
                </p>
              </div>

              {/* Tarjeta Tasa Euro */}
              <div className="p-4 bg-gradient-to-br from-blue-50/70 to-indigo-50/70 rounded-2xl border border-blue-200 shadow-2xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
                    <Euro className="w-4 h-4 text-blue-700" />
                    Euro Oficial (€ EUR)
                  </span>
                  <span className="text-[10px] font-bold bg-blue-200/80 text-blue-950 px-2 py-0.5 rounded-full font-mono">
                    {fechaTasas ? `Fecha: ${fechaTasas}` : 'Consultando...'}
                  </span>
                </div>
                <div className="text-2xl font-black font-mono text-blue-950 tabular-nums">
                  {tasaEuro && Number(tasaEuro) > 0 ? (
                    `Bs. ${Number(tasaEuro).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  ) : (
                    <span className="text-base text-amber-800 font-bold">Bloqueado por RLS en Supabase</span>
                  )}
                </div>
                <p className="text-[11px] text-blue-800 font-medium">
                  {tasaEuro && Number(tasaEuro) > 0 ? 'Tasa oficial leída desde public.tasas_cambio.' : 'Requiere habilitar acceso público en Supabase.'}
                </p>
              </div>
            </div>

            {historialTasas.length === 0 ? (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-5 text-xs space-y-3 text-amber-950 shadow-xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="font-extrabold text-sm flex items-center gap-2 text-amber-950">
                    <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
                    ¡Tu registro existe en Supabase pero está protegido por RLS (Row Level Security)!
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-amber-200 text-amber-950 px-2.5 py-1 rounded-md border border-amber-300">
                    Bloqueo de lectura PostgREST
                  </span>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed">
                  En el panel web de Supabase ves tu registro porque accedes como administrador. Sin embargo, cuando la aplicación web consulta la API con la clave pública (<code className="bg-amber-100 font-mono px-1 rounded">anon</code>), PostgreSQL oculta las filas si no se ha deshabilitado RLS o no hay una política de lectura.
                </p>
                <div className="bg-neutral-900 text-emerald-400 p-3 rounded-xl font-mono text-xs overflow-x-auto space-y-1">
                  <p className="text-neutral-400 text-[11px]">// Copia y pega esto en el SQL Editor de tu proyecto Supabase:</p>
                  <p className="text-white font-bold select-all">ALTER TABLE public.tasas_cambio DISABLE ROW LEVEL SECURITY;</p>
                </div>
                <div className="pt-1 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      setIsRefreshingTasas(true);
                      if (onRefreshTasas) await onRefreshTasas(true);
                      setIsRefreshingTasas(false);
                    }}
                    className="px-4 py-2 bg-corporate-700 hover:bg-corporate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingTasas ? 'animate-spin' : ''}`} />
                    <span>{isRefreshingTasas ? 'Comprobando conexión...' : 'Reintentar Lectura de BD Ahora'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between text-2xs text-neutral-600 bg-neutral-50 p-3 rounded-xl border border-neutral-200">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    El sistema de Caja y cobros utiliza automáticamente estas tasas cargadas desde <code className="font-mono text-neutral-800 font-bold">public.tasas_cambio</code>.
                  </span>
                </span>
                <span className="font-mono text-[10px] bg-emerald-100 text-emerald-950 border border-emerald-200 px-2 py-0.5 rounded font-bold shrink-0 ml-2">
                  {historialTasas.length} {historialTasas.length === 1 ? 'registro cargado' : 'registros cargados'}
                </span>
              </div>
            )}
          </div>
        ) : (
          /* Formulario para Ingresar / Ajustar Tasas Manualmente */
          <form onSubmit={handleSaveTasasForm} className="p-5 bg-neutral-50 rounded-2xl border border-corporate-200 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wide text-corporate-900 flex items-center gap-1.5">
                <Edit2 className="w-4 h-4 text-corporate-600" />
                Registrar / Actualizar Tasas del Día
              </span>
              <span className="text-2xs text-neutral-500">
                Se guardará con fecha única en <strong className="font-mono text-neutral-700">public.tasas_cambio</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Fecha de la Tasa */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wide">
                  Fecha de Vigencia *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formFechaTasa}
                    onChange={(e) => setFormFechaTasa(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 bg-white border border-neutral-300 rounded-xl font-mono text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-corporate-500"
                  />
                </div>
              </div>

              {/* Tasa Dólar ($ USD) */}
              <div>
                <label className="block text-xs font-bold text-emerald-900 mb-1 uppercase tracking-wide flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  Tasa Dólar (Bs. / USD) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-bold text-xs">
                    Bs.
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    value={formTasaUSD}
                    onChange={(e) => setFormTasaUSD(e.target.value)}
                    required
                    placeholder="65.00"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-emerald-300 rounded-xl font-mono text-base font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Tasa Euro (€ EUR) */}
              <div>
                <label className="block text-xs font-bold text-blue-900 mb-1 uppercase tracking-wide flex items-center gap-1">
                  <Euro className="w-3.5 h-3.5 text-blue-600" />
                  Tasa Euro (Bs. / EUR) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-bold text-xs">
                    Bs.
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    value={formTasaEUR}
                    onChange={(e) => setFormTasaEUR(e.target.value)}
                    required
                    placeholder="70.00"
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-blue-300 rounded-xl font-mono text-base font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => setIsEditingTasasManually(false)}
                className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSavingTasa}
                className="px-5 py-2.5 bg-corporate-600 hover:bg-corporate-700 active:bg-corporate-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingTasa ? 'Guardando...' : 'Guardar Tasas en Base de Datos'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Historial Reciente de Tasas Registradas en Supabase */}
        {Array.isArray(historialTasas) && historialTasas.length > 0 && (
          <div className="pt-2 border-t border-neutral-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xs font-bold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                Historial de Tasas Registradas en Base de Datos
              </span>
              <span className="text-2xs text-neutral-400">
                Últimos {historialTasas.length} registros
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-2xs uppercase text-neutral-600 font-bold">
                  <tr>
                    <th className="py-2.5 px-3 font-semibold">Fecha</th>
                    <th className="py-2.5 px-3 font-semibold">Tasa Dólar ($ USD)</th>
                    <th className="py-2.5 px-3 font-semibold">Tasa Euro (€ EUR)</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 font-mono">
                  {historialTasas.slice(0, 5).map((t, idx) => {
                    const isCurrent = t.fecha === fechaTasas;
                    return (
                      <tr key={t.id || idx} className={isCurrent ? 'bg-emerald-50/50' : 'hover:bg-neutral-50/50'}>
                        <td className="py-2 px-3 font-bold text-neutral-900 flex items-center gap-1.5">
                          <span>{t.fecha}</span>
                          {isCurrent && (
                            <span className="text-[9px] font-sans font-extrabold uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                              Activa
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-emerald-700 font-bold">
                          Bs. {Number(t.tasa_usd).toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-blue-700 font-bold">
                          Bs. {Number(t.tasa_eur).toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              if (onUpdateTasa) {
                                onUpdateTasa({
                                  tasaUSD: Number(t.tasa_usd),
                                  tasaEUR: Number(t.tasa_eur),
                                  fecha: t.fecha
                                });
                              }
                            }}
                            className="text-2xs font-sans font-bold text-corporate-600 hover:text-corporate-800 underline cursor-pointer"
                          >
                            Activar esta tasa
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          MODAL DE EDICIÓN / CREACIÓN DE MEMBRESÍA
          ======================================================== */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-neutral-200 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            {/* Header del Modal */}
            <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-corporate-100 text-corporate-700 flex items-center justify-center font-bold">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-neutral-900">
                    {isCreating ? 'Crear Nuevo Tipo de Membresía' : 'Editar Tipo de Membresía'}
                  </h3>
                  <p className="text-2xs text-neutral-500">
                    Configure las tarifas en Dólares ($ USD) y beneficios del plan.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSavePlanForm} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nombre de la Membresía */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wide">
                    Nombre Oficial del Plan *
                  </label>
                  <input
                    type="text"
                    value={planForm.nombre}
                    onChange={(e) => setPlanForm({ ...planForm, nombre: e.target.value })}
                    required
                    placeholder="Ej: Membresía Oficial Club Infantil"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-corporate-500 focus:bg-white"
                  />
                </div>

                {/* Código Interno */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wide">
                    Código de Plan *
                  </label>
                  <input
                    type="text"
                    value={planForm.codigo}
                    onChange={(e) => setPlanForm({ ...planForm, codigo: e.target.value })}
                    required
                    placeholder="Ej: VIP-10USD"
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-mono font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-corporate-500 focus:bg-white"
                  />
                </div>

                {/* Precio de Afiliación Inicial en $ USD */}
                <div>
                  <label className="block text-xs font-bold text-indigo-900 mb-1 uppercase tracking-wide">
                    Precio de Afiliación ($ USD) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-700 font-bold text-sm">
                      $
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      value={planForm.precioAfiliacionUSD}
                      onChange={(e) => setPlanForm({ ...planForm, precioAfiliacionUSD: e.target.value })}
                      required
                      className="w-full pl-8 pr-12 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl font-mono text-sm font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                      placeholder="15.00"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-2xs font-bold text-neutral-400">
                      USD
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Pago único inicial · Cubre primeros 30 días (Equiv: <strong className="font-mono text-indigo-800">Bs. {((parseFloat(planForm.precioAfiliacionUSD) || 0) * (tasaDolar || 65)).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</strong>)
                  </p>
                </div>

                {/* Precio de Mensualidad Recurrente en $ USD */}
                <div>
                  <label className="block text-xs font-bold text-emerald-900 mb-1 uppercase tracking-wide">
                    Mensualidad Recurrente ($ USD) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-700 font-bold text-sm">
                      $
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      value={planForm.precioMensualidadUSD}
                      onChange={(e) => setPlanForm({ ...planForm, precioMensualidadUSD: e.target.value, precioUSD: e.target.value })}
                      required
                      className="w-full pl-8 pr-12 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl font-mono text-sm font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                      placeholder="10.00"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-2xs font-bold text-neutral-400">
                      USD
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    Cobro recurrente cada 30 días (Equiv: <strong className="font-mono text-emerald-800">Bs. {((parseFloat(planForm.precioMensualidadUSD) || 0) * (tasaDolar || 65)).toLocaleString('es-VE', { minimumFractionDigits: 2 })}</strong>)
                  </p>
                </div>

                {/* Duración en Días */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wide">
                    Duración (Días Continuos) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={planForm.duracionDias}
                    onChange={(e) => setPlanForm({ ...planForm, duracionDias: parseInt(e.target.value) || 30 })}
                    required
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl font-mono text-sm font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-corporate-500 focus:bg-white"
                    placeholder="30"
                  />
                </div>

                {/* Estado */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wide">
                    Estado del Plan *
                  </label>
                  <select
                    value={planForm.estado}
                    onChange={(e) => setPlanForm({ ...planForm, estado: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-corporate-500 focus:bg-white cursor-pointer"
                  >
                    <option value="activa">Activa / Disponible</option>
                    <option value="inactiva">Inactiva / Suspendida</option>
                  </select>
                </div>

                {/* Descripción */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wide">
                    Descripción Informativa
                  </label>
                  <textarea
                    rows={2}
                    value={planForm.descripcion}
                    onChange={(e) => setPlanForm({ ...planForm, descripcion: e.target.value })}
                    placeholder="Descripción resumida para el personal de caja..."
                    className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-corporate-500 focus:bg-white resize-none"
                  />
                </div>
              </div>

              {/* Sección Beneficios dentro del Modal */}
              <div className="space-y-2 border-t border-neutral-200 pt-4">
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide">
                  Beneficios del Plan:
                </label>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={formNewBenefit}
                    onChange={(e) => setFormNewBenefit(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFormBenefit();
                      }
                    }}
                    placeholder="Escriba un nuevo beneficio..."
                    className="flex-1 px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-corporate-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddFormBenefit}
                    className="px-3 py-2 bg-corporate-600 hover:bg-corporate-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar</span>
                  </button>
                </div>

                <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1">
                  {planForm.beneficios.map((ben, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-neutral-100 rounded-lg text-xs text-neutral-800"
                    >
                      <span className="font-medium">{ben}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFormBenefit(idx)}
                        className="text-neutral-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-corporate-600 hover:bg-corporate-700 active:bg-corporate-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Plan (${parseFloat(planForm.precioAfiliacionUSD || 0).toFixed(2)} / ${parseFloat(planForm.precioMensualidadUSD || 0).toFixed(2)} USD)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
