<script setup>
import {
  onMounted,
  ref,
  computed,
  inject,
  onBeforeUnmount,
  onBeforeMount,
} from "vue";
import {useRoute, useRouter} from "vue-router";
import store from "../../../js/store";
import axios from "../../../js/axios";
import {trim} from "lodash";
import {getTime, isExistMeeting, sleep} from "../../../utils/myUtils";
import html2canvas from "html2canvas";
import {webRTCConfig} from "../../../config";
import {Microphone, Mute} from '@element-plus/icons-vue'
import UMeetingRecord from "./UMeetingRecord.vue";
// import RecordRTC from 'recordrtc';

const audioMsg = ref("开启语音");
const rtcMsg = ref("开启投屏");
// 投屏状态 -1 未有人投屏，1投屏者，2观看者
const rtcStarted = ref(-1);
// 语音
const audioStarted = ref(false);

const userMap = ref({});
const meetMany = ref(0);
const msgList = ref([]);
const socket = inject("socket");
const send_msg = ref("");

// 接收某用户状态更改
socket.on("updateState", (data) => {
  // 用户ID
  let userId = data.userId;
  // 是否已投屏
  let uping = data.uping;
  // 是否已开麦
  let speeching = data.speeching;
  // 设置对应状态到用户字典userMap
  if (uping !== undefined) userMap.value[userId].uping = uping;
  if (speeching !== undefined) userMap.value[userId].speeching = speeching;
});

// 监听远程动作，比如强制刷新，强制闭麦，强制下台
socket.on("action", (data) => {
  let type = data.type;
  let msg = data.msg;
  console.log("action_data", data);
  // 返回成功与否消息
  if (msg) {
    if (msg.startsWith("success:")) ElMessage.success(msg.substring(8));
    else ElMessage.warning(msg);
  }

  if (type === "refresh") {
    // 刷新指令，服务器直接让客户端刷新，重置状态
    // console.log("refresh_data", data);
    if (rtcStarted.value !== 1 && audioStarted.value) {
      toStopAudio();
    }
    if (rtcStarted.value === 1) {
      sumbitRTC();
    }
    location.reload();
  } else if (type === "stop_speech") {
    // 检查是否已经开麦，但不是主持人，就闭麦
    if (rtcStarted.value !== 1 && audioStarted.value) {
      toStopAudio();
    }
  } else if (type === "stop_up") {
    // 检查是否已经开麦，但不是主持人，就下台
    if (rtcStarted.value === 1) {
      sumbitRTC();
    }
  }
});

// 会议聊天监听
socket.on("meetchat", (data) => {
  var user = data.user;
  msgList.value.push({id: user.id, name: user.name, msg: data.msg, time: getTime()});
  sleep(100).then(() => {
    toBottom();
  });
});

// 计算会议人数
const countUserMany = () => {
  var sum = 0;
  Object.values(userMap.value).forEach((user) => {
    if (user !== undefined) sum++;
  });
  meetMany.value = sum;
};

