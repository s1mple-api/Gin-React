import { useState, useEffect, type ReactNode } from "react";
import { Spin } from "antd";

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleLoadingChange = (e: CustomEvent<{ loading: boolean }>) => {
      setLoading(e.detail.loading);
    };

    window.addEventListener(
      "loading-change",
      handleLoadingChange as EventListener,
    );
    return () => {
      window.removeEventListener(
        "loading-change",
        handleLoadingChange as EventListener,
      );
    };
  }, []);

  return (
    <>
      {children}
      <Spin spinning={loading} fullscreen />
    </>
  );
}
