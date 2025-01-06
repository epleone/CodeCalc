// 错误导航功能
export const ErrorNavigation = {
    currentErrorIndex: -1,
    errorCases: [],

    init() {
        // 添加样式
        if (!document.getElementById('error-nav-style')) {
            const style = document.createElement('style');
            style.id = 'error-nav-style';
            style.textContent = `
                .next-error-btn {
                    position: fixed;
                    right: 20px;
                    bottom: 20px;
                    padding: 10px 20px;
                    background-color: #dc3545;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                    z-index: 1000;
                    display: none;
                }

                .next-error-btn:hover {
                    background-color: #c82333;
                }

                .next-error-btn.show {
                    display: block;
                }

                .test-case.highlight {
                    border: 2px solid #dc3545;
                    animation: highlight 1s ease-in-out;
                }

                @keyframes highlight {
                    0% { background-color: #fff; }
                    50% { background-color: #ffe6e6; }
                    100% { background-color: #fff; }
                }
            `;
            document.head.appendChild(style);
        }

        // 添加按钮
        if (!document.getElementById('nextErrorBtn')) {
            const btn = document.createElement('button');
            btn.id = 'nextErrorBtn';
            btn.className = 'next-error-btn';
            btn.innerHTML = '下一个错误<span id="errorCount"></span>';
            document.body.appendChild(btn);
            btn.addEventListener('click', () => this.scrollToNextError());
        }
    },

    updateErrorButton() {
        const btn = document.getElementById('nextErrorBtn');
        const countSpan = document.getElementById('errorCount');
        
        if (this.errorCases.length > 0) {
            btn.classList.add('show');
            countSpan.textContent = ` (${this.currentErrorIndex + 1}/${this.errorCases.length})`;
        } else {
            btn.classList.remove('show');
        }
    },

    scrollToNextError() {
        if (this.errorCases.length === 0) return;
        
        // 移除之前的高亮
        document.querySelectorAll('.test-case.highlight').forEach(el => {
            el.classList.remove('highlight');
        });

        // 更新索引
        this.currentErrorIndex = (this.currentErrorIndex + 1) % this.errorCases.length;
        
        // 高亮并滚动到下一个错误
        const errorCase = this.errorCases[this.currentErrorIndex];
        errorCase.classList.add('highlight');
        errorCase.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // 更新按钮文本
        this.updateErrorButton();
    },

    reset() {
        this.errorCases = [];
        this.currentErrorIndex = -1;
        this.updateErrorButton();
    },

    addErrorCase(element) {
        this.errorCases.push(element);
        this.updateErrorButton();
    }
}; 