'use strict'

const { contextBridge, ipcRenderer } = require('electron');
const Code = ipcRenderer.sendSync('Code');

contextBridge.exposeInMainWorld("ELECTRON_FUNC", {
    RegisterNotification: (notiObject) => {
        ipcRenderer.send(Code.NOTI.REGISTER, notiObject);
    },

    CloseNotiWithType: (type) => {
        ipcRenderer.send(Code.NOTI.CLOSE_WITH_TYPE, type);
    },

    CloseAllNotiWindow: _ => {
        ipcRenderer.send(Code.NOTI.CLOSE_ALL);
    },
    
    TerminateNotiWindow: _ => {
        ipcRenderer.send(Code.NOTI.TERMINATE);
    }
});