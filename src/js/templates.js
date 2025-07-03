/**
 * ミーティングテンプレート管理機能
 */

const TEMPLATES_KEY = 'meetingTemplates';

/**
 * テンプレートを保存
 */
export function saveTemplate(title, description) {
    const templates = getTemplates();
    const template = {
        id: Date.now().toString(),
        title: title,
        description: description,
        createdAt: new Date().toISOString()
    };
    
    templates.push(template);
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
    
    return template;
}

/**
 * すべてのテンプレートを取得
 */
export function getTemplates() {
    const stored = localStorage.getItem(TEMPLATES_KEY);
    return stored ? JSON.parse(stored) : [];
}

/**
 * テンプレートを削除
 */
export function deleteTemplate(id) {
    const templates = getTemplates();
    const filtered = templates.filter(t => t.id !== id);
    localStorage.setItem(TEMPLATES_KEY, JSON.stringify(filtered));
}

/**
 * テンプレートをIDで取得
 */
export function getTemplateById(id) {
    const templates = getTemplates();
    return templates.find(t => t.id === id);
}

/**
 * 現在の入力をテンプレートとして保存
 */
export function saveAsTemplate() {
    const title = document.getElementById('title').value.trim();
    const description = document.getElementById('description').value.trim();
    
    if (!title) {
        alert('タイトルを入力してください');
        return;
    }
    
    const template = saveTemplate(title, description);
    showTemplateMessage(`テンプレート「${title}」を保存しました`);
}

/**
 * テンプレート選択モーダルを表示
 */
export function showTemplates() {
    const templates = getTemplates();
    const modal = document.getElementById('templateModal');
    const templateList = document.getElementById('templateList');
    
    if (templates.length === 0) {
        templateList.innerHTML = '<div class="no-templates">保存されたテンプレートはありません</div>';
    } else {
        templateList.innerHTML = templates.map(template => `
            <div class="template-item" data-id="${template.id}">
                <div class="template-item-header">
                    <div class="template-title">${escapeHtml(template.title)}</div>
                    <button class="template-delete" onclick="deleteTemplateAndRefresh('${template.id}')">&times;</button>
                </div>
                <div class="template-description">${escapeHtml(template.description || '')}</div>
            </div>
        `).join('');
        
        // テンプレートアイテムにクリックイベントを追加
        templateList.querySelectorAll('.template-item').forEach(item => {
            item.addEventListener('click', function(e) {
                if (!e.target.classList.contains('template-delete')) {
                    const templateId = this.dataset.id;
                    applyTemplate(templateId);
                    closeTemplateModal();
                }
            });
        });
    }
    
    modal.style.display = 'flex';
}

/**
 * テンプレートを適用
 */
function applyTemplate(templateId) {
    const template = getTemplateById(templateId);
    if (template) {
        document.getElementById('title').value = template.title;
        document.getElementById('description').value = template.description;
    }
}

/**
 * テンプレートを削除して表示を更新
 */
window.deleteTemplateAndRefresh = function(templateId) {
    if (confirm('このテンプレートを削除しますか？')) {
        deleteTemplate(templateId);
        showTemplates(); // リフレッシュ
    }
};

/**
 * テンプレートモーダルを閉じる
 */
export function closeTemplateModal() {
    document.getElementById('templateModal').style.display = 'none';
}

/**
 * HTMLエスケープ
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * テンプレート関連のメッセージを表示
 */
function showTemplateMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f8f9fa;
        border: 1px solid #dadce0;
        color: #5f6368;
        padding: 12px 20px;
        border-radius: 4px;
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        z-index: 1100;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
    `;
    messageDiv.innerHTML = `📋 ${escapeHtml(message)}`;
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        messageDiv.style.transition = 'opacity 0.3s ease';
        messageDiv.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(messageDiv);
        }, 300);
    }, 3000);
}

// グローバル関数として公開
window.saveAsTemplate = saveAsTemplate;
window.showTemplates = showTemplates;
window.closeTemplateModal = closeTemplateModal;