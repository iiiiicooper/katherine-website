import React from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { loadConfig, loadRemoteConfig } from "../../lib/config";
import { cn } from "../../lib/utils";
import { Menu as MenuIcon } from "lucide-react";

export const ProjectDetail = (): JSX.Element => {
  const { id } = useParams();
  const [cfg, setCfg] = React.useState(() => loadConfig());
  const project = cfg.projects.find((p) => p.id === id);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const navigationLinks = [
    { label: "About", to: "/#about" },
    { label: "Project", to: "/#project" },
    { label: "Contact", to: "/#contact" },
    { label: "Resume", to: "/#resume" },
  ];

  // 进入详情页时滚动到页面顶部，避免保留首页的底部滚动位置
  React.useEffect(() => {
    try {
      window.scrollTo({ top: 0, behavior: "auto" });
    } catch {
      // do nothing
    }
  }, []);

  React.useEffect(() => {
    (async () => {
      const remote = await loadRemoteConfig();
      setCfg(remote);
      try { localStorage.setItem("app-config-v1", JSON.stringify(remote)); } catch {}
    })();
  }, []);

  if (!project) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-2">项目未找到</div>
          <Link to="/" className="underline">返回首页</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white w-full min-h-screen relative">
      {/* 顶部菜单栏（复用首页样式） */}
      <header className="relative z-10">
        <nav className="flex items-center px-4 sm:px-6 md:px-11 py-6 sm:py-8 md:py-11">
          <Link
            to="/"
            className="[font-family:'Inter',Helvetica] font-semibold text-black text-[32px] tracking-[0] leading-[normal] hover:opacity-70"
            aria-label="Back to Home"
          >
            K
          </Link>

          <div className="hidden md:flex flex-1 justify-center items-center gap-[30px] md:gap-[89px]">
            {navigationLinks.map((link, index) => (
              <Link
                key={index}
                to={link.to}
                className={cn("[font-family:'Inter',Helvetica] font-medium text-black text-xl md:text-2xl tracking-[0] leading-[normal] hover:opacity-70 transition-opacity")}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="md:hidden ml-auto">
            <Button variant="ghost" size="icon" onClick={() => setMenuOpen((o) => !o)} aria-label="Toggle menu">
              <MenuIcon className="w-6 h-6" />
            </Button>
          </div>
        </nav>

        {menuOpen && (
          <div className="md:hidden px-4 pb-4">
            <div className="flex flex-col gap-3">
              {navigationLinks.map((link, index) => (
                <Link
                  key={index}
                  to={link.to}
                  onClick={() => setMenuOpen(false)}
                  className="[font-family:'Inter',Helvetica] font-medium text-black text-xl tracking-[0] leading-[normal] hover:opacity-70 transition-opacity"
                >
                  {link.label}
                </Link>
              ))}
              <Link to="/contact" onClick={() => setMenuOpen(false)} className="[font-family:'Inter',Helvetica] font-medium text-black text-xl">
                Contact Page
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* 中间内容：图片加文字布局 */}
      <main className="px-4 sm:px-6 md:px-[151px] pt-[40px] pb-[120px]">
        <div className="max-w-[1100px] mx-auto">
          {/* 顶部：p1 / p2 使用同样改版样式；按钮置于组下方（恢复原始布局） */}
          {(project.id === "p1" || project.id === "p2") ? (
            <div className="mb-12 w-full">
              <div className="w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 items-center justify-items-center">
                  {/* 左侧小缩略图（靠内容区域左侧对齐） */}
                  {project.previewSrc && (
                    <img
                      src={project.previewSrc}
                      alt={project.alt ?? project.title}
                      className="w-[240px] sm:w-[280px] aspect-square object-cover rounded-xl shadow-sm transform-gpu scale-[1.2] translate-x-2 sm:translate-x-3 origin-left"
                    />
                  )}
                  {/* 右侧标题（使用配置中的标题）*/}
                  <h1 className="[font-family:'Inter',Helvetica] font-extrabold text-black text-left text-[36px] md:text-[56px] tracking-[0] leading-[1.1]">
                    {project.title}
                  </h1>
                </div>
              </div>
              {project.liveUrl && (
                <div className="my-20 w-full flex justify-end">
                  <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                    <Button className="bg-gray-200 text-black hover:bg-gray-300 shadow-sm">See it live</Button>
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-10 items-start mb-12">
              {/* 左侧 Logo/封面图 */}
              {project.previewSrc && (
                <img
                  src={project.previewSrc}
                  alt={project.alt ?? project.title}
                  className="w-full max-w-[280px] aspect-square object-cover rounded-xl shadow-sm"
                />
              )}
              {/* 右侧标题与外链按钮 */}
              <div className="flex flex-col gap-6">
                <h1 className="[font-family:'Inter',Helvetica] font-extrabold text-black text-left text-[36px] md:text-[56px] tracking-[0] leading-[1.1]">
                  {project.title}
                </h1>
                <div>
                  {project.liveUrl && (
                    <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                      <Button>See it live</Button>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 图文交替：如果存在 assets 列表则按每张图对应文案展示；否则回退到 copyBlocks + previewSrc */}
          {project.assets && project.assets.length > 0 ? (
            <div className="space-y-14">
              {(() => {
                // 计算从第几张开始采用“上下布局”（上：左对齐文案；下：居中图片）
                const forcedVertical = project.assetsLayout === "vertical";
                const verticalStartIdx = forcedVertical
                  ? 0
                  : project.assets.findIndex((a) => {
                      const t = `${a.alt ?? ''} ${a.caption ?? ''}`;
                      return /UI\s*5/i.test(t);
                    });
                return project.assets.map((asset, idx) => {
                  const useVertical = verticalStartIdx >= 0 && idx >= verticalStartIdx;
                  if (useVertical) {
                    return (
                      <div
                        key={asset.id}
                        className={forcedVertical ? (idx % 2 === 0 ? "ml-auto" : "mr-auto") : "mx-auto"}
                        style={{ width: `${project.assetsModulePercent ?? 70}%` }}
                      >
                        <div className="flex flex-col gap-6 md:gap-8">
                          {/* vertical: 根据是否强制纵向决定顺序 */}
                          {forcedVertical ? (
                            <>
                              <div className="w-full flex justify-center">
                                <img
                                  src={asset.src}
                                  alt={asset.alt ?? project.title}
                                  className="h-auto rounded-xl shadow-sm"
                                  style={{ width: `${asset.sizePercent ?? 100}%` }}
                                />
                              </div>
                              <p className="[font-family:'Inter',Helvetica] font-medium text-black text-[19px] md:text-[20px] tracking-[0] leading-relaxed text-left">
                                {asset.caption || asset.alt || project.title}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="[font-family:'Inter',Helvetica] font-medium text-black text-[19px] md:text-[20px] tracking-[0] leading-relaxed text-left">
                                {asset.caption || asset.alt || project.title}
                              </p>
                              <div className="w-full flex justify-center">
                                <img
                                  src={asset.src}
                                  alt={asset.alt ?? project.title}
                                  className="h-auto rounded-xl shadow-sm"
                                  style={{ width: `${asset.sizePercent ?? 100}%` }}
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  }
                  // 默认：左右交替（偶数靠左、奇数靠右）
                  return (
                    <div
                      key={asset.id}
                      className={
                        idx % 2 === 0 ? "max-w-[1075px] mr-auto" : "max-w-[1075px] ml-auto"
                      }
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
                        {(idx % 2 === 0) ? (
                          <>
                            <img
                              src={asset.src}
                              alt={asset.alt ?? project.title}
                              className="h-auto rounded-xl shadow-sm"
                              style={{ width: `${asset.sizePercent ?? 100}%` }}
                            />
                            <p className="[font-family:'Inter',Helvetica] font-medium text-black text-[19px] md:text-[20px] tracking-[0] leading-relaxed">
                              {asset.caption || asset.alt || project.title}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="[font-family:'Inter',Helvetica] font-medium text-black text-[19px] md:text-[20px] tracking-[0] leading-relaxed md:order-1">
                              {asset.caption || asset.alt || project.title}
                            </p>
                            <img
                              src={asset.src}
                              alt={asset.alt ?? project.title}
                              className="h-auto rounded-xl shadow-sm md:order-2"
                              style={{ width: `${asset.sizePercent ?? 100}%` }}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            <>
              {/* 第一块内容：左对齐（再放大约 20%，左右排版） */}
              <div className="max-w-[1075px] mr-auto mb-14">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
                  {project.previewSrc && (
                    <img
                      src={project.previewSrc}
                      alt={project.alt ?? project.title}
                      className="w-full h-auto rounded-xl shadow-sm"
                    />
                  )}
                  {!!(project.copyBlocks && project.copyBlocks.length > 0) && (
                    <p className="[font-family:'Inter',Helvetica] font-medium text-black text-[19px] md:text-[20px] tracking-[0] leading-relaxed">
                      {project.copyBlocks.find((b) => b.kind === "paragraph")?.text}
                    </p>
                  )}
                </div>
              </div>

              {/* 第二块内容：右对齐（再放大约 20%，左右交替） */}
              <div className="max-w-[1075px] ml-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-center">
                  {!!(project.copyBlocks && project.copyBlocks.length > 1) && (
                    <p className="[font-family:'Inter',Helvetica] font-medium text-black text-[19px] md:text-[20px] tracking-[0] leading-relaxed md:order-1">
                      {project.copyBlocks.filter((b) => b.kind === "paragraph")[1]?.text}
                    </p>
                  )}
                  {project.previewSrc && (
                    <img
                      src={project.previewSrc}
                      alt={project.alt ?? project.title}
                      className="w-full h-auto rounded-xl shadow-sm md:order-2"
                    />
                  )}
                </div>
              </div>
            </>
          )}

          {/* UI 展示：若有 assets 已经展示过，则不重复图集；否则展示 gallery */}
          {!(project.assets && project.assets.length > 0) && (
            <section className="max-w-[1075px] mx-auto mt-16 md:mt-20">
              <div className="mb-6 md:mb-8 text-left">
                <h2 className="[font-family:'Inter',Helvetica] font-bold text-black text-2xl md:text-3xl tracking-[0] leading-[normal]">
                  UI 设计展示
                </h2>
                <p className="[font-family:'Inter',Helvetica] font-medium text-black text-[17px] md:text-[20px] tracking-[0] leading-relaxed mt-3">
                  以下为项目中的部分 UI 设计选段，呈现核心界面与关键交互。文案在上方概述设计目标与思路，图片在下方展示对应的界面效果。
                </p>
              </div>
              <div className="flex flex-col gap-4 md:gap-6">
                {(project.gallery && project.gallery.length > 0 ? project.gallery : [project.previewSrc, project.previewSrc, project.previewSrc]).map((src, idx) => (
                  <img
                    key={idx}
                    src={src}
                    alt={(project.alt ?? project.title) + ` UI ${idx + 1}`}
                    className="w-full h-auto rounded-xl shadow-sm object-cover"
                  />
                ))}
              </div>
            </section>
          )}

          {/* 返回按钮移除 */}
        </div>
      </main>

      {/* 底部菜单栏（复用首页样式） */}
      <footer className="relative">
        <img
          className="w-full h-[200px] sm:h-[240px] md:h-[369px] object-cover"
          alt="Footer gradient background"
          src="/-----x3d----9-9------.png"
        />

        <div className="absolute inset-0 px-4 sm:px-6 md:px-[151px] flex items-center justify-center md:justify-start gap-3 md:gap-4">
          <a
            href="/contact"
            className="w-[167px] h-[56px] md:h-[70px] bg-white shadow-[0px_4px_4px_#00000040] flex items-center justify-center hover:opacity-80 transition-opacity md:ml-3"
          >
            <span className="[font-family:'Inter',Helvetica] font-medium text-black text-lg md:text-xl tracking-[0] leading-[normal] whitespace-nowrap">
              Get in touch
            </span>
          </a>
          <div className="flex flex-col items-start gap-2 md:gap-3">
            <a
              href={cfg.contact.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-[12px] md:gap-[30px] hover:opacity-70 transition-opacity"
            >
              <div className="w-[12px] h-[12px] md:w-[15px] md:h-[15px] bg-black rounded-full" />
              <span className="[font-family:'Inter',Helvetica] font-medium text-black text-xl md:text-2xl tracking-[0] leading-[normal]">
                Linkedin
              </span>
            </a>
            <div className="flex items-center gap-[12px] md:gap-[30px]">
              <div className="w-[12px] h-[12px] md:w-[15px] md:h-[15px] bg-black rounded-full" />
              <span className="[font-family:'Inter',Helvetica] font-medium text-black text-xl md:text-2xl tracking-[0] leading-[normal]">
                Available for work
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};