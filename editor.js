const ipcRenderer = require( 'electron' ).ipcRenderer;

window.addEventListener( 'load', ()=>ipcRenderer.send( 'editor-load') );

ipcRenderer.on( 'data', ( e, d, id, headers ) => {
  headings = headers.split(';');
  if ( d ) { 
    editingdata = d.split(';');
    selectrecord = id;
  }
  else {
    headings.forEach( h => editingdata.push('') );
  }
  populateEdit();
});

let form = document.getElementById( 'form' );

let short = document.getElementById( 'short' );
let first = document.getElementById( 'first' );
let last = document.getElementById( 'last' );
let email = document.getElementById( 'email' );
let company = document.getElementById( 'company' );

let headings = [];
let editingdata = [];
let selectrecord = undefined;

function populateEdit() {
  let questions = '';
  headings.forEach( ( h, i ) => {
    questions += `<p>${h}: <input type="text" value="${editingdata[i]}" id="id-${h}" oninput="updatethis( this, ${i} )"></p>`;
  });
  form.innerHTML = questions;
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
