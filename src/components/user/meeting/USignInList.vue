<script setup>
import axios from "../../../js/axios";
import { ref, onBeforeMount, onBeforeUnmount, computed, reactive, onMounted } from "vue";
import { Remove, Refresh } from "@element-plus/icons-vue";
import { getNowTime, myLocalInfo, showExistMinute } from "../../../utils/myUtils";
// 父传子
const props = defineProps({
  meetingId: { type: String },
  signInListVisible: { type: Boolean, default: false },
});
// 子传父
const emits = defineEmits(["setSignInListVisible"]);

const meetingId = ref(props.meetingId);
const signInListVisible = ref(props.signInListVisible);

const myInfo = reactive(myLocalInfo());
const signInList = ref([]);
const userStateList = ref([]);
const meetingInfo = ref({});
const excelData = ref([]);

const excelFields = reactive({
  名称: "name",
  签到时间: "hadSignInTime",
  参会累计时长: "existMinute",
});
const excelHeader = ref("");

var current = 0,
  size = -1;

// 获得该会议已经签到的用户列表
const updateSignInList = async () => {
  await axios
    .get(`/users/meeting/${meetingId.value}/hadSignIn/${current}/${size}`)
    .then((res) => {
      // console.log(res);
      signInList.value = res.data.records;
    })
    .catch((e) => {});
};

const getmeetingInfo = async () => {
  let res = await axios.get(`/users/meeting/${meetingId.value}`);
  meetingInfo.value = res.data;
  excelHeader.value = `${meetingInfo.value.startDate} 至 ${getNowTime()}`;
  // console.log(meetingInfo.value);
};

const getUserStateList = async () => {
  await axios
    .get(`/users/meeting/${meetingId.value}/userState/${current}/${size}`)
    .then((res) => {
      // console.log(res.data.records);
      userStateList.value = [];
      // userStateList.value = res.data.records;

      res.data.records.forEach((item) => {
        if (item.isFounder) return;
        userStateList.value.push({
          usersId: item.usersId,
          name: item.users.name,
          hadSignInTime: item.hadSignIn ? item.hadSignInTime.replace("T", " ") : "未签到",
          existMinute: showExistMinute(item.existMinute),
          hadMuted: item.hadMuted,
          hadBanup: item.hadBanup,
        });
      });

      excelData.value = [];

      userStateList.value.forEach((item) => {
        excelData.value.push({
          name: item.name,
          hadSignInTime: item.hadSignInTime,
          existMinute: item.existMinute,
        });
      });
      // console.log(excelData.value);
    });
};

const closeVisible = () => {
  emits("setSignInListVisible", false);
};

// 用户信息框
const userInfoVisible = ref(false);
const userInfoId = ref(null);
const setUserInfoVisible = (x) => {
  userInfoVisible.value = x;
};
const sumbitUserInfo = (userId) => {
  userInfoId.value = userId;
  setUserInfoVisible(true);
};

const hadChange = ref(false);

const submitChang = (item) => {
  hadChange.value = true;
  item["change"] = true;
};

const sumbitChangeReq = async () => {
  let changeState = [];
  userStateList.value.forEach((item) => {
    if (item.change) {
      changeState.push({
        userId: item.usersId,
        hadMuted: item.hadMuted,
        hadBanup: item.hadBanup,
      });
    }
  });

  await axios.post(`/users/meeting/${meetingId.value}/userState`, {
    list: changeState,
  });

  console.log(changeState);
};

const banUser = async (userId) => {
  await axios.delete(`/users/meeting/${meetingId.value}/userState/${userId}`).then(() => {
    getUserStateList();
  });
};

const beforeMount = () => {
  hadChange.value = false;
  userStateList.value = [];
  getmeetingInfo();
  getUserStateList();
};

onBeforeMount(() => {
  // updateSignInList();
  beforeMount();
});
onBeforeUnmount(() => {
  closeVisible();
});
</script>

<template>
  <div class="signInListDialog">
    <el-dialog
      v-model="signInListVisible"
      width="50%"
      :center="true"
      :before-close="closeVisible"
    >
      <template #header>
        <span>成员列表</span
        ><el-button
          style="margin-left: 4px"
          type="info"
          :icon="Refresh"
          circle
          @click="beforeMount"
        />
      </template>
      <div class="header">
        <vue3-json-excel
          :json-data="excelData"
          :fields="excelFields"
          type="'xls"
          :name="`${meetingInfo.name}参会成员考勤表.xls`"
          :header="excelHeader"
        >
          <el-button type="success">导出表格</el-button>
        </vue3-json-excel>
      </div>

      <div class="content">
        <el-table :data="userStateList" max-height="350px">
          <el-table-column type="index" label="#" width="50" />
          <el-table-column label="名称" width="100">
            <template #default="scope"
              ><el-link
                @click="sumbitUserInfo(scope.row.usersId)"
                :underline="false"
                type="primary"
                >{{ scope.row.name }}</el-link
              ></template
            >
          </el-table-column>
          <el-table-column prop="existMinute" label="参会累计时长" />

          <el-table-column prop="hadSignInTime" label="签到时间" width="200" />

          <el-table-column label="禁止开麦" width="100">
            <template #default="scope">
              <el-switch v-model="scope.row.hadMuted" @change="submitChang(scope.row)" />
            </template>
          </el-table-column>

          <el-table-column label="禁止投屏" width="100">
            <template #default="scope">
              <el-switch v-model="scope.row.hadBanup" @change="submitChang(scope.row)" />
            </template>
          </el-table-column>

          <el-table-column label="踢出会议">
            <template #default="scope">
              <el-button
                type="danger"
                :icon="Remove"
                circle
                @click="banUser(scope.row.usersId)"
              />
            </template>
          </el-table-column>
        </el-table>
        <div style="text-align: center; margin-top: 10px">
          <el-button v-show="hadChange" type="primary" @click="sumbitChangeReq"
            >修改</el-button
          >
        </div>
      </div>
    </el-dialog>
    <!-- 参会人信息框 -->
    <user-info-by-id
      v-if="userInfoVisible"
      :userInfoVisible="userInfoVisible"
      :userId="userInfoId"
      @setUserInfoVisible="setUserInfoVisible"
    />
  </div>
</template>

<style scoped>
.content {
  height: 50vh;
}
</style>
