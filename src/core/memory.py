# !/usr/bin/env python
# -*- coding:utf-8 -*-
"""
@Version  : Python 3.12
@Time     : 2025/1/22 11:56
@Author   : wiesZheng
@Software : PyCharm
"""
import copy
import re
import traceback

from adbutils import AdbDevice
from loguru import logger



class ParsMeminfo(object):
    RE_TOTAL_PSS = re.compile(r'TOTAL\s+(\d+)')

    def __init__(self, meminfo):
        self.meminfo = meminfo
        self.taltol_pss = self.get_taltol_pss()

    def get_taltol_pss(self):
        match = self.RE_TOTAL_PSS.search(self.meminfo)
        if match:
            return round(float(match.group(1)) / 1024, 2)
        else:
            return ""


class MemoryMonitor:

    MEM_DATA_TEMPLATE = {
        "Java Heap": 0.0,
        "Native Heap": 0.0,
        "Code": 0.0,
        "Stack": 0.0,
        "Graphics": 0.0,
        "Private Other": 0.0,
        "System": 0.0,
        "TOTAL PSS": 0.0,
    }

    def __init__(self, device: AdbDevice):
        self.adb_device = device

    def get_mem_info(self, pid: int, sdk_version: int, package_name: str = None):
        if sdk_version >= 25:
            mem_info = self.adb_device.shell(f"top -n 1 -p {pid} -o RES -b -q")
            mem_info = mem_info.strip()
            logger.info("当前获取到的mem信息是{}".format(mem_info))
            return mem_info
        else:
            if package_name is None:
                raise ValueError("package_name is None")
            out = self.adb_device.shell(f"dumpsys meminfo --local -s --package {package_name}")
            if out.startswith("No Process"):
                return None
            mem_map = {}
            process_name = ""
            for line in out.splitlines():
                line = line.strip()
                if line.startswith("** MEMINFO"):
                    process_name = re.findall(r'\[(.*)]', line)[0]
                    mem_map[process_name] = copy.deepcopy(self.MEM_DATA_TEMPLATE)
                else:
                    line_data = line.split(":")
                    try:
                        for key in self.MEM_DATA_TEMPLATE.keys():
                            if line.startswith(key) and key != "TOTAL PSS":
                                data = line_data[1].split()
                                mem_map[process_name][key] = round(int(data[0]) / 1024, 1)
                                break
                    except (ValueError, IndexError) as e:
                        logger.error(f"解析内存数据失败: {line}")
                        logger.error(f"错误信息: {str(e)}")
                        logger.debug(traceback.format_exc())

            for name in mem_map:
                sum = 0
                for key in mem_map[name]:
                    sum += mem_map[name][key]
                mem_map[name]["TOTAL PSS"] = round(sum, 1)
            logger.info("当前获取到的mem_map信息是{}".format(mem_map))
            return mem_map
