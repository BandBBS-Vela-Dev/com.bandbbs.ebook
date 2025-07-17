import interconn from './interconn.js';
//握握手，握握双手
const type = "__hs__"
const TIMEOUT = 3000;

export default class InterHandshake extends interconn {
    /** @type {Promise<void>} */
    promise = null;
    /** @type {(value: void | PromiseLike<void>) => void} */
    resolve = null;
    timeout = null;
    constructor() {
        super();
        this.conn.onmessage = ({ data }) => {
            clearTimeout(this.timeout);
            this.timeout = setTimeout(() => this.promise = this.resolve = null, TIMEOUT);
            const { tag, ...payload } = JSON.parse(data);
            this.callbacks[tag](payload);
        }
        this.addListener(type, ({ count }) => {
            if (count > 0) {
                if (this.promise) this.resolve(this.resolve = null)
                else {
                    this.promise = Promise.resolve()
                    this.callback()
                }
            }
            if (count++ < 2) super.send(type, { count });
        })
        this.addEventListener((e) => {
            if (e !== "open") {
                this.resolve = null;
                this.promise = Promise.reject(new Error("connection closed"));
                clearTimeout(this.timeout);
                return
            }
            this.promise = this._newPromise()
        })
    }
    async send(...args) {
        if (this.promise) await this.promise;
        else await (this.promise = this._newPromise())
        return await super.send(...args)
    }
    setHandshakeListener(callback) {
        this.callback= callback
    }
    callback = () => { }
    get connected() { return this.promise !== null }
    _newPromise() {
        return new Promise(( resolve, reject ) => {
            const timeout = setTimeout(() => {
                reject(new Error("timeout"));
                this.promise = this.resolve = null;
            }, TIMEOUT)
            this.resolve = () => {
                resolve()
                clearTimeout(timeout)
            }
            super.send(type, { count: 0 })
        })
    }
}
