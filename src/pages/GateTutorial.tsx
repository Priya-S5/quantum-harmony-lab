import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BookOpen, Code, ExternalLink, Lightbulb, Cpu, Zap, ArrowRight } from 'lucide-react';

const gateLessons = [
  {
    id: 'pauli',
    title: 'Pauli Gates (X, Y, Z)',
    description: 'The fundamental single-qubit gates',
    difficulty: 'Beginner',
    content: {
      theory: `The Pauli gates are the building blocks of quantum computing. They perform rotations of π radians around the X, Y, and Z axes of the Bloch sphere.

**Pauli-X (NOT Gate):**
- Flips |0⟩ to |1⟩ and |1⟩ to |0⟩
- Analogous to classical NOT gate
- Matrix: [[0,1],[1,0]]

**Pauli-Y:**
- Combines bit flip with phase flip
- Rotates π around Y-axis
- Matrix: [[0,-i],[i,0]]

**Pauli-Z (Phase Flip):**
- Leaves |0⟩ unchanged, maps |1⟩ to -|1⟩
- Only affects relative phase
- Matrix: [[1,0],[0,-1]]`,
      qiskit: `from qiskit import QuantumCircuit

# Create a quantum circuit with 1 qubit
qc = QuantumCircuit(1)

# Apply Pauli-X gate (bit flip)
qc.x(0)

# Apply Pauli-Y gate
qc.y(0)

# Apply Pauli-Z gate (phase flip)
qc.z(0)

# Draw the circuit
print(qc.draw())`,
      exercise: 'Try applying X gate twice to a qubit in |0⟩ state. What state do you end up in?'
    }
  },
  {
    id: 'hadamard',
    title: 'Hadamard Gate (H)',
    description: 'The superposition creator',
    difficulty: 'Beginner',
    content: {
      theory: `The Hadamard gate is perhaps the most important single-qubit gate. It creates superposition states from basis states.

**Key Properties:**
- H|0⟩ = (|0⟩ + |1⟩)/√2 = |+⟩
- H|1⟩ = (|0⟩ - |1⟩)/√2 = |-⟩
- H² = I (applying twice returns to original state)
- Self-inverse: H = H†

**Bloch Sphere View:**
- Rotates the state vector to the equator
- Creates equal probability of measuring 0 or 1

**Applications:**
- Creating superposition for quantum parallelism
- Basis for Deutsch-Jozsa algorithm
- Part of many quantum algorithms`,
      qiskit: `from qiskit import QuantumCircuit
from qiskit_aer import AerSimulator

# Create circuit and apply Hadamard
qc = QuantumCircuit(1, 1)
qc.h(0)  # Apply Hadamard
qc.measure(0, 0)

# Simulate
simulator = AerSimulator()
result = simulator.run(qc, shots=1000).result()
counts = result.get_counts()
print(counts)  # ~{'0': 500, '1': 500}`,
      exercise: 'What happens when you apply H, then Z, then H to |0⟩? This is called the HZH identity.'
    }
  },
  {
    id: 'phase',
    title: 'Phase Gates (S, T)',
    description: 'Precision phase control',
    difficulty: 'Intermediate',
    content: {
      theory: `Phase gates add relative phases between |0⟩ and |1⟩ components. They're crucial for quantum algorithms.

**S Gate (√Z):**
- S|0⟩ = |0⟩
- S|1⟩ = i|1⟩
- Rotates π/2 around Z-axis
- S² = Z

**T Gate (√S):**
- T|0⟩ = |0⟩  
- T|1⟩ = e^(iπ/4)|1⟩
- Rotates π/4 around Z-axis
- T² = S
- Also called π/8 gate

**Why Phase Matters:**
- Creates interference effects
- Essential for universal quantum computation
- T gate is expensive in fault-tolerant QC`,
      qiskit: `from qiskit import QuantumCircuit
import numpy as np

qc = QuantumCircuit(1)

# First create superposition
qc.h(0)

# Apply S gate (90° phase)
qc.s(0)

# Apply T gate (45° phase)
qc.t(0)

# Can also use parameterized phase
qc.p(np.pi/3, 0)  # Arbitrary phase

print(qc.draw())`,
      exercise: 'Verify that applying S gate 4 times is equivalent to identity (S⁴ = I).'
    }
  },
  {
    id: 'rotation',
    title: 'Rotation Gates (Rx, Ry, Rz)',
    description: 'Continuous rotations on the Bloch sphere',
    difficulty: 'Intermediate',
    content: {
      theory: `Rotation gates provide continuous control over qubit states. Any single-qubit gate can be decomposed into rotations.

**Rx(θ) - Rotation around X:**
- Rotates by angle θ around X-axis
- Rx(π) = X (up to global phase)

**Ry(θ) - Rotation around Y:**
- Rotates by angle θ around Y-axis  
- Changes both amplitude and phase
- Ry(π) = Y (up to global phase)

**Rz(θ) - Rotation around Z:**
- Rotates by angle θ around Z-axis
- Only changes relative phase
- Rz(π) = Z (up to global phase)

**Universal Decomposition:**
Any single-qubit unitary U can be written as:
U = e^(iα) Rz(β) Ry(γ) Rz(δ)`,
      qiskit: `from qiskit import QuantumCircuit
import numpy as np

qc = QuantumCircuit(1)

# Rotation gates with angle in radians
qc.rx(np.pi/4, 0)   # 45° around X
qc.ry(np.pi/2, 0)   # 90° around Y  
qc.rz(np.pi, 0)     # 180° around Z

# Equivalent to X gate
qc2 = QuantumCircuit(1)
qc2.rx(np.pi, 0)

# Universal decomposition example
qc3 = QuantumCircuit(1)
qc3.rz(0.5, 0)
qc3.ry(0.3, 0)
qc3.rz(0.7, 0)`,
      exercise: 'Find rotation angles to transform |0⟩ to the state (|0⟩ + i|1⟩)/√2.'
    }
  },
  {
    id: 'cnot',
    title: 'CNOT Gate',
    description: 'Two-qubit entangling gate',
    difficulty: 'Intermediate',
    content: {
      theory: `The Controlled-NOT (CNOT) gate is the most important two-qubit gate. It creates entanglement.

**How It Works:**
- Control qubit: determines whether to flip
- Target qubit: gets flipped if control is |1⟩
- CNOT|00⟩ = |00⟩
- CNOT|01⟩ = |01⟩
- CNOT|10⟩ = |11⟩ (target flipped!)
- CNOT|11⟩ = |10⟩ (target flipped!)

**Creating Bell States:**
H on qubit 0, then CNOT(0→1):
|00⟩ → (|00⟩ + |11⟩)/√2

This is maximally entangled - measuring one qubit instantly determines the other!

**Universal Computing:**
CNOT + single-qubit gates = universal quantum computing`,
      qiskit: `from qiskit import QuantumCircuit

# Create Bell state
qc = QuantumCircuit(2, 2)
qc.h(0)        # Superposition on qubit 0
qc.cx(0, 1)    # CNOT with control=0, target=1
qc.measure([0,1], [0,1])

print(qc.draw())
# Output: ~{'00': 500, '11': 500}

# GHZ state (3-qubit entanglement)
ghz = QuantumCircuit(3)
ghz.h(0)
ghz.cx(0, 1)
ghz.cx(1, 2)
# Creates (|000⟩ + |111⟩)/√2`,
      exercise: 'Create a circuit that produces the Bell state (|01⟩ + |10⟩)/√2.'
    }
  },
  {
    id: 'toffoli',
    title: 'Toffoli Gate (CCX)',
    description: 'Universal classical-compatible gate',
    difficulty: 'Advanced',
    content: {
      theory: `The Toffoli gate (Controlled-Controlled-NOT) is a three-qubit gate essential for reversible computation.

**How It Works:**
- Two control qubits, one target
- Target flips only if BOTH controls are |1⟩
- CCX|110⟩ = |111⟩
- CCX|111⟩ = |110⟩
- All other states unchanged

**Classical Universality:**
- Can implement any classical Boolean function
- AND gate: CCX with target initialized to |0⟩
- NAND gate: CCX followed by X on target
- This means quantum computers can do everything classical computers can!

**Quantum Circuits:**
- Often decomposed into CNOT and single-qubit gates
- Requires ~6 CNOTs for standard decomposition
- Used in quantum error correction`,
      qiskit: `from qiskit import QuantumCircuit

# Toffoli gate
qc = QuantumCircuit(3)
qc.ccx(0, 1, 2)  # Control: 0,1; Target: 2

# Implementing AND gate
and_gate = QuantumCircuit(3)
# Set inputs (example: both 1)
and_gate.x(0)
and_gate.x(1)
# Apply Toffoli
and_gate.ccx(0, 1, 2)
# Qubit 2 now contains AND of inputs

# Decomposition into basic gates
decomposed = QuantumCircuit(3)
decomposed.h(2)
decomposed.cx(1, 2)
decomposed.tdg(2)
decomposed.cx(0, 2)
decomposed.t(2)
decomposed.cx(1, 2)
decomposed.tdg(2)
decomposed.cx(0, 2)
decomposed.t(1)
decomposed.t(2)
decomposed.h(2)
decomposed.cx(0, 1)
decomposed.t(0)
decomposed.tdg(1)
decomposed.cx(0, 1)`,
      exercise: 'Implement a full adder circuit using Toffoli and CNOT gates.'
    }
  }
];

