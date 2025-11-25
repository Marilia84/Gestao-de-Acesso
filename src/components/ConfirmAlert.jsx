import React, { createContext, useContext, useState } from "react";

const ConfirmContext = createContext(null);

export const useConfirm = () => useContext(ConfirmContext);

export function ConfirmAlert({ children }) {
  const [confirmState, setConfirmState] = useState(null);

  const confirm = (options) => {
    return new Promise((resolve, reject) => {
      setConfirmState({
        title: options.title || "Confirmar",
        message: options.message || "Tem certeza?",
        confirmText: options.confirmText || "Confirmar",
        cancelText: options.cancelText || "Cancelar",
        onConfirm: () => {
          resolve(true);
          setConfirmState(null);
        },
        onCancel: () => {
          reject(false);
          setConfirmState(null);
        },
      });
    });
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {confirmState && (
        <div className="fixed inset-0 z-[999] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 animate-fadeIn">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              {confirmState.title}
            </h2>

            <p className="text-sm text-slate-600 mb-6">
              {confirmState.message}
            </p>

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100"
                onClick={confirmState.onCancel}
              >
                {confirmState.cancelText}
              </button>

              <button
                className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                onClick={confirmState.onConfirm}
              >
                {confirmState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
