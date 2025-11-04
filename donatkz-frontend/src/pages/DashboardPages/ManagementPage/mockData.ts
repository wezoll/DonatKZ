// mockData.ts - Имитация данных с бэкенда

export interface Donation {
  id: number;
  name: string;
  amount: number;
  message: string;
  time: string;
  timestamp: number;
  period: '24h' | '7d' | 'month' | 'year';
}

export interface ChartDataPoint {
  time: string;
  value: number;
}

export interface GoalData {
  name: string;
  value: number;
  fill: string;
}

export interface Statistics {
  period: '24h' | '7d' | 'month' | 'year';
  donationsCount: number;
  totalAmount: number;
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  avatar: string;
  registrationDate: string;
  tariff: string;
}

// Пользовательский профиль
export const mockUserProfile: UserProfile = {
  id: 1,
  name: 'Nurda Salimov',
  email: 'nurda.salimov@example.com',
  avatar: 'NS',
  registrationDate: '2024-01-15',
  tariff: 'Premium',
};

// Генерация донатов за последний год
export const mockDonations: Donation[] = [
  // Донаты за последние 24 часа
  {
    id: 1,
    name: 'Алмас Ж.',
    amount: 10000,
    message: 'Спасибо за стрим! Продолжай в том же духе',
    time: '2 минуты назад',
    timestamp: Date.now() - 2 * 60 * 1000,
    period: '24h',
  },
  {
    id: 2,
    name: 'Нурлан А.',
    amount: 90000,
    message: 'Спасибо за контент! Лучший стример',
    time: '15 минут назад',
    timestamp: Date.now() - 15 * 60 * 1000,
    period: '24h',
  },
  {
    id: 3,
    name: 'Айгуль С.',
    amount: 70000,
    message: 'Продолжай в том же духе',
    time: '1 час назад',
    timestamp: Date.now() - 60 * 60 * 1000,
    period: '24h',
  },
  {
    id: 4,
    name: 'Ерлан К.',
    amount: 100000,
    message: 'Лучший стример!',
    time: '3 часа назад',
    timestamp: Date.now() - 3 * 60 * 60 * 1000,
    period: '24h',
  },
  {
    id: 5,
    name: 'Дина М.',
    amount: 50000,
    message: 'Отличный контент, так держать!',
    time: '5 часов назад',
    timestamp: Date.now() - 5 * 60 * 60 * 1000,
    period: '24h',
  },
  {
    id: 6,
    name: 'Асель Т.',
    amount: 50000,
    message: 'За хороший стрим вчера',
    time: '8 часов назад',
    timestamp: Date.now() - 8 * 60 * 60 * 1000,
    period: '24h',
  },
  {
    id: 7,
    name: 'Марат И.',
    amount: 35000,
    message: 'На новое оборудование',
    time: '12 часов назад',
    timestamp: Date.now() - 12 * 60 * 60 * 1000,
    period: '24h',
  },
  {
    id: 8,
    name: 'Жанна К.',
    amount: 85000,
    message: 'Классные игры показываешь!',
    time: '18 часов назад',
    timestamp: Date.now() - 18 * 60 * 60 * 1000,
    period: '24h',
  },

  // Донаты за последние 7 дней (но не за 24 часа)
  {
    id: 9,
    name: 'Тимур Б.',
    amount: 120000,
    message: 'Отличный стрим',
    time: '1 день назад',
    timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
    period: '7d',
  },
  {
    id: 10,
    name: 'Мадина Ж.',
    amount: 80000,
    message: 'Успехов!',
    time: '2 дня назад',
    timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
    period: '7d',
  },
  {
    id: 11,
    name: 'Арман Н.',
    amount: 95000,
    message: 'Продолжай',
    time: '3 дня назад',
    timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
    period: '7d',
  },
  {
    id: 12,
    name: 'Сауле К.',
    amount: 110000,
    message: 'Молодец!',
    time: '5 дней назад',
    timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
    period: '7d',
  },
  {
    id: 13,
    name: 'Дастан Р.',
    amount: 65000,
    message: 'За вчерашний розыгрыш',
    time: '6 дней назад',
    timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000,
    period: '7d',
  },

  // Донаты за последний месяц (но не за 7 дней)
  {
    id: 14,
    name: 'Бекзат Р.',
    amount: 75000,
    message: 'Спасибо за эмоции',
    time: '2 недели назад',
    timestamp: Date.now() - 14 * 24 * 60 * 60 * 1000,
    period: 'month',
  },
  {
    id: 15,
    name: 'Гульнара С.',
    amount: 130000,
    message: 'Спасибо',
    time: '3 недели назад',
    timestamp: Date.now() - 21 * 24 * 60 * 60 * 1000,
    period: 'month',
  },
  {
    id: 16,
    name: 'Ержан М.',
    amount: 45000,
    message: 'На развитие канала',
    time: '3 недели назад',
    timestamp: Date.now() - 22 * 24 * 60 * 60 * 1000,
    period: 'month',
  },
  {
    id: 17,
    name: 'Айдана Б.',
    amount: 98000,
    message: 'Лучший контент в Казахстане!',
    time: '4 недели назад',
    timestamp: Date.now() - 28 * 24 * 60 * 60 * 1000,
    period: 'month',
  },

  // Старые донаты (за год)
  {
    id: 18,
    name: 'Руслан К.',
    amount: 150000,
    message: 'Поддержка любимого стримера',
    time: '2 месяца назад',
    timestamp: Date.now() - 60 * 24 * 60 * 60 * 1000,
    period: 'year',
  },
  {
    id: 19,
    name: 'Камила А.',
    amount: 200000,
    message: 'За годовую подписку и контент',
    time: '3 месяца назад',
    timestamp: Date.now() - 90 * 24 * 60 * 60 * 1000,
    period: 'year',
  },
  {
    id: 20,
    name: 'Ануар Т.',
    amount: 55000,
    message: 'Продолжай радовать нас!',
    time: '4 месяца назад',
    timestamp: Date.now() - 120 * 24 * 60 * 60 * 1000,
    period: 'year',
  },
];

