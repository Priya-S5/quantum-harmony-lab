import { useState } from 'react';
import WaveCanvas from './WaveCanvas';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw } from 'lucide-react';

const NoiseSimulator = () => {
  const [isAnimating, setIsAnimating] = useState(true);
  const [noiseLevel, setNoiseLevel] = useState(0.3);
  const [amplitude, setAmplitude] = useState(0.7);

  const metrics = {
    clean: { rms: '0.0000', mae: '0.0000' },
    noisy: { rms: (noiseLevel * 0.8).toFixed(4), mae: (noiseLevel * 0.6).toFixed(4) },
    corrected: { rms: (noiseLevel * 0.15).toFixed(4), mae: (noiseLevel * 0.1).toFixed(4) },
  };

  const improvement = ((1 - parseFloat(metrics.corrected.rms) / parseFloat(metrics.noisy.rms)) * 100).toFixed(1);

  return (
    <div className="glass rounded-2xl p-6 md:p-8 quantum-border">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h3 className="text-2xl font-bold text-foreground mb-1">Wave Simulation</h3>
          <p className="text-muted-foreground text-sm">Interactive noise channel visualization</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsAnimating(!isAnimating)}
            className="border-border/50 hover:border-primary hover:bg-primary/10"
          >
            {isAnimating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              setNoiseLevel(0.3);
              setAmplitude(0.7);
            }}
            className="border-border/50 hover:border-primary hover:bg-primary/10"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-primary">Clean Signal</span>
            <span className="text-xs text-muted-foreground font-mono">Reference</span>
          </div>
          <WaveCanvas type="clean" isAnimating={isAnimating} />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-secondary">Noisy Signal</span>
            <span className="text-xs text-muted-foreground font-mono">Live</span>
          </div>
          <WaveCanvas type="noisy" isAnimating={isAnimating} noiseLevel={noiseLevel} />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-emerald-400">Corrected Signal</span>
            <span className="text-xs text-muted-foreground font-mono">Mitigated</span>
          </div>
          <WaveCanvas type="corrected" isAnimating={isAnimating} noiseLevel={noiseLevel * 0.2} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm text-muted-foreground">Noise Level</label>
              <span className="text-sm font-mono text-primary">{(noiseLevel * 100).toFixed(0)}%</span>
            </div>
            <Slider
              value={[noiseLevel * 100]}
              onValueChange={(v) => setNoiseLevel(v[0] / 100)}
              max={100}
              step={1}
              className="cursor-pointer"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm text-muted-foreground">Amplitude</label>
              <span className="text-sm font-mono text-primary">{amplitude.toFixed(2)}</span>
            </div>
            <Slider
              value={[amplitude * 100]}
              onValueChange={(v) => setAmplitude(v[0] / 100)}
              max={100}
              step={1}
              className="cursor-pointer"
            />
          </div>
        </div>

        <div className="bg-muted/50 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-foreground mb-3">Metrics</h4>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Metric</p>
              <p className="text-xs font-mono text-muted-foreground">RMS</p>
              <p className="text-xs font-mono text-muted-foreground">MAE</p>
            </div>
            <div>
              <p className="text-xs text-secondary mb-1">Noisy</p>
              <p className="text-sm font-mono text-secondary">{metrics.noisy.rms}</p>
              <p className="text-sm font-mono text-secondary">{metrics.noisy.mae}</p>
            </div>
            <div>
              <p className="text-xs text-emerald-400 mb-1">Corrected</p>
              <p className="text-sm font-mono text-emerald-400">{metrics.corrected.rms}</p>
              <p className="text-sm font-mono text-emerald-400">{metrics.corrected.mae}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-border/50 text-center">
            <span className="text-sm text-muted-foreground">Improvement: </span>
            <span className="text-lg font-bold text-emerald-400">{improvement}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoiseSimulator;