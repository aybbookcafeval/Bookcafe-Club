/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  calculateAge, 
  isBirthdayThisMonth, 
  checkIsActiveAndValid, 
  getKidAvatar 
} from '../mockData.js';

/**
 * Pre-carga una imagen de forma asíncrona garantizando crossOrigin="anonymous".
 * Si la imagen remota falla por CORS o red, resuelve null de forma segura
 * para evitar manchar (taint) el canvas o arrojar errores no capturados.
 */
const preloadImageSafely = (src) => {
  return new Promise((resolve) => {
    if (!src || typeof src !== 'string') {
      resolve(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    const timer = setTimeout(() => {
      resolve(null); // Timeout de seguridad si el host no responde
    }, 4000);

    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };

    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };

    img.src = src;
  });
};

/**
 * Dibuja un rectángulo redondeado con soporte para diferentes radios
 */
function roundRect(ctx, x, y, width, height, radius) {
  const r = typeof radius === 'number' 
    ? { tl: radius, tr: radius, br: radius, bl: radius }
    : { tl: radius.tl || 0, tr: radius.tr || 0, br: radius.br || 0, bl: radius.bl || 0 };

  ctx.beginPath();
  ctx.moveTo(x + r.tl, y);
  ctx.lineTo(x + width - r.tr, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r.tr);
  ctx.lineTo(x + width, y + height - r.br);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r.br, y + height);
  ctx.lineTo(x + r.bl, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r.bl);
  ctx.lineTo(x, y + r.tl);
  ctx.quadraticCurveTo(x, y, x + r.tl, y);
  ctx.closePath();
}

/**
 * Obtiene las iniciales del nombre de un niño
 */
