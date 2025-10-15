import React from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "../../components/ui/button";
import { loadConfig, initializeConfig } from "../../lib/config";
import { Link } from "react-router-dom";
import { Menu as MenuIcon } from "lucide-react";
import { cn } from "../../lib/utils";

export const ContactHome = (): JSX.Element => {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [content, setContent] = React.useState("");
  const [errors, setErrors] = React.useState<{ name?: string; email?: string; content?: string }>({});
  const [submitted, setSubmitted] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [cfg, setCfg] = React.useState(() => loadConfig());

  // 在组件挂载时初始化配置
  React.useEffect(() => {
    const initConfig = async () => {
      try {
        const config = await initializeConfig();
        setCfg(config);
      } catch (error) {
        console.error('Failed to load configuration:', error);
      }
    };
    initConfig();
  }, []);

  const validateForm = () => {
    const newErrors: { name?: string; email?: string; content?: string } = {};
    
    if (!name.trim()) {
      newErrors.name = "Name is required";
    }
    
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }
    
    if (!content.trim()) {
      newErrors.content = "Message is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    // 检查 Google Forms 配置是否存在
    if (!cfg.contact.googleForm || 
        !cfg.contact.googleForm.endpoint || 
        !cfg.contact.googleForm.entries ||
        !cfg.contact.googleForm.entries.name ||
        !cfg.contact.googleForm.entries.email ||
        !cfg.contact.googleForm.entries.content) {
      setSubmitted("Sorry, the contact form is not properly configured. Please try again later.");
      return;
    }

    setIsSubmitting(true);
    setSubmitted("");

    try {
      // 创建 FormData 对象
      const formData = new FormData();
      formData.append(cfg.contact.googleForm.entries.name, name);
      formData.append(cfg.contact.googleForm.entries.email, email);
      formData.append(cfg.contact.googleForm.entries.content, content);

      // 提交到 Google Forms
      const response = await fetch(cfg.contact.googleForm.endpoint, {
        method: 'POST',
        body: formData,
        mode: 'no-cors' // Google Forms 需要 no-cors 模式
      });

      // 由于 no-cors 模式，我们无法检查响应状态，但如果没有抛出错误，就认为成功
      setSubmitted("Thank you! Your message has been sent successfully.");
      
      // 清空表单
      setName("");
      setEmail("");
      setContent("");
      setErrors({});
      
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitted("Sorry, there was an error sending your message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigationLinks = [
    { label: "About", to: "/#about" },
    { label: "Project", to: "/#project" },
    { label: "Contact", to: "/#contact" },
    { label: "Resume", to: "/#resume" },
  ];

  // Build an English SEO description safely
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
              <Button 
                className="ml-auto" 
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Submit"}
              </Button>
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