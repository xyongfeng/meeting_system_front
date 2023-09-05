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
// 用户列表
const userList = ref([]);
// 当前页码
const currentPage = ref(1);
// 页面大小
const pageSize = ref(-1);

// 编辑表单
const insertEditForm = reactive({
  id: "",
  username: "",
  password: "",
  name: "",
  email: "",
  headImage: "",
  telephone: "",
  isAdmin: false,
});

const updateEditForm = reactive({
  id: "",
  username: "",
  password: "",
  name: "",
  email: "",
  headImage: "",
  telephone: "",
  isAdmin: false,
});
// 修改头像文件
const updateImgFile = ref(null);

// 修改头像框对象
const updateHeadImageRef = ref(null);

const insertUsersFormRef = ref(null);

const insertUsersRules = reactive(getUserFormRule());

// 修改头像对话框展示
const updateHeadImgVisible = ref(false);

// 添加用户对话框展示
const insertUsersVisible = ref(false);

// 修改用户对话框展示
const updateUsersVisible = ref(false);

const updateUsersFormRef = ref(null);

const getUsers = async () => {
  // 如果crrent参数不为空，则覆盖currentPage
  let { data: res } = await axios.get(
    `/admins/users/${currentPage.value}/${pageSize.value}`
  );
  userListTemp.value = [];
  userList.value = [];
  // 获取res.records列表长度
  let len = res.records.length;
  if (len == 0) return 0;
  res.records.forEach((value, index, array) => {
    userList.value.push({
      id: value.id,
      username: value.username,
      name: value.name,
      telephone: value.telephone,
      email: value.email,
      headImage: addImagePath(value.headImage),
      isAdmin: value.isAdmin,
      roleIdMap: Object(), // 储存用户权限
    });
  });
  return len;
};
// 修改管理员权限
const changeAdmin = async (user) => {
  const { data: res } = await axios.put(
    `/admins/users/${user.id}/admin/${user.isAdmin ? 1 : 0}`
  );
};

const headImgAfterUpdate = () => {
  updateHeadImgVisible.value = false;

  const run = (value, index, array) => {
    if (value["id"] == updateHeadImageRef.value.updateEditForm.id) {
      array[index]["headImage"] = updateHeadImageRef.value.updateEditForm.headImage;
    }
  };
  userList.value.forEach(run);
  userListTemp.value.forEach(run);
};
// 去更新头像表单
const toUpdateHeadImg = (users) => {
  updateHeadImgVisible.value = true;
  updateHeadImageRef.value.toUpdateHeadImg(users.id, users.headImage);
};

// 传入对应表单的ref,然后进行清空
const resetForm = (formEl) => {
  if (!formEl) return;
  formEl.resetFields();
};

// 添加用户请求
const insertUsersReq = async () => {
  insertUsersVisible.value = false;
  convetFormNull(insertEditForm, ["email", "telephone"]);
  const res = await axios
    .post("/admins/users", {
      username: insertEditForm.username,
      password: insertEditForm.password,
      name: insertEditForm.name,
      email: insertEditForm.email,
      telephone: insertEditForm.telephone,
      isAdmin: insertEditForm.isAdmin,
    })
    .then(() => {
      getUsers();
    });
};
// 按下添加用户
const insertUsersSumbit = async (formEl) => {
  if (!formEl) return;
  await formEl.validate((valid, fields) => {
    if (valid) {
      insertUsersReq();
      resetForm(formEl);
    }
  });
};
// 添加用户窗口关闭
const insertUsersExitBefore = (insertUsersFormRef) => {
  insertUsersVisible.value = false;
  resetForm(insertUsersFormRef);
};

// 修改用户请求
const updateUsersReq = async () => {
  updateUsersVisible.value = false;
  // convetFormNull(updateEditForm, ["email", "telephone"]);
  const res = await axios
    .put(`/admins/users/${updateEditForm.id}`, {
      username: updateEditForm.username,
      name: updateEditForm.name,
      email: updateEditForm.email,
      telephone: updateEditForm.telephone,
      isAdmin: updateEditForm.isAdmin,
    })
    .then((res) => {
      if (res.code == 200) {
        updateUsersAfter(res.data);
      }
    });
};

const updateUsersAfter = (users) => {
  const run = (value, index, array) => {
    if (value["id"] == users.id) {
      array[index]["username"] = users["username"];
      array[index]["name"] = users["name"];
      array[index]["telephone"] = users["telephone"];
      array[index]["email"] = users["email"];
    }
  };
  userList.value.forEach(run);
  userListTemp.value.forEach(run);
};

