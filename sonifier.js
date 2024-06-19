/**
 * sonifier module.
 * @module @fizz/sonifier
 */

/**
 * Voice synthesizer that speaks given text strings.
 */
export class sonifier {
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

    this.isSonification = false;
    this.activeSonificationFrequency = null;
    
    this.sdMax = false;
    
    this.init();
  }


  /**
   * Initializes class.
   */
  async init() {
    this.audioContext = new AudioContext(); // audio setup put here so user touch happens before audio, backup in case more user interaction required
    this.oscillator = this.audioContext.createOscillator();
    this.gain = this.audioContext.createGain();
    this.oscillator.frequency.value = 200;
    this.oscillator.type = 'sine';
    this.gain.value = 0;
    this.gain.connect(this.audioContext.destination);
    this.oscillator.connect(this.gain);
    // finish audio setup

    this.primaryGainControl = this.audioContext.createGain();
    this.primaryGainControl.gain.setValueAtTime(0.1, 0);
    this.primaryGainControl.connect(this.audioContext.destination);
  }


  /**
   * Toggles sonification mode off or on. Initial state is off.
   * @param {Boolean} isOn An optional explicit value for sonification state.
   */
  toggleSonification(isOn) {
    console.log('toggleSonification');

    if (isOn === undefined || (isOn !== true && isOn !== false)) {
      this.isSonification = this.isSonification ? false : true;
    } else {
      this.isSonification = isOn;
    }

    // TODO: fix bug when sonification mode is toggled off and on rapidly, which deactivates the active frequency
    if ( !this.isSonification ) {
      this.releaseNote( true );
    } else if ( this.activeSonificationFrequency ) {
      this.startNote(this.activeSonificationFrequency);
    }
    //  if ( this.isSonification && this.activeSonificationFrequency ) {
    //   this.startNote(this.activeSonificationFrequency);
    // } else {
    //   this.releaseNote( true );
    // }

    console.log(`Sonification mode is ${this.isSonification ? 'on' : 'off'}`);
    return this.isSonification;
  }



  /**
   * Plays a warning tone.
   */
  startWarning() {
    // console.log('startWarning');
    if (this.isSonification) {
      this.beep( 40, 10, 200 );

      // TODO: play a lower warning hum until they move their finger off the border?
    }
  }

  /**
   * Ends the continual warning tone.
   */
  endWarning() {
    // this.oscillator.stop(0);
    // this.oscillator.disconnect(this.gain);
    // console.log('endWarning');
  }


  /**
   * Emit a beep sound.
   * @param {number} frequency The frequency of the beep sound.
   * @param {number} volume The volume of the beep sound.
   * @param {number} duration The duration of the beep sound in milliseconds.
   */
  beep(frequency = 440, volume = 100, duration = 200) {
    // create a new oscillator, since you can apparently only start an oscillator once
    // TODO: see if we can just disconnect and reconnect the oscillator, per https://stackoverflow.com/questions/60805252/web-audio-api-why-can-you-only-start-sources-once
    this.oscillator = this.audioContext.createOscillator();
    this.oscillator.connect(this.gain);
        
    // Set the oscillator frequency in hertz
    this.oscillator.frequency.value = frequency;

    // Set the type of oscillator
    this.oscillator.type = 'square';

    // Set the gain to the volume
    this.gain.value = volume * 0.01;

    // Start audio with the duration
    this.oscillator.start(this.audioContext.currentTime);
    this.oscillator.stop(this.audioContext.currentTime + duration * 0.001);

    // Do something when the sound is finished
    this.oscillator.onended = () => {
      // this.oscillator.disconnect(this.gain);
      console.log('beep done');
    };
  }


  /**
 * Plays a frequency with a square oscillator and an ADSR envelope and vibrato.
 */
  startNote(frequency = 196.00) {
    if (!this.isSonification) {
      // note active sonification frequency, in case isSonification is triggered to active while over a shape
      this.activeSonificationFrequency = frequency;
    } else {
      this.now = this.audioContext.currentTime;
      this.noteOscillator = this.audioContext.createOscillator();
      this.noteOscillator.type = 'square';
      this.noteOscillator.frequency.setValueAtTime(frequency, this.now);

      const vibrato = this.audioContext.createOscillator();
      vibrato.frequency.value = 10; // 10 Hz
      const vibratoGain = this.audioContext.createGain();
      vibratoGain.gain.value = 0.5;
      vibrato.connect(vibratoGain);
      vibratoGain.connect(this.noteOscillator.frequency);
      vibrato.start();

      const attackTime = 0.2;
      const decayTime = 0.3;
      const sustainLevel = 0.7;
      const releaseTime = 0.2;
      this.duration = 10;
      this.noteGain = this.audioContext.createGain();
      this.noteGain.gain.setValueAtTime(0, 0);
      this.noteGain.gain.linearRampToValueAtTime(1, this.now + attackTime);
      this.noteGain.gain.linearRampToValueAtTime(
        sustainLevel,
        this.now + attackTime + decayTime
      );
      this.noteGain.gain.setValueAtTime(sustainLevel, this.now + this.duration - releaseTime);
      // this.noteGain.gain.linearRampToValueAtTime(0, this.now + duration);

      this.noteOscillator.start();
      // this.noteOscillator.stop(this.now + 1);
      this.noteOscillator.connect(this.noteGain);
      this.noteGain.connect(this.primaryGainControl);
    }
  }

  /**
   * Plays a frequency with a square oscillator and an ADSR envelope and vibrato.
   */
  releaseNote(isPause = false) {
    // console.log('releaseNote');

    if (!isPause) {
      // remove active sonification frequency
      this.activeSonificationFrequency = null;
    }

    if (this.noteGain && this.noteGain.gain && this.noteOscillator){
      this.noteGain.gain.linearRampToValueAtTime(0, this.now + this.duration);
      this.noteOscillator.stop(this.now + 1);
    }
  }

