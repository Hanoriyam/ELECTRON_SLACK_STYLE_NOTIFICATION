'use strict'

const { contextBridge, ipcRenderer } = require('electron');
const Code = ipcRenderer.sendSync('Code');

let AddNewNoti = null;
let CloseAllNoti = null;
let CloseNotiWithType = null;

let toastList = null;
let observer = null;

contextBridge.exposeInMainWorld("ELECTRON_NOTI_FUNC", {
    CloseWindow: () => {
        ipcRenderer.send(Code.NOTI.TERMINATE);
    },

    NotiClick: (noti) => {
        ipcRenderer.send(Code.NOTI.CLICK, noti);
    },

    RegisterFunc: (AddNewToast, CloseAllToasts, CloseAllToastsWithType) => {
        if (AddNewNoti === null) {
            AddNewNoti = AddNewToast;
        }

        if (CloseAllNoti === null) {
            CloseAllNoti = CloseAllToasts;
        }

        if (CloseNotiWithType === null) {
            CloseNotiWithType = CloseAllToastsWithType;
        }
    }
});

ipcRenderer.on(Code.NOTI.MESSAGE, (_, arg) => {
    if (AddNewNoti !== null) {
        AddNewNoti(arg);
    }
});

ipcRenderer.on(Code.NOTI.CLOSE_ALL, (_, arg) => {
    if (CloseAllNoti !== null) {
        CloseAllNoti();
    }
});

ipcRenderer.on(Code.NOTI.CLOSE_WITH_TYPE, (_, arg) => {
    if (CloseNotiWithType !== null) {
        CloseNotiWithType(arg);
    }
})

window.addEventListener('DOMContentLoaded', () => {
    toastList = document.querySelector('#toastList');
    observer = new ResizeObserver(entries => {
        for (let entry of entries) {
            const { width, height } = entry.contentRect;
            ipcRenderer.send(Code.NOTI.LIST_SIZE_CHANGED, { 'width': width, 'height': height });
        }
    });
    observer.observe(toastList);
});