// 按下修改用户
const updateUsersSumbit = async (formEl) => {
  if (!formEl) return;
  await formEl.validate((valid, fields) => {
    if (valid) {
      updateUsersReq();
      resetForm(formEl);
    }
  });
};
// 修改用户窗口关闭
const updateUsersExitBefore = (updateUsersFormRef) => {
  updateUsersVisible.value = false;
  resetForm(updateUsersFormRef);
};
// 去修改用户
const toEditUser = (users) => {
  updateUsersVisible.value = true;
  updateEditForm.id = users.id;
  updateEditForm.username = users.username;
  updateEditForm.name = users.name;
  updateEditForm.email = users.email;
  updateEditForm.telephone = users.telephone;
  updateEditForm.isAdmin = users.isAdmin;
};

const delUsersAfter = (userId) => {
  const run = (user) => user["id"] != userId;
  userList.value = userList.value.filter(run);
  userListTemp.value = userListTemp.value.filter(run);
};

const delUsersReq = async (users) => {
  console.log(users);
  const res = axios.delete(`/admins/users/${users.id}`).then(() => {
    // getUsers();
    delUsersAfter(users.id);
  });
};
// 权限列表
const roleList = ref([]);

const resetRoleIdMap = (users) => {
  // console.log(users);
  roleList.value.forEach((role) => (users.roleIdMap[role.id] = false));
};

// 点击权限按钮
const toEditRole = async (users) => {
  if (users.roleVisible) {
    cancleEditRole(users);
  } else {
    users.roleVisible = true;
    // 初始化权限为假
    resetRoleIdMap(users);
    await axios.get(`/admins/users/${users.id}/role`).then(({ data }) => {
      // 获取用户拥有权限，并对每个权限进行选中
      data.forEach((role, index, arr) => (users.roleIdMap[role.id] = true));
    });
  }
};
// 取消权限修改
const cancleEditRole = (users) => {
  users.roleVisible = false;
};
// 发送权限修改请求
const editRoleReq = async (users) => {
  // console.log(users.roleIdMap);
  axios.put(`/admins/users/${users.id}/role`, users.roleIdMap);
  cancleEditRole(users);
};

// 禁止滑动更新
// const scrollDisabled = ref(false);
// 滑动更新方法
// const loadUser = () => {
//   if (getUsers(true, currentPage.value + 1) == 0) {
//     scrollDisabled.value = true;
//   }
// };

// 选择字段搜索
const searchType = ref("");
// 查询的关键字
const searchValue = ref("");
// 用户列表备份
const userListTemp = ref([]);

const searchOptions = [
  { label: "用户名", value: "username" },
  { label: "名称", value: "name" },
  { label: "手机号", value: "telephone" },
  { label: "邮箱", value: "email" },
];

