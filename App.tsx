
import React, { useState, useEffect, useMemo } from 'react';
import { AppView, WorkLog, Mechanic } from './types';
import { CameraScanner } from './components/CameraScanner';
import { LayoutDashboard, History as HistoryIcon, Camera, Settings, Play, Pause, Square, Trash2, Clock, Car, ChevronDown, Keyboard, Plus, X, Maximize2 } from 'lucide-react';

const MECHANICS_LIST = [
  "Dario Inacio",
  "Fernando Felizardo",
  "Ricardo Silva",
  "Francisco Belela",
  "Raul Costan",
  "João Sbras",
  "Sergio Palma",
  "Mario Alves"
];

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('dashboard');
  const [mechanic, setMechanic] = useState<Mechanic | null>(null);
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualPlate, setManualPlate] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Initialize data from LocalStorage
  useEffect(() => {
    const savedLogs = localStorage.getItem('logs');
    if (savedLogs) setLogs(JSON.parse(savedLogs));
  }, []);

  // Save logs to LocalStorage whenever they change
  useEffect(() => {
    localStorage.setItem('logs', JSON.stringify(logs));
  }, [logs]);

  const handlePlateDetected = (plate: string, photoUrl?: string) => {
    setShowScanner(false);
    setShowManualInput(false);
    setManualPlate('');
    
    const cleanPlate = plate.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
    
    const existingActive = logs.find(l => l.plate === cleanPlate && l.status !== 'completed');
    if (existingActive) {
      alert("Este veículo já tem um trabalho ativo!");
      return;
    }

    const newLog: WorkLog = {
      id: Date.now().toString(),
      plate: cleanPlate,
      startTime: Date.now(),
      pausedTime: 0,
      status: 'active',
      mechanicId: mechanic?.id || 'default',
      photoUrl
    };

    setLogs([newLog, ...logs]);
    setView('dashboard');
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualPlate.length >= 4) {
      handlePlateDetected(manualPlate);
    }
  };

  const toggleJobStatus = (id: string) => {
    setLogs(prev => prev.map(log => {
      if (log.id !== id) return log;
      
      if (log.status === 'active') {
        return { ...log, status: 'paused', lastPausedAt: Date.now() };
      } else if (log.status === 'paused') {
        const pauseDuration = log.lastPausedAt ? Date.now() - log.lastPausedAt : 0;
        return { ...log, status: 'active', pausedTime: log.pausedTime + pauseDuration, lastPausedAt: undefined };
      }
      return log;
    }));
  };

  const finishJob = (id: string) => {
    setLogs(prev => prev.map(log => {
      if (log.id !== id) return log;
      return { ...log, status: 'completed', endTime: Date.now() };
    }));
  };

  const deleteLog = (id: string) => {
    if (confirm("Tem certeza que deseja apagar este registo?")) {
      setLogs(prev => prev.filter(l => l.id !== id));
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const calculateTotalTime = (log: WorkLog) => {
    const end = log.endTime || Date.now();
    let duration = end - log.startTime - log.pausedTime;
    if (log.status === 'paused' && log.lastPausedAt) {
      duration -= (Date.now() - log.lastPausedAt);
    }
    return duration > 0 ? duration : 0;
  };

  if (!mechanic) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950">
        <div className="w-full max-w-sm bg-slate-900 p-8 rounded-[40px] shadow-2xl border border-white/5 animate-in fade-in zoom-in duration-500">
          <div className="mb-8 flex justify-center">
            <div className="w-24 h-24 bg-yellow-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(234,179,8,0.2)]">
              <Settings className="w-12 h-12 text-slate-900" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-center mb-3 tracking-tighter text-white">Bem-vindo</h1>
          <p className="text-slate-400 text-center mb-10 text-sm font-medium">Selecione o seu nome para começar.</p>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const select = e.currentTarget.elements.namedItem('name') as HTMLSelectElement;
            const name = select.value;
            if (name) {
              const newMechanic = { name, id: Date.now().toString() };
              setMechanic(newMechanic);
              localStorage.setItem('mechanic', JSON.stringify(newMechanic));
            }
          }}>
            <div className="relative mb-6">
              <select 
                name="name"
                className="w-full bg-slate-800/50 border-2 border-slate-700/50 rounded-2xl px-5 py-5 text-white focus:outline-none focus:border-yellow-500 appearance-none font-bold text-lg transition-all"
                required
                defaultValue=""
              >
                <option value="" disabled>O meu nome é ...</option>
                {MECHANICS_LIST.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none w-6 h-6" />
            </div>
            
            <button className="w-full py-5 bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-black rounded-2xl transition-all shadow-xl shadow-yellow-500/10 active:scale-95 text-base tracking-widest uppercase">
              ENTRAR NO SISTEMA
            </button>
          </form>
          
          <p className="mt-12 text-center text-slate-700 text-[10px] font-black uppercase tracking-[0.3em]">
            ElectroLoulé Digital v2.5
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col pb-24 max-w-lg mx-auto border-x border-slate-900 shadow-xl relative">
      <header className="p-4 xs:p-6 flex items-center justify-between bg-slate-900/50 backdrop-blur sticky top-0 z-40 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Car className="text-yellow-500" />
            ElectroLoulé
          </h1>
          <p className="text-xs text-slate-400 uppercase tracking-tighter">Mecânico: <span className="text-yellow-500 font-bold">{mechanic.name}</span></p>
        </div>
        <div className="bg-slate-800 p-1.5 rounded-full border border-slate-700">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-black text-sm text-yellow-500 uppercase">
            {mechanic.name[0]}
          </div>
        </div>
      </header>

      <main className="flex-1 p-4 xs:p-6 space-y-4">
        {view === 'dashboard' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 shadow-inner">
                <p className="text-slate-500 text-[9px] font-black uppercase mb-1 tracking-widest">Veiculos</p>
                <p className="text-2xl font-black text-white">
                  {logs.filter(l => new Date(l.startTime).toDateString() === new Date().toDateString()).length}
                </p>
              </div>
              <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 shadow-inner overflow-hidden">
                <p className="text-slate-500 text-[9px] font-black uppercase mb-1 tracking-widest">Total Horas</p>
                <p className="text-xl font-black text-white whitespace-nowrap">
                  {formatDuration(logs.reduce((acc, log) => acc + calculateTotalTime(log), 0))}
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Trabalhos em Curso</h2>
              {logs.filter(l => l.status !== 'completed').length === 0 ? (
                <div className="bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-3xl p-6 xs:p-8 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 bg-slate-800/50 rounded-full flex items-center justify-center mb-3">
                    <Clock className="w-6 h-6 text-slate-600" />
                  </div>
                  <p className="text-slate-500 font-medium text-sm mb-4">Nenhum veículo em reparação.</p>
                  <button 
                    onClick={() => setShowManualInput(true)}
                    className="text-yellow-500 text-xs font-black uppercase tracking-widest flex items-center gap-2 bg-yellow-500/5 px-6 py-3 rounded-full transition-colors border border-yellow-500/20 active:bg-yellow-500/20"
                  >
                    <Plus className="w-4 h-4" /> INSERIR MANUALMENTE
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {logs.filter(l => l.status !== 'completed').map(log => (
                    <div key={log.id} className={`p-4 rounded-2xl border transition-all ${log.status === 'active' ? 'bg-slate-900 border-white/10 shadow-lg' : 'bg-slate-900/50 border-slate-800'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-2xl font-black tracking-tighter text-white uppercase truncate flex-1 pr-2">{log.plate}</div>
                        <div className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest shrink-0 ${log.status === 'active' ? 'bg-green-900/40 text-green-400 border border-green-500/20' : 'bg-orange-900/40 text-orange-400 border border-orange-500/20'}`}>
                          {log.status === 'active' ? 'EM CURSO' : 'PAUSADO'}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold mb-4 uppercase tracking-wide">
                        <Clock className="w-3 h-3 text-slate-600" />
                        <span>Início: {new Date(log.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                         <div className={`bg-slate-950 px-3 py-2.5 rounded-xl flex-1 border-2 transition-colors duration-500 ${log.status === 'active' ? 'border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.1)]' : 'border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.1)]'}`}>
                            <div className={`text-2xl font-mono font-bold tracking-tight text-center ${log.status === 'active' ? 'text-yellow-500' : 'text-slate-600'}`}>
                               <LiveTimer initialTime={calculateTotalTime(log)} isRunning={log.status === 'active'} />
                            </div>
                         </div>
                         
                         <div className="flex gap-2 shrink-0">
                           <button 
                             onClick={() => toggleJobStatus(log.id)}
                             className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all active:scale-90 ${log.status === 'active' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-green-500 text-white shadow-lg shadow-green-500/30'}`}
                           >
                             {log.status === 'active' ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                           </button>
                           <button 
                             onClick={() => finishJob(log.id)}
                             className="w-12 h-12 flex items-center justify-center bg-red-500 text-white rounded-xl shadow-lg shadow-red-500/30 active:scale-90 transition-all"
                           >
                             <Square className="w-5 h-5 fill-current" />
                           </button>
                         </div>
                      </div>
                    </div>
                  ))}
                  
                  <button 
                    onClick={() => setShowManualInput(true)}
                    className="w-full py-4 border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:border-slate-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Novo Registo Manual
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {view === 'history' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-xl font-black mb-6 uppercase tracking-tighter">Histórico do Dia</h2>
            {logs.filter(l => l.status === 'completed').length === 0 ? (
              <p className="text-slate-500 text-center py-20 font-medium">Ainda não finalizou nenhum trabalho hoje.</p>
            ) : (
              <div className="space-y-3">
                {logs.filter(l => l.status === 'completed').map(log => (
                  <div 
                    key={log.id} 
                    className="bg-slate-900 rounded-2xl border border-slate-800 flex justify-between items-center shadow-md overflow-hidden group active:bg-slate-800 transition-colors"
                  >
                    <div 
                      className="flex items-center gap-4 p-4 flex-1 cursor-pointer"
                      onClick={() => log.photoUrl && setSelectedPhoto(log.photoUrl)}
                    >
                      <div className="relative group/photo">
                        {log.photoUrl ? (
                          <>
                            <img src={log.photoUrl} alt="Matrícula" className="w-14 h-14 rounded-xl object-cover border border-slate-700" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity rounded-xl">
                              <Maximize2 className="w-4 h-4 text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center text-slate-600 font-bold">PT</div>
                        )}
                      </div>
                      <div>
                        <div className="font-black text-xl tracking-tight leading-tight flex items-center gap-2">
                          {log.plate}
                          {log.photoUrl && <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" title="Foto disponível" />}
                        </div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2 mt-1">
                          <span className="text-yellow-500">{formatDuration(calculateTotalTime(log))}</span>
                          <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                          <span>{new Date(log.startTime).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteLog(log.id); }}
                      className="p-5 text-slate-700 hover:text-red-500 active:scale-90 transition-all border-l border-slate-800/50"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'settings' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-xl font-black mb-6 uppercase tracking-tighter">Definições da Conta</h2>
            <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-6 shadow-xl">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Mecânico Ativo</label>
                <div className="relative">
                  <select 
                    value={mechanic.name} 
                    className="w-full bg-slate-800 border border-slate-700 px-4 py-4 rounded-xl text-white font-bold appearance-none focus:ring-2 focus:ring-yellow-500"
                    onChange={(e) => setMechanic({ ...mechanic, name: e.target.value })}
                  >
                    {MECHANICS_LIST.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-800">
                <button 
                  onClick={() => {
                    if(confirm("Deseja apagar todos os registos do telemóvel? Esta ação não pode ser revertida.")) {
                      setLogs([]);
                    }
                  }}
                  className="w-full py-4 border-2 border-red-900/30 text-red-500 font-black rounded-xl hover:bg-red-950/20 active:scale-[0.98] transition-all uppercase tracking-tighter text-sm"
                >
                  LIMPAR TODOS OS REGISTOS
                </button>
              </div>
            </div>

            <div className="text-center">
               <button 
                 onClick={() => {
                   if(confirm("Deseja sair da conta?")) {
                     localStorage.removeItem('mechanic');
                     window.location.reload();
                   }
                 }}
                 className="text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-white"
               >
                 Sair / Trocar Utilizador
               </button>
            </div>
          </div>
        )}
      </main>

      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative w-full max-w-lg animate-in zoom-in duration-300">
            <button className="absolute -top-12 right-0 text-white p-2">
              <X className="w-8 h-8" />
            </button>
            <div className="bg-slate-900 p-2 rounded-3xl border border-white/10 shadow-2xl">
              <img 
                src={selectedPhoto} 
                alt="Confirmação de Matrícula" 
                className="w-full rounded-2xl shadow-inner"
                onClick={(e) => e.stopPropagation()}
              />
              <div className="p-4 text-center">
                 <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Registo Visual de Entrada</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-50 flex justify-between items-center max-w-lg mx-auto shadow-[0_-10px_40px_rgba(0,0,0,0.6)] safe-bottom">
        <button 
          onClick={() => setView('dashboard')}
          className={`flex-1 flex flex-col items-center py-4 xs:py-5 ${view === 'dashboard' ? 'text-yellow-500' : 'text-slate-500'}`}
        >
          <LayoutDashboard className="w-6 h-6 mb-1" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em]">Painel</span>
        </button>
        
        <div className="flex-1 flex justify-center -mt-8 xs:-mt-10">
          <button 
            onClick={() => setShowScanner(true)}
            className="w-14 h-14 xs:w-16 xs:h-16 bg-yellow-500 text-slate-950 rounded-full flex items-center justify-center shadow-2xl shadow-yellow-500/30 active:scale-90 transition-all border-4 border-slate-950"
          >
            <Camera className="w-7 h-7 xs:w-8 xs:h-8" />
          </button>
        </div>

        <button 
          onClick={() => setView('history')}
          className={`flex-1 flex flex-col items-center py-4 xs:py-5 ${view === 'history' ? 'text-yellow-500' : 'text-slate-500'}`}
        >
          <HistoryIcon className="w-6 h-6 mb-1" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em]">Histórico</span>
        </button>

        <button 
          onClick={() => setView('settings')}
          className={`flex-1 flex flex-col items-center py-4 xs:py-5 ${view === 'settings' ? 'text-yellow-500' : 'text-slate-500'}`}
        >
          <Settings className="w-6 h-6 mb-1" />
          <span className="text-[9px] font-black uppercase tracking-[0.2em]">Perfil</span>
        </button>
      </nav>

      {showManualInput && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-in fade-in duration-200">
           <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl animate-in zoom-in duration-300">
              <h3 className="text-xl font-black mb-2 uppercase tracking-tight">Registo Manual</h3>
              <p className="text-slate-400 text-sm mb-6">Insira a matrícula do veículo para iniciar o cronómetro.</p>
              
              <form onSubmit={handleManualSubmit}>
                <input 
                  autoFocus
                  type="text" 
                  value={manualPlate}
                  onChange={(e) => setManualPlate(e.target.value.toUpperCase())}
                  placeholder="AA-00-BB"
                  className="w-full bg-slate-800 border-2 border-slate-700 rounded-2xl px-6 py-5 text-2xl font-black text-center text-white tracking-widest focus:outline-none focus:border-yellow-500 transition-colors uppercase mb-6"
                />
                
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button"
                    onClick={() => { setShowManualInput(false); setManualPlate(''); }}
                    className="py-4 bg-slate-800 text-slate-400 font-bold rounded-xl active:scale-95 transition-all"
                  >
                    CANCELAR
                  </button>
                  <button 
                    type="submit"
                    disabled={manualPlate.length < 4}
                    className="py-4 bg-yellow-500 disabled:opacity-50 text-slate-900 font-black rounded-xl shadow-lg shadow-yellow-500/20 active:scale-95 transition-all"
                  >
                    INICIAR
                  </button>
                </div>
              </form>
           </div>
        </div>
      )}

      {showScanner && (
        <CameraScanner 
          onPlateDetected={handlePlateDetected} 
          onCancel={() => setShowScanner(false)} 
          onManualEntry={() => { setShowScanner(false); setShowManualInput(true); }}
        />
      )}
    </div>
  );
};

const LiveTimer: React.FC<{ initialTime: number, isRunning: boolean }> = ({ initialTime, isRunning }) => {
  const [elapsed, setElapsed] = useState(initialTime);

  useEffect(() => {
    let interval: number | undefined;
    if (isRunning) {
      interval = window.setInterval(() => {
        setElapsed(prev => prev + 1000);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  useEffect(() => {
    setElapsed(initialTime);
  }, [initialTime]);

  const h = Math.floor(elapsed / 3600000);
  const m = Math.floor((elapsed % 3600000) / 60000);
  const s = Math.floor((elapsed % 60000) / 1000);

  return (
    <span>
      {h.toString().padStart(2, '0')}:
      {m.toString().padStart(2, '0')}:
      {s.toString().padStart(2, '0')}
    </span>
  );
};

export default App;
