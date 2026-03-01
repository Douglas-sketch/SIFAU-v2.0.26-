import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppProvider, useApp } from './context/AppContext';
import CidadaoModule from './components/Cidadao';
import FiscalModule from './components/Fiscal';
import GerenteModule from './components/Gerente';
import Settings, { AppTheme, applyTheme, applyAccessibility, loadSettings } from './components/Settings';
import { Lock, ArrowLeft, AlertCircle, Wifi, WifiOff, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { diagnosticLog } from './lib/supabase';
import * as supa from './lib/supabaseService';

const THEME_GRADIENTS: Record<AppTheme, string> = {
  default: 'from-blue-800 via-blue-900 to-slate-900',
  dark: 'from-gray-800 via-gray-900 to-black',
};

function LoginScreen({ onBack, onSuccess, theme }: { onBack: () => void; onSuccess: () => void; theme: AppTheme }) {
  const { login, isOnline } = useApp();
  const [matricula, setMatricula] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDiag, setShowDiag] = useState(false);
  const [diagLogs, setDiagLogs] = useState<string[]>([...diagnosticLog]);
  const [retrying, setRetrying] = useState(false);

  // Update diagnostic logs periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setDiagLogs([...diagnosticLog]);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRetry = async () => {
    setRetrying(true);
    setDiagLogs([...diagnosticLog]);
    try {
      const ok = await supa.checkConnection();
      setDiagLogs([...diagnosticLog]);
      if (ok) {
        window.location.reload();
      }
    } catch { /* */ }
    setRetrying(false);
  };

  const handleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const user = await login(matricula, senha);
      if (user) {
        onSuccess();
      } else {
        setError('Matrícula ou senha inválida');
      }
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className={`min-h-screen bg-gradient-to-br ${THEME_GRADIENTS[theme]} flex flex-col`}
    >
      <div className="p-4 lg:p-6">
        <button onClick={onBack} className="text-white/70 flex items-center gap-1 text-sm hover:text-white transition">
          <ArrowLeft size={18} /> Voltar
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm md:max-w-md lg:max-w-lg">
          <div className="text-center mb-8">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock size={32} className="text-white md:hidden" />
              <Lock size={40} className="text-white hidden md:block" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">Área do Servidor</h1>
            <p className="text-blue-300 text-sm md:text-base mt-1">SIFAU - Acesso Restrito</p>
            
            {/* Connection Status */}
            <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                isOnline 
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                  : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
              }`}>
                {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
                {isOnline ? 'Conectado ao Servidor' : 'Modo Offline (Local)'}
              </div>
              
              {!isOnline && (
                <button
                  onClick={handleRetry}
                  disabled={retrying}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 transition"
                >
                  <RefreshCw size={12} className={retrying ? 'animate-spin' : ''} />
                  {retrying ? 'Tentando...' : 'Reconectar'}
                </button>
              )}
            </div>

            {/* Diagnostic Panel Toggle */}
            <button
              onClick={() => setShowDiag(!showDiag)}
              className="mt-2 inline-flex items-center gap-1 text-[10px] text-white/40 hover:text-white/70 transition"
            >
              {showDiag ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
              {showDiag ? 'Ocultar diagnóstico' : 'Ver diagnóstico de conexão'}
            </button>

            {/* Diagnostic Panel */}
            {showDiag && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-2 bg-black/40 border border-white/10 rounded-lg p-3 text-left max-h-48 overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Log de Conexão</p>
                  <button
                    onClick={handleRetry}
                    disabled={retrying}
                    className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <RefreshCw size={10} className={retrying ? 'animate-spin' : ''} />
                    Testar
                  </button>
                </div>
                {diagLogs.length === 0 ? (
                  <p className="text-[10px] text-white/30 italic">Nenhum log ainda...</p>
                ) : (
                  <div className="space-y-0.5">
                    {diagLogs.map((log, i) => (
                      <p key={i} className={`text-[10px] font-mono ${
                        log.includes('✅') ? 'text-green-400' :
                        log.includes('❌') ? 'text-red-400' :
                        log.includes('⚠️') ? 'text-yellow-400' :
                        log.includes('🔍') ? 'text-blue-400' :
                        'text-white/60'
                      }`}>
                        {log}
                      </p>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          <div className="space-y-4 md:space-y-5">
            <div>
              <label className="text-sm md:text-base text-blue-200 mb-1 block">Matrícula</label>
              <input
                value={matricula}
                onChange={e => setMatricula(e.target.value)}
                placeholder="Ex: FSC-001"
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 md:py-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400 md:text-lg"
              />
            </div>
            <div>
              <label className="text-sm md:text-base text-blue-200 mb-1 block">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="••••••"np
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 md:py-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400 md:text-lg"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/20 border border-red-400/30 rounded-xl p-3 flex items-center gap-2 text-red-200 text-sm"
              >
                <AlertCircle size={16} /> {error}
              </motion.div>
            )}

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:opacity-60 text-white rounded-xl py-3 md:py-4 font-semibold transition mt-2 md:text-lg"
            >
              {loading ? 'Conectando...' : 'Entrar'}
            </button>
          </div>

          {/* Info: O login funciona mesmo offline */}
          {!isOnline && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 bg-blue-500/10 border border-blue-400/20 rounded-xl p-3 text-blue-200 text-xs"
            >
              <p className="font-semibold mb-1">ℹ️ Login funciona em modo offline!</p>
              <p className="text-blue-300/80">Use sua matrícula e senha normalmente. Os dados serão salvos localmente e sincronizados quando a conexão voltar.</p>
            </motion.div>
          )}

          <div className="mt-8 bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-xs md:text-sm text-blue-300 font-semibold mb-3">Acesse com sua matrícula e senha:</p>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] md:text-xs text-blue-300/60 uppercase font-semibold tracking-wider mb-1">👔 Gerentes</p>
                <div className="space-y-0.5 text-xs md:text-sm text-blue-200/80">
                  <p>Marconi: <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded">GER-001</span> / <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded">marconi2026</span></p>
                  <p>João Lacerda: <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded">GER-002</span> / <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded">lacerda2026</span></p>
                </div>
              </div>
              <div>
                <p className="text-[10px] md:text-xs text-blue-300/60 uppercase font-semibold tracking-wider mb-1">👷 Fiscais</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-0.5 text-xs md:text-sm text-blue-200/80">
                  <p>Marie: <span className="font-mono bg-white/10 px-1 rounded">FSC-001</span> / <span className="font-mono bg-white/10 px-1 rounded">marie2026</span></p>
                  <p>Balbino: <span className="font-mono bg-white/10 px-1 rounded">FSC-002</span> / <span className="font-mono bg-white/10 px-1 rounded">balbino2026</span></p>
                  <p>Demétrius: <span className="font-mono bg-white/10 px-1 rounded">FSC-003</span> / <span className="font-mono bg-white/10 px-1 rounded">demetrius2026</span></p>
                  <p>Kamila: <span className="font-mono bg-white/10 px-1 rounded">FSC-004</span> / <span className="font-mono bg-white/10 px-1 rounded">kamila2026</span></p>
                  <p>Evanisio: <span className="font-mono bg-white/10 px-1 rounded">FSC-005</span> / <span className="font-mono bg-white/10 px-1 rounded">evanisio2026</span></p>
                  <p>Iris: <span className="font-mono bg-white/10 px-1 rounded">FSC-006</span> / <span className="font-mono bg-white/10 px-1 rounded">iris2026</span></p>
                  <p>Paulo Karas: <span className="font-mono bg-white/10 px-1 rounded">FSC-007</span> / <span className="font-mono bg-white/10 px-1 rounded">paulo2026</span></p>
                  <p>Adriana: <span className="font-mono bg-white/10 px-1 rounded">FSC-008</span> / <span className="font-mono bg-white/10 px-1 rounded">adriana2026</span></p>
                  <p>André: <span className="font-mono bg-white/10 px-1 rounded">FSC-009</span> / <span className="font-mono bg-white/10 px-1 rounded">andre2026</span></p>
                  <p>Rebeca: <span className="font-mono bg-white/10 px-1 rounded">FSC-010</span> / <span className="font-mono bg-white/10 px-1 rounded">rebeca2026</span></p>
                  <p>Gissieri: <span className="font-mono bg-white/10 px-1 rounded">FSC-011</span> / <span className="font-mono bg-white/10 px-1 rounded">gissieri2026</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function AppContent() {
  const { currentUser, logout } = useApp();
  const [showLogin, setShowLogin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [theme, setTheme] = useState<AppTheme>(() => {
    const saved = localStorage.getItem('sifau_theme');
    return (saved as AppTheme) || 'default';
  });

  useEffect(() => {
    const settings = loadSettings();
    applyTheme(settings.theme || theme);
    applyAccessibility(settings);
    if (settings.theme) setTheme(settings.theme);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem('sifau_theme', theme);
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (!currentUser && showLogin) {
      // Keep showing login screen
    } else if (!currentUser && !showLogin) {
      // We're on home screen, nothing to do
    }
  }, [currentUser, showLogin]);

  if (showSettings) {
    return (
      <AnimatePresence mode="wait">
        <Settings
          key="settings"
          onBack={() => setShowSettings(false)}
          currentTheme={theme}
          onThemeChange={setTheme}
        />
      </AnimatePresence>
    );
  }

  if (showLogin && !currentUser) {
    return (
      <AnimatePresence mode="wait">
        <LoginScreen
          key="login"
          onBack={() => setShowLogin(false)}
          onSuccess={() => setShowLogin(false)}
          theme={theme}
        />
      </AnimatePresence>
    );
  }

  if (currentUser?.tipo === 'fiscal') {
    return (
      <AnimatePresence mode="wait">
        <motion.div key="fiscal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <FiscalModule
            onLogout={() => { logout(); setShowLogin(false); }}
            onOpenSettings={() => setShowSettings(true)}
            theme={theme}
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  if (currentUser?.tipo === 'gerente') {
    return (
      <AnimatePresence mode="wait">
        <motion.div key="gerente" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <GerenteModule
            onLogout={() => { logout(); setShowLogin(false); }}
            onOpenSettings={() => setShowSettings(true)}
            theme={theme}
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div key="cidadao" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        <CidadaoModule
          onLogin={() => setShowLogin(true)}
          onOpenSettings={() => setShowSettings(true)}
          theme={theme}
        />
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <AppContent />
      </div>
    </AppProvider>
  );
}
