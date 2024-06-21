const { ipcRenderer } = require('electron');
import { speechSynth } from './speechSynth.js';
import { sonifier } from './sonifier.js';
import { elementSchema } from './elementSchema.js';

let ui = null;

window.addEventListener('load', () => {
  ui = new uiMain();
});

// window.addEventListener('document-load', () => {
//   console.warn('document-load event');
//   ui.initializeContentDocument();
// });


ipcRenderer.on('renderer-event', (event, arg) => {
  console.log('hey! renderer-event', arg);
  event.sender.send('renderer-reply', `Received ${arg}`);

  switch ( arg ) {
  
    case 'toggle-self-voicing':
      ui.toggleSelfVoicing();
      break;
  
    case 'toggle-sonification':
      ui.toggleSonification();
      break;
  
    case 'toggle-dark-mode':

      // console.log('toggle-dark-mode : uiMain');

      ui.toggleDarkMode();
      break;
  
    case 'toggle-element-descriptions':
      ui.toggleSchemaDescription();
      break;
  
    case 'document-load':
      ui.initializeContentDocument();
      break;
  }
});

// ipcRenderer.on('document-load', (event, content) => {
//   // console.warn('UI reload!');
//   console.warn('Document loaded');
//   ui.initializeContentDocument();
// });

ipcRenderer.on('announce-message', (event, arg) => {
  ui._outputUtterance([arg]);
});


export class uiMain extends EventTarget {
  constructor() {
    super();

    // constants
    this.svgns = 'http://www.w3.org/2000/svg';

    this.speaker = null;
    this.sonifier = null;

    this.prefs = {
      lang: 'en-US',
      darkmode: false,
      voicemode: false,
      sonification: false,
    };

    this.canvasContainer = null;
    this.contentDoc = {
      el: null,
      viewbox: {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      },
      lang: 'en-US',
    };

    this.touchArray = [];
    this.currentTarget = null;

    this.selectedElement = null;
    this.selectedElements = [];
    this.highlightBoxes = new WeakMap();
    
    this.announceOutput = null;

    this.isSpeak = true;
    this.isSonification = true;
    this.isDarkMode = false;
    this.isElementSchema = true;

    this._init();
  }

  
  /**
   * Initializes the module.
   * @private
   * @memberOf module:@fizz/uiMain
   */
  _init() {
    this.speaker = new speechSynth();
    this.sonifier = new sonifier();

    const schema = new elementSchema;
    this.elementSchema = schema.getElementSchema();
    // console.log('elementSchema', this.elementSchema);
    
    this.canvasContainer = document.getElementById('canvas_container');

    // this.initializeContentDocument();

    this.announceOutput = document.getElementById('announce-output');
  }


  /**
   * Toggles self-voicing mode off or on. Initial state is on.
   * @param {Boolean} isOn An optional explicit value for sonification state.
   */
  toggleSelfVoicing() {
    this.isSpeak = this.isSpeak ? false : true;
    this._outputUtterance([`Self-voicing mode is ${this.isSpeak ? 'on' : 'off'}`]);  
  }

  /**
   * Toggles sonification mode off or on. Initial state is on.
   * @param {Boolean} isOn An optional explicit value for sonification state.
   */
  toggleSonification(isOn) {
    this.isSonification = this.sonifier.toggleSonification(isOn);
    this._outputUtterance([`Sonification mode is ${this.isSonification ? 'on' : 'off'}`]);  
  }


  /**
   * Toggles dark mode off or on. Initial state is off.
   * @param {Boolean} isOn An optional explicit value for sonification state.
   */
  toggleDarkMode() {
    this.isDarkMode = this.isDarkMode ? false : true;
    this._outputUtterance([`Dark mode is ${this.isDarkMode ? 'on' : 'off'}`]);  
  }


  /**
   * Toggles element schema description mode off or on. Initial state is on.
   * @param {Boolean} isOn An optional explicit value for sonification state.
   */
  toggleElementDescriptions() {
    this.isElementSchema = this.isElementSchema ? false : true;
    this._outputUtterance([`Element descriptions mode is ${this.isSpeak ? 'on' : 'off'}`]);  
  }


  /**
   * Initializes the loaded SVG content.
   * @param {Boolean} isOn An optional explicit value for sonification state.
   */
  async initializeContentDocument() {
    console.log('initializeContentDocument ok?')
    // the loaded SVG content
    this.contentDoc.el = this.canvasContainer.firstElementChild;

    console.log('this.contentDoc.el', this.contentDoc.el);

    // if (this.contentDoc.el && this.contentDoc.el.id !== 'blank_canvas') {
    if (this.contentDoc.el) {
      console.log('this.contentDoc.el loaded', this.contentDoc.el);

      const viewbox = this.contentDoc.el.getAttribute('viewBox');
      const contentDocWidth = this.contentDoc.el.getAttribute('width');
      const contentDocHeight = this.contentDoc.el.getAttribute('height');
      if (viewbox) {
        const viewboxArray = viewbox.split(/\s+/);
        this.contentDoc.viewbox = {
          x: viewboxArray[0],
          y: viewboxArray[1],
          width: viewboxArray[2],
          height: viewboxArray[3],
        }
      } else if (viewbox) {
        this.contentDoc.viewbox = {
          x: 0,
          y: 0,
          width: parseFloat(contentDocWidth),
          height: parseFloat(contentDocHeight),
        }
      }
  
      // get document language
      // TODO: make a more robust language mechanism to allow mixed-language documents
      const langEl = this.canvasContainer.querySelector('*[lang]');
      this.contentDoc.lang = langEl ? langEl.getAttribute('lang') : 'en-US';
      // default 'en' seems to be British?
      this.contentDoc.lang = (this.contentDoc.lang === 'en') ? 'en-US' : this.contentDoc.lang;
  
      // await this._processJIM();
      // this._readDocumentTitle();
    }
  }


  /**
   * Reads the document title.
   * @param {Event} event The event on the element.
   * @private
   * @memberOf module:@fizz/touchUI
   */
  _readDocumentTitle() {
    const doc = this.contentDoc.el;

    const utteranceArray = [];

    utteranceArray.push('Document Loaded');

    const titleEl = doc.querySelector('[data-title_level="0"]');
    console.log('titleEl', titleEl);
    const title = titleEl ? titleEl.textContent : null;
    if (title) {
      utteranceArray.push(title);
    }

    // const desc = this._getAccessibleName( target );
    // if (desc) {
    //   utteranceArray.push(desc);
    // }

    this._outputUtterance(utteranceArray, this.contentDoc.lang);
  }

}
