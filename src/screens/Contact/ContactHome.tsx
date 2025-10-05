import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { loadConfig } from "../../lib/config";
import { addMessage } from "../../lib/messages";
import { Link } from "react-router-dom";
import { Menu as MenuIcon } from "lucide-react";
import { cn } from "../../lib/utils";

export const ContactHome = (): JSX.Element => {
  const cfg = React.useMemo(() => loadConfig(), []);
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
  const [channel, setChannel] = React.useState<"email" | "phone" | "linkedin">("email");
  const [submitted, setSubmitted] = React.useState<string>("");
  const [errors, setErrors] = React.useState<{ name?: string; email?: string; content?: string; channel?: string }>({});

  const handleSubmit = (): void => {
    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = "请输入姓名";
    const emailVal = email.trim();
    if (!emailVal) nextErrors.email = "请输入邮箱";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) nextErrors.email = "邮箱格式不正确";
    if (!content.trim()) nextErrors.content = "请输入内容";
    if (!channel) nextErrors.channel = "请选择联系渠道";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setSubmitted("请修正红色字段后的错误再提交");
      return;
    }
    const payload = { name: name.trim(), email: emailVal, content: content.trim(), preferredChannel: channel };
    const clearForm = (): void => {
      setName("");
      setEmail("");
      setContent("");
      setChannel("email");
      setSubmitted("已提交，我们会尽快联系你～");
      setTimeout(() => setSubmitted(""), 2000);
    };
    // 优先尝试调用后端 API
    (async () => {
      try {
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          clearForm();
          return;
        }
      } catch {
        // ignore
      }
      // 回退到本地存储
      try {
        addMessage(payload);
        clearForm();
      } catch {
        setSubmitted("提交失败，请稍后再试");
      }
    })();
  };

  return (
    <div className="bg-white w-full min-h-screen relative">
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

      {/* 中间内容：表单居中 */}
      <main className="px-4 sm:px-6 md:px-[151px] py-10">
        <h1 className="text-3xl font-bold mb-6 text-center">Get in touch</h1>
        <Card className="w-full max-w-[686px] mx-auto bg-[#f7f9fb] border-0 rounded-2xl">
        <CardContent>
          <div className="space-y-3">
            <input
              className="w-full h-[88px] bg-[#f7f7f7] rounded px-6 text-gray-600 placeholder:text-gray-500"
              placeholder="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {errors.name && <div className="text-red-500 text-sm">{errors.name}</div>}
            <input
              className="w-full h-[88px] bg-[#f7f7f7] rounded px-6 text-gray-600 placeholder:text-gray-500"
              placeholder="Your E-mail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <div className="text-red-500 text-sm">{errors.email}</div>}
            <textarea
              className="w-full h-[220px] bg-[#f7f7f7] rounded px-6 py-4 text-gray-600 placeholder:text-gray-500"
              placeholder="Your Masterpiece Start Here"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            {errors.content && <div className="text-red-500 text-sm">{errors.content}</div>}
            <div className="flex items-center gap-2">
              <label className="text-sm">偏好联系渠道</label>
              <select
                className="border rounded px-2 py-1"
                value={channel}
                onChange={(e) => setChannel(e.target.value as any)}
              >
                <option value="email">E-mail</option>
                <option value="phone">Phone</option>
                <option value="linkedin">LinkedIn</option>
              </select>
            </div>
            {errors.channel && <div className="text-red-500 text-sm">{errors.channel}</div>}
            <div className="flex items-center gap-3">
              {submitted && <span className="text-sm text-muted-foreground">{submitted}</span>}
              <Button className="ml-auto" onClick={handleSubmit}>Submit</Button>
            </div>
          </div>
        </CardContent>
      </Card>
      </main>

      {/* 底部菜单（与 AboutHome 保持一致样式） */}
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