// 插入用户
const joinedUser = (user) => {
  user["audioStream"] = null;
  user["muted"] = false;
  user["autoplay"] = true;
  user["buttonValue"] = "静音";
  userMap.value[user.id] = user;
  countUserMany();
};
// 获取刚加入的用户信息
socket.on("joined_user", joinedUser);
// 删除刚刚退出的用户信息
socket.on("left_user", (userId) => {
  // 如果他在投屏，则执行投屏取消操作
  if (userMap.value[userId].uping) {
    rtcEndAction();
  }


  // 关闭rtc连接
  if (vRtcConns[userId]) {
    vRtcConns[userId].close()
    vRtcConns[userId] = undefined;
  }

  // 清空状态
  userMap.value[userId] = undefined;
  countUserMany();
});
// 获取房间所有用户的列表
socket.on("meeting_users", (users) => {
  // console.log(users);
  users.forEach((user) => {
    joinedUser(user);
  });
});
// 终端之间服务交流
socket.on("message", (data) => {
  // 发送消息的会议号
  let mid = data.meetingId;
  // 检查是否是正确的meeting
  if (mid !== meetingId.value) return;
  // 发送用户的id
  let senderId = data.senderId;

  data = data.data || data;

  if (data != null && data.type != null) {
    // 对收到的SDP进行对应处理
    switch (data.type) {
      case "offer":
        // console.log("offer", senderId, videoUserId);
        // 检查对面是否是投屏者
        if (senderId === videoUserId) {
          // 将数据与video绑定
          createRTCConnection(senderId);
        } else {
          // 将数据与audio绑定
          createRTCConnection(senderId, true);
        }
        // 媒体协商第二步 远端保存接收到的offer 并将answer发送出去
        createAnswer(data, senderId);
        break;
      case "answer":
        // 协商最后一步 接收并保存answer
        vRtcConns[senderId].setRemoteDescription(new RTCSessionDescription(data));
        break;
      case "candidate":
        var candidate = new RTCIceCandidate({
          sdpMLineIndex: data.label,
          candidate: data.candidate,
        });
        vRtcConns[senderId].addIceCandidate(candidate);
        break;
      case "rtcEnd":
        // 投屏关闭
        rtcEndAction();

        break;
      case "rtcStart":
        videoUserId = senderId;
        rtcStarted.value = 2;
        // 接收到投屏信息，返回响应，投屏者将和自己建立连接
        sendMessageById(mid, {type: "rtcReadied"}, senderId, user.value.id);
        break;
      case "rtcStart audio":
        // 同上 响应对方
        sendMessageById(mid, {type: "rtcReadied"}, senderId, user.value.id);
        break;
      case "rtcReadied":
        // 接收方连接准备工作完成，开始媒体协商

        createRTCById(senderId, user.value.id !== videoUserId);
        break;
      case "joined":
        // 加入房间之后请求连接
        sendMessage(mid, {type: "reqconn"}, user.value.id);
        break;
      case "reqconn":
        // 成员请求连接，投屏者收到请求，创建连接
        // console.log("reqconn", rtcStarted.value, audioStarted.value);
        if (rtcStarted.value === 1) {
          // 投屏的用户
          sendMessageById(mid, {type: "rtcStart"}, senderId, user.value.id);
        } else if (rtcStarted.value !== 1 && audioStarted.value) {
          // 只开放了语音的用户
          sendMessageById(mid, {type: "rtcStart audio"}, senderId, user.value.id);
        }
        break;
    }
  }
});
// 对方取消投屏，本机进行的操作
const rtcEndAction = () => {
  rtcStarted.value = -1;
  videoUserId = -1;
};

// video 控件对象
const videoDom = ref(null);
const audioDom = ref(null);
const meetingInfo = ref({userId: -1});
const route = useRoute();
const router = useRouter();
const meetingId = ref(route.params.mid);
const user = computed(() => {
  return store.getters.userInfo;
});
const createRTCById = (senderId, isAudio = false) => {
  // 连接准备工作完成，开始媒体协商
  createRTCConnection(senderId, isAudio);
  // 将当前流加入rtc对象,通讯正常后便会发送给其他人
  sendTracks(senderId, isAudio);
  createOffer(senderId, isAudio);
};

const isMaster = computed(() => {
  return meetingInfo.value.userId === user.value.id;
});

// 获取会议信息，如果该会议不存在则返回404
const getMeetingInfo = async () => {
  let data = await axios.get(`/users/meeting/${meetingId.value}`);
  if (data.code == 200) {
    if (data.data.end) {
      ElMessage.warning("该会议已经结束了");
      router.replace("/");
      return;
    }
    meetingInfo.value = data.data;
    return data.data;
  } else {
    router.replace("/404");
    return null;
  }
};
// 发送socket加入会议
const socketJoin = (meetingId) => {
  socket.emit("join", {meetingId: meetingId});
};
// 全局发送，可以选择携带发送者id
const sendMessage = (meetingId, data, senderId) => {
  socket.emit("message", {
    meetingId: meetingId,
    data: data,
    senderId: senderId,
  });
};
// 发送给该id的人
const sendMessageById = (meetingId, data, toId, senderId) => {
  socket.emit("message", {
    meetingId: meetingId,
    toId: toId,
    data: data,
    senderId: senderId,
  });
};
// webRTC视频连接对象 集合
const vRtcConns = {};
// 投屏的用户id
var videoUserId = -1;

