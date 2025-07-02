import { showElement, hideElement, showError, showSuccess } from './utils.js';

/**
 * バッチ管理機能
 */

// バッチ一覧画面を表示
export async function showBatchList() {
    hideElement('mainSection');
    hideElement('confirmSection');
    hideElement('createdSection');
    showElement('batchListSection');
    
    // バッチ一覧を取得して表示
    await loadBatchList();
}

// メイン画面に戻る
export function goToMainSection() {
    hideElement('batchListSection');
    showElement('mainSection');
}

// バッチ一覧を読み込み
async function loadBatchList() {
    const container = document.getElementById('batchList');
    container.innerHTML = '<p>読み込み中...</p>';
    
    try {
        // 過去1ヶ月のイベントを検索
        const now = new Date();
        const oneMonthAgo = new Date(now);
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        const response = await gapi.client.calendar.events.list({
            calendarId: 'primary',
            timeMin: oneMonthAgo.toISOString(),
            timeMax: now.toISOString(),
            maxResults: 500,
            singleEvents: true,
            orderBy: 'startTime'
        });
        
        const events = response.result.items || [];
        
        // バッチIDでグループ化
        const batches = {};
        events.forEach(event => {
            if (event.description && event.description.includes('Batch ID:')) {
                const match = event.description.match(/Batch ID: (meeting-\d+)/);
                if (match) {
                    const batchId = match[1];
                    if (!batches[batchId]) {
                        batches[batchId] = {
                            batchId: batchId,
                            title: event.summary,
                            events: []
                        };
                    }
                    batches[batchId].events.push(event);
                }
            }
        });
        
        // バッチ一覧を表示
        displayBatchList(batches);
        
    } catch (error) {
        console.error('バッチ一覧の取得エラー:', error);
        container.innerHTML = '<p>バッチ一覧の取得に失敗しました。</p>';
    }
}

