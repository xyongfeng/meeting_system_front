import {createStore} from 'vuex'
import { inject } from 'vue';
import axios from 'axios';
import { addImagePath,myLocalInfo,reqReadChat } from '../utils/myUtils';


const store = createStore({
    // 存放数据
    state:{
        routes: [],
        // socket: null,
        friendApplications:[],
        meetingApplications:[],
        meetingInfrom:[],
        friendInfos:[],
        joinedMeets:[],
    },
    // 存放修改数据的方法(同步函数)
    mutations:{
        initRoutes(state,value){
            state.routes = value
        },
        initFriendApplications(state,value){
            state.friendApplications = value
        },
        initMeetingApplications(state,value){
            state.meetingApplications = value
        },
        initMeetingInfrom(state,value){
            state.meetingInfrom = value
        },
        initChatMessage(state,value){
            state.chatMessage = value
        },
        initFriendInfos(state,value){
            state.friendInfos = value
        },
        initJoinedMeets(state,value){
            state.joinedMeets = value
        },
    },
    // 异步函数
    actions:{
        async getJoinedMeets(content,payload) {
            await axios.get(
              `/users/meeting/joined/${0}/${-1}`
            ).then(({data})=>{
            data.records.forEach((value,index,array)=>array[index]['owner'] = value.users.name)
            content.commit("initJoinedMeets",data.records)});
        },
        async delMeetingInfrom({ state },index){
            state.meetingInfrom.splice(index,1);
        },
        async getMeetingInfrom(content,payload) {
            axios.get(`/users/meeting/inform/${payload.current}/${payload.size}`)
            .then((res) => {
                // console.log("getMeetingInfrom",res.data.records)
                content.commit("initMeetingInfrom", res.data.records);
            })
          },
        async pushMeetingInfromList({ state },{records}){
            records.forEach((item)=>{
                // console.log(item)
                state.meetingInfrom.unshift(item);
            })
        },
        async pushMeetingInfrom({ state },payload){
            // console.log(state.meetingInfrom)
            state.meetingInfrom = state.meetingInfrom.filter((item)=>{
                return item.id != payload.id
            })
            // console.log(state.meetingInfrom)
            state.meetingInfrom.unshift(payload);
        },
        async getMeetingApplications(content,payload) {
            axios.get(`/users/meeting/application/${payload.current}/${payload.size}`)
            .then((res) => {
                // console.log('meeting app',res.data.records)
                content.commit("initMeetingApplications", res.data.records);
            })
          },
        async pushMeetingApplications({ state },payload){
            state.meetingApplications.unshift(payload);
        },
        async getFriendApplications(content,payload) {
            axios.get(`/users/friend/application/${payload.current}/${payload.size}`)
            .then((res) => {
                content.commit("initFriendApplications", res.data.records);
            })
          },
        async pushFriendApplications({ state },payload){
            state.friendApplications.unshift(payload);
        },

        async getFriendsAndChats(content,payload){
            axios.get(`/users/friend/${payload.current}/${-1}`)
            .then((res)=>{
                // console.log(res.data.records)
                content.commit("initFriendInfos", res.data.records);
            }).then(()=>{
                var oweId = myLocalInfo().id
                // console.log('oweId',oweId)
                content.state.friendInfos.forEach((value,index,array)=>{
                    // 查看有多少消息是更新的
                    var sum = 0;
                    // 只有不是自己发送的消息才算
                    value.chatMessage.forEach((item,index,array)=>{
                        // 可以根据发送时间优化
                        if(item.fromId != oweId && item.state == 0) sum++;
                        
                    })
                    array[index].chatNewSize = sum;
                    
                    // 给头像路径填上前缀
                    array[index].headImage = addImagePath(array[index].headImage);
                })

            })
            
        },
        async pushFriendChat({ state },payload){
            var fromId = payload['fromId']
            var toId = payload['toId']
            // 目前标签选择
            var activeName = payload['activeName']
            // 聊天框是否打开
            var chatVisible = payload['chatVisible']
            for (let index in state.friendInfos) {
                var item = state.friendInfos[index]
                // item.uid == fromId 接收人情况
                // item.uid == toId 发送人情况
                // console.log(item.uid,fromId,toId)
                if(item.uid == fromId || item.uid == toId){
                    // console.log(item.chatMessage)
                    item.chatMessage.push({
                        content: payload['content'],
                        fromId: payload['fromId'],
                        fromer: null,
                        id: payload['id'],
                        sendTime: payload['sendTime'],
                        state: 0,
                        toId: payload['toId'],
                        type: 1
                    })
                    // activeName == index 表示在当前选择聊天中
                    // 大前提是消息是对方发送的。其次不能是当前选择的页面，但是如果聊天框没打开，就算是当前选择也能通过
                    if (item.uid == fromId && (activeName != index || !chatVisible)) {
                        // 增加新消息
                        item.chatNewSize++;
                    }
                    return index;
                }
            }
           
        },
        async delFirendByIndex({ state },{ index }){
            var uid = state.friendInfos[index].uid
            await axios.delete(`/users/friend/${uid}`).then(()=>{
                state.friendInfos.splice(index,1)
            })
        },
        async readChat({ state },{ index }){
            if(index >= state.friendInfos.length) return;
            state.friendInfos[index].chatNewSize = 0
            reqReadChat(state.friendInfos[index].uid);
        }

    },
     // 相当于computed
     getters:{
        userInfo(){
            return myLocalInfo()
        },
        informSize(state){
            return state.friendApplications.length + state.meetingApplications.length + state.meetingInfrom.length;
        },
        chatNewSizeAll(state){
            var sum = 0;
            state.friendInfos.forEach((value,index,arr)=>{
                sum += value.chatNewSize;
            })
            return sum;
        }
    }


})

export default store