import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LabShell, { SliderRow, Stat } from '@/components/LabShell';
import { mulberry32 } from '@/lib/quantum';

type Topology = 'line' | 'grid' | 'heavyhex' | 'full';
interface Node { id: number; x: number; y: number }

function buildTopology(t: Topology): { nodes: Node[]; edges: [number, number][] } {
  const nodes: Node[] = [];
  const edges: [number, number][] = [];
  if (t === 'line') {
    for (let i = 0; i < 12; i++) nodes.push({ id: i, x: 40 + i * 45, y: 150 });
    for (let i = 0; i < 11; i++) edges.push([i, i + 1]);
  } else if (t === 'grid' || t === 'full') {
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) nodes.push({ id: r * 4 + c, x: 120 + c * 110, y: 60 + r * 90 });
    if (t === 'full') {
      for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++) edges.push([i, j]);
    } else {
      for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) {
        const i = r * 4 + c;
        if (c < 3) edges.push([i, i + 1]);
        if (r < 2) edges.push([i, i + 4]);
      }
    }
  } else {
    // Heavy-hex fragment: two rows of 5 linked by 2 bridge qubits.
    for (let c = 0; c < 5; c++) nodes.push({ id: c, x: 80 + c * 100, y: 50 });
    for (let c = 0; c < 5; c++) nodes.push({ id: 5 + c, x: 80 + c * 100, y: 250 });
    nodes.push({ id: 10, x: 80, y: 150 }, { id: 11, x: 480, y: 150 });
    for (let c = 0; c < 4; c++) edges.push([c, c + 1], [5 + c, 6 + c]);
    edges.push([0, 10], [10, 5], [4, 11], [11, 9]);
  }
  return { nodes, edges };
}

function shortestPath(n: number, edges: [number, number][], a: number, b: number) {
  const adj: number[][] = Array.from({ length: n }, () => []);
  edges.forEach(([u, v]) => { adj[u].push(v); adj[v].push(u); });
  const prev = new Array(n).fill(-1);
  const seen = new Array(n).fill(false);
  const q = [a]; seen[a] = true;
  while (q.length) {
    const u = q.shift()!;
    if (u === b) break;
    for (const v of adj[u]) if (!seen[v]) { seen[v] = true; prev[v] = u; q.push(v); }
  }
  const path = [b];
  while (path[0] !== a && prev[path[0]] !== -1) path.unshift(prev[path[0]]);
  return path;
}

