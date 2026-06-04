import { useState, useEffect } from 'react';
import { usePomodoro } from '../../hooks/usePomodoro';
import { Play, Pause, Square, Timer } from 'lucide-react';

export function PomodoroTimer() {
  const { logSession } = usePomodoro();
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [breaksTaken, setBreaksTaken] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      // Timer finished
      setIsActive(false);
      logSession({ durationMinutes: 25, breaksTaken });
      
      // Request permission if not already granted and show notification
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification("Notewise", { 
          body: "Pomodoro session complete! Time for a break.",
          icon: '/vite.svg'
        });
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }

      setTimeLeft(25 * 60);
      setBreaksTaken(0);
    }
    
    return () => clearInterval(interval);
  }, [isActive, timeLeft, breaksTaken, logSession]);

  const toggleTimer = () => {
    if (isActive) {
      setBreaksTaken((prev) => prev + 1);
    }
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(25 * 60);
    setBreaksTaken(0);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center bg-surface-1 border border-edge rounded-lg p-3 shadow-sm mx-3 mb-4">
      <div className="flex items-center gap-2 mb-2 text-txt-secondary text-xs uppercase tracking-wider font-semibold w-full">
        <Timer size={14} /> Focus Timer
      </div>
      <div className="text-3xl font-display font-bold tabular-nums tracking-tight mb-3 text-txt-primary">
        {formatTime(timeLeft)}
      </div>
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
