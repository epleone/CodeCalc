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
            
            // 添加复制按钮
            const copyButton = document.createElement('button');
            copyButton.className = 'copy-json-btn';
            copyButton.innerHTML = `
                <svg viewBox="0 0 24 24" width="14" height="14">
                    <path d="M16 1H4C2.9 1 2 1.9 2 3v14h2V3h12V1zm3 4H8C6.9 5 6 5.9 6 7v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="currentColor"/>
                </svg>
            `;
            copyButton.title = '复制 JSON';
            copyButton.onclick = (e) => {
                e.stopPropagation();
                this.copyToClipboard(snapshot.json);
            };
            
            // 更新头部组装顺序
            headerContainer.appendChild(checkbox);
            headerContainer.appendChild(toggleIcon);
            headerContainer.appendChild(timeHeader);
            headerContainer.appendChild(copyButton);
            
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
    
    // 复制到剪贴板
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            // 显示复制成功提示
            const notification = document.querySelector('.copy-notification');
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
            }, 2000);
        });
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