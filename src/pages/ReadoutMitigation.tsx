import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Dices } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import QuantumBackground from '@/components/QuantumBackground';
import { mulberry32, sampleBinomial, solveLinearSystem, bitString } from '@/lib/quantum';

type TargetState = 'ghz' | 'uniform' | 'zero';

const buildAssignmentMatrix = (n: number, p01: number, p10: number) => {
  // Single qubit matrix: columns = prepared, rows = measured.
  // p10 = P(measure 1 | prepared 0), p01 = P(measure 0 | prepared 1)
  const single = [
    [1 - p10, p01],
    [p10, 1 - p01],
  ];
  let A = [[1]];
  for (let q = 0; q < n; q++) {
    const size = A.length * 2;
    const next: number[][] = Array.from({ length: size }, () => Array(size).fill(0));
    for (let r = 0; r < A.length; r++) {
      for (let c = 0; c < A.length; c++) {
        for (let i = 0; i < 2; i++) {
          for (let j = 0; j < 2; j++) {
            next[r * 2 + i][c * 2 + j] = A[r][c] * single[i][j];
          }
        }
      }
    }
    A = next;
  }
  return A;
};

const idealDistribution = (n: number, target: TargetState) => {
  const dim = 2 ** n;
  const d = Array(dim).fill(0);
  if (target === 'ghz') {
    d[0] = 0.5;
    d[dim - 1] = 0.5;
  } else if (target === 'zero') {
    d[0] = 1;
  } else {
    d.fill(1 / dim);
  }
  return d;
};

/** Iterative Bayesian unfolding — keeps the result physical (non-negative, normalised). */
const bayesianUnfold = (A: number[][], measured: number[], iterations: number) => {
  const dim = measured.length;
  let t = Array(dim).fill(1 / dim);
  for (let it = 0; it < iterations; it++) {
    const pred = A.map((row) => row.reduce((s, a, j) => s + a * t[j], 0));
    const next = t.map((tj, j) => {
      let acc = 0;
      for (let i = 0; i < dim; i++) {
        if (pred[i] > 1e-12) acc += (A[i][j] * measured[i]) / pred[i];
      }
      return tj * acc;
    });
    const sum = next.reduce((a, b) => a + b, 0) || 1;
    t = next.map((v) => v / sum);
  }
  return t;
};

