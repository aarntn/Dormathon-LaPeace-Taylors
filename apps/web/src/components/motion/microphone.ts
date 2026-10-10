/** RMS loudness from the current audio buffer. Nothing is recorded or uploaded. */
export function microphoneLevel(samples: Float32Array): number {
  if (!samples.length) return 0;
  let energy = 0;
  for (const sample of samples) energy += sample * sample;
  return Math.min(1, Math.sqrt(energy / samples.length) * 3);
}

type MeterDependencies = {
  createContext: () => AudioContext;
  requestFrame: typeof requestAnimationFrame;
  cancelFrame: typeof cancelAnimationFrame;
};

/** Owns only the analysis graph. The recorder owns and stops the input stream. */
export class MicrophoneMeter {
  private context?: AudioContext;
  private analyser?: AnalyserNode;
  private source?: MediaStreamAudioSourceNode;
  private frame?: number;
  private generation = 0;
  private deps: MeterDependencies;

  constructor(deps?: MeterDependencies) {
    this.deps = deps ?? {
      createContext: () => new AudioContext(),
      requestFrame: callback => requestAnimationFrame(callback),
      cancelFrame: id => cancelAnimationFrame(id),
    };
  }

  async start(stream: MediaStream, onLevel: (level: number) => void): Promise<boolean> {
    this.stop();
    if (!stream.getAudioTracks().some(track => track.readyState === 'live')) throw new Error('Microphone is not active');
    const generation = this.generation;
    try {
      const context = this.deps.createContext();
      this.context = context;
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      this.analyser = analyser;
      this.source = context.createMediaStreamSource(stream);
      // Deliberately never connect to the speakers: this cannot cause feedback.
      this.source.connect(analyser);
      if (context.state === 'suspended') await context.resume();
      if (generation !== this.generation) return false;
      const samples = new Float32Array(analyser.fftSize);
      const sample = () => {
        if (generation !== this.generation) return;
        analyser.getFloatTimeDomainData(samples);
        onLevel(microphoneLevel(samples));
        if (generation !== this.generation) return;
        this.frame = this.deps.requestFrame(sample);
      };
      this.frame = this.deps.requestFrame(sample);
      return true;
    } catch (error) {
      if (generation !== this.generation) return false;
      this.stop();
      throw error;
    }
  }

  stop() {
    this.generation++;
    if (this.frame !== undefined) this.deps.cancelFrame(this.frame);
    this.frame = undefined;
    this.source?.disconnect();
    this.analyser?.disconnect?.();
    this.source = undefined;
    this.analyser = undefined;
    const context = this.context;
    this.context = undefined;
    if (context) void context.close().catch(() => {});
  }
}
