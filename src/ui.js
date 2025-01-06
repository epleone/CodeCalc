import Calculator from './calculator.js';
import { OPERATORS, FUNCTIONS, CONSTANTS } from './operators.js';
import * as Tag from './tag.js';
import * as Snapshot from './snapshot.js';
import * as Settings from './settings.js';


// 生成触发补全的字符集
function generateTriggerChars() {
    const triggerChars = new Set();
    
    // 添加点号(属性函数补全)
    triggerChars.add('.');
    
    // 添加左括号(函数补全)
    triggerChars.add('(');
    
    // 从 FUNCTIONS 中获取所有函数名的首字母
    Object.keys(FUNCTIONS).forEach(funcName => {
        if (funcName[0].match(/[a-zA-Z]/)) {
            triggerChars.add(funcName[0].toLowerCase());
            triggerChars.add(funcName[0].toUpperCase());
        }
    });
    
    // 从 CONSTANTS 中获取所有常量名的首字母
    Object.keys(CONSTANTS).forEach(constName => {
        if (constName[0].match(/[a-zA-Z]/)) {
            triggerChars.add(constName[0].toLowerCase());
            triggerChars.add(constName[0].toUpperCase());
        }
    });
    
    return triggerChars;
}

// 生成触发字符集
const triggerChars = generateTriggerChars();

// 从 OPERATORS 和 FUNCTIONS 中生成补全列表
function generateCompletions() {
    const completions = [];
    
    // 添加函数名（带括号）
    for (const funcName of Object.keys(FUNCTIONS)) {
        const func = FUNCTIONS[funcName];
        // 排除以数字开头的函数名（如 0b, 0o, 0x）
        if (!/^\d/.test(funcName)) {
            // 如果是属性函数，额外添加 .funcName 形式
            if (func.asProperty) {
                completions.push(`${funcName}(`);
                completions.push(`.${funcName}`);
            } else {
                completions.push(`${funcName}(`);
            }
        }
    }
    
    // 添加常量
    for (const constName of Object.keys(CONSTANTS)) {
        completions.push(constName);
    }
    
    // 添加特殊运算符
    const specialOperators = ['**'];
    for (const op of specialOperators) {
        completions.push(`${op}(`);
    }
    
    // 添加进制前缀
    const prefixes = ['0b', '0o', '0x'];
    completions.push(...prefixes);
    
    return completions;
}

// 生成补全列表
const completions = generateCompletions();

// 添加全局变量
let isCompletionEnabled = true;

// 添加一个标记来跟踪是否使用过方向键
let hasUsedArrowKeys = false;

// 添加一个计时器变量
let completionHideTimer;

function calculateLine(input) {
    const resultContainer = input.parentElement.querySelector('.result-container');
    const result = resultContainer.querySelector('.result');
    const messageIcon = resultContainer.querySelector('.message-icon');
    const messageText = messageIcon.querySelector('.message-text');
    const expression = input.value.trim();
    
    // 清除所有状态
    function clearState() {
        result.innerHTML = '<span class="result-value"></span>';
        result.classList.remove('has-input', 'has-value', 'warning', 'error', 'info');
        messageIcon.style.display = 'none';  // 确保隐藏消息图标
        messageIcon.className = 'message-icon';  // 重置消息图标的类
    }

    // 设置状态
    function setState(value, type, messages) {
        result.innerHTML = `<span class="result-value">${value}</span>`;
        result.classList.remove('warning', 'error', 'info');
        result.classList.add('has-value');

        // 清除之前的消息
        messageText.innerHTML = '';
        
        if (type === 'error') {
            // 错误消息保持原样处理
            result.classList.add('error');
            messageIcon.className = 'message-icon error';
            messageIcon.style.display = 'inline';
            messageText.textContent = messages;
            return;
        }

        // 处理警告和提示消息
        if (Array.isArray(messages) && messages.length > 0) {
            // 设置图标类型
            messageIcon.className = `message-icon ${type}`;
            messageIcon.style.display = 'inline';
            
            // 为每条消息创建提示框
            messages.forEach(msg => {
                const msgContent = document.createElement('div');
                msgContent.className = `message-content ${msg.type}`;
                msgContent.textContent = msg.text;
                messageText.appendChild(msgContent);
            });
        } else {
            messageIcon.style.display = 'none';
        }
    }

    // 设置正常结果
    function setNormalState(value) {
        result.innerHTML = `<span class="result-value">${value}</span>`;
        result.classList.remove('warning', 'error', 'info');  // 确保移除所有特殊状态
        result.classList.add('has-value');
        messageIcon.style.display = 'none';  // 确保隐藏消息图标
        messageIcon.className = 'message-icon';  // 重置消息图标的类
    }

    // 空输入处理
    if (expression === '') {
        clearState();
        return;
    }
    result.classList.add('has-input');

    try {
        const value = Calculator.calculate(expression);
        const messages = [];
        let type = null;

        // 按优先级收集消息
        if (value.warning && value.warning.length > 0) {
            messages.push(...value.warning.map(msg => ({ text: msg, type: 'warning' })));
            type = 'warning';
        }
        if (value.info && value.info.length > 0) {
            messages.push(...value.info.map(msg => ({ text: msg, type: 'info' })));
            type = type || 'info';
        }

        if (messages.length > 0) {
            setState(value.value, type, messages);
        } else {
            setNormalState(value.value);
        }
    } catch (error) {
        setState('', 'error', error.message);
    }
}

