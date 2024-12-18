import { useEffect, useState } from "react";
import type { SVGProps } from "react";

interface LoaderProps {
  lang: string;
}

export default function EosIconsThreeDotsLoading({
  lang,
  ...props
}: SVGProps<SVGSVGElement> & LoaderProps) {
  const [isOffline, setIsOffline] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="flex justify-center">
      {isOffline && lang === "en" && (
        <p className="m-4">You seem to have lost connection. Try refreshing?</p>
      )}
      {isOffline && lang === "de" && (
        <p className="m-4">
          Sie scheinen die Verbindung verloren zu haben. Haben Sie versucht, die
          Verbindung zu aktualisieren?
        </p>
      )}
      {!isOffline && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="4rem"
          height="4rem"
          viewBox="0 0 24 24"
          {...props}
        >
          <circle cx={18} cy={12} r={0} fill="#e0e0e0">
            <animate
              attributeName="r"
              begin={0.67}
              calcMode="spline"
              dur="1.5s"
              keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8"
              repeatCount="indefinite"
              values="0;2;0;0"
            ></animate>
          </circle>
          <circle cx={12} cy={12} r={0} fill="#e0e0e0">
            <animate
              attributeName="r"
              begin={0.33}
              calcMode="spline"
              dur="1.5s"
              keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8"
              repeatCount="indefinite"
              values="0;2;0;0"
            ></animate>
          </circle>
          <circle cx={6} cy={12} r={0} fill="#e0e0e0">
            <animate
              attributeName="r"
              begin={0}
              calcMode="spline"
              dur="1.5s"
              keySplines="0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8;0.2 0.2 0.4 0.8"
              repeatCount="indefinite"
              values="0;2;0;0"
            ></animate>
          </circle>
        </svg>
      )}
    </div>
  );
}
