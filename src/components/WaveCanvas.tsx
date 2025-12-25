import { useEffect, useRef, useState } from 'react';

interface WaveCanvasProps {
  type: 'clean' | 'noisy' | 'corrected';
  isAnimating?: boolean;
  noiseLevel?: number;
}

const WaveCanvas = ({ type, isAnimating = true, noiseLevel = 0.1 }: WaveCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const [time, setTime] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const draw = (t: number) => {
      const width = canvas.width / window.devicePixelRatio;
      const height = canvas.height / window.devicePixelRatio;
      
      ctx.clearRect(0, 0, width, height);
      
      // Create gradient for wave
      const gradient = ctx.createLinearGradient(0, 0, width, 0);
      
      if (type === 'clean') {
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(0, 200, 255, 0.9)');
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0.8)');
      } else if (type === 'noisy') {
        gradient.addColorStop(0, 'rgba(168, 85, 247, 0.8)');
        gradient.addColorStop(0.5, 'rgba(236, 72, 153, 0.9)');
        gradient.addColorStop(1, 'rgba(168, 85, 247, 0.8)');
      } else {
        gradient.addColorStop(0, 'rgba(52, 211, 153, 0.8)');
        gradient.addColorStop(0.5, 'rgba(0, 255, 200, 0.9)');
        gradient.addColorStop(1, 'rgba(52, 211, 153, 0.8)');
      }

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Draw main wave
      ctx.beginPath();
      
      for (let x = 0; x <= width; x += 2) {
        const normalizedX = x / width;
        let y = height / 2;
        
        // Main sine wave
        y += Math.sin(normalizedX * Math.PI * 4 + t * 0.002) * 30;
        y += Math.sin(normalizedX * Math.PI * 2 + t * 0.001) * 15;
        
        // Add noise for noisy wave
        if (type === 'noisy') {
          y += (Math.random() - 0.5) * noiseLevel * 100;
          y += Math.sin(normalizedX * Math.PI * 20 + t * 0.01) * 8;
        }
        
        // Corrected wave - smoother but with slight variation
        if (type === 'corrected') {
          y += Math.sin(normalizedX * Math.PI * 6 + t * 0.0015) * 5;
        }
        
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      
      ctx.stroke();

      // Add glow effect
      ctx.shadowBlur = 20;
      ctx.shadowColor = type === 'clean' ? 'rgba(0, 255, 255, 0.5)' 
        : type === 'noisy' ? 'rgba(168, 85, 247, 0.5)' 
        : 'rgba(52, 211, 153, 0.5)';
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    let lastTime = 0;
    const animate = (currentTime: number) => {
      if (isAnimating) {
        draw(currentTime);
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationRef.current);
    };
  }, [type, isAnimating, noiseLevel]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-32 rounded-lg wave-canvas"
    />
  );
};

export default WaveCanvas;