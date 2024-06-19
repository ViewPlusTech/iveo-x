/**
 * speechSynth module.
 * @module @fizz/speechSynth
 */

/**
 * Voice synthesizer that speaks given text strings.
 */
 export class speechSynth {
  /**
   * Constructor
   * @constructor
   */
  constructor() {
    // class members
    this.synth = window.speechSynthesis;

    this.rate = 1;
    this.pitch = 1;
    this.utterance = null;

    this.voice = {}; // key: lang, value: voice

    this.init();
  }

  /**
   * Initializes class.
   */
  async init() {
    // this.setUtterance();
    // this.speak();
    // console.log('utterance', this.utterance);
  }

  /**
   * Speaks text string
   * @param {string} textStr The string to be spoken.
   */
  setUtterance(textStr = '', lang = 'en-US') {
    // console.log('setUtterance', textStr);
    // console.log('lang', lang);
    if (textStr !== '') {
      this.utterance = new SpeechSynthesisUtterance(textStr);
      this.utterance.voice = this.getLanguageVoice(lang);
      this.utterance.lang = lang;
    }
  }


  /**
   * Sets the closest voice option available for the BCP-47/IANA language tag.
   * @param {string} lang The language tag and subtag.
   */
  getLanguageVoice(lang = 'en-US') {
    // first see if we've already found a voice for this language code;
    //   if we have, return that, rather than looking for it each time
    let voice = this.voice[lang];
    if (!voice) {
      // console.log('lang', lang);
      const voices = this.synth.getVoices();
      // console.log('voices', voices);
      
      let langVoices = voices.filter( voice => voice.lang.startsWith(lang));
      // console.log('langVoices', langVoices);
      if (!langVoices.length) {
        const langTag = lang.split('-')[0];
        langVoices = voices.filter( voice => voice.lang.startsWith(langTag));
      }
  
      voice = langVoices[0];
      if (!voice) {
        // if no voice for the language tag, default to US English
        langVoices = voices.filter( voice => voice.lang.startsWith('en-US'));
        voice = langVoices[0];
      }
      // console.log('voice', voice);
    }
 
    return voice;
  }

  /**
   * Speaks text string
   */
  speak() {
    if (this.synth.speaking) {
      console.warn('warning: still speaking');
      this.synth.cancel();
      // return;
    }

    // console.log('utterance', this.utterance);
    if (this.utterance) {
      this.utterance.onend = (event) => {
        // console.log('SpeechSynthesisUtterance.onend');
        // this.synth.speak(new SpeechSynthesisUtterance('done!'));
        // this.utterance = null;
      };

      this.utterance.onerror = (event) => {
        console.error('error: SpeechSynthesisUtterance.onerror');
      };

      this.synth.speak(this.utterance);
    }
  }


  /**
   * Stops synth speaking
   */
  shutUp() {
    console.log('shutUp');
    if (this.synth.speaking) {
      console.warn('warning: still speaking');
      this.synth.cancel();
      // return;
    }
  }
}
