import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  getNodesBounds,
  getViewportForBounds,
} from '@xyflow/react';
import { toPng } from 'html-to-image';
import '@xyflow/react/dist/style.css';

const initialNodes = [
  { id: 'home', position: { x: 400, y: 0 }, data: { label: 'Home (/)' }, type: 'input' },
  { id: 'login', position: { x: 100, y: 100 }, data: { label: 'Auth (/login)' } },
  { id: 'setup', position: { x: 250, y: 100 }, data: { label: 'PcSetup (/setup)' } },
  { id: 'compare', position: { x: 400, y: 100 }, data: { label: 'Compare (/compare)' } },
  { id: 'catalog', position: { x: 550, y: 100 }, data: { label: 'Catalog (/catalog)' } },
  { id: 'profile', position: { x: 700, y: 100 }, data: { label: 'Profile (/profile)' } },
  { id: 'game-result', position: { x: 550, y: 200 }, data: { label: 'Result (/game/:id)' } },
  { id: 'game-details', position: { x: 700, y: 200 }, data: { label: 'Details (/details/:id)' } },
  { id: 'settings', position: { x: 850, y: 100 }, data: { label: 'Settings (/settings)' } },
  { id: 'admin', position: { x: 1000, y: 100 }, data: { label: 'Admin (/admin)' }, type: 'output' },
  { id: 'terms', position: { x: 250, y: 300 }, data: { label: 'Terms (/terms)' } },
  { id: 'privacy', position: { x: 400, y: 300 }, data: { label: 'Privacy (/privacy)' } },
];

const initialEdges = [
  { id: 'e-home-login', source: 'home', target: 'login' },
  { id: 'e-home-setup', source: 'home', target: 'setup' },
  { id: 'e-home-compare', source: 'home', target: 'compare' },
  { id: 'e-home-catalog', source: 'home', target: 'catalog' },
  { id: 'e-home-profile', source: 'home', target: 'profile' },
  { id: 'e-catalog-result', source: 'catalog', target: 'game-result' },
  { id: 'e-result-details', source: 'game-result', target: 'game-details' },
  { id: 'e-profile-settings', source: 'profile', target: 'settings' },
  { id: 'e-profile-admin', source: 'profile', target: 'admin' },
  { id: 'e-home-terms', source: 'home', target: 'terms' },
  { id: 'e-home-privacy', source: 'home', target: 'privacy' },
];

const STORAGE_KEY = 'playcheck-sitemap-state';

function downloadImage(dataUrl) {
  const a = document.createElement('a');
  a.setAttribute('download', 'playcheck-sitemap.png');
  a.setAttribute('href', dataUrl);
  a.click();
}

export default function SitemapDiagram() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const mapRef = useRef(null);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      try {
        const { nodes: savedNodes, edges: savedEdges } = JSON.parse(savedState);
        if (savedNodes) setNodes(savedNodes);
        if (savedEdges) setEdges(savedEdges);
      } catch (e) {
        console.error('Failed to parse saved sitemap state', e);
      }
    }
  }, [setNodes, setEdges]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }));
  }, [nodes, edges]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const addNode = () => {
    const id = `node_${Date.now()}`;
    const newNode = {
      id,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { label: 'New Page' },
    };
    setNodes((nds) => nds.concat(newNode));
  };

  const onNodeClick = (_, node) => {
    const newLabel = prompt('Enter new label for this page:', node.data.label);
    if (newLabel !== null) {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === node.id) {
            return { ...n, data: { ...n.data, label: newLabel } };
          }
          return n;
        }),
      );
    }
  };

  const onDownload = () => {
    if (!mapRef.current) return;
    
    const nodesBounds = getNodesBounds(nodes);
    const viewport = getViewportForBounds(nodesBounds, 1024, 768, 0.5, 2);

    const viewportElement = mapRef.current.querySelector('.react-flow__viewport');
    
    toPng(viewportElement, {
      backgroundColor: '#202124',
      width: 1024,
      height: 768,
      pixelRatio: 3,
      style: {
        width: '1024px',
        height: '768px',
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        backgroundColor: '#202124',
        textRendering: 'geometricPrecision',
      },
      cacheBust: true,
    })
    .then(downloadImage)
    .catch((err) => {
      console.error('Export failed', err);
    });
  };

  return (
    <div ref={mapRef} className="w-full h-[600px] bg-[#202124] rounded-xl border border-[#5f6368] overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        fitView
        colorMode="dark"
      >
        <Controls />
        <MiniMap zoomable pannable />
        <Background variant="dots" gap={12} size={1} />
        <Panel position="top-right" className="flex gap-2">
          <button
            onClick={onDownload}
            className="bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#202124] px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download PNG
          </button>
          <button
            onClick={addNode}
            className="bg-[#34A853] hover:bg-[#2d9047] text-[#202124] px-4 py-2 rounded-lg font-bold transition-colors"
          >
            + Add Page
          </button>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to reset the sitemap to default?')) {
                setNodes(initialNodes);
                setEdges(initialEdges);
              }
            }}
            className="bg-[#EA4335] hover:bg-[#c5221f] text-white px-4 py-2 rounded-lg font-bold transition-colors"
          >
            Reset
          </button>
        </Panel>
      </ReactFlow>
      <div className="p-4 bg-[#303134] text-[#9aa0a6] text-sm border-t border-[#5f6368]">
        <p>Tip: Drag nodes to move them. Click a node to rename it. Drag between handles to connect pages.</p>
      </div>
    </div>
  );
}
