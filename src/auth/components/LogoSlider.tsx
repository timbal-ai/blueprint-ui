const LOGOS = [
  "drivim",
  "benito",
  "girbau",
  "fredvic",
  "ferrer",
  "vicio",
  "civitatis",
];

const LogoSlider = () => (
  <div className="absolute bottom-12 left-0 right-0 z-10">
    <p className="text-[0.65rem] uppercase tracking-[0.12em] text-zinc-500 font-medium mb-5 pl-12">
      Trusted by
    </p>
    <div className="logo-slider-container relative w-full overflow-hidden">
      <div className="flex items-center gap-16 animate-slide w-max">
        {[...LOGOS, ...LOGOS].map((name, i) => (
          <img
            key={`${name}-${i}`}
            src={`/logos/${name}.png`}
            alt={name}
            className="h-5 w-auto shrink-0 opacity-45 grayscale brightness-[1.8]"
          />
        ))}
      </div>
    </div>
  </div>
);

export default LogoSlider;
