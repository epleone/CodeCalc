# TODO
新增函数包括：
roundfix：四舍五入, 指定位数, 支持正数和负数

设置全局变量。
进入读取设置状态。
退出保存设置状态。

添加性能分析和统计，优化性能
计算表达式换成异步，这样更流畅丝滑

1. 函数支持默认参数，参数个数范围
2. 函数可以当属性调用，无参数可以省略，比如：
a.max(...) --> max(a, ...)

GitHub action 测试



## RoadMap 

### V3.0
**界面改进**
- 在不改变当前布局，且修改最小化的情况下，输入太长时支持换行
- 补全改进, 输入变多行时如何定位补全位置
- 设置持久化保存，支持设置输出格式，小数位数，科学计数法，十六进制


### V3.1
**数组和矩阵**

- 矩阵加法（Matrix Addition）
- 矩阵减法（Matrix Subtraction）
- 标量乘法（Scalar Multiplication）
- 矩阵乘法（Matrix Multiplication）：点乘和叉乘
- 转置（Transpose）
- 行列式（Determinant）
- 逆矩阵（Inverse Matrix）
- 伪逆矩阵（Pseudoinverse Matrix）
- 特征值和特征向量（Eigenvalues and Eigenvectors）
- 迹（Trace）
- 矩阵分解（Matrix Decomposition）

包括LU分解、QR分解、奇异值分解（SVD）等，用于简化矩阵运算。
这些操作在数学、物理、计算机科学等领域中有广泛的应用，尤其是在图像处理、机器学习和数据分析中。

- 最大值
- 最小值
- 求和
- 均值
- 排序

**特殊矩阵**

- 对角矩阵（Diagonal Matrix）：
只有对角线（从左上到右下）上有非零元素的方阵。
- 单位矩阵（Identity Matrix）：
对角线上的元素全为1，其余元素全为0的方阵，通常用 I 表示。
- 全1矩阵（All Ones Matrix）：
所有元素均为1的矩阵
- 全0矩阵（All Zeros Matrix）：
所有元素均为0的矩阵
- 等差数列：
等差数列，range

### V3.2
**自定义函数**
- 自定义常数
- 自定义函数，如何实现调用定义函数？
- 添加性能监控, 计算超时返回 throw new Error('计算超时');


### V3.3
to be determined
