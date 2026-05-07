import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { categoryColors } from '../data/mockData';
import './KnowledgeGraph.css';

export default function KnowledgeGraph({ nodes, edges, onNodeClick }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !nodes.length) return;

    const container = containerRef.current;
    const W = container.clientWidth || 800;
    const H = container.clientHeight || 600;

    // Create a fresh copy of data to avoid mutation issues
    const nodeData = nodes.map(d => ({ 
      ...d, 
      x: d.x || W / 2, 
      y: d.y || H / 2 
    }));
    
    const linkData = edges.map(d => ({ 
      ...d, 
      source: d.source.id || d.source, 
      target: d.target.id || d.target 
    }));

    const svg = d3.select(svgRef.current)
      .attr('width', W)
      .attr('height', H);
    
    svg.selectAll('*').remove();
    
    const defs = svg.append('defs');
    const g = svg.append('g');

    // Glow Filters
    Object.entries(categoryColors).forEach(([name, color]) => {
      const f = defs.append('filter')
        .attr('id', `glow-${name.toLowerCase()}`)
        .attr('x', '-200%').attr('y', '-200%').attr('width', '500%').attr('height', '500%');
      f.append('feGaussianBlur').attr('stdDeviation', '5').attr('result', 'blur');
      const merge = f.append('feMerge');
      merge.append('feMergeNode').attr('in', 'blur');
      merge.append('feMergeNode').attr('in', 'SourceGraphic');
    });

    const zoom = d3.zoom()
      .scaleExtent([0.1, 5])
      .on('zoom', (e) => g.attr('transform', e.transform));
    svg.call(zoom);

    // Simulation
    const sim = d3.forceSimulation(nodeData)
      .force('link', d3.forceLink(linkData).id(d => d.id).distance(140).strength(0.8))
      .force('charge', d3.forceManyBody().strength(-600))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collide', d3.forceCollide(60))
      .alphaTarget(0.02);

    // Focusing Function (Reset to Center / Identity)
    const focusOnIdentity = () => {
      const identityNode = nodeData.find(n => n.id === 'john_doe');
      if (!identityNode) return;
      
      const scale = 1.2;
      const x = W / 2 - identityNode.x * scale;
      const y = H / 2 - identityNode.y * scale;

      svg.transition().duration(1000).ease(d3.easeCubicInOut)
        .call(zoom.transform, d3.zoomIdentity.translate(x, y).scale(scale));
    };

    // Global Key Listener
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === 'f') {
        focusOnIdentity();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // 1. Links (Bottom layer)
    const link = g.append('g')
      .selectAll('line')
      .data(linkData)
      .join('line')
      .attr('stroke', 'rgba(124, 106, 255, 0.25)')
      .attr('stroke-width', 1.5);

    // 2. Electric Shocks
    const flow = g.append('g')
      .selectAll('line')
      .data(linkData)
      .join('line')
      .attr('stroke', '#7c6aff')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '8, 12')
      .attr('class', 'electric-shock')
      .style('opacity', 0.6);

    // 3. Nodes (Top layer)
    const node = g.append('g')
      .selectAll('g')
      .data(nodeData)
      .join('g')
      .attr('class', 'node-group')
      .on('click', (e, d) => onNodeClick(d))
      .on('mouseenter', (e, d) => {
        d3.select(e.currentTarget).select('.node-circle')
          .transition().duration(200)
          .attr('r', d.id === 'john_doe' ? 30 : 22)
          .attr('stroke-width', 5);
        d3.select(e.currentTarget).select('.node-label')
          .transition().duration(200)
          .attr('font-size', '14px')
          .attr('fill', '#a78bfa');
      })
      .on('mouseleave', (e, d) => {
        d3.select(e.currentTarget).select('.node-circle')
          .transition().duration(200)
          .attr('r', d.id === 'john_doe' ? 24 : 18)
          .attr('stroke-width', 3);
        d3.select(e.currentTarget).select('.node-label')
          .transition().duration(200)
          .attr('font-size', '12px')
          .attr('fill', '#fff');
      })
      .call(d3.drag()
        .on('start', (e, d) => {
          if (!e.active) sim.alphaTarget(0.3).restart();
          d.fx = d.x; d.fy = d.y;
        })
        .on('drag', (e, d) => {
          d.fx = e.x; d.fy = e.y;
        })
        .on('end', (e, d) => {
          if (!e.active) sim.alphaTarget(0.02);
          d.fx = null; d.fy = null;
        })
      );

    node.append('circle')
      .attr('class', 'node-circle')
      .attr('r', d => (d.id === 'john_doe' ? 24 : 18))
      .attr('fill', '#0a0a0f')
      .attr('stroke', d => categoryColors[d.category] || '#7c6aff')
      .attr('stroke-width', 3)
      .attr('filter', d => `url(#glow-${d.category.toLowerCase()})`);

    // Heartbeat Pulse for Identity
    node.filter(d => d.id === 'john_doe')
      .append('circle')
      .attr('r', 24)
      .attr('fill', 'none')
      .attr('stroke', categoryColors.identity)
      .attr('stroke-width', 1)
      .attr('class', 'pulse-circle');

    node.append('circle')
      .attr('r', d => (d.id === 'john_doe' ? 10 : 8))
      .attr('fill', d => categoryColors[d.category] || '#7c6aff');

    node.append('text')
      .attr('class', 'node-label')
      .attr('dy', 45)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', '700')
      .attr('fill', '#fff')
      .style('pointer-events', 'none')
      .style('text-shadow', '0 2px 4px #000')
      .text(d => d.label);

    sim.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      
      flow
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => {
      sim.stop();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [nodes, edges]);

  return (
    <div className="graph-container" ref={containerRef}>
      <svg ref={svgRef}></svg>
      <div className="graph-legend">
        {Object.entries(categoryColors).map(([cat, color]) => (
          <div key={cat} className="legend-item">
            <span className="dot" style={{ background: color }}></span>
            <span className="label">{cat}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
