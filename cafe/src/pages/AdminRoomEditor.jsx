import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Stage, Layer, Rect, Circle, Text, Transformer, Group, Arc, Line, Path } from 'react-konva';

// Icons
import { BiTrash, BiDoorOpen, BiPlug, BiStats, BiReset, BiCloudUpload, BiLoaderAlt } from 'react-icons/bi';
import { MdWeekend, MdTableBar, MdTableRestaurant, MdOutlineTableRestaurant } from 'react-icons/md';
import { PiToilet } from "react-icons/pi";
import { FiSettings, FiArrowLeft, FiCopy, FiCoffee, FiDroplet, FiType, FiSquare, FiHelpCircle, FiX } from 'react-icons/fi';
import { GiBrickWall, GiStairs } from 'react-icons/gi';
import { CiBookmark } from "react-icons/ci";
import { useNavigate } from 'react-router-dom';

// Components
import { StatusButton } from '../assets/EditorRoomSpecial/StatusButton';
import { SeatsSlider } from '../assets/EditorRoomSpecial/SeatsSlider';
import { ToolCard } from '../assets/EditorRoomSpecial/ToolCard';
import { ToiletRenderer } from '../assets/RENDERS/ToiletRenderer';
import { ChairsRenderer } from '../assets/RENDERS/ChairsRenderer';
import { SocketIcon } from '../assets/RENDERS/SocketIcon';

// CONSTS
const GRID_SIZE = 20;
const LOCAL_STORAGE_KEY = 'coworking_map_data_v2';

const COLORS = {
    GRID: '#E5E7EB',
    WALL: '#374151',
    STATUS_FREE: '#10B981',
    STATUS_BOOKED: '#EF4444',
    STATUS_BROKEN: '#9CA3AF',
    FURNITURE_DEFAULT: '#E0E7FF',
    FURNITURE_STROKE: '#4338CA',
    SOCKET: '#F59E0B',
    SELECTED: '#F59E0B',
    TEXT: '#1F2937',
    TOILET_BG: '#F3F4F6',
    GENDER_MEN: '#60A5FA',
    GENDER_WOMEN: '#F472B6',
    GENDER_UNISEX: '#34D399',
    GENDER_ACCESSIBLE: '#FBBF24'
};

const TOILET_TYPES = [
    { value: 'unisex', label: 'Унісекс', color: COLORS.GENDER_UNISEX },
    { value: 'men', label: 'Чоловічий', color: COLORS.GENDER_MEN },
    { value: 'women', label: 'Жіночий', color: COLORS.GENDER_WOMEN },
    { value: 'accessible', label: 'Інклюзивний', color: COLORS.GENDER_ACCESSIBLE },
];

const SHAPE_CONFIGS = {
    wall: { width: 200, height: 20, fill: COLORS.WALL },
    door: { width: 80, height: 80 },
    desk: { width: 120, height: 60, label: 'Стіл', seats: 1, hasSocket: true },
    meeting_table: { width: 200, height: 100, label: 'Нарада', seats: 8, hasSocket: true },
    round_table: { radius: 45, label: 'Круглий стіл', seats: 4 },
    sofa: { width: 120, height: 120, seats: 3, label: '' },
    socket: { radius: 15, fill: COLORS.SOCKET },
    toilet_zone: { width: 140, height: 100, label: "WC", cabins: 2, gender: 'unisex' },
    stairs: { width: 100, height: 120, label: '', fill: '#E5E7EB' },
    coffee: { width: 40, height: 40, label: '', fill: '#78350F' },
    water: { radius: 20, label: '', fill: '#3B82F6' },
    whiteboard: { width: 120, height: 10, label: '', fill: '#FFFFFF' },
    text_label: { width: 160, height: 40, label: 'Назва зони', fontSize: 24, fill: 'transparent' }
};

const DEFAULT_STATE = [
    { id: 'desk1', type: 'desk', x: 150, y: 150, width: 120, height: 60, status: 'free', label: 'M-01', seats: 1, hasSocket: true },
];

const BOOKABLE = ['desk', 'meeting_table', 'round_table', 'sofa'];
const STATES_TYPES = [
    { value: 'free', label: 'Вільно', color: COLORS.STATUS_FREE },
    { value: 'booked', label: 'Заброньовано', color: COLORS.STATUS_BOOKED },
    { value: 'broken', label: 'Зламано', color: COLORS.STATUS_BROKEN }
];

function snapToGrid(val) {
    return Math.round(val / GRID_SIZE) * GRID_SIZE;
}

