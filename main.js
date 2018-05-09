const path = require( 'path' );
const url = require( 'url' );
const fs = require( 'fs' );
const electron = require( 'electron' );
const version = require( './package.json' ).version;

const { app, BrowserWindow, Menu, MenuItem, dialog, ipcMain } = electron;

let mainWindow;
let editWindow;
let fname;

let data = {
  header: '',
  rows: {}
};

function onDataChange( e, d ) {
  data = d;
  console.log( data );
}

let historyPath= `${app.getPath( 'appData' )}/history.json`;
let history;
try { 
  fs.statSync( historyPath );
  history = JSON.parse( fs.readFileSync( historyPath, { encoding: 'utf8' } ) );
}
catch( e ) {
  history = [];
}

let menuTemplate = [
  {
    label: 'File',
    submenu: [
      { 
        label: 'Open', 
        click() { 
          let d = dialog.showOpenDialog({ 
              properties: [ 'openFile' ], 
              filters: [ { name:'csv', extensions:[ 'csv' ] } ]
            },
            openFile
          );
          console.log( d ); 
        }
      },
      { 
        label: 'Save', 
        click() {
          let d = dialog.showSaveDialog({ 
            properties: [ 'openFile' ], 
            filters: [ { name:'csv', extensions:[ 'csv' ] } ]
          },
          saveFile
        );
          console.log( d ); 
        } 
      },
      { type: 'separator' }
    ]
  },
  {
    role: 'window',
    submenu: [
      { role: 'minimize' },
      { role: 'close' }
    ]
  },
];
history.forEach( f => { 
  menuTemplate[0].submenu.push({
    label: f, 
    click(){ 
      openFile( f );
    }
  });
});
if ( process.platform === 'darwin' ) menuTemplate.unshift({ submenu:[ { role: 'about' } ] });
let menu = Menu.buildFromTemplate( menuTemplate );

function createWindow () {
  mainWindow = new BrowserWindow({ 
    width: 800, 
    height: 600, 
    backgroundColor: '#f5efff',
    icon: path.join(__dirname, 'npencil.png'),
    title: `Nilesh's SCSV Editor - ${version}`
  });
  Menu.setApplicationMenu( menu );
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }));
  // mainWindow.webContents.openDevTools();
  mainWindow.on('closed', function () {
    if ( fname && !history.includes( fname ) ) {
      history.push( fname );
      if ( history.length > 5 ) history.shift();
      fs.writeFileSync( historyPath, JSON.stringify( history), {encoding: 'utf8'} );
    } 
    mainWindow = null
  });
  mainWindow.on('will-navigate', function(event) {
    event.preventDefault();
  });
}

function createEditorWindow ( id ) {
  editWindow = new BrowserWindow({ 
    width: 450, 
    height: 400, 
    backgroundColor: '#e9ffce', 
    modal: true, 
    parent: mainWindow 
  });
  editWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'editor.html'),
    protocol: 'file:',
    slashes: true
  }));
  // editWindow.webContents.openDevTools();
  editWindow.on('closed', function () {
    editWindow = null
    ipcMain.removeListener( 'editor-load', listner );
  });
  editWindow.on('will-navigate', function(event) {
    event.preventDefault();
  });
  editWindow.setMenu( null );
  let listner = (e) => {
    if( id ) e.sender.send( 'data', data.rows[ id ], id, data.header );
    else e.sender.send( 'data', undefined, undefined, data.header );
  };
  ipcMain.on( 'editor-load', listner );
}

function saveFile( p ) {
  if ( !p ) return;
  fname = Array.isArray( p ) ? p[0] : p ;
  let towrite = data.header + '\n';
  let lines = Object.values( data.rows ).filter( v => v !== '' );
  towrite += lines.join( '\n' );
  fs.writeFileSync( fname, towrite, { encoding: 'utf8' } );
  mainWindow.webContents.send( 'file-name', fname );
}
function openFile( p ) {
  if ( !p ) return;
  fname = Array.isArray( p ) ? p[0] : p ;
  let d = ( fs.readFileSync( fname, { encoding: 'utf8' } ) ).split( '\n' );
  data.header = d.shift();
  data.rows = {};
  d.forEach( ( row, idx ) => data.rows[ idx ] = row );
  mainWindow.webContents.send( 'new-data', data );
  mainWindow.webContents.send( 'file-name', fname );
}
function saveRecord( d, id ) {
  if ( id ) data.rows[ id ] = d;
  else data.rows[ Math.random() ] = d;
  saveFile( fname );
  mainWindow.webContents.send( 'new-data', data );
}
function deleteRecord( id ) {
  delete data.rows[ id ];
  saveFile( fname );
  mainWindow.webContents.send( 'new-data', data );
}

app.on( 'ready', createWindow );
app.on( 'window-all-closed', function () {
  app.quit();
});
app.on( 'activate', function () {
  if ( mainWindow === null ) {
    createWindow()
  }
});

ipcMain.on( 'data-change', onDataChange );
// ipcMain.on( 'did-finish-load', ( e ) => {
//   e.sender.send( 'new-data', data );
// });
ipcMain.on( 'open-editor', ( e, d ) => {
  createEditorWindow( d );
});
ipcMain.on( 'close-editor', () => {
  editWindow.close(); 
  mainWindow.webContents.send( 'new-data', data );
});
ipcMain.on( 'save-record', ( e, d, id ) => { 
  saveRecord( d, id );
  editWindow.close();
});
ipcMain.on( 'delete-record', ( e, id ) => {
  deleteRecord( id );
  editWindow.close();
});


