<script setup>
import router from "../../../js/router";
import {
  ref,
  onMounted,
  onBeforeMount,
  reactive,
  inject,
  onUnmounted,
  nextTick,
  watch,
  computed,
} from "vue";
import { ElScrollbar } from "element-plus";
import axios from "axios";
import store from "../../../js/store";
// 父传子
const props = defineProps({ userId: Number });

const msg = ref("");
const userInfo = computed(() => {
  let x = null;
  store.state.friendInfos.forEach((item) => {
    if (item.uid == props.userId) {
      // userInfo.value = item;
      x = item;
    }
  });
  return x;
});
const scrollbarRef = ref();
const innerRef = ref({ clientHeight: 0 });
const contentRef = ref();
// 按下发送按钮
const submitSendMsg = async () => {
  if (msg.value == "") return;
  // console.log(item.content.length > innerRef.clientWidth)
  // console.log(contentRef.value[3].clientWidth == innerRef.value.clientWidth);
  await axios
    .post(`/users/friend/${userInfo.value.uid}/chat`, { content: msg.value })
    .then((res) => {
      store.dispatch("pushFriendChat", res.data);
      // userInfo.value = props.userInfo;
    });
  // 更新新消息的样式
  setMsgStyle(contentRef.value.length - 1);
  // console.log(userInfo.value.chatMessage.length, contentRef.value.length);
  msg.value = "";
  toBottom();
};

/**
 * 移动到最新消息旁
 */
const toBottom = () => {
  var maxH = innerRef.value.clientHeight - 380;
  // console.log(maxH);
  scrollbarRef.value.setScrollTop(maxH);
};
// 储存消息的样式，左对齐还是右对齐
const msgStyle = ref({});
// 根据索引设置
const setMsgStyle = (index) => {
  msgStyle.value[index] = "text-align: ".concat(
    userInfo.value.chatMessage[index].fromId == userInfo.value.uid ||
      contentRef.value[index].offsetWidth >= innerRef.value.offsetWidth - 10
      ? "left;"
      : "right;"
  );
};
// 更新所有的
const updateAllMsgStyle = () => {
  contentRef.value.forEach((value, index, array) => {
    setMsgStyle(index);
  });
};

// dom渲染完成
nextTick(() => {
  toBottom();

  updateAllMsgStyle();
});
// onBeforeMount(() => {});
defineExpose({ toBottom });
</script>

<template>
  <div class="chat-message">
    <div class="content">
      <!-- 聊天区域 -->
      <!-- 对方左对齐，自己右对齐 -->
      <el-scrollbar ref="scrollbarRef" height="420px">
        <div ref="innerRef">
          <div
            class="chat-line"
            v-for="(item, index) in userInfo.chatMessage"
            :key="index"
            :style="msgStyle[index]"
          >
            <span ref="contentRef">{{ item.content }}</span>
          </div>
        </div>
      </el-scrollbar>
    </div>

    <div class="send">
      <el-input
        v-model="msg"
        placeholder="请输入发送消息"
        @keyup.enter="submitSendMsg"
      /><el-button @click="submitSendMsg">发送</el-button>
    </div>
  </div>
</template>

<style scoped>
.chat-line:nth-child(even) {
  background: #f2f0f0;
}
.chat-message {
  height: 460px;
  /* border: solid 2px; */
  padding: 0;
}
.content {
  /* display: flex; */
  /* background-color: red; */
  border: solid 1px;
  height: 420px;
  /* overflow: auto; */
}
.send {
  /* background-color: blue; */
  margin-top: 5px;
  height: 39px;
  text-align: center;
}
.el-input {
  width: 500px;
  margin-right: 10px;
}
.chat-line {
  font-family: "Gill Sans", "Gill Sans MT", Calibri, "Trebuchet MS", sans-serif;
  font-size: large;
}
.chat-line span {
  margin: 0 10px 3px 10px;
}
</style>
