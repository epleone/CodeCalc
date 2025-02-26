import { Calculator } from '../calculator.js';

describe('Matrix Operations', () => {
  beforeEach(() => {
    Calculator.clearAllCache();
  });

  describe('矩阵创建', () => {
    beforeEach(() => {
      Calculator.clearAllCache();
    });
    
    test('创建向量', () => {
      expect(Calculator.calculate('[1]').value).toBe('[1]');
      expect(Calculator.calculate('[----1]').value).toBe('[1]');
      expect(Calculator.calculate('[1 2 3]').value).toBe('[1,2,3]');
      expect(Calculator.calculate('[1 -2 -3]').value).toBe('[1,-2,-3]');
      expect(Calculator.calculate('[1,2,3]').value).toBe('[1,2,3]');
      expect(Calculator.calculate('[---2 2 3]').value).toBe('[-2,2,3]');

      // 应该报错
      expect(() => Calculator.calculate('[1-2]')).toThrow();
      expect(() => Calculator.calculate('[1-2 2 3]')).toThrow();
      expect(() => Calculator.calculate('[1---2 2 3]')).toThrow();
      expect(() => Calculator.calculate('[2 2 +3]')).toThrow();
      expect(() => Calculator.calculate('[2 2x3 1/2]')).toThrow();

      expect(Calculator.calculate('[1,1 + 1, 1 + 2]').value).toBe('[1,2,3]');
      expect(Calculator.calculate('[+1,1 - 1, 1 * 2]').value).toBe('[1,0,2]');
      expect(Calculator.calculate('[--1,1 / 1, 2 ** 2]').value).toBe('[1,1,4]');
      expect(Calculator.calculate('[max(1, 2, 3)]').value).toBe('[3]');
      expect(Calculator.calculate('[min(1, 2, 3)]').value).toBe('[1]');
      expect(Calculator.calculate('[min(1, 2, 3), max(1, 2, 3), 1 ]').value).toBe('[1,3,1]');
    });

    test('创建向量-变量', () => {
      expect(Calculator.calculate('a = 1').value).toBe('1');
      expect(Calculator.calculate('b = -1').value).toBe('-1');
      expect(Calculator.calculate('a + b').value).toBe('0');
      expect(Calculator.calculate('[a,1,1]').value).toBe('[1,1,1]');
      expect(Calculator.calculate('[b,1,1]').value).toBe('[-1,1,1]');

      // 应该报错
      expect(() => Calculator.calculate('[a 1 1]')).toThrow();    // 不能空格
      expect(() => Calculator.calculate('[a, b, x]')).toThrow();  // 未定义的变量x
      expect(() => Calculator.calculate('[1;1;1]')).toThrow();    // 不能用分号

      expect(Calculator.calculate('a = [1 2 3]').value).toBe('[1,2,3]');
      expect(() => Calculator.calculate('[a]')).toThrow();  // 不能用方括号

    });

    test('创建矩阵', () => {
      // 单个元素
      expect(Calculator.calculate('{1}').value).toBe('[1]');
      expect(Calculator.calculate('{[1]}').value).toBe('[1]');

      // 单行矩阵
      expect(Calculator.calculate('{1 2 3}').value).toBe('{1,2,3}');
      expect(Calculator.calculate('{1,2,3}').value).toBe('{1,2,3}');
      expect(Calculator.calculate('{[1 2 3]}').value).toBe('[1,2,3]');
      expect(Calculator.calculate('{[1,2,3]}').value).toBe('[1,2,3]');

      // 多行矩阵
      expect(Calculator.calculate('{1 2 3;4 5 6}').value).toBe('{1,2,3;4,5,6}');
      expect(Calculator.calculate('{1 2 3;4,5,6}').value).toBe('{1,2,3;4,5,6}');
      expect(Calculator.calculate('{1,2,3;4 5 6}').value).toBe('{1,2,3;4,5,6}');

      // 2x2矩阵
      expect(Calculator.calculate('{1 2;3 4}').value).toBe('{1,2;3,4}');
      expect(Calculator.calculate('{1,2;3,4}').value).toBe('{1,2;3,4}');
      expect(Calculator.calculate('{[1,2];[3,4]}').value).toBe('{1,2;3,4}');
      expect(Calculator.calculate('{[1 2];[3 4]}').value).toBe('{1,2;3,4}');
      expect(Calculator.calculate('{[1,2];3,4}').value).toBe('{1,2;3,4}');
      expect(Calculator.calculate('{1,2;[3,4]}').value).toBe('{1,2;3,4}');
      expect(Calculator.calculate('{[1 2];3 4}').value).toBe('{1,2;3,4}');
      expect(Calculator.calculate('{1 2;[3 4]}').value).toBe('{1,2;3,4}');


      // 3x3矩阵
      expect(Calculator.calculate('{1 2 3;4 5 6;7 8 9}').value).toBe('{1,2,3;4,5,6;7,8,9}');
      expect(Calculator.calculate('{[1 2 3];4 5 6;7 8 9}').value).toBe('{1,2,3;4,5,6;7,8,9}');
      expect(Calculator.calculate('{1 2 3;[4 5 6];7 8 9}').value).toBe('{1,2,3;4,5,6;7,8,9}');
      expect(Calculator.calculate('{1 2 3;4 5 6;[7 8 9]}').value).toBe('{1,2,3;4,5,6;7,8,9}');
      expect(Calculator.calculate('{[1 2 3];[4 5 6];7 8 9}').value).toBe('{1,2,3;4,5,6;7,8,9}');
      expect(Calculator.calculate('{[1 2 3];4 5 6;[7 8 9]}').value).toBe('{1,2,3;4,5,6;7,8,9}');
      expect(Calculator.calculate('{1 2 3;[4 5 6];[7 8 9]}').value).toBe('{1,2,3;4,5,6;7,8,9}');
      expect(Calculator.calculate('{[1 2 3];[4 5 6];[7 8 9]}').value).toBe('{1,2,3;4,5,6;7,8,9}');

      expect(Calculator.calculate('{1,2,3;4,5,6;7,8,9}').value).toBe('{1,2,3;4,5,6;7,8,9}');
      expect(Calculator.calculate('{[1,2,3];4,5,6;7,8,9}').value).toBe('{1,2,3;4,5,6;7,8,9}');
      expect(Calculator.calculate('{1,2,3;[4,5,6];7,8,9}').value).toBe('{1,2,3;4,5,6;7,8,9}');
      expect(Calculator.calculate('{1,2,3;4,5,6;[7,8,9]}').value).toBe('{1,2,3;4,5,6;7,8,9}');
      expect(Calculator.calculate('{[1,2,3];[4,5,6];7,8,9}').value).toBe('{1,2,3;4,5,6;7,8,9}');
      expect(Calculator.calculate('{[1,2,3];4,5,6;[7,8,9]}').value).toBe('{1,2,3;4,5,6;7,8,9}');
      expect(Calculator.calculate('{1,2,3;[4,5,6];[7,8,9]}').value).toBe('{1,2,3;4,5,6;7,8,9}');
      expect(Calculator.calculate('{[1,2,3];[4,5,6];[7,8,9]}').value).toBe('{1,2,3;4,5,6;7,8,9}');

      // 报错
      expect(() => Calculator.calculate('[ ]')).toThrow();
      expect(() => Calculator.calculate('{ }')).toThrow();
      expect(() => Calculator.calculate('[ 1,]')).toThrow();
      expect(() => Calculator.calculate('[ ,1]')).toThrow();
      expect(() => Calculator.calculate('[ 1;]')).toThrow();

      expect(() => Calculator.calculate('{ 1,}')).toThrow();
      expect(() => Calculator.calculate('{ 1;}')).toThrow();
      expect(() => Calculator.calculate('{ ,1}')).toThrow();
      expect(() => Calculator.calculate('{ ;1}')).toThrow();

      expect(() => Calculator.calculate('{1 2;3 4 5}')).toThrow();
      expect(() => Calculator.calculate('{1 2;[3 4 5]}')).toThrow();
      expect(() => Calculator.calculate('{[1 2];3 4 5}')).toThrow();
      expect(() => Calculator.calculate('{[1 2];[3 4 5]}')).toThrow();

      expect(() => Calculator.calculate('{1,2;3,4,5}')).toThrow();
      expect(() => Calculator.calculate('{1,2;[3,4,5]}')).toThrow();
      expect(() => Calculator.calculate('{[1,2];3,4,5}')).toThrow();
      expect(() => Calculator.calculate('{[1,2];[3,4,5]}')).toThrow();
      
    });

    test('矩阵和向量混合构建', () => {

      // 列向量
      expect(Calculator.calculate('a = [1,2,3]').value).toBe('[1,2,3]');
      expect(Calculator.calculate('{a}').value).toBe('[1,2,3]');
      expect(Calculator.calculate('{a; a}').value).toBe('{1,2,3;1,2,3}');
      expect(Calculator.calculate('{a, a}').value).toBe('{1,1;2,2;3,3}');
      expect(Calculator.calculate('{a; a; a}').value).toBe('{1,2,3;1,2,3;1,2,3}');
      expect(Calculator.calculate('{a, a, a}').value).toBe('{1,1,1;2,2,2;3,3,3}');

      expect(() => Calculator.calculate('{a; a, a}')).toThrow();
      expect(() => Calculator.calculate('{a, a; a}')).toThrow();
      expect(() => Calculator.calculate('[a]')).toThrow();

      // 行向量
      expect(Calculator.calculate('b = {1 2 3}').value).toBe('{1,2,3}');
      expect(Calculator.calculate('{b}').value).toBe('{1,2,3}');
      expect(Calculator.calculate('{b, b}').value).toBe('{1,2,3;1,2,3}');
      expect(Calculator.calculate('{b; b}').value).toBe('{1,1;2,2;3,3}');
      expect(Calculator.calculate('{b, b, b}').value).toBe('{1,2,3;1,2,3;1,2,3}');
      expect(Calculator.calculate('{b; b; b}').value).toBe('{1,1,1;2,2,2;3,3,3}');

      expect(() => Calculator.calculate('{b; b, b}')).toThrow();
      expect(() => Calculator.calculate('{b, b; b}')).toThrow();
      expect(() => Calculator.calculate('[b]')).toThrow();
      
      // 报错
      expect(Calculator.calculate('c = {1 2 3; 4 5 6}').value).toBe('{1,2,3;4,5,6}');
      expect(() => Calculator.calculate('{[c, c, c]}')).toThrow();
      expect(() => Calculator.calculate('{c, c, c}')).toThrow();
      expect(() => Calculator.calculate('{c; c; c}')).toThrow();

      expect(() => Calculator.calculate('{a; a, a}')).toThrow();
      expect(() => Calculator.calculate('{a, a; a}')).toThrow();
      expect(() => Calculator.calculate('[a; a; a]')).toThrow();

      expect(() => Calculator.calculate('{b; b, b}')).toThrow();
      expect(() => Calculator.calculate('{b, b; b}')).toThrow();
      expect(() => Calculator.calculate('[b; b; b]')).toThrow();
    });


    test('特殊矩阵', () => {
      expect(Calculator.calculate('eye(2)').value).toBe('{1,0;0,1}');
      expect(Calculator.calculate('zeros(2)').value).toBe('[0,0]');
      expect(Calculator.calculate('ones(2)').value).toBe('[1,1]');
      expect(Calculator.calculate('diag([1,2,3])').value).toBe('{1,0,0;0,2,0;0,0,3}');

      expect(Calculator.calculate('range(1,3)').value).toBe('[1,2]');
      expect(Calculator.calculate('range(3)').value).toBe('[0,1,2]');
      expect(Calculator.calculate('range(1, 10, 2)').value).toBe('[1,3,5,7,9]');

      expect(Calculator.calculate('eye(3)').value).toBe('{1,0,0;0,1,0;0,0,1}');
      expect(Calculator.calculate('zeros(3, 3)').value).toBe('{0,0,0;0,0,0;0,0,0}');
      expect(Calculator.calculate('ones(3, 3)').value).toBe('{1,1,1;1,1,1;1,1,1}');

      // 变量
      expect(Calculator.calculate('a = 2').value).toBe('2');
      expect(Calculator.calculate('eye(a)').value).toBe('{1,0;0,1}');
      expect(Calculator.calculate('zeros(a)').value).toBe('[0,0]');
      expect(Calculator.calculate('ones(a)').value).toBe('[1,1]');

      expect(Calculator.calculate('b = [1 2 3]').value).toBe('[1,2,3]');  // 列向量
      expect(Calculator.calculate('diag(b)').value).toBe('{1,0,0;0,2,0;0,0,3}');
      expect(Calculator.calculate('b = {1,2,3}').value).toBe('{1,2,3}');  // 行向量
      expect(Calculator.calculate('diag(b)').value).toBe('{1,0,0;0,2,0;0,0,3}');

      // 随机矩阵，不报错就行
      expect(() => Calculator.calculate('random()')).not.toThrow();
      expect(() => Calculator.calculate('random(2)')).not.toThrow();
      expect(() => Calculator.calculate('random(2, 3)')).not.toThrow();

      // 报错
      expect(() => Calculator.calculate('random(2, 3, 4)')).toThrow();
      expect(() => Calculator.calculate('diag(1,2,3)')).toThrow();
    });
  });

  describe('矩阵运算', () => {
    test('矩阵加法', () => {
      expect(Calculator.calculate('{1 2;3 4} + {1 1;1 1}').value).toBe('{2,3;4,5}');
    });

    test('矩阵乘法', () => {
      expect(Calculator.calculate('{1 2;3 4} @ {1 1;1 1}').value).toBe('{3,3;7,7}');
    });

    test('矩阵转置', () => {
      expect(Calculator.calculate('{1 2;3 4}.T').value).toBe('{1,3;2,4}');
    });
  });

  describe('矩阵错误处理', () => {
    test('维度不匹配', () => {
      expect(() => Calculator.calculate('{1 2} + {1 2 3}')).toThrow();
      expect(() => Calculator.calculate('{1 2} @ {1 2 3}')).toThrow();
    });

    test('无效矩阵格式', () => {
      expect(() => Calculator.calculate('{1 2;3}')).toThrow();
      expect(() => Calculator.calculate('{1 2;3 4 5}')).toThrow();
    });
  });
}); 