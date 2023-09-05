<script setup></script>

<template>
  <div class="global-main">
    <el-row>
      <el-col :span="7" style="margin-top: 15px"><chat /></el-col>
      <el-col :span="7" style="margin-top: 15px"><inform /></el-col>
      <el-col :span="10"><my-head-image /></el-col>
    </el-row>
  </div>
</template>

<style scoped>
.global-main {
  width: 40vh;
}
</style>
