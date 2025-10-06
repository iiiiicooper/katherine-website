import React from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { loadConfig, saveConfig, loadRemoteConfig } from "../../lib/config";
import { ContactMessage } from "../../lib/types";
import { loadMessages as loadLocalMessages, removeMessage as removeLocalMessage, setMessageStatus as setLocalMessageStatus } from "../../lib/messages";

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
      for (const m of [...remote, ...local]) {
        map.set(m.id, m);
      }
      const merged = Array.from(map.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setMessages(merged);
    } finally {
      setLoadingMsgs(false);
    }
  };

  React.useEffect(() => {
    if (authed) fetchMessages();
  }, [authed]);

  // 登录后拉取远端配置，确保管理后台显示现有页面数据
  React.useEffect(() => {
    if (!authed) return;
    (async () => {
      try {
        const remote = await loadRemoteConfig();
        setCfg(remote);
        try { saveConfig(remote); } catch {}
      } catch {
        // ignore
      }
    })();
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
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 10 * 1024 * 1024) {
                  alert("文件超过 10MB 限制");
                  return;
                }
                const b64 = await fileToDataURL(file);
                const next = { ...cfg, resume: { fileDataUrl: b64 } };
                await persistConfig(next);
              }}
            />
            <div>
              <a href={cfg.resume.fileDataUrl || "#"} download className="underline">当前下载链接</a>
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