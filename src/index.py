# !/usr/bin/env python
# -*- coding:utf-8 -*-
"""
@Version  : Python 3.12
@Time     : 2025/1/20 11:38
@Author   : wiesZheng
@Software : PyCharm
"""
import base64

import io
import os
import re
import threading
from enum import Enum

import webview
import json
import csv

import time
from adbutils import adb, AdbDevice
from loguru import logger

from src.service.adb.memory import MemoryMonitor


class FileMode(Enum):
    # 文件类型 (高位部分)
    REGULAR_FILE = 0o100000  # 普通文件 (regular file)
    DIRECTORY = 0o040000  # 目录 (directory)
    SYMBOLIC_LINK = 0o120000  # 符号链接 (symbolic link)
    BLOCK_DEVICE = 0o060000  # 块设备 (block device)
    CHARACTER_DEVICE = 0o020000  # 字符设备 (character device)
    FIFO = 0o010000  # 命名管道 (FIFO)
    SOCKET = 0o140000  # 套接字 (socket)
    # 文件权限位 (低位部分, 以八进制表示)
    PERM_600 = 0o600  # rw-------
    PERM_644 = 0o644  # rw-r--r--
    PERM_755 = 0o755  # rwxr-xr-x
    PERM_777 = 0o777  # rwxrwxrwx

    def to_decimal(self):
        """将八进制模式转换为十进制"""
        return int(self.value)

    def __str__(self):
        """返回描述信息"""
        if self.name.startswith("PERM"):
            return f"Permission: {oct(self.value)} (Decimal: {self.to_decimal()})"
        else:
            return f"File Type: {self.name.replace('_', ' ').title()} (Octal: {oct(self.value)}, Decimal: {self.to_decimal()})"


def set_interval(interval):
    def decorator(function):
        def wrapper(*args, **kwargs):
            stopped = threading.Event()

            def loop():  # executed in another thread
                while not stopped.wait(interval):  # until stopped
                    function(*args, **kwargs)

            t = threading.Thread(target=loop)
            t.daemon = True  # stop if the program exits
            t.start()
            return stopped

        return wrapper

    return decorator


