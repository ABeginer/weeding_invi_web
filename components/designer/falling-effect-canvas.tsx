"use client";

import * as React from "react";
import type {
  DesignerFallingEffectElement,
  FallingEffectPreset,
  FallingEffectSource,
} from "@/components/ops/designer-types";

interface FallingEffectCanvasProps {
  effect: DesignerFallingEffectElement;
  /** "static" dùng cho editor (một frame); "live" cho thiệp/preview. */
  mode?: "live" | "static";
  /** Editor: luôn vẽ trong box, kể cả scope "Cả trang". */
  forceBox?: boolean;
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
  angle: number;
  rotation: number;
  spin: number;
  opacity: number;
  phase: number;
  swaySpeed: number;
  color: string;
  preset: FallingEffectPreset;
  source: FallingEffectSource;
}

interface Sprite {
  canvas: HTMLCanvasElement;
  size: number;
}

const spriteCache = new Map<string, Sprite>();

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function drawShape(
  context: CanvasRenderingContext2D,
  preset: FallingEffectPreset,
  size: number,
  color: string,
) {
  const half = size / 2;
  context.clearRect(0, 0, size, size);
  context.save();
  context.translate(half, half);
  context.fillStyle = color;

  switch (preset) {
    case "snow": {
      const gradient = context.createRadialGradient(0, 0, 0, 0, 0, half);
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.7, color);
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(0, 0, half, 0, Math.PI * 2);
      context.fill();
      break;
    }
    case "bubble": {
      context.globalAlpha = 0.42;
      context.beginPath();
      context.arc(0, 0, half * 0.9, 0, Math.PI * 2);
      context.fill();
      context.globalAlpha = 0.9;
      context.strokeStyle = color;
      context.lineWidth = Math.max(1, size * 0.05);
      context.stroke();
      context.beginPath();
      context.arc(-half * 0.3, -half * 0.3, half * 0.16, 0, Math.PI * 2);
      context.fillStyle = "rgba(255,255,255,0.8)";
      context.fill();
      break;
    }
    case "heart": {
      const s = size / 24;
      context.scale(s, s);
      context.beginPath();
      context.moveTo(0, 7);
      context.bezierCurveTo(-12, -3, -9, -11, 0, -5);
      context.bezierCurveTo(9, -11, 12, -3, 0, 7);
      context.closePath();
      context.fill();
      break;
    }
    case "star": {
      const s = size / 16;
      context.scale(s, s);
      context.beginPath();
      context.moveTo(0, -7);
      context.quadraticCurveTo(1.4, -1.4, 7, 0);
      context.quadraticCurveTo(1.4, 1.4, 0, 7);
      context.quadraticCurveTo(-1.4, 1.4, -7, 0);
      context.quadraticCurveTo(-1.4, -1.4, 0, -7);
      context.fill();
      break;
    }
    case "glitter": {
      if (size < 5) {
        context.beginPath();
        context.arc(0, 0, half * 0.8, 0, Math.PI * 2);
        context.fill();
      } else {
        context.fillRect(-half * 0.7, -half * 0.7, size * 0.7, size * 0.7);
      }
      break;
    }
    case "leaf": {
      context.rotate(-0.5);
      context.beginPath();
      context.ellipse(0, 0, half * 0.55, half, 0, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = "rgba(255,255,255,0.45)";
      context.lineWidth = Math.max(0.7, size * 0.035);
      context.beginPath();
      context.moveTo(0, -half * 0.75);
      context.lineTo(0, half * 0.75);
      context.stroke();
      break;
    }
    case "firefly": {
      const gradient = context.createRadialGradient(0, 0, 0, 0, 0, half);
      gradient.addColorStop(0, color);
      gradient.addColorStop(0.35, color);
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(0, 0, half, 0, Math.PI * 2);
      context.fill();
      break;
    }
    case "sakura":
    case "rose":
    default: {
      // Cánh hoa: một bên tròn, một bên có khía nhẹ.
      context.beginPath();
      context.moveTo(0, half * 0.95);
      context.bezierCurveTo(-half * 1.1, half * 0.15, -half * 0.75, -half, 0, -half * 0.55);
      context.bezierCurveTo(half * 0.75, -half, half * 1.1, half * 0.15, 0, half * 0.95);
      context.closePath();
      context.fill();
      context.globalAlpha = 0.28;
      context.fillStyle = "rgba(255,255,255,0.9)";
      context.beginPath();
      context.ellipse(0, -half * 0.2, half * 0.22, half * 0.45, 0, 0, Math.PI * 2);
      context.fill();
      break;
    }
  }
  context.restore();
}

