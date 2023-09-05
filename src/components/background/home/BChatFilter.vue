<script setup>
import { ref, reactive, onBeforeMount } from "vue";
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
} from "../../../utils/myUtils";

// 当前登录用户
const loginUser = ref(myLocalInfo());
// 过滤词
const itemList = ref([]);
// 当前页码
const currentPage = ref(1);
// 页面大小
const pageSize = ref(-1);

// 编辑表单
const insertEditForm = reactive({
  filterContent: "",
  filterRule: "",
  replaceContent: "",
});

const updateEditForm = reactive({
  id: "",
  filterContent: "",
  filterRule: "",
  replaceContent: "",
});

const insertFormRef = ref(null);

const insertRules = reactive({
  filterContent: [{ required: true, message: "过滤词不能为空" }],
  filterRule: [{ required: true, message: "过滤规则不能为空" }],
});

// 添加用户对话框展示
const insertVisible = ref(false);

// 修改用户对话框展示
const updateVisible = ref(false);

const updateFormRef = ref(null);

const getList = async () => {
  // 如果crrent参数不为空，则覆盖currentPage
  let { data: res } = await axios.get(
    `/chatFilter/${currentPage.value}/${pageSize.value}`
  );

  itemListTemp.value = [];
  itemList.value = [];
  // 获取res.records列表长度
  let len = res.records.length;
  if (len == 0) return 0;
  res.records.forEach((value, index, array) => {
    itemList.value.push({
      id: value.id,
      filterContent: value.filterContent,
      filterRule: value.filterRule == 1 ? "直接替换" : "正则替换",
      replaceContent: value.replaceContent,
      appenderId: value.appenderId,
      appender: value.appender,
      appendTime: value.appendTime,
      enable: value.enable,
    });
  });
  return len;
};

// 传入对应表单的ref,然后进行清空
const resetForm = (formEl) => {
  if (!formEl) return;
  formEl.resetFields();
};

// 添加请求
const insertReq = async () => {
  insertVisible.value = false;
  // console.log(insertEditForm);
  const res = await axios
    .post("/chatFilter", {
      filterContent: insertEditForm.filterContent,
      filterRule: insertEditForm.filterRule,
      replaceContent: insertEditForm.replaceContent,
    })
    .then(() => {
      getList();
    });
};
// 按下添加用户
const insertSumbit = async (formEl) => {
  if (!formEl) return;
  await formEl.validate((valid, fields) => {
    if (valid) {
      insertReq();
      resetForm(formEl);
    }
  });
};
// 添加用户窗口关闭
const insertExitBefore = (insertFormRef) => {
  insertVisible.value = false;
  resetForm(insertFormRef);
};

// 修改用户请求
const updateReq = async () => {
  updateVisible.value = false;
  // convetFormNull(updateEditForm, ["email", "telephone"]);
  console.log(updateEditForm);
  const res = await axios
    .put(`/chatFilter/${updateEditForm.id}`, {
      filterContent: updateEditForm.filterContent,
      filterRule: updateEditForm.filterRule,
      replaceContent: updateEditForm.replaceContent,
    })
    .then((res) => {
      if (res.code == 200) {
        updateAfter(res.data);
      }
    });
};

const updateAfter = (item) => {
  const run = (value, index, array) => {
    if (value["id"] == item.id) {
      array[index]["filterContent"] = item["filterContent"];
      array[index]["filterRule"] = item["filterRule"] == 1 ? "直接替换" : "正则替换";
      array[index]["replaceContent"] = item["replaceContent"];
    }
  };
  itemList.value.forEach(run);
  itemListTemp.value.forEach(run);
};

// 按下修改用户
const updateSumbit = async (formEl) => {
  if (!formEl) return;
  await formEl.validate((valid, fields) => {
    if (valid) {
      updateReq();
      resetForm(formEl);
    }
  });
};
// 修改用户窗口关闭
const updateExitBefore = (updateFormRef) => {
  updateVisible.value = false;
  resetForm(updateFormRef);
};
// 去修改用户
const toEdit = (item) => {
  updateVisible.value = true;

  updateEditForm.id = item.id;
  updateEditForm.filterContent = item.filterContent;
  updateEditForm.filterRule = item.filterRule === "直接替换" ? 1 : 2;
  updateEditForm.replaceContent = item.replaceContent;
};

