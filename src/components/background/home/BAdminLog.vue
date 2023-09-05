<script setup>
import { ref, reactive, onBeforeMount, computed } from "vue";
import {
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
  SearchOutlined,
} from "@ant-design/icons-vue";
import { Plus, Setting } from "@element-plus/icons-vue";
import axios from "../../../js/axios";

import {
  convetFormNull,
  addImagePath,
  getUserFormRule,
  myLocalInfo,
  getNowTime,
} from "../../../utils/myUtils";

// 当前登录用户
const loginUser = ref(myLocalInfo());

const itemList = ref([]);
// 当前页码
const currentPage = ref(1);
// 页面大小
const pageSize = ref(10);
// 所有页面数量
const pageTotal = ref(0);

const moduleMap = {
  meeting: "会议列表",
  user: "用户列表",
  chatFilter: "聊天过滤",
  userAdvice: "用户意见",
  dataStatistics: "数据统计",
};

const moduleOptions = [
  { label: "用户列表", value: "user" },
  { label: "会议列表", value: "meeting" },
  { label: "聊天过滤", value: "chatFilter" },
  { label: "数据统计", value: "dataStatistics" },
  { label: "用户意见", value: "userAdvice" },
];
const baseUrl = computed(() => `/adminLog/${currentPage.value}/${pageSize.value}`);

const getList = (url) => {
  getListBase(url).then((res) => {
    pageTotal.value = res.pages;
    itemList.value = res.records;
  });
};

const getListBase = async (url) => {
  // 如果crrent参数不为空，则覆盖currentPage
  let { data: res } = await axios.get(url);

  res.records.forEach((item) => {
    item["actionContent"] = item["actionContent"] === "" ? "无" : item["actionContent"];
    item["actionSuccess"] = item["actionSuccess"] === true ? "成功" : "失败";
    item["actionUserName"] = item.actionUser.name;
    item["actionModule"] = moduleMap[item.actionModule];
  });
  // itemList.value = res.records;
  return res;
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
  { label: "操作人", value: "actionUserName" },
  { label: "操作模块", value: "actionModule" },
  { label: "操作类型", value: "actionType" },
  { label: "操作路径", value: "actionUrl" },
  { label: "操作状态", value: "actionSuccess" },
  { label: "操作时间", value: "actionTime" },
];

const searching = ref(false);
const search = async () => {
  if (searchType.value === "") {
    ElMessage.warning("请选择要搜索的字段");
    return;
  }
  currentPage.value = 1;
  // console.log(currentPage.value);
  searching.value = true;
  getListBySearch();
};

const getListBySearch = () => {
  // console.log(currentPage.value, baseUrl.value);
  getList(`${baseUrl.value}?searchType=${searchType.value}&key=${searchValue.value}`);
};

const resetSearch = () => {
  searchType.value = "";
  searchValue.value = "";
  searching.value = false;
  searchDateTime.value = "";
  currentPage.value = 1;
  getList(baseUrl.value);
};

const startDate = ref();
const endDate = ref();
// 日期时间范围搜索
const searchByDate = () => {
  if (searchDateTime.value[0] == undefined && searchDateTime.value[1] == undefined) {
    return;
  }

  currentPage.value = 1;
  searching.value = true;
  startDate.value = getNowTime(searchDateTime.value[0]);
  endDate.value = getNowTime(searchDateTime.value[1]);
  getListByDate();
};

const getListByDate = () => {
  getList(
    `${baseUrl.value}?searchType=${searchType.value}&startDate=${startDate.value}&endDate=${endDate.value}`
  );
};

const excelData = ref([]);

const excelFields = reactive({
  操作人: "actionUserName",
  操作模块: "actionModule",
  操作类型: "actionType",
  操作路径: "actionUrl",
  传递参数: "actionContent",
  操作状态: "actionSuccess",
  操作时间: "actionTime",
});
// 获取所有数据导入表格
const getExcelData = () => {
  getListBase(`/adminLog/1/-1`).then((res) => {
    excelData.value = res.records;
  });
};
// 当前页面改变
const currentChange = (page) => {
  // console.log(page);
  currentPage.value = page;
  if (searchType.value === "actionTime") {
    getListByDate();
  } else {
    getListBySearch();
  }
};
// 计算index
const computeIndex = (index) => {
  return (currentPage.value - 1) * pageSize.value + index + 1;
};

onBeforeMount(async () => {
  // 获得列表
  getList(baseUrl.value);
  // 获取所有数据导入表格
  getExcelData();
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
      <div
        v-if="searchType == 'actionTime'"
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
      <div
        v-else-if="searchType == 'actionSuccess'"
        style="display: inline-block; margin-right: 10px"
      >
        <el-radio-group v-model="searchValue" style="margin-right: 10px">
          <el-radio label="1">成功</el-radio>
          <el-radio label="0">失败</el-radio>
        </el-radio-group>

        <el-button :icon="SearchOutlined" @click="search"></el-button>
      </div>
      <div
        v-else-if="searchType == 'actionModule'"
        style="display: inline-block; margin-right: 10px"
      >
        <el-select v-model="searchValue" placeholder="选择字段" style="width: 120px">
          <!-- <el-option></el-option> -->
          <el-option
            v-for="item in moduleOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>

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

      <vue3-json-excel
        :json-data="excelData"
        :fields="excelFields"
        type="'xls"
        :name="`管理日志.${getNowTime()}.xls`"
      >
        <el-button type="success">导出表格</el-button>
      </vue3-json-excel>
    </div>
    <el-table :data="itemList" stripe style="width: 100%" max-height="400">
      <el-table-column type="index" :index="computeIndex" label="#" width="80" />
      <el-table-column prop="actionUser.name" label="操作人" />
      <el-table-column prop="actionModule" label="操作模块" />
      <el-table-column prop="actionType" label="操作类型" />
      <el-table-column prop="actionUrl" label="操作路径" />
      <el-table-column prop="actionContent" label="传递参数" />
      <el-table-column prop="actionSuccess" label="操作状态">
        <template #default="scope">
          <el-tag v-if="scope.row.actionSuccess === '成功'" type="success">成功</el-tag>
          <el-tag v-else type="danger">失败</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="actionTime" label="操作时间" sortable />
    </el-table>
    <div class="example-pagination-block">
      <el-pagination
        layout="prev, pager, next"
        :page-size="10"
        :page-count="pageTotal"
        :current-page="currentPage"
        background
        hide-on-single-page
        @current-change="currentChange"
      />
    </div>
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
</style>
