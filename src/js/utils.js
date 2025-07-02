// ユーティリティ関数

/**
 * Base64エンコード（Unicode対応）
 */
export function encodeData(data) {
    return btoa(encodeURIComponent(JSON.stringify(data)));
}

/**
 * Base64デコード（Unicode対応）
 */
export function decodeData(encodedData) {
    return JSON.parse(decodeURIComponent(atob(encodedData)));
}

/**
 * URLパラメータを取得
 */
export function getUrlParams() {
    return new URLSearchParams(window.location.search);
}

/**
 * 要素を表示
 */
export function showElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = 'block';
    }
}

/**
 * 要素を非表示
 */
export function hideElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.display = 'none';
    }
}

/**
 * エラーメッセージを表示
 */
export function showError(message) {
    const errorElement = document.getElementById('errorMessage');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

/**
 * 成功メッセージを表示
 */
export function showSuccess(message) {
    const successElement = document.getElementById('successMessage');
    if (successElement) {
        successElement.textContent = message;
        successElement.style.display = 'block';
    }
}

/**
 * メッセージをクリア
 */
export function clearMessages() {
    hideElement('errorMessage');
    hideElement('successMessage');
}