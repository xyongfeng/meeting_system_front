<script setup>
import { ref, reactive, onBeforeMount, computed } from "vue";
import { useRouter } from "vue-router";
import {
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  LogoutOutlined,
  LoginOutlined,
} from "@ant-design/icons-vue";
import axios from "../../../js/axios";
import store from "../../../js/store";
import { convetFormNull } from "../../../utils/myUtils";

const router = useRouter();
// 会议列表
const meetList = ref([]);

// 会议编辑表单
const editForm = reactive({
  id: "",
  password: "",
});

const editFormRules = reactive({
  id: [{ required: true, message: "会议号不能为空" }],
  password: [{ max: 20, message: "密码长度不能大于20" }],
});

// 参加会议对话框展示
const insertMeetVisible = ref(false);

const insertMeetFormRef = ref(null);

const getMeets = async () => {
  // store.dispatch("getJoinedMeets");
  await axios.get(`/users/meeting/joined/${0}/${-1}`).then(({ data }) => {
    // data.records.forEach(
    //   (value, index, array) => (array[index]["owner"] = value.users.name)
    // );
    // meetList.value = data.records;
    meetList.value = [];
    meetListTemp.value = [];
    data.records.forEach((value, index, array) => {
      if (!value.end) {
        meetList.value.push({
          id: value.id,
          name: value.name,
          owner: value.users.name,
          startDate: value.startDate,
          createDate: value.createDate,
          haveLicence: value.haveLicence,
          userId: value.userId,
        });
      }
    });
  });
};

const changeLicence = async (meeting) => {
  const { data: res } = await axios.put(
    `/users/meeting/${meeting.id}/licence/${meeting.haveLicence}`
  );
};

// 传入对应表单的ref,然后进行清空
const resetForm = (formEl) => {
  if (!formEl) return;
  formEl.resetFields();
};

// 参加会议请求
const insertMeetReq = async () => {
  insertMeetVisible.value = false;
  // convetFormNull(editForm, ["startDate", "name"]);
  await axios
    .post(`/users/meeting/joined/${editForm.id}`, { password: editForm.password })
    .then(() => {
      getMeets();
      // 获取会议推送公告
      store.dispatch("getMeetingInfrom", { current: 0, size: -1 });
    });
};
// 按下参加会议
const insertMeetSumbit = async () => {
  await insertMeetFormRef.value.validate((valid, fields) => {
    if (valid) {
      insertMeetReq();

      resetForm(insertMeetFormRef.value);
    }
  });
};
// 参加会议窗口关闭
const insertMeetExitBefore = () => {
  insertMeetVisible.value = false;
  resetForm(insertMeetFormRef.value);
};

const delMeetReq = async (meet) => {
  const res = axios.delete(`/users/meeting/joined/${meet.id}`).then(() => {
    delMeetAfter(meet.id);
  });
};
const delMeetAfter = (meetId) => {
  const run = (meet) => meet["id"] != meetId;
  meetList.value = meetList.value.filter(run);
  meetListTemp.value = meetListTemp.value.filter(run);
};

const toJoinMeet = (meet) => {
  // router.replace({ path: `/admin/meeting/${meet.id}`, query: { joined: true } });

  router.replace({
    name: `会议房间`,
    query: { joined: true },
    params: {
      mid: meet.id,
    },
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
// 跳转到主持人页面
const pushOwnerInform = (row) => {
  // console.log(row);
  router.push({ name: "个人中心", params: { uid: row.userId } });
};
onBeforeMount(() => getMeets());
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
        />
      </el-select>
      <div
        v-if="searchType == 'startDate'"
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
      <el-button type="primary" @click="insertMeetVisible = true">参加会议</el-button>
    </div>

    <el-table :data="meetList" stripe style="width: 100%" max-height="400">
      <el-table-column type="index" label="#" width="50" />
      <el-table-column prop="id" label="会议号" width="200" />
      <el-table-column prop="name" label="会议名" />
      <el-table-column prop="owner" label="主持人">
        <template #default="scope"
          ><el-link
            @click="pushOwnerInform(scope.row)"
            :underline="false"
            type="primary"
            >{{ scope.row.owner }}</el-link
          ></template
        >
      </el-table-column>
      <el-table-column prop="startDate" label="开始时间" sortable />
      <!-- <el-table-column prop="createDate" label="创建时间" /> -->
      <el-table-column label="操作">
        <template #default="scope">
          <el-button-group>
            <el-button
              type="success"
              size="small"
              :icon="LoginOutlined"
              @click="toJoinMeet(scope.row)"
              >进入</el-button
            >
            <el-button
              type="danger"
              size="small"
              :icon="LogoutOutlined"
              @click="delMeetReq(scope.row)"
              >退出</el-button
            >
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>
    <!-- 参加会议对话框 -->
    <el-dialog v-model="insertMeetVisible" width="30%" title="参加会议">
      <span>
        <el-form
          ref="insertMeetFormRef"
          label-width="120px"
          :model="editForm"
          :rules="editFormRules"
          status-icon
        >
          <el-form-item label="会议号" prop="id">
            <el-input v-model="editForm.id" />
          </el-form-item>
          <el-form-item label="会议密码" prop="password">
            <el-input
              v-model="editForm.password"
              show-password
              style="width: 150px"
              placeholder="必要时请输入密码"
            />
          </el-form-item>
        </el-form>
      </span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="insertMeetExitBefore()">取消</el-button>
          <el-button type="primary" @click="insertMeetSumbit()">参加会议</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
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
