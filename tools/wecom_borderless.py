# -*- coding: utf-8 -*-
"""
企业微信 PWA 无边框/隐藏标题栏助手 (WeCom Borderless Window Tool)
-------------------------------------------------------------
功能说明：
1. 启动时自动检测并隐藏 Chrome/Edge 中的 Linux DO / 企业微信 PWA 窗口标题栏；
2. 全局快捷键 F8 (或 Alt+F11)：随时隐藏/恢复当前窗口标题栏；
3. Alt + 鼠标左键拖动：隐藏标题栏后，按住键盘 Alt 键并在窗口任意位置按住鼠标左键即可拖动窗口；
4. 双击【退出无边框工具.bat】安全退出并自动恢复所有窗口标题栏；
5. 纯 Python 标准库编写，无需安装任何第三方库。
"""

import ctypes
from ctypes import wintypes
import json
import os
import sys
import threading
import time

user32 = ctypes.windll.user32
kernel32 = ctypes.windll.kernel32

# 附加到默认交互桌面
try:
    hdesk = user32.OpenDesktopW("default", 0, False, 0x01FF)
    if hdesk:
        user32.SetThreadDesktop(hdesk)
except Exception:
    pass

# Win32 常量定义
GWL_STYLE = -16
WS_CAPTION = 0x00C00000
WS_THICKFRAME = 0x00040000
SWP_FRAMECHANGED = 0x0020
SWP_NOMOVE = 0x0002
SWP_NOSIZE = 0x0001
SWP_NOZORDER = 0x0004

WM_HOTKEY = 0x0312
WM_LBUTTONDOWN = 0x0201
WM_NCLBUTTONDOWN = 0x00A1
HTCAPTION = 2
VK_MENU = 0x12       # Alt 键
VK_F8 = 0x77         # F8 键
VK_F11 = 0x7A        # F11 键
MOD_NOREPEAT = 0x4000
MOD_ALT = 0x0001

HOTKEY_ID_F8 = 1001
HOTKEY_ID_ALT_F11 = 1002

WH_MOUSE_LL = 14

STATE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".borderless_state.json")

class POINT(ctypes.Structure):
    _fields_ = [("x", wintypes.LONG), ("y", wintypes.LONG)]

class MSLLHOOKSTRUCT(ctypes.Structure):
    _fields_ = [
        ("pt", POINT),
        ("mouseData", wintypes.DWORD),
        ("flags", wintypes.DWORD),
        ("time", wintypes.DWORD),
        ("dwExtraInfo", ctypes.c_ulonglong if sys.maxsize > 2**32 else ctypes.c_ulong)
    ]

HOOKPROC = ctypes.WINFUNCTYPE(ctypes.c_longlong, ctypes.c_int, wintypes.WPARAM, wintypes.LPARAM)

# 函数原型声明
kernel32.QueryFullProcessImageNameW.argtypes = [wintypes.HANDLE, wintypes.DWORD, wintypes.LPWSTR, ctypes.POINTER(wintypes.DWORD)]
kernel32.QueryFullProcessImageNameW.restype = wintypes.BOOL

# 保存被修改过样式的窗口句柄与原始样式
modified_windows = {}
mouse_hook = None

def get_process_name(hwnd):
    pid = wintypes.DWORD()
    user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
    if not pid.value:
        return ""
    h_proc = kernel32.OpenProcess(0x1000, False, pid.value)  # PROCESS_QUERY_LIMITED_INFORMATION
    if not h_proc:
        return ""
    buf = ctypes.create_unicode_buffer(1024)
    size = wintypes.DWORD(1024)
    ret = kernel32.QueryFullProcessImageNameW(h_proc, 0, buf, ctypes.byref(size))
    kernel32.CloseHandle(h_proc)
    return os.path.basename(buf.value).lower() if ret else ""

def load_state():
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}

def save_state(state):
    try:
        with open(STATE_FILE, "w", encoding="utf-8") as f:
            json.dump(state, f, ensure_ascii=False, indent=2)
    except Exception:
        pass

def remove_state():
    try:
        if os.path.exists(STATE_FILE):
            os.remove(STATE_FILE)
    except Exception:
        pass

def is_target_window(hwnd):
    if not user32.IsWindow(hwnd) or not user32.IsWindowVisible(hwnd):
        return False
    # 只针对 Chrome 或 Edge 等浏览器窗口，不干扰 Antigravity 或其他开发工具
    proc_name = get_process_name(hwnd)
    if proc_name not in ("chrome.exe", "msedge.exe", "brave.exe", "vivaldi.exe"):
        return False
    cls_buf = ctypes.create_unicode_buffer(256)
    user32.GetClassNameW(hwnd, cls_buf, 256)
    if cls_buf.value != "Chrome_WidgetWin_1":
        return False
    title_buf = ctypes.create_unicode_buffer(512)
    user32.GetWindowTextW(hwnd, title_buf, 512)
    title = title_buf.value.lower().strip()
    keywords = ["linux do", "linuxdo", "企业微信", "wecom"]
    if any(k in title for k in keywords):
        return True
    blank_suffixes = ["", "-", "google chrome", "- google chrome", "microsoft edge", "- microsoft edge", "brave", "- brave"]
    if title in blank_suffixes or title.startswith("- google chrome") or title.startswith("- microsoft edge"):
        return True
    return False

