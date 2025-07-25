import { Calculator } from './calculator.min.js';

const isUtoolsEnv = typeof utools !== 'undefined';


function isBase64(str) {
    // 去除空格
    str = str.trim();
    return /^(?:[A-Za-z0-9+\/]{4}){3,}(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/.test(str);
}

// 处理正则匹配到的表达式
function handleRegexInput(code, payload) {
    let expr = payload.trim();

    if (code === 'quickcalc') {
        // 判断是否是base64编码，如果是则解码
        if (isBase64(expr)) {
            expr = 'str(' + expr + ').unbase64';
        }
        // 通用计算，去掉结尾的=
        else if (expr.endsWith('=')) {
            expr = expr.substring(0, expr.length - 1);
        }

    } else if (code === 'timestamp') {
        // 时间戳模式,确保开头有@并统一分隔符为-
        if (!expr.startsWith('@')) {
            expr = '@' + expr;
        }
        expr = expr.replace(/\//g, '-');
    }

    return expr;
}


// 在 utools 环境中，则执行
if (isUtoolsEnv) {

    // utools 相关代码保持不变
    utools.onPluginEnter(({ code, type, payload }) => {
        //utools.isDarkColors
        if(utools.isDarkColors()) {
            // console.log("dark");
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            // console.log("light");
            document.documentElement.setAttribute('data-theme', 'light');
        }

        const inputs = document.querySelectorAll('.input');
        const lastInput = inputs[inputs.length - 1];  // 获取最后一个输入框

        if(type == "regex") {
            let expr = handleRegexInput(code, payload);

            // 如果最后一行不为空，则新增一行
            if (lastInput.value.trim() !== '') {
                addNewLine();
                const newInputs = document.querySelectorAll('.input');
                const newLastInput = newInputs[newInputs.length - 1];
                newLastInput.value = expr;
                newLastInput.dispatchEvent(new Event('input'));
            } else {
                // 如果最后一行为空，直接在最后一行输入
                lastInput.value = expr;
                lastInput.dispatchEvent(new Event('input'));
            }
            // console.log('set precision:', 100);
            // Calculator.setCfg('precision', 100);
        }else{
            // 将焦点聚焦到输入框
            lastInput.focus();
            // console.log('set precision:', -100);
            // Calculator.setCfg('precision', -100);
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
                let expr = handleRegexInput(code, payload);
                let title = "点击复制结果";
                
                try {
                    const rslt = Calculator.calculate(expr);
                    value = rslt.value;
                    if( code == "timestamp") {
                        title = rslt.info;
                    }

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

}