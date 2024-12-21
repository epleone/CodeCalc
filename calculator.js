function calculate(expression) {
    // 移除所有空格
    expression = expression.replace(/\s+/g, '');
    
    // 替换 x 和 X 为 *
    expression = expression.replace(/[xX]/g, '*');
    
    // 替换常数
    expression = expression.replace(/pi|π/gi, Math.PI.toString());
    expression = expression.replace(/e/gi, Math.E.toString());
    
    // 预处理阶乘
    expression = handleFactorial(expression);
    
    // 修改正则表达式以支持更多数字格式
    const tokens = expression.match(/([0-9]*\.?[0-9]+)|[+\-*/%()!]|\/\/|\*\*|sin|cos|tan|log|ln/g);
    
    // 定义运算符优先级
    const precedence = {
        '+': 1,
        '-': 1,
        '*': 2,
        '/': 2,
        '//': 2,
        '%': 2,
        '**': 3, // 幂运算优先级最高
    };
    
    // 数字栈和运算符栈
    const numbers = [];
    const operators = [];
    
    // 处理运算符和数字
    for (let i = 0; i < tokens.length; i++) {
        let token = tokens[i];
        
        // 检查是否是双字符运算符
        if (token === '/' && i + 1 < tokens.length && tokens[i + 1] === '/') {
            token = '//';
            i++;
        } else if (token === '*' && i + 1 < tokens.length && tokens[i + 1] === '*') {
            token = '**';
            i++;
        }
        
        // 处理函数
        if (['sin', 'cos', 'tan', 'log', 'ln'].includes(token)) {
            let j = i + 1;
            let bracketCount = 1;
            let innerExp = '';
            
            // 跳过左括号
            if (tokens[j] === '(') j++;
            
            // 获取函数参数
            while (j < tokens.length && bracketCount > 0) {
                if (tokens[j] === '(') bracketCount++;
                if (tokens[j] === ')') bracketCount--;
                if (bracketCount > 0) innerExp += tokens[j];
                j++;
            }
            
            // 计算函数结果
            const value = calculateFunction(token, calculate(innerExp));
            numbers.push(value);
            i = j - 1;
            continue;
        }
        
        if (!isNaN(token)) {
            numbers.push(parseFloat(token));
        } else if (token === '(') {
            operators.push(token);
        } else if (token === ')') {
            while (operators.length && operators[operators.length - 1] !== '(') {
                calculate_top(numbers, operators);
            }
            operators.pop(); // 移除左括号
        } else {
            while (
                operators.length > 0 &&
                operators[operators.length - 1] !== '(' &&
                precedence[operators[operators.length - 1]] >= precedence[token]
            ) {
                calculate_top(numbers, operators);
            }
            operators.push(token);
        }
    }
    
    while (operators.length > 0) {
        calculate_top(numbers, operators);
    }
    
    return numbers[0];
}

function calculate_top(numbers, operators) {
    const operator = operators.pop();
    const b = numbers.pop();
    const a = numbers.pop();
    
    switch (operator) {
        case '+':
            numbers.push(a + b);
            break;
        case '-':
            numbers.push(a - b);
            break;
        case '*':
            numbers.push(a * b);
            break;
        case '/':
            if (b === 0) throw new Error('除数不能为0');
            numbers.push(a / b);
            break;
        case '//':
            if (b === 0) throw new Error('除数不能为0');
            numbers.push(Math.floor(a / b));
            break;
        case '%':
            if (b === 0) throw new Error('除数不能为0');
            numbers.push(a % b);
            break;
        case '**':
            numbers.push(Math.pow(a, b));
            break;
    }
}

function calculateFunction(func, value) {
    switch (func) {
        case 'sin':
            if (String(value).toLowerCase().includes('pi') || String(value).includes('π')) {
                return Math.sin(value);
            }
            return Math.sin(value * Math.PI / 180);
        case 'cos':
            if (String(value).toLowerCase().includes('pi') || String(value).includes('π')) {
                return Math.cos(value);
            }
            return Math.cos(value * Math.PI / 180);
        case 'tan':
            if (String(value).toLowerCase().includes('pi') || String(value).includes('π')) {
                return Math.tan(value);
            }
            return Math.tan(value * Math.PI / 180);
        case 'log':
            if (value <= 0) throw new Error('对数参数必须大于0');
            return Math.log10(value);
        case 'ln':
            if (value <= 0) throw new Error('对数参数必须大于0');
            return Math.log(value);
        default:
            throw new Error('未知函数');
    }
}

function handleFactorial(expression) {
    // 处理阶乘
    return expression.replace(/(\d+)!/g, (match, number) => {
        let result = 1;
        number = parseInt(number);
        if (number > 170) throw new Error('阶乘太大');
        for (let i = 2; i <= number; i++) {
            result *= i;
        }
        return result.toString();
    });
}

// 使用示例
console.log(calculate('2 + 3 * 4')); // 输出: 14
console.log(calculate('10 - 2 * 3')); // 输出: 4
console.log(calculate('20 / 5 + 3')); // 输出: 7 