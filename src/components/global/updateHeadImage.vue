<script setup>
import { onBeforeMount, computed, ref, reactive } from "vue";
import { Plus } from "@element-plus/icons-vue";
import store from "../../js/store";
import axios from "../../js/axios";
import { beforeAvatarUpload, avatarUploadReq } from "../../utils/myUtils";
const props = defineProps({
  afterUpdate: { type: Function, default: Function },
  closeView: { type: Function, default: Function, equired: true },
  isAdmin: { type: Boolean, default: false },
});
// 修改头像文件
const updateImgFile = ref(null);

// 修改头像对话框展示
// const updateHeadImgVisible = ref(true);

const updateEditForm = reactive({ id: "", headImage: "" });

// 去更新头像表单
const toUpdateHeadImg = (id, headImage) => {
  //   updateHeadImgVisible.value = true;
  updateEditForm.id = id;
  updateEditForm.headImage = headImage;
};

// 通过验证之后
const handleAvatarSuccess = (file, fileList) => {
  updateEditForm.headImage = URL.createObjectURL(file.raw);
};

// 修改头像请求
const updateHeadImgReq = async () => {
  if (updateImgFile.value == null) {
    ElMessage.error("请选择图片");
    return;
  }
  var url = `/users/info/headImg`;
  if (props.isAdmin) {
    url = `/admins/users/${updateEditForm.id}/headImg`;
    // console.log(url);
  }

  avatarUploadReq(updateImgFile.value, url).then(() => {
    updateImgFile.value = null;

    props.afterUpdate();
  });
};
const closeBefore = () => {
  updateImgFile.value = null;
  props.closeView();
};
defineExpose({ toUpdateHeadImg, updateEditForm });
</script>

<template>
  <!-- 修改头像对话框 -->
  <el-dialog title="修改头像" width="18%" :before-close="closeBefore">
    <span>
      <el-row>
        <el-col :span="24">
          <el-upload
            class="avatar-uploader"
            :show-file-list="false"
            :on-change="handleAvatarSuccess"
            :before-upload="beforeAvatarUpload"
            :http-request="(item) => (updateImgFile = item.file)"
          >
            <img
              v-if="updateEditForm.headImage != '/api/static/'"
              class="updateimg"
              :src="updateEditForm.headImage"
            /><el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-col>
        <el-col :span="18"
          ><el-alert
            style="margin-left: 30px"
            title="点击图片修改头像,仅支持jpg,png格式"
            type="warning"
            :closable="false"
          >
          </el-alert
        ></el-col>
      </el-row>
    </span>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="closeBefore">取消</el-button>
        <el-button type="primary" @click="updateHeadImgReq">确认</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>
.el-dialog span {
  text-align: center;
}
.updateimg {
  width: 200px;
  height: 200px;
  cursor: pointer;
}

.avatar-uploader .avatar {
  width: 178px;
  height: 178px;
  display: block;
}

.avatar-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.el-icon.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  text-align: center;
}
</style>
