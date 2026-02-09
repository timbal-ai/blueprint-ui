import { useEffect } from "react";
import AuthCard from "../components/AuthCard";
import DotCanvas from "../components/DotCanvas";
import LogoSlider from "../components/LogoSlider";
import TimbalSvgLogo from "../components/TimbalSvgLogo";

const DOCS_ICON = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
    />
  </svg>
);

export default function LogInPage() {
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("inviteRef");
    if (ref) sessionStorage.setItem("inviteRef", ref);
  }, []);

  return (
    <div className="flex flex-col lg:flex-row h-screen w-screen overflow-y-auto lg:overflow-hidden antialiased bg-[#0a0a0a] text-zinc-100">
      {/* Left column */}
      <div className="relative z-20 flex flex-col items-center justify-start pt-12 lg:justify-center lg:pt-0 w-full min-h-screen lg:w-1/2 lg:h-full lg:min-h-0 px-4 pb-8 lg:p-8 bg-[#0a0a0a] lg:border-r lg:border-[#121212]">
        {/* Animated green border line */}
        <div
          className="hidden lg:block absolute top-0 -right-px w-px h-full z-50 animate-border-flow"
          style={{
            background:
              "linear-gradient(to top, rgba(34,197,94,0) 0%, rgba(34,197,94,0) 40%, rgba(34,197,94,0.8) 50%, rgba(34,197,94,0) 60%, rgba(34,197,94,0) 100%)",
            backgroundSize: "100% 300%",
          }}
        />

        {/* Logo — top-left on desktop, centered on mobile */}
        <div className="mb-8 lg:mb-0 lg:absolute lg:top-8 lg:left-8 z-30 opacity-90 hover:opacity-100 transition-opacity text-white">
          <TimbalSvgLogo />
        </div>

        <AuthCard />
      </div>

      {/* Right column */}
      <div className="hidden lg:flex relative w-1/2 h-full flex-col items-center justify-center overflow-hidden bg-[#030303]">
        {/* Docs button */}
        <a
          href="https://docs.timbal.ai/"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-8 right-8 z-30 flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-md no-underline text-zinc-500 bg-zinc-900 border border-zinc-800 transition-all hover:text-zinc-300 hover:bg-[#1f1f23] hover:border-zinc-700 [&_svg]:w-3.5 [&_svg]:h-3.5 [&_svg]:opacity-70"
        >
          {DOCS_ICON}
          Documentation
        </a>

        <DotCanvas />
        <LogoSlider />
      </div>
    </div>
  );
}
