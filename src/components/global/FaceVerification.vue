<script setup>
import axios from "../../js/axios";

import { ref } from "vue";
// 父传子
const props = defineProps({
  successAction: { type: Function, default: null },
  uncloseable: { type: Boolean, default: false },
});

const faceVerificationRef = ref();
const faceVerificationVisible = ref(false);
const faceAccess = ref(false);

const getFaceAccess = () => {
  return faceAccess.value;
};

const setFaceVerificationVisible = (value) => {
  faceVerificationVisible.value = value;
};
const faceVerification = async () => {
  // console.log(takePhotoRef.value.getImgBase64());
  await axios
    .post(`/users/faceVerification`, {
      imgBase64: faceVerificationRef.value.getImgBase64(),
    })
    .then((res) => {
      faceVerificationRef.value.stopLoading();
      if (res.code == 200) {
        // 成功之后
        faceVerificationRef.value.beforeClose();
        // 开放其他按钮
        faceAccess.value = true;
        // 执行进入房间等操作
        if (props.successAction) props.successAction();
      } else {
        faceAccess.value = false;
      }
    })
    .catch((e) => {
      console.log(e);
    });
};

// 子传父
defineExpose({ getFaceAccess, setFaceVerificationVisible });
</script>

<template>
  <div class="face-verification">
    <take-photo
      ref="faceVerificationRef"
      v-if="faceVerificationVisible"
      title="验证身份"
      :sendAction="faceVerification"
      :closeView="() => setFaceVerificationVisible(false)"
      :uncloseable="props.uncloseable"
    />
  </div>
</template>

<style scoped></style>
