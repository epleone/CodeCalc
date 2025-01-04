// 标签相关函数
export function initializeTagButton(line) {
    const tagButton = line.querySelector('.tag-button');
    tagButton.addEventListener('click', (e) => {
        e.stopPropagation();
        showTagInput(line);
    });
}

export function showTagInput(line) {
    const tagContainer = line.querySelector('.tag-container');
    
    // 如果已经有标签，则预填充
    const existingTag = tagContainer.querySelector('.tag');
    const existingValue = existingTag ? existingTag.textContent : '';
    
    // 创建输入框
    const inputContainer = document.createElement('div');
    inputContainer.className = 'tag-input-container active';
    inputContainer.innerHTML = `
        <input type="text" class="tag-input" placeholder="输入标签" value="${existingValue}">
    `;
    
    tagContainer.appendChild(inputContainer);
    
    const input = inputContainer.querySelector('.tag-input');
    input.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    input.focus();
    
    // 处理输入事件
    input.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
            e.preventDefault();
            const value = input.value.trim();
            if (value) {
                setTag(line, value);
            }
            inputContainer.remove();
        } else if (e.key === 'Escape') {
            inputContainer.remove();
        }
    });
    
    // 处理失焦事件
    input.addEventListener('blur', () => {
        setTimeout(() => {
            if (document.activeElement !== input) {
                inputContainer.remove();
            }
        }, 300);
    });
}

export function setTag(line, tagText) {
    const tagContainer = line.querySelector('.tag-container');
    const tagButton = tagContainer.querySelector('.tag-button');
    
    // 移除现有标签
    const existingTag = tagContainer.querySelector('.tag');
    if (existingTag) {
        existingTag.remove();
    }
    
    // 创建新标签
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.textContent = tagText;
    tag.title = tagText;
    
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
}

// 导出创建标签容器的HTML
export function createTagContainerHTML() {
    return `
        <div class="tag-container">
            <button class="tag-button" title="添加标签">
                <span class="tag-icon">#</span>
            </button>
        </div>
    `;
} 