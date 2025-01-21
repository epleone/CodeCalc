# CodeCalc 
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

一个支持代码风格计算的 utools 插件。

![](images/img1.png)

## 主要功能

### 变量和赋值：
- 基本赋值：`a = 5`
- 复合赋值：`+=`, `-=`, `*=`, `/=`, `%=`, `&=`, `|=`, `^=`, `<<=`, `>>=`, `>>>=`

### 基本运算：
- 算术运算：`+`, `-`, `*`, `/`, `//`, `%`, `**`
- 位运算：`&`, `|`, `^`, `~`, `<<`, `>>`, `>>>`
- 别名支持：`and`, `or`, `not`, `x`(未定义变量`x`时可以用作乘号)

### 数学函数：
- 三角函数：`sin`, `cos`, `tan`, `asin`, `acos`, `atan`
- 对数指数：`log`, `ln`, `exp`, `pow`, `sqrt`
- 其他：`abs`, `max`, `min`

### 角度转换：
- 角度转弧度：`rad(45)` 或 `45°` 或 `.rad`
- 弧度转角度：`deg(PI)` 或 `.deg`


### 字符串操作：
- 字符串：`s = "Hello"`, 支持 `+` 连接，如 `"Hello" + "World"`
- 字符串属性：`.length`, `.upper`, `.lower`
- base64 编解码：`base64(s)` 或 `.base64`, `unbase64(s)` 或  `.unbase64`

### 进制转换：
- 输入：`0b`(二进制), `0o`(八进制), `0x`(十六进制)
- 输出：`.bin`, `.oct`, `.hex`

### 常量：
- `π`, `PI`, `pi`: 3.14159...
- `E`,`e`: 2.71828...

### 时间戳：
- `@now`: 当前时间戳
- `@today`: 今天日期
- `@2000-06-01 11:30:01`: 指定日期时间
- `@now + #1w2d3h`: 当前时间加1周2天3小时
- `@now - #1y2m3d5h7s`: 当前时间减1年2月3天5小时7秒


> [!TIP] 
> 详细文档请参考 [CodeCalc 文档](https://epleone.github.io/codecalc-doc/)


## Credits
灵感来源：[itribs/rcalculator](https://github.com/itribs/rcalculator)
