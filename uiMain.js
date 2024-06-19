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
    // this.xlinkns = 'http://www.w3.org/1999/xlink';

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
    this.canvasContainer.addEventListener('pointerout', this._touchEdge.bind(this));

    this.canvasContainer.addEventListener('pointerdown', this._handleStart.bind(this), false);
    this.canvasContainer.addEventListener('pointerup', this._handleEnd.bind(this), false);
    this.canvasContainer.addEventListener('pointercancel', this._handleCancel.bind(this), false);
    this.canvasContainer.addEventListener('pointermove', this._handleMove.bind(this), false);

    this.canvasContainer.addEventListener('click', this._describeElement.bind(this));
    this.canvasContainer.addEventListener('dblclick', this._doubleClick.bind(this));

    document.documentElement.addEventListener('keydown', this._keyHandler.bind(this));

    this.initializeContentDocument();

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
   initializeContentDocument() {
    // the loaded SVG content
    this.contentDoc.el = this.canvasContainer.firstElementChild;

    console.log('this.contentDoc.el', this.contentDoc.el);

    if (this.contentDoc.el && this.contentDoc.el.id !== 'blank_canvas') {
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
   * @memberOf module:@fizz/uiMain
   */
  _registerPointerEvent(event) {
    return { id: event.pointerId, x: event.clientX, y: event.clientY };
  }

  /**
   * Starts pointer events.
   * @param {Event} event The event on the element.
   * @private
   * @memberOf module:@fizz/uiMain
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
   * @memberOf module:@fizz/uiMain
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
   * @memberOf module:@fizz/uiMain
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
   * @memberOf module:@fizz/uiMain
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
   * @memberOf module:@fizz/uiMain
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
   * @memberOf module:@fizz/uiMain
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
   * @memberOf module:@fizz/uiMain
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
        this.announceOutput.textContent = '';
        this.announceOutput.textContent = utterance;
      }
    }
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

  /**
   * Finds the best accessible name, by trying several different options.
   * @param {Element} target The target element.
   * @private
   * @memberOf module:@fizz/uiMain
   */
  _getAccessibleName(target) {
    console.log('uiMain::_getAccessibleName')

    let accessibleName = target.getAttribute('aria-label');

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
    
    // if no `aria-label` or `title` element, just use element tag name
    if (!accessibleName) {
      accessibleName = target.localName;
    }

    return accessibleName;
  }

}
