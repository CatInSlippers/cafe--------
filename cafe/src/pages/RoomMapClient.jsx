import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Stage, Layer, Rect, Circle, Text, Group, Arc, Line, Path } from 'react-konva';
import { useNavigate, useLocation } from 'react-router-dom';
import { FiArrowLeft, FiInfo } from 'react-icons/fi';

// Імпорти ваших рендерів (переконайся, що шляхи правильні)
import { ToiletRenderer } from '../assets/RENDERS/ToiletRenderer';
import { ChairsRenderer } from '../assets/RENDERS/ChairsRenderer';
import { SocketIcon } from '../assets/RENDERS/SocketIcon';


const GRID_SIZE = 20;

const COLORS = {
    GRID: '#E5E7EB', WALL: '#374151', STATUS_FREE: '#10B981', STATUS_BOOKED: '#EF4444', STATUS_BROKEN: '#9CA3AF',
    FURNITURE_DEFAULT: '#E0E7FF', FURNITURE_STROKE: '#4338CA', SOCKET: '#F59E0B', TEXT: '#1F2937', TOILET_BG: '#F3F4F6'
};

const BOOKABLE = ['desk', 'meeting_table', 'round_table', 'sofa'];

function getFillColor(props) {
    if (!props.status) return props.fill || COLORS.FURNITURE_DEFAULT;
    switch (props.status) {
        case 'free': return COLORS.STATUS_FREE;
        case 'booked': return COLORS.STATUS_BOOKED;
        case 'broken': return COLORS.STATUS_BROKEN;
        default: return COLORS.FURNITURE_DEFAULT;
    }
}

