<script setup>
import { ref, reactive, onBeforeMount } from "vue";
import {
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
  SearchOutlined,
} from "@ant-design/icons-vue";
import { Plus, Setting, Reading } from "@element-plus/icons-vue";
import axios from "../../../js/axios";

import {
  convetFormNull,
  addImagePath,
  getUserFormRule,
  myLocalInfo,
} from "../../../utils/myUtils";

// 当前登录用户
const loginUser = ref(myLocalInfo());
// 过滤词
const itemList = ref([]);
// 当前页码
const currentPage = ref(1);
// 页面大小
const pageSize = ref(-1);

const getList = async () => {
  // 如果crrent参数不为空，则覆盖currentPage
  let { data: res } = await axios.get(
    `/userAdvice/${currentPage.value}/${pageSize.value}`
  );

  itemListTemp.value = [];
  itemList.value = [];
  // 获取res.records列表长度
  let len = res.records.length;
  if (len == 0) return 0;

  res.records.forEach((item) => {
    item["userName"] = item.users.name;

    itemList.value.push(item);
  });

  return len;
};

// 选择字段搜索
const searchType = ref("");
// 查询的关键字
const searchValue = ref("");
// 查询的时间范围
const searchDateTime = ref("");

// 用户列表备份
const itemListTemp = ref([]);

const searchOptions = [
  { label: "反馈人", value: "userName" },
  { label: "意见种类", value: "type" },
  { label: "描述标题", value: "title" },
  { label: "提交时间", value: "time" },
];

const searching = ref(false);
const search = () => {
  if (searchType.value === "") {
    ElMessage.warning("请选择要搜索的字段");
    return;
  }
  searching.value = true;
  if (itemListTemp.value.length == 0) itemListTemp.value = itemList.value;
  itemList.value = itemListTemp.value.filter((value, index, array) => {
    if (searchType.value === "type") {
      return value[searchType.value] == searchValue.value;
    }
    return value[searchType.value] && value[searchType.value].includes(searchValue.value);
  });
  // console.log(searchType.value);
};
const resetSearch = () => {
  searchType.value = "";
  searchValue.value = "";
  itemList.value = itemListTemp.value;
  searching.value = false;
  searchDateTime.value = "";
};
// 日期时间范围搜索
const searchByDate = () => {
  if (itemListTemp.value.length == 0) itemListTemp.value = itemList.value;

  if (searchDateTime.value[0] == undefined && searchDateTime.value[1] == undefined) {
    itemList.value = itemListTemp.value;
    return;
  }
  searching.value = true;
  var start = searchDateTime.value[0];
  var end = searchDateTime.value[1];
  itemList.value = itemListTemp.value.filter((value, index, array) => {
    // console.log(value[searchType.value], searchType.value, value);
    if (value[searchType.value]) {
      var now = new Date(value[searchType.value]);
      return start <= now && now <= end;
    }
    return false;
  });
};

const insertVisible = ref(false);

const insertEditForm = reactive({
  type: "",
  title: "",
  userId: "",
  userName: "",
  content: "",
  time: "",
  imgs: "",
});

const toRead = (item) => {
  insertEditForm.type = item.type;
  insertEditForm.content = item.content;
  insertEditForm.title = item.title;
  insertEditForm.userId = item.userId;
  insertEditForm.userName = item.userName;
  insertEditForm.time = item.time;

  if (item.imgs) {
    item.imgs.forEach((item, index, array) => {
      array[index] = addImagePath(item);
    });
    insertEditForm.imgs = item.imgs;
  } else {
    insertEditForm.imgs = null;
  }

  insertVisible.value = true;
};

const delReq = async (item) => {
  const res = axios.delete(`/userAdvice/${item.id}`).then(() => {
    // getUsers();
    delAfter(item.id);
  });
};
const delAfter = (userId) => {
  const run = (user) => user["id"] != userId;
  itemList.value = itemList.value.filter(run);
  itemListTemp.value = itemListTemp.value.filter(run);
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

onBeforeMount(async () => {
  // 获得列表
  getList();
});
</script>

<template>
  <div>
    <div class="table-header">
      <el-select v-model="searchType" placeholder="选择字段" style="width: 120px">
        <!-- <el-option></el-option> -->
        <el-option
          v-for="item in searchOptions"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
      <div v-if="searchType == 'time'" style="display: inline-block; margin-right: 10px">
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
      <div
        v-else-if="searchType == 'type'"
        style="display: inline-block; margin-right: 10px"
      >
        <el-radio-group v-model="searchValue" style="margin-right: 10px">
          <el-radio label="建议改进">建议改进</el-radio>
          <el-radio label="反馈BUG">反馈BUG</el-radio>
        </el-radio-group>

        <el-button :icon="SearchOutlined" @click="search"></el-button>
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
    <el-table :data="itemList" stripe style="width: 100%" max-height="400">
      <el-table-column type="index" label="#" width="50" />
      <el-table-column prop="users.name" label="反馈人" />
      <el-table-column prop="type" label="意见种类" />
      <el-table-column prop="title" label="描述标题" />
      <el-table-column prop="time" label="提交时间" sortable />
      <el-table-column label="操作" width="250">
        <template #default="scope">
          <el-button-group>
            <el-button
              type="primary"
              size="small"
              :icon="Reading"
              @click="toRead(scope.row)"
              >查看</el-button
            >

            <el-button
              type="danger"
              size="small"
              :icon="DeleteOutlined"
              @click="delReq(scope.row)"
              >删除</el-button
            >
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="insertVisible" width="30%" title="查看意见">
      <span>
        <el-form label-width="120px" :model="insertEditForm" status-icon>
          <el-form-item label="反馈人">
            <el-link
              @click="sumbitUserInfo(insertEditForm.userId)"
              :underline="false"
              type="primary"
              >{{ insertEditForm.userName }}</el-link
            >
          </el-form-item>
          <el-form-item label="意见种类">
            {{ insertEditForm.type }}
          </el-form-item>
          <el-form-item label="描述标题">
            {{ insertEditForm.title }}
          </el-form-item>
          <el-form-item label="补充图片" v-if="insertEditForm.imgs">
            <div class="imgs" v-for="(img, index) in insertEditForm.imgs" :key="index">
              <el-image
                style="width: 100px; height: 100px"
                :src="img"
                fit="fill"
                :initial-index="index"
                :preview-src-list="insertEditForm.imgs"
              />
            </div>
          </el-form-item>
          <el-scrollbar max-height="200px">
            <el-form-item label="描述内容">
              <div class="content" v-html="insertEditForm.content"></div>
            </el-form-item>
          </el-scrollbar>
        </el-form>
      </span>
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
.imgs {
  margin-left: 2px;
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
</style>
