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
    googleForm: {
      endpoint: "https://docs.google.com/forms/d/e/1FAIpQLSczsJb70xRpdkBGYjG5Wrt37yIIb-wBAVnWMNSQ11ttjCjWwA/formResponse",
      entries: {
        name: "entry.1875613538",
        email: "entry.943448880",
        content: "entry.892292611"
      }
    }
  },
  resume: {
    fileUrl: "/uploads/Katherine Fang-CV-New York University.pdf",
    fileName: "Katherine Fang-CV-New York University.pdf",
    uploadedAt: "2025-01-15T10:00:00.000Z"
  },
};

let cachedConfig: AppConfig | null = null;

export async function loadConfigFromFile(): Promise<AppConfig> {
  try {
    const response = await fetch('/app-config.json');
    if (!response.ok) {
      console.warn('Failed to load app-config.json, using default config');
      return defaultConfig;
    }
    const fileConfig = await response.json() as AppConfig;
    return { ...defaultConfig, ...fileConfig };
  } catch (error) {
    console.warn('Error loading app-config.json:', error);
    return defaultConfig;
  }
}

export function loadConfig(): AppConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      cachedConfig = defaultConfig;
      return defaultConfig;
    }
    const parsed = JSON.parse(raw) as AppConfig;
    cachedConfig = { ...defaultConfig, ...parsed };
    return cachedConfig;
  } catch {
    cachedConfig = defaultConfig;
    return defaultConfig;
  }
}

// 初始化配置的函数
export async function initializeConfig(): Promise<AppConfig> {
  try {
    const fileConfig = await loadConfigFromFile();
    cachedConfig = fileConfig;
    return fileConfig;
  } catch (error) {
    console.warn('Failed to initialize config from file:', error);
    cachedConfig = defaultConfig;
    return defaultConfig;
  }
}

export function saveConfig(cfg: AppConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  cachedConfig = cfg;
}