import React, { useState, useEffect } from 'react';
import { adminApi, type AdminUser, type NewsItem, type FaqItem } from '../../../api/admin.api';
import { tariffRequestApi, type TariffRequestResponse } from '../../../api/tariffRequest.api';
import { useAuth } from '../../../context/AuthContext';
import './AdminPanel.css';

type AdminTab = 'users' | 'requests' | 'news' | 'faq';
type UserRole = 'user' | 'admin' | 'superadmin';

// Используем типы из API
// interface AdminUser уже импортирован из admin.api.ts
// interface NewsItem уже импортирован из admin.api.ts
// interface FaqItem уже импортирован из admin.api.ts

// Используем TariffRequestResponse из API

const AdminPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('user');
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [editingTariff, setEditingTariff] = useState<{ userId: string; tariff: string; start: string; end: string } | null>(null);

  // Состояния для модальных окон новостей
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [newsForm, setNewsForm] = useState<Partial<NewsItem>>({
    type: 'update',
    title: '',
    description: '',
    fullDescription: '',
    icon: 'megaphone',
  });

  // Состояния для модальных окон FAQ
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [faqForm, setFaqForm] = useState<Partial<FaqItem>>({
    question: '',
    answer: '',
  });

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tariffRequests, setTariffRequests] = useState<TariffRequestResponse[]>([]);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [faqItems, setFaqItems] = useState<FaqItem[]>([]);

  // Загрузка данных при монтировании
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      // Загрузка пользователей
      const usersData = await adminApi.getAllUsers();
      setUsers(usersData);

      // Загрузка заявок на тарифы
      const requestsData = await tariffRequestApi.getAllTariffRequests();
      setTariffRequests(requestsData);

      // Загрузка новостей
      const newsData = await adminApi.getAllNews();
      setNewsItems(newsData);

      // Загрузка FAQ
      const faqData = await adminApi.getAllFaq();
      setFaqItems(faqData);

      // Определение роли текущего пользователя
      if (currentUser?.role) {
        setCurrentUserRole(currentUser.role.toLowerCase() as UserRole);
      }
    } catch (error) {
      console.error('Failed to load admin data:', error);
      alert('Не удалось загрузить данные админ-панели');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'users' as AdminTab, label: 'Управление пользователями', icon: 'users' },
    { id: 'requests' as AdminTab, label: 'Заявки на тарифы', icon: 'clipboard' },
    { id: 'news' as AdminTab, label: 'Управление новостями', icon: 'news' },
    { id: 'faq' as AdminTab, label: 'Управление FAQ', icon: 'help' },
  ];

  const getTabIcon = (icon: string) => {
    switch (icon) {
      case 'users':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      case 'clipboard':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          </svg>
        );
      case 'news':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3h18v18H3z" />
            <path d="M7 7h10M7 11h10M7 15h10" />
          </svg>
        );
      case 'help':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        );
      default:
        return null;
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const calculateRemainingDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    // Если тариф еще не начался
    if (now < start) {
      return { days: 0, status: 'Не начат' };
    }

    // Если тариф закончился
    if (now > end) {
      return { days: 0, status: 'Истек' };
    }

    // Вычисляем оставшиеся дни
    const diff = end.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 3600 * 24));
    return { days: days > 0 ? days : 0, status: 'Активен' };
  };

  const calculateTariffDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24));

    if (diffDays >= 365) {
      const years = Math.floor(diffDays / 365);
      return `${years} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'}`;
    } else if (diffDays >= 30) {
      const months = Math.floor(diffDays / 30);
      return `${months} ${months === 1 ? 'месяц' : months < 5 ? 'месяца' : 'месяцев'}`;
    } else {
      return `${diffDays} ${diffDays === 1 ? 'день' : diffDays < 5 ? 'дня' : 'дней'}`;
    }
  };

  const handleToggleAdmin = async (userId: string, currentRole: UserRole) => {
    const newRole = currentRole === 'admin' ? 'USER' : 'ADMIN';
    const confirmText = currentRole === 'admin'
      ? 'Вы уверены, что хотите отобрать права администратора?'
      : 'Вы уверены, что хотите назначить этого пользователя администратором?';

    if (window.confirm(confirmText)) {
      try {
        await adminApi.updateUserRole(userId, { role: newRole });
        // Обновить локальное состояние
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole.toLowerCase() as UserRole } : u));
      } catch (error: any) {
        console.error('Failed to update user role:', error);
        alert(error.response?.data?.message || 'Не удалось изменить роль пользователя');
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      try {
        await adminApi.deleteUser(userId);
        setUsers(users.filter(u => u.id !== userId));
      } catch (error: any) {
        console.error('Failed to delete user:', error);
        alert(error.response?.data?.message || 'Не удалось удалить пользователя');
      }
    }
  };

  const toggleUserTariffEdit = (userId: string) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      setEditingTariff(null);
    } else {
      const user = users.find(u => u.id === userId);
      if (user) {
        setEditingTariff({
          userId: user.id,
          tariff: user.tariff,
          start: user.tariffStart || '',
          end: user.tariffEnd || ''
        });
      }
      setExpandedUserId(userId);
    }
  };

  const handleUpdateUserTariff = async (userId: string, tariff: string, start: string, end: string) => {
    try {
      // Убеждаемся, что даты в формате yyyy-MM-dd
      const formatDate = (dateStr: string): string => {
        if (!dateStr) return '';
        // Если дата уже в формате yyyy-MM-dd, возвращаем как есть
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
          return dateStr;
        }
        // Если дата в формате DD.MM.YYYY, конвертируем в yyyy-MM-dd
        if (/^\d{2}\.\d{2}\.\d{4}$/.test(dateStr)) {
          const [day, month, year] = dateStr.split('.');
          return `${year}-${month}-${day}`;
        }
        // Если дата в формате DD/MM/YYYY, конвертируем в yyyy-MM-dd
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
          const [day, month, year] = dateStr.split('/');
          return `${year}-${month}-${day}`;
        }
        // Пытаемся распарсить как Date и конвертировать
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        }
        return dateStr;
      };

      const formattedStart = formatDate(start);
      const formattedEnd = formatDate(end);

      await adminApi.updateUserTariff(userId, {
        tariff: tariff as 'FREE' | 'BASIC' | 'PREMIUM',
        tariffStart: formattedStart,
        tariffEnd: formattedEnd,
      });
      setUsers(users.map(u =>
        u.id === userId
          ? { ...u, tariff: tariff as 'FREE' | 'BASIC' | 'PREMIUM', tariffStart: formattedStart, tariffEnd: formattedEnd }
          : u
      ));
      setExpandedUserId(null);
      setEditingTariff(null);
    } catch (error: any) {
      console.error('Failed to update user tariff:', error);
      alert(error.response?.data?.message || 'Не удалось обновить тариф пользователя');
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    const request = tariffRequests.find(r => r.id === requestId);
    if (!request) return;

    if (!window.confirm(`Вы уверены, что хотите одобрить заявку от ${request.username}?`)) {
      return;
    }

    try {
      // Обновляем статус заявки через API
      const updatedRequest = await tariffRequestApi.updateTariffRequestStatus(requestId, {
        status: 'approved',
      });

      // Обновляем тариф пользователя
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + request.durationMonths);

      await adminApi.updateUserTariff(request.userId, {
        tariff: request.tariff as 'FREE' | 'BASIC' | 'PREMIUM',
        tariffStart: startDate.toISOString().split('T')[0],
        tariffEnd: endDate.toISOString().split('T')[0],
      });

      // Обновляем локальное состояние
      setTariffRequests(tariffRequests.map(r =>
        r.id === requestId ? updatedRequest : r
      ));

      // Перезагружаем данные
      await loadAllData();
    } catch (error: any) {
      console.error('Failed to approve request:', error);
      alert(error.response?.data?.message || 'Не удалось одобрить заявку');
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    const request = tariffRequests.find(r => r.id === requestId);
    if (!request) return;

    const notes = window.prompt('Введите причину отклонения (необязательно):');
    if (notes === null) return; // Пользователь отменил

    try {
      // Обновляем статус заявки через API
      const updatedRequest = await tariffRequestApi.updateTariffRequestStatus(requestId, {
        status: 'rejected',
        adminNotes: notes || undefined,
      });

      // Обновляем локальное состояние
      setTariffRequests(tariffRequests.map(r =>
        r.id === requestId ? updatedRequest : r
      ));
    } catch (error: any) {
      console.error('Failed to reject request:', error);
      alert(error.response?.data?.message || 'Не удалось отклонить заявку');
    }
  };

  const handleDeleteNews = async (newsId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить эту новость?')) {
      try {
        await adminApi.deleteNews(newsId);
        setNewsItems(newsItems.filter(n => n.id !== newsId));
      } catch (error: any) {
        console.error('Failed to delete news:', error);
        alert(error.response?.data?.message || 'Не удалось удалить новость');
      }
    }
  };

  const handleOpenNewsModal = (news?: NewsItem) => {
    if (news) {
      setEditingNews(news);
      setNewsForm(news);
    } else {
      setEditingNews(null);
      setNewsForm({
        type: 'update',
        title: '',
        description: '',
        fullDescription: '',
        icon: 'megaphone',
      });
    }
    setShowNewsModal(true);
  };

  const handleCloseNewsModal = () => {
    setShowNewsModal(false);
    setEditingNews(null);
    setNewsForm({
      type: 'update',
      title: '',
      description: '',
      fullDescription: '',
      icon: 'megaphone',
    });
  };

  const handleSaveNews = async () => {
    if (!newsForm.title || !newsForm.description || !newsForm.fullDescription) {
      alert('Пожалуйста, заполните все поля');
      return;
    }

    try {
      const newsData = {
        type: newsForm.type as 'update' | 'announcement' | 'feature',
        title: newsForm.title!,
        description: newsForm.description!,
        fullDescription: newsForm.fullDescription!,
        icon: newsForm.icon as 'star' | 'megaphone' | 'news',
        badge: newsForm.badge,
      };

      if (editingNews) {
        // Редактирование существующей новости
        const updated = await adminApi.updateNews(editingNews.id, newsData);
        setNewsItems(newsItems.map(n => n.id === editingNews.id ? updated : n));
      } else {
        // Добавление новой новости
        const newNews = await adminApi.createNews(newsData);
        setNewsItems([newNews, ...newsItems]);
      }

      handleCloseNewsModal();
    } catch (error: any) {
      console.error('Failed to save news:', error);
      alert(error.response?.data?.message || 'Не удалось сохранить новость');
    }
  };

  const handleDeleteFaq = async (faqId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот вопрос?')) {
      try {
        await adminApi.deleteFaq(faqId);
        setFaqItems(faqItems.filter(f => f.id !== faqId));
      } catch (error: any) {
        console.error('Failed to delete FAQ:', error);
        alert(error.response?.data?.message || 'Не удалось удалить вопрос');
      }
    }
  };

  const handleOpenFaqModal = (faq?: FaqItem) => {
    if (faq) {
      setEditingFaq(faq);
      setFaqForm(faq);
    } else {
      setEditingFaq(null);
      setFaqForm({
        question: '',
        answer: '',
      });
    }
    setShowFaqModal(true);
  };

  const handleCloseFaqModal = () => {
    setShowFaqModal(false);
    setEditingFaq(null);
    setFaqForm({
      question: '',
      answer: '',
    });
  };

  const handleSaveFaq = async () => {
    if (!faqForm.question || !faqForm.answer) {
      alert('Пожалуйста, заполните все поля');
      return;
    }

    try {
      const faqData = {
        question: faqForm.question!,
        answer: faqForm.answer!,
        displayOrder: faqForm.displayOrder || 0,
      };

      if (editingFaq) {
        // Редактирование существующего вопроса
        const updated = await adminApi.updateFaq(editingFaq.id, faqData);
        setFaqItems(faqItems.map(f => f.id === editingFaq.id ? updated : f));
      } else {
        // Добавление нового вопроса
        const newFaq = await adminApi.createFaq(faqData);
        setFaqItems([...faqItems, newFaq]);
      }

      handleCloseFaqModal();
    } catch (error: any) {
      console.error('Failed to save FAQ:', error);
      alert(error.response?.data?.message || 'Не удалось сохранить вопрос');
    }
  };

  return (
    <div className="admin-page">
      {/* Tabs */}
      <div className="admin-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`admin-tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {getTabIcon(tab.icon)}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="admin-content">
        {/* Users Management */}
        {activeTab === 'users' && (
          <div className="admin-section">
            <div className="section-header">
              <h2 className="section-title">Управление пользователями</h2>
              <p className="section-subtitle">Поиск, редактирование и управление пользователями системы</p>
            </div>

            {/* Search */}
            <div className="search-box">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Поиск по логину или email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>

            {/* Users Table */}
            <div className="users-table">
              {filteredUsers.map((user) => (
                <div key={user.id} className="user-card">
                  <div className="user-main-info">
                    <div className="user-avatar">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <div className="user-info">
                      <div className="user-name-row">
                        <h3 className="user-name">{user.username}</h3>
                        <span className={`role-badge role-${user.role}`}>
                          {user.role === 'superadmin' ? 'Главный админ' : user.role === 'admin' ? 'Админ' : 'Пользователь'}
                        </span>
                      </div>
                      <p className="user-email">{user.email}</p>
                      <div className="user-tariff-info">
                        <span className={`tariff-badge tariff-${user.tariff.toLowerCase()}`}>
                          {user.tariff}
                        </span>
                        <span className="tariff-dates">
                          {user.tariffStart} - {user.tariffEnd}
                        </span>
                        <span className="tariff-duration">
                          Срок: {calculateTariffDuration(user.tariffStart, user.tariffEnd)}
                        </span>
                        <span className={`tariff-remaining ${calculateRemainingDays(user.tariffStart, user.tariffEnd).status === 'Истек' ? 'expired' : ''}`}>
                          {calculateRemainingDays(user.tariffStart, user.tariffEnd).status === 'Активен'
                            ? `Осталось: ${calculateRemainingDays(user.tariffStart, user.tariffEnd).days} дней`
                            : calculateRemainingDays(user.tariffStart, user.tariffEnd).status
                          }
                        </span>
                      </div>
                    </div>
                    <div className="user-actions">
                      {currentUserRole === 'superadmin' && user.role !== 'superadmin' && (
                        <button
                          className={`action-btn ${user.role === 'admin' ? 'remove-admin-btn' : 'admin-btn'}`}
                          onClick={() => handleToggleAdmin(user.id, user.role)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {user.role === 'admin' ? (
                              <>
                                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="8.5" cy="7" r="4" />
                                <line x1="18" y1="8" x2="23" y2="13" />
                                <line x1="23" y1="8" x2="18" y2="13" />
                              </>
                            ) : (
                              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            )}
                          </svg>
                          {user.role === 'admin' ? 'Отобрать права админа' : 'Назначить админом'}
                        </button>
                      )}
                      {(currentUserRole === 'superadmin' || currentUserRole === 'admin') && user.role !== 'superadmin' && (
                        <>
                          <button
                            className="action-btn tariff-btn"
                            onClick={() => toggleUserTariffEdit(user.id)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                            Управление тарифом
                          </button>
                          <button
                            className="action-btn delete-btn"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            </svg>
                            Удалить
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {expandedUserId === user.id && (
                    <div className="tariff-edit-panel">
                      <h4 className="edit-panel-title">Редактирование тарифа</h4>
                      <div className="edit-form">
                        <div className="form-group">
                          <label className="form-label">Тариф</label>
                          <select
                            className="form-select"
                            value={editingTariff?.userId === user.id ? editingTariff.tariff : user.tariff}
                            onChange={(e) => {
                              const current = editingTariff?.userId === user.id ? editingTariff : { userId: user.id, tariff: user.tariff, start: user.tariffStart || '', end: user.tariffEnd || '' };
                              setEditingTariff({ ...current, tariff: e.target.value });
                            }}
                          >
                            <option value="FREE">FREE</option>
                            <option value="BASIC">BASIC</option>
                            <option value="PREMIUM">PREMIUM</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Дата начала</label>
                          <input
                            type="date"
                            className="form-input"
                            value={editingTariff?.userId === user.id ? editingTariff.start : (user.tariffStart || '')}
                            onChange={(e) => {
                              const current = editingTariff?.userId === user.id ? editingTariff : { userId: user.id, tariff: user.tariff, start: user.tariffStart || '', end: user.tariffEnd || '' };
                              setEditingTariff({ ...current, start: e.target.value });
                            }}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Дата окончания</label>
                          <input
                            type="date"
                            className="form-input"
                            value={editingTariff?.userId === user.id ? editingTariff.end : (user.tariffEnd || '')}
                            onChange={(e) => {
                              const current = editingTariff?.userId === user.id ? editingTariff : { userId: user.id, tariff: user.tariff, start: user.tariffStart || '', end: user.tariffEnd || '' };
                              setEditingTariff({ ...current, end: e.target.value });
                            }}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Осталось дней</label>
                          <input
                            type="text"
                            className="form-input"
                            value={(() => {
                              const start = editingTariff?.userId === user.id ? editingTariff.start : (user.tariffStart || '');
                              const end = editingTariff?.userId === user.id ? editingTariff.end : (user.tariffEnd || '');
                              const calc = calculateRemainingDays(start, end);
                              return `${calc.days} дней (${calc.status})`;
                            })()}
                            disabled
                          />
                        </div>
                      </div>
                      <div className="edit-panel-actions">
                        <button
                          className="save-btn"
                          onClick={() => {
                            const current = editingTariff?.userId === user.id ? editingTariff : { userId: user.id, tariff: user.tariff, start: user.tariffStart || '', end: user.tariffEnd || '' };
                            handleUpdateUserTariff(user.id, current.tariff, current.start, current.end);
                          }}
                        >
                          Сохранить изменения
                        </button>
                        <button
                          className="cancel-btn"
                          onClick={() => {
                            setExpandedUserId(null);
                            setEditingTariff(null);
                          }}
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tariff Requests */}
        {activeTab === 'requests' && (
          <div className="admin-section">
            <div className="section-header">
              <h2 className="section-title">Заявки на тарифы</h2>
              <p className="section-subtitle">Проверка и подтверждение заявок пользователей</p>
            </div>

            <div className="requests-grid">
              {tariffRequests.map((request) => (
                <div key={request.id} className={`request-card request-${request.status}`}>
                  <div className="request-header">
                    <div className="request-user-info">
                      <h3 className="request-username">{request.username}</h3>
                      <p className="request-email">{request.email}</p>
                    </div>
                    <span className={`status-badge status-${request.status}`}>
                      {request.status === 'pending' ? 'На рассмотрении' :
                        request.status === 'approved' ? 'Одобрено' : 'Отклонено'}
                    </span>
                  </div>

                  <div className="request-details">
                    <div className="detail-item">
                      <span className="detail-label">Тариф:</span>
                      <span className={`detail-value tariff-badge tariff-${request.tariff.toLowerCase()}`}>
                        {request.tariff}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Срок:</span>
                      <span className="detail-value">{request.durationMonths} {request.durationMonths === 1 ? 'мес.' : request.durationMonths < 5 ? 'мес.' : 'мес.'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Сумма:</span>
                      <span className="detail-value amount">{Number(request.amount).toLocaleString('ru-RU')} ₸</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Дата:</span>
                      <span className="detail-value">{new Date(request.createdAt).toLocaleString('ru-RU', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                    </div>
                  </div>

                  {request.receiptUrl && (
                    <div className="request-receipt">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                      <a href={request.receiptUrl} target="_blank" rel="noopener noreferrer" className="receipt-link">
                        Просмотреть чек
                      </a>
                    </div>
                  )}
                  {request.promocode && (
                    <div className="request-promocode">
                      <span className="promocode-label">Промокод:</span>
                      <span className="promocode-value">{request.promocode}</span>
                    </div>
                  )}
                  {request.adminNotes && (
                    <div className="request-notes">
                      <span className="notes-label">Примечание:</span>
                      <span className="notes-value">{request.adminNotes}</span>
                    </div>
                  )}

                  {request.status === 'pending' && (
                    <div className="request-actions">
                      <button
                        className="approve-btn"
                        onClick={() => handleApproveRequest(request.id)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Одобрить
                      </button>
                      <button
                        className="reject-btn"
                        onClick={() => handleRejectRequest(request.id)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        Отклонить
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* News Management */}
        {activeTab === 'news' && (
          <div className="admin-section">
            <div className="section-header">
              <h2 className="section-title">Управление новостями</h2>
              <p className="section-subtitle">Создание, редактирование и удаление новостей</p>
              <button className="add-btn" onClick={() => handleOpenNewsModal()}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Добавить новость
              </button>
            </div>

            <div className="news-management-grid">
              {newsItems.map((news) => (
                <div key={news.id} className="news-management-card">
                  <div className="news-card-header">
                    <span className={`news-type-badge type-${news.type}`}>
                      {news.type === 'update' ? 'Обновление' :
                        news.type === 'feature' ? 'Новая функция' :
                          'Объявление'}
                    </span>
                    {news.badge && <span className="news-badge">{news.badge}</span>}
                  </div>
                  <h3 className="news-card-title">{news.title}</h3>
                  <p className="news-card-description">{news.description}</p>
                  <div className="news-card-actions">
                    <button className="edit-btn" onClick={() => handleOpenNewsModal(news)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Редактировать
                    </button>
                    <button className="delete-btn-1" onClick={() => handleDeleteNews(news.id)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAQ Management */}
        {activeTab === 'faq' && (
          <div className="admin-section">
            <div className="section-header">
              <h2 className="section-title">Управление FAQ</h2>
              <p className="section-subtitle">Создание, редактирование и удаление часто задаваемых вопросов</p>
              <button className="add-btn" onClick={() => handleOpenFaqModal()}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Добавить вопрос
              </button>
            </div>

            <div className="faq-management-list">
              {faqItems.map((faq) => (
                <div key={faq.id} className="faq-management-card">
                  <div className="faq-card-content">
                    <h3 className="faq-card-question">{faq.question}</h3>
                    <p className="faq-card-answer">{faq.answer}</p>
                  </div>
                  <div className="faq-card-actions">
                    <button className="edit-btn" onClick={() => handleOpenFaqModal(faq)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      Редактировать
                    </button>
                    <button className="delete-btn-1" onClick={() => handleDeleteFaq(faq.id)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Модальное окно для новостей */}
      {showNewsModal && (
        <div className="modal-overlay" onClick={handleCloseNewsModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingNews ? 'Редактировать новость' : 'Добавить новость'}
              </h2>
              <button className="modal-close" onClick={handleCloseNewsModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Тип новости</label>
                <select
                  className="form-select"
                  value={newsForm.type}
                  onChange={(e) => setNewsForm({ ...newsForm, type: e.target.value as any })}
                >
                  <option value="update">Обновление</option>
                  <option value="feature">Новая функция</option>
                  <option value="announcement">Объявление</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Иконка</label>
                <select
                  className="form-select"
                  value={newsForm.icon}
                  onChange={(e) => setNewsForm({ ...newsForm, icon: e.target.value as any })}
                >
                  <option value="megaphone">Мегафон (Обновление)</option>
                  <option value="star">Звезда (Новая функция)</option>
                  <option value="news">Новости (Объявление)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Бейдж (необязательно)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Например: Последнее обновление"
                  value={newsForm.badge || ''}
                  onChange={(e) => setNewsForm({ ...newsForm, badge: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Заголовок</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Введите заголовок новости"
                  value={newsForm.title}
                  onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Краткое описание</label>
                <textarea
                  className="form-textarea"
                  placeholder="Краткое описание для карточки (1-2 предложения)"
                  rows={3}
                  value={newsForm.description}
                  onChange={(e) => setNewsForm({ ...newsForm, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Полное описание</label>
                <textarea
                  className="form-textarea"
                  placeholder="Подробное описание новости"
                  rows={6}
                  value={newsForm.fullDescription}
                  onChange={(e) => setNewsForm({ ...newsForm, fullDescription: e.target.value })}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="modal-btn cancel-btn" onClick={handleCloseNewsModal}>
                Отмена
              </button>
              <button className="modal-btn save-btn" onClick={handleSaveNews}>
                {editingNews ? 'Сохранить изменения' : 'Добавить новость'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно для FAQ */}
      {showFaqModal && (
        <div className="modal-overlay" onClick={handleCloseFaqModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingFaq ? 'Редактировать вопрос' : 'Добавить вопрос'}
              </h2>
              <button className="modal-close" onClick={handleCloseFaqModal}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Вопрос</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Введите часто задаваемый вопрос"
                  value={faqForm.question}
                  onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Ответ</label>
                <textarea
                  className="form-textarea"
                  placeholder="Введите подробный ответ на вопрос"
                  rows={8}
                  value={faqForm.answer}
                  onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="modal-btn cancel-btn" onClick={handleCloseFaqModal}>
                Отмена
              </button>
              <button className="modal-btn save-btn" onClick={handleSaveFaq}>
                {editingFaq ? 'Сохранить изменения' : 'Добавить вопрос'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;