/**
 * from: `iveo4Universal.js`
 */


onFileOpen() {
  if (!!svg1.dataset.iveosdmax) {
    sdMax = svg1.dataset.iveosdmax; // sd is sonification data, given as attributes of objects. If not normalized, sdMax attribute in <svg> is normalization
  } else {
    sdMax = false;
  }
}

/**
 * Gets sonification details
 * @param {string} textStr The string to be spoken.
 */
sonificationDetails() {
  sonificationOn = false;
  if (!!svg1.dataset.iveosdmax) {
    sdMax = svg1.dataset.iveosdmax; // sd is sonification data, given as attributes of objects. If not normalized, sdMax attribute in <svg> is normalization
  } else {
    sdMax = false;
  }
}

// Touch start comes here, primary if no other finger is down, otherwise classified as secondary
// sets holdX, holdY as the touch point, starts a new timeStack if longer than a couple click time since last event
pointerstart(e) {
  e.preventDefault();

  if (e.isPrimary) {
    var pointerId = "pStart" + e.pointerType + "#" + e.pointerId;
  } else {
    pointerId = "sStart" + e.pointerType + "#" + e.pointerId;
  }

  holdX = e.clientX;
  holdY = e.clientY;

  e.stopPropagation;
  clearTimeout(singleTimeout);

  var theT = new Date().getTime();
  holdTarg = document.elementFromPoint(holdX, holdY);

  if (timeStack.length == 2
    && timeStack[timeStack.length - 1] + fp["timingData"]["double_click_seperation"] > theT) {
    timeStack.push(theT);
  } else {
    timeStack = [theT]
  }

  if (!sonificationOn) {
    singleTimeout = setTimeout(() => {
      processTap("hold");
    },
      fp["timingData"]["long_hold_delay"]);
  }
} // end pointerStart