const qiskitResources = [
  {
    title: 'Qiskit Textbook',
    description: 'Comprehensive free online textbook covering quantum computing fundamentals',
    url: 'https://qiskit.org/learn',
    type: 'Documentation'
  },
  {
    title: 'IBM Quantum Lab',
    description: 'Cloud-based quantum computing platform with free access to real quantum hardware',
    url: 'https://quantum.ibm.com/',
    type: 'Platform'
  },
  {
    title: 'Qiskit GitHub',
    description: 'Open-source quantum computing SDK with examples and tutorials',
    url: 'https://github.com/Qiskit/qiskit',
    type: 'Code'
  },
  {
    title: 'Qiskit YouTube',
    description: 'Video tutorials and quantum computing summer school recordings',
    url: 'https://www.youtube.com/@qiskit',
    type: 'Video'
  }
];

const GateTutorial = () => {
  const [selectedLesson, setSelectedLesson] = useState(gateLessons[0]);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Gate Tutorial | QuantumNoise</title>
        <meta name="description" content="Learn quantum gates with interactive tutorials and Qiskit code examples" />
      </Helmet>
      
      <Navigation />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-quantum-accent to-quantum-tertiary bg-clip-text text-transparent">
            Quantum Gate Tutorial
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Master quantum gates from fundamentals to advanced concepts with Qiskit examples
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Lesson Navigation */}
          <div className="lg:col-span-1">
            <Card className="glass border-primary/20 sticky top-24">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Lessons
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {gateLessons.map(lesson => (
                  <Button
                    key={lesson.id}
                    variant={selectedLesson.id === lesson.id ? 'default' : 'ghost'}
                    className="w-full justify-start h-auto py-3"
                    onClick={() => setSelectedLesson(lesson)}
                  >
                    <div className="text-left">
                      <div className="font-semibold">{lesson.title}</div>
                      <div className="text-xs opacity-70">{lesson.difficulty}</div>
                    </div>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Lesson Content */}
          <div className="lg:col-span-3 space-y-6">
            <Card className="glass border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{selectedLesson.title}</CardTitle>
                    <CardDescription>{selectedLesson.description}</CardDescription>
                  </div>
                  <Badge variant="outline">{selectedLesson.difficulty}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="theory" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="theory" className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      Theory
                    </TabsTrigger>
                    <TabsTrigger value="qiskit" className="flex items-center gap-2">
                      <Code className="w-4 h-4" />
                      Qiskit Code
                    </TabsTrigger>
                    <TabsTrigger value="exercise" className="flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Exercise
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="theory" className="mt-6">
                    <div className="prose prose-invert max-w-none">
                      {selectedLesson.content.theory.split('\n\n').map((paragraph, i) => (
                        <p key={i} className="mb-4 text-muted-foreground whitespace-pre-line">
                          {paragraph.split('**').map((part, j) => 
                            j % 2 === 1 ? <strong key={j} className="text-foreground">{part}</strong> : part
                          )}
                        </p>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="qiskit" className="mt-6">
                    <div className="relative">
                      <pre className="bg-muted/50 p-4 rounded-lg overflow-x-auto text-sm font-mono">
                        <code className="text-foreground">{selectedLesson.content.qiskit}</code>
                      </pre>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="absolute top-2 right-2"
                        onClick={() => navigator.clipboard.writeText(selectedLesson.content.qiskit)}
                      >
                        Copy
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                      Run this code in IBM Quantum Lab or your local Qiskit installation.
                    </p>
                  </TabsContent>
                  
                  <TabsContent value="exercise" className="mt-6">
                    <Card className="bg-primary/10 border-primary/30">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Zap className="w-5 h-5 text-primary" />
                          Practice Exercise
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">{selectedLesson.content.exercise}</p>
                        <Button className="mt-4" variant="outline">
                          <ArrowRight className="w-4 h-4 mr-2" />
                          Try in Gate Playground
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Qiskit Resources */}
            <Card className="glass border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-primary" />
                  Explore Qiskit
                </CardTitle>
                <CardDescription>
                  IBM's open-source quantum computing framework
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {qiskitResources.map(resource => (
                    <a
                      key={resource.title}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-4 rounded-lg border border-border hover:border-primary transition-colors group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold group-hover:text-primary transition-colors">
                          {resource.title}
                        </h4>
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">{resource.description}</p>
                      <Badge variant="secondary" className="mt-2">{resource.type}</Badge>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* FAQ */}
            <Card className="glass border-primary/20">
              <CardHeader>
                <CardTitle>Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>Why are quantum gates unitary?</AccordionTrigger>
                    <AccordionContent>
                      Quantum mechanics requires that probability is conserved. Unitary transformations preserve 
                      the norm of quantum states, ensuring probabilities always sum to 1. Mathematically, 
                      U†U = UU† = I.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-2">
                    <AccordionTrigger>What makes a gate set universal?</AccordionTrigger>
                    <AccordionContent>
                      A universal gate set can approximate any unitary operation to arbitrary precision. 
                      Common examples: {'{H, T, CNOT}'} or {'{Rx, Ry, CNOT}'}. This means any quantum 
                      algorithm can be compiled to these basic gates.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-3">
                    <AccordionTrigger>Why is the T gate so important?</AccordionTrigger>
                    <AccordionContent>
                      The T gate, combined with Clifford gates (H, S, CNOT), forms a universal gate set. 
                      In fault-tolerant quantum computing, T gates are expensive to implement via magic 
                      state distillation, making T-count optimization crucial.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="item-4">
                    <AccordionTrigger>How do I run circuits on real quantum hardware?</AccordionTrigger>
                    <AccordionContent>
                      IBM Quantum provides free access to real quantum computers. Create an account at 
                      quantum.ibm.com, use the Qiskit SDK, and submit jobs to their cloud queue. 
                      Be aware of noise and limited qubit connectivity on real devices!
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GateTutorial;
