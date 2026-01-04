import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, Waves, CircleDot, Shuffle, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, ScatterChart, Scatter, ZAxis } from 'recharts';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QuantumBackground from '@/components/QuantumBackground';

interface BlochPoint {
  x: number;
  y: number;
  z: number;
  label: string;
}

const NoiseModels = () => {
  const [depolarizingP, setDepolarizingP] = useState(0.1);
  const [amplitudeDampingGamma, setAmplitudeDampingGamma] = useState(0.2);
  const [phaseDampingLambda, setPhaseDampingLambda] = useState(0.15);
  const [time, setTime] = useState(1);

  const noiseModels = [
    {
      id: 'depolarizing',
      name: 'Depolarizing Channel',
      icon: Shuffle,
      color: 'hsl(var(--primary))',
      description: 'Uniformly shrinks the Bloch sphere, mixing the state with the maximally mixed state.',
      formula: 'ρ → (1-p)ρ + (p/3)(XρX + YρY + ZρZ)',
    },
    {
      id: 'amplitude',
      name: 'Amplitude Damping',
      icon: Waves,
      color: 'hsl(var(--accent))',
      description: 'Models energy dissipation (T₁ decay), causing excited states to relax to ground state.',
      formula: 'E₀ = |0⟩⟨0| + √(1-γ)|1⟩⟨1|, E₁ = √γ|0⟩⟨1|',
    },
    {
      id: 'phase',
      name: 'Phase Damping',
      icon: CircleDot,
      color: 'hsl(var(--warning))',
      description: 'Models dephasing (T₂ decay), destroying quantum coherence without energy loss.',
      formula: 'E₀ = |0⟩⟨0| + √(1-λ)|1⟩⟨1|, E₁ = √λ|1⟩⟨1|',
    },
  ];

  // Generate fidelity decay over time
  const fidelityData = useMemo(() => {
    const times = Array.from({ length: 50 }, (_, i) => i * 0.1);
    return times.map(t => ({
      time: t.toFixed(1),
      depolarizing: Math.exp(-depolarizingP * t) * 100,
      amplitude: (1 - amplitudeDampingGamma * (1 - Math.exp(-t))) * 100,
      phase: Math.exp(-phaseDampingLambda * t) * 100,
    }));
  }, [depolarizingP, amplitudeDampingGamma, phaseDampingLambda]);

  // Bloch vector components over parameter sweep
  const blochComponentData = useMemo(() => {
    const params = Array.from({ length: 21 }, (_, i) => i * 0.05);
    return params.map(p => {
      // Starting state |+⟩ = (|0⟩ + |1⟩)/√2, Bloch vector (1, 0, 0)
      const depX = 1 - (4 * p / 3); // Shrinks uniformly
      const ampX = Math.sqrt(1 - p); // Amplitude damping effect on x
      const ampZ = p; // Shifts toward |0⟩
      const phaseX = 1 - p; // Phase damping destroys x coherence
      
      return {
        param: p.toFixed(2),
        depX: Math.max(0, depX),
        depY: 0,
        depZ: 0,
        ampX: Math.max(0, ampX),
        ampZ: Math.min(1, ampZ),
        phaseX: Math.max(0, phaseX),
        phaseZ: 0,
      };
    });
  }, []);

  // Purity decay comparison
  const purityData = useMemo(() => {
    const params = Array.from({ length: 21 }, (_, i) => i * 0.05);
    return params.map(p => {
      // Purity = Tr(ρ²)
      const depPurity = 1 - (8 * p / 9) * (1 - p / 3);
      const ampPurity = 1 - p * (1 - p);
      const phasePurity = 1 - p / 2;
      
      return {
        param: p.toFixed(2),
        depolarizing: Math.max(0.5, depPurity) * 100,
        amplitude: Math.max(0.5, ampPurity) * 100,
        phase: Math.max(0.5, phasePurity) * 100,
      };
    });
  }, []);

  // Bloch sphere 2D projection data
  const blochSphereData = useMemo(() => {
    const points: { x: number; z: number; size: number; category: string }[] = [];
    
    // Original state (|+⟩)
    points.push({ x: 1, z: 0, size: 200, category: 'Original' });
    
    // Depolarizing channel effect
    const depScale = 1 - (4 * depolarizingP / 3);
    points.push({ x: Math.max(0, depScale), z: 0, size: 150, category: 'Depolarizing' });
    
    // Amplitude damping effect
    const ampX = Math.sqrt(1 - amplitudeDampingGamma);
    const ampZ = amplitudeDampingGamma;
    points.push({ x: ampX, z: ampZ, size: 150, category: 'Amplitude' });
    
    // Phase damping effect
    const phaseX = 1 - phaseDampingLambda;
    points.push({ x: Math.max(0, phaseX), z: 0, size: 150, category: 'Phase' });
    
    return points;
  }, [depolarizingP, amplitudeDampingGamma, phaseDampingLambda]);

  // Calculate current state properties
  const stateProperties = useMemo(() => {
    return noiseModels.map((model, idx) => {
      let purity, coherence, population;
      const params = [depolarizingP, amplitudeDampingGamma, phaseDampingLambda];
      const p = params[idx];
      
      if (model.id === 'depolarizing') {
        purity = 1 - (8 * p / 9) * (1 - p / 3);
        coherence = 1 - (4 * p / 3);
        population = 0.5;
      } else if (model.id === 'amplitude') {
        purity = 1 - p * (1 - p);
        coherence = Math.sqrt(1 - p);
        population = p;
      } else {
        purity = 1 - p / 2;
        coherence = 1 - p;
        population = 0.5;
      }
      
      return {
        ...model,
        purity: Math.max(0.5, purity) * 100,
        coherence: Math.max(0, coherence) * 100,
        population: population * 100,
        param: p,
      };
    });
  }, [depolarizingP, amplitudeDampingGamma, phaseDampingLambda]);

  return (
    <>
      <Helmet>
        <title>Noise Models | QuantumNoise</title>
        <meta name="description" content="Compare quantum noise channels: depolarizing, amplitude damping, and phase damping effects on quantum states with interactive visualizations." />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
        <QuantumBackground />
        
        <div className="relative z-10">
          {/* Header */}
          <header className="container mx-auto px-4 py-8">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                <Target className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gradient">Noise Model Comparison</h1>
                <p className="text-muted-foreground">Visualize quantum decoherence channels</p>
              </div>
            </div>
          </header>

          <main className="container mx-auto px-4 pb-16">
            {/* Noise Model Cards */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {stateProperties.map((model) => {
                const Icon = model.icon;
                return (
                  <div key={model.id} className="glass p-6 rounded-2xl">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${model.color}20` }}>
                        <Icon className="w-5 h-5" style={{ color: model.color }} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{model.name}</h3>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{model.description}</p>
                    <code className="block text-xs font-mono text-muted-foreground bg-muted/30 p-2 rounded-lg mb-4 overflow-x-auto">
                      {model.formula}
                    </code>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-lg font-bold" style={{ color: model.color }}>{model.purity.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">Purity</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground">{model.coherence.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">Coherence</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground">{model.population.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">|1⟩ Pop.</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Controls */}
            <div className="glass p-6 rounded-2xl mb-8">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Noise Parameters</h3>
              <div className="grid md:grid-cols-3 gap-8">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Shuffle className="w-4 h-4 text-primary" />
                      Depolarizing (p)
                    </label>
                    <span className="text-sm font-mono text-primary">{depolarizingP.toFixed(2)}</span>
                  </div>
                  <Slider
                    value={[depolarizingP]}
                    onValueChange={([v]) => setDepolarizingP(v)}
                    min={0}
                    max={0.75}
                    step={0.01}
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Waves className="w-4 h-4 text-accent" />
                      Amplitude Damping (γ)
                    </label>
                    <span className="text-sm font-mono text-accent">{amplitudeDampingGamma.toFixed(2)}</span>
                  </div>
                  <Slider
                    value={[amplitudeDampingGamma]}
                    onValueChange={([v]) => setAmplitudeDampingGamma(v)}
                    min={0}
                    max={1}
                    step={0.01}
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <CircleDot className="w-4 h-4 text-warning" />
                      Phase Damping (λ)
                    </label>
                    <span className="text-sm font-mono text-warning">{phaseDampingLambda.toFixed(2)}</span>
                  </div>
                  <Slider
                    value={[phaseDampingLambda]}
                    onValueChange={([v]) => setPhaseDampingLambda(v)}
                    min={0}
                    max={1}
                    step={0.01}
                  />
                </div>
              </div>
            </div>

            {/* Charts */}
            <Tabs defaultValue="fidelity" className="space-y-6">
              <TabsList className="glass">
                <TabsTrigger value="fidelity">Fidelity Decay</TabsTrigger>
                <TabsTrigger value="purity">Purity</TabsTrigger>
                <TabsTrigger value="bloch">Bloch Vector</TabsTrigger>
                <TabsTrigger value="projection">State Space</TabsTrigger>
              </TabsList>

              <TabsContent value="fidelity" className="glass p-6 rounded-2xl">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Fidelity Decay Over Time</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  How state fidelity decreases under continuous noise application
                </p>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={fidelityData}>
                    <defs>
                      <linearGradient id="depGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="ampGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="phaseGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                    <XAxis 
                      dataKey="time" 
                      stroke="hsl(var(--muted-foreground))"
                      label={{ value: 'Time (a.u.)', position: 'bottom', fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      label={{ value: 'Fidelity (%)', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
                      domain={[0, 100]}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                      }}
                      formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
                    />
                    <Legend />
                    <Area type="monotone" dataKey="depolarizing" name="Depolarizing" stroke="hsl(var(--primary))" fill="url(#depGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="amplitude" name="Amplitude Damping" stroke="hsl(var(--accent))" fill="url(#ampGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="phase" name="Phase Damping" stroke="hsl(var(--warning))" fill="url(#phaseGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="purity" className="glass p-6 rounded-2xl">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Purity vs Noise Strength</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  How quantum state purity (Tr(ρ²)) degrades with increasing noise parameter
                </p>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={purityData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                    <XAxis 
                      dataKey="param" 
                      stroke="hsl(var(--muted-foreground))"
                      label={{ value: 'Noise Parameter', position: 'bottom', fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      label={{ value: 'Purity (%)', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
                      domain={[50, 100]}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                      }}
                      formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="depolarizing" name="Depolarizing" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="amplitude" name="Amplitude Damping" stroke="hsl(var(--accent))" strokeWidth={3} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="phase" name="Phase Damping" stroke="hsl(var(--warning))" strokeWidth={3} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="bloch" className="glass p-6 rounded-2xl">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Bloch Vector Components</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Evolution of Bloch vector components (starting from |+⟩ state) under each channel
                </p>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={blochComponentData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                    <XAxis 
                      dataKey="param" 
                      stroke="hsl(var(--muted-foreground))"
                      label={{ value: 'Noise Parameter', position: 'bottom', fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      label={{ value: 'Component Value', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
                      domain={[0, 1]}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="depX" name="Depol. X" stroke="hsl(var(--primary))" strokeWidth={2} />
                    <Line type="monotone" dataKey="ampX" name="Amp. X" stroke="hsl(var(--accent))" strokeWidth={2} />
                    <Line type="monotone" dataKey="ampZ" name="Amp. Z" stroke="hsl(var(--accent))" strokeWidth={2} strokeDasharray="5 5" />
                    <Line type="monotone" dataKey="phaseX" name="Phase X" stroke="hsl(var(--warning))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="projection" className="glass p-6 rounded-2xl">
                <h3 className="text-lg font-semibold mb-4 text-foreground">State Space Projection (X-Z Plane)</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  2D projection showing how each channel transforms the |+⟩ state
                </p>
                <ResponsiveContainer width="100%" height={400}>
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                    <XAxis 
                      type="number" 
                      dataKey="x" 
                      domain={[-0.1, 1.1]} 
                      stroke="hsl(var(--muted-foreground))"
                      label={{ value: 'X Component', position: 'bottom', fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="z" 
                      domain={[-0.1, 1.1]} 
                      stroke="hsl(var(--muted-foreground))"
                      label={{ value: 'Z Component', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <ZAxis type="number" dataKey="size" range={[100, 200]} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                      }}
                      formatter={(value: number, name: string) => [value.toFixed(3), name]}
                    />
                    <Legend />
                    <Scatter 
                      name="Original" 
                      data={blochSphereData.filter(p => p.category === 'Original')} 
                      fill="hsl(var(--foreground))" 
                    />
                    <Scatter 
                      name="Depolarizing" 
                      data={blochSphereData.filter(p => p.category === 'Depolarizing')} 
                      fill="hsl(var(--primary))" 
                    />
                    <Scatter 
                      name="Amplitude" 
                      data={blochSphereData.filter(p => p.category === 'Amplitude')} 
                      fill="hsl(var(--accent))" 
                    />
                    <Scatter 
                      name="Phase" 
                      data={blochSphereData.filter(p => p.category === 'Phase')} 
                      fill="hsl(var(--warning))" 
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>

            {/* Key Differences */}
            <div className="glass p-6 rounded-2xl mt-8">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Physical Interpretation</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Shuffle className="w-4 h-4 text-primary" />
                    <span className="font-medium text-foreground">Depolarizing</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Represents random Pauli errors (X, Y, Z). The Bloch sphere uniformly contracts toward the origin 
                    (maximally mixed state). Common model for gate errors in superconducting qubits.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Waves className="w-4 h-4 text-accent" />
                    <span className="font-medium text-foreground">Amplitude Damping</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Models spontaneous emission (T₁ relaxation). The state drifts toward |0⟩ as energy dissipates 
                    to the environment. Dominates at longer timescales in trapped ions and transmons.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CircleDot className="w-4 h-4 text-warning" />
                    <span className="font-medium text-foreground">Phase Damping</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Models pure dephasing (T₂ decay). Destroys off-diagonal density matrix elements without 
                    affecting populations. Caused by low-frequency noise and fluctuating fields.
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default NoiseModels;
