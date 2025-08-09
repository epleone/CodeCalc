import { Calculator } from '../calculator.js';

describe('Matrix Operations', () => {
  beforeEach(() => {
    Calculator.clearAllCache();
  });

  describe('列向量创建', () => {
    beforeEach(() => {
      Calculator.clearAllCache();
    });

    test('基本列向量', () => {
      expect(Calculator.calculate('[1]').value).toBe('[1]');
      expect(Calculator.calculate('[1,2,3]').value).toBe('[1,2,3]');
      expect(Calculator.calculate('[1 2 3]').value).toBe('[1,2,3]');

      expect(Calculator.calculate('[1 -2 --3]').value).toBe('[1,-2,3]');
      expect(Calculator.calculate('[-1 -2 --3]').value).toBe('[-1,-2,3]');

      expect(Calculator.calculate('[- 1 -2 --3]').value).toBe('[-1,-2,3]');
      expect(Calculator.calculate('[---- 1 -2 --3]').value).toBe('[1,-2,3]');

      expect(Calculator.calculate('[1-2]').value).toBe('[-1]');

      // 报错
      expect(() => Calculator.calculate('[1- 2]')).toThrow();
      expect(() => Calculator.calculate('[1 - 2]')).toThrow();
      expect(() => Calculator.calculate('[1 - 2 3]')).toThrow();
      expect(() => Calculator.calculate('[1 -2 - 3]')).toThrow();
      expect(() => Calculator.calculate('[1- 2 3]')).toThrow();
    });

    test('列向量+变量', () => {
      expect(Calculator.calculate('a = 1').value).toBe('1');
      expect(Calculator.calculate('b = 2').value).toBe('2');
      expect(Calculator.calculate('c = 3').value).toBe('3');

      expect(Calculator.calculate('[a]').value).toBe('[1]');
      expect(Calculator.calculate('[-a]').value).toBe('[-1]');

      expect(Calculator.calculate('[a,b,c]').value).toBe('[1,2,3]');
      expect(Calculator.calculate('[a+1,b+1,c-1]').value).toBe('[2,3,2]');
      
      // 报错
      expect(() => Calculator.calculate('[a+1 b c]').value).toThrow();

    });

    test('多个列向量', () => {
      expect(Calculator.calculate('[1 2  3] + [ 4 5 6 ]').value).toBe('[5,7,9]');

      expect(Calculator.calculate('[1,2,3] + [4,5,6]').value).toBe('[5,7,9]');
      expect(Calculator.calculate('[1,2,3] + [4,5,6] + [7,8,9]').value).toBe('[12,15,18]');
      
      expect(Calculator.calculate('[1,2,3] - [4,5,6]').value).toBe('[-3,-3,-3]');
      expect(Calculator.calculate('[1,2,3] - [4,5,6] + [7,8,9]').value).toBe('[4,5,6]');


    });

    test('复杂列向量', () => {
      expect(Calculator.calculate('[1]').value).toBe('[1]');
      expect(Calculator.calculate('[----1]').value).toBe('[1]');
      expect(Calculator.calculate('[1 2 3]').value).toBe('[1,2,3]');
      expect(Calculator.calculate('[1 -2 -3]').value).toBe('[1,-2,-3]');
      expect(Calculator.calculate('[1,2,3]').value).toBe('[1,2,3]');
      expect(Calculator.calculate('[---2 2 3]').value).toBe('[-2,2,3]');
      expect(Calculator.calculate('[1-2]').value).toBe('[-1]');
      expect(Calculator.calculate('[1+2]').value).toBe('[3]');
      expect(Calculator.calculate('[1*2]').value).toBe('[2]');
      expect(Calculator.calculate('[4/2]').value).toBe('[2]');
      expect(Calculator.calculate('[2**(2)]').value).toBe('[4]');

      expect(Calculator.calculate('[1-2 2 3]').value).toBe('[-1,2,3]');
      expect(Calculator.calculate('[1---2 2 3]').value).toBe('[-1,2,3]');

      // 位运算
      expect(Calculator.calculate('[2^2]').value).toBe('[0]');
      expect(Calculator.calculate('[2or2]').value).toBe('[2]');
      expect(Calculator.calculate('[~2]').value).toBe('[-3]');

      // expect(Calculator.calculate('[2 << 2, 2 or 2]').value).toBe('[0,2]');
      expect(Calculator.calculate('[2 << 2, 2 or 2]').value).toBe('[8,2]');
      
      // 报错
      expect(() => Calculator.calculate('[1 -2 2 - 3]')).toThrow();
      expect(() => Calculator.calculate('[1 - 2 2 3]')).toThrow();
      expect(() => Calculator.calculate('[2 or 2]')).toThrow();
      expect(() => Calculator.calculate('[2 << 2]')).toThrow();
      expect(() => Calculator.calculate('[2 2 +3]')).toThrow();
      expect(() => Calculator.calculate('[2 2x3 1/2]')).toThrow();

      expect(Calculator.calculate('[1,1 + 1, 1 + 2]').value).toBe('[1,2,3]');
      expect(Calculator.calculate('[+1,1 - 1, 1 * 2]').value).toBe('[1,0,2]');
      expect(Calculator.calculate('[--1,1 / 1, 2 ** 2]').value).toBe('[1,1,4]');
      expect(Calculator.calculate('[max(1, 2, 3)]').value).toBe('[3]');
      expect(Calculator.calculate('[min(1, 2, 3)]').value).toBe('[1]');
      expect(Calculator.calculate('[min(1, 2, 3), max(1, 2, 3), 1 ]').value).toBe('[1,3,1]');
    });

    test('复杂列向量 + 变量', () => {
      expect(Calculator.calculate('a = 1').value).toBe('1');
      expect(Calculator.calculate('b = -1').value).toBe('-1');

      expect(Calculator.calculate('[ - a ]').value).toBe('[-1]');
      expect(Calculator.calculate('[-a]').value).toBe('[-1]');
      expect(Calculator.calculate('[- a -b]').value).toBe('[-1,1]');
      expect(Calculator.calculate('[ - a -b]').value).toBe('[-1,1]');
      expect(Calculator.calculate('[---a -b]').value).toBe('[-1,1]');
      expect(Calculator.calculate('[a -b]').value).toBe('[1,1]');


      expect(Calculator.calculate('[a , - b]').value).toBe('[1,1]');
      expect(Calculator.calculate('[a ,- b]').value).toBe('[1,1]');

      // 报错
      expect(() => Calculator.calculate('[a - b]')).toThrow();
      expect(() => Calculator.calculate('[a- b]')).toThrow();

      // 单个元素就该报错 TODO
      // expect(Calculator.calculate('[a + b]').value).toBe('[0]');
      // expect(Calculator.calculate('[a * b]').value).toBe('[-1]');
      // expect(Calculator.calculate('[a / b]').value).toBe('[-1]');
      // expect(Calculator.calculate('[a ^ b]').value).toBe('[1]');
      // expect(Calculator.calculate('[a ** b]').value).toBe('[1]');

      expect(Calculator.calculate('[max(a, b)]').value).toBe('[1]');
      expect(Calculator.calculate('[min(a, b)]').value).toBe('[-1]');

      // 多个元素
      expect(Calculator.calculate('[a+b, b-a ]').value).toBe('[0,-2]');
      expect(Calculator.calculate('[ a*b, b/a]').value).toBe('[-1,-1]');
      expect(Calculator.calculate('[a^b, b^a]').value).toBe('[-2,-2]');
      expect(Calculator.calculate('[ a**b, b**a ]').value).toBe('[1,-1]');
      expect(Calculator.calculate('[max(a,b), min(a,b)]').value).toBe('[1,-1]');

    
      expect(Calculator.calculate('[a]').value).toBe('[1]');
      expect(Calculator.calculate('[-a]').value).toBe('[-1]');
      expect(Calculator.calculate('[--a]').value).toBe('[1]');
      expect(Calculator.calculate('[a+b]').value).toBe('[0]');

      expect(Calculator.calculate('[a 1 1]').value).toBe('[1,1,1]');
      expect(Calculator.calculate('[-a 1 1]').value).toBe('[-1,1,1]');
      expect(Calculator.calculate('[--a 1 1]').value).toBe('[1,1,1]');
      expect(Calculator.calculate('[a,1,1]').value).toBe('[1,1,1]');
      expect(Calculator.calculate('[--a,1,1]').value).toBe('[1,1,1]');

      expect(Calculator.calculate('[a b 2]').value).toBe('[1,-1,2]');
      expect(Calculator.calculate('[a -b 2]').value).toBe('[1,1,2]');
      expect(Calculator.calculate('[a, b, 2]').value).toBe('[1,-1,2]');


      // 应该报错
      expect(() => Calculator.calculate('[1;1;1]')).toThrow();    // 负号不明确
      expect(() => Calculator.calculate('[a - b 1 2]')).toThrow();    // 负号不明确
      expect(() => Calculator.calculate('[a+b 1 2]')).toThrow();    // 不能使用空格
      expect(() => Calculator.calculate('[a, b, x]')).toThrow();    // 未定义的变量x
      

      expect(Calculator.calculate('a = [1 2 3]').value).toBe('[1,2,3]');
      expect(Calculator.calculate('[a.T]').value).toBe('{1,2,3}');
      expect(() => Calculator.calculate('[a]')).toThrow();

    });

    test('列向量 + 矩阵', () => {
      expect(Calculator.calculate('a = [1 2 3]').value).toBe('[1,2,3]');
    });

  });

  describe('行向量创建{}', () => {
    beforeEach(() => {
      Calculator.clearAllCache();
    });
    
    test('基本行向量', () => {
      expect(Calculator.calculate('{1}').value).toBe('[1]');
      expect(Calculator.calculate('{1,2,3}').value).toBe('{1,2,3}');
      expect(Calculator.calculate('{1 2 3}').value).toBe('{1,2,3}');

      expect(Calculator.calculate('{1 -2 --3}').value).toBe('{1,-2,3}');
      expect(Calculator.calculate('{-1 -2 --3}').value).toBe('{-1,-2,3}');

      expect(Calculator.calculate('{- 1 -2 --3}').value).toBe('{-1,-2,3}');
      expect(Calculator.calculate('{---- 1 -2 --3}').value).toBe('{1,-2,3}');

      expect(Calculator.calculate('{1-2}').value).toBe('[-1]');

      expect(Calculator.calculate('{{1; 2; 3}}').value).toBe('[1,2,3]');

      // 报错
      expect(() => Calculator.calculate('{1- 2}')).toThrow();
      expect(() => Calculator.calculate('{1 - 2}')).toThrow();
      expect(() => Calculator.calculate('{1 - 2 3}')).toThrow();
      expect(() => Calculator.calculate('{1 -2 - 3}')).toThrow();
      expect(() => Calculator.calculate('{1- 2 3}')).toThrow();
    });

    test('行向量+变量', () => {
      expect(Calculator.calculate('a = 1').value).toBe('1');
      expect(Calculator.calculate('b = 2').value).toBe('2');
      expect(Calculator.calculate('c = 3').value).toBe('3');

      expect(Calculator.calculate('{a}').value).toBe('[1]');
      expect(Calculator.calculate('{a,b,c}').value).toBe('{1,2,3}');
      expect(Calculator.calculate('{a+1,b+1,c-1}').value).toBe('{2,3,2}');
      
      // 报错
      expect(() => Calculator.calculate('{a+1 b c}')).toThrow();
      
    });

    test('多个行向量', () => {
      expect(Calculator.calculate('{1 2  3} + { 4 5 6 }').value).toBe('{5,7,9}');

      expect(Calculator.calculate('{1,2,3} + {4,5,6}').value).toBe('{5,7,9}');
      expect(Calculator.calculate('{1,2,3} + {4,5,6} + {7,8,9}').value).toBe('{12,15,18}');
      
    });

    test('复杂行向量', () => {
      expect(Calculator.calculate('{1}').value).toBe('[1]');
      expect(Calculator.calculate('{----1}').value).toBe('[1]');
      expect(Calculator.calculate('{1 2 3}').value).toBe('{1,2,3}');
      expect(Calculator.calculate('{1 -2 -3}').value).toBe('{1,-2,-3}');
      expect(Calculator.calculate('{1,2,3}').value).toBe('{1,2,3}');
      expect(Calculator.calculate('{---2 2 3}').value).toBe('{-2,2,3}');
      expect(Calculator.calculate('{1-2}').value).toBe('[-1]');
      expect(Calculator.calculate('{1+2}').value).toBe('[3]');
      expect(Calculator.calculate('{1*2}').value).toBe('[2]');
      expect(Calculator.calculate('{4/2}').value).toBe('[2]');
      expect(Calculator.calculate('{2**(2)}').value).toBe('[4]');

      expect(Calculator.calculate('{1-2 2 3}').value).toBe('{-1,2,3}');
      expect(Calculator.calculate('{1---2 2 3}').value).toBe('{-1,2,3}');

      // 位运算
      expect(Calculator.calculate('{2^2}').value).toBe('[0]');
      expect(Calculator.calculate('{2or2}').value).toBe('[2]');
      expect(Calculator.calculate('{~2}').value).toBe('[-3]');

      // expect(Calculator.calculate('[2 << 2, 2 or 2]').value).toBe('[0, 2]');
      expect(Calculator.calculate('{2 << 2, 2 or 2}').value).toBe('{8,2}');
      
      // 报错
      expect(() => Calculator.calculate('{1 -2 2 - 3}')).toThrow();
      expect(() => Calculator.calculate('{1 - 2 2 3}')).toThrow();
      expect(() => Calculator.calculate('{2 or 2}')).toThrow();
      expect(() => Calculator.calculate('{2 << 2}')).toThrow();
      expect(() => Calculator.calculate('{2 2 +3}')).toThrow();
      expect(() => Calculator.calculate('{2 2x3 1/2}')).toThrow();

      expect(Calculator.calculate('{1,1 + 1, 1 + 2}').value).toBe('{1,2,3}');
      expect(Calculator.calculate('{+1,1 - 1, 1 * 2}').value).toBe('{1,0,2}');
      expect(Calculator.calculate('{--1,1 / 1, 2 ** 2}').value).toBe('{1,1,4}');
      expect(Calculator.calculate('{max(1, 2, 3)}').value).toBe('[3]');
      expect(Calculator.calculate('{min(1, 2, 3)}').value).toBe('[1]');
      expect(Calculator.calculate('{min(1, 2, 3), max(1, 2, 3), 1 }').value).toBe('{1,3,1}');
    });

    test('复杂行向量 + 变量', () => {
      expect(Calculator.calculate('a = 1').value).toBe('1');
      expect(Calculator.calculate('b = -1').value).toBe('-1');

      expect(Calculator.calculate('{ - a }').value).toBe('[-1]');
      expect(Calculator.calculate('{-a}').value).toBe('[-1]');
      expect(Calculator.calculate('{- a -b}').value).toBe('{-1,1}');
      expect(Calculator.calculate('{ - a -b}').value).toBe('{-1,1}');
      expect(Calculator.calculate('{---a -b}').value).toBe('{-1,1}');
      expect(Calculator.calculate('{a -b}').value).toBe('{1,1}');


      expect(Calculator.calculate('{a , - b}').value).toBe('{1,1}');
      expect(Calculator.calculate('{a ,- b}').value).toBe('{1,1}');

      // 报错
      expect(() => Calculator.calculate('{a - b}')).toThrow();
      expect(() => Calculator.calculate('{a- b}')).toThrow();

      // 单个元素就该报错 TODO
      // expect(Calculator.calculate('[a + b]').value).toBe('[0]');
      // expect(Calculator.calculate('[a * b]').value).toBe('[-1]');
      // expect(Calculator.calculate('[a / b]').value).toBe('[-1]');
      // expect(Calculator.calculate('[a ^ b]').value).toBe('[1]');
      // expect(Calculator.calculate('[a ** b]').value).toBe('[1]');

      expect(Calculator.calculate('{max(a, b)}').value).toBe('[1]');
      expect(Calculator.calculate('{min(a, b)}').value).toBe('[-1]');

      // 多个元素
      expect(Calculator.calculate('{a+b, b-a }').value).toBe('{0,-2}');
      expect(Calculator.calculate('{ a*b, b/a}').value).toBe('{-1,-1}');
      expect(Calculator.calculate('{a^b, b^a}').value).toBe('{-2,-2}');
      expect(Calculator.calculate('{ a**b, b**a }').value).toBe('{1,-1}');
      expect(Calculator.calculate('{max(a,b), min(a,b)}').value).toBe('{1,-1}');

    
      expect(Calculator.calculate('{a}').value).toBe('[1]');
      expect(Calculator.calculate('{-a}').value).toBe('[-1]');
      expect(Calculator.calculate('{--a}').value).toBe('[1]');
      expect(Calculator.calculate('{a+b}').value).toBe('[0]');

      expect(Calculator.calculate('{a 1 1}').value).toBe('{1,1,1}');
      expect(Calculator.calculate('{-a 1 1}').value).toBe('{-1,1,1}');
      expect(Calculator.calculate('{--a 1 1}').value).toBe('{1,1,1}');
      expect(Calculator.calculate('{a,1,1}').value).toBe('{1,1,1}');
      expect(Calculator.calculate('{--a,1,1}').value).toBe('{1,1,1}');

      expect(Calculator.calculate('{a b 2}').value).toBe('{1,-1,2}');
      expect(Calculator.calculate('{a -b 2}').value).toBe('{1,1,2}');
      expect(Calculator.calculate('{a, b, 2}').value).toBe('{1,-1,2}');

      expect(Calculator.calculate('{1;1;1}').value).toBe('[1,1,1]');

      // 应该报错
      expect(() => Calculator.calculate('{a - b 1 2}')).toThrow();    // 负号不明确
      expect(() => Calculator.calculate('{a+b 1 2}')).toThrow();    // 不能使用空格
      expect(() => Calculator.calculate('{a, b, x}')).toThrow();    // 未定义的变量x

    });

    test('行向量 + 矩阵', () => {
      expect(Calculator.calculate('a = {1 2 3}').value).toBe('{1,2,3}');
    });

  });

  describe('基本矩阵创建{}', () => {
    beforeEach(() => {
      Calculator.clearAllCache();
    });
    
    test('数字', () => {
      expect(Calculator.calculate('{1}').value).toBe('[1]');
      expect(Calculator.calculate('{1;2;3}').value).toBe('[1,2,3]');
      expect(Calculator.calculate('{ - 1;--2; -3}').value).toBe('[-1,2,-3]');
      expect(Calculator.calculate('{1 2 3;4 5 6}').value).toBe('{1,2,3;4,5,6}');
      expect(Calculator.calculate('{1,2,3;4 5 6}').value).toBe('{1,2,3;4,5,6}');
      expect(Calculator.calculate('{1,2,3;4,5,6}').value).toBe('{1,2,3;4,5,6}');

      // 报错
      expect(() => Calculator.calculate('{1 - 2 3;4 5 6}')).toThrow();
      expect(() => Calculator.calculate('{1,2 3;4 5 6}')).toThrow();
      expect(() => Calculator.calculate('{1,2-3;4 5 6}')).toThrow();
    });

    test('列向量', () => {
      expect(Calculator.calculate('{[1]}').value).toBe('[1]');
      expect(Calculator.calculate('{[1 2 3]}').value).toBe('[1,2,3]');
      expect(Calculator.calculate('{[1 2 -3]}').value).toBe('[1,2,-3]');
      expect(Calculator.calculate('{[1,2,3]}').value).toBe('[1,2,3]');

      expect(Calculator.calculate('{[1,2,3],[4 5 6]}').value).toBe('{1,4;2,5;3,6}');
      expect(Calculator.calculate('{[1 2 3];[4,5,6]}').value).toBe('[1,2,3,4,5,6]');
      expect(Calculator.calculate('{[1,2,3];[4 5]}').value).toBe('[1,2,3,4,5]');
      
      // 报错
      expect(() => Calculator.calculate('{[1,2 3]}')).toThrow();
      expect(() => Calculator.calculate('{[1,2 3],[4,5]}')).toThrow();
      
    });

    test('行向量', () => {
      expect(Calculator.calculate('{{1}}').value).toBe('[1]');
      expect(Calculator.calculate('{{1 2 3}}').value).toBe('{1,2,3}');
      expect(Calculator.calculate('{{1 2 -3}}').value).toBe('{1,2,-3}');
      expect(Calculator.calculate('{{1,2,3}}').value).toBe('{1,2,3}');

      expect(Calculator.calculate('{{1,2,3},{4 5 6}}').value).toBe('{1,2,3,4,5,6}');
      expect(Calculator.calculate('{{1,2,3},{4 5}}').value).toBe('{1,2,3,4,5}');
      expect(Calculator.calculate('{{1 2 3};{4,5,6}}').value).toBe('{1,2,3;4,5,6}');
      
      // 报错
      expect(() => Calculator.calculate('{{{1,2 3}}}')).toThrow();  // 超过3层
      expect(() => Calculator.calculate('{{1,2 3}}')).toThrow();
      expect(() => Calculator.calculate('{{1,2 3};{4,5}}')).toThrow();
      
    });

    test('数字变量', () => {
      expect(Calculator.calculate('a=1').value).toBe('1');
      expect(Calculator.calculate('b=2').value).toBe('2');
      expect(Calculator.calculate('c=3').value).toBe('3');
      expect(Calculator.calculate('d=4').value).toBe('4');
      expect(Calculator.calculate('f=5').value).toBe('5');
      expect(Calculator.calculate('g=6').value).toBe('6');
      
      expect(Calculator.calculate('{a}').value).toBe('[1]');
      expect(Calculator.calculate('{a;b;c}').value).toBe('[1,2,3]');
      expect(Calculator.calculate('{ - a;--b; -c}').value).toBe('[-1,2,-3]');
      expect(Calculator.calculate('{a b c;d f g}').value).toBe('{1,2,3;4,5,6}');
      expect(Calculator.calculate('{a,b,c;d f g}').value).toBe('{1,2,3;4,5,6}');
      expect(Calculator.calculate('{a,b,c;d,f,g}').value).toBe('{1,2,3;4,5,6}');

      // 报错
      expect(() => Calculator.calculate('{a - b c;d f g}')).toThrow();
      expect(() => Calculator.calculate('{a,b c;d f g}')).toThrow();
      expect(() => Calculator.calculate('{a,b-c;d f g}')).toThrow();
    });

    test('列向量变量', () => {
      expect(Calculator.calculate('a = [1]').value).toBe('[1]');
      expect(Calculator.calculate('{a}').value).toBe('[1]');
      expect(Calculator.calculate('{a,a}').value).toBe('{1,1}');
      expect(Calculator.calculate('{a;a}').value).toBe('[1,1]');

      expect(Calculator.calculate('a = [1 2 3]').value).toBe('[1,2,3]');
      expect(Calculator.calculate('{a}').value).toBe('[1,2,3]');
      expect(Calculator.calculate('{a,a}').value).toBe('{1,1;2,2;3,3}');
      expect(Calculator.calculate('{a;a}').value).toBe('[1,2,3,1,2,3]');
      
      expect(Calculator.calculate('{-a}').value).toBe('[-1,-2,-3]');
      expect(Calculator.calculate('{a+1,a}').value).toBe('{2,1;3,2;4,3}');
      expect(Calculator.calculate('{a;-a}').value).toBe('[1,2,3,-1,-2,-3]');
      
    });

    test('行向量变量', () => {
      expect(Calculator.calculate('a = {1}').value).toBe('[1]');
      expect(Calculator.calculate('{a}').value).toBe('[1]');
      expect(Calculator.calculate('{a,a}').value).toBe('{1,1}');
      expect(Calculator.calculate('{a;a}').value).toBe('[1,1]');

      expect(Calculator.calculate('a = {1 2 3}').value).toBe('{1,2,3}');
      expect(Calculator.calculate('{a}').value).toBe('{1,2,3}');
      expect(Calculator.calculate('{a,a}').value).toBe('{1,2,3,1,2,3}');
      expect(Calculator.calculate('{a;a}').value).toBe('{1,2,3;1,2,3}');
      
      expect(Calculator.calculate('{-a}').value).toBe('{-1,-2,-3}');
      expect(Calculator.calculate('{a + 1 ,a}').value).toBe('{2,3,4,1,2,3}');
      expect(Calculator.calculate('{a; - a}').value).toBe('{1,2,3;-1,-2,-3}');
      
    });

    test('矩阵变量', () => {
      expect(Calculator.calculate('a = {1 2 3;4 5 6}').value).toBe('{1,2,3;4,5,6}');
      expect(Calculator.calculate('{a}').value).toBe('{1,2,3;4,5,6}');
      expect(Calculator.calculate('{a,a}').value).toBe('{1,2,3,1,2,3;4,5,6,4,5,6}');
      expect(Calculator.calculate('{a;a}').value).toBe('{1,2,3;4,5,6;1,2,3;4,5,6}');
      
      expect(Calculator.calculate('{-a}').value).toBe('{-1,-2,-3;-4,-5,-6}');
      expect(Calculator.calculate('{a + 1 ,a}').value).toBe('{2,3,4,1,2,3;5,6,7,4,5,6}');
      expect(Calculator.calculate('{a; - a}').value).toBe('{1,2,3;4,5,6;-1,-2,-3;-4,-5,-6}');
      
    });


  });

  describe('矩阵创建{}', () => {
    beforeEach(() => {
      Calculator.clearAllCache();
    });
    
    test('基本矩阵创建-数字', () => {
      expect(Calculator.calculate('{1}').value).toBe('[1]');
      expect(Calculator.calculate('{1 2 3}').value).toBe('{1,2,3}');
      expect(Calculator.calculate('{1,2,3}').value).toBe('{1,2,3}');
      expect(Calculator.calculate('{1;2;3}').value).toBe('[1,2,3]'); // todo
      expect(Calculator.calculate('{1,2,3;4,5,6}').value).toBe('{1,2,3;4,5,6}');
      expect(Calculator.calculate('{1 2 3;4 5 6}').value).toBe('{1,2,3;4,5,6}');
    });

    test('基本矩阵创建-向量', () => {
      expect(Calculator.calculate('{[1 2 3]}').value).toBe('[1,2,3]');
      expect(Calculator.calculate('{[1 2 3],[1 2 3]}').value).toBe('{1,1;2,2;3,3}');
      expect(Calculator.calculate('{[1 2 3];[1 2 3]}').value).toBe('[1,2,3,1,2,3]');

      expect(Calculator.calculate('{{1 2 3}}').value).toBe('{1,2,3}');
      expect(Calculator.calculate('{{1 2 3};{1 2 3}}').value).toBe('{1,2,3;1,2,3}');
      expect(Calculator.calculate('{{1 2 3},{1 2 3}}').value).toBe('{1,2,3,1,2,3}');

    });

    test('基本矩阵创建-变量', () => {

      // 数字
      expect(Calculator.calculate('a = 1').value).toBe('1');
      expect(Calculator.calculate('b = 2').value).toBe('2');
      expect(Calculator.calculate('c = 3').value).toBe('3');
      expect(Calculator.calculate('{a,b,c}').value).toBe('{1,2,3}');
      expect(Calculator.calculate('{a b c}').value).toBe('{1,2,3}');
      expect(Calculator.calculate('{a;b;c}').value).toBe('[1,2,3]'); 
      expect(Calculator.calculate('{a b c;a b c}').value).toBe('{1,2,3;1,2,3}');
      expect(Calculator.calculate('{a,b,c;a,b,c}').value).toBe('{1,2,3;1,2,3}');

      // 向量
      expect(Calculator.calculate('a = [1 2 3]').value).toBe('[1,2,3]');
      expect(Calculator.calculate('{a,a}').value).toBe('{1,1;2,2;3,3}');
      expect(Calculator.calculate('{a;a}').value).toBe('[1,2,3,1,2,3]');

      expect(Calculator.calculate('a = {1 2 3}').value).toBe('{1,2,3}');
      expect(Calculator.calculate('{a;a}').value).toBe('{1,2,3;1,2,3}');
      expect(Calculator.calculate('{a,a}').value).toBe('{1,2,3,1,2,3}');

    });

    test('创建矩阵混合', () => {
      // 单个元素
      expect(Calculator.calculate('{1}').value).toBe('[1]');
      expect(Calculator.calculate('{[1]}').value).toBe('[1]');


      // 单行矩阵
      expect(Calculator.calculate('{1 2 3}').value).toBe('{1,2,3}');
      expect(Calculator.calculate('{1,2,3}').value).toBe('{1,2,3}');
      expect(Calculator.calculate('{[1 2 3]}').value).toBe('[1,2,3]');
      expect(Calculator.calculate('{[1,2,3]}').value).toBe('[1,2,3]');

      // todo: 是否需要支持
      // expect(Calculator.calculate('{1; 1}').value).toBe('[1,1]');

      // 位运算
      expect(Calculator.calculate('{2^2, 2+1}').value).toBe('{0,3}');
      expect(Calculator.calculate('{2 or 2, 2 and 2}').value).toBe('{2,2}');
      expect(Calculator.calculate('{~2, ~-2}').value).toBe('{-3,1}');

      // 多行矩阵
      expect(Calculator.calculate('{1 2 3;4 5 6}').value).toBe('{1,2,3;4,5,6}');
      expect(Calculator.calculate('{1 2 3;4,5,6}').value).toBe('{1,2,3;4,5,6}');
      expect(Calculator.calculate('{1,2,3;4 5 6}').value).toBe('{1,2,3;4,5,6}');

      // 2x2矩阵
      expect(Calculator.calculate('{1 2;3 4}').value).toBe('{1,2;3,4}');
      expect(Calculator.calculate('{1,2;3,4}').value).toBe('{1,2;3,4}');
      expect(Calculator.calculate('{[1,2];[3,4]}').value).toBe('[1,2,3,4]');
      expect(Calculator.calculate('{[1 2];[3 4]}').value).toBe('[1,2,3,4]');
    
      expect(() => Calculator.calculate('{1,2;[3,4]}')).toThrow();
      expect(() => Calculator.calculate('{[1 2];3 4}')).toThrow();

      expect(() => Calculator.calculate('{[1,2];3,4}')).toThrow();
      expect(() => Calculator.calculate('{1 2;[3 4]}')).toThrow();


      // 3x3矩阵
      expect(Calculator.calculate('{1 2 3;4 5 6;7 8 9}').value).toBe('{1,2,3;4,5,6;7,8,9}');
      expect(Calculator.calculate('{{1 2 3};4 5 6;7 8 9}').value).toBe('{1,2,3;4,5,6;7,8,9}');
      expect(Calculator.calculate('{1 2 3;{4 5 6};7 8 9}').value).toBe('{1,2,3;4,5,6;7,8,9}');
      expect(Calculator.calculate('{1 2 3;4 5 6;{7 8 9}}').value).toBe('{1,2,3;4,5,6;7,8,9}');
      expect(Calculator.calculate('{{1 2 3};{4 5 6};7 8 9}').value).toBe('{1,2,3;4,5,6;7,8,9}');
      expect(Calculator.calculate('{{1 2 3};4 5 6;{7 8 9}}').value).toBe('{1,2,3;4,5,6;7,8,9}');
      expect(Calculator.calculate('{1 2 3;{4 5 6};{7 8 9}}').value).toBe('{1,2,3;4,5,6;7,8,9}');
      expect(Calculator.calculate('{[1 2 3];[4 5 6];[7 8 9]}').value).toBe('[1,2,3,4,5,6,7,8,9]');

      expect(Calculator.calculate('{1,2,3;4,5,6;7,8,9}').value).toBe('{1,2,3;4,5,6;7,8,9}');
      expect(Calculator.calculate('{{1,2,3};4,5,6;7,8,9}').value).toBe('{1,2,3;4,5,6;7,8,9}');
      expect(Calculator.calculate('{1,2,3;{4,5,6};7,8,9}').value).toBe('{1,2,3;4,5,6;7,8,9}');
      expect(Calculator.calculate('{1,2,3;4,5,6;{7,8,9}}').value).toBe('{1,2,3;4,5,6;7,8,9}');
      expect(Calculator.calculate('{{1,2,3};{4,5,6};7,8,9}').value).toBe('{1,2,3;4,5,6;7,8,9}');
      expect(Calculator.calculate('{{1,2,3};4,5,6;{7,8,9}}').value).toBe('{1,2,3;4,5,6;7,8,9}');
      expect(Calculator.calculate('{1,2,3;{4,5,6};{7,8,9}}').value).toBe('{1,2,3;4,5,6;7,8,9}');
      expect(Calculator.calculate('{{1,2,3};{4,5,6};{7,8,9}}').value).toBe('{1,2,3;4,5,6;7,8,9}');

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
      expect(Calculator.calculate('{[1 2];[3 4 5]}').value).toBe('[1,2,3,4,5]');

      expect(() => Calculator.calculate('{1,2;3,4,5}')).toThrow();
      expect(() => Calculator.calculate('{1,2;[3,4,5]}')).toThrow();
      expect(() => Calculator.calculate('{[1,2];3,4,5}')).toThrow();

      expect(() => Calculator.calculate('{2^2  2+1}')).toThrow();
      
    });

    test('矩阵和向量混合构建', () => {
      // 数字
      expect(Calculator.calculate('m = 1').value).toBe('1');
      expect(Calculator.calculate('{m}').value).toBe('[1]');
      expect(Calculator.calculate('{m, m}').value).toBe('{1,1}');

      expect(Calculator.calculate('{ - m }').value).toBe('[-1]');
      expect(Calculator.calculate('{-m}').value).toBe('[-1]');
      expect(Calculator.calculate('{- m -1}').value).toBe('{-1,-1}');
      expect(Calculator.calculate('{ - m -1}').value).toBe('{-1,-1}');
      expect(Calculator.calculate('{---m -1}').value).toBe('{-1,-1}');
      expect(Calculator.calculate('{m -1}').value).toBe('{1,-1}');

      expect(Calculator.calculate('{m , - 1}').value).toBe('{1,-1}');
      expect(Calculator.calculate('{m ,- 1}').value).toBe('{1,-1}');

      // 报错
      expect(() => Calculator.calculate('{m - 1}')).toThrow();
      expect(() => Calculator.calculate('{m- 1}')).toThrow();

      // expect(Calculator.calculate('{m; m}').value).toBe('{1;1}');
      expect(Calculator.calculate('{m, m; m, m}').value).toBe('{1,1;1,1}');


      expect(Calculator.calculate('n = 2').value).toBe('2');
      expect(Calculator.calculate('{m+n}').value).toBe('[3]');
      expect(Calculator.calculate('{m-n}').value).toBe('[-1]');

      // todo: mark
      expect(Calculator.calculate('{m*n}').value).toBe('[2]');  
      expect(Calculator.calculate('{m/n}').value).toBe('[0.5]');
      expect(Calculator.calculate('{m, n}').value).toBe('{1,2}');
      expect(Calculator.calculate('{m, n; m, n}').value).toBe('{1,2;1,2}');
      expect(Calculator.calculate('{max(m, n), 1}').value).toBe('{2,1}');
      expect(Calculator.calculate('{min(m, n),  -+-+1}').value).toBe('{1,1}');
      expect(Calculator.calculate('{m^n}').value).toBe('[3]');
      expect(Calculator.calculate('{n**n}').value).toBe('[4]');

      // 两个元素的运算
      expect(Calculator.calculate('{m + 1, n - 1}').value).toBe('{2,1}');
      expect(Calculator.calculate('{m * 2, n / 2}').value).toBe('{2,1}');
      expect(Calculator.calculate('{m ^ 2, n ** 2}').value).toBe('{3,4}');
      expect(Calculator.calculate('{max(m, 1), min(n, 1)}').value).toBe('{1,1}');

      // 分号和逗号组合
      expect(Calculator.calculate('{m + 1, 1; n - 1, 1}').value).toBe('{2,1;1,1}');
      expect(Calculator.calculate('{m * 2, n+1; n / 2, m + 1}').value).toBe('{2,3;1,2}');
     
      // 列向量
      expect(Calculator.calculate('a = [1,2,3]').value).toBe('[1,2,3]');
      expect(Calculator.calculate('{a}').value).toBe('[1,2,3]');
      expect(Calculator.calculate('{a; a}').value).toBe('[1,2,3,1,2,3]');
      expect(Calculator.calculate('{a, a}').value).toBe('{1,1;2,2;3,3}');
      expect(Calculator.calculate('{a; a; a}').value).toBe('[1,2,3,1,2,3,1,2,3]');
      expect(Calculator.calculate('{a, a, a}').value).toBe('{1,1,1;2,2,2;3,3,3}');

      expect(() => Calculator.calculate('{a; a, a}')).toThrow();
      expect(() => Calculator.calculate('{a, a; a}')).toThrow();
      expect(() => Calculator.calculate('[a]')).toThrow();

      // 行向量
      expect(Calculator.calculate('b = {1 2 3}').value).toBe('{1,2,3}');
      expect(Calculator.calculate('{b}').value).toBe('{1,2,3}');
      expect(Calculator.calculate('{b, b}').value).toBe('{1,2,3,1,2,3}');
      expect(Calculator.calculate('{b; b}').value).toBe('{1,2,3;1,2,3}');
      expect(Calculator.calculate('{b, b, b}').value).toBe('{1,2,3,1,2,3,1,2,3}');
      expect(Calculator.calculate('{b; b; b}').value).toBe('{1,2,3;1,2,3;1,2,3}');

      expect(() => Calculator.calculate('{b; b, b}')).toThrow();
      expect(() => Calculator.calculate('{b, b; b}')).toThrow();
      // 矩阵
      expect(Calculator.calculate('c = {1 2 3;4 5 6}').value).toBe('{1,2,3;4,5,6}');
      expect(Calculator.calculate('{c}').value).toBe('{1,2,3;4,5,6}');

      expect(Calculator.calculate('{c, c, c}').value).toBe('{1,2,3,1,2,3,1,2,3;4,5,6,4,5,6,4,5,6}');
      expect(Calculator.calculate('{c; c; c}').value).toBe('{1,2,3;4,5,6;1,2,3;4,5,6;1,2,3;4,5,6}');


      // 先报错, TODO: 支持矩阵，变成拼接？
      expect(() => Calculator.calculate('{[c, c, c]}')).toThrow();
      
      // 报错
      expect(() => Calculator.calculate('{c, c; c}')).toThrow();
      expect(() => Calculator.calculate('{c; c, c}')).toThrow();

      expect(() => Calculator.calculate('{a; a, a}')).toThrow();
      expect(() => Calculator.calculate('{a, a; a}')).toThrow();
      expect(() => Calculator.calculate('[a; a; a]')).toThrow();

      expect(() => Calculator.calculate('{b; b, b}')).toThrow();
      expect(() => Calculator.calculate('{b, b; b}')).toThrow();
      expect(() => Calculator.calculate('[b; b; b]')).toThrow();
    });

    test('矩阵元素转置', () => {
      expect(Calculator.calculate('{1; 1}').value).toBe('[1,1]');


      expect(Calculator.calculate('a = 1').value).toBe('1');
      expect(Calculator.calculate('{a, a}').value).toBe('{1,1}');
      expect(Calculator.calculate('{a; a}').value).toBe('[1,1]');

      expect(Calculator.calculate('b = 2').value).toBe('2');
      expect(Calculator.calculate('{a; b}').value).toBe('[1,2]');

    });

    // 矩阵拼接
    // test.skip 先跳过测试
    test('矩阵拼接', () => {
      expect(Calculator.calculate('{1; 1}').value).toBe('[1,1]');


      expect(Calculator.calculate('a = 1').value).toBe('1');
      expect(Calculator.calculate('{a, a}').value).toBe('{1,1}');
      expect(Calculator.calculate('{a; a}').value).toBe('[1,1]');

      expect(Calculator.calculate('b = 2').value).toBe('2');
      expect(Calculator.calculate('{a; b}').value).toBe('[1,2]');

      // 矩阵拼接，应该是一个问题
      expect(Calculator.calculate('c = {1 2 3;4 5 6}').value).toBe('{1,2,3;4,5,6}');

      expect(() => Calculator.calculate('{c, c, c}')).not.toThrow();
      expect(() => Calculator.calculate('{c; c; c}')).not.toThrow();


      // TODO: 内部冲突, << 和内部的 <> 冲突
      expect(Calculator.calculate('{2<<2}').value).toBe('[8]');
      expect(Calculator.calculate('{2 or 2, 2 << 2}').value).toBe('{2,8}');
      expect(Calculator.calculate('{2 << 2, 2 >> 2}').value).toBe('{8,0}');

    });


    test('特殊矩阵', () => {
      expect(Calculator.calculate('eye(2)').value).toBe('{1,0;0,1}');
      expect(Calculator.calculate('zeros(2)').value).toBe('[0,0]');
      expect(Calculator.calculate('ones(2)').value).toBe('[1,1]');
      expect(Calculator.calculate('diag([1,2,3])').value).toBe('{1,0,0;0,2,0;0,0,3}');

      expect(Calculator.calculate('range(3)').value).toBe('[0,1,2]');
      expect(Calculator.calculate('range(1, 3)').value).toBe('[1,2]');
      expect(Calculator.calculate('range(1, 3, 1)').value).toBe('[1,2]');
      expect(Calculator.calculate('range(1, 10, 2)').value).toBe('[1,3,5,7,9]');
      expect(Calculator.calculate('range(10, 0, -1)').value).toBe('[10,9,8,7,6,5,4,3,2,1]');


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

    beforeEach(() => {
      Calculator.clearAllCache();
    });


    test('矩阵加法', () => {
      expect(Calculator.calculate('{1 2;3 4} + {1 1;1 1}').value).toBe('{2,3;4,5}');
      expect(Calculator.calculate('{1 2;3 4} + 1').value).toBe('{2,3;4,5}');
      expect(Calculator.calculate('1 + {1 2;3 4} + 1').value).toBe('{3,4;5,6}');
    });

    test('矩阵减法', () => {
      expect(Calculator.calculate('{1 2;3 4} - {1 1;1 1}').value).toBe('{0,1;2,3}');
      expect(Calculator.calculate('{1 2;3 4} - 1').value).toBe('{0,1;2,3}');
      expect(Calculator.calculate('1 - {1 2;3 4} + 1').value).toBe('{1,0;-1,-2}');
    });

    test('矩阵点乘', () => {
      expect(Calculator.calculate('{1 2;3 4} * {2 1;2 1}').value).toBe('{2,2;6,4}');
      expect(Calculator.calculate('{2 1;2 1} * {1 2;3 4}').value).toBe('{2,2;6,4}');
      expect(Calculator.calculate('{1 2;3 4} * 1').value).toBe('{1,2;3,4}');
      expect(Calculator.calculate('1 * {1 2;3 4} * 1').value).toBe('{1,2;3,4}');
      expect(Calculator.calculate('-1 * {1 2;3 4} * 0.5').value).toBe('{-0.5,-1;-1.5,-2}');
    });

    test('矩阵除法', () => {
      expect(Calculator.calculate('{1 2;3 4} / 1').value).toBe('{1,2;3,4}');
      expect(Calculator.calculate('10 / {2 2;5 5} ').value).toBe('{5,5;2,2}');
    });

    test('矩阵乘法', () => {
      expect(Calculator.calculate('{1 2;3 4} @ {1 1;1 1}').value).toBe('{3,3;7,7}');
      expect(Calculator.calculate('[1, 2].T @ [3, 4]').value).toBe('[11]');
      expect(Calculator.calculate('{1, 2}.T @ {3, 4}').value).toBe('{3,4;6,8}');
    });

    test('矩阵转置', () => {
      expect(Calculator.calculate('{1 2;3 4}.T').value).toBe('{1,3;2,4}');
      expect(Calculator.calculate('{1 2 3}.T').value).toBe('[1,2,3]');
      expect(Calculator.calculate('[1 2 3].T').value).toBe('{1,2,3}');
    });

    test('矩阵reshape', () => {
      expect(Calculator.calculate('reshape([1 2 3], 1, 3)').value).toBe('{1,2,3}');
      expect(Calculator.calculate('reshape({1 2 3}, 3, 1)').value).toBe('[1,2,3]');
      expect(Calculator.calculate('reshape({1 2 3 4 5 6}, 3, 2)').value).toBe('{1,2;3,4;5,6}');
      expect(Calculator.calculate('reshape({1 2 3 4 5 6}, 2, 3)').value).toBe('{1,2,3;4,5,6}');
      expect(() => Calculator.calculate('reshape({1 2 3 4 5 6}, 3, 3)')).toThrow();

      expect(Calculator.calculate('resize({1 2 3 4 5 6}, 2, 3)').value).toBe('{1,2,3;4,5,6}');
      expect(() => Calculator.calculate('resize({1 2 3 4 5 6}, 3, 3)')).toThrow();
    });

    test('向量repeat', () => {
      expect(Calculator.calculate('repeat([1 2 3], 3)').value).toBe('{1,1,1;2,2,2;3,3,3}');
      expect(Calculator.calculate('repeat({1 2 3}, 3)').value).toBe('{1,2,3;1,2,3;1,2,3}');

      expect(() => Calculator.calculate('repeat({1 2 3;1 2 3}, 3)')).toThrow();
    });

    test('矩阵求逆inv', () => {
      expect(Calculator.calculate('inv({0,1;-1,0})').value).toBe('{0,-1;1,0}');
      expect(Calculator.calculate('inv({1,0;0,1})').value).toBe('{1,0;0,1}');
      expect(Calculator.calculate('inv({0,-1;1,0})').value).toBe('{0,1;-1,0}');
    });

    
    test('矩阵行列式det', () => {
      expect(Calculator.calculate('det({0,1;-1,0})').value).toBe('1');
      expect(Calculator.calculate('det({0,-1;-1,0})').value).toBe('-1');
      expect(Calculator.calculate('det({0,-1;1,0})').value).toBe('1');
    });

    
    test('矩阵特征值eigenvalues', () => {
      expect(Calculator.calculate('eigenvalues({0,1;-1,0})').value).toBe('[0 + 1i,0  − 1i]');
      expect(Calculator.calculate('eigenvalues({1,0;0,1})').value).toBe('[1,1]');
      expect(Calculator.calculate('eigenvalues({1,0;0,0})').value).toBe('[0,1]');
    });

    test('方程求解solve', () => {
      // 简单的2x2方程组
      expect(Calculator.calculate('solve({0,1;-1,0}, [0,1])').value).toBe('[-1,0]');
      expect(Calculator.calculate('solve({1,1;1,-1}, [2,0])').value).toBe('[1,1]');
      
      // 单位矩阵方程组
      expect(Calculator.calculate('solve({1,0;0,1}, [1,2])').value).toBe('[1,2]');
      
      // 3x3方程组
      expect(Calculator.calculate('solve({1,1,1;0,1,1;0,0,1}, [5,2,1])').value).toBe('[3,1,1]');
      
      // 不可逆矩阵(使用SVD求解)
      expect(Calculator.calculate('solve({1,1;1,1}, [2,2])').value).toBe('[1,1]');
      
      // 错误情况
      expect(() => Calculator.calculate('solve({1,1}, [1,1])')).toThrow();
      expect(() => Calculator.calculate('solve({1,1;1,1}, [1,1,1])')).toThrow();
    });


  });

  describe('矩阵为参数的函数运算', () => {

    beforeEach(() => {
      Calculator.clearAllCache();
    });


    test('三角函数', () => {
      expect(Calculator.calculate('a={pi/2, -pi/2; pi, -pi}').value).toBe('{1.570796,-1.570796;3.141593,-3.141593}');
      
      const sinA = Calculator.calculate('sin(a)').value;
      // {1,-1;0,0} 或 {1,-1;0,-0} 都是对的
      expect(['{1,-1;0,0}', '{1,-1;0,-0}']).toContain(sinA);

      expect(Calculator.calculate('cos(a)').value).toBe('{0,0;-1,-1}');
      expect(Calculator.calculate('tan({pi/4, -pi/4, pi/6})').value).toBe('{1,-1,0.57735}');
      
    });

    test('反三角函数', () => {

      expect(Calculator.calculate('asin([0.5, -0.5])').value).toBe('[0.523599,-0.523599]');
      expect(Calculator.calculate('acos([0.5, -0.5])').value).toBe('[1.047198,2.094395]');
      expect(Calculator.calculate('atan([0.5, -0.5])').value).toBe('[0.463648,-0.463648]');
      
    });

    test('双曲函数', () => {
      expect(Calculator.calculate('a={1,2;3,4}').value).toBe('{1,2;3,4}');
      
      expect(Calculator.calculate('sinh(a)').value).toBe('{1.175201,3.62686;10.017875,27.289917}');
      expect(Calculator.calculate('cosh(a)').value).toBe('{1.543081,3.762196;10.067662,27.308233}');
      expect(Calculator.calculate('tanh(a)').value).toBe('{0.761594,0.964028;0.995055,0.999329}');
      
      // 特殊值
      expect(Calculator.calculate('sinh([0,1,-1])').value).toBe('[0,1.175201,-1.175201]');
      expect(Calculator.calculate('cosh([0,1,-1])').value).toBe('[1,1.543081,1.543081]');
      expect(Calculator.calculate('tanh([0,1,-1])').value).toBe('[0,0.761594,-0.761594]');
      
    });

    test('对数函数', () => {
      expect(Calculator.calculate('a={1,2;e, 10}').value).toBe('{1,2;2.718282,10}');

      expect(Calculator.calculate('ln(a)').value).toBe('{0,0.693147;1,2.302585}');
      expect(Calculator.calculate('lg(a)').value).toBe('{0,0.30103;0.434294,1}');
      expect(Calculator.calculate('lb(a)').value).toBe('{0,1;1.442695,3.321928}');

      expect(Calculator.calculate('log(e, a)').value).toBe('{0,0.693147;1,2.302585}');
      expect(Calculator.calculate('log(10, a)').value).toBe('{0,0.30103;0.434294,1}');
      expect(Calculator.calculate('log(2, a)').value).toBe('{0,1;1.442695,3.321928}');
      
      
      // 错误情况
      expect(Calculator.calculate('ln([0,-1])').value).toBe('[-Infinity,NaN]');

      expect( Calculator.calculate('log(10, [0,-2])').value).toBe('[-Infinity,NaN]');
      
    });

    test('统计函数', () => {

      // max min mean sum std
      expect(Calculator.calculate('a={1,2,3;4,5,6}').value).toBe('{1,2,3;4,5,6}');
      expect(Calculator.calculate('max(a)').value).toBe('6');
      expect(Calculator.calculate('min(a)').value).toBe('1');
      expect(Calculator.calculate('mean(a)').value).toBe('3.5');
      expect(Calculator.calculate('sum(a)').value).toBe('21');
      expect(Calculator.calculate('std(a)').value).toBe('1.7078251276599331');

      // 向量
      expect(Calculator.calculate('max([1,2,3])').value).toBe('3');
      expect(Calculator.calculate('min([1,2,3])').value).toBe('1');
      expect(Calculator.calculate('mean([1,2,3])').value).toBe('2');
      expect(Calculator.calculate('sum([1,2,3])').value).toBe('6');
      expect(Calculator.calculate('std([1,2,3])').value).toBe('0.816496580927726');

      // 多矩阵
      expect(Calculator.calculate('max({1,2;3,4}, {2,1;4,3})').value).toBe('{2,2;4,4}');
      expect(Calculator.calculate('min({1,2;3,4}, {2,1;4,3})').value).toBe('{1,1;3,3}');

      
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