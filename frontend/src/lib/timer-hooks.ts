"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface TimerState {
  timeRemaining: number;
  isRunning: boolean;
  isWarning: boolean;
  isExpired: boolean;
}

export function useExamTimer(
  duration: number,
  onExpire: () => void,
  onWarning?: () => void
) {
  const [state, setState] = useState<TimerState>({
    timeRemaining: duration,
    isRunning: false,
    isWarning: false,
    isExpired: false,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number>(0);

  const start = useCallback(() => {
    if (state.isExpired) return;

    setState((prev) => ({ ...prev, isRunning: true }));
    startTimeRef.current = Date.now() - pausedTimeRef.current;

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - (startTimeRef.current || 0);
      const remaining = Math.max(0, duration - elapsed);

      setState((prev) => {
        const isWarning = remaining <= 30 && remaining > 0;
        const isExpired = remaining === 0;

        if (isWarning && !prev.isWarning && onWarning) {
          onWarning();
        }

        if (isExpired && !prev.isExpired) {
          onExpire();
        }

        return {
          ...prev,
          timeRemaining: remaining,
          isWarning,
          isExpired,
        };
      });
    }, 100);
  }, [duration, state.isExpired, onExpire, onWarning]);

  const pause = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (startTimeRef.current) {
      pausedTimeRef.current = Date.now() - startTimeRef.current;
    }

    setState((prev) => ({ ...prev, isRunning: false }));
  }, []);

  const reset = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    startTimeRef.current = null;
    pausedTimeRef.current = 0;

    setState({
      timeRemaining: duration,
      isRunning: false,
      isWarning: false,
      isExpired: false,
    });
  }, [duration]);

  const addTime = useCallback(
    (seconds: number) => {
      setState((prev) => ({
        ...prev,
        timeRemaining: Math.min(duration, prev.timeRemaining + seconds),
      }));
    },
    [duration]
  );

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    ...state,
    start,
    pause,
    reset,
    addTime,
  };
}

export function useQuestionTimer(timeLimit: number, onExpire: () => void) {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    setIsRunning(true);
    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          onExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [onExpire]);

  const pause = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setTimeRemaining(timeLimit);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [timeLimit]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    timeRemaining,
    isRunning,
    start,
    pause,
    reset,
  };
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }
}
