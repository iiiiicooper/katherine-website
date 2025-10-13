import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AboutHome } from "./screens/AboutHome/index.ts";
import { ProjectDetail } from "./screens/Project/index.ts";
import { ContactHome } from "./screens/Contact/index.ts";
import { AdminHome } from "./screens/Admin/index.ts";

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AboutHome />} />
          <Route path="/project/:id" element={<ProjectDetail />} />
          <Route path="/contact" element={<ContactHome />} />
          <Route path="/admin" element={<AdminHome />} />
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
);
