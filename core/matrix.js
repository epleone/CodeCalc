// 只导入 Matrix 类
import { Matrix, determinant, inverse, solve, EigenvalueDecomposition } from 'ml-matrix';

// 定义一个类，存放Decimal数组
class DMatrix {
    constructor(data, rows, columns) {
        // 判断data是否是数组
        if (!Array.isArray(data)) {
            throw new Error('DMatrix: data 必须是数组');
        }

        // 判断data是否是Decimal数组
        // if (!data.every(item => item instanceof Decimal)) {
        //     throw new Error('data 必须是Decimal数组');
        // }
        
        this.data = data; // 数据数组，如何判断是Decimal数组
        this.rows = rows; // 行数
        this.columns = columns; // 列数
    }
}


function test_Decomposition() {

    const A = new Matrix([
        [2, 3, 5],
        [6, 1, 4],
        [1, 3, 0]
      ]);
    
    // 特征值分解
    const evd = new EigenvalueDecomposition(matrix);

    // 获取分解结果
    const eigenvalues = evd.realEigenvalues;     // 特征值
    const eigenvectors = evd.eigenvectorMatrix;  // 特征向量矩阵

    // LU分解
    const lu = new LuDecomposition(matrix);

    // 获取分解后的矩阵
    const lMatrix = lu.lowerTriangularMatrix;  // L矩阵
    const uMatrix = lu.upperTriangularMatrix;  // U矩阵
    const pivotVector = lu.pivotVector;        // 透视向量

    // QR分解
    const qr = new QrDecomposition(matrix);

    // 获取分解后的矩阵
    const qMatrix = qr.orthogonalMatrix;    // Q矩阵(正交矩阵)
    const rMatrix = qr.upperTriangularMatrix;  // R矩阵(上三角矩阵)

    // SVD分解
    const svd = new SingularValueDecomposition(matrix);

    // 获取分解结果
    const u1Matrix = svd.leftSingularVectors;    // U矩阵
    const sMatrix = svd.diagonalMatrix;         // S矩阵(奇异值矩阵)
    const vMatrix = svd.rightSingularVectors;   // V矩阵
    const singularValues = svd.diagonal;        // 奇异值数组
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


function str2vec(str) {
    // 传入字符串 `[1, 2, 3]` 或者 `[1 2 3]`,将其转换成 columnVector 返回
    str = str.trim();
    if (str[0] !== '[' || str[str.length-1] !== ']') {
        throw new Error('vector格式错误，请使用方括号[]');
    }
    
    // 去掉首尾的 [ ]
    str = str.substring(1, str.length-1);
    // 将逗号前后的空格去掉
    str = str.replace(/\s*,\s*/g, ',');

    // 既有逗号分隔，又有空格分隔，抛出错误
    if (str.includes(',') && str.includes(' ')) {
        throw new Error('vector格式错误, 不要混用逗号和空格');
    }

    // 处理逗号分隔和空格分隔两种情况
    let numbers;
    if (str.includes(',')) {
        numbers = str.split(',').map(s => parseFloat(s.trim()));
    } else {
        numbers = str.split(/\s+/).map(s => parseFloat(s.trim()));
    }

    if (numbers.length === 0) {
        throw new Error('vector 长度为0');
    }
    
    // 如果有非法数字，则抛出错误
    for (let i = 0; i < numbers.length; i++) {
        if (isNaN(numbers[i])) {
            throw new Error(`vector${i+1}: ${numbers[i]} 不是数字`);
        }
    }  
    return Matrix.columnVector(numbers);
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


function str2Matrix(str) {
    //  传入字符串 `{1, 2, 3;4,5,6; 7, 8, 9}` 或者 `{1 2 3;4 5 6; 7 8 9}`,将其转换成Matrix返回
    str = str.trim();
    if (str[0] !== '{' || str[str.length-1] !== '}') {
        throw new Error('matrix格式错误，请使用大括号{}');
    }

    // 去掉首尾的大括号
    str = str.substring(1, str.length-1);
    // 将逗号前后的空格去掉
    str = str.replace(/\s*,\s*/g, ',');
    // 将分号前后的空格去掉
    str = str.replace(/\s*;\s*/g, ';');

    // console.log(str);
    // 既有逗号分隔，又有空格分隔，抛出错误
    if (str.includes(',') && str.includes(' ')) {
        throw new Error('matrix格式错误, 不要混用逗号和空格');
    }

    // 将逗号替换为空格
    str = str.replace(/,/g, ' ');
  
    // 按分号分隔成行
    let rows = str.split(';');
    // 每行按空格分隔成数字数组
    let numbers = rows.map(row => {
        // 去掉首尾空格后按空格分隔
        return row.trim().split(/\s+/).map(Number);
    });

    // 打印二维数组
    // console.log('numbers:', numbers);
    
    // 判断二维数组是否为空
    if (numbers.length === 0) {
        throw new Error('matrix 长度为0');
    }

    // 判断二维数组每行长度是否一致,并检查是否有非法数字
    let rowLength = numbers[0].length;
    for (let i = 0; i < numbers.length; i++) {
        if (numbers[i].length !== rowLength) {
            throw new Error('matrix 每行长度不一致');
        }
        for (let j = 0; j < numbers[i].length; j++) {
            if (isNaN(numbers[i][j])) {
                throw new Error(`matrix${i+1},${j+1}: ${numbers[i][j]} 不是数字`);
            }
        }
    }

    return new Matrix(numbers);
}


// 矩阵加法
function mat_add(args0, args1) {
    checkArgs(args0, args1);

    if (isMatrix(args0)){
        return Matrix.add(args0, args1);
    }
    else{
        return Matrix.add(args1, args0);
    }
}

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

let mat1 = str2Matrix('{1, 2, 3;4, 5, 3; 9, 8, 9}');
let mat2 = str2Matrix('{1 1 1;1 1 1; 1 1 1}');

let mat3 = str2Matrix('{1, 2, 3, 4, 5, 3, 9, 8, 9; 1, 1, 3,4, 5, 3, 9, 8, 9; 2, 2, 3,4, 5, 3, 9, 8, 9;1, 2, 3,4, 6, 3, 9, 8, 9; 1, 2, 3,4, 7, 3, 9, 8, 9; 1, 2, 3,9, 5, 3, 9, 8, 9;0, 2, 3,4, 5, 3, 9, 8, 9; 1, 2, 1,4, 5, 3, 9, 8, 9; 1, 2, 3,4, 5, 3, 3, 8, 9}');

const det = determinant(mat3);
console.log(det);

// console.log(mat2Array(mat1));
// console.log(mat2Array(mat2));

// let rslt = mat_matmul(mat1, mat2);
// console.log(rslt);

// rslt = mat_mul(mat1, mat2);
// console.log(rslt);

// console.log(mat2);
