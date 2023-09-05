import {createRouter,createWebHistory} from 'vue-router'
import store from "./store";
import {addImagePath,updateLocalUserInfo,myLocalInfo,saveLocalUserInfo} from '../utils/myUtils'
import axios from './axios'
const router = createRouter({
    history:createWebHistory(),
    routes:[
        {
            path:'/admin',
            component:()=>import('../components/background/BMain.vue'),
            children:[
                {
                    path:'',
                    redirect:'/admin/home',
                },
                {
                    path:'home',
                    component: ()=>import('../components/background/BHome.vue'),
                    children:[
                        {   
                            name: '用户列表',
                            path:'userList',
                            component: ()=>import('../components/background/home/BUserList.vue')
                        }, {   
                            name: '会议列表',
                            path:'meetingList',
                            component: ()=>import('../components/background/home/BMeetingList.vue')
                        },{   
                            name: '聊天过滤',
                            path:'chatFilter',
                            component: ()=>import('../components/background/home/BChatFilter.vue')
                        },{   
                            name: '数据统计',
                            path:'dataStatistics',
                            component: ()=>import('../components/background/home/BDataStatistics.vue')
                        },{   
                            name: '管理日志',
                            path:'adminLog',
                            component: ()=>import('../components/background/home/BAdminLog.vue')
                        },{   
                            name: '用户意见',
                            path:'userAdvice',
                            component: ()=>import('../components/background/home/BUserAdvice.vue')
                        },{
                            name:'_404',
                            path:'404',
                            component:()=>import('../components/global/404.vue')
                        }
                    ]
                }
            ]
        },{
            path:'/',
            component:()=>import('../components/user/UMain.vue'),
            children:[
                {
                    path:'',
                    redirect:'/home',
                },
                {
                    path:'',
                    component:()=>import('../components/user/UFront.vue'),
                    children:[
                        {   
                            path:'/login',
                            component:()=>import('../components/user/front/ULogin.vue')
                        },{   
                            path:'/register',
                            component:()=>import('../components/user/front/URegister.vue')
                        }
                    ]
                },
                {
                    path:'/home',
                    component:()=>import('../components/user/UHome.vue'),
                    children:[
                        {
                            path:'',
                            redirect:'/home/myMeetingList',
                        },
                        {   
                            name: '我的会议',
                            path:'myMeetingList',
                            component: ()=>import('../components/user/home/UMyMeetingList.vue')
                        },{   
                            name: '参加的会议',
                            path:'joinedMeetingList',
                            component: ()=>import('../components/user/home/UJoinedMeetingList.vue')
                        },{   
                            name: '历史会议',
                            path:'historyMeeting',
                            component: ()=>import('../components/user/home/UHistoryMeetingList.vue')
                        },{   
                            name: '个人中心',
                            path:'userCenter/:uid',
                            // keepAlive:false,
                            component: ()=>import('../components/user/home/UUserCenter.vue')
                        },{   
                            name: '意见反馈',
                            path:'userAdvice',
                            component: ()=>import('../components/user/home/UUserAdvice.vue')
                        },{
                            name:'404',
                            path:'404',
                            component:()=>import('../components/global/404.vue')
                        },{
                            name:'会议房间',
                            path:'meeting/:mid',
                            component:()=>import('../components/user/UMeeting.vue'),
                        }
                    ]
                }
            ]
        },{
            path:'/admin/:catchAll(.*)',
            redirect: '/admin/home/404', 
        },
        {
            path:'/:catchAll(.*)',
            redirect: '/home/404', 
        }
       
        
    ]
})

router.beforeEach(async (to,from,next)=>{
    // 如果是登录路径就直接放行
    if (to.path == '/login' || to.path == '/register') return next() 

    if (window.localStorage.getItem("adminlogin") == null) return next("/login")

     // 获取登录用户信息并保存到本地local
     let {data:userInfo} = await axios.get("/users/info")
     saveLocalUserInfo(userInfo)

     if (to.path.startsWith("/admin") && (!userInfo.isAdmin || userInfo.perms.length <=1)){
         // 没有管理员权限直接跳到404
         return next("/404")
     }
    
     
     next()
})


export default router