/**
 *  设置webRTC中继服务器（STUN/TURN服务器）
 *  以下服务器IP已失效，只能作为配置参考
 *  本地通信不设置也可以
 */
export const webRTCConfig = {
    iceServers: [
        // turn服务器地址，账号，密码
        {urls: "stun:118.31.51.13:3478"},
        {
            urls: ["turn:118.31.51.13:3478"],
            username: "xyongfeng",
            credential: "123456",
            credentialType: "password",
        },
    ],
    // all:尝试使用多种方式进行通信 relay：只选择中继服务器进行通信
    iceTransportPolicy: "all",
    iceCandidatePoolSize: "0",
};

/**
 * 请求地址配置
 */
export const requestConfig = {
    socket: 'ws://127.0.0.1:9092',
    baseURL: 'http://127.0.0.1:80/api',
    backendUrl: 'http://127.0.0.1:8080',
}
