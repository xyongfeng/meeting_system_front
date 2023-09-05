<script setup>
import { onBeforeMount, computed, ref } from "vue";
import { ArrowDown } from "@element-plus/icons-vue";
import { useRoute } from "vue-router";
import store from "../../js/store";
import router from "../../js/router";

import axios from "../../js/axios";

import { logout, sleep } from "../../utils/myUtils";
const route = useRoute();
// 从全局变量容器获取用户信息
const user = ref(store.getters.userInfo);
// 现在是否为管理界面
const isAdminUrl = ref(route.fullPath.startsWith("/admin"));
// 用户是否有管理权限
const isAdmin = ref(user.value.isAdmin && user.value.perms.length > 1);

// 跳转前台或后台
const jump = () => {
  // 两边都要刷新清除socket
  if (!isAdminUrl.value) {
    router.replace(`/admin`).then(() => {
      location.reload();
    });
  } else {
    router.replace(`/`).then(() => {
      location.reload();
    });
  }
};

// 跳转个人中心
const userCenter = () => {
  router.replace(`/home/userCenter/${user.value.id}`);
};

// 跳转意见反馈
const userAdvice = () => {
  router.replace(`/home/userAdvice`);
};

// 退出登录
const toLogout = async () => {
  if (route.fullPath.startsWith("/admin")) window.localStorage.setItem("nextAdmin", true);

  logout();
};
</script>

<template>
  <!-- <news /> -->
  <div class="my-head-image">
    <el-dropdown type="primary">
      <span class="el-dropdown-link">
        <el-avatar :size="50" :src="user.headImage" />
        <el-icon class="el-icon--right" color="white" size="20px"
          ><arrow-down style="padding-bottom: 10px"
        /></el-icon>
      </span>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item disabled>{{ user.name }}</el-dropdown-item>

          <el-dropdown-item divided @click="jump" v-if="isAdmin">{{
            !isAdminUrl ? "切换后台" : "切换前台"
          }}</el-dropdown-item>

          <el-dropdown-item :divided="!isAdmin" @click="userCenter" v-if="!isAdminUrl"
            >个人中心</el-dropdown-item
          >
          <el-dropdown-item v-if="!isAdminUrl" @click="userAdvice"
            >意见反馈</el-dropdown-item
          >
          <el-dropdown-item @click="toLogout">退出登录</el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<style scoped>
.el-dropdown-item {
  text-align: center;
}
</style>
