import { OPERATORS, FUNCTIONS, CONSTANTS } from './operators.js';

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

// 生成触发字符集和补全列表
const triggerChars = generateTriggerChars();
const completions = generateCompletions();

// 全局变量
let isCompletionEnabled = true;
let hasUsedArrowKeys = false;
let completionHideTimer;

// 显示补全提示
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

// 移除补全提示
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

// 导航补全选项
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

// 应用选中的补全项
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

// 创建补全项的点击处理函数
function createCompletionItemHandler(input, match, isPropertyCompletion, item) {
    return function handler(event) {
        applyCompletion(input, match, isPropertyCompletion);
        item.removeEventListener('click', handler);
        removeCompletionHint(input);
    };
}

// 应用补全
function applyCompletion(input, match, isPropertyCompletion) {
    const cursorPos = input.selectionStart;
    const textBeforeCursor = input.value.substring(0, cursorPos);
    const afterCursor = input.value.substring(cursorPos);
    
    const completionText = match.split(/\s+/)[0];
    
    if (isPropertyCompletion) {
        const dotMatch = textBeforeCursor.match(/\.([a-zA-Z0-9]*)$/);
        if (dotMatch) {
            const beforeDot = textBeforeCursor.slice(0, -dotMatch[0].length);
            input.value = beforeDot + '.' + completionText + afterCursor;
            const newCursorPos = beforeDot.length + completionText.length + 1;
            input.setSelectionRange(newCursorPos, newCursorPos);
        }
    } else {
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
    
    input.dispatchEvent(new Event('input'));
    removeCompletionHint(input);
}

// 启动隐藏计时器
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

// 检查并显示补全提示
function checkCompletion(input) {
    const cursorPos = input.selectionStart;
    const textBeforeCursor = input.value.substring(0, cursorPos);

    // 检查是否需要显示补全提示
    const dotMatch = textBeforeCursor.match(/\.([a-zA-Z0-9]*)$/);
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

export {
    triggerChars,
    completions,
    isCompletionEnabled,
    hasUsedArrowKeys,
    showCompletionHint,
    removeCompletionHint,
    navigateCompletion,
    applySelectedCompletion,
    checkCompletion
};