class Api:

    def __init__(self):
        # self.device = None
        self.device: AdbDevice
        self.recording_thread = None
        self.is_recording = False
        self.recording_file = None

    def get_pid(self, package_name):
        """
        通过报名获取pid
        :param package_name:
        :return:
        """
        commands = 'ps -A| grep {}'.format(package_name)
        result = self.device.shell(commands)
        str_ret = result.split('\n')
        pid = '0'
        for strs in str_ret:
            if strs == '':
                continue
            str_list = strs.split(' ')
            str_list_result = []
            for info in str_list:
                if info != '':
                    str_list_result.append(info)
            str_package = str_list_result[8]
            if str_package == package_name:
                return str_list_result[1]

        return int(pid)

    def get_sdk_version(self):
        """
        获取sdk版本
        :return:
        """
        sdk_version = self.device.shell("getprop ro.build.version.sdk").strip()
        return int(sdk_version)

    @classmethod
    def get_device_list(cls):
        """
        获取设备列表
        :return:
        """
        device_list = []
        for d in adb.device_list():
            device_info = {
                'serial': d.serial,
                'model': d.prop.model,
                'name': d.prop.name
            }
            device_list.append(device_info)
        logger.debug(device_list)
        return device_list

    def device_info(self, serial):
        """
        获取设备基础信息
        :param serial:
        :return:
        """
        if not serial:
            logger.error("序列号无效")
            return {}
        device_info = {}
        self.device = adb.device(serial)

        device_info['kernelVersion'] = self.device.shell('uname -r')
        device_info['fontScale'] = self.device.shell('settings get system font_scale')
        output = self.device.shell('ip addr show wlan0')
        mac_address = None
        ip_address = None

        for line in output.split('\n'):
            mac_match = re.match(r'.*link/ether ([0-9a-fA-F:]+) brd', line)
            if mac_match:
                mac_address = mac_match.group(1)
            ip_match = re.match(r'.*inet (\d+\.\d+\.\d+\.\d+)/\d+', line)
            if ip_match:
                ip_address = ip_match.group(1)

        device_info['ipAddress'] = ip_address
        device_info['macAddress'] = mac_address

        device_info['name'] = self.device.prop.name
        device_info['processor'] = self.device.shell('getprop ro.product.board')
        device_info['abi'] = self.device.shell('getprop ro.product.cpu.abi')
        device_info['model'] = self.device.prop.model
        device_info['brand'] = self.device.shell('getprop ro.product.brand')
        device_info['serialNum'] = self.device.shell('getprop ro.serialno')

        device_info['androidVersion'] = self.device.shell('getprop ro.build.version.release')

        meminfo = self.device.shell('cat /proc/meminfo')
        for line in meminfo.split('\n'):
            if line.startswith('MemTotal'):
                device_info['memTotal'] = line.split(':')[1].strip()
            if line.startswith('MemAvailable'):
                device_info['memFree'] = line.split(':')[1].strip()

        device_info['physicalResolution'] = self.device.shell('wm size').split(': ')[
                                                1] + f"({self.device.shell('wm density').split(': ')[1]}dpi)"
        device_info['resolution'] = self.device.shell('wm size').split(': ')[1]

        logger.debug(f"device_info: {device_info}")
        return device_info

    def get_packages(self, system=True):
        """
        包列表
        :param system:
        :return:
        """
        command = 'pm list packages' if system else 'pm list packages -3'
        packages = self.device.shell(command)
        trimmed_result = packages.strip()
        if not trimmed_result:
            return []
        lines = trimmed_result.split('\n')
        processed_lines = [{'name': line[8:], 'packageName': line[8:], 'id': i} for i, line in enumerate(lines)]
        logger.debug(processed_lines)
        return processed_lines

    def get_processes(self):
        """
        获取进程
        :return:
        """
        columns = ['pid', '%cpu', 'time+', 'res', 'user', 'name', 'args']
        command = ''.join(f" -o {column}" for column in columns)
        logger.debug("top -b -n 1 " + command)
        result = self.device.shell("top -b -n 1 " + command)
        lines = result.split('\n')
        start = -1
        for i in range(len(lines)):
            if lines[i].strip().startswith('PID'):
                start = i + 1
                break

        if start < 0:
            result = self.device.shell('top -b -n 1')
            lines = result.split('\n')
            for i, line in enumerate(lines):
                line = line.strip()
                if line.startswith('PID'):
                    columns = re.split(r'\s+', line)
                    columns = [col.lower() for col in columns]
                    columns = [
                        '%cpu' if col == 'cpu%' else
                        'user' if col == 'uid' else
                        'res' if col == 'rss' else
                        col for col in columns
                    ]
                    start = i + 1
                    break
        lines = lines[start:]
        processes = []

        for line in lines:
            line = line.strip()
            if not line:
                continue
            parts = line.split()
            process = {}

            for index, column in enumerate(columns):
                if column == 'args':
                    process[column] = ' '.join(parts[index:])
                else:
                    process[column] = parts[index] if index < len(parts) else ''

            if command and process.get('args') == command:
                continue

            processes.append(process)
        logger.debug(processes)
        return processes

    def install_package(self):
        """
        安装apk
        :return:
        """
        filename = webview.windows[0].create_file_dialog(webview.OPEN_DIALOG, allow_multiple=False,
                                                         file_types=('APK Files(*.apk)',))
        logger.debug(filename)
        if not filename:
            return False
        self.device.install(filename[0], nolaunch=True)
        return True

    def uninstall_package(self, package_name):
        """
        卸载应用
        :param package_name:
        :return:
        """
        self.device.uninstall(package_name)
        return True

    def pull_apk(self, package_name):
        """
        导出apk包
        :param package_name:
        :return:
        """
        apk_path = self.device.shell(f'pm path {package_name}').strip().split(':')[-1]
        if not apk_path:
            logger.error(f"未找到包名为 {package_name} 的 APK")
            return False
        filename = webview.windows[0].create_file_dialog(webview.SAVE_DIALOG, save_filename=f"{package_name}.apk",
                                                         file_types=('APK Files(*.apk)',))
        logger.debug(f"apk_path: {apk_path}  filename: {filename}")
        if not filename:
            return False
        self.device.sync.pull_file(apk_path, filename)
        return True

    def clear_package(self, package_name):
        self.device.shell(f'pm clear {package_name}')
        return True

    def start_package(self, package_name):
        self.device.app_start(package_name)
        return True

    def stop_package(self, package_name):
        self.device.shell(f'am force-stop {package_name}')
        return True

    def disable_package(self, package_name):
        self.device.shell(f'pm disable-user {package_name}')
        return True

    def enable_package(self, package_name):
        self.device.shell(f'pm enable {package_name}')
        return True

    def get_screenshot(self):
        """
        截取屏幕
        :return: image
        """
        pil_image = self.device.screenshot()
        with io.BytesIO() as buffered:
            pil_image.save(buffered, format="PNG")
            img_byte = buffered.getvalue()
            img_str = base64.b64encode(img_byte).decode('utf-8')
            width, height = pil_image.size
            file_size = round(len(img_byte) / 1024 / 1024, 2)
            data = {
                'image': img_str,
                'width': width,
                'height': height,
                'size': file_size
            }
            logger.debug(data)

            return data

    @classmethod
    def save_screenshot(cls, base64_data):
        """
        保存截图
        :param base64_data: base64编码的图片数据
        :return: bool
        """
        try:
            filename = webview.windows[0].create_file_dialog(webview.SAVE_DIALOG, save_filename=f"screenshot.png",
                                                             file_types=('PNG Files(*.png)',))
            if not filename:
                return False

            # 解码base64数据并保存为文件
            img_data = base64.b64decode(base64_data)
            with open(filename, 'wb') as f:
                f.write(img_data)
            return True
        except Exception as e:
            logger.error(f"保存截图失败: {e}")
            return False

    @classmethod
    def fullscreen(cls):
        webview.windows[0].toggle_fullscreen()

    @classmethod
    def save_memory_content(cls, content):
        try:
            data = json.loads(content)
            process_name = data['processName']
            performance_data = data['data']
            safe_process_name = re.sub(r'[<>:"/\\|?*\x00-\x1f]', '_', process_name)
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            filename = f"memory_data_{safe_process_name}_{timestamp}.csv"

            headers = ['Time', 'Java Heap', 'Native Heap', 'Code',
                       'Stack', 'Graphics', 'Private Other', 'System', 'TOTAL PSS']

            with open(filename, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                writer.writerow(headers)

                for entry in performance_data:
                    row = [
                        entry['time'],
                        entry['Java Heap'],
                        entry['Native Heap'],
                        entry['Code'],
                        entry['Stack'],
                        entry['Graphics'],
                        entry['Private Other'],
                        entry['System'],
                        entry['TOTAL PSS']
                    ]
                    writer.writerow(row)

            return True
        except Exception as e:
            logger.error(f"保存文件失败: {e}")
            return False

    def get_memory_info(self, package_name: str):
        """
        获取应用执行内存
        :param package_name:
        :return:
        """
        return MemoryMonitor(self.device).get_mem_info(self.get_pid(package_name), 24, package_name)

    @set_interval(0.5)
    def update_logcat(self):
        try:
            if self.device is None:
                return False
            self.device.shell("logcat --clear")

            if len(webview.windows) > 0:
                stream = self.device.shell("logcat", stream=True)
                with stream:
                    f = stream.conn.makefile()
                    while True:
                        line = f.readline().strip()
                        if not line:
                            continue
                        try:
                            parts = line.split(None, 5)
                            if len(parts) >= 6:
                                date, time, pid, tid, level, message = parts
                                log_entry = {
                                    'timestamp': f"{date} {time}",
                                    'processId': f"{pid}-{tid}",
                                    'level': level[0],  # level (I/D/W/E/V)
                                    'message': message,
                                    'component': message.split(':', 1)[0] if ':' in message else 'unknown',
                                    'package': 'system'
                                }
                                logger.debug(f"log_entry: {log_entry}")
                                js_code = f'window.pywebview.state && window.pywebview.state.addLogEntry({json.dumps(log_entry)})'
                                webview.windows[0].evaluate_js(js_code)
                        except Exception as e:
                            logger.error(f"解析 logcat 行时出错: {e}")
                            continue
        except Exception as e:
            logger.error(f"获取 logcat 日志失败: {e}")

    def list_files(self, path="/"):
        """
        获取文件列表
        :param path:
        :return:
        """
        try:
            files_and_dir = self.device.sync.list(path)
            if not files_and_dir:
                return []
            logger.debug(f"获取文件列表: {files_and_dir}")
            entries = []
            for file_or_dir in files_and_dir:
                if file_or_dir.path in ('.', '..'):
                    continue
                full_path = os.path.join(path, file_or_dir.path).replace(os.sep, '/')
                entry = {
                    'name': file_or_dir.path,
                    'path': full_path,
                    'size': file_or_dir.size,
                    'is_dir': file_or_dir.mode == 16889 or file_or_dir.mode == 16888 or file_or_dir.mode == 41380 or file_or_dir.mode == 16877,
                    'permissions': "未知",
                    'owner': "未知",
                    'group': "未知",
                    'modified': file_or_dir.mtime.strftime("%Y-%m-%d %H:%M:%S")
                }
                entries.append(entry)
            return sorted(entries, key=lambda x: (not x['is_dir'], x['name'].lower()))
        except Exception as e:
            logger.error(f"获取文件列表失败: {e}")
            return []

    def list_files_in_dir(self, path="/sdcard"):

        try:
            # 获取目录列表
            result = self.device.shell(f'ls -l {path}').strip()
            entries = []
            for line in result.split('\n'):  # 跳过第一行总计信息
                try:
                    parts = line.split(None, 7)
                    if len(parts) >= 7:
                        perms, links, owner, group, size, year_month, day, name = parts
                        is_dir = perms.startswith('d')
                        full_path = os.path.join(path, name).replace(os.sep, '/')
                        entry = {
                            'name': name,
                            'path': full_path,
                            'size': int(size),
                            'is_dir': is_dir,
                            'permissions': perms,
                            'owner': owner,
                            'group': group,
                            'modified': f"{day} {year_month}"
                        }
                        entries.append(entry)
                except Exception as e:
                    logger.error(f"解析文件信息失败: {e}")
                    continue
            return sorted(entries, key=lambda x: (not x['is_dir'], x['name'].lower()))

        except Exception as e:
            logger.error(f"获取文件列表失败: {e}")
            return []

    def create_folder(self, path):
        """
        创建文件夹
        :param path:
        :return:
        """
        try:
            self.device.shell(f'mkdir -p "{path}"')
            return True
        except Exception as e:
            logger.error(f"创建文件夹失败: {e}")
            return False

    def delete_file(self, path):
        """
        删除文件或文件夹
        :param path:
        :return:
        """
        try:
            self.device.shell(f'rm -rf "{path}"')
            return True
        except Exception as e:
            logger.error(f"删除失败: {e}")
            return False

    def download_file(self, path):
        """
        下载文件
        :param path:
        :return:
        """
        try:
            filename = os.path.basename(path)
            save_path = webview.windows[0].create_file_dialog(
                webview.SAVE_DIALOG,
                save_filename=filename
            )

            if save_path:
                self.device.sync.pull(path, save_path)
                return True
        except Exception as e:
            logger.error(f"下载文件失败: {e}")
            return False

    def upload_file(self, path):
        """
        上传文件
        :param path:
        :return:
        """
        try:
            filename = webview.windows[0].create_file_dialog(
                webview.OPEN_DIALOG,
                allow_multiple=False
            )

            if filename:
                logger.debug(f"上传文件: {filename} -> {path}/{os.path.basename(filename[0])}")
                self.device.sync.push(filename[0].replace('\\', '/'),
                                      f'{path}/{os.path.basename(filename[0])}')
                return True
            return {"status": "cancelled", "message": "操作已取消"}
        except Exception as e:
            logger.error(f"上传文件失败: {e}")
            return False

    def start_recording(self):
        """
        开始录制屏幕 使用线程处理录制过程
        :return:
        """
        try:
            if self.is_recording:
                return False
                
            # 创建临时文件路径用于保存录制文件
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            self.recording_file = f"/sdcard/screenrecord_{timestamp}.mp4"
            
            def record_screen():
                try:
                    self.device.shell(f"screenrecord {self.recording_file}")
                except Exception as e:
                    logger.error(f"录制过程出错: {e}")
                    self.is_recording = False
            
            # 启动录制线程
            self.recording_thread = threading.Thread(target=record_screen)
            self.recording_thread.daemon = True
            self.recording_thread.start()
            self.is_recording = True
            
            return True
        except Exception as e:
            logger.error(f"开始录制失败: {e}")
            self.is_recording = False
            return False

    def stop_recording(self):
        """
        停止录制并保存文件
        :return:
        """
        try:
            if not self.is_recording:
                return False

            # 终止录制进程
            self.device.shell("pkill -l SIGINT screenrecord")
            self.is_recording = False
            time.sleep(1)
            save_path = webview.windows[0].create_file_dialog(
                webview.SAVE_DIALOG,
                save_filename="screen_record.mp4",
                file_types=('MP4 Files (*.mp4)',)
            )
            
            if save_path:
                # 从设备下载录制文件
                self.device.sync.pull(self.recording_file, save_path)
                time.sleep(1)
                self.device.shell(f"rm {self.recording_file}")
                return {"fileUrl": save_path}
            
            return False
            
        except Exception as e:
            logger.error(f"停止录制失败: {e}")
            self.is_recording = False
            return False

def get_entrypoint():
    def exists(path):
        return os.path.exists(os.path.join(os.path.dirname(__file__), path))

    if exists('../dist/index.html'):
        return '../dist/index.html'

    if exists('./dist/index.html'):
        return './dist/index.html'

    raise Exception('No index.html found')


entry = get_entrypoint()


@set_interval(1)
def update_ticker():
    if len(webview.windows) > 0:
        logger.debug(f"update_ticker: {time.time()}")
        webview.windows[0].evaluate_js('window.pywebview.state && window.pywebview.state.set_ticker("%d")' % time.time())


if __name__ == '__main__':
    RENDERER_URL = "http://localhost:5173"
    APP_VERSION = "v0.1.5"
    api = Api()
    window = webview.create_window('CBAdbEasy {}'.format(APP_VERSION), entry, js_api=api, width=1280,
                                   height=700,
                                   min_size=(1280, 700), )
    webview.start()
