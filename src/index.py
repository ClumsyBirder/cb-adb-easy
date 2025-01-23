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
import webview
import json

from time import time
from adbutils import adb, AdbDevice
from loguru import logger

from src.service.adb.memory import MemoryMonitor


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
        self.device: AdbDevice

    def get_pid(self, package_name):

        commands = 'ps -A| grep {}'.format(package_name)
        result = self.device.shell(commands)
        str_ret = result.split('\n')
        pid = '-1'
        for strs in str_ret:
            if strs == '':
                continue
            str_list = strs.split(' ')
            str_list_result = []
            for info in str_list:
                if info != '':
                    str_list_result.append(info)
            str_pacackage = str_list_result[8]
            if str_pacackage == package_name:
                return str_list_result[1]

        return pid

    def get_sdk_version(self):

        sdk_version = self.device.shell("getprop ro.build.version.sdk").strip()
        return int(sdk_version)

    def get_device_list(self):
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
        if not serial:
            logger.error("Invalid serial number")
            return {}

        logger.debug(f"Fetching device info for serial: {serial}")

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

        memInfo = self.device.shell('cat /proc/meminfo')
        for line in memInfo.split('\n'):
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
        command = 'pm list packages' if system else 'pm list packages -3'
        packages = self.device.shell(command)
        trimmed_result = packages.strip()
        lines = trimmed_result.split('\n')
        processed_lines = [{'name': line[8:], 'packageName': line[8:], 'id': i} for i, line in enumerate(lines)]
        logger.debug(processed_lines)
        return processed_lines

    def get_processes(self):
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
        filename = webview.windows[0].create_file_dialog(webview.OPEN_DIALOG)
        logger.debug(filename)
        if not filename:
            return
        self.device.install(filename[0], nolaunch=True)
        return True

    def uninstall_package(self, package_name):
        self.device.uninstall(package_name)
        return True

    def pull_apk(self, package_name):
        apk_path = self.device.shell(f'pm path {package_name}').strip().split(':')[-1]
        if not apk_path:
            logger.error(f"未找到包名为 {package_name} 的 APK")
            return False
        filename = webview.windows[0].create_file_dialog(webview.SAVE_DIALOG, save_filename=f"{package_name}.apk")
        logger.debug(f"apk_path: {apk_path}  filename: {filename}")
        if not filename:
            return
        self.device.sync.pull_file(apk_path, filename)
        return True

    def clear_package(self, package_name):
        self.device.shell(f'pm clear {package_name}')
        return True

    def start_package(self, package_name):
        self.device.shell(f'am start -n {package_name}')
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

    def fullscreen(self):
        webview.windows[0].toggle_fullscreen()

    def save_content(self, content):
        filename = webview.windows[0].create_file_dialog(webview.SAVE_DIALOG)
        if not filename:
            return

        with open(filename[0], 'w') as f:
            f.write(content)

    def ls(self):
        return os.listdir('.')

    def get_memory_info(self, package_name: str):

        return MemoryMonitor(self.device).get_mem_info(self.get_pid(package_name), 24, package_name)

    @set_interval(1)
    def update_logcat(self):

        try:
            if self.device is None:
                return
            self.device.shell("logcat --clear")

            if len(webview.windows) > 0:
                stream = self.device.shell("logcat", stream=True)
                with stream:
                    f = stream.conn.makefile()
                    while True:
                        line = f.readline().strip()
                        if not line:
                            continue

                        # Parse logcat line into components
                        try:
                            parts = line.split(None, 5)
                            if len(parts) >= 6:
                                date, time, pid, tid, level, message = parts
                                log_entry = {
                                    'timestamp': f"{date} {time}",
                                    'processId': f"{pid}-{tid}",
                                    'level': level[0],  # First character of level (I/D/W/E/V)
                                    'message': message,
                                    'component': message.split(':', 1)[0] if ':' in message else 'unknown',
                                    'package': 'system'  # Default package name
                                }
                                # Send formatted log entry to frontend
                                logger.debug(f"log_entry: {log_entry}")
                                js_code = f'window.pywebview.state && window.pywebview.state.addLogEntry({json.dumps(log_entry)})'
                                webview.windows[0].evaluate_js(js_code)
                        except Exception as e:
                            logger.error(f"Error parsing logcat line: {e}")
                            continue

        except Exception as e:
            logger.error(f"获取 logcat 日志失败: {e}")


def get_entrypoint():
    def exists(path):
        return os.path.exists(os.path.join(os.path.dirname(__file__), path))

    if exists('../dist/index.html'):  # unfrozen development
        return '../dist/index.html'

    if exists('./dist/index.html'):
        return './dist/index.html'

    raise Exception('No index.html found')


entry = get_entrypoint()


@set_interval(1)
def update_ticker():
    if len(webview.windows) > 0:
        logger.debug(f"update_ticker: {time()}")
        webview.windows[0].evaluate_js('window.pywebview.state && window.pywebview.state.set_ticker("%d")' % time())


if __name__ == '__main__':
    RENDERER_URL = "http://localhost:5173"
    APP_VERSION = "v0.1.3"
    api = Api()
    window = webview.create_window('CBAdbEasy {}'.format(APP_VERSION), RENDERER_URL, js_api=api, width=1280,
                                   height=700,
                                   min_size=(1280, 700), )
    webview.start(api.update_logcat)
    # api.device_info('6b971835')
    # api.get_screenshot()
