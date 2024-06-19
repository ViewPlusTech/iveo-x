const { app, Menu, dialog } = require('electron');

const contextMenuTemplate = [
  {
    label: 'Options',
    submenu: [
      {
        label: 'Do something…',
        click: async () => {
          console.log('Something done!');
        },
      },
    ],
  },
  {
    label: 'More options',
    click: async () => {
      alert('This is optional');
    },
  },
];

module.exports.contextMenu = Menu.buildFromTemplate( contextMenuTemplate );
