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

function calculateLine(input) {
    const resultContainer = input.parentElement.querySelector('.result-container');
    const result = resultContainer.querySelector('.result');
    const messageIcon = resultContainer.querySelector('.message-icon');
    const messageText = messageIcon.querySelector('.message-text');
    const expression = input.value.trim();
    
    // 清除所有状态
    function clearState() {
        result.innerHTML = '<span class="result-value"></span>';
        result.classList.remove('has-input', 'has-value', 'warning', 'error', 'success');
        messageIcon.style.display = 'none';
    }

    // 设置状态
    function setState(value, type, message) {
        result.innerHTML = `<span class="result-value">${value}</span>`;
        result.classList.remove('warning', 'error', 'success');  // 先移除所有状态
        result.classList.add('has-value', type);  // 再添加新状态
        messageIcon.className = `message-icon ${type}`;
        messageIcon.style.display = 'inline';
        messageText.textContent = message;
    }

    // 设置正常结果
    function setNormalState(value) {
        result.innerHTML = `<span class="result-value">${value}</span>`;
        result.classList.remove('warning', 'error', 'success');  // 确保移除所有特殊状态
        result.classList.add('has-value');
        messageIcon.style.display = 'none';
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
            } else if (value.success) {
                setState(value.value, 'success', value.success);
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
    
    const lastWord = textBeforeCursor.match(/(?:[a-zA-Z0-9]|\*{2})*$/)[0].toLowerCase();
    
    removeCompletionHint(input);
    
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