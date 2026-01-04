import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Text, Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface BlochSphereProps {
  stateVector: { x: number; y: number; z: number };
  showTrail?: boolean;
  trailPoints?: { x: number; y: number; z: number }[];
  color?: string;
}

const Axes = () => {
  const axisLength = 1.4;
  const axisColor = '#666';
  
  return (
    <group>
      {/* X axis */}
      <Line
        points={[[-axisLength, 0, 0], [axisLength, 0, 0]]}
        color={axisColor}
        lineWidth={1}
        dashed
        dashSize={0.05}
        gapSize={0.03}
      />
      <Text position={[axisLength + 0.15, 0, 0]} fontSize={0.15} color="#0ff">X</Text>
      <Text position={[axisLength + 0.15, -0.15, 0]} fontSize={0.08} color="#888">|+⟩</Text>
      <Text position={[-axisLength - 0.15, -0.15, 0]} fontSize={0.08} color="#888">|-⟩</Text>
      
      {/* Y axis */}
      <Line
        points={[[0, -axisLength, 0], [0, axisLength, 0]]}
        color={axisColor}
        lineWidth={1}
        dashed
        dashSize={0.05}
        gapSize={0.03}
      />
      <Text position={[0, axisLength + 0.15, 0]} fontSize={0.15} color="#0ff">Z</Text>
      <Text position={[0.15, axisLength + 0.15, 0]} fontSize={0.08} color="#888">|0⟩</Text>
      <Text position={[0.15, -axisLength - 0.15, 0]} fontSize={0.08} color="#888">|1⟩</Text>
      
      {/* Z axis */}
      <Line
        points={[[0, 0, -axisLength], [0, 0, axisLength]]}
        color={axisColor}
        lineWidth={1}
        dashed
        dashSize={0.05}
        gapSize={0.03}
      />
      <Text position={[0, 0, axisLength + 0.15]} fontSize={0.15} color="#0ff">Y</Text>
      <Text position={[0.15, 0, axisLength + 0.15]} fontSize={0.08} color="#888">|+i⟩</Text>
      <Text position={[0.15, 0, -axisLength - 0.15]} fontSize={0.08} color="#888">|-i⟩</Text>
    </group>
  );
};

const BlochSphereWireframe = () => {
  const sphereRef = useRef<THREE.Mesh>(null);
  
  // Create circle geometries for equator and meridians
  const equatorPoints = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 64; i++) {
      const theta = (i / 64) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(theta), 0, Math.sin(theta)));
    }
    return points;
  }, []);

  const meridian1Points = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 64; i++) {
      const phi = (i / 64) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(phi), Math.sin(phi), 0));
    }
    return points;
  }, []);

  const meridian2Points = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i <= 64; i++) {
      const phi = (i / 64) * Math.PI * 2;
      points.push(new THREE.Vector3(0, Math.sin(phi), Math.cos(phi)));
    }
    return points;
  }, []);

  return (
    <group>
      {/* Transparent sphere */}
      <Sphere ref={sphereRef} args={[1, 32, 32]}>
        <meshBasicMaterial color="#0ff" transparent opacity={0.05} side={THREE.DoubleSide} />
      </Sphere>
      
      {/* Wireframe circles */}
      <Line points={equatorPoints} color="#0ff" lineWidth={0.5} transparent opacity={0.3} />
      <Line points={meridian1Points} color="#0ff" lineWidth={0.5} transparent opacity={0.3} />
      <Line points={meridian2Points} color="#0ff" lineWidth={0.5} transparent opacity={0.3} />
    </group>
  );
};

interface StateVectorArrowProps {
  position: { x: number; y: number; z: number };
  color: string;
}

const StateVectorArrow = ({ position, color }: StateVectorArrowProps) => {
  const arrowRef = useRef<THREE.Group>(null);
  
  const direction = useMemo(() => {
    return new THREE.Vector3(position.x, position.z, position.y).normalize();
  }, [position]);
  
  const length = useMemo(() => {
    return Math.sqrt(position.x ** 2 + position.y ** 2 + position.z ** 2);
  }, [position]);

  return (
    <group ref={arrowRef}>
      {/* State vector line */}
      <Line
        points={[[0, 0, 0], [position.x * length, position.z * length, position.y * length]]}
        color={color}
        lineWidth={3}
      />
      
      {/* State point */}
      <mesh position={[position.x * length, position.z * length, position.y * length]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      
      {/* Glow effect */}
      <mesh position={[position.x * length, position.z * length, position.y * length]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>
    </group>
  );
};

interface TrailProps {
  points: { x: number; y: number; z: number }[];
  color: string;
}

const Trail = ({ points, color }: TrailProps) => {
  const linePoints = useMemo(() => {
    return points.map(p => new THREE.Vector3(p.x, p.z, p.y));
  }, [points]);

  if (linePoints.length < 2) return null;

  return (
    <Line
      points={linePoints}
      color={color}
      lineWidth={2}
      transparent
      opacity={0.6}
    />
  );
};

interface BlochScene3DProps {
  states: {
    vector: { x: number; y: number; z: number };
    trail: { x: number; y: number; z: number }[];
    color: string;
    name: string;
  }[];
}

const BlochScene3D = ({ states }: BlochScene3DProps) => {
  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      
      <BlochSphereWireframe />
      <Axes />
      
      {states.map((state, idx) => (
        <group key={idx}>
          <Trail points={state.trail} color={state.color} />
          <StateVectorArrow position={state.vector} color={state.color} />
        </group>
      ))}
      
      <OrbitControls 
        enablePan={false} 
        minDistance={2} 
        maxDistance={6}
        autoRotate
        autoRotateSpeed={0.5}
      />
    </>
  );
};

interface BlochSphereCanvasProps {
  states: {
    vector: { x: number; y: number; z: number };
    trail: { x: number; y: number; z: number }[];
    color: string;
    name: string;
  }[];
}

const BlochSphereCanvas = ({ states }: BlochSphereCanvasProps) => {
  return (
    <div className="w-full h-[500px] rounded-2xl overflow-hidden">
      <Canvas camera={{ position: [2.5, 2, 2.5], fov: 50 }}>
        <color attach="background" args={['#0a0a0f']} />
        <fog attach="fog" args={['#0a0a0f', 5, 15]} />
        <BlochScene3D states={states} />
      </Canvas>
    </div>
  );
};

export default BlochSphereCanvas;
