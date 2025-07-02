import { APP_CONFIG } from './config.js';
import { encodeData, showElement, hideElement } from './utils.js';

/**
 * 管理者モードの処理
 */

// 場所選択の変更を処理
export function initLocationSelector() {
    const locationSelect = document.getElementById('location');
    const customLocationGroup = document.getElementById('customLocationGroup');
    
    locationSelect.addEventListener('change', function() {
        customLocationGroup.style.display = this.value === 'custom' ? 'block' : 'none';
    });
}

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
        availability: []
    };

    // 曜日と時間帯を収集
    const days = document.querySelectorAll('input[name="days"]:checked');
    days.forEach(day => {
        const dayNum = day.value;
        scheduleData.availability.push({
            day: dayNum,
            startTime: formData.get(`startTime${dayNum}`),
            endTime: formData.get(`endTime${dayNum}`)
        });
    });

    // バリデーション
    if (!scheduleData.title) {
        alert('タイトルを入力してください');
        return;
    }

    if (scheduleData.availability.length === 0) {
        alert('利用可能な曜日を少なくとも1つ選択してください');
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
    const dayNames = APP_CONFIG.DAY_NAMES;

    const locationDisplay = data.location === 'custom' 
        ? (data.customLocation || 'カスタム')
        : locationNames[data.location];

    const availabilityText = data.availability.map(a => 
        `${dayNames[a.day]}曜日 ${a.startTime}〜${a.endTime}`
    ).join(', ');

    const previewHTML = `
        <div class="preview-item"><strong>タイトル:</strong> ${data.title}</div>
        <div class="preview-item"><strong>説明:</strong> ${data.description || 'なし'}</div>
        <div class="preview-item"><strong>予約時間:</strong> ${data.duration}分</div>
        <div class="preview-item"><strong>場所:</strong> ${locationDisplay}</div>
        <div class="preview-item"><strong>バッファタイム:</strong> ${data.bufferTime}分</div>
        <div class="preview-item"><strong>予約可能期間:</strong> ${data.maxBookingTime}日後まで</div>
        <div class="preview-item"><strong>利用可能時間:</strong> ${availabilityText}</div>
    `;

    document.getElementById('previewContent').innerHTML = previewHTML;
}