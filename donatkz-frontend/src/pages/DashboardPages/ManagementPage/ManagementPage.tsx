import React, { useState, useMemo, useEffect } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import "./ManagementPage.css";
import { donationsApi } from "../../../api/donations.api";
import { goalApi, type Goal } from "../../../api/goal.api";

const ManagementPage: React.FC = () => {
    const [timePeriod, setTimePeriod] = useState<"24h" | "7d" | "month" | "year">("month");
    const [statsPeriod, setStatsPeriod] = useState<"24h" | "7d" | "month" | "year">("24h");
    const [donationsPeriod, setDonationsPeriod] = useState<"24h" | "7d" | "month" | "year">("month");
    const [isDonationsFilterOpen, setIsDonationsFilterOpen] = useState(false);
    const filterRef = React.useRef<HTMLDivElement>(null);

    // State для данных из API
    const [chartData, setChartData] = useState<Array<{ time: string; value: number }>>([]);
    const [allDonations, setAllDonations] = useState<Array<{
        id: number;
        name: string;
        amount: number;
        message: string;
        time: string;
    }>>([]);
    const [statistics, setStatistics] = useState<{
        donationsCount: number;
        totalAmount: number;
    } | null>(null);
    const [goalDetails, setGoalDetails] = useState<Goal>({
        title: "НЕТ ЦЕЛИ",
        targetAmount: 0,
        collectedAmount: 0,
        percentage: 0,
        remaining: 0,
    });
    const [isChartLoading, setIsChartLoading] = useState(false);
    const [isDonationsLoading, setIsDonationsLoading] = useState(false);
    const [isStatsLoading, setIsStatsLoading] = useState(false);
    const [isGoalLoading, setIsGoalLoading] = useState(false);

    // Загрузка данных графика при изменении периода
    useEffect(() => {
        setIsChartLoading(true);
        donationsApi.getChartData(timePeriod)
            .then((data) => {
                setChartData(data);
                setIsChartLoading(false);
            })
            .catch((err) => {
                console.error("Failed to load chart data:", err);
                setIsChartLoading(false);
            });
    }, [timePeriod]);

    // Загрузка донатов при изменении периода
    useEffect(() => {
        setIsDonationsLoading(true);
        donationsApi.getDonations(donationsPeriod, 0, 100)
            .then((response) => {
                // Маппинг API данных в формат компонента
                const mappedDonations = response.content.map((donation) => ({
                    id: donation.id,
                    name: donation.senderName,
                    amount: donation.amount,
                    message: donation.message || "",
                    time: new Date(donation.timestamp).toLocaleString("ru-RU", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                    }),
                }));
                setAllDonations(mappedDonations);
                setIsDonationsLoading(false);
            })
            .catch((err) => {
                console.error("Failed to load donations:", err);
                setIsDonationsLoading(false);
            });
    }, [donationsPeriod]);

    // Загрузка статистики при изменении периода
    useEffect(() => {
        setIsStatsLoading(true);
        donationsApi.getStats(statsPeriod)
            .then((data) => {
                setStatistics({
                    donationsCount: data.totalCount,
                    totalAmount: data.totalAmount,
                });
                setIsStatsLoading(false);
            })
            .catch((err) => {
                console.error("Failed to load statistics:", err);
                setIsStatsLoading(false);
            });
    }, [statsPeriod]);

    // Загрузка цели сбора при монтировании
    useEffect(() => {
        setIsGoalLoading(true);
        goalApi.getGoal()
            .then((data) => {
                setGoalDetails(data);
                setIsGoalLoading(false);
            })
            .catch((err) => {
                console.error("Failed to load goal:", err);
                setIsGoalLoading(false);
            });
    }, []);

    // Close filter dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                filterRef.current &&
                !filterRef.current.contains(event.target as Node)
            ) {
                setIsDonationsFilterOpen(false);
            }
        };

        if (isDonationsFilterOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }
    }, [isDonationsFilterOpen]);

    const recentDonations = useMemo(() => {
        return allDonations;
    }, [allDonations]);

    const goalData = useMemo(() => {
        const target = goalDetails.targetAmount;

        if (target === 0) {
            return [
                { name: "Собрано", value: 0, fill: "#88b702" },
                { name: "Осталось", value: 100, fill: "#3a3a2a" },
            ];
        }

        const collectedPercent = goalDetails.percentage;
        const remainingPercent = Math.max(0, 100 - collectedPercent);

        return [
            { name: "Собрано", value: collectedPercent, fill: "#88b702" },
            { name: "Осталось", value: remainingPercent, fill: "#3a3a2a" },
        ];
    }, [goalDetails]);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip">
                    <div className="tooltip-value">
                        {payload[0].value.toLocaleString()} ₸
                    </div>
                    <div className="tooltip-date">{payload[0].payload.time}</div>
                </div>
            );
        }
        return null;
    };

    // Open donations in a new popup window
    const openDonationsWindow = () => {
        const width = 500;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const popup = window.open(
            "",
            "DonationsWindow",
            `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
        );

        if (popup) {
            popup.document.write(`
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Последние донаты</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background-color: #1a1a1a;
          color: #ffffff;
          padding: 20px;
          overflow-y: auto;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #88b702;
        }
        h1 {
          font-size: 24px;
          font-weight: 600;
          color: #fff;
        }
        .donations-container {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .donation-card {
          background-color: #1c1c1c;
          border-radius: 10px;
          padding: 16px;
          border-left: 3px solid #88b702;
          transition: all 0.2s;
        }
        .donation-card:hover {
          background-color: #252525;
          transform: translateX(2px);
        }
        .donation-name {
          font-weight: 600;
          color: #88b702;
          font-size: 15px;
          margin-bottom: 6px;
        }
        .donation-amount {
          font-size: 14px;
          font-weight: 500;
          color: #fff;
          margin-bottom: 8px;
        }
        .donation-message {
          font-size: 16px;
          color: #d9d9d9;
          line-height: 1.4;
          margin-bottom: 6px;
        }
        .donation-time {
          font-size: 11px;
          color: #666;
        }
        ::-webkit-scrollbar {
          display: none;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Последние донаты</h1>
      </div>
      
      <div id="donations-list" class="donations-container"></div>

      <script>
        const allDonations = ${JSON.stringify(allDonations)};

        function renderDonations(donations) {
          const container = document.getElementById('donations-list');
          container.innerHTML = donations.map(donation => \`
            <div class="donation-card">
              <div class="donation-name">\${donation.name}</div>
              <div class="donation-amount">отправил \${donation.amount.toLocaleString()} ₸</div>
              <div class="donation-message">\${donation.message}</div>
              <div class="donation-time">\${donation.time}</div>
            </div>
          \`).join('');
        }

        // Initial render
        renderDonations(allDonations);
      </script>
    </body>
    </html>
  `);
            popup.document.close();
        }
    };

    return (
        <div className="management-page">
            <div className="management-grid">
                {/* График динамики */}
                <div className="management-section dynamics-section">
                    <div className="section-header">
                        <h3 className="section-title">
                            <img
                                src="/icons/dynamics-icon.svg"
                                alt="Динамика"
                                className="title-icon"
                            />
                            Динамика
                        </h3>
                        <div className="time-period-toggle">
                            <button
                                className={`period-btn ${timePeriod === "24h" ? "active" : ""}`}
                                onClick={() => setTimePeriod("24h")}
                            >
                                24 ЧАСА
                            </button>
                            <button
                                className={`period-btn ${timePeriod === "7d" ? "active" : ""}`}
                                onClick={() => setTimePeriod("7d")}
                            >
                                7 ДНЕЙ
                            </button>
                            <button
                                className={`period-btn ${
                                    timePeriod === "month" ? "active" : ""
                                }`}
                                onClick={() => setTimePeriod("month")}
                            >
                                МЕСЯЦ
                            </button>
                            <button
                                className={`period-btn ${
                                    timePeriod === "year" ? "active" : ""
                                }`}
                                onClick={() => setTimePeriod("year")}
                            >
                                ГОД
                            </button>
                        </div>
                    </div>

                    <div className="chart-container">
                        {chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart
                                    data={chartData}
                                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="0"
                                        stroke="#1f1f1f"
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="time"
                                        stroke="#666"
                                        style={{ fontSize: "11px" }}
                                        tickLine={false}
                                        axisLine={false}
                                        padding={{ left: 20, right: 10 }}
                                        interval={timePeriod === "month" ? 2 : "preserveStartEnd"}
                                    />
                                    <YAxis
                                        stroke="#666"
                                        style={{ fontSize: "11px" }}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value.toLocaleString()} ₸`}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={false} />
                                    <Line
                                        type="monotone"
                                        dataKey="value"
                                        stroke="#88b702"
                                        strokeWidth={2}
                                        dot={{ fill: "#fff", r: 4, strokeWidth: 0 }}
                                        activeDot={{ r: 6, fill: "#88b702" }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="loading-state">
                                {isChartLoading ? "Загрузка графика..." : "Нет данных"}
                            </div>
                        )}
                        {isChartLoading && (
                            <div className="chart-loading-overlay">
                                <div className="loading-spinner"></div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Последние донаты */}
                <div className="management-section donations-section">
                    <div className="section-header">
                        <h3 className="section-title">Последние донаты</h3>
                        <div className="donations-actions">
                            <div className="filter-dropdown" ref={filterRef}>
                                <button
                                    className="icon-btn"
                                    title="Фильтр"
                                    onClick={() =>
                                        setIsDonationsFilterOpen(!isDonationsFilterOpen)
                                    }
                                >
                                    <img
                                        src="/icons/filter-icon.svg"
                                        alt="Фильтр"
                                        className="icon-svg"
                                    />
                                </button>
                                {isDonationsFilterOpen && (
                                    <div className="filter-menu">
                                        <button
                                            className={`filter-option ${
                                                donationsPeriod === "24h" ? "active" : ""
                                            }`}
                                            onClick={() => {
                                                setDonationsPeriod("24h");
                                                setIsDonationsFilterOpen(false);
                                            }}
                                        >
                                            24 часа
                                        </button>
                                        <button
                                            className={`filter-option ${
                                                donationsPeriod === "7d" ? "active" : ""
                                            }`}
                                            onClick={() => {
                                                setDonationsPeriod("7d");
                                                setIsDonationsFilterOpen(false);
                                            }}
                                        >
                                            7 дней
                                        </button>
                                        <button
                                            className={`filter-option ${
                                                donationsPeriod === "month" ? "active" : ""
                                            }`}
                                            onClick={() => {
                                                setDonationsPeriod("month");
                                                setIsDonationsFilterOpen(false);
                                            }}
                                        >
                                            Месяц
                                        </button>
                                        <button
                                            className={`filter-option ${
                                                donationsPeriod === "year" ? "active" : ""
                                            }`}
                                            onClick={() => {
                                                setDonationsPeriod("year");
                                                setIsDonationsFilterOpen(false);
                                            }}
                                        >
                                            Год
                                        </button>
                                    </div>
                                )}
                            </div>
                            <button
                                className="icon-btn"
                                title="Развернуть"
                                onClick={openDonationsWindow}
                            >
                                <img
                                    src="/icons/modal-donations-icon.svg"
                                    alt="Развернуть"
                                    className="icon-svg"
                                />
                            </button>
                        </div>
                    </div>

                    <div className="donations-list">
                        {isDonationsLoading ? (
                            <div className="loading-state">Загрузка донатов...</div>
                        ) : recentDonations.length > 0 ? (
                            recentDonations.map((donation) => (
                                <div key={donation.id} className="donation-item">
                                    <div className="donation-header">
                                        <span className="donation-name">{donation.name}</span>
                                    </div>
                                    <div className="donation-amount">
                                        отправил {donation.amount.toLocaleString()} ₸
                                    </div>
                                    <div className="donation-message">{donation.message}</div>
                                    <div className="donation-time">{donation.time}</div>
                                </div>
                            ))
                        ) : (
                            <div className="loading-state">Нет донатов</div>
                        )}
                    </div>
                </div>

                {/* Цель сбора */}
                <div className="management-section goal-section">
                    <h3 className="section-title">Цель сбора</h3>
                    {isGoalLoading ? (
                        <div className="loading-state">Загрузка...</div>
                    ) : (
                        <>
                            <div className="goal-label">{goalDetails.title}</div>

                            <div className="pie-container">
                                <ResponsiveContainer width="100%" height={220}>
                                    <PieChart>
                                        <Pie
                                            data={goalData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={100}
                                            paddingAngle={0}
                                            dataKey="value"
                                            startAngle={90}
                                            endAngle={-270}
                                        >
                                            {goalData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.fill}
                                                    stroke="none"
                                                />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="pie-percentage">{goalDetails.percentage}%</div>
                            </div>

                            <div className="goal-stats">
                                <div className="stat-row">
                                    <span className="stat-label">СОБРАНО:</span>
                                    <span className="stat-value green">
                    {goalDetails.collectedAmount.toLocaleString()} ₸
                  </span>
                                </div>
                                <div className="stat-row">
                                    <span className="stat-label">ЦЕЛЬ:</span>
                                    <span className="stat-value">
                    {goalDetails.targetAmount.toLocaleString()} ₸
                  </span>
                                </div>
                                <div className="stat-row">
                                    <span className="stat-label">ОСТАЛОСЬ:</span>
                                    <span className="stat-value">
                    {goalDetails.remaining.toLocaleString()} ₸
                  </span>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Статистика */}
                <div className="management-section statistics-section">
                    <h3 className="section-title">Статистика</h3>

                    <div className="time-period-toggle">
                        <button
                            className={`period-btn ${statsPeriod === "24h" ? "active" : ""}`}
                            onClick={() => setStatsPeriod("24h")}
                        >
                            24 ЧАСА
                        </button>
                        <button
                            className={`period-btn ${statsPeriod === "7d" ? "active" : ""}`}
                            onClick={() => setStatsPeriod("7d")}
                        >
                            7 ДНЕЙ
                        </button>
                        <button
                            className={`period-btn ${
                                statsPeriod === "month" ? "active" : ""
                            }`}
                            onClick={() => setStatsPeriod("month")}
                        >
                            МЕСЯЦ
                        </button>
                        <button
                            className={`period-btn ${statsPeriod === "year" ? "active" : ""}`}
                            onClick={() => setStatsPeriod("year")}
                        >
                            ГОД
                        </button>
                    </div>

                    <div className="stats-display">
                        {isStatsLoading ? (
                            <div className="loading-state">Загрузка...</div>
                        ) : statistics ? (
                            <>
                                <div className="stat-item">
                                    <span className="stat-label">КОЛ-ВО ДОНАТОВ:</span>
                                    <span className="stat-value">
                    {statistics.donationsCount}
                  </span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">СОБРАНО:</span>
                                    <span className="stat-value green">
                    {statistics.totalAmount.toLocaleString()} ₸
                  </span>
                                </div>
                            </>
                        ) : (
                            <div className="loading-state">Нет данных</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManagementPage;