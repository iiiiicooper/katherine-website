export type ProjectStatus = "draft" | "published" | "archived";

export type Asset = {
  id: string;
  type?: "image" | "video";
  src: string; // data URL or path in public
  thumbSrc?: string; // optional thumbnail
  alt?: string;
  caption?: string;
  // 可选：按百分比控制图片在容器中的显示宽度（默认 100）
  sizePercent?: number;
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
  // 资产展示布局：alternating（左右交替）或 vertical（上图下文）
  assetsLayout?: "alternating" | "vertical";
  // 纵向模块整体缩放百分比（例如 75 表示整体缩至 75% 宽度）
  assetsModulePercent?: number;
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
  // 首页卡片专用缩略图（不影响详情页）
  homePreviewSrc?: string;
  liveUrl?: string; // external link for "See it live"
  alt?: string;
  shortDesc?: string;
  gallery?: string[];
  caseStudySections?: { heading: string; text: string }[];
  // 新增：Logo 与 UI 展示支持
  logoUrl?: string;
  uiSections?: { title: string; content: string; images?: string[]; order?: number }[];
  uiGallery?: string[];
};

export type AppConfig = {
  about: {
    title: string;
    intro: string;
  };
  projects: ProjectItem[];
  contact: {
    email: string;
    phone: string;
    linkedin: string;
    googleForm?: {
      endpoint?: string; // e.g. https://docs.google.com/forms/d/e/<FORM_ID>/formResponse
      fbzx?: string; // optional session token required by some forms
      entries?: {
        name?: string; // e.g. entry.123456789
        email?: string; // e.g. entry.987654321
        content?: string; // e.g. entry.111222333
      };
    };
  };
  resume: {
    fileDataUrl?: string; // optional base64 data URL
    fileUrl?: string; // public URL stored in Blob
    fileName?: string; // original file name
    uploadedAt?: string; // ISO date string when uploaded
  };
};