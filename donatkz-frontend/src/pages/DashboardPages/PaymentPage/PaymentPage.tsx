import React, { useState } from 'react';
import './PaymentPage.css';
import { useAuth } from '../../../context/AuthContext';
import { tariffRequestApi } from '../../../api/tariffRequest.api';

const PaymentPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [selectedTariff, setSelectedTariff] = useState('BASIC');
  const [selectedDuration, setSelectedDuration] = useState('1');
  const [promocode, setPromocode] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const tariffs = [
    { value: 'BASIC', label: 'BASIC', price: 4999 },
    { value: 'PREMIUM', label: 'PREMIUM', price: 9999 },
  ];

  const durations = [
    { value: '1', label: '1 мес.', multiplier: 1 },
    { value: '3', label: '3 мес.', multiplier: 3 },
    { value: '6', label: '6 мес.', multiplier: 6 },
    { value: '12', label: '12 мес.', multiplier: 12 },
  ];

  const selectedTariffData = tariffs.find((t) => t.value === selectedTariff);
  const selectedDurationData = durations.find((d) => d.value === selectedDuration);
  const totalAmount = selectedTariffData && selectedDurationData
    ? selectedTariffData.price * selectedDurationData.multiplier
    : 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!receiptFile) {
      setSubmitStatus({
        success: false,
        message: 'Пожалуйста, загрузите чек'
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // TODO: Загрузка файла на сервер (пока оставляем receiptUrl как null)
      // В будущем можно добавить отдельный endpoint для загрузки файлов
      // const formData = new FormData();
      // formData.append('file', receiptFile);
      // const uploadResponse = await axiosInstance.post('/api/files/upload', formData);
      // const receiptUrl = uploadResponse.data.url;

      const selectedTariffData = tariffs.find((t) => t.value === selectedTariff);
      const selectedDurationData = durations.find((d) => d.value === selectedDuration);
      
      if (!selectedTariffData || !selectedDurationData) {
        throw new Error('Неверный тариф или длительность');
      }

      await tariffRequestApi.createTariffRequest({
        tariff: selectedTariff as 'FREE' | 'BASIC' | 'PREMIUM',
        durationMonths: selectedDurationData.multiplier,
        amount: selectedTariffData.price * selectedDurationData.multiplier,
        promocode: promocode || undefined,
        receiptUrl: undefined, // TODO: Добавить загрузку файла
      });

      setSubmitStatus({
        success: true,
        message: 'Заявка отправлена на проверку. Мы свяжемся с вами в течение 24 часов.'
      });
      
      // Сброс формы
      setReceiptFile(null);
      setPromocode('');
      setSelectedTariff('BASIC');
      setSelectedDuration('1');
      
      // Очистить сообщение через 5 секунд
      setTimeout(() => {
        setSubmitStatus(null);
      }, 5000);
    } catch (error: any) {
      console.error('Failed to submit tariff request:', error);
      setSubmitStatus({
        success: false,
        message: error.response?.data?.message || 'Ошибка при отправке заявки. Попробуйте позже.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  return (
    <div className="payment-page">
      {/* Оформление подписки */}
      <div className="payment-form-section">
        <div className="payment-form-header">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
            <line x1="1" y1="10" x2="23" y2="10" />
          </svg>
          <h2 className="payment-form-title">Оформление подписки</h2>
        </div>

        <div className="payment-form-body">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label-payment">Тариф</label>
              <select
                className="form-select"
                value={selectedTariff}
                onChange={(e) => setSelectedTariff(e.target.value)}
              >
                {tariffs.map((tariff) => (
                  <option key={tariff.value} value={tariff.value}>
                    {tariff.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label-payment">Срок подписки</label>
              <select
                className="form-select"
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(e.target.value)}
              >
                {durations.map((duration) => (
                  <option key={duration.value} value={duration.value}>
                    {duration.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label-payment">Промокод</label>
            <input
              type="text"
              className="form-input-payment"
              placeholder="Введите промокод (если есть)"
              value={promocode}
              onChange={(e) => setPromocode(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label-payment">Загрузите чек (PDF)</label>
            <div className="file-upload-wrapper">
              <input
                type="file"
                id="receipt-upload"
                className="file-upload-input"
                accept=".pdf"
                onChange={handleFileChange}
              />
              <label htmlFor="receipt-upload" className="file-upload-label">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Выберите файл
              </label>
              <span className="file-upload-name">
                {receiptFile ? receiptFile.name : 'Файл не выбран'}
              </span>
            </div>
          </div>

          <div className="payment-total">
            <span className="payment-total-label">Итого:</span>
            <span className="payment-total-amount">
              {formatNumber(totalAmount)} ТГ
            </span>
          </div>

          <button className="submit-payment-btn" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Отправка...' : 'Отправить заявку'}
          </button>

          {submitStatus && (
            <div className={`submit-status ${submitStatus.success ? 'success' : 'error'}`}>
              {submitStatus.message}
            </div>
          )}
        </div>
      </div>

      {/* Реквизиты для оплаты */}
      <div className="payment-details-section">
        <div className="payment-details-header">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
          </svg>
          <h2 className="payment-details-title">Реквизиты для оплаты</h2>
        </div>

        <div className="payment-details-body">
          <div className="payment-detail-item">
            <div className="payment-detail-label">Kaspi GOLD:</div>
            <div className="payment-detail-value">4444 1234 1234 1234 (Нурдалует С.)</div>
          </div>
          <div className="payment-detail-item">
            <div className="payment-detail-label">Freedom:</div>
            <div className="payment-detail-value">444 1234 1234 1234 (Нурдалует С.)</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;