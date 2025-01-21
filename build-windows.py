# !/usr/bin/env python
# -*- coding:utf-8 -*-
"""
@Version  : Python 3.12
@Time     : 2025/1/20 11:38
@Author   : wiesZheng
@Software : PyCharm
"""
import os
import shutil

from PyInstaller import __main__ as pyi

if os.path.exists('build'):
    shutil.rmtree('build')

params = [
    '-F',
    '-w',
    '--add-data=dist;dist',
    '--clean',
    '--noconfirm',
    '--name=CB-AdbEasy',
    'src/index.py'
]
pyi.run(params)