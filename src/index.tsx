import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AboutHome } from "./screens/AboutHome/index.ts";
import { AdminHome } from "./screens/Admin/index.ts";
import { ProjectDetail } from "./screens/Project/index.ts";
import { ContactHome } from "./screens/Contact/index.ts";

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AboutHome />} />
        <Route path="/admin" element={<AdminHome />} />
        <Route path="/project/:id" element={<ProjectDetail />} />
        <Route path="/contact" element={<ContactHome />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
