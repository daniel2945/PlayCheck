import React, { useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  Handle,
  Position,
  getNodesBounds,
  getViewportForBounds,
} from '@xyflow/react';
import { toPng } from 'html-to-image';
import '@xyflow/react/dist/style.css';

const SchemaNode = ({ data }) => {
  return (
    <div className="bg-[#303134] border-2 border-[#5f6368] rounded-lg overflow-hidden min-w-[200px] shadow-xl">
      <div className="bg-[#202124] p-2 border-b border-[#5f6368] flex items-center justify-between">
        <span className="font-bold text-[#8ab4f8]">{data.label}</span>
        <span className="text-[10px] bg-[#3c4043] text-[#9aa0a6] px-1.5 py-0.5 rounded">Collection</span>
      </div>
      <div className="p-2 flex flex-col gap-1">
        {data.fields.map((field, idx) => (
          <div key={idx} className="flex justify-between text-xs items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${field.isRef ? 'bg-[#f28b82]' : 'bg-[#81c995]'}`}></span>
              <span className="text-[#e8eaed] font-medium">{field.name}</span>
            </div>
            <span className="text-[#9aa0a6] italic">{field.type}</span>
          </div>
        ))}
      </div>
      <Handle type="target" position={Position.Top} className="!bg-[#5f6368]" />
      <Handle type="source" position={Position.Bottom} className="!bg-[#5f6368]" />
    </div>
  );
};

const nodeTypes = {
  schema: SchemaNode,
};

const initialNodes = [
  {
    id: 'user',
    type: 'schema',
    position: { x: 50, y: 50 },
    data: {
      label: 'User',
      fields: [
        { name: '_id', type: 'ObjectId' },
        { name: 'userName', type: 'String (Unique)' },
        { name: 'email', type: 'String (Unique)' },
        { name: 'password', type: 'String (Hashed)' },
        { name: 'role', type: 'Enum' },
        { name: 'myPc.cpuId', type: 'Ref<Hardware>', isRef: true },
        { name: 'myPc.gpuId', type: 'Ref<Hardware>', isRef: true },
        { name: 'searchHistory.gameId', type: 'Ref<Game>', isRef: true },
        { name: 'timestamps', type: 'Date' },
      ],
    },
  },
  {
    id: 'game',
    type: 'schema',
    position: { x: 450, y: 50 },
    data: {
      label: 'Game',
      fields: [
        { name: '_id', type: 'Number' },
        { name: 'title', type: 'String' },
        { name: 'image', type: 'String (URL)' },
        { name: 'description', type: 'String' },
        { name: 'releasedDate', type: 'String' },
        { name: 'requirements.min', type: 'Object' },
        { name: 'requirements.rec', type: 'Object' },
      ],
    },
  },
  {
    id: 'review',
    type: 'schema',
    position: { x: 250, y: 400 },
    data: {
      label: 'Review',
      fields: [
        { name: '_id', type: 'ObjectId' },
        { name: 'gameId', type: 'Ref<Game>', isRef: true },
        { name: 'userId', type: 'Ref<User>', isRef: true },
        { name: 'rating', type: 'Number (1-5)' },
        { name: 'text', type: 'String' },
        { name: 'hardwareSnapshot', type: 'Object' },
        { name: 'timestamps', type: 'Date' },
      ],
    },
  },
  {
    id: 'hardware',
    type: 'schema',
    position: { x: 50, y: 450 },
    data: {
      label: 'Hardware',
      fields: [
        { name: '_id', type: 'ObjectId' },
        { name: 'type', type: 'Enum (CPU|GPU)' },
        { name: 'brand', type: 'String' },
        { name: 'model', type: 'String (Unique)' },
        { name: 'benchmarkScore', type: 'Number' },
        { name: 'timestamps', type: 'Date' },
      ],
    },
  },
];

const initialEdges = [
  { id: 'e-review-user', source: 'review', target: 'user', label: 'belongs to', animated: true },
  { id: 'e-review-game', source: 'review', target: 'game', label: 'reviews', animated: true },
  { id: 'e-user-hardware-cpu', source: 'user', target: 'hardware', label: 'uses CPU', style: { stroke: '#f28b82' } },
  { id: 'e-user-game', source: 'user', target: 'game', label: 'searched', style: { stroke: '#8ab4f8' } },
];

function downloadImage(dataUrl) {
  const a = document.createElement('a');
  a.setAttribute('download', 'playcheck-schema.png');
  a.setAttribute('href', dataUrl);
  a.click();
}

export default function SchemaDiagram() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const schemaRef = useRef(null);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onDownload = () => {
    if (!schemaRef.current) return;

    const nodesBounds = getNodesBounds(nodes);
    const viewport = getViewportForBounds(nodesBounds, 1200, 800, 0.5, 2);

    const viewportElement = schemaRef.current.querySelector('.react-flow__viewport');

    toPng(viewportElement, {
      backgroundColor: '#202124',
      width: 1200,
      height: 800,
      pixelRatio: 3,
      style: {
        width: '1200px',
        height: '800px',
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        backgroundColor: '#202124',
        textRendering: 'geometricPrecision',
      },
      cacheBust: true,
    })
    .then(downloadImage)
    .catch((err) => {
      console.error('Schema export failed', err);
    });
  };

  return (
    <div ref={schemaRef} className="w-full h-[700px] bg-[#202124] rounded-xl border border-[#5f6368] overflow-hidden schema-flow">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        colorMode="dark"
      >
        <Controls />
        <MiniMap zoomable pannable nodeColor="#303134" />
        <Background variant="lines" gap={20} size={1} color="#3c4043" />
        <Panel position="top-right">
          <button
            onClick={onDownload}
            className="bg-[#8ab4f8] hover:bg-[#aecbfa] text-[#202124] px-4 py-2 rounded-lg font-bold transition-colors flex items-center gap-2 shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Schema PNG
          </button>
        </Panel>
      </ReactFlow>
      <div className="p-4 bg-[#303134] text-[#9aa0a6] text-sm border-t border-[#5f6368] flex justify-between items-center">
        <p>Interactive Database Entity-Relationship Diagram (ERD)</p>
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#81c995]"></span> Field
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#f28b82]"></span> Reference
          </span>
        </div>
      </div>
    </div>
  );
}
