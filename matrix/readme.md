使用rollup将ml-matrix压缩成一个文件

1. 安装rollup
2. 创建rollup.config.mjs文件
3. 运行rollup -c

```
    // index.js
   import { Matrix } from 'ml-matrix';

   // 这里可以添加你自己的代码，或者直接导出 ml-matrix 的功能
   export { Matrix };
```


## 矩阵拼接
Matrix.columnVector() 创建的是列向量
使用 to2DArray() 可以将矩阵转换为二维数组
transpose() 方法可以转置矩阵
setSubMatrix() 可以在指定位置设置子矩阵