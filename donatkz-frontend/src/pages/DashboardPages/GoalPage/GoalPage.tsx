import React, { useState, useEffect } from "react";
import "./GoalPage.css";
import { goalApi, type Goal, type GoalCreateRequest, type GoalUpdateRequest, type GoalDesignUpdateRequest } from "../../../api/goal.api";

interface TextStyle {
  fontFamily: string;
  fontSize: number;
  textColor: string;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  transform: "none" | "uppercase" | "lowercase";
  alignment: "left" | "center" | "right";
}

const GoalPage: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [newGoalDescription, setNewGoalDescription] = useState("");
  const [newGoalTarget, setNewGoalTarget] = useState("");
  const [newGoalCurrent, setNewGoalCurrent] = useState("");

  // Кастомизация прогресс-бара
  const [customColor, setCustomColor] = useState("#88b702");
  const [customStyle, setCustomStyle] = useState<
    "solid" | "gradient" | "animated"
  >("gradient");

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showUrl, setShowUrl] = useState<{ [key: string]: boolean }>({});
  const [activeTab, setActiveTab] = useState<"elements" | "indicator" | "font">(
    "elements"
  );
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const [styleModalType, setStyleModalType] = useState<"title" | "progress">(
    "title"
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [editGoalTitle, setEditGoalTitle] = useState("");
  const [editGoalDescription, setEditGoalDescription] = useState("");
  const [editGoalTarget, setEditGoalTarget] = useState("");
  const [editGoalCurrent, setEditGoalCurrent] = useState("");

  useEffect(() => {
    // Загружаем все цели пользователя
    goalApi.getAllGoals()
      .then((data) => {
        setGoals(data);
      })
      .catch((error) => {
        console.error("Failed to load goals:", error);
      });
  }, []);

  const handleAddGoal = () => {
    if (!newGoalTitle || !newGoalTarget) return;

    const request: GoalCreateRequest = {
      title: newGoalTitle,
      description: newGoalDescription,
      targetAmount: parseFloat(newGoalTarget),
    };

    goalApi.createGoal(request)
      .then((newGoal) => {
        setGoals([...goals, newGoal]);
        setIsAddModalOpen(false);
        setNewGoalTitle("");
        setNewGoalDescription("");
        setNewGoalTarget("");
        setNewGoalCurrent("");
      })
      .catch((error) => {
        console.error("Failed to create goal:", error);
        alert("Не удалось создать цель");
      });
  };

  const handleDeleteGoal = (id: number) => {
    if (!confirm("Вы уверены, что хотите удалить эту цель?")) return;

    goalApi.deleteGoal(id)
      .then(() => {
        setGoals(goals.filter((g) => g.id !== id));
      })
      .catch((error) => {
        console.error("Failed to delete goal:", error);
        alert("Не удалось удалить цель");
      });
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setEditGoalTitle(goal.title);
    setEditGoalDescription(goal.description || "");
    setEditGoalTarget(goal.targetAmount.toString());
    setEditGoalCurrent(goal.collectedAmount.toString());
    setIsEditModalOpen(true);
  };

  const handleSaveEditGoal = () => {
    if (!editingGoal || !editGoalTitle || !editGoalTarget) return;

    const request: GoalUpdateRequest = {
      title: editGoalTitle,
      description: editGoalDescription,
      targetAmount: parseFloat(editGoalTarget),
    };

    goalApi.updateGoal(editingGoal.id, request)
      .then((updatedGoal) => {
        setGoals(goals.map((g) => (g.id === editingGoal.id ? updatedGoal : g)));
        setIsEditModalOpen(false);
        setEditingGoal(null);
      })
      .catch((error) => {
        console.error("Failed to update goal:", error);
        alert("Не удалось обновить цель");
      });
  };

  const handleCustomizeGoal = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsCustomizeModalOpen(true);
  };

  const handleBackToList = () => {
    if (!selectedGoal) return;

    // Сохраняем дизайн перед выходом
    const designRequest: GoalDesignUpdateRequest = {
      height: selectedGoal.design.height,
      borderRadius: selectedGoal.design.borderRadius,
      strokeWidth: selectedGoal.design.strokeWidth,
      strokeColor: selectedGoal.design.strokeColor,
      backgroundColor: selectedGoal.design.backgroundColor,
      useGradient: selectedGoal.design.useGradient,
      gradientFillColor1: selectedGoal.design.gradientFillColor1,
      gradientFillColor2: selectedGoal.design.gradientFillColor2,
      gradientAngle: selectedGoal.design.gradientAngle,
      useColor: selectedGoal.design.useColor,
      showBackground: selectedGoal.design.showBackground,
      titlePosition: selectedGoal.design.titlePosition,
      progressPosition: selectedGoal.design.progressPosition,
      progressDisplay: selectedGoal.design.progressDisplay,
      titleTextStyle: selectedGoal.design.titleTextStyle,
      progressTextStyle: selectedGoal.design.progressTextStyle,
    };

    goalApi.updateGoalDesign(selectedGoal.id, designRequest)
      .then((updatedGoal) => {
        setGoals(goals.map((g) => (g.id === selectedGoal.id ? updatedGoal : g)));
        setIsCustomizeModalOpen(false);
        setSelectedGoal(null);
      })
      .catch((error) => {
        console.error("Failed to update goal design:", error);
        alert("Не удалось сохранить дизайн");
        setIsCustomizeModalOpen(false);
        setSelectedGoal(null);
      });
  };

  const handleCopyUrl = (url: string, goalId: number) => {
    navigator.clipboard.writeText(url);
    setCopiedId(goalId.toString());
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleShowUrl = (goalId: number) => {
    setShowUrl((prev) => ({
      ...prev,
      [goalId]: !prev[goalId],
    }));
  };

  const handleDesignChange = (key: string, value: any) => {
    if (!selectedGoal) return;

    const updatedGoal = {
      ...selectedGoal,
      design: {
        ...selectedGoal.design,
        [key]: value,
      },
    };

    setSelectedGoal(updatedGoal);
    // Обновляем локально для предпросмотра
    setGoals(goals.map((g) => (g.id === selectedGoal.id ? updatedGoal : g)));
  };

  const handleTextStyleChange = (
    type: "title" | "progress",
    key: keyof TextStyle,
    value: any
  ) => {
    if (!selectedGoal) return;

    const textKey = `${type}TextStyle`;
    
    // Parse JSON string to object
    const currentStyle = typeof selectedGoal.design[textKey as keyof typeof selectedGoal.design] === 'string' 
      ? JSON.parse(selectedGoal.design[textKey as keyof typeof selectedGoal.design] as string)
      : selectedGoal.design[textKey as keyof typeof selectedGoal.design];

    const updatedStyle = {
      ...currentStyle,
      [key]: value,
    };

    const updatedGoal = {
      ...selectedGoal,
      design: {
        ...selectedGoal.design,
        [textKey]: JSON.stringify(updatedStyle),
      },
    };

    setSelectedGoal(updatedGoal);
    setGoals(goals.map((g) => (g.id === selectedGoal.id ? updatedGoal : g)));
  };

  const openStyleModal = (type: "title" | "progress") => {
    setStyleModalType(type);
    setIsStyleModalOpen(true);
  };

  const parseTextStyle = (styleJson: string | TextStyle | undefined): TextStyle => {
    const defaultStyle: TextStyle = {
      fontFamily: "Montserrat",
      fontSize: 16,
      textColor: "#FFFFFF",
      isBold: false,
      isItalic: false,
      isUnderline: false,
      transform: "none",
      alignment: "center",
    };

    if (!styleJson) {
      return defaultStyle;
    }

    try {
      return typeof styleJson === 'string' ? JSON.parse(styleJson) : styleJson;
    } catch (error) {
      console.error("Failed to parse text style:", error);
      return defaultStyle;
    }
  };

  const getTextStyle = (textStyleJson: string | TextStyle | undefined) => {
    // Default style
    const defaultStyle = {
      fontFamily: "Montserrat",
      fontSize: "16px",
      color: "#FFFFFF",
      fontWeight: "normal",
      fontStyle: "normal",
      textDecoration: "none",
      textTransform: "none",
      textAlign: "center",
    };

    if (!textStyleJson) {
      return defaultStyle;
    }

    try {
      // Parse JSON string if needed
      const textStyle = typeof textStyleJson === 'string' 
        ? JSON.parse(textStyleJson) 
        : textStyleJson;
        
      if (!textStyle) {
        return defaultStyle;
      }
      
      return {
        fontFamily: textStyle.fontFamily || "Montserrat",
        fontSize: `${textStyle.fontSize || 16}px`,
        color: textStyle.textColor || "#FFFFFF",
        fontWeight: textStyle.isBold ? "bold" : "normal",
        fontStyle: textStyle.isItalic ? "italic" : "normal",
        textDecoration: textStyle.isUnderline ? "underline" : "none",
        textTransform: (textStyle.transform || "none") as any,
        textAlign: (textStyle.alignment || "center") as any,
      };
    } catch (error) {
      console.error("Failed to parse text style:", error);
      return defaultStyle;
    }
  };

  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  const getProgressDisplayText = (goal: Goal) => {
    switch (goal.design.progressDisplay) {
      case "percent":
        return `${goal.percentage}%`;
      case "amount-total":
        return `${formatNumber(goal.collectedAmount)} / ${formatNumber(
          goal.targetAmount
        )} ₸`;
      case "amount-percent":
      default:
        return `${formatNumber(goal.collectedAmount)} ₸ (${goal.percentage}%)`;
    }
  };

  const getProgressBarClass = (style: string) => {
    switch (style) {
      case "solid":
        return "progress-fill-solid";
      case "gradient":
        return "progress-fill-gradient";
      case "animated":
        return "progress-fill-animated";
      default:
        return "progress-fill-gradient";
    }
  };

  const getProgressBarStyle = () => {
    if (!selectedGoal) return {};

    const { design } = selectedGoal;

    if (design.useGradient) {
      return {
        backgroundImage: `linear-gradient(${design.gradientAngle}deg, ${design.gradientFillColor1} 0%, ${design.gradientFillColor2} 100%)`,
      };
    }

    if (design.useColor) {
      return {
        backgroundColor: design.gradientFillColor1,
      };
    }

    return {};
  };

  const toggleColorMode = () => {
    if (!selectedGoal) return;

    const newUseColor = !selectedGoal.design.useColor;

    // Обновляем оба поля одновременно в одном объекте
    const updatedGoal = {
      ...selectedGoal,
      design: {
        ...selectedGoal.design,
        useColor: newUseColor,
        useGradient: newUseColor ? false : selectedGoal.design.useGradient,
      },
    };

    setSelectedGoal(updatedGoal);
    setGoals(goals.map((g) => (g.id === selectedGoal.id ? updatedGoal : g)));
  };

  const toggleGradientMode = () => {
    if (!selectedGoal) return;

    const newUseGradient = !selectedGoal.design.useGradient;

    // Обновляем оба поля одновременно в одном объекте
    const updatedGoal = {
      ...selectedGoal,
      design: {
        ...selectedGoal.design,
        useGradient: newUseGradient,
        useColor: newUseGradient ? false : selectedGoal.design.useColor,
      },
    };

    setSelectedGoal(updatedGoal);
    setGoals(goals.map((g) => (g.id === selectedGoal.id ? updatedGoal : g)));
  };

  if (isCustomizeModalOpen && selectedGoal) {
    return (
      <div className="goal-page">
        <div className="widget-editor-layout">
          <div className="editor-sidebar">
            <button className="btn-back" onClick={handleBackToList}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Назад
            </button>

            <div className="editor-tabs">
              <button
                className={`editor-tab ${
                  activeTab === "elements" ? "active" : ""
                }`}
                onClick={() => setActiveTab("elements")}
              >
                НАСТРОЙКИ ЭЛЕМЕНТОВ
              </button>
              <button
                className={`editor-tab ${
                  activeTab === "indicator" ? "active" : ""
                }`}
                onClick={() => setActiveTab("indicator")}
              >
                ВИД ИНДИКАТОРА
              </button>
              <button
                className={`editor-tab ${activeTab === "font" ? "active" : ""}`}
                onClick={() => setActiveTab("font")}
              >
                НАСТРОЙКИ ШРИФТА
              </button>
            </div>

            <div className="editor-content">
              {activeTab === "elements" && (
                <div className="settings-panel">
                  <div className="setting-group">
                    <label className="setting-label">Заголовок сбора:</label>
                    <select
                      className="setting-select"
                      value={selectedGoal.design.titlePosition}
                      onChange={(e) =>
                        handleDesignChange("titlePosition", e.target.value)
                      }
                    >
                      <option value="top">Сверху</option>
                      <option value="bottom">Снизу</option>
                    </select>
                  </div>

                  <div className="setting-group">
                    <label className="setting-label">Прогресс сбора:</label>
                    <select
                      className="setting-select"
                      value={selectedGoal.design.progressPosition}
                      onChange={(e) =>
                        handleDesignChange("progressPosition", e.target.value)
                      }
                    >
                      <option value="top">Сверху</option>
                      <option value="inside">Внутри</option>
                      <option value="bottom">Снизу</option>
                    </select>
                  </div>

                  <div className="setting-group">
                    <label className="setting-label">
                      Вид прогресса сбора:
                    </label>
                    <select
                      className="setting-select"
                      value={selectedGoal.design.progressDisplay}
                      onChange={(e) =>
                        handleDesignChange("progressDisplay", e.target.value)
                      }
                    >
                      <option value="amount-percent">5 000 RUB (50%)</option>
                      <option value="percent">50%</option>
                      <option value="amount-total">5 000 / 10 000 RUB</option>
                    </select>
                  </div>
                </div>
              )}

              {activeTab === "indicator" && (
                <div className="design-panel">
                  <div className="setting-group">
                    <label className="setting-label">
                      Высота индикатора:
                      <span className="setting-value">
                        {selectedGoal.design.height} vw
                      </span>
                    </label>
                    <input
                      type="range"
                      className="setting-range"
                      min="1"
                      max="10"
                      step="0.5"
                      value={selectedGoal.design.height}
                      onChange={(e) =>
                        handleDesignChange("height", parseFloat(e.target.value))
                      }
                    />
                  </div>

                  <div className="setting-group">
                    <label className="setting-label">
                      Радиус закругления:
                      <span className="setting-value">
                        {selectedGoal.design.borderRadius} vw
                      </span>
                    </label>
                    <input
                      type="range"
                      className="setting-range"
                      min="0"
                      max="5"
                      step="0.5"
                      value={selectedGoal.design.borderRadius}
                      onChange={(e) =>
                        handleDesignChange(
                          "borderRadius",
                          parseFloat(e.target.value)
                        )
                      }
                    />
                  </div>

                  <div className="setting-group">
                    <label className="setting-label">
                      Толщина обводки индикатора:
                      <span className="setting-value">
                        {selectedGoal.design.strokeWidth} vw
                      </span>
                    </label>
                    <input
                      type="range"
                      className="setting-range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={selectedGoal.design.strokeWidth}
                      onChange={(e) =>
                        handleDesignChange(
                          "strokeWidth",
                          parseFloat(e.target.value)
                        )
                      }
                    />
                  </div>

                  <div className="setting-group">
                    <label className="setting-label">
                      Цвет обводки индикатора:
                    </label>
                    <div className="color-picker">
                      <input
                        type="color"
                        value={selectedGoal.design.strokeColor}
                        onChange={(e) =>
                          handleDesignChange("strokeColor", e.target.value)
                        }
                      />
                      <input
                        type="text"
                        className="setting-input"
                        value={selectedGoal.design.strokeColor}
                        onChange={(e) =>
                          handleDesignChange("strokeColor", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="setting-group">
                    <label className="setting-label">
                      Цвет фона индикатора:
                    </label>
                    <div className="color-picker">
                      <input
                        type="color"
                        value={selectedGoal.design.backgroundColor}
                        onChange={(e) =>
                          handleDesignChange("backgroundColor", e.target.value)
                        }
                      />
                      <input
                        type="text"
                        className="setting-input"
                        value={selectedGoal.design.backgroundColor}
                        onChange={(e) =>
                          handleDesignChange("backgroundColor", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="setting-group">
                    <button
                      className={`gradient-toggle-btn ${
                        selectedGoal.design.useColor ? "active" : ""
                      }`}
                      onClick={toggleColorMode}
                    >
                      Использовать цвет
                    </button>
                  </div>

                  {selectedGoal.design.useColor && (
                    <div className="setting-group">
                      <label className="setting-label">
                        Цвет заполнения индикатора:
                      </label>
                      <div className="color-picker">
                        <input
                          type="color"
                          value={selectedGoal.design.gradientFillColor1}
                          onChange={(e) =>
                            handleDesignChange(
                              "gradientFillColor1",
                              e.target.value
                            )
                          }
                        />
                        <input
                          type="text"
                          className="setting-input"
                          value={selectedGoal.design.gradientFillColor1}
                          onChange={(e) =>
                            handleDesignChange(
                              "gradientFillColor1",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                  )}

                  <div className="setting-group">
                    <button
                      className={`gradient-toggle-btn ${
                        selectedGoal.design.useGradient ? "active" : ""
                      }`}
                      onClick={toggleGradientMode}
                    >
                      Использовать градиент
                    </button>
                  </div>

                  {selectedGoal.design.useGradient && (
                    <>
                      <div className="setting-group">
                        <label className="setting-label">
                          Градиент заполнения индикатора:
                        </label>
                        <div className="color-picker">
                          <input
                            type="color"
                            value={selectedGoal.design.gradientFillColor1}
                            onChange={(e) =>
                              handleDesignChange(
                                "gradientFillColor1",
                                e.target.value
                              )
                            }
                          />
                          <input
                            type="text"
                            className="setting-input"
                            value={selectedGoal.design.gradientFillColor1}
                            onChange={(e) =>
                              handleDesignChange(
                                "gradientFillColor1",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>

                      <div className="setting-group">
                        <div className="color-picker">
                          <input
                            type="color"
                            value={selectedGoal.design.gradientFillColor2}
                            onChange={(e) =>
                              handleDesignChange(
                                "gradientFillColor2",
                                e.target.value
                              )
                            }
                          />
                          <input
                            type="text"
                            className="setting-input"
                            value={selectedGoal.design.gradientFillColor2}
                            onChange={(e) =>
                              handleDesignChange(
                                "gradientFillColor2",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </div>

                      <div className="setting-group">
                        <label className="setting-label">
                          Угол градиента
                          <span className="setting-value">
                            {selectedGoal.design.gradientAngle}°
                          </span>
                        </label>
                        <input
                          type="range"
                          className="setting-range"
                          min="0"
                          max="360"
                          value={selectedGoal.design.gradientAngle}
                          onChange={(e) =>
                            handleDesignChange(
                              "gradientAngle",
                              parseInt(e.target.value)
                            )
                          }
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === "font" && (
                <div className="design-panel">
                  <div className="setting-group">
                    <label className="setting-label">Заголовок сбора:</label>
                    <button
                      className="btn-style-editor"
                      onClick={() => openStyleModal("title")}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M4 7V4h16v3M9 20h6M12 4v16" />
                      </svg>
                      Стилизовать шрифт
                    </button>
                  </div>

                  <div className="setting-group">
                    <label className="setting-label">Прогресс сбора:</label>
                    <button
                      className="btn-style-editor"
                      onClick={() => openStyleModal("progress")}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M4 7V4h16v3M9 20h6M12 4v16" />
                      </svg>
                      Стилизовать шрифт
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button className="btn-create-widget" onClick={handleBackToList}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Сохранить изменения
            </button>
          </div>

          <div className="editor-preview">
            <div className="preview-header">
              <h3 className="preview-title">
                Превью: {selectedGoal?.title || "Цель"}
              </h3>
            </div>
            <div className="preview-area position-center">
              <div
                className="goal-preview-container"
                style={{
                  backgroundColor: selectedGoal.design.showBackground
                    ? selectedGoal.design.backgroundColor
                    : "transparent",
                  padding: selectedGoal.design.showBackground ? "30px" : "0",
                }}
              >
                {selectedGoal.design.titlePosition === "top" && (
                  <div
                    style={getTextStyle(selectedGoal.design.titleTextStyle)}
                    className="preview-goal-title"
                  >
                    {selectedGoal.title}
                  </div>
                )}

                {selectedGoal.design.progressPosition === "top" && (
                  <div
                    style={getTextStyle(selectedGoal.design.progressTextStyle)}
                    className="preview-goal-amount"
                  >
                    {getProgressDisplayText(selectedGoal)}
                  </div>
                )}

                <div
                  className="preview-goal-progress-bar"
                  style={{
                    height: `${selectedGoal.design.height}vw`,
                    borderRadius: `${selectedGoal.design.borderRadius}vw`,
                    backgroundColor: selectedGoal.design.backgroundColor,
                    border:
                      selectedGoal.design.strokeWidth > 0
                        ? `${selectedGoal.design.strokeWidth}vw solid ${selectedGoal.design.strokeColor}`
                        : "none",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div
                    className="preview-goal-progress-fill"
                    style={{
                      width: `${selectedGoal.percentage}%`,
                      borderRadius: `${selectedGoal.design.borderRadius}vw`,
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 0,
                      ...getProgressBarStyle(),
                    }}
                  />
                  {selectedGoal.design.progressPosition === "inside" && (
                    <div
                      style={{
                        ...getTextStyle(selectedGoal.design.progressTextStyle),
                        position: "relative",
                        zIndex: 1,
                      }}
                      className="preview-goal-amount"
                    >
                      {getProgressDisplayText(selectedGoal)}
                    </div>
                  )}
                </div>

                {selectedGoal.design.progressPosition === "bottom" && (
                  <div
                    style={getTextStyle(selectedGoal.design.progressTextStyle)}
                    className="preview-goal-amount"
                  >
                    {getProgressDisplayText(selectedGoal)}
                  </div>
                )}

                {selectedGoal.design.titlePosition === "bottom" && (
                  <div
                    style={getTextStyle(selectedGoal.design.titleTextStyle)}
                    className="preview-goal-title"
                  >
                    {selectedGoal.title}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Style Modal */}
        {isStyleModalOpen && (
          <div
            className="style-modal-overlay"
            onClick={() => setIsStyleModalOpen(false)}
          >
            <div className="style-modal" onClick={(e) => e.stopPropagation()}>
              <div className="style-modal-header">
                <h3>Стилизовать шрифт</h3>
                <button
                  className="btn-close-modal"
                  onClick={() => setIsStyleModalOpen(false)}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="style-modal-content">
                <div className="setting-group">
                  <label className="setting-label">Шрифт</label>
                  <select
                    className="setting-select"
                    value={
                      parseTextStyle(selectedGoal?.design[`${styleModalType}TextStyle` as keyof typeof selectedGoal.design] as string).fontFamily
                    }
                    onChange={(e) =>
                      handleTextStyleChange(
                        styleModalType,
                        "fontFamily",
                        e.target.value
                      )
                    }
                  >
                    <option value="Montserrat">Montserrat</option>
                    <option value="Rubik">Rubik</option>
                    <option value="Arial">Arial</option>
                    <option value="Roboto">Roboto</option>
                  </select>
                </div>

                <div className="setting-group">
                  <label className="setting-label">Цвет текста</label>
                  <div className="color-picker">
                    <input
                      type="color"
                      value={
                        parseTextStyle(selectedGoal?.design[`${styleModalType}TextStyle` as keyof typeof selectedGoal.design] as string).textColor
                      }
                      onChange={(e) =>
                        handleTextStyleChange(
                          styleModalType,
                          "textColor",
                          e.target.value
                        )
                      }
                    />
                    <input
                      type="text"
                      className="setting-input"
                      value={
                        parseTextStyle(selectedGoal?.design[`${styleModalType}TextStyle` as keyof typeof selectedGoal.design] as string).textColor
                      }
                      onChange={(e) =>
                        handleTextStyleChange(
                          styleModalType,
                          "textColor",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>

                <div className="setting-group">
                  <label className="setting-label">Стиль текста</label>
                  <div className="style-buttons">
                    <button
                      className={`style-btn ${
                        parseTextStyle(selectedGoal?.design[`${styleModalType}TextStyle` as keyof typeof selectedGoal.design] as string).isBold
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        handleTextStyleChange(
                          styleModalType,
                          "isBold",
                          !parseTextStyle(selectedGoal?.design[`${styleModalType}TextStyle` as keyof typeof selectedGoal.design] as string).isBold
                        )
                      }
                    >
                      <strong>B</strong>
                    </button>
                    <button
                      className={`style-btn ${
                        parseTextStyle(selectedGoal?.design[`${styleModalType}TextStyle` as keyof typeof selectedGoal.design] as string).isItalic
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        handleTextStyleChange(
                          styleModalType,
                          "isItalic",
                          !parseTextStyle(selectedGoal?.design[`${styleModalType}TextStyle` as keyof typeof selectedGoal.design] as string).isItalic
                        )
                      }
                    >
                      <em>I</em>
                    </button>
                    <button
                      className={`style-btn ${
                        parseTextStyle(selectedGoal?.design[`${styleModalType}TextStyle` as keyof typeof selectedGoal.design] as string).isUnderline
                          ? "active"
                          : ""
                      }`}
                      onClick={() =>
                        handleTextStyleChange(
                          styleModalType,
                          "isUnderline",
                          !parseTextStyle(selectedGoal?.design[`${styleModalType}TextStyle` as keyof typeof selectedGoal.design] as string).isUnderline
                        )
                      }
                    >
                      <u>U</u>
                    </button>
                  </div>
                </div>

                <div className="setting-group">
                  <label className="setting-label">Трансформация</label>
                  <select
                    className="setting-select"
                    value={
                      parseTextStyle(selectedGoal?.design[`${styleModalType}TextStyle` as keyof typeof selectedGoal.design] as string).transform
                    }
                    onChange={(e) =>
                      handleTextStyleChange(
                        styleModalType,
                        "transform",
                        e.target.value
                      )
                    }
                  >
                    <option value="none">None</option>
                    <option value="uppercase">Uppercase</option>
                    <option value="lowercase">Lowercase</option>
                  </select>
                </div>

                <div className="setting-group">
                  <label className="setting-label">
                    Горизонт. выравнивание
                  </label>
                  <select
                    className="setting-select"
                    value={
                      parseTextStyle(selectedGoal?.design[`${styleModalType}TextStyle` as keyof typeof selectedGoal.design] as string).alignment
                    }
                    onChange={(e) =>
                      handleTextStyleChange(
                        styleModalType,
                        "alignment",
                        e.target.value
                      )
                    }
                  >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                  </select>
                </div>

                <div className="setting-group">
                  <label className="setting-label">
                    Размер текста
                    <span className="setting-value">
                      {parseTextStyle(selectedGoal?.design[`${styleModalType}TextStyle` as keyof typeof selectedGoal.design] as string).fontSize}
                      px
                    </span>
                  </label>
                  <input
                    type="range"
                    className="setting-range"
                    min="12"
                    max="48"
                    value={
                      parseTextStyle(selectedGoal?.design[`${styleModalType}TextStyle` as keyof typeof selectedGoal.design] as string).fontSize
                    }
                    onChange={(e) =>
                      handleTextStyleChange(
                        styleModalType,
                        "fontSize",
                        parseInt(e.target.value)
                      )
                    }
                  />
                </div>
              </div>

              <button
                className="btn-save-style"
                onClick={() => setIsStyleModalOpen(false)}
              >
                Сохранить
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="goal-page">
      {/* Header */}
      <div className="goal-page-header">
        <h1 className="goal-page-title">Активные цели</h1>
        <button
          className="add-goal-btn"
          onClick={() => setIsAddModalOpen(true)}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Добавить цель
        </button>
      </div>

      {/* Goals List */}
      <div className="goals-container">
        {goals.length === 0 ? (
          <div className="empty-goals-state">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <p>У вас пока нет активных целей</p>
            <button
              className="add-goal-btn-empty"
              onClick={() => setIsAddModalOpen(true)}
            >
              Создать первую цель
            </button>
          </div>
        ) : (
          goals.map((goal) => (
            <div key={goal.id} className="goal-card">
              <div className="goal-card-header">
                <div className="goal-card-info">
                  <h3 className="goal-card-title">{goal.title}</h3>
                  <p className="goal-card-description">{goal.description}</p>
                </div>
                <div className="goal-card-actions">
                  <button
                    className="goal-action-btn"
                    onClick={() => handleEditGoal(goal)}
                    title="Редактировать цель"
                  >
                    <svg
                      width="20"
                      height="20"
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
                    className="goal-delete-btn"
                    onClick={() => handleDeleteGoal(goal.id)}
                    title="Удалить цель"
                  >
                    <svg
                      width="20"
                      height="20"
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

              <div className="goal-amounts">
                <div className="goal-amount-box">
                  <span className="goal-amount-label">Целевая сумма</span>
                  <input
                    type="text"
                    className="goal-amount-input"
                    value={formatNumber(goal.targetAmount)}
                    readOnly
                  />
                </div>
                <div className="goal-amount-box">
                  <span className="goal-amount-label">Собрано</span>
                  <input
                    type="text"
                    className="goal-amount-input"
                    value={formatNumber(goal.collectedAmount)}
                    readOnly
                  />
                </div>
              </div>

              <div className="goal-progress-section">
                <div className="goal-progress-header">
                  <span className="goal-progress-label">Прогресс</span>
                  <span className="goal-progress-percentage">
                    {goal.percentage}%
                  </span>
                </div>
                <div className="goal-progress-bar">
                  <div
                    className={`goal-progress-fill ${getProgressBarClass(
                      goal.progressBarStyle
                    )}`}
                    style={{
                      width: `${goal.percentage}%`,
                      backgroundColor:
                        goal.progressBarStyle === "solid"
                          ? goal.progressBarColor
                          : undefined,
                      backgroundImage:
                        goal.progressBarStyle === "gradient"
                          ? `linear-gradient(90deg, ${goal.progressBarColor} 0%, ${goal.progressBarColor}dd 100%)`
                          : undefined,
                    }}
                  />
                </div>
                <div className="goal-progress-amounts">
                  <span>₸{formatNumber(goal.collectedAmount)}</span>
                  <span>₸{formatNumber(goal.targetAmount)}</span>
                </div>
              </div>

              <div className="goal-actions">
                <button
                  className="customize-btn"
                  onClick={() => handleCustomizeGoal(goal)}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  Кастомизировать прогресс-бар
                </button>

                <button
                  className="btn-toggle-url"
                  onClick={() => toggleShowUrl(goal.id)}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    {showUrl[goal.id] ? (
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                  {showUrl[goal.id]
                    ? "Скрыть ссылку"
                    : "Показать ссылку виджета"}
                </button>

                {showUrl[goal.id] && (
                  <div className="widget-url-container">
                    <input
                      type="text"
                      value={goal.widgetUrl}
                      readOnly
                      className="widget-url-input"
                    />
                    <button
                      className={`widget-copy-btn ${
                        copiedId === goal.id.toString() ? "copied" : ""
                      }`}
                      onClick={() => handleCopyUrl(goal.widgetUrl, goal.id)}
                    >
                      {copiedId === goal.id.toString() ? (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect
                            x="9"
                            y="9"
                            width="13"
                            height="13"
                            rx="2"
                            ry="2"
                          />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Goal Modal */}
      {isAddModalOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Добавить новую цель</h2>
              <button
                className="modal-close-btn"
                onClick={() => setIsAddModalOpen(false)}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Название цели</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Например: Новая веб-камера"
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Описание</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Для улучшения качества стримов"
                  value={newGoalDescription}
                  onChange={(e) => setNewGoalDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Целевая сумма (₸)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="150000"
                  value={newGoalTarget}
                  onChange={(e) => setNewGoalTarget(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Текущая сумма (₸)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0"
                  value={newGoalCurrent}
                  onChange={(e) => setNewGoalCurrent(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="modal-btn modal-btn-cancel"
                onClick={() => setIsAddModalOpen(false)}
              >
                Отмена
              </button>
              <button
                className="modal-btn modal-btn-save"
                onClick={handleAddGoal}
              >
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Goal Modal */}
      {isEditModalOpen && editingGoal && (
        <div
          className="modal-backdrop"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Редактировать цель</h2>
              <button
                className="modal-close-btn"
                onClick={() => setIsEditModalOpen(false)}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Название цели</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Например: Новая веб-камера"
                  value={editGoalTitle}
                  onChange={(e) => setEditGoalTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Описание</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Для улучшения качества стримов"
                  value={editGoalDescription}
                  onChange={(e) => setEditGoalDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Целевая сумма (₸)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="150000"
                  value={editGoalTarget}
                  onChange={(e) => setEditGoalTarget(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Текущая сумма (₸)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0"
                  value={editGoalCurrent}
                  onChange={(e) => setEditGoalCurrent(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="modal-btn modal-btn-cancel"
                onClick={() => setIsEditModalOpen(false)}
              >
                Отмена
              </button>
              <button
                className="modal-btn modal-btn-save"
                onClick={handleSaveEditGoal}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalPage;
