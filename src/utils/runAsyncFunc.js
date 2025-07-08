import XiaomiError from "./XiaomiError"
/**
 * 将小米的傻逼callback转成promise
 * @param {Function} func 原来的函数
 * @param {Object} params 函数要的参数
 * @returns {Promise<Object>} 函数返回的值
 * @throws {XiaomiError} 函数返回的错误
 * @author lesetong
 */
export default function runAsyncFunc(func, params) {
    return new Promise((resolve, reject) => func({
        success: resolve,
        fail: (data, code) => reject(new XiaomiError(data, code)),
        ...params
    }))
}