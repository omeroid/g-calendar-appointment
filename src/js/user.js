import { APP_CONFIG, GOOGLE_CONFIG } from './config.js';
import { decodeData, getUrlParams, showElement, hideElement, showError, showSuccess, clearMessages } from './utils.js';
import { initializeGoogleAPI, initializeGoogleIdentity, authenticate, createAppointmentSchedule } from './google-calendar.js';

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

    if (!window.scheduleData) {
        showError('スケジュールデータが見つかりません');
        return;
    }

    try {
        // ボタンを無効化
        const button = document.querySelector('.btn-secondary');
        if (button) {
            button.disabled = true;
            button.innerHTML = '処理中... <span class="loading"></span>';
        }

        // Google API を初期化
        await initializeGoogleAPI();
        await initializeGoogleIdentity();
        
        // ユーザー認証
        await authenticate();
        
        // 予約スケジュールを作成
        const calendar = await createAppointmentSchedule(window.scheduleData);
        
        // 成功メッセージを表示
        showSuccess(`予約スケジュール「${window.scheduleData.title}」が正常に作成されました！`);
        
        // カレンダーへのリンクを表示
        const successElement = document.getElementById('successMessage');
        if (successElement && calendar) {
            successElement.innerHTML += `<br><a href="https://calendar.google.com/calendar/u/0/r/settings/calendar/${calendar.id}" target="_blank" style="color: #1a73e8; text-decoration: underline;">カレンダーを確認する</a>`;
        }
    } catch (error) {
        console.error('エラー:', error);
        showError('予約スケジュールの作成中にエラーが発生しました: ' + (error.message || 'unknown error'));
    } finally {
        // ボタンを再度有効化
        const button = document.querySelector('.btn-secondary');
        if (button) {
            button.disabled = false;
            button.innerHTML = 'Googleアカウントでログインして作成';
        }
    }
}