function getFillColor(props) {
    if (!props.status) return props.fill || COLORS.FURNITURE_DEFAULT;
    switch (props.status) {
        case 'free': return COLORS.STATUS_FREE;
        case 'booked': return COLORS.STATUS_BOOKED;
        case 'broken': return COLORS.STATUS_BROKEN;
        default: return COLORS.FURNITURE_DEFAULT;
    }
}

const ShapeComponent = React.memo(({ shapeProps, isSelected, onSelect, onChange }) => {
    const shapeRef = useRef();

    const handleClick = useCallback((e) => {
        e.cancelBubble = true;
        onSelect(shapeProps.id, e);
    }, [shapeProps, onSelect]);

    const styles = useMemo(() => ({
        fill: getFillColor(shapeProps),
        stroke: isSelected ? COLORS.SELECTED : COLORS.FURNITURE_STROKE,
        textColor: (shapeProps.status && shapeProps.status !== 'broken') ? 'white' : COLORS.TEXT,
        isRound: ['round_table', 'socket', 'water'].includes(shapeProps.type)
    }), [shapeProps, isSelected]);

    const { fill, stroke, textColor, isRound } = styles;
    const { width: w, height: h, radius: r } = shapeProps;

    const renderVisuals = () => {
        switch (shapeProps.type) {
            case 'wall': return <Rect width={w} height={h} fill={COLORS.WALL} />;
            case 'door': return <Group><Arc innerRadius={w} angle={90} stroke={stroke} dash={[4, 4]} listening={false} /><Rect width={5} height={w} fill="white" stroke={stroke} /><Rect width={w} height={h} fill="transparent" /></Group>;
            case 'toilet_zone': return <ToiletRenderer color={COLORS} GRID_SIZE={GRID_SIZE} TOILET_TYPES={TOILET_TYPES} width={w} height={h} cabins={shapeProps.cabins || 2} gender={shapeProps.gender || 'unisex'} stroke={stroke} />;
            case 'sofa':
                const d = Math.min(w, h) * 0.35;
                return <Group><Line points={[0, 0, w, 0, w, d, d, d, d, h, 0, h]} closed fill={fill} stroke={stroke} lineJoin="round" /><Line points={[5, 5, w - 5, 5]} stroke="white" strokeWidth={2} opacity={0.5} listening={false} /></Group>;
            case 'socket': return <Group><Circle radius={r} fill={COLORS.SOCKET} stroke="black" strokeWidth={1} /><Path data="M-3 -4 L3 -4 L-1 2 L4 2 L-2 7 L-1 2 L-4 2 Z" fill="white" x={1} /></Group>;
            
            case 'stairs':
                const stepCount = Math.max(3, Math.floor(h / 15));
                const steps = [];
                for (let i = 1; i < stepCount; i++) {
                    steps.push(<Line key={i} points={[0, (h/stepCount) * i, w, (h/stepCount) * i]} stroke="#9CA3AF" strokeWidth={1} listening={false}/>);
                }
                return (
                    <Group>
                        <Rect width={w} height={h} fill={fill} stroke={stroke} />
                        {steps}
                    </Group>
                );
            case 'coffee':
                return (
                    <Group>
                        <Rect width={w} height={h} fill={fill} cornerRadius={4} stroke={stroke} />
                        <Circle x={w/2} y={h/2} radius={w/3.5} fill="#451A03" listening={false} />
                    </Group>
                );
            case 'water':
                return (
                    <Group>
                        <Circle radius={r} fill={fill} stroke={stroke} />
                        <Circle radius={r/2} fill="#93C5FD" listening={false} />
                    </Group>
                );
            case 'whiteboard':
                return <Rect width={w} height={h} fill={fill} stroke={stroke} strokeWidth={2} shadowBlur={4} shadowColor="rgba(0,0,0,0.2)" />;
            case 'text_label':
                return (
                    <Group>
                        <Rect width={w} height={h} fill="transparent" stroke={isSelected ? COLORS.SELECTED : "transparent"} strokeDash={[4, 4]} />
                        <Text text={shapeProps.label} width={w} height={h} fontSize={shapeProps.fontSize || 24} fontStyle="bold" fill={COLORS.TEXT} align="center" verticalAlign="middle" listening={false} />
                    </Group>
                );
            
            case 'desk':
            case 'meeting_table':
                return (
                    <Group>
                        <ChairsRenderer color={COLORS} seats={shapeProps.seats} type={shapeProps.type} width={w} height={h} stroke={stroke} />
                        <Rect width={w} height={h} fill={fill} stroke={stroke} cornerRadius={4} />
                        <SocketIcon colors={COLORS} hasSocket={shapeProps.hasSocket} type={shapeProps.type} width={w} />
                    </Group>
                );
            case 'round_table':
                return (
                    <Group>
                        <ChairsRenderer color={COLORS} seats={shapeProps.seats} type={shapeProps.type} radius={r} stroke={stroke} />
                        <Circle radius={r} fill={fill} stroke={stroke} />
                        <SocketIcon colors={COLORS} hasSocket={shapeProps.hasSocket} type={shapeProps.type} />
                    </Group>
                );
            default: return <Rect width={w} height={h} fill={fill} stroke={stroke} />;
        }
    };

    return (
        <Group
            id={shapeProps.id}
            name="shape"
            groupId={shapeProps.groupId}
            ref={shapeRef}
            onClick={handleClick}
            onTap={handleClick}
            draggable
            x={shapeProps.x}
            y={shapeProps.y}
            rotation={shapeProps.rotation || 0}
            dragBoundFunc={(pos) => ({ x: snapToGrid(pos.x), y: snapToGrid(pos.y) })}
            onMouseEnter={(e) => e.target.getStage().container().style.cursor = 'move'}
            onMouseLeave={(e) => e.target.getStage().container().style.cursor = 'default'}
            
            onDragStart={(e) => {
                if (shapeProps.groupId) {
                    const stage = e.target.getStage();
                    const shapesInGroup = stage.find('.shape').filter(n => n.attrs.groupId === shapeProps.groupId);
                    shapesInGroup.forEach(n => {
                        n.setAttr('origX', n.x());
                        n.setAttr('origY', n.y());
                    });
                }
            }}
            onDragMove={(e) => {
                if (shapeProps.groupId) {
                    const dx = e.target.x() - shapeProps.x;
                    const dy = e.target.y() - shapeProps.y;
                    const stage = e.target.getStage();
                    const siblings = stage.find('.shape').filter(n => n.attrs.groupId === shapeProps.groupId && n.id() !== shapeProps.id);
                    siblings.forEach(node => {
                        node.x(node.attrs.origX + dx);
                        node.y(node.attrs.origY + dy);
                    });
                }
            }}
            onDragEnd={(e) => {
                e.cancelBubble = true;
                if (shapeProps.groupId) {
                    const dx = snapToGrid(e.target.x()) - shapeProps.x;
                    const dy = snapToGrid(e.target.y()) - shapeProps.y;
                    onChange(shapeProps.id, null, true, dx, dy);
                } else {
                    onChange(shapeProps.id, { x: snapToGrid(e.target.x()), y: snapToGrid(e.target.y()) });
                }
            }}
        >
            {renderVisuals()}
            {shapeProps.label && shapeProps.type !== 'wall' && shapeProps.type !== 'text_label' && (
                <Text
                    text={shapeProps.label}
                    x={isRound ? -r : 0}
                    y={isRound ? -r : 0}
                    width={isRound ? r * 2 : w}
                    height={isRound ? r * 2 : h}
                    fontSize={11}
                    fontStyle="bold"
                    fill={textColor}
                    align="center"
                    verticalAlign="middle"
                    listening={false}
                />
            )}
        </Group>
    );
});