// 自己本地的视频流集合
var vLocalStream = null;
// 自己本地的音频流集合
var aLocalStream = null;

const configuration = webRTCConfig

// 合并音频流和视频流
const mergeTracks = (baseStrem, extraStream) => {
  if (extraStream == null) return baseStrem;
  if (!baseStrem.getAudioTracks().length) {
    baseStrem.addTrack(extraStream.getAudioTracks()[0]);
    return baseStrem;
  }

  var context = new AudioContext();
  var baseSource = context.createMediaStreamSource(baseStrem);
  var extraSource = context.createMediaStreamSource(extraStream);
  var dest = context.createMediaStreamDestination();

  var baseGain = context.createGain();
  var extraGain = context.createGain();
  baseGain.gain.value = 0.8;
  extraGain.gain.value = 0.8;

  baseSource.connect(baseGain).connect(dest);
  extraSource.connect(extraGain).connect(dest);

  return new MediaStream([
    baseStrem.getVideoTracks()[0],
    dest.stream.getAudioTracks()[0],
  ]);
};
const upScreen = async () => {
  // 获取屏幕流
  vLocalStream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: {echoCancellation: true, noiseSuppression: true, autoGainControl: true},
  });
  // 麦克风流
  aLocalStream = await navigator.mediaDevices.getUserMedia({
    audio: {echoCancellation: true, noiseSuppression: true, autoGainControl: true},
    video: false,
  });
  videoDom.value.srcObject = vLocalStream;
  videoDom.value.muted = true;
  videoDom.value.pause();
  // 开启麦克风
  audioStarted.value = true;
  audioMsg.value = "关闭语音";

  videoUserId = user.value.id;
  sendMessage(meetingId.value, {type: "rtcStart"}, user.value.id);
};

const upAudio = () => {
  navigator.mediaDevices
      .getUserMedia({
        audio: true,
        video: false,
      })
      .then((stream) => {
        aLocalStream = stream;
        // 重新建立连接
        // console.log("upAudio", rtcStarted.value);
        if (rtcStarted.value === 1)
          sendMessage(meetingId.value, {type: "rtcStart"}, user.value.id);
        else sendMessage(meetingId.value, {type: "rtcStart audio"}, user.value.id);
      });
};
const createRTCConnection = (id, isAudio) => {
  vRtcConns[id] = new RTCPeerConnection(configuration);

  vRtcConns[id].onicecandidate = (e) => {
    if (e.candidate) {
      sendMessageById(
          meetingId.value,
          {
            type: "candidate",
            label: e.candidate.sdpMLineIndex,
            id: e.candidate.sdpMid,
            candidate: e.candidate.candidate,
          },
          id,
          user.value.id
      );
    }
  };
  vRtcConns[id].ontrack = isAudio ? getAudioRemoteStream(id) : getVideoRemoteStream;
};
// 媒体协商开始 第一步
const createOffer = (id, isAudio = false) => {
  vRtcConns[id].onnegotiationneeded = () => {
    // { offerToReceiveVideo: 1, offerToReceiveAudio: 1 }
    vRtcConns[id]
        .createOffer()
        .then((offer) => {
          // 将本地offer加入rtc对象
          return vRtcConns[id].setLocalDescription(offer);
        })
        .then(() => {
          // 发送offer sdp给远端
          sendMessageById(
              meetingId.value,
              vRtcConns[id].localDescription,
              id,
              user.value.id
          );
        })
        .catch((e) => console.error("createOffer", e));
  };
};
const createAnswer = (data, senderId) => {
  vRtcConns[senderId].setRemoteDescription(new RTCSessionDescription(data)).then(() => {
    // 创建answer
    vRtcConns[senderId]
        .createAnswer()
        .then((answer) => {
          // 保存为本地信息
          return vRtcConns[senderId].setLocalDescription(answer);
        })
        .then(() => {
          // 给对方发送answer
          sendMessageById(
              meetingId.value,
              vRtcConns[senderId].localDescription,
              senderId,
              user.value.id
          );
        })
        .catch((e) => {
          console.error("offer error", e);
        });
  });
};
// 接收远端视频数据
const getVideoRemoteStream = (stream) => {
  // await nextTick();
  // console.log("getVideoRemoteStream", videoDom);
  if (videoDom.value == null) {
    location.reload();
  }

  videoDom.value.controls = true;
  // 默认静音
  videoDom.value.muted = false;
  videoDom.value.autoplay = true;
  videoDom.value.srcObject = stream.streams[0];
};
// 接收远端音频数据
const getAudioRemoteStream = (id) => {
  return (stream) => {
    // console.log("getAudioRemoteStream", id, stream, userMap.value);
    // if (userMap.value[id] == null) {
    //   location.reload();
    // }
    userMap.value[id].audioStream = stream.streams[0];
  };
};

