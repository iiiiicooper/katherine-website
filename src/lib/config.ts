import { AppConfig, ProjectItem } from "./types";

const STORAGE_KEY = "app-config-v1";

const defaultProjects: ProjectItem[] = [
  {
    id: "p1",
    title: "Project 1",
    previewSrc: "/-----1-1.png",
    liveUrl: "https://example.com/project-1",
    alt: "Project 1",
  },
  {
    id: "p2",
    title: "Project 2",
    previewSrc: "/--2025-09-21---5-06-36-1.png",
    liveUrl: "https://example.com/project-2",
    alt: "Project 2",
  },
];

export const defaultConfig: AppConfig = {
  about: {
    title: "Hi, I'm Katherine.",
    intro:
      "UI/UX and Product Designer rooted in the New York City area, graduating from NYU next year. My work blends creativity with strategy, and I'm always eager to collaborate on user-centered projects.",
  },
  projects: defaultProjects,
  contact: {
    email: "katherine77778@outlook.com",
    phone: "+1 857-272-1995",
    linkedin: "https://www.linkedin.com/in/katherine-fang-927523b338/",
  },
  resume: {
    url: "/resume.pdf",
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