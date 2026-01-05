import { useState, useCallback, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Play, RotateCcw, Sparkles, Zap, Target } from 'lucide-react';
import BlochSphereCanvas from '@/components/BlochSphere';

type GateType = 'I' | 'X' | 'Y' | 'Z' | 'H' | 'S' | 'T' | 'Rx' | 'Ry' | 'Rz';

interface GateInfo {
  name: string;
  symbol: string;
  description: string;
  matrix: string[][];
  color: string;
}

const gateInfo: Record<GateType, GateInfo> = {
  I: {
    name: 'Identity',
    symbol: 'I',
    description: 'Does nothing - the quantum equivalent of leaving the qubit alone',
    matrix: [['1', '0'], ['0', '1']],
    color: 'bg-gray-500'
  },
  X: {
    name: 'Pauli-X (NOT)',
    symbol: 'X',
    description: 'Flips the qubit state: |0⟩ → |1⟩ and |1⟩ → |0⟩. Rotation of π around X-axis.',
    matrix: [['0', '1'], ['1', '0']],
    color: 'bg-red-500'
  },
  Y: {
    name: 'Pauli-Y',
    symbol: 'Y',
    description: 'Combined bit and phase flip. Rotation of π around Y-axis.',
    matrix: [['0', '-i'], ['i', '0']],
    color: 'bg-green-500'
  },
  Z: {
    name: 'Pauli-Z',
    symbol: 'Z',
    description: 'Phase flip: |0⟩ → |0⟩ and |1⟩ → -|1⟩. Rotation of π around Z-axis.',
    matrix: [['1', '0'], ['0', '-1']],
    color: 'bg-purple-500'
  },
  H: {
    name: 'Hadamard',
    symbol: 'H',
    description: 'Creates superposition: |0⟩ → (|0⟩+|1⟩)/√2 and |1⟩ → (|0⟩-|1⟩)/√2',
    matrix: [['1/√2', '1/√2'], ['1/√2', '-1/√2']],
    color: 'bg-blue-500'
  },
  S: {
    name: 'S-gate (√Z)',
    symbol: 'S',
    description: 'Phase gate: |1⟩ → i|1⟩. Rotation of π/2 around Z-axis.',
    matrix: [['1', '0'], ['0', 'i']],
    color: 'bg-cyan-500'
  },
  T: {
    name: 'T-gate (√S)',
    symbol: 'T',
    description: 'π/8 gate: |1⟩ → e^(iπ/4)|1⟩. Rotation of π/4 around Z-axis.',
    matrix: [['1', '0'], ['0', 'e^(iπ/4)']],
    color: 'bg-pink-500'
  },
  Rx: {
    name: 'Rotation X',
    symbol: 'Rx(θ)',
    description: 'Rotation around X-axis by angle θ',
    matrix: [['cos(θ/2)', '-i·sin(θ/2)'], ['-i·sin(θ/2)', 'cos(θ/2)']],
    color: 'bg-orange-500'
  },
  Ry: {
    name: 'Rotation Y',
    symbol: 'Ry(θ)',
    description: 'Rotation around Y-axis by angle θ',
    matrix: [['cos(θ/2)', '-sin(θ/2)'], ['sin(θ/2)', 'cos(θ/2)']],
    color: 'bg-yellow-500'
  },
  Rz: {
    name: 'Rotation Z',
    symbol: 'Rz(θ)',
    description: 'Rotation around Z-axis by angle θ',
    matrix: [['e^(-iθ/2)', '0'], ['0', 'e^(iθ/2)']],
    color: 'bg-indigo-500'
  }
};

