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
import { convetFormNull, myLocalInfo, isExistMeeting } from "../../../utils/myUtils";
import { useRouter } from "vue-router";
import { range } from "lodash";

const router = useRouter();
// 父组件传值 一个是管理员获取会议是获取所有人的，一个是用户获取自己创建的
const props = defineProps({
  isAdmin: { type: Boolean, default: true },
});
// 访问者身份
const identity = computed(() => (props.isAdmin ? "admins" : "users"));

// 本人用户
const owner = reactive(myLocalInfo());
// 会议列表
const meetList = ref([]);
// 当前页码
const currentPage = ref(1);
// 页面大小
const pageSize = ref(-1);

// 会议编辑表单
const insertEditForm = reactive({
  id: "",
  name: "",
  startDate: "",
  haveLicence: false,
  maxNumber: 50,
  needFace: false,
  password: "",
  passEnabled: false,
});
const updateEditForm = reactive({
  id: "",
  name: "",
  startDate: "",
  haveLicence: false,
  maxNumber: "",
  needFace: false,
  password: "",
  passEnabled: false,
});
const meetingRules = reactive({
  name: [
    { required: true, message: "会议名不能为空" },
    { max: 20, message: "会议名长度不能大于20" },
  ],
  password: [{ max: 20, message: "密码长度不能大于20" }],
});

// 创建会议对话框展示
const insertMeetVisible = ref(false);

const insertMeetFormRef = ref(null);

// 修改会议对话框展示
const updateMeetVisible = ref(false);

const updateMeetFormRef = ref(null);

// 切换许可与密码
const sumbitHaveLicenceOrPass = (editForm, isPass) => {
  let flag = editForm.haveLicence && editForm.passEnabled;
  if (isPass && flag) {
    editForm.haveLicence = false;
  } else if (!isPass && flag) {
    editForm.passEnabled = false;
  }
};

const getMeets = async () => {
  let { data: res } = await axios.get(
    `/${identity.value}/meeting/${currentPage.value}/${pageSize.value}`
  );
  meetList.value = [];
  meetListTemp.value = [];
  res.records.forEach((value, index, array) => {
    if (!value.end) {
      meetList.value.push({
        id: value.id,
        name: value.name,
        owner: value.users.name,
        startDate: value.startDate,
        createDate: value.createDate,
        haveLicence: value.haveLicence,
        ownerId: value.users.id,
        maxNumber: value.maxNumber,
        needFace: value.needFace,
      });
    }
  });
};

const changeLicence = async (meeting) => {
  const { data: res } = await axios.put(
    `/${identity.value}/meeting/${meeting.id}/licence/${meeting.haveLicence ? 1 : 0}`
  );
};

// 传入对应表单的ref,然后进行清空
const resetForm = (formEl) => {
  date.value = "";
  time.value = "";
  if (!formEl) return;
  formEl.resetFields();
};

// 修改会议请求
const updateMeetReq = async () => {
  updateMeetVisible.value = false;
  convetFormNull(updateEditForm, ["startDate", "name"]);

  const res = await axios
    .put(`/${identity.value}/meeting/${updateEditForm.id}`, {
      startDate: updateEditForm.startDate,
      name: updateEditForm.name,
      haveLicence: updateEditForm.haveLicence,
      maxNumber: updateEditForm.maxNumber,
      needFace: updateEditForm.needFace,
      passEnabled: updateEditForm.passEnabled,
      password: updateEditForm.password,
    })
    .then((res) => {
      if (res.code == 200) {
        updateMeetAfter(res.data);
      }
    });
};

const updateMeetAfter = (meet) => {
  const run = (value, index, array) => {
    if (value["id"] == meet.id) {
      array[index]["name"] = meet["name"];
      array[index]["startDate"] = meet["startDate"];
      array[index]["haveLicence"] = meet["haveLicence"];
      array[index]["maxNumber"] = meet["maxNumber"];
      array[index]["needFace"] = meet["needFace"];
      array[index]["passEnabled"] = meet["passEnabled"];
      array[index]["password"] = meet["password"];
    }
  };
  meetList.value.forEach(run);
  meetListTemp.value.forEach(run);
};

