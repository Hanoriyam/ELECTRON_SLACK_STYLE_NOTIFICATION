'use strict';

const { app, BrowserWindow, ipcMain, screen } = require("electron");
const path = require('path');
const Code = require('../js/Code');

const strTitle = 'notitester';
let mainWindow = null;
let notiWindow = null;
let notiQueue = new Array();
let mouseIgnoreInterval = null;
let notiListSize = null;

app.whenReady().then(() => {
    const CreateWindow = () => {
        mainWindow = new BrowserWindow({
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, 'mainPreload.js'),
            }
        });
    }

    const LoadFile = (strPath) => {
        mainWindow.loadFile(path.join(__dirname, strPath));
    }

    const StartNotiQueue = () => {
        setInterval(() => {
            if (notiQueue.length > 0) {
                CreateNotiWindow(notiQueue.shift());
            }
        });
    }

    const RegisterIpcEvent = () => {
        const RegisterDefaultIpcEvent = () => {
            ipcMain.on('Code', (event, _) => {
                event.returnValue = Code;
            });
        }

        const RegisterNotiIpcEvent = () => {
            ipcMain.on(Code.NOTI.REGISTER, (_, arg) => {
                RegisterNotification(arg);
            })

            ipcMain.on(Code.NOTI.CLICK, (_, arg) => {
                switch (arg.Type) {
                    default:
                        mainWindow.show();
                        break;
                }
            });

            ipcMain.on(Code.NOTI.TERMINATE, (_, arg) => {
                TerminateNotiWindow();
            });

            ipcMain.on(Code.NOTI.CLOSE_ALL, (_, arg) => {
                CloseAllNotiWindow();
            });

            ipcMain.on(Code.NOTI.CLOSE_WITH_TYPE, (_, arg) => {
                CloseNotiWithType(arg);
            });

            ipcMain.on(Code.NOTI.LIST_SIZE_CHANGED, (_, arg) => {
                notiListSize = arg;
            });
        }

        RegisterDefaultIpcEvent();
        RegisterNotiIpcEvent();
    }

    const CreateNotiWindow = (notiObject) => {
        if (notiWindow !== null) {
            notiWindow.setAlwaysOnTop(true, 'screen-saver');
            notiWindow.webContents.send(Code.NOTI.MESSAGE, notiObject);
            return;
        }

        const windowBounds = mainWindow.getBounds();
        const screenWorkArea = screen.getDisplayNearestPoint({
            x: windowBounds.x + (windowBounds.width / 2),
            y: windowBounds.y + (windowBounds.height / 2)
        }).workArea;

        notiWindow = new BrowserWindow({
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, '../noti/notiPreload.js'),
                devTools: false
            },
            title: strTitle,
            alwaysOnTop: true,
            transparent: true,
            frame: false,
            resizable: false,
            titleBarStyle: "hidden",
            minimizable: false,
            autoHideMenuBar: true,
            skipTaskbar: true,
            focusable: false,
            width: 490,
            minWidth: 490,
            maxWidth: 490,
            height: screenWorkArea.height - 5,
            minHeight: screenWorkArea.height - 5,
            maxHeight: screenWorkArea.height - 5,
            x: screenWorkArea.x + screenWorkArea.width - 490 - 5,
            y: 0,
            show: false
        });

        notiWindow?.removeMenu();
        notiWindow?.setIgnoreMouseEvents(false);
        notiWindow?.setAlwaysOnTop(true, 'screen-saver');
        notiWindow?.loadFile(path.join(__dirname, '../noti/notification.html')).then(() => {
            notiWindow?.show();
            notiWindow?.setAlwaysOnTop(true, 'screen-saver');
            notiWindow.webContents.send(Code.NOTI.MESSAGE, notiObject);
            StartMouseIgnoreCheckInterval();
        });
    }

    const RegisterNotification = (notiObject) => {
        notiQueue.push(notiObject);
    }

    const CloseNotiWithType = (type) => {
        if (notiWindow !== null) {
            notiWindow.webContents.send(Code.NOTI.CLOSE_WITH_TYPE, type);
        }
    }

    const CloseAllNotiWindow = () => {
        if (notiWindow !== null) {
            notiWindow.webContents.send(Code.NOTI.CLOSE_ALL);
        }
    }

    const TerminateNotiWindow = () => {
        notiWindow?.close();
        notiWindow = null;
        ClearMouseIgnoreCheckInterval();
    }

    const StartMouseIgnoreCheckInterval = () => {
        if (mouseIgnoreInterval !== null) {
            return;
        }

        mouseIgnoreInterval = setInterval(() => {
            if (notiWindow === null || notiListSize === null) {
                return;
            }

            try {
                let pos = screen.getCursorScreenPoint();
                let [x, y] = notiWindow?.getPosition();
                let [_, height] = notiWindow?.getSize();
                let isMouseIn = ((x <= pos.x) && ((x + notiListSize.width) >= pos.x) && ((y + height - notiListSize.height) <= pos.y) && ((y + height) >= pos.y));
                notiWindow?.setIgnoreMouseEvents(!isMouseIn);
            }
            catch (error) {
            }
        });
    }

    const ClearMouseIgnoreCheckInterval = () => {
        if (mouseIgnoreInterval === null) {
            return;
        }

        clearInterval(mouseIgnoreInterval);
        mouseIgnoreInterval = null;
        notiListSize = null;
    }

    CreateWindow();
    LoadFile('main.html');
    StartNotiQueue();
    RegisterIpcEvent();
});