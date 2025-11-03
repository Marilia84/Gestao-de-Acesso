import { memo } from "react";
import Lottie from "lottie-react";
import loaderAnimation from "../assets/loading.json";

function Loading({
  fullscreen = false,
  message = "Carregando...",
  size = 120,
  className = "",
}) {
  const containerClasses = fullscreen
    ? "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/30 backdrop-blur-[1px]"
    : `flex flex-col items-center justify-center p-6 ${className}`;

  // texto diferente dependendo do fundo
  const textClasses = fullscreen
    ? "mt-1 text-sm font-medium text-white drop-shadow"
    : "mt-1 text-sm font-medium text-gray-700";

  return (
    <div className={containerClasses} role="status" aria-live="polite">
      <div
        className="flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        <Lottie
          animationData={loaderAnimation}
          loop
          autoplay
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      {message && <p className={textClasses}>{message}</p>}

      {/* acessibilidade extra */}
      {!message && (
        <span className="sr-only">Carregando conteúdo, aguarde…</span>
      )}
    </div>
  );
}

export default memo(Loading);
