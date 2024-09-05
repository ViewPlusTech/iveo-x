const {
  ipcMain,
  BrowserWindow,
  dialog
} = require('electron');

const path = require('path');
const fs = require('fs');

let saveFilename = 'default';


ipcMain.on('save', (event, arg) => {
  console.log('fileIO:ipcMain:save: Saving content of the file');
  // console.log(arg);

  const window = BrowserWindow.getFocusedWindow();
  if (window) {
    const options = {
      title: 'Save SVG file',
      defaultPath: saveFilename,
      filters: [
        {
          name: 'SVG',
          extensions: ['svg']
        }
      ]
    };

    const filename = dialog.showSaveDialogSync(window, options);
    if (filename) {
      console.log(`Saving content to the file: ${filename}`);
      fs.writeFileSync(filename, arg);
    }    
  }
});


ipcMain.on('renderer-reply', (event, arg) => {
  console.log(`fileIO:ipcMain:renderer-reply: Received reply from web page: ${arg}`);
});


function saveFile() {
  console.log('fileIO:saveFile: Saving the file');

  const window = BrowserWindow.getFocusedWindow();
  if (window) {
    window.webContents.send('renderer-event', 'save');
  }
}

function loadFile() {
  const window = BrowserWindow.getFocusedWindow();
  if (window) {
    const files = dialog.showOpenDialogSync(window, {
        properties: ['openFile'],
        title: 'Pick an SVG file',
        filters: [
          { name: 'SVG', extensions: ['svg'] },
        ]
    });

    if (files) {
      const file = files[0];
      // console.log('file', file);
      saveFilename = path.parse(file).name;
      const fileContent = fs.readFileSync(file).toString();
      // console.log(fileContent);
      window.webContents.send('file-loaded', { fileName: saveFilename });
      window.webContents.send('load', fileContent);
      console.log(saveFilename)
      
    }
  }
}

function loadFileByCode() {
  const window = BrowserWindow.getFocusedWindow();
  if (window) {
    // const files = dialog.showOpenDialogSync(window, {
    //     properties: ['openFile'],
    //     title: 'Pick an SVG file',
    //     filters: [
    //       { name: 'SVG', extensions: ['svg'] },
    //     ]
    // });

    const fileRegistry = {
      '001': 'svg-scramble.svg',
      '002': 'france-borders.svg',
      '003': 'Lunar_Eclipse.svg',
    }

    window.webContents.send('load_id', 'huh?');
    

    // const window = BrowserWindow.getFocusedWindow();
    // const documentIdDialog = window.webContents.getElementById('dialog-document-id');
    // documentIdDialog.showModal();

    // const documentIdInput = window.webContents.getElementById('document_id');
    // const documentId = documentIdInput.value;

    // console.log(filename, window);
    // const filename = fileRegistry[documentId];


    const filename = fileRegistry['001'];


    if (filename) {
      window.webContents.send('file-loaded', { fileName: filename });
      // const filepath = path.join(__dirname, '.', 'README.md');
      // const filePath = path.join(__dirname, '/content', filename);
      const filePath = path.join('./content', filename);
      console.log('filePath', filePath);
      fs.readFile(filePath, 'utf-8', (err, data) => {
        if(err){
            console.log(`An error ocurred reading the file : &{err.message}`);
            return;
        }
  
        // Change how to handle the file content
        // console.log("The file content is : " + data);
        window.webContents.send('load', data);

     });
    //   const file = files[0];
    //   // console.log('file', file);
    //   saveFilename = path.parse(file).name;
    //   const fileContent = fs.readFileSync(file).toString();
    //   // console.log(fileContent);
    //   window.webContents.send('load', fileContent);
    }
  }
}

module.exports = { saveFile, loadFile, loadFileByCode };