const searching = ref(false);
const search = () => {
  if (searchType.value === "") {
    ElMessage.warning("请选择要搜索的字段");
    return;
  }
  searching.value = true;
  if (userListTemp.value.length == 0) userListTemp.value = userList.value;
  userList.value = userListTemp.value.filter((value, index, array) => {
    return value[searchType.value] && value[searchType.value].includes(searchValue.value);
  });
  // console.log(searchType.value);
};
const resetSearch = () => {
  searchType.value = "";
  searchValue.value = "";
  userList.value = userListTemp.value;
  searching.value = false;
};
onBeforeMount(async () => {
  // 获得用户列表
  getUsers();
  // 获得权限列表
  Object.values(loginUser.value.perms).forEach(async (x) => {
    if (x === "role") {
      loginUser.value.root = true;
      await axios.get(`/role`).then((res) => (roleList.value = res.data));
    }
  });
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
      <el-input
        placeholder="请输入搜索关键字"
        v-model="searchValue"
        @keyup.enter="search"
      >
        <template #append>
          <el-button :icon="SearchOutlined" @click="search"></el-button>
        </template>
      </el-input>
      <el-button @click="resetSearch" v-show="searching">恢复列表</el-button>
      <el-button type="primary" @click="insertUsersVisible = true">添加用户</el-button>
    </div>
    <el-table :data="userList" stripe style="width: 100%" max-height="400">
      <el-table-column type="index" label="#" width="50" />
      <el-table-column prop="username" label="用户名" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="telephone" label="手机号" />
      <el-table-column prop="email" label="邮箱" />
      <el-table-column prop="headImage" label="头像">
        <template #default="scope">
          <img
            v-if="scope.row.headImage != ''"
            class="faceimg"
            :src="scope.row.headImage"
            alt="空"
            @click="toUpdateHeadImg(scope.row)"
          />
          <el-icon v-else class="faceimg" @click="toUpdateHeadImg(scope.row)"
            ><Plus
          /></el-icon>
        </template>
      </el-table-column>
      <el-table-column prop="isAdmin" label="管理员" v-if="loginUser.root">
        <template #default="scope">
          <el-switch v-model="scope.row.isAdmin" @change="changeAdmin(scope.row)" />
        </template>
      </el-table-column>

      <el-table-column label="操作" width="250">
        <template #default="scope">
          <el-button-group>
            <el-popover
              trigger="click"
              :visible="scope.row.roleVisible"
              placement="top"
              :width="160"
              v-if="loginUser.root && scope.row.isAdmin"
            >
              <el-scrollbar max-height="120px">
                <div
                  style="text-align: center"
                  v-for="(role, index) in roleList"
                  :key="index"
                >
                  <el-checkbox
                    v-model="scope.row.roleIdMap[role.id]"
                    :label="role.name"
                    size="large"
                  />
                </div>
              </el-scrollbar>

              <div style="text-align: center">
                <el-button size="small" text @click="cancleEditRole(scope.row)"
                  >取消</el-button
                >
                <el-button size="small" type="primary" @click="editRoleReq(scope.row)"
                  >确认</el-button
                >
              </div>
              <template #reference
                ><el-button
                  type="warning"
                  size="small"
                  :icon="Setting"
                  @click="toEditRole(scope.row)"
                  >权限</el-button
                ></template
              >
            </el-popover>

            <el-button
              type="primary"
              size="small"
              :icon="EditOutlined"
              @click="toEditUser(scope.row)"
              >编辑</el-button
            >
            <el-button
              type="danger"
              size="small"
              :icon="DeleteOutlined"
              @click="delUsersReq(scope.row)"
              >删除</el-button
            >
          </el-button-group>
        </template>
      </el-table-column>
    </el-table>
    <!-- 添加用户对话框 -->
    <el-dialog
      v-model="insertUsersVisible"
      width="30%"
      title="添加用户"
      :before-close="() => insertUsersExitBefore(insertUsersFormRef)"
    >
      <span>
        <el-form
          ref="insertUsersFormRef"
          label-width="120px"
          :model="insertEditForm"
          :rules="insertUsersRules"
          status-icon
        >
          <el-form-item label="用户名" prop="username">
            <el-input v-model="insertEditForm.username" />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input v-model="insertEditForm.password" show-password />
          </el-form-item>
          <el-form-item label="名称" prop="name">
            <el-input v-model="insertEditForm.name" />
          </el-form-item>
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="insertEditForm.email" />
          </el-form-item>
          <el-form-item label="手机号" prop="telephone">
            <el-input v-model="insertEditForm.telephone" />
          </el-form-item>
          <el-form-item label="是否为管理员" prop="isAdmin" v-if="loginUser.root">
            <el-switch v-model="insertEditForm.isAdmin" />
          </el-form-item>
        </el-form>
      </span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="insertUsersExitBefore(insertUsersFormRef)">取消</el-button>
          <el-button type="primary" @click="insertUsersSumbit(insertUsersFormRef)"
            >添加</el-button
          >
        </span>
      </template>
    </el-dialog>
    <!-- 修改用户对话框 -->
    <el-dialog
      v-model="updateUsersVisible"
      width="30%"
      title="修改用户"
      :before-close="() => updateUsersExitBefore(updateUsersFormRef)"
    >
      <span>
        <el-form
          ref="updateUsersFormRef"
          label-width="120px"
          :model="updateEditForm"
          :rules="insertUsersRules"
          status-icon
        >
          <el-form-item label="用户名" prop="username">
            <el-input v-model="updateEditForm.username" />
          </el-form-item>
          <el-form-item label="名称" prop="name">
            <el-input v-model="updateEditForm.name" />
          </el-form-item>
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="updateEditForm.email" />
          </el-form-item>
          <el-form-item label="手机号" prop="telephone">
            <el-input v-model="updateEditForm.telephone" />
          </el-form-item>
          <el-form-item label="是否为管理员" prop="isAdmin" v-if="loginUser.root">
            <el-switch v-model="updateEditForm.isAdmin" />
          </el-form-item>
        </el-form>
      </span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="updateUsersExitBefore(updateUsersFormRef)">取消</el-button>
          <el-button type="primary" @click="updateUsersSumbit(updateUsersFormRef)"
            >修改</el-button
          >
        </span>
      </template>
    </el-dialog>
    <update-head-image
      ref="updateHeadImageRef"
      v-model="updateHeadImgVisible"
      :closeView="() => (updateHeadImgVisible = false)"
      :afterUpdate="headImgAfterUpdate"
      :isAdmin="true"
    />
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
