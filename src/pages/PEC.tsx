import { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Dices } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, ReferenceLine,
} from 'recharts';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import QuantumBackground from '@/components/QuantumBackground';
import { mulberry32, gaussian } from '@/lib/quantum';

/**
 * Probabilistic Error Cancellation for a depolarizing channel.
 * Pauli transfer eigenvalue: lambda = 1 - 4p/3.
 * Inverse map expanded in the Pauli basis:
 *   c_I = (1 + 3/lambda)/4 ,  c_X = c_Y = c_Z = (1 - 1/lambda)/4
 * Sampling overhead per gate: gamma = |c_I| + 3|c_P|.
 */
function quasiProbabilities(p: number) {
  const lambda = 1 - (4 * p) / 3;
  const cI = (1 + 3 / lambda) / 4;
  const cP = (1 - 1 / lambda) / 4;
  const gamma = Math.abs(cI) + 3 * Math.abs(cP);
  return { lambda, cI, cP, gamma };
}

const PEC = () => {
  const [errorRate, setErrorRate] = useState(0.02);
  const [depth, setDepth] = useState(10);
  const [shots, setShots] = useState(4000);
  const [idealValue, setIdealValue] = useState(1.0);
  const [seed, setSeed] = useState(7);

  const { lambda, cI, cP, gamma } = useMemo(() => quasiProbabilities(errorRate), [errorRate]);

  // Total overhead for a depth-d circuit: gamma^(2d) for two-sided (noise-inverted) insertion.
  const overhead = useMemo(() => Math.pow(gamma, 2 * depth), [gamma, depth]);

  // Unmitigated expectation decays as lambda^d.
  const unmitigated = useMemo(() => idealValue * Math.pow(lambda, depth), [idealValue, lambda, depth]);

  // PEC is unbiased; its statistical error grows with sqrt(overhead / shots).
  const pecStdError = useMemo(() => Math.sqrt(overhead / Math.max(shots, 1)), [overhead, shots]);

  const pecEstimate = useMemo(() => {
    const rand = mulberry32(seed);
    return idealValue + gaussian(rand) * pecStdError;
  }, [seed, idealValue, pecStdError]);

  // Convergence of the PEC estimator as shots accumulate.
  const convergence = useMemo(() => {
    const rand = mulberry32(seed + 101);
    const points: { shots: number; pec: number; upper: number; lower: number; raw: number }[] = [];
    for (let i = 1; i <= 20; i++) {
      const n = Math.round((shots / 20) * i);
      const err = Math.sqrt(overhead / Math.max(n, 1));
      points.push({
        shots: n,
        pec: idealValue + gaussian(rand) * err,
        upper: idealValue + err,
        lower: idealValue - err,
        raw: unmitigated,
      });
    }
    return points;
  }, [seed, shots, overhead, idealValue, unmitigated]);

  // Overhead growth against circuit depth for several physical error rates.
  const overheadCurve = useMemo(() => {
    const rows: Record<string, number>[] = [];
    for (let d = 1; d <= 40; d += 1) {
      const row: Record<string, number> = { depth: d };
      [0.005, 0.01, 0.02, 0.05].forEach((p) => {
        const g = quasiProbabilities(p).gamma;
        row[`p${p}`] = Math.pow(g, 2 * d);
      });
      rows.push(row);
    }
    return rows;
  }, []);

  const basisBars = useMemo(
    () => [
      { op: 'I', coeff: cI, prob: Math.abs(cI) / gamma },
      { op: 'X', coeff: cP, prob: Math.abs(cP) / gamma },
      { op: 'Y', coeff: cP, prob: Math.abs(cP) / gamma },
      { op: 'Z', coeff: cP, prob: Math.abs(cP) / gamma },
    ],
    [cI, cP, gamma],
  );

  // A short randomized sampling record, as PEC actually runs on hardware.
  const sampledSequence = useMemo(() => {
    const rand = mulberry32(seed + 5);
    const probs = basisBars.map((b) => b.prob);
    const ops: { op: string; sign: number }[] = [];
    for (let i = 0; i < Math.min(depth, 14); i++) {
      let r = rand();
      let idx = 0;
      while (idx < probs.length - 1 && r > probs[idx]) {
        r -= probs[idx];
        idx++;
      }
      ops.push({ op: basisBars[idx].op, sign: Math.sign(basisBars[idx].coeff) || 1 });
    }
    return ops;
  }, [seed, depth, basisBars]);

  const fmt = (v: number) =>
    v >= 1e5 || (v > 0 && v < 1e-3) ? v.toExponential(2) : v.toFixed(4);

  return (
    <>
      <Helmet>
        <title>Probabilistic Error Cancellation | QuantumNoise</title>
        <meta
          name="description"
          content="Interactive probabilistic error cancellation simulator: quasi-probability decomposition, sampling overhead and unbiased expectation values."
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
                <span className="text-gradient">Probabilistic</span> Error Cancellation
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Invert the noise channel with a quasi-probability decomposition, then pay for the unbiased
                estimate in sampling overhead.
              </p>
            </div>
          </div>
        </header>

        <section className="relative z-10 py-8 px-4">
          <div className="container mx-auto max-w-6xl space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
              <Card className="glass border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Parameters</CardTitle>
                  <CardDescription>Depolarizing noise on every gate layer</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-sm font-medium flex items-center justify-between">
                      Physical Error Rate p
                      <span className="text-primary font-mono">{(errorRate * 100).toFixed(2)}%</span>
                    </label>
                    <Slider value={[errorRate]} onValueChange={([v]) => setErrorRate(v)} min={0.002} max={0.08} step={0.002} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-medium flex items-center justify-between">
                      Circuit Depth d
                      <span className="text-primary font-mono">{depth}</span>
                    </label>
                    <Slider value={[depth]} onValueChange={([v]) => setDepth(v)} min={1} max={40} step={1} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-medium flex items-center justify-between">
                      Samples
                      <span className="text-primary font-mono">{shots.toLocaleString()}</span>
                    </label>
                    <Slider value={[shots]} onValueChange={([v]) => setShots(v)} min={500} max={200000} step={500} />
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-medium flex items-center justify-between">
                      Ideal Expectation
                      <span className="text-primary font-mono">{idealValue.toFixed(2)}</span>
                    </label>
                    <Slider value={[idealValue]} onValueChange={([v]) => setIdealValue(v)} min={0.2} max={1.2} step={0.05} />
                  </div>
                  <Button className="w-full" onClick={() => setSeed((s) => s + 1)}>
                    <Dices className="w-4 h-4 mr-2" /> Resample
                  </Button>
                </CardContent>
              </Card>

              <div className="lg:col-span-2 space-y-6">
                <div className="grid sm:grid-cols-3 gap-4">
                  <Card className="glass border-border/50">
                    <CardHeader className="pb-2"><CardDescription>Unmitigated</CardDescription></CardHeader>
                    <CardContent>
                      <div className="text-2xl font-mono text-destructive">{unmitigated.toFixed(4)}</div>
                      <div className="text-xs text-muted-foreground mt-1">bias {(unmitigated - idealValue).toFixed(4)}</div>
                    </CardContent>
                  </Card>
                  <Card className="glass border-border/50">
                    <CardHeader className="pb-2"><CardDescription>PEC estimate</CardDescription></CardHeader>
                    <CardContent>
                      <div className="text-2xl font-mono text-primary">{pecEstimate.toFixed(4)}</div>
                      <div className="text-xs text-muted-foreground mt-1">± {fmt(pecStdError)} (1σ)</div>
                    </CardContent>
                  </Card>
                  <Card className="glass border-border/50">
                    <CardHeader className="pb-2"><CardDescription>Sampling overhead γ²ᵈ</CardDescription></CardHeader>
                    <CardContent>
                      <div className="text-2xl font-mono text-secondary">{fmt(overhead)}</div>
                      <div className="text-xs text-muted-foreground mt-1">γ = {gamma.toFixed(4)} per gate</div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="glass border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Estimator convergence</CardTitle>
                    <CardDescription>PEC is unbiased; the shaded band is the ±1σ statistical envelope</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={convergence}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="shots" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                        <Legend />
                        <ReferenceLine y={idealValue} stroke="hsl(var(--success))" strokeDasharray="4 4" label={{ value: 'ideal', fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                        <Line type="monotone" dataKey="pec" name="PEC" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="upper" name="+1σ" stroke="hsl(var(--primary))" strokeWidth={1} strokeDasharray="3 3" dot={false} />
                        <Line type="monotone" dataKey="lower" name="-1σ" stroke="hsl(var(--primary))" strokeWidth={1} strokeDasharray="3 3" dot={false} />
                        <Line type="monotone" dataKey="raw" name="Unmitigated" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="glass border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Quasi-probability decomposition</CardTitle>
                  <CardDescription>
                    λ = 1 − 4p/3 = {lambda.toFixed(4)} · coefficients η<sub>i</sub> of the inverse map
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={basisBars}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="op" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
                      <ReferenceLine y={0} stroke="hsl(var(--border))" />
                      <Bar dataKey="coeff" name="η coefficient" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="glass border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Overhead vs depth</CardTitle>
                  <CardDescription>Logarithmic axis — overhead explodes with depth and error rate</CardDescription>
                </CardHeader>
                <CardContent className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={overheadCurve}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="depth" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis scale="log" domain={['auto', 'auto']} stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v: number) => v.toExponential(0)} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} formatter={(v: number) => v.toExponential(2)} />
                      <Legend />
                      <Line type="monotone" dataKey="p0.005" name="p = 0.5%" stroke="hsl(var(--success))" dot={false} strokeWidth={2} />
                      <Line type="monotone" dataKey="p0.01" name="p = 1%" stroke="hsl(var(--primary))" dot={false} strokeWidth={2} />
                      <Line type="monotone" dataKey="p0.02" name="p = 2%" stroke="hsl(var(--secondary))" dot={false} strokeWidth={2} />
                      <Line type="monotone" dataKey="p0.05" name="p = 5%" stroke="hsl(var(--destructive))" dot={false} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">One sampled Monte Carlo circuit</CardTitle>
                <CardDescription>
                  Each layer draws a basis operation with probability |η<sub>i</sub>|/γ; the product of signs
                  weights the shot.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {sampledSequence.map((s, i) => (
                    <div
                      key={i}
                      className={`px-3 py-2 rounded-lg font-mono text-sm border ${
                        s.sign < 0
                          ? 'border-destructive/50 text-destructive bg-destructive/10'
                          : 'border-primary/40 text-primary bg-primary/10'
                      }`}
                    >
                      {s.sign < 0 ? '−' : '+'}{s.op}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  Net sign of this sample:{' '}
                  <span className="font-mono text-foreground">
                    {sampledSequence.reduce((a, s) => a * s.sign, 1) > 0 ? '+1' : '−1'}
                  </span>{' '}
                  · negative samples are what cancel the bias, and also what inflates the variance.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </>
  );
};

export default PEC;
