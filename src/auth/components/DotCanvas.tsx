import { useEffect, useRef } from "react";

interface Dot {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  baseOpacity: number;
}

const CONFIG = {
  dotSize: 2,
  gap: 20,
  baseColor: { r: 34, g: 197, b: 94 }, // #22c55e
  glowColor: { r: 134, g: 239, b: 172 }, // #86efac
  attractorRadius: 600,
  waveSpeed: 0.4,
};

const ATTRACTORS = [
  { angleX: 0, angleY: 0, speedX: 0.0005, speedY: 0.0007, radiusX: 0.6, radiusY: 0.6 },
  { angleX: 2, angleY: 1, speedX: 0.0009, speedY: 0.0006, radiusX: 0.4, radiusY: 0.7 },
  { angleX: 4, angleY: 3, speedX: 0.0006, speedY: 0.001, radiusX: 0.7, radiusY: 0.4 },
];

const DotCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<Dot[]>([]);
  const rafRef = useRef(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const container = canvas.parentElement!;

    const buildGrid = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cellSize = CONFIG.dotSize + CONFIG.gap;
      const cols = Math.ceil(rect.width / cellSize) + 2;
      const rows = Math.ceil(rect.height / cellSize) + 2;
      const offsetX = (rect.width - (cols - 1) * cellSize) / 2;
      const offsetY = (rect.height - (rows - 1) * cellSize) / 2;

      const dots: Dot[] = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = offsetX + col * cellSize;
          const y = offsetY + row * cellSize;
          dots.push({ baseX: x, baseY: y, x, y, baseOpacity: 0.1 + Math.random() * 0.2 });
        }
      }
      dotsRef.current = dots;
    };

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.clearRect(0, 0, w, h);

      const time = Date.now() - startRef.current;
      const waveTime = time * 0.001 * CONFIG.waveSpeed;

      const currentAttractors = ATTRACTORS.map((a) => ({
        x: w / 2 + Math.cos(time * a.speedX + a.angleX) * w * a.radiusX,
        y: h / 2 + Math.sin(time * a.speedY + a.angleY) * h * a.radiusY,
      }));

      const { baseColor, glowColor, attractorRadius, dotSize } = CONFIG;
      const proxSq = attractorRadius * attractorRadius;
      const radius = dotSize / 2;

      for (const dot of dotsRef.current) {
        const drift = Math.sin(dot.baseX * 0.01 + dot.baseY * 0.01 + waveTime) * 2;
        dot.x = dot.baseX + drift;
        dot.y = dot.baseY + drift;

        let totalInfluence = 0;
        for (const attr of currentAttractors) {
          const dx = dot.x - attr.x;
          const dy = dot.y - attr.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < proxSq) {
            const t = 1 - Math.sqrt(distSq) / attractorRadius;
            totalInfluence += t * t * (3 - 2 * t) * 0.7;
          }
        }
        totalInfluence = Math.min(1, totalInfluence);

        const r = Math.round(baseColor.r + (glowColor.r - baseColor.r) * totalInfluence);
        const g = Math.round(baseColor.g + (glowColor.g - baseColor.g) * totalInfluence);
        const b = Math.round(baseColor.b + (glowColor.b - baseColor.b) * totalInfluence);
        const opacity = Math.min(
          1,
          dot.baseOpacity + Math.sin(dot.x * 0.02 + waveTime) * 0.1 + totalInfluence * 0.8,
        );

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${opacity})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    buildGrid();
    rafRef.current = requestAnimationFrame(draw);
    window.addEventListener("resize", buildGrid);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", buildGrid);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-[1] pointer-events-none opacity-70"
    />
  );
};

export default DotCanvas;
