; ==============================================================================
; 企业微信 PWA 无边框/隐藏标题栏助手 (AutoHotkey 版本)
; ==============================================================================
; 快捷键说明：
; 1. 按 F8 (或 Alt + F11)：切换当前窗口标题栏显隐
; 2. 按住 Alt + 鼠标左键：在无标题栏窗口任意位置拖动窗口
; ==============================================================================

#NoEnv
#SingleInstance Force
SetWorkingDir %A_ScriptDir%

; F8 或 Alt+F11 切换标题栏显隐
F8::
!F11::
    WinGet, style, Style, A
    if (style & 0xC00000) {
        WinSet, Style, -0xC00000, A   ; 隐藏标题栏 (WS_CAPTION)
    } else {
        WinSet, Style, +0xC00000, A   ; 恢复标题栏
    }
    WinSet, Redraw,, A
    SoundBeep, 750, 100
return

; Alt + 鼠标左键：任意位置拖动窗口
!LButton::
    CoordMode, Mouse, Screen
    MouseGetPos, startX, startY, winId
    WinGetPos, winX, winY,,, ahk_id %winId%
    SetTimer, DragWindow, 10
return

!LButton Up::
    SetTimer, DragWindow, Off
return

DragWindow:
    if !GetKeyState("LButton", "P") {
        SetTimer, DragWindow, Off
        return
    }
    CoordMode, Mouse, Screen
    MouseGetPos, curX, curY
    deltaX := curX - startX
    deltaY := curY - startY
    WinMove, ahk_id %winId%,, winX + deltaX, winY + deltaY
return
