from graphviz import Digraph
import os

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
        self.expr = expr.replace(' ', '')  # 只需要移除空格
        self.pos = 0
        return self._parse_expr()
    
    def _parse_expr(self):
        return self._parse_by_precedence(min(self.precedence_groups.keys()))
    
    def _parse_by_precedence(self, precedence):
        if precedence > max(self.precedence_groups.keys()):
            return self._parse_primary()  # 改用_parse_primary替代_parse_number
            
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
    
    def _parse_primary(self):
        """解析基本表达式：数字或带括号的表达式"""
        if self.pos >= len(self.expr):
            return None
            
        # 处理括号
        if self.expr[self.pos] == '(':
            self.pos += 1  # 跳过左括号
            expr = self._parse_expr()  # 解析括号内的表达式
            
            if self.pos >= len(self.expr) or self.expr[self.pos] != ')':
                raise ValueError("缺少右括号")
            
            self.pos += 1  # 跳过右括号
            return expr
        
        # 处理函数调用
        for func_name, func_info in self.functions.items():
            if (func_info['type'] == 'function' and 
                self.pos + len(func_name) <= len(self.expr) and 
                self.expr[self.pos:self.pos+len(func_name)] == func_name):
                # 函数调用的处理逻辑...
                pass
        
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

    def visualize_ast(self, node, output_file='ast'):
        """
        将抽象语法树可视化为图形
        
        Args:
            node: AST的根节点
            output_file: 输出文件名（不需要扩展名）
        """
        dot = Digraph(comment='Abstract Syntax Tree')
        dot.attr(rankdir='TB')
        
        def add_nodes(node, parent_id=None, counter=[0]):
            if node is None:
                return
            
            # 为每个节点创建唯一ID
            node_id = str(counter[0])
            counter[0] += 1
            
            # 设置节点样式
            if isinstance(node.value, (int, float)):
                # 数值节点使用椭圆形
                dot.node(node_id, str(node.value), shape='ellipse')
            elif node.value in self.functions:
                func_info = self.functions[node.value]
                if func_info['type'] == 'function':
                    # 函数节点使用菱形
                    dot.node(node_id, node.value, shape='diamond')
                else:
                    # 运算符节点使用矩形
                    dot.node(node_id, node.value, shape='box')
            
            # 如果有父节点，添加边
            if parent_id is not None:
                dot.edge(parent_id, node_id)
            
            # 递归处理子节点
            for arg in node.args:
                add_nodes(arg, node_id)
        
        add_nodes(node)
        
        # 保存图形
        dot.render(output_file, view=True, format='png', cleanup=True)

def calculate(expr):
    calc = Calculator()
    tree = calc.parse_expr(expr)
    return calc.evaluate(tree)

# 测试代码
if __name__ == "__main__":
    expressions = [
        "1 + 2",
        "2 * (3 + 4)",
        "(1 + 2) * (3 + 4)",
        "max(1, 2, 3)",
        "1# + 2",
    ]
    
    calc = Calculator()
    for i, expr in enumerate(expressions):
        try:
            print(f"\n处理表达式: {expr}")
            tree = calc.parse_expr(expr)
            result = calc.evaluate(tree)
            print(f"结果: {result}")
            
            # 生成语法树可视化
            filename = f"ast_{i}"
            calc.visualize_ast(tree, filename)
            input("按任意键继续...")
             # 查看完后删除
            os.remove(f"{filename}.png")
            
        except Exception as e:
            print(f"错误: {str(e)}") 