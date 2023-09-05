<script setup>
import { xor } from "lodash";
import { ref, onBeforeMount, onBeforeUnmount, computed, reactive, onMounted } from "vue";
const props = defineProps({
  userInfo: { type: Object },
});
const userInfo = ref(props.userInfo);

const isNull = (x) => {
  return x === "" || x == null || x == undefined;
};

onMounted(() => {
  userInfo.value.email = isNull(userInfo.value.email) ? "无" : userInfo.value.email;

  userInfo.value.telephone = isNull(userInfo.value.telephone)
    ? "无"
    : userInfo.value.telephone;
});
</script>

<template>
  <div class="user-basic-info">
    <el-form :model="userInfo" status-icon label-width="120px">
      <el-form-item label="名称" prop="name">
        <span>{{ userInfo.name }}</span>
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <span>{{ isNull(userInfo.email) ? "无" : userInfo.email }}</span>
      </el-form-item>
      <el-form-item label="手机" prop="telephone">
        <span>{{ isNull(userInfo.telephone) ? "无" : userInfo.telephone }}</span>
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped>
.main {
  text-align: center;
}
</style>