// Функция для генерации данных графика на основе донатов
const generateChartDataFromDonations = (
  period: '24h' | '7d' | 'month' | 'year'
): ChartDataPoint[] => {
  const now = Date.now();
  const periodMap = {
    '24h': ['24h'],
    '7d': ['24h', '7d'],
    month: ['24h', '7d', 'month'],
    year: ['24h', '7d', 'month', 'year'],
  };

  // Фильтруем донаты по периоду
  const relevantDonations = mockDonations.filter((d) =>
    periodMap[period].includes(d.period)
  );

  let chartData: ChartDataPoint[] = [];

  switch (period) {
    case '24h': {
      // Создаем точки каждые 2 часа
      const buckets: { [key: string]: number } = {};
      for (let i = 0; i <= 22; i += 2) {
        const hour = i.toString().padStart(2, '0');
        buckets[`${hour}:00`] = 0;
      }

      // Группируем донаты по 2-часовым интервалам
      relevantDonations.forEach((donation) => {
        const hoursSinceNow = (now - donation.timestamp) / (1000 * 60 * 60);
        const hoursAgo = Math.floor(hoursSinceNow);
        const bucketHour = Math.floor((24 - hoursAgo) / 2) * 2;
        const timeKey = `${bucketHour.toString().padStart(2, '0')}:00`;
        if (buckets[timeKey] !== undefined) {
          buckets[timeKey] += donation.amount;
        }
      });

      // Создаем накопительную сумму
      let cumulative = 0;
      chartData = Object.keys(buckets)
        .sort()
        .map((time) => {
          cumulative += buckets[time];
          return { time, value: cumulative };
        });
      break;
    }

    case '7d': {
      // Создаем точки для каждого дня недели
      const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
      const buckets: { [key: string]: number } = {};
      daysOfWeek.forEach((day) => {
        buckets[day] = 0;
      });

      // Группируем донаты по дням
      relevantDonations.forEach((donation) => {
        const daysSinceNow = (now - donation.timestamp) / (1000 * 60 * 60 * 24);
        const daysAgo = Math.floor(daysSinceNow);
        if (daysAgo < 7) {
          const dayIndex = 6 - daysAgo; // 0 = сегодня (воскресенье)
          const adjustedIndex = (dayIndex + 1) % 7; // Сдвигаем так чтобы Пн был первым
          buckets[daysOfWeek[adjustedIndex]] += donation.amount;
        }
      });

      // Создаем накопительную сумму
      let cumulative = 0;
      chartData = daysOfWeek.map((day) => {
        cumulative += buckets[day];
        return { time: day, value: cumulative };
      });
      break;
    }

    case 'month': {
      // Создаем точки для каждого дня месяца
      const now = new Date();
      const currentDay = now.getDate();
      const currentMonth = now.getMonth() + 1;
      const buckets: { [key: string]: number } = {};

      for (let i = 1; i <= 31; i++) {
        const dayStr = `${i.toString().padStart(2, '0')}.${currentMonth.toString().padStart(2, '0')}`;
        buckets[dayStr] = 0;
      }

      // Группируем донаты по дням
      relevantDonations.forEach((donation) => {
        const daysSinceNow = (Date.now() - donation.timestamp) / (1000 * 60 * 60 * 24);
        const daysAgo = Math.floor(daysSinceNow);
        if (daysAgo <= 31) {
          const day = currentDay - daysAgo;
          if (day > 0) {
            const dayStr = `${day.toString().padStart(2, '0')}.${currentMonth.toString().padStart(2, '0')}`;
            if (buckets[dayStr] !== undefined) {
              buckets[dayStr] += donation.amount;
            }
          }
        }
      });

      // Создаем накопительную сумму для текущего месяца
      let cumulative = 0;
      chartData = Object.keys(buckets)
        .sort((a, b) => {
          const dayA = parseInt(a.split('.')[0]);
          const dayB = parseInt(b.split('.')[0]);
          return dayA - dayB;
        })
        .filter((key) => {
          const day = parseInt(key.split('.')[0]);
          return day <= currentDay;
        })
        .map((time) => {
          cumulative += buckets[time];
          return { time, value: cumulative };
        });
      break;
    }

    case 'year': {
      // Создаем точки для каждого месяца
      const months = [
        'Янв',
        'Фев',
        'Мар',
        'Апр',
        'Май',
        'Июн',
        'Июл',
        'Авг',
        'Сен',
        'Окт',
        'Ноя',
        'Дек',
      ];
      const buckets: { [key: string]: number } = {};
      months.forEach((month) => {
        buckets[month] = 0;
      });

      // Группируем донаты по месяцам
      relevantDonations.forEach((donation) => {
        const monthsSinceNow = (now - donation.timestamp) / (1000 * 60 * 60 * 24 * 30);
        const monthsAgo = Math.floor(monthsSinceNow);
        if (monthsAgo < 12) {
          const currentMonthIndex = new Date().getMonth();
          const monthIndex = (currentMonthIndex - monthsAgo + 12) % 12;
          buckets[months[monthIndex]] += donation.amount;
        }
      });

      // Создаем накопительную сумму
      let cumulative = 0;
      chartData = months.map((month) => {
        cumulative += buckets[month];
        return { time: month, value: cumulative };
      });
      break;
    }
  }

  return chartData;
};

