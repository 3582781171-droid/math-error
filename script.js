/* ============================================================
   数学错题本 V1.6.1 — 核心逻辑（用户体验优化版）
   ============================================================ */

// ==================== 常量与配置 ====================
var STORAGE_KEY = 'math_error_book_entries';
var DB_NAME = 'MathErrorBook';
var DB_VERSION = 1;
var DATA_VERSION = 2; // V1.6 数据版本号，用于兼容迁移
var SUBJECT_TAG_CLASS = {
    '高等数学': 'tag-advanced',
    '线性代数': 'tag-linear',
    '概率论': 'tag-probability'
};

// ==================== 知识点关键词匹配规则 ====================
// 按优先级排序：更具体的关键词排在前面
var KNOWLEDGE_RULES = [
    { keywords: ['极限', 'lim', 'lim(', 'x→', 'x->', '→∞', '→0', '无穷小', '无穷大', '洛必达', '夹逼'], point: '极限' },
    { keywords: ['微分方程', '通解', '特解', '齐次方程', '特征方程', 'y\'\'', 'y\''], point: '微分方程' },
    { keywords: ['导数', '求导', 'dy/dx', '微分', '可导', "f'(x)", '偏导数', '偏微分', '方向导数', '梯度'], point: '导数' },
    { keywords: ['积分', '∫', '定积分', '不定积分', '二重积分', '三重积分', '曲线积分', '曲面积分', '原函数'], point: '积分' },
    { keywords: ['矩阵', '行列式', '特征值', '特征向量', '线性方程组', '逆矩阵', '秩', '线性相关', '线性无关', '正交', '对角化', '二次型'], point: '线性代数' },
    { keywords: ['概率', '随机变量', '期望', '方差', '分布函数', '密度函数', '正态分布', '二项分布', '泊松分布', '条件概率', '贝叶斯'], point: '概率统计' },
    { keywords: ['级数', '收敛', '发散', '幂级数', '泰勒', '傅里叶', '无穷级数', '收敛半径', '绝对收敛', '条件收敛'], point: '级数' },
    { keywords: ['向量', '空间解析几何', '平面方程', '直线方程', '点积', '叉积', '曲面'], point: '空间解析几何' },
    { keywords: ['连续', '间断点', '可去间断', '跳跃间断'], point: '函数与极限' },
    { keywords: ['中值定理', '罗尔', '拉格朗日', '柯西', '泰勒公式'], point: '中值定理' },
    { keywords: ['重积分', '二重积分', '三重积分', '极坐标', '柱坐标', '球坐标'], point: '重积分' },
    { keywords: ['曲面积分', '曲线积分', '格林公式', '高斯公式', '斯托克斯'], point: '曲线曲面积分' },
];

// ==================== DOM 引用缓存 ====================
var DOM = {
    // 统计
    statTotal: document.getElementById('statTotal'),
    statMastered: document.getElementById('statMastered'),
    statUnmastered: document.getElementById('statUnmastered'),
    statFavorites: document.getElementById('statFavorites'),

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

    // 图片上传
    addImageBtn: document.getElementById('addImageBtn'),
    imageFileInput: document.getElementById('imageFileInput'),
    imagePreviewList: document.getElementById('imagePreviewList'),

    // 搜索
    searchInput: document.getElementById('searchInput'),
    clearSearchBtn: document.getElementById('clearSearchBtn'),

    // 筛选与排序
    filterSubject: document.getElementById('filterSubject'),
    filterDifficulty: document.getElementById('filterDifficulty'),
    statusFilterGroup: document.getElementById('statusFilterGroup'),
    sortBy: document.getElementById('sortBy'),

    // 工具栏
    batchModeBtn: document.getElementById('batchModeBtn'),
    batchDeleteBtn: document.getElementById('batchDeleteBtn'),
    exportBtn: document.getElementById('exportBtn'),
    importBtn: document.getElementById('importBtn'),
    importFileInput: document.getElementById('importFileInput'),
    clearAllBtn: document.getElementById('clearAllBtn'),

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

    // 图片查看器
    imageViewerModal: document.getElementById('imageViewerModal'),
    imageViewerImg: document.getElementById('imageViewerImg'),
    imageViewerTitle: document.getElementById('imageViewerTitle'),
    closeImageViewerModal: document.getElementById('closeImageViewerModal'),
    closeImageViewerBtn: document.getElementById('closeImageViewerBtn'),

    // 随机复习
    startReviewBtn: document.getElementById('startReviewBtn'),
    reviewModal: document.getElementById('reviewModal'),
    reviewBody: document.getElementById('reviewBody'),
    reviewProgressSection: document.getElementById('reviewProgressSection'),
    reviewProgressText: document.getElementById('reviewProgressText'),
    reviewProgressFill: document.getElementById('reviewProgressFill'),
    reviewQuestionCard: document.getElementById('reviewQuestionCard'),
    reviewAnswerSection: document.getElementById('reviewAnswerSection'),
    reviewActions: document.getElementById('reviewActions'),
    reviewShowAnswerBtn: document.getElementById('reviewShowAnswerBtn'),
    reviewMasteredBtn: document.getElementById('reviewMasteredBtn'),
    reviewNextBtn: document.getElementById('reviewNextBtn'),
    reviewSummary: document.getElementById('reviewSummary'),
    closeReviewModalTop: document.getElementById('closeReviewModalTop'),
    closeReviewBtn: document.getElementById('closeReviewBtn'),

    // OCR 拍照录题
    ocrSection: document.getElementById('ocrSection'),
    cameraBtn: document.getElementById('cameraBtn'),
    uploadBtn: document.getElementById('uploadBtn'),
    cameraInput: document.getElementById('cameraInput'),
    galleryInput: document.getElementById('galleryInput'),
    ocrStatus: document.getElementById('ocrStatus'),
    ocrSpinner: document.getElementById('ocrSpinner'),
    ocrStatusLabel: document.getElementById('ocrStatusLabel'),
    ocrStatusProgress: document.getElementById('ocrStatusProgress'),
    ocrProgressBar: document.getElementById('ocrProgressBar'),
    ocrProgressFill: document.getElementById('ocrProgressFill'),
    ocrPreview: document.getElementById('ocrPreview'),
    ocrPreviewImg: document.getElementById('ocrPreviewImg'),
    ocrPreviewRemove: document.getElementById('ocrPreviewRemove'),
    ocrResultCard: document.getElementById('ocrResultCard'),
    ocrResultText: document.getElementById('ocrResultText'),
    ocrResultTitle: document.getElementById('ocrResultTitle'),
    ocrResultKp: document.getElementById('ocrResultKp'),
    ocrResultConfidence: document.getElementById('ocrResultConfidence'),
    ocrCompressStats: document.getElementById('ocrCompressStats'),
    ocrCompressText: document.getElementById('ocrCompressText'),
    autoDetectBadge: document.getElementById('autoDetectBadge'),

    // Toast
    toastContainer: document.getElementById('toastContainer')
};

// ==================== 状态变量 ====================
var pendingDeleteId = null;
var batchMode = false;
var selectedIds = {};
var db = null;
var pendingImages = [];       // 待上传的 File 对象
var removedImageIds = [];     // 编辑时待删除的已有图片 ID
var activeStatusFilter = 'all'; // 当前激活的状态筛选: all | mastered | unmastered | favorites

// ==================== OCR 状态变量 ====================
var ocrWorker = null;          // Tesseract.js worker 实例
var ocrSourceFile = null;      // 当前拍照/上传的原始文件
var ocrSourcePreviewUrl = null; // OCR 源图片的预览 blob URL
var ocrIsProcessing = false;   // 是否正在识别中
var ocrResultTextCache = '';   // OCR 识别出的原始文本缓存

// ==================== 随机复习状态 ====================
var reviewQueue = [];          // 待复习的错题数组
var reviewIndex = 0;          // 当前复习到的索引
var reviewAnswerShown = false; // 当前题目答案是否已显示

// ==================== IndexedDB 数据层 ====================

/**
 * 打开/创建 IndexedDB 数据库（连接缓存）
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
    if (db) return Promise.resolve(db);
    return new Promise(function (resolve, reject) {
        var request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = function (e) {
            var database = e.target.result;
            if (!database.objectStoreNames.contains('entries')) {
                var entriesStore = database.createObjectStore('entries', { keyPath: 'id' });
                entriesStore.createIndex('subject', 'subject', { unique: false });
                entriesStore.createIndex('difficulty', 'difficulty', { unique: false });
                entriesStore.createIndex('isFavorite', 'isFavorite', { unique: false });
                entriesStore.createIndex('createdAt', 'createdAt', { unique: false });
                entriesStore.createIndex('mastered', 'mastered', { unique: false });
            }
            if (!database.objectStoreNames.contains('images')) {
                var imagesStore = database.createObjectStore('images', { keyPath: 'imageId' });
                imagesStore.createIndex('entryId', 'entryId', { unique: false });
            }
        };
        request.onsuccess = function (e) {
            db = e.target.result;
            resolve(db);
        };
        request.onerror = function (e) {
            reject(e.target.error);
        };
    });
}

/**
 * 从 localStorage 迁移数据到 IndexedDB
 * @returns {Promise<number>} 迁移的条目数
 */
function migrateFromLocalStorage() {
    try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return Promise.resolve(0);
        var entries = JSON.parse(raw);
        if (!Array.isArray(entries) || entries.length === 0) return Promise.resolve(0);

        // 标准化旧数据（含 V1.6 字段）
        for (var i = 0; i < entries.length; i++) {
            if (typeof entries[i].isFavorite !== 'boolean') entries[i].isFavorite = false;
            if (typeof entries[i].createdAt !== 'string') entries[i].createdAt = new Date().toISOString();
            if (typeof entries[i].mastered !== 'boolean') entries[i].mastered = false;
            if (!Array.isArray(entries[i].images)) entries[i].images = [];
            if (typeof entries[i].reviewCount !== 'number') entries[i].reviewCount = 0;
            if (entries[i].ocrText === undefined) entries[i].ocrText = null;
            if (typeof entries[i].dataVersion !== 'number') entries[i].dataVersion = 1;
            for (var j = 0; j < entries[i].images.length; j++) {
                if (!entries[i].images[j].type) entries[i].images[j].type = 'manual';
            }
        }

        return saveEntries(entries).then(function () {
            // 备份后删除 localStorage 数据
            localStorage.setItem(STORAGE_KEY + '_v12_backup', raw);
            localStorage.removeItem(STORAGE_KEY);
            return entries.length;
        });
    } catch (e) {
        console.error('数据迁移失败:', e);
        return Promise.resolve(0);
    }
}

/**
 * 从 IndexedDB 读取所有错题（优雅降级到 localStorage）
 * @returns {Promise<Array<Object>>}
 */
function loadEntries() {
    return openDB().then(function (database) {
        return new Promise(function (resolve) {
            try {
                var tx = database.transaction('entries', 'readonly');
                var store = tx.objectStore('entries');
                var request = store.getAll();
                request.onsuccess = function () {
                    var entries = request.result || [];
                    // 兼容旧数据（V1.5 → V1.6 迁移）
                    for (var i = 0; i < entries.length; i++) {
                        if (typeof entries[i].isFavorite !== 'boolean') entries[i].isFavorite = false;
                        if (typeof entries[i].createdAt !== 'string') entries[i].createdAt = new Date().toISOString();
                        if (typeof entries[i].mastered !== 'boolean') entries[i].mastered = false;
                        if (!Array.isArray(entries[i].images)) entries[i].images = [];
                        if (typeof entries[i].reviewCount !== 'number') entries[i].reviewCount = 0;
                        // V1.6 新增字段
                        if (entries[i].ocrText === undefined) entries[i].ocrText = null;
                        if (typeof entries[i].dataVersion !== 'number') entries[i].dataVersion = 1;
                        // 旧图片没有 type 字段，标记为 'manual'
                        for (var j = 0; j < entries[i].images.length; j++) {
                            if (!entries[i].images[j].type) entries[i].images[j].type = 'manual';
                        }
                    }
                    resolve(entries);
                };
                request.onerror = function () {
                    // IndexedDB 失败，尝试 localStorage 降级
                    resolve(fallbackLoadFromLocalStorage());
                };
            } catch (e) {
                resolve(fallbackLoadFromLocalStorage());
            }
        });
    }).catch(function () {
        return fallbackLoadFromLocalStorage();
    });
}

