// src/types/api.types.ts

// ========== AUTH TYPES ==========

export interface LoginRequest {
    login: string; // username или email
    password: string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    confirmPassword: string; // ← Добавлено!
    channelUrl?: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    expiresIn: number;
    user: User;
}

export interface User {
    id: number;
    username: string;
    email: string;
    displayName: string | null;
    channelUrl: string | null;
    kaspiPhone: string | null;
    role: 'USER' | 'ADMIN' | 'SUPERADMIN';
    subscriptionTier: 'FREE' | 'BASIC' | 'PREMIUM';
    subscriptionStartAt: string | null;
    subscriptionExpiresAt: string | null;
    isSubscriptionActive: boolean;
    currentMonthDonations: number;
    monthlyDonationLimit: number | null;
    isEmailVerified: boolean;
    createdAt: string;
}

// ========== DONATION TYPES ==========

export interface Donation {
    id: number;
    amount: number;
    senderName: string;
    message: string | null;
    timestamp: string;
    status: 'PENDING' | 'PROCESSED' | 'FAILED';
    voiceEnabled: boolean;
    createdAt?: string;
}

export interface DonationStats {
    totalCount: number;
    totalAmount: number;
    averageAmount: number;
    maxAmount: number;
}

export interface ChartDataPoint {
    time: string;
    value: number;
}

export interface DonationStats {
    totalCount: number;
    totalAmount: number;
    averageAmount: number;
    maxAmount: number;
}

export interface TopDonor {
    senderName: string;
    totalAmount: number;
    donationCount: number;
    rank: number;
}

// ========== DEVICE TYPES ==========

export interface GenerateCodeResponse {
    code: string;
    expiresAt: string;
    expiresIn: number;
}

export interface DeviceInfo {
    id: number;
    deviceId: string;
    deviceName: string;
    isActive: boolean;
    pairedAt: string;
    lastUsedAt: string | null;
    createdAt: string;
}

// ========== WEBSOCKET TYPES ==========

export interface WebSocketApiKeyResponse {
    apiKey: string;
    wsUrl: string;
    topic: string;
    maskedKey: string;
}

export interface DonationWebSocketMessage {
    type: 'NEW_DONATION' | 'DONATION_UPDATE' | 'DONATION_DELETE';
    donationId: number;
    amount: number;
    senderName: string;
    message: string | null;
    timestamp: string;
    voiceEnabled: boolean;
    formattedAmount: string;
    sentAt: string;
}

// ========== VOICE SETTINGS TYPES ==========

export interface VoiceSettings {
    voiceEnabled: boolean;
    voiceMinAmount: number;
    voiceLanguage: 'ru-RU' | 'kk-KZ' | 'en-US';
    voiceAvailable: boolean;
    subscriptionTier: string;
}

// ========== ERROR TYPES ==========

export interface ApiError {
    status: number;
    error: string;
    message: string;
    timestamp: string;
    validationErrors?: Record<string, string>;
}

// ========== PAGINATION ==========

export interface PageRequest {
    page: number;
    size: number;
}

export interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}