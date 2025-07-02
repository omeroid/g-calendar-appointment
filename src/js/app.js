import { showElement, hideElement } from './utils.js';
import { addDateTime, removeDateTime } from './admin.js';
import { 
    initDurationButtons, 
    showConfirmation, 
    backToEdit, 
    createMeetings,
    copyMeetingsList,
    createNew,
    deleteAllMeetings,
    deleteMeetingBatch
} from './meetings.js';
import { initAuth, login, logout } from './auth.js';
import { initParticipantSearch } from './participants.js';
import { handleDeleteFromUrl } from './delete-confirm.js';
import { handleBatchFromUrl } from './batch-manager.js';

/**
 * メインアプリケーション
 */

// グローバル関数として登録（HTMLのonclickから呼び出すため）
window.showConfirmation = showConfirmation;
window.backToEdit = backToEdit;
window.createMeetings = createMeetings;
window.addDateTime = addDateTime;
window.removeDateTime = removeDateTime;
window.copyMeetingsList = copyMeetingsList;
window.createNew = createNew;
window.deleteAllMeetings = deleteAllMeetings;
window.deleteMeetingBatch = deleteMeetingBatch;
window.login = login;
window.logout = logout;

// 初期化
export async function init() {
    // 認証の初期化
    await initAuth();
    
    // 参加者検索の初期化
    initParticipantSearch();
    
    // 日付入力に今日の日付を設定
    const dateInput = document.getElementById('dateInput');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.value = today;
        dateInput.min = today;
    }
    
    // 予約時間ボタンの初期化
    initDurationButtons();
    
    // 選択された日付の初期表示
    if (document.getElementById('selectedDates')) {
        document.getElementById('selectedDates').innerHTML = '<p class="no-dates">日付が選択されていません</p>';
    }
}