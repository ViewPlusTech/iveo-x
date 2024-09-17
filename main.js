const { app, BrowserWindow, Menu, ipcMain } = require('electron');
// include the Node.js 'path' module at the top of your file
const path = require('path');
const appMenu = require('./appMenu');
const contextMenu = require('./contextMenu');

// declare window here to prevent garbage collection
let mainWindow = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    show: false, // start with window hidden, to prevent flash of content loading
    // width: 800,
    // height: 600,
    // fullscreen: true,
    width: 1500,
    height: 900,
    fullscreen: false,
    webPreferences: {
      // preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
    // devTools: true,
  });

  mainWindow.loadFile('index.html');

  Menu.setApplicationMenu( appMenu );

  // context menu
  // mainWindow.webContents.on('context-menu', () => {
  //   // console.log(contextMenu);
  //   contextMenu.popup(mainWindow.webContents);
  // });
  mainWindow.webContents.on('context-menu', () => {
    // console.log(contextMenu, contextMenu.getItemCount);
    // contextMenu.popup(mainWindow.webContents);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.insertCSS('text { user-select: none; cursor: default; } text::selection { background: none; }*.selected { outline: black 10px solid; }')
  })

  //  ' *:focus { outline: black 10px solid; } '
  

  // mainWindow.maximize(); // maximize window, don't need if fullscreen

  // open the dev tools by default 
  mainWindow.webContents.openDevTools();

  // once the window is ready and content is loaded, show the window
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
})

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  })
})

// relay messages between renderer processes
// TODO: find way around this hack
ipcMain.on('announce-message', (event, arg) => {
  event.sender.send('announce-message', arg);
});

