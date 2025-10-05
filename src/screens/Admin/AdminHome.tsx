import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { AppConfig, ProjectItem, ContactMessage, Asset, CopyBlock } from "../../lib/types";
import { loadConfig, saveConfig, exportConfig, importConfigFromFile, resetConfig } from "../../lib/config";
import { loadMessages, clearMessages, removeMessage, exportMessagesCSV, setMessageStatus } from "../../lib/messages";

type TabKey = "dashboard" | "projects" | "about_resume" | "contact" | "assets" | "settings";

export const AdminHome = (): JSX.Element => {
  const ADMIN_AUTH_KEY = "admin-auth-v1";
  const ENV_TOKEN = (import.meta as any).env?.VITE_ADMIN_TOKEN as string | undefined;
  const [authed, setAuthed] = React.useState<boolean>(() => {
    try {
      return localStorage.getItem(ADMIN_AUTH_KEY) === "true";
    } catch {
      return false;
    }
  });
  const [tokenInput, setTokenInput] = React.useState("");
  const [loginMsg, setLoginMsg] = React.useState<string>("");

  const [tab, setTab] = React.useState<TabKey>("dashboard");
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);
  const [selectedProjectIds, setSelectedProjectIds] = React.useState<string[]>([]);
  const [search, setSearch] = React.useState<string>("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "unread" | "replied">("all");
  // Projects filters
  const [projStatusFilter, setProjStatusFilter] = React.useState<"all" | "draft" | "published" | "archived">("all");
  const [projTagFilter, setProjTagFilter] = React.useState<string>("all");
  const [activeProjectId, setActiveProjectId] = React.useState<string | null>(null);
  const [cfg, setCfg] = React.useState<AppConfig>(() => loadConfig());
  const [saved, setSaved] = React.useState<string>("");
  const [messages, setMessages] = React.useState<ContactMessage[]>(() => loadMessages());

  const allProjectTags = React.useMemo(() => {
    const set = new Set<string>();
    cfg.projects.forEach((p) => (p.tags ?? []).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [cfg.projects]);

  const slugify = (s: string): string => (
    s
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  );

  const filteredProjects = React.useMemo(() => {
    const term = search.trim().toLowerCase();
    return cfg.projects.filter((p) => {
      if (projStatusFilter !== "all") {
        if ((p.status ?? "draft") !== projStatusFilter) return false;
      }
      if (projTagFilter !== "all") {
        if (!((p.tags ?? []).includes(projTagFilter))) return false;
      }
      if (!term) return true;
      const tags = (p.tags ?? []).join(",").toLowerCase();
      return p.title.toLowerCase().includes(term) || tags.includes(term);
    });
  }, [cfg.projects, search, projStatusFilter, projTagFilter]);

  // 确保右侧详情默认选中一个项目（避免空白）
  React.useEffect(() => {
    // 如果当前未选中或选中项不在过滤结果中，默认选中第一个
    const exists = filteredProjects.some((p) => p.id === activeProjectId);
    if (!exists && filteredProjects.length > 0) {
      setActiveProjectId(filteredProjects[0].id);
    }
  }, [activeProjectId, filteredProjects]);

  const handleLogin = (): void => {
    const expected = ENV_TOKEN ?? "dev"; // 本地开发允许使用 "dev" 作为默认口令
    if (!tokenInput.trim()) {
      setLoginMsg("请输入访问口令");
      return;
    }
    if (tokenInput.trim() === expected) {
      try {
        localStorage.setItem(ADMIN_AUTH_KEY, "true");
      } catch {
        // ignore
      }
      setAuthed(true);
      setLoginMsg("");
    } else {
      setLoginMsg("口令不正确");
    }
  };

  const handleLogout = (): void => {
    try {
      localStorage.removeItem(ADMIN_AUTH_KEY);
    } catch {
      // ignore
    }
    setAuthed(false);
  };

  const handleSave = (): void => {
    saveConfig(cfg);
    setSaved("已保存配置");
    setTimeout(() => setSaved(""), 1500);
  };

  // 保存当前选中项目为草稿，并持久化
  const saveActiveProjectAsDraft = (): void => {
    const i = cfg.projects.findIndex((x) => x.id === activeProjectId);
    if (i < 0) {
      setSaved("请选择项目");
      setTimeout(() => setSaved(""), 1200);
      return;
    }
    setCfg((prev) => {
      const next = { ...prev };
      next.projects = [...prev.projects];
      next.projects[i] = { ...prev.projects[i], status: "draft" } as ProjectItem;
      saveConfig(next);
      return next;
    });
    setSaved("已保存草稿");
    setTimeout(() => setSaved(""), 1500);
  };

  const handleExport = (): void => {
    const data = exportConfig();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "app-config.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file: File): Promise<void> => {
    const imported = await importConfigFromFile(file);
    setCfg(imported);
    setSaved("已导入配置");
    setTimeout(() => setSaved(""), 1500);
  };

  const updateProjectPreview = (index: number, file: File): void => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxW = 600;
        const scale = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const previewSrc = canvas.toDataURL("image/jpeg", 0.85);
          setCfg((prev) => {
            const next = { ...prev };
            next.projects = [...prev.projects];
            next.projects[index] = { ...prev.projects[index], previewSrc };
            return next;
          });
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const addProjectAssetFromFile = (pIndex: number, file: File): void => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxW = 600;
        const scale = Math.min(1, maxW / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        let thumbSrc: string | undefined = undefined;
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          thumbSrc = canvas.toDataURL("image/jpeg", 0.85);
        }
        const src = String(reader.result);
        const asset: Asset = {
          id: `a${Date.now()}`,
          type: "image",
          src,
          thumbSrc,
          alt: "",
        };
        setCfg((prev) => {
          const next = { ...prev };
          const proj = { ...next.projects[pIndex] };
          proj.assets = [...(proj.assets ?? []), asset];
          next.projects = [...prev.projects];
          next.projects[pIndex] = proj;
          return next;
        });
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const addProjectAssetByUrl = (pIndex: number, url: string): void => {
    const asset: Asset = { id: `a${Date.now()}`, type: "image", src: url, alt: "" };
    setCfg((prev) => {
      const next = { ...prev };
      const proj = { ...next.projects[pIndex] };
      proj.assets = [...(proj.assets ?? []), asset];
      next.projects = [...prev.projects];
      next.projects[pIndex] = proj;
      return next;
    });
  };

  const moveAsset = (pIndex: number, from: number, to: number): void => {
    setCfg((prev) => {
      const proj = prev.projects[pIndex];
      const arr = [...(proj.assets ?? [])];
      if (to < 0 || to >= arr.length || from === to) return prev;
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      const next = { ...prev };
      next.projects = [...prev.projects];
      next.projects[pIndex] = { ...proj, assets: arr };
      return next;
    });
  };

  const removeAsset = (pIndex: number, aIndex: number): void => {
    setCfg((prev) => {
      const proj = prev.projects[pIndex];
      const arr = (proj.assets ?? []).filter((_, i) => i !== aIndex);
      const next = { ...prev };
      next.projects = [...prev.projects];
      next.projects[pIndex] = { ...proj, assets: arr };
      return next;
    });
  };

  const addCopyBlock = (pIndex: number, kind: CopyBlock["kind"]): void => {
    const block: CopyBlock = { id: `c${Date.now()}`, kind, text: "" };
    setCfg((prev) => {
      const proj = prev.projects[pIndex];
      const arr = [...(proj.copyBlocks ?? []), block];
      const next = { ...prev };
      next.projects = [...prev.projects];
      next.projects[pIndex] = { ...proj, copyBlocks: arr };
      return next;
    });
  };

  const moveCopyBlock = (pIndex: number, from: number, to: number): void => {
    setCfg((prev) => {
      const proj = prev.projects[pIndex];
      const arr = [...(proj.copyBlocks ?? [])];
      if (to < 0 || to >= arr.length || from === to) return prev;
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      const next = { ...prev };
      next.projects = [...prev.projects];
      next.projects[pIndex] = { ...proj, copyBlocks: arr };
      return next;
    });
  };

  const removeCopyBlock = (pIndex: number, cIndex: number): void => {
    setCfg((prev) => {
      const proj = prev.projects[pIndex];
      const arr = (proj.copyBlocks ?? []).filter((_, i) => i !== cIndex);
      const next = { ...prev };
      next.projects = [...prev.projects];
      next.projects[pIndex] = { ...proj, copyBlocks: arr };
      return next;
    });
  };

  const addProject = (): void => {
    const item: ProjectItem = {
      id: `p${Date.now()}`,
      title: "New Project",
      previewSrc: "",
      alt: "New Project",
    };
    setCfg((prev) => ({ ...prev, projects: [...prev.projects, item] }));
    setActiveProjectId(item.id);
  };

  const removeProject = (index: number): void => {
    setCfg((prev) => {
      const next = { ...prev };
      next.projects = prev.projects.filter((_, i) => i !== index);
      return next;
    });
  };

  const moveProject = (from: number, to: number): void => {
    setCfg((prev) => {
      const length = prev.projects.length;
      if (to < 0 || to >= length || from === to) return prev;
      const next = { ...prev };
      const arr = [...prev.projects];
      const [item] = arr.splice(from, 1);
      arr.splice(to, 0, item);
      next.projects = arr;
      return next;
    });
  };

  const moveUp = (index: number): void => moveProject(index, index - 1);
  const moveDown = (index: number): void => moveProject(index, index + 1);
  const onDragStart = (index: number): void => setDragIndex(index);
  const onDragOver = (e: React.DragEvent<HTMLDivElement>, index: number): void => {
    e.preventDefault();
  };
  const onDrop = (index: number): void => {
    if (dragIndex === null || dragIndex === index) return;
    moveProject(dragIndex, index);
    setDragIndex(null);
  };
  const toggleProjectSelection = (id: string): void => {
    setSelectedProjectIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };
  const applyBatchEdit = (changes: Partial<ProjectItem>): void => {
    setCfg((prev) => {
      const next = { ...prev };
      next.projects = prev.projects.map((p) => selectedProjectIds.includes(p.id) ? { ...p, ...changes } : p);
      return next;
    });
  };

  const removeSelectedProjects = (): void => {
    setCfg((prev) => {
      const next = { ...prev };
      next.projects = prev.projects.filter((p) => !selectedProjectIds.includes(p.id));
      return next;
    });
    setSelectedProjectIds([]);
  };

  const resetAll = (): void => {
    const d = resetConfig();
    setCfg(d);
    setSaved("已重置为默认配置");
    setTimeout(() => setSaved(""), 1500);
  };

  const handleRemoveMessage = (id: string): void => {
    removeMessage(id);
    setMessages(loadMessages());
  };

  const handleClearMessages = (): void => {
    clearMessages();
    setMessages([]);
  };

  const handleExportMessages = (): void => {
    const csv = exportMessagesCSV();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "contact-messages.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const setStatus = async (id: string, status: "unread" | "replied"): Promise<void> => {
    try {
      const res = await fetch(`/api/messages?id=${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
        return;
      }
    } catch {
      // ignore
    }
    // 回退本地
    setMessageStatus(id, status);
    setMessages(loadMessages());
  };

  if (!authed) {
    return (
      <div className="w-full min-h-screen bg-white px-4 md:px-10 py-10">
        <h1 className="text-3xl font-bold mb-6">管理员登录</h1>
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>访问口令</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              className="w-full border rounded px-3 py-2"
              type="password"
              placeholder={ENV_TOKEN ? "请输入配置的管理员口令" : "开发模式默认口令为 dev"}
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
            />
            <div className="flex items-center gap-3">
              {loginMsg && <span className="text-sm text-muted-foreground">{loginMsg}</span>}
              <Button className="ml-auto" onClick={handleLogin}>登录</Button>
            </div>
            {!ENV_TOKEN && (
              <div className="text-sm text-muted-foreground">
                尚未配置环境变量 <code>VITE_ADMIN_TOKEN</code>。在 Vercel 项目环境变量中设置后，将以该口令校验。
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-white px-4 md:px-10 py-10">
      <div className="flex items-center mb-6">
        <h1 className="text-3xl font-bold">管理后台</h1>
        <Button variant="outline" className="ml-auto" onClick={handleLogout}>退出登录</Button>
      </div>

      <div className="flex gap-2 mb-6">
        {(
          [
            { key: "dashboard", label: "Dashboard" },
            { key: "projects", label: "Projects" },
            { key: "about_resume", label: "About & Resume" },
            { key: "contact", label: "Contact" },
            { key: "assets", label: "Assets" },
            { key: "settings", label: "Settings" },
          ] as Array<{ key: TabKey; label: string }>
        ).map((t) => (
          <Button
            key={t.key}
            variant={tab === t.key ? "secondary" : "outline"}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-2 mb-6">
        <Button onClick={handleSave}>保存</Button>
        <Button variant="outline" onClick={handleExport}>导出 JSON</Button>
        <label className="inline-flex items-center gap-2">
          <input
            type="file"
            accept="application/json"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImport(file);
            }}
          />
          <span className="text-sm text-muted-foreground">导入 JSON</span>
        </label>
        <Button variant="destructive" onClick={resetAll}>重置默认</Button>
        {saved && <span className="text-sm text-muted-foreground">{saved}</span>}
      </div>

      {tab === "dashboard" && (
        <Card className="max-w-5xl">
          <CardHeader>
            <CardTitle>概览</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="border rounded p-3">
                <div className="text-sm text-muted-foreground">项目数量</div>
                <div className="text-2xl font-bold">{cfg.projects.length}</div>
              </div>
              <div className="border rounded p-3">
                <div className="text-sm text-muted-foreground">未读留言</div>
                <div className="text-2xl font-bold">{messages.filter((m) => (m.status ?? "unread") === "unread").length}</div>
              </div>
              <div className="border rounded p-3">
                <div className="text-sm text-muted-foreground">总留言</div>
                <div className="text-2xl font-bold">{messages.length}</div>
              </div>
            </div>
            <div>
              <div className="font-medium mb-2">最新留言</div>
              {messages.length === 0 ? (
                <div className="text-sm text-muted-foreground">暂无数据</div>
              ) : (
                <ul className="space-y-2">
                  {messages.slice(0, 3).map((m) => (
                    <li key={m.id} className="border rounded p-2">
                      <div className="text-sm">{new Date(m.createdAt).toLocaleString()} · {m.name} · {m.email}</div>
                      <div className="text-sm text-muted-foreground truncate">{m.content}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "about_resume" && (
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>About & Resume</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm mb-1">标题</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={cfg.about.title}
                onChange={(e) => setCfg({ ...cfg, about: { ...cfg.about, title: e.target.value } })}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">简介</label>
              <textarea
                className="w-full border rounded px-3 py-2"
                rows={4}
                value={cfg.about.intro}
                onChange={(e) => setCfg({ ...cfg, about: { ...cfg.about, intro: e.target.value } })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">头像 URL</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="https://.../avatar.jpg"
                  value={cfg.about.avatarUrl ?? ""}
                  onChange={(e) => setCfg({ ...cfg, about: { ...cfg.about, avatarUrl: e.target.value } })}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">封面 URL</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="https://.../cover.jpg"
                  value={cfg.about.coverUrl ?? ""}
                  onChange={(e) => setCfg({ ...cfg, about: { ...cfg.about, coverUrl: e.target.value } })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">简历 URL</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="https://.../resume.pdf 或 /resume.pdf"
                  value={cfg.resume.url ?? ""}
                  onChange={(e) => setCfg({ ...cfg, resume: { ...cfg.resume, url: e.target.value } })}
                />
              </div>
              <div>
                <label className="block text-sm mb-1">简历版本号</label>
                <input
                  className="w-full border rounded px-3 py-2"
                  placeholder="v1.0.0"
                  value={cfg.resume.version ?? ""}
                  onChange={(e) => setCfg({ ...cfg, resume: { ...cfg.resume, version: e.target.value } })}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "projects" && (
        <Card className="max-w-7xl w-full">
          <CardHeader>
            <CardTitle>Projects 管理</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 顶部工具栏 */}
              <div className="flex items-center gap-2">
                <input
                  className="border rounded px-2 py-1 flex-1"
                  placeholder="搜索标题或标签"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select
                  className="border rounded px-2 py-1"
                  value={projStatusFilter}
                  onChange={(e) => setProjStatusFilter(e.target.value as any)}
                >
                  <option value="all">全部状态</option>
                  <option value="draft">草稿</option>
                  <option value="published">已发布</option>
                  <option value="archived">已归档</option>
                </select>
                <select
                  className="border rounded px-2 py-1"
                  value={projTagFilter}
                  onChange={(e) => setProjTagFilter(e.target.value)}
                >
                  <option value="all">全部标签</option>
                  {allProjectTags.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <Button onClick={addProject}>新增项目</Button>
              </div>

              {/* 两栏布局：左列表 + 右详情 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 左侧项目列表 */}
                <div className="border rounded overflow-y-auto max-h-[70vh]">
                  {filteredProjects.map((p) => {
                    const i = cfg.projects.findIndex((x) => x.id === p.id);
                    const active = activeProjectId === p.id;
                    return (
                      <div
                        key={p.id}
                        className={`flex items-center gap-2 px-3 py-2 border-b cursor-pointer ${active ? "bg-blue-50" : "bg-white"}`}
                        draggable
                        onDragStart={() => onDragStart(i)}
                        onDragOver={(e) => onDragOver(e, i)}
                        onDrop={() => onDrop(i)}
                        onClick={() => setActiveProjectId(p.id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedProjectIds.includes(p.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleProjectSelection(p.id);
                          }}
                        />
                        {p.previewSrc && (
                          <img src={p.previewSrc} alt={p.alt ?? p.title} className="w-10 h-10 object-cover rounded" />
                        )}
                        <div className="flex-1">
                          <div className="text-sm font-medium truncate">{p.title}</div>
                          <div className="text-xs text-muted-foreground truncate">{(p.tags ?? []).join(", ")}</div>
                        </div>
                        <span className="text-xs border rounded px-2 py-0.5">
                          {p.status ?? "draft"}
                        </span>
                        <Button
                          variant="ghost"
                          onClick={(e) => { e.stopPropagation(); removeProject(i); }}
                        >删除</Button>
                      </div>
                    );
                  })}
                  {filteredProjects.length === 0 && (
                    <div className="p-4 text-sm text-muted-foreground">无匹配项目</div>
                  )}
                </div>

                {/* 右侧详情编辑器 */}
                <div>
                  {(() => {
                    const i = cfg.projects.findIndex((x) => x.id === activeProjectId);
                    if (i < 0) return (
                      <div className="border rounded p-6 text-sm text-muted-foreground">请选择左侧项目进行编辑</div>
                    );
                    const p = cfg.projects[i];
                    return (
                      <div className="border rounded p-3 flex flex-col gap-3">
                        <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap">
                          <input
                            className="border rounded px-2 py-1 flex-1"
                            value={p.title}
                            onChange={(e) => {
                              const title = e.target.value;
                              setCfg((prev) => {
                                const next = { ...prev };
                                next.projects = [...prev.projects];
                                next.projects[i] = { ...prev.projects[i], title };
                                return next;
                              });
                            }}
                          />
                          <Button variant="destructive" onClick={() => removeProject(i)}>删除</Button>
                          <Button variant="secondary" onClick={saveActiveProjectAsDraft}>保存草稿</Button>
                          <Button onClick={handleSave}>保存</Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            className="border rounded px-2 py-1 flex-1"
                            placeholder="slug（用于 URL）"
                            value={p.slug ?? ""}
                            onChange={(e) => {
                              const slug = e.target.value;
                              setCfg((prev) => {
                                const next = { ...prev };
                                next.projects = [...prev.projects];
                                next.projects[i] = { ...prev.projects[i], slug };
                                return next;
                              });
                            }}
                          />
                          <Button
                            variant="outline"
                            onClick={() => {
                              const slug = slugify(p.title);
                              setCfg((prev) => {
                                const next = { ...prev };
                                next.projects = [...prev.projects];
                                next.projects[i] = { ...prev.projects[i], slug };
                                return next;
                              });
                            }}
                          >从标题生成</Button>
                          <select
                            className="border rounded px-2 py-1"
                            value={p.status ?? "draft"}
                            onChange={(e) => {
                              const status = e.target.value as ProjectItem["status"];
                              setCfg((prev) => {
                                const next = { ...prev };
                                next.projects = [...prev.projects];
                                next.projects[i] = { ...prev.projects[i], status } as ProjectItem;
                                return next;
                              });
                            }}
                          >
                            <option value="draft">草稿</option>
                            <option value="published">已发布</option>
                            <option value="archived">已归档</option>
                          </select>
                          {Boolean(p.slug) && cfg.projects.some((x, idx) => idx !== i && (x.slug ?? "") === (p.slug ?? "")) && (
                            <span className="text-xs text-red-600">Slug 重复</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            className="border rounded px-2 py-1 flex-1"
                            placeholder="简短描述"
                            value={p.shortDesc ?? ""}
                            onChange={(e) => {
                              const shortDesc = e.target.value;
                              setCfg((prev) => {
                                const next = { ...prev };
                                next.projects = [...prev.projects];
                                next.projects[i] = { ...prev.projects[i], shortDesc };
                                return next;
                              });
                            }}
                          />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          <div className="border rounded p-2 min-w-0 overflow-hidden">
                            <div className="font-medium mb-2">Assets（图片/视频）</div>
                            <div className="space-y-2">
                              {(p.assets ?? []).map((a, ai) => (
                                <div key={a.id} className="border rounded p-2 space-y-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <input
                                      className="border rounded px-2 py-1 flex-1"
                                      placeholder="资源 URL 或 Data URL"
                                      value={a.src}
                                      onChange={(e) => {
                                        const src = e.target.value;
                                        setCfg((prev) => {
                                          const next = { ...prev };
                                          const proj = { ...next.projects[i] };
                                          const arr = [...(proj.assets ?? [])];
                                          arr[ai] = { ...arr[ai], src };
                                          proj.assets = arr;
                                          next.projects = [...prev.projects];
                                          next.projects[i] = proj;
                                          return next;
                                        });
                                      }}
                                    />
                                    <Button variant="outline" onClick={() => moveAsset(i, ai, ai - 1)} disabled={ai === 0}>上移</Button>
                                    <Button variant="outline" onClick={() => moveAsset(i, ai, ai + 1)} disabled={ai === (p.assets ?? []).length - 1}>下移</Button>
                                    <Button variant="destructive" onClick={() => removeAsset(i, ai)}>删除</Button>
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <input
                                      className="border rounded px-2 py-1 flex-1"
                                      placeholder="Alt 文本"
                                      value={a.alt ?? ""}
                                      onChange={(e) => {
                                        const alt = e.target.value;
                                        setCfg((prev) => {
                                          const next = { ...prev };
                                          const proj = { ...next.projects[i] };
                                          const arr = [...(proj.assets ?? [])];
                                          arr[ai] = { ...arr[ai], alt };
                                          proj.assets = arr;
                                          next.projects = [...prev.projects];
                                          next.projects[i] = proj;
                                          return next;
                                        });
                                      }}
                                    />
                                    <label className="inline-flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        checked={a.isCover ?? false}
                                        onChange={(e) => {
                                          const isCover = e.target.checked;
                                          setCfg((prev) => {
                                            const next = { ...prev };
                                            const proj = { ...next.projects[i] };
                                            const arr = (proj.assets ?? []).map((x, idx) => ({ ...x, isCover: idx === ai ? isCover : false }));
                                            proj.assets = arr;
                                            next.projects = [...prev.projects];
                                            next.projects[i] = proj;
                                            return next;
                                          });
                                        }}
                                      />
                                      <span className="text-sm">设为封面</span>
                                    </label>
                                  </div>
                                  {a.thumbSrc && (
                                    <img src={a.thumbSrc} alt={a.alt ?? p.title} className="w-32 h-24 object-cover rounded" />
                                  )}
                                </div>
                              ))}
                              <div className="flex items-center gap-2 flex-wrap md:flex-nowrap">
                                <label className="inline-flex items-center gap-2">
                                  <input type="file" accept="image/*" onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) addProjectAssetFromFile(i, file);
                                  }} />
                                  <span className="text-sm text-muted-foreground">上传图片到 Assets</span>
                                </label>
                                <input
                                  className="border rounded px-2 py-1 w-full"
                                  placeholder="粘贴图片 URL 后回车添加"
                                  onKeyDown={(e) => {
                                    const v = (e.target as HTMLInputElement).value.trim();
                                    if (e.key === "Enter" && v) {
                                      addProjectAssetByUrl(i, v);
                                      (e.target as HTMLInputElement).value = "";
                                    }
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                          <div className="border rounded p-2 min-w-0 overflow-hidden">
                            <div className="font-medium mb-2">Content 文案块</div>
                            <div className="space-y-2">
                              {(p.copyBlocks ?? []).map((c, ci) => (
                                <div key={c.id} className="border rounded p-2 space-y-2">
                                  <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap">
                                    <select
                                      className="border rounded px-2 py-1 bg-white"
                                      value={c.kind}
                                      onChange={(e) => {
                                        const kind = e.target.value as CopyBlock["kind"];
                                        setCfg((prev) => {
                                          const next = { ...prev };
                                          const proj = { ...next.projects[i] };
                                          const arr = [...(proj.copyBlocks ?? [])];
                                          arr[ci] = { ...arr[ci], kind };
                                          proj.copyBlocks = arr;
                                          next.projects = [...prev.projects];
                                          next.projects[i] = proj;
                                          return next;
                                        });
                                      }}
                                    >
                                      <option value="heading">Heading</option>
                                      <option value="paragraph">Paragraph</option>
                                      <option value="list">List</option>
                                      <option value="quote">Quote</option>
                                      <option value="cta">CTA</option>
                                    </select>
                                    <Button variant="outline" onClick={() => moveCopyBlock(i, ci, ci - 1)} disabled={ci === 0}>上移</Button>
                                    <Button variant="outline" onClick={() => moveCopyBlock(i, ci, ci + 1)} disabled={ci === (p.copyBlocks ?? []).length - 1}>下移</Button>
                                    <Button variant="destructive" onClick={() => removeCopyBlock(i, ci)}>删除</Button>
                                  </div>
                                  <textarea
                                    className="border rounded px-2 py-1 w-full"
                                    rows={3}
                                    placeholder="文案内容"
                                    value={c.text ?? ""}
                                    onChange={(e) => {
                                      const text = e.target.value;
                                      setCfg((prev) => {
                                        const next = { ...prev };
                                        const proj = { ...next.projects[i] };
                                        const arr = [...(proj.copyBlocks ?? [])];
                                        arr[ci] = { ...arr[ci], text };
                                        proj.copyBlocks = arr;
                                        next.projects = [...prev.projects];
                                        next.projects[i] = proj;
                                        return next;
                                      });
                                    }}
                                  />
                                </div>
                              ))}
                              <div className="flex items-center gap-2">
                                <select
                                  className="border rounded px-2 py-1"
                                  onChange={(e) => {
                                    const kind = e.target.value as CopyBlock["kind"];
                                    if (kind) addCopyBlock(i, kind);
                                    e.currentTarget.selectedIndex = 0; // reset
                                  }}
                                >
                                  <option value="">添加文案块...</option>
                                  <option value="heading">Heading</option>
                                  <option value="paragraph">Paragraph</option>
                                  <option value="list">List</option>
                                  <option value="quote">Quote</option>
                                  <option value="cta">CTA</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            className="border rounded px-2 py-1 flex-1"
                            placeholder="标签（逗号分隔）"
                            value={(p.tags ?? []).join(",")}
                            onChange={(e) => {
                              const tags = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                              setCfg((prev) => {
                                const next = { ...prev };
                                next.projects = [...prev.projects];
                                next.projects[i] = { ...prev.projects[i], tags };
                                return next;
                              });
                            }}
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            className="border rounded px-2 py-1 flex-1"
                            placeholder="角色"
                            value={p.role ?? ""}
                            onChange={(e) => {
                              const role = e.target.value;
                              setCfg((prev) => {
                                const next = { ...prev };
                                next.projects = [...prev.projects];
                                next.projects[i] = { ...prev.projects[i], role };
                                return next;
                              });
                            }}
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            className="border rounded px-2 py-1 flex-1"
                            placeholder="工具（逗号分隔）"
                            value={(p.tools ?? []).join(",")}
                            onChange={(e) => {
                              const tools = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                              setCfg((prev) => {
                                const next = { ...prev };
                                next.projects = [...prev.projects];
                                next.projects[i] = { ...prev.projects[i], tools };
                                return next;
                              });
                            }}
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            className="border rounded px-2 py-1 flex-1"
                            placeholder="时间线"
                            value={p.timeline ?? ""}
                            onChange={(e) => {
                              const timeline = e.target.value;
                              setCfg((prev) => {
                                const next = { ...prev };
                                next.projects = [...prev.projects];
                                next.projects[i] = { ...prev.projects[i], timeline };
                                return next;
                              });
                            }}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <input
                            className="border rounded px-2 py-1"
                            placeholder="SEO 标题"
                            value={p.seo?.title ?? ""}
                            onChange={(e) => {
                              const title = e.target.value;
                              setCfg((prev) => {
                                const next = { ...prev };
                                const proj = { ...next.projects[i] } as ProjectItem;
                                proj.seo = { ...(proj.seo ?? {}), title };
                                next.projects = [...prev.projects];
                                next.projects[i] = proj;
                                return next;
                              });
                            }}
                          />
                          <input
                            className="border rounded px-2 py-1"
                            placeholder="SEO 描述"
                            value={p.seo?.description ?? ""}
                            onChange={(e) => {
                              const description = e.target.value;
                              setCfg((prev) => {
                                const next = { ...prev };
                                const proj = { ...next.projects[i] } as ProjectItem;
                                proj.seo = { ...(proj.seo ?? {}), description };
                                next.projects = [...prev.projects];
                                next.projects[i] = proj;
                                return next;
                              });
                            }}
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <textarea
                            className="border rounded px-2 py-1 flex-1"
                            placeholder="Gallery 图片 URL（每行一个）"
                            rows={3}
                            value={(p.gallery ?? []).join("\n")}
                            onChange={(e) => {
                              const gallery = e.target.value.split("\n").map((s) => s.trim()).filter(Boolean);
                              setCfg((prev) => {
                                const next = { ...prev };
                                next.projects = [...prev.projects];
                                next.projects[i] = { ...prev.projects[i], gallery };
                                return next;
                              });
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <textarea
                            className="border rounded px-2 py-1 flex-1"
                            placeholder="Case Study 段落（JSON 数组，{heading,text}）"
                            rows={3}
                            value={JSON.stringify(p.caseStudySections ?? [])}
                            onChange={(e) => {
                              try {
                                const parsed = JSON.parse(e.target.value) as { heading: string; text: string }[];
                                setCfg((prev) => {
                                  const next = { ...prev };
                                  next.projects = [...prev.projects];
                                  next.projects[i] = { ...prev.projects[i], caseStudySections: parsed };
                                  return next;
                                });
                              } catch {
                                // 忽略解析错误，保持原值
                              }
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={p.visible ?? true}
                              onChange={(e) => {
                                const visible = e.target.checked;
                                setCfg((prev) => {
                                  const next = { ...prev };
                                  next.projects = [...prev.projects];
                                  next.projects[i] = { ...prev.projects[i], visible };
                                  return next;
                                });
                              }}
                            />
                            <span className="text-sm text-muted-foreground">是否展示</span>
                          </label>
                          <input
                            className="border rounded px-2 py-1 w-24"
                            type="number"
                            placeholder="排序"
                            value={p.order ?? i + 1}
                            onChange={(e) => {
                              const order = Number(e.target.value) || i + 1;
                              setCfg((prev) => {
                                const next = { ...prev };
                                next.projects = [...prev.projects];
                                next.projects[i] = { ...prev.projects[i], order };
                                return next;
                              });
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            className="border rounded px-2 py-1 flex-1"
                            placeholder="图片 Alt 文本"
                            value={p.alt ?? ""}
                            onChange={(e) => {
                              const alt = e.target.value;
                              setCfg((prev) => {
                                const next = { ...prev };
                                next.projects = [...prev.projects];
                                next.projects[i] = { ...prev.projects[i], alt };
                                return next;
                              });
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            className="border rounded px-2 py-1 flex-1"
                            placeholder="项目外链（See it live）"
                            value={p.liveUrl ?? ""}
                            onChange={(e) => {
                              const liveUrl = e.target.value;
                              setCfg((prev) => {
                                const next = { ...prev };
                                next.projects = [...prev.projects];
                                next.projects[i] = { ...prev.projects[i], liveUrl };
                                return next;
                              });
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            className="border rounded px-2 py-1 flex-1"
                            placeholder="预览图片路径或 Data URL"
                            value={p.previewSrc}
                            onChange={(e) => {
                              const previewSrc = e.target.value;
                              setCfg((prev) => {
                                const next = { ...prev };
                                next.projects = [...prev.projects];
                                next.projects[i] = { ...prev.projects[i], previewSrc };
                                return next;
                              });
                            }}
                          />
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) updateProjectPreview(i, file);
                              }}
                            />
                            <span className="text-sm text-muted-foreground">上传图片</span>
                          </label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" onClick={() => moveUp(i)} disabled={i === 0}>上移</Button>
                          <Button variant="outline" onClick={() => moveDown(i)} disabled={i === cfg.projects.length - 1}>下移</Button>
                        </div>
                        {p.previewSrc && (
                          <img src={p.previewSrc} alt={p.alt ?? p.title} className="w-48 h-32 object-cover rounded" />
                        )}

                        {selectedProjectIds.length > 0 && (
                          <div className="mt-4 border rounded p-3">
                            <div className="font-medium mb-2">批量编辑（{selectedProjectIds.length} 项）</div>
                            <div className="flex items-center gap-2 mb-2">
                              <label className="inline-flex items-center gap-2">
                                <input type="checkbox" onChange={(e) => applyBatchEdit({ visible: e.target.checked })} />
                                <span className="text-sm">设置可见</span>
                              </label>
                              <select
                                className="border rounded px-2 py-1"
                                onChange={(e) => {
                                  const v = e.target.value as "draft" | "published" | "archived" | "";
                                  if (v) applyBatchEdit({ status: v });
                                  e.currentTarget.selectedIndex = 0;
                                }}
                              >
                                <option value="">批量设置状态...</option>
                                <option value="draft">草稿</option>
                                <option value="published">已发布</option>
                                <option value="archived">已归档</option>
                              </select>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                className="border rounded px-2 py-1 flex-1"
                                placeholder="批量设置标签（逗号分隔）"
                                onBlur={(e) => {
                                  const tags = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                                  applyBatchEdit({ tags });
                                }}
                              />
                              <Button variant="outline" onClick={() => setSelectedProjectIds([])}>清空选择</Button>
                              <Button variant="destructive" onClick={removeSelectedProjects}>批量删除所选</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "assets" && (
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Assets（图片/文件）</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">管理简历文件与其他资源</div>
            <div>
              <label className="block text-sm mb-1">简历 URL（例如 /resume.pdf）</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={cfg.resume.url ?? ""}
                onChange={(e) => setCfg({ ...cfg, resume: { ...cfg.resume, url: e.target.value } })}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">上传简历文件（将保存在配置为 Data URL）</label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    setCfg((prev) => ({ ...prev, resume: { ...prev.resume, fileDataUrl: String(reader.result) } }));
                  };
                  reader.readAsDataURL(file);
                }}
              />
              {cfg.resume.fileDataUrl && (
                <div className="mt-2">
                  <a href={cfg.resume.fileDataUrl} download className="text-sm underline">下载已上传的简历</a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "contact" && (
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Contact 配置</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm mb-1">邮箱</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={cfg.contact.email}
                onChange={(e) => setCfg({ ...cfg, contact: { ...cfg.contact, email: e.target.value } })}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">电话</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={cfg.contact.phone}
                onChange={(e) => setCfg({ ...cfg, contact: { ...cfg.contact, phone: e.target.value } })}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">LinkedIn 链接</label>
              <input
                className="w-full border rounded px-3 py-2"
                value={cfg.contact.linkedin}
                onChange={(e) => setCfg({ ...cfg, contact: { ...cfg.contact, linkedin: e.target.value } })}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">默认偏好联系渠道</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={cfg.contact.preferredChannel ?? "email"}
                onChange={(e) => setCfg({ ...cfg, contact: { ...cfg.contact, preferredChannel: e.target.value as any } })}
              >
                <option value="email">E-mail</option>
                <option value="phone">Phone</option>
                <option value="linkedin">LinkedIn</option>
              </select>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "contact" && (
        <Card className="max-w-5xl mt-6">
          <CardHeader>
            <CardTitle>用户留言</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap gap-2 items-center">
              <input
                className="border rounded px-2 py-1"
                placeholder="搜索姓名、邮箱或内容"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className="border rounded px-2 py-1"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
              >
                <option value="all">全部</option>
                <option value="unread">未读</option>
                <option value="replied">已回复</option>
              </select>
              <Button variant="outline" onClick={handleExportMessages}>导出全部</Button>
              <Button variant="destructive" onClick={handleClearMessages}>清空所有</Button>
            </div>
            {messages.length === 0 ? (
              <div className="text-sm text-muted-foreground">暂无留言</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border">
                  <thead>
                    <tr className="bg-neutral-100">
                      <th className="px-3 py-2 border">时间</th>
                      <th className="px-3 py-2 border">姓名</th>
                      <th className="px-3 py-2 border">邮箱</th>
                      <th className="px-3 py-2 border">偏好联系</th>
                      <th className="px-3 py-2 border">状态</th>
                      <th className="px-3 py-2 border">内容</th>
                      <th className="px-3 py-2 border">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {messages
                      .filter((m) => {
                        const term = search.trim().toLowerCase();
                        const okTerm = !term || [m.name, m.email, m.content].some((v) => v.toLowerCase().includes(term));
                        const okStatus = statusFilter === "all" || (m.status ?? "unread") === statusFilter;
                        return okTerm && okStatus;
                      })
                      .map((m) => (
                        <tr key={m.id}>
                          <td className="px-3 py-2 border whitespace-nowrap">{new Date(m.createdAt).toLocaleString()}</td>
                          <td className="px-3 py-2 border whitespace-nowrap">{m.name}</td>
                          <td className="px-3 py-2 border whitespace-nowrap">
                            <a href={`mailto:${m.email}`} className="underline">{m.email}</a>
                          </td>
                          <td className="px-3 py-2 border whitespace-nowrap">{m.preferredChannel ?? "-"}</td>
                          <td className="px-3 py-2 border whitespace-nowrap">{m.status ?? "unread"}</td>
                          <td className="px-3 py-2 border">{m.content}</td>
                          <td className="px-3 py-2 border">
                            <Button variant="secondary" onClick={() => setStatus(m.id, (m.status === "replied" ? "unread" : "replied"))}>
                              {m.status === "replied" ? "标记未读" : "标记已回复"}
                            </Button>
                            <Button variant="outline" onClick={() => handleRemoveMessage(m.id)}>删除</Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};