// 按下修改会议
const updateMeetSumbit = async (formEl) => {
  if (!formEl) return;
  updateEditForm.startDate = date.value + " " + time.value; // + ":00"
  await formEl.validate((valid, fields) => {
    if (valid) {
      if (updateEditForm.passEnabled && updateEditForm.password === "") {
        ElMessage.error("密码不能为空");
        return;
      }
      updateMeetReq();
      resetForm(formEl);
    }
  });
};
// 修改会议窗口关闭
const updateMeetExitBefore = (updateMeetFormRef) => {
  updateMeetVisible.value = false;
  resetForm(updateMeetFormRef);
};
const getMeetingPassword = async (mid) => {
  updateEditForm.password = "";
  updateEditForm.passEnabled = false;
  await axios.get(`/${identity.value}/meeting/${mid}/password`).then((res) => {
    updateEditForm.password = res.data.password;
    updateEditForm.passEnabled = res.data.enabled;
  });
};

// 去修改会议
const toEditMeet = (meet) => {
  updateMeetVisible.value = true;
  updateEditForm.id = meet.id;
  updateEditForm.startDate = meet.startDate;
  updateEditForm.name = meet.name;
  updateEditForm.haveLicence = meet.haveLicence;
  var temp = meet.startDate.split(" ");
  date.value = temp[0];
  time.value = temp[1];
  updateEditForm.maxNumber = meet.maxNumber;
  updateEditForm.needFace = meet.needFace;

  getMeetingPassword(meet.id);
};

// 创建会议请求
const insertMeetReq = async () => {
  insertMeetVisible.value = false;
  await axios
    .post(`/${identity.value}/meeting`, {
      startDate: insertEditForm.startDate,
      name: insertEditForm.name,
      haveLicence: insertEditForm.haveLicence,
      maxNumber: insertEditForm.maxNumber,
      needFace: insertEditForm.needFace,
      passEnabled: insertEditForm.passEnabled,
      password: insertEditForm.password,
    })
    .then(() => {
      getMeets();
    });
};
// 按下创建会议
const insertMeetSumbit = async (formEl) => {
  if (!formEl) return;
  if (date.value == "" || time.value == "") {
    ElMessage.warning("开始时间不能为空");
    return;
  }

  insertEditForm.startDate = date.value + " " + time.value + ":00";
  await formEl.validate((valid, fields) => {
    if (valid) {
      if (insertEditForm.passEnabled && insertEditForm.password === "") {
        ElMessage.error("密码不能为空");
        return;
      }
      insertMeetReq();
      resetForm(formEl);
    }
  });
};
// 创建会议窗口关闭
const insertMeetExitBefore = (insertMeetFormRef) => {
  insertMeetVisible.value = false;
  resetForm(insertMeetFormRef);
};

const delMeetReq = async (meet) => {
  await axios.delete(`/${identity.value}/meeting/${meet.id}`).then(() => {
    delMeetAfter(meet.id);
  });
};
const delMeetAfter = (meetId) => {
  const run = (meet) => meet["id"] != meetId;
  meetList.value = meetList.value.filter(run);
  meetListTemp.value = meetListTemp.value.filter(run);
};

const toJoinMeet = (meet) => {
  // router.replace(`/meeting/${meet.id}`);
  isExistMeeting(meet.id, owner.id).then((flag) => {
    if (flag) {
      ElMessage.error("你已经进入该会议了");
      return;
    }
    router.replace({
      name: `会议房间`,
      params: {
        mid: meet.id,
      },
    });
  });
};

onBeforeMount(() => getMeets());

// 时间
const date = ref("");
const time = ref("");

