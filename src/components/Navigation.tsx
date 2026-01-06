import { useState, useEffect } from 'react';
import { Atom, Menu, X, ChevronDown } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavItem {
  label: string;
  id: string;
  type: 'link' | 'scroll' | 'dropdown';
  items?: { label: string; id: string }[];
}

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

  const navLinks: NavItem[] = [
    { label: 'Circuit', id: '/circuit', type: 'link' },
    { label: 'Playground', id: '/playground', type: 'link' },
    { label: 'Tutorial', id: '/tutorial', type: 'link' },
    { label: 'Error Control', id: '/error-control', type: 'link' },
    { label: 'Bloch', id: '/bloch-sphere', type: 'link' },
    { label: 'More', id: 'more', type: 'dropdown', items: [
      { label: 'Data Analysis', id: '/data-analysis' },
      { label: 'ZNE', id: '/zne' },
      { label: 'Benchmark', id: '/benchmark' },
      { label: 'Noise Models', id: '/noise-models' },
    ]},
  ];

  const renderNavLink = (link: NavItem) => {
    if (link.type === 'dropdown' && link.items) {
      return (
        <DropdownMenu key={link.id}>
          <DropdownMenuTrigger className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group flex items-center gap-1 outline-none">
            {link.label}
            <ChevronDown className="w-3 h-3" />
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="glass border-primary/20">
            {link.items.map((item) => (
              <DropdownMenuItem key={item.id} asChild>
                <Link
                  to={item.id}
                  className="cursor-pointer"
                >
                  {item.label}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    if (link.type === 'link') {
      return (
        <Link
          key={link.id}
          to={link.id}
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
        >
          {link.label}
          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
        </Link>
      );
    }

    return (
      <button
        key={link.id}
        onClick={() => isHomePage ? scrollToSection(link.id) : window.location.href = `/#${link.id}`}
        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative group"
      >
        {link.label}
        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
      </button>
    );
  };

  const renderMobileNavLink = (link: NavItem) => {
    if (link.type === 'dropdown' && link.items) {
      return (
        <div key={link.id} className="space-y-1">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider py-2">
            {link.label}
          </div>
          {link.items.map((item) => (
            <Link
              key={item.id}
              to={item.id}
              onClick={() => setIsMobileMenuOpen(false)}
              className="block w-full text-left py-2 pl-4 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div>
      );
    }

    if (link.type === 'link') {
      return (
        <Link
          key={link.id}
          to={link.id}
          onClick={() => setIsMobileMenuOpen(false)}
          className="block w-full text-left py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {link.label}
        </Link>
      );
    }

    return (
      <button
        key={link.id}
        onClick={() => isHomePage ? scrollToSection(link.id) : window.location.href = `/#${link.id}`}
        className="block w-full text-left py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        {link.label}
      </button>
    );
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'glass py-3' : 'py-5'
    }`}>
      <div className="container mx-auto px-4 flex items-center justify-between">
        <Link 
          to="/"
          className="flex items-center gap-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center group-hover:glow-sm transition-all duration-300">
            <Atom className="w-5 h-5 text-primary" />
          </div>
          <span className="text-lg font-bold text-foreground hidden sm:block">QuantumNoise</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map(renderNavLink)}
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
          {navLinks.map(renderMobileNavLink)}
        </div>
      )}
    </nav>
  );
};

export default Navigation;
