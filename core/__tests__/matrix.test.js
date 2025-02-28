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

      // expect(Calculator.calculate('[2 << 2, 2 or 2]').value).toBe('[0, 2]');
      expect(() => Calculator.calculate('[2 << 2, 2 or 2]')).toThrow();
      
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
      expect(() => Calculator.calculate('[a - b 1 2]')).toThrow();    // 负号不明确
      expect(() => Calculator.calculate('[a+b 1 2]')).toThrow();    // 不能使用空格
      expect(() => Calculator.calculate('[a, b, x]')).toThrow();    // 未定义的变量x
      expect(() => Calculator.calculate('[1;1;1]')).toThrow();      // 不能用分号

      expect(Calculator.calculate('a = [1 2 3]').value).toBe('[1,2,3]');
      expect(() => Calculator.calculate('[a]')).toThrow();  // 不能用方括号

    });

    test('列向量 + 矩阵', () => {
      expect(Calculator.calculate('a = [1 2 3]').value).toBe('[1,2,3]');
    });

  });

  describe('行向量创建', () => {
    beforeEach(() => {
      Calculator.clearAllCache();
    });
    
    test('基本行向量', () => {
      expect(Calculator.calculate('<1>').value).toBe('[1]');
      expect(Calculator.calculate('<1,2,3>').value).toBe('{1,2,3}');
      expect(Calculator.calculate('<1 2 3>').value).toBe('{1,2,3}');

      expect(Calculator.calculate('<1 -2 --3>').value).toBe('{1,-2,3}');
      expect(Calculator.calculate('<-1 -2 --3>').value).toBe('{-1,-2,3}');

      expect(Calculator.calculate('<- 1 -2 --3>').value).toBe('{-1,-2,3}');
      expect(Calculator.calculate('<---- 1 -2 --3>').value).toBe('{1,-2,3}');

      expect(Calculator.calculate('<1-2>').value).toBe('[-1]');

      // 报错
      expect(() => Calculator.calculate('<1- 2>')).toThrow();
      expect(() => Calculator.calculate('<1 - 2>')).toThrow();
      expect(() => Calculator.calculate('<1 - 2 3>')).toThrow();
      expect(() => Calculator.calculate('<1 -2 - 3>')).toThrow();
      expect(() => Calculator.calculate('<1- 2 3>')).toThrow();
    });

    test('行向量+变量', () => {
      expect(Calculator.calculate('a = 1').value).toBe('1');
      expect(Calculator.calculate('b = 2').value).toBe('2');
      expect(Calculator.calculate('c = 3').value).toBe('3');

      expect(Calculator.calculate('<a>').value).toBe('[1]');
      expect(Calculator.calculate('<a,b,c>').value).toBe('{1,2,3}');
      expect(Calculator.calculate('<a+1,b+1,c-1>').value).toBe('{2,3,2}');
      
      // 报错
      expect(() => Calculator.calculate('<a+1 b c>')).toThrow();
      
    });

    test('多个行向量', () => {
      expect(Calculator.calculate('<1 2  3> + < 4 5 6 >').value).toBe('{5,7,9}');

      expect(Calculator.calculate('<1,2,3> + <4,5,6>').value).toBe('{5,7,9}');
      expect(Calculator.calculate('<1,2,3> + <4,5,6> + <7,8,9>').value).toBe('{12,15,18}');
      
    });

    test('复杂行向量', () => {
      expect(Calculator.calculate('<1>').value).toBe('[1]');
      expect(Calculator.calculate('<----1>').value).toBe('[1]');
      expect(Calculator.calculate('<1 2 3>').value).toBe('{1,2,3}');
      expect(Calculator.calculate('<1 -2 -3>').value).toBe('{1,-2,-3}');
      expect(Calculator.calculate('<1,2,3>').value).toBe('{1,2,3}');
      expect(Calculator.calculate('<---2 2 3>').value).toBe('{-2,2,3}');
      expect(Calculator.calculate('<1-2>').value).toBe('[-1]');
      expect(Calculator.calculate('<1+2>').value).toBe('[3]');
      expect(Calculator.calculate('<1*2>').value).toBe('[2]');
      expect(Calculator.calculate('<4/2>').value).toBe('[2]');
      expect(Calculator.calculate('<2**(2)>').value).toBe('[4]');

      expect(Calculator.calculate('<1-2 2 3>').value).toBe('{-1,2,3}');
      expect(Calculator.calculate('<1---2 2 3>').value).toBe('{-1,2,3}');

      // 位运算
      expect(Calculator.calculate('<2^2>').value).toBe('[0]');
      expect(Calculator.calculate('<2or2>').value).toBe('[2]');
      expect(Calculator.calculate('<~2>').value).toBe('[-3]');

      // expect(Calculator.calculate('[2 << 2, 2 or 2]').value).toBe('[0, 2]');
      expect(() => Calculator.calculate('<2 << 2, 2 or 2>')).toThrow();
      
      // 报错
      expect(() => Calculator.calculate('<1 -2 2 - 3>')).toThrow();
      expect(() => Calculator.calculate('<1 - 2 2 3>')).toThrow();
      expect(() => Calculator.calculate('<2 or 2>')).toThrow();
      expect(() => Calculator.calculate('<2 << 2>')).toThrow();
      expect(() => Calculator.calculate('<2 2 +3>')).toThrow();
      expect(() => Calculator.calculate('<2 2x3 1/2>')).toThrow();

      expect(Calculator.calculate('<1,1 + 1, 1 + 2>').value).toBe('{1,2,3}');
      expect(Calculator.calculate('<+1,1 - 1, 1 * 2>').value).toBe('{1,0,2}');
      expect(Calculator.calculate('<--1,1 / 1, 2 ** 2>').value).toBe('{1,1,4}');
      expect(Calculator.calculate('<max(1, 2, 3)>').value).toBe('[3]');
      expect(Calculator.calculate('<min(1, 2, 3)>').value).toBe('[1]');
      expect(Calculator.calculate('<min(1, 2, 3), max(1, 2, 3), 1 >').value).toBe('{1,3,1}');
    });

    test('复杂行向量 + 变量', () => {
      expect(Calculator.calculate('a = 1').value).toBe('1');
      expect(Calculator.calculate('b = -1').value).toBe('-1');

      expect(Calculator.calculate('< - a >').value).toBe('[-1]');
      expect(Calculator.calculate('<-a>').value).toBe('[-1]');
      expect(Calculator.calculate('<- a -b>').value).toBe('{-1,1}');
      expect(Calculator.calculate('< - a -b>').value).toBe('{-1,1}');
      expect(Calculator.calculate('<---a -b>').value).toBe('{-1,1}');
      expect(Calculator.calculate('<a -b>').value).toBe('{1,1}');


      expect(Calculator.calculate('<a , - b>').value).toBe('{1,1}');
      expect(Calculator.calculate('<a ,- b>').value).toBe('{1,1}');

      // 报错
      expect(() => Calculator.calculate('<a - b>')).toThrow();
      expect(() => Calculator.calculate('<a- b>')).toThrow();

      // 单个元素就该报错 TODO
      // expect(Calculator.calculate('[a + b]').value).toBe('[0]');
      // expect(Calculator.calculate('[a * b]').value).toBe('[-1]');
      // expect(Calculator.calculate('[a / b]').value).toBe('[-1]');
      // expect(Calculator.calculate('[a ^ b]').value).toBe('[1]');
      // expect(Calculator.calculate('[a ** b]').value).toBe('[1]');

      expect(Calculator.calculate('<max(a, b)>').value).toBe('[1]');
      expect(Calculator.calculate('<min(a, b)>').value).toBe('[-1]');

      // 多个元素
      expect(Calculator.calculate('<a+b, b-a >').value).toBe('{0,-2}');
      expect(Calculator.calculate('< a*b, b/a>').value).toBe('{-1,-1}');
      expect(Calculator.calculate('<a^b, b^a>').value).toBe('{-2,-2}');
      expect(Calculator.calculate('< a**b, b**a >').value).toBe('{1,-1}');
      expect(Calculator.calculate('<max(a,b), min(a,b)>').value).toBe('{1,-1}');

    
      expect(Calculator.calculate('<a>').value).toBe('[1]');
      expect(Calculator.calculate('<-a>').value).toBe('[-1]');
      expect(Calculator.calculate('<--a>').value).toBe('[1]');
      expect(Calculator.calculate('<a+b>').value).toBe('[0]');

      expect(Calculator.calculate('<a 1 1>').value).toBe('{1,1,1}');
      expect(Calculator.calculate('<-a 1 1>').value).toBe('{-1,1,1}');
      expect(Calculator.calculate('<--a 1 1>').value).toBe('{1,1,1}');
      expect(Calculator.calculate('<a,1,1>').value).toBe('{1,1,1}');
      expect(Calculator.calculate('<--a,1,1>').value).toBe('{1,1,1}');

      expect(Calculator.calculate('<a b 2>').value).toBe('{1,-1,2}');
      expect(Calculator.calculate('<a -b 2>').value).toBe('{1,1,2}');
      expect(Calculator.calculate('<a, b, 2>').value).toBe('{1,-1,2}');

      // 应该报错
      expect(() => Calculator.calculate('<a - b 1 2>')).toThrow();    // 负号不明确
      expect(() => Calculator.calculate('<a+b 1 2>')).toThrow();    // 不能使用空格
      expect(() => Calculator.calculate('<a, b, x>')).toThrow();    // 未定义的变量x
      expect(() => Calculator.calculate('<1;1;1>')).toThrow();      // 不能用分号// 不能用方括号

    });

    test('行向量 + 矩阵', () => {
      expect(Calculator.calculate('a = <1 2 3>').value).toBe('{1,2,3}');
    });

  });

  describe('矩阵创建I型', () => {
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
      expect(Calculator.calculate('{[1 2 3];[1 2 3]}').value).toBe('{1,2,3;1,2,3}');

      expect(Calculator.calculate('{{1 2 3}}').value).toBe('{1,2,3}');
      expect(Calculator.calculate('{{1 2 3};{1 2 3}}').value).toBe('{1,1;2,2;3,3}');
      expect(Calculator.calculate('{{1 2 3},{1 2 3}}').value).toBe('{1,2,3;1,2,3}');

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
      expect(Calculator.calculate('{a;a}').value).toBe('{1,2,3;1,2,3}');

      expect(Calculator.calculate('a = {1 2 3}').value).toBe('{1,2,3}');
      expect(Calculator.calculate('{a;a}').value).toBe('{1,1;2,2;3,3}');
      expect(Calculator.calculate('{a,a}').value).toBe('{1,2,3;1,2,3}');

      // 矩阵
      expect(Calculator.calculate('a = {1 2 3;4 5 6}').value).toBe('{1,2,3;4,5,6}');
      // 报错
      expect(() => Calculator.calculate('{a,a}')).toThrow();
      expect(() => Calculator.calculate('{a;a}')).toThrow();
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
      expect(Calculator.calculate('{m + n}').value).toBe('[3]');
      expect(Calculator.calculate('{m-n}').value).toBe('[-1]');

      // todo: mark
      expect(Calculator.calculate('{m * n}').value).toBe('[2]');  
      expect(Calculator.calculate('{m / n}').value).toBe('[0.5]');
      expect(Calculator.calculate('{m, n}').value).toBe('{1,2}');
      expect(Calculator.calculate('{m, n; m, n}').value).toBe('{1,2;1,2}');
      expect(Calculator.calculate('{max(m, n)}').value).toBe('[2]');
      expect(Calculator.calculate('{min(m, n)}').value).toBe('[1]');
      expect(Calculator.calculate('{m ^ n}').value).toBe('[3]');
      expect(Calculator.calculate('{n ** n}').value).toBe('[4]');

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

      // 矩阵
      expect(Calculator.calculate('c = {1 2 3;4 5 6}').value).toBe('{1,2,3;4,5,6}');
      expect(Calculator.calculate('{c}').value).toBe('{1,2,3;4,5,6}');

      // 先报错, TODO: 支持矩阵，变成拼接？
      expect(() => Calculator.calculate('{[c, c, c]}')).toThrow();
      expect(() => Calculator.calculate('{c, c, c}')).toThrow();
      expect(() => Calculator.calculate('{c; c; c}')).toThrow();

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

      // expect(Calculator.calculate('{a+1; b-1}').value).toBe('[2,1]');
      // expect(Calculator.calculate('{a*2; b/2}').value).toBe('[2,1]');
      // expect(Calculator.calculate('{a^2; b**2}').value).toBe('[3,4]');
      // expect(Calculator.calculate('{max(a, 1); min(b, 1)}').value).toBe('[1,1]');
    });

    // 矩阵拼接
    // test.skip 先跳过测试
    test.skip('矩阵拼接', () => {
      expect(Calculator.calculate('{1; 1}').value).toBe('[1,1]');


      expect(Calculator.calculate('a = 1').value).toBe('1');
      expect(Calculator.calculate('{a, a}').value).toBe('{1,1}');
      expect(Calculator.calculate('{a; a}').value).toBe('[1,1]');

      expect(Calculator.calculate('b = 2').value).toBe('2');
      expect(Calculator.calculate('{a; b}').value).toBe('[1,2]');

      expect(Calculator.calculate('{a + 1; b - 1}').value).toBe('[2,1]');
      expect(Calculator.calculate('{a * 2; b / 2}').value).toBe('[2,1]');
      expect(Calculator.calculate('{a ^ 2; b ** 2}').value).toBe('[3,4]');
      expect(Calculator.calculate('{max(a, 1); min(b, 1)}').value).toBe('[1,1]');

      // 矩阵拼接，应该是一个问题
      expect(Calculator.calculate('c = {1 2 3;4 5 6}').value).toBe('{1,2,3;4,5,6}');

      expect(() => Calculator.calculate('{[c, c, c]}')).not.toThrow();
      expect(() => Calculator.calculate('{c, c, c}')).not.toThrow();
      expect(() => Calculator.calculate('{c; c; c}')).not.toThrow();


      // TODO: 内部冲突, << 和内部的 <> 冲突
      expect(Calculator.calculate('{2 << 2}').value).toBe('{8}');
      expect(Calculator.calculate('{2 or 2, 2 << 2}').value).toBe('{2,8}');
      expect(Calculator.calculate('{2 << 2, 2 >> 2}').value).toBe('{8,0}');

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


  describe.skip('矩阵创建II型', () => {
    beforeEach(() => {
      Calculator.clearAllCache();
    });
    
    test('基础', () => {
      expect(Calculator.calculate('{1 2 3;4 5 6}').value).toBe('{1,2,3;4,5,6}');
    });
    
  });

  describe.skip('矩阵运算', () => {
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

  describe.skip('矩阵错误处理', () => {
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