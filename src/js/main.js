import { initLocationSelector } from './admin.js';
import { init } from './app.js';

/**
 * メインエントリーポイント
 */

// ページ読み込み時の処理
document.addEventListener('DOMContentLoaded', function() {
    // 場所選択の初期化
    initLocationSelector();
    
    // アプリケーションの初期化
    init();
});