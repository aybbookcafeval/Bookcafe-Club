/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Cake, 
  Sparkles, 
  Phone, 
  User, 
  Calendar, 
  CreditCard, 
  ShieldAlert, 
  Utensils, 
  QrCode, 
  X, 
  Save, 
  Printer, 
  Smile, 
  LayoutGrid, 
  List, 
  ArrowRight,
  Heart,
  Camera,
  Upload,
  Image as ImageIcon
} from 'lucide-react';
import { 
  isBirthdayThisMonth, 
  calculateAge, 
  checkIsActiveAndValid,
  getKidAvatar,
  PRESET_AVATARS
} from '../mockData.js';
import CarnetModal from './CarnetModal.jsx';

export default function ChildProfileCRUD({
  afiliados,
  onSaveMember,
  onDeleteMember,
  onOpenPayment,
  initialSelectedId = null
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modal para Ver Ficha Completa
  const [viewingMember, setViewingMember] = useState(() => {
    if (initialSelectedId) {
      return afiliados.find(a => a.id === initialSelectedId) || null;
    }
    return null;
  });

  // Modal para Imprimir Carnet / Exportar PDF
  const [carnetMember, setCarnetMember] = useState(null);

  // Modal para Crear / Editar Ficha
  const [editingMember, setEditingMember] = useState(null);
  const [isNewMember, setIsNewMember] = useState(false);

  // Modal de confirmación para eliminar
  const [deletingMember, setDeletingMember] = useState(null);

  // Form State para Crear / Editar
  const [formData, setFormData] = useState({
    codigo: '',
    nombreNino: '',
    fotoPerfil: PRESET_AVATARS[0].url,
    fechaNacimiento: '',
    tutorNombre: '',
    tutorCedula: '',
    parentescoTutor: 'Madre',
    tutorTelefono: '',
    estado: 'pendiente',
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaVencimiento: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      return d.toISOString().split('T')[0];
    })(),
    montoPagado: '0',
    metodoPago: 'Pago Móvil',
    referenciaPago: '',
    alergias: 'Ninguna',
    notas: ''
  });

  // Filtrado de lista
  const filteredAfiliados = useMemo(() => {
    return afiliados.filter((af) => {
      if (statusFilter !== 'todos') {
        const isActive = checkIsActiveAndValid(af);
        if (statusFilter === 'activa' && !isActive) return false;
        if (statusFilter === 'pendiente' && af.estado !== 'pendiente') return false;
        if (statusFilter === 'vencida' && (af.estado !== 'vencida' && isActive)) return false;
      }

      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        af.codigo.toLowerCase().includes(term) ||
        af.nombreNino.toLowerCase().includes(term) ||
        af.tutorNombre.toLowerCase().includes(term) ||
        (af.tutorCedula && af.tutorCedula.toLowerCase().includes(term)) ||
        (af.parentescoTutor && af.parentescoTutor.toLowerCase().includes(term)) ||
        af.tutorTelefono.toLowerCase().includes(term) ||
        (af.alergias && af.alergias.toLowerCase().includes(term))
      );
    });
  }, [afiliados, searchTerm, statusFilter]);

  // Generar sugerencia de código automático (ej: KID-108)
  const generateNextCode = () => {
    const existingNumbers = afiliados
      .map(a => {
        const match = a.codigo.match(/\d+/);
        return match ? parseInt(match[0], 10) : 0;
      })
      .filter(n => !isNaN(n));
    const max = existingNumbers.length > 0 ? Math.max(...existingNumbers) : 100;
    return `KID-${max + 1}`;
  };

  // Subir imagen desde dispositivo local (cámara o galería)
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert('La imagen seleccionada supera los 4MB. Por favor elige una imagen más ligera.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setFormData((prev) => ({
          ...prev,
          fotoPerfil: event.target.result
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  // Abrir Modal de Creación
  const handleOpenCreate = () => {
    const today = new Date();
    const expiry = new Date(today);
    expiry.setDate(expiry.getDate() + 30);
    const defaultAvatar = PRESET_AVATARS[afiliados.length % PRESET_AVATARS.length].url;

    setFormData({
      codigo: generateNextCode(),
      nombreNino: '',
      fotoPerfil: defaultAvatar,
      fechaNacimiento: '',
      tutorNombre: '',
      tutorCedula: '',
      parentescoTutor: 'Madre',
      tutorTelefono: '',
      estado: 'pendiente',
      fechaInicio: today.toISOString().split('T')[0],
      fechaVencimiento: expiry.toISOString().split('T')[0],
      montoPagado: '0',
      metodoPago: 'Pago Móvil',
      referenciaPago: '',
      alergias: 'Ninguna',
      notas: ''
    });
    setIsNewMember(true);
    setEditingMember({});
  };

  // Abrir Modal de Edición
  const handleOpenEdit = (member) => {
    setFormData({
      codigo: member.codigo || '',
      nombreNino: member.nombreNino || '',
      fotoPerfil: member.fotoPerfil || getKidAvatar(member),
      fechaNacimiento: member.fechaNacimiento || '',
      tutorNombre: member.tutorNombre || '',
      tutorCedula: member.tutorCedula || '',
      parentescoTutor: member.parentescoTutor || 'Madre',
      tutorTelefono: member.tutorTelefono || '',
      estado: member.estado || 'pendiente',
      fechaInicio: member.fechaInicio || '',
      fechaVencimiento: member.fechaVencimiento || '',
      montoPagado: String(member.montoPagado || 0),
      metodoPago: member.metodoPago || 'Pago Móvil',
      referenciaPago: member.referenciaPago || '',
      alergias: member.alergias || 'Ninguna',
      notas: member.notas || ''
    });
    setIsNewMember(false);
    setEditingMember(member);
  };

  // Guardar Cambios (Create o Update)
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.nombreNino.trim() || !formData.tutorNombre.trim() || !formData.tutorTelefono.trim()) {
      alert('Por favor completa todos los campos requeridos (*).');
      return;
    }

    const payload = {
      id: isNewMember ? 'kid-' + Date.now().toString(36) : editingMember.id,
      codigo: formData.codigo.trim().toUpperCase() || generateNextCode(),
      nombreNino: formData.nombreNino.trim(),
      fotoPerfil: formData.fotoPerfil || PRESET_AVATARS[0].url,
      fechaNacimiento: formData.fechaNacimiento,
      tutorNombre: formData.tutorNombre.trim(),
      tutorCedula: formData.tutorCedula.trim(),
      parentescoTutor: formData.parentescoTutor || 'Padre / Madre',
      tutorTelefono: formData.tutorTelefono.trim(),
      estado: formData.estado,
      fechaInicio: formData.fechaInicio,
      fechaVencimiento: formData.fechaVencimiento,
      montoPagado: parseFloat(formData.montoPagado) || 0,
      metodoPago: formData.metodoPago,
      referenciaPago: formData.referenciaPago.trim(),
      alergias: formData.alergias.trim() || 'Ninguna',
      notas: formData.notas.trim()
    };

    onSaveMember(payload, isNewMember);
    setEditingMember(null);
    setIsNewMember(false);

    // Si estábamos visualizando esta misma ficha, actualizarla en el visor
    if (viewingMember && viewingMember.id === payload.id) {
      setViewingMember(payload);
    }
  };

  // Confirmar Eliminación
  const handleConfirmDelete = () => {
    if (!deletingMember) return;
    onDeleteMember(deletingMember.id);
    if (viewingMember && viewingMember.id === deletingMember.id) {
      setViewingMember(null);
    }
    setDeletingMember(null);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-4 md:py-8 space-y-6">
      {/* Encabezado y Botón Principal de Creación */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-corporate-800 bg-corporate-100/80 px-3 py-1 rounded-full mb-2">
            <Users className="w-3.5 h-3.5" />
            Directorio de Miembros
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight">
            Miembros del Club Infantil
          </h1>
          <p className="text-sm text-neutral-600 mt-0.5">
            Expedientes con <strong className="text-neutral-900">foto de perfil</strong>, emisión de <strong className="text-neutral-900">carnet vertical en PDF</strong>, datos del tutor y estado de membresía.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-corporate-600 hover:bg-corporate-700 active:bg-corporate-800 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer text-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Nuevo Miembro / Afiliar Niño</span>
        </button>
      </div>

      {/* Barra de Búsqueda, Filtros y Modo de Vista */}
      <div className="bg-white p-3.5 md:p-4 rounded-xl border border-neutral-200 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Input de Búsqueda */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por niño, código (ej: KID-101), tutor, C.I., teléfono o alergia..."
              className="w-full pl-9 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-corporate-500 focus:bg-white transition-all"
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

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between">
            {/* Segmented Filter por Estado */}
            <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg shrink-0">
              {['todos', 'activa', 'pendiente', 'vencida'].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md capitalize transition-colors ${
                    statusFilter === f
                      ? 'bg-white text-neutral-900 shadow-xs font-bold'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Alternar modo de vista Cuadrícula vs Tabla */}
            <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-lg shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
                title="Vista de Fichas en Tarjetas"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
                title="Vista en Tabla Compacta"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          VISTA 1: CUADRÍCULA DE FICHAS (CARDS CON FOTO DE PERFIL)
          ======================================================== */}
      {viewMode === 'grid' ? (
        filteredAfiliados.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAfiliados.map((af, idx) => {
              const isActive = checkIsActiveAndValid(af);
              const isPending = af.estado === 'pendiente';
              const isExpired = af.estado === 'vencida' || (!isActive && !isPending);
              const isBirthday = isBirthdayThisMonth(af.fechaNacimiento);
              const age = calculateAge(af.fechaNacimiento);
              const hasAllergies = af.alergias && af.alergias.toLowerCase() !== 'ninguna' && af.alergias.trim() !== '';
              const avatar = getKidAvatar(af, idx);

              return (
                <div
                  key={af.id}
                  className="bg-white rounded-2xl border border-neutral-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                >
                  {/* Encabezado de la Ficha con Foto de Perfil */}
                  <div className="p-5 border-b border-neutral-100 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        {/* FOTO DE PERFIL DEL NIÑO */}
                        <div className="relative">
                          <div className="w-13 h-13 rounded-2xl overflow-hidden border-2 border-white shadow-xs bg-neutral-100 shrink-0">
                            <img
                              src={avatar}
                              alt={af.nombreNino}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {isActive && (
                            <span className="w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full absolute -bottom-0.5 -right-0.5" />
                          )}
                        </div>

                        <div>
                          <h3 className="font-extrabold text-neutral-900 text-base leading-snug">
                            {af.nombreNino}
                          </h3>
                          <div className="text-xs text-neutral-500 flex items-center gap-1.5 mt-0.5">
                            <span className="font-semibold text-neutral-700">
                              {age !== null ? `${age} años` : 'Edad N/D'}
                            </span>
                            <span>·</span>
                            <span className="font-mono text-neutral-500">{af.codigo}</span>
                          </div>
                        </div>
                      </div>

                      {/* Badge de Estado */}
                      <div>
                        {isActive && (
                          <span className="inline-flex items-center gap-1 text-2xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Activa
                          </span>
                        )}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 text-2xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Pendiente
                          </span>
                        )}
                        {isExpired && (
                          <span className="inline-flex items-center gap-1 text-2xs font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            Vencida
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Alerta de Cumpleaños */}
                    {isBirthday && (
                      <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-2 text-xs font-semibold flex items-center gap-2">
                        <Cake className="w-4 h-4 text-amber-600 shrink-0 animate-bounce" />
                        <span>¡Cumpleaños en este mes! Postre gratis.</span>
                      </div>
                    )}

                    {/* Datos del Representante y Vigencia */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="bg-neutral-50 p-2 rounded-lg">
                        <span className="text-neutral-400 block text-2xs">
                          {af.parentescoTutor ? `Representante (${af.parentescoTutor})` : 'Representante'}
                        </span>
                        <span className="font-semibold text-neutral-800 truncate block">{af.tutorNombre}</span>
                        {af.tutorCedula && (
                          <span className="font-mono text-2xs text-neutral-500 block truncate mt-0.5">
                            C.I. {af.tutorCedula}
                          </span>
                        )}
                      </div>
                      <div className="bg-neutral-50 p-2 rounded-lg">
                        <span className="text-neutral-400 block text-2xs">Teléfono</span>
                        <span className="font-mono font-medium text-neutral-800 truncate block">{af.tutorTelefono}</span>
                        <span className="text-2xs text-neutral-500 block truncate mt-0.5">
                          Vence: {af.fechaVencimiento}
                        </span>
                      </div>
                    </div>

                    {/* Alergias / Observación Médica */}
                    {hasAllergies && (
                      <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-lg p-2 text-xs flex items-start gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block">Alergia / Dieta:</span>
                          <span className="text-rose-800">{af.alergias}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Acciones de la Ficha: Ver Ficha, Imprimir Carnet, Editar y Borrar */}
                  <div className="p-3 bg-neutral-50/80 border-t border-neutral-100 flex items-center justify-between gap-1">
                    <button
                      type="button"
                      onClick={() => setViewingMember(af)}
                      className="flex-1 py-1.5 px-2 bg-white hover:bg-neutral-100 text-neutral-800 border border-neutral-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-neutral-600" />
                      <span>Ver Ficha</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCarnetMember(af)}
                      className="p-1.5 text-corporate-700 hover:text-corporate-900 hover:bg-corporate-50 border border-transparent hover:border-corporate-200 rounded-lg transition-colors cursor-pointer"
                      title="Imprimir Carnet / Exportar PDF"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(af)}
                      className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-white border border-transparent hover:border-neutral-200 rounded-lg transition-colors cursor-pointer"
                      title="Editar Ficha"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeletingMember(af)}
                      className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar Afiliado"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center text-neutral-500">
            <Users className="w-10 h-10 mx-auto text-neutral-300 mb-2" />
            <p className="font-semibold text-neutral-800">No se encontraron fichas de niños</p>
            <p className="text-xs text-neutral-500 mt-1">Intenta cambiar los términos de búsqueda o filtros.</p>
          </div>
        )
      ) : (
        /* ========================================================
            VISTA 2: TABLA DE FICHAS CON AVATAR
            ======================================================== */
        <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-neutral-50/80 border-b border-neutral-200 text-xs font-bold uppercase tracking-wider text-neutral-500">
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Niño / Foto / Edad</th>
                  <th className="py-3 px-4">Representante & C.I.</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Alergias / Dieta</th>
                  <th className="py-3 px-4">Vencimiento</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredAfiliados.map((af, idx) => {
                  const isActive = checkIsActiveAndValid(af);
                  const isPending = af.estado === 'pendiente';
                  const isExpired = af.estado === 'vencida' || (!isActive && !isPending);
                  const age = calculateAge(af.fechaNacimiento);
                  const avatar = getKidAvatar(af, idx);

                  return (
                    <tr key={af.id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-xs">{af.codigo}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={avatar}
                            alt={af.nombreNino}
                            className="w-9 h-9 rounded-xl object-cover border border-neutral-200 shadow-2xs shrink-0"
                          />
                          <div>
                            <div className="font-bold text-neutral-900">{af.nombreNino}</div>
                            <span className="block text-xs font-normal text-neutral-500">
                              {age !== null ? `${age} años` : 'N/D'} · Nac. {af.fechaNacimiento}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        <div className="font-bold text-neutral-800">{af.tutorNombre}</div>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {af.tutorCedula && (
                            <span className="font-mono text-neutral-600 bg-neutral-100 text-2xs px-1.5 py-0.5 rounded font-semibold border border-neutral-200">
                              C.I. {af.tutorCedula}
                            </span>
                          )}
                          <span className="font-semibold text-2xs text-corporate-800 bg-corporate-100/80 px-1.5 py-0.5 rounded border border-corporate-200/50">
                            {af.parentescoTutor || 'Representante'}
                          </span>
                          <span className="font-mono text-neutral-500 text-2xs">{af.tutorTelefono}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isActive && (
                          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                            Activa
                          </span>
                        )}
                        {isPending && (
                          <span className="text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                            Pendiente
                          </span>
                        )}
                        {isExpired && (
                          <span className="text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                            Vencida
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {af.alergias && af.alergias.toLowerCase() !== 'ninguna' ? (
                          <span className="text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded">
                            {af.alergias}
                          </span>
                        ) : (
                          <span className="text-neutral-400">Sin alergias</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">{af.fechaVencimiento}</td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setViewingMember(af)}
                            className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
                            title="Ver Ficha Completa"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCarnetMember(af)}
                            className="p-1.5 text-corporate-700 hover:text-corporate-900 hover:bg-corporate-50 rounded-md transition-colors"
                            title="Imprimir Carnet / Exportar PDF"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(af)}
                            className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
                            title="Editar Datos"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingMember(af)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 1: VER FICHA COMPLETA DEL NIÑO
          "Club Infantil · Credencial Oficial de Socio" (READ)
          ======================================================== */}
      {viewingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-neutral-200 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            {/* Header de la Ficha con FOTO DE PERFIL DEL NIÑO */}
            <div className="bg-corporate-700 text-white p-6 relative">
              <button
                type="button"
                onClick={() => setViewingMember(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2 text-2xs uppercase tracking-widest text-corporate-200 font-bold mb-1">
                <span>Club Infantil · Credencial Oficial de Socio</span>
              </div>

              <div className="flex items-center gap-4 mt-2">
                {/* FOTO DE PERFIL EN LA TARJETA OFICIAL */}
                <div className="w-18 h-18 rounded-2xl overflow-hidden border-2 border-white/80 shadow-md bg-white shrink-0">
                  <img
                    src={getKidAvatar(viewingMember)}
                    alt={viewingMember.nombreNino}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div>
                  <h2 className="text-2xl font-black text-white leading-tight">
                    {viewingMember.nombreNino}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-xs bg-black/25 px-2 py-0.5 rounded text-white/90 font-bold">
                      {viewingMember.codigo}
                    </span>
                    <span className="text-xs text-corporate-100">
                      {calculateAge(viewingMember.fechaNacimiento) !== null
                        ? `${calculateAge(viewingMember.fechaNacimiento)} años`
                        : 'Edad no registrada'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contenido scrolleable de la Ficha */}
            <div className="p-6 overflow-y-auto space-y-5 text-sm">
              {/* Alerta de Cumpleaños si aplica */}
              {isBirthdayThisMonth(viewingMember.fechaNacimiento) && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-950 flex items-center gap-3 shadow-xs">
                  <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
                    <Cake className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase text-amber-800">¡Socio Cumpleañero del Mes!</div>
                    <div className="text-xs text-amber-900 mt-0.5">
                      Válido para 1 pastel de cortesía o postre especial en restaurante.
                    </div>
                  </div>
                </div>
              )}

              {/* Estado de la Membresía */}
              <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200">
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
                  Estado de Membresía
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {checkIsActiveAndValid(viewingMember) ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                        MEMBRESÍA ACTIVA
                      </span>
                    ) : viewingMember.estado === 'pendiente' ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-800 bg-amber-100 border border-amber-300 px-3 py-1 rounded-full">
                        <AlertTriangle className="w-4 h-4 text-amber-700" />
                        PENDIENTE DE PAGO
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-rose-800 bg-rose-100 border border-rose-300 px-3 py-1 rounded-full">
                        <XCircle className="w-4 h-4 text-rose-700" />
                        MEMBRESÍA VENCIDA
                      </span>
                    )}
                  </div>
                  <div className="text-right text-xs">
                    <span className="text-neutral-400 block text-2xs">Vence el:</span>
                    <span className="font-mono font-bold text-neutral-900">{viewingMember.fechaVencimiento}</span>
                  </div>
                </div>
              </div>

              {/* Información del Niño y Tutor */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <span className="text-neutral-400 block text-2xs">Fecha de Nacimiento</span>
                  <span className="font-semibold text-neutral-900 text-sm mt-0.5 block">
                    {viewingMember.fechaNacimiento || 'No registrada'}
                  </span>
                </div>

                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <span className="text-neutral-400 block text-2xs">Monto Acumulado Pagado ($ USD)</span>
                  <span className="font-mono font-bold text-neutral-900 text-sm mt-0.5 block">
                    $ {(Number(viewingMember.montoPagado) || 0).toFixed(2)} USD
                  </span>
                  {viewingMember.montoBs ? (
                    <span className="text-2xs text-emerald-700 font-mono block">
                      ≈ Bs. {Number(viewingMember.montoBs).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                    </span>
                  ) : null}
                  {viewingMember.metodoPago && (
                    <span className="text-2xs text-corporate-700 font-semibold block mt-0.5">
                      {viewingMember.metodoPago} {viewingMember.referenciaPago ? `· Ref: ${viewingMember.referenciaPago}` : ''}
                    </span>
                  )}
                </div>

                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <span className="text-neutral-400 block text-2xs">Representante Legal</span>
                  <span className="font-semibold text-neutral-900 text-sm mt-0.5 block truncate">
                    {viewingMember.tutorNombre}
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                    {viewingMember.tutorCedula && (
                      <span className="font-mono text-2xs font-bold text-neutral-700 bg-neutral-200/80 px-2 py-0.5 rounded-md">
                        C.I. {viewingMember.tutorCedula}
                      </span>
                    )}
                    <span className="text-2xs font-bold text-corporate-800 bg-corporate-100/80 px-2 py-0.5 rounded-md border border-corporate-200/50">
                      Parentesco: {viewingMember.parentescoTutor || 'Representante'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
                  <span className="text-neutral-400 block text-2xs">Teléfono de Contacto</span>
                  <a 
                    href={`tel:${viewingMember.tutorTelefono}`}
                    className="font-mono font-bold text-corporate-700 hover:underline text-sm mt-0.5 block flex items-center gap-1"
                  >
                    <Phone className="w-3 h-3" />
                    <span>{viewingMember.tutorTelefono}</span>
                  </a>
                </div>
              </div>

              {/* Alergias Alimentarias / Restricciones Dietéticas */}
              <div className="p-4 bg-rose-50/60 border border-rose-200 rounded-2xl">
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-800 mb-1">
                  <Utensils className="w-4 h-4 text-rose-600" />
                  <span>Alergias y Cuidados Especiales en Restaurante</span>
                </div>
                <div className="text-xs text-rose-950 font-medium">
                  {viewingMember.alergias || 'Ninguna registrada'}
                </div>
                {viewingMember.notas && (
                  <div className="text-2xs text-rose-800/90 mt-1 italic border-t border-rose-200/60 pt-1">
                    Nota interna: {viewingMember.notas}
                  </div>
                )}
              </div>

              {/* Beneficios habilitados en restaurante */}
              <div className="space-y-1.5 text-xs text-neutral-600">
                <span className="font-bold text-neutral-800 block text-2xs uppercase tracking-wider">
                  Beneficios del Club Incluidos:
                </span>
                <ul className="space-y-1 pl-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>10% de descuento en el consumo de alimentos o menú kids.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>1 bebida natural o malteada gratis por visita.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Pulsera de acceso libre a la ludoteca / zona de juegos.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Footer con Acciones CRUD directas y Botón de Imprimir Carnet */}
            <div className="p-4 bg-neutral-50 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  const m = viewingMember;
                  setViewingMember(null);
                  setDeletingMember(m);
                }}
                className="px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar</span>
              </button>

              <div className="flex items-center gap-2 flex-wrap">
                {/* BOTÓN REQUERIDO: IMPRIMIR CARNET / EXPORTAR PDF */}
                <button
                  type="button"
                  onClick={() => setCarnetMember(viewingMember)}
                  className="px-4 py-2 bg-corporate-600 hover:bg-corporate-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Carnet / PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const m = viewingMember;
                    setViewingMember(null);
                    handleOpenEdit(m);
                  }}
                  className="px-4 py-2 bg-white border border-neutral-300 text-neutral-800 font-bold rounded-xl text-xs hover:bg-neutral-100 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Editar Ficha</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewingMember(null)}
                  className="px-4 py-2 bg-neutral-900 text-white font-bold rounded-xl text-xs hover:bg-neutral-800 transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 2: CREAR / EDITAR FICHA DE NIÑO CON SELECTOR DE FOTO
          ======================================================== */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-neutral-200 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-neutral-900">
                  {isNewMember ? 'Crear Nueva Ficha de Niño' : `Editar Ficha: ${editingMember.nombreNino}`}
                </h3>
                <p className="text-xs text-neutral-500">
                  {isNewMember ? 'Ingresa los datos para registrar un nuevo socio con foto de perfil' : 'Actualiza la información del socio, foto o tutor'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingMember(null)}
                className="w-8 h-8 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/50 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
              
              {/* SELECTOR INTERACTIVO DE FOTO DE PERFIL DEL NIÑO */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 space-y-3">
                <label className="block font-bold text-neutral-800 uppercase tracking-wide text-2xs">
                  Foto de Perfil del Niño (Para Ficha y Carnet) *
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Vista previa de la foto actual */}
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-corporate-600 shadow-md bg-white">
                      <img
                        src={formData.fotoPerfil || PRESET_AVATARS[0].url}
                        alt="Foto previa"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  <div className="flex-1 space-y-2 text-center sm:text-left">
                    <div>
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-neutral-300 hover:bg-neutral-100 rounded-lg text-xs font-bold text-neutral-800 transition-colors cursor-pointer shadow-2xs">
                        <Camera className="w-3.5 h-3.5 text-corporate-700" />
                        <span>Subir Foto del Niño</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </label>
                      <span className="text-[11px] text-neutral-500 block sm:inline sm:ml-2">
                        Galería o cámara del móvil
                      </span>
                    </div>

                    {/* Galería de avatares rápidos */}
                    <div>
                      <span className="text-2xs text-neutral-500 font-medium block mb-1">O elige una foto sugerida:</span>
                      <div className="flex items-center gap-1.5 flex-wrap justify-center sm:justify-start">
                        {PRESET_AVATARS.map((av) => (
                          <button
                            key={av.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, fotoPerfil: av.url })}
                            className={`w-8 h-8 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                              formData.fotoPerfil === av.url 
                                ? 'border-corporate-600 ring-2 ring-corporate-400 scale-105' 
                                : 'border-neutral-200 opacity-80 hover:opacity-100'
                            }`}
                            title={av.nombre}
                          >
                            <img src={av.url} alt={av.nombre} className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Código */}
                <div>
                  <label className="block font-bold text-neutral-700 mb-1 uppercase tracking-wide text-2xs">
                    Código de Socio *
                  </label>
                  <input
                    type="text"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl font-mono font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-corporate-500"
                    placeholder="KID-108"
                  />
                </div>

                {/* Nombre del Niño */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-neutral-700 mb-1 uppercase tracking-wide text-2xs">
                    Nombre Completo del Niño *
                  </label>
                  <input
                    type="text"
                    value={formData.nombreNino}
                    onChange={(e) => setFormData({ ...formData, nombreNino: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-neutral-900 font-semibold focus:outline-none focus:ring-2 focus:ring-corporate-500 text-sm"
                    placeholder="Ej: Mateo González"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Fecha de Nacimiento */}
                <div>
                  <label className="block font-bold text-neutral-700 mb-1 uppercase tracking-wide text-2xs">
                    Fecha de Nacimiento *
                  </label>
                  <input
                    type="date"
                    value={formData.fechaNacimiento}
                    onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-corporate-500"
                  />
                  {formData.fechaNacimiento && (
                    <span className="text-2xs text-corporate-700 font-medium mt-1 block">
                      Edad calculada: {calculateAge(formData.fechaNacimiento)} años
                    </span>
                  )}
                </div>

                {/* Estado */}
                <div>
                  <label className="block font-bold text-neutral-700 mb-1 uppercase tracking-wide text-2xs">
                    Estado de Membresía
                  </label>
                  <select
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-neutral-900 font-semibold focus:outline-none focus:ring-2 focus:ring-corporate-500"
                  >
                    <option value="pendiente">Pendiente (Sin pago)</option>
                    <option value="activa">Activa (Vigente con beneficios)</option>
                    <option value="vencida">Vencida (Requiere renovación)</option>
                  </select>
                </div>
              </div>

              {/* Datos del Representante, Cédula y Parentesco */}
              <div className="pt-2 border-t border-neutral-200">
                <span className="font-bold text-neutral-700 uppercase tracking-wide text-2xs block mb-2">
                  Datos del Representante Legal, Cédula de Identidad y Parentesco
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-medium text-neutral-600 mb-1">Nombre del Representante *</label>
                    <input
                      type="text"
                      value={formData.tutorNombre}
                      onChange={(e) => setFormData({ ...formData, tutorNombre: e.target.value })}
                      required
                      placeholder="Ej: Carlos González"
                      className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-corporate-500"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-neutral-600 mb-1">Cédula de Identidad (C.I.) *</label>
                    <input
                      type="text"
                      value={formData.tutorCedula}
                      onChange={(e) => setFormData({ ...formData, tutorCedula: e.target.value })}
                      required
                      placeholder="Ej: V-18.452.901"
                      className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl font-mono text-neutral-900 focus:outline-none focus:ring-2 focus:ring-corporate-500"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-neutral-600 mb-1">Parentesco con el Niño *</label>
                    <select
                      value={formData.parentescoTutor}
                      onChange={(e) => setFormData({ ...formData, parentescoTutor: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-neutral-900 font-semibold focus:outline-none focus:ring-2 focus:ring-corporate-500"
                    >
                      <option value="Padre">Padre</option>
                      <option value="Madre">Madre</option>
                      <option value="Hermano">Hermano / Hermana</option>
                      <option value="Tío / Tía">Tío / Tía</option>
                      <option value="Abuelo">Abuelo / Abuela</option>
                      <option value="Otro">Otro Representante Legal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-neutral-600 mb-1">Teléfono (WhatsApp/Llamada) *</label>
                    <input
                      type="tel"
                      value={formData.tutorTelefono}
                      onChange={(e) => setFormData({ ...formData, tutorTelefono: e.target.value })}
                      required
                      placeholder="5512345678"
                      className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl font-mono text-neutral-900 focus:outline-none focus:ring-2 focus:ring-corporate-500"
                    />
                  </div>
                </div>
              </div>

              {/* Fechas de Vigencia y Cobro */}
              <div className="pt-2 border-t border-neutral-200">
                <span className="font-bold text-neutral-700 uppercase tracking-wide text-2xs block mb-2">
                  Vigencia y Cuota
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-medium text-neutral-600 mb-1">Fecha de Inicio</label>
                    <input
                      type="date"
                      value={formData.fechaInicio}
                      onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-neutral-900 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-neutral-600 mb-1">Fecha de Vencimiento</label>
                    <input
                      type="date"
                      value={formData.fechaVencimiento}
                      onChange={(e) => setFormData({ ...formData, fechaVencimiento: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-neutral-900 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-neutral-600 mb-1">Monto Pagado ($ USD)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      placeholder="25.00"
                      value={formData.montoPagado}
                      onChange={(e) => setFormData({ ...formData, montoPagado: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-neutral-900 font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Forma de Pago y Referencia */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block font-medium text-neutral-600 mb-1">Forma de Pago</label>
                    <select
                      value={formData.metodoPago}
                      onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-neutral-900 font-semibold"
                    >
                      <option value="Pago Móvil">Pago Móvil (Requiere Ref.)</option>
                      <option value="Tarjeta">Tarjeta (Requiere Ref.)</option>
                      <option value="Transferencia">Transferencia (Requiere Ref.)</option>
                      <option value="Sended">Sended (Requiere Ref.)</option>
                      <option value="Efectivo $">Efectivo ($ USD)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-medium text-neutral-600 mb-1">
                      Nro. de Referencia {formData.metodoPago !== 'Efectivo $' ? '*' : '(Opcional)'}
                    </label>
                    <input
                      type="text"
                      value={formData.referenciaPago}
                      onChange={(e) => setFormData({ ...formData, referenciaPago: e.target.value })}
                      placeholder={formData.metodoPago !== 'Efectivo $' ? 'Ej: 894120 / Lote / Comprobante' : 'Opcional'}
                      className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl font-mono text-neutral-900"
                    />
                  </div>
                </div>
              </div>

              {/* Alergias y Restricciones Dietéticas */}
              <div className="pt-2 border-t border-neutral-200">
                <label className="block font-bold text-rose-800 uppercase tracking-wide text-2xs mb-1">
                  Alergias Alimentarias / Restricciones Dietéticas
                </label>
                <input
                  type="text"
                  value={formData.alergias}
                  onChange={(e) => setFormData({ ...formData, alergias: e.target.value })}
                  placeholder="Ej: Alergia a nueces, Intolerancia a la lactosa, Celiaquía, o Ninguna"
                  className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Notas adicionales */}
              <div>
                <label className="block font-medium text-neutral-600 mb-1">
                  Notas Adicionales / Preferencias del Niño
                </label>
                <textarea
                  rows="2"
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  placeholder="Ej: Le gusta sentarse cerca de juegos, postre preferido, etc."
                  className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-xl text-neutral-900 focus:outline-none focus:ring-2 focus:ring-corporate-500"
                />
              </div>

              {/* Botones de acción */}
              <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 hover:text-neutral-900 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-corporate-600 hover:bg-corporate-700 active:bg-corporate-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{isNewMember ? 'Guardar y Crear Ficha' : 'Guardar Cambios'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 3: CONFIRMAR ELIMINACIÓN (DELETE)
          ======================================================== */}
      {deletingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-neutral-200 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-neutral-900">
                ¿Eliminar esta Ficha?
              </h3>
              <p className="text-xs text-neutral-600 mt-1">
                Estás a punto de eliminar el expediente de{' '}
                <strong className="text-neutral-900">{deletingMember.nombreNino}</strong> (
                <span className="font-mono">{deletingMember.codigo}</span>). Esta acción no se puede deshacer.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingMember(null)}
                className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer"
              >
                Sí, Eliminar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL 4: CARNET OFICIAL VERTICAL & EXPORTADOR PDF
          ======================================================== */}
      {carnetMember && (
        <CarnetModal
          member={carnetMember}
          onClose={() => setCarnetMember(null)}
        />
      )}
    </div>
  );
}
