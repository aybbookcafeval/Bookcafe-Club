/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Helper para calcular fechas dinámicas relativas al día actual
const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
const currentDay = String(Math.min(now.getDate(), 28)).padStart(2, '0');

// Formato YYYY-MM-DD
const formatDateIso = (d) => d.toISOString().split('T')[0];

const addDays = (d, days) => {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
};

// Fechas calculadas para asegurar casos de prueba consistentes en cualquier momento
const today = new Date();
const hace15Dias = addDays(today, -15);
const en15Dias = addDays(today, 15);
const hace45Dias = addDays(today, -45);
const hace10Dias = addDays(today, -10);
const hace5Dias = addDays(today, -5);

export const DEFAULT_TASA_DOLAR = 65.0; // Tasa referencial por defecto en Bs. por cada $1 USD
export const TASA_STORAGE_KEY = 'club_infantil_tasa_dolar';

// Configuración de Membresías predeterminada (1 membresía activa con valor de $10 USD)
export const DEFAULT_MEMBERSHIP_CONFIG = [
  {
    id: 'mem-vip-10',
    nombre: 'Membresía Oficial Club Infantil',
    codigo: 'VIP-10USD',
    precioUSD: 10.0,
    duracionDias: 30,
    estado: 'activa',
    moneda: 'USD',
    descripcion: 'Membresía estándar de $10 USD mensuales para niños socios del club con beneficios en restaurante y zona recreativa.',
    beneficios: [
      'Acceso libre e ilimitado al Área de Juegos Inflables',
      'Helado o postre infantil de cortesía en cada consumo familiar',
      'Carnet Oficial Vertical con foto de perfil',
      '10% de descuento en reserva de Fiestas y Cumpleaños',
      'Atención preferencial y asignación de mesa en restaurante'
    ]
  }
];

export const MEMBERSHIP_STORAGE_KEY = 'club_infantil_memberships';

export const getMembershipsFromStorage = () => {
  try {
    const data = localStorage.getItem(MEMBERSHIP_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error al leer membresías de localStorage:', e);
  }
  return DEFAULT_MEMBERSHIP_CONFIG;
};

export const saveMembershipsToStorage = (memberships) => {
  try {
    localStorage.setItem(MEMBERSHIP_STORAGE_KEY, JSON.stringify(memberships));
  } catch (e) {
    console.error('Error al guardar membresías en localStorage:', e);
  }
};

// Galería de fotos y avatares predeterminados para niños del Club Infantil
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

export const INITIAL_AFILIADOS = [];

export const STORAGE_KEY = 'club_infantil_afiliados';

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
 * Obtiene los afiliados de localStorage como caché sin inyectar datos falsos.
 */
export const getAfiliadosFromStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed;
  } catch (error) {
    console.error('Error al leer de localStorage:', error);
    return [];
  }
};

/**
 * Guarda los afiliados en localStorage.
 */
export const saveAfiliadosToStorage = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error al guardar en localStorage:', error);
  }
};

/**
 * Obtiene la tasa de cambio del dólar guardada o usa la por defecto (65.00)
 */
export const getTasaDolarFromStorage = () => {
  try {
    const raw = localStorage.getItem(TASA_STORAGE_KEY);
    if (!raw) return DEFAULT_TASA_DOLAR;
    const num = parseFloat(raw);
    return !isNaN(num) && num > 0 ? num : DEFAULT_TASA_DOLAR;
  } catch {
    return DEFAULT_TASA_DOLAR;
  }
};

/**
 * Guarda la tasa de cambio del dólar en localStorage para recordarla entre pagos
 */
export const saveTasaDolarToStorage = (tasa) => {
  try {
    localStorage.setItem(TASA_STORAGE_KEY, String(tasa));
  } catch (error) {
    console.error('Error al guardar tasa en localStorage:', error);
  }
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

/**
 * Genera un nuevo registro dummy para simular el Webhook de n8n con foto de perfil.
 */
export const generateWebhookDummy = (existingCount = 0) => {
  const nextNum = 107 + existingCount;
  const dummyKids = [
    { nino: 'Thiago Méndez', tutor: 'Elena Méndez', cedula: 'V-19.450.123', parentesco: 'Madre', tel: '5578129034', foto: 'https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?auto=format&fit=crop&w=400&q=80' },
    { nino: 'Mia Salgado', tutor: 'Fernando Salgado', cedula: 'V-15.321.990', parentesco: 'Padre', tel: '5589342156', foto: 'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=400&q=80' },
    { nino: 'Joaquín Ortega', tutor: 'Gabriela Ortega', cedula: 'V-22.180.445', parentesco: 'Tía', tel: '5561239845', foto: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=400&q=80' },
    { nino: 'Renata Domínguez', tutor: 'Esteban Domínguez', cedula: 'V-25.040.812', parentesco: 'Hermano', tel: '5544778811', foto: 'https://images.unsplash.com/photo-1595454223600-91fb571348ec?auto=format&fit=crop&w=400&q=80' }
  ];

  const pick = dummyKids[Math.floor(Math.random() * dummyKids.length)];
  const today = new Date();
  const fechaInicio = formatDateIso(today);
  const fechaVencimiento = formatDateIso(addDays(today, 30));

  return {
    id: 'bk-' + Date.now().toString(36),
    codigo: `BK-${nextNum.toString().padStart(5, '0')}`,
    nombreNino: pick.nino,
    fotoPerfil: pick.foto,
    fechaNacimiento: `${currentYear - Math.floor(Math.random() * 6 + 4)}-${String(Math.floor(Math.random() * 12 + 1)).padStart(2, '0')}-15`,
    tutorNombre: pick.tutor,
    tutorCedula: pick.cedula,
    parentescoTutor: pick.parentesco,
    tutorTelefono: pick.tel,
    estado: 'pendiente',
    fechaInicio,
    fechaVencimiento,
    montoPagado: 0.0,
    metodoPago: '',
    referenciaPago: '',
    tasaCambio: null,
    montoBs: 0.0
  };
};
