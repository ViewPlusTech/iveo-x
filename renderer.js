
const { ipcRenderer } = require('electron');
const parser = new DOMParser();
const jp = require('jsonpath');
import { speechSynth } from './speechSynth.js';

let renderer = null;
window.addEventListener('load', () => {
  renderer = new rendererClass();
});


/**
 * Interprocess Communication
 */

ipcRenderer.on('renderer-event', (event, arg) => {
  // console.log(arg);
  event.sender.send('renderer-reply', `Received ${arg}`);

  switch ( arg ) {
  
    case 'toggle-dark-mode':
      canvas_container.classList.toggle('dark_mode');
      break;
  
    case 'save':
      const svgString = renderer.saveDocument();
      event.sender.send('save', svgString);
      break;
  }
});

ipcRenderer.on('load', (event, content) => {
  console.log('ipcRenderer', 'load');
  if (content) {
    const isReady = renderer.loadDocument(content);
    console.log('isReady', isReady);
    if (isReady) {
      // event.sender.send('document-load', content);
      console.log('renderer-event', event);

      // ipcRenderer.send('renderer-event', 'document-load');
      // const window = BrowserWindow.getFocusedWindow();
      // window.webContents.send('renderer-event', 'document-load');

      event.sender.send('document-load', content);

      console.log('ok?');
    }
  }
});

ipcRenderer.send('renderer-reply', 'Page Loaded');

ipcRenderer.on('load_id', (event, content) => {
  console.log('ipcRenderer', 'load_id');
  // if (content) {
  //   const isReady = renderer.loadDocument(content);
  //   console.log('isReady', isReady);
  //   if (isReady) {
  //     // event.sender.send('document-load', content);
  //     console.log('renderer-event', event);

  //     // ipcRenderer.send('renderer-event', 'document-load');
  //     // const window = BrowserWindow.getFocusedWindow();
  //     // window.webContents.send('renderer-event', 'document-load');

  //     event.sender.send('document-load', content);

  //     console.log('ok?');
  //   }
  // }
});

// async function documentLoader () {
//   await renderer.loadDocument(content);
//   return
// }

/**
 * Methods 
 */

export class rendererClass extends EventTarget {
  constructor() {
    super();

    this.canvasContainer = null;
    this.contentDocument = null;
    
    this._init();
  }

  
  /**
   * Initializes the module.
   * @private
   * @memberOf module:@fizz/rendererClass
   */
  _init() {

    this.canvasContainer = document.getElementById('canvas_container');
    this.contentDocument = this.canvasContainer.firstElementChild;
    // window.addEventListener('click', (event) => {
    //   console.log('render:', event.type);
    // });

    // TEMP
    this._initSpeech();  
  }

  saveDocument() {
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(this.canvasContainer.firstElementChild);
    // console.log(svgString);
    return svgString;
  }

  async loadDocument(content) {
    if (content) {
      console.log('loadDocument', true);
      this.contentDocument = this.sanitizeContent(content);
      this.canvasContainer.replaceChildren(this.contentDocument);

      this.dataModel = new WeakMap();
      await this._processJIM();

      this._readDocumentTitle();
      return true;
    } else {
      console.log('loadDocument', false);
      return false;
    }
  }



  dropHandler(event) {
    event.preventDefault();
  
    if (event.dataTransfer.items) {
      if (event.dataTransfer.items[0].kind === 'file') {
        var file = event.dataTransfer.items[0].getAsFile();
  
        if (file.type === 'image/xml+svg') {
          var reader = new FileReader();
          reader.onload = event => {
            // console.log(event.target.result);
            // TODO: append to DOM
          };
  
          reader.readAsText(file);
        }
      }
    }
  }

   

  sanitizeContent (content) {
    // NOTE: DOMParser doesn't seem to support parsing SVG with its own MIME type,
    // so we're parsing it as HTML and extracting it from the `body`
    // const rootElement = parser.parseFromString(content, 'image/svg+xml');
    const dom = parser.parseFromString(content, 'text/html');
    const rootElement = dom.body.querySelector('svg');

    // remove all script elements
    const scriptEls = rootElement.querySelectorAll('script');
    scriptEls.forEach( el => el.remove() );

    // TODO: consider removing or validating link targets
    const links = rootElement.querySelectorAll('[href]');
    if (links) {
      // console.log('links', links);
    }

    return rootElement;
  }


  insertDOMContent (el) {
    // TODO: put stuff here
    return;
  }




  /**
   * TODO: 
   * - Refactor into seprate module
   * - Get event messaging working
   */



  /**
   * TODO: 
   * - Refactor into seprate module
   * - Get event messaging working
   */


