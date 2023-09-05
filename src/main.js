import {createApp} from 'vue'
import App from './App.vue'
import router from './js/router'
import './assets/global.css'
import 'element-plus/dist/index.css'
import store from './js/store'
import socket from './js/socket'
import 'default-passive-events'
import 'dayjs/locale/zh-cn' //中文
import locale from 'element-plus/lib/locale/lang/zh-cn' //中文
import element from 'element-plus'
import vue3JsonExcel from "vue3-json-excel"
import {requestConfig} from "./config";



const app = createApp(App)

app.use(vue3JsonExcel)
    .use(socket, {
        // connection: 'ws://localhost:9092',
        connection: requestConfig.socket,
        options: {
            transports: ["websocket", "polling"],// 优先ws
            timeout: 5000,
            reconnection: false, // 取消自动重连
            debug: true
        }
    })
    .use(router)
    .use(store)
    .use(element, {locale})


app.mount('#app')