/**
 * localStorage 降级读取（同步逻辑包装为 Promise）
 */
function fallbackLoadFromLocalStorage() {
    try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        var data = JSON.parse(raw);
        if (!Array.isArray(data)) return [];
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
        }).map(function (entry) {
            // V1.6 字段兼容
            if (entry.ocrText === undefined) entry.ocrText = null;
            if (typeof entry.dataVersion !== 'number') entry.dataVersion = 1;
            if (!Array.isArray(entry.images)) entry.images = [];
            for (var k = 0; k < entry.images.length; k++) {
                if (!entry.images[k].type) entry.images[k].type = 'manual';
            }
            return entry;
        });
    } catch (e) {
        return [];
    }
}

/**
 * 保存所有错题到 IndexedDB
 * @param {Array<Object>} entries
 * @returns {Promise<void>}
 */
function saveEntries(entries) {
    return openDB().then(function (database) {
        return new Promise(function (resolve) {
            try {
                var tx = database.transaction('entries', 'readwrite');
                var store = tx.objectStore('entries');
                var clearReq = store.clear();
                clearReq.onsuccess = function () {
                    if (entries.length === 0) { resolve(); return; }
                    for (var i = 0; i < entries.length; i++) {
                        store.add(entries[i]);
                    }
                };
                tx.oncomplete = function () { resolve(); };
                tx.onerror = function () {
                    console.error('IndexedDB 事务失败');
                    showToast('保存失败', 'error');
                    resolve();
                };
            } catch (e) {
                console.error('保存失败:', e);
                // 降级到 localStorage
                try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); } catch (e2) {}
                resolve();
            }
        });
    }).catch(function () {
        // IndexedDB 完全不可用时降级
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); } catch (e) {}
        return Promise.resolve();
    });
}

// ==================== 图片存储层 ====================

/**
 * 压缩图片
 * @param {File} file
 * @param {number} maxWidth
 * @param {number} quality
 * @returns {Promise<Blob>}
 */
function compressImage(file, maxWidth, quality) {
    if (maxWidth === void 0) maxWidth = 800;
    if (quality === void 0) quality = 0.7;

    return new Promise(function (resolve) {
        // 小于 100KB 的图片不压缩
        if (file.size < 100 * 1024) {
            resolve(file);
            return;
        }

        var reader = new FileReader();
        reader.onload = function (e) {
            var img = new Image();
            img.onload = function () {
                if (img.width <= maxWidth) {
                    resolve(file);
                    return;
                }
                var canvas = document.createElement('canvas');
                var ratio = maxWidth / img.width;
                canvas.width = maxWidth;
                canvas.height = Math.round(img.height * ratio);
                var ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(function (blob) {
                    resolve(blob || file);
                }, 'image/jpeg', quality);
            };
            img.onerror = function () { resolve(file); };
            img.src = e.target.result;
        };
        reader.onerror = function () { resolve(file); };
        reader.readAsDataURL(file);
    });
}

/**
 * 保存图片到 IndexedDB
 * @param {string} entryId
 * @param {File} file
 * @returns {Promise<Object>} 图片元数据 { imageId, fileName, mimeType, size }
 */
function saveImage(entryId, file) {
    return compressImage(file).then(function (blob) {
        return openDB().then(function (database) {
            return new Promise(function (resolve, reject) {
                var imageId = 'img_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
                var record = {
                    imageId: imageId,
                    entryId: entryId,
                    blob: blob,
                    fileName: file.name,
                    mimeType: blob.type || file.type || 'image/jpeg',
                    size: blob.size
                };
                var tx = database.transaction('images', 'readwrite');
                var store = tx.objectStore('images');
                store.add(record);
                tx.oncomplete = function () {
                    resolve({
                        imageId: imageId,
                        fileName: record.fileName,
                        mimeType: record.mimeType,
                        size: record.size
                    });
                };
                tx.onerror = function () { reject(tx.error); };
            });
        });
    });
}

/**
 * 获取单张图片的展示 URL
 * @param {string} imageId
 * @returns {Promise<string|null>}
 */
function getImageUrl(imageId) {
    return openDB().then(function (database) {
        return new Promise(function (resolve) {
            var tx = database.transaction('images', 'readonly');
            var store = tx.objectStore('images');
            var request = store.get(imageId);
            request.onsuccess = function () {
                if (request.result && request.result.blob) {
                    resolve(URL.createObjectURL(request.result.blob));
                } else {
                    resolve(null);
                }
            };
            request.onerror = function () { resolve(null); };
        });
    });
}

/**
 * 获取某道错题的所有图片 URL
 * @param {Array<Object>} imageMetas - 图片元数据数组
 * @returns {Promise<Array<{imageId, url, fileName}>>}
 */
function loadImageUrls(imageMetas) {
    if (!imageMetas || imageMetas.length === 0) return Promise.resolve([]);
    return Promise.all(imageMetas.map(function (meta) {
        return getImageUrl(meta.imageId).then(function (url) {
            return { imageId: meta.imageId, url: url, fileName: meta.fileName };
        });
    }));
}

/**
 * 删除单张图片
 * @param {string} imageId
 * @returns {Promise<void>}
 */
function deleteImage(imageId) {
    return openDB().then(function (database) {
        return new Promise(function (resolve) {
            var tx = database.transaction('images', 'readwrite');
            var store = tx.objectStore('images');
            store.delete(imageId);
            tx.oncomplete = function () { resolve(); };
            tx.onerror = function () { resolve(); };
        });
    });
}

/**
 * 删除某道错题的所有图片
 * @param {Array<Object>} imageMetas
 * @returns {Promise<void>}
 */
function deleteAllImages(imageMetas) {
    if (!imageMetas || imageMetas.length === 0) return Promise.resolve();
    return Promise.all(imageMetas.map(function (meta) {
        return deleteImage(meta.imageId);
    })).then(function () {});
}

// ==================== Toast 提示 ====================

function showToast(message, type) {
    if (type === void 0) type = 'success';

    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;

    var iconSvg = '';
    if (type === 'success') {
        iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>';
    } else {
        iconSvg = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
    }

    toast.innerHTML = iconSvg + '<span>' + escapeHtml(message) + '</span>';
    DOM.toastContainer.appendChild(toast);

    var timer = setTimeout(function () {
        removeToast(toast);
    }, 2500);

    toast.addEventListener('click', function () {
        clearTimeout(timer);
        removeToast(toast);
    });
}

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

function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

function truncateText(str, maxLen) {
    if (str.length <= maxLen) return str;
    return str.substring(0, maxLen) + '…';
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        var d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        var now = new Date();
        var diff = now - d;
        if (diff < 60000) return '刚刚';
        if (diff < 3600000) return Math.floor(diff / 60000) + ' 分钟前';
        if (diff < 86400000) return Math.floor(diff / 3600000) + ' 小时前';
        if (diff < 604800000) return Math.floor(diff / 86400000) + ' 天前';
        var year = d.getFullYear();
        var month = ('0' + (d.getMonth() + 1)).slice(-2);
        var day = ('0' + d.getDate()).slice(-2);
        return year + '-' + month + '-' + day;
    } catch (e) {
        return '';
    }
}

function renderStars(level) {
    var html = '';
    for (var i = 1; i <= 5; i++) {
        var filled = i <= level ? ' filled' : '';
        html += '<svg class="error-card-star' + filled + '" viewBox="0 0 24 24" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
    }
    return html;
}

function renderDetailStars(level) {
    var html = '';
    for (var i = 1; i <= 5; i++) {
        var filled = i <= level ? ' filled' : '';
        html += '<svg class="detail-star' + filled + '" viewBox="0 0 24 24" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
    }
    return html;
}

// ==================== 知识点自动识别 ====================

/**
 * 根据文本内容自动识别知识点
 * @param {string} text - OCR 或用户输入的文本
 * @returns {string} 识别出的知识点，未匹配返回空字符串
 */
function detectKnowledgePoint(text) {
    if (!text || !text.trim()) return '';
    var lowerText = text.toLowerCase().replace(/\s+/g, ' ');
    for (var i = 0; i < KNOWLEDGE_RULES.length; i++) {
        var rule = KNOWLEDGE_RULES[i];
        for (var j = 0; j < rule.keywords.length; j++) {
            if (lowerText.indexOf(rule.keywords[j].toLowerCase()) !== -1) {
                return rule.point;
            }
        }
    }
    return '';
}

/**
 * 自动填充知识点字段
 * @param {string} text - 要分析的文本
 * @returns {string|null} 识别出的知识点，未匹配返回 null
 */
function autoFillKnowledgePoint(text) {
    var detected = detectKnowledgePoint(text);
    if (detected) {
        DOM.knowledgePointInput.value = detected;
        DOM.autoDetectBadge.style.display = 'inline';
        return detected;
    } else {
        DOM.autoDetectBadge.style.display = 'none';
        return null;
    }
}

/**
 * 根据文本内容自动生成规范化标题
 * 格式：【知识点】+ 前20字
 * @param {string} text - OCR 或用户输入的文本
 * @returns {string} 生成的标题
 */
function generateAutoTitle(text) {
    if (!text || !text.trim()) return '';
    // 先移除已有的【xxx】前缀
    var cleanText = text.replace(/^【[^】]*】\s*/, '').trim();
    if (!cleanText) return text;
    var knowledgePoint = detectKnowledgePoint(cleanText);
    var prefix = knowledgePoint ? '【' + knowledgePoint + '】' : '【未分类】';
    var shortText = cleanText.length > 20 ? cleanText.substring(0, 20) + '…' : cleanText;
    return prefix + shortText;
}

// ==================== OCR 引擎管理 ====================

/**
 * 初始化 Tesseract.js Worker（懒加载，单例）
 * @returns {Promise<Tesseract.Worker>}
 */
function initOCRWorker() {
    if (ocrWorker) return Promise.resolve(ocrWorker);

    DOM.ocrStatusLabel.textContent = '正在加载 OCR 引擎...';
    DOM.ocrStatusProgress.textContent = '首次使用需下载语言包（约30MB）';
    DOM.ocrProgressFill.style.width = '0%';

    return Tesseract.createWorker('chi_sim+eng', 1, {
        logger: function (m) {
            if (m.status === 'recognizing text') {
                // 识别阶段
                var pct = Math.round((m.progress || 0) * 100);
                DOM.ocrStatusLabel.textContent = '正在识别题目...';
                DOM.ocrStatusProgress.textContent = pct + '%';
                DOM.ocrProgressFill.style.width = pct + '%';
            } else if (m.status === 'loading tesseract core') {
                DOM.ocrStatusLabel.textContent = '正在加载 OCR 引擎...';
                DOM.ocrStatusProgress.textContent = '初始化核心引擎';
                DOM.ocrProgressFill.style.width = '15%';
            } else if (m.status === 'initializing tesseract') {
                DOM.ocrStatusLabel.textContent = '正在加载 OCR 引擎...';
                DOM.ocrStatusProgress.textContent = '初始化识别器';
                DOM.ocrProgressFill.style.width = '25%';
            } else if (m.status === 'loading language traineddata') {
                var loadPct = Math.round((m.progress || 0) * 100);
                DOM.ocrStatusLabel.textContent = '正在加载 OCR 引擎...';
                DOM.ocrStatusProgress.textContent = '下载语言包 ' + loadPct + '%';
                DOM.ocrProgressFill.style.width = Math.round(25 + loadPct * 0.5) + '%';
            } else if (m.status === 'loaded language traineddata') {
                DOM.ocrStatusLabel.textContent = '正在加载 OCR 引擎...';
                DOM.ocrStatusProgress.textContent = '语言包加载完成';
                DOM.ocrProgressFill.style.width = '75%';
            } else if (m.status === 'initializing api') {
                DOM.ocrProgressFill.style.width = '85%';
            }
        }
    }).then(function (worker) {
        ocrWorker = worker;
        return worker;
    });
}

