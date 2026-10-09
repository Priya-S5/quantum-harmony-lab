import { useMemo, useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LabShell, { SliderRow, Stat } from '@/components/LabShell';
import { mulberry32, gaussian } from '@/lib/quantum';

type Gate = 'I' | 'X' | 'Y' | 'Z' | 'H';
type Channel = 'depolarizing' | 'amplitude' | 'phase';
const PAULIS = ['I', 'X', 'Y', 'Z'];

/** Pauli-basis expansion of single-qubit gates (U = Σ a_k σ_k). */
const GATE_COEFFS: Record<Gate, number[]> = {
  I: [1, 0, 0, 0],
  X: [0, 1, 0, 0],
  Y: [0, 0, 1, 0],
  Z: [0, 0, 0, 1],
  H: [0, Math.SQRT1_2, 0, Math.SQRT1_2],
};

/**
 * Real-valued chi-matrix model: chi = (1-noise) * a a^T + noise contribution.
 * Depolarizing spreads weight to X,Y,Z; phase damping to Z; amplitude damping to X,Y and an I-Z coherence.
 */
function buildChi(gate: Gate, channel: Channel, p: number) {
  const a = GATE_COEFFS[gate];
  const chi = Array.from({ length: 4 }, (_, i) => Array.from({ length: 4 }, (_, j) => a[i] * a[j]));
  const scale = 1 - p;
  const out = chi.map((r) => r.map((v) => v * scale));
  if (channel === 'depolarizing') {
    [1, 2, 3].forEach((k) => (out[k][k] += p / 3));
    out[0][0] += 0;
  } else if (channel === 'phase') {
    out[3][3] += p;
  } else {
    out[1][1] += p / 4;
    out[2][2] += p / 4;
    out[0][0] += p / 4;
    out[3][3] += p / 4;
    out[0][3] += p / 4;
    out[3][0] += p / 4;
  }
  return out;
}

const Cell = ({ v, max }: { v: number; max: number }) => {
  const t = Math.min(Math.abs(v) / max, 1);
  return (
    <div
      className="aspect-square rounded-md flex items-center justify-center text-xs font-mono border border-border/40"
      style={{ background: v >= 0 ? `hsl(var(--primary) / ${t})` : `hsl(var(--destructive) / ${t})` }}
    >
      {v.toFixed(2)}
    </div>
  );
};

const ChiGrid = ({ chi, title }: { chi: number[][]; title: string }) => (
  <Card className="glass border-border/50">
    <CardHeader>
      <CardTitle className="text-lg">{title}</CardTitle>
      <CardDescription>Re(χ) in the Pauli basis</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-5 gap-1">
        <div />
        {PAULIS.map((p) => <div key={p} className="text-center text-sm text-muted-foreground">{p}</div>)}
        {chi.map((row, i) => (
          <>
            <div key={`l${i}`} className="flex items-center justify-center text-sm text-muted-foreground">{PAULIS[i]}</div>
            {row.map((v, j) => <Cell key={`${i}-${j}`} v={v} max={1} />)}
          </>
        ))}
      </div>
    </CardContent>
  </Card>
);

const ProcessTomography = () => {
  const [gate, setGate] = useState<Gate>('H');
  const [channel, setChannel] = useState<Channel>('depolarizing');
  const [noise, setNoise] = useState(0.1);
  const [shots, setShots] = useState(2000);
  const [seed, setSeed] = useState(1);

  const ideal = useMemo(() => buildChi(gate, channel, 0), [gate, channel]);
  const actual = useMemo(() => buildChi(gate, channel, noise), [gate, channel, noise]);

  // Reconstruction: true chi plus shot noise ~ 1/sqrt(shots), symmetrised and trace-renormalised.
  const reconstructed = useMemo(() => {
    const rand = mulberry32(seed);
    const sigma = 1 / Math.sqrt(shots);
    const m = actual.map((r) => r.map((v) => v + gaussian(rand) * sigma));
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) m[j][i] = m[i][j];
    const tr = m.reduce((s, r, i) => s + r[i], 0);
    return m.map((r) => r.map((v) => v / tr));
  }, [actual, shots, seed]);

  // Process fidelity: Tr(chi_ideal chi_rec) for pure ideal process.
  const fidelity = ideal.reduce((s, r, i) => s + r.reduce((t, v, j) => t + v * reconstructed[j][i], 0), 0);
  const avgFidelity = (2 * fidelity + 1) / 3;
  const traceDist = 0.5 * ideal.flat().reduce((s, v, k) => s + Math.abs(v - reconstructed.flat()[k]), 0);

  return (
    <LabShell
      title="Quantum Process Tomography"
      accent="Process"
      rest="Tomography"
      description="Prepare a complete set of input states, measure in every Pauli basis, and reconstruct the χ-matrix that fully describes a noisy quantum gate."
    >
      <Card className="glass border-border/50">
        <CardContent className="pt-6 grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium mb-2">Target gate</div>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(GATE_COEFFS) as Gate[]).map((g) => (
                  <Button key={g} size="sm" variant={gate === g ? 'default' : 'outline'} onClick={() => setGate(g)}>{g}</Button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium mb-2">Noise channel</div>
              <div className="flex flex-wrap gap-2">
                {(['depolarizing', 'amplitude', 'phase'] as Channel[]).map((c) => (
                  <Button key={c} size="sm" variant={channel === c ? 'default' : 'outline'} onClick={() => setChannel(c)} className="capitalize">{c}</Button>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-5">
            <SliderRow label="Noise strength" value={noise.toFixed(2)}>
              <Slider value={[noise]} onValueChange={([v]) => setNoise(v)} min={0} max={0.5} step={0.01} />
            </SliderRow>
            <SliderRow label="Shots per setting" value={shots.toLocaleString()}>
              <Slider value={[shots]} onValueChange={([v]) => setShots(v)} min={100} max={20000} step={100} />
            </SliderRow>
            <Button variant="outline" size="sm" onClick={() => setSeed((s) => s + 1)}>Re-run tomography (16 settings)</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Stat label="Process fidelity" value={`${(fidelity * 100).toFixed(2)}%`} />
        <Stat label="Average gate fidelity" value={`${(avgFidelity * 100).toFixed(2)}%`} />
        <Stat label="χ distance (L1/2)" value={traceDist.toFixed(3)} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <ChiGrid chi={ideal} title={`Ideal χ — ${gate}`} />
        <ChiGrid chi={reconstructed} title="Reconstructed χ" />
      </div>
    </LabShell>
  );
};

export default ProcessTomography;
