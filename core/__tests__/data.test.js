import { Calculator } from '../calculator.js';

describe('日期时间数据类型测试', () => {
    beforeEach(() => {
        Calculator.clearAllCache();
    });

    describe('日期格式', () => {
        beforeEach(() => {
            Calculator.clearAllCache();
        });

        test('当前时间相关', () => {
            // 这些测试可能会因为时间变化而不稳定，我们只测试它们不会抛出错误
            expect(() => Calculator.calculate('@now')).not.toThrow();
            expect(() => Calculator.calculate('@today')).not.toThrow();
            expect(() => Calculator.calculate('@now - #7d > @')).not.toThrow();
            expect(() => Calculator.calculate('@now+#1y > @')).not.toThrow();
            expect(() => Calculator.calculate('@now - #1y > @')).not.toThrow();
            expect(() => Calculator.calculate('@today+#1m > @')).not.toThrow();
            expect(() => Calculator.calculate('@today - #1m > @')).not.toThrow();
        });
    });

    describe('日期计算', () => {
        beforeEach(() => {
            Calculator.clearAllCache();
        });

        test('完整日期时间格式', () => {
            expect(Calculator.calculate('@2020-03-15 14:30:00').value).toBe(1584253800000);
            expect(Calculator.calculate('@2020-03-15 14:30').value).toBe(1584253800000);
            expect(Calculator.calculate('@2020-03-15').value).toBe(1584201600000);
        });

        test('月日时间格式', () => {
            expect(Calculator.calculate('@03-15 14:30:00').value).toBe(1742020200000);
            expect(Calculator.calculate('@03-15 14:30').value).toBe(1742020200000);
        });

        test('年月格式', () => {
            expect(Calculator.calculate('@2020-03').value).toBe(1582992000000);
        });

        test('月日和年份格式', () => {
            expect(Calculator.calculate('@03-15').value).toBe(1741968000000);
            expect(Calculator.calculate('@2020').value).toBe(1577808000000);
        });

        test('时分秒格式', () => {
            expect(Calculator.calculate('#17:30:00').value).toBe('63000000ms');
            expect(Calculator.calculate('#11:30').value).toBe('41400000ms');
        });

        test('日期运算', () => {
            expect(Calculator.calculate('@2077-03-15 - @1990-03-14 > #').value).toBe('31778天 0小时 0分钟 0秒');
            expect(Calculator.calculate('@2077-03-15+#1y2m3d > @').value).toBe('2078-05-18');
            expect(Calculator.calculate('@2077-03-15 - #1y2m3d > @').value).toBe('2076-01-12');
            expect(Calculator.calculate('@2077-03-15 14:30:00+#12h30mm > @').value).toBe('2077-03-16 03:00:00');
            expect(Calculator.calculate('@2077-03-15 14:30:00 - #12h30mm > @').value).toBe('2077-03-15 02:00:00');
        });

        test('日期加法错误处理', () => {
            expect(() => Calculator.calculate('@2077-03-15+@2077-1-1')).toThrow();
        });

        test('时间组合显示', () => {
            expect(Calculator.calculate('#3w4d5h6mm7s8ms > # ').value).toBe('25天 5小时 6分钟 7秒');
            expect(Calculator.calculate('#3w4d5h6mm7s8ms > # w ').value).toBe('3.60周');
            expect(Calculator.calculate('#3w4d5h6mm7s8ms > # d ').value).toBe('25.21天');
            expect(Calculator.calculate('#3w4d5h6mm7s8ms > # h ').value).toBe('605.10小时');
            expect(Calculator.calculate('#3w4d5h6mm7s8ms > # m ').value).toBe('36306.12分钟');
            expect(Calculator.calculate('#3w4d5h6mm7s8ms > # s ').value).toBe('2178367.01秒');
        });
    });

    describe('时间戳转日期', () => {
        beforeEach(() => {
            Calculator.clearAllCache();
        });

        test('时间戳转日期', () => {
            expect(Calculator.calculate('#1693827361289').value).toBe('2023-09-04 19:36:01');
            expect(Calculator.calculate('#1584201600000').value).toBe('2020-03-15');
            expect(Calculator.calculate('#1582992000000').value).toBe('2020-03-01');
            expect(Calculator.calculate('#-315648000000').value).toBe('1960-01-01');
            expect(Calculator.calculate('#-2209017943000').value).toBe('1900-01-01');
        });
    });

    describe('时间间隔语法糖', () => {
        beforeEach(() => {
            Calculator.clearAllCache();
        });

        test('带括号的语法糖', () => {
            expect(Calculator.calculate('#(7)w').value).toBe('4233600000ms');
            expect(Calculator.calculate('#(24)h').value).toBe('86400000ms');
            expect(Calculator.calculate('#(60)mm').value).toBe('3600000ms');
            expect(Calculator.calculate('#(1)d').value).toBe('86400000ms');
            expect(Calculator.calculate('#(30)s').value).toBe('30000ms');
            expect(Calculator.calculate('#(500)ms').value).toBe('500ms');
        });

        test('无括号的语法糖', () => {
            expect(Calculator.calculate('#7w').value).toBe('4233600000ms');
            expect(Calculator.calculate('#1.5d').value).toBe('129600000ms');
            expect(Calculator.calculate('#24h').value).toBe('86400000ms');
            expect(Calculator.calculate('#60mm').value).toBe('3600000ms');
            expect(Calculator.calculate('#1d').value).toBe('86400000ms');
            expect(Calculator.calculate('#1D').value).toBe('86400000ms');
            expect(Calculator.calculate('#30s').value).toBe('30000ms');
            expect(Calculator.calculate('#500ms').value).toBe('500ms');
        });
    });

    describe('复合时间间隔', () => {
        beforeEach(() => {
            Calculator.clearAllCache();
        });

        test('无括号格式相加', () => {
            expect(Calculator.calculate('#1d+#24h').value).toBe('172800000ms');
            expect(Calculator.calculate('#(1)d+#24h').value).toBe('172800000ms');
            expect(Calculator.calculate('#7w+#7d+#24h').value).toBe('4924800000ms');
            expect(Calculator.calculate('#(7)w+#7d+#(24)h').value).toBe('4924800000ms');
        });

        test('日期加时间间隔', () => {
            expect(Calculator.calculate('@2091-03-15+#7d+#12h > @').value).toBe('2091-03-22 12:00:00');
        });
    });

    describe('时间间隔异常测试', () => {
        beforeEach(() => {
            Calculator.clearAllCache();
        });

        test('无效时间间隔格式', () => {
            expect(() => Calculator.calculate('#d')).toThrow();
            expect(() => Calculator.calculate('#abc d')).toThrow();
            expect(() => Calculator.calculate('#1dd')).toThrow();
            expect(() => Calculator.calculate('#1dh')).toThrow();
            expect(() => Calculator.calculate('#d1')).toThrow();
            expect(() => Calculator.calculate('#1t')).toThrow();
            expect(() => Calculator.calculate('#1x')).toThrow();
        });
    });

    describe('时间间隔处理顺序', () => {
        beforeEach(() => {
            Calculator.clearAllCache();
        });

        test('基本格式转换', () => {
            expect(Calculator.calculate('#1d').value).toBe('86400000ms');
            expect(Calculator.calculate('#(1)d').value).toBe('86400000ms');
            expect(Calculator.calculate('#((1))d').value).toBe('86400000ms');
            expect(Calculator.calculate('#1.5d').value).toBe('129600000ms');
            expect(Calculator.calculate('#(1.5)d').value).toBe('129600000ms');
        });

        test('混合格式', () => {
            expect(Calculator.calculate('#1d+#(2)d').value).toBe('259200000ms');
            expect(Calculator.calculate('#1.5d+#(1.5)d').value).toBe('259200000ms');
            expect(Calculator.calculate('#1.5d +#(1.5)d').value).toBe('259200000ms');
        });

        test('括号内计算', () => {
            expect(Calculator.calculate('#(1+2)d').value).toBe('259200000ms');
            expect(Calculator.calculate('#(24*2)h').value).toBe('172800000ms');
            expect(Calculator.calculate('#(60/2)mm').value).toBe('1800000ms');
        });

        test('多单位混合', () => {
            expect(Calculator.calculate('#1.5d+#36h+#(90)mm').value).toBe('264600000ms');
            expect(Calculator.calculate('#(7*0.5)d+#(12*2)h').value).toBe('388800000ms');
        });

        test('单位转换测试', () => {
            // 天
            expect(Calculator.calculate('#1d').value).toBe('86400000ms');
            expect(Calculator.calculate('#1day').value).toBe('86400000ms');
            expect(Calculator.calculate('#1days').value).toBe('86400000ms');
            
            // 小时
            expect(Calculator.calculate('#1h').value).toBe('3600000ms');
            expect(Calculator.calculate('#1hour').value).toBe('3600000ms');
            expect(Calculator.calculate('#1hours').value).toBe('3600000ms');
            
            // 分钟
            expect(Calculator.calculate('#1mm').value).toBe('60000ms');
            expect(Calculator.calculate('#1minute').value).toBe('60000ms');
            expect(Calculator.calculate('#1minutes').value).toBe('60000ms');
            
            // 秒
            expect(Calculator.calculate('#1s').value).toBe('1000ms');
            expect(Calculator.calculate('#1second').value).toBe('1000ms');
            expect(Calculator.calculate('#1seconds').value).toBe('1000ms');
            
            // 周
            expect(Calculator.calculate('#1w').value).toBe('604800000ms');
            expect(Calculator.calculate('#1week').value).toBe('604800000ms');
            expect(Calculator.calculate('#1weeks').value).toBe('604800000ms');
            
            // 毫秒
            expect(Calculator.calculate('#1ms').value).toBe('1ms');
            expect(Calculator.calculate('#1millisecond').value).toBe('1ms');
            expect(Calculator.calculate('#1milliseconds').value).toBe('1ms');
        });

        test('带括号格式的单位转换', () => {
            expect(Calculator.calculate('#(1)d').value).toBe('86400000ms');
            expect(Calculator.calculate('#(1)day').value).toBe('86400000ms');
            expect(Calculator.calculate('#(1)days').value).toBe('86400000ms');
        });

        test('复合表达式中的单位转换', () => {
            expect(Calculator.calculate('#1d+#1day+#1days').value).toBe('259200000ms');
            expect(Calculator.calculate('#1h+#1hour+#1hours').value).toBe('10800000ms');
            expect(Calculator.calculate('#(1)d+#(2)day+#(3)days').value).toBe('518400000ms');
        });

        test('复杂括号表达式', () => {
            expect(Calculator.calculate('#(7*0.5)d+#(12*2)h').value).toBe('388800000ms');
            expect(Calculator.calculate('#(3+2)d+#(60*2)mm').value).toBe('439200000ms');
            expect(Calculator.calculate('#(6/2)h+#(30*10)mm').value).toBe('28800000ms');
        });

        test('多个单位混合', () => {
            expect(Calculator.calculate('#(7)d+#(12)h+#(60)mm').value).toBe('651600000ms');
            expect(Calculator.calculate('#(0.5)d+#(6)h+#(15)mm+#(30)s').value).toBe('65730000ms');
        });

        test('边界情况', () => {
            expect(Calculator.calculate('#(1+2*3)d').value).toBe('604800000ms');
            expect(Calculator.calculate('#(1.5*2)d+#(3.5*2)h').value).toBe('284400000ms');
            expect(Calculator.calculate('#(10/2)h+#(120/2)mm').value).toBe('21600000ms');
        });

        test('函数调用测试', () => {
            expect(Calculator.calculate('#(max(1,2))d').value).toBe('172800000ms');
            expect(Calculator.calculate('#(min(24,12))h').value).toBe('43200000ms');
            expect(Calculator.calculate('#(abs(-1.5))d').value).toBe('129600000ms');
            expect(Calculator.calculate('#(max(1,min(3,4)))d').value).toBe('259200000ms');
            expect(Calculator.calculate('#(max(1,2)*3)d').value).toBe('518400000ms');
            expect(Calculator.calculate('#(min(2+3,4)*2)h').value).toBe('28800000ms');
            expect(Calculator.calculate('#(abs(-2))d+#(max(1, 1.6))h').value).toBe('178560000ms');
        });
    });

    describe('时间间隔边界测试', () => {
        beforeEach(() => {
            Calculator.clearAllCache();
        });

        test('非法格式测试', () => {
            expect(() => Calculator.calculate('#1d()')).toThrow();
            expect(() => Calculator.calculate('#()d')).toThrow();
            expect(() => Calculator.calculate('#1d+d')).toThrow();
        });

        test('非法数值测试', () => {
            expect(() => Calculator.calculate('#0xFFd')).toThrow();
            expect(() => Calculator.calculate('#1_000d')).toThrow();
            expect(() => Calculator.calculate('#1e3d')).toThrow();
            expect(() => Calculator.calculate('#.5d')).toThrow();
        });

        test('单位组合测试', () => {
            expect(() => Calculator.calculate('#1dh')).toThrow();
            expect(() => Calculator.calculate('#1hd')).toThrow();
            expect(() => Calculator.calculate('#1dd')).toThrow();
        });

        test('嵌套表达式测试', () => {
            expect(() => Calculator.calculate('#(1+1)d+#(#(2)h+#(30)m)')).toThrow();
            expect(() => Calculator.calculate('#(2*#(1)h)d')).toThrow();
            expect(() => Calculator.calculate('#(max(#(1)h, #(30)m))m')).toThrow();
        });
    });

    describe('年月日语法糖测试', () => {
        beforeEach(() => {
            Calculator.clearAllCache();
        });

        test('错误情况测试', () => {
            expect(() => Calculator.calculate('#y')).toThrow();
            expect(() => Calculator.calculate('#1y2y')).toThrow();
            expect(() => Calculator.calculate('#1x2y')).toThrow();
            expect(() => Calculator.calculate('#0-1d0-1m')).toThrow();
            expect(() => Calculator.calculate('#0-1m0-1y')).toThrow();
        });
    });

    describe('复合时间间隔1', () => {
        beforeEach(() => {
            Calculator.clearAllCache();
        });

        test('年月日和天数混合', () => {
            expect(Calculator.calculate('@2025-03-15+#7w+#7d > @').value).toBe('2025-05-10');
            expect(Calculator.calculate('@2025-03-15 - #7w - #7d > @').value).toBe('2025-01-18');
        });
    });

    describe('时间间隔语法糖组合测试', () => {
        beforeEach(() => {
            Calculator.clearAllCache();
        });

        test('完整时间组合', () => {
            expect(Calculator.calculate('#1y2m3w4d5h6mm7s8ms').value).toBe('1年2月+2178367008ms');
            expect(Calculator.calculate('#1year2month3week4day5hour6minute7second8millisecond').value).toBe('1年2月+2178367008ms');
            expect(Calculator.calculate('#5y').value).toBe('5年+0ms');
            expect(Calculator.calculate('#10m').value).toBe('10月+0ms');
            expect(Calculator.calculate('#2w').value).toBe('1209600000ms');
            expect(Calculator.calculate('#3d').value).toBe('259200000ms');
        });
    });

    describe('小数时间间隔测试', () => {
        beforeEach(() => {
            Calculator.clearAllCache();
        });

        test('小数时间间隔', () => {
            expect(() => Calculator.calculate('#1.5y')).toThrow();
            expect(() => Calculator.calculate('#2.5m')).toThrow();
            expect(Calculator.calculate('#0.5w').value).toBe('302400000ms');
            expect(Calculator.calculate('#1.5d').value).toBe('129600000ms');
        });
    });

    describe('空格处理测试', () => {
        beforeEach(() => {
            Calculator.clearAllCache();
        });

        test('带空格的组合', () => {
            expect(Calculator.calculate('# 1y 2m 3w').value).toBe('1年2月+1814400000ms');
            expect(Calculator.calculate('# 1year 2month 3week').value).toBe('1年2月+1814400000ms');
            expect(Calculator.calculate('# 1years 2months 3weeks').value).toBe('1年2月+1814400000ms');
            expect(Calculator.calculate('#1y 2m').value).toBe('1年2月+0ms');
            expect(Calculator.calculate('#1year 2month').value).toBe('1年2月+0ms');
            expect(Calculator.calculate('#1years 2months').value).toBe('1年2月+0ms');
            expect(Calculator.calculate('# 1d').value).toBe('86400000ms');
            expect(Calculator.calculate('# 1day').value).toBe('86400000ms');
            expect(Calculator.calculate('# 1days').value).toBe('86400000ms');
        });
    });

    describe('组合时间间隔测试', () => {
        beforeEach(() => {
            Calculator.clearAllCache();
        });

        test('年天组合', () => {
            expect(Calculator.calculate('#1y3d').value).toBe('1年+259200000ms');
            expect(Calculator.calculate('#1y3days').value).toBe('1年+259200000ms');
            expect(Calculator.calculate('#1y3day').value).toBe('1年+259200000ms');
            expect(Calculator.calculate('#1year3days').value).toBe('1年+259200000ms');
            expect(Calculator.calculate('#1year3d').value).toBe('1年+259200000ms');
            expect(Calculator.calculate('#1years3days').value).toBe('1年+259200000ms');
        });

        test('月时组合', () => {
            expect(Calculator.calculate('#2m12h').value).toBe('2月+43200000ms');
            expect(Calculator.calculate('#2months12hours').value).toBe('2月+43200000ms');
            expect(Calculator.calculate('#2months12hour').value).toBe('2月+43200000ms');
            expect(Calculator.calculate('#2months12h').value).toBe('2月+43200000ms');
            expect(Calculator.calculate('#2month12h').value).toBe('2月+43200000ms');
            expect(Calculator.calculate('#2m12hours').value).toBe('2月+43200000ms');
        });

        test('其他组合', () => {
            expect(Calculator.calculate('#1w30mm').value).toBe('606600000ms');
            expect(Calculator.calculate('#5d100ms').value).toBe('432000100ms');
        });
    });

    describe('复合表达式测试', () => {
        beforeEach(() => {
            Calculator.clearAllCache();
        });

        test('长组合相加减', () => {
            expect(Calculator.calculate('#1y0m3w4d5h6mm7s8ms+#0y2m3w').value).toBe('1年2月+3992767008ms');
            expect(Calculator.calculate('#2m12h+#1y2m3w').value).toBe('1年4月+1857600000ms');
            expect(Calculator.calculate('#2m+#1d').value).toBe('2月+86400000ms');
            expect(Calculator.calculate('#2m - #1d').value).toBe('2月+-86400000ms');
        });
    });

    describe('括号表达式测试', () => {
        beforeEach(() => {
            Calculator.clearAllCache();
        });

        test('多括号组合', () => {
            expect(Calculator.calculate('#(1+2)y(3*4)m(5-2)w').value).toBe('3年12月+1814400000ms');
            expect(Calculator.calculate('#(+1)y(-2)m').value).toBe('1年-2月+0ms');
            expect(Calculator.calculate('#(1.5*2)y(6/2)m').value).toBe('3年3月+0ms');
        });

        test('未知函数错误', () => {
            expect(() => Calculator.calculate('#(foo())y(bar())m')).toThrow();
        });
    });

    describe('混合括号测试', () => {
        beforeEach(() => {
            Calculator.clearAllCache();
        });

        test('部分带括号', () => {
            expect(Calculator.calculate('#(1+2)y3m(4-1)w').value).toBe('3年3月+1814400000ms');
            expect(Calculator.calculate('#1y(2*3)m4d').value).toBe('1年6月+345600000ms');
            expect(Calculator.calculate('#((1+2)*3)y').value).toBe('9年+0ms');
        });
    });

    describe('错误处理测试', () => {
        beforeEach(() => {
            Calculator.clearAllCache();
        });

        test('语法错误', () => {
            expect(() => Calculator.calculate('#y')).toThrow();
            expect(() => Calculator.calculate('#1ym')).toThrow();
            expect(() => Calculator.calculate('#1y2mw')).toThrow();
            expect(() => Calculator.calculate('#((1+2)y')).toThrow();
            expect(() => Calculator.calculate('#(1 ,2)y')).toThrow();
        });
    });

    describe('负数时间间隔测试', () => {
        beforeEach(() => {
            Calculator.clearAllCache();
        });

        test('负数时间间隔', () => {
            expect(Calculator.calculate('#-1.5d').value).toBe('-129600000ms');
            expect(Calculator.calculate('#(0-3)d').value).toBe('-259200000ms');
            expect(Calculator.calculate('#(-1)y(-2)m').value).toBe('-1年-2月+0ms');
        });
    });

    describe('时间间隔乘除测试', () => {
        beforeEach(() => {
            Calculator.clearAllCache();
        });

        test('时间间隔乘法', () => {
            expect(Calculator.calculate('#1ms*10').value).toBe('10ms');
            expect(Calculator.calculate('#1d*2').value).toBe('172800000ms');
            expect(Calculator.calculate('#1w*2').value).toBe('1209600000ms');
            expect(Calculator.calculate('#1m*2').value).toBe('2月+0ms');
            expect(Calculator.calculate('#1y*2').value).toBe('2年+0ms');

        });

        test('时间间隔除法', () => {
            expect(Calculator.calculate('#1ms/10').value).toBe('0.1ms');
            expect(Calculator.calculate('#1d/10').value).toBe('8640000ms');
            expect(Calculator.calculate('#1w/4').value).toBe('151200000ms');

            expect(Calculator.calculate('#1m/10').value).toBe('0.1月+0ms');
            expect(Calculator.calculate('#1y/10').value).toBe('0.1年+0ms');
        });
    });

    describe('可视化>@测试', () => {
        beforeEach(() => {
            Calculator.clearAllCache();
        });

        test('测试日期', () => {
           // todo

        });

        test('测试时间戳', () => {
          // todo
        });
    });

    describe('可视化>#测试', () => {
        beforeEach(() => {
            Calculator.clearAllCache();
        });

        test('测试日期', () => {
           // todo

        });

        test('测试时间戳', () => {
          // todo
        });
        
    });
});