/**
 * 销毁 OCR Worker 释放内存
 */
function terminateOCRWorker() {
    if (ocrWorker) {
        try { ocrWorker.terminate(); } catch (e) {}
        ocrWorker = null;
    }
}

/**
 * 压缩图片用于 OCR（最长边 1600px，JPEG Q=0.8，仅 >1MB 时触发）
 * @param {File} file
 * @returns {Promise<{blob: Blob, originalSize: number, compressedSize: number, ratio: number, wasCompressed: boolean}>}
 */
function compressImageForOCR(file) {
    var maxWidth = 1600;
    var quality = 0.8;
    var originalSize = file.size;
    var threshold = 1 * 1024 * 1024; // 1MB

    return new Promise(function (resolve) {
        // 小于 1MB 的图片不压缩
        if (file.size <= threshold) {
            resolve({
                blob: file,
                originalSize: originalSize,
                compressedSize: originalSize,
                ratio: 0,
                wasCompressed: false
            });
            return;
        }

        var reader = new FileReader();
        reader.onload = function (e) {
            var img = new Image();
            img.onload = function () {
                // 既不超过 maxWidth 且尺寸也不大 → 也跳过压缩
                if (img.width <= maxWidth && file.size <= threshold * 1.5) {
                    resolve({
                        blob: file,
                        originalSize: originalSize,
                        compressedSize: originalSize,
                        ratio: 0,
                        wasCompressed: false
                    });
                    return;
                }
                var canvas = document.createElement('canvas');
                var ratio = Math.min(1, maxWidth / img.width);
                canvas.width = Math.round(img.width * ratio);
                canvas.height = Math.round(img.height * ratio);
                var ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(function (blob) {
                    var result = blob || file;
                    var compressedSize = result.size;
                    var compressRatio = Math.round((1 - compressedSize / originalSize) * 100);
                    resolve({
                        blob: result,
                        originalSize: originalSize,
                        compressedSize: compressedSize,
                        ratio: compressRatio > 0 ? compressRatio : 0,
                        wasCompressed: compressRatio > 0
                    });
                }, 'image/jpeg', quality);
            };
            img.onerror = function () {
                resolve({
                    blob: file, originalSize: originalSize,
                    compressedSize: originalSize, ratio: 0, wasCompressed: false
                });
            };
            img.src = e.target.result;
        };
        reader.onerror = function () {
            resolve({
                blob: file, originalSize: originalSize,
                compressedSize: originalSize, ratio: 0, wasCompressed: false
            });
        };
        reader.readAsDataURL(file);
    });
}

/**
 * 格式化文件大小显示
 * @param {number} bytes
 * @returns {string}
 */
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

/**
 * 显示压缩统计信息
 * @param {{originalSize: number, compressedSize: number, ratio: number, wasCompressed: boolean}} stats
 */
function showCompressionStats(stats) {
    if (stats.wasCompressed) {
        DOM.ocrCompressText.textContent =
            '原图：' + formatFileSize(stats.originalSize) +
            ' → 压缩后：' + formatFileSize(stats.compressedSize) +
            '（压缩率 ' + stats.ratio + '%）';
    } else {
        DOM.ocrCompressText.textContent = '原图：' + formatFileSize(stats.originalSize) + '（无需压缩）';
    }
    DOM.ocrCompressStats.style.display = 'flex';
}

function hideCompressionStats() {
    DOM.ocrCompressStats.style.display = 'none';
    DOM.ocrCompressText.textContent = '';
}

/**
 * 执行 OCR 识别
 * @param {File} file - 图片文件
 * @returns {Promise<{text: string, detectedKnowledge: string|null}>}
 */
async function performOCR(file) {
    if (ocrIsProcessing) {
        showToast('正在识别中，请稍候', 'error');
        return null;
    }

    ocrIsProcessing = true;
    showOCRStatus('recognizing');

    try {
        // 压缩图片
        var compressResult = await compressImageForOCR(file);

        // 显示压缩统计
        showCompressionStats(compressResult);

        // 初始化 Worker
        var worker = await initOCRWorker();

        // 执行识别
        DOM.ocrStatusLabel.textContent = '正在识别题目...';
        DOM.ocrStatusProgress.textContent = '处理中';
        DOM.ocrProgressFill.style.width = '50%';

        var result = await worker.recognize(compressResult.blob);

        var text = (result.data.text || '').trim();
        var confidence = typeof result.data.confidence === 'number'
            ? Math.round(result.data.confidence)
            : 0;

        // 后处理：清理常见 OCR 噪音
        text = cleanOCRText(text);

        // 保存 OCR 原始结果
        ocrResultTextCache = text;

        // 自动识别知识点
        var detectedKnowledge = detectKnowledgePoint(text);

        // 自动生成标题
        var autoTitle = generateAutoTitle(text);

        // 填充表单
        DOM.titleInput.value = autoTitle;
        lastAutoTitle = autoTitle; // 记录以便编辑同步检测
        autoFillKnowledgePoint(text);

        // 显示增强型结果卡片
        showOCRResult(text, detectedKnowledge, confidence, autoTitle);

        hideOCRStatus();
        ocrIsProcessing = false;

        return {
            text: text,
            detectedKnowledge: detectedKnowledge,
            confidence: confidence,
            autoTitle: autoTitle,
            compressResult: compressResult
        };
    } catch (err) {
        console.error('OCR 识别失败:', err);
        showOCRError('识别失败：' + (err.message || '未知错误'));
        hideCompressionStats();
        ocrIsProcessing = false;
        return null;
    }
}

/**
 * 获取置信度对应的 CSS 类名
 * @param {number} confidence
 * @returns {string}
 */
function getConfidenceClass(confidence) {
    if (confidence >= 80) return 'confidence-high';
    if (confidence >= 70) return 'confidence-medium';
    return 'confidence-low';
}

/**
 * 获取置信度对应的文本标签
 * @param {number} confidence
 * @returns {string}
 */
function getConfidenceLabel(confidence) {
    if (confidence >= 80) return ' ✅ 识别质量良好';
    if (confidence >= 70) return ' ✅ 识别质量良好';
    return ' ⚠️ 识别准确率较低，建议人工检查';
}

/**
 * 清理 OCR 文本中的常见噪音
 * @param {string} text
 * @returns {string}
 */
function cleanOCRText(text) {
    return text
        // 移除多余空行
        .replace(/\n{3,}/g, '\n\n')
        // 移除行首行尾多余空格
        .replace(/[ \t]+$/gm, '')
        .replace(/^[ \t]+/gm, '')
        // 合并被断开的短行
        .replace(/([^\n])\n([^\n]{1,10})$/gm, function (m, a, b) {
            // 短行可能是公式被断开，合并
            return a + ' ' + b;
        })
        .trim();
}

// ==================== OCR UI 状态管理 ====================

/**
 * 显示 OCR 状态指示器
 * @param {string} mode - 'loading' | 'recognizing'
 */
function showOCRStatus(mode) {
    DOM.ocrStatus.style.display = 'block';
    DOM.ocrStatus.classList.remove('ocr-status-error');
    DOM.ocrSpinner.style.display = 'flex';
    DOM.ocrProgressFill.style.width = mode === 'loading' ? '10%' : '50%';

    if (mode === 'loading') {
        DOM.ocrStatusLabel.textContent = '正在加载 OCR 引擎...';
        DOM.ocrStatusProgress.textContent = '准备中';
    }
}

function hideOCRStatus() {
    DOM.ocrStatus.style.display = 'none';
    DOM.ocrStatus.classList.remove('ocr-status-error');
    DOM.ocrProgressFill.style.width = '0%';
}

function showOCRError(message) {
    DOM.ocrStatus.style.display = 'block';
    DOM.ocrStatus.classList.add('ocr-status-error');
    DOM.ocrSpinner.style.display = 'none';
    DOM.ocrStatusLabel.textContent = message;
    DOM.ocrStatusProgress.textContent = '请重试或手动输入题目';
    DOM.ocrProgressFill.style.width = '100%';
    DOM.ocrProgressFill.style.background = 'var(--danger)';

    // 3秒后自动隐藏
    setTimeout(function () {
        if (DOM.ocrStatus.classList.contains('ocr-status-error')) {
            hideOCRStatus();
            DOM.ocrProgressFill.style.background = '';
        }
    }, 5000);
}

function showOCRResult(text, detectedKnowledge, confidence, autoTitle) {
    DOM.ocrResultCard.style.display = 'block';

    // 标题
    DOM.ocrResultTitle.textContent = autoTitle || text.substring(0, 30) + '…';

    // 知识点
    if (detectedKnowledge) {
        DOM.ocrResultKp.textContent = detectedKnowledge;
        DOM.ocrResultKp.style.display = 'inline-flex';
    } else {
        DOM.ocrResultKp.textContent = '未识别';
        DOM.ocrResultKp.style.display = 'inline-flex';
    }

    // 准确率
    var confClass = getConfidenceClass(confidence);
    var confLabel = getConfidenceLabel(confidence);
    DOM.ocrResultConfidence.innerHTML =
        '<span class="' + confClass + '">' + confidence + '%</span>' +
        '<span class="ocr-confidence-warning ' + (confidence >= 70 ? 'warn-good' : 'warn-low') + '">' + confLabel + '</span>';

    // 原文摘要
    var display = text.length > 100 ? text.substring(0, 100) + '…' : text;
    DOM.ocrResultText.textContent = display;
}

function hideOCRResult() {
    DOM.ocrResultCard.style.display = 'none';
    DOM.ocrResultText.textContent = '';
    DOM.ocrResultTitle.textContent = '';
    DOM.ocrResultKp.textContent = '';
    DOM.ocrResultConfidence.innerHTML = '';
}

// ==================== 照片拍摄与上传处理 ====================

/**
 * 处理用户选择的图片文件（拍照或上传）
 * @param {File} file
 */
function handlePhotoFile(file) {
    if (!file || !file.type.match(/^image\//)) {
        showToast('请选择图片文件', 'error');
        return;
    }

    // 检查文件大小（最大 20MB）
    if (file.size > 20 * 1024 * 1024) {
        showToast('图片过大，请选择小于20MB的图片', 'error');
        return;
    }

    // 清理之前的 OCR 源文件预览 URL
    if (ocrSourcePreviewUrl) {
        URL.revokeObjectURL(ocrSourcePreviewUrl);
        ocrSourcePreviewUrl = null;
    }

    // 保存文件引用
    ocrSourceFile = file;

    // 显示预览
    ocrSourcePreviewUrl = URL.createObjectURL(file);
    DOM.ocrPreviewImg.src = ocrSourcePreviewUrl;
    DOM.ocrPreview.style.display = 'block';
    DOM.ocrSection.classList.add('has-photo');

    // 清空之前的 OCR 结果
    hideOCRResult();
    DOM.ocrStatus.classList.remove('ocr-status-error');

    // 自动开始 OCR
    performOCR(file);
}

/**
 * 清除 OCR 源照片
 */
function clearOCRSource() {
    if (ocrSourcePreviewUrl) {
        URL.revokeObjectURL(ocrSourcePreviewUrl);
        ocrSourcePreviewUrl = null;
    }
    ocrSourceFile = null;
    ocrResultTextCache = '';
    DOM.ocrPreview.style.display = 'none';
    DOM.ocrPreviewImg.src = '';
    DOM.ocrSection.classList.remove('has-photo');
    hideOCRStatus();
    hideOCRResult();
    hideCompressionStats();
    DOM.autoDetectBadge.style.display = 'none';
    // 不清除题目内容和知识点字段（用户可能已编辑）
}

// ==================== 弹窗管理 ====================

function openModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

function closeAllModals() {
    closeModal(DOM.detailModal);
    closeModal(DOM.deleteModal);
    closeModal(DOM.imageViewerModal);
    // 复习弹窗不通过 ESC 一键关闭，防止误退出
}

// ESC 关闭弹窗
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        closeAllModals();
    }
});

