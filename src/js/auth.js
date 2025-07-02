import { GOOGLE_CONFIG } from './config.js';
import { showElement, hideElement } from './utils.js';

/**
 * Google認証管理
 */

let tokenClient;
let gapiInited = false;
let gisInited = false;
let currentUser = null;

/**
 * 認証の初期化
 */
export async function initAuth() {
    console.log('認証初期化開始');
    
    // 初期状態ですべてのセクションを非表示
    hideElement('loginSection');
    hideElement('mainSection');
    hideElement('confirmSection');
    hideElement('createdSection');
    
    try {
        // 並行して初期化を実行
        await Promise.all([
            initializeGoogleAPI(),
            initializeGoogleIdentity()
        ]);
        
        console.log('両方の初期化が完了');
        
        // 既存のトークンをチェック
        checkExistingAuth();
    } catch (error) {
        console.error('認証初期化エラー:', error);
        showLoginScreen();
    }
}

/**
 * Google API Client Libraryを初期化
 */
async function initializeGoogleAPI() {
    return new Promise((resolve, reject) => {
        const checkGapi = setInterval(() => {
            if (typeof gapi !== 'undefined') {
                clearInterval(checkGapi);
                gapi.load('client', async () => {
                    try {
                        await gapi.client.init({
                            // APIキーは使用せず、OAuth認証のみで動作させる
                            discoveryDocs: [
                                'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'
                                // People APIはOAuth認証後に個別に読み込む
                            ],
                        });
                        gapiInited = true;
                        resolve();
                    } catch (error) {
                        console.error('Error initializing GAPI client:', error);
                        reject(error);
                    }
                });
            }
        }, 100);

        setTimeout(() => {
            clearInterval(checkGapi);
            reject(new Error('Google API の読み込みがタイムアウトしました'));
        }, 10000);
    });
}

/**
 * Google Identity Services を初期化
 */
function initializeGoogleIdentity() {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        const checkGis = setInterval(() => {
            attempts++;
            console.log(`Google Identity Services チェック (試行 ${attempts}回目)`, {
                google: typeof google !== 'undefined',
                accounts: typeof google !== 'undefined' && google.accounts,
                oauth2: typeof google !== 'undefined' && google.accounts && google.accounts.oauth2,
                CLIENT_ID: GOOGLE_CONFIG.CLIENT_ID
            });
            
            if (typeof google !== 'undefined' && google.accounts && google.accounts.oauth2) {
                clearInterval(checkGis);
                try {
                    tokenClient = google.accounts.oauth2.initTokenClient({
                        client_id: GOOGLE_CONFIG.CLIENT_ID,
                        scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/contacts.readonly',
                        callback: handleAuthResponse,
                        hint: currentUser?.email
                    });
                    gisInited = true;
                    console.log('Google Identity Services 初期化完了', tokenClient);
                    window.tokenClient = tokenClient; // デバッグ用
                    resolve();
                } catch (error) {
                    console.error('Google Identity Services 初期化エラー:', error);
                    reject(error);
                }
            }
        }, 100);

        setTimeout(() => {
            clearInterval(checkGis);
            reject(new Error('Google Identity Services の読み込みがタイムアウトしました'));
        }, 10000);
    });
}

/**
 * 既存の認証をチェック
 */
function checkExistingAuth() {
    // 削除URLまたはバッチ管理URLの場合、localStorageに保存
    const hash = window.location.hash;
    if (hash && (hash.startsWith('#delete=') || hash.startsWith('#batch='))) {
        console.log('特殊URLを検出。ログイン後に処理します:', hash);
        localStorage.setItem('pendingSpecialHash', hash);
    }
    
    // 保存されたトークンがあるか確認
    const savedToken = localStorage.getItem('googleAuthToken');
    if (savedToken) {
        try {
            const token = JSON.parse(savedToken);
            // トークンの有効期限をチェック
            const expiresAt = token.expires_at || 0;
            if (expiresAt > Date.now()) {
                console.log('保存されたトークンを使用');
                gapi.client.setToken(token);
                getUserInfo();
                return;
            } else {
                console.log('保存されたトークンは期限切れ');
                localStorage.removeItem('googleAuthToken');
            }
        } catch (error) {
            console.error('保存されたトークンの読み込みエラー:', error);
            localStorage.removeItem('googleAuthToken');
        }
    }
    
    const token = gapi.client.getToken();
    if (token) {
        getUserInfo();
    } else {
        showLoginScreen();
    }
}

/**
 * ログイン画面を表示
 */
function showLoginScreen() {
    console.log('ログイン画面を表示');
    hideElement('mainSection');
    hideElement('confirmSection');
    hideElement('createdSection');
    showElement('loginSection');
}

/**
 * メイン画面を表示
 */
function showMainScreen() {
    hideElement('loginSection');
    showElement('mainSection');
}

/**
 * ログイン処理
 */
