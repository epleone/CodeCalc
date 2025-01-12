# readme

该文件夹用于build第三方库

## ml-matrix
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