function getInitials(name) {
  if (!name) return 'KI';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Genera el carnet oficial de socio en un Canvas de alta resolución (300 DPI)
 * y devuelve el DataURL en formato PNG.
 * 
 * Este generador nativo 2D elimina por completo los errores de html2canvas:
 * 1. Tainted Canvas / DOMException: las imágenes remotas se cargan con crossOrigin o fallback local
 * 2. Incompatibilidad de colores CSS (oklch)
 * 3. Fallas en sandboxes de iframes
 * 
 * @param {Object} member - Datos del afiliado
 * @param {Object} dimensions - { widthMm: 54, heightMm: 85.6 }
 * @returns {Promise<string>} dataURL de la imagen PNG
 */
export async function generateCarnetDataUrl(member, dimensions = { widthMm: 54, heightMm: 85.6 }) {
  const widthPx = 1080;
  const ratio = (dimensions.heightMm || 85.6) / (dimensions.widthMm || 54);
  const heightPx = Math.round(widthPx * ratio); // 1712 px para CR80

  const canvas = document.createElement('canvas');
  canvas.width = widthPx;
  canvas.height = heightPx;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No se pudo inicializar el contexto 2D del Canvas');
  }

  const isActive = checkIsActiveAndValid(member);
  const isPending = member.estado === 'pendiente';
  const isExpired = member.estado === 'vencida' || (!isActive && !isPending);
  const age = calculateAge(member.fechaNacimiento);
  const isBirthday = isBirthdayThisMonth(member.fechaNacimiento);
  const avatarUrl = getKidAvatar(member);

  // 1. Fondo blanco de la tarjeta con esquinas redondeadas
  const cardRadius = 40;
  ctx.save();
  roundRect(ctx, 0, 0, widthPx, heightPx, cardRadius);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.clip(); // Limitar todo el contenido dentro de las esquinas de la tarjeta

  // 2. Encabezado Corporativo (Azul institucional)
  const headerHeight = Math.round(heightPx * 0.14); // ~240px
  const headerGrad = ctx.createLinearGradient(0, 0, 0, headerHeight);
  headerGrad.addColorStop(0, '#1e3a8a');
  headerGrad.addColorStop(1, '#172554');
  ctx.fillStyle = headerGrad;
  ctx.fillRect(0, 0, widthPx, headerHeight);

  // Círculos decorativos en el header
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.beginPath();
  ctx.arc(widthPx - 30, headerHeight + 10, 100, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(40, -20, 80, 0, Math.PI * 2);
  ctx.fill();

  // Texto del encabezado
  ctx.textAlign = 'center';
  ctx.fillStyle = '#93c5fd';
  ctx.font = 'bold 22px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
  ctx.fillText('★ CLUB INFANTIL VIP ★', widthPx / 2, 75);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 32px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
  ctx.fillText('CREDENCIAL OFICIAL DE SOCIO', widthPx / 2, 120);

  ctx.fillStyle = '#bfdbfe';
  ctx.font = 'bold 18px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
  ctx.fillText('RESTAURANTE FAMILIAR & ÁREA DE JUEGOS', widthPx / 2, 155);

  // 3. Ranura superior simulada para cordón / lanyard
  const slotW = 160;
  const slotH = 26;
  const slotX = (widthPx - slotW) / 2;
  const slotY = 20;
  roundRect(ctx, slotX, slotY, slotW, slotH, 13);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 4. Foto de perfil del niño
  const photoSize = 270;
  const photoX = (widthPx - photoSize) / 2;
  const photoY = headerHeight + 30;
  const photoRadius = 32;

  // Cargar imagen de forma segura
  const loadedImg = await preloadImageSafely(avatarUrl);

  // Sombra del marco de la foto
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  roundRect(ctx, photoX, photoY, photoSize, photoSize, photoRadius);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();

  // Dibujar imagen o avatar alternativo
  ctx.save();
  roundRect(ctx, photoX, photoY, photoSize, photoSize, photoRadius);
  ctx.clip();

  if (loadedImg) {
    try {
      ctx.drawImage(loadedImg, photoX, photoY, photoSize, photoSize);
    } catch {
      // Si la llamada a drawImage falla inesperadamente, pintar fallback
      drawFallbackAvatar(ctx, photoX, photoY, photoSize, member.nombreNino);
    }
  } else {
    drawFallbackAvatar(ctx, photoX, photoY, photoSize, member.nombreNino);
  }
  ctx.restore();

  // Borde exterior azul corporativo para la foto
  roundRect(ctx, photoX, photoY, photoSize, photoSize, photoRadius);
  ctx.strokeStyle = '#2563eb';
  ctx.lineWidth = 7;
  ctx.stroke();

  // 5. Badge de estado superpuesto en la base de la foto
  const statusPillW = 200;
  const statusPillH = 44;
  const statusPillX = (widthPx - statusPillW) / 2;
  const statusPillY = photoY + photoSize - 22;

  roundRect(ctx, statusPillX, statusPillY, statusPillW, statusPillH, 22);
  let statusColor = '#059669'; // Activo verde
  let statusText = '● ACTIVO';
  if (isPending) {
    statusColor = '#d97706'; // Pendiente ámbar
    statusText = '▲ PENDIENTE';
  } else if (isExpired) {
    statusColor = '#e11d48'; // Vencido rojo
    statusText = '✕ VENCIDO';
  }

  ctx.fillStyle = statusColor;
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 18px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(statusText, widthPx / 2, statusPillY + 28);

  // 6. Nombre del Niño y Código
  const nameY = statusPillY + 68;
  ctx.fillStyle = '#0f172a';
  const nameLen = (member.nombreNino || '').length;
  ctx.font = nameLen > 20 
    ? '900 38px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif'
    : '900 44px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
  ctx.fillText(member.nombreNino || 'Socio Infantil', widthPx / 2, nameY);

  // Edad y Código de Socio
  const subY = nameY + 38;
  const ageStr = age !== null ? `${age} años` : 'Edad N/D';
  
  ctx.font = 'bold 22px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText(`${ageStr}   ·   Código: `, widthPx / 2 - 40, subY);

  ctx.fillStyle = '#1e3a8a';
  ctx.font = '900 24px monospace';
  ctx.fillText(member.codigo, widthPx / 2 + 75, subY);

  let currentY = subY + 30;

  // 7. Alerta de Cumpleañero del Mes (si aplica)
  if (isBirthday) {
    const alertW = widthPx - 140;
    const alertH = 50;
    const alertX = 70;
    roundRect(ctx, alertX, currentY, alertW, alertH, 14);
    ctx.fillStyle = '#fef3c7';
    ctx.fill();
    ctx.strokeStyle = '#fcd34d';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#92400e';
    ctx.font = 'bold 20px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎂  ¡Cumpleañero del Mes! Postre Infantil de Cortesía', widthPx / 2, currentY + 32);

    currentY += 62;
  }

  // 8. Alergias / Condición médica
  const hasAllergy = member.alergias && 
    member.alergias.trim() !== '' && 
    member.alergias.toLowerCase() !== 'ninguna';

  const allergyW = widthPx - 140;
  const allergyH = 48;
  const allergyX = 70;

  if (hasAllergy) {
    roundRect(ctx, allergyX, currentY, allergyW, allergyH, 14);
    ctx.fillStyle = '#ffe4e6';
    ctx.fill();
    ctx.strokeStyle = '#fda4af';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#9f1239';
    ctx.font = 'bold 19px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    const textAllergy = `⚠️  Alergia: ${member.alergias}`;
    ctx.fillText(textAllergy.length > 55 ? textAllergy.substring(0, 52) + '...' : textAllergy, widthPx / 2, currentY + 30);
  } else {
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 18px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Sin restricciones alimentarias conocidas', widthPx / 2, currentY + 28);
  }

  currentY += 60;

  // 9. Bloque de Beneficios VIP en Restaurante
  const benW = widthPx - 140;
  const benH = 170;
  const benX = 70;

  roundRect(ctx, benX, currentY, benW, benH, 20);
  ctx.fillStyle = '#f8fafc';
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Título de beneficios
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 17px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('BENEFICIOS VIP EN COMANDA (MOSTRAR AL MESERO):', benX + 24, currentY + 32);

  // 3 Mini-cajas de beneficios
  const colW = (benW - 48 - 24) / 3;
  const colH = 92;
  const colY = currentY + 52;

  const benefits = [
    { title: '10% DESC.', sub: 'Consumo familiar' },
    { title: 'BEBIDA GRATIS', sub: 'En menú infantil' },
    { title: 'ÁREA DE JUEGOS', sub: 'Acceso ilimitado' }
  ];

  benefits.forEach((b, i) => {
    const colX = benX + 24 + i * (colW + 12);
    roundRect(ctx, colX, colY, colW, colH, 14);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#059669';
    ctx.font = '900 19px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
    ctx.fillText(b.title, colX + colW / 2, colY + 38);

    ctx.fillStyle = '#64748b';
    ctx.font = '500 15px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
    ctx.fillText(b.sub, colX + colW / 2, colY + 66);
  });

  currentY += benH + 25;

  // 10. Datos del Representante y Vigencia
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(benX, currentY);
  ctx.lineTo(benX + benW, currentY);
  ctx.stroke();

  currentY += 24;

  // Columna izquierda: Representante
  ctx.textAlign = 'left';
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 15px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
  ctx.fillText(`REPRESENTANTE (${(member.parentescoTutor || 'Tutor').toUpperCase()}):`, benX, currentY);

  ctx.fillStyle = '#1e293b';
  ctx.font = '900 22px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
  const tutorText = member.tutorNombre || 'No especificado';
  ctx.fillText(tutorText.length > 28 ? tutorText.substring(0, 26) + '...' : tutorText, benX, currentY + 28);

  if (member.tutorCedula) {
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 17px monospace';
    ctx.fillText(`C.I. ${member.tutorCedula}`, benX, currentY + 54);
  }

  // Columna derecha: Vigencia
  ctx.textAlign = 'right';
  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 15px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
  ctx.fillText('VIGENCIA HASTA:', benX + benW, currentY);

  ctx.fillStyle = '#0f172a';
  ctx.font = '900 24px monospace';
  ctx.fillText(member.fechaVencimiento || 'N/D', benX + benW, currentY + 28);

  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 16px monospace';
  ctx.fillText(`Tel: ${member.tutorTelefono || 'N/D'}`, benX + benW, currentY + 54);

  // 11. Pie de Validación Exclusiva con Código (Sin QR)
  const footerH = Math.round(heightPx * 0.125); // ~214px
  const footerY = heightPx - footerH;

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, footerY, widthPx, footerH);

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, footerY);
  ctx.lineTo(widthPx, footerY);
  ctx.stroke();

  // Lado izquierdo del pie: Código destacado para el restaurante
  ctx.textAlign = 'left';
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 17px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
  ctx.fillText('CÓDIGO PARA VALIDAR EN MESA:', 70, footerY + 45);

  ctx.fillStyle = '#1e3a8a';
  ctx.font = '900 48px monospace';
  ctx.fillText(member.codigo, 70, footerY + 105);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 15px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
  ctx.fillText('Indicar este código al mesero al ordenar', 70, footerY + 138);

  // Lado derecho del pie: Badge de Club Infantil Oficial
  const brandPillW = 210;
  const brandPillH = 46;
  const brandPillX = widthPx - 70 - brandPillW;
  const brandPillY = footerY + 40;

  roundRect(ctx, brandPillX, brandPillY, brandPillW, brandPillH, 12);
  ctx.fillStyle = '#eff6ff';
  ctx.fill();
  ctx.strokeStyle = '#bfdbfe';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#1e40af';
  ctx.font = '900 18px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
  ctx.fillText('CLUB INFANTIL', brandPillX + brandPillW / 2, brandPillY + 29);

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 15px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
  ctx.fillText('Restaurante Oficial', brandPillX + brandPillW / 2, brandPillY + 68);

  // 12. Borde exterior elegante de la tarjeta completa
  ctx.restore(); // Deshacer el clip
  roundRect(ctx, 1, 1, widthPx - 2, heightPx - 2, cardRadius);
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Exportar DataURL con máxima fidelidad
  return canvas.toDataURL('image/png', 1.0);
}

/**
 * Dibuja un avatar vectorial limpio con las iniciales si la imagen remota no está disponible
 */
function drawFallbackAvatar(ctx, x, y, size, name) {
  const grad = ctx.createLinearGradient(x, y, x + size, y + size);
  grad.addColorStop(0, '#3b82f6');
  grad.addColorStop(1, '#1d4ed8');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, size, size);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 85px "Plus Jakarta Sans", system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(getInitials(name), x + size / 2, y + size / 2);
  ctx.textBaseline = 'alphabetic'; // Restaurar base
}

/**
 * Descarga un Blob directamente en el navegador sin bloquear el hilo ni usar popups
 */
export function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1500);
}
