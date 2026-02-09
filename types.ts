
export interface Mechanic {
  name: string;
  id: string;
}

export interface WorkLog {
  id: string;
  plate: string;
  startTime: number;
  endTime?: number;
  pausedTime: number;
  lastPausedAt?: number;
  status: 'active' | 'paused' | 'completed';
  mechanicId: string;
  photoUrl?: string;
}

export type AppView = 'dashboard' | 'scanner' | 'history' | 'settings';

export interface DailyStats {
  totalJobs: number;
  totalHours: number;
}
