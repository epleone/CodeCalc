import Calculator from './calculator.js';
import { OPERATORS, FUNCTIONS, CONSTANTS } from './operators.js';
import * as Tag from './tag.js';
import * as Snapshot from './snapshot.js';
import * as Settings from './settings.js';
import {
    triggerChars,
    completions,
    isCompletionEnabled,
    showCompletionHint,
    removeCompletionHint,
    navigateCompletion,
    applySelectedCompletion,
    checkCompletion
} from './completion.js';

document.addEventListener('DOMContentLoaded', function() {
    initializeUI();
});

function addNewLine() {
    const container = document.getElementById('expression-container');
    const lines = document.querySelectorAll('.expression-line');
    const newLine = document.createElement('div');
    newLine.className = 'expression-line';
    
    // 确保行之间有正确的间距
    if (lines.length > 0) {
        newLine.style.marginTop = '10px';  // 或者其他合适的值
    }
    
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
    
    const input = newLine.querySelector('.input');
    input.focus();
}

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
    const hint = document.querySelector('.completion-hint');

    // 处理补全相关的按键
    if (hint) {
        switch (event.key) {
            case 'ArrowUp':
            case 'ArrowDown':
                if (isCompletionEnabled) {
                    event.preventDefault();
                    navigateCompletion(event.key === 'ArrowUp' ? 'prev' : 'next');
                    return;
                }
                break;

            case 'Enter':
                if (isCompletionEnabled && hint.querySelector('.completion-item.selected')) {
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
                setTimeout(() => checkCompletion(input), 0);
            }
            break;
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

function initializeUI() {
    // 初始化所有行的标签功能
    document.querySelectorAll('.expression-line').forEach(line => {
        Tag.initializeTagButton(line);
    });

    // 添加容器点击事件监听
    document.getElementById('expression-container')
        .addEventListener('click', handleContainerClick);

    // 添加消息图标点击事件监听
    document.querySelectorAll('.message-icon').forEach(icon => {
        icon.addEventListener('click', handleMessageIconClick);
    });

    // 将标签和快照相关函数添加到全局作用域
    Object.assign(window, Tag);
    Object.assign(window, Snapshot);
}

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

function clearAll() {
    const container = document.getElementById('expression-container');
    
    // 不使用克隆，而是创建新的行
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
    
    // 清空容器并添加新行
    container.innerHTML = '';
    container.appendChild(newLine);
    
    // 获取新行的元素
    const input = newLine.querySelector('.input');
    const result = newLine.querySelector('.result');
    const messageIcon = newLine.querySelector('.message-icon');
    
    // 清空输入和结果
    input.value = '';
    result.innerHTML = '<span class="result-value"></span>';
    result.classList.remove('has-input', 'has-value', 'warning', 'error', 'info');
    
    // 隐藏消息图标并重置其状态
    messageIcon.style.display = 'none';
    messageIcon.className = 'message-icon';
    messageIcon.querySelector('.message-text').innerHTML = '';

    // 移除补全提示框
    removeCompletionHint(input);

    // 清除计算缓存
    Calculator.clearAllCache();
    
    // 初始化标签功能
    Tag.initializeTagButton(newLine);
    
    // 为新行的结果添加点击处理
    const newResult = newLine.querySelector('.result');
    addResultClickHandler(newResult);
    
    // 聚焦到输入框
    input.focus();
}

// 处理容器点击事件
function handleContainerClick(event) {
    if (!event.target.classList.contains('input')) {
        const lines = document.querySelectorAll('.expression-line');
        const lastLine = lines[lines.length - 1];
        const input = lastLine.querySelector('.input');
        input.focus();
    }
}

// 处理消息图标点击事件
function handleMessageIconClick(event) {
    const messageIcon = event.target.closest('.message-icon');
    if (messageIcon) {
        const messageText = messageIcon.querySelector('.message-text');
        messageText.classList.toggle('show');
    }
}

// 为结果添加点击处理
function addResultClickHandler(result) {
    result.addEventListener('click', function() {
        const resultValue = result.querySelector('.result-value').textContent;
        if (resultValue) {
            const lines = document.querySelectorAll('.expression-line');
            const lastLine = lines[lines.length - 1];
            const lastInput = lastLine.querySelector('.input');
            
            if (lastInput.value.trim() === '') {
                lastInput.value = resultValue;
                lastInput.dispatchEvent(new Event('input'));
            } else {
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
                
                document.getElementById('expression-container').appendChild(newLine);
                
                // 初始化标签功能
                Tag.initializeTagButton(newLine);
                
                // 为新行的结果添加点击处理
                const newResult = newLine.querySelector('.result');
                addResultClickHandler(newResult);
                
                const input = newLine.querySelector('.input');
                input.value = resultValue;
                input.dispatchEvent(new Event('input'));
                input.focus();
            }
        }
    });
}

// 将所有需要的函数添加到全局作用域
Object.assign(window, {
    // UI 事件处理函数
    handleInput,
    handleKeyDown,
    handleContainerClick,
    handleMessageIconClick,
    removeCompletionHint,
    
    // 计算相关函数
    calculateLine,
    addNewLine,
    handleLineDelete,
    handleAsteriskInput,
    clearAll,
    
    // 初始化函数
    initializeUI,
    
    // 快照相关函数
    toggleSnapshotPanel: function() {
        Snapshot.snapshot.togglePanel();
    }
});

// 导出函数供模块使用
export {
    calculateLine,
    addNewLine,
    handleLineDelete,
    handleKeyDown,
    handleInput,
    handleAsteriskInput,
    clearAll,
    handleContainerClick,
    handleMessageIconClick,
    initializeUI
};