function addNewLine() {
    const container = document.getElementById('expression-container');
    const lines = document.querySelectorAll('.expression-line');
    const newLine = document.createElement('div');
    newLine.className = 'expression-line';
    newLine.innerHTML = `
        ${Tag.createTagContainerHTML()}
        <input type="text" class="input" placeholder="输入表达式" 
               oninput="handleInput(event)"
               onkeydown="handleKeyDown(event, this)"
               onclick="removeCompletionHint(this)">
        <div class="result-container">
            <div class="result">
                <span class="result-value"></span>
            </div>
            <div class="message-icon" style="display: none;">
                <div class="message-text"></div>
            </div>
        </div>
    `;
    container.appendChild(newLine);
    
    // 初始化标签功能
    Tag.initializeTagButton(newLine);
    
    // 为新行的结果添加点击处理
    const result = newLine.querySelector('.result');
    addResultClickHandler(result);
    
    newLine.querySelector('.input').focus();
}

// 添加一个统一的删除行处理函数
function handleLineDelete(input) {
    const lines = document.querySelectorAll('.expression-line');
    const currentLine = input.closest('.expression-line');
    const currentIndex = Array.from(lines).indexOf(currentLine);
    
    // 如果只有一行，则清空内容
    if (lines.length === 1) {
        input.value = '';
        input.dispatchEvent(new Event('input'));
        Calculator.clearAllCache();  // 清除缓存
        return;
    }
    
    // 将后面的内容上移
    for (let i = currentIndex; i < lines.length - 1; i++) {
        const currentInput = lines[i].querySelector('.input');
        const nextInput = lines[i + 1].querySelector('.input');
        currentInput.value = nextInput.value;
        currentInput.dispatchEvent(new Event('input'));
    }
    
    // 删除最后一行
    lines[lines.length - 1].remove();
    
    // 设置焦点
    if (currentIndex === 0) {
        lines[0].querySelector('.input').focus();
    } else {
        const previousLine = lines[currentIndex - 1];
        const previousInput = previousLine.querySelector('.input');
        previousInput.focus();
        previousInput.selectionStart = previousInput.value.length;
        previousInput.selectionEnd = previousInput.value.length;
    }
    
    recalculateAllLines();  // 清除缓存并重新计算所有行
}

