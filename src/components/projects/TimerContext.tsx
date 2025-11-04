import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface TimerState {
  isRunning: boolean;
  startTime: Date | null;
  elapsedSeconds: number;
  projectId: string;
  projectName: string;
  employeeId: string;
  employeeName: string;
}

interface TimerContextType {
  timer: TimerState;
  startTimer: (projectId: string, projectName: string, employeeId: string, employeeName: string) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: (onSuccess?: () => void) => void;
  isTimerVisible: boolean;
  showTimer: () => void;
  hideTimer: () => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

const INITIAL_TIMER_STATE: TimerState = {
  isRunning: false,
  startTime: null,
  elapsedSeconds: 0,
  projectId: "",
  projectName: "",
  employeeId: "",
  employeeName: ""
};

export const TimerProvider = ({ children }: { children: ReactNode }) => {
  const [timer, setTimer] = useState<TimerState>(() => {
    // Load timer state from localStorage on initialization
    const saved = localStorage.getItem('projectTimer');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Recalculate elapsed time if timer was running
        if (parsed.isRunning && parsed.startTime) {
          const now = new Date();
          const startTime = new Date(parsed.startTime);
          const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
          return {
            ...parsed,
            startTime,
            elapsedSeconds
          };
        }
        return {
          ...parsed,
          startTime: parsed.startTime ? new Date(parsed.startTime) : null
        };
      } catch {
        return INITIAL_TIMER_STATE;
      }
    }
    return INITIAL_TIMER_STATE;
  });

  const [isTimerVisible, setIsTimerVisible] = useState(false);
  const { toast } = useToast();

  // Save timer state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('projectTimer', JSON.stringify(timer));
  }, [timer]);

  // Timer tick effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer.isRunning && timer.startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - timer.startTime!.getTime()) / 1000);
        setTimer(prev => ({ ...prev, elapsedSeconds: elapsed }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer.isRunning, timer.startTime]);

  // Show timer when starting
  useEffect(() => {
    if (timer.isRunning) {
      setIsTimerVisible(true);
    }
  }, [timer.isRunning]);

  const startTimer = (projectId: string, projectName: string, employeeId: string, employeeName: string) => {
    const startTime = new Date();
    setTimer({
      isRunning: true,
      startTime,
      elapsedSeconds: 0,
      projectId,
      projectName,
      employeeId,
      employeeName
    });
    setIsTimerVisible(true);

    toast({
      title: "Timer iniciado",
      description: `Timer para ${projectName} iniciado.`,
    });
  };

  const pauseTimer = () => {
    setTimer(prev => ({ ...prev, isRunning: false }));
  };

  const resumeTimer = () => {
    if (timer.startTime) {
      const newStartTime = new Date(Date.now() - timer.elapsedSeconds * 1000);
      setTimer(prev => ({ ...prev, isRunning: true, startTime: newStartTime }));
    }
  };

  const stopTimer = async (onSuccess?: () => void) => {
    if (!timer.isRunning || !timer.startTime || !timer.projectId || !timer.employeeId) return;

    const hours = timer.elapsedSeconds / 3600;

    try {
      const { error } = await supabase
        .from('project_hours')
        .insert([{
          project_id: timer.projectId,
          employee_id: timer.employeeId,
          date_worked: format(new Date(), "yyyy-MM-dd"),
          hours_worked: hours,
          description: `Timer: ${Math.floor(timer.elapsedSeconds / 3600)}h ${Math.floor((timer.elapsedSeconds % 3600) / 60)}m`
        }]);

      if (error) throw error;

      toast({
        title: "Timer finalizado",
        description: `${hours.toFixed(2)} horas foram registradas para ${timer.projectName}.`,
      });

      // Reset timer state
      setTimer(INITIAL_TIMER_STATE);
      setIsTimerVisible(false);

      // Clear localStorage
      localStorage.removeItem('projectTimer');

      if (onSuccess) {
        onSuccess();
      }

      // Trigger a custom event to refresh project hours in any open dialog
      window.dispatchEvent(new CustomEvent('timerStopped', {
        detail: { projectId: timer.projectId }
      }));
    } catch (error) {
      console.error('Error saving timer hours:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as horas do timer.",
        variant: "destructive",
      });
    }
  };

  const showTimer = () => {
    setIsTimerVisible(true);
  };

  const hideTimer = () => {
    setIsTimerVisible(false);
  };

  const value: TimerContextType = {
    timer,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    isTimerVisible,
    showTimer,
    hideTimer
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};