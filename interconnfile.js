import file from "@system.file";
import storage from '../common/storage.js';
import runAsyncFunc from "./runAsyncFunc";
import str2abWrite from "./str2abWrite";

export default class interconnfile {
    static "__interconnModule__" = true;
    static name = 'file';
    uri = 'internal://files/books/';
    packageCount = 0;
    totalpkg = 0;
    chunkSize = 1024 * 20;
    filename = ""
    constructor({ addListener, send, setEventListener }) {
        const onmessage = (data) => {
            const { stat, ...playload } = data;
            switch (stat) {
                case 'getUsage':
                    this.getUsage().then((usage) => {
                        this.send({ usage });
                    });
                    break;
                case "startTransfer":
                    this.chunkSize = playload.chunkSize || this.chunkSize;
                    this.startTransfer(playload.filename, playload.total);
                    break;
                case "d":
                    if (playload.setCount === "0" || playload.setCount === 0) {
                        runAsyncFunc(file.delete, { uri: this.currentFile });
                    }
                    if (playload.setCount) {
                        this.packageCount = playload.setCount;
                    }
                    this.save(playload);
                    break;
                case "cancel":
                    this.send({ type: "cancel" });
                    this.currentFile = null;
                    break;
            }
        }
        addListener(onmessage);
        this.send = send;
        this.currentFile = null;
        setEventListener((event) => {
            if (event !== 'open') {
                this.currentFile = null;
                this.callback({ msg: "error", error: event,filename:this.filename});
            }
        })
    }

    async getUsage() {
        try {
            const { fileList } = await runAsyncFunc(file.list, { uri: this.uri });
            const usage = fileList.reduce((total, file) => total + file.length, 0);
            return usage;
        } catch (error) {
            return 0;
        }
    }
    async startTransfer(filename, total) {
        this.totalpkg = total;
        this.callback({ msg: "start", total, filename });
        this.currentFile = this.uri + filename;
        this.filename = filename;
        if (filename != await runAsyncFunc(storage.get, { key: "__current_file__" })) {
            await runAsyncFunc(storage.set, {
                key: "__current_file__", value: filename,
            });
            this.packageCount = 0;
            try {
                await runAsyncFunc(file.delete, { uri: this.currentFile });
            } catch (error) {
                // 不存在文件
            }
            this.send({ type: "ready", found: false, usage: await this.getUsage() });
            return;
        }
        let length = 0;
        try {
            ({ length } = await runAsyncFunc(file.get, { uri: this.currentFile }))
        } catch (error) {
            // 不存在文件
        }
        this.send({
            type: "ready",
            found: true,
            length,
            usage: await this.getUsage()
        });
    }
    async save(filedata) {

        try {
            const { count, data } = filedata;
            /* globalThis.logger.log("count" + data); */
            if (count !== this.packageCount) {
                this.send({ type: "error", message: "package count error", count: this.packageCount });
                return;
            }
            await runAsyncFunc(file.writeArrayBuffer, {
                uri: this.currentFile,
                buffer: str2abWrite(data), append: true,
            });
            this.packageCount++;
            this.callback({ msg: "next", progress: count / this.totalpkg, filename: this.filename });
            if (count == this.totalpkg) {
                this.send({ type: "success", message: "transfer success", count: this.packageCount });
                await runAsyncFunc(storage.set, {
                    key: "__current_file__", value: "",
                });
                this.currentFile = null;
                this.callback({ msg: "success" })
            }
            await this.send({ type: "next", message: count + " success", count: this.packageCount });
            if(count%10==0)global.runGC()//每10个包执行一次垃圾回收
        } catch (error) {
            this.callback({ msg: "error", progress: error.message });
            /* globalThis.logger.error(error.message); */
        }
    }
    setCallback(callback) {
        this.callback = callback;
    }
    callback(msg) {  }
}