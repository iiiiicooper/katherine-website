import { Copy as CopyIcon, FileDown as FileDownIcon, Maximize2 as Maximize2Icon, Menu as MenuIcon } from "lucide-react";
import React from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { cn } from "../../lib/utils";
import { loadConfig } from "../../lib/config";
import { Link } from "react-router-dom";

const navigationLinks = [
  { label: "About", href: "#about" },
  { label: "Project", href: "#project" },
  { label: "Contact", href: "#contact" },
  { label: "Resume", href: "#resume" },
];

// 首页数据从配置读取

export const AboutHome = (): JSX.Element => {
  const config = React.useMemo(() => loadConfig(), []);
  const [copied, setCopied] = React.useState(false);
  const [showContactModal, setShowContactModal] = React.useState(false);
  const [activeSection, setActiveSection] = React.useState("about");
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [hoverProjectIndex, setHoverProjectIndex] = React.useState<number | null>(null);

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
  return (
    <div className="bg-white w-full relative">
      <img
        className="absolute w-[57.25%] h-[318px] top-[151px] left-[256px] pointer-events-none"
        alt="Background gradient"
        src="/rectangle.png"
      />

      <header className="relative z-10">
        <nav className="flex items-center justify-between px-11 py-11">
          <div className="[font-family:'Inter',Helvetica] font-semibold text-black text-[32px] tracking-[0] leading-[normal]">
            K
          </div>

          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setMenuOpen((o) => !o)} aria-label="Toggle menu">
              <MenuIcon className="w-6 h-6" />
            </Button>
          </div>
          <div className="hidden md:flex items-center gap-[30px] md:gap-[89px]">
            {navigationLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                className={cn(
                  "[font-family:'Inter',Helvetica] font-medium text-black text-xl md:text-2xl tracking-[0] leading-[normal] hover:opacity-70 transition-opacity",
                  activeSection === link.href.slice(1) ? "underline" : "",
                )}
                aria-current={activeSection === link.href.slice(1) ? "page" : undefined}
              >
                {link.label}
              </a>
            ))}
          </div>
        </nav>

        {menuOpen && (
          <div className="md:hidden px-11 pb-4">
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

        <img
          className="w-full h-[3px] object-cover"
          alt="Divider line"
          src="/line-1.svg"
        />
      </header>

      <main className="relative">
        <section id="about" className="px-4 md:px-[151px] pt-[179px] pb-[245px]">
          <h1 className="[font-family:'Inter',Helvetica] font-extrabold text-black text-[64px] tracking-[0] leading-[normal] mb-[158px]">
            {config.about.title}
          </h1>

          <p className="w-[934px] [font-family:'Inter',Helvetica] font-medium text-black text-[28px] tracking-[0] leading-[normal]">
            {config.about.intro}
          </p>
        </section>

        <section id="project" className="px-4 md:px-[151px] pb-[400px]">
          <h2 className="[font-family:'Inter',Helvetica] font-medium text-black text-2xl tracking-[0] leading-[normal] mb-[52px] text-left">
            Project.
          </h2>

          <div className="max-w-[1000px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 place-items-center">
            {config.projects.map((project, index) => (
              <Link
                key={project.id}
                to={`/project/${project.id}`}
                className={cn(
                  "w-full sm:w-[400px] h-[300px] sm:h-[400px] bg-neutral-100 flex items-center justify-center relative overflow-visible rounded-xl shadow-sm hover:shadow-lg transition-shadow hover:z-50 transform-gpu transition-transform transition-opacity duration-200 ease-out",
                  hoverProjectIndex !== null && hoverProjectIndex !== index
                    ? "opacity-50 blur-sm scale-90"
                    : "opacity-100 blur-0 scale-100",
                )}
              >
                <div
                  className={cn(
                    "relative w-[371px] h-[203px] transform-gpu transition-transform duration-200 ease-out origin-center",
                    hoverProjectIndex === index ? "scale-[3]" : "scale-100",
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
                        />
                        <img
                          className="absolute w-full h-[2.95%] top-[97.05%] left-0"
                          alt="Laptop base"
                          src={baseSrc}
                        />
                      </>
                    );
                  })()}
                  <div className="absolute top-[11px] left-[42px] w-[287px] h-[180px] overflow-hidden rounded-sm">
                    <img
                      className="w-full h-full object-cover transition-transform duration-300 ease-out transform-gpu origin-center"
                      alt={project.alt || project.title}
                      src={project.previewSrc}
                    />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section id="contact" className="px-4 md:px-[151px] pb-[341px]">
          <h2 className="[font-family:'Inter',Helvetica] font-medium text-black text-2xl tracking-[0] leading-[normal] mb-[168px]">
            Contact.
          </h2>

          <Card className="w-[686px] mx-auto bg-[#f7f9fb] border-0 rounded-2xl">
            <CardContent className="p-6 relative">
              <div className="flex gap-2 mb-4">
                <div className="[font-family:'Source_Code_Pro',Helvetica] font-normal text-[#1c1c1c33] text-xl tracking-[0] leading-5">
                  1<br />
                  2<br />
                  3<br />
                  4<br />
                  5<br />
                  6<br />
                  7<br />8
                </div>

                <div className="[font-family:'Source_Code_Pro',Helvetica] font-normal text-lg tracking-[0] leading-[18px]">
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
                        <span className="text-[#19c59c] leading-5">{rest}<br /></span>
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

        <section id="resume" className="px-4 md:px-[151px] pb-[288px]">
          <h2 className="[font-family:'Inter',Helvetica] font-medium text-black text-2xl tracking-[0] leading-[normal] mb-[89px]">
            Resume.
          </h2>

          <div className="flex justify-center">
            <Button
              asChild
              className="w-[362px] h-[88px] gap-2 px-10 py-4 rounded-[47px] bg-[linear-gradient(270deg,rgba(238,212,189,1)_0%,rgba(254,159,96,1)_100%)] hover:opacity-90 transition-opacity"
            >
              <a href={config.resume.fileDataUrl || config.resume.url || "#"} download>
                <span className="[font-family:'Inter',Helvetica] font-bold text-black text-2xl text-center tracking-[0] leading-[normal]">
                  Download My CV
                </span>
                <FileDownIcon className="w-6 h-6" />
              </a>
            </Button>
          </div>
        </section>
      </main>

      <footer className="relative">
        <img
          className="w-full h-[369px] object-cover"
          alt="Footer gradient background"
          src="/-----x3d----9-9------.png"
        />

        <a
          href="/contact"
          className="absolute top-[29px] left-[102px] w-[167px] h-[70px] bg-white shadow-[0px_4px_4px_#00000040] flex items-center justify-center hover:opacity-80 transition-opacity"
        >
          <span className="[font-family:'Inter',Helvetica] font-medium text-black text-xl tracking-[0] leading-[normal] whitespace-nowrap">
            Get in touch
          </span>
        </a>

        <div className="absolute top-[55px] left-[299px] flex items-center gap-[30px]">
          <div className="w-[15px] h-[15px] bg-black rounded-[7.5px]" />
          <span className="[font-family:'Inter',Helvetica] font-medium text-black text-2xl tracking-[0] leading-[normal]">
            Available for work
          </span>
        </div>

        <a
          href={config.contact.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-[29px] right-[195px] [font-family:'Inter',Helvetica] font-medium text-black text-xl tracking-[0] leading-[normal] whitespace-nowrap hover:opacity-70 transition-opacity"
        >
          Linkedin
        </a>
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
