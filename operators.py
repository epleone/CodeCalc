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
    }
} 