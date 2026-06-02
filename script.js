/* ============================================================
   数学错题本 V1.0 — 核心逻辑
   ============================================================ */

// ==================== 常量与配置 ====================
const STORAGE_KEY = 'math_error_book_entries';
const SUBJECT_TAG_CLASS = {
    '高等数学': 'tag-advanced',
    '线性代数': 'tag-linear',
    '概率论': 'tag-probability'
};

// ==================== DOM 引用缓存 ====================
const DOM = {
    // 统计
    statTotal: document.getElementById('statTotal'),
    statAdvanced: document.getElementById('statAdvanced'),
    statLinear: document.getElementById('statLinear'),
    statProbability: document.getElementById('statProbability'),

    // 表单
    errorForm: document.getElementById('errorForm'),
    titleInput: document.getElementById('title'),
    subjectSelect: document.getElementById('subject'),
    knowledgePointInput: document.getElementById('knowledgePoint'),
    errorReasonInput: document.getElementById('errorReason'),
    difficultyInput: document.getElementById('difficulty'),
    difficultyHint: document.getElementById('difficultyHint'),
    starRating: document.getElementById('starRating'),
    submitBtn: document.getElementById('submitBtn'),
    cancelEditBtn: document.getElementById('cancelEditBtn'),
    editingId: document.getElementById('editingId'),

    // 搜索
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),

    // 列表
    errorList: document.getElementById('errorList'),
    emptyState: document.getElementById('emptyState'),
    searchHint: document.getElementById('searchHint'),

    // 详情弹窗
    detailModal: document.getElementById('detailModal'),
    detailContent: document.getElementById('detailContent'),
    closeDetailModal: document.getElementById('closeDetailModal'),
    closeDetailBtn: document.getElementById('closeDetailBtn'),

    // 删除弹窗
    deleteModal: document.getElementById('deleteModal'),
    deletePreview: document.getElementById('deletePreview'),
    cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
    confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),

    // Toast
    toastContainer: document.getElementById('toastContainer')
};

// 当前待删除的题目 ID
let pendingDeleteId = null;

// ==================== 数据层 ====================

/**
 * 从 localStorage 读取所有错题，过滤掉损坏的数据
 * @returns {Array<Object>}
 */
function loadEntries() {
    try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        var data = JSON.parse(raw);
        if (!Array.isArray(data)) return [];
        // 过滤掉缺少必要字段的损坏条目
        return data.filter(function (entry) {
            return entry
                && typeof entry.id === 'string'
                && typeof entry.title === 'string'
                && typeof entry.subject === 'string'
                && typeof entry.knowledgePoint === 'string'
                && typeof entry.errorReason === 'string'
                && typeof entry.difficulty === 'number'
                && entry.difficulty >= 1
                && entry.difficulty <= 5;
        });
    } catch (e) {
        console.error('读取错题数据失败:', e);
        return [];
    }
}

/**
 * 保存所有错题到 localStorage
 * @param {Array<Object>} entries
 */
function saveEntries(entries) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch (e) {
        console.error('保存错题数据失败:', e);
        showToast('保存失败，可能是存储空间不足', 'error');
    }
}

/**
 * 生成唯一 ID
 * @returns {string}
 */
function generateId() {
    return 'err_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
}

// ==================== Toast 提示 ====================

/**
 * 显示 Toast 提示
 * @param {string} message - 提示文本
 * @param {'success' | 'error'} type - 类型
 */
function showToast(message, type) {
    if (type === void 0) type = 'success';

    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;

    // 图标
    var iconSvg = '';
    if (type === 'success') {
        iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
    } else {
        iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
    }

    toast.innerHTML = iconSvg + '<span>' + escapeHtml(message) + '</span>';
    DOM.toastContainer.appendChild(toast);

    // 自动消失
    var timer = setTimeout(function () {
        removeToast(toast);
    }, 2500);

    // 点击可提前关闭
    toast.addEventListener('click', function () {
        clearTimeout(timer);
        removeToast(toast);
    });
}

/**
 * 移除 Toast
 * @param {HTMLElement} toast
 */
function removeToast(toast) {
    if (toast.parentNode === null) return;
    toast.classList.add('removing');
    setTimeout(function () {
        if (toast.parentNode !== null) {
            toast.parentNode.removeChild(toast);
        }
    }, 300);
}

// ==================== 工具函数 ====================