// 点击遮罩关闭弹窗
DOM.detailModal.addEventListener('click', function (e) {
    if (e.target === DOM.detailModal) closeModal(DOM.detailModal);
});
DOM.deleteModal.addEventListener('click', function (e) {
    if (e.target === DOM.deleteModal) closeModal(DOM.deleteModal);
});
DOM.imageViewerModal.addEventListener('click', function (e) {
    if (e.target === DOM.imageViewerModal) closeModal(DOM.imageViewerModal);
});
// 复习弹窗不允许点击遮罩关闭（防止误操作）
DOM.reviewModal.addEventListener('click', function (e) {
    // 不关闭，用户必须通过按钮退出
});

// 详情弹窗关闭按钮
DOM.closeDetailModal.addEventListener('click', function () { closeModal(DOM.detailModal); });
DOM.closeDetailBtn.addEventListener('click', function () { closeModal(DOM.detailModal); });

// 删除弹窗关闭按钮
DOM.cancelDeleteBtn.addEventListener('click', function () {
    closeModal(DOM.deleteModal);
    pendingDeleteId = null;
});

// 图片查看器关闭按钮
DOM.closeImageViewerModal.addEventListener('click', function () { closeModal(DOM.imageViewerModal); });
DOM.closeImageViewerBtn.addEventListener('click', function () { closeModal(DOM.imageViewerModal); });

// 复习弹窗关闭按钮
DOM.closeReviewModalTop.addEventListener('click', function () { exitReview(); });
DOM.closeReviewBtn.addEventListener('click', function () { exitReview(); });

// ==================== 查看详情 ====================

async function viewDetail(id) {
    var entries = await loadEntries();
    var entry = null;
    for (var i = 0; i < entries.length; i++) {
        if (entries[i].id === id) { entry = entries[i]; break; }
    }
    if (!entry) return;

    var tagClass = SUBJECT_TAG_CLASS[entry.subject] || '';

    var html = '';
    // OCR 来源图片（优先显示）
    var ocrSourceImages = [];
    var otherImages = [];
    if (entry.images && entry.images.length > 0) {
        for (var ii = 0; ii < entry.images.length; ii++) {
            if (entry.images[ii].type === 'ocr_source') {
                ocrSourceImages.push(entry.images[ii]);
            } else {
                otherImages.push(entry.images[ii]);
            }
        }
    }

    // 显示 OCR 来源照片
    if (ocrSourceImages.length > 0) {
        html += '<div class="detail-field">';
        html += '  <div class="detail-label">📷 题目照片</div>';
        html += '  <div class="detail-ocr-source">';
        html += '    <div class="detail-ocr-source-header">';
        html += '      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><rect x="2" y="3" width="20" height="16" rx="2" ry="2"></rect><circle cx="12" cy="10" r="3"></circle></svg>';
        html += '      <span>OCR 拍照来源</span>';
        html += '    </div>';
        html += '    <div class="detail-images" id="detailOcrImages">';
        html += '      <span style="color:var(--text-muted);font-size:0.8125rem;">加载中…</span>';
        html += '    </div>';
        html += '  </div>';
        html += '</div>';
    }

    // OCR 文本（如果有）
    if (entry.ocrText) {
        html += '<div class="detail-field">';
        html += '  <div class="detail-label">🤖 OCR 识别原文</div>';
        html += '  <div class="detail-value" style="font-family:var(--font-mono);font-size:0.8125rem;background:var(--bg);padding:8px 12px;border-radius:6px;white-space:pre-wrap;">' + escapeHtml(entry.ocrText) + '</div>';
        html += '</div>';
    }

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

    html += '<div class="detail-field">';
    html += '  <div class="detail-label">创建时间</div>';
    html += '  <div class="detail-value">' + escapeHtml(formatDate(entry.createdAt)) + '</div>';
    html += '</div>';

    if (entry.updatedAt) {
        html += '<div class="detail-field">';
        html += '  <div class="detail-label">最后编辑</div>';
        html += '  <div class="detail-value">' + escapeHtml(formatDate(entry.updatedAt)) + '</div>';
        html += '</div>';
    }

    // 掌握状态和复习次数
    html += '<div class="detail-field">';
    html += '  <div class="detail-label">掌握状态</div>';
    html += '  <div class="detail-value">' + (entry.mastered ? '✅ 已掌握' : '🔄 未掌握');
    if (entry.reviewCount > 0) {
        html += ' <span style="color:var(--text-muted);font-size:0.8125rem;">（复习 ' + entry.reviewCount + ' 次）</span>';
    }
    html += '  </div>';
    html += '</div>';

    // 附加图片（非 OCR 来源）
    if (otherImages.length > 0) {
        html += '<div class="detail-field">';
        html += '  <div class="detail-label">📎 附加图片（' + otherImages.length + ' 张）</div>';
        html += '  <div class="detail-images" id="detailImages">';
        html += '    <span style="color:var(--text-muted);font-size:0.8125rem;">加载中…</span>';
        html += '  </div>';
        html += '</div>';
    }

    DOM.detailContent.innerHTML = html;
    openModal(DOM.detailModal);

    // 异步加载 OCR 来源图片
    if (ocrSourceImages.length > 0) {
        loadImageUrls(ocrSourceImages).then(function (imageUrls) {
            var container = document.getElementById('detailOcrImages');
            if (!container) return;
            var imgHtml = '';
            for (var jj = 0; jj < imageUrls.length; jj++) {
                if (imageUrls[jj].url) {
                    imgHtml += '<img class="detail-ocr-source-img" src="' + imageUrls[jj].url + '" data-image-id="' + imageUrls[jj].imageId + '" data-file-name="' + escapeHtml(imageUrls[jj].fileName) + '" alt="' + escapeHtml(imageUrls[jj].fileName) + '" title="点击查看原图">';
                }
            }
            container.innerHTML = imgHtml || '<span style="color:var(--text-muted);font-size:0.8125rem;">图片加载失败</span>';

            // 点击放大
            container.addEventListener('click', function (e) {
                var img = e.target.closest('.detail-ocr-source-img');
                if (!img) return;
                DOM.imageViewerImg.src = img.src;
                DOM.imageViewerTitle.textContent = img.getAttribute('data-file-name') || '题目照片';
                openModal(DOM.imageViewerModal);
            });
        });
    }

    // 异步加载附加图片
    if (otherImages.length > 0) {
        loadImageUrls(otherImages).then(function (imageUrls) {
            var container = document.getElementById('detailImages');
            if (!container) return;
            var imgHtml = '';
            for (var j = 0; j < imageUrls.length; j++) {
                if (imageUrls[j].url) {
                    imgHtml += '<img class="detail-image-thumb" src="' + imageUrls[j].url + '" data-image-id="' + imageUrls[j].imageId + '" data-file-name="' + escapeHtml(imageUrls[j].fileName) + '" alt="' + escapeHtml(imageUrls[j].fileName) + '" title="点击查看大图">';
                }
            }
            container.innerHTML = imgHtml || '<span style="color:var(--text-muted);font-size:0.8125rem;">图片加载失败</span>';

            // 点击图片放大
            container.addEventListener('click', function (e) {
                var img = e.target.closest('.detail-image-thumb');
                if (!img) return;
                DOM.imageViewerImg.src = img.src;
                DOM.imageViewerTitle.textContent = img.getAttribute('data-file-name') || '图片预览';
                openModal(DOM.imageViewerModal);
            });
        });
    }
}

// ==================== 删除错题 ====================

async function confirmDelete(id) {
    var entries = await loadEntries();
    var entry = null;
    for (var i = 0; i < entries.length; i++) {
        if (entries[i].id === id) { entry = entries[i]; break; }
    }
    if (!entry) return;

    pendingDeleteId = id;
    DOM.deletePreview.textContent = '「' + truncateText(entry.title, 60) + '」';
    openModal(DOM.deleteModal);
}

async function executeDelete() {
    if (!pendingDeleteId) return;

    var entries = await loadEntries();
    var entry = null;
    var newEntries = [];
    for (var i = 0; i < entries.length; i++) {
        if (entries[i].id !== pendingDeleteId) {
            newEntries.push(entries[i]);
        } else {
            entry = entries[i];
        }
    }

    // 删除关联图片
    if (entry && entry.images && entry.images.length > 0) {
        await deleteAllImages(entry.images);
    }

    await saveEntries(newEntries);
    closeModal(DOM.deleteModal);
    pendingDeleteId = null;
    await refreshAll();
    showToast('错题已删除', 'success');
}

// 确认删除按钮
DOM.confirmDeleteBtn.addEventListener('click', function () { executeDelete(); });

// ==================== 收藏切换 ====================

async function toggleFavorite(id) {
    var entries = await loadEntries();
    var entry = null;
    for (var i = 0; i < entries.length; i++) {
        if (entries[i].id === id) { entries[i].isFavorite = !entries[i].isFavorite; entry = entries[i]; break; }
    }
    if (!entry) return;
    await saveEntries(entries);
    await renderList();
    showToast(entry.isFavorite ? '已收藏' : '已取消收藏', 'success');
}

// ==================== 掌握状态切换 ====================

async function toggleMastered(id) {
    var entries = await loadEntries();
    var entry = null;
    for (var i = 0; i < entries.length; i++) {
        if (entries[i].id === id) {
            entries[i].mastered = !entries[i].mastered;
            if (entries[i].mastered) {
                entries[i].lastReviewed = new Date().toISOString();
                entries[i].reviewCount = (entries[i].reviewCount || 0) + 1;
            }
            entry = entries[i];
            break;
        }
    }
    if (!entry) return;
    await saveEntries(entries);
    await renderList();
    showToast(entry.mastered ? '已标记为已掌握' : '已标记为未掌握', 'success');
}

// ==================== 批量操作 ====================

function enterBatchMode() {
    batchMode = true;
    selectedIds = {};
    DOM.batchModeBtn.style.display = 'none';
    DOM.batchDeleteBtn.style.display = 'inline-flex';
    DOM.batchDeleteBtn.textContent = '删除选中';
    renderList();
}

function exitBatchMode() {
    batchMode = false;
    selectedIds = {};
    DOM.batchModeBtn.style.display = 'inline-flex';
    DOM.batchDeleteBtn.style.display = 'none';
    renderList();
}

function toggleSelectEntry(id) {
    if (selectedIds[id]) {
        delete selectedIds[id];
    } else {
        selectedIds[id] = true;
    }
    var count = Object.keys(selectedIds).length;
    DOM.batchDeleteBtn.textContent = count > 0 ? '删除选中（' + count + '）' : '删除选中';
    // 更新当前卡片的选中样式
    var card = document.querySelector('.error-card[data-entry-id="' + id + '"]');
    if (card) {
        if (selectedIds[id]) {
            card.classList.add('selected');
            var cb = card.querySelector('.error-card-checkbox input');
            if (cb) cb.checked = true;
        } else {
            card.classList.remove('selected');
            var cb2 = card.querySelector('.error-card-checkbox input');
            if (cb2) cb2.checked = false;
        }
    }
}

function selectAllEntries() {
    getFilteredEntries().then(function (entries) {
        for (var i = 0; i < entries.length; i++) {
            selectedIds[entries[i].id] = true;
        }
        DOM.batchDeleteBtn.textContent = '删除选中（' + entries.length + '）';
        renderList();
    });
}

function deselectAllEntries() {
    selectedIds = {};
    DOM.batchDeleteBtn.textContent = '删除选中';
    renderList();
}

