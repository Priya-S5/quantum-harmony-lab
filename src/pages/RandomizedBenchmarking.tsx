import { useMemo, useState } from 'react';
import { ComposedChart, Line, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LabShell, { SliderRow, Stat } from '@/components/LabShell';
import { mulberry32, sampleBinomial, fitExponentialDecay } from '@/lib/quantum';

/** Standard RB: survival F(m) = A p^m + B, error per Clifford r = (1-p)(d-1)/d. */
const RandomizedBenchmarking = () => {
  const [qubits, setQubits] = useState(1);
  const [epc, setEpc] = useState(0.005);
  const [spam, setSpam] = useState(0.03);
  const [sequences, setSequences] = useState(20);
  const [shots, setShots] = useState(500);
  const [seed, setSeed] = useState(3);

  const d = Math.pow(2, qubits);
  const B = 1 / d;
  const A = 1 - B - spam;
  const pTrue = 1 - (epc * d) / (d - 1);
  const lengths = useMemo(() => [1, 5, 10, 20, 40, 70, 100, 150, 200, 300, 400, 500], []);

  const { data, fit } = useMemo(() => {
    const rand = mulberry32(seed);
    const rows = lengths.map((m) => {
      const ideal = A * Math.pow(pTrue, m) + B;
      let sum = 0;
      const samples: number[] = [];
      for (let s = 0; s < sequences; s++) {
        // Per-sequence variation in effective decay (gate-dependent noise).
        const jitter = 1 + (rand() - 0.5) * 0.2;
        const pSeq = Math.min(1, 1 - (1 - pTrue) * jitter);
        const prob = A * Math.pow(pSeq, m) + B;
        const v = sampleBinomial(shots, prob, rand) / shots;
        samples.push(v);
        sum += v;
      }
      return { m, mean: sum / sequences, ideal, samples };
    });
    const f = fitExponentialDecay(rows.map((r) => r.m), rows.map((r) => r.mean), B);
    return { data: rows, fit: f };
  }, [seed, lengths, A, B, pTrue, sequences, shots]);

  const fittedEpc = ((1 - fit.p) * (d - 1)) / d;
  const chart = data.map((r) => ({ m: r.m, mean: r.mean, fit: fit.A * Math.pow(fit.p, r.m) + B, ideal: r.ideal }));
  const scatter = data.flatMap((r) => r.samples.slice(0, 8).map((v) => ({ m: r.m, sample: v })));

  return (
    <LabShell
      title="Randomized Benchmarking"
      accent="Randomized"
      rest="Benchmarking"
      description="Random Clifford sequences of growing length reveal the average error per gate through an exponential survival decay, independent of state-prep and measurement errors."
    >
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Parameters</CardTitle>
            <CardDescription>F(m) = A·pᵐ + B</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <SliderRow label="Qubits" value={String(qubits)}>
              <Slider value={[qubits]} onValueChange={([v]) => setQubits(v)} min={1} max={2} step={1} />
            </SliderRow>
            <SliderRow label="True error per Clifford" value={`${(epc * 100).toFixed(2)}%`}>
              <Slider value={[epc]} onValueChange={([v]) => setEpc(v)} min={0.0005} max={0.03} step={0.0005} />
            </SliderRow>
            <SliderRow label="SPAM error" value={`${(spam * 100).toFixed(1)}%`}>
              <Slider value={[spam]} onValueChange={([v]) => setSpam(v)} min={0} max={0.15} step={0.005} />
            </SliderRow>
            <SliderRow label="Sequences per length" value={String(sequences)}>
              <Slider value={[sequences]} onValueChange={([v]) => setSequences(v)} min={5} max={60} step={1} />
            </SliderRow>
            <SliderRow label="Shots per sequence" value={String(shots)}>
              <Slider value={[shots]} onValueChange={([v]) => setShots(v)} min={50} max={4000} step={50} />
            </SliderRow>
            <Button variant="outline" className="w-full" onClick={() => setSeed((s) => s + 1)}>Re-sample sequences</Button>
          </CardContent>
        </Card>

        <Card className="glass border-border/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Survival probability decay</CardTitle>
            <CardDescription>Dots: individual sequences · line: fitted exponential</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="m" type="number" stroke="hsl(var(--muted-foreground))" label={{ value: 'Sequence length m', position: 'insideBottom', offset: -5 }} />
                <YAxis domain={[B - 0.05, 1]} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Legend />
                <Scatter data={scatter} dataKey="sample" name="Sequences" fill="hsl(var(--muted-foreground))" opacity={0.4} />
                <Line dataKey="mean" name="Mean" stroke="hsl(var(--primary))" strokeWidth={0} dot={{ r: 4 }} />
                <Line dataKey="fit" name="Fit" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line dataKey="ideal" name="True model" stroke="hsl(var(--accent))" strokeDasharray="5 5" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Fitted p" value={fit.p.toFixed(5)} />
        <Stat label="Fitted EPC" value={`${(fittedEpc * 100).toFixed(3)}%`} />
        <Stat label="Average gate fidelity" value={`${((1 - fittedEpc) * 100).toFixed(3)}%`} />
        <Stat label="Fitted A (SPAM)" value={fit.A.toFixed(3)} />
      </div>
    </LabShell>
  );
};

export default RandomizedBenchmarking;
