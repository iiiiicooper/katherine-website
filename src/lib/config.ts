import { AppConfig, ProjectItem } from "./types.js";

const STORAGE_KEY = "app-config-v1";

const defaultProjects: ProjectItem[] = [
  {
    id: "p1",
    title: "uSpeedo.ai",
    previewSrc: "/p1-logo.png",
    homePreviewSrc: "/p1-1.jpeg",
    liveUrl: "https://example.com/project-1",
    alt: "uSpeedo.ai logo",
    shortDesc: "A sample project one.",
    tags: ["UI", "UX"],
    role: "Designer",
    tools: ["Figma", "Photoshop"],
    timeline: "2023",
    assets: [
      { id: "p1-a1", src: "/p1-1.jpeg", alt: "uSpeedo.ai UI 1", caption: "uSpeedo.ai is an all-in one AI Marketing platform. Using AI to quickly generate high-quality marketing images for different social media platforms." },
      { id: "p1-a2", src: "/p1-2.jpeg", alt: "uSpeedo.ai UI 2", caption: "It analyzes trending events and popular BGMs, then generates posts that fit today's trends." },
      { id: "p1-a3", src: "/p1-3.png", alt: "uSpeedo.ai UI 3", caption: "Based on a chatbot, you can input the product link and a prompt to automatically generate images and copy that align with the product’s tone." },
      { id: "p1-a4", src: "/p1-4.png", alt: "uSpeedo.ai UI 4", caption: "Auto-publish your uSpeedo.ai creatives to X, Facebook, LinkedIn, and Instagram, and schedule them ahead of time—without leaving the platform." },
      { id: "p1-a5", src: "/p1-5.png", alt: "uSpeedo.ai UI 5", caption: "Social Media Background Design", sizePercent: 75 },
      { id: "p1-a6", src: "/p1-6.png", alt: "uSpeedo.ai UI 6", caption: " ", sizePercent: 75 },
      { id: "p1-a7", src: "/p1-7.png", alt: "uSpeedo.ai UI 7", caption: "Product Function Poster", sizePercent: 75 },
      { id: "p1-a8", src: "/p1-8.png", alt: "uSpeedo.ai UI 8", caption: " ", sizePercent: 75 },
    ],
    copyBlocks: [
      { id: "p1-c1", kind: "paragraph", text: "uSpeedo.ai is an all-in one AI Marketing platform. Using AI to quickly generate high-quality marketing images for different social media platforms." },
      { id: "p1-c2", kind: "paragraph", text: "It analyzes trending events and popular BGMs, then generates posts that fit today's trends." },
    ],
    gallery: [
      "/p1-1.jpeg",
      "/p1-2.jpeg",
      "/p1-3.png",
      "/p1-4.png",
      "/p1-5.png",
      "/p1-6.png",
      "/p1-7.png",
      "/p1-8.png",
    ],
    caseStudySections: [],
    visible: true,
    order: 1,
  },
  {
    id: "p2",
    title: "Fazhi legal AI",
    previewSrc: "/p2-logo.png",
    homePreviewSrc: "/p2-1.png",
    liveUrl: "https://example.com/project-2",
    alt: "Project 2 logo",
    shortDesc: "A sample project two.",
    tags: ["UI", "UX"],
    role: "Designer",
    tools: ["Figma", "Photoshop"],
    timeline: "2023",
    assets: [
      { id: "p2-a1", src: "/p2-1.png", alt: "Project 2 UI 1", caption: "AI-driven legal workflow: defining the product architecture and capabilities—including intelligent chat, document drafting, legal research, smart contracts, and element-based document assembly." },
      { id: "p2-a2", src: "/p2-2.png", alt: "Project 2 UI 2", caption: "Generate different types of legal documents and contracts." },
    ],
    copyBlocks: [
      { id: "p2-c1", kind: "paragraph", text: "uSpeedo.ai is an all-in one AI Marketing platform. Using AI to quickly generate high-quality marketing images for different social media platforms." },
      { id: "p2-c2", kind: "paragraph", text: "It analyzes trending events and popular BGMs, then generates posts that fit today's trends." },
    ],
    gallery: [
      "/p2-1.png",
      "/p2-2.png",
    ],
    caseStudySections: [],
    visible: true,
    order: 2,
  },
];

export const defaultConfig: AppConfig = {
  about: {
    title: "Hi, I'm Katherine Fang.",
    intro:
      "UI/UX and Product Designer based in New York City, graduating from NYU in 2026. I focus on designing AI and FinTech products that bridge user needs with market opportunities, creating seamless experiences that drive real business impact.",
  },
  projects: defaultProjects,
  contact: {
    email: "katherine77778@outlook.com",
    phone: "+1 857-272-1995",
    linkedin: "https://www.linkedin.com/in/katherine-fang-92752b338/",
  },
  resume: {
  },
};

export function loadConfig(): AppConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultConfig;
    const parsed = JSON.parse(raw) as AppConfig;
    return { ...defaultConfig, ...parsed };
  } catch {
    return defaultConfig;
  }
}

// 尝试从后端拉取配置（存在则返回），否则返回本地/默认
export async function loadRemoteConfig(): Promise<AppConfig> {
  try {
    const res = await fetch("/api/config");
    if (res.ok) {
      const data = await res.json();
      if (data?.ok && data.data) {
        return data.data as AppConfig;
      }
    }
  } catch {
    // ignore
  }
  return loadConfig();
}

export function saveConfig(cfg: AppConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

export function resetConfig(): AppConfig {
  saveConfig(defaultConfig);
  return defaultConfig;
}

export function exportConfig(): string {
  return JSON.stringify(loadConfig(), null, 2);
}

export async function importConfigFromFile(file: File): Promise<AppConfig> {
  const text = await file.text();
  const parsed = JSON.parse(text) as AppConfig;
  saveConfig(parsed);
  return parsed;
}