export function login() {
    console.log('ログイン処理開始', { tokenClient, gapiInited, gisInited });
    
    if (!tokenClient) {
        console.error('認証クライアントが初期化されていません');
        alert('認証システムの初期化中です。もう一度お試しください。');
        return;
    }
    
    // 削除URLまたはバッチ管理URLの場合、ハッシュを保存
    const currentHash = window.location.hash;
    if (currentHash && (currentHash.startsWith('#delete=') || currentHash.startsWith('#batch='))) {
        console.log('特殊URLを保存:', currentHash);
        localStorage.setItem('pendingSpecialHash', currentHash);
    }
    
    tokenClient.requestAccessToken({ prompt: 'consent' });
}

/**
 * 認証レスポンスを処理
 */
async function handleAuthResponse(resp) {
    console.log('認証レスポンス:', resp);
    
    if (resp.error !== undefined) {
        console.error('認証エラー:', resp);
        showLoginScreen();
        return;
    }
    
    // カレンダー権限が含まれているか確認
    if (!resp.scope || !resp.scope.includes('https://www.googleapis.com/auth/calendar')) {
        console.error('カレンダー権限が付与されていません');
        alert('このツールを使用するには、Googleカレンダーへのアクセス権限が必要です。\nもう一度ログインして、すべての権限を許可してください。');
        showLoginScreen();
        return;
    }
    
    // 現在のハッシュを保存（削除URLなどの場合）
    const currentHash = window.location.hash;
    console.log('現在のハッシュ:', currentHash);
    
    // トークンを設定
    gapi.client.setToken(resp);
    
    // トークンを保存（有効期限付き）
    const tokenToSave = {
        ...resp,
        expires_at: Date.now() + (resp.expires_in * 1000)
    };
    localStorage.setItem('googleAuthToken', JSON.stringify(tokenToSave));
    console.log('トークンを保存しました');
    
    // People APIのDiscovery Documentを読み込む（認証後）
    try {
        await gapi.client.load('people', 'v1');
        console.log('People API loaded');
    } catch (error) {
        console.log('People API loading failed:', error);
    }
    
    await getUserInfo();
    
    // ハッシュを復元
    if (currentHash && window.location.hash !== currentHash) {
        window.location.hash = currentHash;
    }
}

/**
 * ユーザー情報を取得
 */
async function getUserInfo() {
    try {
        console.log('ユーザー情報取得開始');
        console.log('現在のトークン:', gapi.client.getToken());
        
        let userInfoObtained = false;
        
        // 最初にPeople APIで試す（利用可能な場合）
        if (gapi.client.people) {
            try {
                const peopleResponse = await gapi.client.people.people.get({
                    resourceName: 'people/me',
                    personFields: 'names,emailAddresses,photos'
                });
                
                console.log('People API成功:', peopleResponse);
                
                const person = peopleResponse.result;
                currentUser = {
                    id: person.resourceName,
                    email: person.emailAddresses[0].value,
                    name: person.names[0].displayName,
                    picture: person.photos ? person.photos[0].url : null,
                    domain: person.emailAddresses[0].value.split('@')[1]
                };
                userInfoObtained = true;
            } catch (peopleError) {
                console.log('People APIエラー:', peopleError);
            }
        }
        
        // People APIが失敗した場合、OAuth2 APIを使用
        if (!userInfoObtained) {
            console.log('OAuth2 APIでユーザー情報を取得します');
            
            const response = await gapi.client.request({
                path: 'https://www.googleapis.com/oauth2/v1/userinfo',
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + gapi.client.getToken().access_token
                }
            });
            
            console.log('OAuth2 API成功:', response);
            
            currentUser = {
                id: response.result.id,
                email: response.result.email,
                name: response.result.name,
                picture: response.result.picture,
                domain: response.result.hd || (response.result.email ? response.result.email.split('@')[1] : '')
            };
        }
        
        // グローバルに公開
        window.currentUser = currentUser;
        
        updateUserDisplay();
        showMainScreen();
        
        // 社内ユーザーリストを取得（Google Workspaceの場合）
        if (currentUser.domain) {
            await loadOrganizationUsers();
        }
        
        // 保存された特殊URLがあれば復元
        const pendingSpecialHash = localStorage.getItem('pendingSpecialHash') || localStorage.getItem('pendingDeleteHash');
        if (pendingSpecialHash) {
            console.log('保存された特殊URLを復元:', pendingSpecialHash);
            window.location.hash = pendingSpecialHash;
            localStorage.removeItem('pendingSpecialHash');
            localStorage.removeItem('pendingDeleteHash');
        }
        
        // URLからの削除処理をチェック（認証完了後）
        const { handleDeleteFromUrl } = await import('./delete-confirm.js');
        await handleDeleteFromUrl();
        
        // URLからのバッチ管理処理をチェック
        const { handleBatchFromUrl } = await import('./batch-manager.js');
        await handleBatchFromUrl();
    } catch (error) {
        console.error('ユーザー情報の取得に失敗:', error);
        console.error('エラー詳細:', {
            message: error.message,
            status: error.status,
            statusText: error.statusText,
            result: error.result
        });
        showLoginScreen();
    }
}

