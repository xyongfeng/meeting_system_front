<script setup>
import { onBeforeMount, ref, onMounted } from "vue";
import { initMenu } from "../../../utils/menus";
import store from "../../../js/store";
import router from "../../../js/router";
import axios from "../../../js/axios";
import { getNowTime } from "../../../utils/myUtils";
import * as echarts from "echarts";
import "echarts-wordcloud";
import html2canvas from "html2canvas";
import JsPDF from "jspdf";
const startDateRef = ref();
const allHourRef = ref();
const wordCloudRef = ref();

const initStartDate = () => {
  // 基于准备好的dom，初始化echarts实例
  var myChart = echarts.init(startDateRef.value);
  // 指定图表的配置项和数据
  var option = {
    title: {
      text: "开始日期 x 会议数量",
    },
    tooltip: {},
    legend: {
      data: [],
    },
    xAxis: {
      data: Object.keys(startDate),
    },
    yAxis: {},
    series: [
      {
        name: "会议数量",
        type: "bar",
        data: Object.values(startDate),
        barWidth: 50,
        barCategoryGap: "5%",
      },
    ],
  };
  // 使用刚指定的配置项和数据显示图表。
  myChart.setOption(option);
};

const initAllHourRef = () => {
  // 基于准备好的dom，初始化echarts实例
  var myChart = echarts.init(allHourRef.value);
  // 指定图表的配置项和数据
  var option = {
    tooltip: {
      trigger: "axis",
      axisPointer: {
        type: "cross",
      },
    },
    title: {
      text: "一天中会议开始时间",
    },
    xAxis: {
      type: "category",
      data: Object.keys(allHour),
      axisLabel: {
        interval: 3,
        formatter: "{value} 时",
      },
    },
    yAxis: {
      type: "value",
    },
    series: [
      {
        name: "1",
        data: Object.values(allHour),
        type: "line",
        smooth: true,
      },
    ],
  };
  // 使用刚指定的配置项和数据显示图表。
  myChart.setOption(option);
};

const initWordCloudRef = () => {
  // 基于准备好的dom，初始化echarts实例
  var myChart = echarts.init(wordCloudRef.value);
  var option = {
    title: {
      text: "聊天词云图",
      x: "center",
      y: 15,
      textStyle: {
        fontSize: 25,
      },
    },
    tooltip: { show: true },
    series: [
      {
        name: "聊天词云图",
        type: "wordCloud",
        shape: "circle",
        gridSize: 14,
        sizeRange: [16, 50],
        textRotation: [0, 45, 135, -45], //设置文字倾斜角度
        textPadding: 3,
        autoSize: { enable: true, minSize: 5 },
        textStyle: {
          // 颜色可以用一个函数来返回字符串，这里是随机色
          color: function () {
            // Random color
            return (
              "rgb(" +
              [
                Math.round(Math.random() * 160),
                Math.round(Math.random() * 160),
                Math.round(Math.random() * 160),
              ].join(",") +
              ")"
            );
          },
          emphasis: {
            shadowBlur: 26,
            color: "#333",
            shadowColor: "#ccc",
            fontSize: 20,
          },
        },
        left: "center",
        top: "center",
        width: "70%",
        height: "80%",
        layoutAnimation: true,
        //数据
        data: chatJieba.value,
      },
    ],
  };

  myChart.setOption(option);
};

// 未结束的日期
const startDate = {};
// 结束的日期
const allHour = {};
const getStartDate = async () => {
  await axios.get(`/admins/meeting/startDate`).then((res) => {
    res.data.forEach((item) => {
      if (startDate[item.split("T")[0]] == undefined) startDate[item.split("T")[0]] = 0;
      startDate[item.split("T")[0]]++;
    });
    // console.log(startDate);
    initStartDate();
  });
};

const getAllHour = async () => {
  for (let i = 0; i < 24; i++) allHour[i] = 0;

  await axios.get(`/admins/meeting/allStartDate`).then((res) => {
    res.data.forEach((item) => {
      allHour[item.split("T")[1].split(":")[0]]++;
    });
    // console.log(allHour);
    initAllHourRef();
  });
};

const chatJieba = ref([]);
const getChatJieba = async () => {
  await axios.get(`/admins/meeting/chatJieba`).then((res) => {
    // chatJieba.value = res.data;
    // console.log(123);
    Object.keys(res.data).forEach((item) => {
      chatJieba.value.push({ name: item, value: res.data[item] });
    });
    // console.log(chatJieba.value);
    initWordCloudRef();
  });
};

// 截屏ref
const screenshotRef = ref();
// 截屏
const screenshot = () => {
  let imgHeight = screenshotRef.value.offsetHeight; // 获取DOM高度
  let imgWidth = screenshotRef.value.offsetWidth; // 获取DOM宽度
  let scale = window.devicePixelRatio; // 获取设备像素比

  html2canvas(screenshotRef.value, {
    useCORS: true, // 允许跨域，不加该参数，跨域的图片不会显示
    scale: scale, // 调整清晰度，值越大，清晰度越大
    width: imgWidth,
    height: imgHeight,
  }).then(async (canvas) => {
    let base64 = canvas.toDataURL("image/jpeg");
    console.log(base64);
    var pdf = new JsPDF("", "pt", "a4");
    pdf.addImage(base64, "JPEG", 0, 0, 595.28, (592.28 / canvas.width) * canvas.height);
    pdf.save(`数据统计.${getNowTime()}.pdf`);
  });
};

const stopword = ref("");
const stopwordVisable = ref(false);

// 停用词
const sumbitUpdateStopword = async () => {
  stopwordVisable.value = true;
  await axios.get("/admins/meeting/chatJieba/stopword").then((res) => {
    stopword.value = res.data.join("\n");
  });
};
// 保存停用词
const updateStopword = async () => {
  let words = stopword.value.split("\n").filter((item) => {
    return item != "";
  });

  await axios.put("/admins/meeting/chatJieba/stopword", words);
  stopwordVisable.value = false;
};

onMounted(() => {
  getStartDate();
  getAllHour();
  getChatJieba();
});
</script>

<template>
  <div style="margin-top: 10px">
    <el-button @click="screenshot" type="success">导出PDF</el-button>
    <el-button @click="sumbitUpdateStopword" type="primary">设置停用词</el-button>
  </div>
  <div style="margin-top: 10px" ref="screenshotRef">
    <div ref="startDateRef" class="class1"></div>
    <div ref="allHourRef" class="class1"></div>

    <div ref="wordCloudRef" style="width: 80%; height: 500px"></div>
  </div>
  <el-dialog v-model="stopwordVisable" title="停用词">
    <el-input v-model="stopword" :rows="15" type="textarea" style="heigh: 50vh" />
    <div style="text-align: center">
      <el-button type="primary" style="margin-top: 10px" @click="updateStopword"
        >保存</el-button
      >
    </div>
  </el-dialog>
</template>

<style scoped>
.class1 {
  width: 50%;
  height: 400px;
  display: inline-block;
}
</style>