// 将音视频数据与RTC对象绑定
const sendTracks = (id, isAudio) => {
  var merge = isAudio ? aLocalStream : mergeTracks(vLocalStream, aLocalStream);

  merge.getTracks().forEach((track) => {
    // console.log("sendTracks", track);
    vRtcConns[id].addTrack(track, merge);
  });
};

const stopVideo = () => {
  videoDom.value.srcObject.getTracks().forEach((track) => track.stop());
};
const stopAudio = () => {
  if (aLocalStream == null) return;
  aLocalStream.getTracks().forEach((track) => track.stop());
};
// 开启/关闭投屏
const sumbitRTC = () => {
  if (meetingInfo.value.needFace && !faceAccess.value) {
    ElMessage.error("未验证身份");
    return;
  }
  if (navigator.mediaDevices) {
    if (rtcStarted.value === 1) {
      // 关闭投屏后语音不关，要建立语音新连接
      sendMessage(meetingId.value, {type: "rtcEnd"}, user.value.id);
      setMyState({uping: false});
      if (videoDom.value.srcObject) stopVideo();
      toStopAudio();
      videoUserId = -1;
      rtcStarted.value = -1;
      rtcMsg.value = "开启投屏";
    } else {
      if (rtcStarted.value === 2) {
        ElMessage.error("投屏失败，现在台上已有一人");
        return;
      }
      getMyState().then((res) => {
        let state = res.data;
        if (state && state.hadBanup) {
          ElMessage.warning("你已经被禁止投屏");
          return;
        }
        setMyState({uping: true});
        stopAudio();
        rtcStarted.value = 1;
        upScreen();
        rtcMsg.value = "关闭投屏";
      });
    }
  } else {
    ElMessage.warning("该浏览器不支持获取设备资源流，建议使用谷歌最新版浏览器");
  }
};
const toStopAudio = () => {
  if (aLocalStream) stopAudio();
  audioStarted.value = false;
  audioMsg.value = "开启语音";
  setMyState({speeching: false});
};
// 获取状态，是否被禁用
const getMyState = async () => {
  var res = await axios.get(
      `/users/meeting/${meetingId.value}/userState/${user.value.id}`
  );
  return res;
};

const setMyState = async (data) => {
  await axios.post(`/users/meeting/${meetingId.value}/userState/${user.value.id}`, data);
};

