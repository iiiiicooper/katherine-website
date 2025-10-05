export type ProjectStatus = "draft" | "published" | "archived";

export type Asset = {
  id: string;
  type?: "image" | "video";
  src: string; // data URL or path in public
  thumbSrc?: string; // optional thumbnail
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
  fileSize?: number;
  license?: string;
  tags?: string[];
  isCover?: boolean;
};

export type CopyBlock = {
  id: string;
  kind: "heading" | "paragraph" | "list" | "quote" | "cta";
  text: string;
  rich?: boolean;
  links?: { label: string; href: string }[];
};

export type ProjectItem = {
  id: string;
  title: string;
  // 新模型：支持可重复集合
  assets?: Asset[];
  copyBlocks?: CopyBlock[];
  slug?: string;
  status?: ProjectStatus;
  seo?: { title?: string; description?: string };
  order?: number;
  visible?: boolean;
  tags?: string[];
  role?: string;
  tools?: string[];
  timeline?: string;
  // 兼容旧字段（保留以便平滑迁移）
  previewSrc: string; // data URL or path in public
  liveUrl?: string; // external link for "See it live"
  alt?: string;
  shortDesc?: string;
  gallery?: string[];
  caseStudySections?: { heading: string; text: string }[];
};

export type AppConfig = {
  about: {
    title: string;
    intro: string;
    avatarUrl?: string;
    coverUrl?: string;
  };
  projects: ProjectItem[];
  contact: {
    email: string;
    phone: string;
    linkedin: string;
    preferredChannel?: "email" | "phone" | "linkedin";
  };
  resume: {
    url?: string; // e.g. /resume.pdf
    fileDataUrl?: string; // optional base64 data URL
    version?: string;
  };
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  content: string;
  createdAt: string; // ISO string
  preferredChannel?: "email" | "phone" | "linkedin";
  status?: "unread" | "replied";
};