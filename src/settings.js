export class Settings {
    constructor() {
        this.panel = document.getElementById('settings-panel');
        // console.log('Settings panel element:', this.panel);
        this.overlay = document.createElement('div');
        this.overlay.className = 'settings-overlay';
        document.body.appendChild(this.overlay);
        
        // 添加图标点击效果
        this.tooltipIcon = document.querySelector('.tooltip-icon');
        // console.log('Tooltip icon element:', this.tooltipIcon);
        
        // 直接在图标上添加点击事件
        this.tooltipIcon.onclick = (e) => {
            console.log('Tooltip icon clicked');
            e.preventDefault();
            e.stopPropagation();
            this.tooltipIcon.classList.add('clicked');
            this.togglePanel();
        };
        
        // 添加蒙版点击事件
        this.overlay.addEventListener('click', () => {
            this.tooltipIcon.classList.remove('clicked');
            this.togglePanel();
        });
        
        // 添加 ESC 键监听
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isPanelVisible) {
                this.tooltipIcon.classList.remove('clicked');
                this.togglePanel();
            }
        });
    }
    
    togglePanel() {
        this.isPanelVisible = !this.isPanelVisible;
        if (this.isPanelVisible) {
            // 使用全局 window.snapshot 替代导入的 snapshot
            if (window.snapshot.isPanelVisible) {
                window.snapshot.togglePanel();
            }
            this.panel.classList.add('show');
            this.overlay.classList.add('show');
            document.body.style.overflow = 'hidden';
        } else {
            this.panel.classList.remove('show');
            this.overlay.classList.remove('show');
            document.body.style.overflow = '';
        }
    }
}

// 添加快捷键支持，Ctrl + ` 打开设置页面
document.addEventListener('keydown', (e) => {
    // 使用 Backquote 键代码来检测 ` 键（波浪号键）
    if (e.ctrlKey && e.code === 'Backquote') {
        e.preventDefault();
        settings.togglePanel();
    }
});

// 导出切换面板的函数
window.toggleSettingsPanel = () => settings.togglePanel(); 