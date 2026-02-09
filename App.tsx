
import React, { useState, useEffect, useMemo } from 'react';
import { AppView, WorkLog, Mechanic } from './types';
import { CameraScanner } from './components/CameraScanner';
import { LayoutDashboard, History as HistoryIcon, Camera, Settings, Play, Pause, Square, Trash2, Clock, Car } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('dashboard');
  const [mechanic, setMechanic] = useState<Mechanic | null>(null);
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [showScanner, setShowScanner] = useState(false);

  // Initialize data from LocalStorage
  useEffect(() => {
    const savedMechanic = localStorage.getItem('mechanic');
    const savedLogs = localStorage.getItem('logs');
    if (savedMechanic) setMechanic(JSON.parse(savedMechanic));
    if (savedLogs) setLogs(JSON.parse(savedLogs));
  }, []);

  // Save data to LocalStorage
  useEffect(() => {
    if (mechanic) localStorage.setItem('mechanic', JSON.stringify(mechanic));
    localStorage.setItem('logs', JSON.stringify(logs));
  }, [mechanic, logs]);

  const activeJob = useMemo(() => logs.find(l => l.status === 'active' || l.status === 'paused'), [logs]);

  const handlePlateDetected = (plate: string, photoUrl: string) => {
    setShowScanner(false);
    
    // Logic check
    const existingActive = logs.find(l => l.plate === plate && l.status !== 'completed');
    if (existingActive) {
      // Focus on this job? Maybe highlight it.
      return;
    }

    const newLog: WorkLog = {
      id: Date.now().toString(),
      plate,
      startTime: Date.now(),
      pausedTime: 0,
      status: 'active',
      mechanicId: mechanic?.id || 'default',
      photoUrl
    };

    setLogs([newLog, ...logs]);
    setView('dashboard');
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
        <div className="w-full max-w-sm bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800">
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center">
              <Settings className="w-10 h-10 text-slate-900" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-center mb-2">Bem-vindo</h1>
          <p className="text-slate-400 text-center mb-8">Introduza o seu nome para começar.</p>
          <form onSubmit={(e) => {
            e.preventDefault();
            const name = (e.currentTarget.elements.namedItem('name') as HTMLInputElement).value;
            if (name) setMechanic({ name, id: Date.now().toString() });
          }}>
            <input 
              name="name"
              placeholder="Nome do Mecânico" 
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-4 mb-4 text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              required
            />
            <button className="w-full py-4 bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold rounded-xl transition-all">
              ENTRAR
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col pb-24 max-w-lg mx-auto border-x border-slate-900 shadow-xl">
      {/* Header */}
      <header className="p-6 flex items-center justify-between bg-slate-900/50 backdrop-blur sticky top-0 z-40 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Car className="text-yellow-500" />
            AutoScan
          </h1>
          <p className="text-xs text-slate-400">Logado como: <span className="text-yellow-500 font-medium">{mechanic.name}</span></p>
        </div>
        <div className="bg-slate-800 p-2 rounded-full">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-sm text-yellow-500 uppercase">
            {mechanic.name[0]}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-6 space-y-6">
        {view === 'dashboard' && (
          <>
            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                <p className="text-slate-500 text-xs font-semibold uppercase mb-1">Trabalhos Hoje</p>
                <p className="text-3xl font-black text-white">
                  {logs.filter(l => new Date(l.startTime).toDateString() === new Date().toDateString()).length}
                </p>
              </div>
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                <p className="text-slate-500 text-xs font-semibold uppercase mb-1">Total Horas</p>
                <p className="text-3xl font-black text-white">
                  {formatDuration(logs.reduce((acc, log) => acc + calculateTotalTime(log), 0))}
                </p>
              </div>
            </div>

            {/* Active Jobs Section */}
            <div>
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Em Curso</h2>
              {logs.filter(l => l.status !== 'completed').length === 0 ? (
                <div className="bg-slate-900/30 border-2 border-dashed border-slate-800 rounded-3xl p-10 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <Clock className="w-8 h-8 text-slate-600" />
                  </div>
                  <p className="text-slate-500">Sem trabalhos ativos.</p>
                  <p className="text-sm text-slate-600 mt-2">Clique no botão Scan para começar.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {logs.filter(l => l.status !== 'completed').map(log => (
                    <div key={log.id} className={`p-5 rounded-2xl border transition-all ${log.status === 'active' ? 'bg-slate-900 border-yellow-500/50 shadow-lg shadow-yellow-500/5' : 'bg-slate-900/50 border-slate-800'}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-lg text-white border border-slate-700 shadow-inner">
                            {log.plate.substring(0,2)}
                          </div>
                          <div>
                            <div className="text-2xl font-black tracking-tighter text-white">{log.plate}</div>
                            <div className="flex items-center gap-1 text-slate-500 text-xs">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(log.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${log.status === 'active' ? 'bg-green-900/30 text-green-400' : 'bg-orange-900/30 text-orange-400'}`}>
                          {log.status === 'active' ? 'Ativo' : 'Pausado'}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                         <div className="text-2xl font-mono font-bold text-yellow-400">
                            <LiveTimer initialTime={calculateTotalTime(log)} isRunning={log.status === 'active'} />
                         </div>
                         <div className="flex gap-2">
                           <button 
                             onClick={() => toggleJobStatus(log.id)}
                             className={`p-3 rounded-xl transition-colors ${log.status === 'active' ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'}`}
                           >
                             {log.status === 'active' ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                           </button>
                           <button 
                             onClick={() => finishJob(log.id)}
                             className="p-3 bg-red-500 text-white rounded-xl"
                           >
                             <Square className="w-6 h-6 fill-current" />
                           </button>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {view === 'history' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-6">Histórico de Hoje</h2>
            {logs.filter(l => l.status === 'completed').length === 0 ? (
              <p className="text-slate-500 text-center py-20">Nenhum trabalho finalizado ainda.</p>
            ) : (
              logs.filter(l => l.status === 'completed').map(log => (
                <div key={log.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    {log.photoUrl && (
                      <img src={log.photoUrl} alt="Matrícula" className="w-12 h-12 rounded object-cover border border-slate-700" />
                    )}
                    <div>
                      <div className="font-bold text-lg">{log.plate}</div>
                      <div className="text-xs text-slate-500">{new Date(log.startTime).toLocaleDateString()} • {formatDuration(calculateTotalTime(log))}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteLog(log.id)}
                    className="p-2 text-slate-500 hover:text-red-500"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {view === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold mb-6">Definições</h2>
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
              <div>
                <label className="block text-sm text-slate-500 mb-2">Nome do Mecânico</label>
                <div className="flex gap-2">
                  <input 
                    defaultValue={mechanic.name} 
                    className="flex-1 bg-slate-800 border border-slate-700 p-3 rounded-lg"
                    onBlur={(e) => setMechanic({ ...mechanic, name: e.target.value })}
                  />
                </div>
              </div>
              <button 
                onClick={() => {
                  if(confirm("Deseja apagar todos os registos?")) {
                    setLogs([]);
                  }
                }}
                className="w-full py-3 border border-red-900 text-red-500 font-semibold rounded-lg hover:bg-red-900/20"
              >
                Limpar Todos os Logs
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 z-50 flex justify-between items-center max-w-lg mx-auto shadow-[0_-10px_30px_rgba(0,0,0,0.5)] safe-bottom">
        <button 
          onClick={() => setView('dashboard')}
          className={`flex-1 flex flex-col items-center py-4 ${view === 'dashboard' ? 'text-yellow-500' : 'text-slate-500'}`}
        >
          <LayoutDashboard className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Dashboard</span>
        </button>
        
        <div className="flex-1 flex justify-center -mt-10">
          <button 
            onClick={() => setShowScanner(true)}
            className="w-16 h-16 bg-yellow-500 text-slate-950 rounded-full flex items-center justify-center shadow-xl shadow-yellow-500/20 active:scale-95 transition-transform"
          >
            <Camera className="w-8 h-8" />
          </button>
        </div>

        <button 
          onClick={() => setView('history')}
          className={`flex-1 flex flex-col items-center py-4 ${view === 'history' ? 'text-yellow-500' : 'text-slate-500'}`}
        >
          <HistoryIcon className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Histórico</span>
        </button>

        <button 
          onClick={() => setView('settings')}
          className={`hidden sm:flex flex-1 flex flex-col items-center py-4 ${view === 'settings' ? 'text-yellow-500' : 'text-slate-500'}`}
        >
          <Settings className="w-6 h-6 mb-1" />
          <span className="text-[10px] font-bold uppercase tracking-wider">Ajustes</span>
        </button>
      </nav>

      {showScanner && (
        <CameraScanner 
          onPlateDetected={handlePlateDetected} 
          onCancel={() => setShowScanner(false)} 
        />
      )}
    </div>
  );
};

// Sub-component for real-time timer updates
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