const sumbitAudio = () => {
  if (meetingInfo.value.needFace && !faceAccess.value) {
    ElMessage.error("未验证身份");
    return;
  }
  if (navigator.mediaDevices) {
    if (audioStarted.value) {
      toStopAudio();
    } else {
      getMyState().then((res) => {
        let state = res.data;
        if (state && state.hadMuted && rtcStarted.value !== 1) {
          ElMessage.warning("你已经被禁止开麦");
          return;
        }
        setMyState({speeching: true});
        upAudio();
        audioStarted.value = true;
        audioMsg.value = "关闭语音";
      });
    }
  } else {
    ElMessage.warning("该浏览器不支持获取设备资源流，建议使用谷歌最新版浏览器");
  }
};
const GetUserIndex = (userId) => {
  // console.log(userList.value);
  userList.value.forEach((value, index, array) => {
    if (value.id === userId) return index;
  });
};
const sumbitAudioMuted = (user) => {
  if (!user.muted) {
    user.muted = true;
  } else {
    user.muted = false;
    audioPlay(user);
  }
  // console.log(user.muted, user.audio.paused);
};

const sendNewsToMeeting = (msg) => {
  socket.emit("meetchat", {meetingId: meetingId.value, msg: msg});
};

const scrollbarRef = ref(null);
const innerRef = ref(null);
/**
 * 移动到最新消息旁
 */
const toBottom = () => {
  var maxH = innerRef.value.clientHeight - 520;

  scrollbarRef.value.setScrollTop(maxH);
};

const submitSendNewsToMeeting = () => {
  if (trim(send_msg.value) === "") return;
  sendNewsToMeeting(send_msg.value);
  send_msg.value = "";
};

const takePhotoRef = ref(null);
const signInVisible = ref(false);
const signInTitle = ref("签到");
const setSignInVisible = (value) => {
  signInVisible.value = value;
  getSumbitSignInVisible();
};
const sumbitSignIn = () => {
  if (meetingInfo.value.needFace && !faceAccess.value) {
    ElMessage.error("未验证身份");
    return;
  }
  var start = new Date(meetingInfo.value["startDate"]);
  var now = new Date();
  if (now.getTime() < start.getTime()) {
    ElMessage.warning("会议开始之后才能签到！");
    return;
  }

  setSignInVisible(true);
};
const signIn = async () => {
  // console.log(takePhotoRef.value.getImgBase64());
  await axios
      .post(`/users/signIn/${meetingId.value}`, {
        imgBase64: takePhotoRef.value.getImgBase64(),
      })
      .then((res) => {
        takePhotoRef.value.stopLoading();
        if (res.code == 200) {
          takePhotoRef.value.beforeClose();
        }
      })
      .catch((e) => {
        console.log(e);
      });
};

const sumbitSignInVisible = ref(false);
const getSumbitSignInVisible = async () => {
  // 是否已经签到
  var res = await axios.get(`/users/signIn/${meetingId.value}`);
  sumbitSignInVisible.value = res.data;
};
const signInListVisible = ref(false);
const setSignInListVisible = (value) => {
  signInListVisible.value = value;
};
const noticeVisible = ref(false);
const setNoticeVisible = (value) => {
  if (meetingInfo.value.needFace && !faceAccess.value) {
    ElMessage.error("未验证身份");
    return;
  }
  // console.log(noticeVisible.value);
  noticeVisible.value = value;
};
const setUserAudio = (user) => {
  return (audio) => {
    user["audio"] = audio;
  };
};

const audioPlay = (user) => {
  user.autoplay = true;

  user.audio.play().catch((err) => {
  });
};

function toggleSound() {
  try {
    Object.values(userMap.value).forEach((user) => {
      if (user.audio.paused) {
        //判读是否播放 没有就播放
        user.muted = true;
        audioPlay(user);
        if (!user.audio.paused) user.muted = false;
      }
    });
  } catch (e) {
  }
}

// 退出房间
const outRoom = () => {
  // console.log(route.params, route.query);
  var joined = route.query.joined;
  // 决定跳转页面
  if (joined && joined === "true") {
    router.replace({path: "/home/joinedMeetingList"});
  } else {
    router.replace({path: "/home/myMeetingList"});
  }
};

