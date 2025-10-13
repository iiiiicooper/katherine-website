import React from "react";
import { Helmet } from "react-helmet-async";
// 移除卡片容器相关导入
import { Button } from "../../components/ui/button";
import { loadConfig, loadRemoteConfig } from "../../lib/config";
import { addMessage, upsertMessage } from "../../lib/messages";
import { Link } from "react-router-dom";
import { Menu as MenuIcon } from "lucide-react";
import { cn } from "../../lib/utils";

export const ContactHome = (): JSX.Element => {
  const [cfg, setCfg] = React.useState(() => loadConfig());
  const [menuOpen, setMenuOpen] = React.useState(false);
  const navigationLinks = [
    { label: "About", to: "/#about" },
    { label: "Project", to: "/#project" },
    { label: "Contact", to: "/#contact" },
    { label: "Resume", to: "/#resume" },
  ];
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [content, setContent] = React.useState("");
  const [submitted, setSubmitted] = React.useState<string>("");
  const [errors, setErrors] = React.useState<{ name?: string; email?: string; content?: string }>({});

  // 组件挂载时拉取远端配置，成功后更新本地与状态
  React.useEffect(() => {
    (async () => {
      try {
        const remote = await loadRemoteConfig();
        setCfg(remote);
        try {
          localStorage.setItem("app-config-v1", JSON.stringify(remote));
        } catch {
          // ignore localStorage errors
        }
      } catch {
        // ignore fetch errors
      }
    })();
  }, []);

  const handleSubmit = (): void => {
    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = "Please enter your name";
    const emailVal = email.trim();
    if (!emailVal) nextErrors.email = "Please enter your email";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) nextErrors.email = "Invalid email format";
    if (!content.trim()) nextErrors.content = "Please enter your message";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setSubmitted("Please fix the highlighted errors and submit again");
      return;
    }
    const payload = { name: name.trim(), email: emailVal, content: content.trim() };
    const clearForm = (): void => {
      setName("");
      setEmail("");
      setContent("");
      setSubmitted("Submitted. We'll contact you soon.");
      setTimeout(() => setSubmitted(""), 2000);
    };
    // 若配置了 Google Forms，则优先提交到 Google Forms（无后端依赖）
    const gf = cfg.contact.googleForm;
    // 若已配置 Google Forms endpoint，但缺少必填 entry（name/email/content），提示配置不完整并停止回退，避免误以为提交成功
    if (gf?.endpoint && !(gf.entries?.name && gf.entries?.email && gf.entries?.content)) {
      setSubmitted("Submission temporarily unavailable: Google Form not fully configured (missing Name/Email/Content entry IDs). Please try again later.");
      return;
    }
    // 三个 entry 都齐全时，走 Google Forms 提交
    if (gf?.endpoint && gf.entries?.name && gf.entries?.email && gf.entries?.content) {
      try {
        // 采用隐藏 form + iframe 的方式跨域提交，不跳转页面
        const iframeName = "gform-target";
        let iframe = document.querySelector(`iframe[name="${iframeName}"]`) as HTMLIFrameElement | null;
        if (!iframe) {
          iframe = document.createElement("iframe");
          iframe.name = iframeName;
          iframe.style.display = "none";
          document.body.appendChild(iframe);
        }
        const form = document.createElement("form");
        form.action = gf.endpoint;
        form.method = "POST";
        form.target = iframeName;
        form.style.display = "none";
        const add = (name: string, value: string) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = name;
          input.value = value;
          form.appendChild(input);
        };
        add(gf.entries.name, payload.name);
        add(gf.entries.email, payload.email);
        add(gf.entries.content, payload.content);
        // 若表单启用了“收集邮箱地址”，同步提交系统字段 emailAddress
        add("emailAddress", payload.email);
        // 部分表单需要会话令牌 fbzx（在预填链接或网络面板中可获得）
        if (gf.fbzx) add("fbzx", gf.fbzx);
        // Google Forms 推荐的附加参数，避免草稿/分页问题
        add("fvv", "1");
        add("draftResponse", "[]");
        add("pageHistory", "0");
        document.body.appendChild(form);
        form.submit();
        setSubmitted("Submitted via Google Forms.");
        setTimeout(() => setSubmitted(""), 2000);
        // 同步写入本地，便于当前设备回看
        try { addMessage(payload); } catch {}
        clearForm();
        return;
      } catch {
        // 失败则继续走后端/本地回退逻辑
      }
    }
    // 后端优先：发送到 /api/messages 并在管理后台显示（若未配置 Google Forms）
    (async () => {
      try {
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.ok && data.data) {
            try { upsertMessage(data.data); } catch {}
          }
          clearForm();
          return;
        } else {
          try { addMessage(payload); } catch {}
          clearForm();
          return;
        }
      } catch {}
      try {
        addMessage(payload);
        clearForm();
      } catch {
        setSubmitted("Submission failed. Please try again later");
      }
    })();
  };

  // Build an English SEO description safely (no contact.intro field dependency)
  const contactDescription = `Contact Katherine: Email ${cfg.contact.email}, LinkedIn, Phone ${cfg.contact.phone}.`;

  return (
    <div className="bg-white w-full min-h-screen flex flex-col">
      <Helmet>
        <title>Contact Katherine Fang | Get in Touch</title>
        <meta name="description" content={contactDescription} />
        {(() => {
          const SITE_URL = (import.meta as any)?.env?.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://www.katherinefang.com');
          return <link rel="canonical" href={`${SITE_URL}/contact`} />;
        })()}
        <meta property="og:title" content="Contact Katherine Fang" />
        <meta property="og:description" content={contactDescription} />
        <meta property="og:type" content="website" />
        {(() => {
          const SITE_URL = (import.meta as any)?.env?.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://www.katherinefang.com');
          return (
            <>
              <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : `${SITE_URL}/contact`} />
              <meta property="og:image" content={`${SITE_URL}/screen.png`} />
            </>
          );
        })()}
        {/* Twitter meta */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Contact Katherine Fang" />
        <meta name="twitter:description" content={contactDescription} />
        {(() => {
          const SITE_URL = (import.meta as any)?.env?.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://www.katherinefang.com');
          return <meta name="twitter:image" content={`${SITE_URL}/screen.png`} />;
        })()}
      </Helmet>
      {/* 顶部菜单栏（与 AboutHome 保持一致样式） */}
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
            </div>
          </div>
        )}
      </header>

      {/* 中间内容：表单居中并整体下移 */}
      <main className="px-4 sm:px-6 md:px-[151px] pt-16 sm:pt-24 md:pt-32 pb-0 md:pb-6 flex-1">
        <div className="w-full max-w-[686px] mx-auto">
          <div className="space-y-3">
            <input
              className="w-full h-[88px] bg-white border border-gray-200 rounded px-6 text-gray-700 placeholder:text-gray-500"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && <div className="text-red-500 text-sm">{errors.name}</div>}
            <input
              className="w-full h-[88px] bg-white border border-gray-200 rounded px-6 text-gray-700 placeholder:text-gray-500"
              placeholder="Your E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <div className="text-red-500 text-sm">{errors.email}</div>}
            <textarea
              className="w-full h-[220px] bg-white border border-gray-200 rounded px-6 py-4 text-gray-700 placeholder:text-gray-500"
              placeholder="Your Masterpiece Start Here"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            {errors.content && <div className="text-red-500 text-sm">{errors.content}</div>}
            <div className="flex items-center gap-3">
              {submitted && <span className="text-sm text-muted-foreground">{submitted}</span>}
              <Button className="ml-auto" onClick={handleSubmit}>Submit</Button>
            </div>
          </div>
        </div>
      </main>

      {/* 底部菜单（与 AboutHome 保持一致样式） */}
      <footer className="relative">
        <img
          className="w-full h-[200px] sm:h-[240px] md:h-[369px] object-cover"
          alt="Footer gradient background"
          src="/-----x3d----9-9------.png"
          loading="lazy"
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