class History {
    constructor() {
        this.panel = document.getElementById('history-panel');
        this.list = this.panel.querySelector('.history-list');
        this.isPanelVisible = false;

        // 添加 ESC 键监听
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isPanelVisible) {
                this.togglePanel();
            }
        });
    }
    
    // 保存当前页面所有表达式的状态
    saveCurrentState() {
        const lines = document.querySelectorAll('.expression-line');
        const state = Array.from(lines).map(line => {
            const input = line.querySelector('.input');
            const result = line.querySelector('.result-value');
            return {
                expression: input.value,
                result: result.textContent
            };
        }).filter(item => item.expression.trim() !== ''); // 过滤掉空行
        
        this.renderList(state);
    }
    
    // 清空历史面板
    clearHistory() {
        this.list.innerHTML = '';
    }
    
    // 切换历史面板显示状态
    togglePanel() {
        this.isPanelVisible = !this.isPanelVisible;
        if (this.isPanelVisible) {
            this.panel.classList.add('show');  // 添加 show 类
        } else {
            this.panel.classList.remove('show');  // 移除 show 类
        }
        this.panel.style.right = this.isPanelVisible ? '0' : '-300px';
    }
    
    // 渲染历史记录列表
    renderList(state) {
        this.list.innerHTML = '';
        state.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'history-item';
            itemElement.innerHTML = `
                <div class="history-expression">${item.expression}</div>
                <div class="history-result">${item.result}</div>
            `;
            this.list.appendChild(itemElement);
        });
    }
}

export const history = new History();

// 添加快捷键支持
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'h') {
        e.preventDefault();
        history.togglePanel();
    }
}); 