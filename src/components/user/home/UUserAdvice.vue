<script setup>
import { ref, reactive, onBeforeMount } from "vue";
import { useRoute, onBeforeRouteUpdate, useRouter } from "vue-router";
import { Plus } from "@element-plus/icons-vue";
import axios from "../../../js/axios";
import store from "../../../js/store";
import { beforeAvatarUpload } from "../../../utils/myUtils";
const insertEditForm = reactive({
  type: null,
  title: null,
  content: null,
});
const insertFormRef = ref(null);
const insertRules = reactive({
  type: [{ required: true, message: "意见种类不能为空" }],
  title: [{ required: true, message: "描述标题不能为空" }],
  content: [{ required: true, message: "描述内容不能为空" }],
});

// 提交
const onSubmit = async () => {
  await insertFormRef.value.validate(async (valid, fields) => {
    // console.log(valid);
    if (valid) {
      // 换行符替换
      if (insertEditForm.content)
        insertEditForm.content = insertEditForm.content.replaceAll("\n", "<br>");

      var formdata = new FormData();
      formdata.append("type", insertEditForm.type);
      formdata.append("title", insertEditForm.title);
      formdata.append("content", insertEditForm.content);

      imgList.value.forEach((item) => {
        formdata.append("files", item.raw);
      });

      // 表示占用空文件，不然没有文件会上传报错
      formdata.append("files", new File([], null));

      await axios
        .post("/userAdvice", formdata, {
          "content-type": "multipart/form-data",
        })
        .then((res) => {
          if (res.code == 200) {
            insertFormRef.value.resetFields();
            imgList.value = [];
          }
        });
    }
  });
};

// 上传组件对象
const uploadRef = ref();
// 上传图片列表
const imgList = ref([]);
// 预览可视化
const dialogVisible = ref(false);
// 预览哪张图片
const dialogImageUrl = ref("");

// 预览图片
const handlePictureCardPreview = (uploadFile) => {
  dialogImageUrl.value = uploadFile.url;
  dialogVisible.value = true;
};
const onExceed = () => {
  ElMessage.error("图片数量已上限");
};
</script>

<template>
  <div class="u-user-advice">
    <el-scrollbar max-height="60vh">
      <el-form
        ref="insertFormRef"
        label-width="120px"
        :model="insertEditForm"
        :rules="insertRules"
        status-icon
      >
        <el-form-item label="意见种类" prop="type">
          <el-radio-group v-model="insertEditForm.type">
            <el-radio label="建议改进" />
            <el-radio label="反馈BUG" />
          </el-radio-group>
        </el-form-item>

        <el-form-item label="描述标题" prop="title">
          <el-input v-model="insertEditForm.title" style="width: 50vh" />
        </el-form-item>
        <el-form-item label="描述内容" prop="content">
          <el-input
            v-model="insertEditForm.content"
            type="textarea"
            style="width: 60vh"
            rows="10"
          />
        </el-form-item>
        <el-form-item label="补充图片">
          <!-- 覆盖默认http请求，默认自动上传，关了的话相关钩子函数也会失效，这样就可以取消自动上传，又可以使用钩子函数 -->
          <el-upload
            ref="uploadRef"
            v-model:file-list="imgList"
            list-type="picture-card"
            :on-preview="handlePictureCardPreview"
            :before-upload="beforeAvatarUpload"
            :on-exceed="onExceed"
            :limit="5"
            :http-request="(item) => {}"
          >
            <el-icon><Plus /></el-icon>
          </el-upload>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSubmit()">提交</el-button>
        </el-form-item>
      </el-form>
    </el-scrollbar>
    <el-dialog v-model="dialogVisible">
      <el-image :src="dialogImageUrl" fit="contain" />
    </el-dialog>
  </div>
</template>

<style scoped>
.u-user-advice {
  text-align: center;
  /* margin: 0px auto; */

  margin-left: 40vh;
}
</style>
