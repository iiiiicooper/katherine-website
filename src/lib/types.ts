export type ProjectItem = {
  id: string;
  title: string;
  previewSrc: string; // data URL or path in public
  liveUrl?: string; // external link for "See it live"
  alt?: string;
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
  };
  resume: {
    url?: string; // e.g. /resume.pdf
    fileDataUrl?: string; // optional base64 data URL
  };
};