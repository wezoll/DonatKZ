import React, { useState, useRef, useEffect } from "react";
import "./RoulettePage.css";

// ==================== TYPES ====================

interface RouletteSegment {
    id: number;
    label: string;
    color: string;
    weight: number;
}

interface RouletteSettings {
    minAmount: number;
    spinMode: "fixed" | "per-amount";
    spinCostPerAmount: number;
    spinDuration: number;
    soundEnabled: boolean;
    showWinner: boolean;
    shape: "circular" | "rectangular";
    borderColor: string;
    pointerColor: string;
    hubColor: string;
}

interface Roulette {
    id: number;
    name: string;
    isEnabled: boolean;
    url: string;
    segments: RouletteSegment[];
    settings: RouletteSettings;
}

// ==================== HELPERS ====================

const DEFAULT_COLORS = [
    "#88b702", "#e74c3c", "#3498db", "#f39c12", "#9b59b6",
    "#1abc9c", "#e67e22", "#2ecc71", "#e91e63", "#00bcd4",
];

const buildSegments = (segments: RouletteSegment[]) => {
    const totalWeight = segments.reduce((s, seg) => s + seg.weight, 0);
    let start = 0;
    return segments.map((seg) => {
        const angle = (seg.weight / totalWeight) * 360;
        const item = { ...seg, startAngle: start, angle };
        start += angle;
        return item;
    });
};

// Draws one SVG pie slice
const describeArc = (
    cx: number,
    cy: number,
    r: number,
    startAngle: number,
    endAngle: number
): string => {
    const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(toRad(startAngle));
    const y1 = cy + r * Math.sin(toRad(startAngle));
    const x2 = cx + r * Math.cos(toRad(endAngle));
    const y2 = cy + r * Math.sin(toRad(endAngle));
    const large = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
};

// Label position for a segment
const segmentLabelPos = (
    cx: number,
    cy: number,
    r: number,
    startAngle: number,
    angle: number
) => {
    const mid = startAngle + angle / 2;
    const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;
    return {
        x: cx + r * 0.65 * Math.cos(toRad(mid)),
        y: cy + r * 0.65 * Math.sin(toRad(mid)),
        rotate: mid,
    };
};

// ==================== ROULETTE WHEEL COMPONENT ====================

interface WheelProps {
    segments: RouletteSegment[];
    spinning: boolean;
    spinDuration: number;
    winnerIndex: number | null;
    rotation: number;
    borderColor: string;
    pointerColor: string;
    hubColor: string;
}

const RouletteWheel: React.FC<WheelProps> = ({
    segments,
    spinning,
    spinDuration,
    winnerIndex,
    rotation,
    borderColor,
    pointerColor,
    hubColor,
}) => {
    const cx = 200;
    const cy = 200;
    const r = 180;
    const built = buildSegments(segments);

    return (
        <div className="wheel-wrapper">
            {/* Pointer */}
            <div className="wheel-pointer" style={{ color: pointerColor }}>▼</div>

            <div
                className="wheel-svg-container"
                style={{
                    transform: `rotate(${rotation}deg)`,
                    transition: spinning
                        ? `transform ${spinDuration}s cubic-bezier(0.2, 0.9, 0.3, 1)`
                        : "none",
                }}
            >
                <svg width="400" height="400" viewBox="0 0 400 400">
                    {/* Outer glow ring */}
                    <circle cx={cx} cy={cy} r={r + 4} fill="none" stroke={borderColor} strokeWidth="3" opacity="0.5" />

                    {built.map((seg) => {
                        const path = describeArc(cx, cy, r, seg.startAngle, seg.startAngle + seg.angle);
                        const lpos = segmentLabelPos(cx, cy, r, seg.startAngle, seg.angle);
                        const showLabel = seg.angle > 18;
                        return (
                            <g key={seg.id}>
                                <path d={path} fill={seg.color} stroke="#1a1a1a" strokeWidth="2" />
                                {showLabel && (
                                    <text
                                        x={lpos.x}
                                        y={lpos.y}
                                        textAnchor="middle"
                                        dominantBaseline="middle"
                                        transform={`rotate(${lpos.rotate}, ${lpos.x}, ${lpos.y})`}
                                        fontSize={seg.angle > 40 ? 13 : 10}
                                        fontWeight="700"
                                        fill="#fff"
                                        style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)", pointerEvents: "none" }}
                                    >
                                        {seg.label.length > 10 ? seg.label.slice(0, 9) + "\u2026" : seg.label}
                                    </text>
                                )}
                            </g>
                        );
                    })}

                    {/* Center hub */}
                    <circle cx={cx} cy={cy} r={28} fill="#1a1a1a" stroke={hubColor} strokeWidth="3" />
                    <circle cx={cx} cy={cy} r={14} fill={hubColor} />
                </svg>
            </div>

            {/* Winner banner */}
            {winnerIndex !== null && !spinning && (
                <div className="winner-banner">
                    <span style={{ color: segments[winnerIndex]?.color }}>{segments[winnerIndex]?.label}</span>
                </div>
            )}
        </div>
    );
};

