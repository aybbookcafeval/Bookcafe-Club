/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  X, 
  Printer, 
  CheckCircle2, 
  CreditCard, 
  Calendar, 
  Clock, 
  User, 
  ShieldCheck, 
  DollarSign, 
  Coins, 
  FileText,
  Building2,
  Phone,
  Tag
} from 'lucide-react';
import { formatUSD, formatBs, getKidAvatar } from '../mockData.js';

/**
 * Modal de Comprobante / Recibo Detallado de Pago
 * Muestra el desglose completo de una transacción financiera para un socio.
 */
export default function PaymentReceiptModal({ transaction, member, onClose }) {
  if (!transaction || !member) return null;

  const handlePrintReceipt = () => {
    document.body.classList.add('printing-receipt');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-receipt');
    }, 500);
  };

  const isBsMethod = ['Pago Móvil', 'Tarjeta', 'Transferencia'].includes(transaction.metodoPago);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-neutral-200 overflow-hidden animate-in zoom-in-95 duration-200 my-auto flex flex-col max-h-[94vh]">
        
        {/* Encabezado del Modal (Oculto en Impresión Directa) */}
        <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between shrink-0 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-corporate-600 text-white flex items-center justify-center font-bold shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-neutral-900 leading-tight">
                Comprobante Detallado de Pago
              </h3>
              <p className="text-2xs text-neutral-500">
                Auditoría financiera y recepción de caja POS
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

        {/* ÁREA IMPRIMIBLE DEL COMPROBANTE DE PAGO */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs" id="receipt-printable-area">
          
          {/* Header Corporativo del Recibo */}
          <div className="text-center border-b border-dashed border-neutral-300 pb-4 space-y-1">
            <div className="inline-flex items-center gap-1.5 font-black uppercase text-corporate-900 tracking-wider text-xs">
              <Building2 className="w-4 h-4 text-corporate-700" />
              <span>RESTAURANTE FAMILIAR & CLUB INFANTIL VIP</span>
            </div>
            <h2 className="text-lg font-black text-neutral-900 uppercase tracking-tight">
              Recibo Oficial de Caja
            </h2>
            <div className="flex items-center justify-center gap-2 text-2xs font-mono text-neutral-500 pt-0.5">
              <span className="bg-neutral-100 px-2 py-0.5 rounded font-bold text-neutral-800">
                ID: {transaction.id || 'TXN-0000'}
              </span>
              <span>·</span>
              <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded font-bold">
                Factura: {transaction.numeroFactura || 'FAC-0000'}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-neutral-400" />
                {transaction.fecha}
              </span>
              {transaction.hora && (
                <>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-neutral-400" />
                    {transaction.hora}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Badge de Estado del Pago */}
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <div className="font-extrabold text-xs uppercase tracking-wide text-emerald-950">
                  Transacción Aprobada y Confirmada
                </div>
                <div className="text-2xs text-emerald-800">
                  {transaction.cajero || 'Caja Principal Restaurante'}
                </div>
              </div>
            </div>
            <span className="text-2xs font-mono font-bold bg-emerald-200/80 text-emerald-900 px-2.5 py-1 rounded-md uppercase">
              Procesado
            </span>
          </div>

          {/* Datos del Socio e Identificación del Niño */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-3.5 space-y-2">
            <div className="text-2xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
              Información del Socio / Titular
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-neutral-300 bg-white shrink-0 shadow-2xs">
                <img
                  src={getKidAvatar(member)}
                  alt={member.nombreNino}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-extrabold text-sm text-neutral-900 truncate">
                    {member.nombreNino}
                  </h4>
                  <span className="font-mono text-2xs font-bold text-corporate-800 bg-corporate-100 px-2 py-0.5 rounded shrink-0">
                    {member.codigo}
                  </span>
                </div>
                <div className="text-2xs text-neutral-600 mt-0.5">
                  <strong>Representante:</strong> {member.tutorNombre} ({member.parentescoTutor || 'Tutor'})
                  {member.tutorCedula && ` · C.I. ${member.tutorCedula}`}
                </div>
                {member.tutorTelefono && (
                  <div className="text-2xs text-neutral-500 font-mono mt-0.5">
                    Tel: {member.tutorTelefono}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Desglose de Montos y Conversión */}
          <div className="space-y-2 border border-neutral-200 rounded-2xl p-4 bg-white">
            <div className="text-2xs font-bold uppercase tracking-wider text-neutral-500 mb-2">
              Desglose Financiero de la Transacción
            </div>

            <div className="flex justify-between items-center py-1 border-b border-neutral-100">
              <span className="text-neutral-600">Número de Factura Fiscal/POS:</span>
              <span className="font-mono font-black text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                {transaction.numeroFactura || 'FAC-2026-001'}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-neutral-100">
              <span className="text-neutral-600">Concepto de Cobro:</span>
              <span className="font-bold text-neutral-900 text-right">
                {transaction.concepto || 'Membresía VIP 30 Días'}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-neutral-100">
              <span className="text-neutral-600">Monto Base Registrado ($ USD):</span>
              <span className="font-mono font-black text-sm text-neutral-900">
                {formatUSD(transaction.montoUSD || 0)}
              </span>
            </div>

            {transaction.tasaCambio ? (
              <div className="flex justify-between items-center py-1 border-b border-neutral-100 bg-neutral-50 px-2 rounded-lg">
                <span className="text-neutral-600 text-2xs">Tasa de Cambio Oficial Aplicada:</span>
                <span className="font-mono font-bold text-neutral-800 text-2xs">
                  {transaction.tasaCambio.toFixed(2)} Bs. / $ USD
                </span>
              </div>
            ) : null}

            {transaction.montoBs ? (
              <div className="flex justify-between items-center py-1.5 border-b border-neutral-100 bg-emerald-50/60 px-2.5 rounded-xl">
                <span className="text-emerald-900 font-bold">Monto abonado en Bolívares (Bs.):</span>
                <span className="font-mono font-black text-emerald-900 text-sm">
                  {formatBs(transaction.montoBs)}
                </span>
              </div>
            ) : null}

            <div className="flex justify-between items-center py-1 pt-2">
              <span className="text-neutral-600">Forma de Pago Utilizada:</span>
              <span className="font-bold text-corporate-800 bg-corporate-50 px-2.5 py-1 rounded-md border border-corporate-200">
                {transaction.metodoPago}
              </span>
            </div>

            <div className="flex justify-between items-center py-1">
              <span className="text-neutral-600">Nro. de Referencia / Aprobación:</span>
              <span className="font-mono font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                {transaction.referenciaPago || 'N/A (Contado/Efectivo)'}
              </span>
            </div>
          </div>

          {/* Pie de Firma y Nota legal */}
          <div className="text-center text-2xs text-neutral-400 pt-2 space-y-1">
            <p>
              Este comprobante es un recibo oficial de recepción de fondos para el Club Infantil VIP del restaurante.
            </p>
            <p className="font-mono">
              Gracias por preferir nuestro restaurante familiar.
            </p>
          </div>
        </div>

        {/* Acciones de Footer (Oculto al imprimir) */}
        <div className="px-6 py-3.5 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between shrink-0 print:hidden">
          <button
            type="button"
            onClick={handlePrintReceipt}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Recibo (Ctrl + P)</span>
          </button>

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