// raising finger causes pointer end event that comes here. Adds a time to timeStack and detects single, double, lolng short and long long clicks
pointerend(e) {
  e.preventDefault();

  if (e.isPrimary) {
    var pointerId = "pStop" + e.pointerType + "#" + e.pointerId;
  } else {
    pointerId = "sStop" + e.pointerType + "#" + e.pointerId;
  }

  e.stopPropagation;

  var sl = appStack.length - 1;
  var clickDelay = fp["timingData"]["single_click_max"];
  var doubleClickDelay = fp["timingData"]["double_click_seperation"]
  var theT = new Date().getTime();
  timeStack.push(theT);

  // speakIt(timeStack[1]-timeStack[0]);
  clearTimeout(singleTimeout);

  // turns off sound but delays to be sure move is finished
  if (!!sonificationOn && gain.gain.value > 0) {
    setTimeout(function () { gain.gain.value = 0 }, clickDelay / 2);
  }

  if (timeStack.length == 2 && timeStack[1] - timeStack[0] < clickDelay) {
    doubleTimeout = setTimeout(function () {
      if (!!sonificationOn) {
        return processTap("delayedSonificationTap");
      } else {
        return processTap("delayedTap");
      }
    }, doubleClickDelay);

    if (!!sonificationOn) {
      return processTap("sonificationTap");
    } else {
      return processTap("tap");
    }
    // end single taps
  } else if (timeStack.length == 4 && timeStack[1] - timeStack[0] < clickDelay && timeStack[3] - timeStack[2] < clickDelay && timeStack[2] - timeStack[0] < doubleClickDelay) {
    clearTimeout(doubleTimeout);
    if (!!sonificationOn) {
      return processTap("sonificationDoubleTap");
    } else {
      return processTap("doubleTap");
    }
  } // end doubleTap
} // end pointerend



// moving a finger causes this event to happen if move is enabled
pointermove(e) {
  e.preventDefault();

  if (e.isPrimary) {
    pointerId = "pMove" + e.pointerType + "#" + e.pointerId;
  } else {
    pointerId = "sMove" + e.pointerType + "#" + e.pointerId;
  }

  var pX = Math.trunc(e.clientX);
  var pY = Math.trunc(e.clientY);

  e.stopPropagation;

  if (!!sonificationOn) {
    moveSonify(pX, pY);
  }
} // end pointerMove


processTap(dir, f) {
  var sl = appStack.length - 1;
  if (sl >= 0 && (appStack[sl][1] == "touchReturn" || (!!f && f == "yes"))) {
    var ap = appStack[sl][0].split("_");
    //if (dir != "tap") prompt("ap", ap+"; "+dir);
    //return
    var theRet = "";
    if (ap[0] == "local") {
      theRet = doLocal[ap[1]](dir);
    } else if (ap[0] == "uni") {
      theRet = doUni[ap[1]](dir);
    }

    if (!!theRet) {
      processTap(theRet, "yes");
    }
  } else {
    return clickLocal(dir);
  }
} // end processTap






/**
 * from: `iveo4Draw.js`
 */

clickLocal(dir) {
  if (["delayedTap", "delayedSonificationTap"].indexOf(dir) != -1) {
    var coord = [drawX(holdX), drawY(holdY)];
    if (standardTap()) {

    } else if (!!coord[0] && !!coord[1]) {
      return displayMsg(["", coord[0] + ", " + coord[1], "1"]);
    } else if (!!coord) {
      speakBox(coord[0] + ", " + coord[1]);
    } else {
      playWav("correct1.wav");
    }
  }
  else if (dir == "doubleTap" || dir == "sonificationDoubleTap") {
    if (!!standardDoubleTap()) {

    } else if (!!holdTarg && !!holdTarg.getAttribute("title") && holdTarg.getAttribute("id").split("_").length == 2) {
      selectedShapeId = holdTarg.getAttribute("id");
      displayMsg(["", holdTarg.getAttribute("title") + " is selected", "1"]);
    }
  }
} // end clickLocal;


moveSonify(theX, theY) {
  theMoveTarg = document.elementFromPoint(theX, theY);
  if (!theMoveTarg || !theMoveTarg.dataset.iveofrequency) {
    gain.gain.value = 0;
    lastTargTitle = "";
    return;
  } else if (!!theMoveTarg && !!theMoveTarg.dataset.iveofrequency) {
    osc.frequency.value = theMoveTarg.dataset.iveofrequency;
    gain.gain.value = .2;
    if (!!theMoveTarg.getAttribute("title") && theMoveTarg.getAttribute("title") != lastTargTitle) {
      lastTargTitle = theMoveTarg.getAttribute("title");
      //singleClickLocal("tapSonification");
      speakBox(theMoveTarg.getAttribute("title"));
    }
  }
} // ennd moveSonify;

}