  /**
   * Reads the document title.
   * @param {Event} event The event on the element.
   * @private
   * @memberOf module:@fizz/touchUI
   */
  _initSpeech() {
    this.speaker = new speechSynth();
    this.prefs = {
      lang: 'en-US',
      darkmode: false,
      voicemode: false,
      sonification: false,
    };
    this.isSpeak = true;
  }


  /**
   * Processes JIM.
   * @param {Event} event The event on the element.
   * @private
   * @memberOf module:@fizz/touchUI
   */
  async _processJIM() {
    console.log('this.contentDocument', this.contentDocument);   
    // const metadataElement = this.contentDocument.querySelector('metadata[data-type="text/jim+json"]');
    const metadataElement = this.contentDocument.querySelector('metadata[data-type="text/jim+json"]');
    const jimStr = metadataElement.textContent;
    if (jimStr) {
      const jimObj = JSON.parse(jimStr);
      
      const selectorsRes = jp.query(jimObj, '$.selectors');
      const selectors = selectorsRes[0]; 
  
      // const dataModel = new WeakMap();    
      // wm1.set(o1, 37);
      // wm1.set(o2, "azerty");
      // wm1.get(o2); // "azerty"
      // wm1.has(o1); // true
      // wm1.delete(o1);
      // wm1.has(o1); // false
  
      if (selectors) {
        for (const domSelector in selectors) {
          if (Object.hasOwnProperty.call(selectors, domSelector)) {
            const jsonpathSelector = selectors[domSelector];
            
            const el = this.contentDocument.querySelector(domSelector);
            let jsonItem = null;
            if (jsonpathSelector.constructor === Array) {
              if (jsonpathSelector.length === 1) {
                jsonItem = jp.query(jimObj, jsonpathSelector[0]);
              } else {
                jsonItem = [];
                jsonpathSelector.forEach(item => {
                  console.log('item', item)
                  const jpRes = jp.query(jimObj, item);
                  jsonItem.push((jpRes.length === 1) ? jpRes[0] : jpRes);    
                });
                console.log('jsonItem', jsonItem)
              }
            } else {
              jsonItem = jp.query(jimObj, jsonpathSelector);
            }

            if (el && jsonItem && jsonItem.length) {
              jsonItem = (jsonItem.length === 1) ? jsonItem[0] : jsonItem;
              this.dataModel.set(el, jsonItem);
            } else {
              if (!el) {
                console.warn(`DOM Selector ${domSelector} not found`);
              }

              if (!jsonItem || !jsonItem.length) {
                console.warn(`JSONPath Selector ${jsonpathSelector} not found`);
              }
            }
          }
        }
      }
    }

    console.log('this.dataModel', this.dataModel)
  }


  /**
   * .
   * @param {Event} event The event on the element.
   * @private
   * @memberOf module:@fizz/touchUI
   */
  _getJSONPath() {
  }


  /**
   * Reads the document title.
   * @private
   * @memberOf module:@fizz/touchUI
   */
  _readDocumentTitle() {
    const utteranceArray = [];

    utteranceArray.push('Document Loaded');

    const titleEl = this.contentDocument.querySelector('#chart-title');
    const titleText = this.dataModel.get(titleEl);
    utteranceArray.push(titleText);

    // const title = this._getSelectorText('[data-title_level="0"]');
    // utteranceArray.push(title);

    // const desc = this._getSelectorText('[data-desc_level="0"]');
    // utteranceArray.push(desc);

    this._outputUtterance(utteranceArray, this.contentDocument.lang);
  }


  /**
   * Resolves and routes output.
   * @param {Array} utteranceArray The array of speech items.
   * @private
   * @memberOf module:@fizz/uiMain
   */
  _outputUtterance(utteranceArray, lang = this.prefs.lang) {
    if (utteranceArray.length) {
      const utterance = utteranceArray.join('. ');
      // console.log('utterance:', utterance);
  
      if (this.isSpeak) {
        // send to speech module
        this._invokeSpeech( utterance, lang );
      } else {
        // TODO: determine if we should set a lang attribute for braille region?

        // write to aria-live region
        // this.announceOutput.textContent = '';
        // this.announceOutput.textContent = utterance;
      }
    }
  }


  /**
   * Gets text content from query selector target.
   * @param {Array} utteranceArray The array of speech items.
   * @private
   * @memberOf module:@fizz/uiMain
   */
  _getSelectorText(selector) {
    const el = this.contentDocument.querySelector(selector);
    console.log(selector, el);
    const text = el ? el.textContent : null;
    return text;
  }

  /**
   * Reads element labels and default settings, and triggers speech.
   * @param {Array} utteranceArray The array of speech items.
   * @private
   * @memberOf module:@fizz/uiMain
   */
  _invokeSpeech(utterance, lang) {
    this.speaker.setUtterance( utterance, lang );
    this.speaker.speak();
  }

}


