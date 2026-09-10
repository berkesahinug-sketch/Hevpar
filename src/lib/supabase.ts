import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

/**
 * Verbindung zu Supabase.
 *
 * Die beiden Werte kommen aus der Datei .env (siehe .env.example) und sind
 * bewusst "oeffentlich": Die Sicherheit haengt nicht an ihnen, sondern an den
 * Zugriffsregeln in der Datenbank (supabase/migrationen/). Der service_role-
 * Schluessel dagegen gehoert NIEMALS in die App und niemals ins Repository.
 *
 * Solange .env fehlt, ist der Client null und die App laeuft im Demo-Modus
 * mit Beispieldaten weiter.
 */
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabase =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          // Kein Browser-Redirect-Login in einer nativen App
          detectSessionInUrl: false,
        },
      })
    : null;
