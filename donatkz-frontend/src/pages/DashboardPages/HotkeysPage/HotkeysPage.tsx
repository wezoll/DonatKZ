import React, { useState, useEffect } from 'react';
import './HotkeysPage.css';

// ==================== TYPES ====================

interface HotkeyConfig {
    id: number;
    keys: string[];       // e.g. ['Ctrl', 'Shift', 'S']
    amount: number;        // exact donation amount that triggers this hotkey
    isEnabled: boolean;
}

// ==================== INITIAL DATA ====================

const INITIAL_HOTKEYS: HotkeyConfig[] = [
    { id: 1, keys: ['Alt', 'TAB'], amount: 500, isEnabled: true },
    { id: 2, keys: ['Ctrl', 'Shift', 'S'], amount: 1000, isEnabled: true },
];

// ==================== COMPONENT ====================

const HotkeysPage: React.FC = () => {
    const [hotkeys, setHotkeys] = useState<HotkeyConfig[]>(INITIAL_HOTKEYS);

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [modalKeys, setModalKeys] = useState<string[]>([]);
    const [modalAmount, setModalAmount] = useState<number>(100);
    const [isRecording, setIsRecording] = useState(false);
    const [manualMode, setManualMode] = useState(false);
    const [manualText, setManualText] = useState('');

    // Delete confirm
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    // ---- handlers ----

    const handleToggle = (id: number) => {
        setHotkeys(prev => prev.map(h => h.id === id ? { ...h, isEnabled: !h.isEnabled } : h));
    };

    const handleDelete = (id: number) => {
        setHotkeys(prev => prev.filter(h => h.id !== id));
        setDeleteConfirmId(null);
    };

    const openAddModal = () => {
        setEditingId(null);
        setModalKeys([]);
        setModalAmount(100);
        setIsRecording(false);
        setManualMode(false);
        setManualText('');
        setIsModalOpen(true);
    };

    const openEditModal = (hk: HotkeyConfig) => {
        setEditingId(hk.id);
        setModalKeys(hk.keys);
        setModalAmount(hk.amount);
        setIsRecording(false);
        setManualMode(false);
        setManualText(hk.keys.join(' + '));
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setIsRecording(false);
    };

    const handleSave = () => {
        // Determine final keys from either mode
        let finalKeys = modalKeys;
        if (manualMode) {
            finalKeys = manualText
                .split('+')
                .map(k => k.trim())
                .filter(k => k.length > 0);
        }

        if (finalKeys.length === 0) return;
        if (modalAmount < 1) return;

        if (editingId !== null) {
            setHotkeys(prev => prev.map(h =>
                h.id === editingId ? { ...h, keys: finalKeys, amount: modalAmount } : h
            ));
        } else {
            const newId = hotkeys.length > 0 ? Math.max(...hotkeys.map(h => h.id)) + 1 : 1;
            setHotkeys(prev => [...prev, { id: newId, keys: finalKeys, amount: modalAmount, isEnabled: true }]);
        }
        closeModal();
    };

    // ---- key recording via native window listener (capture phase) ----

    useEffect(() => {
        if (!isRecording) return;

        const handler = (e: KeyboardEvent) => {
            // Capture phase + these two lines block nearly all browser shortcuts
            e.preventDefault();
            e.stopImmediatePropagation();

            const key = e.key;

            if (key === 'Escape') {
                setIsRecording(false);
                return;
            }
            if (key === 'Enter') {
                setIsRecording(false);
                return;
            }

            // Build the combo from the current modifier state + the pressed key
            const combo: string[] = [];
            if (e.ctrlKey) combo.push('Ctrl');
            if (e.shiftKey) combo.push('Shift');
            if (e.altKey) combo.push('Alt');
            if (e.metaKey) combo.push('Meta');

            // Don't add modifier-only presses as standalone keys
            const isModifier = ['Control', 'Shift', 'Alt', 'Meta'].includes(key);
            if (!isModifier) {
                const display = key === ' ' ? 'Space' : key.length === 1 ? key.toUpperCase() : key;
                combo.push(display);
            }

            // Only update if we have at least something
            if (combo.length > 0) {
                setModalKeys(combo);
            }

            // If a non-modifier key was pressed, automatically stop recording
            // (the user pressed the full combo)
            if (!isModifier) {
                setIsRecording(false);
            }
        };

        // Attach on capture phase so we run BEFORE the browser handles the shortcut
        window.addEventListener('keydown', handler, true);
        return () => window.removeEventListener('keydown', handler, true);
    }, [isRecording]);

    const formatKeys = (keys: string[]) => keys.length === 0 ? '—' : keys.join(' + ');

    // ==================== RENDER ====================

    return (
        <div className="hotkeys-page">
            {/* Header */}
            <div className="hotkeys-page-header">
                <h1 className="hotkeys-page-title">Горячие клавиши</h1>
                <button className="add-hotkey-btn" onClick={openAddModal}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Добавить
                </button>
            </div>

            {/* Description */}
            <div className="hotkeys-description">
                Настройте сочетания клавиш, которые будут автоматически нажиматься на вашем компьютере
                при получении доната определённой суммы. Например: донат 500 ₸ → нажимается Alt+Tab.
            </div>

            {/* List */}
            {hotkeys.length === 0 ? (
                <div className="empty-hotkeys-state">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <line x1="6" y1="8" x2="6.01" y2="8" />
                        <line x1="10" y1="8" x2="10.01" y2="8" />
                        <line x1="14" y1="8" x2="14.01" y2="8" />
                        <line x1="18" y1="8" x2="18.01" y2="8" />
                        <line x1="7" y1="16" x2="17" y2="16" />
                    </svg>
                    <p>Нет настроенных горячих клавиш</p>
                    <button className="add-hotkey-btn-empty" onClick={openAddModal}>
                        Добавить первое сочетание
                    </button>
                </div>
            ) : (
                <div className="hotkeys-container">
                    {hotkeys.map(hk => (
                        <div key={hk.id} className="hotkey-card">
                            <div className="hotkey-card-header">
                                <div className="hotkey-card-info">
                                    <div className="hotkey-keys-badge">{formatKeys(hk.keys)}</div>
                                    <p className="hotkey-card-amount">Сумма: {hk.amount} ₸</p>
                                </div>

                                <div className="hotkey-card-actions">
                                    <label className="notification-toggle">
                                        <input type="checkbox" checked={hk.isEnabled} onChange={() => handleToggle(hk.id)} />
                                        <span className="notification-toggle-slider"></span>
                                    </label>

                                    <button className="goal-action-btn" onClick={() => openEditModal(hk)} title="Редактировать">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                    </button>

                                    <button className="goal-delete-btn" onClick={() => setDeleteConfirmId(hk.id)} title="Удалить">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className="hotkey-card-body">
                                <div className="hotkey-info-row">
                                    <span className="hotkey-info-label">Статус</span>
                                    <span className={`hotkey-status ${hk.isEnabled ? 'active' : 'inactive'}`}>
                                        {hk.isEnabled ? 'Активно' : 'Выключено'}
                                    </span>
                                </div>
                                <div className="hotkey-info-row">
                                    <span className="hotkey-info-label">Триггер</span>
                                    <span className="hotkey-info-value">Донат ровно {hk.amount} ₸</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Delete confirm modal */}
            {deleteConfirmId !== null && (
                <div className="modal-backdrop">
                    <div className="modal-content" style={{ maxWidth: 400 }}>
                        <div className="modal-header">
                            <h2 className="modal-title">Удалить?</h2>
                            <button className="modal-close-btn" onClick={() => setDeleteConfirmId(null)}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div className="modal-body">
                            <p style={{ color: '#aaa', margin: 0, fontSize: 14 }}>Сочетание клавиш будет удалено без возможности восстановления.</p>
                        </div>
                        <div className="modal-footer">
                            <button className="modal-btn modal-btn-cancel" onClick={() => setDeleteConfirmId(null)}>Отмена</button>
                            <button className="modal-btn modal-btn-delete" onClick={() => handleDelete(deleteConfirmId)}>Удалить</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add / Edit modal */}
            {isModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="modal-title">{editingId ? 'Редактировать' : 'Новое сочетание клавиш'}</h2>
                            <button className="modal-close-btn" onClick={closeModal}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="form-group">
                                <div className="form-label-row">
                                    <label className="form-label">Сочетание клавиш</label>
                                    <button
                                        className="btn-mode-toggle"
                                        onClick={() => setManualMode(!manualMode)}
                                    >
                                        {manualMode ? 'Записать нажатием' : 'Ввести вручную'}
                                    </button>
                                </div>

                                {manualMode ? (
                                    <div className="manual-key-input">
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="Например: Alt + Tab"
                                            value={manualText}
                                            onChange={e => setManualText(e.target.value)}
                                        />
                                        <span className="form-hint">
                                            Введите клавиши через « + », например: Ctrl + Shift + S
                                        </span>
                                    </div>
                                ) : (
                                    <div
                                        className={`key-recorder ${isRecording ? 'recording' : ''}`}
                                        onClick={() => setIsRecording(true)}
                                    >
                                        {isRecording ? (
                                            <span className="key-recorder-pulse">Нажмите сочетание клавиш…</span>
                                        ) : (
                                            <div className="key-recorder-display">
                                                <span className="key-recorder-keys">
                                                    {modalKeys.length > 0 ? modalKeys.map((k, i) => (
                                                        <span key={i} className="key-cap">{k}</span>
                                                    )) : 'Нажмите сюда для записи'}
                                                </span>
                                                {modalKeys.length > 0 && (
                                                    <button
                                                        className="btn-clear-keys"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setModalKeys([]);
                                                        }}
                                                    >
                                                        Очистить
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Сумма доната (₸)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    min={1}
                                    value={modalAmount}
                                    onChange={e => setModalAmount(parseInt(e.target.value) || 0)}
                                    placeholder="500"
                                />
                                <span className="form-hint">
                                    Когда кто-то задонатит ровно эту сумму — указанные клавиши нажмутся на вашем ПК
                                </span>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="modal-btn modal-btn-cancel" onClick={closeModal}>Отмена</button>
                            <button className="modal-btn modal-btn-save" onClick={handleSave}>
                                {editingId ? 'Сохранить' : 'Добавить'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HotkeysPage;