const AdminEditor = () => {
    const navigate = useNavigate();
    const [shapes, setShapes] = useState(() => {
        try {
            const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
            return saved ? JSON.parse(saved) : DEFAULT_STATE;
        } catch (e) {
            return DEFAULT_STATE;
        }
    });

    const [selectedIds, setSelectedIds] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    
    // Стан для попапів
    const [isStatsOpen, setIsStatsOpen] = useState(false);
    const [isHelpOpen, setIsHelpOpen] = useState(false);

    const [stageState, setStageState] = useState({
        scale: 1, pos: { x: 0, y: 0 }, size: { w: window.innerWidth, h: window.innerHeight }
    });

    const stageRef = useRef(null);
    const trRef = useRef(null);

    useEffect(() => {
        if (trRef.current && stageRef.current) {
            const stage = stageRef.current;
            const nodes = selectedIds.map(id => stage.findOne(`#${id}`)).filter(Boolean);
            trRef.current.nodes(nodes);
            trRef.current.getLayer().batchDraw();
        }
    }, [selectedIds, shapes]);

    const clearCanvas = useCallback(() => {
        const confirm = window.confirm("Ви впевнені, що хочете видалити ВСІ об'єкти?");
        if (confirm) {
            setShapes([]);
            setSelectedIds([]);
            localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
    }, []);

    const saveToDatabase = async () => {
        setIsSaving(true);
        try {
            const response = await fetch('http://localhost:3005/api/maps', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: "main_hall", objects: shapes })
            });

            if (!response.ok) throw new Error('Помилка збереження');
            alert("Карту успішно збережено на сервері!");
        } catch (error) {
            console.error(error);
            alert("Не вдалося зберегти карту.");
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        const loadMap = async () => {
            try {
                const response = await fetch('http://localhost:3005/api/maps/main_hall');
                if (response.ok) {
                    const data = await response.json();
                    if (Array.isArray(data)) setShapes(data);
                }
            } catch (error) { console.error("Помилка з'єднання з сервером:", error); }
        };
        loadMap();
    }, []);

    useEffect(() => {
        const handleResize = () => setStageState(prev => ({ ...prev, size: { w: window.innerWidth, h: window.innerHeight } }));
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const stats = useMemo(() => {
        return shapes.reduce((acc, s) => {
            if (s.seats) {
                acc.totalSeats += s.seats;
                if (s.status === 'free' || !s.status) acc.freeSeats += s.seats;
            }
            if (s.hasSocket || s.type === 'socket') acc.withSockets++;
            return acc;
        }, { totalSeats: 0, freeSeats: 0, withSockets: 0 });
    }, [shapes]);

    const updateShape = useCallback((id, newAttrs, isGroupBulkUpdate = false, dx = 0, dy = 0) => {
        setShapes(prev => {
            if (isGroupBulkUpdate) {
                const shape = prev.find(s => s.id === id);
                if (shape && shape.groupId) {
                    return prev.map(s => s.groupId === shape.groupId ? { ...s, x: snapToGrid(s.x + dx), y: snapToGrid(s.y + dy) } : s);
                }
            }
            return prev.map(s => s.id === id ? { ...s, ...newAttrs } : s);
        });
    }, []);

    const deleteSelected = useCallback(() => {
        if (selectedIds.length > 0) {
            setShapes(prev => prev.filter((s) => !selectedIds.includes(s.id)));
            setSelectedIds([]);
        }
    }, [selectedIds]);

    const duplicateSelected = useCallback(() => {
        if (selectedIds.length === 0) return;
        const newShapes = [];
        const newSelection = [];
        const groupMapping = {}; 

        selectedIds.forEach(id => {
            const shape = shapes.find(s => s.id === id);
            if (shape) {
                const newId = `${shape.type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                const newShape = { ...shape, id: newId, x: shape.x + GRID_SIZE, y: shape.y + GRID_SIZE };

                if (shape.groupId) {
                    if (!groupMapping[shape.groupId]) {
                        groupMapping[shape.groupId] = `group-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                    }
                    newShape.groupId = groupMapping[shape.groupId];
                }

                newShapes.push(newShape);
                newSelection.push(newId);
            }
        });

        setShapes(prev => [...prev, ...newShapes]);
        setSelectedIds(newSelection);
    }, [shapes, selectedIds]);

    const handleShapeSelect = useCallback((id, e) => {
        const shape = shapes.find(s => s.id === id);
        if (!shape) return;

        let newSelection = [...selectedIds];
        const isShift = e && e.evt && e.evt.shiftKey;

        if (isShift) {
            if (newSelection.includes(id)) {
                if (shape.groupId) {
                    const groupIds = shapes.filter(s => s.groupId === shape.groupId).map(s => s.id);
                    newSelection = newSelection.filter(selId => !groupIds.includes(selId));
                } else {
                    newSelection = newSelection.filter(selId => selId !== id);
                }
            } else {
                if (shape.groupId) {
                    const groupIds = shapes.filter(s => s.groupId === shape.groupId).map(s => s.id);
                    newSelection = [...new Set([...newSelection, ...groupIds])];
                } else {
                    newSelection.push(id);
                }
            }
        } else {
            if (shape.groupId) {
                newSelection = shapes.filter(s => s.groupId === shape.groupId).map(s => s.id);
            } else {
                newSelection = [id];
            }
        }
        setSelectedIds(newSelection);
    }, [shapes, selectedIds]);

    const handleGroup = () => {
        const newGroupId = `group-${Date.now()}`;
        setShapes(prev => prev.map(s => selectedIds.includes(s.id) ? { ...s, groupId: newGroupId } : s));
    };

    const handleUngroup = () => {
        setShapes(prev => prev.map(s => selectedIds.includes(s.id) ? { ...s, groupId: null } : s));
    };

    const handleTransformEnd = useCallback(() => {
        selectedIds.forEach(id => {
            const node = stageRef.current.findOne(`#${id}`);
            if (node) {
                const shape = shapes.find(s => s.id === id);
                const scaleX = node.scaleX();
                const scaleY = node.scaleY();
                node.scaleX(1); node.scaleY(1);

                const newAttrs = {
                    rotation: Math.round(node.rotation() / 15) * 15,
                    x: snapToGrid(node.x()), y: snapToGrid(node.y()),
                };

                if (['round_table', 'socket', 'water'].includes(shape?.type)) {
                    newAttrs.radius = snapToGrid(Math.max(10, (shape.radius || 30) * Math.abs(scaleX)));
                } else {
                    newAttrs.width = snapToGrid(Math.max(20, (shape?.width || 100) * Math.abs(scaleX)));
                    newAttrs.height = snapToGrid(Math.max(20, (shape?.height || 100) * Math.abs(scaleY)));
                }
                updateShape(id, newAttrs);
            }
        });
    }, [selectedIds, shapes, updateShape]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
            if (['Delete', 'Backspace'].includes(e.key)) { deleteSelected(); return; }

            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
                e.preventDefault();
                duplicateSelected();
                return;
            }

            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedIds.length > 0) {
                e.preventDefault();
                const step = e.shiftKey ? 5 : GRID_SIZE;
                setShapes(prev => prev.map(shape => {
                    if (!selectedIds.includes(shape.id)) return shape;
                    let { x, y } = shape;
                    if (e.key === 'ArrowUp') y -= step;
                    if (e.key === 'ArrowDown') y += step;
                    if (e.key === 'ArrowLeft') x -= step;
                    if (e.key === 'ArrowRight') x += step;
                    if (!e.shiftKey) { x = Math.round(x / GRID_SIZE) * GRID_SIZE; y = Math.round(y / GRID_SIZE) * GRID_SIZE; }
                    return { ...shape, x, y };
                }));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedIds, deleteSelected, duplicateSelected]);

    const addShape = useCallback((type) => {
        const id = `${type}-${Date.now()}`;
        const centerX = (-stageState.pos.x + stageState.size.w / 2) / stageState.scale;
        const centerY = (-stageState.pos.y + stageState.size.h / 2) / stageState.scale;
        const baseProps = { id, type, x: snapToGrid(centerX), y: snapToGrid(centerY), status: 'free', hasSocket: false };

        if (SHAPE_CONFIGS[type]) {
            setShapes(prev => [...prev, { ...baseProps, ...SHAPE_CONFIGS[type] }]);
            setSelectedIds([id]);
        }
    }, [stageState]);

    const handleWheel = useCallback((e) => {
        e.evt.preventDefault();
        const scaleBy = 1.1;
        const stage = e.target.getStage();
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();
        const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };
        const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
        setStageState(prev => ({
            ...prev, scale: Math.max(0.2, Math.min(5, newScale)),
            pos: { x: pointer.x - mousePointTo.x * Math.max(0.2, Math.min(5, newScale)), y: pointer.y - mousePointTo.y * Math.max(0.2, Math.min(5, newScale)) }
        }));
    }, []);

    const selectedShapes = useMemo(() => shapes.filter(s => selectedIds.includes(s.id)), [shapes, selectedIds]);
    const isMultiSelect = selectedIds.length > 1;
    const sameGroupId = isMultiSelect && selectedShapes.every(s => s.groupId && s.groupId === selectedShapes[0].groupId) ? selectedShapes[0].groupId : null;
    const singleSelectedShape = selectedIds.length === 1 ? selectedShapes[0] : null;

    const sidebarWidth = selectedIds.length > 0 ? 288 : 0;
    const toolbarWidth = window.innerWidth >= 1024 ? 288 : 80;
    const canvasWidth = stageState.size.w - toolbarWidth - sidebarWidth;

    return (
        <div className="flex h-screen font-sans bg-gray-50 overflow-hidden relative">

            {/* TOP BAR ACTION BUTTONS */}
            <div className="absolute top-4 right-4 z-40 flex items-center gap-2 bg-white/90 backdrop-blur px-3 py-2 rounded-xl shadow-md border border-gray-100">
                <button onClick={() => navigate('/')} className="p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded transition" title="На головну">
                    <FiArrowLeft size={20} />
                </button>
                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                <button onClick={() => setIsHelpOpen(true)} className="p-2 text-blue-500 hover:bg-blue-50 rounded transition" title="Інструкція (Допомога)">
                    <FiHelpCircle size={20} />
                </button>
                <button onClick={() => setIsStatsOpen(!isStatsOpen)} className={`p-2 transition rounded ${isStatsOpen ? 'bg-orange-100 text-orange-700' : 'text-orange-500 hover:bg-orange-50'}`} title="Статистика залу">
                    <BiStats size={20} />
                </button>
                <div className="w-px h-6 bg-gray-300 mx-1"></div>
                <button onClick={clearCanvas} className="p-2 text-red-500 hover:bg-red-50 rounded transition" title="Очистити все">
                    <BiReset size={20} />
                </button>
                <button onClick={saveToDatabase} disabled={isSaving} className={`p-2 rounded transition ${isSaving ? 'text-gray-400' : 'text-green-600 hover:bg-green-50'}`} title="Зберегти в БД">
                    {isSaving ? <BiLoaderAlt className="animate-spin" size={20} /> : <BiCloudUpload size={20} />}
                </button>
            </div>

            {/* СТАТИСТИКА (POPOVER) */}
            {isStatsOpen && (
                <div className="absolute top-20 right-4 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 z-40 p-5 animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-800 flex items-center gap-2"><BiStats className="text-orange-500"/> Статистика залу</h3>
                        <button onClick={() => setIsStatsOpen(false)} className="text-gray-400 hover:text-gray-600"><FiX size={18}/></button>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <span className="text-sm font-medium text-gray-600">Всього місць</span>
                            <span className="text-lg font-black text-gray-900">{stats.totalSeats}</span>
                        </div>
                        <div className="flex justify-between items-center bg-green-50 p-3 rounded-lg border border-green-100">
                            <span className="text-sm font-medium text-green-700">Вільних місць</span>
                            <span className="text-lg font-black text-green-700">{stats.freeSeats}</span>
                        </div>
                        <div className="flex justify-between items-center bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                            <span className="text-sm font-medium text-yellow-700">Точок доступу (Розетки)</span>
                            <span className="text-lg font-black text-yellow-600">{stats.withSockets}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* ІНСТРУКЦІЯ (MODAL) */}
            {isHelpOpen && (
                <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95">
                        <div className="bg-blue-500 p-4 flex justify-between items-center">
                            <h2 className="text-white font-bold text-lg flex items-center gap-2"><FiHelpCircle /> Керування редактором</h2>
                            <button onClick={() => setIsHelpOpen(false)} className="text-white/80 hover:text-white bg-blue-600 hover:bg-blue-700 p-1 rounded-full transition"><FiX size={20}/></button>
                        </div>
                        <div className="p-6 space-y-4 text-sm text-gray-600">
                            <div className="flex items-start gap-3">
                                <div className="bg-gray-100 p-2 rounded text-gray-500 font-mono text-xs border border-gray-200">Клік</div>
                                <p className="pt-1">Виділити об'єкт для редагування.</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="bg-gray-100 p-2 rounded text-gray-500 font-mono text-xs border border-gray-200 whitespace-nowrap">Shift + Клік</div>
                                <p className="pt-1">Виділити декілька об'єктів одночасно (мульти-селект).</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="bg-gray-100 p-2 rounded text-gray-500 font-mono text-xs border border-gray-200 whitespace-nowrap">Ctrl + D</div>
                                <p className="pt-1">Дублювати виділені об'єкти (або натисніть кнопку в меню).</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="bg-gray-100 p-2 rounded text-gray-500 font-mono text-xs border border-gray-200 whitespace-nowrap">Del / Backspace</div>
                                <p className="pt-1">Видалити виділені об'єкти з карти.</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="bg-gray-100 p-2 rounded text-gray-500 font-mono text-xs border border-gray-200 whitespace-nowrap">Стрілки (↑↓←→)</div>
                                <p className="pt-1">Точне переміщення об'єктів (по 20px). Затисніть <b>Shift</b> для плавного руху (по 5px).</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="bg-gray-100 p-2 rounded text-gray-500 font-mono text-xs border border-gray-200 whitespace-nowrap">Коліщатко миші</div>
                                <p className="pt-1">Масштабування (Зум) всієї карти. Затисніть ліву кнопку миші на пустому місці для перетягування ховста.</p>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-4 border-t border-gray-100 text-center">
                            <button onClick={() => setIsHelpOpen(false)} className="px-6 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition shadow-sm">Зрозуміло</button>
                        </div>
                    </div>
                </div>
            )}

            {/* SIDEBAR TOOLBOX */}
            <div className="w-20 lg:w-72 bg-white border-r border-gray-200 flex flex-col shadow-xl z-20">
                <div className="bg-[#F97316] p-4">
                    <h2 className="text-white font-black text-xl tracking-wider hidden lg:block">АДМІН ПАНЕЛЬ</h2>
                    <span className="text-white font-bold lg:hidden">АДМ</span>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-8">
                    <div>
                        <h3 className="text-[10px] font-black tracking-wider text-gray-400 uppercase mb-3 hidden lg:block">Робочі місця</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                            <ToolCard icon={MdOutlineTableRestaurant} label="Прямокутний стіл" onClick={() => addShape('desk')} />
                            <ToolCard icon={MdTableRestaurant} label="Стіл для нарад" onClick={() => addShape('meeting_table')} />
                            <ToolCard icon={MdTableBar} label="Круглий стіл" onClick={() => addShape('round_table')} />
                            <ToolCard icon={MdWeekend} label="Диван" onClick={() => addShape('sofa')} />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black tracking-wider text-gray-400 uppercase mb-3 hidden lg:block">Конструкції</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                            <ToolCard icon={GiBrickWall} label="Стіна" onClick={() => addShape('wall')} />
                            <ToolCard icon={BiDoorOpen} label="Двері" onClick={() => addShape('door')} />
                            <ToolCard icon={GiStairs} label="Сходи" onClick={() => addShape('stairs')} />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black tracking-wider text-gray-400 uppercase mb-3 hidden lg:block">Інфраструктура</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                            <ToolCard icon={PiToilet} label="Вбиральня" onClick={() => addShape('toilet_zone')} />
                            <ToolCard icon={FiCoffee} label="Кавоварка" onClick={() => addShape('coffee')} />
                            <ToolCard icon={FiDroplet} label="Кулер" onClick={() => addShape('water')} />
                            <ToolCard icon={BiPlug} label="Розетка" onClick={() => addShape('socket')} />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-[10px] font-black tracking-wider text-gray-400 uppercase mb-3 hidden lg:block">Декор та Маркування</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                            <ToolCard icon={FiSquare} label="Дошка" onClick={() => addShape('whiteboard')} />
                            <ToolCard icon={FiType} label="Назва зони" onClick={() => addShape('text_label')} />
                        </div>
                    </div>
                </div>
            </div>

            {/* CANVAS */}
            <div className="flex-1 relative bg-white overflow-hidden cursor-crosshair">
                <div className="absolute inset-0 pointer-events-none opacity-100"
                    style={{ backgroundImage: `linear-gradient(${COLORS.GRID} 1px, transparent 1px), linear-gradient(90deg, ${COLORS.GRID} 1px, transparent 1px)`, backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px` }} />

                <Stage
                    ref={stageRef}
                    width={canvasWidth}
                    height={stageState.size.h}
                    draggable
                    x={stageState.pos.x}
                    y={stageState.pos.y}
                    scaleX={stageState.scale}
                    scaleY={stageState.scale}
                    onWheel={handleWheel}
                    onDragEnd={(e) => { if (e.target === e.target.getStage()) setStageState(prev => ({ ...prev, pos: { x: e.target.x(), y: e.target.y() } })) }}
                    onMouseDown={(e) => { if (e.target === e.target.getStage()) setSelectedIds([]); }}
                >
                    <Layer>
                        {shapes.map((shape) => (
                            <ShapeComponent
                                key={shape.id}
                                shapeProps={shape}
                                isSelected={selectedIds.includes(shape.id)}
                                onSelect={handleShapeSelect}
                                onChange={updateShape}
                            />
                        ))}
                        <Transformer
                            ref={trRef}
                            boundBoxFunc={(o, n) => (n.width < 10 || n.height < 10) ? o : n}
                            onTransformEnd={handleTransformEnd}
                        />
                    </Layer>
                </Stage>
            </div>

            {/* PROPERTIES PANEL */}
            {selectedIds.length > 0 && (
                <div className="w-72 bg-white border-l border-gray-200 shadow-xl z-20 flex flex-col p-4 animate-slideInRight">
                    
                    {isMultiSelect ? (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-4 pb-4 border-b">
                                <h3 className="font-bold text-gray-800">Виділено: {selectedIds.length} шт.</h3>
                                <div className="flex gap-2">
                                    <button onClick={duplicateSelected} className="text-indigo-500 hover:bg-indigo-50 p-2 rounded" title="Дублювати (Ctrl+D)"><FiCopy size={20} /></button>
                                    <button onClick={deleteSelected} className="text-red-500 hover:bg-red-50 p-2 rounded" title="Видалити"><BiTrash size={20} /></button>
                                </div>
                            </div>
                            
                            {!sameGroupId ? (
                                <button onClick={handleGroup} className="w-full py-2 bg-indigo-100 text-indigo-700 font-bold rounded hover:bg-indigo-200 transition shadow-sm">
                                    Згрупувати об'єкти
                                </button>
                            ) : (
                                <button onClick={handleUngroup} className="w-full py-2 bg-red-100 text-red-700 font-bold rounded hover:bg-red-200 transition shadow-sm">
                                    Розгрупувати
                                </button>
                            )}
                            
                            <p className="text-xs text-gray-400 mt-4 text-center leading-relaxed">
                                Затисніть <b>Shift</b> при кліку, щоб додавати або прибирати об'єкти з виділення.
                            </p>
                        </div>
                    ) : (
                        
                    singleSelectedShape && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center mb-6 pb-4 border-b">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2"><FiSettings /> Властивості</h3>
                                <div className="flex gap-1">
                                    <button onClick={duplicateSelected} className="text-indigo-500 hover:bg-indigo-50 p-2 rounded" title="Дублювати (Ctrl+D)"><FiCopy size={20} /></button>
                                    <button onClick={deleteSelected} className="text-red-500 hover:bg-red-50 p-2 rounded" title="Видалити"><BiTrash size={20} /></button>
                                </div>
                            </div>

                            {!['wall'].includes(singleSelectedShape.type) && (
                                <div>
                                    <label className="text-xs font-bold text-gray-400 block mb-1">Назва / Номер</label>
                                    <input className="w-full border border-gray-300 rounded p-2 text-sm outline-none" value={singleSelectedShape.label || ''} onChange={(e) => updateShape(singleSelectedShape.id, { label: e.target.value })} />
                                </div>
                            )}

                            {singleSelectedShape.type === 'text_label' && (
                                <SeatsSlider label='Розмір шрифту' min='10' max='72' value={singleSelectedShape.fontSize || 24} onChange={(e) => updateShape(singleSelectedShape.id, { fontSize: parseInt(e.target.value) })} />
                            )}

                            {(singleSelectedShape.type.includes('desk') || singleSelectedShape.type.includes('table')) && (
                                <div className="flex items-center justify-between bg-yellow-50 p-3 rounded border border-yellow-200">
                                    <span className="text-sm font-bold text-yellow-800 flex items-center gap-2"><BiPlug size={18} /> Є розетка?</span>
                                    <input type="checkbox" checked={singleSelectedShape.hasSocket || false} onChange={(e) => updateShape(singleSelectedShape.id, { hasSocket: e.target.checked })} className="w-5 h-5 text-yellow-600 rounded cursor-pointer" />
                                </div>
                            )}

                            {singleSelectedShape.type === 'toilet_zone' && (
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-3">
                                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2"><PiToilet size={14} /> Конфігурація Вбиральні</label>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 block mb-1">Тип вбиральні</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {TOILET_TYPES.map((type) => (
                                                <StatusButton key={type.value} label={type.label} color={type.color} isActive={singleSelectedShape.gender === type.value} onClick={() => updateShape(singleSelectedShape.id, { gender: type.value })} />
                                            ))}
                                        </div>
                                    </div>
                                    <SeatsSlider label='Кількість Кабінок' min='1' max='6' value={singleSelectedShape.cabins || 1} onChange={(e) => updateShape(singleSelectedShape.id, { cabins: parseInt(e.target.value) })} />
                                </div>
                            )}

                            {BOOKABLE.includes(singleSelectedShape.type) && singleSelectedShape.status && (
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 space-y-3">
                                    <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2"><CiBookmark size={14} /> Статус місця</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {STATES_TYPES.map((type) => (
                                            <StatusButton key={type.value} label={type.label} color={type.color} isActive={singleSelectedShape.status === type.value} onClick={() => updateShape(singleSelectedShape.id, { status: type.value })} />
                                        ))}
                                    </div>
                                    <SeatsSlider label='Кількість Стільців' min='0' max='12' value={singleSelectedShape.seats} onChange={(e) => updateShape(singleSelectedShape.id, { seats: parseInt(e.target.value) })} />
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-bold text-gray-400 block mb-2">Поворот</label>
                                <div className="flex gap-2">
                                    <button onClick={() => updateShape(singleSelectedShape.id, { rotation: (singleSelectedShape.rotation || 0) - 45 })} className="flex-1 bg-gray-100 py-2 rounded text-xs hover:bg-gray-200">↺ -45°</button>
                                    <button onClick={() => updateShape(singleSelectedShape.id, { rotation: (singleSelectedShape.rotation || 0) + 45 })} className="flex-1 bg-gray-100 py-2 rounded text-xs hover:bg-gray-200">↻ +45°</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminEditor;