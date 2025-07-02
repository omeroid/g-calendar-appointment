/**
 * 参加者選択機能
 */

// 選択された参加者
let selectedParticipants = [];
let searchTimeout;

/**
 * 参加者検索の初期化
 */
export function initParticipantSearch() {
    const searchInput = document.getElementById('participantSearch');
    const searchResults = document.getElementById('searchResults');
    
    if (!searchInput) return;
    
    // 検索入力のイベント
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();
        
        if (query.length < 2) {
            hideSearchResults();
            return;
        }
        
        // デバウンス処理
        searchTimeout = setTimeout(() => {
            searchParticipants(query);
        }, 300);
    });
    
    // フォーカスアウトで検索結果を隠す（遅延）
    searchInput.addEventListener('blur', () => {
        setTimeout(hideSearchResults, 200);
    });
    
    // Enter キーでメールアドレス追加
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const email = e.target.value.trim();
            if (isValidEmail(email)) {
                addParticipant({ email, name: email, isExternal: true });
                e.target.value = '';
                hideSearchResults();
            }
        }
    });
}

/**
 * 参加者を検索
 */
function searchParticipants(query) {
    const results = [];
    const lowerQuery = query.toLowerCase();
    
    // 社内ユーザーから検索
    if (window.organizationUsers && window.organizationUsers.length > 0) {
        console.log('検索対象ユーザー数:', window.organizationUsers.length);
        const internalResults = window.organizationUsers
            .filter(user => {
                const email = (user.primaryEmail || user.email || '').toLowerCase();
                const nameObj = user.name;
                let fullName = '';
                
                // nameオブジェクトの構造に応じて名前を取得
                if (typeof nameObj === 'object' && nameObj !== null) {
                    fullName = (nameObj.fullName || nameObj.givenName + ' ' + nameObj.familyName || '').toLowerCase();
                } else if (typeof nameObj === 'string') {
                    fullName = nameObj.toLowerCase();
                } else if (typeof user.name === 'string') {
                    fullName = user.name.toLowerCase();
                }
                
                return email.includes(lowerQuery) || fullName.includes(lowerQuery);
            })
            .slice(0, 10)
            .map(user => {
                const nameObj = user.name;
                let displayName = '';
                
                // 表示名の取得
                if (typeof nameObj === 'object' && nameObj !== null) {
                    displayName = nameObj.fullName || nameObj.givenName + ' ' + nameObj.familyName || user.primaryEmail || user.email;
                } else if (typeof nameObj === 'string') {
                    displayName = nameObj;
                } else {
                    displayName = user.primaryEmail || user.email;
                }
                
                return {
                    email: user.primaryEmail || user.email,
                    name: displayName,
                    picture: user.thumbnailPhotoUrl || user.picture || user.photoUrl,
                    isExternal: false
                };
            });
        
        results.push(...internalResults);
        console.log('検索結果:', internalResults.length + '件');
    }
    
    // メールアドレスとして有効な場合は追加オプションを表示
    if (isValidEmail(query) && !results.some(r => r.email === query)) {
        // 現在のユーザーのドメインを取得
        const currentUserDomain = window.currentUser && window.currentUser.domain ? window.currentUser.domain : '';
        const queryDomain = query.split('@')[1] || '';
        const isExternal = queryDomain !== currentUserDomain;
        
        results.push({
            email: query,
            name: query,
            isExternal: isExternal
        });
    }
    
    displaySearchResults(results);
}

/**
 * 検索結果を表示
 */
function displaySearchResults(results) {
    const searchResults = document.getElementById('searchResults');
    
    if (results.length === 0) {
        searchResults.innerHTML = '<div class="no-results">該当するユーザーが見つかりません</div>';
    } else {
        searchResults.innerHTML = results.map(user => `
            <div class="search-result-item" onclick="selectParticipant('${user.email}', '${user.name}', ${user.isExternal})">
                ${user.picture ? `<img src="${user.picture}" alt="${user.name}">` : '<div class="user-icon">' + user.name.charAt(0).toUpperCase() + '</div>'}
                <div class="user-info-text">
                    <div class="user-name">${user.name}</div>
                    <div class="user-email">${user.email}</div>
                </div>
                ${user.isExternal ? '<span class="external-badge">外部</span>' : ''}
            </div>
        `).join('');
    }
    
    searchResults.style.display = 'block';
}

/**
 * 検索結果を隠す
 */
function hideSearchResults() {
    const searchResults = document.getElementById('searchResults');
    if (searchResults) {
        searchResults.style.display = 'none';
    }
}

/**
 * 参加者を選択
 */
window.selectParticipant = function(email, name, isExternal) {
    addParticipant({ email, name, isExternal });
    document.getElementById('participantSearch').value = '';
    hideSearchResults();
};

/**
 * 参加者を追加
 */
function addParticipant(participant) {
    // 既に追加されているかチェック
    if (selectedParticipants.some(p => p.email === participant.email)) {
        return;
    }
    
    selectedParticipants.push(participant);
    updateParticipantsDisplay();
    updateParticipantsInput();
}

/**
 * 参加者を削除
 */
window.removeParticipant = function(email) {
    selectedParticipants = selectedParticipants.filter(p => p.email !== email);
    updateParticipantsDisplay();
    updateParticipantsInput();
};

/**
 * 参加者表示を更新
 */
function updateParticipantsDisplay() {
    const container = document.getElementById('selectedParticipants');
    
    if (selectedParticipants.length === 0) {
        container.innerHTML = '<p class="no-participants">参加者が選択されていません</p>';
        return;
    }
    
    container.innerHTML = selectedParticipants.map(p => `
        <div class="participant-chip">
            <span>${p.name}</span>
            ${p.isExternal ? '<span class="external-badge">外部</span>' : ''}
            <button type="button" onclick="removeParticipant('${p.email}')" class="remove-btn">×</button>
        </div>
    `).join('');
}

/**
 * 隠しフィールドを更新
 */
function updateParticipantsInput() {
    const input = document.getElementById('participants');
    input.value = selectedParticipants.map(p => p.email).join(',');
}

/**
 * メールアドレスの検証
 */
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * 選択された参加者を取得
 */
export function getSelectedParticipants() {
    return selectedParticipants;
}

/**
 * 参加者をクリア
 */
export function clearParticipants() {
    selectedParticipants = [];
    updateParticipantsDisplay();
    updateParticipantsInput();
}

// グローバルに公開
window.clearParticipants = clearParticipants;