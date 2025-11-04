import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, Minimize2, X, Maximize2 } from "lucide-react";
import { useTimer } from "./TimerContext";

export const GlobalTimerModal = () => {
  const { timer, pauseTimer, resumeTimer, stopTimer, isTimerVisible, hideTimer, showTimer } = useTimer();
  const [isMinimized, setIsMinimized] = useState(false);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  const handleMaximize = () => {
    setIsMinimized(false);
  };

  const handleStop = () => {
    stopTimer();
  };

  if (!isTimerVisible || !timer.projectId) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <Card className={`shadow-lg border-2 transition-all duration-200 ${
        timer.isRunning ? 'border-green-500 shadow-green-500/20' : 'border-yellow-500 shadow-yellow-500/20'
      }`}>
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                timer.isRunning ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'
              }`} />
              <span className="text-sm font-medium">
                {isMinimized ? timer.projectName : `${timer.projectName} - ${timer.employeeName}`}
              </span>
            </div>
            <div className="flex gap-1">
              {!isMinimized && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMinimize}
                  className="h-6 w-6 p-0"
                >
                  <Minimize2 className="h-3 w-3" />
                </Button>
              )}
              {isMinimized && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMaximize}
                  className="h-6 w-6 p-0"
                >
                  <Maximize2 className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={hideTimer}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Timer Display */}
          {!isMinimized ? (
            <>
              <div className="text-center mb-4">
                <div className="text-2xl font-mono font-bold text-primary">
                  {formatTime(timer.elapsedSeconds)}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {timer.employeeName}
                </div>
              </div>

              {/* Controls */}
              <div className="flex justify-center gap-2">
                {timer.isRunning ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={pauseTimer}
                    className="gap-2"
                  >
                    <Pause className="h-3 w-3" />
                    Pausar
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={resumeTimer}
                    className="gap-2"
                  >
                    <Play className="h-3 w-3" />
                    Continuar
                  </Button>
                )}

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleStop}
                  className="gap-2"
                >
                  <Square className="h-3 w-3" />
                  Finalizar
                </Button>
              </div>
            </>
          ) : (
            // Minimized view
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={handleMaximize}
            >
              <div className="text-lg font-mono font-bold">
                {formatTime(timer.elapsedSeconds)}
              </div>
              <div className="flex gap-1">
                {timer.isRunning ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      pauseTimer();
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <Pause className="h-3 w-3" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      resumeTimer();
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <Play className="h-3 w-3" />
                  </Button>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStop();
                  }}
                  className="h-6 w-6 p-0"
                >
                  <Square className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Status indicator */}
          {!isMinimized && (
            <div className="text-center text-xs text-muted-foreground mt-3">
              {timer.isRunning ? "Timer em execução" : "Timer pausado"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};