def find_target_windows():
    targets = []
    WNDENUMPROC = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.HWND, wintypes.LPARAM)
    
    def enum_cb(hwnd, lparam):
        if is_target_window(hwnd):
            targets.append(hwnd)
        return True

    user32.EnumDesktopWindows(0, WNDENUMPROC(enum_cb), 0)
    return targets

def get_window_style(hwnd):
    if hasattr(user32, "GetWindowLongPtrW"):
        return user32.GetWindowLongPtrW(hwnd, GWL_STYLE)
    return user32.GetWindowLongW(hwnd, GWL_STYLE)

def set_window_style(hwnd, style):
    if hasattr(user32, "SetWindowLongPtrW"):
        user32.SetWindowLongPtrW(hwnd, GWL_STYLE, style)
    else:
        user32.SetWindowLongW(hwnd, GWL_STYLE, style)
    user32.SetWindowPos(hwnd, 0, 0, 0, 0, 0, SWP_FRAMECHANGED | SWP_NOMOVE | SWP_NOSIZE | SWP_NOZORDER)

def strip_caption(hwnd):
    if not user32.IsWindow(hwnd):
        return False
    style = get_window_style(hwnd)
    if style & WS_CAPTION:
        modified_windows[hwnd] = style
        new_style = (style & ~WS_CAPTION) | WS_THICKFRAME
        set_window_style(hwnd, new_style)
        return True
    return False

def restore_caption(hwnd, orig_style=None):
    if not user32.IsWindow(hwnd):
        return False
    style = get_window_style(hwnd)
    target_style = orig_style if orig_style is not None else modified_windows.get(hwnd, style | WS_CAPTION)
    set_window_style(hwnd, target_style | WS_CAPTION)
    modified_windows.pop(hwnd, None)
    return True

def toggle_window_caption(hwnd=None):
    if not hwnd:
        fg = user32.GetForegroundWindow()
        # 只要当前聚焦的是浏览器窗口，按快捷键直接切换当前窗口
        if fg and user32.IsWindow(fg) and user32.IsWindowVisible(fg):
            proc_name = get_process_name(fg)
            if proc_name in ("chrome.exe", "msedge.exe", "brave.exe", "vivaldi.exe"):
                hwnd = fg
        if not hwnd:
            # 否则在后台目标窗口中查找
            targets = find_target_windows()
            if targets:
                hwnd = targets[0]
            elif fg and user32.IsWindow(fg):
                hwnd = fg

    if not hwnd or not user32.IsWindow(hwnd):
        return False

    style = get_window_style(hwnd)
    if style & WS_CAPTION:
        strip_caption(hwnd)
        user32.MessageBeep(0)
        return True
    else:
        restore_caption(hwnd)
        user32.MessageBeep(0)
        return False

def low_level_mouse_proc(nCode, wParam, lParam):
    if nCode >= 0 and wParam == WM_LBUTTONDOWN:
        # 检查 Alt 键是否被按住 (最高位为 1 表示按下)
        if user32.GetAsyncKeyState(VK_MENU) & 0x8000:
            hook_data = ctypes.cast(lParam, ctypes.POINTER(MSLLHOOKSTRUCT)).contents
            pt = hook_data.pt
            target_hwnd = user32.WindowFromPoint(pt)
            root_hwnd = user32.GetAncestor(target_hwnd, 2)  # GA_ROOT = 2
            if root_hwnd:
                proc = get_process_name(root_hwnd)
                if proc in ("chrome.exe", "msedge.exe"):
                    user32.ReleaseCapture()
                    user32.PostMessageW(root_hwnd, WM_NCLBUTTONDOWN, HTCAPTION, 0)
                    return 1  # 拦截点击，防止网页误触
    return user32.CallNextHookEx(mouse_hook, nCode, wParam, lParam)

def show_dialog(title, message, timeout_ms=4000, async_mode=False):
    """弹出原生 Windows 提示框，支持自动超时关闭 (未操作 4 秒后自动消失)"""
    def _run():
        try:
            fn = getattr(user32, "MessageBoxTimeoutW", None)
            flags = 0x40 | 0x40000 | 0x10000  # MB_ICONINFORMATION | MB_TOPMOST | MB_SETFOREGROUND
            if fn:
                fn(0, message, title, flags, 0, timeout_ms)
            else:
                user32.MessageBoxW(0, message, title, flags)
        except Exception:
            pass

    if async_mode:
        threading.Thread(target=_run, daemon=True).start()
    else:
        _run()

