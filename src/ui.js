import Calculator from './calculator.js';
import { OPERATORS, FUNCTIONS, CONSTANTS } from './operators.js';
import * as Tag from './tag.js';
import * as Snapshot from './snapshot.js';


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
    // 临时禁用补全
    const originalCompletionState = isCompletionEnabled;
    isCompletionEnabled = false;
    
    const lines = document.querySelectorAll('.expression-line');
    const currentLine = input.closest('.expression-line');
    const currentIndex = Array.from(lines).indexOf(currentLine);
    
    // 如果只有一行，则清空内容
    if (lines.length === 1) {
        input.value = '';
        input.dispatchEvent(new Event('input'));
        Calculator.clearAllCache();  // 清除缓存
        isCompletionEnabled = originalCompletionState; // 恢复补全状态
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
    
    recalculateAllLines();      // 清除缓存并重新计算所有行
    
    // 恢复补全状态
    isCompletionEnabled = originalCompletionState;
}

function handleKeyDown(event, input) {
    const hint = input.parentElement.querySelector('.completion-hint');
    if (hint) {
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault();
            hasUsedArrowKeys = true;
            
            const items = Array.from(hint.querySelectorAll('.completion-item'));
            const selectedItem = hint.querySelector('.completion-item.selected');
            let nextIndex = 0;
            
            if (selectedItem) {
                // 隐藏当前选中项的描述
                const currentDesc = selectedItem.querySelector('.description');
                if (currentDesc) {
                    currentDesc.style.display = 'none';
                }
                
                const currentIndex = items.indexOf(selectedItem);
                if (event.key === 'ArrowUp') {
                    nextIndex = (currentIndex - 1 + items.length) % items.length;
                } else {
                    nextIndex = (currentIndex + 1) % items.length;
                }
                selectedItem.classList.remove('selected');
            } else if (event.key === 'ArrowUp') {
                nextIndex = items.length - 1;
            }
            
            // 显示新选中项的描述
            items[nextIndex].classList.add('selected');
            const newDesc = items[nextIndex].querySelector('.description');
            if (newDesc) {
                newDesc.style.display = '';
            }
            return;
        } else if (event.key === 'Enter') {
            event.preventDefault();
            if (hasUsedArrowKeys) {
                // 如果使用过方向键，应用补全
                const selectedItem = hint.querySelector('.completion-item.selected');
                if (selectedItem) {
                    const textElement = selectedItem.querySelector('.text');
                    const match = textElement.textContent;
                    const isPropertyCompletion = selectedItem.getAttribute('data-type') === 'property';
                    applyCompletion(input, match, isPropertyCompletion);
                }
            } else {
                // 如果没有使用过方向键，移除补全提示
                removeCompletionHint(input);
            }
            return;
        } else if (event.key === 'Tab') {
            event.preventDefault();
            const selectedItem = hint.querySelector('.completion-item.selected');
            if (selectedItem) {
                const textElement = selectedItem.querySelector('.text');
                const match = textElement.textContent;
                const isPropertyCompletion = selectedItem.getAttribute('data-type') === 'property';
                applyCompletion(input, match, isPropertyCompletion);
            }
            return;
        }
    }
    
    // 原有的键盘事件处理逻辑...
    if (event.key === 'Enter') {
        if (!hint) {  // 只在没有补全提示时处理换行
            event.preventDefault();
            
            const currentLine = input.closest('.expression-line');
            const lines = document.querySelectorAll('.expression-line');
            const currentIndex = Array.from(lines).indexOf(currentLine);
            const isLastTwoLines = currentIndex >= lines.length - 2;  // 判断是否在最后两行
            
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
    } else if (event.key === 'Backspace') {
        // 如果输入框为空，删除当前行
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
                
                // 聚焦到上一行末尾
                previousInput.focus();
                previousInput.selectionStart = previousInput.value.length;
                previousInput.selectionEnd = previousInput.value.length;
            }
        }
    } else if (event.key === 'Delete') {
        event.preventDefault();
        handleLineDelete(input);
    } else if (event.key === 'ArrowUp') {
        // 只在没有补全提示时处理上下行切换
        if (!hint) {
            event.preventDefault();
            const currentLine = input.closest('.expression-line'); // 获取当前行元素
            const previousLine = currentLine.previousElementSibling;
            if (previousLine) {
                const previousInput = previousLine.querySelector('.input');
                previousInput.focus();
                const cursorPos = input.selectionStart;
                previousInput.selectionStart = Math.min(cursorPos, previousInput.value.length);
                previousInput.selectionEnd = Math.min(cursorPos, previousInput.value.length);
            }
        }
    } else if (event.key === 'ArrowDown') {
        // 只在没有补全提示时处理上下行切换
        if (!hint) {
            event.preventDefault();
            const currentLine = input.closest('.expression-line'); // 获取当前行元素
            const nextLine = currentLine.nextElementSibling;
            if (nextLine) {
                const nextInput = nextLine.querySelector('.input');
                nextInput.focus();
                const cursorPos = input.selectionStart;
                nextInput.selectionStart = Math.min(cursorPos, nextInput.value.length);
                nextInput.selectionEnd = Math.min(cursorPos, nextInput.value.length);
            }
        }
    } else if (event.key === 'Tab') {
        event.preventDefault();
        handleTabCompletion(input);
    } else if (event.key === '*') {
        handleAsteriskInput(event, input);
    }

    if (!hint || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) {
        removeCompletionHint(input);
    }
}

