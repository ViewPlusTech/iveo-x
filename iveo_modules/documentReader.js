/**
 * documentReader module.
 * @module @fizz/documentReader
 */

/**
 * Voice synthesizer that speaks given text strings.
 */
export class documentReader {
  /**
   * Constructor
   * @constructor
   */
  constructor() {
    // class members
    this.audioContext = null;

    this.oscNum = null;
    this.oscillator = null;
    this.gain = null;
    this.oscFreqRange = [200, 1000];

    this.isDocumentReader = false;
    this.activeSonificationFrequency = null;
    
    this.sdMax = false;
    
    this.init();
  }


  /**
   * Initializes class.
   */
  async init() {

  }


  /**
   * Toggles sonification mode off or on. Initial state is off.
   * @param {Boolean} isOn An optional explicit value for sonification state.
   */
  toggleDocumentReader(isOn) {
    console.log('toggleSonification');

    if (isOn === undefined || (isOn !== true && isOn !== false)) {
      this.isDocumentReader = this.isDocumentReader ? false : true;
    } else {
      this.isDocumentReader = isOn;
    }


    console.log(`Document Reader mode is ${this.isDocumentReader ? 'on' : 'off'}`);
    return this.isDocumentReader;
  }



  /**
   * Reads the document title.
   */
  readTitle() {
    console.log('readTitle');
    if (this.isDocumentReader) {
      this.beep( 40, 10, 200 );

      // TODO: play a lower warning hum until they move their finger off the border?
    }
  }


}
