<script setup>
import { ref, onBeforeMount } from "vue";
import axios from "../../js/axios";
import { useRouter } from "vue-router";
const flag = ref(false);
const router = useRouter();
onBeforeMount(() => {
  // console.log(123);
  flag.value = true;
  if (window.localStorage.getItem("adminlogin") != null) {
    router.push("/");
    flag.value = false;
  } else {
    flag.value = true;
  }
});
</script>

<template>
  <div v-if="flag">
    <router-view></router-view>
  </div>
  <div v-else><h1>检测中</h1></div>
</template>

<style scoped></style>
