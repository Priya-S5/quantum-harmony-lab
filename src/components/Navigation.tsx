import { useState, useEffect } from 'react';
import { Atom, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { label: 'Simulator', id: 'simulator', type: 'scroll' },
    { label: 'Features', id: 'features', type: 'scroll' },
    { label: 'ZNE', id: '/zne', type: 'link' },
    { label: 'Benchmark', id: '/benchmark', type: 'link' },
    { label: 'Noise Models', id: '/noise-models', type: 'link' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'glass py-3' : 'py-5'
    }`}>
      <div className="container mx-auto px-4 flex items-center justify-between">
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center group-hover:glow-sm transition-all duration-300">
            <Atom className="w-5 h-5 text-primary" />
          </div>
          <span className="text-lg font-bold text-foreground hidden sm:block">QuantumNoise</span>
        </button>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            link.type === 'link' ? (
              <Link
                key={link.id}
                to={link.id}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
              </Link>
            ) : (
              <button
                key={link.id}
                onClick={() => isHomePage ? scrollToSection(link.id) : window.location.href = `/#${link.id}`}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
              </button>
            )
          ))}
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden glass mt-2 mx-4 rounded-xl p-4 animate-fade-up">
          {navLinks.map((link) => (
            link.type === 'link' ? (
              <Link
                key={link.id}
                to={link.id}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full text-left py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ) : (
              <button
                key={link.id}
                onClick={() => isHomePage ? scrollToSection(link.id) : window.location.href = `/#${link.id}`}
                className="block w-full text-left py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </button>
            )
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navigation;