/**
 * HTML 转义，防止 XSS
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

/**
 * 截断文本
 * @param {string} str
 * @param {number} maxLen
 * @returns {string}
 */
function truncateText(str, maxLen) {
    if (str.length <= maxLen) return str;
    return str.substring(0, maxLen) + '…';
}

/**
 * 渲染星星（用于列表）
 * @param {number} level - 1-5
 * @returns {string} HTML 字符串
 */
function renderStars(level) {
    var html = '';
    for (var i = 1; i <= 5; i++) {
        var filled = i <= level ? ' filled' : '';
        html += '<svg class="error-card-star' + filled + '" viewBox="0 0 24 24" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
    }
    return html;
}

/**
 * 渲染星星（用于详情弹窗 - 更大）
 * @param {number} level
 * @returns {string}
 */
function renderDetailStars(level) {
    var html = '';
    for (var i = 1; i <= 5; i++) {
        var filled = i <= level ? ' filled' : '';
        html += '<svg class="detail-star' + filled + '" viewBox="0 0 24 24" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
    }
    return html;
}

// ==================== 弹窗管理 ====================

/**
 * 打开弹窗
 * @param {HTMLElement} modal
 */
function openModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

/**
 * 关闭弹窗
 * @param {HTMLElement} modal
 */
function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

/**
 * 关闭所有弹窗
 */
function closeAllModals() {
    closeModal(DOM.detailModal);
    closeModal(DOM.deleteModal);
}

// ESC 关闭弹窗
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        closeAllModals();
    }
});

// 点击遮罩关闭弹窗
DOM.detailModal.addEventListener('click', function (e) {
    if (e.target === DOM.detailModal) {
        closeModal(DOM.detailModal);
    }
});
DOM.deleteModal.addEventListener('click', function (e) {
    if (e.target === DOM.deleteModal) {
        closeModal(DOM.deleteModal);
    }
});

// 详情弹窗关闭按钮
DOM.closeDetailModal.addEventListener('click', function () {
    closeModal(DOM.detailModal);
});
DOM.closeDetailBtn.addEventListener('click', function () {
    closeModal(DOM.detailModal);
});

// 删除弹窗关闭按钮
DOM.cancelDeleteBtn.addEventListener('click', function () {
    closeModal(DOM.deleteModal);
    pendingDeleteId = null;
});

// ==================== 查看详情 ====================

/**
 * 打开详情弹窗
 * @param {string} id
 */
function viewDetail(id) {
    var entries = loadEntries();
    var entry = null;
    for (var i = 0; i < entries.length; i++) {
        if (entries[i].id === id) {
            entry = entries[i];
            break;
        }
    }
    if (!entry) return;

    var tagClass = SUBJECT_TAG_CLASS[entry.subject] || '';

    var html = '';
    html += '<div class="detail-field">';
    html += '  <div class="detail-label">题目</div>';
    html += '  <div class="detail-value">' + escapeHtml(entry.title) + '</div>';
    html += '</div>';

    html += '<div class="detail-field">';
    html += '  <div class="detail-label">科目</div>';
    html += '  <div class="detail-value"><span class="detail-tag ' + tagClass + '">' + escapeHtml(entry.subject) + '</span></div>';
    html += '</div>';

    html += '<div class="detail-field">';
    html += '  <div class="detail-label">知识点</div>';
    html += '  <div class="detail-value">' + escapeHtml(entry.knowledgePoint) + '</div>';
    html += '</div>';

    html += '<div class="detail-field">';
    html += '  <div class="detail-label">错误原因</div>';
    html += '  <div class="detail-value">' + escapeHtml(entry.errorReason) + '</div>';
    html += '</div>';

    html += '<div class="detail-field">';
    html += '  <div class="detail-label">难度</div>';
    html += '  <div class="detail-stars">' + renderDetailStars(entry.difficulty) + '</div>';
    html += '</div>';

    DOM.detailContent.innerHTML = html;
    openModal(DOM.detailModal);
}

// ==================== 删除错题 ====================

/**
 * 弹出删除确认
 * @param {string} id
 */
function confirmDelete(id) {
    var entries = loadEntries();
    var entry = null;
    for (var i = 0; i < entries.length; i++) {
        if (entries[i].id === id) {
            entry = entries[i];
            break;
        }
    }
    if (!entry) return;

    pendingDeleteId = id;
    DOM.deletePreview.textContent = '「' + truncateText(entry.title, 60) + '」';
    openModal(DOM.deleteModal);
}

