import { useState, useEffect, useCallback } from 'react';
import { usePomodoro } from '../../hooks/usePomodoro';
import { Play, Pause, Square, Timer, Plus, Minus } from 'lucide-react';

const MIN_DURATION = 5;
const MAX_DURATION = 60;
const STEP = 5;

export function PomodoroTimer() {
  const { logSession } = usePomodoro();
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [breaksTaken, setBreaksTaken] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      // Timer finished
      setIsActive(false);
      logSession({ durationMinutes, breaksTaken });

      // Show notification if permission was granted
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          const notification = new Notification('Notewise', {
            body: `${durationMinutes}-minute focus session complete! Time for a break.`,
            icon: '/vite.svg',
          });
          notification.onclick = () => {
            window.focus();
            notification.close();
          };
        } catch {
          // Notification constructor can fail in some environments
        }
      }

      setTimeLeft(durationMinutes * 60);
      setBreaksTaken(0);
    }
    
    return () => clearInterval(interval);
  }, [isActive, timeLeft, breaksTaken, durationMinutes, logSession]);

  const toggleTimer = () => {
    if (isActive) {
      setBreaksTaken((prev) => prev + 1);
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(durationMinutes * 60);
    setBreaksTaken(0);
  };

  const adjustDuration = useCallback((delta: number) => {
    if (isActive) return; // Don't allow changes while running
    setDurationMinutes((prev) => {
      const next = Math.min(MAX_DURATION, Math.max(MIN_DURATION, prev + delta));
      setTimeLeft(next * 60);
      return next;
    });
  }, [isActive]);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = 1 - timeLeft / (durationMinutes * 60);

  return (
    <div className="flex flex-col items-center bg-surface-1 border border-edge rounded-lg p-3 shadow-sm mx-3 mb-4">
      <div className="flex items-center gap-2 mb-2 text-txt-secondary text-xs uppercase tracking-wider font-semibold w-full">
        <Timer size={14} /> Focus Timer
      </div>

      {/* Duration adjustment */}
      <div className="flex items-center gap-3 mb-2 w-full justify-center">
        <button
          onClick={() => adjustDuration(-STEP)}
          disabled={isActive || durationMinutes <= MIN_DURATION}
          className="p-1 rounded bg-surface-2 hover:bg-surface-3 text-txt-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title={`Decrease by ${STEP} min`}
        >
          <Minus size={14} />
        </button>
        <span className="text-xs text-txt-secondary font-medium tabular-nums w-12 text-center">
          {durationMinutes} min
        </span>
        <button
          onClick={() => adjustDuration(STEP)}
          disabled={isActive || durationMinutes >= MAX_DURATION}
          className="p-1 rounded bg-surface-2 hover:bg-surface-3 text-txt-secondary transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title={`Increase by ${STEP} min`}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Progress ring */}
      <div className="relative mb-3">
        <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
          <circle
            cx="40" cy="40" r="34"
            fill="none"
            stroke="currentColor"
            className="text-surface-3"
            strokeWidth="4"
          />
          <circle
            cx="40" cy="40" r="34"
            fill="none"
            stroke="currentColor"
            className="text-brand-500 transition-all duration-1000"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 34}`}
            strokeDashoffset={`${2 * Math.PI * 34 * (1 - progressPercent)}`}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xl font-display font-bold tabular-nums text-txt-primary">
          {formatTime(timeLeft)}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 w-full">
        <button
          onClick={toggleTimer}
          className={`flex-1 py-1.5 px-3 rounded text-sm font-medium flex items-center justify-center gap-1 transition-colors ${
            isActive 
              ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20' 
              : 'bg-brand-500 text-white hover:bg-brand-600'
          }`}
        >
          {isActive ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Start</>}
        </button>
        <button
          onClick={resetTimer}
          className="p-1.5 rounded bg-surface-2 hover:bg-surface-3 text-txt-secondary transition-colors"
          title="Reset"
        >
          <Square size={14} />
        </button>
      </div>
    </div>
  );
}
