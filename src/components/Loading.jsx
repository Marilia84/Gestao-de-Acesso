import { memo } from "react";
import Lottie from "lottie-react";
import loaderAnimation from "../assets/loader.json"; // seu arquivo baixado do LottieFiles

function Loading({
  fullscreen = false,
  message = "Carregando...",
  size = 120,
}) {
  return (
    <div
      className={
        fullscreen
          ? "fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/30 backdrop-blur-[1px]"
          : "flex flex-col items-center justify-center p-6"
      }
    >
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center"
      >
        <Lottie
          animationData={loaderAnimation}
          loop
          autoplay
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      {message && (
        <p className="mt-3 text-sm font-medium text-gray-700 drop-shadow">
          {message}
        </p>
      )}
    </div>
  );
}

// memo pra não re-renderizar à toa
export default memo(Loading);