// バッチ一覧を表示
function displayBatchList(batches) {
    const container = document.getElementById('batchList');
    
    const batchArray = Object.values(batches);
    if (batchArray.length === 0) {
        container.innerHTML = '<p>作成済みのバッチはありません。</p>';
        return;
    }
    
    const html = batchArray.map(batch => {
        const eventCount = batch.events.length;
        const firstEvent = batch.events[0];
        const createdDate = new Date(firstEvent.created);
        
        return `
            <div class="batch-item">
                <h4>${batch.title}</h4>
                <p>バッチID: ${batch.batchId}</p>
                <p>予定数: ${eventCount}件</p>
                <p>作成日: ${formatDate(createdDate)}</p>
                <button class="btn-primary" onclick="selectBatchMeeting('${batch.batchId}')">
                    1つを選んで他を削除
                </button>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
}

// バッチから1つの予定を選択
export async function selectBatchMeeting(batchId) {
    try {
        // バッチのイベントを取得
        const response = await gapi.client.calendar.events.list({
            calendarId: 'primary',
            q: `Batch ID: ${batchId}`,
            maxResults: 100
        });
        
        const events = response.result.items || [];
        if (events.length === 0) {
            showError('該当するミーティングが見つかりません');
            return;
        }
        
        // 予定選択モーダルを表示
        showMeetingSelectionModal(events, batchId);
        
    } catch (error) {
        console.error('バッチ取得エラー:', error);
        showError('バッチの取得に失敗しました');
    }
}

// 予定選択モーダルを表示
function showMeetingSelectionModal(events, batchId) {
    // 既存のモーダルがあれば削除
    const existingModal = document.querySelector('.meeting-selection-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // イベントデータを保存
    window.currentModalEvents = events;
    
    // モーダルを作成
    const modal = document.createElement('div');
    modal.className = 'meeting-selection-modal';
    
    const eventOptions = events.map((event, index) => {
        const start = new Date(event.start.dateTime);
        return `
            <label class="meeting-option">
                <input type="radio" name="selectedMeeting" value="${index}">
                <span>${formatDateTime(start)}</span>
            </label>
        `;
    }).join('');
    
    // タイムスタンプを追加してユニークにする
    const modalId = `modal-${Date.now()}`;
    modal.setAttribute('data-modal-id', modalId);
    
    modal.innerHTML = `
        <div class="meeting-selection-content">
            <h3>残す予定を選択してください</h3>
            <p>選択されなかった予定は削除されます。</p>
            <div class="meeting-options" id="${modalId}-options">
                ${eventOptions}
            </div>
            <div class="modal-buttons">
                <button class="btn-secondary" onclick="closeMeetingSelectionModal()">
                    キャンセル
                </button>
                <button class="btn-danger" onclick="keepSelectedMeeting('${batchId}')">
                    選択した予定以外を削除
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// モーダルを閉じる
export function closeMeetingSelectionModal() {
    const modal = document.querySelector('.meeting-selection-modal');
    if (modal) {
        // 選択状態もクリア
        window.currentModalEvents = null;
        modal.remove();
    }
}

// 選択された予定以外を削除
export async function keepSelectedMeeting(batchId) {
    const events = window.currentModalEvents;
    const selectedIndex = document.querySelector('input[name="selectedMeeting"]:checked')?.value;
    
    if (selectedIndex === undefined) {
        alert('予定を選択してください');
        return;
    }
    
    const selectedEvent = events[parseInt(selectedIndex)];
    const eventsToDelete = events.filter((_, index) => index !== parseInt(selectedIndex));
    
    if (!confirm(`${eventsToDelete.length}件の予定を削除します。よろしいですか？`)) {
        return;
    }
    
    try {
        // 選択されなかった予定を削除
        for (const event of eventsToDelete) {
            await gapi.client.calendar.events.delete({
                calendarId: 'primary',
                eventId: event.id
            });
        }
        
        // 選択された予定からバッチ管理URLを削除
        await removeBatchUrlFromEvent(selectedEvent);
        
        showSuccess(`${eventsToDelete.length}件の予定を削除しました`);
        closeMeetingSelectionModal();
        
        // バッチ一覧を再読み込み
        await loadBatchList();
        
    } catch (error) {
        console.error('削除エラー:', error);
        showError('予定の削除に失敗しました');
    }
}

// 日時フォーマット
function formatDateTime(date) {
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    return `${date.getMonth() + 1}/${date.getDate()}(${weekdays[date.getDay()]}) ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// 日付フォーマット
function formatDate(date) {
    return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

// イベントからバッチ管理URLを削除し、タイトルを更新
async function removeBatchUrlFromEvent(event) {
    try {
        // 説明からバッチ関連の情報を削除
        let newDescription = event.description || '';
        
        // Batch IDとバッチ管理URLの行を削除
        newDescription = newDescription
            .split('\n')
            .filter(line => !line.includes('Batch ID:') && !line.includes('【バッチ管理URL】') && !line.includes('#batch='))
            .join('\n')
            .trim();
        
        // タイトルを【候補】から【確定】に変更
        let newTitle = event.summary || '';
        newTitle = newTitle.replace('【候補】', '【確定】');
        
        // イベントを更新
        await gapi.client.calendar.events.patch({
            calendarId: 'primary',
            eventId: event.id,
            resource: {
                summary: newTitle,
                description: newDescription
            }
        });
        
        console.log('バッチ管理URLを削除し、タイトルを更新しました');
    } catch (error) {
        console.error('バッチURL削除エラー:', error);
    }
}

// URLからのバッチ管理処理
export async function handleBatchFromUrl() {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#batch=')) {
        const batchId = hash.substring(7);
        console.log('バッチ管理URLを検出:', batchId);
        
        // バッチ管理画面を表示
        showBatchManagementScreen(batchId);
    }
}

// バッチ管理画面を表示
async function showBatchManagementScreen(batchId) {
    hideElement('loginSection');
    hideElement('mainSection');
    hideElement('confirmSection');
    hideElement('createdSection');
    
    // バッチ管理用の画面を作成
    const container = document.querySelector('.container');
    const existingScreen = document.getElementById('batchManagementSection');
    if (existingScreen) {
        existingScreen.remove();
    }
    
    const managementSection = document.createElement('div');
    managementSection.id = 'batchManagementSection';
    managementSection.className = 'section';
    managementSection.innerHTML = `
        <h2>バッチ管理</h2>
        <p>バッチID: ${batchId}</p>
        <div id="batchManagementContent">
            <p>読み込み中...</p>
        </div>
    `;
    
    container.appendChild(managementSection);
    
    // バッチのイベントを取得
    try {
        const response = await gapi.client.calendar.events.list({
            calendarId: 'primary',
            q: `Batch ID: ${batchId}`,
            maxResults: 100,
            singleEvents: true,
            orderBy: 'startTime'
        });
        
        const events = response.result.items || [];
        if (events.length === 0) {
            document.getElementById('batchManagementContent').innerHTML = `
                <p>該当するミーティングが見つかりません。</p>
                <button class="btn-primary" onclick="window.location.href='${window.location.pathname}'">
                    ホームへ戻る
                </button>
            `;
            return;
        }
        
        // バッチ管理オプションを表示
        displayBatchManagementOptions(events, batchId);
        
    } catch (error) {
        console.error('バッチ取得エラー:', error);
        document.getElementById('batchManagementContent').innerHTML = `
            <p>エラーが発生しました。</p>
            <button class="btn-primary" onclick="window.location.href='${window.location.pathname}'">
                ホームへ戻る
            </button>
        `;
    }
}

// バッチ管理オプションを表示
function displayBatchManagementOptions(events, batchId) {
    const content = document.getElementById('batchManagementContent');
    
    const meetingsList = events.map(event => {
        const start = new Date(event.start.dateTime);
        return `<li>${formatDateTime(start)}</li>`;
    }).join('');
    
    content.innerHTML = `
        <div class="preview-section">
            <h3>このバッチのミーティング一覧</h3>
            <ul>${meetingsList}</ul>
        </div>
        <div style="margin-top: 30px;">
            <button class="btn-danger" onclick="deleteAllInBatch('${batchId}')">
                すべて削除
            </button>
            <button class="btn-primary" onclick="selectOneFromBatch('${batchId}')">
                1つを選んで他を削除
            </button>
            <button class="btn-secondary" onclick="window.location.href='${window.location.pathname}'">
                キャンセル
            </button>
        </div>
    `;
}

// バッチ内のすべてを削除
export async function deleteAllInBatch(batchId) {
    if (!confirm('このバッチのすべてのミーティングを削除しますか？')) {
        return;
    }
    
    try {
        const response = await gapi.client.calendar.events.list({
            calendarId: 'primary',
            q: `Batch ID: ${batchId}`,
            maxResults: 100
        });
        
        const events = response.result.items || [];
        
        for (const event of events) {
            await gapi.client.calendar.events.delete({
                calendarId: 'primary',
                eventId: event.id
            });
        }
        
        showSuccess(`${events.length}件のミーティングを削除しました`);
        
        // ホームへ戻る
        setTimeout(() => {
            window.location.href = window.location.pathname;
        }, 2000);
        
    } catch (error) {
        console.error('削除エラー:', error);
        showError('削除に失敗しました');
    }
}

// バッチから1つを選択
export async function selectOneFromBatch(batchId) {
    try {
        const response = await gapi.client.calendar.events.list({
            calendarId: 'primary',
            q: `Batch ID: ${batchId}`,
            maxResults: 100,
            singleEvents: true,
            orderBy: 'startTime'
        });
        
        const events = response.result.items || [];
        window.currentBatchEvents = events;
        
        // 選択モーダルを表示
        showMeetingSelectionModal(events, batchId);
        
    } catch (error) {
        console.error('エラー:', error);
        showError('エラーが発生しました');
    }
}

// グローバルに公開
window.showBatchList = showBatchList;
window.goToMainSection = goToMainSection;
window.selectBatchMeeting = selectBatchMeeting;
window.closeMeetingSelectionModal = closeMeetingSelectionModal;
window.keepSelectedMeeting = keepSelectedMeeting;
window.deleteAllInBatch = deleteAllInBatch;
window.selectOneFromBatch = selectOneFromBatch;