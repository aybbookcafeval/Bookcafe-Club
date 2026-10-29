/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Cake, 
  Sparkles, 
  ChefHat, 
  ShieldAlert, 
  Utensils, 
  Percent, 
  Coffee, 
  Gamepad2, 
  Phone, 
  QrCode, 
  Info,
  Layers,
  FileText
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  calculateAge, 
  isBirthdayThisMonth, 
  checkIsActiveAndValid, 
  getKidAvatar 
} from '../mockData.js';

export default function CarnetModal({ member, onClose }) {
  const [cardSize, setCardSize] = useState('cr80'); // 'cr80' (54x85.6mm) | 'gafete' (70x100mm)
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportType, setExportType] = useState('card'); // 'card' (individual) | 'sheet' (hoja A4 con guías)

  const carnetRef = useRef(null);

  if (!member) return null;

  const isActive = checkIsActiveAndValid(member);
  const isPending = member.estado === 'pendiente';
  const isExpired = member.estado === 'vencida' || (!isActive && !isPending);
  const age = calculateAge(member.fechaNacimiento);
  const isBirthday = isBirthdayThisMonth(member.fechaNacimiento);
  const avatarUrl = getKidAvatar(member);

  // Dimensiones estándar sugeridas:
  // 1. Estándar Internacional CR80 (ISO/IEC 7810 ID-1): 54 mm de ancho × 85.6 mm de alto
  // 2. Gafete Evento / Restaurante: 70 mm × 100 mm
  const cardDimensions = cardSize === 'cr80' 
    ? { widthMm: 54, heightMm: 85.6, label: 'Estándar CR80 (54 × 85.6 mm)', desc: 'Tamaño tarjeta de crédito/credencial. Encaja en cualquier funda transparente para carnet con cordón o clip.' }
    : { widthMm: 70, heightMm: 100, label: 'Gafete XL (70 × 100 mm)', desc: 'Mayor tamaño y visibilidad. Ideal para lectura rápida de nombres por parte de los meseros.' };

  /**
   * Exporta el Carnet Vertical a PDF
   * @param {'card' | 'sheet'} mode - 'card' para tamaño real individual o 'sheet' para hoja A4 con marcas de corte
   */
  const handleExportPDF = async (mode = 'card') => {
    if (!carnetRef.current) return;
    setIsExporting(true);
    setExportSuccess(false);

    try {
      // Captura el elemento a 3x escala para garantizar 300 DPI y máxima nitidez de impresión
      const canvas = await html2canvas(carnetRef.current, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const filename = `Carnet_${member.codigo}_${member.nombreNino.replace(/\s+/g, '_')}.pdf`;

      if (mode === 'card') {
        // PDF individual con las medidas exactas del carnet (54 x 85.6 mm)
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: [cardDimensions.widthMm, cardDimensions.heightMm]
        });

        pdf.addImage(imgData, 'PNG', 0, 0, cardDimensions.widthMm, cardDimensions.heightMm, '', 'FAST');
        pdf.save(filename);
      } else {
        // PDF en Hoja A4 con el carnet centrado y guías de recorte punteadas
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4' // 210 x 297 mm
        });

        const pageWidth = 210;
        const pageHeight = 297;
        const x = (pageWidth - cardDimensions.widthMm) / 2;
        const y = 35;

        // Título de la hoja
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        pdf.setTextColor(30, 41, 59);
        pdf.text('CLUB INFANTIL · CREDENCIAL OFICIAL DE SOCIO', pageWidth / 2, 20, { align: 'center' });

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(100, 116, 139);
        pdf.text(`Formato ${cardDimensions.label} · Imprimir en escala 100% (sin ajustar) y recortar por las guías`, pageWidth / 2, 26, { align: 'center' });

        // Guías de corte punteadas alrededor del carnet
        pdf.setDrawColor(180, 190, 205);
        pdf.setLineDashPattern([2, 2], 0);
        pdf.rect(x - 0.5, y - 0.5, cardDimensions.widthMm + 1, cardDimensions.heightMm + 1);

        // Indicador de perforación de lanyard superior
        pdf.setLineDashPattern([], 0);
        pdf.setFillColor(230, 235, 245);
        pdf.roundedRect(x + (cardDimensions.widthMm / 2) - 6, y + 2, 12, 3, 1, 1, 'FD');

        // Imagen del carnet
        pdf.addImage(imgData, 'PNG', x, y, cardDimensions.widthMm, cardDimensions.heightMm, '', 'FAST');

        // Instrucciones al pie
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(140, 150, 165);
        pdf.text('1. Imprime esta hoja en cartulina blanca (180g - 250g) o papel fotográfico.', pageWidth / 2, y + cardDimensions.heightMm + 14, { align: 'center' });
        pdf.text('2. Recorta por el borde punteado y coloca en una funda transparente para carnet con clip o cinta de cuello.', pageWidth / 2, y + cardDimensions.heightMm + 19, { align: 'center' });
        pdf.text(`Código: ${member.codigo} · Titular: ${member.nombreNino} · Vigencia: ${member.fechaVencimiento || 'N/D'}`, pageWidth / 2, y + cardDimensions.heightMm + 25, { align: 'center' });

        pdf.save(`Hoja_Impresion_${filename}`);
      }

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (error) {
      console.error('Error al generar PDF del carnet:', error);
      alert('Hubo un inconveniente al generar el PDF. Por favor intenta de nuevo.');
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * Invoca el diálogo de impresión del navegador
   */
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-neutral-200 overflow-hidden animate-in zoom-in-95 duration-200 my-auto flex flex-col max-h-[96vh]">
        {/* Header del Modal */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-corporate-600 text-white flex items-center justify-center font-black shadow-xs">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-extrabold text-neutral-900 leading-tight">
                Imprimir Carnet Oficial / Exportar PDF
              </h2>
              <p className="text-xs text-neutral-500">
                Formato vertical listo para credencial, porta-carnet y cordón de cuello
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/60 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido en dos columnas: Vista previa a la izquierda, opciones a la derecha */}
        <div className="p-4 md:p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ========================================================
              COLUMNA IZQUIERDA: VISTA PREVIA DEL CARNET VERTICAL
              ======================================================== */}
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2 flex items-center gap-1.5">
              <span>Vista Previa del Carnet Vertical</span>
              <span className="font-mono text-corporate-700 bg-corporate-50 px-2 py-0.5 rounded text-2xs">
                {cardSize === 'cr80' ? '54 × 85.6 mm (CR80)' : '70 × 100 mm (Gafete)'}
              </span>
            </div>

            {/* CONTENEDOR DEL CARNET (Formato Vertical Portarretratos) */}
            <div className="p-3 bg-neutral-100 rounded-2xl border border-neutral-300 shadow-inner flex justify-center items-center">
              <div
                ref={carnetRef}
                id="carnet-printable-area"
                className={`bg-white rounded-2xl shadow-xl overflow-hidden border border-neutral-300 relative flex flex-col justify-between select-none ${
                  cardSize === 'cr80' 
                    ? 'w-[290px] h-[460px]' 
                    : 'w-[320px] h-[460px]'
                }`}
                style={{
                  fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
                }}
              >
                {/* Ranura superior simulada para perforación de lanyard */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
                  <div className="w-12 h-2.5 rounded-full bg-neutral-200/90 border border-neutral-300 shadow-2xs" />
                </div>

                {/* Encabezado Corporativo del Carnet */}
                <div className="bg-corporate-700 text-white pt-6 pb-3 px-4 text-center relative overflow-hidden">
                  <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-white/5 rounded-full pointer-events-none" />
                  
                  <div className="flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-corporate-200">
                    <ChefHat className="w-3.5 h-3.5 text-corporate-300" />
                    <span>Club Infantil VIP</span>
                  </div>

                  <h3 className="text-xs font-extrabold uppercase tracking-tight text-white mt-0.5">
                    Credencial Oficial de Socio
                  </h3>
                </div>

                {/* Cuerpo del Carnet: Foto de Perfil, Nombre y Datos */}
                <div className="px-4 py-2 flex-1 flex flex-col items-center justify-between text-center space-y-1.5">
                  {/* FOTO DE PERFIL DEL NIÑO (Con borde corporate y sombra) */}
                  <div className="relative mt-1">
                    <div className="w-22 h-22 rounded-2xl overflow-hidden border-3 border-corporate-600 shadow-md bg-neutral-100 mx-auto">
                      <img
                        src={avatarUrl}
                        alt={member.nombreNino}
                        crossOrigin="anonymous"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback si la imagen no carga
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>

                    {/* Badge de estado en miniatura sobre la foto */}
                    <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                      {isActive && (
                        <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Activo
                        </span>
                      )}
                      {isPending && (
                        <span className="text-[9px] font-black uppercase tracking-wider bg-amber-600 text-white px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Pendiente
                        </span>
                      )}
                      {isExpired && (
                        <span className="text-[9px] font-black uppercase tracking-wider bg-rose-600 text-white px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                          <XCircle className="w-2.5 h-2.5" />
                          Vencido
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Nombre y Edad del Niño */}
                  <div className="pt-2">
                    <h4 className="text-base font-black text-neutral-900 leading-tight">
                      {member.nombreNino}
                    </h4>
                    <div className="text-[11px] text-neutral-500 font-semibold flex items-center justify-center gap-1.5 mt-0.5">
                      <span>{age !== null ? `${age} años` : 'Edad N/D'}</span>
                      <span>·</span>
                      <span className="font-mono font-bold text-neutral-700 bg-neutral-100 px-1.5 py-0.2 rounded border border-neutral-200">
                        {member.codigo}
                      </span>
                    </div>
                  </div>

                  {/* Alerta de Cumpleaños si coincide en el mes */}
                  {isBirthday && (
                    <div className="w-full bg-amber-50 border border-amber-200 text-amber-900 rounded-md py-1 px-2 text-[10px] font-bold flex items-center justify-center gap-1">
                      <Cake className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>¡Cumpleañero del Mes! Postre Gratis</span>
                    </div>
                  )}

                  {/* Alergias / Observación Médica */}
                  <div className="w-full">
                    {member.alergias && member.alergias.toLowerCase() !== 'ninguna' && member.alergias.trim() !== '' ? (
                      <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-md py-1 px-2 text-[10px] font-bold flex items-center justify-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-rose-600 shrink-0" />
                        <span className="truncate">Alergia: {member.alergias}</span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-neutral-400 font-medium">
                        Sin restricciones alimentarias conocidas
                      </div>
                    )}
                  </div>

                  {/* Beneficios VIP autorizados */}
                  <div className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-2 text-left">
                    <div className="text-[9px] font-bold uppercase tracking-wider text-neutral-500 mb-1">
                      Beneficios en Comanda:
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-[9px] text-center font-bold text-neutral-800">
                      <div className="bg-white p-1 rounded border border-neutral-200 flex flex-col items-center">
                        <Percent className="w-3 h-3 text-emerald-600 mb-0.5" />
                        <span>10% Desc.</span>
                      </div>
                      <div className="bg-white p-1 rounded border border-neutral-200 flex flex-col items-center">
                        <Coffee className="w-3 h-3 text-emerald-600 mb-0.5" />
                        <span>Bebida</span>
                      </div>
                      <div className="bg-white p-1 rounded border border-neutral-200 flex flex-col items-center">
                        <Gamepad2 className="w-3 h-3 text-emerald-600 mb-0.5" />
                        <span>Juegos</span>
                      </div>
                    </div>
                  </div>

                  {/* Datos del Representante y Vigencia */}
                  <div className="w-full text-[9px] text-neutral-600 border-t border-neutral-200 pt-1.5 flex items-center justify-between text-left">
                    <div>
                      <span className="text-neutral-400 block text-[8px]">Representante ({member.parentescoTutor || 'Tutor'})</span>
                      <span className="font-bold text-neutral-800 truncate block max-w-[130px]">{member.tutorNombre}</span>
                      {member.tutorCedula && (
                        <span className="font-mono text-[8px] text-neutral-500 block">C.I. {member.tutorCedula}</span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-neutral-400 block text-[8px]">Vigencia hasta</span>
                      <span className="font-mono font-bold text-neutral-900 block">{member.fechaVencimiento || 'N/D'}</span>
                      <span className="font-mono text-[8px] text-neutral-500 block">Tel: {member.tutorTelefono}</span>
                    </div>
                  </div>
                </div>

                {/* Pie del Carnet con Código de Barras / QR y Validador */}
                <div className="bg-neutral-50 border-t border-neutral-200 px-3 py-1.5 flex items-center justify-between text-[8px] text-neutral-500">
                  <div className="flex items-center gap-1.5">
                    <QrCode className="w-5 h-5 text-neutral-800 shrink-0" />
                    <div className="text-left leading-tight">
                      <span className="font-mono font-bold text-neutral-900 block">{member.codigo}</span>
                      <span className="text-neutral-400">Validador Oficial</span>
                    </div>
                  </div>
                  <div className="text-right font-medium text-neutral-400">
                    Restaurante & Club Infantil
                  </div>
                </div>
              </div>
            </div>

            {/* Aviso de escala visual */}
            <p className="text-[11px] text-neutral-400 mt-2 text-center">
              * La vista previa en pantalla se ajusta a escala legible. La exportación a PDF se genera en las medidas físicas exactas.
            </p>
          </div>

          {/* ========================================================
              COLUMNA DERECHA: MEDIDAS ESTÁNDARES Y OPCIONES DE PDF
              ======================================================== */}
          <div className="lg:col-span-6 space-y-5">
            {/* Explicación de Medidas Estándares Sugeridas (Requerimiento explícito) */}
            <div className="bg-corporate-50 border border-corporate-200 rounded-2xl p-4 text-xs space-y-2">
              <div className="flex items-center gap-2 font-extrabold text-corporate-900 text-sm">
                <Info className="w-4 h-4 text-corporate-700 shrink-0" />
                <span>Medidas Estándares Recomendadas para el Carnet</span>
              </div>
              <p className="text-corporate-950 leading-relaxed">
                Para carnets infantiles en restaurantes y clubes, existen dos formatos físicos estándar universales:
              </p>
              
              <div className="space-y-2 pt-1">
                <div 
                  onClick={() => setCardSize('cr80')}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    cardSize === 'cr80' 
                      ? 'bg-white border-corporate-600 shadow-xs ring-2 ring-corporate-400' 
                      : 'bg-white/70 border-corporate-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-neutral-900">
                    <span>1. Estándar CR80 (54 mm × 85.6 mm) — Recomendado</span>
                    <span className="text-2xs bg-corporate-100 text-corporate-800 px-2 py-0.5 rounded font-mono font-bold">
                      2.13″ × 3.38″
                    </span>
                  </div>
                  <p className="text-2xs text-neutral-600 mt-1">
                    <strong>Medida oficial internacional (ISO/IEC 7810 ID-1)</strong>. Es exactamente el tamaño de una tarjeta de crédito o credencial escolar. Compatible con todas las fundas plásticas para gafete y cintas de cuello (lanyards) del mercado.
                  </p>
                </div>

                <div 
                  onClick={() => setCardSize('gafete')}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    cardSize === 'gafete' 
                      ? 'bg-white border-corporate-600 shadow-xs ring-2 ring-corporate-400' 
                      : 'bg-white/70 border-corporate-200 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-neutral-900">
                    <span>2. Gafete XL para Eventos (70 mm × 100 mm)</span>
                    <span className="text-2xs bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded font-mono font-bold">
                      2.75″ × 3.94″
                    </span>
                  </div>
                  <p className="text-2xs text-neutral-600 mt-1">
                    Formato ampliado ideal para eventos especiales en restaurantes donde se requiere que el nombre y las alergias del niño sean legibles a distancia por los meseros.
                  </p>
                </div>
              </div>
            </div>

            {/* Opciones de Descarga y Exportación a PDF */}
            <div className="space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-neutral-700">
                Selecciona la forma de exportación a PDF:
              </div>

              {/* Opción 1: PDF Carnet Individual CR80 */}
              <button
                type="button"
                onClick={() => handleExportPDF('card')}
                disabled={isExporting}
                className="w-full p-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 active:bg-neutral-950 text-white font-bold text-left flex items-start gap-3.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-white mt-0.5">
                  <Download className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-extrabold flex items-center justify-between">
                    <span>Descargar PDF Carnet Individual (Tamaño Real)</span>
                    <span className="text-2xs font-mono bg-white/20 px-2 py-0.5 rounded text-white">
                      {cardDimensions.widthMm} × {cardDimensions.heightMm} mm
                    </span>
                  </div>
                  <p className="text-xs text-neutral-300 mt-0.5 font-normal leading-snug">
                    Genera un documento PDF con las medidas físicas exactas para imprimir directamente en impresoras de tarjetas de PVC o papel fotográfico.
                  </p>
                </div>
              </button>

              {/* Opción 2: PDF Hoja A4 / Carta con Marcas de Corte */}
              <button
                type="button"
                onClick={() => handleExportPDF('sheet')}
                disabled={isExporting}
                className="w-full p-4 rounded-2xl bg-corporate-600 hover:bg-corporate-700 active:bg-corporate-800 text-white font-bold text-left flex items-start gap-3.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0 text-white mt-0.5">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-extrabold flex items-center justify-between">
                    <span>Descargar Hoja A4 con Guías de Corte (PDF)</span>
                    <span className="text-2xs font-mono bg-white/20 px-2 py-0.5 rounded text-white">
                      Para Impresora Casera / Oficina
                    </span>
                  </div>
                  <p className="text-xs text-corporate-100 mt-0.5 font-normal leading-snug">
                    Centra el carnet en una hoja A4 estándar con líneas de recorte punteadas y ranura de cinta, ideal para plastificar y recortar con tijera o guillotina.
                  </p>
                </div>
              </button>

              {/* Opción 3: Diálogo de Impresión Directa */}
              <button
                type="button"
                onClick={handlePrint}
                className="w-full p-3 rounded-xl bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-neutral-600" />
                <span>Imprimir Directamente con la Impresora del Sistema (Ctrl + P)</span>
              </button>
            </div>

            {/* Feedback de estado */}
            {isExporting && (
              <div className="p-3 bg-corporate-50 border border-corporate-200 text-corporate-900 rounded-xl text-xs flex items-center gap-2 animate-pulse">
                <Sparkles className="w-4 h-4 text-corporate-700 animate-spin" />
                <span>Renderizando carnet vertical en 300 DPI y generando archivo PDF...</span>
              </div>
            )}

            {exportSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>¡PDF descargado con éxito! Revisa tu carpeta de descargas.</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer del Modal */}
        <div className="px-6 py-3.5 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-700">Titular:</span>
            <span>{member.nombreNino} ({member.codigo})</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-800 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
