import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter, ReferenceLine } from 'recharts';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip as UITooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import QuantumBackground from '@/components/QuantumBackground';

type ExtrapolationMethod = 'linear' | 'polynomial' | 'exponential';

const ZNE = () => {
  const [baseNoise, setBaseNoise] = useState(0.05);
  const [scaleFactors, setScaleFactors] = useState([1, 1.5, 2, 2.5, 3]);
  const [idealValue, setIdealValue] = useState(1.0);
  const [extrapolationMethod, setExtrapolationMethod] = useState<ExtrapolationMethod>('polynomial');
  const [circuitDepth, setCircuitDepth] = useState(10);

  // Generate noisy expectation values based on noise scale
  const generateNoisyValue = (scale: number, ideal: number, noise: number, depth: number) => {
    const effectiveNoise = noise * scale * (1 + depth * 0.02);
    const decay = Math.exp(-effectiveNoise * depth * 0.5);
    const randomVariation = (Math.random() - 0.5) * 0.02;
    return ideal * decay + randomVariation;
  };

  // Generate data points for the chart
  const chartData = useMemo(() => {
    return scaleFactors.map(scale => ({
      scale,
      expectation: generateNoisyValue(scale, idealValue, baseNoise, circuitDepth),
    }));
  }, [scaleFactors, idealValue, baseNoise, circuitDepth]);

  // Perform extrapolation to zero noise
  const extrapolatedValue = useMemo(() => {
    const x = chartData.map(d => d.scale);
    const y = chartData.map(d => d.expectation);
    
    if (extrapolationMethod === 'linear') {
      // Linear regression
      const n = x.length;
      const sumX = x.reduce((a, b) => a + b, 0);
      const sumY = y.reduce((a, b) => a + b, 0);
      const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
      const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
      const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      return intercept; // Value at scale = 0
    } else if (extrapolationMethod === 'polynomial') {
      // Quadratic fit using least squares
      const n = x.length;
      const sumX = x.reduce((a, b) => a + b, 0);
      const sumX2 = x.reduce((a, b) => a + b * b, 0);
      const sumX3 = x.reduce((a, b) => a + b * b * b, 0);
      const sumX4 = x.reduce((a, b) => a + b * b * b * b, 0);
      const sumY = y.reduce((a, b) => a + b, 0);
      const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
      const sumX2Y = x.reduce((acc, xi, i) => acc + xi * xi * y[i], 0);
      
      // Solve system using Cramer's rule (simplified)
      const det = n * (sumX2 * sumX4 - sumX3 * sumX3) - sumX * (sumX * sumX4 - sumX2 * sumX3) + sumX2 * (sumX * sumX3 - sumX2 * sumX2);
      const c = (sumY * (sumX2 * sumX4 - sumX3 * sumX3) - sumX * (sumXY * sumX4 - sumX2Y * sumX3) + sumX2 * (sumXY * sumX3 - sumX2Y * sumX2)) / det;
      return c;
    } else {
      // Exponential fit: y = a * exp(b * x) -> extrapolate to x = 0 gives a
      const logY = y.map(yi => Math.log(Math.max(yi, 0.001)));
      const n = x.length;
      const sumX = x.reduce((a, b) => a + b, 0);
      const sumLogY = logY.reduce((a, b) => a + b, 0);
      const sumXLogY = x.reduce((acc, xi, i) => acc + xi * logY[i], 0);
      const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
      const b = (n * sumXLogY - sumX * sumLogY) / (n * sumX2 - sumX * sumX);
      const logA = (sumLogY - b * sumX) / n;
      return Math.exp(logA);
    }
  }, [chartData, extrapolationMethod]);

  // Generate fit curve data
  const fitCurveData = useMemo(() => {
    const points = [];
    const x = chartData.map(d => d.scale);
    const y = chartData.map(d => d.expectation);
    
    for (let scale = 0; scale <= 3.5; scale += 0.1) {
      let value;
      
      if (extrapolationMethod === 'linear') {
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
        const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        value = intercept + slope * scale;
      } else if (extrapolationMethod === 'polynomial') {
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumX2 = x.reduce((a, b) => a + b * b, 0);
        const sumX3 = x.reduce((a, b) => a + b * b * b, 0);
        const sumX4 = x.reduce((a, b) => a + b * b * b * b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
        const sumX2Y = x.reduce((acc, xi, i) => acc + xi * xi * y[i], 0);
        
        const det = n * (sumX2 * sumX4 - sumX3 * sumX3) - sumX * (sumX * sumX4 - sumX2 * sumX3) + sumX2 * (sumX * sumX3 - sumX2 * sumX2);
        const c = (sumY * (sumX2 * sumX4 - sumX3 * sumX3) - sumX * (sumXY * sumX4 - sumX2Y * sumX3) + sumX2 * (sumXY * sumX3 - sumX2Y * sumX2)) / det;
        const b = (sumXY * (sumX2 * sumX4 - sumX3 * sumX3) - sumY * (sumX * sumX4 - sumX2 * sumX3) + sumX2 * (sumX * sumX2Y - sumXY * sumX2)) / det;
        const a = (sumX2Y * (sumX2 * n - sumX * sumX) - sumXY * (sumX3 * n - sumX * sumX2) + sumY * (sumX3 * sumX - sumX2 * sumX2)) / det;
        value = a * scale * scale + b * scale + c;
      } else {
        const logY = y.map(yi => Math.log(Math.max(yi, 0.001)));
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumLogY = logY.reduce((a, b) => a + b, 0);
        const sumXLogY = x.reduce((acc, xi, i) => acc + xi * logY[i], 0);
        const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
        const bCoef = (n * sumXLogY - sumX * sumLogY) / (n * sumX2 - sumX * sumX);
        const logA = (sumLogY - bCoef * sumX) / n;
        value = Math.exp(logA + bCoef * scale);
      }
      
      points.push({ scale, fit: value });
    }
    return points;
  }, [chartData, extrapolationMethod]);

  // Error metrics
  const error = Math.abs(extrapolatedValue - idealValue);
  const percentError = (error / idealValue) * 100;
  const improvement = ((1 - chartData[0].expectation / idealValue) * 100) - percentError;

  const regenerateData = () => {
    setBaseNoise(baseNoise + 0.0001);
    setTimeout(() => setBaseNoise(baseNoise), 10);
  };

  return (
    <>
      <Helmet>
        <title>Zero-Noise Extrapolation | QuantumNoise</title>
        <meta name="description" content="Interactive ZNE visualization with noise scale vs metric plots and adjustable parameters for quantum error mitigation." />
      </Helmet>
      
      <main className="relative min-h-screen bg-background overflow-x-hidden">
        <QuantumBackground />
        
        {/* Header */}
        <header className="relative z-10 pt-8 px-4">
          <div className="container mx-auto max-w-6xl">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6 group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Link>
            
            <div className="text-center mb-10">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                <span className="text-gradient">Zero-Noise</span> Extrapolation
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Visualize how ZNE mitigates quantum errors by scaling noise and extrapolating to the zero-noise limit
              </p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <section className="relative z-10 py-8 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Controls Panel */}
              <Card className="glass border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    Parameters
                    <UITooltip>
                      <TooltipTrigger>
                        <Info className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Adjust these parameters to see how they affect the extrapolation accuracy</p>
                      </TooltipContent>
                    </UITooltip>
                  </CardTitle>
                  <CardDescription>Configure simulation parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium flex items-center justify-between">
                      Base Noise Rate
                      <span className="text-primary font-mono">{(baseNoise * 100).toFixed(1)}%</span>
                    </label>
                    <Slider
                      value={[baseNoise]}
                      onValueChange={([v]) => setBaseNoise(v)}
                      min={0.01}
                      max={0.15}
                      step={0.005}
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium flex items-center justify-between">
                      Circuit Depth
                      <span className="text-primary font-mono">{circuitDepth}</span>
                    </label>
                    <Slider
                      value={[circuitDepth]}
                      onValueChange={([v]) => setCircuitDepth(v)}
                      min={1}
                      max={50}
                      step={1}
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium flex items-center justify-between">
                      Ideal Expectation Value
                      <span className="text-primary font-mono">{idealValue.toFixed(2)}</span>
                    </label>
                    <Slider
                      value={[idealValue]}
                      onValueChange={([v]) => setIdealValue(v)}
                      min={0.5}
                      max={1.5}
                      step={0.05}
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium">Extrapolation Method</label>
                    <Select value={extrapolationMethod} onValueChange={(v: ExtrapolationMethod) => setExtrapolationMethod(v)}>
                      <SelectTrigger className="glass">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="linear">Linear</SelectItem>
                        <SelectItem value="polynomial">Polynomial (Quadratic)</SelectItem>
                        <SelectItem value="exponential">Exponential</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={regenerateData} className="w-full">
                    Regenerate Data
                  </Button>
                </CardContent>
              </Card>

              {/* Chart Area */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="glass border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Noise Scale vs Expectation Value</CardTitle>
                    <CardDescription>
                      Measured values at different noise scales with {extrapolationMethod} fit extrapolation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                          <XAxis 
                            dataKey="scale" 
                            type="number"
                            domain={[0, 3.5]}
                            stroke="hsl(var(--muted-foreground))"
                            label={{ value: 'Noise Scale Factor', position: 'bottom', fill: 'hsl(var(--muted-foreground))' }}
                          />
                          <YAxis 
                            stroke="hsl(var(--muted-foreground))"
                            domain={['auto', 'auto']}
                            label={{ value: 'Expectation Value', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                            labelFormatter={(value) => `Scale: ${Number(value).toFixed(2)}`}
                          />
                          <Legend />
                          <ReferenceLine 
                            y={idealValue} 
                            stroke="hsl(var(--success))" 
                            strokeDasharray="5 5" 
                            label={{ value: 'Ideal', fill: 'hsl(var(--success))' }} 
                          />
                          <ReferenceLine 
                            y={extrapolatedValue} 
                            stroke="hsl(var(--primary))" 
                            strokeDasharray="3 3" 
                            label={{ value: 'ZNE', fill: 'hsl(var(--primary))' }} 
                          />
                          <Line 
                            data={fitCurveData}
                            type="monotone" 
                            dataKey="fit" 
                            stroke="hsl(var(--primary))" 
                            strokeWidth={2}
                            dot={false}
                            name="Fit Curve"
                          />
                          <Line 
                            data={chartData}
                            type="monotone" 
                            dataKey="expectation" 
                            stroke="hsl(var(--accent))" 
                            strokeWidth={0}
                            dot={{ fill: 'hsl(var(--accent))', r: 6, strokeWidth: 2, stroke: 'hsl(var(--background))' }}
                            name="Measured"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Metrics Cards */}
                <div className="grid sm:grid-cols-3 gap-4">
                  <Card className="glass border-border/50">
                    <CardContent className="pt-6 text-center">
                      <p className="text-sm text-muted-foreground mb-1">Extrapolated Value</p>
                      <p className="text-3xl font-bold text-gradient">{extrapolatedValue.toFixed(4)}</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="glass border-border/50">
                    <CardContent className="pt-6 text-center">
                      <p className="text-sm text-muted-foreground mb-1">Percent Error</p>
                      <p className={`text-3xl font-bold ${percentError < 5 ? 'text-green-400' : percentError < 10 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {percentError.toFixed(2)}%
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="glass border-border/50">
                    <CardContent className="pt-6 text-center">
                      <p className="text-sm text-muted-foreground mb-1">Improvement</p>
                      <p className={`text-3xl font-bold ${improvement > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {improvement > 0 ? '+' : ''}{improvement.toFixed(1)}%
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Scale Factors Table */}
                <Card className="glass border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Measurement Data</CardTitle>
                    <CardDescription>Expectation values at each noise scale factor</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/50">
                            <th className="text-left py-2 px-3 text-muted-foreground">Scale Factor (λ)</th>
                            {chartData.map(d => (
                              <th key={d.scale} className="text-center py-2 px-3 font-mono">{d.scale.toFixed(1)}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="py-2 px-3 text-muted-foreground">Expectation ⟨O⟩</td>
                            {chartData.map(d => (
                              <td key={d.scale} className="text-center py-2 px-3 font-mono text-primary">
                                {d.expectation.toFixed(4)}
                              </td>
                            ))}
                          </tr>
                          <tr className="border-t border-border/50">
                            <td className="py-2 px-3 text-muted-foreground">Error from Ideal</td>
                            {chartData.map(d => (
                              <td key={d.scale} className="text-center py-2 px-3 font-mono text-muted-foreground">
                                {((1 - d.expectation / idealValue) * 100).toFixed(2)}%
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Info Section */}
            <Card className="glass border-border/50 mt-8">
              <CardHeader>
                <CardTitle className="text-lg">How Zero-Noise Extrapolation Works</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-invert max-w-none">
                <div className="grid md:grid-cols-3 gap-6 text-sm">
                  <div>
                    <h4 className="text-primary font-semibold mb-2">1. Noise Amplification</h4>
                    <p className="text-muted-foreground">
                      Execute the same circuit at multiple noise levels by stretching gates or using identity insertions. 
                      Each noise scale λ produces a different expectation value.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-primary font-semibold mb-2">2. Data Collection</h4>
                    <p className="text-muted-foreground">
                      Measure the expectation value ⟨O⟩(λ) at each noise scale. More data points and 
                      careful scale selection improve extrapolation accuracy.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-primary font-semibold mb-2">3. Extrapolation</h4>
                    <p className="text-muted-foreground">
                      Fit a curve (linear, polynomial, or exponential) to the measured data and 
                      extrapolate to λ=0 to estimate the zero-noise expectation value.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <footer className="relative z-10 py-10 px-4 border-t border-border/50 mt-12">
          <div className="container mx-auto max-w-6xl text-center">
            <p className="text-sm text-muted-foreground">
              Zero-Noise Extrapolation Simulator • Quantum Error Mitigation Research
            </p>
          </div>
        </footer>
      </main>
    </>
  );
};

export default ZNE;
