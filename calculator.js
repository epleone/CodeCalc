function calculate(expression) {
    // 定义数学常量
    const constants = {
        'pi': Math.PI,
        'e': Math.E
    };

    // 存储警告信息
    let warnings = [];

    // 检查不合法的进制前缀
    const prefixRegex = /\b[0o][a-zA-Z][0-9a-fA-F]*\b|\b0[a-zA-Z][0-9a-fA-F]*\b/i;
    const invalidPrefixMatch = expression.match(prefixRegex);
    if (invalidPrefixMatch) {
        const match = invalidPrefixMatch[0];
        // 排除合法的前缀和需要警告的前缀
        if (!/^0[boxBOX]/i.test(match) && !/^o[boxBOX]/i.test(match)) {
            throw new Error(`"${match}" 不是合法的进制表示，支持：0b、0o、0x`);
        }
    }

    // 检查并转换错误的进制前缀
    expression = expression.replace(/\bob([01]+)\b/ig, (match, num) => {
        warnings.push('?已显示二进制0b');
        return '0b' + num;
    });
    expression = expression.replace(/\boo([0-7]+)\b/ig, (match, num) => {
        warnings.push('?已显示八进制0o');
        return '0o' + num;
    });
    expression = expression.replace(/\box([0-9a-fA-F]+)\b/ig, (match, num) => {
        warnings.push('?已显示十六进制0x');
        return '0x' + num;
    });

    // 先处理不同进制的整数
    expression = expression.replace(/0[bB][01]+/g, match => parseInt(match.slice(2), 2));  // 二进制
    expression = expression.replace(/0[oO][0-7]+/g, match => {
        const octalStr = match.slice(2);
        const decimalValue = parseInt(octalStr, 8);
        if (isNaN(decimalValue)) {
            throw new Error('无效的八进制数');
        }
        return decimalValue;
    });  // 八进制
    expression = expression.replace(/0[xX][0-9a-fA-F]+/g, match => parseInt(match.slice(2), 16));  // 十六进制

    // 处理进制转换函数
    if (/\b(hex|oct|bin)\(/.test(expression)) {
        // 如果表达式包含进制转换函数，先计算括号内的表达式
        let match;
        if (match = expression.match(/\bhex\((.*?)\)/)) {
            const num = calculate(match[1]);
            if (!Number.isInteger(num)) {
                throw new Error('进制转换只支持整数');
            }
            return '0x' + Math.abs(num).toString(16).toUpperCase();
        }
        if (match = expression.match(/\boct\((.*?)\)/)) {
            const num = calculate(match[1]);
            if (!Number.isInteger(num)) {
                throw new Error('进制转换只支持整数');
            }
            return '0o' + Math.abs(num).toString(8);
        }
        if (match = expression.match(/\bbin\((.*?)\)/)) {
            const num = calculate(match[1]);
            if (!Number.isInteger(num)) {
                throw new Error('进制转换只支持整数');
            }
            return '0b' + Math.abs(num).toString(2);
        }
    }

    // 处理 exp 函数
    if (/\bexp\(/.test(expression)) {
        let match = expression.match(/\bexp\((.*?)\)/);
        if (match) {
            const num = calculate(match[1]);
            return Math.exp(num);
        }
    }

    // 处理 root 函数
    if (/\broot\(/.test(expression)) {
        let match = expression.match(/\broot\((.*?),(.*?)\)/);
        if (match) {
            const x = calculate(match[1]);  // 被开方数
            const n = calculate(match[2]);  // 次数
            
            if (!Number.isInteger(n) || n <= 0) {
                throw new Error('root函数的次数必须是正整数');
            }
            if (n % 2 === 0 && x < 0) {
                throw new Error('偶次方根不支持负数');
            }
            
            // 使用幂运算来计算 n 次方根：x^(1/n)
            return Math.pow(Math.abs(x), 1/n) * (x < 0 ? -1 : 1);
        }
    }

    // 处理 sqrt 函数（作为 root(2,x) 的特例）
    if (/\bsqrt\(/.test(expression)) {
        let match = expression.match(/\bsqrt\((.*?)\)/);
        if (match) {
            const num = calculate(match[1]);
            if (num < 0) {
                throw new Error('sqrt函数不支持负数');
            }
            return Math.sqrt(num);
        }
    }

    // 处理其他数学函数
    expression = expression.replace(/\bsin\((.*?)\)/g, 'Math.sin($1)');
    expression = expression.replace(/\bcos\((.*?)\)/g, 'Math.cos($1)');
    expression = expression.replace(/\btan\((.*?)\)/g, 'Math.tan($1)');
    expression = expression.replace(/\blog\((.*?)\)/g, 'Math.log10($1)');
    expression = expression.replace(/\bln\((.*?)\)/g, 'Math.log($1)');

    // 将表达式中的常��替换为其数值
    for (const [constant, value] of Object.entries(constants)) {
        const regex = new RegExp(`\\b${constant}\\b`, 'gi');
        expression = expression.replace(regex, value);
    }

    // 处理角度值（例如：90d -> pi/2）
    expression = expression.replace(/(\d+(?:\.\d+)?)d\b/g, (match, num) => {
        return `(${num} * Math.PI / 180)`;
    });

    // 处理乘法符号 'x'
    expression = expression.replace(/x/gi, '*');

    // 处理整除
    expression = expression.replace(/\/\//g, '|');
    
    try {
        // 执行计算
        let result = Function('"use strict";return (' + expression + ')')();
        
        // 处理整除的结果
        if (expression.includes('|')) {
            result = Math.floor(result);
        }
        
        // 格式化结果，处理精度问题
        if (Number.isFinite(result)) {
            if (Number.isInteger(result)) {
                result = result;
            } else {
                result = parseFloat(result.toFixed(6));
            }
            // 如果有警告，将警告添加到结果中
            if (warnings.length > 0) {
                return { value: result, warning: warnings[0] };
            }
            return result;
        } else {
            throw new Error('计算结果无效');
        }
    } catch (error) {
        throw new Error('表达式无效');
    }
}

// 使用示例
console.log(calculate('2 + 3 * 4')); // 输出: 14
console.log(calculate('10 - 2 * 3')); // 输出: 4
console.log(calculate('20 / 5 + 3')); // 输出: 7 