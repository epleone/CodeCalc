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

// 在文件开头定义常量
const MATH_CONSTANTS = {
    'PI': '3.141592653589793',
    'e': '2.718281828459045'
};

// 声明 calculate 函数（移到前面）
let calculate;

// 修改数学函数处理部分
function processMathFunction(expression, funcName, mathFunc) {
    const pattern = `\\b(?:${funcName}|${funcName.toUpperCase()}|${funcName[0].toUpperCase()}${funcName.slice(1)})\\(((?:\\([^()]*\\)|[^()])*?)\\)`;
    const regex = new RegExp(pattern, 'g');
    
    return expression.replace(regex, function(match, args) {
        // 如果参数中还包含任何函数调用，就先不处理这层
        if (/\b(?:sin|cos|tan|log|ln|exp|sqrt|pow|max|min)\s*\(/i.test(args)) {
            return match;
        }
        
        try {
            // 计算参数值
            const result = calculate(args);
            const value = typeof result === 'object' ? Number(result.value) : Number(result);
            
            if (isNaN(value)) {
                throw new Error('无效的参数');
            }
            
            // 对数函数的特殊处理
            if ((funcName === 'ln' || funcName === 'log') && value <= 0) {
                throw new Error(`${funcName}函数的参数必须大于0`);
            }
            
            // 计算函数结果
            const funcResult = mathFunc(value);
            
            if (!Number.isFinite(funcResult)) {
                throw new Error('计算结果无效');
            }
            
            // 格式化结果
            const formattedResult = Number(funcResult.toFixed(6));
            
            // 处理特殊情况
            if (Math.abs(formattedResult) < 1e-10) {
                return '0';
            }
            
            // 返回结果（带括号）
            return `(${formattedResult})`;
            
        } catch (error) {
            throw new Error(error.message);
        }
    });
}

// 定义 calculate 函数
calculate = function(expression) {
    // 定义数学常量
    const constants = MATH_CONSTANTS;

    // 检查是否直接是常量
    const trimmedExpr = expression.trim();
    if (Object.keys(MATH_CONSTANTS).includes(trimmedExpr)) {
        return MATH_CONSTANTS[trimmedExpr];
    }

    // 检查是否是赋值表达式（包括复合赋值）
    const assignmentMatch = expression.match(/^\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*([+\-*/])?=\s*(.+)\s*$/);
    if (assignmentMatch) {
        const variableName = assignmentMatch[1];
        const operator = assignmentMatch[2] || '';
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

        try {
            // 计算右边的表达式
            let processedExpression = valueExpression;
            
            // 替换常量
            for (const [name, val] of tempConstants) {
                const regex = new RegExp(`\\b${name}\\b`, 'g');
                processedExpression = processedExpression.replace(regex, val);
            }
            for (const [constant, val] of Object.entries(constants)) {
                const regex = new RegExp(`\\b${constant}\\b`, 'g');
                processedExpression = processedExpression.replace(regex, val);
            }

            let value = calculate(processedExpression);
            value = typeof value === 'object' ? value.value : value;

            // 处理复合赋值运算
            if (operator) {
                if (!tempConstants.has(variableName)) {
                    throw new Error(`未定义的变量 ${variableName}`);
                }
                const oldValue = Number(tempConstants.get(variableName));
                const newValue = Number(value);
                
                switch (operator) {
                    case '+': value = oldValue + newValue; break;
                    case '-': value = oldValue - newValue; break;
                    case '*': value = oldValue * newValue; break;
                    case '/': 
                        if (newValue === 0) throw new Error('除数不能为零');
                        value = oldValue / newValue; 
                        break;
                    default:
                        throw new Error(`不支持的运算符 "${operator}="`);
                }
            }

            // 存储到临时常量字典中
            tempConstants.set(variableName, value.toString());

            return {
                value: value.toString(),
                success: `变量 ${variableName}：${value}`
            };
        } catch (error) {
            throw new Error(`赋值表达式计算错误: ${error.message}`);
        }
    }

    // 非赋值表达式的处理
    // 先处理单独的角度值
    if (/^\s*-?\d+(\.\d+)?d\s*$/.test(expression)) {  // 检查是否只有个角度值
        const match = expression.match(/(-?\d+(?:\.\d+)?)d/);
        const degrees = parseFloat(match[1]);
        const radians = degrees * Math.PI / 180;  // 实际的弧度值
        const piRatio = degrees / 180;  // 转换为 PI 的倍数
        
        if (piRatio === 0) return '0';
        const piFormat = simplifyPiFraction(piRatio);
        return {
            value: piFormat,
            success: `${radians.toFixed(6)} 弧度`
        };
    }

    // 替换常量
    for (const [name, value] of tempConstants) {
        const regex = new RegExp(`\\b${name}\\b`, 'g');
        expression = expression.replace(regex, value);
    }
    for (const [constant, value] of Object.entries(constants)) {
        const regex = new RegExp(`\\b${constant}\\b`, 'g');
        expression = expression.replace(regex, value);
    }

    // 存储警告信息
    let warnings = [];

    // 处理表达式中的角度值
    expression = expression.replace(/(-?\d+(?:\.\d+)?)d\b/g, (match, num) => {
        const degrees = parseFloat(num);
        const piRatio = degrees / 180;
        if (piRatio === 0) return '0';
        return `(${piRatio}*PI)`;  // 直接使用 PI 而不是数值
    });

    // 处理所有函数调用，从内到外
    let prevExpression;
    do {
        prevExpression = expression;

        // 处理 sqrt 函数
        expression = expression.replace(/\b(?:sqrt|SQRT|Sqrt)\(((?:[^()]|\([^()]*\))*?)\)/g, (match, p1) => {
            try {
                // 计算参数值
                const result = calculate(p1);
                const value = typeof result === 'object' ? Number(result.value) : Number(result);
                
                if (isNaN(value)) {
                    throw new Error('无效的参数');
                }
                
                if (value < 0) {
                    throw new Error('sqrt函数不支持负数');
                }
                
                const sqrtResult = Math.sqrt(value);
                
                if (!Number.isFinite(sqrtResult)) {
                    throw new Error('计算结果无效');
                }
                
                const formattedResult = Number(sqrtResult.toFixed(6));
                
                if (Math.abs(formattedResult) < 1e-10) {
                    return '0';
                }
                
                return `(${formattedResult})`;
                
            } catch (error) {
                throw new Error(error.message);
            }
        });

        // 处理 pow 函数
        expression = expression.replace(/\b(?:pow|POW|Pow)\(((?:[^(),]|\([^()]*\))*),((?:[^(),]|\([^()]*\))*)\)/g, (match, p1, p2) => {
            try {
                // 先计算两个参数
                const base = calculate(p1);
                const exponent = calculate(p2);
                
                // 转换为数值并计算
                const baseValue = Number(base);
                const exponentValue = Number(exponent);
                
                // 检查参数有效性
                if (isNaN(baseValue) || isNaN(exponentValue)) {
                    throw new Error('无效的参数');
                }
                
                // 计算结果
                const result = Math.pow(baseValue, exponentValue);
                
                // 检查结果有效性
                if (!Number.isFinite(result)) {
                    throw new Error('计算结果无效');
                }
                
                // 格式化结果
                const formattedResult = Number(result.toFixed(6));
                
                // 如果结果接近0，返回0
                if (Math.abs(formattedResult) < 1e-10) {
                    return '0';
                }
                
                // 返回结果（带括号）
                return `(${formattedResult})`;
                
            } catch (error) {
                throw new Error(error.message);
            }
        });

        // 处理基本数学函数
        const mathFunctions = [
            { name: 'sin', func: Math.sin },
            { name: 'cos', func: Math.cos },
            { name: 'tan', func: Math.tan },
            { name: 'log', func: Math.log10 },
            { name: 'ln', func: Math.log },
            { name: 'exp', func: Math.exp }
        ];

        for (const { name, func } of mathFunctions) {
            const pattern = `\\b${name}\\s*\\(((?:[^()]|\\([^()]*\\))*?)\\)`;
            const regex = new RegExp(pattern, 'gi');
            
            expression = expression.replace(regex, (match, args) => {
                try {
                    // 计算参数值
                    const result = calculate(args);
                    const value = typeof result === 'object' ? Number(result.value) : Number(result);
                    
                    if (isNaN(value)) {
                        throw new Error('无效的参数');
                    }
                    
                    // 对数函数的特殊处理
                    if ((name === 'ln' || name === 'log') && value <= 0) {
                        throw new Error(`${name}函数的参数必须大于0`);
                    }
                    
                    // 计算函数结果
                    const funcResult = func(value);
                    
                    if (!Number.isFinite(funcResult)) {
                        throw new Error('计算结果无效');
                    }
                    
                    // 格式化结果，确保精度一致
                    const formattedResult = Number(funcResult.toFixed(6));
                    
                    // 如果结果接近0，返回0
                    if (Math.abs(formattedResult) < 1e-10) {
                        return '0';
                    }
                    
                    // 返回结果（带括号）
                    return `(${formattedResult})`;
                    
                } catch (error) {
                    throw new Error(error.message);
                }
            });
        }

        // 修改 max 和 min 函数的处理部分
        expression = expression.replace(/\b(max|min)\b\s*\(((?:[^(),]|\([^()]*\))*(?:\s*,\s*(?:[^(),]|\([^()]*\))*)*)\)/gi,
            (match, func, args) => {
                try {
                    // 分割参数，但要考虑到括号内的逗号
                    const values = [];
                    let currentArg = '';
                    let bracketCount = 0;
                    
                    // 遍历参数字符串的每个字符
                    for (let i = 0; i < args.length; i++) {
                        const char = args[i];
                        if (char === '(') {
                            bracketCount++;
                            currentArg += char;
                        } else if (char === ')') {
                            bracketCount--;
                            currentArg += char;
                        } else if (char === ',' && bracketCount === 0) {
                            // 只有在不在括号内时才分割参数
                            if (currentArg.trim()) {
                                values.push(currentArg.trim());
                            }
                            currentArg = '';
                        } else {
                            currentArg += char;
                        }
                    }
                    // 添加最后一个参数
                    if (currentArg.trim()) {
                        values.push(currentArg.trim());
                    }

                    // 计算每个参数的值
                    const results = values.map(arg => {
                        const result = calculate(arg);
                        const value = typeof result === 'object' ? Number(result.value) : Number(result);
                        
                        if (!Number.isFinite(value)) {
                            throw new Error('参数无效');
                        }
                        
                        return value;
                    });

                    // 检查参数数量
                    if (results.length < 2) {
                        throw new Error(`${func}函数需要至少两个参数`);
                    }

                    // 根据函数类型计算结果
                    const result = func.toLowerCase() === 'max' ?
                        Math.max(...results) : Math.min(...results);

                    // 格式化结果
                    const formattedResult = Number(result.toFixed(6));

                    // 处理特殊情况
                    if (Math.abs(formattedResult) < 1e-10) {
                        return '0';
                    }

                    // 返回结果（带括号）
                    return `(${formattedResult})`;

                } catch (error) {
                    throw new Error(`${func}函数计算错误: ${error.message}`);
                }
            }
        );

    } while (expression !== prevExpression);

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

    // 处理反三角函数
    if (/\basin\(/.test(expression)) {
        let match = expression.match(/\basin\((.*?)\)/);
        if (match) {
            const num = calculate(match[1]);
            const radians = Math.asin(num);
            const degrees = radians * 180 / Math.PI;
            return {
                value: radians.toFixed(6),
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
                value: radians.toFixed(6),
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
                value: radians.toFixed(6),
                success: `${degrees.toFixed(6)}°`
            };
        }
    }

    // 处理整除运算
    expression = expression.replace(/(\d*\.?\d+|\([^)]+\))\s*\/\/\s*(\d*\.?\d+|\([^)]+\))/g, (match, n1, n2) => {
        try {
            const num1 = calculate(n1);
            const num2 = calculate(n2);
            
            // 检查除数是否为0
            if (Number(num2) === 0) {
                throw new Error('除数不能为零');
            }
            
            // 计算整除结果
            const result = Math.floor(Number(num1) / Number(num2));
            return result < 0 ? `(${result})` : result.toString();
        } catch (error) {
            throw new Error(`整除运算错误: ${error.message}`);
        }
    });

    // 处理乘法符号 'x'
    expression = expression.replace(/x/gi, '*');

    // 修改 root 函数的处理部分
    expression = expression.replace(/\broot\s*\(((?:[^(),]|\([^()]*\))*),((?:[^(),]|\([^()]*\))*)\)/g, (match, x, n) => {
        try {
            // 计算参数
            const base = calculate(x);  // 被开方数
            const power = calculate(n); // 次数
            
            // 转换为数值
            const baseValue = typeof base === 'object' ? Number(base.value) : Number(base);
            const powerValue = typeof power === 'object' ? Number(power.value) : Number(power);
            
            // 验证次数必须是正整数
            if (!Number.isInteger(powerValue) || powerValue <= 0) {
                throw new Error('root函数的次数必须是正整数');
            }

            // 验证被开方数
            if (powerValue % 2 === 0 && baseValue < 0) {
                throw new Error('偶次方根不支持负数');
            }
            
            // 使用幂运算来计算 n 次方根：x^(1/n)
            const result = Math.pow(Math.abs(baseValue), 1/powerValue) * (baseValue < 0 ? -1 : 1);
            
            // 检查结果有效性
            if (!Number.isFinite(result)) {
                throw new Error('计算结果无效');
            }
            
            // 格式化结果
            const formattedResult = Number(result.toFixed(6));
            
            // 如果结果接近0，返回0
            if (Math.abs(formattedResult) < 1e-10) {
                return '0';
            }
            
            // 返回结果（带括号）
            return `(${formattedResult})`;
            
        } catch (error) {
            throw new Error(error.message);
        }
    });

    try {
        let result;
        if (/^-?\d+$/.test(expression)) {
            result = expression;
        } else {
            // 检查除零操作
            if (/\/\s*0(?!\d)/.test(expression)) {
                throw new Error('除数不能为零');
            }
            
            try {
                result = Function('"use strict";return (' + expression + ')')();
            } catch (error) {
                if (/\b\d{15,}\b|\b\d{15,}(?=\.)/.test(expression) && 
                    checkBigIntOperation(expression)) {
                    // 尝试大整数计算
                    const modifiedExpression = expression
                        .replace(/\b\d+\b/g, match => `BigInt("${match}")`)
                        .replace(/\*\*/g, '^');
                    result = Function('"use strict";return (' + modifiedExpression + ')')()
                        .toString().replace('n', '');
                } else {
                    throw error;
                }
            }
        }

        // 检查结果是否为无穷大（可能是由除零导致的）
        if (!Number.isFinite(result) && typeof result === 'number') {
            throw new Error('除数不能为零');
        }

        // 格式化结果，处理精度问题
        if (Number.isFinite(result)) {
            if (Number.isInteger(result)) {
                result = result.toString();
            } else {
                result = parseFloat(result.toFixed(6));
            }
        } else if (typeof result === 'string') {
            result = result;
        } else {
            throw new Error('计算结果无效');
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
};

// 添加一个辅助函数检查大数运算是否会溢出
function checkBigIntOperation(expression) {
    // 检查大整数
    const bigIntPattern = /\b\d{15,}\b|\b\d{15,}(?=\.)/;
    if (!bigIntPattern.test(expression)) return false;

    // 检查是否包含可能导致溢出的运算
    if (!/\*|\*\*|\^/.test(expression)) return false;

    try {
        const result = Function('"use strict";return BigInt(' + 
            expression.replace(/\*\*/g, '^')
                     .replace(/\^/g, '**') + 
            ')')();
        
        return !(result > BigInt(Number.MAX_SAFE_INTEGER) || 
                result < BigInt(Number.MIN_SAFE_INTEGER));
    } catch {
        return false;
    }
}

// 辅助函数：尝试数字转换为 PI 的倍数或分数形式
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