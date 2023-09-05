import axios from 'axios'
import { ElMessage } from 'element-plus'
import {requestConfig} from "../config";

// axios.defaults.baseURL = 'http://localhost:3000/api'
axios.defaults.baseURL = requestConfig.baseURL

axios.interceptors.request.use(
    (config)=>{
        // if(config.url != null && config.url.startsWith("/admin") && config.url != '/admin/login')
            config.headers.Authorization = window.localStorage.getItem('adminlogin')
        
        return config
    },error=>Promise.reject(error)
)


axios.interceptors.response.use(success =>{
    // console.log("success",success)
    if (success.status && success.status === 200){
        
        if(success.data.code === 500 || success.data.code === 401 || success.data.code === 403){
            if(success.data.code === 401){
                
                window.localStorage.removeItem("adminlogin");
                window.localStorage.removeItem("user");
                location.reload();
                // history.pushState({},"登录","/login");
            }
            ElMessage.error(success.data.message)
        }else if(success.data.message){
            ElMessage.success(success.data.message)
        }
        
    }
    return success.data
},error=>{
    console.log("error",error)
    if (error.response.status === 504 || error.response.status === 404){
        ElMessage.error("服务器异常")
    }else if(error.response.status === 403){
        ElMessage.error("权限不足")
    }else if(error.response.status === 401 || error.response.data.code === 401){
        window.localStorage.removeItem("adminlogin");
        window.localStorage.removeItem("user");
        // ElMessage.error("请登录后再访问")
        location.reload();
    }else{
        if (error.response.data.message){
            ElMessage.error(error.response.data.message)
        }else{
            ElMessage.error("未知错误")
        }
    }
    return ;
})


export default axios
