import { ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import QuantumBackground from '@/components/QuantumBackground';

interface Props {
  title: string;
  accent: string;
  rest: string;
  description: string;
  children: ReactNode;
}

const LabShell = ({ title, accent, rest, description, children }: Props) => (
  <>
    <Helmet>
      <title>{title} | QuantumNoise</title>
      <meta name="description" content={description} />
    </Helmet>
    <main className="relative min-h-screen bg-background overflow-x-hidden">
      <QuantumBackground />
      <header className="relative z-10 pt-8 px-4">
        <div className="container mx-auto max-w-6xl">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-gradient">{accent}</span> {rest}
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">{description}</p>
          </div>
        </div>
      </header>
      <section className="relative z-10 py-8 px-4">
        <div className="container mx-auto max-w-6xl space-y-6">{children}</div>
      </section>
    </main>
  </>
);

export const SliderRow = ({ label, value, children }: { label: string; value: string; children: ReactNode }) => (
  <div className="space-y-3">
    <label className="text-sm font-medium flex items-center justify-between">
      {label}
      <span className="text-primary font-mono">{value}</span>
    </label>
    {children}
  </div>
);

export const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg bg-muted/40 p-4 text-center">
    <div className="text-xs text-muted-foreground mb-1">{label}</div>
    <div className="text-xl font-mono font-bold text-primary">{value}</div>
  </div>
);

export default LabShell;
