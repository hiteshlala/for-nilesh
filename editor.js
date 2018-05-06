const ipcRenderer = require( 'electron' ).ipcRenderer;

window.addEventListener( 'load', ()=>ipcRenderer.send( 'editor-load') );

ipcRenderer.on( 'data', ( e, d, id ) => { 
  editingdata = d.split(';');
  selectrecord = id;
  populateEdit();
});

let short = document.getElementById( 'short' );
let first = document.getElementById( 'first' );
let last = document.getElementById( 'last' );
let email = document.getElementById( 'email' );
let company = document.getElementById( 'company' );

let editingdata = [ '', '', '', '', '' ];
let selectrecord = undefined;

function populateEdit() {
  short.value = editingdata[ 0 ]; 
  first.value = editingdata[ 1 ]; 
  last.value = editingdata[ 2 ];
  email.value = editingdata[ 3 ];
  company.value = editingdata[ 4 ];
}
function updatethis( elem, id ) {
  editingdata[ id ] = elem.value;
}
function saveRecord() {
  ipcRenderer.send( 'save-record', editingdata.join(';'), selectrecord );
}
function cancel() {
  ipcRenderer.send( 'close-editor' );
}
function deleteRecord() {
  if ( selectrecord )
    ipcRenderer.send( 'delete-record', selectrecord );
  else 
    ipcRenderer.send( 'close-editor' );
}

window['deleteRecord'] = deleteRecord;
window['saveRecord'] = saveRecord;
window['cancel'] = cancel;
window['updatethis'] = updatethis;
