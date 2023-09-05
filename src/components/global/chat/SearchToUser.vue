<script setup>
import axios from "axios";
import { ref, reactive, onMounted, onBeforeUnmount, computed } from "vue";
import { addImagePath } from "../../../utils/myUtils";
// 父传子
const props = defineProps({
  searchVisible: { type: Boolean },
});
const searchVisible = computed(() => props.searchVisible);
// 子传父
const emits = defineEmits(["update:searchVisible"]);
const beforeClose = () => {
  emits("update:searchVisible", false);
};
const userName = ref("");
const infoVisible = ref(false);
const searchedUser = reactive({
  id: null,
  name: null,
  headImage: null,
  email: null,
  telephone: null,
});
const submitUserInfo = async () => {
  await axios.get(`/users/info/${userName.value}`).then((res) => {
    if (res.code == 200) {
      infoVisible.value = true;
      dialogTop.value = "100px";
      searchedUser.id = res.data.id;
      searchedUser.name = res.data.name;
      searchedUser.email = res.data.email;
      searchedUser.telephone = res.data.telephone;
      searchedUser.headImage = addImagePath(res.data.headImage);
      // console.log(searchedUser.headImage);
    } else {
      dialogTop.value = "210px";
      infoVisible.value = false;
    }
  });
};
const sendApplication = async () => {
  await axios.post(`/users/friend/application/${searchedUser.id}`);
};

const dialogTop = ref("210px");
</script>

<template>
  <div class="search-to-user">
    <el-dialog
      v-model="searchVisible"
      title="搜索信息"
      width="30%"
      :top="dialogTop"
      center
      :before-close="beforeClose"
    >
      <div class="search">
        <el-input
          v-model="userName"
          placeholder="请输入用户名称"
          @keyup.enter="submitUserInfo"
        /><el-button @click="submitUserInfo" :disabled="userName == ''">搜索</el-button>
      </div>
      <div class="user-info" v-show="infoVisible">
        <el-avatar :size="80" :src="searchedUser.headImage" />
        <!-- <p>{{ searchedUser.name }}</p> -->
        <user-basic-info :userInfo="searchedUser" style="text-align: center" />
        <el-button type="primary" @click="sendApplication">发送申请</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.search {
  text-align: center;
}
.search .el-input {
  width: 200px;
}
.user-info {
  margin-top: 15px;
  text-align: center;
}
</style>
