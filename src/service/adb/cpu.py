# !/usr/bin/env python
# -*- coding:utf-8 -*-
"""
@Version  : Python 3.12
@Time     : 2025/1/22 10:33
@Author   : wiesZheng
@Software : PyCharm
"""
import os
from adbutils import AdbDevice, adb
from loguru import logger


class CpuMonitor:
    def __init__(self, device: AdbDevice):
        self.adb_device = device

    def get_cpu_info(self, pid: int, sdk_version: int, package_name: str = None):

        if sdk_version >= 25:
            cpu_info = self.adb_device.shell(
                "top -n 1 -p {} -o %CPU -b -q".format(pid))
            cpu_info = cpu_info.strip()
            logger.info("获取到的cpu信息是：{}".format(cpu_info))
            return cpu_info
        else:
            if package_name is None:
                raise ValueError("package_name is None")
            cpu_info = self.adb_device.shell("top -n 1".format(pid))
            logger.info("top获取到的原始信息是{}".format(cpu_info))
            for pidinfo in cpu_info.split(os.linesep):
                if package_name in pidinfo:
                    pidinfo = pidinfo.split()
                    if pidinfo[-1] == package_name:
                        return pidinfo[4].replace("%", '')
            return ''
