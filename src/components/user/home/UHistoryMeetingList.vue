<script setup>
import { ref, reactive, onBeforeMount, computed } from "vue";
import {
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
  SearchOutlined,
  LoginOutlined,
} from "@ant-design/icons-vue";
import { SwitchButton } from "@element-plus/icons-vue";
import axios from "../../../js/axios";
import {
  convetFormNull,
  myLocalInfo,
  isExistMeeting,
  showExistMinute,
} from "../../../utils/myUtils";

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

// 会议信息框
const meetingInfoVisible = ref(false);
const meetingInfoId = ref(null);
const setMeetingInfoVisible = (x) => {
  meetingInfoVisible.value = x;
};

const sumbitMeetingInfo = (meetingId) => {
  // console.log(meetingId);
  meetingInfoId.value = meetingId;
  setMeetingInfoVisible(true);
};

const meetList = ref([]);
const getHistoryMeeting = async () => {
  let res = await axios.get(`/users/meeting/history`);
  meetList.value = [];
  meetListTemp.value = [];
  //   console.log(res.data.records);

  res.data.records.forEach((value, index, array) => {
    meetList.value.push({
      id: value.id,
      name: value.name,
      owner: value.users.name,
      startDate: value.startDate,
      endDate: value.endDate,
      ownerId: value.users.id,
    });
  });
  //   console.log(meetList.value);
};

const delMeetReq = async (meet) => {
  await axios.delete(`/users/meeting/history/${meet.id}`).then(() => {
    getHistoryMeeting();
  });
};

// 选择字段搜索
const searchType = ref("");
// 查询的关键字
const searchValue = ref("");
// 用户列表备份
const meetListTemp = ref([]);
// 时间范围搜索
const searchDateTime = ref("");

const searchOptions = [
  { label: "会议号", value: "id" },
  { label: "会议名", value: "name" },
  { label: "主持人", value: "owner" },
  { label: "开始时间", value: "startDate" },
  { label: "结束时间", value: "endDate" },
];
const search = () => {
  if (searchType.value === "") {
    ElMessage.warning("请选择要搜索的字段");
    return;
  }

  searching.value = true;
  if (meetListTemp.value.length == 0) meetListTemp.value = meetList.value;

  meetList.value = meetListTemp.value.filter((value, index, array) => {
    return value[searchType.value] && value[searchType.value].includes(searchValue.value);
  });
};
const searching = ref(false);
const resetSearch = () => {
  searchType.value = "";
  searchValue.value = "";
  meetList.value = meetListTemp.value;
  searching.value = false;
  searchDateTime.value = "";
};

// 日期时间范围搜索
const searchByDate = () => {
  if (meetListTemp.value.length == 0) meetListTemp.value = meetList.value;

  if (searchDateTime.value[0] == undefined && searchDateTime.value[1] == undefined) {
    meetList.value = meetListTemp.value;
    return;
  }
  searching.value = true;
  var start = searchDateTime.value[0];
  var end = searchDateTime.value[1];
  meetList.value = meetListTemp.value.filter((value, index, array) => {
    // console.log(value[searchType.value], searchType.value, value);
    if (value[searchType.value]) {
      var now = new Date(value[searchType.value]);
      return start <= now && now <= end;
    }
    return false;
  });
};

onBeforeMount(() => {
  getHistoryMeeting();
});
</script>

<template>
  <div class="table-header">
    <el-select
      v-model="searchType"
      placeholder="选择字段"
      style="width: 120px"
      max-height="400"
    >
      <el-option
        v-for="item in searchOptions"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </el-select>
    <div
      v-if="searchType == 'startDate' || searchType == 'endDate'"
      style="display: inline-block; margin-right: 10px"
    >
      <el-date-picker
        v-model="searchDateTime"
        type="datetimerange"
        range-separator="~"
        start-placeholder="输入开始时间"
        end-placeholder="输入结束时间"
        size="small"
      />
      <el-button :icon="SearchOutlined" @click="searchByDate"></el-button>
    </div>
    <el-input
      v-else
      placeholder="请输入搜索关键字"
      v-model="searchValue"
      @keyup.enter="search"
    >
      <template #append>
        <el-button :icon="SearchOutlined" @click="search"></el-button>
      </template>
    </el-input>
    <el-button v-show="searching" @click="resetSearch">恢复列表</el-button>
  </div>
  <div class="u-history-meeting-list">
    <el-table :data="meetList" style="width: 100%" max-height="400">
      <el-table-column type="index" width="50" label="#" />
      <el-table-column prop="id" label="会议号" width="200" />
      <el-table-column prop="name" label="会议名" />
      <el-table-column prop="owner" label="主持人">
        <template #default="scope"
          ><el-link
            @click="sumbitUserInfo(scope.row.ownerId)"
            :underline="false"
            type="primary"
            >{{ scope.row.owner }}</el-link
          ></template
        >
      </el-table-column>
      <el-table-column prop="startDate" label="开始时间" sortable />
      <el-table-column prop="endDate" label="结束时间" sortable />
      <el-table-column label="操作">
        <template #default="scope">
          <el-button-group>
            <el-button
              type="primary"
              size="small"
              :icon="LoginOutlined"
              @click="sumbitMeetingInfo(scope.row.id)"
              >详情</el-button
            >
            <el-button
              type="danger"
              size="small"
              :icon="DeleteOutlined"
              @click="delMeetReq(scope.row)"
              >删除</el-button
            >
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>
    <!-- 参会人信息框 -->
    <user-info-by-id
      v-if="userInfoVisible"
      :userInfoVisible="userInfoVisible"
      :userId="userInfoId"
      @setUserInfoVisible="setUserInfoVisible"
    />
  </div>

  <meeting-info-by-id
    v-if="meetingInfoVisible"
    :meetingId="meetingInfoId"
    :meetingInfoVisible="meetingInfoVisible"
    @setMeetingInfoVisible="setMeetingInfoVisible"
  />
</template>

<style scoped>
.table-header {
  margin-top: 20px;
  margin-bottom: 20px;
}
.table-header .el-input {
  width: 300px;
  margin-right: 20px;
}
</style>