// Данные графика для разных периодов - теперь генерируются динамически
export const mockChartData: Record<string, ChartDataPoint[]> = {
  '24h': generateChartDataFromDonations('24h'),
  '7d': generateChartDataFromDonations('7d'),
  month: generateChartDataFromDonations('month'),
  year: generateChartDataFromDonations('year'),
};

// Данные цели сбора
export const mockGoalData: GoalData[] = [
  { name: 'Собрано', value: 81, fill: '#88b702' },
  { name: 'Осталось', value: 19, fill: '#3a3a2a' },
];

// Детальная информация о цели
export const mockGoalDetails = {
  title: 'ПОЕЗДКА ЗА ГРАНИЦУ',
  targetAmount: 1850000, // Целевая сумма (увеличил чтобы был реалистичный процент)
  collectedAmount: 0, // Будет рассчитываться динамически
  get collected() {
    return this.collectedAmount;
  },
  get remaining() {
    return Math.max(0, this.targetAmount - this.collectedAmount);
  },
  get total() {
    return this.targetAmount;
  },
  get percentage() {
    if (this.targetAmount === 0) return 0;
    const percent = (this.collectedAmount / this.targetAmount) * 100;
    return Math.min(100, Math.round(percent));
  },
};

// Функция для расчета собранной суммы из донатов
export const calculateCollectedAmount = (donations: Donation[]): number => {
  return donations.reduce((sum, donation) => sum + donation.amount, 0);
};

