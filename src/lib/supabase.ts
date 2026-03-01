import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cyuokqtbwydfymfffaqw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5dW9rcXRid3lkZnltZmZmYXF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzMjMyODAsImV4cCI6MjA4Nzg5OTI4MH0.tJx9Zi0CfDfkRTEhSpYpeSCKxg0LNUodrckiC5_F7z0';

let supabase: SupabaseClient | null = null;
// Store diagnostic info for display
export const diagnosticLog: string[] = [];

function addLog(msg: string) {
  const time = new Date().toLocaleTimeString('pt-BR');
  diagnosticLog.push(`[${time}] ${msg}`);
  console.log(msg);
  // Keep only last 20 entries
  if (diagnosticLog.length > 20) diagnosticLog.shift();
}

try {
  supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    realtime: {
      params: { eventsPerSecond: 10 }
    },
  });
  addLog('✅ Cliente Supabase criado');
} catch (e: any) {
  addLog(`❌ Erro ao criar cliente: ${e?.message || e}`);
  supabase = null;
}

export { supabase, addLog };
