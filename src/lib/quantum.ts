// Shared numerical helpers for the quantum noise laboratory pages.

/** Deterministic PRNG (mulberry32) so simulations are reproducible per seed. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Box-Muller standard normal from a uniform generator. */
export function gaussian(rand: () => number) {
  const u = Math.max(rand(), 1e-12);
  const v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/** Binomial sample (normal approximation with clamping, fast enough for UI). */
export function sampleBinomial(n: number, p: number, rand: () => number) {
  const clamped = Math.min(Math.max(p, 0), 1);
  const mean = n * clamped;
  const sd = Math.sqrt(n * clamped * (1 - clamped));
  const raw = Math.round(mean + gaussian(rand) * sd);
  return Math.min(Math.max(raw, 0), n);
}

/** Solve A x = b by Gauss-Jordan elimination with partial pivoting. */
export function solveLinearSystem(A: number[][], b: number[]): number[] {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    }
    if (Math.abs(M[pivot][col]) < 1e-12) continue;
    [M[col], M[pivot]] = [M[pivot], M[col]];
    const d = M[col][col];
    for (let c = col; c <= n; c++) M[col][c] /= d;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r][col];
      if (f === 0) continue;
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
    }
  }
  return M.map((row) => row[n]);
}

/** Least-squares fit of y = A * p^m + B for fixed B (offset). */
export function fitExponentialDecay(m: number[], y: number[], offset: number) {
  const pts = m
    .map((mi, i) => ({ mi, v: y[i] - offset }))
    .filter((d) => d.v > 1e-6);
  if (pts.length < 2) return { A: 1, p: 1 };
  const logs = pts.map((d) => Math.log(d.v));
  const n = pts.length;
  const sx = pts.reduce((a, d) => a + d.mi, 0);
  const sy = logs.reduce((a, b) => a + b, 0);
  const sxy = pts.reduce((a, d, i) => a + d.mi * logs[i], 0);
  const sxx = pts.reduce((a, d) => a + d.mi * d.mi, 0);
  const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
  const intercept = (sy - slope * sx) / n;
  return { A: Math.exp(intercept), p: Math.exp(slope) };
}

export const bitString = (index: number, nQubits: number) =>
  index.toString(2).padStart(nQubits, '0');
