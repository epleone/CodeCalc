// 添加临时常量字典
const tempConstants = new Map();

// 定义保留的函数名（全部小写）
const reservedFunctions = [
    'sin', 'cos', 'tan',
    'asin', 'acos', 'atan',
    'log', 'ln', 'exp',
    'sqrt', 'root', 'pow',
    'max', 'min',
    'bin', 'oct', 'hex'
];

// 添加一个辅助函数来检查大数运算是否会溢出
function checkBigIntOperation(expression) {
    // 检查是否包含乘法、幂运算等可能导致溢出的操作
    const hasMultiplication = /\*(?!\*)/.test(expression);  // 匹配乘法，但不匹配 **
    const hasPower = /\*\*/.test(expression);
    const hasSquare = /\b\d{15,}(\s*[\*]{1,2}|\s*\^)\s*\d+/.test(expression);  // 检查大数的乘方运算

    if ((hasMultiplication || hasPower || hasSquare) && /\d{15,}/.test(expression)) {
        try {
            // 尝试计算
            const result = Function('"use strict";return BigInt(' + 
                expression.replace(/\*\*/g, '^')
                         .replace(/\^/g, '**') + 
                ')')();
            
            // 检查结果是否超过合理范围（比如 2^53）
            if (result > BigInt(Number.MAX_SAFE_INTEGER) || 
                result < BigInt(Number.MIN_SAFE_INTEGER)) {
                throw new Error('计算结果超出范围');
            }
            return true;
        } catch {
            throw new Error('计算结果超出范围');
        }
    }
    return false;
}

