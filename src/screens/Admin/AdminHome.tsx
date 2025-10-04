import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { AppConfig, ProjectItem } from "../../lib/types";
import { loadConfig, saveConfig, exportConfig, importConfigFromFile, resetConfig } from "../../lib/config";

type TabKey = "content" | "images" | "files" | "links";

export const AdminHome = (): JSX.Element => {
  const [tab, setTab] = React.useState<TabKey>("content");
  const [cfg, setCfg] = React.useState<AppConfig>(() => loadConfig());
  const [saved, setSaved] = React.useState<string>("");

  const handleSave = (): void => {
    saveConfig(cfg);
    setSaved("已保存配置");
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
      const previewSrc = String(reader.result);
      setCfg((prev) => {
        const next = { ...prev };
        next.projects = [...prev.projects];
        next.projects[index] = { ...prev.projects[index], previewSrc };
        return next;
      });
    };
    reader.readAsDataURL(file);
  };

  const addProject = (): void => {
    const item: ProjectItem = {
      id: `p${Date.now()}`,
      title: "New Project",
      previewSrc: "",
      alt: "New Project",
    };
    setCfg((prev) => ({ ...prev, projects: [...prev.projects, item] }));
  };

  const removeProject = (index: number): void => {
    setCfg((prev) => {
      const next = { ...prev };
      next.projects = prev.projects.filter((_, i) => i !== index);
      return next;
    });
  };

  const resetAll = (): void => {
    const d = resetConfig();
    setCfg(d);
    setSaved("已重置为默认配置");
    setTimeout(() => setSaved(""), 1500);
  };

  return (
    <div className="w-full min-h-screen bg-white px-4 md:px-10 py-10">
      <h1 className="text-3xl font-bold mb-6">管理后台</h1>

      <div className="flex gap-2 mb-6">
        {(
          [
            { key: "content", label: "文案配置" },
            { key: "images", label: "图片配置" },
            { key: "files", label: "文件上传" },
            { key: "links", label: "连接配置" },
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

      {tab === "content" && (
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>首页文案</CardTitle>
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
          </CardContent>
        </Card>
      )}

      {tab === "images" && (
        <Card className="max-w-4xl">
          <CardHeader>
            <CardTitle>项目图片</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cfg.projects.map((p, i) => (
                <div key={p.id} className="border rounded p-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
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
                  {p.previewSrc && (
                    <img src={p.previewSrc} alt={p.alt ?? p.title} className="w-48 h-32 object-cover rounded" />
                  )}
                </div>
              ))}
              <Button onClick={addProject}>新增项目</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === "files" && (
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>简历文件</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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

      {tab === "links" && (
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>联系链接</CardTitle>
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
          </CardContent>
        </Card>
      )}
    </div>
  );
};