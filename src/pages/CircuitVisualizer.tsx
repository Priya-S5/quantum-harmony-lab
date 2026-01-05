import { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Play, RotateCcw, Plus, Trash2, Gauge } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

type GateType = 'H' | 'X' | 'Y' | 'Z' | 'CNOT' | 'T' | 'S' | 'M';

interface Gate {
  id: string;
  type: GateType;
  qubit: number;
  controlQubit?: number;
}

interface QubitState {
  alpha: { real: number; imag: number };
  beta: { real: number; imag: number };
}

const gateColors: Record<GateType, string> = {
  H: 'bg-blue-500',
  X: 'bg-red-500',
  Y: 'bg-green-500',
  Z: 'bg-purple-500',
  CNOT: 'bg-orange-500',
  T: 'bg-pink-500',
  S: 'bg-cyan-500',
  M: 'bg-yellow-500'
};

const gateDescriptions: Record<GateType, string> = {
  H: 'Hadamard - Creates superposition',
  X: 'Pauli-X - Bit flip (NOT gate)',
  Y: 'Pauli-Y - Bit and phase flip',
  Z: 'Pauli-Z - Phase flip',
  CNOT: 'Controlled-NOT - Entanglement',
  T: 'T-gate - π/4 phase rotation',
  S: 'S-gate - π/2 phase rotation',
  M: 'Measurement - Collapse to classical'
};

