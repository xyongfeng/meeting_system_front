<script setup>
import store from "../../../js/store";
import axios from "../../../js/axios";
import { Delete, Check } from "@element-plus/icons-vue";
import { ref, onMounted, computed, inject } from "vue";
const sumbitUserInfo = inject("sumbitUserInfo");
// 回应请求
const reactRequent = async (inform, result) => {
  await axios.post(`/users/friend/application/${inform.fromId}/${result}`).then(() => {
    if (result == 1) {
      store.dispatch("getFriendsAndChats", { current: 0 });
    }
    store.dispatch("getFriendApplications", { current: 0, size: -1 });
  });
};
</script>

<template>
  <div class="friend-application">
    <p v-show="store.state.friendApplications.length == 0" class="empty">
      暂没有申请消息
    </p>
    <el-scrollbar max-height="400px">
      <div
        class="line"
        v-for="(item, index) in store.state.friendApplications"
        :key="index"
      >
        <span
          ><span class="user-name"
            ><el-link
              @click="sumbitUserInfo(item.fromer.id, false)"
              :underline="false"
              type="primary"
              >{{ item.fromer.name }}</el-link
            ></span
          >
          申请与你添加为好友</span
        ><span class="button-block"
          ><el-button
            type="success"
            :icon="Check"
            @click="reactRequent(item, 1)"
            circle
          ></el-button
          ><el-button :icon="Delete" type="info" @click="reactRequent(item, 0)" circle
        /></span>
      </div>
    </el-scrollbar>
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
.user-name {
  font-weight: bold;
}
.button-block {
  margin-left: 80px;
}
</style>
