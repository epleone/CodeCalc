class Snapshot {
    constructor() {
        this.panel = document.getElementById('snapshot-panel');
        this.list = this.panel.querySelector('.snapshot-list');
        this.isPanelVisible = false;

        // 添加 ESC 键监听
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isPanelVisible) {
                this.togglePanel();
            }
        });
    }
    
    // 保存当前页面所有表达式的状态
    takeSnapshot() {
        const lines = document.querySelectorAll('.expression-line');
        const state = Array.from(lines).map(line => {
            const input = line.querySelector('.input');
            const result = line.querySelector('.result-value');
            return {
                expression: input.value,
                result: result.textContent
            };
        }).filter(item => item.expression.trim() !== '');
        
        this.renderList(state);
    }
    
    // 清空快照面板
    clearSnapshots() {
        this.list.innerHTML = '';
    }
    
    // 切换快照面板显示状态
    togglePanel() {
        this.isPanelVisible = !this.isPanelVisible;
        if (this.isPanelVisible) {
            this.panel.classList.add('show');
        } else {
            this.panel.classList.remove('show');
        }
        this.panel.style.right = this.isPanelVisible ? '0' : '-300px';
    }
    
    // 渲染快照列表
    renderList(state) {
        this.list.innerHTML = '';
        state.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'snapshot-item';
            itemElement.innerHTML = `
                <div class="snapshot-expression">${item.expression}</div>
                <div class="snapshot-result">${item.result}</div>
            `;
            this.list.appendChild(itemElement);
        });
    }
}

export const snapshot = new Snapshot();
export { Snapshot }; 

// 添加快捷键支持
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'h') {
        e.preventDefault();
        snapshot.togglePanel();
    }
}); 