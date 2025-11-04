import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import './GoalWidgetPage.css';
import { goalApi, type Goal } from '../../api/goal.api';

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

const GoalWidgetPage: React.FC = () => {
  const { apiKey, id } = useParams<{ apiKey: string; id: string }>();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!apiKey || !id) {
      setError('API Key and Goal ID are required');
      return;
    }

    const loadGoal = () => {
      goalApi.getGoalForWidget(apiKey, parseInt(id))
        .then((data) => {
          setGoal(data);
          setError(null);
        })
        .catch((err) => {
          if (import.meta.env.DEV) {
            console.error('Failed to load goal:', err);
          }
          setError('Failed to load goal');
        });
    };

    loadGoal();

    // Обновлять каждые 30 секунд
    const interval = setInterval(loadGoal, 30000);

    return () => clearInterval(interval);
  }, [apiKey, id]);

  const parseTextStyle = (styleJson: string | TextStyle | undefined): TextStyle => {
    if (!styleJson) {
      return {
        fontFamily: "Montserrat",
        fontSize: 16,
        textColor: "#FFFFFF",
        isBold: false,
        isItalic: false,
        isUnderline: false,
        transform: "none",
        alignment: "center",
      };
    }
    return typeof styleJson === 'string' ? JSON.parse(styleJson) : styleJson;
  };

  const getTextStyle = (textStyleJson: string | TextStyle) => {
    const textStyle = parseTextStyle(textStyleJson);
    return {
      fontFamily: textStyle.fontFamily,
      fontSize: `${textStyle.fontSize}px`,
      color: textStyle.textColor,
      fontWeight: textStyle.isBold ? "bold" : "normal",
      fontStyle: textStyle.isItalic ? "italic" : "normal",
      textDecoration: textStyle.isUnderline ? "underline" : "none",
      textTransform: textStyle.transform as any,
      textAlign: textStyle.alignment as any,
    };
  };

  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  };

  const getProgressDisplayText = (goal: Goal) => {
    switch (goal.design.progressDisplay) {
      case "percent":
        return `${goal.percentage}%`;
      case "amount-total":
        return `${formatNumber(goal.collectedAmount)} / ${formatNumber(goal.targetAmount)} ₸`;
      case "amount-percent":
      default:
        return `${formatNumber(goal.collectedAmount)} ₸ (${goal.percentage}%)`;
    }
  };

  const getProgressBarStyle = (goal: Goal) => {
    const { design } = goal;

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

  if (error) {
    return <div className="goal-widget-container goal-widget-error">{error}</div>;
  }

  if (!goal) {
    return <div className="goal-widget-container goal-widget-loading">Loading...</div>;
  }

  return (
    <div className="goal-widget-container">
      <div
        className="goal-widget"
        style={{
          backgroundColor: goal.design.showBackground
            ? goal.design.backgroundColor
            : "transparent",
          padding: goal.design.showBackground ? "30px" : "0",
        }}
      >
        {goal.design.titlePosition === "top" && (
          <div
            style={getTextStyle(goal.design.titleTextStyle)}
            className="widget-goal-title"
          >
            {goal.title}
          </div>
        )}

        {goal.design.progressPosition === "top" && (
          <div
            style={getTextStyle(goal.design.progressTextStyle)}
            className="widget-goal-amount"
          >
            {getProgressDisplayText(goal)}
          </div>
        )}

        <div
          className="widget-goal-progress-bar"
          style={{
            height: `${goal.design.height}vw`,
            borderRadius: `${goal.design.borderRadius}vw`,
            backgroundColor: goal.design.backgroundColor,
            border:
              goal.design.strokeWidth > 0
                ? `${goal.design.strokeWidth}vw solid ${goal.design.strokeColor}`
                : "none",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            className="widget-goal-progress-fill"
            style={{
              width: `${goal.percentage}%`,
              borderRadius: `${goal.design.borderRadius}vw`,
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              ...getProgressBarStyle(goal),
            }}
          />
          {goal.design.progressPosition === "inside" && (
            <div
              style={{
                ...getTextStyle(goal.design.progressTextStyle),
                position: "relative",
                zIndex: 1,
              }}
              className="widget-goal-amount"
            >
              {getProgressDisplayText(goal)}
            </div>
          )}
        </div>

        {goal.design.progressPosition === "bottom" && (
          <div
            style={getTextStyle(goal.design.progressTextStyle)}
            className="widget-goal-amount"
          >
            {getProgressDisplayText(goal)}
          </div>
        )}

        {goal.design.titlePosition === "bottom" && (
          <div
            style={getTextStyle(goal.design.titleTextStyle)}
            className="widget-goal-title"
          >
            {goal.title}
          </div>
        )}
      </div>
    </div>
  );
};

export default GoalWidgetPage;

