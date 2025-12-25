import { ArrowDown, Atom, Waves } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HeroSection = () => {
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden px-4 pt-20">
      {/* Hero glow effect */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-hero opacity-50 blur-3xl pointer-events-none" />
      
      {/* Floating atoms */}
      <div className="absolute top-32 left-[15%] animate-float opacity-20">
        <Atom className="w-16 h-16 text-primary" />
      </div>
      <div className="absolute bottom-40 right-[10%] animate-float opacity-20" style={{ animationDelay: '2s' }}>
        <Atom className="w-12 h-12 text-secondary" />
      </div>
      <div className="absolute top-1/2 left-[5%] animate-float opacity-15" style={{ animationDelay: '4s' }}>
        <Waves className="w-20 h-20 text-quantum-pink" />
      </div>

      <div className="relative z-10 text-center max-w-5xl mx-auto">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 opacity-0 animate-fade-up">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
            NISQ Era Research
          </span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold mb-6 tracking-tight opacity-0 animate-fade-up delay-100">
          <span className="text-gradient">Noise & Error Modeling</span>
          <br />
          <span className="text-foreground">in Quantum Circuits</span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 opacity-0 animate-fade-up delay-200 leading-relaxed">
          Simulating, analyzing, and mitigating quantum noise to push the boundaries of near-term quantum computing
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center opacity-0 animate-fade-up delay-300">
          <Button 
            size="lg" 
            onClick={() => scrollToSection('simulator')}
            className="bg-primary text-primary-foreground hover:bg-primary/90 glow-sm group"
          >
            <Waves className="w-4 h-4 mr-2 group-hover:animate-pulse" />
            Explore Simulator
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => scrollToSection('features')}
            className="border-border/50 hover:border-primary hover:bg-primary/5"
          >
            View Research
          </Button>
          <Button 
            variant="ghost" 
            size="lg" 
            onClick={() => scrollToSection('tech')}
            className="hover:bg-secondary/10"
          >
            Framework
          </Button>
        </div>

        {/* Scroll indicator */}
        <div className="mt-16 opacity-0 animate-fade-up delay-500">
          <button 
            onClick={() => scrollToSection('simulator')}
            className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors mx-auto"
          >
            <span className="text-xs uppercase tracking-widest">Scroll</span>
            <ArrowDown className="w-4 h-4 animate-bounce" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;