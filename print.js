const {
  ipcMain,
  BrowserWindow
} = require('electron');

// let saveFilename = 'default';


ipcMain.on('print', (event, arg) => {
  console.log('print:ipcMain:print: Printing content of the file');
  console.log(arg);

  printFile();
});


ipcMain.on('renderer-reply', (event, arg) => {
  console.log(`print:ipcMain:renderer-reply: Received reply from web page: ${arg}`);
});


function printFile() {
  console.log('print:saveFile: Printing the file');

  const window = BrowserWindow.getFocusedWindow();
  if (window) {
    // console.log('print window', window);

    // Use default printing options
    // window.webContents.print(options, function (response) {
    //   console.log(response);
    // });

    // const options = {
    //   silent: false,
    //   printBackground: true,
    //   color: false,
    //   margin: {
    //     marginType: 'printableArea'
    //   },
    //   landscape: false,
    //   pagesPerSheet: 1,
    //   collate: false,
    //   copies: 1,
    //   header: 'Header of the Page',
    //   footer: 'Footer of the Page'
    // };
    
    // Use custom printing options
    const options = {
      silent: false,
      printBackground: false,
      margin: {
        marginType: 'printableArea'
      },
      landscape: true,
      pagesPerSheet: 1,
      collate: false,
      copies: 1,
    };

    window.webContents.print(options, (success, failureReason) => {
      if (!success) {
        console.log(failureReason);
        // TODO: report error code in UI message
      } else {
        console.log('Print Initiated', success);
        // TODO: report success in UI message
      }
    });

    window.webContents.send('renderer-event', 'print');
  }
}

module.exports = { printFile };
