import { app, BrowserWindow, ipcMain, Tray, screen } from "electron";
import * as path from "path";

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;


let MainTray: Tray | undefined;
let TrayWindow: BrowserWindow | undefined;

const WINDOW_SIZE_DEFAULTS = {
    width: 200,
    height: 300,
    margin: {
        x: 0,
        y: 0,
    }
}

export function InitTray() {
    MainTray = new Tray(path.join(__dirname, "download.png"));
    createWindow();

    MainTray.on("click", function (event) { //eventable click event (should be changed to be useable for all OSs)
        ipcMain.emit("tray-window-clicked", { window: TrayWindow, tray: MainTray });
        toggleTrayWindow();
    });

    alignWindow();
    ipcMain.emit("tray-window-ready", { window: TrayWindow, tray: MainTray })
}

function createWindow() {
    TrayWindow = new BrowserWindow({
        width: WINDOW_SIZE_DEFAULTS.width,
        height: WINDOW_SIZE_DEFAULTS.height,
        maxHeight: WINDOW_SIZE_DEFAULTS.height,
        maxWidth: WINDOW_SIZE_DEFAULTS.width,
        show: false,
        frame: false,
        fullscreenable: false,
        resizable: false,
        useContentSize: false,
        transparent: true,
        alwaysOnTop: true,
        webPreferences: {
            backgroundThrottling: false,
        }
    });

    TrayWindow.setMenu(null);
    TrayWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

    TrayWindow.hide();
    TrayWindow.on("blur", () => {
        if (!TrayWindow) return;
        if (!TrayWindow.webContents.isDevToolsOpened()) {
            TrayWindow.hide();
            ipcMain.emit("tray-window-hidden", { window: TrayWindow, tray: MainTray });
        }
    });
    TrayWindow.on("close", function (event) {
        if (!TrayWindow) return;
        event.preventDefault();
        TrayWindow.hide();
    });
}

function toggleTrayWindow() {
    if (!TrayWindow) return;
    if (TrayWindow.isVisible()) {
        TrayWindow.hide();
    } else {
        TrayWindow.show();
    }
    ipcMain.emit("tray-window-hidden", { window: TrayWindow, tray: MainTray });
}

function alignWindow() {
    if (!TrayWindow) return;

    const position = calculateWindowPosition();
    if (!position) return;

    TrayWindow.setBounds({
        width: WINDOW_SIZE_DEFAULTS.width,
        height: WINDOW_SIZE_DEFAULTS.height,
        x: position.x,
        y: position.y
    })
}

function calculateWindowPosition() { //calculation of position if its on top or on button based on OS configuration
    if (!MainTray) return;
    const screenBounds = screen.getPrimaryDisplay().size;
    const trayBounds = MainTray.getBounds();

    //where is the icon on the screen?
    let trayPos = 4;
    trayPos = trayBounds.y > screenBounds.height ? screenBounds.height / 2 : trayPos / 2;
    trayPos = trayBounds.x > screenBounds.width ? screenBounds.height / 2 : trayPos - 1;
    let x, y = 0;

    //calculate the new variables
    switch (trayPos) {
        case 1: // TOP - LEFT
            x = Math.floor(trayBounds.x + WINDOW_SIZE_DEFAULTS.margin.x + trayBounds.width);
            y = Math.floor(trayBounds.y + WINDOW_SIZE_DEFAULTS.margin.y + trayBounds.height);
            break;
        case 2: // TOP - RIGHT
            x = Math.floor(trayBounds.x - WINDOW_SIZE_DEFAULTS.width - WINDOW_SIZE_DEFAULTS.margin.x);
            y = Math.floor(trayBounds.y + WINDOW_SIZE_DEFAULTS.margin.y + trayBounds.height);
            break;
        case 3: // BUTTOM - LEFT
            x = Math.floor(trayBounds.x + WINDOW_SIZE_DEFAULTS.margin.x + trayBounds.width);
            y = Math.floor(trayBounds.y - WINDOW_SIZE_DEFAULTS.height - trayBounds.height);
            break;
        case 4: // BUTTOM - RIGHT
            x = Math.floor(trayBounds.x - WINDOW_SIZE_DEFAULTS.width - WINDOW_SIZE_DEFAULTS.margin.x);
            y = Math.floor(trayBounds.y - WINDOW_SIZE_DEFAULTS.height - WINDOW_SIZE_DEFAULTS.margin.y);
            break;
    }

    return {x, y}

}