// ==================== RECTANGULAR STRIP COMPONENT ====================

interface StripProps {
    segments: RouletteSegment[];
    spinning: boolean;
    spinDuration: number;
    winnerIndex: number | null;
    stripOffset: number;
    borderColor: string;
    pointerColor: string;
}

const STRIP_ITEM_WIDTH = 120;
const STRIP_VISIBLE = 5; // how many items visible at once

/** Build a long repeated array for the strip illusion */
const buildStripItems = (segments: RouletteSegment[], count = 500) => {
    const out: RouletteSegment[] = [];
    for (let i = 0; i < count; i++) {
        out.push(segments[i % segments.length]);
    }
    return out;
};

const RouletteStrip: React.FC<StripProps> = ({
    segments,
    spinning,
    spinDuration,
    winnerIndex,
    stripOffset,
    borderColor,
    pointerColor,
}) => {
    const items = buildStripItems(segments);
    const stripWidth = items.length * STRIP_ITEM_WIDTH;

    return (
        <div className="strip-wrapper">
            {/* Pointer arrow on top center */}
            <div className="strip-pointer-top" style={{ color: pointerColor }}>▼</div>

            <div className="strip-outer" style={{ borderColor: borderColor, boxShadow: `0 0 0 2px ${borderColor}22` }}>
                {/* Left / right fade masks */}
                <div className="strip-mask strip-mask-left" />
                <div className="strip-mask strip-mask-right" />

                {/* The scrolling track */}
                <div
                    className="strip-track"
                    style={{
                        width: stripWidth,
                        transform: `translateX(${-stripOffset}px)`,
                        transition: spinning
                            ? `transform ${spinDuration}s cubic-bezier(0.15, 0.85, 0.3, 1)`
                            : "none",
                    }}
                >
                    {items.map((seg, i) => (
                        <div
                            key={i}
                            className={`strip-item ${!spinning && winnerIndex !== null && seg.id === segments[winnerIndex]?.id && i === Math.round(stripOffset / STRIP_ITEM_WIDTH)
                                ? "strip-item-winner"
                                : ""
                                }`}
                            style={{ backgroundColor: seg.color, width: STRIP_ITEM_WIDTH }}
                        >
                            <span className="strip-item-label">{seg.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom pointer */}
            <div className="strip-pointer-bottom" style={{ color: pointerColor }}>▲</div>

            {/* Winner banner */}
            {winnerIndex !== null && !spinning && (
                <div className="winner-banner">
                    <span style={{ color: segments[winnerIndex]?.color }}>{segments[winnerIndex]?.label}</span>
                </div>
            )}
        </div>
    );
};

// ==================== MAIN PAGE ====================

const INITIAL_SEGMENTS: RouletteSegment[] = [
    { id: 1, label: "Приз 1", color: "#88b702", weight: 5 },
    { id: 2, label: "Приз 2", color: "#e74c3c", weight: 3 },
    { id: 3, label: "Приз 3", color: "#3498db", weight: 2 },
    { id: 4, label: "Ничего", color: "#555555", weight: 4 },
];

const DEFAULT_SETTINGS: RouletteSettings = {
    minAmount: 100,
    spinMode: "per-amount",
    spinCostPerAmount: 100,
    spinDuration: 8,
    soundEnabled: true,
    showWinner: true,
    shape: "rectangular",
    borderColor: "#88b702",
    pointerColor: "#88b702",
    hubColor: "#88b702",
};

const RoulettePage: React.FC = () => {
    const [roulettes, setRoulettes] = useState<Roulette[]>([
        {
            id: 1,
            name: "Основная рулетка",
            isEnabled: true,
            url: `https://widget.donatkz.com/roulette-${Date.now()}`,
            segments: INITIAL_SEGMENTS,
            settings: { ...DEFAULT_SETTINGS },
        },
    ]);

    // List view
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newName, setNewName] = useState("");
    const [newMinAmount, setNewMinAmount] = useState("100");
    const [copiedId, setCopiedId] = useState<number | null>(null);
    const [showUrl, setShowUrl] = useState<{ [k: number]: boolean }>({});

    // Editor view
    const [editing, setEditing] = useState<Roulette | null>(null);
    const [activeTab, setActiveTab] = useState<"segments" | "widget">("segments");

    // Segment form
    const [addingSegment, setAddingSegment] = useState(false);
    const [newSegLabel, setNewSegLabel] = useState("");
    const [newSegColor, setNewSegColor] = useState("#88b702");
    const [newSegWeight, setNewSegWeight] = useState(5);

    // Spin state
    const [spinning, setSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [stripOffset, setStripOffset] = useState(0);
    const [winnerIndex, setWinnerIndex] = useState<number | null>(null);
    const spinCountRef = useRef(0);

    // Keep editing in sync with roulettes list
    useEffect(() => {
        if (editing) {
            setEditing(roulettes.find((r) => r.id === editing.id) ?? null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roulettes]);

    // -------- Helpers --------

    const updateEditing = (updated: Roulette) => {
        setEditing(updated);
        setRoulettes((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    };

    const handleAddRoulette = () => {
        if (!newName.trim()) return;
        const r: Roulette = {
            id: Date.now(),
            name: newName.trim(),
            isEnabled: true,
            url: `https://widget.donatkz.com/roulette-${Date.now()}`,
            segments: [...INITIAL_SEGMENTS.map((s) => ({ ...s, id: Date.now() + s.id }))],
            settings: { ...DEFAULT_SETTINGS, minAmount: parseInt(newMinAmount) || 100 },
        };
        setRoulettes((prev) => [...prev, r]);
        setIsAddModalOpen(false);
        setNewName("");
        setNewMinAmount("100");
    };

    const handleDelete = (id: number) => {
        setRoulettes((prev) => prev.filter((r) => r.id !== id));
    };

    const handleToggle = (id: number) => {
        setRoulettes((prev) =>
            prev.map((r) => (r.id === id ? { ...r, isEnabled: !r.isEnabled } : r))
        );
    };

    const handleCopyUrl = (url: string, id: number) => {
        navigator.clipboard.writeText(url);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const toggleShowUrl = (id: number) => {
        setShowUrl((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const openEditor = (r: Roulette) => {
        setEditing({ ...r, segments: r.segments.map((s) => ({ ...s })) });
        setActiveTab("segments");
        setWinnerIndex(null);
        setRotation(0);
        setSpinning(false);
        setAddingSegment(false);
    };

    // -------- Segment management --------

    const handleAddSegment = () => {
        if (!newSegLabel.trim() || !editing) return;
        const seg: RouletteSegment = {
            id: Date.now(),
            label: newSegLabel.trim(),
            color: newSegColor,
            weight: newSegWeight,
        };
        updateEditing({ ...editing, segments: [...editing.segments, seg] });
        setNewSegLabel("");
        setNewSegColor(DEFAULT_COLORS[(editing.segments.length) % DEFAULT_COLORS.length]);
        setNewSegWeight(5);
        setAddingSegment(false);
    };

    const handleDeleteSegment = (segId: number) => {
        if (!editing || editing.segments.length <= 1) return;
        updateEditing({ ...editing, segments: editing.segments.filter((s) => s.id !== segId) });
    };

    const handleSegmentChange = (segId: number, key: keyof RouletteSegment, value: any) => {
        if (!editing) return;
        updateEditing({
            ...editing,
            segments: editing.segments.map((s) => (s.id === segId ? { ...s, [key]: value } : s)),
        });
    };

    const handleSettingChange = (key: keyof RouletteSettings, value: any) => {
        if (!editing) return;
        updateEditing({ ...editing, settings: { ...editing.settings, [key]: value } });
    };

    // -------- Spin --------

    const handleSpin = () => {
        if (!editing || spinning) return;
        setWinnerIndex(null);
        setSpinning(true);

        const segments = editing.segments;
        const totalWeight = segments.reduce((s, seg) => s + seg.weight, 0);

        // Pick winner weighted
        let rand = Math.random() * totalWeight;
        let winner = 0;
        const built = buildSegments(segments);
        for (let i = 0; i < built.length; i++) {
            rand -= segments[i].weight;
            if (rand <= 0) { winner = i; break; }
        }

        if (editing.settings.shape === "rectangular") {
            // Strip spin: scroll forward from the current position by at least 120 items.
            // This ensures it always moves forward and avoids the 'only works first time' issue.
            const containerCenter = (STRIP_VISIBLE * STRIP_ITEM_WIDTH) / 2;

            // Calculate current item index at center
            const currentItemIndex = Math.round((stripOffset + containerCenter - STRIP_ITEM_WIDTH / 2) / STRIP_ITEM_WIDTH);

            // Minimum number of items to skip for a good spin effect
            const minSkip = 120;

            // Calculate how many extra items to land on the winner segment relative to segments.length
            // We want (currentItemIndex + itemsToMove) % segments.length == winner
            let itemsToMove = (winner - (currentItemIndex % segments.length) + segments.length) % segments.length;

            // Add full revolutions until we pass the minSkip threshold
            while (itemsToMove < minSkip) {
                itemsToMove += segments.length;
            }

            const targetItemIndex = currentItemIndex + itemsToMove;
            const finalOffset = targetItemIndex * STRIP_ITEM_WIDTH - containerCenter + STRIP_ITEM_WIDTH / 2;

            setStripOffset(finalOffset);
        } else {
            // Circular spin
            const winSeg = built[winner];
            const segMid = winSeg.startAngle + winSeg.angle / 2;
            const stopAngle = 360 - segMid;
            const extraSpins = 5 + spinCountRef.current % 3;
            spinCountRef.current++;
            const totalRotation = rotation + extraSpins * 360 + stopAngle;
            setRotation(totalRotation);
        }

        setTimeout(() => {
            setSpinning(false);
            setWinnerIndex(winner);

            // Teleport back to equivalent position in the first part of the strip to avoid infinite growth.
            // Since spinning is now false, the transition is "none", making this jump instant.
            if (editing.settings.shape === "rectangular") {
                const containerCenter = (STRIP_VISIBLE * STRIP_ITEM_WIDTH) / 2;
                // Place it at winner + 2 revolutions from start
                const baseRevCount = 2;
                const teleportItemIndex = winner + (baseRevCount * segments.length);
                const teleportOffset = teleportItemIndex * STRIP_ITEM_WIDTH - containerCenter + STRIP_ITEM_WIDTH / 2;
                setStripOffset(teleportOffset);
            }

            if (editing.settings.soundEnabled) { }
        }, editing.settings.spinDuration * 1000 + 100);
    };

    // ==================== EDITOR VIEW ====================

    if (editing) {
        return (
            <div className="roulette-page">
                <div className="roulette-editor-layout">
                    {/* ---- Sidebar ---- */}
                    <div className="editor-sidebar">
                        <button
                            className="btn-back"
                            onClick={() => {
                                setEditing(null);
                                setWinnerIndex(null);
                                setRotation(0);
                                setSpinning(false);
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="19" y1="12" x2="5" y2="12" />
                                <polyline points="12 19 5 12 12 5" />
                            </svg>
                            Назад
                        </button>

                        <div className="editor-header-info">
                            <h2 className="editor-roulette-name">{editing.name}</h2>
                            <span className="editor-segment-count">{editing.segments.length} секторов</span>
                        </div>

                        <div className="editor-tabs">
                            <button
                                className={`editor-tab ${activeTab === "segments" ? "active" : ""}`}
                                onClick={() => setActiveTab("segments")}
                            >
                                СЕКТОРА
                            </button>
                            <button
                                className={`editor-tab ${activeTab === "widget" ? "active" : ""}`}
                                onClick={() => setActiveTab("widget")}
                            >
                                ВИДЖЕТ
                            </button>
                        </div>

                        <div className="editor-content">
                            {/* ===== SEGMENTS TAB ===== */}
                            {activeTab === "segments" && (
                                <div className="settings-panel">
                                    <div className="segments-list">
                                        {editing.segments.map((seg) => (
                                            <div key={seg.id} className="segment-row">
                                                <div
                                                    className="segment-color-dot"
                                                    style={{ backgroundColor: seg.color }}
                                                />
                                                <div className="segment-info">
                                                    <input
                                                        className="segment-name-input"
                                                        value={seg.label}
                                                        onChange={(e) => handleSegmentChange(seg.id, "label", e.target.value)}
                                                    />
                                                    <div className="segment-weight-row">
                                                        <span className="setting-label-small">Вес:</span>
                                                        <input
                                                            type="range"
                                                            className="setting-range segment-weight-range"
                                                            min="1"
                                                            max="10"
                                                            value={seg.weight}
                                                            onChange={(e) =>
                                                                handleSegmentChange(seg.id, "weight", parseInt(e.target.value))
                                                            }
                                                        />
                                                        <span className="weight-val">{seg.weight}</span>
                                                    </div>
                                                </div>
                                                <div className="segment-actions">
                                                    <input
                                                        type="color"
                                                        className="seg-color-picker"
                                                        value={seg.color}
                                                        onChange={(e) => handleSegmentChange(seg.id, "color", e.target.value)}
                                                        title="Цвет сектора"
                                                    />
                                                    {editing.segments.length > 1 && (
                                                        <button
                                                            className="notification-action-btn delete"
                                                            onClick={() => handleDeleteSegment(seg.id)}
                                                            title="Удалить сектор"
                                                            style={{ width: '28px', height: '28px', borderRadius: '6px' }}
                                                        >
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <polyline points="3 6 5 6 21 6" />
                                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Add segment form */}
                                    {addingSegment ? (
                                        <div className="add-segment-form">
                                            <div className="setting-group">
                                                <label className="setting-label">Название приза</label>
                                                <input
                                                    className="setting-input"
                                                    placeholder="Например: PlayStation 5"
                                                    value={newSegLabel}
                                                    onChange={(e) => setNewSegLabel(e.target.value)}
                                                    onKeyDown={(e) => e.key === "Enter" && handleAddSegment()}
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="setting-group">
                                                <label className="setting-label">
                                                    Вес (вероятность)
                                                    <span className="setting-value">{newSegWeight}</span>
                                                </label>
                                                <input
                                                    type="range"
                                                    className="setting-range"
                                                    min="1"
                                                    max="10"
                                                    value={newSegWeight}
                                                    onChange={(e) => setNewSegWeight(parseInt(e.target.value))}
                                                />
                                            </div>
                                            <div className="setting-group">
                                                <label className="setting-label">Цвет</label>
                                                <div className="color-picker">
                                                    <input
                                                        type="color"
                                                        value={newSegColor}
                                                        onChange={(e) => setNewSegColor(e.target.value)}
                                                    />
                                                    <input
                                                        className="setting-input"
                                                        value={newSegColor}
                                                        onChange={(e) => setNewSegColor(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="add-seg-form-btns">
                                                <button className="btn-seg-cancel" onClick={() => setAddingSegment(false)}>
                                                    Отмена
                                                </button>
                                                <button className="btn-seg-save" onClick={handleAddSegment}>
                                                    Добавить
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            className="btn-add-segment"
                                            onClick={() => {
                                                setNewSegColor(DEFAULT_COLORS[editing.segments.length % DEFAULT_COLORS.length]);
                                                setAddingSegment(true);
                                            }}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <line x1="12" y1="5" x2="12" y2="19" />
                                                <line x1="5" y1="12" x2="19" y2="12" />
                                            </svg>
                                            Добавить сектор
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* ===== WIDGET TAB ===== */}
                            {activeTab === "widget" && (
                                <div className="settings-panel">

                                    {/* Shape selector */}
                                    <div className="setting-group">
                                        <label className="setting-label">Форма рулетки</label>
                                        <div className="shape-selector">
                                            <button
                                                className={`shape-btn ${editing.settings.shape === "rectangular" ? "active" : ""}`}
                                                onClick={() => handleSettingChange("shape", "rectangular")}
                                            >
                                                <svg width="36" height="22" viewBox="0 0 36 22" fill="none">
                                                    <rect x="1" y="1" width="34" height="20" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                                    <rect x="5" y="1" width="8" height="20" fill="currentColor" opacity="0.25" />
                                                    <rect x="15" y="1" width="8" height="20" fill="currentColor" opacity="0.45" />
                                                    <rect x="25" y="1" width="8" height="20" fill="currentColor" opacity="0.25" />
                                                    <line x1="18" y1="0" x2="18" y2="22" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
                                                </svg>
                                                Прямоугольная
                                            </button>
                                            <button
                                                className={`shape-btn ${editing.settings.shape === "circular" ? "active" : ""}`}
                                                onClick={() => handleSettingChange("shape", "circular")}
                                            >
                                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                                    <path d="M12 2 L12 12" stroke="currentColor" strokeWidth="1.5" />
                                                    <path d="M12 12 L19.7 7" stroke="currentColor" strokeWidth="1.5" />
                                                    <circle cx="12" cy="12" r="2" fill="currentColor" />
                                                </svg>
                                                Круглая
                                            </button>
                                        </div>
                                    </div>

                                    <div className="setting-group">
                                        <label className="setting-label">Минимальная сумма доната (₸)</label>
                                        <input
                                            type="number"
                                            className="setting-input"
                                            value={editing.settings.minAmount}
                                            min={1}
                                            onChange={(e) =>
                                                handleSettingChange("minAmount", parseInt(e.target.value) || 1)
                                            }
                                        />
                                        <div className="setting-hint">
                                            Донат ниже этой суммы не запустит рулетку
                                        </div>
                                    </div>

                                    <div className="setting-group">
                                        <label className="setting-label">Режим вращения</label>
                                        <select
                                            className="setting-select"
                                            value={editing.settings.spinMode}
                                            onChange={(e) =>
                                                handleSettingChange("spinMode", e.target.value as "fixed" | "per-amount")
                                            }
                                        >
                                            <option value="per-amount">За каждые N ₸ = 1 вращение</option>
                                            <option value="fixed">Любая сумма = 1 вращение</option>
                                        </select>
                                    </div>

                                    {editing.settings.spinMode === "per-amount" && (
                                        <div className="setting-group">
                                            <label className="setting-label">Стоимость 1 вращения (₸)</label>
                                            <input
                                                type="number"
                                                className="setting-input"
                                                value={editing.settings.spinCostPerAmount}
                                                min={1}
                                                onChange={(e) =>
                                                    handleSettingChange("spinCostPerAmount", parseInt(e.target.value) || 1)
                                                }
                                            />
                                            <div className="setting-hint">
                                                Донат 500 ₸ при стоимости 100 ₸ = 5 вращений
                                            </div>
                                        </div>
                                    )}

                                    <div className="setting-group">
                                        <label className="setting-label">
                                            Длительность вращения
                                            <span className="setting-value">{editing.settings.spinDuration} сек</span>
                                        </label>
                                        <input
                                            type="range"
                                            className="setting-range"
                                            min={3}
                                            max={15}
                                            value={editing.settings.spinDuration}
                                            onChange={(e) =>
                                                handleSettingChange("spinDuration", parseInt(e.target.value))
                                            }
                                        />
                                    </div>

                                    <div className="setting-group">
                                        <label className="setting-label">Звук при вращении</label>
                                        <div className="toggle-wrapper">
                                            <label className="notification-toggle">
                                                <input
                                                    type="checkbox"
                                                    checked={editing.settings.soundEnabled}
                                                    onChange={() =>
                                                        setEditing({
                                                            ...editing,
                                                            settings: {
                                                                ...editing.settings,
                                                                soundEnabled: !editing.settings.soundEnabled,
                                                            },
                                                        })
                                                    }
                                                />
                                                <span className="notification-toggle-slider" />
                                            </label>
                                            <span>{editing.settings.soundEnabled ? "Включён" : "Выключен"}</span>
                                        </div>
                                    </div>

                                    <div className="setting-group">
                                        <label className="setting-label">Показывать победителя</label>
                                        <div className="toggle-wrapper">
                                            <label className="notification-toggle">
                                                <input
                                                    type="checkbox"
                                                    checked={editing.settings.showWinner}
                                                    onChange={(e) =>
                                                        handleSettingChange("showWinner", e.target.checked)
                                                    }
                                                />
                                                <span className="notification-toggle-slider" />
                                            </label>
                                            <span>{editing.settings.showWinner ? "Да" : "Нет"}</span>
                                        </div>
                                    </div>

                                    <div className="setting-divider">Стиль рулетки</div>

                                    <div className="setting-group">
                                        <label className="setting-label">Цвет обводки / кольцо</label>
                                        <div className="color-picker-row">
                                            <input
                                                type="color"
                                                className="setting-color-input"
                                                value={editing.settings.borderColor}
                                                onChange={(e) => handleSettingChange("borderColor", e.target.value)}
                                            />
                                            <input
                                                type="text"
                                                className="setting-input setting-input-code"
                                                value={editing.settings.borderColor}
                                                onChange={(e) => handleSettingChange("borderColor", e.target.value)}
                                                maxLength={7}
                                            />
                                        </div>
                                    </div>

                                    <div className="setting-group">
                                        <label className="setting-label">Цвет указателя</label>
                                        <div className="color-picker-row">
                                            <input
                                                type="color"
                                                className="setting-color-input"
                                                value={editing.settings.pointerColor}
                                                onChange={(e) => handleSettingChange("pointerColor", e.target.value)}
                                            />
                                            <input
                                                type="text"
                                                className="setting-input setting-input-code"
                                                value={editing.settings.pointerColor}
                                                onChange={(e) => handleSettingChange("pointerColor", e.target.value)}
                                                maxLength={7}
                                            />
                                        </div>
                                    </div>

                                    <div className="setting-group">
                                        <label className="setting-label">Цвет центра (ступица)</label>
                                        <div className="color-picker-row">
                                            <input
                                                type="color"
                                                className="setting-color-input"
                                                value={editing.settings.hubColor}
                                                onChange={(e) => handleSettingChange("hubColor", e.target.value)}
                                            />
                                            <input
                                                type="text"
                                                className="setting-input setting-input-code"
                                                value={editing.settings.hubColor}
                                                onChange={(e) => handleSettingChange("hubColor", e.target.value)}
                                                maxLength={7}
                                            />
                                        </div>
                                    </div>

                                    <div className="setting-divider">URL виджета для OBS</div>
                                    <div className="widget-url-container">
                                        <input
                                            readOnly
                                            className="widget-url-input"
                                            value={editing.url}
                                        />
                                        <button
                                            className={`widget-copy-btn ${copiedId === editing.id ? "copied" : ""}`}
                                            onClick={() => handleCopyUrl(editing.url, editing.id)}
                                            title="Скопировать"
                                        >
                                            {copiedId === editing.id ? (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            ) : (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="9" y="9" width="13" height="13" rx="2" />
                                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ---- Preview ---- */}
                    <div className="editor-preview">
                        <div className="preview-header">
                            <span className="preview-subtitle">{editing.name}</span>
                        </div>

                        {editing.settings.shape === "circular" ? (
                            <RouletteWheel
                                segments={editing.segments}
                                spinning={spinning}
                                spinDuration={editing.settings.spinDuration}
                                winnerIndex={winnerIndex}
                                rotation={rotation}
                                borderColor={editing.settings.borderColor}
                                pointerColor={editing.settings.pointerColor}
                                hubColor={editing.settings.hubColor}
                            />
                        ) : (
                            <RouletteStrip
                                segments={editing.segments}
                                spinning={spinning}
                                spinDuration={editing.settings.spinDuration}
                                winnerIndex={winnerIndex}
                                stripOffset={stripOffset}
                                borderColor={editing.settings.borderColor}
                                pointerColor={editing.settings.pointerColor}
                            />
                        )}

                        <button
                            className={`btn-spin-preview ${spinning ? "spinning" : ""}`}
                            onClick={handleSpin}
                            disabled={spinning}
                        >
                            {spinning ? (
                                <>
                                    <svg className="spin-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                    </svg>
                                    Вращение...
                                </>
                            ) : (
                                <>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <polygon points="5 3 19 12 5 21 5 3" />
                                    </svg>
                                    КРУТИТЬ
                                </>
                            )}
                        </button>

                        {/* Segment legend */}
                        <div className="segment-legend">
                            {buildSegments(editing.segments).map((seg) => {
                                const total = editing.segments.reduce((s, x) => s + x.weight, 0);
                                const pct = Math.round((seg.weight / total) * 100);
                                return (
                                    <div key={seg.id} className="legend-item">
                                        <span className="legend-dot" style={{ backgroundColor: seg.color }} />
                                        <span className="legend-label">{seg.label}</span>
                                        <span className="legend-pct">{pct}%</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ==================== LIST VIEW ====================

    return (
        <div className="roulette-page">
            <div className="roulette-page-header">
                <h1 className="roulette-page-title">Рулетка</h1>
                <button className="add-roulette-btn" onClick={() => setIsAddModalOpen(true)}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Добавить рулетку
                </button>
            </div>

            {roulettes.length === 0 ? (
                <div className="empty-roulette-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 2 L12 12 L17 7" />
                        <circle cx="12" cy="12" r="2" fill="currentColor" />
                    </svg>
                    <p>У вас ещё нет рулеток</p>
                    <button className="add-roulette-btn-empty" onClick={() => setIsAddModalOpen(true)}>
                        Создать первую рулетку
                    </button>
                </div>
            ) : (
                <div className="roulettes-container">
                    {roulettes.map((r) => (
                        <div key={r.id} className={`roulette-card ${r.isEnabled ? "" : "disabled"}`}>
                            <div className="roulette-card-header">
                                <div className="roulette-card-info">
                                    <div className="roulette-card-title-row">
                                        {/* Mini wheel preview */}
                                        <div className="mini-wheel">
                                            <svg width="44" height="44" viewBox="0 0 400 400">
                                                {buildSegments(r.segments).map((seg) => (
                                                    <path
                                                        key={seg.id}
                                                        d={describeArc(200, 200, 180, seg.startAngle, seg.startAngle + seg.angle)}
                                                        fill={seg.color}
                                                        stroke="#1a1a1a"
                                                        strokeWidth="4"
                                                    />
                                                ))}
                                                <circle cx="200" cy="200" r="60" fill="#1a1a1a" />
                                                <circle cx="200" cy="200" r="30" fill="#88b702" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h3 className="roulette-card-name">{r.name}</h3>
                                            <p className="roulette-card-meta">
                                                {r.segments.length} секторов · от {r.settings.minAmount} ₸
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="roulette-card-actions">
                                    {/* Enable/disable toggle */}
                                    <label className="notification-toggle" title={r.isEnabled ? "Отключить" : "Включить"}>
                                        <input
                                            type="checkbox"
                                            checked={r.isEnabled}
                                            onChange={() => handleToggle(r.id)}
                                        />
                                        <span className="notification-toggle-slider" />
                                    </label>

                                    <button
                                        className="notification-action-btn"
                                        onClick={() => openEditor(r)}
                                        title="Настроить"
                                    >
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                    </button>

                                    <button
                                        className="notification-action-btn delete"
                                        onClick={() => handleDelete(r.id)}
                                        title="Удалить"
                                    >
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                        >
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Segment pills */}
                            <div className="segment-pills">
                                {r.segments.map((seg) => (
                                    <span key={seg.id} className="segment-pill" style={{ borderColor: seg.color, color: seg.color }}>
                                        <span className="pill-dot" style={{ backgroundColor: seg.color }} />
                                        {seg.label}
                                    </span>
                                ))}
                            </div>

                            {/* URL */}
                            <div className="roulette-card-footer">
                                <button className="btn-toggle-url" onClick={() => toggleShowUrl(r.id)}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        {showUrl[r.id] ? (
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                        ) : (
                                            <>
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </>
                                        )}
                                    </svg>
                                    {showUrl[r.id] ? "Скрыть ссылку" : "Показать ссылку виджета"}
                                </button>
                                {showUrl[r.id] && (
                                    <div className="widget-url-container">
                                        <input readOnly className="widget-url-input" value={r.url} />
                                        <button
                                            className={`widget-copy-btn ${copiedId === r.id ? "copied" : ""}`}
                                            onClick={() => handleCopyUrl(r.url, r.id)}
                                        >
                                            {copiedId === r.id ? (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            ) : (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <rect x="9" y="9" width="13" height="13" rx="2" />
                                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ---- Add Modal ---- */}
            {isAddModalOpen && (
                <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Новая рулетка</h2>
                            <button className="modal-close-btn" onClick={() => setIsAddModalOpen(false)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label className="form-label">Название рулетки</label>
                                <input
                                    className="form-input"
                                    placeholder="Например: Призовая рулетка"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleAddRoulette()}
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Минимальная сумма доната (₸)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    placeholder="100"
                                    value={newMinAmount}
                                    onChange={(e) => setNewMinAmount(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="modal-btn modal-btn-cancel" onClick={() => setIsAddModalOpen(false)}>
                                Отмена
                            </button>
                            <button className="modal-btn modal-btn-save" onClick={handleAddRoulette}>
                                Создать
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoulettePage;
