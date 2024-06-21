
const { ipcRenderer } = require('electron');
const parser = new DOMParser();
const jp = require('jsonpath');
import { speechSynth } from './speechSynth.js';
import { sonifier } from './sonifier.js';

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

    this._isJIMDoc = false;

    this._init();
  }

  
  /**
   * Initializes the module.
   * @private
   * @memberOf module:@fizz/rendererClass
   */
  _init() {
    this.speaker = new speechSynth();
    this.sonifier = new sonifier();

    this.canvasContainer = document.getElementById('canvas_container');
    this.canvasContainer.addEventListener('pointerout', this._touchEdge.bind(this));

    this.canvasContainer.addEventListener('pointerdown', this._handleStart.bind(this), false);
    this.canvasContainer.addEventListener('pointerup', this._handleEnd.bind(this), false);
    this.canvasContainer.addEventListener('pointercancel', this._handleCancel.bind(this), false);
    this.canvasContainer.addEventListener('pointermove', this._handleMove.bind(this), false);

    this.canvasContainer.addEventListener('click', this._describeElement.bind(this));
    this.canvasContainer.addEventListener('dblclick', this._doubleClick.bind(this));

    document.documentElement.addEventListener('keydown', this._keyHandler.bind(this));

    this.contentDocument = this.canvasContainer.firstElementChild;
    // window.addEventListener('click', (event) => {
    //   console.log('render:', event.type);
    // });

    this.initializeContentDocument();


    // TEMP
    this._initSpeech();  
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

      this.dataModel = new Map();
      await this._processJIM();

      // this._readDocumentTitle();
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
    console.log('_processJIM::this.contentDoc.el', this.contentDoc.el);   
    // const metadataElement = this.contentDocument.querySelector('metadata[data-type="text/jim+json"]');
    const metadataElement = this.contentDocument.querySelector('metadata[data-type="text/jim+json"]');
    const jimStr = metadataElement ? metadataElement.textContent : null;
    if (!jimStr) {
      console.warn('No JSON Image Metadata found');
    } else {
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
            
            const elList = this.contentDocument.querySelectorAll(domSelector);
            console.log('elList', typeof elList, elList)
            // console.log('elRes type', typeof elRes)
            elList.forEach(el => {
              console.log('el type', typeof el)

              // const el = this.contentDocument.querySelector(domSelector);
              let jsonItem = this._getJSONPath(jimObj, jsonpathSelector);
  
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
            });
          }
        }
      }
      console.log('this.dataModel', this.dataModel)
    }
    this._isJIMDoc = this.dataModel.size ? true : false;
  }



  /**
   * .
   * @param {Event} event The event on the element.
   * @private
   * @memberOf module:@fizz/touchUI
   */
  _getJSONPath(jimObj, jsonpathSelector) {
    let jsonItem = null;
    if (jsonpathSelector.constructor === Array) {
      if (jsonpathSelector.length === 1) {
        jsonItem = jp.query(jimObj, jsonpathSelector[0]);
      } else {
        jsonItem = [];
        jsonpathSelector.forEach(item => {
          // console.log('item', item)
          const jpRes = jp.query(jimObj, item);
          jsonItem.push((jpRes.length === 1) ? jpRes[0] : jpRes);    
        });
        // console.log('jsonItem', jsonItem)
      }
    } else {
      jsonItem = jp.query(jimObj, jsonpathSelector);
    }

    return jsonItem;
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
   * @memberOf module:@fizz/renderer
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
   * @memberOf module:@fizz/renderer
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
   * @memberOf module:@fizz/renderer
   */
  // _invokeSpeech(utterance, lang) {
  //   this.speaker.setUtterance( utterance, lang );
  //   this.speaker.speak();
  // }




  /**
   * Handles interaction with border edge.
   * @param {Event} event The event on the element.
   * @private
   * @memberOf module:@fizz/touchUI
   */
  _touchEdge(event) {
    const target = event.target;
    const relatedTarget = event.relatedTarget;
    if (relatedTarget === this.canvasContainer) {
      // play a warning beep
      this.sonifier.startWarning();
    } else if (target === this.canvasContainer) {
      this.sonifier.endWarning();
      // console.log('End Warning');
    } 
  }


  /**
   * Handles keyboard input.
   * @param {Event} event The event on the element.
   * @private
   * @memberOf module:@fizz/touchUI
   */
  _keyHandler(event) {
    const key = event.key;
    switch (key) {
      case 'Escape':
        this.speaker.shutUp();
        this.sonifier.releaseNote(true);
        break;
      default:
        // TODO: add default behavior
    }
  }

  /**
   * Records pointer event info.
   * @param {Event} event The event on the element.
   * @private
   * @memberOf module:@fizz/renderer
   */
  _registerPointerEvent(event) {
    return { id: event.pointerId, x: event.clientX, y: event.clientY };
  }

  /**
   * Starts pointer events.
   * @param {Event} event The event on the element.
   * @private
   * @memberOf module:@fizz/renderer
   */
  _handleStart(event) {
    // Note: `_handleStart` is not currently used, but will be when we add drawing
    const touch = this._registerPointerEvent(event);

    // Note: `this.touchArray` is not currently used, but will be when we add drawing
    this.touchArray.push(touch);
    // console.log('pointerdown. id:', touch.id);
  }

  /**
   * Ends pointer events.
   * @param {Event} event The event on the element.
   * @private
   * @memberOf module:@fizz/renderer
   */
  _handleEnd(event) {
    // Note: `_handleEnd` is not currently used, but will be when we add drawing
    // console.log('_handleEnd');
    this._handleCancel(event);
  }

  /**
   * Cancels pointer events.
   * @param {Event} event The event on the element.
   * @private
   * @memberOf module:@fizz/renderer
   */
  _handleCancel(event) {
    // Note: `_handleCancel` is not currently used, but will be when we add drawing
    // console.log('_handleCancel');
    const id = event.pointerId
    const index = this.touchArray.findIndex( (item) => item.id === id );
    if (index >= 0) {
      this.touchArray.splice(index, 1);
    } else {
      // console.log(`event '${id}' not found`);
    }
  }

  /**
   * Reads element labels and default settings, and triggers speech.
   * @param {Event} event The event on the element.
   * @private
   * @memberOf module:@fizz/renderer
   */
   _handleMove(event) {
    const target = event.target;
    // To avoid "implicit pointer capture", where the event listener element prevents the event target 
    // from changing to a another element, even a child element, se must explicitly release the pointer
    //  after every `pointermove` event handling
    target.releasePointerCapture(event.pointerId);


    if (target === this.canvasContainer || target === this.canvasContainer.firstElementChild) {
      this.currentTarget = null;
      // handle sonification
      this.sonifier.releaseNote();

      // console.log('_handleMove canvasContainer', event);

    } else if (target === this.currentTarget) {
      // console.log('_handleMove currentTarget', event);

    } else if (target !== this.currentTarget) {
      this.currentTarget = target;

      // console.log('_handleMove not currentTarget', event);

      // handle sonification
      // end previous sonification
      this.sonifier.releaseNote();
      // start new sonification
      this.sonifier.startNote();

      const utteranceArray = [];

      const label = this._getAccessibleName( target );
      if (label) {
        utteranceArray.push(label);
      }

      if (this.selectedElements.includes(target)) {
        utteranceArray.push('Selected');
      }

      this._outputUtterance(utteranceArray, this.contentDoc.lang);  
      
     // Note: the following block is not currently used, but will be when we add drawing
      // track and update touches
      const id = event.pointerId
      const index = this.touchArray.findIndex( (item) => item.id === id );
      if (index >= 0) {
        const priorTouch = this.touchArray[index]; 
        const touch = this._registerPointerEvent(event);

        // console.group(`touch: ${priorTouch.id}`)
        // console.log(`move from ${priorTouch.x}, ${priorTouch.y}`);
        // console.log(`move to ${touch.x}, ${touch.y}`);
        // console.groupEnd();

        this.touchArray[index] = touch;

        // console.log('this.touchArray', this.touchArray);
      }
    }
  }

  /**
   * .
   * @param {Event} event The event on the element.
   * @private
   * @memberOf module:@fizz/renderer
   */
  _updateTouchArray(event) {
    // console.groupCollapsed('updateTouch', event.pointerId);
    // console.log(event);
    // console.groupEnd();

    // Note: the following block is not currently used, but will be when we add drawing
    // track and update touches
    const id = event.pointerId
    const index = this.touchArray.findIndex( (item) => item.id === id );
    // console.log(index);

    if (index >= 0) {
      const priorTouch = this.touchArray[index]; 
      const touch = this._registerPointerEvent(event);

      // console.group(`touch: ${priorTouch.id}`)
      // console.log(`move from ${priorTouch.x}, ${priorTouch.y}`);
      // console.log(`move to ${touch.x}, ${touch.y}`);
      // console.groupEnd();

      this.touchArray[index] = touch;

      this.coords = this.localCoords(event, this.backdrop, this.contentDoc.el);


      // console.log('this.touchArray', this.touchArray);
    }
  }

  /**
   * Reads element labels and default settings, and triggers speech.
   * @param {Event} event The event on the element.
   * @private
   * @memberOf module:@fizz/renderer
   */
  _describeElement(event) {
    const target = event.target;
    
    if (event.detail < 2) {
      // not a double click, so do normal behavior
      if (target === this.canvasContainer || target === this.canvasContainer.firstElementChild) {
        this.speaker.shutUp();
      } else {
        const utteranceArray = [];
  
        const desc = this._composeDescription(target);
        utteranceArray.push(desc);
  
        this._outputUtterance(utteranceArray);  
      }
    }
  }

  /**
   * Double click handler.
   * @param {Event} event The event on the element.
   * @private
   * @memberOf module:@fizz/touchUI
   */
   _doubleClick(event) {
    const target = event.target;
    event.preventDefault();

    // console.log('double click');
    if (target === this.canvasContainer || target === this.canvasContainer.firstElementChild) {
      this._selectElement();
      
      return;
    } else {
      let state = '';
      if (this.selectedElements.includes(target)) {
        // if already selected, remove this element from selections
        this._deselectElement(target);
        state = 'Deselected'
      } else {
        this._selectElement(target, event.shiftKey);
        state = 'Selected'
      }

      const utteranceArray = [];
      const label = this._getAccessibleName(target);
      if (label) {
        utteranceArray.push(`${state}: ${label}`);
      }  


      const descEl = target.querySelector('desc');
      console.log('descEl', descEl);
      const desc = descEl ? descEl.textContent : null;
      if (desc) {
        utteranceArray.push(desc);
      }


      // this._outputUtterance(utteranceArray); 
    }
  }

  /**
   * Set selected element and add a highlight box.
   * @param {Element} target The element to be selected; deselects if absent or `null`.
   * @private
   * @memberOf module:@fizz/touchUI
   */
   _selectElement(target, isAdd) {
    console.log('_selectElement');
    if (!target) {
      this._clearSelectedElements();
    } else {
      if (!isAdd) {
        this._clearSelectedElements();
      }  

      this.selectedElement = target;
      this.selectedElements.push(target);

      // highlight box
      const bbox = target.getBBox();

      let x = bbox.x;
      let y = bbox.y;

      // find any transforms on the element 
      // TODO: fix this hack
      const transforms = target.parentNode.getAttribute('transform');
      if (transforms) {
        // highlightBox.setAttribute('transform', transforms );
        // x += transforms.e;
        // y += transforms.f;
        let translate = transforms.split('translate(')[1].split(')')[0].split(',');
        x += parseFloat(translate[0]);
        y += parseFloat(translate[1]);
        // const transformMatrix = target.transform.baseVal.consolidate().matrix;

        // console.log('target.transform.baseVal.consolidate()', target.transform.baseVal.consolidate());
      }

      const highlightBox = document.createElementNS(this.svgns, 'rect');
      highlightBox.classList.add('_highlight_box');
      highlightBox.setAttribute('x', x - 2.5 );
      highlightBox.setAttribute('y', y - 2.5 );
      highlightBox.setAttribute('width', bbox.width + 5 );
      highlightBox.setAttribute('height', bbox.height + 5 );

      this.canvasContainer.firstElementChild.append(highlightBox);
  
      this.highlightBoxes.set(target, highlightBox);



    }
  }

  /**
   * Remove selected element and remove its highlight box.
   * @param {Element} target The element to be selected; deselects if absent or `null`.
   * @private
   * @memberOf module:@fizz/touchUI
   */
  _deselectElement(target) {
    if (target) {
      if (target === this.selectedElement) {
        this.selectedElement = null;
      }
      const index = this.selectedElements.indexOf(target);
      this.selectedElements.splice(index, 1);

      const highlightBox = this.highlightBoxes.get(target);
      highlightBox.remove();
      this.highlightBoxes.delete(target);
    }
  }

  /**
   * Deselect all elements.
   * @private
   * @memberOf module:@fizz/touchUI
   */
  _clearSelectedElements() {
    this.selectedElement = null;
    for (const target of this.selectedElements) {
      const highlightBox = this.highlightBoxes.get(target);
      highlightBox.remove();
    }
    this.selectedElements = [];
    this.highlightBoxes = new WeakMap();
  }

  /**
   * Returns list of descriptive phrases based on element type.
   * @param {Element} target The target element.
   * @private
   * @memberOf module:@fizz/renderer
   * @returns {string} Descriptive phases.
   */
  _composeDescription(target) {
    const utteranceArray = [];

    // const elementType = target.localName;

    // // console.log(elementType);

    // const elementSchema = this.elementSchema.shapes[target.localName];
    // if (this.isElementSchema && elementSchema) {
    //   // console.log(elementSchema);
    //   for (const attr in elementSchema.attributes) {
    //     let val = target.getAttribute(attr);
    //     val = val.replaceAll(/[,\s]/g, ', ');
    //     const phrase = `The ${elementSchema.attributes[attr].label} is ${val}.`;
    //     utteranceArray.push(phrase);
    //   }
    // } else {
    //   utteranceArray.push(`This is a ${elementType}.`);
    //   for (const attr of target.attributes) {
    //     // convert attribute name to upper case; screen readers seem to interpret 
    //     //   short uppercase strings as initialisms, while still reading long
    //     //   uppercase strings as words. (Lowercase "id" is read as "id", not "ID".)
    //     const phrase = `${attr.desc.toUpperCase()} is ${attr.value}.`;
    //     utteranceArray.push(phrase);
    //   }
    // }

    const descEl = target.querySelector('desc');
    const desc = descEl ? descEl.textContent : null;
    if (desc) {
      utteranceArray.push(desc);
    }

    return utteranceArray.join(' ');
  }


  /**
   * Resolves and routes output.
   * @param {Array} utteranceArray The array of speech items.
   * @private
   * @memberOf module:@fizz/renderer
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
        this.announceOutput.textContent = '';
        this.announceOutput.textContent = utterance;
      }
    }
  }


  /**
   * Reads element labels and default settings, and triggers speech.
   * @param {Array} utteranceArray The array of speech items.
   * @private
   * @memberOf module:@fizz/renderer
   */
  _invokeSpeech(utterance, lang) {
    this.speaker.setUtterance( utterance, lang );
    this.speaker.speak();
  }

  /**
   * Finds the best accessible name, by trying several different options.
   * @param {Element} target The target element.
   * @private
   * @memberOf module:@fizz/renderer
   */
  _getAccessibleName(target, isParent) {
    // console.log('renderer::_getAccessibleName')
    console.log('_getAccessibleName::target', target)
    
    let accessibleName = null;
    
    if (this._isJIMDoc) {
      accessibleName = this.dataModel.get(target);
      if (accessibleName && accessibleName.constructor === Array) {
        accessibleName = accessibleName.reduce((accumulator, item) => {
          return accumulator += `. '${item}'`;
        })
      }
    }
    
    // if no `JIM`, look for `aria-label` attribute
    if (!accessibleName) {
      accessibleName = target.getAttribute('aria-label');
    }

    // if no `aria-label`, look for `aria-labelledby` attribute and element
    if (!accessibleName) {
      let labelId = target.getAttribute('aria-labelledby');
      const labelEl = document.getElementById(labelId);
      accessibleName = labelEl ? labelEl.textContent : null;
    }    

    // if no `aria-label`, look for `title` element
    if (!accessibleName) {
      const titleEl = target.querySelector('title');
      accessibleName = titleEl ? titleEl.textContent : null;
    }

    // if no `aria-label`, look for `title` attribute
    if (!accessibleName) {
      accessibleName = target.getAttribute('title');
    }
    
    // if no `aria-label` or `title` element, and it's text, just use text content
    if (!accessibleName && (target.localName === 'text' || target.localName === 'tspan')) {
      accessibleName = target.textContent;
    }
    
    // if no `aria-label` or `title` element, just use element tag name
    if (!accessibleName && !this._isJIMDoc) {
      accessibleName = target.localName;
    }

    // if no accessible name try parent
    if (!accessibleName && !isParent) {
      accessibleName = this._getAccessibleName(target.parentElement, true);
    }

    console.log('accessibleName:', accessibleName);

    return accessibleName;
  }

}
