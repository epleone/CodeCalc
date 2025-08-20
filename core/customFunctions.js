/**
 * 核心思路：将表达式转换为lambda函数
 */

// TODO:
// 1. 支持传入参数类型，string, number, boolean, array, object
// 2. 支持函数重命名 mysin := sin 
// 3. 支持定义常量 mypi = 3.1415926


// 自定义函数存储，key: 函数名，value: 函数对象
const customFunctions = new Map();

// 先去除前面的行号变量定义（如 $1 = func() = ...）
function removeLineNumber(expr) {
    if (/^\s*\$\d+\s*=/.test(expr)) {
        expr = expr.replace(/^\s*\$\d+\s*=\s*/, '');
    }
    return expr;
}


function createCustomFunction(definition, calculator) {
    // 1. 解析函数定义
    const functionDefRegex = /^([a-zA-Z_$][a-zA-Z0-9_]*)\s*\(([^)]*)\)\s*=\s*(.+)$/;
    const match = definition.match(functionDefRegex);
    
    if (!match) {
        throw new Error('函数定义格式错误，正确格式: funcname(param1,param2,...) = expression');
    }
    
    const [, funcName, paramStr, expression] = match;
    
    // 2. 解析参数列表
    const params = paramStr.trim() ? 
        paramStr.split(',').map(p => p.trim()) : [];
    
    // 3. 验证函数名和参数名
    validateName(funcName);
    params.forEach(param => validateName(param));
    
    // 4. 生成lambda函数
    const lambdaFunc = createLambdaFunction(params, expression, calculator);
    
    return {
        name: funcName,
        params: params,
        expression: expression,
        func: lambdaFunc,
        args: params.length
    };
}

function createLambdaFunction(params, expression, calculator) {
    return function(...args) {
        // 检查参数数量
        if (args.length !== params.length) {
            throw new Error(`函数需要 ${params.length} 个参数，但得到了 ${args.length} 个`);
        }
        
        // 创建参数替换的表达式
        let evaluationExpr = expression;
        
        // 替换参数
        for (let i = 0; i < params.length; i++) {
            const paramName = params[i];
            const argValue = args[i];
            
            // 使用正则表达式替换参数名，确保只替换完整的标识符
            const paramRegex = new RegExp(`\\b${paramName}\\b`, 'g');
            evaluationExpr = evaluationExpr.replace(paramRegex, `(${argValue})`);
        }
        
        // 使用计算器计算表达式
        const result = calculator.calculate(evaluationExpr);
        // rslt是对象，包含value, info, warning等, TODO: define ccobj? 
        return result.value;
    };
}


function validateName(name) {
    if (!/^[a-zA-Z_$][a-zA-Z0-9_]*$/.test(name)) {
        throw new Error(`名称 "${name}" 格式不正确，只能包含字母、数字和下划线，且不以数字开头`);
    }
}


function addCustomFunction(definition, calculator, FUNCTIONS) {

    definition = removeLineNumber(definition);

    const customFunc = createCustomFunction(definition, calculator);
    
    // 如果函数名不在自定义函数中，但在FUNCTIONS中，视为与内置函数冲突
    if (!customFunctions.has(customFunc.name) && FUNCTIONS[customFunc.name]) {
        throw new Error(`函数名 "${customFunc.name}" 与内置函数冲突`);
    }
    
    // 存储到本地
    customFunctions.set(customFunc.name, customFunc);
    
    // 添加到FUNCTIONS对象
    FUNCTIONS[customFunc.name] = {
        func: customFunc.func,
        args: customFunc.args,
        // argTypes: 'any',
        description: `自定义函数: ${customFunc.name}(${customFunc.params.join(', ')}) = ${customFunc.expression}`,
        isCustom: true
    };
    
    return customFunc.name;
}


function removeCustomFunction(funcName, FUNCTIONS) {
    if (customFunctions.has(funcName)) {
        customFunctions.delete(funcName);
        delete FUNCTIONS[funcName];
        return true;
    }
    return false;
}


function getCustomFunctions() {
    const result = {};
    for (const [name, funcInfo] of customFunctions) {
        result[name] = {
            name: funcInfo.name,
            params: funcInfo.params,
            expression: funcInfo.expression,
            args: funcInfo.args
        };
    }
    return result;
}


function clearCustomFunctions(FUNCTIONS) {
    for (const funcName of customFunctions.keys()) {
        delete FUNCTIONS[funcName];
    }
    customFunctions.clear();
}

// 检查是否为函数定义语句
function isFunctionDefinition(expr) {
    expr = removeLineNumber(expr);
    console.log("isFunctionDefinition:", expr);
    return /^[a-zA-Z_$][a-zA-Z0-9_]*\s*\([^)]*\)\s*=\s*.+/.test(expr);
}

export {
    createCustomFunction,
    addCustomFunction,
    removeCustomFunction,
    getCustomFunctions,
    clearCustomFunctions,
    isFunctionDefinition
};
