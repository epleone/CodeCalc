let tooltipTimer;
let currentTooltip;

function createTooltip(text, x, y) {
    if (currentTooltip) {
        currentTooltip.remove();
    }
    
    const tooltip = document.createElement('div');
    tooltip.className = 'tag-tooltip';
    tooltip.textContent = text;
    document.body.appendChild(tooltip);
    
    const rect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let finalX = Math.min(x, viewportWidth - rect.width - 20);
    let finalY = Math.min(y, viewportHeight - rect.height - 20);
    
    tooltip.style.left = `${finalX}px`;
    tooltip.style.top = `${finalY}px`;
    
    requestAnimationFrame(() => {
        tooltip.classList.add('active');
    });
    
    currentTooltip = tooltip;
    return tooltip;
}

// 标签相关函数
export function initializeTagButton(line) {
    const tagButton = line.querySelector('.tag-button');
    tagButton.addEventListener('click', (e) => {
        e.stopPropagation();
        showTagInput(line);
    });
    
    tagButton.addEventListener('mouseenter', (e) => {
        if (tooltipTimer) clearTimeout(tooltipTimer);
        
        tooltipTimer = setTimeout(() => {
            const rect = tagButton.getBoundingClientRect();
            createTooltip('添加标签', rect.right + 5, rect.bottom + 5);
        }, 300);
    });
    
    tagButton.addEventListener('mouseleave', () => {
        if (tooltipTimer) {
            clearTimeout(tooltipTimer);
        }
        if (currentTooltip) {
            currentTooltip.remove();
            currentTooltip = null;
        }
    });
}

export function showTagInput(line) {
    const tagContainer = line.querySelector('.tag-container');
    
    // 如果已经有标签，则预填充
    const existingTag = tagContainer.querySelector('.tag');
    const existingValue = existingTag ? existingTag.textContent : '';
    
    // 移除已存在的输入框（如果有的话）
    const existingInput = tagContainer.querySelector('.tag-input-container');
    if (existingInput) {
        existingInput.remove();
    }
    
    // 创建输入框
    const inputContainer = document.createElement('div');
    inputContainer.className = 'tag-input-container active';
    inputContainer.innerHTML = `
        <input type="text" class="tag-input" placeholder="输入标签" value="${existingValue}">
    `;
    
    // 如果存在标签，暂时隐藏它
    if (existingTag) {
        existingTag.style.display = 'none';
    }
    
    // 阻止事件冒泡
    inputContainer.addEventListener('mousedown', (e) => {
        e.stopPropagation();
    });
    
    inputContainer.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    tagContainer.appendChild(inputContainer);
    
    const input = inputContainer.querySelector('.tag-input');
    
    // 选中输入框中的所有文本
    requestAnimationFrame(() => {
        input.focus();
        input.select();
    });
    
    let isProcessing = false;
    
    const closeInput = (shouldRestoreTag = true) => {
        if (isProcessing) return;
        isProcessing = true;
        
        if (shouldRestoreTag && existingTag) {
            existingTag.style.display = 'inline-flex';
        }
        inputContainer.remove();
        
        setTimeout(() => {
            isProcessing = false;
        }, 100);
    };
    
    // 处理输入事件
    input.addEventListener('keydown', (e) => {
        e.stopPropagation();
        
        if (e.key === 'Enter') {
            e.preventDefault();
            const value = input.value.trim();
            if (value) {
                setTag(line, value);
                closeInput(false);
            } else {
                closeInput(true);
            }
        } else if (e.key === 'Escape') {
            closeInput(true);
        }
    });
    
    // 处理失焦事件
    let blurTimeout;
    input.addEventListener('blur', (e) => {
        if (blurTimeout) {
            clearTimeout(blurTimeout);
        }
        
        // 使用较短的延迟，但要确保不会立即触发
        blurTimeout = setTimeout(() => {
            // 检查当前焦点是否在输入框容器内
            if (!inputContainer.contains(document.activeElement)) {
                closeInput(true);
            }
        }, 50);
    });
}

export function setTag(line, tagText) {
    const tagContainer = line.querySelector('.tag-container');
    const tagButton = tagContainer.querySelector('.tag-button');
    
    // 如果传入空值，则清除标签
    if (!tagText) {
        const existingTag = tagContainer.querySelector('.tag');
        if (existingTag) {
            existingTag.remove();
        }
        tagButton.style.display = 'flex';
        return;
    }
    
    // 移除现有标签
    const existingTag = tagContainer.querySelector('.tag');
    if (existingTag) {
        existingTag.remove();
    }
    
    // 创建新标签
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.textContent = tagText;
    
    // 替换按钮为标签
    tagButton.style.display = 'none';
    tagContainer.appendChild(tag);
    
    // 点击标签事件处理
    tag.addEventListener('click', (e) => {
        // 检查点击位置是否在删除按钮区域
        const rect = tag.getBoundingClientRect();
        const isClickOnDelete = e.clientX > rect.right - 24;  // 24px 是删除按钮的区域宽度
        
        if (isClickOnDelete) {
            // 点击删除按钮
            e.stopPropagation();
            tag.remove();
            tagButton.style.display = 'flex';
        } else {
            // 点击标签其他区域进行编辑
            showTagInput(line);
        }
    });
    
    tag.addEventListener('mouseenter', (e) => {
        if (tooltipTimer) clearTimeout(tooltipTimer);
        
        tooltipTimer = setTimeout(() => {
            const rect = tag.getBoundingClientRect();
            createTooltip('点击编辑标签', rect.right + 5, rect.bottom + 5);
        }, 300);
    });
    
    tag.addEventListener('mouseleave', () => {
        if (tooltipTimer) {
            clearTimeout(tooltipTimer);
        }
        if (currentTooltip) {
            currentTooltip.remove();
            currentTooltip = null;
        }
    });
}

// 添加恢复标签的接口
export function restoreTag(line, tagText) {
    if (!tagText) return;
    
    const tagContainer = line.querySelector('.tag-container');
    if (!tagContainer) return;
    
    // 清除现有标签和输入框
    const existingTag = tagContainer.querySelector('.tag');
    const existingInput = tagContainer.querySelector('.tag-input-container');
    if (existingTag) existingTag.remove();
    if (existingInput) existingInput.remove();
    
    // 显示标签按钮（因为 setTag 需要它可见）
    const tagButton = tagContainer.querySelector('.tag-button');
    tagButton.style.display = 'flex';
    
    // 使用 setTag 设置新标签
    setTag(line, tagText);
}

// 导出创建标签容器的HTML
export function createTagContainerHTML() {
    return `
        <div class="tag-container">
            <button class="tag-button">
                <span class="tag-icon">#</span>
            </button>
        </div>
    `;
}