function handleTabCompletion(input) {
    if (!isCompletionEnabled) return;
    
    const cursorPos = input.selectionStart;
    const textBeforeCursor = input.value.substring(0, cursorPos);
    
    // 检查是否是属性函数补全
    const dotMatch = textBeforeCursor.match(/\.([a-zA-Z0-9]*)$/);
    if (dotMatch) {
        const propertyMatches = Object.entries(FUNCTIONS)
            .filter(([name, func]) => 
                func.asProperty && 
                (!dotMatch[1] || name.toLowerCase().startsWith(dotMatch[1].toLowerCase()))
            )
            .map(([name]) => name);
            
        if (propertyMatches.length > 0) {
            // 如果有补全提示显示，使用当前选中的项
            const hint = input.parentElement.querySelector('.completion-hint');
            if (hint) {
                const selectedItem = hint.querySelector('.completion-item.selected') || 
                                   hint.querySelector('.completion-item');
                if (selectedItem) {
                    const match = selectedItem.textContent;
                    const beforeDot = textBeforeCursor.slice(0, -dotMatch[0].length);
                    input.value = beforeDot + '.' + match + input.value.substring(cursorPos);
                    const newCursorPos = beforeDot.length + match.length + 1;
                    input.setSelectionRange(newCursorPos, newCursorPos);
                    calculateLine(input);
                    removeCompletionHint(input);
                    return;
                }
            }
            
            // 如果没有提示显示，使用第一个匹配项
            const match = propertyMatches[0];
            const beforeDot = textBeforeCursor.slice(0, -dotMatch[0].length);
            input.value = beforeDot + '.' + match + input.value.substring(cursorPos);
            const newCursorPos = beforeDot.length + match.length + 1;
            input.setSelectionRange(newCursorPos, newCursorPos);
            calculateLine(input);
            return;
        }
    }
    
    // 原有的普通补全逻辑保持不变
    const lastWord = textBeforeCursor.match(/(?:[a-zA-Z0-9]|\*{2})*$/)[0].toLowerCase();
    if (lastWord) {
        const matches = completions.filter(c => 
            c.toLowerCase().startsWith(lastWord)
        );
        
        if (matches.length > 0) {
            const hint = input.parentElement.querySelector('.completion-hint');
            if (hint) {
                const selectedItem = hint.querySelector('.completion-item.selected') || 
                                   hint.querySelector('.completion-item');
                if (selectedItem) {
                    const match = selectedItem.textContent;
                    const beforeWord = textBeforeCursor.slice(0, -lastWord.length);
                    const afterCursor = input.value.substring(cursorPos);
                    
                    if (match.endsWith('(')) {
                        input.value = beforeWord + match + ')' + afterCursor;
                        const newCursorPos = beforeWord.length + match.length;
                        input.setSelectionRange(newCursorPos, newCursorPos);
                    } else {
                        input.value = beforeWord + match + afterCursor;
                        const newCursorPos = beforeWord.length + match.length;
                        input.setSelectionRange(newCursorPos, newCursorPos);
                    }
                    
                    calculateLine(input);
                    removeCompletionHint(input);
                    return;
                }
            }
            
            const match = matches[0];
            const beforeWord = textBeforeCursor.slice(0, -lastWord.length);
            const afterCursor = input.value.substring(cursorPos);
            
            if (match.endsWith('(')) {
                input.value = beforeWord + match + ')' + afterCursor;
                const newCursorPos = beforeWord.length + match.length;
                input.setSelectionRange(newCursorPos, newCursorPos);
            } else {
                input.value = beforeWord + match + afterCursor;
                const newCursorPos = beforeWord.length + match.length;
                input.setSelectionRange(newCursorPos, newCursorPos);
            }
            
            calculateLine(input);
        }
    }
}

function handleAsteriskInput(event, input) {
    const cursorPos = input.selectionStart;
    const textBeforeCursor = input.value.substring(0, cursorPos);
    
    if (textBeforeCursor.endsWith('*')) {
        event.preventDefault();
        const newText = textBeforeCursor.slice(0, -1) + '**()' + input.value.substring(cursorPos);
        input.value = newText;
        input.setSelectionRange(cursorPos + 2, cursorPos + 2);
        calculateLine(input);
    }
}

