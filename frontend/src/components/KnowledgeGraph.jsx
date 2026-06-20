import React, { useMemo, useState } from 'react';
import ReactFlow, { 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  MarkerType 
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Network, HelpCircle, Download, FileText, User, Info, X } from 'lucide-react';
import html2canvas from 'html2canvas';

export default function KnowledgeGraph({ caseData }) {
  const [selectedNode, setSelectedNode] = useState(null);

  // Construct nodes and edges dynamically from case data
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes = [];
    const edges = [];

    // 1. Crime Scene Node (Orange)
    const locationId = 'node_location';
    nodes.push({
      id: locationId,
      position: { x: 250, y: 220 },
      data: { 
        label: `📍 Crime Scene: ${caseData.station.split(',')[0]}`,
        details: {
          type: 'Crime Scene',
          name: caseData.station,
          fields: [
            { label: 'District', value: caseData.district },
            { label: 'State', value: caseData.state },
            { label: 'Incident Date', value: caseData.dateOfIncident || caseData.dateOfRegistration },
            { label: 'Incident Time', value: caseData.timeOfIncident || '02:30 AM' }
          ]
        }
      },
      style: {
        background: '#1f1510',
        color: '#ffedd5',
        border: '2px solid #f97316',
        borderRadius: '10px',
        padding: '10px',
        fontWeight: 'bold',
        fontSize: '11px',
        width: 170,
        boxShadow: '0 0 12px rgba(249,115,22,0.3)'
      }
    });

    // 2. Accused Node (Red)
    const accusedId = 'node_accused';
    if (caseData.accused?.name) {
      nodes.push({
        id: accusedId,
        position: { x: 20, y: 80 },
        data: { 
          label: `👤 Accused: ${caseData.accused.name}\n${caseData.accused.status}`,
          details: {
            type: 'Accused',
            name: caseData.accused.name,
            fields: [
              { label: 'Age', value: caseData.accused.age },
              { label: 'Phone', value: caseData.accused.phone },
              { label: 'Address', value: caseData.accused.address },
              { label: 'Status', value: caseData.accused.status },
              { label: 'Arrest Date', value: caseData.accused.arrestDate || 'N/A' },
              { label: 'Arrest Time', value: caseData.accused.arrestTime || 'N/A' }
            ]
          }
        },
        style: {
          background: '#180e15',
          color: '#f87171',
          border: '2px solid #ef4444',
          borderRadius: '10px',
          padding: '10px',
          fontSize: '11px',
          whiteSpace: 'pre-line',
          width: 180,
          fontWeight: 'bold',
          boxShadow: '0 0 12px rgba(239,68,68,0.35)'
        }
      });

      // Edge from Accused to Location (Involved At)
      edges.push({
        id: 'edge_accused_location',
        source: accusedId,
        target: locationId,
        label: 'committed crime at',
        animated: true,
        style: { stroke: '#ef4444' },
        labelStyle: { fill: '#f87171', fontSize: '9px', fontWeight: 'bold' },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#ef4444' }
      });
    }

    // 3. Victim Node (Blue)
    const victimId = 'node_victim';
    if (caseData.victim?.name) {
      nodes.push({
        id: victimId,
        position: { x: 480, y: 80 },
        data: { 
          label: `👤 Victim: ${caseData.victim.name}\nInjury: ${caseData.victim.injuryStatus.split(',')[0]}`,
          details: {
            type: 'Victim',
            name: caseData.victim.name,
            fields: [
              { label: 'Age', value: caseData.victim.age },
              { label: 'Phone', value: caseData.victim.phone },
              { label: 'Address', value: caseData.victim.address },
              { label: 'Injury Status', value: caseData.victim.injuryStatus }
            ]
          }
        },
        style: {
          background: '#0a1727',
          color: '#60a5fa',
          border: '2px solid #3b82f6',
          borderRadius: '10px',
          padding: '10px',
          fontSize: '11px',
          whiteSpace: 'pre-line',
          width: 180,
          fontWeight: 'bold',
          boxShadow: '0 0 12px rgba(59,130,246,0.35)'
        }
      });

      // Edge from Victim to Location
      edges.push({
        id: 'edge_victim_location',
        source: victimId,
        target: locationId,
        label: 'affected at',
        animated: true,
        style: { stroke: '#3b82f6' },
        labelStyle: { fill: '#60a5fa', fontSize: '9px', fontWeight: 'bold' },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' }
      });

      // Edge from Accused to Victim (committed crime against)
      if (caseData.accused?.name) {
        edges.push({
          id: 'edge_accused_victim',
          source: accusedId,
          target: victimId,
          label: 'committed crime against',
          animated: true,
          style: { stroke: '#ef4444', strokeWidth: 1.5 },
          labelStyle: { fill: '#f87171', fontSize: '9px', fontWeight: 'bold' },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#ef4444' }
        });
      }
    }

    // 4. Witnesses Nodes (Yellow)
    if (caseData.witnesses) {
      caseData.witnesses.forEach((w, idx) => {
        const witnessNodeId = `node_witness_${w.id || idx}`;
        const xOffset = idx * 240 + 20;
        nodes.push({
          id: witnessNodeId,
          position: { x: xOffset, y: 380 },
          data: { 
            label: `🗣️ Witness: ${w.name}\n(${w.relation})`,
            details: {
              type: 'Witness',
              name: w.name,
              fields: [
                { label: 'Role/Relation', value: w.relation },
                { label: 'Phone', value: w.phone },
                { label: 'Testimony/Statement', value: w.statement }
              ]
            }
          },
          style: {
            background: '#1e1a0f',
            color: '#fef08a',
            border: '2px solid #eab308',
            borderRadius: '10px',
            padding: '8px',
            fontSize: '11px',
            whiteSpace: 'pre-line',
            width: 170,
            boxShadow: '0 0 10px rgba(234,179,8,0.25)'
          }
        });

        // Edge from Witness to Location (witnessed Crime Scene)
        edges.push({
          id: `edge_witness_location_${idx}`,
          source: witnessNodeId,
          target: locationId,
          label: 'witnessed',
          animated: true,
          style: { stroke: '#eab308' },
          labelStyle: { fill: '#fef08a', fontSize: '9px' },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#eab308' }
        });
      });
    }

    // 5. Seized Items/Evidence Nodes (Purple)
    if (caseData.seizedItems) {
      caseData.seizedItems.forEach((item, idx) => {
        const evidenceNodeId = `node_evidence_${item.id || idx}`;
        const yPos = 80 + (idx * 100);
        nodes.push({
          id: evidenceNodeId,
          position: { x: -210, y: yPos },
          data: { 
            label: `📦 Evidence: ${item.name}\nValue: ${item.value}`,
            details: {
              type: 'Evidence/SeizedItem',
              name: item.name,
              fields: [
                { label: 'Description', value: item.description },
                { label: 'Quantity', value: item.quantity },
                { label: 'Estimated Value', value: item.value },
                { label: 'Seizure Timestamp', value: item.timestamp },
                { label: 'Hash Trail', value: item.hash },
                { label: 'Status', value: item.verificationStatus || 'Secured' }
              ]
            }
          },
          style: {
            background: '#1c0d24',
            color: '#c084fc',
            border: item.verificationStatus === 'Tampered' ? '2px solid #ef4444' : '2px solid #a855f7',
            borderRadius: '10px',
            padding: '8px',
            fontSize: '10px',
            whiteSpace: 'pre-line',
            width: 160,
            boxShadow: item.verificationStatus === 'Tampered' ? '0 0 12px rgba(239,68,68,0.4)' : '0 0 10px rgba(168,85,247,0.25)'
          }
        });

        // Edge from Evidence to Accused (seized from)
        if (caseData.accused?.name) {
          edges.push({
            id: `edge_evidence_accused_${idx}`,
            source: evidenceNodeId,
            target: accusedId,
            label: 'seized from',
            animated: true,
            style: { stroke: '#a855f7' },
            labelStyle: { fill: '#c084fc', fontSize: '8px' },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#a855f7' }
          });
        }
      });
    }

    // 6. Legal Sections Nodes (Green) - from RAG recommendation
    const sections = caseData.flaggedSections ? caseData.flaggedSections.split(',').map(s => s.trim()).filter(Boolean) : [];
    sections.forEach((sec, idx) => {
      const legalNodeId = `node_legal_${idx}`;
      const yPos = 80 + (idx * 95);
      nodes.push({
        id: legalNodeId,
        position: { x: 720, y: yPos },
        data: { 
          label: `⚖️ Statute: ${sec}`,
          details: {
            type: 'Legal Section',
            name: sec,
            fields: [
              { label: 'Code', value: sec },
              { label: 'Classification', value: sec.includes('BNS') ? 'Substantive Criminal Law' : sec.includes('BNSS') ? 'Procedural Directive' : 'Evidence Admissibility Standard' },
              { label: 'Origin', value: 'Bharatiya Nyaya Sanhita (BNS, 2023)' }
            ]
          }
        },
        style: {
          background: '#061d12',
          color: '#86efac',
          border: '2px solid #22c55e',
          borderRadius: '10px',
          padding: '10px',
          fontSize: '10px',
          width: 150,
          fontWeight: 'bold',
          boxShadow: '0 0 10px rgba(34,197,94,0.25)'
        }
      });

      // Edge from Case Location/Crime Scene to Legal Section (invokes)
      edges.push({
        id: `edge_location_legal_${idx}`,
        source: locationId,
        target: legalNodeId,
        label: 'invokes',
        animated: true,
        style: { stroke: '#22c55e' },
        labelStyle: { fill: '#86efac', fontSize: '9px' },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#22c55e' }
      });
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [caseData]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = (event, node) => {
    if (node.data && node.data.details) {
      setSelectedNode(node.data.details);
    }
  };

  const exportPNG = () => {
    const element = document.querySelector('.react-flow');
    if (!element) return;
    
    // Temporarily hide controls/minimap for clean capture
    const controls = element.querySelector('.react-flow__controls');
    const minimap = element.querySelector('.react-flow__minimap');
    if (controls) controls.style.display = 'none';
    if (minimap) minimap.style.display = 'none';

    html2canvas(element, {
      backgroundColor: '#0a0f1d',
      useCORS: true,
      scale: 2
    }).then(canvas => {
      // Restore controls/minimap
      if (controls) controls.style.display = 'flex';
      if (minimap) minimap.style.display = 'block';

      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `CrimeGPT_KnowledgeGraph_${caseData.firNo}.png`;
      link.href = imgData;
      link.click();
    }).catch(err => {
      console.error('PNG export failed:', err);
      // Restore controls/minimap on failure
      if (controls) controls.style.display = 'flex';
      if (minimap) minimap.style.display = 'block';
    });
  };

  return (
    <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700/60 p-6 rounded-xl shadow-lg flex flex-col md:flex-row gap-6 h-[540px]">
      
      {/* React Flow Interactive Canvas Panel */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-700">
          <div>
            <h3 className="text-base font-bold text-police-khaki flex items-center gap-1.5 uppercase">
              <Network className="w-4 h-4 text-police-khaki" /> Case Entity Relationship Graph
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Interactive Knowledge Graph of suspects, victims, evidence, and statutes.</p>
          </div>
          
          <button
            type="button"
            onClick={exportPNG}
            className="bg-slate-900 hover:bg-slate-950 border border-police-khaki/30 text-police-khaki text-[10px] font-black uppercase px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PNG</span>
          </button>
        </div>
        
        <div className="flex-1 bg-slate-950/80 border border-slate-800 rounded-lg overflow-hidden relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            fitView
            attributionPosition="bottom-right"
          >
            <Background color="#334155" gap={16} size={1} />
            <Controls className="bg-slate-900 border border-slate-800 text-slate-100 rounded shadow-md" />
            <MiniMap 
              nodeColor={(node) => {
                if (node.id === 'node_location') return '#f97316';
                if (node.id === 'node_accused') return '#ef4444';
                if (node.id === 'node_victim') return '#3b82f6';
                if (node.id.startsWith('node_witness')) return '#eab308';
                if (node.id.startsWith('node_evidence')) return '#a855f7';
                return '#22c55e';
              }}
              maskColor="rgba(15, 23, 42, 0.6)"
              className="bg-slate-900/90 border border-slate-800 rounded shadow-md hidden sm:block"
            />
          </ReactFlow>
        </div>
      </div>

      {/* Side Details Panel */}
      <div className="w-full md:w-72 bg-slate-900/60 border border-slate-700/40 rounded-xl p-4 flex flex-col justify-between h-full shrink-0">
        <div>
          <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-3">
            <h4 className="text-xs font-black text-police-khaki uppercase tracking-widest flex items-center gap-1">
              <Info className="w-3.5 h-3.5" /> Entity Inspector
            </h4>
            {selectedNode && (
              <button 
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {selectedNode ? (
            <div className="space-y-4 overflow-y-auto max-h-[360px] pr-1">
              <div>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{selectedNode.type}</span>
                <h3 className="text-sm font-black text-slate-200 mt-0.5">{selectedNode.name}</h3>
              </div>

              <div className="space-y-3">
                {selectedNode.fields.map((f, idx) => (
                  <div key={idx} className="bg-slate-950/40 p-2.5 rounded border border-slate-800">
                    <span className="text-[9px] font-extrabold text-slate-400 uppercase block">{f.label}</span>
                    <span className="text-xs text-slate-200 font-semibold mt-1 block leading-relaxed break-words">{f.value || 'N/A'}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500 font-mono text-xs space-y-2">
              <HelpCircle className="w-8 h-8 text-slate-600 animate-pulse" />
              <span>Select a node on the graph to view demographic data, statements, and hash integrity trails.</span>
            </div>
          )}
        </div>

        <div className="bg-slate-950/60 p-2 rounded border border-slate-800 text-[9px] text-slate-500 text-center font-mono">
          Interactive SVG layout rendering client-side via ReactFlow v11.
        </div>
      </div>

    </div>
  );
}
