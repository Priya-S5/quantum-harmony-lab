import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, Cpu, Search, Atom, TrendingDown, BarChart3, Zap } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import QuantumBackground from '@/components/QuantumBackground';

const AlgorithmBenchmark = () => {
  const [noiseLevel, setNoiseLevel] = useState(0.02);
  const [qubits, setQubits] = useState(5);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<string | null>(null);

  const algorithms = [
    {
      id: 'qft',
      name: 'Quantum Fourier Transform',
      shortName: 'QFT',
      icon: Cpu,
      color: 'hsl(var(--primary))',
      description: 'Fundamental building block for phase estimation and Shor\'s algorithm',
      gateCount: (n: number) => n * (n + 1) / 2,
      depth: (n: number) => 2 * n,
      noiseResistance: 0.7,
    },
    {
      id: 'grover',
      name: 'Grover\'s Search',
      shortName: 'Grover',
      icon: Search,
      color: 'hsl(var(--accent))',
      description: 'Quadratic speedup for unstructured search problems',
      gateCount: (n: number) => Math.ceil(Math.sqrt(Math.pow(2, n))) * (3 * n + 2),
      depth: (n: number) => Math.ceil(Math.sqrt(Math.pow(2, n))) * 4,
      noiseResistance: 0.5,
    },
    {
      id: 'vqe',
      name: 'Variational Quantum Eigensolver',
      shortName: 'VQE',
      icon: Atom,
      color: 'hsl(var(--warning))',
      description: 'Hybrid algorithm for finding ground state energies',
      gateCount: (n: number) => n * 6 * 3, // layers * gates per layer * depth
      depth: (n: number) => 3 * n,
      noiseResistance: 0.8,
    },
  ];

  // Generate performance data based on noise level
  const noiseScaleData = useMemo(() => {
    const scales = [0, 0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.08, 0.1];
    return scales.map(noise => {
      const data: Record<string, number | string> = { noise: noise.toFixed(3) };
      algorithms.forEach(algo => {
        const decay = Math.exp(-noise * algo.gateCount(qubits) * (1 - algo.noiseResistance));
        data[algo.id] = Math.max(0, decay * 100);
      });
      return data;
    });
  }, [qubits]);

  // Generate qubit scaling data
  const qubitScalingData = useMemo(() => {
    const qubitCounts = [2, 3, 4, 5, 6, 7, 8];
    return qubitCounts.map(n => {
      const data: Record<string, number | string> = { qubits: n };
      algorithms.forEach(algo => {
        const decay = Math.exp(-noiseLevel * algo.gateCount(n) * (1 - algo.noiseResistance));
        data[algo.id] = Math.max(0, decay * 100);
      });
      return data;
    });
  }, [noiseLevel]);

  // Generate gate count comparison
  const gateCountData = useMemo(() => {
    return algorithms.map(algo => ({
      name: algo.shortName,
      gates: algo.gateCount(qubits),
      depth: algo.depth(qubits),
      fill: algo.color,
    }));
  }, [qubits]);

  // Radar chart data for algorithm characteristics
  const radarData = [
    { metric: 'Noise Resistance', QFT: 70, Grover: 50, VQE: 80 },
    { metric: 'Scalability', QFT: 60, Grover: 40, VQE: 75 },
    { metric: 'Gate Efficiency', QFT: 80, Grover: 65, VQE: 55 },
    { metric: 'Fidelity', QFT: 75, Grover: 60, VQE: 85 },
    { metric: 'NISQ Suitability', QFT: 50, Grover: 45, VQE: 90 },
  ];

  // Calculate current fidelity for each algorithm
  const currentFidelity = useMemo(() => {
    return algorithms.map(algo => {
      const decay = Math.exp(-noiseLevel * algo.gateCount(qubits) * (1 - algo.noiseResistance));
      return {
        ...algo,
        fidelity: Math.max(0, decay * 100),
        gates: algo.gateCount(qubits),
        depth: algo.depth(qubits),
      };
    });
  }, [noiseLevel, qubits]);

  return (
    <>
      <Helmet>
        <title>Algorithm Benchmarking | QuantumNoise</title>
        <meta name="description" content="Compare quantum algorithm performance under noise: QFT, Grover's Search, and VQE benchmarks with interactive visualizations." />
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
              <div className="w-14 h-14 rounded-2xl bg-accent/20 flex items-center justify-center">
                <BarChart3 className="w-7 h-7 text-accent" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gradient">Algorithm Benchmarking</h1>
                <p className="text-muted-foreground">Compare quantum algorithm performance under noise</p>
              </div>
            </div>
          </header>

          <main className="container mx-auto px-4 pb-16">
            {/* Algorithm Cards */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {currentFidelity.map((algo) => {
                const Icon = algo.icon;
                const isSelected = selectedAlgorithm === algo.id;
                return (
                  <button
                    key={algo.id}
                    onClick={() => setSelectedAlgorithm(isSelected ? null : algo.id)}
                    className={`glass p-6 rounded-2xl text-left transition-all duration-300 hover:scale-[1.02] ${
                      isSelected ? 'ring-2 ring-primary glow-sm' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${algo.color}20` }}>
                        <Icon className="w-5 h-5" style={{ color: algo.color }} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{algo.shortName}</h3>
                        <p className="text-xs text-muted-foreground">{algo.name}</p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">{algo.description}</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-lg font-bold" style={{ color: algo.color }}>{algo.fidelity.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">Fidelity</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground">{algo.gates}</p>
                        <p className="text-xs text-muted-foreground">Gates</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground">{algo.depth}</p>
                        <p className="text-xs text-muted-foreground">Depth</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Controls */}
            <div className="glass p-6 rounded-2xl mb-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-primary" />
                      Noise Level
                    </label>
                    <span className="text-sm font-mono text-primary">{(noiseLevel * 100).toFixed(1)}%</span>
                  </div>
                  <Slider
                    value={[noiseLevel]}
                    onValueChange={([v]) => setNoiseLevel(v)}
                    min={0}
                    max={0.1}
                    step={0.005}
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Zap className="w-4 h-4 text-accent" />
                      Number of Qubits
                    </label>
                    <span className="text-sm font-mono text-accent">{qubits}</span>
                  </div>
                  <Slider
                    value={[qubits]}
                    onValueChange={([v]) => setQubits(v)}
                    min={2}
                    max={8}
                    step={1}
                  />
                </div>
              </div>
            </div>

            {/* Charts */}
            <Tabs defaultValue="noise" className="space-y-6">
              <TabsList className="glass">
                <TabsTrigger value="noise">Noise Scaling</TabsTrigger>
                <TabsTrigger value="qubits">Qubit Scaling</TabsTrigger>
                <TabsTrigger value="comparison">Gate Comparison</TabsTrigger>
                <TabsTrigger value="radar">Characteristics</TabsTrigger>
              </TabsList>

              <TabsContent value="noise" className="glass p-6 rounded-2xl">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Fidelity vs Noise Level</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  How each algorithm's output fidelity degrades as noise increases
                </p>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={noiseScaleData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                    <XAxis 
                      dataKey="noise" 
                      stroke="hsl(var(--muted-foreground))"
                      label={{ value: 'Noise Level', position: 'bottom', fill: 'hsl(var(--muted-foreground))' }}
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
                      labelFormatter={(v) => `Noise: ${v}`}
                      formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
                    />
                    <Legend />
                    {algorithms.map(algo => (
                      <Line
                        key={algo.id}
                        type="monotone"
                        dataKey={algo.id}
                        name={algo.shortName}
                        stroke={algo.color}
                        strokeWidth={selectedAlgorithm === null || selectedAlgorithm === algo.id ? 3 : 1}
                        opacity={selectedAlgorithm === null || selectedAlgorithm === algo.id ? 1 : 0.3}
                        dot={{ fill: algo.color, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="qubits" className="glass p-6 rounded-2xl">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Fidelity vs Qubit Count</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  How algorithm performance scales with increasing qubit count at current noise level
                </p>
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={qubitScalingData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                    <XAxis 
                      dataKey="qubits" 
                      stroke="hsl(var(--muted-foreground))"
                      label={{ value: 'Number of Qubits', position: 'bottom', fill: 'hsl(var(--muted-foreground))' }}
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
                      labelFormatter={(v) => `${v} Qubits`}
                      formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
                    />
                    <Legend />
                    {algorithms.map(algo => (
                      <Line
                        key={algo.id}
                        type="monotone"
                        dataKey={algo.id}
                        name={algo.shortName}
                        stroke={algo.color}
                        strokeWidth={selectedAlgorithm === null || selectedAlgorithm === algo.id ? 3 : 1}
                        opacity={selectedAlgorithm === null || selectedAlgorithm === algo.id ? 1 : 0.3}
                        dot={{ fill: algo.color, r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="comparison" className="glass p-6 rounded-2xl">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Gate Count & Circuit Depth</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Resource requirements for each algorithm with {qubits} qubits
                </p>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={gateCountData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                    <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                    <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={80} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="gates" name="Gate Count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="depth" name="Circuit Depth" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="radar" className="glass p-6 rounded-2xl">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Algorithm Characteristics</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Multi-dimensional comparison of algorithm properties
                </p>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--muted))" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Radar name="QFT" dataKey="QFT" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                    <Radar name="Grover" dataKey="Grover" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.3} />
                    <Radar name="VQE" dataKey="VQE" stroke="hsl(var(--warning))" fill="hsl(var(--warning))" fillOpacity={0.3} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>

            {/* Key Insights */}
            <div className="glass p-6 rounded-2xl mt-8">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Key Insights</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <span className="font-medium text-foreground">QFT</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Moderate noise sensitivity with polynomial gate scaling. Essential for phase estimation
                    but requires error correction for large instances.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-accent" />
                    <span className="font-medium text-foreground">Grover's</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    High noise sensitivity due to repeated oracle calls. Quadratic speedup diminishes
                    rapidly with noise, making it challenging on NISQ devices.
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-warning" />
                    <span className="font-medium text-foreground">VQE</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Most noise-resilient due to variational optimization. Shallow circuits and
                    classical feedback make it ideal for near-term quantum advantage.
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

export default AlgorithmBenchmark;
