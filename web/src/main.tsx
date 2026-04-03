import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { ConfigProvider } from "antd";
import router from "./router";
import { LoadingProvider } from "./contexts/LoadingContext";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConfigProvider>
      <LoadingProvider>
        <RouterProvider router={router} />
      </LoadingProvider>
    </ConfigProvider>
  </StrictMode>,
);