async function executeBatchDelete() {
    var ids = Object.keys(selectedIds);
    if (ids.length === 0) {
        showToast('请先选择要删除的错题', 'error');
        return;
    }
    if (!confirm('确定要删除选中的 ' + ids.length + ' 条错题记录吗？\n\n此操作不可撤销！')) return;

    var entries = await loadEntries();
    var toDeleteImages = [];
    var newEntries = [];
    var idsMap = {};
    for (var i = 0; i < ids.length; i++) { idsMap[ids[i]] = true; }

    for (var j = 0; j < entries.length; j++) {
        if (idsMap[entries[j].id]) {
            if (entries[j].images && entries[j].images.length > 0) {
                toDeleteImages = toDeleteImages.concat(entries[j].images);
            }
        } else {
            newEntries.push(entries[j]);
        }
    }

    await saveEntries(newEntries);
    if (toDeleteImages.length > 0) {
        await deleteAllImages(toDeleteImages);
    }

    exitBatchMode();
    await refreshAll();
    showToast('已删除 ' + ids.length + ' 条错题', 'success');
}

// ==================== 导入 / 导出 / 清空 ====================

async function exportToJSON() {
    var entries = await loadEntries();
    if (entries.length === 0) {
        showToast('没有可导出的数据', 'error');
        return;
    }

    // 导出前，将图片 blob 转为 base64 嵌入 JSON
    try {
        var exportEntries = [];
        for (var i = 0; i < entries.length; i++) {
            var entry = JSON.parse(JSON.stringify(entries[i])); // 深拷贝
            if (entry.images && entry.images.length > 0) {
                var imgDataArray = [];
                for (var j = 0; j < entry.images.length; j++) {
                    var meta = entry.images[j];
                    var blobData = await getImageBlobBase64(meta.imageId);
                    imgDataArray.push({
                        imageId: meta.imageId,
                        fileName: meta.fileName,
                        mimeType: meta.mimeType,
                        size: meta.size,
                        type: meta.type || 'manual',
                        data: blobData
                    });
                }
                entry.images = imgDataArray;
            }
            exportEntries.push(entry);
        }

        var jsonStr = JSON.stringify(exportEntries, null, 2);
        var blob = new Blob([jsonStr], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        var today = new Date();
        var dateStr = today.getFullYear() + '-' +
            ('0' + (today.getMonth() + 1)).slice(-2) + '-' +
            ('0' + today.getDate()).slice(-2);
        a.download = '数学错题本_备份_' + dateStr + '.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('已导出 ' + entries.length + ' 条错题记录', 'success');
    } catch (e) {
        console.error('导出失败:', e);
        showToast('导出失败', 'error');
    }
}

/**
 * 将 IndexedDB 中的图片 blob 转为 base64
 */
function getImageBlobBase64(imageId) {
    return openDB().then(function (database) {
        return new Promise(function (resolve) {
            var tx = database.transaction('images', 'readonly');
            var store = tx.objectStore('images');
            var request = store.get(imageId);
            request.onsuccess = function () {
                if (request.result && request.result.blob) {
                    var reader = new FileReader();
                    reader.onload = function (e) { resolve(e.target.result); };
                    reader.onerror = function () { resolve(null); };
                    reader.readAsDataURL(request.result.blob);
                } else {
                    resolve(null);
                }
            };
            request.onerror = function () { resolve(null); };
        });
    });
}

/**
 * 从 JSON 文件导入错题数据
 */
function importFromJSON(file) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = async function (e) {
        try {
            var data = JSON.parse(e.target.result);
            if (!Array.isArray(data)) {
                showToast('导入失败：JSON 格式不正确（应为数组）', 'error');
                return;
            }

            var validNew = [];
            var skippedInvalid = 0;
            var imagesToImport = []; // { imageId, entryId, fileName, mimeType, base64data }

            for (var i = 0; i < data.length; i++) {
                var item = data[i];
                if (item
                    && typeof item.id === 'string'
                    && typeof item.title === 'string'
                    && typeof item.subject === 'string'
                    && typeof item.knowledgePoint === 'string'
                    && typeof item.errorReason === 'string'
                    && typeof item.difficulty === 'number'
                    && item.difficulty >= 1
                    && item.difficulty <= 5) {
                    // 兼容旧数据
                    if (typeof item.isFavorite !== 'boolean') item.isFavorite = false;
                    if (typeof item.createdAt !== 'string') item.createdAt = new Date().toISOString();
                    if (typeof item.mastered !== 'boolean') item.mastered = false;
                    if (typeof item.reviewCount !== 'number') item.reviewCount = 0;
                    // V1.6 新增字段兼容
                    if (item.ocrText === undefined) item.ocrText = null;
                    if (typeof item.dataVersion !== 'number') item.dataVersion = 1;

                    // 处理图片
                    var cleanImages = [];
                    if (Array.isArray(item.images) && item.images.length > 0) {
                        for (var j = 0; j < item.images.length; j++) {
                            var img = item.images[j];
                            var imgType = img.type || 'manual';
                            if (img.data && typeof img.data === 'string') {
                                // 有 base64 数据，记录下来稍后写入 IndexedDB
                                imagesToImport.push({
                                    imageId: img.imageId || ('img_import_' + Date.now().toString(36) + '_' + j + '_' + i),
                                    entryId: item.id,
                                    fileName: img.fileName || 'imported_image.jpg',
                                    mimeType: img.mimeType || 'image/jpeg',
                                    base64data: img.data,
                                    type: imgType
                                });
                                cleanImages.push({
                                    imageId: img.imageId || ('img_import_' + Date.now().toString(36) + '_' + j + '_' + i),
                                    fileName: img.fileName || 'imported_image.jpg',
                                    mimeType: img.mimeType || 'image/jpeg',
                                    size: img.size || 0,
                                    type: imgType
                                });
                            } else if (img.imageId) {
                                // 只有元数据，没有 blob（来自旧导出）
                                if (!img.type) img.type = 'manual';
                                cleanImages.push(img);
                            }
                        }
                    }
                    item.images = cleanImages;
                    validNew.push(item);
                } else {
                    skippedInvalid++;
                }
            }

            if (validNew.length === 0) {
                showToast('导入失败：文件中没有有效的错题数据', 'error');
                return;
            }

            // 合并：以 id 去重
            var existing = await loadEntries();
            var existingIds = {};
            for (var k = 0; k < existing.length; k++) {
                existingIds[existing[k].id] = true;
            }

            var merged = 0;
            for (var m = 0; m < validNew.length; m++) {
                if (!existingIds[validNew[m].id]) {
                    existing.push(validNew[m]);
                    existingIds[validNew[m].id] = true;
                    merged++;
                }
            }

            // 导入图片 blob
            var importedImages = 0;
            for (var n = 0; n < imagesToImport.length; n++) {
                var imgImport = imagesToImport[n];
                // 检查这张图片属于的条目是否被合并了
                if (!existingIds[imgImport.entryId]) continue;
                // 只有新导入的条目才写图片
                var alreadyHadImage = false;
                for (var p = 0; p < validNew.length; p++) {
                    if (validNew[p].id === imgImport.entryId) {
                        // 是新条目
                        break;
                    }
                }
                try {
                    var blob = dataURIToBlob(imgImport.base64data);
                    await saveImageBlob(imgImport.imageId, imgImport.entryId, blob, imgImport.fileName, imgImport.mimeType, imgImport.type || 'manual');
                    importedImages++;
                } catch (imgErr) {
                    console.error('图片导入失败:', imgErr);
                }
            }

            await saveEntries(existing);
            await refreshAll();

            var msg = '成功导入 ' + merged + ' 条新错题';
            if (skippedInvalid > 0) msg += '，跳过 ' + skippedInvalid + ' 条无效数据';
            var duplicated = validNew.length - merged;
            if (duplicated > 0) msg += '，' + duplicated + ' 条已存在被跳过';
            if (importedImages > 0) msg += '，导入 ' + importedImages + ' 张图片';
            showToast(msg, 'success');
        } catch (err) {
            console.error('导入失败:', err);
            showToast('导入失败：文件解析错误', 'error');
        }
    };
    reader.onerror = function () {
        showToast('导入失败：无法读取文件', 'error');
    };
    reader.readAsText(file);
    DOM.importFileInput.value = '';
}

/**
 * data URI 转 Blob
 */
function dataURIToBlob(dataURI) {
    var parts = dataURI.split(',');
    var mime = parts[0].match(/:(.*?);/)[1];
    var binary = atob(parts[1]);
    var array = [];
    for (var i = 0; i < binary.length; i++) {
        array.push(binary.charCodeAt(i));
    }
    return new Blob([new Uint8Array(array)], { type: mime });
}

/**
 * 直接保存 blob 到 IndexedDB（导入时使用）
 */
function saveImageBlob(imageId, entryId, blob, fileName, mimeType, imgType) {
    if (imgType === void 0) imgType = 'manual';
    return openDB().then(function (database) {
        return new Promise(function (resolve, reject) {
            var record = {
                imageId: imageId,
                entryId: entryId,
                blob: blob,
                fileName: fileName,
                mimeType: mimeType,
                size: blob.size,
                type: imgType
            };
            var tx = database.transaction('images', 'readwrite');
            var store = tx.objectStore('images');
            store.put(record);
            tx.oncomplete = function () { resolve(); };
            tx.onerror = function () { reject(tx.error); };
        });
    });
}

async function clearAllData() {
    var entries = await loadEntries();
    if (entries.length === 0) {
        showToast('没有可清空的数据', 'error');
        return;
    }
    if (!confirm('确定要清空全部 ' + entries.length + ' 条错题记录吗？\n\n此操作不可撤销！建议先导出备份。')) {
        return;
    }

    // 删除所有图片
    for (var i = 0; i < entries.length; i++) {
        if (entries[i].images && entries[i].images.length > 0) {
            await deleteAllImages(entries[i].images);
        }
    }

    await saveEntries([]);
    await refreshAll();
    showToast('所有错题已清空', 'success');
}

// ==================== 获取筛选后的错题 ====================

async function getFilteredEntries() {
    var entries = await loadEntries();
    var keyword = DOM.searchInput.value.trim().toLowerCase();
    var filterSubject = DOM.filterSubject.value;
    var filterDifficulty = DOM.filterDifficulty.value;
    var sortByVal = DOM.sortBy.value;

    // 1. 状态筛选（全部 / 已掌握 / 未掌握 / 收藏）
    switch (activeStatusFilter) {
        case 'mastered':
            entries = entries.filter(function (entry) { return entry.mastered === true; });
            break;
        case 'unmastered':
            entries = entries.filter(function (entry) { return !entry.mastered; });
            break;
        case 'favorites':
            entries = entries.filter(function (entry) { return entry.isFavorite === true; });
            break;
        default: // 'all' — 不做筛选
            break;
    }

    // 2. 科目筛选
    if (filterSubject) {
        entries = entries.filter(function (entry) { return entry.subject === filterSubject; });
    }

    // 3. 难度筛选
    if (filterDifficulty) {
        var diffLevel = parseInt(filterDifficulty, 10);
        entries = entries.filter(function (entry) { return entry.difficulty === diffLevel; });
    }

    // 4. 关键词搜索（题目 + 知识点 + 错误原因）
    if (keyword) {
        entries = entries.filter(function (entry) {
            return entry.title.toLowerCase().indexOf(keyword) !== -1 ||
                   entry.knowledgePoint.toLowerCase().indexOf(keyword) !== -1 ||
                   entry.errorReason.toLowerCase().indexOf(keyword) !== -1;
        });
    }

    // 5. 排序
    entries = sortEntries(entries, sortByVal);

    return entries;
}

function sortEntries(entries, sortByVal) {
    var sorted = entries.slice();
    switch (sortByVal) {
        case 'oldest':
            sorted.sort(function (a, b) { return new Date(a.createdAt) - new Date(b.createdAt); });
            break;
        case 'difficulty-desc':
            sorted.sort(function (a, b) { return b.difficulty - a.difficulty; });
            break;
        case 'difficulty-asc':
            sorted.sort(function (a, b) { return a.difficulty - b.difficulty; });
            break;
        case 'newest':
        default:
            sorted.sort(function (a, b) { return new Date(b.createdAt) - new Date(a.createdAt); });
            break;
    }
    return sorted;
}

