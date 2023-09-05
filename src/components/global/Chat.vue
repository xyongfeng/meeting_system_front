<script setup>
import { ChatLineRound, Delete, Plus } from "@element-plus/icons-vue";
import {
  ref,
  onMounted,
  inject,
  reactive,
  watch,
  getCurrentInstance,
  onUnmounted,
} from "vue";
import store from "../../js/store";
import { reqReadChat } from "../../utils/myUtils";

const isDelete = ref(false);
const searchVisible = ref(false);
const chatVisible = ref(false);

const activeName = ref(0);

const chatMessageRefs = ref([]);

// const instance = getCurrentInstance();

const toDelete = () => {
  isDelete.value = !isDelete.value;
};
const deleteByIndex = (index) => {
  // 发送删除请求
  store.dispatch("delFirendByIndex", { index: index });
};

const socket = inject("socket");

socket.on("friendChat", (data) => {
  data["activeName"] = activeName.value;
  data["chatVisible"] = chatVisible.value;

  store.dispatch("pushFriendChat", data).then((index) => {
    if (index >= store.state.friendInfos.length) return;

    // 将该聊天框滚动条置底部
    if (chatMessageRefs.value[index] == undefined) {
      // 新好友为了方便，重新获取一遍好友列表
      store.dispatch("getFriendsAndChats", { current: 0 });
    } else {
      chatMessageRefs.value[index].toBottom();
    }
  });
});

const clickChat = () => {
  chatVisible.value = true;
  store.dispatch("readChat", { index: activeName.value });
};
// 标签被点击
const tabClick = (pane, ev) => {
  // 已读点击前选择的
  reqReadChat(store.state.friendInfos[activeName.value].uid);
  // 已读新选择的
  store.dispatch("readChat", { index: pane.index });
};
const beforeClose = () => {
  if (activeName.value >= store.state.friendInfos.length) return;
  reqReadChat(store.state.friendInfos[activeName.value].uid);
};
onMounted(() => {
  store.dispatch("getFriendsAndChats", { current: 0 });
});
onUnmounted(() => {
  // console.log("chat close");
  // socket.close();
});
</script>

<template>
  <el-badge
    :value="store.getters.chatNewSizeAll"
    :hidden="store.getters.chatNewSizeAll == 0"
  >
    <el-icon :size="30" @click="clickChat"><ChatLineRound /></el-icon>
  </el-badge>

  <div class="chat-dialog">
    <el-dialog
      v-model="chatVisible"
      title="好友聊天"
      width="60%"
      top="40px"
      center
      @close="beforeClose"
    >
      <div style="margin-bottom: 10px">
        <el-button :icon="Plus" circle @click="searchVisible = true" />
        <el-button
          :type="isDelete ? 'danger' : ''"
          :icon="Delete"
          @click="toDelete"
          circle
        />
      </div>
      <el-tabs
        v-model="activeName"
        type="border-card"
        class="demo-tabs"
        tab-position="left"
        :closable="isDelete"
        @tab-remove="deleteByIndex"
        @tab-click="tabClick"
      >
        <el-tab-pane
          v-for="(item, index) in store.state.friendInfos"
          :key="index"
          :name="index"
          lazy
        >
          <template #label>
            <el-badge :is-dot="item.chatNewSize > 0">
              <div>
                <span class="custom-tabs-label"> {{ item.name }}</span>
              </div>
            </el-badge>
          </template>
          <chat-message ref="chatMessageRefs" :userId="item.uid" />
        </el-tab-pane>
      </el-tabs>
      <!-- 搜素用户信息框 -->
      <search-to-user v-if="searchVisible" v-model:searchVisible="searchVisible" />
    </el-dialog>
  </div>
</template>

<style scoped>
.el-icon:hover {
  /* background-color: yellow; */
  cursor: pointer;
}
.el-tabs {
  height: 480px;
}
/* ::deep().chat-dialog .el-dialog__body {
  padding-top: 10px !important;
} */
</style>
