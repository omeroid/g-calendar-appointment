/**
 * ヘルプ機能
 */

/**
 * ヘルプダイアログを表示
 */
export function showHelp() {
    const modal = document.getElementById('helpModal');
    if (modal) {
        modal.style.display = 'flex';
        // ESCキーで閉じる
        document.addEventListener('keydown', handleEscKey);
    }
}

/**
 * ヘルプダイアログを閉じる
 */
export function closeHelp() {
    const modal = document.getElementById('helpModal');
    if (modal) {
        modal.style.display = 'none';
        document.removeEventListener('keydown', handleEscKey);
    }
}

/**
 * ESCキーハンドラー
 */
function handleEscKey(event) {
    if (event.key === 'Escape') {
        closeHelp();
    }
}

/**
 * モーダル外クリックで閉じる
 */
export function initHelpModal() {
    const modal = document.getElementById('helpModal');
    if (modal) {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeHelp();
            }
        });
    }
}

// グローバル関数として公開
window.showHelp = showHelp;
window.closeHelp = closeHelp;