// ==================== 渲染列表 ====================

async function renderList() {
    var entries = await getFilteredEntries();
    var keyword = DOM.searchInput.value.trim();

    // 空状态
    if (entries.length === 0) {
        DOM.errorList.style.display = 'none';
        DOM.emptyState.style.display = 'block';
        DOM.searchHint.style.display = 'none';

        var hasFilter = keyword || DOM.filterSubject.value || DOM.filterDifficulty.value ||
                        activeStatusFilter !== 'all';
        if (hasFilter) {
            DOM.emptyState.querySelector('.empty-text').textContent = '未找到匹配的错题';
            DOM.emptyState.querySelector('.empty-hint').textContent = '尝试更换筛选条件或搜索关键词';
        } else {
            DOM.emptyState.querySelector('.empty-text').textContent = '还没有错题记录';
            DOM.emptyState.querySelector('.empty-hint').textContent = '在左侧表单添加你的第一道错题吧！';
        }
        return;
    }

    // 批量模式信息条
    var batchInfoHtml = '';
    if (batchMode) {
        var selCount = Object.keys(selectedIds).length;
        batchInfoHtml = '<div class="batch-mode-info">' +
            '<span>已选择 ' + selCount + ' / ' + entries.length + ' 条</span>' +
            '<div>' +
            '<button class="select-all-btn" id="selectAllBtn">全选</button> ' +
            '<button class="select-all-btn" id="deselectAllBtn">取消全选</button> ' +
            '<button class="select-all-btn" id="exitBatchBtn" style="color:var(--danger);">退出批量模式</button>' +
            '</div>' +
            '</div>';
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
    var html = batchInfoHtml;
    for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        var tagClass = SUBJECT_TAG_CLASS[entry.subject] || '';
        var titleDisplay = truncateText(entry.title, 80);
        var favClass = entry.isFavorite ? ' favorited' : '';
        var favIcon = entry.isFavorite ? '❤️' : '🤍';
        var timeDisplay = formatDate(entry.createdAt);
        var masteredClass = entry.mastered ? ' mastered' : '';
        var masteredText = entry.mastered ? '✅ 已掌握' : '🔄 未掌握';
        var hasImages = entry.images && entry.images.length > 0;
        var isSelected = batchMode && selectedIds[entry.id];

        html += '<div class="error-card' + (isSelected ? ' selected' : '') + '" data-entry-id="' + entry.id + '">';

        // 批量选择复选框
        if (batchMode) {
            html += '  <div class="error-card-checkbox">';
            html += '    <input type="checkbox" ' + (isSelected ? 'checked' : '') + ' data-id="' + entry.id + '">';
            html += '  </div>';
        }

        // 收藏按钮
        html += '  <div class="error-card-fav">';
        html += '    <button class="fav-btn' + favClass + '" data-id="' + entry.id + '" title="' + (entry.isFavorite ? '取消收藏' : '收藏') + '">' + favIcon + '</button>';
        html += '  </div>';

        html += '  <div class="error-card-main">';
        html += '    <div class="error-card-title">' + escapeHtml(titleDisplay);
        if (hasImages) {
            html += ' <span class="error-card-images-badge">📷' + entry.images.length + '</span>';
        }
        html += '    </div>';
        html += '    <div class="error-card-meta">';
        html += '      <span class="error-card-tag ' + tagClass + '">' + escapeHtml(entry.subject) + '</span>';
        html += '      <span class="error-card-knowledge">' + escapeHtml(entry.knowledgePoint) + '</span>';
        html += '      <span class="error-card-stars">' + renderStars(entry.difficulty) + '</span>';
        html += '    </div>';
        html += '    <div class="error-card-time">' + timeDisplay + '</div>';
        html += '  </div>';

        html += '  <div class="error-card-actions">';
        html += '    <button class="btn btn-xs btn-secondary view-detail-btn" data-id="' + entry.id + '">查看</button>';
        html += '    <button class="btn btn-xs btn-secondary edit-btn" data-id="' + entry.id + '">编辑</button>';
        html += '    <button class="btn btn-xs mastered-btn' + masteredClass + '" data-id="' + entry.id + '">' + masteredText + '</button>';
        html += '    <button class="btn btn-xs btn-danger delete-btn" data-id="' + entry.id + '">删除</button>';
        html += '  </div>';
        html += '</div>';
    }

    DOM.errorList.innerHTML = html;

    // 批量模式事件绑定
    if (batchMode) {
        var selectAllBtn = document.getElementById('selectAllBtn');
        var deselectAllBtn = document.getElementById('deselectAllBtn');
        var exitBatchBtn = document.getElementById('exitBatchBtn');
        if (selectAllBtn) selectAllBtn.addEventListener('click', selectAllEntries);
        if (deselectAllBtn) deselectAllBtn.addEventListener('click', deselectAllEntries);
        if (exitBatchBtn) exitBatchBtn.addEventListener('click', exitBatchMode);

        // 复选框事件
        var checkboxes = DOM.errorList.querySelectorAll('.error-card-checkbox input[type="checkbox"]');
        for (var c = 0; c < checkboxes.length; c++) {
            checkboxes[c].addEventListener('change', function () {
                var id = this.getAttribute('data-id');
                if (id) toggleSelectEntry(id);
            });
        }
    }
}

// ==================== 更新统计 ====================

function animateNumber(element, target) {
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

// ==================== 刷新全部（修复：合并为一次数据读取） ====================

async function refreshAll() {
    var entries = await loadEntries();

    // 渲染列表（使用已加载的数据，避免二次读取）—— 但由于 getFilteredEntries 会再次读取，
    // 这里先渲染列表再更新统计，减少统计时的额外读取
    await renderList();
    // updateStats 仍需读取，但因为列表已渲染完成且使用缓存，影响不大
    // 为了彻底合并，按当前架构保持兼容
    await updateStatsFromEntries(entries);
}

/**
 * 用已有数据更新统计（避免重复读取 IndexedDB）
 */
async function updateStatsFromEntries(entries) {
    if (!entries) {
        entries = await loadEntries();
    }
    var total = entries.length;
    var mastered = 0, unmastered = 0, favorites = 0;

    for (var i = 0; i < entries.length; i++) {
        if (entries[i].mastered) {
            mastered++;
        } else {
            unmastered++;
        }
        if (entries[i].isFavorite) {
            favorites++;
        }
    }

    animateNumber(DOM.statTotal, total);
    animateNumber(DOM.statMastered, mastered);
    animateNumber(DOM.statUnmastered, unmastered);
    animateNumber(DOM.statFavorites, favorites);
}

// 保持 updateStats 独立可用（ErrorBook API 调用）
async function updateStats() {
    return updateStatsFromEntries(null);
}

// ==================== 表单处理 ====================

// 星星评分
var starButtons = DOM.starRating.querySelectorAll('.star-btn');
var currentRating = 0;

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

for (var i = 0; i < starButtons.length; i++) {
    starButtons[i].addEventListener('click', function () {
        var star = parseInt(this.getAttribute('data-star'), 10);
        if (star === currentRating && starButtons[star - 1].classList.contains('active')) {
            setStarHighlight(0);
        } else {
            setStarHighlight(star);
        }
    });
}

// 图片上传：点击按钮触发文件选择
DOM.addImageBtn.addEventListener('click', function () {
    DOM.imageFileInput.click();
});

// 图片文件选择后生成预览
DOM.imageFileInput.addEventListener('change', function () {
    if (!DOM.imageFileInput.files || DOM.imageFileInput.files.length === 0) return;
    for (var i = 0; i < DOM.imageFileInput.files.length; i++) {
        var file = DOM.imageFileInput.files[i];
        if (!file.type.match(/^image\//)) continue;
        pendingImages.push(file);
        addImagePreview(file, pendingImages.length - 1);
    }
    DOM.imageFileInput.value = '';
});

// ==================== 拍照录题事件处理 ====================

// 拍照按钮 → 打开相机
DOM.cameraBtn.addEventListener('click', function () {
    if (ocrIsProcessing) {
        showToast('正在识别中，请稍候', 'error');
        return;
    }
    DOM.cameraInput.click();
});

// 相册/上传按钮 → 打开文件选择
DOM.uploadBtn.addEventListener('click', function () {
    if (ocrIsProcessing) {
        showToast('正在识别中，请稍候', 'error');
        return;
    }
    DOM.galleryInput.click();
});

// 相机拍照后处理
DOM.cameraInput.addEventListener('change', function () {
    if (DOM.cameraInput.files && DOM.cameraInput.files[0]) {
        handlePhotoFile(DOM.cameraInput.files[0]);
    }
    DOM.cameraInput.value = '';
});

// 相册/上传后处理
DOM.galleryInput.addEventListener('change', function () {
    if (DOM.galleryInput.files && DOM.galleryInput.files[0]) {
        handlePhotoFile(DOM.galleryInput.files[0]);
    }
    DOM.galleryInput.value = '';
});

// 移除 OCR 照片按钮
DOM.ocrPreviewRemove.addEventListener('click', function () {
    clearOCRSource();
});

// ==================== 编辑模式：标题自动同步 ====================
// 用户修改题目内容后，自动重新检测知识点并更新标题前缀
var autoTitleTimer = null;
var lastAutoTitle = '';
DOM.titleInput.addEventListener('input', function () {
    if (autoTitleTimer) clearTimeout(autoTitleTimer);
    var currentValue = DOM.titleInput.value;
    // 跳过空内容
    if (!currentValue.trim()) {
        lastAutoTitle = '';
        return;
    }
    autoTitleTimer = setTimeout(function () {
        var newTitle = generateAutoTitle(currentValue);
        // 只有和当前值不同且和上次自动生成的值不同时才更新
        if (newTitle && newTitle !== currentValue && newTitle !== lastAutoTitle) {
            lastAutoTitle = newTitle;
            DOM.titleInput.value = newTitle;
            // 添加闪烁动画提示用户
            DOM.titleInput.classList.add('title-auto-updated');
            setTimeout(function () {
                DOM.titleInput.classList.remove('title-auto-updated');
            }, 600);
            // 同步更新知识点
            var newKp = detectKnowledgePoint(currentValue.replace(/^【[^】]*】\s*/, '').trim());
            if (newKp) {
                DOM.knowledgePointInput.value = newKp;
                DOM.autoDetectBadge.style.display = 'inline';
            }
        }
    }, 1200); // 1.2 秒防抖，避免打字过程中频繁更新
});

// 失焦时立即尝试生成
DOM.titleInput.addEventListener('blur', function () {
    if (autoTitleTimer) {
        clearTimeout(autoTitleTimer);
        autoTitleTimer = null;
    }
    var currentValue = DOM.titleInput.value;
    if (!currentValue.trim()) return;
    var newTitle = generateAutoTitle(currentValue);
    if (newTitle && newTitle !== currentValue && newTitle !== lastAutoTitle) {
        lastAutoTitle = newTitle;
        DOM.titleInput.value = newTitle;
    }
});

/**
 * 添加图片预览缩略图
 */
function addImagePreview(file, index) {
    var reader = new FileReader();
    reader.onload = function (e) {
        var item = document.createElement('div');
        item.className = 'image-preview-item';
        item.setAttribute('data-pending-index', index);
        item.innerHTML = '<img src="' + e.target.result + '" alt="' + escapeHtml(file.name) + '">' +
            '<button class="image-delete-btn" data-pending-index="' + index + '">×</button>';
        DOM.imagePreviewList.appendChild(item);
    };
    reader.readAsDataURL(file);
}

/**
 * 添加已有图片的预览（编辑模式）
 */
function addExistingImagePreview(imageId, fileName, url) {
    var item = document.createElement('div');
    item.className = 'image-preview-item';
    item.setAttribute('data-existing-id', imageId);
    item.innerHTML = '<img src="' + url + '" alt="' + escapeHtml(fileName) + '">' +
        '<button class="image-delete-btn" data-existing-id="' + imageId + '">×</button>';
    DOM.imagePreviewList.appendChild(item);
}

// 图片预览删除事件委托
DOM.imagePreviewList.addEventListener('click', function (e) {
    var btn = e.target.closest('.image-delete-btn');
    if (!btn) return;

    var pendingIndex = btn.getAttribute('data-pending-index');
    var existingId = btn.getAttribute('data-existing-id');

    if (pendingIndex !== null) {
        // 删除待上传的图片
        var idx = parseInt(pendingIndex, 10);
        pendingImages[idx] = null; // 标记删除
        btn.parentElement.remove();
    } else if (existingId) {
        // 删除已有图片
        removedImageIds.push(existingId);
        btn.parentElement.remove();
    }
});

/**
 * 清除所有图片预览
 */
function clearImagePreviews() {
    pendingImages = [];
    removedImageIds = [];
    DOM.imagePreviewList.innerHTML = '';
}

// 表单提交
DOM.errorForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    var title = DOM.titleInput.value.trim();
    var subject = DOM.subjectSelect.value;
    var knowledgePoint = DOM.knowledgePointInput.value.trim();
    var errorReason = DOM.errorReasonInput.value.trim();
    var difficulty = parseInt(DOM.difficultyInput.value, 10);
    var editingId = DOM.editingId.value;

    // 验证
    if (!title) { showToast('请输入题目内容', 'error'); DOM.titleInput.focus(); return; }
    if (!subject) { showToast('请选择科目', 'error'); DOM.subjectSelect.focus(); return; }
    if (!knowledgePoint) { showToast('请输入知识点', 'error'); DOM.knowledgePointInput.focus(); return; }
    if (!errorReason) { showToast('请输入错误原因', 'error'); DOM.errorReasonInput.focus(); return; }
    if (difficulty < 1 || difficulty > 5) { showToast('请选择难度（1-5星）', 'error'); return; }

    var entries = await loadEntries();

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
                entries[i].updatedAt = new Date().toISOString();
                if (ocrResultTextCache && ocrResultTextCache !== entries[i].ocrText) {
                    entries[i].ocrText = ocrResultTextCache;
                }
                entries[i].dataVersion = DATA_VERSION;

                // 删除被移除的已有图片
                if (removedImageIds.length > 0) {
                    var keptImages = [];
                    for (var k = 0; k < entries[i].images.length; k++) {
                        if (removedImageIds.indexOf(entries[i].images[k].imageId) === -1) {
                            keptImages.push(entries[i].images[k]);
                        }
                    }
                    await deleteAllImages(
                        entries[i].images.filter(function (img) {
                            return removedImageIds.indexOf(img.imageId) !== -1;
                        })
                    );
                    entries[i].images = keptImages;
                }

                // 添加 OCR 源照片（编辑时如重新拍照）
                if (ocrSourceFile) {
                    try {
                        var ocrImgMetaEdit = await saveImage(editingId, ocrSourceFile);
                        ocrImgMetaEdit.type = 'ocr_source';
                        entries[i].images.push(ocrImgMetaEdit);
                    } catch (imgErr) {
                        console.error('OCR源照片保存失败:', imgErr);
                    }
                }

                // 添加新上传的附加图片
                if (pendingImages.length > 0) {
                    for (var j = 0; j < pendingImages.length; j++) {
                        if (pendingImages[j] !== null) {
                            try {
                                var meta = await saveImage(editingId, pendingImages[j]);
                                meta.type = 'manual';
                                entries[i].images.push(meta);
                            } catch (imgErr) {
                                console.error('图片保存失败:', imgErr);
                            }
                        }
                    }
                }

                found = true;
                break;
            }
        }
        if (!found) {
            showToast('编辑的错题不存在', 'error');
            resetForm();
            await refreshAll();
            return;
        }
        await saveEntries(entries);
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
            isFavorite: false,
            mastered: false,
            reviewCount: 0,
            images: [],
            ocrText: ocrResultTextCache || null,
            dataVersion: DATA_VERSION,
            createdAt: new Date().toISOString()
        };

        // 保存 OCR 源照片（如果有）
        if (ocrSourceFile) {
            try {
                var ocrImgMeta = await saveImage(newEntry.id, ocrSourceFile);
                ocrImgMeta.type = 'ocr_source'; // 标记为 OCR 源图片
                newEntry.images.push(ocrImgMeta);
            } catch (imgErr) {
                console.error('OCR源照片保存失败:', imgErr);
            }
        }

        // 保存手动添加的附加图片
        if (pendingImages.length > 0) {
            for (var jj = 0; jj < pendingImages.length; jj++) {
                if (pendingImages[jj] !== null) {
                    try {
                        var imgMeta = await saveImage(newEntry.id, pendingImages[jj]);
                        imgMeta.type = 'manual';
                        newEntry.images.push(imgMeta);
                    } catch (imgErr) {
                        console.error('图片保存失败:', imgErr);
                    }
                }
            }
        }

        entries.push(newEntry);
        await saveEntries(entries);
        showToast('错题已保存', 'success');
    }

    resetForm();
    await refreshAll();

    if (window.innerWidth <= 1100) {
        document.getElementById('errorList').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
});

