// Google API設定
export const GOOGLE_CONFIG = {
    CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    API_KEY: import.meta.env.VITE_GOOGLE_API_KEY || '',
    SCOPES: 'https://www.googleapis.com/auth/calendar'
};

// デバッグ情報
if (!GOOGLE_CONFIG.CLIENT_ID) {
    console.error('VITE_GOOGLE_CLIENT_ID が設定されていません。.envファイルを確認してください。');
}
if (!GOOGLE_CONFIG.API_KEY) {
    console.error('VITE_GOOGLE_API_KEY が設定されていません。.envファイルを確認してください。');
}

// アプリケーション設定
export const APP_CONFIG = {
    // 曜日の名前
    DAY_NAMES: ['', '月', '火', '水', '木', '金'],
    
    // 場所のタイプ
    LOCATION_TYPES: {
        meet: 'Google Meet（自動生成）',
        phone: '電話',
        physical: '対面',
        custom: 'カスタム'
    },
    
    // デフォルト値
    DEFAULTS: {
        DURATION: 30,
        BUFFER_TIME: 0,
        MAX_BOOKING_TIME: 30,
        START_TIME: '09:00',
        END_TIME: '17:00'
    }
};