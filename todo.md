# TODO
- [ ] 定义函数：`f(x, y)=2*max(x,y)`
- [ ] 所以函数都进行单元测试，GitHub action 测试
- [ ]  快照图标bug, win10?


优化 addCustomFunctionFromStorage 函数
数据读取在外部做好，然后传入分成添加的和删除的两部分。

面板界面延迟加载
// 在需要显示快捷键面板时加载
document.getElementById('showShortcutPanel').addEventListener('click', async () => {
  const { initShortcutPanel } = await import('./shortcutPanel.js');
  initShortcutPanel(); // 初始化快捷键面板
});

加载页面，显示loading ...

“大写人民币”这个插件的大部分使用场景应该会与财务工作有关，可参考财政部发布的《会计基础工作规范》中对大写金额的书写要求。



## RoadMap 

### V3.0
**界面改进**
- 设置持久化保存，支持设置输出格式，小数位数，科学计数法，十六进制
- 对不同的输出格式，就是更改计算表达式，在最外层封装函数。
- 例如： `a = 985` -> `hex(a = 985)`

### V3.1
**数组和矩阵**


### V3.2
**自定义函数**
- 自定义常数
- 自定义函数，如何实现调用定义函数？
- 添加性能监控, 计算超时返回 throw new Error('计算超时');


### V3.3
to be determined
