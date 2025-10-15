import { Copy as CopyIcon, FileDown as FileDownIcon, Maximize2 as Maximize2Icon, Menu as MenuIcon } from "lucide-react";
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

        <section id="project" className="px-4 sm:px-6 md:px-[151px] pb-[120px] sm:pb-[140px] md:pb-[200px]">
          <h2 className="[font-family:'Inter',Helvetica] font-medium text-black text-2xl tracking-[0] leading-[normal] mb-[52px] text-left">
            Project.
          </h2>

          <div className="max-w-[1000px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 place-items-center">
            {config.projects.map((project, index) => (
              <Link
                key={project.id}
                to={`/project/${project.id}`}
                className={cn(
                  "w-full sm:w-[360px] md:w-[400px] h-[260px] sm:h-[340px] md:h-[400px] bg-neutral-100 flex items-center justify-center relative overflow-visible rounded-xl shadow-sm hover:shadow-lg transition-shadow hover:z-50 transform-gpu transition-transform transition-opacity duration-200 ease-out",
                  hoverProjectIndex !== null && hoverProjectIndex !== index
                    ? "opacity-50 blur-sm scale-90"
                    : "opacity-100 blur-0 scale-100",
                )}
              >
                <div
                  className={cn(
                    "relative w-[260px] h-[142px] sm:w-[320px] sm:h-[176px] md:w-[371px] md:h-[203px] transform-gpu transition-transform duration-200 ease-out origin-center",
                    hoverProjectIndex === index ? "scale-[2]" : "scale-100",
                  )}
                  onMouseEnter={() => setHoverProjectIndex(index)}
                  onMouseLeave={() => setHoverProjectIndex(null)}
                >
                  {/** 根据索引选择不同的装饰屏幕与底座 */}
                  {(() => {
                    const screenSrc = index % 2 === 0 ? "/screen-1.png" : "/screen.png";
                    const baseSrc = index % 2 === 0 ? "/base-1.png" : "/base.png";
                    return (
                      <>
                        <img
                          className="absolute w-[81.01%] h-[98.18%] top-0 left-[9.50%]"
                          alt="Laptop screen"
                          src={screenSrc}
                          loading="lazy"
                        />
                        <img
                          className="absolute w-full h-[2.95%] top-[97.05%] left-0"
                          alt="Laptop base"
                          src={baseSrc}
                          loading="lazy"
                        />
                      </>
                    );
                  })()}
                  <div className="absolute top-[8px] left-[28px] w-[204px] h-[128px] sm:top-[10px] sm:left-[36px] sm:w-[250px] sm:h-[156px] md:top-[11px] md:left-[42px] md:w-[287px] md:h-[180px] overflow-hidden rounded-sm">
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
                const fileName = config.resume?.fileName || "Katherine-Fang-CV.pdf";
                
                return (
                  <a href="/api/download-resume" download={fileName}>
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
