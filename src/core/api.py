"""
API基类
"""
import base64

import io
import os
import re
import threading
from enum import Enum
from typing import Union

import webview
import json
import csv

import time
from adbutils import adb, AdbDevice
from loguru import logger

from src.core.memory import MemoryMonitor

logger.add(
    "logs/log.log",
    rotation="10 MB",
    retention="10 days",
    level="DEBUG",
    format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {message}"
)


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


@set_interval(1)
def update_ticker():
    if len(webview.windows) > 0:
        logger.debug(f"update_ticker: {time.time()}")
        webview.windows[0].evaluate_js(
            'window.pywebview.state && window.pywebview.state.set_ticker("%d")' % time.time())


class Api:

    def __init__(self):
        self.device: AdbDevice = None
        self.recording_thread: threading.Thread = None
        self.is_recording: bool = False
        self.recording_file: str = None
        logger.info("API initialized")

    def get_pid(self, package_name: str) -> int:
        """
        通过包名获取进程PID
        :param package_name: 应用包名
        :return: 进程PID，如果未找到返回0
        """
        try:
            commands = f'ps -A| grep {package_name}'
            result = self.device.shell(commands)
            str_ret = result.split('\n')

            for line in str_ret:
                if not line:
                    continue

                parts = [p for p in line.split(' ') if p]
                if len(parts) >= 9 and parts[8] == package_name:
                    pid = int(parts[1])
                    logger.debug(f"Found PID {pid} for package {package_name}")
                    return pid

            logger.warning(f"No PID found for package {package_name}")
            return 0

        except Exception as e:
            logger.error(f"Error getting PID for {package_name}: {e}")
            return 0

    def get_sdk_version(self) -> int:
        """
        获取设备SDK版本
        :return: SDK版本号
        """
        try:
            sdk_version = self.device.shell("getprop ro.build.version.sdk").strip()
            version = int(sdk_version)
            logger.debug(f"Device SDK version: {version}")
            return version
        except Exception as e:
            logger.error(f"Error getting SDK version: {e}")
            return 0

    @classmethod
    def get_device_list(cls) -> list:
        """
        获取已连接设备列表
        :return:
            设备信息列表，每个设备包含serial、model和name
        """
        os.system(f"adb root")
        try:
            device_list = []
            for d in adb.device_list():
                device_info = {
                    'serial': d.serial,
                    'model': d.prop.model,
                    'name': d.prop.name
                }
                device_list.append(device_info)

            logger.info(f"Found {len(device_list)} connected devices")
            logger.debug(f"Device list: {device_list}")
            return device_list

        except Exception as e:
            logger.error(f"Error getting device list: {e}")
            return []

    def device_info(self, serial: str) -> dict:
        """
        获取设备详细信息
        :param serial: 设备序列号
        :return:
            包含设备信息的字典
        """
        if not serial:
            logger.error("Invalid serial number")
            return {}

        try:
            self.device = adb.device(serial)
            device_info = {}

            # Basic info
            device_info.update({
                'kernelVersion': self.device.shell('uname -r').strip(),
                'fontScale': self.device.shell('settings get system font_scale').strip(),
                'name': self.device.prop.name,
                'model': self.device.prop.model,
                'brand': self.device.shell('getprop ro.product.brand').strip(),
                'serialNum': self.device.shell('getprop ro.serialno').strip(),
                'androidVersion': self.device.shell('getprop ro.build.version.release').strip(),
                'processor': self.device.shell('getprop ro.product.board').strip(),
                'abi': self.device.shell('getprop ro.product.cpu.abi').strip()
            })

            # Network info
            output = self.device.shell('ip addr show wlan0')
            mac_match = re.search(r'link/ether ([0-9a-fA-F:]+) brd', output)
            ip_match = re.search(r'inet (\d+\.\d+\.\d+\.\d+)/\d+', output)

            device_info.update({
                'ipAddress': ip_match.group(1) if ip_match else None,
                'macAddress': mac_match.group(1) if mac_match else None
            })

            # Memory info
            meminfo = self.device.shell('cat /proc/meminfo')
            mem_total = re.search(r'MemTotal:\s+(.+)', meminfo)
            mem_available = re.search(r'MemAvailable:\s+(.+)', meminfo)

            device_info.update({
                'memTotal': mem_total.group(1) if mem_total else None,
                'memFree': mem_available.group(1) if mem_available else None
            })

            # Screen info
            size = self.device.shell('wm size').split(': ')[1].strip()
            density = self.device.shell('wm density').split(': ')[1].strip()
            device_info.update({
                'physicalResolution': f"{size} ({density}dpi)",
                'resolution': size
            })

            logger.info(f"Got device info for {serial}")
            logger.debug(f"Device info: {device_info}")
            return device_info

        except Exception as e:
            logger.error(f"Error getting device info: {e}")
            return {}

    def get_packages(self, system: bool = True) -> list:
        """
        获取设备上安装的应用包列表
        :param system: 是否包含系统应用，默认为True
        :return:
            包含应用信息的列表，每个应用包含name、packageName和id
        """
        try:
            command = 'pm list packages' if system else 'pm list packages -3'
            packages = self.device.shell(command)
            trimmed_result = packages.strip()

            if not trimmed_result:
                logger.warning("No packages found")
                return []

            lines = trimmed_result.split('\n')
            processed_lines = [
                {
                    'name': line[8:],
                    'packageName': line[8:],
                    'id': i
                }
                for i, line in enumerate(lines)
            ]

            logger.info(f"Found {len(processed_lines)} packages")
            logger.debug(f"Package list: {processed_lines}")
            return processed_lines

        except Exception as e:
            logger.error(f"Error getting package list: {e}")
            return []

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

    def get_screenshot(self) -> dict:
        """
        截取屏幕
        :return: image 包含图片base64数据、宽度、高度和大小的字典
        """
        try:
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
                logger.info(f"Screenshot captured: {width}x{height}, {file_size}MB")
                return data

        except Exception as e:
            logger.error(f"Error taking screenshot: {e}")
            return {
                'image': '',
                'width': 0,
                'height': 0,
                'size': 0
            }

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

    def download_file(self, path: str) -> bool:
        """
        从设备下载文件到本地
        :param path: 设备上的文件路径
        :return:
            下载是否成功
        """
        try:
            filename = os.path.basename(path)
            save_path = webview.windows[0].create_file_dialog(
                webview.SAVE_DIALOG,
                save_filename=filename
            )

            if save_path:
                logger.info(f"Downloading file from {path} to {save_path}")
                self.device.sync.pull(path, save_path)
                logger.info("File downloaded successfully")
                return True

            logger.info("Download cancelled by user")
            return False

        except Exception as e:
            logger.error(f"Error downloading file: {e}")
            return False

    def upload_file(self, path: str) -> Union[bool, dict]:
        """
        上传本地文件到设备
        :param path: 设备上的目标路径
        :return:
            上传是否成功或状态信息字典
        """
        try:
            filename = webview.windows[0].create_file_dialog(
                webview.OPEN_DIALOG,
                allow_multiple=False
            )

            if not filename:
                logger.info("Upload cancelled by user")
                return {"status": "cancelled", "message": "操作已取消"}

            source_path = filename[0].replace('\\', '/')
            target_path = f'{path}/{os.path.basename(source_path)}'

            logger.info(f"Uploading file from {source_path} to {target_path}")
            self.device.sync.push(source_path, target_path)
            logger.info("File uploaded successfully")
            return True

        except Exception as e:
            logger.error(f"Error uploading file: {e}")
            return False

    def start_recording(self) -> bool:
        """
        开始录制屏幕
        :return:
            是否成功开始录制
        """
        try:
            if self.is_recording:
                logger.warning("Recording already in progress")
                return False

            timestamp = time.strftime("%Y%m%d_%H%M%S")
            self.recording_file = f"/sdcard/screenrecord_{timestamp}.mp4"
            logger.info(f"Starting screen recording to {self.recording_file}")

            def record_screen():
                try:
                    self.device.shell(f"screenrecord {self.recording_file}")
                except Exception as e:
                    logger.error(f"Recording error: {e}")
                    self.is_recording = False

            self.recording_thread = threading.Thread(target=record_screen)
            self.recording_thread.daemon = True
            self.recording_thread.start()
            self.is_recording = True

            logger.info("Screen recording started successfully")
            return True

        except Exception as e:
            logger.error(f"Failed to start recording: {e}")
            self.is_recording = False
            return False

    def stop_recording(self) -> Union[dict, bool]:
        """
        停止屏幕录制并保存录制文件
        :return:
            成功时返回包含视频base64数据的字典，失败时返回False
        """
        try:
            if not self.is_recording:
                logger.warning("No recording in progress")
                return False

            logger.info("Stopping screen recording")
            self.device.shell("pkill -l SIGINT screenrecord")
            self.is_recording = False

            # Wait a moment for the file to be written
            time.sleep(1)

            # Read the video file data
            try:
                video_data = self.device.sync.read_bytes(self.recording_file)
                # Convert to base64
                video_base64 = base64.b64encode(video_data).decode('utf-8')
                # Clean up the file on device
                self.device.shell(f"rm {self.recording_file}")

                return {
                    "videoData": f"data:video/mp4;base64,{video_base64}"
                }

            except Exception as e:
                logger.error(f"Error reading video file: {e}")
                return False

        except Exception as e:
            logger.error(f"Error stopping recording: {e}")
            self.is_recording = False
            return False

    @classmethod
    def save_recording(cls, video_base64: str) -> bool:
        """
        保存录屏文件到本地

        :param video_base64: base64编码的视频数据
        :return:
            是否保存成功
        """
        try:
            video_data = video_base64.split(',')[1]
            save_path = webview.windows[0].create_file_dialog(
                webview.SAVE_DIALOG,
                save_filename=f"screen_recording_{int(time.time())}.mp4",
                file_types=('MP4 Files (*.mp4)',)
            )

            if not save_path:
                logger.info("Save cancelled by user")
                return False
            video_bytes = base64.b64decode(video_data)
            with open(save_path, 'wb') as f:
                f.write(video_bytes)

            logger.info(f"Recording saved to {save_path}")
            return True

        except Exception as e:
            logger.error(f"Error saving recording: {e}")
            return False
