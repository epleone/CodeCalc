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
                e.preventDefault();
                e.stopPropagation();
                this.tooltipIcon.classList.remove('clicked');
                this.togglePanel();
            }
        });
        
        // 添加 toCNToggle 切换监听器
        this.initToggleListeners();
    }
    
    // 初始化设置项的监听器
    initToggleListeners() {
        // 监听 toCNToggle 的变化
        const toCNToggle = document.getElementById('toCNToggle');
        if (toCNToggle) {
            toCNToggle.addEventListener('change', () => {
                // 当开关状态改变时，重新计算所有行
                window.recalculateAllLines();
            });
        }
    }
    
    togglePanel() {
        this.isPanelVisible = !this.isPanelVisible;
        if (this.isPanelVisible) {
            // 使用全局 window.snapshot 替代导入的 snapshot
            if (window.snapshot.isPanelVisible) {
                window.snapshot.togglePanel();
            }
            // 移除当前焦点
            if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
            this.panel.classList.add('show');
            this.overlay.classList.add('show');
            document.body.style.overflow = 'hidden';
        } else {
            this.panel.classList.remove('show');
            this.overlay.classList.remove('show');
            document.body.style.overflow = '';
            // 退出面板，聚焦输入框
            const inputs = document.querySelectorAll('.input');
            if (inputs.length > 0) {
                inputs[inputs.length - 1].focus();
            }
        }
    }
}

// 添加快捷键支持，Ctrl + P 打开设置页面
document.addEventListener('keydown', (e) => {
    const isCtrlP = (utools.isMacOS() ? e.metaKey : e.ctrlKey) && e.code === 'KeyP';

    if (isCtrlP) {
        e.preventDefault();
        settings.togglePanel();
    }
});

// 导出切换面板的函数
window.toggleSettingsPanel = () => settings.togglePanel(); 