function handleKeyDown(event, input) {
    const cursorPos = input.selectionStart;
    const textBeforeCursor = input.value.substring(0, cursorPos);
    const hint = document.querySelector('.completion-hint');

    // 处理补全相关的按键
    if (hint) {
        switch (event.key) {
            case 'ArrowUp':
            case 'ArrowDown':
                if (isCompletionEnabled) {
                    event.preventDefault();
                    hasUsedArrowKeys = true;
                    navigateCompletion(event.key === 'ArrowUp' ? 'prev' : 'next');
                    startHideTimer(hint);
                    return;
                }
                break;

            case 'Enter':
                if (isCompletionEnabled && hasUsedArrowKeys) {
                    event.preventDefault();
                    applySelectedCompletion(input);
                    return;
                }
                break;

            case 'Tab':
                if (isCompletionEnabled) {
                    event.preventDefault();
                    applySelectedCompletion(input);
                    return;
                }
                break;

            case 'Escape':
                removeCompletionHint(input);
                return;
        }
    }

    // 处理其他键盘事件
    switch (event.key) {
        case 'Enter':
            handleEnterKey(event, input);
            return;

        case 'Backspace':
            if (input.value === '') {
                event.preventDefault();
                handleLineDelete(input);
                return;
            }
            // 如果光标在行首且不是第一行，移动到上一行末尾
            if (input.selectionStart === 0 && input.selectionEnd === 0) {
                const currentLine = input.closest('.expression-line');
                const previousLine = currentLine.previousElementSibling;
                if (previousLine) {
                    event.preventDefault();
                    const previousInput = previousLine.querySelector('.input');
                    previousInput.focus();
                    previousInput.selectionStart = previousInput.value.length;
                    previousInput.selectionEnd = previousInput.value.length;
                }
            }
            break;

        case 'Delete':
            event.preventDefault();
            handleLineDelete(input);
            return;

        case 'ArrowUp':
        case 'ArrowDown':
            if (!hint) {  // 只在没有补全提示时处理上下行切换
                event.preventDefault();
                const currentLine = input.closest('.expression-line');
                const targetLine = event.key === 'ArrowUp' ? 
                    currentLine.previousElementSibling : 
                    currentLine.nextElementSibling;
                if (targetLine) {
                    const targetInput = targetLine.querySelector('.input');
                    targetInput.focus();
                    const cursorPos = input.selectionStart;
                    targetInput.selectionStart = Math.min(cursorPos, targetInput.value.length);
                    targetInput.selectionEnd = Math.min(cursorPos, targetInput.value.length);
                }
            }
            return;

        case '*':
            handleAsteriskInput(event, input);
            return;

        default:
            // 检查是否是触发补全的字符
            if (isCompletionEnabled && triggerChars.has(event.key)) {
                // 等待当前按键输入完成后再检查补全
                setTimeout(() => {
                    const newText = input.value;
                    const newCursorPos = input.selectionStart;
                    const newTextBeforeCursor = newText.substring(0, newCursorPos);

                    // 检查是否需要显示补全提示
                    const dotMatch = newTextBeforeCursor.match(/\.([a-zA-Z0-9]*)$/);
                    if (dotMatch) {
                        // 属性函数补全
                        const propertyMatches = Object.entries(FUNCTIONS)
                            .filter(([name, func]) => 
                                func.asProperty && 
                                (!dotMatch[1] || name.toLowerCase().startsWith(dotMatch[1].toLowerCase()))
                            )
                            .map(([name]) => name);
                        
                        if (propertyMatches.length > 0) {
                            showCompletionHint(input, propertyMatches, true);
                        }
                    } else {
                        // 普通函数补全
                        const lastWord = newTextBeforeCursor.match(/(?:[a-zA-Z0-9]|\*\*)*$/)[0].toLowerCase();
                        if (lastWord) {
                            const matches = completions.filter(c => 
                                c.toLowerCase().startsWith(lastWord)
                            );
                            
                            if (matches.length > 0) {
                                showCompletionHint(input, matches, false);
                            }
                        }
                    }
                }, 0);
            }
            break;
    }
}

// 新增处理 Enter 键的辅助函数
function handleEnterKey(event, input) {
    const currentLine = input.closest('.expression-line');
    const lines = document.querySelectorAll('.expression-line');
    const currentIndex = Array.from(lines).indexOf(currentLine);
    const isLastTwoLines = currentIndex >= lines.length - 2;

    // 处理 Shift + Enter
    if (event.shiftKey) {
        // 在最后两行时，行为和普通 Enter 一致
        if (isLastTwoLines) {
            const expression = input.value.trim();
            const hasExpression = expression !== '';
            
            if (hasExpression) {
                if (currentIndex === lines.length - 1) {
                    addNewLine();
                } else {
                    const nextLine = currentLine.nextElementSibling;
                    if (nextLine) {
                        nextLine.querySelector('.input').focus();
                    }
                }
            }
            return;
        }
        
        // 其他行按 Shift + Enter，插入新行
        insertNewLine(currentLine);
        return;
    }
    
    // 普通 Enter 键的处理
    const expression = input.value.trim();
    const hasExpression = expression !== '';
    
    if (hasExpression) {
        if (currentIndex === lines.length - 1) {
            addNewLine();
        } else {
            const nextLine = currentLine.nextElementSibling;
            if (nextLine) {
                nextLine.querySelector('.input').focus();
            }
        }
    }
}

