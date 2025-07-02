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
                        scope: 'https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/directory.readonly',
                        callback: handleAuthResponse,
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
    
    // トークンを設定
    gapi.client.setToken(resp);
    
    // People APIのDiscovery Documentを読み込む（認証後）
    try {
        await gapi.client.load('people', 'v1');
        console.log('People API loaded');
    } catch (error) {
        console.log('People API loading failed:', error);
    }
    
    await getUserInfo();
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
        
        updateUserDisplay();
        showMainScreen();
        
        // 社内ユーザーリストを取得（Google Workspaceの場合）
        if (currentUser.domain) {
            loadOrganizationUsers();
        }
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
    currentUser = null;
    window.organizationUsers = [];
    showLoginScreen();
}

/**
 * 社内ユーザーリストを取得
 */
async function loadOrganizationUsers() {
    try {
        // Google Directory APIを使用（要Admin SDK権限）
        const response = await gapi.client.request({
            path: 'https://www.googleapis.com/admin/directory/v1/users',
            params: {
                domain: currentUser.domain,
                maxResults: 500,
                orderBy: 'email'
            }
        });
        
        window.organizationUsers = response.result.users || [];
    } catch (error) {
        console.log('社内ユーザーリストの取得に失敗（権限不足の可能性）:', error);
        // People APIで代替試行
        try {
            const response = await gapi.client.people.people.connections.list({
                resourceName: 'people/me',
                pageSize: 1000,
                personFields: 'names,emailAddresses,photos'
            });
            
            window.organizationUsers = (response.result.connections || [])
                .filter(person => person.emailAddresses && person.emailAddresses.length > 0)
                .map(person => ({
                    primaryEmail: person.emailAddresses[0].value,
                    name: {
                        fullName: person.names ? person.names[0].displayName : person.emailAddresses[0].value
                    },
                    thumbnailPhotoUrl: person.photos ? person.photos[0].url : null
                }));
        } catch (error2) {
            console.log('連絡先の取得にも失敗:', error2);
            window.organizationUsers = [];
        }
    }
}

/**
 * 現在のユーザーを取得
 */
export function getCurrentUser() {
    return currentUser;
}

/**
 * 認証済みかチェック
 */
export function isAuthenticated() {
    return !!gapi.client.getToken();
}

// グローバルスコープに公開
window.login = login;
window.logout = logout;