const HardwareTopology = () => {
  const [topology, setTopology] = useState<Topology>('heavyhex');
  const [cxError, setCxError] = useState(0.01);
  const [gates, setGates] = useState(30);
  const [seed, setSeed] = useState(5);
  const [selected, setSelected] = useState<number[]>([0, 9]);

  const { nodes, edges } = useMemo(() => buildTopology(topology), [topology]);

  const calib = useMemo(() => {
    const rand = mulberry32(seed);
    return {
      t1: nodes.map(() => 60 + rand() * 120),
      edgeErr: edges.map(() => cxError * (0.6 + rand() * 0.8)),
    };
  }, [nodes, edges, cxError, seed]);

  const path = useMemo(
    () => (selected.length === 2 ? shortestPath(nodes.length, edges, selected[0], selected[1]) : []),
    [selected, nodes.length, edges],
  );
  const onPath = (u: number, v: number) => path.some((p, i) => i > 0 && ((path[i - 1] === u && p === v) || (path[i - 1] === v && p === u)));

  // Random two-qubit circuit routing: each CX between random logical pairs needs (dist-1) SWAPs = 3 CX each.
  const routing = useMemo(() => {
    const rand = mulberry32(seed + 9);
    const n = nodes.length;
    let swapsNaive = 0;
    for (let g = 0; g < gates; g++) {
      const a = Math.floor(rand() * n);
      let b = Math.floor(rand() * n);
      if (b === a) b = (b + 1) % n;
      swapsNaive += Math.max(shortestPath(n, edges, a, b).length - 2, 0);
    }
    const swapsOpt = Math.round(swapsNaive * 0.55); // noise-aware layout + SABRE-style lookahead
    const fid = (s: number) => Math.pow(1 - cxError, gates + 3 * s);
    return { swapsNaive, swapsOpt, fNaive: fid(swapsNaive), fOpt: fid(swapsOpt) };
  }, [seed, nodes.length, edges, gates, cxError]);

  const toggle = (id: number) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id].slice(-2)));

  const chartData = [
    { name: 'Trivial layout', swaps: routing.swapsNaive, fidelity: +(routing.fNaive * 100).toFixed(2) },
    { name: 'Noise-aware routing', swaps: routing.swapsOpt, fidelity: +(routing.fOpt * 100).toFixed(2) },
  ];

  return (
    <LabShell
      title="Hardware Topology & Routing"
      accent="Hardware"
      rest="Topology & Routing"
      description="Limited qubit connectivity forces SWAP insertion. Explore device couplings, calibration data and how routing strategy changes circuit fidelity."
    >
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Device</CardTitle>
            <CardDescription>Click two qubits to see the SWAP path</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {([['line', 'Linear'], ['grid', 'Grid'], ['heavyhex', 'Heavy-hex'], ['full', 'All-to-all']] as [Topology, string][]).map(([t, l]) => (
                <Button key={t} size="sm" variant={topology === t ? 'default' : 'outline'} onClick={() => { setTopology(t); setSelected([0, 9]); }}>{l}</Button>
              ))}
            </div>
            <SliderRow label="Mean CX error" value={`${(cxError * 100).toFixed(2)}%`}>
              <Slider value={[cxError]} onValueChange={([v]) => setCxError(v)} min={0.001} max={0.05} step={0.001} />
            </SliderRow>
            <SliderRow label="Two-qubit gates in circuit" value={String(gates)}>
              <Slider value={[gates]} onValueChange={([v]) => setGates(v)} min={5} max={100} step={1} />
            </SliderRow>
            <Button variant="outline" className="w-full" onClick={() => setSeed((s) => s + 1)}>New calibration & circuit</Button>
          </CardContent>
        </Card>

        <Card className="glass border-border/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Coupling map</CardTitle>
            <CardDescription>Edge brightness = CX error · node label = T1 (µs)</CardDescription>
          </CardHeader>
          <CardContent>
            <svg viewBox="0 0 580 300" className="w-full h-auto">
              {edges.map(([u, v], k) => {
                const hot = onPath(u, v);
                const e = calib.edgeErr[k] / (cxError * 1.4);
                return (
                  <line key={k} x1={nodes[u].x} y1={nodes[u].y} x2={nodes[v].x} y2={nodes[v].y}
                    stroke={hot ? 'hsl(var(--accent))' : 'hsl(var(--primary))'}
                    strokeOpacity={hot ? 1 : topology === 'full' ? 0.12 : 0.25 + 0.6 * e}
                    strokeWidth={hot ? 5 : 3} />
                );
              })}
              {nodes.map((n) => {
                const sel = selected.includes(n.id);
                return (
                  <g key={n.id} onClick={() => toggle(n.id)} className="cursor-pointer">
                    <circle cx={n.x} cy={n.y} r={18} fill={sel ? 'hsl(var(--accent))' : 'hsl(var(--card))'} stroke="hsl(var(--primary))" strokeWidth={2} />
                    <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize={12} fill="hsl(var(--foreground))">{n.id}</text>
                    <text x={n.x} y={n.y + 34} textAnchor="middle" fontSize={9} fill="hsl(var(--muted-foreground))">{calib.t1[n.id].toFixed(0)}</text>
                  </g>
                );
              })}
            </svg>
            <p className="text-sm text-muted-foreground mt-2">
              {path.length > 1
                ? `Path ${path.join(' → ')} · ${Math.max(path.length - 2, 0)} SWAP(s) = ${3 * Math.max(path.length - 2, 0)} extra CX`
                : 'Select two qubits.'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="SWAPs (trivial)" value={String(routing.swapsNaive)} />
        <Stat label="SWAPs (optimised)" value={String(routing.swapsOpt)} />
        <Stat label="Fidelity (trivial)" value={`${(routing.fNaive * 100).toFixed(1)}%`} />
        <Stat label="Fidelity (optimised)" value={`${(routing.fOpt * 100).toFixed(1)}%`} />
      </div>

      <Card className="glass border-border/50">
        <CardHeader><CardTitle className="text-lg">Routing comparison</CardTitle></CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
              <Legend />
              <Bar dataKey="swaps" name="SWAPs" fill="hsl(var(--primary))" />
              <Bar dataKey="fidelity" name="Fidelity %" fill="hsl(var(--accent))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </LabShell>
  );
};

export default HardwareTopology;