// 取消编辑
DOM.cancelEditBtn.addEventListener('click', function () { resetForm(); });

function resetForm() {
    DOM.errorForm.reset();
    DOM.editingId.value = '';
    DOM.difficultyInput.value = '0';
    setStarHighlight(0);
    clearImagePreviews();
    clearOCRSource();
    lastAutoTitle = '';
    DOM.autoDetectBadge.style.display = 'none';
    DOM.submitBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>保存错题';
    DOM.cancelEditBtn.style.display = 'none';
    DOM.titleInput.focus();
}

async function editEntry(id) {
    var entries = await loadEntries();
    var entry = null;
    for (var i = 0; i < entries.length; i++) {
        if (entries[i].id === id) { entry = entries[i]; break; }
    }
    if (!entry) return;

    // 填充表单
    DOM.titleInput.value = entry.title;
    lastAutoTitle = entry.title || ''; // 记录以支持编辑同步
    DOM.subjectSelect.value = entry.subject;
    DOM.knowledgePointInput.value = entry.knowledgePoint;
    DOM.errorReasonInput.value = entry.errorReason;
    DOM.editingId.value = entry.id;
    setStarHighlight(entry.difficulty);

    // 清除当前预览
    clearImagePreviews();
    clearOCRSource();

    // 分离 OCR 源图片和附加图片
    var ocrImgs = [];
    var manualImgs = [];
    if (entry.images && entry.images.length > 0) {
        for (var ii = 0; ii < entry.images.length; ii++) {
            if (entry.images[ii].type === 'ocr_source') {
                ocrImgs.push(entry.images[ii]);
            } else {
                manualImgs.push(entry.images[ii]);
            }
        }
    }

    // 显示 OCR 源图片预览
    if (ocrImgs.length > 0) {
        loadImageUrls(ocrImgs).then(function (imageUrls) {
            if (imageUrls.length > 0 && imageUrls[0].url) {
                DOM.ocrPreviewImg.src = imageUrls[0].url;
                DOM.ocrPreview.style.display = 'block';
                DOM.ocrSection.classList.add('has-photo');
                // 缓存 OCR 源文件信息以支持重新保存
                ocrResultTextCache = entry.ocrText || '';
            }
        });
    }

    // 显示 ocrText 标记
    if (entry.ocrText) {
        ocrResultTextCache = entry.ocrText;
        DOM.autoDetectBadge.style.display = 'inline';
    }

    // 加载附加图片预览
    if (manualImgs.length > 0) {
        loadImageUrls(manualImgs).then(function (imageUrls) {
            for (var j = 0; j < imageUrls.length; j++) {
                if (imageUrls[j].url) {
                    addExistingImagePreview(imageUrls[j].imageId, imageUrls[j].fileName, imageUrls[j].url);
                }
            }
        });
    }

    // 切换按钮
    DOM.submitBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="btn-icon"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>更新错题';
    DOM.cancelEditBtn.style.display = 'inline-flex';

    DOM.errorForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    DOM.titleInput.focus();
}

function generateId() {
    return 'err_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
}

// ==================== 搜索 ====================

var searchTimer = null;
DOM.searchInput.addEventListener('input', function () {
    var keyword = DOM.searchInput.value.trim();
    DOM.clearSearchBtn.style.display = keyword ? 'inline-flex' : 'none';
    if (searchTimer) clearTimeout(searchTimer);
    searchTimer = setTimeout(function () { renderList(); }, 250);
});

DOM.clearSearchBtn.addEventListener('click', function () {
    DOM.searchInput.value = '';
    DOM.clearSearchBtn.style.display = 'none';
    renderList();
    DOM.searchInput.focus();
});

// ==================== 筛选与排序事件 ====================

DOM.filterSubject.addEventListener('change', function () { renderList(); });
DOM.filterDifficulty.addEventListener('change', function () { renderList(); });
DOM.sortBy.addEventListener('change', function () { renderList(); });

// ==================== 状态筛选按钮事件 ====================

DOM.statusFilterGroup.addEventListener('click', function (e) {
    var btn = e.target.closest('.status-filter-btn');
    if (!btn) return;
    var status = btn.getAttribute('data-status');
    if (!status || status === activeStatusFilter) return;

    // 切换 active 样式
    var allBtns = DOM.statusFilterGroup.querySelectorAll('.status-filter-btn');
    for (var i = 0; i < allBtns.length; i++) {
        allBtns[i].classList.remove('active');
    }
    btn.classList.add('active');

    // 更新筛选状态并刷新列表
    activeStatusFilter = status;
    renderList();
});

// ==================== 随机复习系统 ====================

/**
 * 开始复习：从未掌握错题中随机抽取最多 5 道
 */
async function startReview() {
    var entries = await loadEntries();
    // 筛选未掌握的错题
    var unmastered = entries.filter(function (e) { return !e.mastered; });

    if (unmastered.length === 0) {
        showToast('所有错题都已掌握！无需复习 🎉', 'success');
        return;
    }

    // Fisher-Yates 洗牌算法
    var shuffled = unmastered.slice();
    for (var i = shuffled.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = temp;
    }

    // 取前 5 道（或全部，如果不足 5 道）
    reviewQueue = shuffled.slice(0, Math.min(5, shuffled.length));
    reviewIndex = 0;
    reviewAnswerShown = false;

    openModal(DOM.reviewModal);
    renderReviewQuestion();

    if (reviewQueue.length < 5) {
        showToast('未掌握错题仅剩 ' + reviewQueue.length + ' 道，已全部抽取', 'success');
    }
}

/**
 * 渲染当前复习题目
 */
function renderReviewQuestion() {
    if (reviewIndex >= reviewQueue.length) {
        showReviewSummary();
        return;
    }

    var entry = reviewQueue[reviewIndex];
    reviewAnswerShown = false;

    // 更新进度文字
    DOM.reviewProgressText.textContent = '第 ' + (reviewIndex + 1) + ' 题 / 共 ' + reviewQueue.length + ' 题';

    // 更新进度条
    var progressPercent = (reviewIndex / reviewQueue.length) * 100;
    DOM.reviewProgressFill.style.width = progressPercent + '%';

    // 渲染题目卡片
    var tagClass = SUBJECT_TAG_CLASS[entry.subject] || '';
    var html = '';
    html += '<div class="review-field">';
    html += '  <div class="detail-label">题目</div>';
    html += '  <div class="detail-value review-question-text">' + escapeHtml(entry.title) + '</div>';
    html += '</div>';
    html += '<div class="review-meta">';
    html += '  <span class="error-card-tag ' + tagClass + '">' + escapeHtml(entry.subject) + '</span>';
    html += '  <span class="error-card-knowledge">' + escapeHtml(entry.knowledgePoint) + '</span>';
    html += '  <span class="error-card-stars">' + renderStars(entry.difficulty) + '</span>';
    html += '</div>';

    DOM.reviewQuestionCard.innerHTML = html;
    DOM.reviewQuestionCard.style.display = 'block';
    DOM.reviewAnswerSection.style.display = 'none';
    DOM.reviewAnswerSection.innerHTML = '';
    DOM.reviewSummary.style.display = 'none';
    DOM.reviewProgressSection.style.display = 'block';
    DOM.reviewActions.style.display = 'flex';

    // 按钮状态
    DOM.reviewShowAnswerBtn.style.display = 'inline-flex';
    DOM.reviewMasteredBtn.style.display = 'none';
    DOM.reviewNextBtn.style.display = 'none';

    // 更新掌握按钮文字
    updateReviewMasteredBtn();
}

