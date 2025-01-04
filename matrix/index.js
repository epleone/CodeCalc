// 只导入 Matrix 类
import { Matrix } from 'ml-matrix';

// 创建一个简单的矩阵
const matrix = new Matrix([[1, 2], [3, 4]]);
// console.log(typeof matrix);

if (matrix instanceof Matrix) {
    console.log('matrix 是 Matrix 类型的实例');
} else {
    console.log('matrix 不是 Matrix 类型的实例');
}

// console.log('矩阵内容：');
// console.log(matrix); 

const a = [1, 2]
const b = [3, 4]
const m = new Matrix([a, b]);
// console.log(m);

export function test() {
    var a1 = Matrix.columnVector([1, 2, 3]);
    var a2 = Matrix.columnVector([4, 5, 6]);
    var a3 = Matrix.columnVector([7, 8, 9]);

    // 方法2：使用 setSubMatrix 方法
    // 水平拼接
    var horizontalMatrix = new Matrix(3, 3);  // 创建 3x3 矩阵
    horizontalMatrix.setSubMatrix(a1.to2DArray(), 0, 0);
    horizontalMatrix.setSubMatrix(a2.to2DArray(), 0, 1);
    horizontalMatrix.setSubMatrix(a3.to2DArray(), 0, 2);

    console.log('水平拼接结果:');
    console.log(horizontalMatrix);

    // 垂直拼接
    var verticalMatrix = new Matrix(3, 3);
    verticalMatrix.setSubMatrix(a1.transpose().to2DArray(), 0, 0);
    verticalMatrix.setSubMatrix(a2.transpose().to2DArray(), 1, 0);
    verticalMatrix.setSubMatrix(a3.transpose().to2DArray(), 2, 0);

    console.log('垂直拼接结果:');
    console.log(verticalMatrix);

    var m3 = Matrix.eye(3);
    console.log(m3);
}
