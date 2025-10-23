import { Copy as CopyIcon, FileDown as FileDownIcon, Maximize2 as Maximize2Icon, Menu as MenuIcon, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from "lucide-react";
import React from "react";
import { Helmet } from "react-helmet-async";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { cn } from "../../lib/utils";
import { loadConfig, initializeConfig } from "../../lib/config";
import { Link } from "react-router-dom";

const navigationLinks = [
  { label: "About", href: "#about" },
  { label: "Project", href: "#project" },
  { label: "Contact", href: "#contact" },
  { label: "Resume", href: "#resume" },
];

// 首页数据从配置读取

export const AboutHome = (): JSX.Element => {
  const [config, setConfig] = React.useState(() => loadConfig());
  const [copied, setCopied] = React.useState(false);
  const [showContactModal, setShowContactModal] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState("about");
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [hoverProjectIndex, setHoverProjectIndex] = React.useState<number | null>(null);
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = React.useState(true);
  const [touchStart, setTouchStart] = React.useState<number | null>(null);
  const [touchEnd, setTouchEnd] = React.useState<number | null>(null);
  const autoPlayRef = React.useRef<NodeJS.Timeout | null>(null);

  // 异步加载配置
  React.useEffect(() => {
    const loadConfigAsync = async () => {
      try {
        const newConfig = await initializeConfig();
        setConfig(newConfig);
      } catch (error) {
        console.error('Failed to load config:', error);
      }
    };
    loadConfigAsync();
  }, []);

  const handleCopy = async (): Promise<void> => {
    try {
      const text = `${config.contact.email}\n${config.contact.linkedin}\n${config.contact.phone}`;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.warn("Clipboard unavailable");
    }
  };

  // 触摸滑动处理函数
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsAutoPlaying(false); // 暂停自动播放
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      // 向左滑动，显示下一个
      setCurrentSlide((prev) => (prev + 1) % config.projects.length);
    } else if (isRightSwipe) {
      // 向右滑动，显示上一个
      setCurrentSlide((prev) => (prev - 1 + config.projects.length) % config.projects.length);
    }

    // 3秒后恢复自动播放
    setTimeout(() => setIsAutoPlaying(true), 3000);
  };

  // 导航按钮处理函数
  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + config.projects.length) % config.projects.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 3000);
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % config.projects.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 3000);
  };

  // 指示器点击处理函数
  const handleIndicatorClick = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 3000);
  };

  React.useEffect(() => {
    // 设置页面滚动监听，用于导航高亮
    const ids = ["about", "project", "contact", "resume"];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) {
          setActiveSection(visible[0].target.id);
        }
      },
      { threshold: [0.3, 0.6], rootMargin: "0px 0px -40% 0px" },
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // Auto-switch carousel for mobile - continuous left scrolling
  React.useEffect(() => {
    if (isAutoPlaying) {
      autoPlayRef.current = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % config.projects.length);
      }, 3000); // 3 seconds
    } else {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = null;
      }
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
        autoPlayRef.current = null;
      }
    };
  }, [config.projects.length, isAutoPlaying]);

  // 监听本地存储变化，更新配置
  React.useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "app-config-v1") {
        try { setConfig(loadConfig()); } catch {}
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return (
    <div className="bg-white w-full relative">
      <Helmet>
        <title>Katherine Fang | About, Projects & Contact</title>
        <meta name="description" content={config.about?.intro || "Portfolio homepage: About, Projects & Contact."} />
        {(() => {
          const SITE_URL = (import.meta as any)?.env?.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://www.katherinefang.com');
          return <link rel="canonical" href={`${SITE_URL}/`} />;
        })()}
        <meta property="og:title" content="Katherine Fang | Portfolio" />
        <meta property="og:description" content={config.about?.intro || "Portfolio homepage with About, Projects & Contact."} />
        <meta property="og:type" content="website" />
        {(() => {
          const SITE_URL = (import.meta as any)?.env?.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://www.katherinefang.com');
          return (
            <>
              <meta property="og:url" content={typeof window !== 'undefined' ? window.location.href : `${SITE_URL}/`} />
              <meta property="og:image" content={`${SITE_URL}/screen.png`} />
            </>
          );
        })()}
        {/* Twitter meta */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Katherine Fang | About, Projects & Contact" />
        <meta name="twitter:description" content={config.about?.intro || "Portfolio homepage with About, Projects & Contact."} />
        {(() => {
          const SITE_URL = (import.meta as any)?.env?.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://www.katherinefang.com');
          return <meta name="twitter:image" content={`${SITE_URL}/screen.png`} />;
        })()}
        {/* Structured Data: Person & WebSite */}
        {(() => {
          const SITE_URL = (import.meta as any)?.env?.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://www.katherinefang.com');
          const person = {
            "@context": "https://schema.org",
            "@type": "Person",
            name: "Katherine Fang",
            jobTitle: "Product & UI/UX Designer",
            description: config.about?.intro || "Katherine Fang's portfolio homepage",
            url: `${SITE_URL}/`,
            image: `${SITE_URL}/screen.png`,
            sameAs: [config.contact.linkedin].filter(Boolean),
          };
          const website = {
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Katherine Fang Portfolio",
            url: `${SITE_URL}/`,
            potentialAction: {
              "@type": "SearchAction",
              target: `${SITE_URL}/?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          };
          return (
            <>
              <script type="application/ld+json">{JSON.stringify(person)}</script>
              <script type="application/ld+json">{JSON.stringify(website)}</script>
            </>
          );
        })()}
      </Helmet>
      <img
        className="block absolute pointer-events-none w-[85%] sm:w-[65%] md:w-[57.25%] h-[180px] sm:h-[250px] md:h-[318px] top-[100px] sm:top-[136px] md:top-[151px] left-[52%] sm:left-[54%] -translate-x-1/2 md:left-[256px] md:translate-x-0"
        alt="Background gradient"
        src="/rectangle.png"
        loading="lazy"
      />

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
              <a
                key={index}
                href={link.href}
                className={cn(
                  "[font-family:'Inter',Helvetica] font-medium text-black text-xl md:text-2xl tracking-[0] leading-[normal] hover:opacity-70 transition-opacity",
                  activeSection === link.href.slice(1) && link.label !== "About" ? "underline" : "",
                )}
                aria-current={activeSection === link.href.slice(1) ? "page" : undefined}
              >
                {link.label}
              </a>
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
                <a
                  key={index}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="[font-family:'Inter',Helvetica] font-medium text-black text-xl tracking-[0] leading-[normal] hover:opacity-70 transition-opacity"
                >
                  {link.label}
                </a>
              ))}
              <Link to="/contact" onClick={() => setMenuOpen(false)} className="[font-family:'Inter',Helvetica] font-medium text-black text-xl">
                Contact Page
              </Link>
            </div>
          </div>
        )}

          {false && (
            <img
              className="w-full h-[3px] object-cover"
              alt="Divider line"
              src="/line-1.svg"
              loading="lazy"
            />
          )}
      </header>

      <main className="relative">
        <section id="about" className="px-4 sm:px-6 md:px-[151px] pt-[100px] sm:pt-[118px] md:pt-[179px] pb-[140px] sm:pb-[160px] md:pb-[245px]">
          <div className="max-w-[934px] mx-auto">
            <h1 className="[font-family:'Inter',Helvetica] font-extrabold text-black text-left text-[40px] md:text-[64px] tracking-[0] leading-[normal] mb-[80px] md:mb-[158px]">
              {config.about.title}
            </h1>
            <p className="[font-family:'Inter',Helvetica] font-medium text-black text-left text-base sm:text-lg md:text-[28px] tracking-[0] leading-[normal]">
              {config.about.intro}
            </p>
          </div>
        </section>

        <section id="project" className="px-4 sm:px-6 md:px-[151px] pb-[80px] sm:pb-[120px] md:pb-[200px]">
          <h2 className="[font-family:'Inter',Helvetica] font-medium text-black text-xl sm:text-2xl tracking-[0] leading-[normal] mb-[32px] sm:mb-[42px] md:mb-[52px] text-left">
            Project.
          </h2>

          {/* Hero Video Section */}
          <div className="w-full max-w-[750px] mx-auto mb-[40px] sm:mb-[60px] md:mb-[80px] px-2 sm:px-0">
            <div className="relative w-full aspect-video rounded-xl sm:rounded-2xl overflow-hidden shadow-md sm:shadow-lg bg-gradient-to-br from-purple-100 to-orange-100">
              <video
                className="w-full h-full object-cover"
                src="/Video.mp4"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-label="Project demonstration video"
              />
              {/* Optional overlay for better mobile experience */}
              <div className="absolute inset-0 bg-black/5 pointer-events-none"></div>
            </div>
          </div>

          {/* Mobile Carousel - Matching Video Frame Size */}
          <div className="md:hidden">
            <div className="relative w-full max-w-[750px] mx-auto px-2 sm:px-0">
              {/* Carousel Container - Matching Video Frame */}
              <div className="relative w-full aspect-video rounded-xl sm:rounded-2xl overflow-hidden shadow-md sm:shadow-lg bg-gradient-to-br from-purple-100 to-orange-100">
                {/* Navigation Buttons */}
                <button
                  onClick={handlePrevSlide}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110"
                  aria-label="Previous slide"
                >
                  <ChevronLeftIcon className="w-5 h-5 text-gray-700" />
                </button>
                <button
                  onClick={handleNextSlide}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110"
                  aria-label="Next slide"
                >
                  <ChevronRightIcon className="w-5 h-5 text-gray-700" />
                </button>
                
                <div 
                  className="flex h-full transition-transform duration-1000 ease-in-out will-change-transform cursor-grab active:cursor-grabbing"
                  style={{ 
                    transform: `translateX(-${currentSlide * 100}%)`,
                    backfaceVisibility: 'hidden',
                    perspective: '1000px'
                  }}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  {config.projects.map((project, index) => (
                    <Link
                      key={project.id}
                      to={`/project/${project.id}`}
                      className="w-full h-full flex-shrink-0 flex items-center justify-center relative transform-gpu will-change-transform"
                    >
                      <div className="relative w-[280px] h-[154px] sm:w-[320px] sm:h-[176px] transform-gpu transition-transform duration-200 ease-out origin-center">
                        {/* Notebook Frame */}
                        <img
                          className="absolute w-full h-full top-0 left-0 object-contain transform-gpu"
                          alt="Notebook frame"
                          src="/Notebook.webp"
                          loading="lazy"
                        />
                        {/* Project Image */}
                        <div className="absolute top-[14px] left-[35px] w-[210px] h-[128px] sm:top-[16px] sm:left-[40px] sm:w-[240px] sm:h-[146px] overflow-hidden rounded-sm">
                          <img
                            className="w-full h-full object-cover transition-transform duration-300 ease-out transform-gpu origin-center"
                            alt={project.alt || project.title}
                            src={project.homePreviewSrc ?? project.previewSrc}
                            loading="lazy"
                          />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
              
              {/* Carousel Indicators */}
              <div className="flex justify-center mt-4 gap-2">
                {config.projects.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handleIndicatorClick(index)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors duration-300",
                      currentSlide === index ? "bg-black" : "bg-gray-300"
                    )}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Desktop Grid */}
          <div className="hidden md:block">
            <div className="max-w-[1000px] mx-auto grid grid-cols-2 gap-8 place-items-center">
              {config.projects.map((project, index) => (
                <Link
                  key={project.id}
                  to={`/project/${project.id}`}
                  className={cn(
                    "w-full max-w-[400px] h-[400px] bg-neutral-100 flex items-center justify-center relative overflow-visible rounded-xl shadow-sm hover:shadow-lg transition-shadow hover:z-50 transform-gpu transition-transform transition-opacity duration-200 ease-out",
                    hoverProjectIndex !== null && hoverProjectIndex !== index
                      ? "opacity-50 blur-sm scale-90"
                      : "opacity-100 blur-0 scale-100",
                  )}
                >
                  <div
                    className={cn(
                      "relative w-[371px] h-[203px] transform-gpu transition-transform duration-200 ease-out origin-center",
                      hoverProjectIndex === index ? "scale-[2]" : "scale-100",
                    )}
                    onMouseEnter={() => setHoverProjectIndex(index)}
                    onMouseLeave={() => setHoverProjectIndex(null)}
                  >
                    {/** 使用完整的笔记本背景图片 */}
                    <img
                      className="absolute w-full h-full top-0 left-0 object-contain"
                      alt="Notebook frame"
                      src="/Notebook.webp"
                      loading="lazy"
                    />
                    {/** 项目图片显示区域 - 调整位置以适配新的笔记本框架 */}
                    <div className="absolute top-[18px] left-[46px] w-[279px] h-[172px] overflow-hidden rounded-sm">
                      <img
                        className="w-full h-full object-cover transition-transform duration-300 ease-out transform-gpu origin-center"
                        alt={project.alt || project.title}
                        src={project.homePreviewSrc ?? project.previewSrc}
                        loading="lazy"
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="contact" className="px-4 sm:px-6 md:px-[151px] pb-[120px] sm:pb-[140px] md:pb-[200px]">
          <h2 className="[font-family:'Inter',Helvetica] font-medium text-black text-2xl tracking-[0] leading-[normal] mb-[64px]">
            Contact.
          </h2>

          <Card className="w-full max-w-[686px] mx-auto bg-[#f7f9fb] border-0 rounded-2xl">
            <CardContent className="p-6 relative">
              <div className="mb-4">
                <div className="[font-family:'Source_Code_Pro',Helvetica] font-normal text-base sm:text-lg tracking-[0] leading-[18px] break-words overflow-x-hidden">
                  <span className="text-[#1c1c1c66] leading-5">
                    // E-mail address
                    <br />
                  </span>
                  {(() => {
                    const [user, domain] = config.contact.email.split("@");
                    return (
                      <>
                        <span className="text-[#ffac5f] leading-5">{user}</span>
                        <span className="text-[#3ea3ff] leading-5">@{domain}<br /></span>
                      </>
                    );
                  })()}
                  <span className="text-[#1c1c1c66] leading-[0.1px]">
                    <br />
                    // Linkedin
                    <br />
                  </span>
                  {(() => {
                    const rest = config.contact.linkedin.replace(/^https:/, "");
                    return (
                      <>
                        <span className="text-[#c378ff] leading-5">https:</span>
                        <span className="text-[#19c59c] leading-5 break-all">{rest}<br /></span>
                      </>
                    );
                  })()}
                  <span className="text-[#1c1c1c66] leading-[0.1px]">
                    <br />
                  </span>
                  <span className="text-[#1c1c1c66] leading-5">
                    // Phone Number
                    <br />
                  </span>
                  {(() => {
                    const phone = config.contact.phone;
                    const match = phone.match(/^\+\d+/);
                    const prefix = match ? match[0] : "";
                    const rest = match ? phone.slice(prefix.length).trim() : phone;
                    return (
                      <>
                        {prefix && (
                          <>
                            <span className="text-[#1c1c1c] leading-5">&nbsp;</span>
                            <span className="font-semibold text-[#ff31c5] leading-5">{prefix}</span>
                          </>
                        )}
                        <span className="text-[#1c1c1c] leading-5">&nbsp;</span>
                        <span className="text-[#c378ff] leading-5">{rest}</span>
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="absolute top-4 right-4 flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-auto w-auto p-1"
                  onClick={handleCopy}
                  aria-label="Copy contact info"
                title="Copy"
                >
                  <CopyIcon className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-auto w-auto p-1"
                  onClick={() => setShowContactModal(true)}
                  aria-label="Expand contact card"
                  title="Expand"
                >
                  <Maximize2Icon className="w-5 h-5" />
                </Button>
                {copied && (
                  <span className="text-xs text-muted-foreground">Copied!</span>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        <section id="resume" className="px-4 md:px-[151px] pb-[138px]">
          <h2 className="[font-family:'Inter',Helvetica] font-medium text-black text-2xl tracking-[0] leading-[normal] mb-[89px]">
            Resume.
          </h2>

          <div className="flex justify-center">
            <Button
              asChild
              className="w-[260px] h-[56px] sm:w-[320px] sm:h-[72px] md:w-[362px] md:h-[88px] gap-2 px-6 py-3 sm:px-8 sm:py-3 md:px-10 md:py-4 rounded-[36px] sm:rounded-[42px] md:rounded-[47px] bg-[linear-gradient(270deg,rgba(238,212,189,1)_0%,rgba(254,159,96,1)_100%)] hover:opacity-90 transition-opacity"
            >
              {(() => {
                const fileName = config.resume?.fileName || "Katherine_Fang_UX_CV_New_York_University.pdf";
                const fileUrl = "/Katherine_Fang_UX_CV_New_York_University.pdf";
                
                return (
                  <a href={fileUrl} download={fileName}>
                    <span className="[font-family:'Inter',Helvetica] font-bold text-black text-lg sm:text-xl md:text-2xl text-center tracking-[0] leading-[normal]">
                      Download My CV
                    </span>
                    <FileDownIcon className="w-5 h-5 sm:w-5 sm:h-5 md:w-6 md:h-6" />
                  </a>
                );
              })()}
            </Button>
          </div>
        </section>
      </main>

       <footer className="relative">
         <img
           className="w-full h-[34vw] sm:h-[28vw] md:h-[22vw] max-h-[369px] object-cover"
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
              href={config.contact.linkedin}
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

      {showContactModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <Card className="w-full max-w-[800px] mx-auto bg-[#f7f9fb] border-0 rounded-2xl">
            <CardContent className="p-6 relative">
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-auto w-auto p-1"
                  onClick={() => setShowContactModal(false)}
                  aria-label="Close"
                >
                  ✕
                </Button>
              </div>

              <div className="flex gap-4">
                <div className="[font-family:'Source_Code_Pro',Helvetica] text-[#1c1c1c66]">
                  <div>// E-mail address</div>
                   <div className="mt-1">
                     {(() => {
                       const [user, domain] = config.contact.email.split("@");
                       return (
                         <>
                           <span className="text-[#ffac5f]">{user}</span>
                           <span className="text-[#3ea3ff]">@{domain}</span>
                         </>
                       );
                     })()}
                   </div>

                  <div className="mt-4">// Linkedin</div>
                   <div className="mt-1">
                     {(() => {
                       const rest = config.contact.linkedin.replace(/^https:/, "");
                       return (
                         <>
                           <span className="text-[#c378ff]">https:</span>
                           <span className="text-[#19c59c]">{rest}</span>
                         </>
                       );
                     })()}
                   </div>

                  <div className="mt-4">// Phone Number</div>
                   <div className="mt-1">
                     {(() => {
                       const phone = config.contact.phone;
                       const match = phone.match(/^\+\d+/);
                       const prefix = match ? match[0] : "";
                       const rest = match ? phone.slice(prefix.length).trim() : phone;
                       return (
                         <>
                           {prefix && <span className="font-semibold text-[#ff31c5]">{prefix}</span>}
                           <span className="text-[#1c1c1c]">&nbsp;</span>
                           <span className="text-[#c378ff]">{rest}</span>
                         </>
                       );
                     })()}
                   </div>
                </div>
              </div>

              <div className="mt-6">
                <Button onClick={handleCopy}>
                  <CopyIcon className="mr-2" /> Copy all contact info
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
