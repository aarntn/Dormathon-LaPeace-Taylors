export class Alarm {
  private context?:AudioContext;
  private oscillator?:OscillatorNode;
  private gain?:GainNode;
  private pulse?:ReturnType<typeof setInterval>;
  private voice?:AudioBufferSourceNode;
  private voices=new Map<string,AudioBuffer>();
  async unlock() {
    if(!this.context || this.context.state==='closed')this.context=new AudioContext();
    await this.context.resume();
    if(this.context.state!=='running')throw new Error('Tap Start to enable alarm audio');
  }
  start() {
    if(this.oscillator)return;
    const context=this.context;
    if(!context || context.state!=='running')throw new Error('Alarm audio is suspended. Tap Enable sound.');
    this.stopVoice();if('speechSynthesis' in window)speechSynthesis.cancel();
    this.oscillator=context.createOscillator();this.gain=context.createGain();
    this.oscillator.type='square';this.oscillator.frequency.value=880;
    this.gain.gain.value=.35;this.oscillator.connect(this.gain);this.gain.connect(context.destination);this.oscillator.start();
    const pulse=()=>{if(!this.context || !this.oscillator || !this.gain)return;const t=this.context.currentTime;this.gain.gain.cancelScheduledValues(t);this.gain.gain.setValueAtTime(.35,t);this.gain.gain.setValueAtTime(0,t+.3);this.gain.gain.setValueAtTime(.35,t+.5);this.oscillator.frequency.setValueAtTime(880,t);this.oscillator.frequency.setValueAtTime(1320,t+.5);navigator.vibrate?.([300,150,300]);};
    pulse();this.pulse=setInterval(pulse,1000);
  }
  stop() {clearInterval(this.pulse);this.pulse=undefined;this.oscillator?.stop();this.oscillator?.disconnect();this.gain?.disconnect();this.oscillator=undefined;this.gain=undefined;navigator.vibrate?.(0);}
  async preloadVoices(){const context=this.context;if(!context)throw new Error('Audio context unavailable');await Promise.all(['tired','lost'].map(async name=>{const response=await fetch('/eyewatch/voice/'+name+'.wav');if(!response.ok)throw new Error('Local voice file unavailable');const buffer=await context.decodeAudioData(await response.arrayBuffer());this.voices.set(name,buffer);}));}
  speak(name:'tired'|'lost'){const buffer=this.voices.get(name);if(!buffer || !this.context || this.context.state!=='running')return false;this.stopVoice();this.voice=this.context.createBufferSource();this.voice.buffer=buffer;this.voice.connect(this.context.destination);this.voice.start();return true;}
  private stopVoice(){this.voice?.stop();this.voice?.disconnect();this.voice=undefined;}
  dispose() {this.stop();this.stopVoice();const context=this.context;this.context=undefined;void context?.close().catch(()=>{});}
  get ready(){return this.context?.state==='running';}
}

export function speakLocal(text:string) {
  if(!('speechSynthesis' in window))return false;
  const voices=speechSynthesis.getVoices();
  const voice=voices.find(v=>v.localService && v.lang.startsWith('en'));
  if(!voice)return false;
  speechSynthesis.cancel();const message=new SpeechSynthesisUtterance(text);message.voice=voice;message.lang=voice.lang;speechSynthesis.speak(message);return true;
}
