// 复制到剪贴板的功能
window.copyToClipboard = function(text) {
    // 创建临时文本区域
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
        showCopyNotification();
    } catch (err) {
        console.error('复制失败:', err);
    }
    
    document.body.removeChild(textarea);
}

window.showCopyNotification = function() {
    const notification = document.querySelector('.copy-notification');
    notification.classList.add('show');
    
    // 1秒后隐藏提示
    setTimeout(() => {
        notification.classList.remove('show');
    }, 1000);
}

// 为结果添加点击事件处理
window.addResultClickHandler = function(resultElement) {
    resultElement.addEventListener('click', function() {
        // 如果已经在复制状态，直接返回
        if (this.classList.contains('copied') || this.classList.contains('error')) {
            return;
        }
        
        const resultValue = this.querySelector('.result-value').textContent;
        if (resultValue.trim()) {
            copyToClipboard(resultValue);
            
            // 添加已复制状态
            this.classList.add('copied');
            
            // 1.5秒后自动移除复制状态
            setTimeout(() => {
                this.classList.remove('copied');
            }, 1500);
        }
    });
}

// 为现有的结果元素添加点击处理
document.addEventListener('DOMContentLoaded', function() {
    const results = document.querySelectorAll('.result');
    results.forEach(addResultClickHandler);
}); 