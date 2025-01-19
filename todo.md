# TODO

**特性**
- max('1', 2)  log('1')  支持接受字符串，-- js本身支持
- 赋值运算符连用 (x = y = 1)  特性：y = (x = 1 + 2 ) **(6)


## RoadMap 

### V2.0
**完善基本功能**

- 添加 'e+' 和 'e-', 遇到这类分词，直接跳过。来支持科学计数法
- 支持 百分号`%` 和 千分号 `‰`
- ?: `>#w`: 最大单位为1w1d1h...  `>#ww`: 转成以w为单位

### V3.0
**界面改进**

- 主题切换: 默认、暗黑，通过utools.isDarkColors判断
- 在不改变当前布局，且修改最小化的情况下，输入太长时支持换行
- 补全改进，定时隐藏补全框
- 快捷键：Ctrl + C 复制当前行结果，如果光标不在某一行，则复制最后一行结果
- 配置持久化
- 中英文切换

### V4.0
**更新底层计算库**

使用 `Decimal.js` 库

- 更好的大数支持
- 支持设置科学计数法
- 支持设置精度, 小数点后位数
- 函数支持大数
- 添加性能监控, 计算超时返回 throw new Error('计算超时');


### V5.0
**数组和矩阵**

- 矩阵加法（Matrix Addition）
- 矩阵减法（Matrix Subtraction）
- 标量乘法（Scalar Multiplication）
- 矩阵乘法（Matrix Multiplication）：点乘和叉乘
- 转置（Transpose）
- 行列式（Determinant）
- 逆矩阵（Inverse Matrix）
- 伪逆矩阵（Pseudoinverse Matrix）
- 伴随矩阵（Adjoint Matrix）
- 特征值和特征向量（Eigenvalues and Eigenvectors）
- 迹（Trace）
- 矩阵分解（Matrix Decomposition）

包括LU分解、QR分解、奇异值分解（SVD）等，用于简化矩阵运算。
这些操作在数学、物理、计算机科学等领域中有广泛的应用，尤其是在图像处理、机器学习和数据分析中。

- 最大值
- 最小值
- 求和
- 均值
- 方差
- 标准差
- 中位数
- 众数

**特殊矩阵**

- 对角矩阵（Diagonal Matrix）：
只有对角线（从左上到右下）上有非零元素的方阵。
- 单位矩阵（Identity Matrix）：
对角线上的元素全为1，其余元素全为0的方阵，通常用 I 表示。
- 全1矩阵（All Ones Matrix）：
所有元素均为1的矩阵
- 全0矩阵（All Zeros Matrix）：
所有元素均为0的矩阵
- 稀疏矩阵（Sparse Matrix）：
大部分元素为0的矩阵

### V6.0
**自定义函数**
- 自定义常数
- 自定义函数，如何实现调用定义函数？


### V7.0
to be determined
