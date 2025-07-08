export default class XiaomiError extends Error {
    constructor(data, code) {
        super(`${code}:${data}`)
        this.data = data
        this.code = code
    }
}