import { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import { useAllNoteLinks } from '../../hooks/useNoteLinks';
import { useNotes } from '../../hooks/useNotes';
import { X, Maximize2, Minimize2 } from 'lucide-react';

interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface GraphEdge {
  source: string;
  target: string;
}

interface GraphViewProps {
  onSelectNote: (id: string) => void;
  onClose: () => void;
}

export function GraphView({ onSelectNote, onClose }: GraphViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const nodesRef = useRef<GraphNode[]>([]);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const dragRef = useRef<{ nodeId: string; offsetX: number; offsetY: number } | null>(null);

  const { allLinks } = useAllNoteLinks();
  const { notes } = useNotes();

  const activeNotes = useMemo(() =>
    notes.filter(n => !n.isSoftDeleted && !n.isArchived),
    [notes]
  );

  const edges: GraphEdge[] = useMemo(() =>
    allLinks.map(l => ({ source: l.sourceNoteId, target: l.targetNoteId })),
    [allLinks]
  );

  // Initialize nodes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width;
    const h = canvas.height;

    // Keep existing positions for nodes that already exist
    const existingMap = new Map(nodesRef.current.map(n => [n.id, n]));

    nodesRef.current = activeNotes.map((note) => {
      const existing = existingMap.get(note.id);
      if (existing) {
        return { ...existing, label: note.title || 'Untitled' };
      }
      return {
        id: note.id,
        label: note.title || 'Untitled',
        x: w * 0.2 + Math.random() * w * 0.6,
        y: h * 0.2 + Math.random() * h * 0.6,
        vx: 0,
        vy: 0,
      };
    });
  }, [activeNotes]);

  // Force-directed simulation
  const simulate = useCallback(() => {
    const nodes = nodesRef.current;
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;

    const w = canvas.width;
    const h = canvas.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Simple force simulation
    const repulsionStrength = 2000;
    const attractionStrength = 0.02;
    const centerGravity = 0.01;
    const damping = 0.85;

    // Repulsion between all nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const force = repulsionStrength / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        nodes[i].vx -= fx;
        nodes[i].vy -= fy;
        nodes[j].vx += fx;
        nodes[j].vy += fy;
      }
    }

    // Attraction along edges
    for (const edge of edges) {
      const src = nodes.find(n => n.id === edge.source);
      const tgt = nodes.find(n => n.id === edge.target);
      if (!src || !tgt) continue;
      const dx = tgt.x - src.x;
      const dy = tgt.y - src.y;
      const fx = dx * attractionStrength;
      const fy = dy * attractionStrength;
      src.vx += fx;
      src.vy += fy;
      tgt.vx -= fx;
      tgt.vy -= fy;
    }

    // Center gravity
    for (const node of nodes) {
      if (dragRef.current?.nodeId === node.id) continue;
      node.vx += (w / 2 - node.x) * centerGravity;
      node.vy += (h / 2 - node.y) * centerGravity;
      node.vx *= damping;
      node.vy *= damping;
      node.x += node.vx;
      node.y += node.vy;
      // Bounds
      node.x = Math.max(30, Math.min(w - 30, node.x));
      node.y = Math.max(30, Math.min(h - 30, node.y));
    }

    // Draw
    const isDark = document.documentElement.classList.contains('dark');
    ctx.clearRect(0, 0, w, h);

    // Edges
    ctx.strokeStyle = isDark ? 'rgba(148, 163, 184, 0.25)' : 'rgba(100, 116, 139, 0.2)';
    ctx.lineWidth = 1.5;
    for (const edge of edges) {
      const src = nodes.find(n => n.id === edge.source);
      const tgt = nodes.find(n => n.id === edge.target);
      if (!src || !tgt) continue;
      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(tgt.x, tgt.y);
      ctx.stroke();
    }

    // Nodes
    for (const node of nodes) {
      const isHovered = hoveredNode === node.id;
      const hasEdge = edges.some(e => e.source === node.id || e.target === node.id);
      const radius = isHovered ? 10 : hasEdge ? 7 : 5;

      // Glow
      if (isHovered) {
        ctx.shadowColor = isDark ? '#818cf8' : '#6366f1';
        ctx.shadowBlur = 15;
      }

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = isHovered
        ? (isDark ? '#818cf8' : '#6366f1')
        : hasEdge
          ? (isDark ? '#a78bfa' : '#8b5cf6')
          : (isDark ? '#475569' : '#94a3b8');
      ctx.fill();
      ctx.shadowBlur = 0;

      // Label
      if (isHovered || nodes.length < 40) {
        ctx.font = `${isHovered ? '13' : '11'}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillStyle = isDark ? '#e2e8f0' : '#1e293b';
        ctx.fillText(
          node.label.length > 25 ? node.label.slice(0, 25) + '…' : node.label,
          node.x,
          node.y - radius - 6
        );
      }
    }

    animFrameRef.current = requestAnimationFrame(simulate);
  }, [edges, hoveredNode]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(simulate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [simulate]);

  // Resize canvas to container
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const observer = new ResizeObserver(() => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    });
    observer.observe(container);
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    return () => observer.disconnect();
  }, [isFullscreen]);

  // Mouse interaction
  const getNodeAt = useCallback((x: number, y: number): GraphNode | undefined => {
    return nodesRef.current.find(n => {
      const dx = n.x - x;
      const dy = n.y - y;
      return dx * dx + dy * dy < 225; // 15px radius hit area
    });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (dragRef.current) {
      const node = nodesRef.current.find(n => n.id === dragRef.current?.nodeId);
      if (node) {
        node.x = x - dragRef.current.offsetX;
        node.y = y - dragRef.current.offsetY;
        node.vx = 0;
        node.vy = 0;
      }
      return;
    }

    const node = getNodeAt(x, y);
    setHoveredNode(node?.id || null);
    canvas.style.cursor = node ? 'pointer' : 'default';
  }, [getNodeAt]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const node = getNodeAt(x, y);
    if (node) {
      dragRef.current = { nodeId: node.id, offsetX: x - node.x, offsetY: y - node.y };
    }
  }, [getNodeAt]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragRef.current) {
      dragRef.current = null;
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const node = getNodeAt(e.clientX - rect.left, e.clientY - rect.top);
    if (node) {
      onSelectNote(node.id);
    }
  }, [getNodeAt, onSelectNote]);

  return (
    <div
      ref={containerRef}
      className={`relative bg-surface-0 border border-edge overflow-hidden ${
        isFullscreen ? 'fixed inset-0 z-50' : 'flex-1 rounded-3xl'
      }`}
    >
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
        <h2 className="text-sm font-semibold text-txt-primary bg-surface-1/80 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-edge">
          Knowledge Graph
        </h2>
        <span className="text-2xs text-txt-tertiary bg-surface-1/80 backdrop-blur-sm px-2 py-1 rounded-lg border border-edge">
          {activeNotes.length} notes · {edges.length} links
        </span>
      </div>
      <div className="absolute top-4 right-4 z-10 flex items-center gap-1">
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="btn-icon bg-surface-1/80 backdrop-blur-sm border border-edge"
          title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
        <button onClick={onClose} className="btn-icon bg-surface-1/80 backdrop-blur-sm border border-edge">
          <X size={16} />
        </button>
      </div>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { setHoveredNode(null); dragRef.current = null; }}
      />
    </div>
  );
}
