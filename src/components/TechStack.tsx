const technologies = [
  { name: 'Qiskit', icon: '⚛️' },
  { name: 'Python', icon: '🐍' },
  { name: 'NumPy', icon: '🔢' },
  { name: 'Matplotlib', icon: '📊' },
  { name: 'Zero-Noise Extrapolation', icon: '🎯' },
  { name: 'Circuit Folding', icon: '🔄' },
  { name: 'Noise Models', icon: '📡' },
  { name: 'Quantum Algorithms', icon: '⚡' },
];

const TechStack = () => {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {technologies.map((tech, index) => (
        <div
          key={tech.name}
          className="metric-badge opacity-0 animate-scale-in hover:glow-sm hover:border-primary/50 transition-all duration-300 cursor-default"
          style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'forwards' }}
        >
          <span>{tech.icon}</span>
          <span className="font-medium">{tech.name}</span>
        </div>
      ))}
    </div>
  );
};

export default TechStack;