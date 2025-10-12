export const runtime = "edge";

// Avoid importing frontend modules into Edge runtime; define a minimal default here
const DEFAULT_CONFIG = {
  about: {
    title: "Hi, I'm Katherine Fang.",
    intro:
      "UI/UX and Product Designer rooted in the New York City area, graduating from NYU next year. My work blends creativity with strategy, and I'm always eager to collaborate on user-centered projects.",
  },
  projects: [
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
  ],
  contact: {
    email: "katherine77778@outlook.com",
    phone: "+1 857-272-1995",
    linkedin: "https://www.linkedin.com/in/katherine-fang-92752b338/",
  },
  resume: {},
};

// Edge 环境不使用 Node/undici 依赖，后续如需写入远端存储，
// 建议改用 Blob 的 HTTP API（纯 fetch 实现），此处暂不引入 SDK。
const token: string | undefined =
  (globalThis as any)?.process?.env?.BLOB_READ_WRITE_TOKEN ?? (globalThis as any)?.BLOB_READ_WRITE_TOKEN;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,PUT,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// 暂不直接写入 Blob（避免 Edge 不支持的模块）。
// 如需持久化，可在后续改为调用 Blob 的 HTTP 接口。
async function putJsonPrivate(_path: string, _json: string) {
  throw new Error("blob_unavailable");
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (req.method === "GET") {
      // For Edge compatibility, avoid Blob listing; return default/fallback
      return jsonResponse({ ok: true, data: DEFAULT_CONFIG });
    }

    if (req.method === "PUT") {
      const bodyText = await req.text();
      // naive validation: must be JSON object
      let parsed: unknown;
      try {
        parsed = JSON.parse(bodyText);
      } catch {
        return jsonResponse({ ok: false, error: "invalid_json" }, 400);
      }
      try {
        await putJsonPrivate("config/current.json", bodyText);
        const ts = Date.now();
        await putJsonPrivate(`config/${ts}.json`, bodyText);
      } catch {
        // Blob unavailable: report non-blocking error so frontend can continue
        return jsonResponse({ ok: false, error: "blob_unavailable" }, 503);
      }
      // No listing/cleanup on Edge to avoid unsupported modules
      return jsonResponse({ ok: true });
    }

    return jsonResponse({ ok: false, error: "method_not_allowed" }, 405);
  } catch (err) {
    return jsonResponse({ ok: false, error: "server_error", detail: String(err) }, 500);
  }
}

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", ...corsHeaders } });
}