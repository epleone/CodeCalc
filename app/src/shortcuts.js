export class Shortcuts {
    constructor() {
        this.panel = document.getElementById('shortcuts-panel');
        this.overlay = document.createElement('div');
        this.overlay.className = 'shortcuts-overlay';
        document.body.appendChild(this.overlay);
        
        // 添加蒙版点击事件
        this.overlay.addEventListener('click', () => {
            this.togglePanel();
        });
        
        // 添加 ESC 键监听
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isPanelVisible) {
                this.togglePanel();
            }
        });
    }
    
    togglePanel() {
        this.isPanelVisible = !this.isPanelVisible;
        if (this.isPanelVisible) {
            // 如果设置面板打开，先关闭它
            if (window.settings.isPanelVisible) {
                window.settings.togglePanel();
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

// 添加快捷键支持，Ctrl + / 打开快捷键面板
document.addEventListener('keydown', (e) => {
    // 检查是否是 Ctrl + / 组合键
    const isCtrlSlash = e.ctrlKey && e.code === 'Slash';
    // 检查是否是 Command + / 组合键（MacOS）
    const isCmdSlash = e.metaKey && e.code === 'Slash';
    
    if (isCtrlSlash || isCmdSlash) {
        e.preventDefault();
        e.stopPropagation();
        shortcuts.togglePanel();
    }
});

// 导出切换面板的函数
window.toggleShortcutsPanel = () => shortcuts.togglePanel();

// 创建实例
export const shortcuts = new Shortcuts(); 