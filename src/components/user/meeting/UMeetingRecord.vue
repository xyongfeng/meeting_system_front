<template>
  <el-button @click="startR">{{ startTxt }}</el-button>

</template>

<script setup>
import RecordRTC from 'recordrtc';
import {ref} from "vue";
const props = defineProps(["meetingName"]);

const startTxt = ref("开启录制");
let start = null;
let recorder = {};

//开始录制
const startR = () => {
  startRecording((value) => {
    start = value;
  });
}

const startRecording = (callback) => {
  if (startTxt.value === "开启录制") {
    captureScreen((screenStream) => {
      addStreamStopListener(screenStream, () => {
        console.log("流停止监听");
        // 可执行子组件回调
        stopFn();
      });
      startTxt.value = "关闭录制";
      var options = {
        type: "video",
        mimeType: "video/mp4",
        disableLogs: false, // 日志开关
        getNativeBlob: false,
        ignoreMutedMedia: false,
      };
      recorder = RecordRTC(screenStream, options);
      recorder.startRecording();
      recorder.screen = screenStream;
      callback(true);
    });
  } else if (startTxt.value === "关闭录制") {
    stopFn();
  }
}

/**
 * 完成录制
 */
const stopFn = () => {
  startTxt.value = "开启录制";
  stopRecording((value) => {
    start = value;
  });
}

/**
 * 完成录制回调
 */
const stopRecording = (callback) => {
  recorder && recorder.stopRecording(() => {
    const fileName = props.meetingName;
    const url = URL.createObjectURL(recorder.getBlob());
    const aTag = document.createElement("a");

    document.body.appendChild(aTag);
    aTag.style.display = "none";
    aTag.href = url;
    // 停止录屏时同时下载到本地
    aTag.download = fileName + "会议录屏.mp4";
    aTag.click();
    recorder.screen.stop();
    recorder.destroy();
    recorder = null;

    callback(false);
  });
}

//初始化录制
const captureScreen = (callback) => {
  if (navigator.getDisplayMedia) {
    //录制结束,文件下载
    navigator
        .getDisplayMedia({
          video: true,
          audio: true,
        })
        .then((screenStream) => {
          navigator.mediaDevices
              .getUserMedia({video: true, audio: true})
              .then((mic) => {
                screenStream.addTrack(mic.getTracks()[0]);
                callback(screenStream);
              });
        })
        .catch(function (error) {
          console.log("error", error);
        });
  } else if (navigator.mediaDevices.getDisplayMedia) {
    navigator.mediaDevices
        .getDisplayMedia({
          video: true,
          audio: true,
        })
        .then((screenStream) => {
          navigator.mediaDevices.getUserMedia({audio: true}).then((mic) => {
            screenStream.addTrack(mic.getTracks()[0]);
            callback(screenStream);
          });
        })
        .catch(function (error) {
          console.log("error", error);
        });
  } else {
    var error = "getDisplayMedia API are not supported in this browser.";
    console.log("error", error);
    alert(error);
  }
}

//流监听
const addStreamStopListener = (stream, callback) => {
  stream.addEventListener(
      "ended",
      function () {
        callback();
        callback = function () {
        };
      },
      false
  );
  stream.addEventListener(
      "inactive",
      function () {
        callback();
        callback = function () {
        };
      },
      false
  );
  stream.getTracks().forEach(function (track) {
    track.addEventListener(
        "ended",
        function () {
          callback();
          callback = function () {
          };
        },
        false
    );
    track.addEventListener(
        "inactive",
        function () {
          callback();
          callback = function () {
          };
        },
        false
    );
  });
}

</script>

<style>
</style>

