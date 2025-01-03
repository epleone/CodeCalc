#!/bin/bash

# 使用git bash 运行
# 检查 release 文件夹是否存在并删除
if [ -d "release" ]; then
  echo "Warning: Deleting existing 'release' folder..."
  rm -rf release
fi

# 创建 release 文件夹
mkdir release

# 复制 src 文件夹的所有内容到 release
cp -a src/ release/

# 复制指定文件到 release
cp plugin.json preload.js logo.png logo-run.png release/


echo "Files and folders have been successfully copied to 'release'."
