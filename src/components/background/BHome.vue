<script setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "vuex";
import {
  ArrowRight,
  User,
  Comment,
  Filter,
  Histogram,
  View,
  Postcard,
} from "@element-plus/icons-vue";
import axios from "../../js/axios";
const router = useRouter();
const store = useStore();
const admin = computed(() => {
  return store.getters.userInfo;
});
const icons = {
  User: User,
  Comment: Comment,
  Filter: Filter,
  View: View,
  Histogram: Histogram,
  Postcard: Postcard,
};
</script>

<template>
  <div class="common-layout">
    <el-container>
      <el-aside width="200px">
        <h4>后台管理</h4>
        <el-menu
          active-text-color="#ffd04b"
          class="el-menu-vertical-demo"
          background-color="#525a67"
          text-color="#fff"
          router
        >
          <el-menu-item
            :index="`/admin/home` + item.children[0].path"
            v-for="(item, index) in store.state.routes"
            :key="index"
          >
            <template #title>
              <el-icon><component :is="icons[item.iconCls]"></component></el-icon>
              <span>{{ item.children[0].name }}</span>
            </template>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-container>
        <el-header>
          <!-- 个人中心下拉框 -->
          <!-- <my-head-image /> -->
          <global-main />
        </el-header>
        <el-main>
          <el-breadcrumb
            v-if="router.currentRoute.value.path != '/admin/home'"
            :separator-icon="ArrowRight"
          >
            <el-breadcrumb-item :to="{ path: '/admin/home' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ router.currentRoute.value.name }}</el-breadcrumb-item>
          </el-breadcrumb>

          <div v-if="router.currentRoute.value.path == '/admin/home'">
            <!-- <h1 class="welcomeHome">欢迎来到基于Vue&Springboot&Tensorflow框架的</h1> -->
            <h1 class="welcomeHome">音视频会议系统后台管理</h1>
          </div>
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<style scoped>
.global-main {
  margin-left: auto;
  /* text-align: right; */
}
.el-container {
  height: 100vh;
}
.el-aside {
  background: #525a67;
  color: white;
}
.el-aside > h4 {
  text-align: center;
}
.el-header {
  border-bottom: 2px solid #ededed;
  background-color: #f9f9f9;
  padding: 0 15px;
  /* box-sizing: border-box; */
  text-align: right;
}
.el-main {
  background: #f9f9f9;
}
/* .el-dropdown-link img {
  width: 48px;
  height: 48px;
  border-radius: 24px;
} */

.welcomeHome {
  text-align: center;
  font-size: 30px;
  font-family: Arial, Helvetica, sans-serif;
}
</style>
