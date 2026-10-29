/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://gockqlhwszxlocrprmlv.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_IcPdUiji1qGZnLXECECC-Q_j9Vx6qoS';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Faltan las credenciales de Supabase en las variables de entorno.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