function calculate(expression) {
    // 定义数学常量
    const constants = {
        'PI': Math.PI,
        'e': Math.E
    };

    // 检查是否是赋值表达式（包括复合赋值）
    const assignmentMatch = expression.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*([+\-*/])?=\s*(.+)\s*$/);
    if (assignmentMatch) {
        const variableName = assignmentMatch[1];
        const operator = assignmentMatch[2] || '';  // 获取运算符，如果没有则为空字符串
        const valueExpression = assignmentMatch[3];

        // 检查变量名是否是保留的常量名、函数名或乘法符号
        if (constants.hasOwnProperty(variableName)) {
            throw new Error(`不能使用保留的常量名 "${variableName}"`);
        }
        if (reservedFunctions.includes(variableName.toLowerCase())) {
            throw new Error(`不能使用保留的函数名 "${variableName}"`);
        }
        if (variableName.toLowerCase() === 'x') {
            throw new Error(`不能使用乘法符号 "x" 作为变量名`);
        }

        // 计算右边的表达式
        try {
            let value = calculate(valueExpression);
            // 如果计算结果是对象（带警告或成功信息），取其值
            const newValue = typeof value === 'object' ? value.value : value;

            // 处理复合赋值运算
            if (operator) {
                if (!tempConstants.has(variableName)) {
                    throw new Error(`未定义的变量 ${variableName}`);
                }
                const oldValue = tempConstants.get(variableName);
                switch (operator) {
                    case '+':
                        value = oldValue + newValue;
                        break;
                    case '-':
                        value = oldValue - newValue;
                        break;
                    case '*':
                        value = oldValue * newValue;
                        break;
                    case '/':
                        if (newValue === 0) {
                            throw new Error('除数不能为零');
                        }
                        value = oldValue / newValue;
                        break;
                }
            } else {
                value = newValue;
            }

            // 存储到临时常量字典中
            tempConstants.set(variableName, value);

            // 返回赋值结果，包含变量名和值
            return {
                value: value,
                success: `变量 ${variableName}：${value}`
            };
        } catch (error) {
            throw new Error(`赋值表达式计算错误: ${error.message}`);
        }
    }

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
    expression = expression.replace(/0[bB][01]+/g, match => {
        // 使用 BigInt 处理二进制
        try {
            return BigInt(match).toString();
        } catch {
            return parseInt(match.slice(2), 2);
        }
    });

    expression = expression.replace(/0[oO][0-7]+/g, match => {
        // 使用 BigInt 处理八进制
        try {
            return BigInt(match).toString();
        } catch {
            const octalStr = match.slice(2);
            const decimalValue = parseInt(octalStr, 8);
            if (isNaN(decimalValue)) {
                throw new Error('无效的八进制数');
            }
            return decimalValue;
        }
    });

    // 修改十六进制处理
    expression = expression.replace(/0[xX][0-9a-fA-F]+/g, match => {
        // 使用 BigInt 处理十六进制
        try {
            return BigInt(match).toString();
        } catch {
            // 如果 BigInt 失败，回退到普通转换
            return parseInt(match.slice(2), 16);
        }
    });

    // 处理进制转换函数
    if (/\b(hex|oct|bin)\(/.test(expression)) {
        let match;
        if (match = expression.match(/\bhex\((.*?)\)/)) {
            const num = calculate(match[1]);
            if (typeof num === 'string' && /^\d+$/.test(num)) {
                // 处理大整数
                try {
                    return '0x' + BigInt(num).toString(16).toUpperCase();
                } catch {
                    throw new Error('数字超出范围');
                }
            } else if (!Number.isInteger(num)) {
                throw new Error('进制转换只支持整数');
            }
            return '0x' + Math.abs(num).toString(16).toUpperCase();
        }
        if (match = expression.match(/\boct\((.*?)\)/)) {
            const num = calculate(match[1]);
            if (typeof num === 'string' && /^\d+$/.test(num)) {
                // 处理大整数
                try {
                    return '0o' + BigInt(num).toString(8);
                } catch {
                    throw new Error('数字超出范围');
                }
            } else if (!Number.isInteger(num)) {
                throw new Error('进制转换只支持整数');
            }
            return '0o' + Math.abs(num).toString(8);
        }
        if (match = expression.match(/\bbin\((.*?)\)/)) {
            const num = calculate(match[1]);
            if (typeof num === 'string' && /^\d+$/.test(num)) {
                // 处理大整数
                try {
                    return '0b' + BigInt(num).toString(2);
                } catch {
                    throw new Error('数字超出范围');
                }
            } else if (!Number.isInteger(num)) {
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

    // 处理 pow 函数
    if (/\bpow\(/.test(expression)) {
        let match = expression.match(/\bpow\((.*?),(.*?)\)/);
        if (match) {
            const base = calculate(match[1]);  // 底数
            const exponent = calculate(match[2]);  // 指数
            return Math.pow(base, exponent);
        }
    }

    // 处理 max 函数
    if (/\bmax\(/.test(expression)) {
        let match = expression.match(/\bmax\((.*?)\)/);
        if (match) {
            const args = match[1].split(',').map(arg => {
                const value = calculate(arg.trim());
                return typeof value === 'object' ? value.value : value;
            });
            if (args.length < 2) {
                throw new Error('max函数需要至少两个参数');
            }
            return Math.max(...args);
        }
    }

    // 处理 min 函数
    if (/\bmin\(/.test(expression)) {
        let match = expression.match(/\bmin\((.*?)\)/);
        if (match) {
            const args = match[1].split(',').map(arg => {
                const value = calculate(arg.trim());
                return typeof value === 'object' ? value.value : value;
            });
            if (args.length < 2) {
                throw new Error('min函数需要至少两个参数');
            }
            return Math.min(...args);
        }
    }

    // 处理反三角函数
    if (/\basin\(/.test(expression)) {
        let match = expression.match(/\basin\((.*?)\)/);
        if (match) {
            const num = calculate(match[1]);
            const radians = Math.asin(num);
            const degrees = radians * 180 / Math.PI;
            return {
                value: radians,
                success: `${degrees.toFixed(6)}°`
            };
        }
    }

    if (/\bacos\(/.test(expression)) {
        let match = expression.match(/\bacos\((.*?)\)/);
        if (match) {
            const num = calculate(match[1]);
            const radians = Math.acos(num);
            const degrees = radians * 180 / Math.PI;
            return {
                value: radians,
                success: `${degrees.toFixed(6)}°`
            };
        }
    }

    if (/\batan\(/.test(expression)) {
        let match = expression.match(/\batan\((.*?)\)/);
        if (match) {
            const num = calculate(match[1]);
            const radians = Math.atan(num);
            const degrees = radians * 180 / Math.PI;
            return {
                value: radians,
                success: `${degrees.toFixed(6)}°`
            };
        }
    }

    // 处理数学函数（不区分大小写）
    expression = expression.replace(/\b(?:sin|SIN|Sin)\((.*?)\)/g, 'Math.sin($1)');
    expression = expression.replace(/\b(?:cos|COS|Cos)\((.*?)\)/g, 'Math.cos($1)');
    expression = expression.replace(/\b(?:tan|TAN|Tan)\((.*?)\)/g, 'Math.tan($1)');
    expression = expression.replace(/\b(?:log|LOG|Log)\((.*?)\)/g, 'Math.log10($1)');
    expression = expression.replace(/\b(?:ln|LN|Ln)\((.*?)\)/g, 'Math.log($1)');
    expression = expression.replace(/\b(?:exp|EXP|Exp)\((.*?)\)/g, 'Math.exp($1)');
    expression = expression.replace(/\b(?:sqrt|SQRT|Sqrt)\((.*?)\)/g, 'Math.sqrt($1)');
    expression = expression.replace(/\b(?:pow|POW|Pow)\((.*?),(.*?)\)/g, 'Math.pow($1,$2)');

    // 将表达式中的常量替换为其数值
    // 先检查临时常量，再检查内置常量
    for (const [name, value] of tempConstants) {
        const regex = new RegExp(`\\b${name}\\b`, 'g');
        expression = expression.replace(regex, value);
    }
    for (const [constant, value] of Object.entries(constants)) {
        const regex = new RegExp(`\\b${constant}\\b`, 'g');
        expression = expression.replace(regex, value);
    }

    // 处理角度值（例如：90d -> pi/2）
    if (/^\s*-?\d+(\.\d+)?d\s*$/.test(expression)) {  // 检查是否只有个角度值
        const match = expression.match(/(-?\d+(?:\.\d+)?)d/);
        const degrees = parseFloat(match[1]);
        const radians = degrees * Math.PI / 180;  // 实际的弧度值
        const piRatio = degrees / 180;  // 转换为 PI 的倍数
        
        if (piRatio === 0) return '0';
        const piFormat = simplifyPiFraction(piRatio);
        return {
            value: piFormat,
            success: `${radians.toFixed(6)} 弧度`  // 添加实际的弧度值
        };
    }

    // 其他情况下的角度转换
    expression = expression.replace(/(-?\d+(?:\.\d+)?)d\b/g, (match, num) => {
        return `(${num} * Math.PI / 180)`;
    });

    // 处理乘法符号 'x'
    expression = expression.replace(/x/gi, '*');

    // 处理整除
    expression = expression.replace(/\/\//g, '|');
    
    try {
        // 执行计算
        let result;
        // 检查是否是纯数字（包括负数）
        if (/^-?\d+$/.test(expression)) {
            // 如果是纯整数，直接返回字符串形式
            result = expression;
        } else {
            // 检查表达式是否包含大整数
            const bigIntPattern = /\d{15,}/g;  // 修改为15位以上的数字
            const hasBigInt = bigIntPattern.test(expression);
            
            if (hasBigInt) {
                // 检查是否会溢出
                checkBigIntOperation(expression);

                try {
                    // 如果包含大整数，将所有整数转换为 BigInt
                    const modifiedExpression = expression
                        .replace(/\b\d+\b/g, match => `BigInt("${match}")`)
                        .replace(/\*\*/g, '^');  // BigInt 不支持 **，需要特殊处理幂运算
                    
                    // 执行计算
                    result = Function('"use strict";return (' + modifiedExpression + ')')();
                    // 将 BigInt 结果转换回字符串
                    result = result.toString().replace('n', '');
                } catch (error) {
                    throw new Error('计算结果超出范围');
                }
            } else {
                // 其他表达式进行普通计算
                result = Function('"use strict";return (' + expression + ')')();
            }
            
            // 处理整除的结果
            if (expression.includes('|')) {
                result = Math.floor(result);
            }
            
            // 格式化结果，处理精度问题
            if (Number.isFinite(result)) {
                if (Number.isInteger(result)) {
                    // 对于整数，直接转为字符串，避免科学计数法
                    result = result.toString();
                } else {
                    // 对于小数，保留6位小数
                    result = parseFloat(result.toFixed(6));
                }
            } else if (typeof result === 'string') {
                // 已经是字符串形式的大整数
                result = result;
            } else {
                throw new Error('计算结果无效');
            }
        }
        
        // 如果有警告，将警告添加到结果中
        if (warnings.length > 0) {
            return { value: result, warning: warnings[0] };
        }
        return result;
    } catch (error) {
        // 如果已经是自定义的错误消息，直接抛出
        if (error instanceof Error && error.message) {
            throw error;
        }
        // 对于其他未知错误，返回通用错误信息
        throw new Error('表达式无效');
    }
}

// 辅助函数：尝试将数字转换为 PI 的倍数或分数形式
function simplifyPiFraction(ratio) {
    // 检查是否为整数倍
    if (Number.isInteger(ratio)) {
        if (ratio === 1) return 'PI';
        if (ratio === -1) return '-PI';
        return `${ratio}*PI`;
    }

    // 检查常见的分数
    const denominators = [2, 3, 4, 6, 8, 12];
    for (const den of denominators) {
        const num = ratio * den;
        if (Math.abs(Math.round(num) - num) < 1e-10) {
            const roundedNum = Math.round(num);
            if (Math.abs(roundedNum) === 1) {
                return roundedNum > 0 ? `PI/${den}` : `-PI/${den}`;
            }
            return `${roundedNum}*PI/${den}`;
        }
    }

    // 如果无法简化，返回小数形式
    return `${ratio.toFixed(6)}*PI`;
}

// 添加清除临时常量的函数
function clearTempConstants() {
    tempConstants.clear();
}