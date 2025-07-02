/**
 * 削除確認画面
 */

/**
 * 削除確認を表示
 */
export function showDeleteConfirmation(batch) {
    return new Promise((resolve) => {
        // モーダルを作成
        const modal = document.createElement('div');
        modal.className = 'delete-confirm-modal';
        modal.innerHTML = `
            <div class="delete-confirm-content">
                <h3>削除の確認</h3>
                <p>以下のミーティングを削除しますか？</p>
                <div class="delete-confirm-details">
                    <strong>${batch.title}</strong>
                    <p>作成日時: ${formatDateTime(batch.createdAt)}</p>
                    <p>予定数: ${batch.meetings.length}件</p>
                    <div class="meetings-to-delete">
                        ${batch.meetings.map(meeting => {
                            const start = new Date(meeting.start);
                            return `<div class="meeting-item">${formatDateTime(start)}</div>`;
                        }).join('')}
                    </div>
                </div>
                <div class="delete-confirm-buttons">
                    <button class="btn-secondary" id="cancelDelete">キャンセル</button>
                    <button class="btn-danger" id="confirmDelete">削除する</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // イベントリスナー
        document.getElementById('cancelDelete').addEventListener('click', () => {
            document.body.removeChild(modal);
            resolve(false);
        });
        
        document.getElementById('confirmDelete').addEventListener('click', () => {
            document.body.removeChild(modal);
            resolve(true);
        });
        
        // モーダル外クリックで閉じる
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
                resolve(false);
            }
        });
    });
}

/**
 * URLからの削除処理
 */
export async function handleDeleteFromUrl() {
    const hash = window.location.hash;
    if (!hash.startsWith('#delete=')) return;
    
    const batchId = hash.substring(8);
    if (!batchId) return;
    
    // ログイン確認
    const { isAuthenticated } = await import('./auth.js');
    if (!isAuthenticated()) {
        alert('削除するにはログインが必要です');
        return;
    }
    
    // バッチを検索
    try {
        // Google Calendar APIでバッチIDを含むイベントを検索
        const response = await gapi.client.calendar.events.list({
            calendarId: 'primary',
            q: `Batch ID: ${batchId}`,
            maxResults: 100
        });
        
        const events = response.result.items || [];
        if (events.length === 0) {
            alert('該当するミーティングが見つかりません');
            return;
        }
        
        // 削除確認
        const confirmBatch = {
            batchId: batchId,
            title: events[0].summary,
            meetings: events.map(event => ({
                id: event.id,
                start: event.start.dateTime
            })),
            createdAt: new Date(events[0].created)
        };
        
        if (await showDeleteConfirmation(confirmBatch)) {
            // 削除実行
            for (const event of events) {
                await gapi.client.calendar.events.delete({
                    calendarId: 'primary',
                    eventId: event.id
                });
            }
            alert(`${events.length}件のミーティングを削除しました`);
        }
    } catch (error) {
        console.error('削除エラー:', error);
        alert('削除中にエラーが発生しました');
    }
    
    // URLをクリア
    window.location.hash = '';
}

// 日時フォーマット
function formatDateTime(date) {
    const d = new Date(date);
    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    return `${d.getMonth() + 1}/${d.getDate()}(${weekdays[d.getDay()]}) ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// グローバルに公開
window.showDeleteConfirmation = showDeleteConfirmation;