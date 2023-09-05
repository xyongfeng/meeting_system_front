<script setup>
import { inject, onBeforeMount } from "vue";
import store from "./js/store";
const socket = inject("socket");

// 连接之后发送userInfo
onBeforeMount(() => {
  if (store.getters.userInfo !== null) socket.emit("info", store.getters.userInfo);
});
</script>

<template>
  <router-view></router-view>
</template>

<style scoped></style>
