<script setup>
import { onBeforeMount } from "vue";
import { initMenu } from "../../utils/menus";
import store from "../../js/store";
import router from "../../js/router";

onBeforeMount(() => {
  initMenu(router, store);
});
</script>

<template>
  <router-view></router-view>
</template>

<style scoped></style>
