class Snapshot {
    constructor() {
        this.panel = document.getElementById('snapshot-panel');
        this.list = this.panel.querySelector('.snapshot-list');
        this.isPanelVisible = false;
        this.snapshots = []; // 存储所有快照
        this.selectedSnapshots = new Set(); // 添加选中快照的集合
        
        // 创建蒙版元素
        this.overlay = document.createElement('div');
        this.overlay.className = 'snapshot-overlay';
        document.body.appendChild(this.overlay);
        
        // 添加蒙版点击事件
        this.overlay.addEventListener('click', () => {
            this.togglePanel();
        });
        
        // 获取底部删除按钮
        this.deleteButton = this.panel.querySelector('.clear-snapshot-btn');
        
        // 修改删除按钮点击事件
        this.deleteButton.onclick = (e) => {
            // 如果按钮处于非激活状态，不执行任何操作
            if (!this.deleteButton.classList.contains('active')) {
                return;
            }
            
            if (this.selectedSnapshots.size > 0) {
                this.deleteSelected();
            } else {
                this.clearSnapshots();
            }
        };

        // 添加 ESC 键监听
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isPanelVisible) {
                this.togglePanel();
            }
        });

        // 尝试从 localStorage 加载历史快照
        this.loadSnapshots();
        
        // 初始化删除按钮状态
        this.updateDeleteButton();
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
        
        // 只有当有计算记录时才创建快照
        if (state.length > 0) {
            const snapshot = {
                timestamp: new Date().toISOString(), // 使用 ISO 格式便于存储和解析
                records: state,
                json: JSON.stringify(state) // 添加 JSON 格式的记录
            };
            
            this.snapshots.unshift(snapshot);
            this.saveSnapshots(); // 保存到 localStorage
            this.renderList();
        }
    }
    
    // 清空快照面板
    clearSnapshots() {
        this.snapshots = [];
        this.selectedSnapshots.clear();
        this.list.innerHTML = '';
        localStorage.removeItem('calculatorSnapshots');
        this.updateDeleteButton();
    }
    
    // 渲染快照列表
    renderList() {
        this.list.innerHTML = '';
        this.snapshots.forEach((snapshot, index) => {
            const snapshotElement = document.createElement('div');
            snapshotElement.className = 'snapshot-group collapsed';
            
            // 添加复选框
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'snapshot-checkbox';
            checkbox.checked = this.selectedSnapshots.has(snapshot.timestamp);
            checkbox.onclick = (e) => {
                e.stopPropagation(); // 防止触发折叠/展开
                this.toggleSelection(snapshot.timestamp);
            };
            
            const headerContainer = document.createElement('div');
            headerContainer.className = 'snapshot-header';
            
            // 添加展开/折叠图标
            const toggleIcon = document.createElement('span');
            toggleIcon.className = 'toggle-icon';
            toggleIcon.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16">
                    <path d="M7 10l5 5 5-5z" fill="currentColor"/>
                </svg>
            `;
            
            // 添加时间标题
            const timeHeader = document.createElement('div');
            timeHeader.className = 'snapshot-time';
            timeHeader.textContent = this.formatTime(new Date(snapshot.timestamp));
            
            // 添加应用按钮
            const applyButton = document.createElement('button');
            applyButton.className = 'apply-snapshot-btn';
            applyButton.innerHTML = `
                <svg viewBox="0 0 24 24" width="14" height="14">
                    <path d="M13 3c-4.97 0-9 4.03-9 9H1l4 3.99L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9" fill="currentColor"/>
                </svg>
            `;
            applyButton.title = '恢复此快照';
            applyButton.onclick = (e) => {
                e.stopPropagation();
                this.applySnapshot(snapshot.records);
            };
            
            // 更新头部组装顺序
            headerContainer.appendChild(checkbox);
            headerContainer.appendChild(toggleIcon);
            headerContainer.appendChild(timeHeader);
            headerContainer.appendChild(applyButton);
            
            // 添加内容容器
            const contentContainer = document.createElement('div');
            contentContainer.className = 'snapshot-content';
            
            // 添加表达式和结果
            snapshot.records.forEach(record => {
                const itemElement = document.createElement('div');
                itemElement.className = 'snapshot-item';
                itemElement.innerHTML = `
                    <div class="snapshot-expression">${record.expression}</div>
                    <div class="snapshot-result">${record.result}</div>
                `;
                contentContainer.appendChild(itemElement);
            });
            
            // 添加点击展开/折叠功能
            headerContainer.addEventListener('click', () => {
                snapshotElement.classList.toggle('collapsed');
            });
            
            snapshotElement.appendChild(headerContainer);
            snapshotElement.appendChild(contentContainer);
            this.list.appendChild(snapshotElement);
        });
        
        // 更新删除按钮显示状态
        this.updateDeleteButton();
    }
    
    // 保存快照到 localStorage
    saveSnapshots() {
        try {
            localStorage.setItem('calculatorSnapshots', JSON.stringify(this.snapshots));
        } catch (e) {
            console.warn('Failed to save snapshots to localStorage:', e);
        }
    }
    
    // 从 localStorage 加载快照
    loadSnapshots() {
        try {
            const saved = localStorage.getItem('calculatorSnapshots');
            if (saved) {
                this.snapshots = JSON.parse(saved);
                this.renderList();
            }
        } catch (e) {
            console.warn('Failed to load snapshots from localStorage:', e);
        }
    }
    
    // 格式化时间
    formatTime(date) {
        const now = new Date();
        
        // 如果是今天的快照
        if (date.toDateString() === now.toDateString()) {
            return `今天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        }
        
        // 如果是昨天的快照
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
            return `昨天 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
        }
        
        // 其他日期
        return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    // 切换快照面板显示状态
    togglePanel() {
        this.isPanelVisible = !this.isPanelVisible;
        if (this.isPanelVisible) {
            this.panel.classList.add('show');
            this.overlay.classList.add('show');
            document.body.style.overflow = 'hidden'; // 防止背景滚动
        } else {
            this.panel.classList.remove('show');
            this.overlay.classList.remove('show');
            document.body.style.overflow = ''; // 恢复背景滚动
        }
        this.panel.style.right = this.isPanelVisible ? '0' : '-300px';
    }
    
    // 切换选中状态
    toggleSelection(timestamp) {
        if (this.selectedSnapshots.has(timestamp)) {
            this.selectedSnapshots.delete(timestamp);
        } else {
            this.selectedSnapshots.add(timestamp);
        }
        this.updateDeleteButton();
    }
    
    // 更新删除按钮状态
    updateDeleteButton() {
        if (this.selectedSnapshots.size > 0) {
            this.deleteButton.classList.add('active');
            this.deleteButton.innerHTML = `
                <svg class="delete-icon" viewBox="0 0 24 24" width="18" height="18">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                </svg>
                删除所选 (${this.selectedSnapshots.size})
            `;
        } else {
            this.deleteButton.classList.remove('active');
            this.deleteButton.innerHTML = `
                <svg class="delete-icon" viewBox="0 0 24 24" width="18" height="18">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="currentColor"/>
                </svg>
                删除
            `;
        }
    }
    
    // 删除选中的快照
    deleteSelected() {
        this.snapshots = this.snapshots.filter(
            snapshot => !this.selectedSnapshots.has(snapshot.timestamp)
        );
        this.selectedSnapshots.clear();
        this.saveSnapshots();
        this.renderList();
    }
    
    // 应用快照
    applySnapshot(records) {
        // 清除所有现有输入
        const lines = document.querySelectorAll('.expression-line');
        lines.forEach(line => {
            const input = line.querySelector('.input');
            if (input) {
                input.value = '';
            }
        });

        // 依次填入快照中的记录
        records.forEach((record, index) => {
            if (index >= lines.length) {
                // 如果现有行数不够，添加新行
                window.addNewLine();
            }
            const input = document.querySelectorAll('.expression-line')[index].querySelector('.input');
            input.value = record.expression + ' '; // 在表达式末尾添加空格，以防弹出语法补全
            input.dispatchEvent(new Event('input')); // 触发输入事件以更新计算结果
        });

        // 关闭快照面板
        this.togglePanel();
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