/**
 * 显示答案 / 错误原因
 */
function showReviewAnswer() {
    if (reviewAnswerShown) return;
    reviewAnswerShown = true;

    var entry = reviewQueue[reviewIndex];

    var html = '';
    html += '<div class="review-answer-header">💡 答案 / 错误原因</div>';
    html += '<div class="review-answer-content">' + escapeHtml(entry.errorReason) + '</div>';

    DOM.reviewAnswerSection.innerHTML = html;
    DOM.reviewAnswerSection.style.display = 'block';

    // 切换按钮
    DOM.reviewShowAnswerBtn.style.display = 'none';
    DOM.reviewMasteredBtn.style.display = 'inline-flex';
    DOM.reviewNextBtn.style.display = 'inline-flex';

    // 异步加载图片
    if (entry.images && entry.images.length > 0) {
        loadImageUrls(entry.images).then(function (imageUrls) {
            var container = DOM.reviewAnswerSection;
            var imgHtml = '<div class="review-images">';
            for (var j = 0; j < imageUrls.length; j++) {
                if (imageUrls[j].url) {
                    imgHtml += '<img class="detail-image-thumb" src="' + imageUrls[j].url + '" alt="' + escapeHtml(imageUrls[j].fileName) + '" title="点击查看大图" style="cursor:pointer;">';
                }
            }
            imgHtml += '</div>';
            container.innerHTML += imgHtml;

            // 点击图片放大
            var imgs = container.querySelectorAll('.detail-image-thumb');
            for (var k = 0; k < imgs.length; k++) {
                imgs[k].addEventListener('click', function () {
                    DOM.imageViewerImg.src = this.src;
                    DOM.imageViewerTitle.textContent = this.alt || '图片预览';
                    openModal(DOM.imageViewerModal);
                });
            }
        });
    }
}

/**
 * 更新掌握按钮状态
 */
function updateReviewMasteredBtn() {
    if (reviewIndex >= reviewQueue.length) return;
    var entry = reviewQueue[reviewIndex];
    if (entry.mastered) {
        DOM.reviewMasteredBtn.textContent = '✅ 已掌握';
        DOM.reviewMasteredBtn.classList.add('btn-mastered-done');
    } else {
        DOM.reviewMasteredBtn.textContent = '✅ 标记已掌握';
        DOM.reviewMasteredBtn.classList.remove('btn-mastered-done');
    }
}

/**
 * 在复习中切换掌握状态
 */
async function markReviewMastered() {
    if (reviewIndex >= reviewQueue.length) return;
    var entry = reviewQueue[reviewIndex];

    // 更新数据库
    var entries = await loadEntries();
    for (var i = 0; i < entries.length; i++) {
        if (entries[i].id === entry.id) {
            entries[i].mastered = !entries[i].mastered;
            if (entries[i].mastered) {
                entries[i].lastReviewed = new Date().toISOString();
                entries[i].reviewCount = (entries[i].reviewCount || 0) + 1;
            }
            break;
        }
    }
    await saveEntries(entries);

    // 同步更新本地队列中的条目
    entry.mastered = !entry.mastered;

    updateReviewMasteredBtn();
    await updateStats();
    showToast(entry.mastered ? '已标记为已掌握 ✓' : '已取消掌握标记', 'success');
}

/**
 * 进入下一题或显示总结
 */
async function reviewNext() {
    // 进度条更新到当前题目完成
    var progressPercent = ((reviewIndex + 1) / reviewQueue.length) * 100;
    DOM.reviewProgressFill.style.width = progressPercent + '%';

    reviewIndex++;
    reviewAnswerShown = false;

    if (reviewIndex >= reviewQueue.length) {
        showReviewSummary();
    } else {
        renderReviewQuestion();
        // 滚动到顶部
        DOM.reviewBody.scrollTop = 0;
    }
}

/**
 * 显示复习完成总结
 */
async function showReviewSummary() {
    DOM.reviewQuestionCard.style.display = 'none';
    DOM.reviewAnswerSection.style.display = 'none';
    DOM.reviewProgressSection.style.display = 'none';
    DOM.reviewActions.style.display = 'none';

    // 刷新全局统计
    await updateStats();

    var totalReviewed = reviewQueue.length;
    var masteredNow = reviewQueue.filter(function (e) { return e.mastered; }).length;
    var unmasteredNow = totalReviewed - masteredNow;

    var html = '';
    html += '<div class="review-summary-container">';
    html += '  <div class="review-summary-icon">🎉</div>';
    html += '  <h3 class="review-summary-title">复习完成！</h3>';
    html += '  <div class="review-summary-stats">';
    html += '    <div class="review-summary-stat">';
    html += '      <span class="review-summary-num">' + totalReviewed + '</span>';
    html += '      <span class="review-summary-label">本次复习总数</span>';
    html += '    </div>';
    html += '    <div class="review-summary-stat">';
    html += '      <span class="review-summary-num review-summary-mastered">' + masteredNow + '</span>';
    html += '      <span class="review-summary-label">已掌握</span>';
    html += '    </div>';
    html += '    <div class="review-summary-stat">';
    html += '      <span class="review-summary-num review-summary-unmastered">' + unmasteredNow + '</span>';
    html += '      <span class="review-summary-label">未掌握</span>';
    html += '    </div>';
    html += '  </div>';
    html += '</div>';

    DOM.reviewSummary.innerHTML = html;
    DOM.reviewSummary.style.display = 'block';
}

/**
 * 退出复习模式
 */
function exitReview() {
    closeModal(DOM.reviewModal);
    reviewQueue = [];
    reviewIndex = 0;
    reviewAnswerShown = false;
    refreshAll();
}

// 复习弹窗内按钮事件绑定
DOM.reviewShowAnswerBtn.addEventListener('click', function () { showReviewAnswer(); });
DOM.reviewMasteredBtn.addEventListener('click', function () { markReviewMastered(); });
DOM.reviewNextBtn.addEventListener('click', function () { reviewNext(); });

// ==================== 工具栏事件 ====================

DOM.startReviewBtn.addEventListener('click', function () { startReview(); });
DOM.batchModeBtn.addEventListener('click', function () { enterBatchMode(); });
DOM.batchDeleteBtn.addEventListener('click', function () { executeBatchDelete(); });

DOM.exportBtn.addEventListener('click', function () { exportToJSON(); });
DOM.importBtn.addEventListener('click', function () { DOM.importFileInput.click(); });
DOM.importFileInput.addEventListener('change', function () {
    if (DOM.importFileInput.files && DOM.importFileInput.files[0]) {
        importFromJSON(DOM.importFileInput.files[0]);
    }
});
DOM.clearAllBtn.addEventListener('click', function () { clearAllData(); });

// ==================== 列表事件委托 ====================

DOM.errorList.addEventListener('click', function (e) {
    // 批量模式下的复选框
    if (batchMode) {
        var cb = e.target.closest('.error-card-checkbox input');
        if (cb) {
            var cbId = cb.getAttribute('data-id');
            if (cbId) toggleSelectEntry(cbId);
            return;
        }
        // 批量模式下点击卡片切换选中
        var card = e.target.closest('.error-card');
        if (card && !e.target.closest('button') && !e.target.closest('input')) {
            var cardId = card.getAttribute('data-entry-id');
            if (cardId) toggleSelectEntry(cardId);
            return;
        }
    }

    // 收藏按钮
    var favBtn = e.target.closest('.fav-btn');
    if (favBtn) {
        var favId = favBtn.getAttribute('data-id');
        if (favId) { toggleFavorite(favId); return; }
    }

    // 掌握按钮
    var masteredBtn = e.target.closest('.mastered-btn');
    if (masteredBtn) {
        var masteredId = masteredBtn.getAttribute('data-id');
        if (masteredId) { toggleMastered(masteredId); return; }
    }

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

async function init() {
    // 尝试迁移 localStorage 旧数据
    try {
        var migrated = await migrateFromLocalStorage();
        if (migrated > 0) {
            console.log('已从 localStorage 迁移 ' + migrated + ' 条记录到 IndexedDB');
        }
    } catch (e) {
        console.warn('数据迁移失败，将继续使用 localStorage:', e);
    }

    await refreshAll();
    DOM.titleInput.focus();

    // 检查 Tesseract.js 是否加载成功
    if (typeof Tesseract !== 'undefined') {
        console.log('✅ Tesseract.js OCR 引擎就绪（本地运行，免费无限制）');
    } else {
        console.warn('⚠️ Tesseract.js 加载失败，拍照录题功能不可用。请检查网络连接。');
        DOM.ocrSection.style.opacity = '0.5';
        DOM.ocrSection.style.pointerEvents = 'none';
        DOM.ocrSection.querySelector('.ocr-section-hint').textContent = 'OCR 引擎加载失败，请刷新页面重试';
    }

    console.log('数学错题本 V1.6.1 初始化完成 ✨（用户体验优化版）');
    var count = await loadEntries();
    console.log('已加载 ' + count.length + ' 条错题记录（IndexedDB）');
    console.log('数据版本：V' + DATA_VERSION + '（向下兼容 V1）');
    console.log('✨ 新功能：自动标题 | 置信度显示 | 智能压缩 | 编辑同步');
}

document.addEventListener('DOMContentLoaded', init);

// ==================== 暴露全局 API ====================

window.ErrorBook = {
    load: loadEntries,
    save: saveEntries,
    refresh: refreshAll,
    reset: resetForm,
    getStats: async function () {
        var entries = await loadEntries();
        return {
            total: entries.length,
            mastered: entries.filter(function (e) { return e.mastered; }).length,
            unmastered: entries.filter(function (e) { return !e.mastered; }).length,
            favorites: entries.filter(function (e) { return e.isFavorite; }).length
        };
    },
    exportAll: async function () {
        var entries = await loadEntries();
        console.table(entries);
        await exportToJSON();
        return entries;
    },
    importFromJSON: importFromJSON,
    clearAll: async function () { await clearAllData(); },
    toggleFavorite: toggleFavorite,
    getFavorites: async function () {
        var entries = await loadEntries();
        return entries.filter(function (e) { return e.isFavorite; });
    },
    resetFilters: function () {
        DOM.filterSubject.value = '';
        DOM.filterDifficulty.value = '';
        DOM.sortBy.value = 'newest';
        DOM.searchInput.value = '';
        DOM.clearSearchBtn.style.display = 'none';
        // 重置状态筛选按钮为"全部"
        activeStatusFilter = 'all';
        var allBtns = DOM.statusFilterGroup.querySelectorAll('.status-filter-btn');
        for (var i = 0; i < allBtns.length; i++) {
            allBtns[i].classList.remove('active');
        }
        var allBtn = DOM.statusFilterGroup.querySelector('[data-status="all"]');
        if (allBtn) allBtn.classList.add('active');
        if (batchMode) exitBatchMode();
        renderList();
    },
    getDBInfo: async function () {
        var entries = await loadEntries();
        var totalImages = 0;
        for (var i = 0; i < entries.length; i++) {
            if (entries[i].images) totalImages += entries[i].images.length;
        }
        return { entries: entries.length, images: totalImages, dbName: DB_NAME };
    },
    startReview: startReview,
    exitReview: exitReview,
    getReviewState: function () {
        return {
            queueLength: reviewQueue.length,
            currentIndex: reviewIndex,
            answerShown: reviewAnswerShown
        };
    }
};
