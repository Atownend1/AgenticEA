import { useState, useEffect, useCallback } from "react";
import { AlertTriangle, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const TOTAL_SECONDS = 20 * 60; // 20 minutes

export default function SaveReminderTimer() {
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_SECONDS);
  const [dismissed, setDismissed] = useState(false);
  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  // Flash effect when time is low
  useEffect(() => {
    if (secondsLeft <= 60 && secondsLeft > 0) {
      const id = setInterval(() => setFlashing((f) => !f), 500);
      return () => clearInterval(id);
    }
    setFlashing(false);
  }, [secondsLeft <= 60 && secondsLeft > 0]);

  // Warn before closing/navigating away
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "You have unsaved work! Don't close until saved.";
      return e.returnValue;
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, []);

  const minutes = Math.floor(Math.max(0, secondsLeft) / 60);
  const seconds = Math.max(0, secondsLeft) % 60;
  const progress = ((TOTAL_SECONDS - secondsLeft) / TOTAL_SECONDS) * 100;
  const isExpired = secondsLeft <= 0;
  const isUrgent = secondsLeft <= 120; // last 2 minutes

  if (dismissed) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-[9999] w-80 rounded-lg shadow-xl border-2 transition-all duration-300 ${
        isExpired
          ? "border-red-500 bg-red-50"
          : isUrgent
            ? `border-orange-400 bg-orange-50 ${flashing ? "scale-105" : "scale-100"}`
            : "border-blue-400 bg-white"
      }`}
      data-testid="save-reminder-timer"
    >
      {/* Header */}
      <div
        className={`flex items-center justify-between px-4 py-2 rounded-t-md ${
          isExpired
            ? "bg-red-500 text-white"
            : isUrgent
              ? "bg-orange-400 text-white"
              : "bg-blue-500 text-white"
        }`}
      >
        <div className="flex items-center gap-2 text-sm font-semibold">
          {isExpired || isUrgent ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <Clock className="h-4 w-4" />
          )}
          {isExpired ? "Time's Up!" : "Session Timer"}
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="hover:opacity-80"
          aria-label="Dismiss timer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-3">
        {/* Timer display */}
        <div className="text-center">
          <span
            className={`font-mono text-3xl font-bold ${
              isExpired
                ? "text-red-600"
                : isUrgent
                  ? "text-orange-600"
                  : "text-gray-800"
            }`}
          >
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-1000 ${
              isExpired
                ? "bg-red-500"
                : isUrgent
                  ? "bg-orange-400"
                  : "bg-blue-500"
            }`}
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>

        {/* Warning message */}
        <p
          className={`text-center text-sm font-medium ${
            isExpired
              ? "text-red-700"
              : isUrgent
                ? "text-orange-700"
                : "text-gray-600"
          }`}
        >
          {isExpired
            ? "Please save your work now!"
            : "Don't close until saved"}
        </p>
      </div>
    </div>
  );
}
