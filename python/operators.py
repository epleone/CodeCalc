
# 常数定义
CONSTANTS = {
    'PI': 3.14159265359,
    'e': 2.71828182846
} 

# 操作符定义
OPERATORS = {
    '+': {
        'precedence': 1, 
        'args': 2,
        'func': lambda x, y: x + y,
        'description': '加法'
    },
    '-': {
        'precedence': 1, 
        'args': 2,
        'func': lambda x, y: x - y,
        'description': '减法'
    },
    '*': {
        'precedence': 2, 
        'args': 2,
        'func': lambda x, y: x * y,
        'description': '乘法'
    },
    '/': {
        'precedence': 2, 
        'args': 2,
        'func': lambda x, y: x / y if y != 0 else float('inf'),
        'description': '除法'
    },
    '#': {
        'precedence': 3, 
        'args': 1,
        'func': lambda x: x + 1,
        'description': '后缀自增'
    },
    '°': {
        'precedence': 3,
        'args': 1,
        'func': lambda x: x * CONSTANTS['PI'] / 180,
        'description': '角度转弧度'
    }
}

# 函数定义
FUNCTIONS = {
    'max': {
        'func': max,
        'description': '求最大值'
    },
    'min': {
        'func': min,
        'description': '求最小值'
    },
    'deg': {
        'func': lambda x: x * CONSTANTS['PI'] / 180,
        'description': '角度转弧度'
    },
    'rad': {
        'func': lambda x: x * 180 / CONSTANTS['PI'],
        'description': '弧度转角度'
    }
}

