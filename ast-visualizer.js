// 树形布局的配置
const CONFIG = {
    nodeRadius: 20,
    levelHeight: 60,
    horizontalSpacing: 50,
    fontSize: 14,
    backgroundColor: '#fff',
    nodeColor: '#4CAF50',
    lineColor: '#666',
    textColor: '#fff'
};

// 计算节点位置
function calculateNodePositions(node, x = 0, y = 0, level = 0) {
    node.x = x;
    node.y = y;
    
    if (node.args.length === 0) return { width: CONFIG.nodeRadius * 2, center: x };
    
    let totalWidth = 0;
    let childrenCenters = [];
    
    // 首先计算所有子节点的位置和宽度
    for (let child of node.args) {
        const childResult = calculateNodePositions(
            child, 
            x + totalWidth, 
            y + CONFIG.levelHeight, 
            level + 1
        );
        totalWidth += childResult.width + CONFIG.horizontalSpacing;
        childrenCenters.push(childResult.center);
    }
    
    // 调整当前节点的x坐标到子节点的中心
    if (childrenCenters.length > 0) {
        totalWidth -= CONFIG.horizontalSpacing; // 移除最后一个间距
        const firstChild = childrenCenters[0];
        const lastChild = childrenCenters[childrenCenters.length - 1];
        node.x = (firstChild + lastChild) / 2;
    }
    
    return { width: totalWidth, center: node.x };
}

// 绘制节点
function drawNode(ctx, node) {
    // 绘制连接线
    ctx.beginPath();
    ctx.strokeStyle = CONFIG.lineColor;
    ctx.lineWidth = 1;
    for (let child of node.args) {
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(child.x, child.y);
    }
    ctx.stroke();
    
    // 绘制节点圆形
    ctx.beginPath();
    ctx.fillStyle = CONFIG.nodeColor;
    ctx.arc(node.x, node.y, CONFIG.nodeRadius, 0, Math.PI * 2);
    ctx.fill();
    
    // 绘制文本
    ctx.fillStyle = CONFIG.textColor;
    ctx.font = `${CONFIG.fontSize}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(node.value), node.x, node.y);
    
    // 递归绘制子节点
    for (let child of node.args) {
        drawNode(ctx, child);
    }
}

// 主绘制函数
export function drawAST(canvas, ast) {
    const ctx = canvas.getContext('2d');
    
    // 清空画布
    ctx.fillStyle = CONFIG.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (!ast) return;
    
    // 计算布局
    const { width } = calculateNodePositions(ast, canvas.width / 2, 40);
    
    // 绘制树
    drawNode(ctx, ast);
} 