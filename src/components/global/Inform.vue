<script setup>
import { BellFilled } from "@element-plus/icons-vue";
import { onMounted, onBeforeMount, inject, ref, provide, onUnmounted } from "vue";
import store from "../../js/store";
import axios from "../../js/axios";
const current = 0;
const size = -1;
const socket = inject("socket");

const getFriendApplications = () =>
  store.dispatch("getFriendApplications", { current: 0, size: size });

const pushFriendApplications = (data) => store.dispatch("pushFriendApplications", data);

const getMeetingApplications = () =>
  store.dispatch("getMeetingApplications", { current: 0, size: size });

const pushMeetingApplications = (data) => store.dispatch("pushMeetingApplications", data);

const getMeetingInfrom = () =>
  store.dispatch("getMeetingInfrom", { current: 0, size: size });

const pushMeetingInfrom = (data) => store.dispatch("pushMeetingInfrom", data);

const pushMeetingInfromList = (data) => store.dispatch("pushMeetingInfromList", data);

const noticeDialogVisible = ref(false);
const meetingNotice = ref({});

const showMeetingInfrom = async (infrom, index) => {
  // console.log("showMeetingInfrom", infrom);
  // 给此标记已读
  await axios.post(`/users/meeting/inform/${infrom.informId}`).then(() => {
    // 并且在列表中删除
    store.dispatch("delMeetingInfrom", index);
  });
  // 2022-12-19 10:49:30.448
  // console.log(infrom.updateTime);
  infrom.updateTime = infrom.updateTime.replace(/\..*$/, "");
  // console.log(infrom.updateTime);
  infrom.updateTime = infrom.updateTime.replace("T", " ");

  meetingNotice.value = infrom;
  noticeDialogVisible.value = true;
  // console.log(infrom);
};

socket.on("updateInform", (data) => {
  // 1 好友申请 2 会议申请 3 会议通知
  var way = data["way"];
  if (way == 1) {
    pushFriendApplications(data);
  } else if (way == 2) {
    pushMeetingApplications(data);
  } else if (way == 3) {
    console.log(data);
    if ("records" in data) {
      // 会议同意后，多条通知更新
      pushMeetingInfromList(data);
      // 更新加入会议列表
      store.dispatch("getJoinedMeets");
    } else {
      pushMeetingInfrom(data);
    }
  }
});

// 用户信息框
const userInfoVisible = ref(false);
const userInfoId = ref(null);
const showButton = ref(true);
const setUserInfoVisible = (x) => {
  userInfoVisible.value = x;
};
const sumbitUserInfo = (userId, showbutton) => {
  // console.log(showButton);
  userInfoId.value = userId;
  showButton.value = showbutton;
  setUserInfoVisible(true);
};

// 将此函数交给子组件使用
provide("showMeetingInfrom", showMeetingInfrom);
provide("sumbitUserInfo", sumbitUserInfo);
onBeforeMount(() => {
  getFriendApplications();
  getMeetingApplications();
  getMeetingInfrom();
});
</script>

<template>
  <div class="inform">
    <el-popover placement="bottom" :width="400" trigger="click">
      <template #reference>
        <el-badge
          :value="store.getters.informSize"
          :hidden="store.getters.informSize == 0"
        >
          <el-icon :size="30"><BellFilled /></el-icon>
        </el-badge>
      </template>
      <inform-main />
    </el-popover>
  </div>
  <!-- 会议公告框 -->
  <el-dialog
    v-model="noticeDialogVisible"
    :title="meetingNotice.title"
    width="30%"
    center
  >
    <div class="notice-content" v-html="meetingNotice.content"></div>
    <p class="tips">
      <span>{{ meetingNotice.sender.name }} </span>编辑于<span>
        {{ meetingNotice.updateTime }}</span
      >
    </p>
  </el-dialog>
  <!-- 用户信息框 -->
  <user-info-by-id
    v-if="userInfoVisible"
    :userInfoVisible="userInfoVisible"
    :userId="userInfoId"
    :showButton="showButton"
    @setUserInfoVisible="setUserInfoVisible"
  />
</template>

<style scoped>
.el-icon:hover {
  /* background-color: yellow; */
  cursor: pointer;
}
.notice-content {
  font-size: large;
}

.tips {
  text-align: end;
  margin-top: 30px;
  color: darkgrey;
}
.tips :nth-child(1) {
  /* font-weight: 800; */
  margin-right: 10px;
}
.tips :nth-child(2) {
  /* font-weight: 800; */
  margin-left: 10px;
}
</style>
