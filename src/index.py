# !/usr/bin/env python
# -*- coding:utf-8 -*-
"""
@Version  : Python 3.12
@Time     : 2025/1/20 11:38
@Author   : wiesZheng
@Software : PyCharm
"""
import os
import webview
from src.core.api import Api


def get_entrypoint():
    def exists(path):
        return os.path.exists(os.path.join(os.path.dirname(__file__), path))

    if exists('../dist/index.html'):
        return '../dist/index.html'

    if exists('./dist/index.html'):
        return './dist/index.html'

    raise Exception('No index.html found')


entry = get_entrypoint()


if __name__ == '__main__':
    RENDERER_URL = "http://localhost:5173"
    APP_VERSION = "v0.1.5"
    api = Api()
    window = webview.create_window('CBAdbEasy {}'.format(APP_VERSION), entry, js_api=api, width=1280,
                                   height=700,
                                   min_size=(1280, 700), )
    webview.start()
