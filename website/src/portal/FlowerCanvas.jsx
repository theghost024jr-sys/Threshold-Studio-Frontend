import { useEffect, useRef } from 'react';
import { connect, subscribe } from './ThresholdEngineClient';

export default function FlowerCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    connect();

    const ctx = canvasRef.current.getContext('2d');

    return subscribe((world) => {
      ctx.clearRect(0, 0, 800, 800);

      world.nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = node.color || '#fff';
        ctx.fill();
      });
    });
  }, []);

  return <canvas ref={canvasRef} width={800} height={800} />;
}
