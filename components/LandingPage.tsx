import React, { useEffect, useRef } from 'react';
import { AppView } from '../types';

interface LandingPageProps {
  onNavigate: (view: AppView) => void;
  onStartTour?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onStartTour }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let time = 0;

    // Configuration for the silk ribbons (Updated for NanoCouture Warm Luxury Theme)
    const ribbons = [
      {
        color: '#A39696', // nc-ink-subtle
        opacity: 0.15,
        yOffset: 0.5,
        speed: 0.0005,
        amplitude: 120,
        frequency: 0.001,
        thickness: 150,
      },
      {
        color: '#FFFFFF', // White Highlight
        opacity: 0.6,
        yOffset: 0.6,
        speed: 0.0007,
        amplitude: 180,
        frequency: 0.0015,
        thickness: 100,
      },
      {
        color: '#9747FF', // nc-accent (Violet)
        opacity: 0.08,
        yOffset: 0.45,
        speed: 0.0003,
        amplitude: 150,
        frequency: 0.0008,
        thickness: 200,
      },
      {
        color: '#F6EBFF', // nc-accent-soft
        opacity: 0.3,
        yOffset: 0.55,
        speed: 0.0006,
        amplitude: 100,
        frequency: 0.002,
        thickness: 80,
      },
      {
        color: '#F9F5F1', // nc-bg (Masking Layer - MUST match global background)
        opacity: 0.6,
        yOffset: 0.7,
        speed: 0.0004,
        amplitude: 200,
        frequency: 0.001,
        thickness: 300,
      },
    ];

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // Helper to generate a compound sine wave (Octave Noise approximation)
    const getY = (x: number, t: number, freq: number, amp: number, phase: number) => {
      // Interaction calc
      const dx = x - mouseRef.current.x;
      // Simple distance check to create a "ripple" or "push" effect near mouse
      const dist = Math.abs(dx);
      const interaction = Math.max(0, 1 - dist / 800) * 100 * Math.sin(t * 0.05); // dynamic wave

      return (
        Math.sin(x * freq + t) * amp +
        Math.sin(x * freq * 2.1 + t * 1.5) * (amp * 0.5) +
        Math.sin(x * freq * 0.5 + t * 0.3) * (amp * 0.3) +
        interaction
      );
    };

    // Helper to convert hex to rgb string 'r, g, b'
    function hexToRgb(hex: string) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
        : '255, 255, 255';
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      ribbons.forEach((ribbon, i) => {
        const baseY = height * ribbon.yOffset;

        ctx.beginPath();

        // Dynamic gradient for sheen effect
        const gradient = ctx.createLinearGradient(0, 0, width, 0);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.2, `rgba(${hexToRgb(ribbon.color)}, ${ribbon.opacity})`);
        gradient.addColorStop(0.5, `rgba(${hexToRgb(ribbon.color)}, ${ribbon.opacity * 1.5})`); // Highlight center
        gradient.addColorStop(0.8, `rgba(${hexToRgb(ribbon.color)}, ${ribbon.opacity})`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;

        // Draw top edge of ribbon
        for (let x = 0; x <= width; x += 10) {
          const y = baseY + getY(x, time * ribbon.speed + i, ribbon.frequency, ribbon.amplitude, i);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        // Draw bottom edge of ribbon (reverse direction to close shape)
        for (let x = width; x >= 0; x -= 10) {
          const thicknessVar = Math.sin(x * 0.005 + time * 0.001) * 20;
          const y =
            baseY +
            ribbon.thickness +
            thicknessVar +
            getY(x, time * ribbon.speed + i + 0.5, ribbon.frequency, ribbon.amplitude, i);
          ctx.lineTo(x, y);
        }

        ctx.closePath();
        ctx.fill();
      });

      time += 20; // Time step
      requestAnimationFrame(animate);
    };

    const animationId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="relative flex flex-col min-h-screen bg-nc-bg text-nc-ink font-sans overflow-hidden selection:bg-nc-accent selection:text-white view-enter">
      {/* Animated Silk Background */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 w-full h-full pointer-events-none opacity-100"
      />

      {/* Vignette Overlay for Cinematic Depth (Updated to #F9F5F1) */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,#F9F5F1_120%)] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 w-full px-8 py-6 md:px-12 md:py-8 flex justify-between items-center">
        {/* Logo */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onNavigate(AppView.HOME);
          }}
          aria-label="Banana Couture Home"
          className="group"
        >
          <div className="flex items-center gap-3">
            <span className="font-bold text-lg leading-none tracking-tight text-nc-ink font-display hidden sm:block">
              Banana<span className="font-light">Couture</span>
            </span>
          </div>
        </a>

        {/* Navigation */}
        <nav>
          <ul className="flex items-center space-x-6 text-sm md:text-base text-nc-ink-soft font-medium">
            <li>
              <button
                onClick={() => onNavigate(AppView.STUDIO)}
                className="hover:text-nc-ink transition-colors"
              >
                Studio
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate(AppView.MARKETPLACE)}
                className="hover:text-nc-ink transition-colors"
              >
                Marketplace
              </button>
            </li>
            <li>
              <button
                onClick={() => onNavigate(AppView.CHALLENGES)}
                className="hover:text-nc-ink transition-colors"
              >
                Challenges
              </button>
            </li>
            <li>
              <span aria-hidden="true" className="text-nc-border-strong">
                ·
              </span>
            </li>
            <li>
              <button 
                onClick={() => onNavigate(AppView.PROFILE)}
                className="hover:text-nc-ink transition-colors font-bold"
              >
                Profile
              </button>
            </li>
          </ul>
        </nav>
      </header>

      {/* Main Content */}
      <main
        className="relative z-10 flex-grow flex items-center justify-center text-center px-4"
        id="main-content"
      >
        <section className="max-w-3xl flex flex-col items-center">
          
          {/* Heading */}
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-medium text-nc-ink mb-4 tracking-tight drop-shadow-sm animate-fade-in-up font-display"
            style={{ animationDelay: '0.1s' }}
          >
            “Welcome to <span className="gradient-text font-bold">Banana Couture.</span>”
          </h1>

          {/* Subheading */}
          <p
            className="text-lg md:text-xl text-nc-ink-soft mb-12 animate-fade-in-up font-light"
            style={{ animationDelay: '0.2s' }}
          >
            AI tools for fashion designers and digital ateliers.
          </p>

          {/* CTA Buttons */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full animate-fade-in-up"
            style={{ animationDelay: '0.3s' }}
          >
            <button
              onClick={() => onNavigate(AppView.STUDIO)}
              className="bg-nc-ink text-white py-3 px-8 rounded-full hover:bg-nc-ink/90 transition-colors w-full sm:w-auto font-bold shadow-nc-soft hover:shadow-nc-card transform hover:-translate-y-0.5 duration-200 uppercase tracking-wider text-sm"
            >
              Start Designing
            </button>
            <button
              onClick={onStartTour}
              className="bg-white border border-nc-border-strong text-nc-ink py-3 px-8 rounded-full hover:bg-nc-bg-soft transition-colors w-full sm:w-auto font-bold shadow-sm uppercase tracking-wider text-sm"
            >
              Watch Demo
            </button>
          </div>
        </section>
      </main>

      {/* Decorative Star Icon (Bottom Right) */}
      <div className="absolute bottom-8 right-8 z-10 animate-pulse text-nc-ink-subtle">
        <div className="relative w-8 h-8">
          <div className="absolute top-1/2 left-0 w-full h-px bg-current transform -translate-y-1/2" />
          <div className="absolute top-0 left-1/2 h-full w-px bg-current transform -translate-x-1/2" />
          <div className="absolute top-0 left-0 w-full h-full transform rotate-45 scale-50">
            <div className="absolute top-1/2 left-0 w-full h-px bg-current transform -translate-y-1/2" />
            <div className="absolute top-0 left-1/2 h-full w-px bg-current transform -translate-x-1/2" />
          </div>
        </div>
      </div>
    </div>
  );
};