const CircuitVisualizer = () => {
  const [numQubits, setNumQubits] = useState(3);
  const [gates, setGates] = useState<Gate[]>([]);
  const [selectedGate, setSelectedGate] = useState<GateType>('H');
  const [qubitStates, setQubitStates] = useState<QubitState[]>([]);
  const [measurementResults, setMeasurementResults] = useState<{ state: string; probability: number; count: number }[]>([]);
  const [shots, setShots] = useState(1024);
  const [isSimulating, setIsSimulating] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  const addGate = useCallback((qubit: number, step: number) => {
    const newGate: Gate = {
      id: `${Date.now()}-${Math.random()}`,
      type: selectedGate,
      qubit,
      controlQubit: selectedGate === 'CNOT' && qubit > 0 ? qubit - 1 : undefined
    };
    setGates(prev => [...prev, newGate]);
  }, [selectedGate]);

  const removeGate = useCallback((gateId: string) => {
    setGates(prev => prev.filter(g => g.id !== gateId));
  }, []);

  const clearCircuit = useCallback(() => {
    setGates([]);
    setQubitStates([]);
    setMeasurementResults([]);
    setHasRun(false);
  }, []);

  const simulateCircuit = useCallback(() => {
    setIsSimulating(true);
    
    // Initialize qubit states
    const states: QubitState[] = Array(numQubits).fill(null).map(() => ({
      alpha: { real: 1, imag: 0 },
      beta: { real: 0, imag: 0 }
    }));

    // Simple simulation - apply gates
    gates.forEach(gate => {
      const q = gate.qubit;
      if (q >= numQubits) return;
      
      switch (gate.type) {
        case 'H':
          const alphaH = states[q].alpha;
          const betaH = states[q].beta;
          const sqrt2 = Math.SQRT1_2;
          states[q] = {
            alpha: { 
              real: sqrt2 * (alphaH.real + betaH.real), 
              imag: sqrt2 * (alphaH.imag + betaH.imag) 
            },
            beta: { 
              real: sqrt2 * (alphaH.real - betaH.real), 
              imag: sqrt2 * (alphaH.imag - betaH.imag) 
            }
          };
          break;
        case 'X':
          const temp = states[q].alpha;
          states[q].alpha = states[q].beta;
          states[q].beta = temp;
          break;
        case 'Z':
          states[q].beta = { 
            real: -states[q].beta.real, 
            imag: -states[q].beta.imag 
          };
          break;
        case 'Y':
          const alphaY = states[q].alpha;
          states[q].alpha = { real: states[q].beta.imag, imag: -states[q].beta.real };
          states[q].beta = { real: -alphaY.imag, imag: alphaY.real };
          break;
        case 'S':
          states[q].beta = { 
            real: -states[q].beta.imag, 
            imag: states[q].beta.real 
          };
          break;
        case 'T':
          const cos = Math.cos(Math.PI / 4);
          const sin = Math.sin(Math.PI / 4);
          const betaT = states[q].beta;
          states[q].beta = {
            real: cos * betaT.real - sin * betaT.imag,
            imag: sin * betaT.real + cos * betaT.imag
          };
          break;
      }
    });

    setQubitStates(states);

    // Calculate measurement probabilities
    const numStates = Math.pow(2, numQubits);
    const probabilities: number[] = [];
    
    for (let i = 0; i < numStates; i++) {
      let prob = 1;
      for (let q = 0; q < numQubits; q++) {
        const bit = (i >> (numQubits - 1 - q)) & 1;
        const state = states[q];
        const amplitude = bit === 0 ? state.alpha : state.beta;
        const ampProb = amplitude.real * amplitude.real + amplitude.imag * amplitude.imag;
        prob *= ampProb;
      }
      probabilities.push(prob);
    }

    // Normalize
    const total = probabilities.reduce((a, b) => a + b, 0);
    const normalized = probabilities.map(p => p / total);

    // Sample shots
    const counts: Record<string, number> = {};
    for (let i = 0; i < shots; i++) {
      let r = Math.random();
      let cumulative = 0;
      for (let j = 0; j < numStates; j++) {
        cumulative += normalized[j];
        if (r <= cumulative) {
          const state = j.toString(2).padStart(numQubits, '0');
          counts[state] = (counts[state] || 0) + 1;
          break;
        }
      }
    }

    const results = Object.entries(counts)
      .map(([state, count]) => ({
        state,
        probability: count / shots,
        count
      }))
      .sort((a, b) => b.count - a.count);

    setMeasurementResults(results);
    setHasRun(true);
    setIsSimulating(false);
  }, [gates, numQubits, shots]);

  const getAmplitudeDisplay = (state: QubitState) => {
    const alphaProb = state.alpha.real ** 2 + state.alpha.imag ** 2;
    const betaProb = state.beta.real ** 2 + state.beta.imag ** 2;
    return { alphaProb: (alphaProb * 100).toFixed(1), betaProb: (betaProb * 100).toFixed(1) };
  };

  const maxSteps = 8;
  const gatesByQubitAndStep: (Gate | null)[][] = Array(numQubits)
    .fill(null)
    .map(() => Array(maxSteps).fill(null));
  
  gates.forEach((gate, idx) => {
    const step = idx % maxSteps;
    if (gate.qubit < numQubits) {
      gatesByQubitAndStep[gate.qubit][step] = gate;
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Circuit Visualizer | QuantumNoise</title>
        <meta name="description" content="Interactive quantum circuit visualization with gates, qubit states, and measurement simulation" />
      </Helmet>
      
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-quantum-accent to-quantum-tertiary bg-clip-text text-transparent">
            Quantum Circuit Visualizer
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Build and simulate quantum circuits with interactive gate placement and measurement histograms
          </p>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="glass border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" />
                Gate Palette
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {(Object.keys(gateColors) as GateType[]).map(gate => (
                  <Button
                    key={gate}
                    variant={selectedGate === gate ? 'default' : 'outline'}
                    className={`h-12 font-mono font-bold ${selectedGate === gate ? gateColors[gate] : ''}`}
                    onClick={() => setSelectedGate(gate)}
                  >
                    {gate}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                {gateDescriptions[selectedGate]}
              </p>
            </CardContent>
          </Card>

          <Card className="glass border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Gauge className="w-5 h-5 text-primary" />
                Circuit Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Number of Qubits: {numQubits}
                </label>
                <Slider
                  value={[numQubits]}
                  onValueChange={([v]) => setNumQubits(v)}
                  min={1}
                  max={5}
                  step={1}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Measurement Shots: {shots}
                </label>
                <Slider
                  value={[shots]}
                  onValueChange={([v]) => setShots(v)}
                  min={100}
                  max={4096}
                  step={100}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full" 
                onClick={simulateCircuit}
                disabled={gates.length === 0 || isSimulating}
              >
                <Play className="w-4 h-4 mr-2" />
                {isSimulating ? 'Simulating...' : 'Run Circuit'}
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={clearCircuit}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Clear Circuit
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Circuit Diagram */}
        <Card className="glass border-primary/20 mb-8">
          <CardHeader>
            <CardTitle>Circuit Diagram</CardTitle>
            <CardDescription>Click on a position to add the selected gate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                {Array(numQubits).fill(null).map((_, qubit) => (
                  <div key={qubit} className="flex items-center gap-2 mb-4">
                    <div className="w-16 font-mono text-sm text-muted-foreground">
                      q[{qubit}] |0⟩
                    </div>
                    <div className="flex-1 flex items-center">
                      <div className="h-0.5 w-4 bg-muted-foreground" />
                      {Array(maxSteps).fill(null).map((_, step) => {
                        const gate = gatesByQubitAndStep[qubit][step];
                        return (
                          <div key={step} className="flex items-center">
                            {gate ? (
                              <div 
                                className={`w-12 h-12 ${gateColors[gate.type]} rounded-lg flex items-center justify-center font-mono font-bold text-white cursor-pointer hover:opacity-80 transition-opacity relative group`}
                                onClick={() => removeGate(gate.id)}
                              >
                                {gate.type}
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-destructive text-destructive-foreground text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                  <Trash2 className="w-3 h-3 inline mr-1" />
                                  Click to remove
                                </div>
                              </div>
                            ) : (
                              <div 
                                className="w-12 h-12 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/10 transition-all"
                                onClick={() => addGate(qubit, step)}
                              >
                                <Plus className="w-4 h-4 text-muted-foreground/50" />
                              </div>
                            )}
                            <div className="h-0.5 w-4 bg-muted-foreground" />
                          </div>
                        );
                      })}
                    </div>
                    {hasRun && qubitStates[qubit] && (
                      <div className="w-32 text-xs font-mono">
                        <div className="text-blue-400">|0⟩: {getAmplitudeDisplay(qubitStates[qubit]).alphaProb}%</div>
                        <div className="text-red-400">|1⟩: {getAmplitudeDisplay(qubitStates[qubit]).betaProb}%</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {gates.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="text-sm text-muted-foreground">Applied gates:</span>
                {gates.map((gate, idx) => (
                  <Badge key={gate.id} variant="secondary" className={gateColors[gate.type] + ' text-white'}>
                    {gate.type}[q{gate.qubit}]
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Measurement Results */}
        {hasRun && measurementResults.length > 0 && (
          <Card className="glass border-primary/20">
            <CardHeader>
              <CardTitle>Measurement Results</CardTitle>
              <CardDescription>
                Probability histogram from {shots} measurement shots
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={measurementResults} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.2} />
                    <XAxis 
                      dataKey="state" 
                      stroke="hsl(var(--muted-foreground))"
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      tick={{ fontSize: 12, fontFamily: 'monospace' }}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number, name: string) => [
                        `${(value * 100).toFixed(2)}%`,
                        'Probability'
                      ]}
                      labelFormatter={(label) => `State: |${label}⟩`}
                    />
                    <Bar dataKey="probability" radius={[4, 4, 0, 0]}>
                      {measurementResults.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={`hsl(${220 + index * 30}, 70%, 50%)`}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                {measurementResults.slice(0, 8).map((result) => (
                  <div key={result.state} className="glass p-3 rounded-lg text-center">
                    <div className="font-mono text-lg text-primary">|{result.state}⟩</div>
                    <div className="text-2xl font-bold">{(result.probability * 100).toFixed(1)}%</div>
                    <div className="text-xs text-muted-foreground">{result.count} counts</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default CircuitVisualizer;