/**
 * 执行删除
 */
function executeDelete() {
    if (!pendingDeleteId) return;

    var entries = loadEntries();
    var newEntries = [];
    for (var i = 0; i < entries.length; i++) {
        if (entries[i].id !== pendingDeleteId) {
            newEntries.push(entries[i]);
        }
    }

    saveEntries(newEntries);
    closeModal(DOM.deleteModal);
    pendingDeleteId = null;
    refreshAll();
    showToast('错题已删除', 'success');
}

// 确认删除按钮
DOM.confirmDeleteBtn.addEventListener('click', executeDelete);

// ==================== 渲染列表 ====================

/**
 * 获取搜索过滤后的错题列表
 * @returns {Array<Object>}
 */
function getFilteredEntries() {
    var entries = loadEntries();
    var keyword = DOM.searchInput.value.trim().toLowerCase();

    if (!keyword) return entries;

    return entries.filter(function (entry) {
        return entry.title.toLowerCase().indexOf(keyword) !== -1 ||
               entry.knowledgePoint.toLowerCase().indexOf(keyword) !== -1;
    });
}

/**
 * 渲染错题列表
 */
function renderList() {
    var entries = getFilteredEntries();
    var keyword = DOM.searchInput.value.trim();

    // 空状态
    if (entries.length === 0) {
        DOM.errorList.style.display = 'none';
        DOM.emptyState.style.display = 'block';

        if (keyword) {
            DOM.emptyState.querySelector('.empty-text').textContent = '未找到匹配的错题';
            DOM.emptyState.querySelector('.empty-hint').textContent = '尝试更换搜索关键词';
        } else {
            DOM.emptyState.querySelector('.empty-text').textContent = '还没有错题记录';
            DOM.emptyState.querySelector('.empty-hint').textContent = '在左侧表单添加你的第一道错题吧！';
        }
        DOM.searchHint.style.display = 'none';
        return;
    }

    DOM.emptyState.style.display = 'none';
    DOM.errorList.style.display = 'block';

    // 搜索提示
    if (keyword) {
        DOM.searchHint.style.display = 'block';
        DOM.searchHint.textContent = '搜索「' + escapeHtml(keyword) + '」，共找到 ' + entries.length + ' 条结果';
    } else {
        DOM.searchHint.style.display = 'none';
    }

    // 构建列表 HTML
    var html = '';
    for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        var tagClass = SUBJECT_TAG_CLASS[entry.subject] || '';
        var titleDisplay = truncateText(entry.title, 80);

        html += '<div class="error-card">';
        html += '  <div class="error-card-main">';
        html += '    <div class="error-card-title">' + escapeHtml(titleDisplay) + '</div>';
        html += '    <div class="error-card-meta">';
        html += '      <span class="error-card-tag ' + tagClass + '">' + escapeHtml(entry.subject) + '</span>';
        html += '      <span class="error-card-knowledge">' + escapeHtml(entry.knowledgePoint) + '</span>';
        html += '      <span class="error-card-stars">' + renderStars(entry.difficulty) + '</span>';
        html += '    </div>';
        html += '  </div>';
        html += '  <div class="error-card-actions">';
        html += '    <button class="btn btn-xs btn-secondary view-detail-btn" data-id="' + entry.id + '">查看</button>';
        html += '    <button class="btn btn-xs btn-secondary edit-btn" data-id="' + entry.id + '">编辑</button>';
        html += '    <button class="btn btn-xs btn-danger delete-btn" data-id="' + entry.id + '">删除</button>';
        html += '  </div>';
        html += '</div>';
    }

    DOM.errorList.innerHTML = html;
    // 按钮事件通过事件委托统一处理（在初始化时绑定一次，见下方「列表事件委托」）
}

// ==================== 更新统计 ====================

/**
 * 更新统计数据
 */
function updateStats() {
    var entries = loadEntries();
    var total = entries.length;
    var advanced = 0;
    var linear = 0;
    var probability = 0;

    for (var i = 0; i < entries.length; i++) {
        switch (entries[i].subject) {
            case '高等数学':
                advanced++;
                break;
            case '线性代数':
                linear++;
                break;
            case '概率论':
                probability++;
                break;
        }
    }

    // 动画更新数字
    animateNumber(DOM.statTotal, total);
    animateNumber(DOM.statAdvanced, advanced);
    animateNumber(DOM.statLinear, linear);
    animateNumber(DOM.statProbability, probability);
}