/**
 * ユーザー表示を更新
 */
function updateUserDisplay() {
    const userInfo = document.getElementById('userInfo');
    if (userInfo && currentUser) {
        userInfo.innerHTML = `
            <img src="${currentUser.picture}" alt="${currentUser.name}" style="width: 32px; height: 32px; border-radius: 50%; vertical-align: middle;">
            <span style="margin-left: 10px;">${currentUser.name}</span>
            <button onclick="logout()" style="margin-left: 20px;">ログアウト</button>
        `;
    }
}

/**
 * ログアウト処理
 */
export function logout() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
    }
    // 保存されたトークンも削除
    localStorage.removeItem('googleAuthToken');
    currentUser = null;
    window.currentUser = null;
    window.organizationUsers = [];
    
    // すべてのセクションを非表示にしてログイン画面のみを表示
    hideElement('mainSection');
    hideElement('confirmSection');
    hideElement('createdSection');
    hideElement('batchListSection');
    showLoginScreen();
}

/**
 * 社内ユーザーリストを取得
 */
async function loadOrganizationUsers() {
    console.log('社内ユーザーリストの読み込み開始');
    window.organizationUsers = [];
    
    try {
        // People APIが読み込まれていることを確認
        if (!gapi.client.people) {
            console.log('People APIを再読み込み中...');
            await gapi.client.load('people', 'v1');
        }
        
        // People API経由で連絡先を取得
        console.log('People APIで連絡先を取得中...');
        const response = await gapi.client.people.people.connections.list({
            resourceName: 'people/me',
            pageSize: 1000,
            personFields: 'names,emailAddresses,photos,organizations'
        });
        
        console.log('People API応答:', response);
        
        if (response.result.connections && response.result.connections.length > 0) {
            // ドメインでフィルタリング（同じ組織のユーザーのみ）
            const domainUsers = response.result.connections
                .filter(person => {
                    if (!person.emailAddresses || person.emailAddresses.length === 0) return false;
                    const email = person.emailAddresses[0].value;
                    return email.endsWith('@' + currentUser.domain);
                })
                .map(person => ({
                    primaryEmail: person.emailAddresses[0].value,
                    email: person.emailAddresses[0].value,
                    name: {
                        fullName: person.names ? person.names[0].displayName : person.emailAddresses[0].value
                    },
                    thumbnailPhotoUrl: person.photos ? person.photos[0].url : null
                }));
            
            window.organizationUsers = domainUsers;
            console.log(`${domainUsers.length}人の社内ユーザーを取得しました`);
        } else {
            console.log('連絡先が見つかりませんでした');
        }
        
        // Directory APIも試行（管理者権限が必要なため、多くの場合は失敗します）
        if (currentUser.domain && currentUser.domain !== 'gmail.com') {
            try {
                // console.log('Directory APIも試行中...'); // 詳細ログは抑制
                const dirResponse = await gapi.client.request({
                    path: 'https://www.googleapis.com/admin/directory/v1/users',
                    params: {
                        domain: currentUser.domain,
                        maxResults: 500,
                        orderBy: 'email'
                    }
                });
                
                if (dirResponse.result.users && dirResponse.result.users.length > 0) {
                    console.log(`Directory APIで${dirResponse.result.users.length}人のユーザーを取得`);
                    window.organizationUsers = dirResponse.result.users;
                }
            } catch (dirError) {
                // 403エラーは予期されるため、情報レベルのログのみ
                if (dirError.status === 403) {
                    console.info('Directory API: 管理者権限が必要です（手動で参加者を入力してください）');
                } else {
                    console.log('Directory APIエラー:', dirError.status);
                }
            }
        }
        
    } catch (error) {
        console.error('ユーザーリストの取得エラー:', error);
        console.error('エラー詳細:', {
            message: error.message,
            status: error.status,
            statusText: error.statusText
        });
        
        // ユーザーに通知
        console.info('連絡先の自動読み込みができませんでした。参加者は手動で入力してください。');
    }
    
    console.log('最終的なorganizationUsers:', window.organizationUsers);
    
    // 組織ユーザーが取得できなかった場合でも、手動入力は可能
    if (window.organizationUsers.length === 0) {
        console.info('参加者は手動でメールアドレスを入力してください。');
    }
}

/**
 * 現在のユーザーを取得
 */
export function getCurrentUser() {
    return currentUser;
}

// グローバルスコープに現在のユーザー情報を公開（参加者機能で使用）
window.currentUser = currentUser;

/**
 * 認証済みかチェック
 */
export function isAuthenticated() {
    return !!gapi.client.getToken();
}

// グローバルスコープに公開
window.login = login;
window.logout = logout;