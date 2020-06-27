
export default function beep(length = 250, onFinish = () => null, options = {sound: true, vibrate: true}) {
    var AudioContext = window.hasOwnProperty("AudioContext") && window.AudioContext || window.webkitAudioContext || null;
    if (AudioContext) {
        const ctx = new AudioContext();
        options.vibrate && window && window.navigator && window.navigator.vibrate && window.navigator.vibrate(length);
        if (options.sound) {
            let oscillators = [new Oscil("triangle", 300, ctx), new Oscil("sawtooth", 200, ctx), new Oscil("square", 400, ctx)];
            oscillators.forEach(o => {
                o.oscillator.start(0);
                o.oscillator.stop(ctx.currentTime + length);
            });
        }
        setTimeout(() => {
            ctx.close();
            options.vibrate && window && window.navigator && window.navigator.vibrate && window.navigator.vibrate(0);
            onFinish();
        }, length);
    }
    else {
        onFinish();
    }
}

function Oscil(type, freq, context) {
    this.oscillator = context.createOscillator();
    this.oscillator.type = type;
    this.oscillator.frequency.value = freq;
    const gainNode = context.createGain();
    this.oscillator.connect(gainNode);
    gainNode.connect(context.destination);
}