'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

interface Particle {
  x: number;
  y: number;
  size: number;
  imgIndex: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  opacity: number;
  fadeSpeed: number;
}

const FLOWERS = ['🌸', '🌺', '🌼', '💐', '🌻', '🌷', '🌹','🧸', '❤️', '✨'];

export default function FlowerCursor() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pathname = usePathname();

  const isAdminRoute = pathname?.startsWith('/admin');

  useEffect(() => {
    // Եթե admin route է, ոչ մի listener կամ animation frame չենք սկսում
    if (isAdminRoute) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    let mouseX = -100;
    let mouseY = -100;

    let ringX = -100;
    let ringY = -100;

    let lastX = 0;
    let lastY = 0;
    let lastTime = 0;

    const cachedImages: HTMLCanvasElement[] = [];
    FLOWERS.forEach((emoji) => {
      const offCanvas = document.createElement('canvas');
      offCanvas.width = 64;
      offCanvas.height = 64;
      const offCtx = offCanvas.getContext('2d');
      if (offCtx) {
        offCtx.font = '48px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
        offCtx.textAlign = 'center';
        offCtx.textBaseline = 'middle';
        offCtx.fillText(emoji, 32, 32);
      }
      cachedImages.push(offCanvas);
    });

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;

      const now = performance.now();
      if (now - lastTime < 25) return;

      const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY);

      if (dist > 8) {
        lastX = e.clientX;
        lastY = e.clientY;
        lastTime = now;

        const imgIndex = Math.floor(Math.random() * cachedImages.length);

        particles.push({
          x: e.clientX,
          y: e.clientY,
          size: Math.random() * 16 + 22,
          imgIndex,
          vx: (Math.random() - 0.5) * 2.8,
          vy: -(Math.random() * 2.5 + 2.2),
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.08,
          opacity: 1,
          fadeSpeed: Math.random() * 0.012 + 0.008,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    const gravity = 0.12;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Նկարում ենք ծաղիկները
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        p.vy += gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.vRot;
        p.opacity -= p.fadeSpeed;

        if (p.opacity <= 0) {
          particles.splice(i, 1);
          i--;
          continue;
        }

        const img = cachedImages[p.imgIndex];
        if (img) {
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.drawImage(img, -p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        }
      }

      // 2. Custom Cursor
      if (mouseX > 0 && mouseY > 0) {
        ringX += (mouseX - ringX) * 0.2;
        ringY += (mouseY - ringY) * 0.2;

        ctx.save();
        ctx.beginPath();
        ctx.arc(ringX, ringY, 18, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(163, 72, 94, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = '#a3485e';
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isAdminRoute]);

  if (isAdminRoute) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[9999] will-change-transform"
      style={{ transform: 'translateZ(0)' }}
    />
  );
}