import interconnect from "@system.interconnect";

export default class interconn{
    callbacks = {};
    eventListeners = [];
    constructor() {
        this.conn = interconnect.instance();
        this.conn.onmessage = ({data}) => {
            const { tag, ...playload } = JSON.parse(data);
            this.callbacks[tag](playload);
        }
        this.conn.onclose = () => {
            this.eventListeners.forEach((callback) => callback("close"))
        }
        this.conn.onerror = () => {
            this.eventListeners.forEach((callback) => callback("error"))
        }
        this.conn.onopen = () => {
            this.eventListeners.forEach((callback) => callback("open"))
        }

    }
    /**
     * @param {string} tag
     * @param {Function} callback
     */
    addListener(tag, callback) {
        this.callbacks[tag] = callback;
    }
    removeListener(tag) {
        delete this.callbacks[tag];
    }
    addEventListener(callback) {
        return this.eventListeners.push(callback) - 1
    }
    removeEventListener(index) {
        this.eventListeners.splice(index, 1);
    }
    /**
     * @param {string} tag
     * @param {any} playload
     */
    send(tag, playload) {
        const data = typeof playload === 'object' ? { ...playload, tag } : { msg: playload, tag }
        return new Promise((resolve, reject) => {
            this.conn.send({
                data, success: resolve, fail: reject
            });
        })
    }
    get state() {
        return this.conn.getApkStatus()
    }
    register(module) {
        if (typeof module !== 'function') throw new Error('module must be a function');
        if (!module.__interconnModule__) throw new Error('module must be a interconnModule');
        return new module({
            send: (playload) => this.send(module.name, playload),
            addListener: (callback) => this.addListener(module.name, callback),
            conn: this.conn,
            removeListener: () => this.removeListener(module.name),
            setEventListener: (listener)=>this.addEventListener(listener),
        });
    }
}
export class interconnModule{
    static "__interconnModule__" = true;
}