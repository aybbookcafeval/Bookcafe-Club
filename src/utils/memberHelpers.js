/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Tasa referencial por defecto en Bs. por cada $1 USD y €1 EUR
export const DEFAULT_TASA_DOLAR = 65.0;
export const DEFAULT_TASA_EURO = 70.0;

// Configuración de Membresía oficial base
export const DEFAULT_MEMBERSHIP_CONFIG = [
  {
    id: '1fd3cb06-6dc4-4393-bf5e-da17c60c7523',
    nombre: 'Membresía Oficial Club Infantil',
    codigo: 'VIP-10USD',
    precioAfiliacionUSD: 15.0,
    precioMensualidadUSD: 10.0,
    precioUSD: 10.0,
    duracionDias: 30,
    estado: 'activa',
    moneda: 'USD',
    descripcion: 'Membresía con cuota inicial de afiliación ($15 USD) que cubre los primeros 30 días, y mensualidad de mantenimiento ($10 USD / mes).',
    beneficios: [
      'Acceso libre e ilimitado al Área de Juegos Inflables',
      'Helado o postre infantil de cortesía en cada consumo familiar',
      'Carnet Oficial Vertical con foto de perfil',
      '10% de descuento en reserva de Fiestas y Cumpleaños',
      'Atención preferencial y asignación de mesa en restaurante'
    ]
  }
];

// Galería de fotos predeterminadas para carnet cuando el afiliado no adjunta foto personalizada
export const PRESET_AVATARS = [
  { 
    id: 'kid-1', 
    nombre: 'Mateo', 
    url: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?auto=format&fit=crop&w=400&q=80' 
  },
  { 
    id: 'kid-2', 
    nombre: 'Sofía', 
    url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80' 
  },
  { 
    id: 'kid-3', 
    nombre: 'Lucas', 
    url: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?auto=format&fit=crop&w=400&q=80' 
  },
  { 
    id: 'kid-4', 
    nombre: 'Valentina', 
    url: 'https://images.unsplash.com/photo-1595454223600-91fb571348ec?auto=format&fit=crop&w=400&q=80' 
  },
  { 
    id: 'kid-5', 
    nombre: 'Emma', 
    url: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?auto=format&fit=crop&w=400&q=80' 
  },
  { 
    id: 'kid-6', 
    nombre: 'Emiliano', 
    url: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=400&q=80' 
  },
  { 
    id: 'kid-7', 
    nombre: 'Joaquín', 
    url: 'https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?auto=format&fit=crop&w=400&q=80' 
  },
  { 
    id: 'kid-8', 
    nombre: 'Camila', 
    url: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=400&q=80' 
  }
];

/**
 * Obtiene la foto de perfil o una foto por defecto según índice
 */
export const getKidAvatar = (afiliado, fallbackIndex = 0) => {
  if (afiliado && afiliado.fotoPerfil && afiliado.fotoPerfil.trim() !== '') {
    return afiliado.fotoPerfil;
  }
  const idx = Math.abs(fallbackIndex) % PRESET_AVATARS.length;
  return PRESET_AVATARS[idx].url;
};

/**
 * Formatea cantidades en Dólares Americanos ($ USD)
 */
export const formatUSD = (monto) => {
  const num = Number(monto) || 0;
  return `$ ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
};

/**
 * Formatea cantidades en Bolívares (Bs.)
 */
export const formatBs = (monto) => {
  const num = Number(monto) || 0;
  return `Bs. ${num.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Convierte un monto en USD a Bolívares dada una tasa
 */
export const convertUSDtoBs = (montoUSD, tasa) => {
  const usd = Number(montoUSD) || 0;
  const t = Number(tasa) || DEFAULT_TASA_DOLAR;
  return usd * t;
};

/**
 * Calcula si el cumpleaños del niño cae en el mes calendario actual.
 */
export const isBirthdayThisMonth = (fechaNacimientoStr) => {
  if (!fechaNacimientoStr) return false;
  try {
    const parts = fechaNacimientoStr.split('-');
    if (parts.length >= 2) {
      const birthMonth = parseInt(parts[1], 10) - 1; // 0-indexed
      const currentMonth = new Date().getMonth();
      return birthMonth === currentMonth;
    }
  } catch {
    return false;
  }
  return false;
};

/**
 * Calcula la edad a partir de la fecha de nacimiento.
 */
export const calculateAge = (fechaNacimientoStr) => {
  if (!fechaNacimientoStr) return null;
  try {
    const birth = new Date(fechaNacimientoStr);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  } catch {
    return null;
  }
};

/**
 * Verifica si la membresía está activa y vigente a fecha de hoy.
 */
export const checkIsActiveAndValid = (afiliado) => {
  if (!afiliado || afiliado.estado !== 'activa') return false;
  if (!afiliado.fechaVencimiento) return false;

  const todayMidnight = new Date();
  todayMidnight.setHours(0, 0, 0, 0);

  const expiration = new Date(afiliado.fechaVencimiento + 'T23:59:59');
  return expiration >= todayMidnight;
};
