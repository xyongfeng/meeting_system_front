<script setup>
import axios from "axios";
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import { ElLoading } from "element-plus";
// 父传子
const props = defineProps({
  title: { type: String, default: "" },
  sendAction: { type: Function, default: Function },
  closeView: { type: Function, default: Function, equired: true },
  uncloseable: { type: Boolean, default: false },
});
const title = ref(props.title);
const viewVisible = ref(true);
// canvas控件对象
const canvasDom = ref(null);
// video 控件对象
const videoDom = ref(null);

// 照片路径
const imgurl = ref("");

const takeMsg = computed(() => {
  return imgurl.value ? "重拍" : "拍照";
});
const openCamera = () => {
  if (navigator.mediaDevices) {
    navigator.mediaDevices
      // 开启视频，关闭音频
      .getUserMedia({ audio: false, video: true })
      .then((stream) => {
        // 将视频流传入viedo控件
        // console.log("openCamera", videoDom.value);
        videoDom.value.srcObject = stream;
        videoDom.value.play();
        // console.log(videoDom.value.srcObject);
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    ElMessage.warning("该浏览器不支持开启摄像头，请更换最新版浏览器");
  }
};
// 拍照
const takePhoto = () => {
  if (imgurl.value !== "") {
    imgurl.value = "";
    // openCamera();
    return;
  }

  canvasDom.value.width = videoDom.value.videoWidth;
  canvasDom.value.height = videoDom.value.videoHeight;
  //   console.log(videoDom.value.videoWidth, videoDom.value.videoHeight);
  canvasDom.value.getContext("2d").drawImage(videoDom.value, 0, 0);
  imgurl.value = canvasDom.value.toDataURL("image/jpeg", 1);
  // stop();
};
// 关闭摄像头
const stop = () => {
  let stream = videoDom.value.srcObject;
  //   console.log(stream);
  if (!stream) return;
  let tracks = stream.getTracks();
  //   console.log(tracks);
  tracks.forEach((x) => {
    x.stop();
  });
};
const imgBase64 = ref(null);
const getImgBase64 = () => {
  return imgBase64.value;
};

var loading = null;
// 发送照片
const sendPhoto = async () => {
  let s = imgurl.value;

  if (s === "") {
    ElMessage.error("确定之前先拍照");
    return;
  }
  imgBase64.value = s.substr(s.indexOf(",") + 1);
  if (!imgBase64.value) {
    ElMessage.warning("图像损坏,请重新进行拍照");
    return;
  }

  loading = ElLoading.service({
    text: "计算特征中...",
  });
  props.sendAction();
};
const stopLoading = () => {
  loading.close();
};

const beforeClose = () => {
  stop();
  props.closeView();
};
onMounted(() => {
  openCamera();
});
onBeforeUnmount(() => {
  beforeClose();
});
// 子传父
defineExpose({ getImgBase64, beforeClose, stopLoading });
</script>

<template>
  <div class="signInDialog">
    <el-dialog
      v-model="viewVisible"
      width="45%"
      top="5vh"
      :title="title"
      :center="true"
      :before-close="beforeClose"
      :show-close="!uncloseable"
      :close-on-click-modal="!uncloseable"
      :close-on-press-escape="!uncloseable"
    >
      <div class="sigin_block">
        <!-- 画板 -->
        <canvas style="display: none" ref="canvasDom" />
        <!-- 播放器，用来播放拍摄的视频 -->
        <video v-show="!imgurl" class="camera_video" ref="videoDom" />
        <img v-show="imgurl" :src="imgurl" class="camera_video" />
        <br />
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="takePhoto">{{ takeMsg }}</el-button>
          <el-button type="success" :disabled="!imgurl" @click="sendPhoto"
            >确定</el-button
          >
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.sigin_block {
  width: 640px;
  height: 480px;
  /* margin: 0 auto; */
}
.camera_video {
  width: 100%;
  height: 100%;
  /* border: 2px black solid; */
  margin-left: 40px;
}
</style>
