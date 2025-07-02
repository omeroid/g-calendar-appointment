import { GOOGLE_CONFIG } from './config.js';
import { showElement, hideElement, showError, showSuccess, clearMessages } from './utils.js';
import { isAuthenticated } from './auth.js';
import { getSelectedParticipants } from './participants.js';
import { showDeleteConfirmation } from './delete-confirm.js';

/**
 * ミーティング予約枠作成機能
 */

// 作成されたミーティングを保存
let createdMeetings = [];
let currentScheduleData = null;

// 予約時間ボタンの初期化
export function initDurationButtons() {
    const buttons = document.querySelectorAll('.duration-btn');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            buttons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            document.getElementById('duration').value = this.dataset.duration;
        });
    });
}

// 確認画面を表示
export function showConfirmation() {
    const form = document.getElementById('scheduleForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const formData = new FormData(form);
    currentScheduleData = {
        title: formData.get('title'),
        description: formData.get('description'),
        duration: formData.get('duration'),
        location: formData.get('location'),
        customLocation: formData.get('customLocation'),
        participants: getSelectedParticipants(),
        dates: window.selectedDateTimes || []
    };

    // バリデーション
    if (currentScheduleData.dates.length === 0) {
        alert('利用可能な日付を少なくとも1つ追加してください');
        return;
    }

    // 確認内容を表示
    displayConfirmation(currentScheduleData);
    
    // 画面切り替え
    hideElement('mainSection');
    showElement('confirmSection');
}

// 確認内容を表示
function displayConfirmation(data) {
    const locationMap = {
        'meet': 'Google Meet',
        'phone': '電話',
        'physical': '対面',
        'custom': data.customLocation || 'カスタム'
    };

    const datesText = data.dates.map(dt => {
        const date = new Date(dt.date);
        const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
        return `${date.getMonth() + 1}/${date.getDate()}(${weekdays[date.getDay()]}) ${dt.startTime}〜${dt.endTime}`;
    }).join('<br>');

    const confirmHTML = `
        <div class="preview-item"><strong>タイトル:</strong> ${data.title}</div>
        <div class="preview-item"><strong>説明:</strong> ${data.description || 'なし'}</div>
        <div class="preview-item"><strong>予約時間:</strong> ${data.duration}分</div>
        <div class="preview-item"><strong>場所:</strong> ${locationMap[data.location]}</div>
        <div class="preview-item"><strong>参加者:</strong> ${data.participants.map(p => p.name).join(', ')}</div>
        <div class="preview-item"><strong>予約枠:</strong><br>${datesText}</div>
    `;

    document.getElementById('confirmContent').innerHTML = confirmHTML;
}

// 編集画面に戻る
export function backToEdit() {
    hideElement('confirmSection');
    showElement('mainSection');
}

// ミーティングを作成
export async function createMeetings() {
    clearMessages();

    if (!currentScheduleData) {
        showError('スケジュールデータが見つかりません');
        return;
    }

    try {
        // ボタンを無効化
        const buttons = document.querySelectorAll('#confirmSection button');
        buttons.forEach(btn => btn.disabled = true);

        // 認証確認
        if (!isAuthenticated()) {
            showError('ログインが必要です');
            return;
        }
        
        // 各日時に対してミーティングを作成
        const meetings = [];
        const batchId = `meeting-${Date.now()}`;
        
        for (const dateTime of currentScheduleData.dates) {
            const meeting = await createSingleMeeting(dateTime, currentScheduleData, batchId);
            meetings.push(meeting);
        }
        
        // 作成されたミーティングを保存
        createdMeetings.push({
            batchId: batchId,
            title: currentScheduleData.title,
            meetings: meetings,
            createdAt: new Date()
        });
        
        // 成功メッセージを表示
        showSuccess(`${meetings.length}件のミーティング予約枠を作成しました`);
        
        // 作成済み画面を表示
        displayCreatedMeetings();
        hideElement('confirmSection');
        showElement('createdSection');
        
    } catch (error) {
        console.error('エラー:', error);
        showError('ミーティングの作成中にエラーが発生しました: ' + (error.message || 'unknown error'));
    } finally {
        // ボタンを再度有効化
        const buttons = document.querySelectorAll('#confirmSection button');
        buttons.forEach(btn => btn.disabled = false);
    }
}

// 単一のミーティングを作成
async function createSingleMeeting(dateTime, scheduleData, batchId) {
    const date = new Date(dateTime.date);
    const [startHour, startMinute] = dateTime.startTime.split(':').map(Number);
    const [endHour, endMinute] = dateTime.endTime.split(':').map(Number);
    
    const startDateTime = new Date(date);
    startDateTime.setHours(startHour, startMinute, 0, 0);
    
    const endDateTime = new Date(startDateTime);
    endDateTime.setMinutes(endDateTime.getMinutes() + parseInt(scheduleData.duration));
    
    // 削除URLを生成
    const deleteUrl = `${window.location.origin}${window.location.pathname}#delete=${batchId}`;
    
    const event = {
        summary: scheduleData.title,
        description: scheduleData.description + `\n\nBatch ID: ${batchId}\n\n【一括削除URL】\n${deleteUrl}`,
        start: {
            dateTime: startDateTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
            dateTime: endDateTime.toISOString(),
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        attendees: scheduleData.participants.map(p => ({ email: p.email })),
        extendedProperties: {
            private: {
                batchId: batchId
            }
        }
    };
    
    // 場所の設定
    if (scheduleData.location === 'meet') {
        event.conferenceData = {
            createRequest: {
                requestId: `${batchId}-${Date.now()}`,
                conferenceSolutionKey: { type: 'hangoutsMeet' }
            }
        };
    } else if (scheduleData.location === 'custom' && scheduleData.customLocation) {
        event.location = scheduleData.customLocation;
    } else if (scheduleData.location === 'phone') {
        event.location = '電話';
    } else if (scheduleData.location === 'physical') {
        event.location = '対面';
    }
    
    try {
        const response = await gapi.client.calendar.events.insert({
            calendarId: 'primary',
            resource: event,
            conferenceDataVersion: event.conferenceData ? 1 : 0,
            sendUpdates: 'all'
        });
        
        return {
            id: response.result.id,
            htmlLink: response.result.htmlLink,
            start: startDateTime,
            end: endDateTime
        };
    } catch (error) {
        console.error('イベント作成エラー:', error);
        throw error;
    }
}

// 作成されたミーティングを表示
function displayCreatedMeetings() {
    const container = document.getElementById('createdMeetingsList');
    
    if (createdMeetings.length === 0) {
        container.innerHTML = '<p>作成されたミーティングはありません</p>';
        return;
    }
    
    const html = createdMeetings.map(batch => {
        const meetingsHtml = batch.meetings.map(meeting => {
            const start = new Date(meeting.start);
            const end = new Date(meeting.end);
            return `<li><a href="${meeting.htmlLink}" target="_blank">${formatDateTime(start)} - ${formatTime(end)}</a></li>`;
        }).join('');
        
        return `
            <div class="meeting-batch">
                <h3>${batch.title}</h3>
                <p>作成日時: ${formatDateTime(batch.createdAt)}</p>
                <ul>${meetingsHtml}</ul>
                <button class="btn-danger" onclick="deleteMeetingBatch('${batch.batchId}')">
                    このバッチを削除
                </button>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// 日時フォーマット
function formatDateTime(date) {
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    return `${date.getMonth() + 1}/${date.getDate()}(${weekdays[date.getDay()]}) ${formatTime(date)}`;
}

function formatTime(date) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// ミーティング一覧をコピー
export function copyMeetingsList() {
    const text = createdMeetings.map(batch => {
        const meetingsText = batch.meetings.map(meeting => {
            const start = new Date(meeting.start);
            return `  - ${formatDateTime(start)}`;
        }).join('\n');
        
        return `【${batch.title}】\n作成日時: ${formatDateTime(batch.createdAt)}\n${meetingsText}`;
    }).join('\n\n');
    
    navigator.clipboard.writeText(text).then(() => {
        alert('ミーティング一覧をコピーしました');
    }).catch(err => {
        console.error('コピーに失敗しました:', err);
        alert('コピーに失敗しました');
    });
}

// 新規作成
export function createNew() {
    hideElement('createdSection');
    showElement('mainSection');
    document.getElementById('scheduleForm').reset();
    window.selectedDateTimes = [];
    document.getElementById('selectedDates').innerHTML = '<p class="no-dates">日付が選択されていません</p>';
}

// すべてのミーティングを削除
export async function deleteAllMeetings() {
    if (!confirm('すべてのミーティングを削除しますか？')) {
        return;
    }
    
    try {
        for (const batch of createdMeetings) {
            await deleteMeetingBatch(batch.batchId, false);
        }
        
        createdMeetings = [];
        displayCreatedMeetings();
        showSuccess('すべてのミーティングを削除しました');
    } catch (error) {
        showError('削除中にエラーが発生しました: ' + error.message);
    }
}

// バッチ単位で削除
export async function deleteMeetingBatch(batchId, updateDisplay = true) {
    const batch = createdMeetings.find(b => b.batchId === batchId);
    if (!batch) return;
    
    // 削除確認画面を表示
    if (updateDisplay && !await showDeleteConfirmation(batch)) {
        return;
    }
    
    try {
        // 各ミーティングを削除
        for (const meeting of batch.meetings) {
            await gapi.client.calendar.events.delete({
                calendarId: 'primary',
                eventId: meeting.id
            });
        }
        
        // 配列から削除
        createdMeetings = createdMeetings.filter(b => b.batchId !== batchId);
        
        if (updateDisplay) {
            displayCreatedMeetings();
            showSuccess('ミーティングを削除しました');
        }
    } catch (error) {
        console.error('削除エラー:', error);
        throw error;
    }
}