// 用户信息框
const userInfoVisible = ref(false);
const userInfoId = ref(null);
const setUserInfoVisible = (x) => {
  userInfoVisible.value = x;
};
const sumbitUserInfo = (userId) => {
  userInfoId.value = userId;
  setUserInfoVisible(true);
};

const sendExistMinute = () => {
  if (isMaster.value) {
    clearInterval(sendExistMinuteTimer);
    sendExistMinuteTimer = null;
  }
  // console.log("exist_minute", isMaster.value);
  socket.emit("exist_minute", {meetingId: meetingId.value});
};
const getUserState = async () => {
  let res = await axios.get(`/users/meeting/${meetingId.value}/userState/0/-1`);
  // console.log(userMap.value, userMap.value[37]);
  res.data.records.forEach((item) => {
    if (userMap.value[item.usersId]) {
      userMap.value[item.usersId].uping = item.uping;
      userMap.value[item.usersId].speeching = item.speeching;
    }
  });
};

// 截屏ref
const screenshotRef = ref();
// 截屏
const screenshot = () => {
  if (meetingInfo.value.needFace && !faceAccess.value) {
    ElMessage.error("未验证身份");
    return;
  }
  let imgHeight = screenshotRef.value.offsetHeight; // 获取DOM高度
  let imgWidth = screenshotRef.value.offsetWidth; // 获取DOM宽度
  let scale = window.devicePixelRatio; // 获取设备像素比

  html2canvas(screenshotRef.value, {
    useCORS: true, // 允许跨域，不加该参数，跨域的图片不会显示
    scale: scale, // 调整清晰度，值越大，清晰度越大
    width: imgWidth,
    height: imgHeight,
  }).then(async (canvas) => {
    let base64 = canvas
        .toDataURL("image/jpeg")
        .substring("data:image/jpeg;base64,".length);
    let res = await axios.post(`/meetingScreenshot/${meetingId.value}`, {
      imgBase64: base64,
    });
    if (res.code === 200) {
      ElMessage.success("截屏成功,已保存至个人中心");
    }
  });
};

// 人脸识别验证
const faceVerificationRef = ref();
const faceAccess = ref(true);
const setFaceVerificationVisible = (x) =>
    faceVerificationRef.value.setFaceVerificationVisible(x);

// 检查是否重复加入房间
var stopFlag = false;
onBeforeMount(() => {
  isExistMeeting(meetingId.value, user.value.id).then((flag) => {
    // console.log("1");
    if (flag) {
      stopFlag = true;
      ElMessage.error("你已经进入该会议了");
      router.replace("/");
      return;
    }
  });
});

var autoPlayTimer = null;
var sendExistMinuteTimer = null;
// 先通过人脸验证之后再执行
const mountedAction = () => {
  faceAccess.value = true;
  getSumbitSignInVisible();
  autoPlayTimer = setInterval(toggleSound, 100);
  // console.log(isMaster.value);
  if (!isMaster.value) {
    sendExistMinuteTimer = setInterval(sendExistMinute, 60000);
  }

  // 等一下stopFlag结果
  sleep(100).then(() => {
    // console.log(!stopFlag, "2");
    if (!stopFlag) socketJoin(meetingId.value);
  });
  sleep(500).then(() => getUserState());
};

onMounted(() => {
  // 检查是否该会议是否开启了人脸验证
  getMeetingInfo().then((info) => {
    // console.log(info);
    if (info.needFace && info.userId !== user.value.id) {
      faceAccess.value = false;
      setFaceVerificationVisible(true);
    } else {
      mountedAction();
    }
  });
});
// 页面销毁前
onBeforeUnmount(() => {
  // 如果正在投屏和开麦的就关闭
  if (rtcStarted.value !== 1 && audioStarted.value) {
    toStopAudio();
  }
  if (rtcStarted.value === 1) {
    sumbitRTC();
  }
  clearInterval(autoPlayTimer);
  if (sendExistMinuteTimer) {
    // console.log("clear sendExistMinuteTimer");
    clearInterval(sendExistMinuteTimer);
    // console.log(sendExistMinuteTimer);
  }

  sleep(100).then(() => {
    // console.log("leave");
    if (!stopFlag) socket.emit("leave", {meetingId: meetingId.value});
  });
  // 强制刷新将当前vue都重置，否则有缓存就会出现问题
  location.reload();
});
</script>