/**
 * 数字动画（自动清除同元素的上一个动画，避免并发闪烁）
 * @param {HTMLElement} element
 * @param {number} target
 */
function animateNumber(element, target) {
    // 清除该元素上正在运行的动画
    if (element._animInterval) {
        clearInterval(element._animInterval);
        element._animInterval = null;
    }

    var current = parseInt(element.textContent, 10) || 0;
    if (current === target) return;

    var diff = target - current;
    var step = Math.ceil(Math.abs(diff) / 15);
    if (step < 1) step = 1;
    if (diff < 0) step = -step;

    element._animInterval = setInterval(function () {
        current += step;
        if ((step > 0 && current >= target) || (step < 0 && current <= target)) {
            current = target;
            clearInterval(element._animInterval);
            element._animInterval = null;
        }
        element.textContent = current;
    }, 30);
}

// ==================== 刷新全部 ====================

/**
 * 刷新列表 + 统计数据
 */
function refreshAll() {
    renderList();
    updateStats();
}

// ==================== 表单处理 ====================

// 星星评分交互
var starButtons = DOM.starRating.querySelectorAll('.star-btn');
var currentRating = 0;

/**
 * 设置星星高亮
 * @param {number} rating - 1-5 或 0 清除
 */
function setStarHighlight(rating) {
    currentRating = rating;
    for (var i = 0; i < starButtons.length; i++) {
        var star = parseInt(starButtons[i].getAttribute('data-star'), 10);
        if (star <= rating) {
            starButtons[i].classList.add('active');
        } else {
            starButtons[i].classList.remove('active');
        }
    }

    DOM.difficultyInput.value = rating;

    if (rating > 0) {
        DOM.starRating.classList.add('selected');
        var labels = ['很简单', '较简单', '中等', '较难', '很难'];
        DOM.difficultyHint.textContent = '难度：' + rating + ' 星 — ' + labels[rating - 1];
        DOM.difficultyHint.style.color = '#F59E0B';
    } else {
        DOM.starRating.classList.remove('selected');
        DOM.difficultyHint.textContent = '请点击星星选择难度';
        DOM.difficultyHint.style.color = '';
    }
}

// 绑定星星点击
for (var i = 0; i < starButtons.length; i++) {
    starButtons[i].addEventListener('click', function () {
        var star = parseInt(this.getAttribute('data-star'), 10);
        // 如果点击已选中的最高星，取消选择
        if (star === currentRating && starButtons[star - 1].classList.contains('active')) {
            setStarHighlight(0);
        } else {
            setStarHighlight(star);
        }
    });
}

