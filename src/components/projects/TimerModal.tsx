import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, Minimize2, X } from "lucide-react";

interface TimerModalProps {
  isVisible: boolean;
  isRunning: boolean;
  elapsedSeconds: number;
  employeeName: string;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onMinimize: () => void;
  onClose: () => void;
}

export const TimerModal = ({
  isVisible,
  isRunning,
  elapsedSeconds,
  employeeName,
  onPause,
  onResume,
  onStop,
  onMinimize,
  onClose
}: TimerModalProps) => {
  const [isMinimized, setIsMinimized] = useState(false);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMinimize = () => {
    setIsMinimized(true);
    onMinimize();
  };

  const handleMaximize = () => {
    setIsMinimized(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <Card className={`shadow-lg border-2 transition-all duration-200 ${isRunning ? 'border-green-500' : 'border-gray-300'}`}>
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              <span className="text-sm font-medium">Timer - {employeeName}</span>
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
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
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
                  {formatTime(elapsedSeconds)}
                </div>
              </div>

              {/* Controls */}
              <div className="flex justify-center gap-2">
                {isRunning ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onPause}
                    className="gap-2"
                  >
                    <Pause className="h-3 w-3" />
                    Pausar
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={onResume}
                    className="gap-2"
                  >
                    <Play className="h-3 w-3" />
                    Continuar
                  </Button>
                )}

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onStop}
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
              className="flex items-center gap-2 cursor-pointer"
              onClick={handleMaximize}
            >
              <div className="text-lg font-mono font-bold">
                {formatTime(elapsedSeconds)}
              </div>
              <div className="flex gap-1">
                {isRunning ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPause();
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
                      onResume();
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
                    onStop();
                  }}
                  className="h-6 w-6 p-0"
                >
                  <Square className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};