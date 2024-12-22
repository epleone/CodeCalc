class Node:
    def __init__(self, value):
        self.value = value
        self.args = []  # 所有节点都使用args存储参数

class Calculator:
    def __init__(self):
        self.pos = 0
        # 重构函数字典，保持所有键值格式统一
        self.functions = {
            '+': {
                'impl': lambda args: args[0] + args[1],
                'arg_count': 2,
                'type': 'binary_operator',
                'precedence': 1,
                'description': '加法运算'
            },
            '-': {
                'impl': lambda args: args[0] - args[1],
                'arg_count': 2,
                'type': 'binary_operator',
                'precedence': 1,
                'description': '减法运算'
            },
            '*': {
                'impl': lambda args: args[0] * args[1],
                'arg_count': 2,
                'type': 'binary_operator',
                'precedence': 2,
                'description': '乘法运算'
            },
            '/': {
                'impl': lambda args: args[0] / args[1] if args[1] != 0 else float('inf'),
                'arg_count': 2,
                'type': 'binary_operator',
                'precedence': 2,
                'description': '除法运算'
            },
            'max': {
                'impl': lambda args: max(args),
                'arg_count': -1,
                'type': 'function',
                'precedence': 3,
                'description': '返回参数中的最大值'
            },
            'min': {
                'impl': lambda args: min(args),
                'arg_count': -1,
                'type': 'function',
                'precedence': 3,
                'description': '返回参数中的最小值'
            },
            'id': {
                'impl': lambda args: args[0],
                'arg_count': 1,
                'type': 'function',
                'precedence': 3,
                'description': '恒等函数，返回输入值本身'
            },
            '#': {
                'impl': lambda args: args[0] + 1,
                'arg_count': 1,
                'type': 'unary_operator',
                'position': 'postfix',
                'precedence': 3,
                'description': '自增运算，将数值加1'
            }
        }
        # 按优先级分组
        self.precedence_groups = {}
        for func_name, func_info in self.functions.items():
            prec = func_info['precedence']
            if prec not in self.precedence_groups:
                self.precedence_groups[prec] = []
            self.precedence_groups[prec].append(func_name)
    
    def parse_expr(self, expr):
        # 预处理：在普通括号前添加id
        processed_expr = ''
        i = 0
        while i < len(expr):
            if expr[i] == '(' and (i == 0 or expr[i-1] not in 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'):
                processed_expr += 'id('
                i += 1
            else:
                processed_expr += expr[i]
                i += 1
                
        self.expr = processed_expr.replace(' ', '')
        self.pos = 0
        return self._parse_expr()
    
    def _parse_expr(self):
        return self._parse_by_precedence(min(self.precedence_groups.keys()))
    
    def _parse_by_precedence(self, precedence):
        if precedence > max(self.precedence_groups.keys()):
            return self._parse_number()
            
        # 先尝试解析函数调用
        for func_name, func_info in self.functions.items():
            if func_info['type'] == 'function':
                if (self.pos + len(func_name) <= len(self.expr) and 
                    self.expr[self.pos:self.pos+len(func_name)+1] == f"{func_name}("):
                    self.pos += len(func_name) + 1
                    node = Node(func_name)
                    node.args = []
                    
                    while True:
                        arg = self._parse_by_precedence(1)  # 从最低优先级开始解析参数
                        if arg:
                            node.args.append(arg)
                        
                        if self.pos >= len(self.expr):
                            raise ValueError(f"函数 {func_name} 缺少右括号")
                        
                        if self.expr[self.pos] == ')':
                            self.pos += 1
                            break
                        elif self.expr[self.pos] == ',':
                            self.pos += 1
                        else:
                            raise ValueError(f"函数 {func_name} 参数格式错误")
                    
                    arg_count = func_info['arg_count']
                    if arg_count != -1 and len(node.args) != arg_count:
                        raise ValueError(f"函数 {func_name} 需要 {arg_count} 个参数")
                        
                    return node
        
        # 然后处理运算符
        left = self._parse_by_precedence(precedence + 1)
        if left is None:
            return None
            
        while self.pos < len(self.expr):
            matched = False
            for func_name in self.precedence_groups[precedence]:
                func_info = self.functions[func_name]
                
                if func_info['type'] in ['binary_operator', 'unary_operator']:
                    if self.expr[self.pos] == func_name:
                        self.pos += 1
                        if func_info['type'] == 'unary_operator':
                            # 一元运算符处理
                            node = Node(func_name)
                            if func_info['position'] == 'postfix':
                                node.args = [left]
                            else:  # prefix
                                right = self._parse_by_precedence(precedence + 1)
                                node.args = [right]
                            left = node
                        else:  # binary_operator
                            # 二元运算符处理
                            right = self._parse_by_precedence(precedence + 1)
                            node = Node(func_name)
                            node.args = [left, right]
                            left = node
                        matched = True
                        break
                        
            if not matched:
                break
                
        return left
    
    def _parse_number(self):
        if self.pos >= len(self.expr):
            return None
            
        # 解析数字
        if self.expr[self.pos].isdigit() or self.expr[self.pos] == '.':
            start = self.pos
            while self.pos < len(self.expr) and (self.expr[self.pos].isdigit() or self.expr[self.pos] == '.'):
                self.pos += 1
            return Node(float(self.expr[start:self.pos]))
        
        return None

    def evaluate(self, node):
        if node is None:
            return 0
            
        # 如果是叶子节点（数字）
        if not node.args:
            return node.value
            
        # 如果是函数调用
        if node.value in self.functions:
            arg_values = [self.evaluate(arg) for arg in node.args]
            return self.functions[node.value]['impl'](arg_values)
            
        raise ValueError(f"未知的函数: {node.value}")

def calculate(expr):
    calc = Calculator()
    tree = calc.parse_expr(expr)
    return calc.evaluate(tree)

# 测试代码
if __name__ == "__main__":
    expressions = [
        "1 + 2",
        "2 * (3 + 4)",
        "10 / 2 + 3",
        "(1 + 2) * (3 + 4)",
        "max(1, 2, 3)",
        "min(1, 2, 3)",
        "max(1 + 2, 2 * 3, 10 / 2)",
        "min(max(1, 2), 3)",
        "1#",  # 应该返回 2
        "(1 + 2)#",  # 应该返回 4
        "1# + 2",  # 应该返回 4
        "1 + 2#",  # 应该返回 4
    ]
    
    for expr in expressions:
        try:
            result = calculate(expr)
            print(f"{expr} = {result}")
        except Exception as e:
            print(f"{expr} 计算错误: {str(e)}") 