// 表单提交
DOM.errorForm.addEventListener('submit', function (e) {
    e.preventDefault();

    // 获取表单数据
    var title = DOM.titleInput.value.trim();
    var subject = DOM.subjectSelect.value;
    var knowledgePoint = DOM.knowledgePointInput.value.trim();
    var errorReason = DOM.errorReasonInput.value.trim();
    var difficulty = parseInt(DOM.difficultyInput.value, 10);
    var editingId = DOM.editingId.value;

    // 验证
    if (!title) {
        showToast('请输入题目内容', 'error');
        DOM.titleInput.focus();
        return;
    }
    if (!subject) {
        showToast('请选择科目', 'error');
        DOM.subjectSelect.focus();
        return;
    }
    if (!knowledgePoint) {
        showToast('请输入知识点', 'error');
        DOM.knowledgePointInput.focus();
        return;
    }
    if (!errorReason) {
        showToast('请输入错误原因', 'error');
        DOM.errorReasonInput.focus();
        return;
    }
    if (difficulty < 1 || difficulty > 5) {
        showToast('请选择难度（1-5星）', 'error');
        return;
    }

    var entries = loadEntries();

    if (editingId) {
        // 编辑模式
        var found = false;
        for (var i = 0; i < entries.length; i++) {
            if (entries[i].id === editingId) {
                entries[i].title = title;
                entries[i].subject = subject;
                entries[i].knowledgePoint = knowledgePoint;
                entries[i].errorReason = errorReason;
                entries[i].difficulty = difficulty;
                found = true;
                break;
            }
        }
        if (!found) {
            showToast('编辑的错题不存在', 'error');
            resetForm();
            refreshAll();
            return;
        }
        saveEntries(entries);
        showToast('错题已更新', 'success');
    } else {
        // 新增模式
        var newEntry = {
            id: generateId(),
            title: title,
            subject: subject,
            knowledgePoint: knowledgePoint,
            errorReason: errorReason,
            difficulty: difficulty,
            createdAt: new Date().toISOString()
        };
        entries.push(newEntry);
        saveEntries(entries);
        showToast('错题已保存', 'success');
    }

    // 重置表单并刷新
    resetForm();
    refreshAll();

    // 移动端：保存后滚动到列表区域让用户看到结果
    if (window.innerWidth <= 1100) {
        document.getElementById('errorList').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
});

// 取消编辑
DOM.cancelEditBtn.addEventListener('click', function () {
    resetForm();
});

/**
 * 重置表单
 */
function resetForm() {
    DOM.errorForm.reset();
    DOM.editingId.value = '';
    DOM.difficultyInput.value = '0';
    setStarHighlight(0);
    DOM.submitBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>保存错题';
    DOM.cancelEditBtn.style.display = 'none';
    DOM.titleInput.focus();
}

/**
 * 进入编辑模式
 * @param {string} id
 */
function editEntry(id) {
    var entries = loadEntries();
    var entry = null;
    for (var i = 0; i < entries.length; i++) {
        if (entries[i].id === id) {
            entry = entries[i];
            break;
        }
    }
    if (!entry) return;

    // 填充表单
    DOM.titleInput.value = entry.title;
    DOM.subjectSelect.value = entry.subject;
    DOM.knowledgePointInput.value = entry.knowledgePoint;
    DOM.errorReasonInput.value = entry.errorReason;
    DOM.editingId.value = entry.id;
    setStarHighlight(entry.difficulty);

    // 切换按钮
    DOM.submitBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>更新错题';
    DOM.cancelEditBtn.style.display = 'inline-flex';

    // 滚动到表单
    DOM.errorForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    DOM.titleInput.focus();
}

// ==================== 搜索 ====================

// 搜索输入（防抖）
var searchTimer = null;
DOM.searchInput.addEventListener('input', function () {
    var keyword = DOM.searchInput.value.trim();

    // 显示/隐藏清除按钮
    DOM.clearSearchBtn.style.display = keyword ? 'inline-flex' : 'none';

    // 防抖
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(function () {
        renderList();
    }, 250);
});

// 清除搜索
DOM.clearSearchBtn.addEventListener('click', function () {
    DOM.searchInput.value = '';
    DOM.clearSearchBtn.style.display = 'none';
    renderList();
    DOM.searchInput.focus();
});

// ==================== 列表事件委托 ====================

// 使用事件委托统一处理列表中的所有按钮点击（只需绑定一次）
DOM.errorList.addEventListener('click', function (e) {
    var btn = e.target.closest('button');
    if (!btn) return;
    var id = btn.getAttribute('data-id');
    if (!id) return;

    if (btn.classList.contains('view-detail-btn')) {
        viewDetail(id);
    } else if (btn.classList.contains('delete-btn')) {
        confirmDelete(id);
    } else if (btn.classList.contains('edit-btn')) {
        editEntry(id);
    }
});

// ==================== 初始化 ====================

function init() {
    // 加载数据并渲染
    refreshAll();

    // 聚焦到题目输入框
    DOM.titleInput.focus();

    console.log('数学错题本 V1.0 初始化完成 ✨');
    console.log('已加载 ' + loadEntries().length + ' 条错题记录');
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);

// ==================== 暴露全局 API（调试用） ====================
window.ErrorBook = {
    load: loadEntries,
    save: saveEntries,
    refresh: refreshAll,
    reset: resetForm,
    getStats: function () {
        var entries = loadEntries();
        return {
            total: entries.length,
            advanced: entries.filter(function (e) { return e.subject === '高等数学'; }).length,
            linear: entries.filter(function (e) { return e.subject === '线性代数'; }).length,
            probability: entries.filter(function (e) { return e.subject === '概率论'; }).length
        };
    },
    exportAll: function () {
        var entries = loadEntries();
        console.table(entries);
        return entries;
    },
    clearAll: function () {
        if (confirm('确定要清空所有错题数据吗？此操作不可撤销！')) {
            saveEntries([]);
            refreshAll();
            showToast('所有错题已清空', 'success');
        }
    }
};
