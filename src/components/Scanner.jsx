/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Search, 
  ShieldCheck, 
  Cake, 
  Gift, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  User, 
  Phone, 
  Calendar, 
  Percent, 
  Coffee, 
  Gamepad2, 
  Sparkles, 
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { isBirthdayThisMonth, calculateAge, checkIsActiveAndValid, getKidAvatar } from '../mockData.js';

export default function Scanner({ afiliados, onSwitchToCaja, onViewChildProfile }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchedMember, setSearchedMember] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [showSimulateQr, setShowSimulateQr] = useState(false);

  // Normalizador de búsqueda (permite buscar ignorando guiones, espacios y mayúsculas)
  const normalize = (val) => (val || '').toString().toLowerCase().replace(/[\s-]/g, '');

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    const cleanQuery = normalize(searchTerm);
    if (!cleanQuery) {
      setSearchedMember(null);
      setHasSearched(false);
      return;
    }

    const found = afiliados.find((af) => {
      const matchCodigo = normalize(af.codigo).includes(cleanQuery);
      const matchTelefono = normalize(af.tutorTelefono).includes(cleanQuery);
      const matchCedula = af.tutorCedula ? normalize(af.tutorCedula).includes(cleanQuery) : false;
      return matchCodigo || matchTelefono || matchCedula;
    });

    setSearchedMember(found || null);
    setHasSearched(true);
  };

  const handleQuickLookup = (code) => {
    setSearchTerm(code);
    const cleanQuery = normalize(code);
    const found = afiliados.find((af) => normalize(af.codigo) === cleanQuery);
    setSearchedMember(found || null);
    setHasSearched(true);
  };

  const handleClear = () => {
    setSearchTerm('');
    setSearchedMember(null);
    setHasSearched(false);
  };

  const isActive = searchedMember ? checkIsActiveAndValid(searchedMember) : false;
  const isPending = searchedMember && searchedMember.estado === 'pendiente';
  const isExpired = searchedMember && (searchedMember.estado === 'vencida' || (!isActive && !isPending));
  const isBirthday = searchedMember ? isBirthdayThisMonth(searchedMember.fechaNacimiento) : false;
  const age = searchedMember ? calculateAge(searchedMember.fechaNacimiento) : null;

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4 md:py-8 space-y-6">
      {/* Encabezado contextual para Meseros */}
      <div className="text-center md:text-left">
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-corporate-800 bg-corporate-100/80 px-3 py-1 rounded-full mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-corporate-700" />
          Terminal de Servicio para Meseros
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-neutral-900 tracking-tight">
          Validación con Código de Socio
        </h1>
        <p className="text-sm text-neutral-600 mt-1">
          Ingresa el código del carnet del niño (ej: KID-101), teléfono o cédula del tutor para validar beneficios en mesa.
        </p>
      </div>

      {/* Barra de búsqueda interactiva */}
      <form onSubmit={handleSearch} className="relative">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ingresa código (ej: KID-101), teléfono o cédula del tutor..."
              className="w-full pl-11 pr-24 py-3.5 bg-white border border-neutral-300 rounded-xl text-neutral-900 placeholder:text-neutral-400 font-medium text-base shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute inset-y-0 right-3 my-auto h-7 px-2 text-xs font-semibold text-neutral-500 hover:text-neutral-800 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors"
              >
                Limpiar
              </button>
            )}
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3.5 bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-950 text-white font-semibold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-2 shrink-0 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Consultar</span>
          </button>
        </div>

        {/* Botones de prueba rápida para meseros */}
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-neutral-600">
          <span className="font-semibold text-neutral-700">Pruebas rápidas:</span>
          <button
            type="button"
            onClick={() => handleQuickLookup('KID-101')}
            className="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md font-medium transition-colors shadow-2xs"
          >
            KID-101 (Activa + Cumpleañero)
          </button>
          <button
            type="button"
            onClick={() => handleQuickLookup('KID-102')}
            className="px-2.5 py-1 bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md font-medium transition-colors shadow-2xs"
          >
            KID-102 (Activa)
          </button>
          <button
            type="button"
            onClick={() => handleQuickLookup('KID-103')}
            className="px-2.5 py-1 bg-white hover:bg-amber-50 border border-amber-200 text-amber-800 rounded-md font-medium transition-colors shadow-2xs"
          >
            KID-103 (Pendiente)
          </button>
          <button
            type="button"
            onClick={() => handleQuickLookup('KID-104')}
            className="px-2.5 py-1 bg-white hover:bg-rose-50 border border-rose-200 text-rose-800 rounded-md font-medium transition-colors shadow-2xs"
          >
            KID-104 (Vencida)
          </button>
        </div>
      </form>

      {/* Visualización de Resultados: TARJETA GIGANTE */}
      {hasSearched ? (
        searchedMember ? (
          isActive ? (
            /* ========================================================
               TARJETA VERDE GIGANTE: AFILIADO ACTIVO CON BENEFICIOS
               ======================================================== */
            <div className="rounded-2xl bg-gradient-to-b from-emerald-600 to-emerald-700 text-white shadow-xl overflow-hidden border border-emerald-500 animate-in fade-in zoom-in-95 duration-200">
              {/* Header de la tarjeta */}
              <div className="px-6 py-5 md:px-8 md:py-6 border-b border-emerald-500/50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-emerald-700/40">
                <div className="flex items-center gap-4">
                  {/* FOTO DE PERFIL DEL NIÑO */}
                  <div className="relative shrink-0">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-md bg-white">
                      <img
                        src={getKidAvatar(searchedMember)}
                        alt={searchedMember.nombreNino}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 bg-white text-emerald-700 rounded-full p-0.5 shadow">
                      <CheckCircle2 className="w-4 h-4 fill-emerald-100" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase tracking-wider font-extrabold bg-emerald-950/40 text-corporate-200 px-2.5 py-0.5 rounded">
                        Membresía Activa y Vigente
                      </span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black mt-0.5 tracking-tight text-white">
                      {searchedMember.nombreNino}
                    </h2>
                  </div>
                </div>

                <div className="text-left md:text-right bg-corporate-800/60 md:bg-transparent p-3 md:p-0 rounded-xl">
                  <div className="text-xs text-corporate-200 font-medium">Código de Socio</div>
                  <div className="text-2xl font-mono font-extrabold tracking-wider text-white">
                    {searchedMember.codigo}
                  </div>
                </div>
              </div>

              {/* Banner festivo si es cumpleaños en el mes actual */}
              {isBirthday && (
                <div className="bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 text-amber-950 px-6 py-4 md:px-8 border-y border-amber-300 shadow-inner flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-white text-amber-600 flex items-center justify-center shrink-0 shadow-sm animate-bounce">
                    <Cake className="w-7 h-7" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 font-black text-sm uppercase tracking-wide text-amber-900">
                      <Sparkles className="w-4 h-4 text-amber-700 fill-amber-700" />
                      ¡Cumpleañero del Mes!
                    </div>
                    <p className="text-sm font-semibold text-amber-950 leading-snug">
                      Aplica cortesía cumpleañera: <span className="underline font-bold">1 Rebanada de Pastel o Postre Especial</span> + Felicitación del equipo.
                    </p>
                  </div>
                </div>
              )}

              {/* Cuerpo de la tarjeta: Datos del afiliado y beneficios */}
              <div className="p-6 md:p-8 space-y-6">
                {/* Beneficios directos para aplicar en mesa */}
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-corporate-200 mb-3">
                    Beneficios autorizados para esta mesa:
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-emerald-800/50 border border-emerald-400/30 rounded-xl p-4 flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-corporate-500/40 flex items-center justify-center shrink-0 text-white">
                        <Percent className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">10% Descuento</div>
                        <div className="text-xs text-corporate-200 mt-0.5">En consumo total o menú infantil</div>
                      </div>
                    </div>

                    <div className="bg-emerald-800/50 border border-emerald-400/30 rounded-xl p-4 flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-corporate-500/40 flex items-center justify-center shrink-0 text-white">
                        <Coffee className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Bebida Gratis</div>
                        <div className="text-xs text-corporate-200 mt-0.5">Jugo natural o malteada kids</div>
                      </div>
                    </div>

                    <div className="bg-emerald-800/50 border border-emerald-400/30 rounded-xl p-4 flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-corporate-500/40 flex items-center justify-center shrink-0 text-white">
                        <Gamepad2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">Zona Infantil</div>
                        <div className="text-xs text-corporate-200 mt-0.5">Pulsera de acceso libre sin costo</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Información de referencia del tutor y vigencia */}
                <div className="pt-4 border-t border-corporate-500/40 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-corporate-200 block">Representante a cargo</span>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="font-semibold text-white text-sm">{searchedMember.tutorNombre}</span>
                      <span className="text-[10px] bg-white/20 text-white font-medium px-1.5 py-0.5 rounded">
                        {searchedMember.parentescoTutor || 'Representante'}
                      </span>
                    </div>
                    {searchedMember.tutorCedula && (
                      <span className="text-[11px] text-corporate-200 font-mono block mt-0.5">
                        C.I. {searchedMember.tutorCedula}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-corporate-200 block">Teléfono de contacto</span>
                    <span className="font-mono font-semibold text-white text-sm block mt-0.5">{searchedMember.tutorTelefono}</span>
                  </div>
                  <div>
                    <span className="text-corporate-200 block">Edad del socio</span>
                    <span className="font-semibold text-white text-sm block mt-0.5">
                      {age !== null ? `${age} años` : 'No registrada'}
                    </span>
                  </div>
                  <div>
                    <span className="text-corporate-200 block">Vigencia hasta</span>
                    <span className="font-mono font-bold text-corporate-100 text-sm block mt-0.5">
                      {searchedMember.fechaVencimiento}
                    </span>
                  </div>
                </div>

                {/* Botón de acción rápida para el mesero */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => onViewChildProfile && onViewChildProfile(searchedMember.id)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-white text-corporate-900 font-bold rounded-xl hover:bg-neutral-100 transition-colors shadow-sm text-sm text-center cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <User className="w-4 h-4 text-corporate-700" />
                    <span>Ver Ficha Completa del Niño</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="w-full sm:w-auto px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors text-sm text-center cursor-pointer"
                  >
                    Nueva Consulta
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================
               TARJETA ROJA / AMARILLA: PENDIENTE O VENCIDA
               ======================================================== */
            <div
              className={`rounded-2xl text-white shadow-xl overflow-hidden border animate-in fade-in zoom-in-95 duration-200 ${
                isPending
                  ? 'bg-gradient-to-b from-amber-600 to-amber-700 border-amber-500'
                  : 'bg-gradient-to-b from-rose-600 to-rose-700 border-rose-500'
              }`}
            >
              <div className="p-6 md:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {/* FOTO DE PERFIL DEL NIÑO */}
                    <div className="relative shrink-0">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/60 shadow-md bg-white/20">
                        <img
                          src={getKidAvatar(searchedMember)}
                          alt={searchedMember.nombreNino}
                          className="w-full h-full object-cover opacity-90"
                        />
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-white text-neutral-800 rounded-full p-0.5 shadow">
                        {isPending ? (
                          <AlertTriangle className="w-4 h-4 text-amber-600 fill-amber-100" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-600 fill-rose-100" />
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="inline-block text-xs font-black uppercase tracking-wider bg-black/25 px-2.5 py-0.5 rounded mb-1">
                        {isPending ? 'Membresía Pendiente de Pago' : 'Membresía Vencida / Inactiva'}
                      </div>
                      <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                        {searchedMember.nombreNino}
                      </h2>
                    </div>
                  </div>

                  <div className="bg-black/20 px-4 py-2 rounded-xl">
                    <span className="text-xs text-white/80 block">Código</span>
                    <span className="font-mono font-bold text-xl">{searchedMember.codigo}</span>
                  </div>
                </div>

                {/* Mensaje de bloqueo claro para el mesero */}
                <div className="bg-black/25 border border-white/20 rounded-xl p-5 space-y-2">
                  <div className="text-lg font-bold flex items-center gap-2">
                    <span>⛔ No aplicar beneficios en esta cuenta</span>
                  </div>
                  <p className="text-sm text-white/90">
                    {isPending
                      ? 'El registro de este socio fue iniciado pero aún no cuenta con pago confirmado en caja.'
                      : `Esta membresía venció el ${searchedMember.fechaVencimiento}. Requiere renovación para reactivar los descuentos.`}
                  </p>
                  <p className="text-xs text-white/80 font-medium">
                    👉 Indica amablemente al tutor ({searchedMember.tutorNombre}) que puede pasar a la Caja para activar su membresía en 1 minuto.
                  </p>
                </div>

                {/* Datos de referencia rápida */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs border-t border-white/15 pt-4">
                  <div>
                    <span className="text-white/70 block">Representante</span>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="font-semibold text-white block text-sm">{searchedMember.tutorNombre}</span>
                      <span className="text-[10px] bg-white/20 text-white font-medium px-1.5 py-0.5 rounded">
                        {searchedMember.parentescoTutor || 'Representante'}
                      </span>
                    </div>
                    {searchedMember.tutorCedula && (
                      <span className="text-[11px] text-white/80 font-mono block mt-0.5">
                        C.I. {searchedMember.tutorCedula}
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="text-white/70 block">Teléfono</span>
                    <span className="font-mono font-semibold text-white block text-sm mt-0.5">{searchedMember.tutorTelefono}</span>
                  </div>
                  <div>
                    <span className="text-white/70 block">Estado actual</span>
                    <span className="font-bold uppercase text-white block text-sm mt-0.5">
                      {searchedMember.estado}
                    </span>
                  </div>
                </div>

                {/* Botón de acceso directo a Caja y Ficha */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => onSwitchToCaja && onSwitchToCaja(searchedMember.codigo)}
                    className="w-full sm:w-auto px-5 py-3 bg-white text-neutral-900 font-bold rounded-xl hover:bg-neutral-100 transition-colors shadow-sm text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Ir a Caja para Registrar Pago</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onViewChildProfile && onViewChildProfile(searchedMember.id)}
                    className="w-full sm:w-auto px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <User className="w-4 h-4" />
                    <span>Ver Ficha del Niño</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleClear}
                    className="w-full sm:w-auto px-4 py-3 text-white/80 hover:text-white transition-colors text-sm text-center cursor-pointer"
                  >
                    Nueva Consulta
                  </button>
                </div>
              </div>
            </div>
          )
        ) : (
          /* ========================================================
             TARJETA ROJA: AFILIADO NO ENCONTRADO
             ======================================================== */
          <div className="rounded-2xl bg-neutral-900 text-white p-8 text-center border border-neutral-800 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <XCircle className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Socio No Encontrado</h3>
              <p className="text-sm text-neutral-400 max-w-md mx-auto mt-1">
                No existe ningún registro con el código o teléfono <span className="text-white font-mono font-bold">"{searchTerm}"</span>.
              </p>
            </div>
            <div className="bg-neutral-800/80 rounded-xl p-4 text-xs text-neutral-300 max-w-md mx-auto text-left space-y-1">
              <p className="font-semibold text-white">Posibles causas:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-neutral-400">
                <li>El carnet fue escrito incorrectamente (ej: KID-101).</li>
                <li>El tutor dio otro número de teléfono en su registro.</li>
                <li>El cliente aún no se ha registrado en el Club Infantil.</li>
              </ul>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={handleClear}
                className="px-5 py-2.5 bg-white text-neutral-900 font-bold rounded-xl hover:bg-neutral-100 transition-colors text-sm cursor-pointer"
              >
                Volver a buscar
              </button>
            </div>
          </div>
        )
      ) : (
        /* ========================================================
           ESTADO INICIAL / EN ESPERA DE ESCANEO
           ======================================================== */
        <div className="bg-white rounded-2xl border border-neutral-200 p-8 md:p-12 text-center shadow-xs">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-corporate-50 text-corporate-700 flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900">Listo para validar con código de socio</h3>
          <p className="text-sm text-neutral-500 max-w-md mx-auto mt-1 mb-6">
            Escribe el código que aparece en el carnet del niño (ej: KID-101), o el teléfono / cédula del tutor.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl mx-auto text-left text-xs text-neutral-600">
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <span className="font-bold text-emerald-700 block mb-0.5">1. Verde</span>
              <span>Afiliado activo y vigente. Aplica 10% descuento y cortesías.</span>
            </div>
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <span className="font-bold text-amber-700 block mb-0.5">2. Amarillo</span>
              <span>Membresía pendiente de pago. Enviar a caja.</span>
            </div>
            <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <span className="font-bold text-rose-700 block mb-0.5">3. Rojo</span>
              <span>Membresía vencida o no registrada. Invitar a renovar.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
