import React from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { loadConfig, saveConfig, loadRemoteConfig } from "../../lib/config";
import { defaultConfig } from "../../lib/config";
import { ContactMessage } from "../../lib/types";
import { loadMessages as loadLocalMessages, removeMessage as removeLocalMessage, setMessageStatus as setLocalMessageStatus, addMessage as addLocalMessage, clearMessages as clearLocalMessages } from "../../lib/messages";

const ADMIN_LOCK_KEY = "admin-logged-in";
const DEV_PASSWORD = "admin"; // 本地开发默认密码；线上将改为后端校验

export const AdminHome = (): JSX.Element => {
  const [authed, setAuthed] = React.useState<boolean>(() => !!sessionStorage.getItem(ADMIN_LOCK_KEY));
  const [password, setPassword] = React.useState<string>("");

  const [cfg, setCfg] = React.useState(loadConfig());
  const [saving, setSaving] = React.useState(false);

  // Messages
  const [messages, setMessages] = React.useState<ContactMessage[]>([]);
  const [loadingMsgs, setLoadingMsgs] = React.useState(false);
  const [localRaw, setLocalRaw] = React.useState<string>("");

  const handleLogin = (e: React.FormEvent): void => {
    e.preventDefault();
    if (!password) return;
    // TODO: 线上改为调用 /api/auth/login
    if (password === DEV_PASSWORD) {
      sessionStorage.setItem(ADMIN_LOCK_KEY, "1");
      setAuthed(true);
    } else {
      alert("密码不正确（开发环境默认 admin）");
    }
  };

  const persistConfig = async (next: typeof cfg): Promise<void> => {
    setSaving(true);
    try {
      // 本地持久化
      saveConfig(next);
      setCfg(next);
      // 后端（存在则写入，不阻塞本地）
      try {
        await fetch("/api/config", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(next),
        });
      } catch {
        // ignore in dev
      }
    } finally {
      setSaving(false);
    }
  };

  const fetchMessages = async (): Promise<void> => {
    setLoadingMsgs(true);
    try {
      let remote: ContactMessage[] = [];
      try {
        const res = await fetch("/api/messages");
        if (res.ok) {
          const data = await res.json();
          if (data?.ok && Array.isArray(data.data)) remote = data.data as ContactMessage[];
        }
      } catch {
        // ignore remote errors
      }
      let local: ContactMessage[] = [];
      try {
        local = loadLocalMessages();
      } catch {
        // ignore local errors
      }
      const map = new Map<string, ContactMessage>();
      // 先放入本地，再覆盖为远端，保证远端为真值
      for (const m of [...local, ...remote]) {
        map.set(m.id, m);
      }
      const merged = Array.from(map.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMessages(merged);
      try { setLocalRaw(localStorage.getItem("contact-messages-v1") || ""); } catch {}
    } finally {
      setLoadingMsgs(false);
    }
  };

  React.useEffect(() => {
    if (authed) fetchMessages();
  }, [authed]);

  // 当窗口获得焦点或本地存储发生变化时，自动刷新留言列表
  React.useEffect(() => {
    if (!authed) return;
    const onFocus = () => { fetchMessages(); };
    const onStorage = (e: StorageEvent) => {
      if (e.key === "contact-messages-v1") fetchMessages();
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
    };
  }, [authed]);

  // 登录后拉取远端配置，确保管理后台显示现有页面数据
  React.useEffect(() => {
    if (!authed) return;
    (async () => {
      try {
        const remote = await loadRemoteConfig();
        const localNow = loadConfig();
        const isRemoteDefault = JSON.stringify(remote) === JSON.stringify(defaultConfig);
        // 仅当远端不是默认值且与本地不同，才覆盖本地
        if (!isRemoteDefault && JSON.stringify(remote) !== JSON.stringify(localNow)) {
          setCfg(remote);
          try { saveConfig(remote); } catch {}
        }
      } catch {
        // ignore
      }
    })();
  }, [authed]);

  // 简易轮询：Admin 打开后短时间内周期刷新，避免 SPA 导航导致数据未拉取
  React.useEffect(() => {
    if (!authed) return;
    let count = 0;
    const timer = setInterval(() => {
      count++;
      fetchMessages();
      if (count >= 10) clearInterval(timer); // 约 20 秒
    }, 2000);
    return () => clearInterval(timer);
  }, [authed]);

  if (!authed) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-white px-4">
        <Card className="w-full max-w-[420px]">
          <CardHeader>
            <CardTitle>管理后台登录</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                className="w-full h-10 border rounded px-3"
                placeholder="输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button type="submit" className="w-full">登录</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-white px-4 sm:px-6 md:px-10 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* 首页自我介绍 */}
        <Card>
          <CardHeader>
            <CardTitle>首页自我介绍</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              className="w-full h-10 border rounded px-3"
              placeholder="标题"
              value={cfg.about.title}
              onChange={(e) => setCfg({ ...cfg, about: { ...cfg.about, title: e.target.value } })}
            />
            <textarea
              className="w-full min-h-28 border rounded px-3 py-2"
              placeholder="自我介绍文案"
              value={cfg.about.intro}
              onChange={(e) => setCfg({ ...cfg, about: { ...cfg.about, intro: e.target.value } })}
            />
            <div className="flex gap-2">
              <Button disabled={saving} onClick={() => persistConfig(cfg)}>保存</Button>
            </div>
          </CardContent>
        </Card>

        {/* 简历上传 */}
        <Card>
          <CardHeader>
            <CardTitle>简历上传（≤10MB）</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              type="file"
              accept=".pdf,.doc,.docx,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 10 * 1024 * 1024) {
                  alert("文件超过 10MB 限制");
                  return;
                }
                // 优先调用后端上传，若返回占位链接则改用 base64
                let useBase64 = true;
                try {
                  const fd = new FormData();
                  fd.append("file", file);
                  fd.append("prefix", "resume/");
                  const res = await fetch("/api/upload", { method: "POST", body: fd });
                  if (res.ok) {
                    const data = await res.json();
                    const url = data?.url as string | undefined;
                    // 若为开发占位图（/screen.png），则不使用该 URL
                    if (url && !/\/screen\.png$/.test(url)) {
                      const next = { ...cfg, resume: { ...cfg.resume, fileUrl: url, fileName: file.name, uploadedAt: new Date().toISOString() } } as typeof cfg;
                      setCfg(next);
                      useBase64 = false;
                    }
                  }
                } catch {
                  // 网络异常时改用 base64
                }
                if (useBase64) {
                  const b64 = await fileToDataURL(file);
                  const next = { ...cfg, resume: { ...cfg.resume, fileDataUrl: b64, fileName: file.name, uploadedAt: new Date().toISOString() } } as typeof cfg;
                  setCfg(next);
                }
              }}
            />
            <div>
              {(() => {
                const resumeUrl = cfg.resume.fileUrl || cfg.resume.fileDataUrl || "#";
                const rawName = cfg.resume.fileName || (() => {
                  try {
                    const u = new URL(resumeUrl, window.location.origin);
                    const seg = u.pathname.split("/").filter(Boolean);
                    return seg[seg.length - 1] || "CV";
                  } catch {
                    return "CV";
                  }
                })();
                const sanitize = (name: string): string => {
                  const cleaned = name.replace(/^[0-9]{8,}[-_]/, "");
                  const lastDot = cleaned.lastIndexOf(".");
                  let base = lastDot > 0 ? cleaned.slice(0, lastDot) : cleaned;
                  const ext = lastDot > 0 ? cleaned.slice(lastDot) : "";
                  let base2 = base.replace(/-[0-9]{8,}$/, "");
                  if (/^\.pdf$/i.test(ext)) {
                    base2 = base2.replace(/\.(png|jpg|jpeg|webp|gif)$/i, "");
                  }
                  const base3 = base2.replace(/\s+/g, " ").trim();
                  return `${base3 || "My CV"}${ext || ""}`;
                };
                const friendlyName = sanitize(rawName);
                return (
                  <a href={resumeUrl} download={friendlyName} className="underline">当前下载链接</a>
                );
              })()}
            </div>
            <div className="text-sm text-gray-600">
              <div>当前文件名：{cfg.resume.fileName || "(未保存)"}</div>
              <div>上传日期：{cfg.resume.uploadedAt ? new Date(cfg.resume.uploadedAt).toLocaleString() : "(未保存)"}</div>
            </div>
            <div className="flex gap-2">
              <Button disabled={saving} onClick={() => persistConfig(cfg)}>保存简历</Button>
            </div>
          </CardContent>
        </Card>

        {/* 联系方式管理 */}
        <Card>
          <CardHeader>
            <CardTitle>Contact 管理</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              className="w-full h-10 border rounded px-3"
              placeholder="邮箱"
              value={cfg.contact.email}
              onChange={(e) => setCfg({ ...cfg, contact: { ...cfg.contact, email: e.target.value } })}
            />
            <input
              className="w-full h-10 border rounded px-3"
              placeholder="电话"
              value={cfg.contact.phone}
              onChange={(e) => setCfg({ ...cfg, contact: { ...cfg.contact, phone: e.target.value } })}
            />
            <input
              className="w-full h-10 border rounded px-3"
              placeholder="LinkedIn"
              value={cfg.contact.linkedin}
              onChange={(e) => setCfg({ ...cfg, contact: { ...cfg.contact, linkedin: e.target.value } })}
            />
            <Button disabled={saving} onClick={() => persistConfig(cfg)}>保存</Button>
          </CardContent>
        </Card>


        {/* 留言管理（通过现有 API） */}
        <Card>
          <CardHeader>
            <CardTitle>用户留言管理</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Button onClick={fetchMessages} disabled={loadingMsgs}>刷新列表</Button>
              <Button variant="outline" onClick={() => exportMessagesCSVClient(messages)}>导出 CSV</Button>
              <Button variant="secondary" onClick={() => { addLocalMessage({ name: "Test", email: "test@example.com", content: "Hello" }); fetchMessages(); }}>写入测试留言</Button>
              <Button variant="destructive" onClick={() => { clearLocalMessages(); fetchMessages(); }}>清空本地留言</Button>
            </div>
            {messages.length === 0 ? (
              <div className="text-sm text-gray-500">暂无留言</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border">
                  <thead className="bg-gray-50">
                    <tr className="text-left">
                      <th className="px-3 py-2 border-b">时间</th>
                      <th className="px-3 py-2 border-b">姓名</th>
                      <th className="px-3 py-2 border-b">邮箱</th>
                      <th className="px-3 py-2 border-b">内容</th>
                      <th className="px-3 py-2 border-b">状态</th>
                      <th className="px-3 py-2 border-b">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {messages.map((m) => (
                      <tr key={m.id} className="align-top">
                        <td className="px-3 py-2 border-b whitespace-nowrap text-gray-600">{new Date(m.createdAt).toLocaleString()}</td>
                        <td className="px-3 py-2 border-b">{m.name}</td>
                        <td className="px-3 py-2 border-b break-all">{m.email}</td>
                        <td className="px-3 py-2 border-b whitespace-pre-wrap break-words">{m.content}</td>
                        <td className="px-3 py-2 border-b">{m.status ?? "unread"}</td>
                        <td className="px-3 py-2 border-b">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => updateMessage(m.id, { status: "replied" })}>标记已回复</Button>
                            <Button variant="destructive" size="sm" onClick={() => deleteMessage(m.id)}>删除</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="text-xs text-gray-400 mt-2">
              调试：localStorage[contact-messages-v1] 长度 {localRaw ? localRaw.length : 0}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );


  async function updateMessage(id: string, patch: Partial<ContactMessage>): Promise<void> {
    try {
      const res = await fetch(`/api/messages?id=${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        try {
          if (patch.status) setLocalMessageStatus(id, patch.status as any);
        } catch {}
        await fetchMessages();
        return;
      }
    } catch {
      // ignore
    }
    // 本地回退：仅支持状态更新
    if (patch.status) {
      try { setLocalMessageStatus(id, patch.status as any); } catch {}
    }
    await fetchMessages();
  }

  async function deleteMessage(id: string): Promise<void> {
    try {
      const res = await fetch(`/api/messages?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) {
        // 远端删除成功后同时清理本地副本，避免合并时残留
        try { removeLocalMessage(id); } catch {}
        await fetchMessages();
        return;
      }
    } catch {
      // ignore
    }
    // 本地回退：删除本地留言
    try { removeLocalMessage(id); } catch {}
    await fetchMessages();
  }

};


async function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}


function escapeCSV(text: string): string {
  const needsQuote = /[",\n]/.test(text);
  const escaped = text.replace(/"/g, '""');
  return needsQuote ? `"${escaped}"` : escaped;
}

function exportMessagesCSVClient(list: ContactMessage[]): void {
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
  const csv = [header, ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `messages_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}