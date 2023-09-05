<script setup>
import axios from "../../js/axios";
import store from "../../js/store";
import {
  addImagePath,
  applyFriend,
  myLocalInfo,
  showExistMinute,
} from "../../utils/myUtils";
import { ref, onBeforeMount, onBeforeUnmount, computed, reactive, onMounted } from "vue";
// 父传子
const props = defineProps({
  meetingId: { type: String },
  meetingInfoVisible: { type: Boolean, default: false },
});
// 子传父
const emits = defineEmits(["setMeetingInfoVisible"]);

const meetingId = ref(props.meetingId);
const meetingInfoVisible = ref(props.meetingInfoVisible);
const myInfo = ref(myLocalInfo());

const meetingInfo = reactive({
  id: null,
  name: "",
  userId: "",
  startDate: "",
  endDate: "",
});

const meetingUsers = ref({});
const noticeList = ref([]);

const getMeetingInfo = async () => {
  //   console.log("getMeetingInfo", meetingId.value);
  await axios.get(`/users/meeting/${meetingId.value}`).then((res) => {
    if (res.code == 200) {
      meetingInfo.id = res.data.id;
      meetingInfo.name = res.data.name;
      meetingInfo.userId = res.data.userId;
      meetingInfo.startDate = res.data.startDate;
      meetingInfo.endDate = res.data.endDate;
    }
  });

  await axios
    .get(`/users/meeting/${meetingId.value}/userState/${myInfo.value.id}`)
    .then((res) => {
      if (res.data) {
        // console.log(res);
        meetingUsers.value = res.data;
      }
    });

  await axios.get(`/users/meeting/${props.meetingId}/notice/${0}/${-1}`).then((res) => {
    noticeList.value = res.data.records;
    // console.log(noticeList.value);
  });
};

const closeVisible = () => {
  emits("setMeetingInfoVisible", false);
};

onBeforeMount(() => {
  getMeetingInfo();
});

onBeforeUnmount(() => {
  closeVisible();
});
</script>

<template>
  <div class="meeting-info-by-id">
    <el-dialog
      v-model="meetingInfoVisible"
      :title="meetingInfo.name"
      width="40%"
      :center="true"
      :before-close="closeVisible"
    >
      <div>
        <div>
          <h3>会议持续时间：{{ meetingInfo.startDate }} 至 {{ meetingInfo.endDate }}</h3>
          <div v-if="meetingInfo.userId != myInfo.id">
            <h3>参会累计时长：{{ showExistMinute(meetingUsers.existMinute) }}</h3>
            <h3>
              签到时间：{{
                meetingUsers.hadSignIn ? meetingUsers.hadSignInTime : "未签到"
              }}
            </h3>
          </div>
          <br />
          <h3 style="text-align: center">历史公告</h3>
          <el-scrollbar max-height="300px">
            <!-- <el-space direction="vertical" style="width: 100%" fill> -->
            <div v-for="(item, index) in noticeList" :key="index">
              <el-card shadow="always" class="one-notice" v-if="!item.hidden">
                <template #header>
                  <div class="card-header">
                    <span class="notice-title">{{ item.title }}</span>
                  </div>
                </template>
                <div class="notice-content" v-html="item.content"></div>
                <div class="tips">
                  <el-row :gutter="20">
                    <el-col :span="18"
                      ><span class="update-time"
                        >{{ item.sender.name }} 编辑于 {{ item.updateTime }}</span
                      ></el-col
                    >
                  </el-row>
                </div>
              </el-card>
            </div>
            <!-- </el-space> -->
          </el-scrollbar>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.one-notice {
  margin-bottom: 10px;
}
.tips {
  margin-top: 15px;
  height: 15px;
}
.update-time {
  font-size: 13px;
  color: darkgrey;
}
</style>
