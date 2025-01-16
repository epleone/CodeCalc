function processTimestamp(expr) {
    // 规范化时间字符串，给数字加括号
    function normalizeTimeString(timeStr) {
        // 定义所有可能的时间单位
        const units = [
            'years?', 'y',
            'months?', 'm',
            'weeks?', 'w',
            'days?', 'd',
            'hours?', 'h',
            'minutes?', 'mm',
            'seconds?', 's',
            'milliseconds?', 'ms'
        ].join('|');
    
        // 先将数字加上括号
        const pattern = new RegExp(`([+-]?\\d+\\.?\\d*)(${units})`, 'gi');
        const normalized = timeStr.replace(pattern, '($1)$2');

        return normalized;
    }

    /**
     * 用状态机FSM解析时间字符串, 格式为 (value)unit, 
     * 转成 timestamp(year, month, week, day, hour, minute, second, millisecond)
     * graph LR
     *   START -- "空格" --> START
     *   START -- "(" --> IN_BRACKETS
     *   START -- "其他字符" --> ERROR["抛出错误: 时间值必须在括号内"]
     *   
     *   IN_BRACKETS -- "(" --> IN_BRACKETS["嵌套括号"]
     *   IN_BRACKETS -- ")" --> EXPECT_UNIT["括号计数为0"]
     *   IN_BRACKETS -- ")" --> IN_BRACKETS["括号计数>0"]
     *   IN_BRACKETS -- "其他字符" --> IN_BRACKETS["累积currentValue"]
     *   
     *   EXPECT_UNIT -- "匹配到单位" --> EXPECT_OPEN["更新result和lastMatchedPos"]
     *   EXPECT_UNIT -- "未匹配到单位" --> EXPECT_OPEN
     *   
     *   EXPECT_OPEN -- "(" --> IN_BRACKETS
     *   EXPECT_OPEN -- "空格/+/-" --> EXPECT_OPEN
     *   EXPECT_OPEN -- "其他字符" --> END["结束解析"]
     */
    function parseTimeString(timeStr) {
        console.log('输入:', timeStr);

        if(timeStr.trim() === ''){
            return timeStr;
        }

        // 定义时间单位及其标识符
        const timeUnits = {
            years: ['y', 'year', 'years'],
            months: ['m', 'month', 'months'],
            weeks: ['w', 'week', 'weeks'],
            days: ['d', 'day', 'days'],
            hours: ['h', 'hour', 'hours'],
            minutes: ['mm', 'minute', 'minutes'],
            seconds: ['s', 'second', 'seconds'],
            milliseconds: ['ms', 'millisecond', 'milliseconds']
        };

        // 简化状态枚举
        const State = {
            START: 'START',           
            EXPECT_OPEN: 'EXPECT_OPEN',   
            IN_BRACKETS: 'IN_BRACKETS',    // 改名以更好地表达状态含义
            EXPECT_UNIT: 'EXPECT_UNIT',
            END: 'END'
        };

        let state = State.START;
        let pos = 0;
        let currentValue = '';
        let bracketCount = 0;
        let result = {
            years: '0',
            months: '0',
            weeks: '0',
            days: '0',
            hours: '0',
            minutes: '0',
            seconds: '0',
            milliseconds: '0'
        };
        let unitOrder = Object.keys(timeUnits);
        let currentUnitIndex = 0;
        let lastMatchedPos = 0;  // 记录最后一次成功匹配的位置

        // 首先定义一个按首字母分组的时间单位映射
        const unitsByFirstChar = {
            'y': ['years', 'year', 'y'],
            'm': ['milliseconds', 'millisecond', 'minutes', 'months', 'minute', 'month', 'mins', 'min', 'mm', 'ms', 'm'],
            'w': ['weeks', 'week', 'w'],
            'd': ['days', 'day', 'd'],
            'h': ['hours', 'hour', 'h'],
            's': ['seconds', 'second', 's']
        };

        while (pos < timeStr.length && state !== State.END) {
            const char = timeStr[pos];

            switch (state) {
                case State.START:
                    if (char === '(') {
                        state = State.IN_BRACKETS;
                        bracketCount = 1;
                        currentValue = '';
                    } else if (!char.trim()) {
                        // 允许空格，保持START状态
                    // 如果是unitsByFirstChar的单个字符，报错
                    } else if (unitsByFirstChar[char]) {
                        throw new Error(`时间单位:${timeStr.slice(pos, pos+5) + "..."} 没有值`);
                    } else {
                        // 必须匹配到括号，否则抛出错误
                        throw new Error('时间值必须在括号内');
                    }
                    break;

                case State.EXPECT_OPEN:
                    if (char === '(') {
                        state = State.IN_BRACKETS;
                        bracketCount = 1;
                        currentValue = '';
                    } else if (!char.trim() || char === '+' || char === '-') {
                        // 允许空格和运算符
                    } else {
                        if (lastMatchedPos === 0) {
                            lastMatchedPos = pos;
                        }
                        state = State.END;
                    }
                    break;

                case State.IN_BRACKETS:
                    if (char === '(') {
                        bracketCount++;
                        currentValue += char;
                    } else if (char === ')') {
                        bracketCount--;
                        if (bracketCount === 0) {
                            // 检查括号内是否为空
                            if (!currentValue.trim()) {
                                throw new Error('括号内不能为空');
                            }
                            state = State.EXPECT_UNIT;
                        } else {
                            currentValue += char;
                        }
                    } else {
                        currentValue += char;
                    }
                    break;

                case State.EXPECT_UNIT:
                    let unitStartPos = pos;    // 记录单位开始位置
                    let bestMatch = {
                        length: 0,
                        unitKey: '',
                        value: currentValue,
                        endPos: pos
                    };

                    // 修改匹配逻辑
                    const firstChar = timeStr[pos].toLowerCase();
                    if (unitsByFirstChar[firstChar]) {
                        // 获取这个首字母对应的所有可能单位
                        const possibleUnits = unitsByFirstChar[firstChar];
                        
                        // 尝试匹配每个可能的单位
                        for (const unit of possibleUnits) {
                            const potentialMatch = timeStr.slice(pos, pos + unit.length).toLowerCase();
                            if (potentialMatch === unit) {
                                // 找到匹配的单位，确定其对应的unitKey
                                let matchedUnitKey;
                                for (const [key, aliases] of Object.entries(timeUnits)) {
                                    if (aliases.includes(unit)) {
                                        // 检查这个单位是否已经被使用过
                                        if (result[key] !== '0') {
                                            throw new Error(`时间单位:${key} 重复赋值`);
                                        }
                                        matchedUnitKey = key;
                                        break;
                                    }
                                }
                                
                                if (matchedUnitKey) {
                                    bestMatch = {
                                        length: unit.length,
                                        unitKey: matchedUnitKey,
                                        value: currentValue,
                                        endPos: pos + unit.length - 1
                                    };
                                    pos += unit.length - 1;
                                    break;
                                }
                            }
                        }
                    }

                    // 如果找到匹配
                    if (bestMatch.length > 0) {
                        result[bestMatch.unitKey] = bestMatch.value;
                        pos = bestMatch.endPos;
                        lastMatchedPos = pos + 1;  // 恢复这行，更新到单位结束后的位置
                        currentUnitIndex = unitOrder.indexOf(bestMatch.unitKey) + 1;
                        state = State.EXPECT_OPEN;
                    } else {
                        pos = unitStartPos;
                        state = State.EXPECT_OPEN;
                    }
                    break;
            }
            pos++;
        }

        // 构建timestamp字符串
        const timestampArgs = [
            result.years || '0',
            result.months || '0',
            result.weeks || '0',
            result.days || '0',
            result.hours || '0',
            result.minutes || '0',
            result.seconds || '0',
            result.milliseconds || '0'
        ];

        let finalResult = `timestamp(${timestampArgs.join(', ')})`;
        
        // 如果还有未匹配的部分，直接拼接到结果后面
        if (lastMatchedPos < timeStr.length) {
            const remaining = timeStr.substring(lastMatchedPos).trim();
            if (remaining) {
                finalResult += ' ' + remaining;
            }
        }

        console.log('输出:', finalResult);
        return finalResult;
    }

    // 用正则表达式将 `>#` 替换为 `>timestamp`
    expr = expr.replace(/>\s*#/g, '>timestamp');

    const timeStrs = expr.split('#');
    console.log('timeStrs:', timeStrs);

    let result = timeStrs[0];
    for(let i = 1; i < timeStrs.length; i++){
        console.log('输入:', timeStrs[i]);
        const normalized = normalizeTimeString(timeStrs[i]);
        console.log('Normalize 输出:', normalized);
        result += parseTimeString(normalized);
    }

    // 将 `>timestamp` 替换回 `>#`  
    result = result.replace(/>timestamp/g, '>#');
    return result;
}



// 不要修改后面代码
// 添加测试用例
const testCases0 = [
    "#1y-3m+2w5d(1+3)h-30.5mm45s500ms",
    "#1y+2w(1+3)h",
    "#1y+2w(1+3)h + 10 - 9",
    "#-1.23y+2.34w5d",
    "#+1y-2m+3.45w",
    "#1year 2months 3weeks",
    "#1h30mm45s+500ms"
];

// testCases0.forEach(test => {
//     console.log('输入:', test);
//     console.log('输出:', normalizeTimeString(test));
//     console.log('-'.repeat(50));
// });

const testCases1 = [
    "#(2023)y(3)m(2)w(5)d(14)h(30)mm(45)s(500)ms",
    "#(2023)years(3)months",
    "#(14)hours(45)seconds + 1000",
    "#(2023)years(3)months(2)weeks",
    "#(14)h(45)s(500)milliseconds",
    "#(2023)y",
    "#(2023(nested))year(3)month",  // 测试嵌套括号
    "#(1+2x3)year(3+min(1,2,3))month",
    "#(1+2x3)year(3+min(1,2,3))month + #(14)h(45)s(500)milliseconds + #(1+2x3)w(3+min(1,2,3))d"  
];

const testCases2 = [
    "@now - #1y > @",
    "#1y2y",
    "#1e3d",
    "#1x2d",
    "#1y >#",
    "#1y >#w",
    "#1y + 1000 >#w ",
    "#1x2y",
    "#1x2y + 1000",
    "#()d",
    "#1x(2)d",
    "#1(2)d",
];

testCases2.
// testCases1.
forEach(test => {
    console.log('输入:', test);
    // console.log('输出:', parseTimeText(test));
    console.log('输出:', processTimestamp(test));
    console.log('-'.repeat(50));
});