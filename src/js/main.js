import { initLocationSelector, generateLink, copyLink } from './admin.js';
import { loadScheduleFromURL, createSchedule } from './user.js';
import { getUrlParams } from './utils.js';

/**
 * メインアプリケーション
 */

// モード切り替え
function switchMode(mode) {
    const adminMode = document.getElementById('adminMode');
    const userMode = document.getElementById('userMode');
    const modeBtns = document.querySelectorAll('.mode-btn');
    
    modeBtns.forEach(btn => btn.classList.remove('active'));
    
    if (mode === 'admin') {
        adminMode.classList.add('active');
        userMode.classList.remove('active');
        modeBtns[0].classList.add('active');
    } else {
        adminMode.classList.remove('active');
        userMode.classList.add('active');
        modeBtns[1].classList.add('active');
        loadScheduleFromURL();
    }
}

// グローバル関数として登録（HTMLのonclickから呼び出すため）
window.switchMode = switchMode;
window.generateLink = generateLink;
window.copyLink = copyLink;
window.createSchedule = createSchedule;

// ページ読み込み時の処理
document.addEventListener('DOMContentLoaded', function() {
    // 管理者モードの初期化
    initLocationSelector();
    
    // URLにデータパラメータがある場合は実行モードで開く
    const urlParams = getUrlParams();
    if (urlParams.get('data')) {
        switchMode('user');
    }
});