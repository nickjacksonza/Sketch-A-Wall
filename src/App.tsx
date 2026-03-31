import React, { useState, useRef, useEffect } from 'react';
import { Move, Trash2, Grid3x3, ZoomIn, ZoomOut, Download, Upload, Plus, Ruler } from 'lucide-react';

export default function WallEditor() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [walls, setWalls] = useState([]);
  const [selectedWalls, setSelectedWalls] = useState([]);
  const [offset, setOffset] = useState({ x: 50, y: 50 });
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [imageOpacity, setImageOpacity] = useState(0.3);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showAddWall, setShowAddWall] = useState(false);
  const [newWallLength, setNewWallLength] = useState(5);
  const [newWallAngle, setNewWallAngle] = useState(0);
  const [newWallStartX, setNewWallStartX] = useState(5);
  const [newWallStartY, setNewWallStartY] = useState(5);
  const [waitingForClick, setWaitingForClick] = useState(false);
  const pixelsPerMeter = 40; // 40 pixels = 1 meter
  const snapThreshold = 5; // pixels for snapping

  useEffect(() => {
    draw();
  }, [walls, offset, zoom, showGrid, selectedWalls, backgroundImage, imageOpacity, isDragging, dragOffset, waitingForClick]);

  const getWallEndpoints = (wall) => {
    const angleRad = (wall.angle * Math.PI) / 180;
    const x2 = wall.x + wall.length * pixelsPerMeter * Math.cos(angleRad);
    const y2 = wall.y + wall.length * pixelsPerMeter * Math.sin(angleRad);
    return { x1: wall.x, y1: wall.y, x2, y2 };
  };

  const areWallsConnected = (wallIdx1, wallIdx2) => {
    const w1 = getWallEndpoints(walls[wallIdx1]);
    const w2 = getWallEndpoints(walls[wallIdx2]);
    
    const connections = [
      { p1: {x: w1.x1, y: w1.y1}, p2: {x: w2.x1, y: w2.y1} },
      { p1: {x: w1.x1, y: w1.y1}, p2: {x: w2.x2, y: w2.y2} },
      { p1: {x: w1.x2, y: w1.y2}, p2: {x: w2.x1, y: w2.y1} },
      { p1: {x: w1.x2, y: w1.y2}, p2: {x: w2.x2, y: w2.y2} },
    ];
    
    return connections.some(conn => {
      const dx = conn.p1.x - conn.p2.x;
      const dy = conn.p1.y - conn.p2.y;
      return Math.sqrt(dx * dx + dy * dy) < snapThreshold;
    });
  };

  const findConnectedWalls = (startIdx) => {
    const connected = new Set([startIdx]);
    const toCheck = [startIdx];
    
    while (toCheck.length > 0) {
      const current = toCheck.pop();
      walls.forEach((_, idx) => {
        if (!connected.has(idx) && areWallsConnected(current, idx)) {
          connected.add(idx);
          toCheck.push(idx);
        }
      });
    }
    
    return Array.from(connected);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(zoom, zoom);

    // Draw background image
    if (backgroundImage) {
      ctx.globalAlpha = imageOpacity;
      ctx.drawImage(backgroundImage, 0, 0);
      ctx.globalAlpha = 1;
    }

    // Draw grid (1m x 1m)
    if (showGrid) {
      ctx.strokeStyle = '#e0e0e0';
      ctx.lineWidth = 1 / zoom;
      ctx.font = `${10/zoom}px sans-serif`;
      ctx.fillStyle = '#999';
      
      for (let x = 0; x <= canvas.width / zoom; x += pixelsPerMeter) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height / zoom);
        ctx.stroke();
        if (x % (pixelsPerMeter * 5) === 0) {
          ctx.fillText(`${x/pixelsPerMeter}m`, x + 2/zoom, 12/zoom);
        }
      }
      for (let y = 0; y <= canvas.height / zoom; y += pixelsPerMeter) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width / zoom, y);
        ctx.stroke();
        if (y % (pixelsPerMeter * 5) === 0) {
          ctx.fillText(`${y/pixelsPerMeter}m`, 2/zoom, y - 2/zoom);
        }
      }
      
      // Highlight grid intersections if waiting for click
      if (waitingForClick) {
        ctx.fillStyle = '#10b981';
        for (let x = 0; x <= canvas.width / zoom; x += pixelsPerMeter) {
          for (let y = 0; y <= canvas.height / zoom; y += pixelsPerMeter) {
            ctx.beginPath();
            ctx.arc(x, y, 3/zoom, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    // Draw walls
    walls.forEach((wall, idx) => {
      const isSelected = selectedWalls.includes(idx);
      let x1 = wall.x;
      let y1 = wall.y;
      
      // Apply drag offset if this wall is being dragged
      if (isSelected && isDragging) {
        x1 += dragOffset.x;
        y1 += dragOffset.y;
      }
      
      const angleRad = (wall.angle * Math.PI) / 180;
      const x2 = x1 + wall.length * pixelsPerMeter * Math.cos(angleRad);
      const y2 = y1 + wall.length * pixelsPerMeter * Math.sin(angleRad);

      // Draw wall line
      ctx.strokeStyle = isSelected ? '#3b82f6' : '#1f2937';
      ctx.lineWidth = 6 / zoom;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Draw endpoints
      ctx.fillStyle = isSelected ? '#3b82f6' : '#1f2937';
      ctx.beginPath();
      ctx.arc(x1, y1, 6/zoom, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x2, y2, 6/zoom, 0, Math.PI * 2);
      ctx.fill();

      // Draw measurement label
      ctx.fillStyle = isSelected ? '#3b82f6' : '#1f2937';
      ctx.font = `bold ${12/zoom}px sans-serif`;
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      ctx.fillText(`${wall.length}m`, midX + 5/zoom, midY - 5/zoom);

      // Draw snap points (grid intersections near endpoints)
      if (isSelected) {
        ctx.fillStyle = '#10b981';
        
        // Snap points near start
        const snapX1 = Math.round(x1 / pixelsPerMeter) * pixelsPerMeter;
        const snapY1 = Math.round(y1 / pixelsPerMeter) * pixelsPerMeter;
        ctx.beginPath();
        ctx.arc(snapX1, snapY1, 4/zoom, 0, Math.PI * 2);
        ctx.fill();
        
        // Snap points near end
        const snapX2 = Math.round(x2 / pixelsPerMeter) * pixelsPerMeter;
        const snapY2 = Math.round(y2 / pixelsPerMeter) * pixelsPerMeter;
        ctx.beginPath();
        ctx.arc(snapX2, snapY2, 4/zoom, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.restore();
  };

  const getCanvasPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left - offset.x) / zoom,
      y: (e.clientY - rect.top - offset.y) / zoom
    };
  };

  const snapToGrid = (x, y) => {
    return {
      x: Math.round(x / pixelsPerMeter) * pixelsPerMeter,
      y: Math.round(y / pixelsPerMeter) * pixelsPerMeter
    };
  };

  const handleMouseDown = (e) => {
    if (e.button === 1 || e.shiftKey) {
      // Middle click or shift+click for panning
      setIsPanning(true);
      setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
      return;
    }

    const pos = getCanvasPos(e);
    
    // Check if clicking on a wall
    let clicked = -1;
    for (let i = 0; i < walls.length; i++) {
      const wall = walls[i];
      const angleRad = (wall.angle * Math.PI) / 180;
      const x2 = wall.x + wall.length * pixelsPerMeter * Math.cos(angleRad);
      const y2 = wall.y + wall.length * pixelsPerMeter * Math.sin(angleRad);
      
      const dist = pointToLineDistance(pos.x, pos.y, wall.x, wall.y, x2, y2);
      if (dist < 10 / zoom) {
        clicked = i;
        break;
      }
    }
    
    if (clicked >= 0) {
      setSelectedWalls([clicked]);
      setIsDragging(true);
      setDragOffset({ x: 0, y: 0 });
    } else {
      setSelectedWalls([]);
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning && panStart) {
      setOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
      return;
    }

    if (isDragging && selectedWalls.length > 0) {
      const pos = getCanvasPos(e);
      const firstWall = walls[selectedWalls[0]];
      const dx = pos.x - firstWall.x;
      const dy = pos.y - firstWall.y;
      setDragOffset({ x: dx, y: dy });
    }
  };

  const handleMouseUp = () => {
    if (isDragging && selectedWalls.length > 0) {
      // Apply the drag and snap to grid for all selected walls
      const firstWall = walls[selectedWalls[0]];
      const newPos = snapToGrid(firstWall.x + dragOffset.x, firstWall.y + dragOffset.y);
      const snapDx = newPos.x - firstWall.x;
      const snapDy = newPos.y - firstWall.y;
      
      setWalls(walls.map((w, idx) => 
        selectedWalls.includes(idx) ? { ...w, x: w.x + snapDx, y: w.y + snapDy } : w
      ));
      setDragOffset({ x: 0, y: 0 });
    }
    
    setIsDragging(false);
    setIsPanning(false);
    setPanStart(null);
  };

  const pointToLineDistance = (px, py, x1, y1, x2, y2) => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    const param = lenSq !== 0 ? dot / lenSq : -1;

    let xx, yy;
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const addWall = () => {
    const newWall = {
      x: newWallStartX * pixelsPerMeter, // Convert meters to pixels
      y: newWallStartY * pixelsPerMeter,
      length: parseFloat(newWallLength),
      angle: parseFloat(newWallAngle)
    };
    setWalls([...walls, newWall]);
    setSelectedWalls([walls.length]);
    setShowAddWall(false);
    // Reset to defaults for next wall
    setNewWallLength(5);
    setNewWallAngle(0);
    setNewWallStartX(5);
    setNewWallStartY(5);
  };

  const deleteSelected = () => {
    if (selectedWalls.length > 0) {
      setWalls(walls.filter((_, idx) => !selectedWalls.includes(idx)));
      setSelectedWalls([]);
    }
  };

  const updateSelectedWall = (field, value) => {
    if (selectedWalls.length === 1) {
      setWalls(walls.map((w, idx) => 
        idx === selectedWalls[0] ? { ...w, [field]: parseFloat(value) } : w
      ));
    }
  };

  const exportLayout = () => {
    try {
      const exportData = {
        walls: walls.map((wall, idx) => ({
          id: idx + 1,
          position: { x: wall.x, y: wall.y },
          length_meters: wall.length,
          angle_degrees: wall.angle,
          length_pixels: wall.length * pixelsPerMeter
        })),
        settings: {
          pixelsPerMeter: pixelsPerMeter,
          totalWalls: walls.length
        },
        metadata: {
          exportDate: new Date().toISOString(),
          appVersion: "1.0"
        }
      };
      
      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `property-layout-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert('Layout exported successfully!');
    } catch (error) {
      alert('Export failed: ' + error.message);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setBackgroundImage(img);
          const canvas = canvasRef.current;
          if (canvas) {
            canvas.width = Math.max(img.width, 1600);
            canvas.height = Math.max(img.height, 1200);
          }
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const selectedWallData = selectedWalls.length === 1 ? walls[selectedWalls[0]] : null;

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 p-3 flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setShowAddWall(!showAddWall)}
          className="px-3 py-2 rounded bg-green-500 text-white flex items-center gap-2"
        >
          <Plus size={18} /> Add Wall
        </button>

        <button
          onClick={deleteSelected}
          disabled={selectedWalls.length === 0}
          className="px-3 py-2 rounded bg-red-500 text-white disabled:opacity-50 flex items-center gap-2"
        >
          <Trash2 size={18} /> Delete {selectedWalls.length > 1 ? `(${selectedWalls.length})` : ''}
        </button>

        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`px-3 py-2 rounded flex items-center gap-2 ${
            showGrid ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
          }`}
        >
          <Grid3x3 size={18} /> Grid (1m)
        </button>

        <div className="h-8 w-px bg-gray-300"></div>

        <button
          onClick={() => setZoom(Math.min(zoom * 1.2, 3))}
          className="px-3 py-2 rounded bg-gray-200 text-gray-700"
        >
          <ZoomIn size={18} />
        </button>
        <button
          onClick={() => setZoom(Math.max(zoom / 1.2, 0.3))}
          className="px-3 py-2 rounded bg-gray-200 text-gray-700"
        >
          <ZoomOut size={18} />
        </button>
        <span className="text-sm text-gray-600">{Math.round(zoom * 100)}%</span>

        <div className="h-8 w-px bg-gray-300"></div>

        <label className="px-3 py-2 rounded bg-purple-500 text-white cursor-pointer flex items-center gap-2">
          <Upload size={18} /> Upload Scan
          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
        </label>

        {backgroundImage && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Opacity:</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={imageOpacity}
              onChange={(e) => setImageOpacity(parseFloat(e.target.value))}
              className="w-24"
            />
          </div>
        )}

        <button
          onClick={exportLayout}
          className="px-3 py-2 rounded bg-blue-500 text-white flex items-center gap-2 ml-auto"
        >
          <Download size={18} /> Export
        </button>
      </div>

      {/* Add Wall Dialog */}
      {showAddWall && (
        <div className="bg-blue-50 border-b border-blue-200 p-4">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <Ruler size={18} /> Create New Wall
          </h3>
          <div className="flex gap-4 items-end flex-wrap">
            <div>
              <label className="block text-sm font-medium mb-1">Length (meters)</label>
              <input
                type="number"
                value={newWallLength}
                onChange={(e) => setNewWallLength(parseFloat(e.target.value) || 0)}
                className="px-3 py-2 border rounded w-32"
                step="0.5"
                min="0.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Angle (degrees)</label>
              <input
                type="number"
                value={newWallAngle}
                onChange={(e) => setNewWallAngle(parseFloat(e.target.value) || 0)}
                className="px-3 py-2 border rounded w-32"
                step="15"
              />
              <div className="text-xs text-gray-500 mt-1">0°=→ 90°=↓ 180°=← 270°=↑</div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start X (meters)</label>
              <input
                type="number"
                value={newWallStartX}
                onChange={(e) => setNewWallStartX(parseFloat(e.target.value) || 0)}
                className="px-3 py-2 border rounded w-32"
                step="1"
                min="0"
                disabled={waitingForClick}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Y (meters)</label>
              <input
                type="number"
                value={newWallStartY}
                onChange={(e) => setNewWallStartY(parseFloat(e.target.value) || 0)}
                className="px-3 py-2 border rounded w-32"
                step="1"
                min="0"
                disabled={waitingForClick}
              />
            </div>
            <button
              onClick={() => setWaitingForClick(!waitingForClick)}
              className={`px-4 py-2 rounded ${waitingForClick ? 'bg-orange-500' : 'bg-purple-500'} text-white`}
            >
              {waitingForClick ? 'Click on Grid...' : 'Pick on Grid'}
            </button>
            <button
              onClick={addWall}
              className="px-4 py-2 bg-green-500 text-white rounded"
              disabled={waitingForClick}
            >
              Create Wall
            </button>
            <button
              onClick={() => {
                setShowAddWall(false);
                setWaitingForClick(false);
              }}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded"
            >
              Cancel
            </button>
          </div>
          {waitingForClick && (
            <div className="mt-3 text-sm text-orange-600 font-medium">
              👆 Click any grid intersection on the canvas to set the start point
            </div>
          )}
        </div>
      )}

      {/* Edit Selected Wall Panel */}
      {selectedWallData && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-4">
          <h3 className="font-bold mb-3">Edit Wall {selectedWalls[0] + 1}</h3>
          <div className="flex gap-4 items-center">
            <div>
              <label className="block text-sm font-medium mb-1">Length (meters)</label>
              <input
                type="number"
                value={selectedWallData.length}
                onChange={(e) => updateSelectedWall('length', e.target.value)}
                className="px-3 py-2 border rounded w-32"
                step="0.5"
                min="0.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Angle (degrees)</label>
              <input
                type="number"
                value={selectedWallData.angle}
                onChange={(e) => updateSelectedWall('angle', e.target.value)}
                className="px-3 py-2 border rounded w-32"
                step="15"
              />
            </div>
            <div className="text-sm text-gray-600">
              Drag the wall to position it. It will snap to grid corners when you release.
            </div>
          </div>
        </div>
      )}

      {/* Connected Walls Info */}
      {selectedWalls.length > 1 && (
        <div className="bg-blue-50 border-b border-blue-200 p-4">
          <h3 className="font-bold mb-2">Connected Group Selected</h3>
          <p className="text-sm text-gray-600">
            {selectedWalls.length} connected walls selected. Drag any wall to move the entire group together.
          </p>
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={1600}
          height={1200}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={waitingForClick ? 'cursor-crosshair' : (isPanning ? 'cursor-grabbing' : 'cursor-pointer')}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      {/* Instructions */}
      <div className="bg-white border-t border-gray-200 p-3 text-sm text-gray-600">
        <strong>Add Wall:</strong> Set length & angle, then drag to position | 
        <strong> Select:</strong> Click any wall to select and edit | 
        <strong> Move:</strong> Drag selected wall, snaps to grid on release | 
        <strong> Pan:</strong> Shift+drag or middle-click to pan view
      </div>
    </div>
  );
}