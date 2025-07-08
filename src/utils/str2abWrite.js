export default function str2abWrite(str) {
    let array = new Uint16Array(str.length);
    for (let i = 0; i < str.length; i++) {
        array[i] = str.charCodeAt(i);
    }
    return new Uint8Array(array.buffer);
}