const ReadoutMitigation = () => {
  const [nQubits, setNQubits] = useState(3);
  const [p10, setP10] = useState(0.03);
  const [p01, setP01] = useState(0.06);
  const [shots, setShots] = useState(8000);
  const [target, setTarget] = useState<TargetState>('ghz');
  const [iterations, setIterations] = useState(25);
  const [seed, setSeed] = useState(3);

  const dim = 2 ** nQubits;
  const A = useMemo(() => buildAssignmentMatrix(nQubits, p01, p10), [nQubits, p01, p10]);
  const ideal = useMemo(() => idealDistribution(nQubits, target), [nQubits, target]);

  // Apply the assignment matrix, then add shot noise.
  const measured = useMemo(() => {
    const rand = mulberry32(seed);
    const exact = A.map((row) => row.reduce((s, a, j) => s + a * ideal[j], 0));
    const counts = exact.map((p) => sampleBinomial(shots, p, rand));
    const total = counts.reduce((a, b) => a + b, 0) || 1;
    return counts.map((c) => c / total);
  }, [A, ideal, shots, seed]);

  const inverted = useMemo(() => {
    const x = solveLinearSystem(A, measured);
    const sum = x.reduce((a, b) => a + b, 0) || 1;
    return x.map((v) => v / sum);
  }, [A, measured]);

  const unfolded = useMemo(() => bayesianUnfold(A, measured, iterations), [A, measured, iterations]);

  const chartData = useMemo(
    () =>
      Array.from({ length: dim }, (_, i) => ({
        state: bitString(i, nQubits),
        ideal: ideal[i],
        measured: measured[i],
        inverted: inverted[i],
        unfolded: unfolded[i],
      })),
    [dim, nQubits, ideal, measured, inverted, unfolded],
  );

  const tvd = (a: number[], b: number[]) =>
    0.5 * a.reduce((s, v, i) => s + Math.abs(v - b[i]), 0);

  const negativeWeight = inverted.reduce((s, v) => s + (v < 0 ? -v : 0), 0);

  const cellColor = (v: number) => {
    const intensity = Math.min(Math.pow(v, 0.45), 1);
    return `hsl(var(--quantum-cyan) / ${0.06 + intensity * 0.9})`;
  };

  return (
    <>
      <Helmet>
        <title>Readout Error Mitigation | QuantumNoise</title>
        <meta
          name="description"
          content="Interactive readout error mitigation: assignment matrix heatmap, matrix inversion and iterative Bayesian unfolding of measurement counts."
        />
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
                <span className="text-gradient">Readout Error</span> Mitigation
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Calibrate the measurement confusion matrix, then recover the true distribution by
                inversion or iterative Bayesian unfolding.
              </p>
            </div>
          </div>
        </header>

        <section className="relative z-10 py-8 px-4">
          <div className="container mx-auto max-w-6xl space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="glass border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Readout noise</CardTitle>
                  <CardDescription>Per-qubit bit-flip probabilities</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium flex items-center justify-between">
                      Qubits
                      <span className="text-primary font-mono">{nQubits}</span>
                    </label>
                    <Slider value={[nQubits]} onValueChange={([v]) => setNQubits(v)} min={1} max={4} step={1} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-medium flex items-center justify-between">
                      P(1 | prepared 0)
                      <span className="text-primary font-mono">{(p10 * 100).toFixed(1)}%</span>
                    </label>
                    <Slider value={[p10]} onValueChange={([v]) => setP10(v)} min={0} max={0.2} step={0.005} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-medium flex items-center justify-between">
                      P(0 | prepared 1)
                      <span className="text-primary font-mono">{(p01 * 100).toFixed(1)}%</span>
                    </label>
                    <Slider value={[p01]} onValueChange={([v]) => setP01(v)} min={0} max={0.2} step={0.005} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-medium flex items-center justify-between">
                      Shots
                      <span className="text-primary font-mono">{shots.toLocaleString()}</span>
                    </label>
                    <Slider value={[shots]} onValueChange={([v]) => setShots(v)} min={500} max={50000} step={500} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-medium flex items-center justify-between">
                      Unfolding iterations
                      <span className="text-primary font-mono">{iterations}</span>
                    </label>
                    <Slider value={[iterations]} onValueChange={([v]) => setIterations(v)} min={1} max={100} step={1} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-medium">Prepared state</label>
                    <Select value={target} onValueChange={(v: TargetState) => setTarget(v)}>
                      <SelectTrigger className="glass"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ghz">GHZ (|0…0⟩ + |1…1⟩)</SelectItem>
                        <SelectItem value="uniform">Uniform superposition</SelectItem>
                        <SelectItem value="zero">All zeros</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full" onClick={() => setSeed((s) => s + 1)}>
                    <Dices className="w-4 h-4 mr-2" /> New shot sample
                  </Button>
                </CardContent>
              </Card>

              <div className="lg:col-span-2 space-y-6">
                <div className="grid sm:grid-cols-3 gap-4">
                  <Card className="glass border-border/50">
                    <CardHeader className="pb-2"><CardDescription>Raw error (TVD)</CardDescription></CardHeader>
                    <CardContent><div className="text-2xl font-mono text-destructive">{tvd(measured, ideal).toFixed(4)}</div></CardContent>
                  </Card>
                  <Card className="glass border-border/50">
                    <CardHeader className="pb-2"><CardDescription>After inversion</CardDescription></CardHeader>
                    <CardContent>
                      <div className="text-2xl font-mono text-secondary">{tvd(inverted, ideal).toFixed(4)}</div>
                      <div className="text-xs text-muted-foreground mt-1">negative weight {negativeWeight.toFixed(4)}</div>
                    </CardContent>
                  </Card>
                  <Card className="glass border-border/50">
                    <CardHeader className="pb-2"><CardDescription>After unfolding</CardDescription></CardHeader>
                    <CardContent>
                      <div className="text-2xl font-mono text-primary">{tvd(unfolded, ideal).toFixed(4)}</div>
                      <div className="text-xs text-muted-foreground mt-1">always physical</div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="glass border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Measurement outcome distribution</CardTitle>
                    <CardDescription>Ideal vs raw counts vs both mitigation strategies</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[340px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="state" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} formatter={(v: number) => v.toFixed(4)} />
                        <Legend />
                        <Bar dataKey="ideal" name="Ideal" fill="hsl(var(--success))" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="measured" name="Raw" fill="hsl(var(--destructive))" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="inverted" name="Inverted" fill="hsl(var(--secondary))" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="unfolded" name="Unfolded" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Assignment (confusion) matrix</CardTitle>
                <CardDescription>
                  A<sub>x,y</sub> = P(measure x | prepared y) — columns are prepared states, rows are
                  measured outcomes
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <div className="inline-block min-w-fit">
                  <div className="flex">
                    <div className="w-16" />
                    {Array.from({ length: dim }, (_, c) => (
                      <div key={c} className="w-12 text-center text-[10px] font-mono text-muted-foreground pb-1">
                        {bitString(c, nQubits)}
                      </div>
                    ))}
                  </div>
                  {A.map((row, r) => (
                    <div key={r} className="flex items-center">
                      <div className="w-16 text-right pr-2 text-[10px] font-mono text-muted-foreground">
                        {bitString(r, nQubits)}
                      </div>
                      {row.map((v, c) => (
                        <div
                          key={c}
                          title={`A[${bitString(r, nQubits)},${bitString(c, nQubits)}] = ${v.toFixed(4)}`}
                          className="w-12 h-12 flex items-center justify-center text-[9px] font-mono border border-border/30 text-foreground"
                          style={{ background: cellColor(v) }}
                        >
                          {v > 0.005 ? v.toFixed(2) : ''}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  The diagonal carries correctly assigned outcomes. As the off-diagonal weight grows, plain
                  inversion amplifies shot noise and produces negative quasi-counts, while Bayesian
                  unfolding stays inside the probability simplex.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </>
  );
};

export default ReadoutMitigation;
