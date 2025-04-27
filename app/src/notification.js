// 通知组件
export class Notification {
    constructor() {
        // 不再在构造函数中创建元素
        this.element = null;
    }

    // 清理所有通知元素
    clearAll() {
        const notifications = document.querySelectorAll('.notification');
        notifications.forEach(notification => {
            notification.remove();
        });
    }

    // 显示通知
    show(message, type = 'info', duration = 1000) {
        // 清理所有旧的通知
        this.clearAll();

        // 创建新的通知元素
        this.element = document.createElement('div');
        this.element.className = `notification ${type}`;
        this.element.textContent = message;
        
        // 添加到 body 中
        document.body.appendChild(this.element);
        
        // 设置定时器移除通知
        setTimeout(() => {
            this.element.classList.add('fade-out');
            setTimeout(() => {
                this.element.remove();
                this.element = null;
            }, 300);
        }, duration);
    }

    // 显示信息通知
    info(message, duration = 1000) {
        this.show(message, 'info', duration);
    }

    // 显示警告通知
    warning(message, duration = 1000) {
        this.show(message, 'warning', duration);
    }

    // 显示错误通知
    error(message, duration = 1000) {
        this.show(message, 'error', duration);
    }
}

// 创建全局通知实例
export const notification = new Notification(); 