function handleInput(event) {
    const input = event.target;
    
    // 移除补全提示
    removeCompletionHint(input);
    
    // 计算表达式
    if (isLastExpression()) {
        calculateLine(input);
    } else {
        recalculateAllLines();
    }
}

// 新增的辅助函数
function navigateCompletion(direction) {
    const hint = document.querySelector('.completion-hint');
    if (!hint) return;

    const items = Array.from(hint.querySelectorAll('.completion-item'));
    const selectedItem = hint.querySelector('.completion-item.selected');
    let nextIndex = 0;

    if (selectedItem) {
        const currentDesc = selectedItem.querySelector('.description');
        if (currentDesc) {
            currentDesc.style.display = 'none';
        }

        const currentIndex = items.indexOf(selectedItem);
        if (direction === 'prev') {
            nextIndex = (currentIndex - 1 + items.length) % items.length;
        } else {
            nextIndex = (currentIndex + 1) % items.length;
        }
        selectedItem.classList.remove('selected');
    } else if (direction === 'prev') {
        nextIndex = items.length - 1;
    }

    items[nextIndex].classList.add('selected');
    const newDesc = items[nextIndex].querySelector('.description');
    if (newDesc) {
        newDesc.style.display = '';
    }
}

function applySelectedCompletion(input) {
    const hint = document.querySelector('.completion-hint');
    if (!hint) return;

    const selectedItem = hint.querySelector('.completion-item.selected');
    if (selectedItem) {
        const textElement = selectedItem.querySelector('.text');
        const match = textElement.textContent;
        const isPropertyCompletion = selectedItem.getAttribute('data-type') === 'property';
        applyCompletion(input, match, isPropertyCompletion);
    }
}

// 1. 创建一个统一的事件处理函数
function createCompletionItemHandler(input, match, isPropertyCompletion, item) {
    return function handler(event) {
        applyCompletion(input, match, isPropertyCompletion);
        // 使用完立即移除事件监听器
        item.removeEventListener('click', handler);
        // 移除补全框
        removeCompletionHint(input);
    };
}

