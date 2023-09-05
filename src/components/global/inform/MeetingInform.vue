<script setup>
import store from "../../../js/store";
import axios from "../../../js/axios";
import { Delete, Check } from "@element-plus/icons-vue";
import { ref, onMounted, computed, reactive, inject } from "vue";
const showMeetingInfrom = inject("showMeetingInfrom");
</script>

<template>
  <div class="meeting-inform">
    <p v-show="store.state.meetingInfrom.length == 0" class="empty">暂没有会议通知消息</p>
    <el-scrollbar max-height="400px">
      <div class="line" v-for="(item, index) in store.state.meetingInfrom" :key="index">
        <el-link :underline="false" @click="showMeetingInfrom(item, index)">
          <div style="width: 400px">
            <div style="text-align: center">
              <span>{{ item.title }}</span>
            </div>
            <div style="text-align: end">--{{ item.meeting.name }}</div>
          </div>
        </el-link>
      </div>
    </el-scrollbar>
  </div>
</template>

<style scoped>
.empty {
  text-align: center;
}
.line {
  /* margin: 0 0 0 20px; */
  border-bottom: 1px solid var(--el-border-color);
  padding: 10px 0 10px 0;
}
</style>
