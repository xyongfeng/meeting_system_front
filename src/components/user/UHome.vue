<script setup>
import { onBeforeMount, ref } from "vue";
import { useRoute } from "vue-router";
import RecordFooter from "../global/RecordFooter.vue";
const route = useRoute();
onBeforeMount(() => {});
</script>

<template>
  <div class="back">
    <el-scrollbar>
      <el-container>
        <el-header
          ><span class="navbar_title">音视频会议系统</span>
          <div>
            <el-menu
              class="el-menu-demo"
              mode="horizontal"
              :ellipsis="false"
              default-active="myMeetingList"
              background-color="black"
              text-color="darkgray"
              active-text-color="white"
              router
            >
              <el-menu-item index="/home/myMeetingList">我的会议</el-menu-item>
              <el-menu-item index="/home/joinedMeetingList">参加的会议</el-menu-item>
              <el-menu-item index="/home/historyMeeting">历史会议</el-menu-item>
            </el-menu>
          </div>
          <global-main />
        </el-header>
        <hr />
        <el-main
          ><div class="main" v-if="route.name !== '会议房间'">
            <div class="title">
              {{ route.name }}
            </div>

            <div class="submain"><router-view /></div>
          </div>
          <div v-else>
            <router-view />
          </div>
          <record-footer/>
        </el-main>
      </el-container>

    </el-scrollbar>

  </div>
</template>

<style scoped>
.back {
  background-color: #f1f1f1;
  height: 100vh;
}
.el-header {
  display: flex;
  background-color: black;
  color: aliceblue;
  /* 往两端对齐 */
  justify-content: space-around;
}
.el-header > .navbar_title {
  font-family: "Lucida Calligraphy", cursive, serif, sans-serif;
  font-size: large;
  padding-top: 20px;
}
.main > .title {
  font-size: 30px;
  padding: 20px 0 30px 0;
  font-family: "Lucida Calligraphy", cursive, serif, sans-serif;
  text-align: center;
}
.el-main {
  padding: 0;
}
.el-main > .main {
  background-color: white;
  width: 80%;
  /* 水平居中 */
  margin: 10px auto;
  /* 圆角 */
  border-radius: 10px;
  /* 阴影 */
  box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.08);
}
.submain {
  height: 68vh;
  width: 95%;
  margin: 0 auto;
}
</style>