const delAfter = (userId) => {
  const run = (user) => user["id"] != userId;
  itemList.value = itemList.value.filter(run);
  itemListTemp.value = itemListTemp.value.filter(run);
};

const delReq = async (item) => {
  const res = axios.delete(`/chatFilter/${item.id}`).then(() => {
    // getUsers();
    delAfter(item.id);
  });
};

const changeEnable = async (item) => {
  const { data: res } = await axios.put(
    `/chatFilter/${item.id}/enable/${item.enable ? 1 : 0}`
  );
};

// 用户列表备份
const itemListTemp = ref([]);

onBeforeMount(async () => {
  // 获得列表
  getList();
});
</script>

<template>
  <div>
    <div class="table-header">
      <el-button type="primary" @click="insertVisible = true">添加过滤词</el-button>
    </div>
    <el-table :data="itemList" stripe style="width: 100%" max-height="400">
      <el-table-column type="index" label="#" width="50" />
      <el-table-column prop="filterContent" label="过滤词" />
      <el-table-column prop="filterRule" label="过滤规则" />
      <el-table-column prop="replaceContent" label="替换结果" />
      <el-table-column prop="appender.name" label="添加人" />
      <el-table-column prop="appendTime" label="添加时间" />
      <el-table-column label="是否启用">
        <template #default="scope">
          <el-switch v-model="scope.row.enable" @change="changeEnable(scope.row)" />
        </template>
      </el-table-column>

      <el-table-column label="操作" width="250">
        <template #default="scope">
          <el-button-group>
            <el-button
              type="primary"
              size="small"
              :icon="EditOutlined"
              @click="toEdit(scope.row)"
              >编辑</el-button
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
    <!-- 添加用户对话框 -->
    <el-dialog
      v-model="insertVisible"
      width="30%"
      title="添加过滤词"
      :before-close="() => insertExitBefore(insertFormRef)"
    >
      <span>
        <el-form
          ref="insertFormRef"
          label-width="120px"
          :model="insertEditForm"
          :rules="insertRules"
          status-icon
        >
          <el-form-item label="过滤词" prop="filterContent">
            <el-input v-model="insertEditForm.filterContent" />
          </el-form-item>
          <el-form-item label="过滤规则" prop="filterRule">
            <!-- <el-input v-model="insertEditForm.filterRule" /> -->
            <el-select
              v-model="insertEditForm.filterRule"
              class="m-2"
              placeholder="选择过滤规则"
            >
              <el-option :key="1" label="直接替换" :value="1" />
              <el-option :key="2" label="正则替换" :value="2" />
            </el-select>
          </el-form-item>
          <el-form-item label="替换结果" prop="replaceContent">
            <el-input v-model="insertEditForm.replaceContent" />
          </el-form-item>
        </el-form>
      </span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="insertExitBefore(insertFormRef)">取消</el-button>
          <el-button type="primary" @click="insertSumbit(insertFormRef)">添加</el-button>
        </span>
      </template>
    </el-dialog>
    <!-- 修改用户对话框 -->
    <el-dialog
      v-model="updateVisible"
      width="30%"
      title="修改过滤词"
      :before-close="() => updateExitBefore(updateFormRef)"
    >
      <span>
        <el-form
          ref="updateFormRef"
          label-width="120px"
          :model="updateEditForm"
          :rules="insertRules"
          status-icon
        >
          <el-form-item label="过滤词" prop="filterContent">
            <el-input v-model="updateEditForm.filterContent" />
          </el-form-item>
          <el-form-item label="过滤规则" prop="filterRule">
            <!-- <el-input v-model="insertEditForm.filterRule" /> -->
            <el-select
              v-model="updateEditForm.filterRule"
              class="m-2"
              placeholder="选择过滤规则"
            >
              <el-option :key="1" label="直接替换" :value="1" />
              <el-option :key="2" label="正则替换" :value="2" />
            </el-select>
          </el-form-item>
          <el-form-item label="替换结果" prop="replaceContent">
            <el-input v-model="updateEditForm.replaceContent" />
          </el-form-item>
        </el-form>
      </span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="updateExitBefore(updateFormRef)">取消</el-button>
          <el-button type="primary" @click="updateSumbit(updateFormRef)">修改</el-button>
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
</style>
