const {
  app,
  Menu,
  shell,
  ipcMain,
  BrowserWindow,
  globalShortcut
} = require('electron');

const {
  saveFile, 

  loadFile,
  loadFileByCode,
} = require('./fileIO');

const {
  printFile
} = require('./print');

// TODO: Determine what this code is for. Hotkeys work without it. Possibly for multi-window apps?
// app.on('ready', () => {
//   globalShortcut.register('CommandOrControl+S', () => {
//     saveFile();
//   });

//   globalShortcut.register('CommandOrControl+O', () => {
//     loadFile();
//   });
// });

const isMac = process.platform === 'darwin';

const menuTemplate = [
  // ...(isMac ? [{
  //   label: app.name,
  //   submenu: [
  //     { role: 'about' },
  //     // { role: 'separator' },
  //     { role: 'quit' },
  //   ],
  // }] : []),
  {
    label: 'IVEO-X',
    submenu: [
      { role: 'quit' },
    ],
  },
  {
    label: 'File',
    submenu: [
      {
        label: 'Open File…',
        accelerator: 'CommandOrControl+O',
        click() {
          loadFile();
        }
      },
      {
        label: 'Open File by Code…',
        accelerator: 'CommandOrControl+I',
        click() {
          loadFileByCode();
        }
      },
      {
        label: 'Save File…',
        accelerator: 'CommandOrControl+S',
        click() {
          saveFile();
        }
      },
      {
        label: 'Print File…',
        accelerator: 'CommandOrControl+P',
        click() {
          console.log('printFile clicked');
          printFile();
        }
      },
    ],
  },
  {
    label: 'Document',
    submenu: [
      {
        label: 'Calibrate Document…',
        accelerator: 'CommandOrControl+C',
        click() {
          const window = BrowserWindow.getFocusedWindow();
          window.webContents.send('renderer-event', 'toggle-calibrate-mode');
        }
      },
    ]
  },
  {
    label: 'Settings',
    submenu: [
      {
        label: 'Toggle Self-Voicing',
        accelerator: 'CommandOrControl+T',
        click() {
          const window = BrowserWindow.getFocusedWindow();
          window.webContents.send('renderer-event', 'toggle-self-voicing');
        }
      },
      {
        label: 'Toggle Sonification',
        accelerator: 'CommandOrControl+M',
        click() {
          const window = BrowserWindow.getFocusedWindow();
          window.webContents.send('renderer-event', 'toggle-sonification');
        }
      },
      {
        label: 'Toggle Dark Mode',
        accelerator: 'CommandOrControl+D',
        click() {
          const window = BrowserWindow.getFocusedWindow();
          window.webContents.send('renderer-event', 'toggle-dark-mode');
        }
      },
      {
        label: 'Toggle Element Descriptions',
        accelerator: 'CommandOrControl+E',
        click() {
          const window = BrowserWindow.getFocusedWindow();
          window.webContents.send('renderer-event', 'toggle-element-descriptions');
        }
      },
      {
        label: 'Toggle Strict JSON Image Metadata (JIM)',
        accelerator: 'CommandOrControl+J',
        click() {
          const window = BrowserWindow.getFocusedWindow();
          window.webContents.send('renderer-event', 'toggle-strict-jim');
        }
      },
    ]
  },
  {
    role: 'help',
    submenu: [
      {
        label: 'About IVEO-X',
        click() {
          shell.openExternal('https://github.com/ViewPlusTech/iveo-x');
        }
      }
    ]
  },
  {
    label: 'Debugging',
    submenu: [
      {
        label: 'Dev Tools',
        role: 'toggleDevTools'
      },

      {
        label: 'Full Screen',
        role: 'togglefullscreen'
      },

      { type: 'separator' },
      {
        role: 'reload',
        accelerator: 'Alt+R'
      }
    ]
  },
];

if (process.platform === 'darwin') {
  menuTemplate.unshift({
    label: app.name,
    submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'quit' }]
  });
}

const appMenu = Menu.buildFromTemplate(menuTemplate);

module.exports = appMenu;
