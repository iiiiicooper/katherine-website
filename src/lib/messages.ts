import { ContactMessage } from "./types";

const STORAGE_KEY = "contact-messages-v1";

export function loadMessages(): ContactMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as ContactMessage[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveMessages(list: ContactMessage[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function addMessage(msg: Omit<ContactMessage, "id" | "createdAt" | "status">): ContactMessage {
  const entry: ContactMessage = {
    id: String(Date.now()),
    createdAt: new Date().toISOString(),
    ...msg,
    status: "unread",
  };
  const list = loadMessages();
  list.push(entry);
  saveMessages(list);
  return entry;
}

export function removeMessage(id: string): void {
  const list = loadMessages().filter((m) => m.id !== id);
  saveMessages(list);
}

export function clearMessages(): void {
  saveMessages([]);
}

export function setMessageStatus(id: string, status: "unread" | "replied"): void {
  const list = loadMessages().map((m) => (m.id === id ? { ...m, status } : m));
  saveMessages(list);
}

// 将服务端返回的完整留言写入/更新到本地存储，便于后台在无远端权限时也能显示
export function upsertMessage(msg: ContactMessage): void {
  const list = loadMessages();
  const idx = list.findIndex((m) => m.id === msg.id);
  if (idx >= 0) list[idx] = msg; else list.push(msg);
  saveMessages(list);
}

export function exportMessagesCSV(): string {
  const list = loadMessages();
  const header = ["id","name","email","content","preferredChannel","status","createdAt"].join(",");
  const rows = list.map((m) => [
    m.id,
    escapeCSV(m.name),
    m.email,
    escapeCSV(m.content),
    m.preferredChannel ?? "",
    m.status ?? "",
    m.createdAt,
  ].join(","));
  return [header, ...rows].join("\n");
}

function escapeCSV(text: string): string {
  const needsQuote = /[",\n]/.test(text);
  const escaped = text.replace(/"/g, '""');
  return needsQuote ? `"${escaped}"` : escaped;
}