// Статистика по периодам - будет рассчитываться динамически
export const calculateStatistics = (
  donations: Donation[],
  period: '24h' | '7d' | 'month' | 'year'
): Statistics => {
  const periodMap = {
    '24h': ['24h'],
    '7d': ['24h', '7d'],
    month: ['24h', '7d', 'month'],
    year: ['24h', '7d', 'month', 'year'],
  };

  const filteredDonations = donations.filter((d) =>
    periodMap[period].includes(d.period)
  );

  return {
    period,
    donationsCount: filteredDonations.length,
    totalAmount: filteredDonations.reduce((sum, d) => sum + d.amount, 0),
  };
};

// API функции для имитации запросов к бэкенду
export const mockAPI = {
  // Получить профиль пользователя
  getUserProfile: (): Promise<UserProfile> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(mockUserProfile);
      }, 300);
    });
  },

  // Получить донаты с фильтрацией по периоду
  getDonations: (
    period: '24h' | '7d' | 'month' | 'year' = 'year',
    limit?: number
  ): Promise<Donation[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const periodMap = {
          '24h': ['24h'],
          '7d': ['24h', '7d'],
          month: ['24h', '7d', 'month'],
          year: ['24h', '7d', 'month', 'year'],
        };

        const filtered = mockDonations
          .filter((d) => periodMap[period].includes(d.period))
          .sort((a, b) => b.timestamp - a.timestamp);

        resolve(limit ? filtered.slice(0, limit) : filtered);
      }, 500);
    });
  },

  // Получить данные для графика - теперь динамически генерируется из донатов
  getChartData: (
    period: '24h' | '7d' | 'month' | 'year'
  ): Promise<ChartDataPoint[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Генерируем свежие данные каждый раз
        const chartData = generateChartDataFromDonations(period);
        resolve(chartData);
      }, 300);
    });
  },

  // Получить статистику
  getStatistics: (
    period: '24h' | '7d' | 'month' | 'year'
  ): Promise<Statistics> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(calculateStatistics(mockDonations, period));
      }, 400);
    });
  },

  // Получить информацию о цели сбора
  getGoalData: (): Promise<typeof mockGoalDetails & { collectedAmount: number }> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const totalCollected = calculateCollectedAmount(mockDonations);
        const goalData = {
          ...mockGoalDetails,
          collectedAmount: totalCollected,
        };
        resolve(goalData);
      }, 300);
    });
  },

  // Добавить новый донат (имитация)
  addDonation: (donation: Omit<Donation, 'id' | 'timestamp'>): Promise<Donation> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newDonation: Donation = {
          ...donation,
          id: mockDonations.length + 1,
          timestamp: Date.now(),
        };
        mockDonations.unshift(newDonation);
        resolve(newDonation);
      }, 600);
    });
  },
};

export default mockAPI;