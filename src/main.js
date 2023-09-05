import { createApp } from 'vue'
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
// import JsonExcel from "vue-json-excel";
import vue3JsonExcel from "vue3-json-excel"

createApp(App)
    .use(vue3JsonExcel)
    .use(socket,{connection: 'ws://localhost:9092',
    options:{
        transports: ["websocket", "polling"],// 优先ws
        timeout: 5000, 
        reconnection: false, // 取消自动重连
        debug:true
    }})
    .use(router)
    .use(store)
    .use(element, { locale })
    .mount('#app')
