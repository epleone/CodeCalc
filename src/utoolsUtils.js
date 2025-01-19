// utools 相关代码保持不变
utools.onPluginEnter(({ code, type, payload }) => {
    if(type == "regex") {
        const inputs = document.querySelectorAll('.input');
        const lastInput = inputs[inputs.length - 1];  // 获取最后一个输入框
        
        // 如果最后一行不为空，则新增一行
        if (lastInput.value.trim() !== '') {
            addNewLine();
            const newInputs = document.querySelectorAll('.input');
            const newLastInput = newInputs[newInputs.length - 1];
            newLastInput.value = payload || "";
            newLastInput.dispatchEvent(new Event('input'));
        } else {
            // 如果最后一行为空，直接在最后一行输入
            lastInput.value = payload || "";
            lastInput.dispatchEvent(new Event('input'));
        }
    }
});


utools.onPluginOut((processExited) => {
    if (!document.getElementById('historyToggle').checked) {
        clearAll();
    }
});


utools.onMainPush(
    ({ code, type, payload }) => {
        if(type == "regex") {
            let value = "";
            if( code == "timestamp"){
                if (!payload.startsWith('@')) {
                    payload = '@' + payload;
                }

                payload = payload.replace(/\//g, '-');
            }
            let title = payload;
            try {
                const rslt = window.calculator(payload);
                value = rslt.value;
                if( code == "timestamp") {
                    title = rslt.info;
                }
                // utools.showNotification(value);
            } catch (error) {
                value = "error: " + error.message; 
            }

            return [
                {
                    icon: "logo-equal.png",
                    text: value.toString(),
                    title: title,
                }, //...
            ];
        }
    },
    ({ code, type, payload, option }) => {
        // if (option.text == "进入插件") {
        //     return true;  // 返回 true 表示需要进入插件应用处理
        // }
        // 不进入插件应用 "执行粘贴文本"
        utools.hideMainWindowPasteText(option.text);
    }
);