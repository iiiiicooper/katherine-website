export const runtime = "nodejs";

// Avoid importing frontend modules into Edge runtime; define a minimal default here
const DEFAULT_CONFIG = {
  about: {
    title: "Hi, I'm Katherine Fang.",
    intro:
      "UI/UX and Product Designer based in New York City, graduating from NYU in 2026. I focus on designing AI and FinTech products that bridge user needs with market opportunities, creating seamless experiences that drive real business impact.",
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
    // Provide default Google Forms config so production works without manual Admin setup
    googleForm: {
      endpoint: "https://docs.google.com/forms/d/e/1FAIpQLSczsJb70xRpdkBGYjG5Wrt37yIIb-wBAVnWMNSQ11ttjCjWwA/formResponse",
      entries: {
        // name entry from provided prefilled link
        name: "entry.1875613538",
        email: "entry.943448880",
        content: "entry.892292611",
      },
    },
  },
  resume: {},
};

import { put, list } from "@vercel/blob";
const token: string | undefined =
  (globalThis as any)?.process?.env?.BLOB_READ_WRITE_TOKEN ?? (globalThis as any)?.BLOB_READ_WRITE_TOKEN;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,PUT,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

async function putJsonPublic(path: string, json: string) {
  return put(path, json, {
    contentType: "application/json",
    access: "public" as any,
    addRandomSuffix: false,
    token,
  } as any);
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    if (req.method === "GET") {
      try {
        const res = await list({ prefix: "config/current.json", token } as any);
        const url = res?.blobs?.[0]?.url;
        if (url) {
          const r = await fetch(url);
          if (r.ok) {
            const cfg = await r.json();
            return jsonResponse({ ok: true, data: cfg });
          }
        }
      } catch {}
      // fallback to default when not found
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
        await putJsonPublic("config/current.json", bodyText);
        const ts = Date.now();
        await putJsonPublic(`config/${ts}.json`, bodyText);
      } catch {
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