window.exports = {
    "realtime-calculator": {
        mode: "none",
        args: {
            enter: (action) => {
                // 插件装载时的代码
                document.querySelector('.input').focus();
            }
        }
    }
} 