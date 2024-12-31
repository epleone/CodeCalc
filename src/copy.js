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
        // 检查是否有错误状态
        if (this.classList.contains('error')) {
            return; // 如果是错误状态，直接返回不执行复制
        }
        
        const resultValue = this.querySelector('.result-value').textContent;
        if (resultValue.trim()) {
            copyToClipboard(resultValue);
        }
    });
}

// 为现有的结果元素添加点击处理
document.addEventListener('DOMContentLoaded', function() {
    const results = document.querySelectorAll('.result');
    results.forEach(addResultClickHandler);
}); 