const ipcRenderer = require( 'electron' ).ipcRenderer;
const remote = require( 'electron' ).remote;

let dataelem = document.getElementById( 'data' );
let fnameelem = document.getElementById( 'fname' );
let searchelem = document.getElementById( 'search' );

let data;

ipcRenderer.on( 'new-data', ( e, d ) => { 
  data = d;
  display( d );
  clearsearch();
});
ipcRenderer.on( 'file-name', ( e, name ) => {
  updatefname( name );
});

function updatefname( name ) {
  fnameelem.innerText = name;
}
function clearsearch() {
  searchelem.value = '';
}

function display( data ) {
  dataelem.innerText = '';
  let table = '<table>';
  table += '<tr>';
  let header = data.header.split( ';' );
  table += header.reduce( ( prev, curr ) => `${prev}<th>${curr}</th>`, '');
  table += '</tr>';
  for( const [ k, v ] of Object.entries( data.rows ) ) {
    let li = v.split( ';' );
    table += `<tr onClick="openEditor( this, ${k} )">`;
    li.forEach( l => {
      table += `<td>${l}</td>`;
    });
    table += '</tr>';
  }
  table += '</table>';
  dataelem.innerHTML = table;
}

function openEditor( elem, id ) {
  if ( elem ) elem.style.background = 'red';
  ipcRenderer.send( 'open-editor', id );
}

function filter( sel ) {
  let rg = RegExp( sel, 'i' );
  let selected = {};
  for( const [k, v] of Object.entries( data.rows ) ) {
    if ( rg.test( v ) ) selected[ k ] = v;
  }
  display({ header: data.header, rows: selected });
}

window[ 'openEditor' ] = openEditor;
window[ 'filter' ] = filter;
window.addEventListener( 'load', ()=>ipcRenderer.send( 'did-finish-load') );




