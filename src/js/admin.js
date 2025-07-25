import { APP_CONFIG } from './config.js';
import { encodeData, showElement, hideElement } from './utils.js';

/**
 * 管理者モードの処理
 */

// 選択された日付と時間を保存する配列
let selectedDateTimes = [];

// 場所選択の変更を処理
export function initLocationSelector() {
    const locationSelect = document.getElementById('location');
    const customLocationGroup = document.getElementById('customLocationGroup');
    
    if (locationSelect && customLocationGroup) {
        locationSelect.addEventListener('change', function() {
            customLocationGroup.style.display = this.value === 'custom' ? 'block' : 'none';
        });
    }
}

// 日付と時間を追加
export function addDateTime() {
    const dateInput = document.getElementById('dateInput');
    const startTimeInput = document.getElementById('startTimeInput');
    const duration = parseInt(document.getElementById('duration').value) || 60; // デフォルト60分
    
    if (!dateInput.value) {
        alert('日付を選択してください');
        return;
    }
    
    // 終了時間を自動計算
    const [startHour, startMinute] = startTimeInput.value.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = startMinutes + duration;
    const endHour = Math.floor(endMinutes / 60);
    const endMinute = endMinutes % 60;
    const endTime = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;
    
    const dateTime = {
        id: Date.now(),
        date: dateInput.value,
        startTime: startTimeInput.value,
        endTime: endTime
    };
    
    // 同じ日付と時間が重複するかチェック
    const hasConflict = selectedDateTimes.some(dt => {
        if (dt.date !== dateTime.date) return false;
        
        // 時間の重複をチェック
        const existingStart = timeToMinutes(dt.startTime);
        const existingEnd = timeToMinutes(dt.endTime);
        const newStart = timeToMinutes(dateTime.startTime);
        const newEnd = timeToMinutes(dateTime.endTime);
        
        return (newStart < existingEnd && newEnd > existingStart);
    });
    
    if (hasConflict) {
        if (!confirm(`${formatDate(dateTime.date)} ${dateTime.startTime}は既に予定が入っています。それでも追加しますか？`)) {
            return;
        }
    }
    
    selectedDateTimes.push(dateTime);
    
    // 日付でソート
    selectedDateTimes.sort((a, b) => a.date.localeCompare(b.date));
    
    // 表示を更新
    updateSelectedDatesDisplay();
    
    // 日付入力は変更せず、保持する（ユーザーの要望により）
    // const nextDate = new Date(dateInput.value);
    // nextDate.setDate(nextDate.getDate() + 1);
    // dateInput.value = nextDate.toISOString().split('T')[0];
}

// 選択された日付の表示を更新
function updateSelectedDatesDisplay() {
    const container = document.getElementById('selectedDates');
    
    if (selectedDateTimes.length === 0) {
        container.innerHTML = '<p class="no-dates">日付が選択されていません</p>';
        return;
    }
    
    container.innerHTML = selectedDateTimes.map(dt => `
        <div class="selected-date-item">
            <span class="date-text">${formatDate(dt.date)} ${dt.startTime}</span>
            <button type="button" class="btn-remove-date" onclick="removeDateTime(${dt.id})">
                削除
            </button>
        </div>
    `).join('');
}

// 日付を削除
export function removeDateTime(id) {
    selectedDateTimes = selectedDateTimes.filter(dt => dt.id !== id);
    updateSelectedDatesDisplay();
}

// 日付フォーマット
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    return `${date.getMonth() + 1}/${date.getDate()}(${weekdays[date.getDay()]})`;
}

// 時間を分に変換
function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

// グローバルに公開
window.selectedDateTimes = selectedDateTimes;

// 選択された日付をクリアする関数
export function clearSelectedDateTimes() {
    selectedDateTimes.length = 0;
    updateSelectedDatesDisplay();
}

window.clearSelectedDateTimes = clearSelectedDateTimes;

// リンク生成
export function generateLink() {
    const form = document.getElementById('scheduleForm');
    const formData = new FormData(form);
    
    // フォームデータを収集
    const scheduleData = {
        title: formData.get('title'),
        description: formData.get('description'),
        duration: formData.get('duration'),
        location: formData.get('location'),
        customLocation: formData.get('customLocation'),
        bufferTime: formData.get('bufferTime'),
        maxBookingTime: formData.get('maxBookingTime'),
        availableDates: selectedDateTimes
    };

    // バリデーション
    if (!scheduleData.title) {
        alert('タイトルを入力してください');
        return;
    }

    if (scheduleData.availableDates.length === 0) {
        alert('利用可能な日付を少なくとも1つ追加してください');
        return;
    }

    // データをBase64エンコード
    const encodedData = encodeData(scheduleData);
    
    // 現在のページのURLを基準にリンクを生成
    const baseUrl = window.location.href.split('?')[0];
    const generatedUrl = `${baseUrl}?data=${encodedData}`;
    
    // リンクを表示
    document.getElementById('generatedLink').textContent = generatedUrl;
    showElement('linkSection');
    
    // プレビューを表示
    showPreview(scheduleData);
}

// リンクをコピー
export function copyLink() {
    const linkText = document.getElementById('generatedLink').textContent;
    navigator.clipboard.writeText(linkText).then(() => {
        alert('リンクをコピーしました！');
    }).catch(err => {
        console.error('コピーに失敗しました:', err);
        alert('コピーに失敗しました。手動でコピーしてください。');
    });
}

// プレビュー表示
function showPreview(data) {
    const locationNames = APP_CONFIG.LOCATION_TYPES;

    const locationDisplay = data.location === 'custom' 
        ? (data.customLocation || 'カスタム')
        : locationNames[data.location];

    const datesText = data.availableDates.map(dt => 
        `${formatDate(dt.date)} ${dt.startTime}〜${dt.endTime}`
    ).join('<br>');

    const previewHTML = `
        <div class="preview-item"><strong>タイトル:</strong> ${data.title}</div>
        <div class="preview-item"><strong>説明:</strong> ${data.description || 'なし'}</div>
        <div class="preview-item"><strong>予約時間:</strong> ${data.duration}分</div>
        <div class="preview-item"><strong>場所:</strong> ${locationDisplay}</div>
        <div class="preview-item"><strong>バッファタイム:</strong> ${data.bufferTime}分</div>
        <div class="preview-item"><strong>予約可能期間:</strong> ${data.maxBookingTime}日後まで</div>
        <div class="preview-item"><strong>利用可能日時:</strong><br>${datesText}</div>
    `;

    document.getElementById('previewContent').innerHTML = previewHTML;
}