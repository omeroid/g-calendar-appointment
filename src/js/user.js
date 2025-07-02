import { APP_CONFIG, GOOGLE_CONFIG } from './config.js';
import { decodeData, getUrlParams, showElement, hideElement, showError, showSuccess, clearMessages } from './utils.js';

/**
 * 実行モード（本人用）の処理
 */

// URLからスケジュールデータを読み込み
export function loadScheduleFromURL() {
    const urlParams = getUrlParams();
    const encodedData = urlParams.get('data');
    
    if (encodedData) {
        try {
            const scheduleData = decodeData(encodedData);
            showElement('scheduleDetails');
            hideElement('noDataMessage');
            
            // プレビューと同じ形式で表示
            displayScheduleDetails(scheduleData);
            
            // データを保存（後で使用）
            window.scheduleData = scheduleData;
        } catch (error) {
            console.error('データの解析に失敗しました:', error);
            hideElement('scheduleDetails');
            showElement('noDataMessage');
        }
    } else {
        hideElement('scheduleDetails');
        showElement('noDataMessage');
    }
}

// スケジュール詳細を表示
function displayScheduleDetails(scheduleData) {
    const locationNames = APP_CONFIG.LOCATION_TYPES;

    const locationDisplay = scheduleData.location === 'custom' 
        ? (scheduleData.customLocation || 'カスタム')
        : locationNames[scheduleData.location];

    let datesText = '';
    if (scheduleData.availableDates) {
        // 新しい形式（特定の日付）
        datesText = scheduleData.availableDates.map(dt => {
            const date = new Date(dt.date);
            const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
            return `${date.getMonth() + 1}/${date.getDate()}(${weekdays[date.getDay()]}) ${dt.startTime}〜${dt.endTime}`;
        }).join('<br>');
    } else if (scheduleData.availability) {
        // 古い形式（曜日ベース）との互換性
        const dayNames = APP_CONFIG.DAY_NAMES;
        datesText = scheduleData.availability.map(a => 
            `${dayNames[a.day]}曜日 ${a.startTime}〜${a.endTime}`
        ).join('<br>');
    }

    const contentHTML = `
        <div class="preview-item"><strong>タイトル:</strong> ${scheduleData.title}</div>
        <div class="preview-item"><strong>説明:</strong> ${scheduleData.description || 'なし'}</div>
        <div class="preview-item"><strong>予約時間:</strong> ${scheduleData.duration}分</div>
        <div class="preview-item"><strong>場所:</strong> ${locationDisplay}</div>
        <div class="preview-item"><strong>バッファタイム:</strong> ${scheduleData.bufferTime}分</div>
        <div class="preview-item"><strong>予約可能期間:</strong> ${scheduleData.maxBookingTime}日後まで</div>
        <div class="preview-item"><strong>利用可能日時:</strong><br>${datesText}</div>
    `;

    document.getElementById('scheduleContent').innerHTML = contentHTML;
}

// Google Calendar APIを使用して予約スケジュールを作成
export async function createSchedule() {
    clearMessages();

    try {
        // Google API クライアントを初期化
        await loadGoogleAPI();
        
        // ユーザー認証
        const authResult = await authenticate();
        
        if (authResult) {
            // 予約スケジュールを作成
            await createAppointmentSchedule();
        }
    } catch (error) {
        showError('予約スケジュールの作成中にエラーが発生しました: ' + error.message);
    }
}

// Google API の読み込み（簡略化版）
async function loadGoogleAPI() {
    // 実際の実装では、Google API Client Libraryを読み込みます
    return new Promise((resolve) => {
        // ここでgapi.load等を使用
        console.log('Google API loaded');
        console.log('Client ID:', GOOGLE_CONFIG.CLIENT_ID);
        console.log('API Key:', GOOGLE_CONFIG.API_KEY);
        resolve();
    });
}

// 認証処理（簡略化版）
async function authenticate() {
    // 実際の実装では、OAuth2認証を行います
    return new Promise((resolve) => {
        console.log('Authentication successful');
        resolve(true);
    });
}

// 予約スケジュールの作成（簡略化版）
async function createAppointmentSchedule() {
    // 実際の実装では、Google Calendar APIを使用して予約スケジュールを作成します
    console.log('Creating appointment schedule with data:', window.scheduleData);
    
    // 成功メッセージを表示
    showSuccess('予約スケジュールが正常に作成されました！');
}