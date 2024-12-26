from graphviz import Digraph
import os
from operators import OPERATORS, FUNCTIONS, CONSTANTS

class Node:
    def __init__(self, value):
        self.value = value
        self.args = []

class Calculator:
    def __init__(self):
        self.operators = set(OPERATORS.keys())
        self.functions = set(FUNCTIONS.keys())
        self.constants = set(CONSTANTS.keys())  # 改为set
    
    def parse_expr(self, expr):
        tokens = self._tokenize(expr)
        return self._build_ast(tokens)
    
    def _tokenize(self, expr):
        """将表达式转换为标记列表"""
        tokens = []
        i = 0
        expr = expr.replace(' ', '')
        
        while i < len(expr):
            char = expr[i]
            
            # 处理数字
            if char.isdigit():
                num = ''
                while i < len(expr) and (expr[i].isdigit() or expr[i] == '.'):
                    num += expr[i]
                    i += 1
                tokens.append(('number', float(num)))
                continue
                
            # 处理函数名、常数和变量
            if char.isalpha():
                name = ''
                while i < len(expr) and expr[i].isalpha():
                    name += expr[i]
                    i += 1
                if name in self.functions:
                    tokens.append(('function', name))
                elif name in self.constants:  # 使用set检查
                    tokens.append(('number', CONSTANTS[name]))  # 从CONSTANTS字典获取值
                continue
                
            # 处理运算符和括号
            if char in self.operators or char in '()':
                tokens.append(('operator', char))
            elif char == ',':
                tokens.append(('separator', char))
                
            i += 1
            
        return tokens
    
    def _build_ast(self, tokens):
        """使用调度场算法构建AST"""
        output = []  # 输出队列
        operators = []  # 运算符栈
        
        for token_type, token in tokens:
            if token_type == 'number':
                output.append(Node(token))
            
            elif token_type == 'function':
                operators.append(token)
            
            elif token_type == 'operator':
                if token == '(':
                    operators.append(token)
                elif token == ')':
                    while operators and operators[-1] != '(':
                        self._process_operator(operators, output)
                    if operators:  # 弹出左括号
                        operators.pop()
                        if operators and operators[-1] in self.functions:
                            self._process_operator(operators, output)
                else:  # 其他运算符
                    while (operators and operators[-1] != '(' and
                           operators[-1] in self.operators and
                           OPERATORS[operators[-1]]['precedence'] >= 
                           OPERATORS[token]['precedence']):
                        self._process_operator(operators, output)
                    operators.append(token)
        
        # 处理剩余的运算符
        while operators:
            self._process_operator(operators, output)
            
        return output[0] if output else None
    
    def _process_operator(self, operators, output):
        """处理运算符"""
        op = operators.pop()
        node = Node(op)
        
        if op in self.operators:
            args_count = OPERATORS[op]['args']
            node.args = [output.pop() for _ in range(args_count)]
            node.args.reverse()
        elif op in self.functions:
            # 收集函数参数直到遇到分隔符
            args = []
            while output and output[-1].value != ',':
                args.append(output.pop())
            node.args = list(reversed(args))
            
        output.append(node)

    def evaluate(self, node):
        if node is None:
            return 0
            
        # 如果是数字节点
        if isinstance(node.value, (int, float)):
            return node.value
            
        # 计算子节点
        args = [self.evaluate(arg) for arg in node.args]
        
        # 处理运算符
        if node.value in self.operators:
            return OPERATORS[node.value]['func'](*args)
        
        # 处理函数
        if node.value in self.functions:
            return FUNCTIONS[node.value]['func'](*args)
        
        raise ValueError(f"未知的操作符或函数: {node.value}")

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
            elif node.value in self.operators:
                # 运算符节点使用矩形
                dot.node(node_id, node.value, shape='box')
            elif node.value in self.functions:
                # 函数节点使用菱形
                dot.node(node_id, node.value, shape='diamond')
            else:
                # 其他节点使用默认形状
                dot.node(node_id, str(node.value))
            
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
        "1#",
        "150°",
        "deg(150)",
        "rad(PI/2)",
        "e#",
    ]
    
    calc = Calculator()
    for i, expr in enumerate(expressions):
        try:
            print(f"\n处理表达式: {expr}")
            tree = calc.parse_expr(expr)
            result = calc.evaluate(tree)
            print(f"结果: {result}")
            
            # # 生成语法树可视化
            # filename = f"ast_{i}"
            # calc.visualize_ast(tree, filename)
            # input("按任意键继续...")
            #  # 查看完后删除
            # os.remove(f"{filename}.png")
        except Exception as e:
            print(f"错误: {str(e)}") 

"""
#TODO
1. 添加前缀操作符 `0b111`,  `0o567`, `0xfff`
2. 添加函数
"""