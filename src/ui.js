// 添加可补全的函数和操作列表
const completions = [
    'sin(', 'cos(', 'tan(',
    'asin(', 'acos(', 'atan(',
    'log(', 'ln(', 'exp(',
    'sqrt(', 'root(', 'pow(',
    'max(', 'min(',
    'bin(', 'oct(', 'hex(',
    'PI',
    '0b', '0o', '0x',
    '**('
];

// 添加全局变量
let isCompletionEnabled = true;

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
    function setState(value, type, message) {
        result.innerHTML = `<span class="result-value">${value}</span>`;
        result.classList.remove('warning', 'error', 'info');  // 先移除所有状态
        result.classList.add('has-value', type);  // 再添加新状态
        messageIcon.className = `message-icon ${type}`;
        messageIcon.style.display = 'inline';
        messageText.textContent = message;
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
        const value = calculate(expression);
        if (typeof value === 'object') {
            if (value.warning) {
                setState(value.value, 'warning', value.warning);
            } else if (value.info) {
                setState(value.value, 'info', value.info);
            }
        } else {
            setNormalState(value);
        }
    } catch (error) {
        setState('', 'error', error.message);
    }
}

function addNewLine() {
    const container = document.getElementById('expression-container');
    const newLine = document.createElement('div');
    newLine.className = 'expression-line';
    newLine.innerHTML = `
        <input type="text" class="input" placeholder="输入表达式" 
               oninput="handleInput(event)"
               onkeydown="handleKeyDown(event, this)">
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
    
    // 为新行的结果添加点击处理
    const result = newLine.querySelector('.result');
    addResultClickHandler(result);
    
    newLine.querySelector('.input').focus();
}

function handleKeyDown(event, input) {
    const currentLine = input.parentElement;
    
    if (event.key === 'Enter') {
        event.preventDefault();
        
        const expression = input.value.trim();
        const hasExpression = expression !== '';
        
        if (hasExpression) {
            const lines = document.querySelectorAll('.expression-line');
            const isLastLine = input === lines[lines.length - 1].querySelector('.input');
            
            if (isLastLine) {
                addNewLine();
            } else {
                const nextLine = currentLine.nextElementSibling;
                if (nextLine) {
                    nextLine.querySelector('.input').focus();
                }
            }
        }
    } else if (event.key === 'Backspace' && input.value === '') {
        event.preventDefault();
        const previousLine = currentLine.previousElementSibling;
        
        if (previousLine && document.querySelectorAll('.expression-line').length > 1) {
            const previousInput = previousLine.querySelector('.input');
            previousInput.focus();
            previousInput.selectionStart = previousInput.value.length;
            previousInput.selectionEnd = previousInput.value.length;
            
            if (!input.value && !currentLine.querySelector('.result').textContent) {
                currentLine.remove();
            }
        }
    } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        const previousLine = currentLine.previousElementSibling;
        if (previousLine) {
            const previousInput = previousLine.querySelector('.input');
            previousInput.focus();
            const cursorPos = input.selectionStart;
            previousInput.selectionStart = Math.min(cursorPos, previousInput.value.length);
            previousInput.selectionEnd = Math.min(cursorPos, previousInput.value.length);
        }
    } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        const nextLine = currentLine.nextElementSibling;
        if (nextLine) {
            const nextInput = nextLine.querySelector('.input');
            nextInput.focus();
            const cursorPos = input.selectionStart;
            nextInput.selectionStart = Math.min(cursorPos, nextInput.value.length);
            nextInput.selectionEnd = Math.min(cursorPos, nextInput.value.length);
        }
    } else if (event.key === 'Tab') {
        event.preventDefault();
        handleTabCompletion(input);
    } else if (event.key === '*') {
        handleAsteriskInput(event, input);
    }

    removeCompletionHint(input);
}

function handleTabCompletion(input) {
    if (!isCompletionEnabled) return;
    
    const cursorPos = input.selectionStart;
    const textBeforeCursor = input.value.substring(0, cursorPos);
    const lastWord = textBeforeCursor.match(/(?:[a-zA-Z0-9]|\*\*)*$/)[0].toLowerCase();
    
    if (lastWord) {
        const matches = completions.filter(c => 
            c.toLowerCase().startsWith(lastWord)
        );
        
        if (matches.length > 0) {
            const completion = matches[0];
            const beforeWord = textBeforeCursor.slice(0, -lastWord.length);
            const afterCursor = input.value.substring(cursorPos);
            
            if (completion.endsWith('(')) {
                input.value = beforeWord + completion + ')' + afterCursor;
                const newCursorPos = beforeWord.length + completion.length;
                input.setSelectionRange(newCursorPos, newCursorPos);
            } else {
                input.value = beforeWord + completion + afterCursor;
                const newCursorPos = beforeWord.length + completion.length;
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
    const cursorPos = input.selectionStart;
    const textBeforeCursor = input.value.substring(0, cursorPos);
    
    removeCompletionHint(input);
    
    // 只在启用补全时显示提示
    if (isCompletionEnabled) {
        const lastWord = textBeforeCursor.match(/(?:[a-zA-Z0-9]|\*{2})*$/)[0].toLowerCase();
        
        if (lastWord) {
            const matches = completions.filter(c => 
                c.toLowerCase().startsWith(lastWord)
            );
            
            if (matches.length > 0) {
                const completion = matches[0];
                const hint = completion.slice(lastWord.length);
                if (hint) {
                    showCompletionHint(input, textBeforeCursor + hint);
                }
            }
        }
    }
    
    calculateLine(input);
}

function showCompletionHint(input, fullText) {
    const hint = document.createElement('div');
    hint.className = 'completion-hint';
    hint.textContent = fullText;
    input.parentElement.appendChild(hint);
}

function removeCompletionHint(input) {
    const hint = input.parentElement.querySelector('.completion-hint');
    if (hint) {
        hint.remove();
    }
}

function clearAll() {
    const container = document.getElementById('expression-container');
    const firstLine = container.querySelector('.expression-line');
    container.innerHTML = '';
    container.appendChild(firstLine);
    
    const input = firstLine.querySelector('.input');
    const result = firstLine.querySelector('.result');
    const messageIcon = firstLine.querySelector('.message-icon');
    
    input.value = '';
    result.innerHTML = '';
    result.classList.remove('has-input', 'has-value', 'warning', 'error', 'success');
    messageIcon.style.display = 'none';
    
    clearTempConstants();
    
    input.focus();
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

// 添加以下函数
function copyToClipboard(text) {
    // 创建临时文本区域
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
        showCopyNotification();
    } catch (err) {
        console.error('复制失败:', err);
    }
    
    document.body.removeChild(textarea);
}

function showCopyNotification() {
    const notification = document.querySelector('.copy-notification');
    notification.classList.add('show');
    
    // 1秒后隐藏提示
    setTimeout(() => {
        notification.classList.remove('show');
    }, 1000);
}

// 为结果添加点击事件处理
function addResultClickHandler(resultElement) {
    resultElement.addEventListener('click', function() {
        // 检查是否有错误状态
        if (this.classList.contains('error')) {
            return; // 如果是错误状态，直接返回不执行复制
        }
        
        const resultValue = this.querySelector('.result-value').textContent;
        if (resultValue.trim()) {
            copyToClipboard(resultValue);
        }
    });
}

// 为现有的结果元素添加点击处理
document.addEventListener('DOMContentLoaded', function() {
    const results = document.querySelectorAll('.result');
    results.forEach(addResultClickHandler);
}); 

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