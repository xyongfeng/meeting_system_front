<template>
  <div class="record-footer">
    <img height="20" src="../../img/备案图标.png" alt=""/>
    <el-space :size="15">
      <el-link type="info"
               href="https://beian.mps.gov.cn/#/query/webSearch?code=43310102000336"
               rel="noreferrer"
               :underline="false"
               target="_blank">湘公网安备43310102000336
      </el-link>
      <el-link type="info"
               target="_blank"
               href="https://beian.miit.gov.cn"
               :underline="false">湘ICP备2023024462号-1
      </el-link>


      <el-link type="info"
               href="https://github.com/xyongfeng/meeting_system_front"
               target="_blank"
               :underline="false"
               :icon="GithubOutlined">github
      </el-link>


      <el-link type="info"
               href="http://wpa.qq.com/msgrd?v=3&uin=979204556&site=qq&menu=yes"
               target="_blank"
               :underline="false">
        联系我
      </el-link>


    </el-space>


  </div>


</template>

<script setup>
import {GithubOutlined} from "@ant-design/icons-vue";
</script>

<style scoped>
.record-footer {
  text-align: center;
}
</style>