import React, { useState } from 'react';
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
  Info
} from 'lucide-react';

export default function AdminSettings({
  memberships = [],
  onSaveMemberships,
  tasaDolar,
  onUpdateTasa,
  onShowToast
}) {
  // Estado local para la membresía seleccionada para edición o creación
  const [editingPlan, setEditingPlan] = useState(null); // null, or plan object
  const [isCreating, setIsCreating] = useState(false);

  // Estado para un nuevo beneficio agregándose directamente en tarjeta
  const [newBenefitInputs, setNewBenefitInputs] = useState({});

  // Modal para editar o crear un plan
  const [planForm, setPlanForm] = useState({
    id: '',
    nombre: '',
    codigo: '',
    precioUSD: 10.0,
    duracionDias: 30,
    estado: 'activa',
    descripcion: '',
    beneficios: []
  });

  const [formNewBenefit, setFormNewBenefit] = useState('');

  // Abrir modal de edición
  const handleOpenEdit = (plan) => {
    setPlanForm({
      id: plan.id,
      nombre: plan.nombre || '',
      codigo: plan.codigo || '',
      precioUSD: plan.precioUSD !== undefined ? plan.precioUSD : 10.0,
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
      precioUSD: 10.0,
      duracionDias: 30,
      estado: 'activa',
      descripcion: 'Membresía con beneficios exclusivos para niños socios del club.',
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

    const updatedPlan = {
      ...planForm,
      precioUSD: Math.max(0, parseFloat(planForm.precioUSD) || 0)
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
          <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold">
            <span>Tarifa Estándar ($ USD)</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-700 tabular-nums">
            $ {memberships[0]?.precioUSD !== undefined ? Number(memberships[0].precioUSD).toFixed(2) : '10.00'} USD
          </div>
          <div className="text-xs text-emerald-800 mt-1">Valor oficial fijado en Dólares</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Conversión Bs. (Tasa Día)</span>
            <Coins className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-neutral-900 tabular-nums">
            Bs. {((memberships[0]?.precioUSD || 10) * (tasaDolar || 65)).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-neutral-500 mt-1">Calculado a tasa Bs. {Number(tasaDolar).toFixed(2)}/USD</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
            <span>Vigencia Estándar</span>
            <Calendar className="w-4 h-4 text-corporate-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-neutral-900 tabular-nums">
            {memberships[0]?.duracionDias || 30} Días
          </div>
          <div className="text-xs text-neutral-400 mt-1">30 días continuos de acceso</div>
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
            const precioUSDNum = Number(plan.precioUSD || 0);
            const precioBsEquiv = precioUSDNum * (tasaDolar || 65);

            return (
              <div
                key={plan.id}
                className="bg-white rounded-3xl border-2 border-neutral-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                {/* Header de la Membresía */}
                <div>
                  <div className="p-6 bg-gradient-to-br from-neutral-900 to-slate-900 text-white flex items-start justify-between gap-4">
                    <div className="space-y-1">
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

                    {/* Badge Destacado de Precio */}
                    <div className="text-right shrink-0 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20">
                      <div className="text-2xs uppercase tracking-wider text-neutral-300 font-medium">
                        Costo
                      </div>
                      <div className="text-2xl font-black font-mono text-emerald-400">
                        ${precioUSDNum.toFixed(2)}
                      </div>
                      <div className="text-2xs font-mono text-neutral-300">
                        USD / {plan.duracionDias || 30} días
                      </div>
                    </div>
                  </div>

                  {/* Franja de Conversión a Bolívares */}
                  <div className="bg-emerald-50 border-y border-emerald-200/80 px-6 py-2.5 flex items-center justify-between text-xs text-emerald-950">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <Coins className="w-4 h-4 text-emerald-700" />
                      <span>Equivalencia en Bolívares en Caja:</span>
                    </div>
                    <div className="font-mono font-bold text-sm text-emerald-900">
                      Bs. {precioBsEquiv.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                    <span>Editar Plan de $ {precioUSDNum.toFixed(2)} USD</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Card de Configuración Complementaria: Tasa de Cambio y Parámetros */}
      <div className="bg-white rounded-3xl border border-neutral-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-200 pb-3">
          <Coins className="w-5 h-5 text-emerald-700" />
          <div>
            <h3 className="text-base font-extrabold text-neutral-900">
              Parámetros Financieros y de Cobro en Caja
            </h3>
            <p className="text-2xs text-neutral-500">
              Ajuste global de moneda base e integración con el punto de venta.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Parámetro Moneda Global */}
          <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-700 uppercase tracking-wide">
                Moneda Global del Sistema
              </span>
              <span className="text-2xs font-extrabold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-mono">
                USD ($)
              </span>
            </div>
            <p className="text-xs text-neutral-600">
              Todos los cobros de membresías se registran, auditan y guardan en **Dólares Americanos ($ USD)**.
            </p>
            <div className="text-2xs text-neutral-400 bg-white p-2.5 rounded-xl border border-neutral-200 font-mono">
              Moneda Principal: USD ($) · Conversión automática en pantalla a Bolívares (Bs.).
            </div>
          </div>

          {/* Parámetro Tasa de Cambio */}
          <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-2">
            <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide">
              Tasa Referencial del Dólar (Bs. / USD)
            </label>
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-bold text-xs">
                  Bs.
                </span>
                <input
                  type="number"
                  step="any"
                  min="1"
                  value={tasaDolar}
                  onChange={(e) => onUpdateTasa && onUpdateTasa(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-neutral-300 rounded-xl font-mono text-base font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-corporate-500"
                />
              </div>
              <span className="text-2xs text-neutral-500 font-semibold">
                Bs. por $1 USD
              </span>
            </div>
            <p className="text-2xs text-neutral-500">
              Se utiliza por defecto para convertir cobros en Pago Móvil, Punto de Tarjeta y Transferencia.
            </p>
          </div>
        </div>
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

                {/* Precio en $ USD */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1 uppercase tracking-wide">
                    Precio en Dólares ($ USD) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-700 font-bold text-sm">
                      $
                    </span>
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      value={planForm.precioUSD}
                      onChange={(e) => setPlanForm({ ...planForm, precioUSD: e.target.value })}
                      required
                      className="w-full pl-8 pr-12 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl font-mono text-sm font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                      placeholder="10.00"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-2xs font-bold text-neutral-400">
                      USD
                    </span>
                  </div>
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
                  <span>Guardar Plan ($ {parseFloat(planForm.precioUSD || 0).toFixed(2)} USD)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
