import { useState, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, Play, Pause, RotateCcw, Shuffle, Waves, CircleDot } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import BlochSphereCanvas from '@/components/BlochSphere';
import QuantumBackground from '@/components/QuantumBackground';

type NoiseChannel = 'depolarizing' | 'amplitude' | 'phase' | 'none';

const BlochSpherePage = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [noiseStrength, setNoiseStrength] = useState(0.3);
  const [activeChannels, setActiveChannels] = useState<NoiseChannel[]>(['depolarizing', 'amplitude', 'phase']);
  const [trails, setTrails] = useState<Record<string, { x: number; y: number; z: number }[]>>({
    original: [],
    depolarizing: [],
    amplitude: [],
    phase: [],
  });
  
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  // Initial state: |+⟩ = (|0⟩ + |1⟩)/√2 on the equator
  const initialState = { x: 1, y: 0, z: 0 };

  // Calculate state evolution under different noise channels
  const calculateState = useCallback((t: number, channel: NoiseChannel) => {
    const p = noiseStrength * t;
    
    // Add some oscillation to make it more interesting
    const oscillation = Math.sin(t * 2) * 0.1;
    
    switch (channel) {
      case 'depolarizing': {
        // Uniform shrinking toward origin
        const scale = Math.max(0, 1 - (4 * p / 3));
        return {
          x: initialState.x * scale,
          y: oscillation * scale,
          z: 0,
        };
      }
      case 'amplitude': {
        // Drift toward |0⟩ (north pole, z=1)
        const decay = Math.exp(-p);
        return {
          x: initialState.x * decay,
          y: oscillation * decay,
          z: 1 - decay,
        };
      }
      case 'phase': {
        // Pure dephasing - x and y components decay, z stays
        const coherence = Math.exp(-p * 2);
        return {
          x: initialState.x * coherence,
          y: oscillation * coherence,
          z: 0,
        };
      }
      default:
        return {
          x: initialState.x * Math.cos(t * 0.5),
          y: initialState.x * Math.sin(t * 0.5),
          z: 0,
        };
    }
  }, [noiseStrength]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      return;
    }

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      setTime(prevTime => {
        const newTime = prevTime + delta * 0.5;
        
        // Update trails
        if (newTime < 10) {
          setTrails(prev => {
            const newTrails = { ...prev };
            activeChannels.forEach(channel => {
              const state = calculateState(newTime, channel);
              newTrails[channel] = [...(prev[channel] || []).slice(-100), state];
            });
            // Original state (precessing)
            newTrails.original = [...(prev.original || []).slice(-100), {
              x: Math.cos(newTime * 0.5),
              y: Math.sin(newTime * 0.5),
              z: 0,
            }];
            return newTrails;
          });
        }
        
        return newTime;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, activeChannels, calculateState]);

  const handleReset = () => {
    setIsPlaying(false);
    setTime(0);
    lastTimeRef.current = 0;
    setTrails({
      original: [],
      depolarizing: [],
      amplitude: [],
      phase: [],
    });
  };

  const toggleChannel = (channel: NoiseChannel) => {
    setActiveChannels(prev => 
      prev.includes(channel) 
        ? prev.filter(c => c !== channel)
        : [...prev, channel]
    );
  };

  // Build states array for the 3D visualization
  const states = [
    {
      vector: {
        x: Math.cos(time * 0.5),
        y: Math.sin(time * 0.5),
        z: 0,
      },
      trail: trails.original || [],
      color: '#ffffff',
      name: 'Original',
    },
    ...(activeChannels.includes('depolarizing') ? [{
      vector: calculateState(time, 'depolarizing'),
      trail: trails.depolarizing || [],
      color: '#00ffff',
      name: 'Depolarizing',
    }] : []),
    ...(activeChannels.includes('amplitude') ? [{
      vector: calculateState(time, 'amplitude'),
      trail: trails.amplitude || [],
      color: '#ff00ff',
      name: 'Amplitude Damping',
    }] : []),
    ...(activeChannels.includes('phase') ? [{
      vector: calculateState(time, 'phase'),
      trail: trails.phase || [],
      color: '#ffaa00',
      name: 'Phase Damping',
    }] : []),
  ];

  const channelInfo = [
    {
      id: 'depolarizing' as NoiseChannel,
      name: 'Depolarizing',
      icon: Shuffle,
      color: '#00ffff',
      description: 'Shrinks uniformly toward the center',
    },
    {
      id: 'amplitude' as NoiseChannel,
      name: 'Amplitude Damping',
      icon: Waves,
      color: '#ff00ff',
      description: 'Drifts toward |0⟩ (north pole)',
    },
    {
      id: 'phase' as NoiseChannel,
      name: 'Phase Damping',
      icon: CircleDot,
      color: '#ffaa00',
      description: 'Decays X-Y coherence only',
    },
  ];

  return (
    <>
      <Helmet>
        <title>3D Bloch Sphere | QuantumNoise</title>
        <meta name="description" content="Interactive 3D Bloch sphere visualization showing quantum state evolution under different noise channels." />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
        <QuantumBackground />
        
        <div className="relative z-10">
          {/* Header */}
          <header className="container mx-auto px-4 py-8">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Home</span>
            </Link>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-primary relative">
                  <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-primary rounded-full transform -translate-x-1/2 -translate-y-1/2" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gradient">3D Bloch Sphere</h1>
                <p className="text-muted-foreground">Visualize quantum state evolution under noise</p>
              </div>
            </div>
          </header>

          <main className="container mx-auto px-4 pb-16">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* 3D Visualization */}
              <div className="lg:col-span-2 glass rounded-2xl p-4">
                <BlochSphereCanvas states={states} />
                
                {/* Playback controls */}
                <div className="flex items-center justify-center gap-4 mt-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleReset}
                    className="rounded-full"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="rounded-full px-8"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                    {isPlaying ? 'Pause' : 'Play'}
                  </Button>
                </div>
                
                {/* Time indicator */}
                <div className="text-center mt-4">
                  <span className="text-sm text-muted-foreground">Time: </span>
                  <span className="text-sm font-mono text-primary">{time.toFixed(2)} a.u.</span>
                </div>
              </div>

              {/* Controls Panel */}
              <div className="space-y-4">
                {/* Noise Strength */}
                <div className="glass p-6 rounded-2xl">
                  <h3 className="font-semibold mb-4 text-foreground">Noise Strength</h3>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-muted-foreground">Strength</span>
                    <span className="text-sm font-mono text-primary">{(noiseStrength * 100).toFixed(0)}%</span>
                  </div>
                  <Slider
                    value={[noiseStrength]}
                    onValueChange={([v]) => setNoiseStrength(v)}
                    min={0.1}
                    max={1}
                    step={0.05}
                  />
                </div>

                {/* Channel Selection */}
                <div className="glass p-6 rounded-2xl">
                  <h3 className="font-semibold mb-4 text-foreground">Noise Channels</h3>
                  <div className="space-y-3">
                    {channelInfo.map((channel) => {
                      const Icon = channel.icon;
                      const isActive = activeChannels.includes(channel.id);
                      return (
                        <button
                          key={channel.id}
                          onClick={() => toggleChannel(channel.id)}
                          className={`w-full p-3 rounded-xl transition-all flex items-center gap-3 ${
                            isActive 
                              ? 'bg-muted/50 ring-1 ring-primary/50' 
                              : 'bg-muted/20 opacity-50'
                          }`}
                        >
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{ backgroundColor: `${channel.color}20` }}
                          >
                            <Icon className="w-4 h-4" style={{ color: channel.color }} />
                          </div>
                          <div className="text-left flex-1">
                            <p className="text-sm font-medium text-foreground">{channel.name}</p>
                            <p className="text-xs text-muted-foreground">{channel.description}</p>
                          </div>
                          <div 
                            className={`w-3 h-3 rounded-full transition-all ${isActive ? '' : 'opacity-30'}`}
                            style={{ backgroundColor: channel.color }}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Legend */}
                <div className="glass p-6 rounded-2xl">
                  <h3 className="font-semibold mb-4 text-foreground">Legend</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-white" />
                      <span className="text-sm text-muted-foreground">Original state (precessing)</span>
                    </div>
                    {channelInfo.filter(c => activeChannels.includes(c.id)).map(channel => (
                      <div key={channel.id} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: channel.color }} />
                        <span className="text-sm text-muted-foreground">{channel.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Info */}
                <div className="glass p-6 rounded-2xl">
                  <h3 className="font-semibold mb-3 text-foreground">About the Bloch Sphere</h3>
                  <p className="text-sm text-muted-foreground">
                    The Bloch sphere is a geometric representation of a qubit's pure and mixed states. 
                    Pure states lie on the surface, while mixed states are inside. 
                    Watch how different noise channels cause distinct decoherence patterns.
                  </p>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default BlochSpherePage;