const GatePlayground = () => {
  const [selectedGate, setSelectedGate] = useState<GateType>('H');
  const [rotationAngle, setRotationAngle] = useState(Math.PI);
  const [appliedGates, setAppliedGates] = useState<{ gate: GateType; angle?: number }[]>([]);
  const [stateVector, setStateVector] = useState<{ alpha: [number, number]; beta: [number, number] }>({
    alpha: [1, 0],
    beta: [0, 0]
  });

  const applyGate = useCallback((gate: GateType, angle?: number) => {
    setAppliedGates(prev => [...prev, { gate, angle }]);
    
    setStateVector(prev => {
      let { alpha, beta } = prev;
      const theta = angle || Math.PI;
      
      switch (gate) {
        case 'X':
          return { alpha: beta, beta: alpha };
        case 'Y':
          return {
            alpha: [beta[1], -beta[0]],
            beta: [-alpha[1], alpha[0]]
          };
        case 'Z':
          return { alpha, beta: [-beta[0], -beta[1]] };
        case 'H':
          const sqrt2 = Math.SQRT1_2;
          return {
            alpha: [sqrt2 * (alpha[0] + beta[0]), sqrt2 * (alpha[1] + beta[1])],
            beta: [sqrt2 * (alpha[0] - beta[0]), sqrt2 * (alpha[1] - beta[1])]
          };
        case 'S':
          return { alpha, beta: [-beta[1], beta[0]] };
        case 'T':
          const cos45 = Math.cos(Math.PI / 4);
          const sin45 = Math.sin(Math.PI / 4);
          return {
            alpha,
            beta: [cos45 * beta[0] - sin45 * beta[1], sin45 * beta[0] + cos45 * beta[1]]
          };
        case 'Rx':
          const cosRx = Math.cos(theta / 2);
          const sinRx = Math.sin(theta / 2);
          return {
            alpha: [cosRx * alpha[0] + sinRx * beta[1], cosRx * alpha[1] - sinRx * beta[0]],
            beta: [sinRx * alpha[1] + cosRx * beta[0], -sinRx * alpha[0] + cosRx * beta[1]]
          };
        case 'Ry':
          const cosRy = Math.cos(theta / 2);
          const sinRy = Math.sin(theta / 2);
          return {
            alpha: [cosRy * alpha[0] - sinRy * beta[0], cosRy * alpha[1] - sinRy * beta[1]],
            beta: [sinRy * alpha[0] + cosRy * beta[0], sinRy * alpha[1] + cosRy * beta[1]]
          };
        case 'Rz':
          const cosRz = Math.cos(theta / 2);
          const sinRz = Math.sin(theta / 2);
          return {
            alpha: [cosRz * alpha[0] + sinRz * alpha[1], -sinRz * alpha[0] + cosRz * alpha[1]],
            beta: [cosRz * beta[0] - sinRz * beta[1], sinRz * beta[0] + cosRz * beta[1]]
          };
        default:
          return prev;
      }
    });
  }, []);

  const resetState = useCallback(() => {
    setStateVector({ alpha: [1, 0], beta: [0, 0] });
    setAppliedGates([]);
  }, []);

  const getBlochCoordinates = () => {
    const { alpha, beta } = stateVector;
    const norm = Math.sqrt(alpha[0]**2 + alpha[1]**2 + beta[0]**2 + beta[1]**2);
    const a0 = alpha[0] / norm;
    const a1 = alpha[1] / norm;
    const b0 = beta[0] / norm;
    const b1 = beta[1] / norm;
    
    const x = 2 * (a0 * b0 + a1 * b1);
    const y = 2 * (a1 * b0 - a0 * b1);
    const z = a0**2 + a1**2 - b0**2 - b1**2;
    
    return { x, y, z };
  };

  const getProbabilities = () => {
    const { alpha, beta } = stateVector;
    const p0 = alpha[0]**2 + alpha[1]**2;
    const p1 = beta[0]**2 + beta[1]**2;
    return { p0, p1 };
  };

  const bloch = getBlochCoordinates();
  const probs = getProbabilities();
  const info = gateInfo[selectedGate];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Gate Playground | QuantumNoise</title>
        <meta name="description" content="Interactive quantum gate playground - explore gate operations on the Bloch sphere" />
      </Helmet>
      
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-quantum-accent to-quantum-tertiary bg-clip-text text-transparent">
            Gate Playground
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Explore quantum gates interactively and see their effects on the Bloch sphere
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gate Selection */}
          <div className="space-y-6">
            <Card className="glass border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Select Gate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="basic">Basic Gates</TabsTrigger>
                    <TabsTrigger value="rotation">Rotation Gates</TabsTrigger>
                  </TabsList>
                  <TabsContent value="basic" className="mt-4">
                    <div className="grid grid-cols-4 gap-2">
                      {(['I', 'X', 'Y', 'Z', 'H', 'S', 'T'] as GateType[]).map(gate => (
                        <Button
                          key={gate}
                          variant={selectedGate === gate ? 'default' : 'outline'}
                          className={`h-14 font-mono font-bold text-lg ${selectedGate === gate ? gateInfo[gate].color : ''}`}
                          onClick={() => setSelectedGate(gate)}
                        >
                          {gate}
                        </Button>
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="rotation" className="mt-4 space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      {(['Rx', 'Ry', 'Rz'] as GateType[]).map(gate => (
                        <Button
                          key={gate}
                          variant={selectedGate === gate ? 'default' : 'outline'}
                          className={`h-14 font-mono font-bold ${selectedGate === gate ? gateInfo[gate].color : ''}`}
                          onClick={() => setSelectedGate(gate)}
                        >
                          {gateInfo[gate].symbol}
                        </Button>
                      ))}
                    </div>
                    {['Rx', 'Ry', 'Rz'].includes(selectedGate) && (
                      <div>
                        <label className="text-sm text-muted-foreground mb-2 block">
                          Rotation Angle: {(rotationAngle / Math.PI).toFixed(2)}π ({(rotationAngle * 180 / Math.PI).toFixed(0)}°)
                        </label>
                        <Slider
                          value={[rotationAngle]}
                          onValueChange={([v]) => setRotationAngle(v)}
                          min={0}
                          max={2 * Math.PI}
                          step={Math.PI / 12}
                        />
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Gate Info */}
            <Card className="glass border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge className={info.color + ' text-white'}>{info.symbol}</Badge>
                  {info.name}
                </CardTitle>
                <CardDescription>{info.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-2">Matrix Representation:</h4>
                  <div className="font-mono text-sm bg-muted/30 p-3 rounded-lg inline-block">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">⌈</span>
                      <div className="grid grid-cols-2 gap-x-4">
                        {info.matrix.map((row, i) => (
                          <div key={i} className="contents">
                            {row.map((cell, j) => (
                              <span key={j} className="text-center min-w-[4rem]">{cell}</span>
                            ))}
                          </div>
                        ))}
                      </div>
                      <span className="text-2xl">⌉</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    className="flex-1"
                    onClick={() => applyGate(selectedGate, ['Rx', 'Ry', 'Rz'].includes(selectedGate) ? rotationAngle : undefined)}
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Apply {info.symbol}
                  </Button>
                  <Button variant="outline" onClick={resetState}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Applied Gates History */}
            {appliedGates.length > 0 && (
              <Card className="glass border-primary/20">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Gate History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {appliedGates.map((g, i) => (
                      <Badge key={i} className={gateInfo[g.gate].color + ' text-white'}>
                        {g.angle !== undefined ? `${g.gate}(${(g.angle / Math.PI).toFixed(2)}π)` : g.gate}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Bloch Sphere & State */}
          <div className="space-y-6">
            <Card className="glass border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Bloch Sphere
                </CardTitle>
                <CardDescription>
                  Current state visualized on the Bloch sphere
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80 rounded-lg overflow-hidden bg-background/50">
                  <BlochSphereCanvas 
                    states={[{
                      vector: bloch,
                      trail: [],
                      color: '#00ffff',
                      name: 'Current State'
                    }]}
                  />
                </div>
              </CardContent>
            </Card>

            {/* State Vector */}
            <Card className="glass border-primary/20">
              <CardHeader>
                <CardTitle>Quantum State</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="glass p-4 rounded-lg text-center">
                    <div className="text-sm text-muted-foreground mb-1">|0⟩ Amplitude</div>
                    <div className="font-mono text-lg">
                      {stateVector.alpha[0].toFixed(3)} + {stateVector.alpha[1].toFixed(3)}i
                    </div>
                    <div className="text-primary font-bold text-xl mt-2">
                      {(probs.p0 * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="glass p-4 rounded-lg text-center">
                    <div className="text-sm text-muted-foreground mb-1">|1⟩ Amplitude</div>
                    <div className="font-mono text-lg">
                      {stateVector.beta[0].toFixed(3)} + {stateVector.beta[1].toFixed(3)}i
                    </div>
                    <div className="text-quantum-accent font-bold text-xl mt-2">
                      {(probs.p1 * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground mb-2">Bloch Vector:</div>
                  <div className="font-mono text-sm grid grid-cols-3 gap-2">
                    <div className="glass p-2 rounded text-center">
                      <span className="text-red-400">X:</span> {bloch.x.toFixed(3)}
                    </div>
                    <div className="glass p-2 rounded text-center">
                      <span className="text-green-400">Y:</span> {bloch.y.toFixed(3)}
                    </div>
                    <div className="glass p-2 rounded text-center">
                      <span className="text-blue-400">Z:</span> {bloch.z.toFixed(3)}
                    </div>
                  </div>
                </div>

                {/* Probability Bar */}
                <div>
                  <div className="text-sm text-muted-foreground mb-2">Measurement Probabilities:</div>
                  <div className="h-6 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-primary transition-all duration-300 flex items-center justify-center text-xs font-bold"
                      style={{ width: `${probs.p0 * 100}%` }}
                    >
                      {probs.p0 > 0.1 && '|0⟩'}
                    </div>
                    <div 
                      className="bg-quantum-accent transition-all duration-300 flex items-center justify-center text-xs font-bold"
                      style={{ width: `${probs.p1 * 100}%` }}
                    >
                      {probs.p1 > 0.1 && '|1⟩'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GatePlayground;