function handleInput(event) {
    const input = event.target;
    const currentLine = input.closest('.expression-line');
    const lines = document.querySelectorAll('.expression-line');
    const currentIndex = Array.from(lines).indexOf(currentLine);
    
    const cursorPos = input.selectionStart;
    const textBeforeCursor = input.value.substring(0, cursorPos);
    
    removeCompletionHint(input);
    
    // 只在启用补全时显示提示
    if (isCompletionEnabled) {
        // 检查是否是属性函数补全模式
        const dotMatch = textBeforeCursor.match(/\.([a-zA-Z0-9]*)$/);
        if (dotMatch) {
            // 过滤出所有具有 asProperty 属性的函数
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
            const lastWord = textBeforeCursor.match(/(?:[a-zA-Z0-9]|\*\*)*$/)[0].toLowerCase();
            if (lastWord) {
                const matches = completions.filter(c => 
                    c.toLowerCase().startsWith(lastWord)
                );
                
                if (matches.length > 0) {
                    showCompletionHint(input, matches, false);
                }
            }
        }
    }
    
    // 如果时最后一个表达式，则计算当前行
    if (isLastExpression()) {
        // 计算当前行
        calculateLine(input);
    }else{
        // 清空状态并重新计算所有行
        recalculateAllLines();
    }
    
    // 添加点击事件监听器来处理光标移动
    input.addEventListener('click', () => {
        removeCompletionHint(input);
    }, { once: true }); // 使用 once 选项确保事件处理器在触发后被移除
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
        
        // 添加描述信息
        if (FUNCTIONS[match.replace(/[(.]/g, '')]) {
            const desc = document.createElement('span');
            desc.className = 'description';
            desc.textContent = FUNCTIONS[match.replace(/[(.]/g, '')].description;
            desc.style.display = 'none';
            item.appendChild(desc);
        }
        
        if (index === 0) {
            item.classList.add('selected');
            const desc = item.querySelector('.description');
            if (desc) {
                desc.style.display = '';
            }
        }
        
        // 使用新的事件处理方式
        const handler = createCompletionItemHandler(input, match, isPropertyCompletion, item);
        item.addEventListener('click', handler, { once: true });  // 使用 once 选项
        
        list.appendChild(item);
    });
    
    // 添加补全框的清理函数
    const cleanup = () => {
        // 移除所有事件监听器
        hint.querySelectorAll('.completion-item').forEach(item => {
            item.replaceWith(item.cloneNode(true));
        });
        hint.remove();
    };
    
    // 在补全框被移除时清理
    hint.addEventListener('remove', cleanup, { once: true });
    
    hint.appendChild(list);
    document.body.appendChild(hint);
    
    // 计算光标位置
    const cursorPos = input.selectionStart;
    const textBeforeCursor = input.value.substring(0, cursorPos);
    
    // 创建临时元素来测量文本宽度
    const measureEl = document.createElement('span');
    measureEl.style.font = window.getComputedStyle(input).font;
    measureEl.style.visibility = 'hidden';
    measureEl.style.position = 'absolute';
    measureEl.textContent = textBeforeCursor;
    document.body.appendChild(measureEl);
    
    // 获取光标位置
    const textWidth = measureEl.offsetWidth;
    document.body.removeChild(measureEl);
    
    // 获取输入框的位置信息
    const inputRect = input.getBoundingClientRect();
    const scrollLeft = input.scrollLeft;
    
    // 设置提示框位置
    const cursorX = inputRect.left + textWidth - scrollLeft;
    const cursorY = inputRect.top + inputRect.height;
    
    // 调整提示框位置，确保不超出视窗
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let left = cursorX;
    let top = cursorY;
    
    // 如果提示框会超出右边界，向左偏移
    if (left + hint.offsetWidth > viewportWidth) {
        left = viewportWidth - hint.offsetWidth - 10;
    }
    
    // 如果提示框会超出底部，显示在输入框上方
    if (top + hint.offsetHeight > viewportHeight) {
        top = inputRect.top - hint.offsetHeight;
    }
    
    hint.style.position = 'fixed';
    hint.style.left = `${left}px`;
    hint.style.top = `${top}px`;
}

// 3. 修改 removeCompletionHint 函数
function removeCompletionHint(input) {
    document.querySelectorAll('.completion-hint').forEach(hint => {
        // 触发清理事件
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
    
    // 确保只使用函数名部分，不包含描述
    const completionText = match.split(/\s+/)[0];  // 只取第一部分（函数名）
    
    if (isPropertyCompletion) {
        // 属性函数补全
        const dotMatch = textBeforeCursor.match(/\.([a-zA-Z0-9]*)$/);
        if (dotMatch) {
            const beforeDot = textBeforeCursor.slice(0, -dotMatch[0].length);
            input.value = beforeDot + '.' + completionText + afterCursor;
            const newCursorPos = beforeDot.length + completionText.length + 1;
            input.setSelectionRange(newCursorPos, newCursorPos);
        }
    } else {
        // 普通函数补全
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
    // 临时保存补全状态
    const originalCompletionState = isCompletionEnabled;
    // 临时禁用补全
    isCompletionEnabled = false;
    
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
    
    // 恢复补全状态
    isCompletionEnabled = originalCompletionState;
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

// 导出所有需要的函数
export {
    calculateLine,
    addNewLine,
    handleLineDelete,
    handleKeyDown,
    handleInput,
    handleTabCompletion,
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