function getSprite(
  preset: FallingEffectPreset,
  size: number,
  color: string,
): Sprite {
  const bucket = Math.max(3, Math.round(size));
  const key = `${preset}:${bucket}:${color}`;
  const cached = spriteCache.get(key);
  if (cached) return cached;

  const canvas = document.createElement("canvas");
  canvas.width = bucket;
  canvas.height = bucket;
  const context = canvas.getContext("2d");
  if (context) drawShape(context, preset, bucket, color);
  const sprite = { canvas, size: bucket };
  if (spriteCache.size > 180) spriteCache.clear();
  spriteCache.set(key, sprite);
  return sprite;
}

function drawIconShape(
  context: CanvasRenderingContext2D,
  icon: string,
  size: number,
  color: string,
) {
  const half = size / 2;
  context.clearRect(0, 0, size, size);
  context.save();
  context.translate(half, half);
  context.fillStyle = color;
  context.strokeStyle = color;
  context.lineWidth = Math.max(1, size * 0.075);
  context.lineCap = "round";
  context.lineJoin = "round";
  const s = size / 24;

  switch (icon) {
    case "Star": {
      context.beginPath();
      for (let point = 0; point < 10; point += 1) {
        const radius = point % 2 === 0 ? 10 * s : 4.6 * s;
        const angle = -Math.PI / 2 + (point * Math.PI) / 5;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (point === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.closePath();
      context.fill();
      break;
    }
    case "MapPin": {
      context.beginPath();
      context.arc(0, -2 * s, 6 * s, Math.PI, 0);
      context.lineTo(0, 10 * s);
      context.closePath();
      context.fill();
      context.fillStyle = "rgba(255,255,255,0.8)";
      context.beginPath();
      context.arc(0, -2 * s, 2.4 * s, 0, Math.PI * 2);
      context.fill();
      break;
    }
    case "CalendarDays": {
      context.beginPath();
      context.roundRect(-9 * s, -7 * s, 18 * s, 16 * s, 2.5 * s);
      context.stroke();
      context.beginPath();
      context.moveTo(-9 * s, -1 * s);
      context.lineTo(9 * s, -1 * s);
      context.stroke();
      context.fillRect(-5 * s, 3 * s, 2.5 * s, 2.5 * s);
      context.fillRect(0, 3 * s, 2.5 * s, 2.5 * s);
      context.fillRect(5 * s, 3 * s, 2.5 * s, 2.5 * s);
      break;
    }
    case "Music": {
      context.beginPath();
      context.arc(-4 * s, 6 * s, 3.2 * s, 0, Math.PI * 2);
      context.fill();
      context.beginPath();
      context.moveTo(-1 * s, 6 * s);
      context.lineTo(-1 * s, -7 * s);
      context.lineTo(8 * s, -9 * s);
      context.lineTo(8 * s, 4 * s);
      context.stroke();
      context.beginPath();
      context.arc(5 * s, 4 * s, 3.2 * s, 0, Math.PI * 2);
      context.fill();
      break;
    }
    case "QrCode": {
      const box = 5 * s;
      for (const [x, y] of [
        [-9 * s, -9 * s],
        [4 * s, -9 * s],
        [-9 * s, 4 * s],
      ] as const) {
        context.strokeRect(x, y, box, box);
      }
      context.fillRect(1 * s, 1 * s, 2.4 * s, 2.4 * s);
      context.fillRect(5 * s, 5 * s, 3 * s, 3 * s);
      context.fillRect(1 * s, 6 * s, 2 * s, 2 * s);
      break;
    }
    case "Camera": {
      context.beginPath();
      context.roundRect(-10 * s, -6 * s, 20 * s, 14 * s, 3 * s);
      context.fill();
      context.fillStyle = "rgba(255,255,255,0.8)";
      context.beginPath();
      context.arc(0, 1 * s, 4 * s, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = color;
      context.fillRect(-4 * s, -9 * s, 8 * s, 3 * s);
      break;
    }
    case "Flower2": {
      for (let petal = 0; petal < 5; petal += 1) {
        const angle = (petal * Math.PI * 2) / 5;
        context.beginPath();
        context.ellipse(
          Math.cos(angle) * 5 * s,
          Math.sin(angle) * 5 * s,
          4 * s,
          2.6 * s,
          angle,
          0,
          Math.PI * 2,
        );
        context.fill();
      }
      context.fillStyle = "rgba(255,255,255,0.85)";
      context.beginPath();
      context.arc(0, 0, 2.2 * s, 0, Math.PI * 2);
      context.fill();
      break;
    }
    case "Sparkles": {
      context.beginPath();
      context.moveTo(0, -10 * s);
      context.quadraticCurveTo(2 * s, -2 * s, 10 * s, 0);
      context.quadraticCurveTo(2 * s, 2 * s, 0, 10 * s);
      context.quadraticCurveTo(-2 * s, 2 * s, -10 * s, 0);
      context.quadraticCurveTo(-2 * s, -2 * s, 0, -10 * s);
      context.fill();
      break;
    }
    case "Mail": {
      context.beginPath();
      context.roundRect(-10 * s, -7 * s, 20 * s, 14 * s, 2.5 * s);
      context.stroke();
      context.beginPath();
      context.moveTo(-9 * s, -6 * s);
      context.lineTo(0, 1 * s);
      context.lineTo(9 * s, -6 * s);
      context.stroke();
      break;
    }
    case "Heart":
    default: {
      context.beginPath();
      context.moveTo(0, 8 * s);
      context.bezierCurveTo(-13 * s, -3 * s, -9 * s, -12 * s, 0, -5 * s);
      context.bezierCurveTo(9 * s, -12 * s, 13 * s, -3 * s, 0, 8 * s);
      context.closePath();
      context.fill();
      break;
    }
  }
  context.restore();
}

const imageCache = new Map<string, HTMLImageElement>();

function getSourceImage(url: string): HTMLImageElement | null {
  const cached = imageCache.get(url);
  if (cached) return cached.complete && cached.naturalWidth > 0 ? cached : null;
  const image = new Image();
  image.decoding = "async";
  image.src = url;
  imageCache.set(url, image);
  return null;
}

function getSourceSprite(
  source: FallingEffectSource,
  size: number,
  color: string,
): Sprite | null {
  if (source.type === "preset") return getSprite(source.preset, size, color);
  const bucket = Math.max(3, Math.round(size));

  if (source.type === "icon") {
    const key = `icon:${source.icon}:${bucket}:${source.color ?? color}`;
    const cached = spriteCache.get(key);
    if (cached) return cached;
    const canvas = document.createElement("canvas");
    canvas.width = bucket;
    canvas.height = bucket;
    const context = canvas.getContext("2d");
    if (context) drawIconShape(context, source.icon, bucket, source.color ?? color);
    const sprite = { canvas, size: bucket };
    if (spriteCache.size > 180) spriteCache.clear();
    spriteCache.set(key, sprite);
    return sprite;
  }

  const image = getSourceImage(source.url);
  if (!image) return null;
  const key = `image:${source.url}:${bucket}`;
  const cached = spriteCache.get(key);
  if (cached) return cached;
  const canvas = document.createElement("canvas");
  canvas.width = bucket;
  canvas.height = bucket;
  const context = canvas.getContext("2d");
  if (context) {
    const ratio = Math.min(bucket / image.naturalWidth, bucket / image.naturalHeight);
    const width = image.naturalWidth * ratio;
    const height = image.naturalHeight * ratio;
    context.drawImage(image, (bucket - width) / 2, (bucket - height) / 2, width, height);
  }
  const sprite = { canvas, size: bucket };
  if (spriteCache.size > 180) spriteCache.clear();
  spriteCache.set(key, sprite);
  return sprite;
}
const COLORS: Record<FallingEffectPreset, string[]> = {
  snow: ["#FFFFFF", "#F3F7FF", "#E8F0FA"],
  sakura: ["#F7C6D2", "#F3AFC0", "#FADDE4", "#EBA0B5"],
  rose: ["#B8454E", "#D46A70", "#8E2F39", "#E39A9C"],
  leaf: ["#C9A24D", "#B98A3D", "#D9BB74", "#9B7430"],
  heart: ["#D95468", "#E88A99", "#B83B50", "#F2B3BE"],
  star: ["#E8C66A", "#F5E3A5", "#D4AE4C", "#FFF3C4"],
  glitter: ["#E8C66A", "#FFF1B8", "#C9A24D", "#FFFFFF"],
  bubble: ["#DCEFF7", "#C8E6F2", "#F1FAFD", "#B9DDEB"],
  firefly: ["#F5E39A", "#FFF4C2", "#E8C66A", "#FFFFFF"],
};

function directionDegrees(
  direction: DesignerFallingEffectElement["direction"],
): number {
  switch (direction) {
    case "up":
      return 180;
    case "diagonalLeft":
      return -35;
    case "diagonalRight":
      return 35;
    case "down":
    default:
      return 0;
  }
}

export function FallingEffectCanvas({
  effect,
  mode = "live",
  forceBox = false,
  className,
}: FallingEffectCanvasProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const frameRef = React.useRef(0);
  const particlesRef = React.useRef<Particle[]>([]);
  const sizeRef = React.useRef({ width: 0, height: 0 });
  const startTimeRef = React.useRef(0);
  const lastTimeRef = React.useRef(0);
  const visibleRef = React.useRef(true);
  const effectKey = JSON.stringify(effect);

  React.useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const preset = effect.preset;
    const colors = COLORS[preset] ?? COLORS.sakura;
    const sources: FallingEffectSource[] =
      effect.sources && effect.sources.length > 0
        ? effect.sources
        : [{ type: "preset", preset }];
    const angle = directionDegrees(effect.direction);
    const angleRad = (angle * Math.PI) / 180;

    const buildParticles = () => {
      const width = sizeRef.current.width;
      const height = sizeRef.current.height;
      if (!width || !height) return;
      const areaScale = (width * height) / (390 * 844);
      const hardware = (
        navigator as Navigator & {
          hardwareConcurrency?: number;
          deviceMemory?: number;
        }
      ).hardwareConcurrency;
      const memory = (
        navigator as Navigator & {
          hardwareConcurrency?: number;
          deviceMemory?: number;
        }
      ).deviceMemory;
      const lowPower =
        (typeof hardware === "number" && hardware <= 4) ||
        (typeof memory === "number" && memory <= 4);
      const count = Math.round(
        clamp((effect.count ?? 40) * areaScale * (lowPower ? 0.5 : 1), 5, 150),
      );
      const particles: Particle[] = [];
      for (let index = 0; index < count; index += 1) {
        const source =
          sources[Math.floor(Math.random() * sources.length)] ?? sources[0];
        const sourcePreset =
          source.type === "preset" ? source.preset : preset;
        const sourceColors = COLORS[sourcePreset] ?? colors;
        const size = randomBetween(
          Math.min(effect.sizeMin, effect.sizeMax),
          Math.max(effect.sizeMin, effect.sizeMax),
        );
        const depthFactor = effect.depth
          ? 0.7 + (size / Math.max(1, effect.sizeMax)) * 0.6
          : 1;
        particles.push({
          x: randomBetween(-40, width + 40),
          y: randomBetween(-40, height + 40),
          size,
          speed:
            randomBetween(effect.speedMin, effect.speedMax) * depthFactor,
          angle: angleRad + randomBetween(-0.12, 0.12),
          rotation: randomBetween(0, Math.PI * 2),
          spin: effect.spin
            ? (effect.spinSpeed * Math.PI) / 180
            : 0,
          opacity: Math.min(
            1,
            randomBetween(effect.opacityMin, effect.opacityMax) *
              (effect.depth ? depthFactor : 1),
          ),
          phase: randomBetween(0, Math.PI * 2),
          swaySpeed:
            effect.swayFrequency * Math.PI * 2 * randomBetween(0.85, 1.15),
          color:
            source.type === "icon"
              ? source.color ?? "#C9A24D"
              : sourceColors[Math.floor(Math.random() * sourceColors.length)],
          preset: sourcePreset,
          source,
        });
      }
      particlesRef.current = particles;
      startTimeRef.current = performance.now();
    };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      sizeRef.current = { width, height };
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildParticles();
      if (mode === "static") {
        draw(performance.now());
      }
    };

    const draw = (now: number) => {
      const { width, height } = sizeRef.current;
      if (!width || !height) return;
      const elapsed = mode === "static" ? 1000 : now - startTimeRef.current;
      const fadeIn = Math.min(1, Math.max(0, elapsed / 600));
      const dt =
        mode === "static"
          ? 0
          : Math.min(0.05, Math.max(0, (now - lastTimeRef.current) / 1000));
      lastTimeRef.current = now;
      const time = elapsed / 1000;
      const sway = effect.swayAmplitude;

      context.clearRect(0, 0, width, height);

      for (const particle of particlesRef.current) {
        if (mode !== "static") {
          particle.x +=
            Math.sin(particle.angle) * particle.speed * dt +
            effect.wind * dt;
          particle.y += Math.cos(particle.angle) * particle.speed * dt;
          particle.rotation += particle.spin * dt;

          const margin = 70;
          const out =
            particle.y > height + margin ||
            particle.y < -margin ||
            particle.x > width + margin ||
            particle.x < -margin;
          if (out) {
            const down = effect.direction === "down" ||
              effect.direction === "diagonalLeft" ||
              effect.direction === "diagonalRight";
            particle.x = randomBetween(-margin, width + margin);
            particle.y = down
              ? -randomBetween(10, margin)
              : height + randomBetween(10, margin);
          }
        }

        const swayX =
          Math.sin(particle.phase + time * particle.swaySpeed) * sway;
        const sprite = getSourceSprite(
          particle.source,
          particle.size,
          particle.color,
        );
        if (!sprite) continue;
        context.save();
        context.globalAlpha = particle.opacity * fadeIn;
        context.translate(particle.x + swayX, particle.y);
        context.rotate(particle.rotation);
        context.drawImage(
          sprite.canvas,
          -sprite.size / 2,
          -sprite.size / 2,
          sprite.size,
          sprite.size,
        );
        context.restore();
      }
    };

    const loop = (now: number) => {
      if (!visibleRef.current || document.visibilityState === "hidden") {
        frameRef.current = 0;
        return;
      }
      draw(now);
      frameRef.current = window.requestAnimationFrame(loop);
    };

    const start = () => {
      if (mode === "static" || frameRef.current) return;
      lastTimeRef.current = performance.now();
      frameRef.current = window.requestAnimationFrame(loop);
    };
    const stop = () => {
      if (frameRef.current) window.cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") stop();
      else start();
    };

    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    const intersectionObserver =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver((entries) => {
            visibleRef.current = entries.some((entry) => entry.isIntersecting);
            if (visibleRef.current) start();
            else stop();
          })
        : null;
    intersectionObserver?.observe(container);

    document.addEventListener("visibilitychange", onVisibility);
    if (mode === "live") start();

    return () => {
      stop();
      resizeObserver.disconnect();
      intersectionObserver?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // Các tham số đã được chụp tại thời điểm tạo effect; đổi preset cần remount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectKey, mode]);

  const pageScope = effect.scope === "page" && mode === "live" && !forceBox;

  if (pageScope) {
    return (
      <div
        ref={containerRef}
        aria-hidden="true"
        className={`pointer-events-none fixed inset-0 z-20 ${className ?? ""}`}
      >
        <canvas ref={canvasRef} className="pointer-events-none block" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={`pointer-events-none h-full w-full overflow-hidden ${className ?? ""}`}
    >
      <canvas ref={canvasRef} className="pointer-events-none block" />
    </div>
  );
}
