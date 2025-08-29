import { addCustomFunction, isFunctionDefinition, clearCustomFunctions } from '../../core/customFunctions.js';
import { notification } from './notification.js';

export class CustomFunctions {
    constructor() {
        this.isPanelVisible = false;
        this.editingIndex = null;
        this.eventsBound = false;
        
        // 添加存储适配器
        this.storage = typeof utools !== 'undefined' ? utools.dbStorage : localStorage;
        
        // 等待DOM加载完成后初始化
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    init() {
        // 获取面板元素
        this.panel = document.getElementById('custom-functions-panel');
        if (!this.panel) {
            console.error('自定义函数面板元素未找到');
            return;
        }
        
        // 创建蒙版
        this.overlay = document.createElement('div');
        this.overlay.className = 'custom-functions-overlay';
        document.body.appendChild(this.overlay);
        
        // 绑定事件
        this.bindEvents();
        
        // 渲染函数列表（直接从存储读取，不需要等待计算器）
        this.renderFunctionsList();
    }
    
    bindEvents() {
        // 蒙版点击事件
        this.overlay.addEventListener('click', () => {
            this.togglePanel();
        });
        
        // ESC键监听
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isPanelVisible) {
                e.preventDefault();
                e.stopPropagation();
                this.togglePanel();
            }
        });
        
        // 底部按钮（添加/保存）
        const bottomBtn = this.panel?.querySelector('#add-function-btn');
        if (bottomBtn) {
            bottomBtn.addEventListener('click', () => {
                this.handleBottomButtonClick();
            });
        }
    }
    
    handleBottomButtonClick() {
        if (this.editingIndex !== null) {
            // 当前处于编辑状态，执行保存操作
            this.saveFunction(this.editingIndex);
        } else {
            // 当前处于浏览状态，添加新函数
            this.addNewFunction();
        }
    }
    
    updateBottomButton() {
        const bottomBtn = this.panel?.querySelector('#add-function-btn');
        if (!bottomBtn) return;
        
        if (this.editingIndex !== null) {
            // 编辑模式：显示保存
            bottomBtn.textContent = '保存函数';
            bottomBtn.style.background = 'linear-gradient(135deg, #9a6dff 0%, #7c4dff 100%)';
        } else {
            // 浏览模式：显示添加
            bottomBtn.textContent = '添加函数';
            bottomBtn.style.background = 'linear-gradient(135deg, #9a6dff 0%, #7c4dff 100%)';
        }
    }
    
    togglePanel() {
        if (!this.panel) {
            console.error('面板未初始化');
            return;
        }
        
        this.isPanelVisible = !this.isPanelVisible;
        if (this.isPanelVisible) {
            // 如果其他面板打开，先关闭它们
            if (window.settings && window.settings.isPanelVisible) {
                window.settings.togglePanel();
            }
            if (window.shortcuts && window.shortcuts.isPanelVisible) {
                window.shortcuts.togglePanel();
            }
            if (window.snapshot && window.snapshot.isPanelVisible) {
                window.snapshot.togglePanel();
            }
            
            // 移除当前焦点
            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
            
            this.panel.classList.add('show');
            this.overlay.classList.add('show');
            document.body.style.overflow = 'hidden';
            
            // 只在面板打开时渲染一次
            this.renderFunctionsList();
            
            // 更新底部按钮状态
            this.updateBottomButton();
        } else {
            this.panel.classList.remove('show');
            this.overlay.classList.remove('show');
            document.body.style.overflow = '';
            
            // 退出面板，聚焦输入框
            const inputs = document.querySelectorAll('.input');
            if (inputs.length > 0) {
                inputs[inputs.length - 1].focus();
            }
            
            // 重置编辑状态
            this.editingIndex = null;
        }
    }
    
    renderFunctionsList() {
        const listContainer = this.panel?.querySelector('#custom-functions-list');
        if (!listContainer) return;
        
        // 直接从存储读取函数数据，不依赖计算器
        const storedFunctions = this.getStoredFunctions();
        const functionNames = Object.keys(storedFunctions);
        
        if (functionNames.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-functions-state">
                    <div class="empty-functions-icon">📝</div>
                    <div class="empty-functions-text">
                        还没有自定义函数<br>
                        点击下方按钮创建您的第一个函数
                    </div>
                </div>
            `;
            return;
        }
        
        const functionsHTML = functionNames.map((name, index) => {
            const func = storedFunctions[name];
            // 使用保存的definition或者重构definition
            const definition = func.definition || `${func.name}(${func.params?.join(', ') || ''}) = ${func.expression}`;
            const description = func.description || '';
            const paramType = func.paramType || 'any';
            
            return this.createFunctionItemHTML(index, definition, description, paramType, name);
        }).join('');
        
        // 避免不必要的重新渲染
        if (listContainer.innerHTML !== functionsHTML) {
            listContainer.innerHTML = functionsHTML;
        }
        
        // 绑定事件（使用事件委托，只绑定一次）
        this.bindFunctionItemEvents();
    }
    
    createFunctionItemHTML(index, definition, description, paramType, funcName) {
        return `
            <div class="custom-function-item" data-index="${index}" data-function-name="${funcName}">
                <!-- 浏览模式：紧凑单行显示 -->
                <div class="function-browse-row">
                    <span class="param-type-badge" data-type="${paramType}">${paramType}</span>
                    <div class="function-content-area">
                        <span class="function-definition">${definition}</span>
                        <div class="function-actions-overlay">
                            <button class="function-edit-btn" data-index="${index}">
                                编辑
                            </button>
                            <button class="function-delete-btn" data-index="${index}" data-function-name="${funcName}">
                                删除
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- 编辑模式：第一行输入，第二行按钮 -->
                <div class="function-edit-mode" style="display: none;">
                    <div class="function-edit-first-row">
                        <select class="param-type-selector" data-index="${index}" disabled>
                            <option value="any" ${paramType === 'any' ? 'selected' : ''}>any</option>
                            <option value="string" ${paramType === 'string' ? 'selected' : ''}>string</option>
                            <option value="number" ${paramType === 'number' ? 'selected' : ''}>number</option>
                        </select>
                        
                        <input type="text" 
                               class="function-body-input" 
                               data-index="${index}"
                               value="${definition}"
                               data-original="${definition}"
                               placeholder="输入函数定义，如: myFunc(x,y) = x^2 + y"
                               readonly>
                    </div>
                    

                </div>
            </div>
        `;
    }
    
    bindFunctionItemEvents() {
        const listContainer = this.panel?.querySelector('#custom-functions-list');
        if (!listContainer) return;
        
        // 使用事件委托，避免重复绑定
        if (!this.eventsBound) {
            listContainer.addEventListener('click', this.handleListClick.bind(this));
            listContainer.addEventListener('keydown', this.handleListKeydown.bind(this));
            listContainer.addEventListener('change', this.handleListChange.bind(this));
            this.eventsBound = true;
        }
    }
    
    handleListClick(e) {
        const target = e.target;
        
        if (target.classList.contains('function-edit-btn')) {
            e.preventDefault();
            const index = parseInt(target.dataset.index);
            this.toggleEditMode(index);
        } else if (target.classList.contains('function-delete-btn')) {
            e.preventDefault();
            const funcName = target.dataset.functionName;
            this.deleteFunction(funcName);
        }
    }
    
    handleListKeydown(e) {
        const target = e.target;
        
        if (target.classList.contains('function-body-input') || target.classList.contains('function-desc-input')) {
            if (e.key === 'Enter') {
                e.preventDefault();
                const index = parseInt(target.dataset.index);
                this.saveFunction(index);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                const index = parseInt(target.dataset.index);
                this.cancelEdit(index);
            }
        }
    }
    
    handleListChange(e) {
        const target = e.target;
        
        if (target.classList.contains('param-type-selector')) {
            console.log('参数类型选择器变更:', target.value, '索引:', target.dataset.index);
            const index = parseInt(target.dataset.index);
            this.updateParamType(index, target.value);
        }
    }
    
    toggleEditMode(index) {
        const listContainer = this.panel?.querySelector('#custom-functions-list');
        if (!listContainer) return;
        
        const functionItem = listContainer.querySelector(`[data-index="${index}"]`);
        const browseRow = functionItem.querySelector('.function-browse-row');
        const editMode = functionItem.querySelector('.function-edit-mode');
        const bodyInput = functionItem.querySelector('.function-body-input');
        const paramSelect = functionItem.querySelector('.param-type-selector');
        
        // 检查当前是否在编辑模式
        const isEditing = editMode.style.display !== 'none';
        
        if (!isEditing) {
            // 进入编辑模式
            this.editingIndex = index;
            
            // 切换显示模式
            browseRow.style.display = 'none';
            editMode.style.display = 'block';
            
            // 启用编辑
            bodyInput.readOnly = false;
            paramSelect.disabled = false;
            bodyInput.focus();
            bodyInput.select();
            
            functionItem.classList.add('editing');
            
            // 更新底部按钮
            this.updateBottomButton();
        } else {
            // 保存编辑
            this.saveFunction(index);
        }
    }
    
    saveFunction(index) {
        const listContainer = this.panel?.querySelector('#custom-functions-list');
        if (!listContainer) return;
        
        const functionItem = listContainer.querySelector(`[data-index="${index}"]`);
        if (!functionItem) return;
        
        const bodyInput = functionItem.querySelector('.function-body-input');
        const descInput = functionItem.querySelector('.function-desc-input');
        const paramTypeSelect = functionItem.querySelector('.param-type-selector');
        const oldFuncName = functionItem.dataset.functionName;
        
        const newDefinition = bodyInput.value.trim();
        const newDescription = descInput ? descInput.value.trim() : '';
        const newParamType = paramTypeSelect ? paramTypeSelect.value : 'any';
        const originalDefinition = bodyInput.dataset.original || '';
        
        // 验证函数定义
        if (!newDefinition) {
            this.showError('函数定义不能为空');
            bodyInput.focus();
            return;
        }
        
        // 验证函数定义格式
        const functionDefRegex = /^([a-zA-Z_$][a-zA-Z0-9_]*)\s*\([^)]*\)\s*=\s*.+$/;
        if (!functionDefRegex.test(newDefinition)) {
            this.showError('函数定义格式错误，正确格式: funcname(param1,param2,...) = expression');
            bodyInput.focus();
            return;
        }
        
        try {
            // 解析函数定义获取函数名
            const match = newDefinition.match(/^([a-zA-Z_$][a-zA-Z0-9_]*)/);
            if (!match) {
                this.showError('无法解析函数名');
                return;
            }
            const newFuncName = match[1];
            
            // 检查函数名是否与内置函数冲突
            const builtinFunctions = ['sin', 'cos', 'tan', 'log', 'ln', 'sqrt', 'abs', 'floor', 'ceil', 'round', 'max', 'min', 'pow', 'exp'];
            if (builtinFunctions.includes(newFuncName.toLowerCase())) {
                this.showError(`函数名 "${newFuncName}" 与内置函数冲突，请使用其他名称`);
                bodyInput.focus();
                return;
            }
            
            // 纯数据操作：保存函数定义到存储
            this.saveCustomFunctionData(oldFuncName, newFuncName, newDefinition, newDescription, newParamType);
            
            // 更新UI数据
            functionItem.dataset.functionName = newFuncName;
            bodyInput.dataset.original = newDefinition;
            
            // 退出编辑模式
            this.exitEditMode(index);
            
            this.showSuccess(`函数 "${newFuncName}" 保存成功`);
            
        } catch (error) {
            this.showError(`保存失败: ${error.message}`);
            bodyInput.focus();
        }
    }
    
    cancelEdit(index) {
        const listContainer = this.panel?.querySelector('#custom-functions-list');
        if (!listContainer) return;
        
        const functionItem = listContainer.querySelector(`[data-index="${index}"]`);
        const bodyInput = functionItem.querySelector('.function-body-input');
        
        // 恢复原始值
        bodyInput.value = bodyInput.dataset.original;
        
        // 退出编辑模式
        this.exitEditMode(index);
    }
    
    exitEditMode(index) {
        const listContainer = this.panel?.querySelector('#custom-functions-list');
        if (!listContainer) return;
        
        const functionItem = listContainer.querySelector(`[data-index="${index}"]`);
        const browseRow = functionItem.querySelector('.function-browse-row');
        const editMode = functionItem.querySelector('.function-edit-mode');
        const bodyInput = functionItem.querySelector('.function-body-input');
        const paramSelect = functionItem.querySelector('.param-type-selector');
        
        // 切换回浏览模式
        browseRow.style.display = 'flex';
        editMode.style.display = 'none';
        
        // 禁用编辑
        bodyInput.readOnly = true;
        paramSelect.disabled = true;
        
        functionItem.classList.remove('editing');
        
        this.editingIndex = null;
        
        // 更新浏览模式的显示内容
        this.updateBrowseMode(index);
        
        // 更新底部按钮
        this.updateBottomButton();
    }
    
    updateBrowseMode(index) {
        const listContainer = this.panel?.querySelector('#custom-functions-list');
        if (!listContainer) return;
        
        const functionItem = listContainer.querySelector(`[data-index="${index}"]`);
        const browseRow = functionItem.querySelector('.function-browse-row');
        const bodyInput = functionItem.querySelector('.function-body-input');
        const paramSelect = functionItem.querySelector('.param-type-selector');
        
        // 获取当前值
        const definition = bodyInput.value;
        const paramType = paramSelect.value;
        
        // 更新浏览模式的显示
        const definitionSpan = browseRow.querySelector('.function-definition');
        const typeBadge = browseRow.querySelector('.param-type-badge');
        
        if (definitionSpan) {
            definitionSpan.textContent = definition;
        }
        
        if (typeBadge) {
            typeBadge.textContent = paramType;
            typeBadge.setAttribute('data-type', paramType);
        }
    }
    
    addNewFunction() {
        const listContainer = this.panel?.querySelector('#custom-functions-list');
        if (!listContainer) return;
        
        // 如果当前是空状态，清空容器
        if (listContainer.querySelector('.empty-functions-state')) {
            listContainer.innerHTML = '';
        }
        
        // 添加一个新的空函数项用于编辑
        const newIndex = listContainer.children.length;
        const newFunctionHTML = this.createFunctionItemHTML(newIndex, 'myFunc(x) = x * 2', '', 'any', '');
        
        listContainer.insertAdjacentHTML('beforeend', newFunctionHTML);
        
        // 绑定新项的事件
        this.bindFunctionItemEvents();
        
        // 立即进入编辑模式
        setTimeout(() => {
            this.toggleEditMode(newIndex);
            
            // 清空输入框并设置占位符
            const functionItem = listContainer.querySelector(`[data-index="${newIndex}"]`);
            if (functionItem) {
                const bodyInput = functionItem.querySelector('.function-body-input');
                const descInput = functionItem.querySelector('.function-desc-input');
                if (bodyInput) {
                    bodyInput.value = '';
                    bodyInput.dataset.original = '';
                    bodyInput.placeholder = '输入函数定义，如: myFunc(x,y) = x^2 + y';
                    bodyInput.focus();
                }
                if (descInput) {
                    descInput.value = '';
                }
            }
        }, 50);
    }
    
    deleteFunction(funcName) {
        if (!funcName) return;
        
        // 直接删除，无需确认
        // 纯数据操作：从存储中删除函数
        this.deleteCustomFunctionData(funcName);
        
        // 重新渲染列表
        this.renderFunctionsList();
        
        this.showSuccess(`函数 "${funcName}" 删除成功`);
    }
    
    updateParamType(index, paramType) {
        const listContainer = this.panel?.querySelector('#custom-functions-list');
        if (!listContainer) return;
        
        // 这里可以保存参数类型到元数据
        // 目前先保存到localStorage
        const functionItem = listContainer.querySelector(`[data-index="${index}"]`);
        const funcName = functionItem.dataset.functionName;
        if (funcName) {
            // 直接保存参数类型，不触发重新渲染
            this.saveFunctionMetadata(funcName, null, paramType);
        }
    }
    
    saveFunctionMetadata(funcName, description, paramType) {
        try {
            const metadata = JSON.parse(this.storage.getItem('customFunctionsMetadata') || '{}');
            if (!metadata[funcName]) {
                metadata[funcName] = {};
            }
            if (description !== null) {
                metadata[funcName].description = description;
            }
            if (paramType !== null) {
                metadata[funcName].paramType = paramType;
            }
            this.storage.setItem('customFunctionsMetadata', JSON.stringify(metadata));
        } catch (error) {
            console.warn('保存函数元数据失败:', error);
        }
    }
    
    loadFunctionMetadata(funcName) {
        try {
            const metadata = JSON.parse(this.storage.getItem('customFunctionsMetadata') || '{}');
            return metadata[funcName] || {};
        } catch (error) {
            console.warn('加载函数元数据失败:', error);
            return {};
        }
    }
    
    // 纯数据管理方法 - 保存自定义函数数据
    saveCustomFunctionData(oldFuncName, funcName, definition, description, paramType) {
        try {
            // 获取现有的函数数据
            const savedFunctions = JSON.parse(this.storage.getItem('customFunctions') || '{}');
            
            // 如果是编辑现有函数且函数名改变了，删除旧的
            if (oldFuncName && oldFuncName !== funcName && savedFunctions[oldFuncName]) {
                delete savedFunctions[oldFuncName];
            }
            
            // 解析函数定义
            const match = definition.match(/^([a-zA-Z_$][a-zA-Z0-9_]*)\s*\(([^)]*)\)\s*=\s*(.+)$/);
            if (!match) {
                throw new Error('函数定义格式错误');
            }
            
            const [, name, paramStr, expression] = match;
            const params = paramStr.trim() ? paramStr.split(',').map(p => p.trim()) : [];
            
            // 保存函数数据
            savedFunctions[funcName] = {
                name: funcName,
                params: params,
                expression: expression,
                definition: definition,
                description: description || '',
                paramType: paramType || 'any',
                created: savedFunctions[funcName]?.created || new Date().toISOString(),
                updated: new Date().toISOString()
            };
            
            this.storage.setItem('customFunctions', JSON.stringify(savedFunctions));
            console.log(`函数 "${funcName}" 已保存到存储`);
            
        } catch (error) {
            console.warn('保存自定义函数失败:', error);
            throw error;
        }
    }
    
    // 纯数据管理方法 - 删除自定义函数数据
    deleteCustomFunctionData(funcName) {
        try {
            const savedFunctions = JSON.parse(this.storage.getItem('customFunctions') || '{}');
            
            if (savedFunctions[funcName]) {
                delete savedFunctions[funcName];
                this.storage.setItem('customFunctions', JSON.stringify(savedFunctions));
                console.log(`函数 "${funcName}" 已从存储中删除`);
            }
            
        } catch (error) {
            console.warn('删除自定义函数失败:', error);
        }
    }
    
    // 获取存储的自定义函数数据
    getStoredFunctions() {
        try {
            return JSON.parse(this.storage.getItem('customFunctions') || '{}');
        } catch (error) {
            console.warn('读取自定义函数失败:', error);
            return {};
        }
    }
    
    saveFunctionsToStorage() {
        // 这个方法现在主要用于兼容性，实际保存由saveCustomFunctionData处理
        console.log('saveFunctionsToStorage 已被 saveCustomFunctionData 替代');
    }
    
    // 应用自定义函数到计算器（当计算器可用时调用）
    applyFunctionsToCalculator() {
        const calculator = window.calculator;
        const FUNCTIONS = window.FUNCTIONS;
        
        if (!calculator || !FUNCTIONS) {
            console.log('计算器尚未初始化，稍后将自动应用自定义函数');
            return false;
        }
        
        try {
            const storedFunctions = this.getStoredFunctions();
            Object.values(storedFunctions).forEach(func => {
                try {
                    const definition = func.definition || `${func.name}(${func.params?.join(',') || ''}) = ${func.expression}`;
                    addCustomFunction(definition, calculator, FUNCTIONS);
                    console.log(`已应用函数到计算器: ${func.name}`);
                } catch (error) {
                    console.warn(`应用函数 ${func.name} 到计算器失败:`, error);
                }
            });
            return true;
        } catch (error) {
            console.warn('应用自定义函数到计算器失败:', error);
            return false;
        }
    }
    
    showError(message) {
        notification.error(message, 2000);
    }
    
    showSuccess(message) {
        notification.info(message, 1500);
    }
}

// 添加快捷键支持，Ctrl + I 打开自定义函数面板
document.addEventListener('keydown', (e) => {
    // 检查 utools 是否存在
    if (typeof utools !== 'undefined') {
        const isCtrlI = (utools.isMacOS() ? e.metaKey : e.ctrlKey) && e.code === 'KeyI';

        if (isCtrlI) {
            e.preventDefault();
            if (window.customFunctions) {
                window.customFunctions.togglePanel();
            }
        }
    }
});

// 确保在DOM加载完成后创建实例
let customFunctions;

function initCustomFunctions() {
    if (!customFunctions) {
        customFunctions = new CustomFunctions();
        window.customFunctions = customFunctions;
    }
    return customFunctions;
}

// 立即尝试初始化或等待DOM加载
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCustomFunctions);
} else {
    initCustomFunctions();
}

// 监听计算器初始化，自动应用自定义函数
let calculatorCheckInterval;
function checkAndApplyFunctions() {
    if (window.calculator && window.FUNCTIONS && customFunctions) {
        console.log('检测到计算器已初始化，开始应用自定义函数');
        customFunctions.applyFunctionsToCalculator();
        if (calculatorCheckInterval) {
            clearInterval(calculatorCheckInterval);
            calculatorCheckInterval = null;
        }
    }
}

// 定期检查计算器是否已初始化
calculatorCheckInterval = setInterval(checkAndApplyFunctions, 1000);

// 页面加载完成后也检查一次
window.addEventListener('load', () => {
    setTimeout(checkAndApplyFunctions, 100);
});

export { customFunctions, initCustomFunctions };
