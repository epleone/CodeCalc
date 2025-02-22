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

   
    // 提供矩阵运算方法
    matmul(other) {
        return Matrix.mmul(this, other);
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

// 判断是否是matrix
function isMatrix(obj) {
    return obj instanceof Matrix;
}

// 判断是否是数字
function isNumber(obj) {
    return typeof obj === 'number' || typeof obj === 'bigint';
}

// 检查参数数量和类型，保证至少有一个是 Matrix
function checkArgs(args0, args1) {
    // if (!isNumber(args0) || !isMatrix(args1)) {
    //     throw new Error('参数类型错误');
    // }

    // 如果 都是数字，则返回错误
    if (isNumber(args0) && isNumber(args1)) {
        throw new Error('args0, args1都不是 Matrix');
    }
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


// 矩阵加法


function mat_sub(args0, args1) {
    checkArgs(args0, args1);

    if (isMatrix(args0)){
        return Matrix.subtract(args0, args0);
    }
    else{
        // 如果 args1 是 Matrix，则 args0 是数字
        let mat1 = Matrix.mul(Matrix.ones(args1.rows, args1.columns), args0);
        return Matrix.subtract(mat1, args1);
    }
}


// 矩阵乘法
function mat_matmul(args0, args1) {
    // 矩阵乘法, 必须都是 Matrix
    if (!isMatrix(args0) || !isMatrix(args1)) {
        throw new Error('args0, args1 必须都是 Matrix');
    }

    // 判断矩阵是否可以相乘
    if (args0.columns !== args1.rows) {
        throw new Error('args0 的列数与 args1 的行数不匹配');
    }

    return args0.mmul(args1);
}

// 矩阵点乘和数乘
function mat_mul(args0, args1) {
    checkArgs(args0, args1);

    // 如果都是 Matrix，则返回矩阵点乘
    if (isMatrix(args0) && isMatrix(args1)){
        // 判断矩阵是否可以点乘
        if (args0.columns !== args1.columns || args0.rows !== args1.rows) {
            throw new Error('args0 和 args1 的行数和列数不匹配');
        }
        return args0.mul(args1);
    }
    else if (isMatrix(args0)){
        // 如果 args0 是 Matrix，则 args1 是数字
        return Matrix.mul(args0, args1);
    }
    else{
        // 如果 args1 是 Matrix，则 args0 是数字
        return Matrix.mul(args1, args0);
    }
}


function mat_div(args0, args1) {
    checkArgs(args0, args1);

    if (isMatrix(args0)){
        return Matrix.div(args0, args1);
    }
    else{
        // 如果 args1 是 Matrix，则 args0 是数字
        let mat1 = Matrix.mul(Matrix.ones(args1.rows, args1.columns), args0);
        return Matrix.div(mat1, args1);
    }
}


// let vec1 = str2vec('[1, 2, 3]');
// let vec2 = str2vec('[4, 5, 6, 7]');

// console.log(vec1.to1DArray());

// let vec2 = mat_add(vec1, 1);
// console.log(vec2);

// let vec3 = mat_add(1, vec1);
// console.log(vec3);

// let sv1 = mat_sub(vec1, 1);
// console.log(sv1);

// let sv2 = mat_sub(1, vec1);
// console.log(sv2);

// let sv3 = mat_div(1, vec1);
// console.log(sv3);

// let sv4 = mat_mul(vec1, vec1);
// console.log(sv4);


// let vec2 = str2vec('[1 2 3]');
// console.log(vec2); 

// let vec3 = str2vec('[1 2, 3]');
// console.log(vec3); 

// let mat1 = str2Matrix('{1, 2, 3;4, 5, 3; 9, 8, 9}');
// let mat2 = str2Matrix('{1 1 ;1 1 ; 1 1 }');

// let mat3 = str2Matrix('{1, 2, 3, 4, 5, 3, 9, 8, 9; 1, 1, 3,4, 5, 3, 9, 8, 9; 2, 2, 3,4, 5, 3, 9, 8, 9;1, 2, 3,4, 6, 3, 9, 8, 9; 1, 2, 3,4, 7, 3, 9, 8, 9; 1, 2, 3,9, 5, 3, 9, 8, 9;0, 2, 3,4, 5, 3, 9, 8, 9; 1, 2, 1,4, 5, 3, 9, 8, 9; 1, 2, 3,4, 5, 3, 3, 8, 9}');

// const det = determinant(mat3);
// console.log(det);

// console.log(mat2Array(mat1));
// console.log(mat2Array(mat2));

// let rslt = mat_matmul(mat1, mat2);
// console.log(rslt);

// rslt = mat_mul(mat1, mat2);
// console.log(rslt);

// console.log(mat2);

// export { Utils, Datestamp, M_CONST };