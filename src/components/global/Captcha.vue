<script setup>
import { ref, onMounted } from "vue";
// 方法 父传子
const props = defineProps({
  clearCode: {
    type: Function,
    default: Function,
  },
});

const captchaUrl = ref("");

const updateCaptcha = () => {
  captchaUrl.value = "/api/captcha?date=" + new Date();
  //   user.code = "";
  props.clearCode();
};
onMounted(() => {
  updateCaptcha();
});
// 子传父
defineExpose({ updateCaptcha });
</script>

<template>
  <img :src="captchaUrl" @click="updateCaptcha" />
</template>

<style scoped></style>
