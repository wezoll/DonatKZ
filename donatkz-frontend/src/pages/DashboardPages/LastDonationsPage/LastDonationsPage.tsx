import React, { useState, useMemo, useEffect } from 'react';
import './LastDonationsPage.css';
import { donationsApi } from '../../../api/donations.api';

type SortField = 'time' | 'amount';
type SortOrder = 'asc' | 'desc';

interface Donation {
  id: number;
  name: string;
  amount: number;
  message: string;
  time: string;
  timestamp: number;
}

const LastDonationsPage: React.FC = () => {
  const [allDonations, setAllDonations] = useState<Donation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [sortField, setSortField] = useState<SortField>('time');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const filterRef = React.useRef<HTMLDivElement>(null);

  // Загрузка всех донатов с API
  useEffect(() => {
    setIsLoading(true);
    donationsApi.getDonations('year', 0, 1000)
      .then((response) => {
        // Маппинг API данных в формат компонента
        const mappedDonations = response.content.map((donation) => ({
          id: donation.id,
          name: donation.senderName,
          amount: donation.amount,
          message: donation.message || '',
          time: new Date(donation.timestamp).toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          timestamp: new Date(donation.timestamp).getTime(),
        }));
        setAllDonations(mappedDonations);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load donations:', err);
        setIsLoading(false);
      });
  }, []);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setIsDateDropdownOpen(false);
        setIsSortDropdownOpen(false);
      }
    };

    if (isDateDropdownOpen || isSortDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isDateDropdownOpen, isSortDropdownOpen]);

  // Статистика
  const statistics = useMemo(() => {
    const totalDonations = allDonations.length;
    const totalAmount = allDonations.reduce((sum, d) => sum + d.amount, 0);
    const largestDonation = allDonations.length > 0 
      ? Math.max(...allDonations.map(d => d.amount)) 
      : 0;

    return {
      totalDonations,
      totalAmount,
      largestDonation,
    };
  }, [allDonations]);

  // Фильтрация и сортировка
  const filteredAndSortedDonations = useMemo(() => {
    let filtered = [...allDonations];

    // Фильтр по имени
    if (searchQuery.trim()) {
      filtered = filtered.filter((d) =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Фильтр по дате
    const now = Date.now();
    switch (dateFilter) {
      case 'today':
        filtered = filtered.filter((d) => now - d.timestamp < 24 * 60 * 60 * 1000);
        break;
      case 'week':
        filtered = filtered.filter((d) => now - d.timestamp < 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        filtered = filtered.filter((d) => now - d.timestamp < 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        break;
    }

    // Сортировка
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'time') {
        comparison = a.timestamp - b.timestamp;
      } else if (sortField === 'amount') {
        comparison = a.amount - b.amount;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [allDonations, searchQuery, dateFilter, sortField, sortOrder]);

  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  const getDateFilterLabel = () => {
    switch (dateFilter) {
      case 'today':
        return 'Сегодня';
      case 'week':
        return 'Неделя';
      case 'month':
        return 'Месяц';
      default:
        return 'Все время';
    }
  };

  const getSortLabel = () => {
    if (sortField === 'time') {
      return sortOrder === 'desc' ? 'Сначала новые' : 'Сначала старые';
    } else {
      return sortOrder === 'desc' ? 'Сумма: по убыванию' : 'Сумма: по возрастанию';
    }
  };

  const handleSortChange = (field: SortField, order: SortOrder) => {
    setSortField(field);
    setSortOrder(order);
    setIsSortDropdownOpen(false);
  };

  return (
    <div className="last-donations-page">
      {/* Статистические карточки */}
      <div className="donations-stats-grid">
        <div className="stat-card">
          <h3 className="stat-card-title">Всего донатов</h3>
          <p className="stat-card-value">{statistics.totalDonations}</p>
        </div>
        <div className="stat-card">
          <h3 className="stat-card-title">Общая сумма</h3>
          <p className="stat-card-value stat-card-value-green">
            {formatNumber(statistics.totalAmount)} ₸
          </p>
        </div>
        <div className="stat-card">
          <h3 className="stat-card-title">Самый крупный донат</h3>
          <p className="stat-card-value stat-card-value-green">
            {formatNumber(statistics.largestDonation)} ₸
          </p>
        </div>
      </div>

      {/* Фильтры */}
      <div className="donations-filters-section">
        <h3 className="filters-title">Фильтры</h3>
        
        <div className="filters-row">
          {/* Поиск по имени */}
          <div className="filter-search">
            <svg className="search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <input
              type="text"
              className="filter-search-input"
              placeholder="Поиск по имени"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Фильтр по дате и сортировка */}
          <div ref={filterRef} style={{ display: 'flex', gap: '15px' }}>
            {/* Фильтр по дате */}
            <div className="filter-dropdown-container">
              <button
                className="filter-dropdown-btn"
                onClick={() => {
                  setIsDateDropdownOpen(!isDateDropdownOpen);
                  setIsSortDropdownOpen(false);
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <rect x="3" y="4" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M3 8h14M7 1v3M13 1v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span>{getDateFilterLabel()}</span>
                <svg className="dropdown-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              {isDateDropdownOpen && (
                <div className="filter-dropdown-menu">
                  <button
                    className={`filter-dropdown-option ${dateFilter === 'all' ? 'active' : ''}`}
                    onClick={() => {
                      setDateFilter('all');
                      setIsDateDropdownOpen(false);
                    }}
                  >
                    Все время
                  </button>
                  <button
                    className={`filter-dropdown-option ${dateFilter === 'today' ? 'active' : ''}`}
                    onClick={() => {
                      setDateFilter('today');
                      setIsDateDropdownOpen(false);
                    }}
                  >
                    Сегодня
                  </button>
                  <button
                    className={`filter-dropdown-option ${dateFilter === 'week' ? 'active' : ''}`}
                    onClick={() => {
                      setDateFilter('week');
                      setIsDateDropdownOpen(false);
                    }}
                  >
                    Неделя
                  </button>
                  <button
                    className={`filter-dropdown-option ${dateFilter === 'month' ? 'active' : ''}`}
                    onClick={() => {
                      setDateFilter('month');
                      setIsDateDropdownOpen(false);
                    }}
                  >
                    Месяц
                  </button>
                </div>
              )}
            </div>

            {/* Сортировка */}
            <div className="filter-dropdown-container">
              <button
                className="filter-dropdown-btn"
                onClick={() => {
                  setIsSortDropdownOpen(!isSortDropdownOpen);
                  setIsDateDropdownOpen(false);
                }}
              >
                <span>Все суммы</span>
                <svg className="dropdown-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              {isSortDropdownOpen && (
                <div className="filter-dropdown-menu">
                  <button
                    className={`filter-dropdown-option ${sortField === 'time' && sortOrder === 'desc' ? 'active' : ''}`}
                    onClick={() => handleSortChange('time', 'desc')}
                  >
                    Сначала новые
                  </button>
                  <button
                    className={`filter-dropdown-option ${sortField === 'time' && sortOrder === 'asc' ? 'active' : ''}`}
                    onClick={() => handleSortChange('time', 'asc')}
                  >
                    Сначала старые
                  </button>
                  <button
                    className={`filter-dropdown-option ${sortField === 'amount' && sortOrder === 'desc' ? 'active' : ''}`}
                    onClick={() => handleSortChange('amount', 'desc')}
                  >
                    Сумма: по убыванию
                  </button>
                  <button
                    className={`filter-dropdown-option ${sortField === 'amount' && sortOrder === 'asc' ? 'active' : ''}`}
                    onClick={() => handleSortChange('amount', 'asc')}
                  >
                    Сумма: по возрастанию
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Список донатов */}
      <div className="donations-list-section">
        <h3 className="donations-list-title">Все донаты</h3>
        
        <div className="donations-list-container">
          {isLoading ? (
            <div className="empty-state">
              <p>Загрузка донатов...</p>
            </div>
          ) : filteredAndSortedDonations.length === 0 ? (
            <div className="empty-state">
              <p>Донаты не найдены</p>
            </div>
          ) : (
            filteredAndSortedDonations.map((donation) => (
              <div key={donation.id} className="donation-card-full">
                <div className="donation-card-header">
                  <span className="donation-card-name">{donation.name}</span>
                  <span className="donation-card-time">{donation.time}</span>
                </div>
                <div className="donation-card-amount">
                  отправил {formatNumber(donation.amount)} ₸
                </div>
                <div className="donation-card-message">{donation.message}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LastDonationsPage;