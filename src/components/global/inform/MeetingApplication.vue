<script setup>
import store from "../../../js/store";
import axios from "../../../js/axios";
import { Delete, Check } from "@element-plus/icons-vue";
import { ref, onMounted, computed, inject } from "vue";
const sumbitUserInfo = inject("sumbitUserInfo");
// 回应请求
const reactRequent = async (inform, result) => {
  await axios
    .post(`/users/meeting/${inform.meeting.id}/application/${inform.users.id}/${result}`)
    .then(() => {
      store.dispatch("getMeetingApplications", { current: 0, size: -1 });
    });
};
</script>

<template>
  <div class="meeting-application">
    <p v-show="store.state.meetingApplications.length == 0" class="empty">
      暂没有会议申请消息
    </p>
    <el-scrollbar max-height="400px"
      ><div
        class="line"
        v-for="(item, index) in store.state.meetingApplications"
        :key="index"
      >
        <span
          ><span class="name"
            ><el-link
              @click="sumbitUserInfo(item.users.id)"
              :underline="false"
              type="primary"
              >{{ item.users.name }}</el-link
            ></span
          >
          申请加入你的会议 <span class="name">{{ item.meeting.name }}</span></span
        ><span class="button-block"
          ><el-button
            type="success"
            :icon="Check"
            @click="reactRequent(item, 1)"
            circle
          ></el-button
          ><el-button :icon="Delete" type="info" @click="reactRequent(item, 0)" circle
        /></span></div
    ></el-scrollbar>
  </div>
</template>

<style scoped>
.empty {
  text-align: center;
}
.line {
  margin: 0 0 0 20px;
  border-bottom: 1px solid var(--el-border-color);
  padding: 10px 0 10px 0;
}
.name {
  font-weight: bold;
}
.button-block {
  margin-left: 10px;
}
</style>