def stop_tool():
    """退出并还原所有窗口"""
    state = load_state()
    # 还原记录的窗口
    saved_windows = state.get("modified_windows", {})
    restored_count = 0
    for hwnd_str, orig_style in saved_windows.items():
        try:
            hwnd = int(hwnd_str)
            if user32.IsWindow(hwnd):
                restore_caption(hwnd, orig_style)
                restored_count += 1
        except Exception:
            pass

    # 同时扫描并还原当前可能仍处于无边框状态的目标窗口
    targets = find_target_windows()
    for thwnd in targets:
        style = get_window_style(thwnd)
        if not (style & WS_CAPTION):
            restore_caption(thwnd)
            restored_count += 1

    # 终止旧进程
    old_pid = state.get("pid")
    if old_pid and old_pid != os.getpid():
        try:
            h_proc = kernel32.OpenProcess(1, False, old_pid)  # PROCESS_TERMINATE = 1
            if h_proc:
                kernel32.TerminateProcess(h_proc, 0)
                kernel32.CloseHandle(h_proc)
        except Exception:
            pass

    remove_state()
    show_dialog(
        "企业微信无边框助手",
        "企业微信无边框助手已安全退出！\n\n已为您恢复窗口的原始标题栏与边框样式。",
        timeout_ms=2500,
        async_mode=False
    )

def main():
    global mouse_hook

    if "--stop" in sys.argv:
        stop_tool()
        return

    # 检查是否已有运行中的实例
    state = load_state()
    old_pid = state.get("pid")
    if old_pid:
        h_proc = kernel32.OpenProcess(0x0400, False, old_pid)
        if h_proc:
            kernel32.CloseHandle(h_proc)
            # 尝试为可能新开的窗口应用样式
            targets = find_target_windows()
            for thwnd in targets:
                strip_caption(thwnd)
            show_dialog(
                "企业微信无边框助手",
                "企业微信无边框助手已在后台运行中！\n\n"
                "• 快捷键 [F8]：随时切换 显示 / 隐藏 标题栏\n"
                "• [Alt + 鼠标左键拖动]：在窗口任意位置自由拖动窗口\n\n"
                "如需完全退出并还原标题栏，运行【退出无边框工具.bat】。",
                timeout_ms=3000,
                async_mode=False
            )
            return

    # 查找并立即自动隐藏 PWA 窗口标题栏
    targets = find_target_windows()
    auto_stripped = 0
    for thwnd in targets:
        if strip_caption(thwnd):
            auto_stripped += 1

    # 保存状态
    save_state({
        "pid": os.getpid(),
        "modified_windows": {str(k): v for k, v in modified_windows.items()}
    })

    # 注册全局快捷键 F8 与 Alt+F11
    user32.RegisterHotKey(None, HOTKEY_ID_F8, MOD_NOREPEAT, VK_F8)
    user32.RegisterHotKey(None, HOTKEY_ID_ALT_F11, MOD_NOREPEAT | MOD_ALT, VK_F11)

    # 安装鼠标钩子支持 Alt + 左键拖动窗口
    hook_callback = HOOKPROC(low_level_mouse_proc)
    h_instance = kernel32.GetModuleHandleW(None)
    mouse_hook = user32.SetWindowsHookExW(WH_MOUSE_LL, hook_callback, h_instance, 0)

    # 异步弹出就绪提示
    status_msg = "企业微信 PWA 无边框助手已成功启动！\n\n"
    if auto_stripped > 0:
        status_msg += f"✨ 已自动为您隐藏当前检测到的 {auto_stripped} 个 PWA 窗口标题栏！\n\n"
    else:
        status_msg += "✨ 助手已在后台就绪！打开 PWA 窗口后按 F8 即可隐藏标题栏。\n\n"

    status_msg += (
        "操作指南：\n"
        "• 快捷键 [F8] 或 [Alt + F11]：随时隐藏 / 恢复标题栏\n"
        "• [Alt + 鼠标左键拖动]：按住 Alt 键在窗口任意位置自由移动窗口\n\n"
        "如需退出并还原标题栏，双击运行【退出无边框工具.bat】即可。"
    )
    show_dialog("企业微信无边框助手", status_msg, timeout_ms=4500, async_mode=True)

    try:
        msg = wintypes.MSG()
        while user32.GetMessageW(ctypes.byref(msg), None, 0, 0) != 0:
            if msg.message == WM_HOTKEY:
                if msg.wParam in (HOTKEY_ID_F8, HOTKEY_ID_ALT_F11):
                    toggle_window_caption()
                    # 更新状态文件中的窗口记录
                    save_state({
                        "pid": os.getpid(),
                        "modified_windows": {str(k): v for k, v in modified_windows.items()}
                    })
            user32.TranslateMessage(ctypes.byref(msg))
            user32.DispatchMessageW(ctypes.byref(msg))
    finally:
        if mouse_hook:
            user32.UnhookWindowsHookEx(mouse_hook)
        user32.UnregisterHotKey(None, HOTKEY_ID_F8)
        user32.UnregisterHotKey(None, HOTKEY_ID_ALT_F11)
        remove_state()

if __name__ == "__main__":
    main()
