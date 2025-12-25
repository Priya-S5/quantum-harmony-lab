import { Beaker, BarChart3, Zap, Target, TrendingUp, Wrench } from 'lucide-react';
import Navigation from '@/components/Navigation';
import QuantumBackground from '@/components/QuantumBackground';
import HeroSection from '@/components/HeroSection';
import NoiseSimulator from '@/components/NoiseSimulator';
import FeatureCard from '@/components/FeatureCard';
import TechStack from '@/components/TechStack';

const features = [
  {
    icon: <Beaker className="w-6 h-6" />,
    title: 'Noise Channel Simulation',
    description: 'Comprehensive modeling of depolarizing, amplitude damping, and phase damping noise using Qiskit\'s advanced noise frameworks.',
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: 'Fidelity Analysis',
    description: 'Track circuit accuracy degradation across increasing depths, revealing practical limits for NISQ algorithms.',
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Error Mitigation',
    description: 'Implement Zero-Noise Extrapolation, measurement error correction, and circuit folding to restore quantum advantage.',
  },
  {
    icon: <Target className="w-6 h-6" />,
    title: 'Algorithm Benchmarking',
    description: 'Test QFT, Grover\'s, and VQE under realistic noise conditions to evaluate robustness and optimization strategies.',
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: 'Performance Insights',
    description: 'Visual analytics showing noise probability vs. accuracy, depth vs. fidelity, and mitigation effectiveness metrics.',
  },
  {
    icon: <Wrench className="w-6 h-6" />,
    title: 'Hardware Optimization',
    description: 'Inform better quantum hardware design decisions and circuit compilation strategies based on noise characteristics.',
  },
];

const Index = () => {
  return (
    <main className="relative min-h-screen bg-background overflow-x-hidden">
      <QuantumBackground />
      <Navigation />
      
      <HeroSection />

      {/* Simulator Section */}
      <section id="simulator" className="relative z-10 py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="section-title mb-4">
              <span className="text-gradient">Interactive</span> Wave Simulator
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Visualize quantum noise channels and error mitigation in real-time
            </p>
          </div>
          
          <NoiseSimulator />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="section-title mb-4">
              <span className="text-gradient">Research</span> Capabilities
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools for understanding and mitigating quantum noise
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard
                key={feature.title}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                delay={index * 100}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section id="tech" className="relative z-10 py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="section-title mb-4">
              Built with <span className="text-gradient">Quantum Precision</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-10">
              Powered by industry-standard quantum computing frameworks
            </p>
          </div>
          
          <TechStack />
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-10 px-4 border-t border-border/50">
        <div className="container mx-auto max-w-6xl text-center">
          <p className="text-sm text-muted-foreground">
            Quantum Noise Research • NISQ Era Computing
          </p>
        </div>
      </footer>
    </main>
  );
};

export default Index;