#!/bin/bash

# 使用git bash 运行

# 检查 release 文件夹是否存在
if [ -d "release" ]; then
  echo "Error: 'release' folder already exists. Exiting..."
  exit 1
fi

# 创建 release 文件夹
mkdir release

# 复制 src 文件夹的所有内容到 release
cp -a src/ release/

# 复制指定文件到 release
cp plugin.json preload.js logo.png logo-run.png release/


echo "Files and folders have been successfully copied to 'release'."