// 2. 修改 showCompletionHint 函数中创建补全项的部分
function showCompletionHint(input, matches, isPropertyCompletion) {
    removeCompletionHint(input);
    
    const hint = document.createElement('div');
    hint.className = 'completion-hint';
    
    const list = document.createElement('ul');
    list.className = 'completion-list';
    
    // 只显示前5个匹配项
    const displayMatches = matches.slice(0, 5);
    
    displayMatches.forEach((match, index) => {
        const item = document.createElement('li');
        item.className = 'completion-item';
        
        // 添加类型标记
        const type = isPropertyCompletion ? 'property' : 
                    match.endsWith('(') ? 'function' : 'constant';
        item.setAttribute('data-type', type);
        
        // 添加主要文本
        const text = document.createElement('span');
        text.className = 'text';
        text.textContent = match;
        item.appendChild(text);
        
        // 添加函数描述信息
        if (FUNCTIONS[match.replace(/[(.]/g, '')]) {
            const desc = document.createElement('span');
            desc.className = 'description';
            desc.textContent = FUNCTIONS[match.replace(/[(.]/g, '')].description;
            desc.style.display = 'none';
            item.appendChild(desc);
        }
        
        // 默认选中第一项
        if (index === 0) {
            item.classList.add('selected');
            const desc = item.querySelector('.description');
            if (desc) {
                desc.style.display = '';
            }
        }
        
        // 添加点击事件处理
        const handler = createCompletionItemHandler(input, match, isPropertyCompletion, item);
        item.addEventListener('click', handler, { once: true });
        
        list.appendChild(item);
    });
    
    hint.appendChild(list);
    input.parentElement.appendChild(hint);
    
    // 计算提示框位置
    positionCompletionHint(input, hint);
    
    // 启动隐藏计时器
    startHideTimer(hint);
}

// 计算并设置补全提示框的位置
function positionCompletionHint(input, hint) {
    const cursorPos = input.selectionStart;
    const textBeforeCursor = input.value.substring(0, cursorPos);
    
    // 获取输入框的位置信息
    const inputRect = input.getBoundingClientRect();
    
    // 创建临时span计算光标位置
    const span = document.createElement('span');
    span.style.cssText = `
        position: fixed;
        top: -9999px;
        left: -9999px;
        font: ${window.getComputedStyle(input).font};
        letter-spacing: ${window.getComputedStyle(input).letterSpacing};
        white-space: pre;
    `;
    span.textContent = textBeforeCursor;
    document.body.appendChild(span);
    
    // 计算光标位置
    const paddingLeft = parseFloat(window.getComputedStyle(input).paddingLeft);
    const cursorX = inputRect.left + span.offsetWidth + paddingLeft - input.scrollLeft;
    const cursorY = inputRect.bottom + 2;
    
    document.body.removeChild(span);
    
    // 获取提示框尺寸
    const hintRect = hint.getBoundingClientRect();
    
    // 计算最终位置
    let left = cursorX;
    let top = cursorY;
    
    // 处理右边界溢出
    if (left + hintRect.width > window.innerWidth) {
        left = cursorX - hintRect.width;
    }
    
    // 处理底部溢出
    if (top + hintRect.height > window.innerHeight) {
        top = inputRect.top - hintRect.height - 2;
    }
    
    // 设置位置
    hint.style.position = 'fixed';
    hint.style.left = `${left}px`;
    hint.style.top = `${top}px`;
}

// 添加启动计时器的函数
function startHideTimer(hint) {
    if (completionHideTimer) {
        clearTimeout(completionHideTimer);
    }
    completionHideTimer = setTimeout(() => {
        if (hint && hint.parentElement) {
            hint.remove();
        }
    }, 3000);
}

// 3. 修改 removeCompletionHint 函数
function removeCompletionHint(input) {
    if (completionHideTimer) {
        clearTimeout(completionHideTimer);
        completionHideTimer = null;
    }
    document.querySelectorAll('.completion-hint').forEach(hint => {
        hint.dispatchEvent(new Event('remove'));
        hint.remove();
    });
    hasUsedArrowKeys = false;
}



// 修改 clearAll 函数
function clearAll() {
    const container = document.getElementById('expression-container');
    // 保留第一行，删除其他行
    const firstLine = container.querySelector('.expression-line');
    container.innerHTML = '';
    container.appendChild(firstLine);

    // 清空第一行的内容
    const input = firstLine.querySelector('.input');
    const result = firstLine.querySelector('.result');
    const messageIcon = firstLine.querySelector('.message-icon');
    
    // 清空输入和结果
    input.value = '';
    result.innerHTML = '<span class="result-value"></span>';
    result.classList.remove('has-input', 'has-value', 'warning', 'error', 'info');
    
    // 隐藏消息图标并重置其状态
    messageIcon.style.display = 'none';
    messageIcon.className = 'message-icon';
    messageIcon.querySelector('.message-text').innerHTML = '';

    // 重置标签状态
    const tagContainer = firstLine.querySelector('.tag-container');
    const existingTag = tagContainer.querySelector('.tag');
    if (existingTag) {
        existingTag.remove();
        tagContainer.querySelector('.tag-button').style.display = 'flex';
    }

    // 移除补全提示框
    removeCompletionHint(input);

    // 清除计算缓存
    Calculator.clearAllCache();
    
    // 聚焦到输入框
    firstLine.querySelector('.input').focus();
}

function handleContainerClick(event) {
    if (!event.target.classList.contains('input')) {
        const lines = document.querySelectorAll('.expression-line');
        const lastLine = lines[lines.length - 1];
        const input = lastLine.querySelector('.input');
        input.focus();
    }
}

// 初始聚焦到输入框
document.querySelector('.input').focus(); 

// 添加开关事件监听
document.addEventListener('DOMContentLoaded', function() {
    const completionToggle = document.getElementById('completionToggle');
    
    // 从本地存储加载设置
    const savedState = localStorage.getItem('completionEnabled');
    if (savedState !== null) {
        isCompletionEnabled = savedState === 'true';
        completionToggle.checked = isCompletionEnabled;
    }
    
    completionToggle.addEventListener('change', function() {
        isCompletionEnabled = this.checked;
        // 保存设置到本地存储
        localStorage.setItem('completionEnabled', isCompletionEnabled);
    });
}); 

// 在现有代码中添加事件处理函数
function handleMessageIconClick(event) {
    const messageIcon = event.target.closest('.message-icon');
    if (!messageIcon || !messageIcon.classList.contains('error')) return;
    
    const expressionLine = messageIcon.closest('.expression-line');
    if (!expressionLine) return;
    
    const container = document.getElementById('expression-container');
    const lines = Array.from(container.querySelectorAll('.expression-line'));
    const currentIndex = lines.indexOf(expressionLine);
    
    // 如果不是最后一行，将下面所有行的内容上移
    if (currentIndex < lines.length - 1) {
        for (let i = currentIndex; i < lines.length - 1; i++) {
            const currentInput = lines[i].querySelector('.input');
            const nextInput = lines[i + 1].querySelector('.input');
            currentInput.value = nextInput.value;
            currentInput.dispatchEvent(new Event('input'));
        }
        
        // 如果不是唯一的一行，删除最后一行
        if (lines.length > 1) {
            lines[lines.length - 1].remove();
        } else {
            // 如果是唯一的一行，只清空内容
            const lastInput = lines[lines.length - 1].querySelector('.input');
            lastInput.value = '';
            lastInput.dispatchEvent(new Event('input'));
        }
    } else {
        // 如果是最后一行，直接清空
        const input = expressionLine.querySelector('.input');
        input.value = '';
        input.dispatchEvent(new Event('input'));
    }
}

// 添加事件监听器到表达式容器
document.getElementById('expression-container').addEventListener('click', handleMessageIconClick); 

// 添加新的辅助函数来处理补全的应用
function applyCompletion(input, match, isPropertyCompletion) {
    const cursorPos = input.selectionStart;
    const textBeforeCursor = input.value.substring(0, cursorPos);
    const afterCursor = input.value.substring(cursorPos);
    
    // 只使用函数名部分
    const completionText = match.split(/\s+/)[0];
    
    if (isPropertyCompletion) {
        // 处理属性函数补全
        const dotMatch = textBeforeCursor.match(/\.([a-zA-Z0-9]*)$/);
        if (dotMatch) {
            const beforeDot = textBeforeCursor.slice(0, -dotMatch[0].length);
            input.value = beforeDot + '.' + completionText + afterCursor;
            const newCursorPos = beforeDot.length + completionText.length + 1;
            input.setSelectionRange(newCursorPos, newCursorPos);
        }
    } else {
        // 处理普通函数补全
        const lastWord = textBeforeCursor.match(/(?:[a-zA-Z0-9]|\*\*)*$/)[0];
        const beforeWord = textBeforeCursor.slice(0, -lastWord.length);
        
        if (completionText.endsWith('(')) {
            input.value = beforeWord + completionText + ')' + afterCursor;
            const newCursorPos = beforeWord.length + completionText.length;
            input.setSelectionRange(newCursorPos, newCursorPos);
        } else {
            input.value = beforeWord + completionText + afterCursor;
            const newCursorPos = beforeWord.length + completionText.length;
            input.setSelectionRange(newCursorPos, newCursorPos);
        }
    }
    
    calculateLine(input);
    removeCompletionHint(input);
} 

// 修改 insertNewLine 函数
function insertNewLine(currentLine) {
    const container = document.getElementById('expression-container');
    const lines = document.querySelectorAll('.expression-line');
    const currentIndex = Array.from(lines).indexOf(currentLine);
    
    // 创建新行
    const newLine = document.createElement('div');
    newLine.className = 'expression-line';
    newLine.innerHTML = `
        ${Tag.createTagContainerHTML()}
        <input type="text" class="input" placeholder="输入表达式" 
               oninput="handleInput(event)"
               onkeydown="handleKeyDown(event, this)"
               onclick="removeCompletionHint(this)">
        <div class="result-container">
            <div class="result">
                <span class="result-value"></span>
            </div>
            <div class="message-icon" style="display: none;">
                <div class="message-text"></div>
            </div>
        </div>
    `;
    
    // 如果是最后一行，直接添加
    if (currentIndex === lines.length - 1) {
        container.appendChild(newLine);
    } else {
        // 否则，将当前行后面的所有行下移
        const tempValues = [];
        // 保存所有需要下移的行的内容
        for (let i = currentIndex + 1; i < lines.length; i++) {
            tempValues.push({
                value: lines[i].querySelector('.input').value,
                index: i
            });
        }
        
        // 插入新行
        currentLine.insertAdjacentElement('afterend', newLine);
        
        // 恢复下移的行的内容并重新计算结果
        const newLines = document.querySelectorAll('.expression-line');
        tempValues.forEach((item) => {
            const input = newLines[item.index + 1].querySelector('.input');
            input.value = item.value;
            calculateLine(input);
        });
    }
    
    // 为新行的结果添加点击处理
    const result = newLine.querySelector('.result');
    addResultClickHandler(result);
    
    // 聚焦到新行
    const newInput = newLine.querySelector('.input');
    newInput.focus();
    
    // 重新计算所有行的结果
    const allLines = document.querySelectorAll('.expression-line');
    allLines.forEach(line => {
        const input = line.querySelector('.input');
        if (input.value) {
            calculateLine(input);
        }
    });
} 

// 添加辅助函数，清除缓存并重新计算所有行
function recalculateAllLines() {
    // 清除缓存
    Calculator.clearAllCache();

    // 重新计算所有行
    const lines = document.querySelectorAll('.expression-line');
    lines.forEach(line => {
        const input = line.querySelector('.input');
        if (input.value.trim()) {  // 只计算有输入内容的行
            calculateLine(input);
        }
    });
} 

// 添加辅助函数，判断当前行是否是最后一个表达式
function isLastExpression(line) {
    const container = document.getElementById('expression-container');
    const lines = container.querySelectorAll('.expression-line');
    
    // 获取当前行的索引
    const currentIndex = Array.from(lines).indexOf(line);
    
    // 检查后面的行是否都没有输入内容
    for (let i = currentIndex + 1; i < lines.length; i++) {
        const input = lines[i].querySelector('.input');
        if (input.value.trim()) {
            return false;
        }
    }
    
    return true;
}

// 添加初始化函数
function initializeUI() {
    // 初始化所有行的标签功能
    document.querySelectorAll('.expression-line').forEach(line => {
        Tag.initializeTagButton(line);
    });

    // 将标签和快照相关函数添加到全局作用域
    Object.assign(window, Tag);
    Object.assign(window, Snapshot);
}

// 处理星号输入，检查是否需要转换为 ** 运算符
function handleAsteriskInput(event, input) {
    const cursorPos = input.selectionStart;
    const textBeforeCursor = input.value.substring(0, cursorPos);
    
    // 检查光标前一个字符是否也是星号
    if (textBeforeCursor.endsWith('*')) {
        // 阻止默认的 * 输入
        event.preventDefault();
        
        // 删除前一个 * 并插入 **
        const newText = textBeforeCursor.slice(0, -1) + '**' + input.value.substring(cursorPos);
        input.value = newText;
        
        // 将光标移动到 ** 后面
        input.setSelectionRange(cursorPos + 1, cursorPos + 1);
        
        // 触发输入事件以更新计算结果
        input.dispatchEvent(new Event('input'));
    }
}

// 确保导出这个函数
export {
    calculateLine,
    addNewLine,
    handleLineDelete,
    handleKeyDown,
    handleInput,
    handleAsteriskInput,
    showCompletionHint,
    removeCompletionHint,
    clearAll,
    handleContainerClick,
    handleMessageIconClick,
    initializeUI
};

// 导出快照面板切换函数到全局作用域
window.toggleSnapshotPanel = function() {
    Snapshot.snapshot.togglePanel();
};

// 在文档加载完成后初始化UI
document.addEventListener('DOMContentLoaded', function() {
    initializeUI();  // 确保先初始化
});