<template>
  <!-- 播放器，用来播放拍摄的视频 -->
  <div id="back">
    <el-container>
      <el-aside width="200px">
        <el-scrollbar>
          <div class="sub_head">
            <div class="users_display_title">目前成员({{ meetMany }})</div>
          </div>
          <!-- 将内容往下挤，防止被固定定位遮盖 -->
          <!-- <div style="margin-top: 130px"></div> -->
          <!-- 垂直分割线 -->
          <div class="user_all">
            <el-row v-for="(item, index) in userMap" :key="index"
            >
              <div class="user_block" v-if="item !== undefined">
                <el-avatar :size="50" :src="item.headImage"/>
                <div>
                  <el-link
                      @click="sumbitUserInfo(item.id)"
                      :underline="false"
                      type="primary"
                  >{{ item.name }}
                  </el-link
                  >
                  <div v-if="item.uping || item.speeching" class="state">
                    {{ item.uping ? "已投屏" : "已开麦" }}
                  </div>
                </div>
                <audio
                    controls="controls"
                    :autoplay="item.autoplay"
                    :muted="item.muted"
                    :srcObject="item.audioStream"
                    :ref="setUserAudio(item)"
                    v-show="false"
                />
                <!-- <span class="waitupText" v-if="rtcStarted == 1">-投屏中-</span> -->
                <div v-if="item.id !== user.id">
                  <el-button
                      @click="sumbitAudioMuted(item)"
                      :icon="item.muted ? Mute : Microphone"
                  >{{ item.muted ? "取消" : "静音" }}
                  </el-button
                  >
                </div>
              </div>
            </el-row
            >
          </div>
        </el-scrollbar>
      </el-aside>
      <el-container>
        <el-header
        >
          <div class="header">
            <el-row>
              <el-col :span="24">会议名：{{ meetingInfo.name }}</el-col>
              <el-col :span="24">会议Id：{{ meetingInfo.id }}</el-col>
              <el-col :span="24">开始时间：{{ meetingInfo.startDate }}</el-col>
            </el-row>
          </div>
        </el-header
        >
        <el-main
        >
          <div class="main_block">
            <div class="video_block" ref="screenshotRef">
              <video
                  v-show="rtcStarted > 0"
                  class="video"
                  ref="videoDom"
                  controls="true"
                  autoplay="true"
              />
              <div v-show="rtcStarted == -1" class="waitup_block">
                <span class="waitup_msg">暂时还没有人投屏</span>
              </div>
            </div>
            <div>
              <div class="chat_block">
                <!--  word-wrap: break-word 自动换行  -->
                <el-scrollbar ref="scrollbarRef">
                  <div ref="innerRef">
                    <ul class="infinite-list" style="word-wrap: break-word">
                      <!-- <el-scrollbar ref="scrollbarRef"> -->

                      <li v-for="(item, index) in msgList" :key="index">
                        <span v-if="item.id != -1">
                          [{{ item.time }}]
                          <el-link
                              @click="sumbitUserInfo(item.id)"
                              :underline="false"
                              type="primary"
                          >{{ item.name }}</el-link
                          >: {{ item.msg }}
                        </span>
                        <span v-else>[{{ item.time }}] {{ item.msg }}</span>
                      </li>

                      <!-- </el-scrollbar> -->
                    </ul>
                  </div>
                </el-scrollbar>
              </div>
              <div class="chat_send">
                <el-input
                    v-model="send_msg"
                    placeholder="输入要发送的内容"
                    style="width: 290px"
                    @keyup.enter="submitSendNewsToMeeting()"
                />
                <el-button @click="submitSendNewsToMeeting()">发送</el-button>
              </div>
            </div>
          </div>
          <div class="turn_button">
            <el-button @click="sumbitAudio">{{ audioMsg }}
            </el-button
            >
            <el-button @click="sumbitRTC">{{ rtcMsg }}</el-button>
            <el-button @click="setNoticeVisible(true)">公告</el-button>
            <el-button
                v-if="!isMaster"
                :disabled="sumbitSignInVisible"
                @click="sumbitSignIn"
            >签到
            </el-button
            >
            <el-button @click="screenshot">截屏保存</el-button>
            <el-button @click="outRoom">退出房间</el-button>
            <div class="admin_button" v-if="isMaster">
              <el-button @click="setSignInListVisible(true)">成员列表</el-button>
              <u-meeting-record :meetingName="meetingInfo.name"/>
            </div>
          </div>
        </el-main>
      </el-container>
    </el-container>
    <!-- 签到对话框 -->
    <take-photo
        ref="takePhotoRef"
        v-if="signInVisible"
        title="签到"
        :sendAction="signIn"
        :closeView="() => setSignInVisible(false)"
    />
    <!-- 人脸验证进房 -->
    <face-verification
        ref="faceVerificationRef"
        :successAction="mountedAction"
        :uncloseable="true"
    />

    <!-- 已签到用户列表对话框 -->
    <u-sign-in-list
        v-if="signInListVisible"
        :signInListVisible="signInListVisible"
        :meetingId="meetingId"
        @setSignInListVisible="setSignInListVisible"
    />
    <!-- 公告列表对话框 -->
    <u-notice-list
        v-if="noticeVisible"
        :noticeVisible="noticeVisible"
        :meetingId="meetingId"
        :isMaster="isMaster"
        @setNoticeVisible="setNoticeVisible"
    />
    <!-- 参会人信息框 -->
    <user-info-by-id
        v-if="userInfoVisible"
        :userInfoVisible="userInfoVisible"
        :userId="userInfoId"
        @setUserInfoVisible="setUserInfoVisible"
    />
  </div>
