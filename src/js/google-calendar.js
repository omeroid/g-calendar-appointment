import { GOOGLE_CONFIG } from './config.js';

/**
 * Google Calendar API関連の処理
 */

let tokenClient;
let gapiInited = false;
let gisInited = false;

/**
 * Google API Client Libraryを初期化
 */
export async function initializeGoogleAPI() {
    return new Promise((resolve, reject) => {
        // gapi のロードを待つ
        const checkGapi = setInterval(() => {
            if (typeof gapi !== 'undefined') {
                clearInterval(checkGapi);
                gapi.load('client', async () => {
                    try {
                        await gapi.client.init({
                            apiKey: GOOGLE_CONFIG.API_KEY,
                            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
                        });
                        gapiInited = true;
                        maybeEnableButtons();
                        resolve();
                    } catch (error) {
                        console.error('Error initializing GAPI client:', error);
                        reject(error);
                    }
                });
            }
        }, 100);

        // 10秒でタイムアウト
        setTimeout(() => {
            clearInterval(checkGapi);
            reject(new Error('Google API の読み込みがタイムアウトしました'));
        }, 10000);
    });
}

/**
 * Google Identity Services を初期化
 */
export function initializeGoogleIdentity() {
    return new Promise((resolve, reject) => {
        const checkGis = setInterval(() => {
            if (typeof google !== 'undefined' && google.accounts) {
                clearInterval(checkGis);
                tokenClient = google.accounts.oauth2.initTokenClient({
                    client_id: GOOGLE_CONFIG.CLIENT_ID,
                    scope: GOOGLE_CONFIG.SCOPES,
                    callback: '', // 後で設定
                });
                gisInited = true;
                maybeEnableButtons();
                resolve();
            }
        }, 100);

        // 10秒でタイムアウト
        setTimeout(() => {
            clearInterval(checkGis);
            reject(new Error('Google Identity Services の読み込みがタイムアウトしました'));
        }, 10000);
    });
}

/**
 * ボタンを有効化
 */
function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        console.log('Google API が初期化されました');
    }
}

/**
 * ユーザー認証を実行
 */
export async function authenticate() {
    return new Promise((resolve, reject) => {
        if (!tokenClient) {
            reject(new Error('認証クライアントが初期化されていません'));
            return;
        }

        tokenClient.callback = async (resp) => {
            if (resp.error !== undefined) {
                reject(resp);
                return;
            }
            resolve(resp);
        };

        // 既存のトークンがあるかチェック
        if (gapi.client.getToken() === null) {
            // トークンをリクエスト
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            // 既存のトークンをスキップするオプションもリクエスト
            tokenClient.requestAccessToken({ prompt: '' });
        }
    });
}

/**
 * 予約スケジュールを作成
 */
export async function createAppointmentSchedule(scheduleData) {
    if (!gapiInited || !gisInited) {
        throw new Error('Google API が初期化されていません');
    }

    try {
        // カレンダーを作成
        const calendar = await createCalendar(scheduleData);
        
        // 予約可能な時間枠を作成
        await createAvailableSlots(calendar.id, scheduleData);
        
        return calendar;
    } catch (error) {
        console.error('予約スケジュール作成エラー:', error);
        throw error;
    }
}

/**
 * 専用カレンダーを作成
 */
async function createCalendar(scheduleData) {
    const calendarResource = {
        summary: scheduleData.title,
        description: scheduleData.description || '',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };

    try {
        const response = await gapi.client.calendar.calendars.insert({
            resource: calendarResource
        });

        console.log('カレンダーが作成されました:', response.result);
        return response.result;
    } catch (error) {
        console.error('カレンダー作成エラー:', error);
        throw error;
    }
}

/**
 * 利用可能な時間枠をイベントとして作成
 */
async function createAvailableSlots(calendarId, scheduleData) {
    const events = [];
    
    // 各日付に対してイベントを作成
    for (const dateTime of scheduleData.availableDates) {
        const date = new Date(dateTime.date);
        const [startHour, startMinute] = dateTime.startTime.split(':').map(Number);
        const [endHour, endMinute] = dateTime.endTime.split(':').map(Number);
        
        // 開始時刻から終了時刻まで、指定された duration ごとにスロットを作成
        const startDateTime = new Date(date);
        startDateTime.setHours(startHour, startMinute, 0, 0);
        
        const endDateTime = new Date(date);
        endDateTime.setHours(endHour, endMinute, 0, 0);
        
        while (startDateTime < endDateTime) {
            const slotEnd = new Date(startDateTime);
            slotEnd.setMinutes(slotEnd.getMinutes() + parseInt(scheduleData.duration));
            
            // バッファタイムを考慮
            const bufferTime = parseInt(scheduleData.bufferTime) || 0;
            const nextSlotStart = new Date(slotEnd);
            nextSlotStart.setMinutes(nextSlotStart.getMinutes() + bufferTime);
            
            if (slotEnd <= endDateTime) {
                const event = {
                    summary: '予約可能',
                    description: '予約可能な時間枠です',
                    start: {
                        dateTime: startDateTime.toISOString(),
                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                    },
                    end: {
                        dateTime: slotEnd.toISOString(),
                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                    },
                    transparency: 'transparent',
                    visibility: 'public'
                };
                
                // 場所の設定
                if (scheduleData.location === 'meet') {
                    event.conferenceData = {
                        createRequest: {
                            requestId: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            conferenceSolutionKey: { type: 'hangoutsMeet' }
                        }
                    };
                } else if (scheduleData.location === 'custom' && scheduleData.customLocation) {
                    event.location = scheduleData.customLocation;
                } else if (scheduleData.location === 'phone') {
                    event.location = '電話';
                } else if (scheduleData.location === 'physical') {
                    event.location = '対面';
                }
                
                events.push(event);
            }
            
            // 次のスロットの開始時刻を設定
            startDateTime.setTime(nextSlotStart.getTime());
        }
    }
    
    // バッチリクエストでイベントを作成
    const batch = gapi.client.newBatch();
    events.forEach((event, index) => {
        batch.add(gapi.client.calendar.events.insert({
            calendarId: calendarId,
            resource: event,
            conferenceDataVersion: event.conferenceData ? 1 : 0
        }), { id: `event-${index}` });
    });
    
    try {
        const response = await batch;
        console.log('イベントが作成されました:', response);
        return response;
    } catch (error) {
        console.error('イベント作成エラー:', error);
        throw error;
    }
}

/**
 * サインアウト
 */
export function signOut() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
    }
}