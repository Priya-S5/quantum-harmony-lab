import { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Play, RefreshCw, Shield, AlertTriangle, CheckCircle, XCircle, Zap } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
  Cell
} from 'recharts';

interface ErrorResult {
  trial: number;
  rawError: number;
  correctedError: number;
  detected: boolean;
  corrected: boolean;
}

const ErrorControl = () => {
  const [errorRate, setErrorRate] = useState(0.05);
  const [numTrials, setNumTrials] = useState(100);
  const [codeType, setCodeType] = useState<'bitflip' | 'phaseflip' | 'shor'>('bitflip');
  const [enableCorrection, setEnableCorrection] = useState(true);
  const [results, setResults] = useState<ErrorResult[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [stats, setStats] = useState({ 
    rawErrorRate: 0, 
    correctedErrorRate: 0, 
    detectionRate: 0,
    correctionRate: 0 
  });

  const simulateErrors = useCallback(() => {
    setIsSimulating(true);
    
    const newResults: ErrorResult[] = [];
    let totalRawErrors = 0;
    let totalCorrectedErrors = 0;
    let detected = 0;
    let corrected = 0;

    for (let i = 0; i < numTrials; i++) {
      // Simulate raw error
      const hasRawError = Math.random() < errorRate;
      let rawError = hasRawError ? 1 : 0;
      totalRawErrors += rawError;

      // Error detection and correction
      let correctedError = rawError;
      let wasDetected = false;
      let wasCorrected = false;

      if (hasRawError && enableCorrection) {
        // Detection probability depends on code type
        const detectionProb = codeType === 'shor' ? 0.99 : codeType === 'phaseflip' ? 0.92 : 0.95;
        wasDetected = Math.random() < detectionProb;
        
        if (wasDetected) {
          detected++;
          // Correction probability
          const correctionProb = codeType === 'shor' ? 0.95 : codeType === 'phaseflip' ? 0.85 : 0.9;
          wasCorrected = Math.random() < correctionProb;
          
          if (wasCorrected) {
            corrected++;
            correctedError = 0;
          }
        }
      }

      totalCorrectedErrors += correctedError;

      newResults.push({
        trial: i + 1,
        rawError,
        correctedError,
        detected: wasDetected,
        corrected: wasCorrected
      });
    }

    setResults(newResults);
    setStats({
      rawErrorRate: totalRawErrors / numTrials,
      correctedErrorRate: totalCorrectedErrors / numTrials,
      detectionRate: totalRawErrors > 0 ? detected / totalRawErrors : 0,
      correctionRate: detected > 0 ? corrected / detected : 0
    });
    setIsSimulating(false);
  }, [errorRate, numTrials, codeType, enableCorrection]);

  // Prepare chart data
  const cumulativeData = results.reduce((acc, r, i) => {
    const prev = acc[acc.length - 1] || { rawErrors: 0, correctedErrors: 0 };
    acc.push({
      trial: r.trial,
      rawErrors: prev.rawErrors + r.rawError,
      correctedErrors: prev.correctedErrors + r.correctedError,
      rawRate: (prev.rawErrors + r.rawError) / (i + 1),
      correctedRate: (prev.correctedErrors + r.correctedError) / (i + 1)
    });
    return acc;
  }, [] as { trial: number; rawErrors: number; correctedErrors: number; rawRate: number; correctedRate: number }[]);

  const syndromeData = [
    { syndrome: 'No Error', count: results.filter(r => !r.rawError).length, color: '#22c55e' },
    { syndrome: 'Detected & Corrected', count: results.filter(r => r.corrected).length, color: '#3b82f6' },
    { syndrome: 'Detected Only', count: results.filter(r => r.detected && !r.corrected).length, color: '#f59e0b' },
    { syndrome: 'Undetected', count: results.filter(r => r.rawError && !r.detected).length, color: '#ef4444' }
  ].filter(d => d.count > 0);

  const codeDescriptions = {
    bitflip: {
      name: '3-Qubit Bit Flip Code',
      description: 'Encodes 1 logical qubit into 3 physical qubits. Corrects single X errors.',
      encoding: '|0⟩ → |000⟩, |1⟩ → |111⟩',
      syndromes: ['00 → No error', '01 → Error on qubit 3', '10 → Error on qubit 2', '11 → Error on qubit 1']
    },
    phaseflip: {
      name: '3-Qubit Phase Flip Code',
      description: 'Encodes 1 logical qubit into 3 physical qubits. Corrects single Z errors.',
      encoding: '|0⟩ → |+++⟩, |1⟩ → |---⟩',
      syndromes: ['00 → No error', '01 → Error on qubit 3', '10 → Error on qubit 2', '11 → Error on qubit 1']
    },
    shor: {
      name: 'Shor 9-Qubit Code',
      description: 'Encodes 1 logical qubit into 9 physical qubits. Corrects any single-qubit error.',
      encoding: '|0⟩ → (|000⟩+|111⟩)⊗3, |1⟩ → (|000⟩-|111⟩)⊗3',
      syndromes: ['Concatenates bit flip and phase flip codes', 'Full protection against any single qubit error']
    }
  };

  const currentCode = codeDescriptions[codeType];

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Error Control Demo | QuantumNoise</title>
        <meta name="description" content="Interactive quantum error correction demonstration with bit flip, phase flip, and Shor codes" />
      </Helmet>
      
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-quantum-accent to-quantum-tertiary bg-clip-text text-transparent">
            Error Control Demo
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Explore quantum error correction codes and see how they protect quantum information
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Controls */}
          <Card className="glass border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Error Correction Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Error Rate: {(errorRate * 100).toFixed(1)}%
                </label>
                <Slider
                  value={[errorRate]}
                  onValueChange={([v]) => setErrorRate(v)}
                  min={0.01}
                  max={0.3}
                  step={0.01}
                />
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Number of Trials: {numTrials}
                </label>
                <Slider
                  value={[numTrials]}
                  onValueChange={([v]) => setNumTrials(v)}
                  min={10}
                  max={500}
                  step={10}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm">Enable Error Correction</label>
                <Switch
                  checked={enableCorrection}
                  onCheckedChange={setEnableCorrection}
                />
              </div>

              <Button 
                className="w-full" 
                onClick={simulateErrors}
                disabled={isSimulating}
              >
                <Play className="w-4 h-4 mr-2" />
                {isSimulating ? 'Simulating...' : 'Run Simulation'}
              </Button>
            </CardContent>
          </Card>

          {/* Code Selection */}
          <Card className="glass border-primary/20 lg:col-span-2">
            <CardHeader>
              <CardTitle>Error Correction Code</CardTitle>
              <CardDescription>Select the quantum error correction code to simulate</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={codeType} onValueChange={(v) => setCodeType(v as typeof codeType)}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="bitflip">Bit Flip</TabsTrigger>
                  <TabsTrigger value="phaseflip">Phase Flip</TabsTrigger>
                  <TabsTrigger value="shor">Shor Code</TabsTrigger>
                </TabsList>
                
                <div className="mt-4 p-4 rounded-lg bg-muted/30">
                  <h4 className="font-semibold text-lg mb-2">{currentCode.name}</h4>
                  <p className="text-muted-foreground mb-3">{currentCode.description}</p>
                  
                  <div className="mb-3">
                    <span className="text-sm font-medium">Encoding:</span>
                    <code className="ml-2 px-2 py-1 bg-muted rounded text-sm font-mono">
                      {currentCode.encoding}
                    </code>
                  </div>

                  <div>
                    <span className="text-sm font-medium">Syndrome Measurement:</span>
                    <ul className="mt-1 space-y-1">
                      {currentCode.syndromes.map((s, i) => (
                        <li key={i} className="text-sm text-muted-foreground font-mono">
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="glass border-primary/20">
                <CardContent className="pt-6 text-center">
                  <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-red-500">
                    {(stats.rawErrorRate * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Raw Error Rate</div>
                </CardContent>
              </Card>

              <Card className="glass border-primary/20">
                <CardContent className="pt-6 text-center">
                  <Shield className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-500">
                    {(stats.correctedErrorRate * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Corrected Error Rate</div>
                </CardContent>
              </Card>

              <Card className="glass border-primary/20">
                <CardContent className="pt-6 text-center">
                  <Zap className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-yellow-500">
                    {(stats.detectionRate * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Detection Rate</div>
                </CardContent>
              </Card>

              <Card className="glass border-primary/20">
                <CardContent className="pt-6 text-center">
                  <CheckCircle className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-500">
                    {(stats.correctionRate * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Correction Success</div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="glass border-primary/20">
                <CardHeader>
                  <CardTitle>Error Rate Over Trials</CardTitle>
                  <CardDescription>Cumulative error rate comparison</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={cumulativeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.2} />
                        <XAxis 
                          dataKey="trial" 
                          stroke="hsl(var(--muted-foreground))"
                          label={{ value: 'Trial', position: 'insideBottom', offset: -5 }}
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))"
                          tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                          domain={[0, 'auto']}
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                          formatter={(value: number) => [`${(value * 100).toFixed(2)}%`]}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="rawRate" 
                          stroke="#ef4444" 
                          strokeWidth={2}
                          name="Raw Error Rate"
                          dot={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="correctedRate" 
                          stroke="#22c55e" 
                          strokeWidth={2}
                          name="Corrected Error Rate"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-primary/20">
                <CardHeader>
                  <CardTitle>Syndrome Distribution</CardTitle>
                  <CardDescription>Breakdown of error detection and correction</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={syndromeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.2} />
                        <XAxis 
                          dataKey="syndrome" 
                          stroke="hsl(var(--muted-foreground))"
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis stroke="hsl(var(--muted-foreground))" />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {syndromeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Trial History */}
            <Card className="glass border-primary/20 mt-6">
              <CardHeader>
                <CardTitle>Recent Trials</CardTitle>
                <CardDescription>Last 20 trial results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {results.slice(-20).map((r) => (
                    <div 
                      key={r.trial}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-mono ${
                        !r.rawError ? 'bg-green-500/20 text-green-500' :
                        r.corrected ? 'bg-blue-500/20 text-blue-500' :
                        r.detected ? 'bg-yellow-500/20 text-yellow-500' :
                        'bg-red-500/20 text-red-500'
                      }`}
                      title={`Trial ${r.trial}: ${
                        !r.rawError ? 'No error' :
                        r.corrected ? 'Corrected' :
                        r.detected ? 'Detected only' :
                        'Undetected error'
                      }`}
                    >
                      {!r.rawError ? <CheckCircle className="w-4 h-4" /> :
                       r.corrected ? <Shield className="w-4 h-4" /> :
                       r.detected ? <AlertTriangle className="w-4 h-4" /> :
                       <XCircle className="w-4 h-4" />}
                    </div>
                  ))}
                </div>
                <div className="flex gap-4 mt-4 text-xs">
                  <div className="flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-green-500" /> No error
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="w-3 h-3 text-blue-500" /> Corrected
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-yellow-500" /> Detected
                  </div>
                  <div className="flex items-center gap-1">
                    <XCircle className="w-3 h-3 text-red-500" /> Undetected
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
};

export default ErrorControl;