</template>

<style scoped>
.admin_button {
  margin-top: 1vh;
}

.user_all {
  margin-top: 10px;
}

.video {
  height: 75vh;
}

.el-col {
  border-radius: 4px;
}

.grid-content {
  border-radius: 4px;
  min-height: 36px;
}

.el-container {
  height: 100vh;
  background-color: #f1f1f1;
}

.el-main {
  padding: 0;
  margin-top: 40px;
  overflow: hidden;
}

.el-aside {
  border-width: 0 1px 0 0;
  border-style: double;
  border-color: grey;
}

.el-header {
  padding: 0;
}

.user_block {
  width: 100vh;
  text-align: center;
  margin-bottom: 30px;
}

.user_block > div {
  margin-top: 10px;
}

.users_display_title {
  margin: 30px 0 0 50px;
}

.sub_head {
  /* position: fixed; */
  background-color: #f1f1f1;
  /* 在最上层 */
  z-index: 10;
  padding: 0 0 50px 0;
  border-width: 0 0 1px 0;
  border-style: double;
  border-color: grey;
}

.chat_block {
  overflow-y: auto;
  background-color: #f1f1f1;
  /* padding: 0 0 0 100px; */
  height: 71vh;
  width: 48vh;
  border-width: 1px 0 1px 1px;
  border-style: double;
  border-color: grey;
}

.waitup_block {
  width: 135vh;
  height: 75vh;
  background-color: black;
}

.waitup_msg {
  color: #f1f1f1;

  text-align: center;
  display: block;
  font-size: large;
}

.main_block {
  display: flex;
}

.infinite-list {
  padding: 0;
  margin: 0;
  list-style: none;
}

.waitupText {
  font-size: smaller;
  font-weight: lighter;
}
</style>
