<script setup>
import router from "../../../js/router";
import store from "../../../js/store";
import { ref } from "vue";

const activeName = ref("first");
</script>

<template>
  <el-tabs v-model="activeName" type="card" class="demo-tabs">
    <el-tab-pane name="first">
      <template #label>
        <el-badge :is-dot="store.state.friendApplications.length > 0">
          <span>好友申请</span>
        </el-badge>
      </template>

      <friend-application
    /></el-tab-pane>

    <el-tab-pane name="second">
      <template #label>
        <el-badge :is-dot="store.state.meetingApplications.length > 0">
          <span>会议申请</span>
        </el-badge>
      </template>
      <meeting-application />
    </el-tab-pane>
    <el-tab-pane label="会议通知" name="third">
      <template #label>
        <el-badge :is-dot="store.state.meetingInfrom.length > 0">
          <span>会议通知</span>
        </el-badge> </template
      ><meeting-inform
    /></el-tab-pane>
  </el-tabs>
</template>

<style scoped></style>
