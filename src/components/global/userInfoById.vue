<script setup>
import axios from "../../js/axios";
import store from "../../js/store";
import { addImagePath, applyFriend, myLocalInfo } from "../../utils/myUtils";
import { ref, onBeforeMount, onBeforeUnmount, computed, reactive } from "vue";
// 父传子
const props = defineProps({
  userId: { type: Number },
  userInfoVisible: { type: Boolean, default: false },
  showButton: { type: Boolean, default: true },
});
// 子传父
const emits = defineEmits(["setUserInfoVisible"]);

const userId = ref(props.userId);
const userInfoVisible = ref(props.userInfoVisible);
const myInfo = ref(myLocalInfo());
const notFind = ref(false);

const userInfo = reactive({
  id: null,
  name: "",
  username: "",
  telephone: "",
  email: "",
  headImage: "",
});

const getUserInfo = async () => {
  await axios.get(`/users/info/${userId.value}/byId`).then((res) => {
    if (res.code == 200) {
      userInfo.id = res.data.id;
      userInfo.name = res.data.name;
      userInfo.username = res.data.username;
      userInfo.telephone = res.data.telephone;
      userInfo.email = res.data.email;
      userInfo.headImage = addImagePath(res.data.headImage);
    } else {
      notFind.value = true;
    }
  });
};

// 删除好友
const deleteFriend = async () => {
  await axios.delete(`/users/friend/${userInfo.id}`).then(() => {
    getFriends();
    // 更新好友列表
    store.dispatch("getFriendsAndChats", { current: 0 });
  });
};
const isFriend = ref(false);
const getFriends = async () => {
  isFriend.value = false;
  await axios.get(`/users/friend/0/-1`).then(({ data }) => {
    data.records.forEach((item) => {
      if (item.uid == userInfo.id) {
        isFriend.value = true;
      }
    });
  });
};

const closeVisible = () => {
  emits("setUserInfoVisible", false);
};

onBeforeMount(() => {
  getUserInfo();
  getFriends();
  // console.log(userInfo);
});

onBeforeUnmount(() => {
  closeVisible();
});
</script>

<template>
  <div class="user-info-by-id">
    <el-dialog
      v-model="userInfoVisible"
      :title="userInfo.name"
      width="30%"
      :center="true"
      :before-close="closeVisible"
    >
      <div style="text-align: center">
        <div class="head-image">
          <el-avatar shape="circle" :size="100" fit="fill" :src="userInfo.headImage" />
        </div>

        <user-basic-info :userInfo="userInfo" />

        <div v-if="myInfo.id != userInfo.id && showButton">
          <el-button v-if="!isFriend" type="primary" @click="applyFriend(userInfo.id)"
            >申请为好友</el-button
          >
          <el-popconfirm v-else title="是否确认删除？" @confirm="deleteFriend">
            <template #reference>
              <el-button type="danger">删除好友</el-button>
            </template>
          </el-popconfirm>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.signInListDialog {
  overflow: scroll;
}
</style>