// 只能选择今天及以后的日期
const disabledDate = (date) => date.getTime() < Date.now() - 8.64e7;
const disabledSeconds = () => {
  if (date.value == "") return;
  return range(1, 59);
};
const disabledHours = () => {
  var day = parseInt(date.value.split("-")[2]);
  var now = new Date();

  if (day == now.getDate()) {
    return range(0, now.getHours());
  }
};
const disabledMinutes = (selectedHour) => {
  var day = parseInt(date.value.split("-")[2]);
  var now = new Date();
  if (day == now.getDate() && selectedHour == now.getHours()) {
    return range(0, now.getMinutes());
  }
};

// 选择字段搜索
const searchType = ref("");
// 查询的关键字
const searchValue = ref("");
// 查询的时间范围
const searchDateTime = ref("");
// 用户列表备份
const meetListTemp = ref([]);

const searchOptions = [
  { label: "会议号", value: "id" },
  { label: "会议名", value: "name" },
  { label: "主持人", value: "owner" },

  { label: "开始时间", value: "startDate" },
  { label: "创建时间", value: "createDate" },
];

// 模糊搜索
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
  // console.log(searchType.value);
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
</script>

<template>
  <div>
    <div class="table-header">
      <el-select v-model="searchType" placeholder="选择字段" style="width: 120px">
        <el-option
          v-for="item in searchOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
          v-show="item.value != 'owner' || (item.value == 'owner' && isAdmin)"
        />
      </el-select>
      <div
        v-if="searchType == 'createDate' || searchType == 'startDate'"
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
      <el-button
        type="primary"
        @click="insertMeetVisible = true"
        v-if="identity == 'users'"
        >创建会议</el-button
      >
    </div>
    <el-table :data="meetList" stripe style="width: 100%" max-height="400">
      <el-table-column type="index" label="#" width="50" />
      <el-table-column prop="id" label="会议号" width="200" />
      <el-table-column prop="name" label="会议名" />
      <el-table-column prop="owner" label="主持人" v-if="props.isAdmin">
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
      <el-table-column prop="createDate" label="创建时间" sortable />
      <el-table-column prop="haveLicence" label="入会需许可">
        <template #default="scope">
          <el-switch v-model="scope.row.haveLicence" @change="changeLicence(scope.row)" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220">
        <template #default="scope">
          <el-button-group>
            <el-button
              type="success"
              size="small"
              :icon="LoginOutlined"
              @click="toJoinMeet(scope.row)"
              v-if="identity == 'users'"
              >进入</el-button
            >
            <el-button
              type="primary"
              size="small"
              :icon="EditOutlined"
              @click="toEditMeet(scope.row)"
              >编辑</el-button
            >
            <el-button
              type="danger"
              size="small"
              :icon="SwitchButton"
              @click="delMeetReq(scope.row)"
              >结束</el-button
            >
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>
    <!-- 创建会议对话框 -->
    <el-dialog
      v-model="insertMeetVisible"
      width="30%"
      title="创建会议"
      :before-close="() => insertMeetExitBefore(insertMeetFormRef)"
    >
      <span>
        <el-form
          ref="insertMeetFormRef"
          label-width="120px"
          :model="insertEditForm"
          :rules="meetingRules"
          status-icon
        >
          <el-form-item label="会议名" prop="name">
            <el-input v-model="insertEditForm.name" />
          </el-form-item>
          <el-form-item label="开始时间">
            <el-date-picker
              v-model="date"
              type="date"
              placeholder="选择日期"
              style="width: 150px"
              value-format="YYYY-MM-DD"
              :disabled-date="disabledDate"
            /><el-time-picker
              v-model="time"
              placeholder="选择时间"
              style="width: 150px"
              value-format="HH:mm"
              :disabled-seconds="disabledSeconds"
              :disabled-hours="disabledHours"
              :disabled-minutes="disabledMinutes"
            />
          </el-form-item>
          <div class="switch-block">
            <el-form-item label="入会需许可" prop="haveLicence">
              <el-switch
                v-model="insertEditForm.haveLicence"
                @click="sumbitHaveLicenceOrPass(insertEditForm, false)"
              />
            </el-form-item>
            <el-form-item label="入会密码" prop="password">
              <el-input
                v-model="insertEditForm.password"
                style="width: 100px; margin-right: 3px"
              />
              <el-switch
                v-model="insertEditForm.passEnabled"
                @click="sumbitHaveLicenceOrPass(insertEditForm, true)"
              />
            </el-form-item>
          </div>
          <div class="switch-block">
            <el-form-item label="人脸验证进房" prop="needFace">
              <el-switch v-model="insertEditForm.needFace" />
            </el-form-item>

            <el-form-item label="会议限制人数" prop="maxNumber">
              <el-input-number v-model="insertEditForm.maxNumber" :min="1" :max="100" />
            </el-form-item>
          </div>
        </el-form>
      </span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="insertMeetExitBefore(insertMeetFormRef)">取消</el-button>
          <el-button type="primary" @click="insertMeetSumbit(insertMeetFormRef)"
            >创建会议</el-button
          >
        </span>
      </template>
    </el-dialog>
    <!-- 修改会议对话框 -->
    <el-dialog
      v-model="updateMeetVisible"
      width="30%"
      title="修改会议"
      :before-close="() => updateMeetExitBefore(updateMeetFormRef)"
    >
      <span>
        <el-form
          ref="updateMeetFormRef"
          label-width="120px"
          :model="updateEditForm"
          :rules="meetingRules"
          status-icon
        >
          <el-form-item label="会议名" prop="name">
            <el-input v-model="updateEditForm.name" />
          </el-form-item>
          <el-form-item label="开始时间">
            <el-date-picker
              v-model="date"
              type="date"
              placeholder="选择日期"
              style="width: 150px"
              value-format="YYYY-MM-DD"
              :disabled-date="disabledDate"
            /><el-time-picker
              v-model="time"
              placeholder="选择时间"
              style="width: 150px"
              value-format="HH:mm:ss"
              :disabled-seconds="disabledSeconds"
              :disabled-hours="disabledHours"
              :disabled-minutes="disabledMinutes"
            />
          </el-form-item>
          <div class="switch-block">
            <el-form-item label="入会需许可" prop="haveLicence">
              <el-switch
                v-model="updateEditForm.haveLicence"
                @click="sumbitHaveLicenceOrPass(updateEditForm, false)"
              />
            </el-form-item>
            <el-form-item label="入会密码" prop="password">
              <el-input
                v-model="updateEditForm.password"
                style="width: 100px; margin-right: 3px"
              />
              <el-switch
                v-model="updateEditForm.passEnabled"
                @click="sumbitHaveLicenceOrPass(updateEditForm, true)"
              />
            </el-form-item>
          </div>

          <div class="switch-block">
            <el-form-item label="人脸验证进房" prop="needFace">
              <el-switch v-model="updateEditForm.needFace" />
            </el-form-item>

            <el-form-item label="会议限制人数" prop="maxNumber">
              <el-input-number v-model="updateEditForm.maxNumber" :min="1" :max="100" />
            </el-form-item>
          </div>
        </el-form>
      </span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="updateMeetExitBefore(updateMeetFormRef)">取消</el-button>
          <el-button type="primary" @click="updateMeetSumbit(updateMeetFormRef)"
            >修改</el-button
          >
        </span>
      </template>
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
.switch-block {
  display: inline-flex;
}
.table-header {
  margin-top: 20px;
  margin-bottom: 20px;
}
.table-header .el-input {
  width: 300px;
  margin-right: 20px;
}

.faceimg {
  width: 48px;
  height: 48px;
  border-radius: 24px;
  cursor: pointer;
}
.el-dialog span {
  text-align: center;
}
.updateimg {
  width: 200px;
  height: 200px;
  cursor: pointer;
}

.avatar-uploader .avatar {
  width: 178px;
  height: 178px;
  display: block;
}
</style>

<style>
.avatar-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.el-icon.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  text-align: center;
}
</style>
