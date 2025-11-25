// src/components/SuccessNotification.jsx
import React, { useEffect, useState } from "react";

const DURATION = 3500;

export default function SuccessNotification({
  open,
  title = "Success !",
  message = "Operação realizada com sucesso.",
  onClose,
}) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!open) {
      setProgress(100);
      return;
    }

    const stepInterval = 50;
    const stepAmount = (100 * stepInterval) / DURATION;

    const intervalId = setInterval(() => {
      setProgress((prev) => Math.max(prev - stepAmount, 0));
    }, stepInterval);

    const timeoutId = setTimeout(() => {
      onClose?.();
    }, DURATION);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="
        fixed z-[9999]
        top-5 right-6
        w-full max-w-sm h-24
        bg-white rounded-xl overflow-hidden shadow-xl
        flex
      "
    >
      <svg width="16" height="96" xmlns="http://www.w3.org/2000/svg">
        <path
          d="
            M 8 0 
            Q 4 4.8, 8 9.6 
            T 8 19.2 
            Q 4 24, 8 28.8 
            T 8 38.4 
            Q 4 43.2, 8 48 
            T 8 57.6 
            Q 4 62.4, 8 67.2 
            T 8 76.8 
            Q 4 81.6, 8 86.4 
            T 8 96 
            L 0 96 
            L 0 0 
            Z
          "
          fill="#66cdaa"
          stroke="#66cdaa"
          strokeWidth={2}
          strokeLinecap="round"
        />
      </svg>

      <div className="mx-2.5 overflow-hidden w-full">
        <p className="mt-1.5 text-lg font-bold text-[#2fb868] leading-6 mr-3 truncate">
          {title}
        </p>
        <p className="text-sm text-slate-500 leading-5 break-all">
          {message}
        </p>
      </div>

      <button
        className="w-16 flex items-center justify-center focus:outline-none"
        onClick={onClose}
      >
        <svg
          className="w-7 h-7"
          fill="none"
          stroke="mediumseagreen"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </button>

      <div className="absolute bottom-0 left-[16px] right-0 h-[3px] bg-emerald-100">
        <div
          className="h-full bg-[#2fb868] transition-[width] duration-75"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