// Фігура для клієнта
const ClientShapeComponent = React.memo(({ shapeProps, onBook, categoryFilter }) => {
    // ЛОГІКА ПІДСВІЧУВАННЯ: Якщо елемент можна забронювати, але він НЕ ТОГО типу, що шукає користувач - робимо його прозорим
    const isMismatchedCategory = categoryFilter && BOOKABLE.includes(shapeProps.type) && shapeProps.type !== categoryFilter;

    // Якщо місце зайняте - воно теж бліде
    const isUnavailable = shapeProps.status === 'booked' || shapeProps.status === 'broken';

    const opacity = (isMismatchedCategory || isUnavailable) ? 0.3 : 1;

    const styles = useMemo(() => ({
        fill: getFillColor(shapeProps), stroke: COLORS.FURNITURE_STROKE,
        textColor: (shapeProps.status && shapeProps.status !== 'broken') ? 'white' : COLORS.TEXT,
        isRound: ['round_table', 'socket', 'water'].includes(shapeProps.type)
    }), [shapeProps]);

    const { fill, stroke, textColor, isRound } = styles;
    const { width: w, height: h, radius: r } = shapeProps;

    const renderVisuals = () => {
        switch (shapeProps.type) {
            case 'wall': return <Rect width={w} height={h} fill={COLORS.WALL} />;
            case 'door': return <Group><Arc innerRadius={w} angle={90} stroke={stroke} dash={[4, 4]} /><Rect width={5} height={w} fill="white" stroke={stroke} /><Rect width={w} height={h} fill="transparent" /></Group>;
            case 'sofa':
                const d = Math.min(w, h) * 0.35;
                return <Group><Line points={[0, 0, w, 0, w, d, d, d, d, h, 0, h]} closed fill={fill} stroke={stroke} lineJoin="round" /><Line points={[5, 5, w - 5, 5]} stroke="white" strokeWidth={2} opacity={0.5} /></Group>;
            case 'socket': return <Group><Circle radius={r} fill={COLORS.SOCKET} stroke="black" strokeWidth={1} /><Path data="M-3 -4 L3 -4 L-1 2 L4 2 L-2 7 L-1 2 L-4 2 Z" fill="white" x={1} /></Group>;
            case 'stairs':
                const stepCount = Math.max(3, Math.floor(h / 15));
                const steps = [];
                for (let i = 1; i < stepCount; i++) steps.push(<Line key={i} points={[0, (h / stepCount) * i, w, (h / stepCount) * i]} stroke="#9CA3AF" strokeWidth={1} />);
                return <Group><Rect width={w} height={h} fill="#E5E7EB" stroke={stroke} />{steps}</Group>;
            case 'text_label':
                return <Text text={shapeProps.label} width={w} height={h} fontSize={shapeProps.fontSize || 24} fontStyle="bold" fill={COLORS.TEXT} align="center" verticalAlign="middle" />;
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
            x={shapeProps.x} y={shapeProps.y} rotation={shapeProps.rotation || 0}
            opacity={opacity}
            onClick={(e) => onBook(shapeProps, isMismatchedCategory)}
            onTap={(e) => onBook(shapeProps, isMismatchedCategory)}
            onMouseEnter={(e) => {
                if (BOOKABLE.includes(shapeProps.type) && !isMismatchedCategory && shapeProps.status === 'free') {
                    e.target.getStage().container().style.cursor = 'pointer';
                }
            }}
            onMouseLeave={(e) => e.target.getStage().container().style.cursor = 'grab'}
        >
            {renderVisuals()}
            {shapeProps.label && shapeProps.type !== 'wall' && shapeProps.type !== 'text_label' && (
                <Text
                    text={shapeProps.label} x={isRound ? -r : 0} y={isRound ? -r : 0} width={isRound ? r * 2 : w} height={isRound ? r * 2 : h}
                    fontSize={11} fontStyle="bold" fill={textColor} align="center" verticalAlign="middle" listening={false}
                />
            )}
        </Group>
    );
});

const RoomMapClient = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState('10:00');
    const [hours, setHours] = useState(1);
    const [occupiedSeats, setOccupiedSeats] = useState([]); // Стан для зайнятих місць

    // Отримуємо категорію, яку клієнт обрав на Кроці 1 (напр. 'desk' або 'meeting_table')
    const categoryFilter = location.state?.category;

    const [shapes, setShapes] = useState([]);
    const [loading, setLoading] = useState(true);
    const stageRef = useRef(null);

    const [rooms, setRooms] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState('');

    const [stageState, setStageState] = useState({
        scale: 1, pos: { x: 0, y: 0 }, size: { w: window.innerWidth, h: window.innerHeight }
    });

    useEffect(() => {
        const fetchOccupiedSeats = async () => {
            try {
                const response = await fetch(`http://localhost:3005/api/bookings/occupied?date=${date}&start_time=${startTime}&duration_hours=${hours}`);
                if (response.ok) {
                    const data = await response.json();
                    setOccupiedSeats(data);
                }
            } catch (error) {
                console.error("Помилка завантаження зайнятих місць:", error);
            }
        };
        fetchOccupiedSeats();
    }, [date, startTime, hours]); // Запускається щоразу, коли змінюється дата або час

    // 1. Завантажуємо список усіх доступних кімнат
    useEffect(() => {
        const fetchRooms = async () => {
            try {
                const response = await fetch('http://localhost:3005/api/maps');
                if (response.ok) {
                    const data = await response.json();
                    setRooms(data);
                    if (data.length > 0) {
                        setSelectedRoom(data[0].name); // Вибираємо першу кімнату за замовчуванням
                    } else {
                        setLoading(false); // Якщо кімнат немає, просто зупиняємо лоадер
                    }
                }
            } catch (error) { console.error("Помилка завантаження списку кімнат:", error); }
        };
        fetchRooms();
    }, []);

    // 2. Завантажуємо об'єкти карти, коли змінюється обрана кімната
    useEffect(() => {
        if (!selectedRoom) return;

        const loadMap = async () => {
            setLoading(true);
            try {
                const response = await fetch(`http://localhost:3005/api/maps/${selectedRoom}`);
                if (response.ok) {
                    const data = await response.json();
                    if (Array.isArray(data)) setShapes(data);
                } else {
                    setShapes([]);
                }
            } catch (error) { console.error("Помилка завантаження карти:", error); }
            finally { setLoading(false); }
        };
        loadMap();
    }, [selectedRoom]);

    useEffect(() => {
        const handleResize = () => setStageState(prev => ({ ...prev, size: { w: window.innerWidth, h: window.innerHeight } }));
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleWheel = useCallback((e) => {
        e.evt.preventDefault();
        const scaleBy = 1.1;
        const stage = e.target.getStage();
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();
        const mousePointTo = { x: (pointer.x - stage.x()) / oldScale, y: (pointer.y - stage.y()) / oldScale };
        const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
        setStageState(prev => ({ ...prev, scale: Math.max(0.2, Math.min(5, newScale)), pos: { x: pointer.x - mousePointTo.x * Math.max(0.2, Math.min(5, newScale)), y: pointer.y - mousePointTo.y * Math.max(0.2, Math.min(5, newScale)) } }));
    }, []);

    // Логіка кліку по місцю
    const handleBookPlace = async (shape, isMismatchedCategory) => {
        if (!BOOKABLE.includes(shape.type)) return; // Клікнули по стіні чи дверях

        if (isMismatchedCategory) {
            alert("Це місце не відповідає типу, який ви обрали на попередньому кроці. Шукайте яскраві елементи на карті!");
            return;
        }

        if (shape.status === 'booked') return alert('Це місце вже зайняте.');
        if (shape.status === 'broken') return alert('Це місце тимчасово недоступне.');

        if (window.confirm(`Бронюємо "${shape.label || 'Робоче місце'}" у кімнаті "${selectedRoom}"?`)) {
            navigate('/', { state: { selectedSeat: shape, date, startTime, hours, room: selectedRoom } });
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50">Завантаження карти...</div>;

    return (
        <div className="relative h-screen w-full bg-gray-50 overflow-hidden font-sans">
            {/* Панель підказок поверх карти */}
            <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-md p-5 rounded-2xl shadow-lg border border-gray-100 max-w-sm">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-4 text-sm font-bold transition"
                >
                    <FiArrowLeft /> Назад
                </button>
                {/* Перемикач кімнат */}
                {rooms.length > 0 && (
                    <div className="mb-4 border-b border-gray-100 pb-4">
                        <label className="text-xs font-bold text-gray-500 block mb-2 uppercase tracking-wider">Оберіть зону</label>
                        <div className="flex flex-wrap gap-2">
                            {rooms.map(r => (
                                <button
                                    key={r.name}
                                    onClick={() => setSelectedRoom(r.name)}
                                    className={`px-3 py-1.5 text-sm font-bold rounded-lg transition-colors shadow-sm ${selectedRoom === r.name
                                            ? 'bg-[var(--day-purple)] text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {r.name.replace(/_/g, ' ')} {/* Замінюємо підкреслення на пробіли для краси */}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Панель вибору часу */}
                <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 mb-4 space-y-3">
                    <div>
                        <label className="text-xs font-bold text-gray-500">Дата</label>
                        <input type="date" value={date} min={new Date().toISOString().split('T')[0]} onChange={e => setDate(e.target.value)} className="w-full text-sm p-1.5 rounded border border-gray-300 outline-none" />
                    </div>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-gray-500">Початок</label>
                            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full text-sm p-1.5 rounded border border-gray-300 outline-none" />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-bold text-gray-500">Тривалість</label>
                            <select value={hours} onChange={e => setHours(parseInt(e.target.value))} className="w-full text-sm p-1.5 rounded border border-gray-300 outline-none">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(h => <option key={h} value={h}>{h} год</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2 mb-2">
                    <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded text-sm">Крок 2</span>
                    Оберіть місце
                </h2>

                <p className="text-gray-500 text-sm mb-4">
                    Ми підсвітили для вас усі відповідні місця зеленим кольором. Натисніть на те, яке вам подобається.
                </p>

                <div className="flex gap-4 pt-4 border-t border-gray-100 text-xs font-medium text-gray-500">
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[#10B981]"></div> Вільно</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-[#EF4444] opacity-50"></div> Зайнято</div>
                </div>
            </div>

            <div className="cursor-grab active:cursor-grabbing">
                <div className="absolute inset-0 pointer-events-none opacity-50" style={{ backgroundImage: `linear-gradient(${COLORS.GRID} 1px, transparent 1px), linear-gradient(90deg, ${COLORS.GRID} 1px, transparent 1px)`, backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px` }} />

                <Stage
                    ref={stageRef} width={stageState.size.w} height={stageState.size.h} draggable
                    x={stageState.pos.x} y={stageState.pos.y} scaleX={stageState.scale} scaleY={stageState.scale}
                    onWheel={handleWheel} onDragEnd={(e) => { if (e.target === e.target.getStage()) setStageState(prev => ({ ...prev, pos: { x: e.target.x(), y: e.target.y() } })) }}
                >
                    <Layer>
                        {shapes.map((shape) => {
                            // Якщо ID стола є в масиві зайнятих, примусово ставимо статус 'booked'
                            const isOccupied = occupiedSeats.includes(shape.id);
                            const dynamicShapeProps = {
                                ...shape,
                                status: isOccupied ? 'booked' : shape.status
                            };

                            return (
                                <ClientShapeComponent
                                    key={shape.id}
                                    shapeProps={dynamicShapeProps}
                                    onBook={handleBookPlace}
                                    categoryFilter={categoryFilter}
                                />
                            );
                        })}
                    </Layer>
                </Stage>
            </div>
        </div>
    );
};

export default RoomMapClient;