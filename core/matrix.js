import Decimal from 'decimal.js';
import { Matrix, determinant, inverse, solve, EigenvalueDecomposition } from 'ml-matrix';


// 判断是否是标量
function isScalar(value) {
    return typeof value === 'number' || 
           typeof value === 'bigint' || 
           value instanceof Decimal;
}

// 定义一个类，存放Decimal数组
export class DecMatrix {
    constructor(data, rows, cols) {
        // 判断data是否是数组
        if (!Array.isArray(data)) {
            throw new Error('DMatrix: data 必须是数组');
        }
        
        if (data.length !== rows * cols) {
            throw new Error(`DMatrix: data 的长度 ${data.length} 不等于 rows * cols ${rows} * ${cols}`);
        }

        // 判断data是否是Decimal数组
        // if (!data.every(item => item instanceof Decimal)) {
        //     throw new Error('data 必须是Decimal数组');
        // }

        // 打印
        // console.log('data:', data);
        // console.log(`rows:${rows} cols:${cols}`);
        
        this.data = data; // 数据数组，如何判断是Decimal数组
        this.rows = rows; // 行数
        this.cols = cols; // 列数
    }

    apply(func, other) {
        // 同为DecMatrix
        if (other instanceof DecMatrix) {
            // 判断行列是否相同
            if (this.rows !== other.rows || this.cols !== other.cols) {
                throw new Error('行列不匹配');
            }

            // 创建新的DecMatrix
            let result = new DecMatrix(this.data.map((value, index) => func(value, other.data[index])), this.rows, this.cols);
            return result;
        }

        // 标量
        if (isScalar(other)) {
            // 创建新的DecMatrix
            let result = new DecMatrix(this.data.map(value => func(value, other)), this.rows, this.cols);
            return result;
        }

        throw new Error('不支持的矩阵运算');
    }

    // 对矩阵中的每个元素应用一个函数, 返回新的矩阵
    map(func){
        return new DecMatrix(this.data.map(func), this.rows, this.cols);
    }

    //
    // 提供矩阵运算方法
    matmul(other) {
        const m1 = this.toMatrix();
        const m2 = other.toMatrix();

        if (m1.columns !== m2.rows) {
            throw new Error('矩阵乘法：m1 的列数与 m2 的行数不匹配');
        }
    
        const rslt = m1.mmul(m2);
        return new DecMatrix(rslt.to1DArray().map(x => new Decimal(x)), rslt.rows, rslt.columns);
    }

    // 转成Matrix类型
    toMatrix() {
        // 将data按照rows和cols转换为二维数组
        let result = [];
        for(let i = 0; i < this.rows; i++) {
            let row = [];
            for(let j = 0; j < this.cols; j++) {
                // 获取一维数组中对应的元素
                let value = Number(this.data[i * this.cols + j]);
                row.push(value);
            }
            result.push(row);
        }
        return new Matrix(result);
    }

    // 显示字符串
    toString() {
        //将数据转换为字符串，格式化成6位小数，去掉小数点后多余的0
        let data = this.data.map(value => value.toFixed(6).replace(/\.?0+$/, ''));

        // 如果只有一列，则返回向量
        if (this.cols === 1) {
            return `[${data.join(',')}]`;
        }

        // 将一维数组转换为二维数组
        let result = [];
        for(let i = 0; i < this.rows; i++) {
            let row = [];
            for(let j = 0; j < this.cols; j++) {
                row.push(data[i * this.cols + j]);
            }
            result.push(row.join(','));
        }

        return `{${result.join(';')}}`;
    }
}

function test() {

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


function mat2Array(mat) {
    // 如果只有一列，则返回一维数组
    if (mat.columns === 1) {
        return mat.to1DArray();    // 返回一维数组
    }
    // 如果有多列，则返回二维数组
    else {
        return mat.to2DArray(); // 返回二维数组
    }
}




// const m = new DecMatrix([1, 2, 3, 4, 5, 6, 7, 8, 9], 3, 3);

// const m2 = new DecMatrix([1, 3, 3, 4, 1, 6, 7, 8, 9], 3, 3);

// const rslt = m.matmul(m2);
// console.log(rslt);