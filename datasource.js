class DataSource {
    constructor() {
        this.freq = 250; // Hz
        this.raw = null;
        this.keys = [];
        this.timer = null;
        this.timeout = 20;// ms
        this.index = 0;
        this.maxLength = 0;
    }

    set data(data) {
        this.raw = data;
        this.keys = Object.keys(data);
        this.index = 0;
        this.maxLength = this.raw[this.keys[0]].length;
    }

    start() {
        if (this.timer != null || this.callback == null) {
            return;
        }

        this.timer = setInterval(() => {
            // compute 10 sec of data
            const len = 10 * this.freq;
            const points = [];

            const step = this.timeout / 1000 * this.freq;
            this.index = (this.index + step) % this.maxLength;

            for (let i = 0; i < this.keys.length; i++) {
                const key = this.keys[i];
                points.push(this.raw[key].slice(this.index, this.index + len));
            }

            this.callback(points, step);
        }, this.timeout)
    }

    stop() {
        if (this.timer == null) {
            return;
        }
        clearInterval(this.timer);
        this.timer = null;
    }

    onConnect(callback) {
        this.callback = callback;
    }

    onDisconnect() {
        this.callback = null;
    }

}
