<script setup>
import axios from "axios";
import { ref, onMounted, onBeforeUnmount, computed, reactive } from "vue";
import { getTime } from "../../../utils/myUtils";
import { ElScrollbar } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
// 父传子
const props = defineProps({
  noticeVisible: { type: Boolean, default: true },
  meetingId: { type: String, default: "" },
  isMaster: { type: Boolean, default: false },
});

// 子传父
const emits = defineEmits(["setNoticeVisible"]);
const closeVisible = () => {
  emits("setNoticeVisible", false);
};
const isMaster = ref(props.isMaster);
const noticeList = ref([]);
const getNoticeList = async () => {
  await axios.get(`/users/meeting/${props.meetingId}/notice/${0}/${-1}`).then((res) => {
    noticeList.value = res.data.records;
    // console.log(noticeList.value);
  });
};
// 会议编辑表单
const insertEditForm = reactive({
  title: "",
  content: "",
  type: 1,
});
const updateEditForm = reactive({ title: "", content: "", type: 1, id: 0 });
const noticeRules = reactive({
  title: [
    { required: true, message: "公告标题不能为空" },
    { max: 20, message: "标题长度不能大于20" },
  ],
  content: [{ required: true, message: "公告内容不能为空" }],
});

// 创建公告对话框展示
const insertNoticeVisible = ref(false);

const insertNoticeFormRef = ref(null);

// 修改公告对话框展示
const updateNoticeVisible = ref(false);

const updateNoticeFormRef = ref(null);

// 传入对应表单的ref,然后进行清空
const resetForm = (formEl) => {
  if (!formEl) return;
  formEl.resetFields();
};
// 添加公告请求
const insertNoticeReq = async () => {
  insertNoticeVisible.value = false;

  // 换行符替换
  insertEditForm.content = insertEditForm.content.replaceAll("\n", "<br>");

  await axios
    .post(`/users/meeting/${props.meetingId}/notice`, insertEditForm)
    .then((res) => {
      getNoticeList();
    });
};
// 按下添加公告
const insertNoticeSumbit = async (formEl) => {
  if (!formEl) return;
  await formEl.validate((valid, fields) => {
    if (valid) {
      insertNoticeReq();
      resetForm(formEl);
    }
  });
};
// 添加公告窗口关闭
const insertNoticeExitBefore = (insertNoticeFormRef) => {
  insertNoticeVisible.value = false;
  resetForm(insertNoticeFormRef);
};
// 去添加公告
const toInsertNotice = () => {
  insertNoticeVisible.value = true;
  // insertEditForm = ;
};

// 编辑公告请求
const updateNoticeReq = async () => {
  updateNoticeVisible.value = false;
  // 换行符替换
  updateEditForm.content = updateEditForm.content.replaceAll("\n", "<br>");
  await axios
    .put(`/users/meeting/${props.meetingId}/notice`, updateEditForm)
    .then((res) => {
      getNoticeList();
    });
};
// 按下编辑公告
const updateNoticeSumbit = async (formEl) => {
  if (!formEl) return;
  await formEl.validate((valid, fields) => {
    if (valid) {
      updateNoticeReq();
      resetForm(formEl);
    }
  });
};
// 编辑公告窗口关闭
const updateNoticeExitBefore = (updateNoticeFormRef) => {
  updateNoticeVisible.value = false;
  resetForm(updateNoticeFormRef);
};
// 去编辑公告
const toUpdateNotice = (notice) => {
  updateNoticeVisible.value = true;

  updateEditForm.title = notice.title;
  updateEditForm.content = notice.content;
  updateEditForm.type = notice.type;
  updateEditForm.id = notice.id;
  console.log(updateEditForm);
  // 复原
  updateEditForm.content = updateEditForm.content.replaceAll("<br>", "\n");
};

const toDelNotice = async (notice) => {
  // console.log(notice);
  await axios
    .delete(`/users/meeting/${props.meetingId}/notice/${notice.id}`)
    .then((res) => {
      getNoticeList();
    });
};

onMounted(() => {
  getNoticeList();
});
</script>

<template>
  <div class="u-notice-list">
    <el-dialog v-model="props.noticeVisible" width="50%" @close="closeVisible" center>
      <template #header>
        <div class="el-dialog-title">
          公告<el-button
            class="notice-add-button"
            :icon="Plus"
            @click="toInsertNotice"
            circle
            v-if="isMaster"
          />
        </div>
      </template>
      <div class="dialog-content">
        <el-scrollbar ref="scrollbarRef" height="420px">
          <!-- <el-space direction="vertical" style="width: 100%" fill> -->
          <div v-for="(item, index) in noticeList" :key="index">
            <el-card
              shadow="always"
              class="one-notice"
              @mouseover="item.isShow = true"
              @mouseleave="item.isShow = false"
              v-if="!item.hidden"
            >
              <template #header>
                <div class="card-header">
                  <span class="notice-title">{{ item.title }}</span>
                </div>
              </template>
              <div class="notice-content" v-html="item.content"></div>
              <div class="tips">
                <el-row :gutter="20">
                  <el-col :span="18"
                    ><span class="update-time"
                      >{{ item.sender.name }} 编辑于 {{ item.updateTime }}</span
                    ></el-col
                  >
                  <el-col :span="6"
                    ><span class="click-block" v-show="item.isShow && isMaster"
                      ><el-link :underline="false" @click="toUpdateNotice(item)"
                        >编辑</el-link
                      >
                      <el-link :underline="false" @click="toDelNotice(item)"
                        >删除</el-link
                      ></span
                    ></el-col
                  >
                </el-row>
              </div>
            </el-card>
          </div>
          <!-- </el-space> -->
        </el-scrollbar>
      </div>
    </el-dialog>
    <!-- 添加公告对话框 -->
    <el-dialog
      v-model="insertNoticeVisible"
      width="50%"
      title="添加公告"
      center
      :before-close="() => insertNoticeExitBefore(insertNoticeFormRef)"
    >
      <span>
        <el-form
          ref="insertNoticeFormRef"
          label-width="120px"
          :model="insertEditForm"
          :rules="noticeRules"
          status-icon
        >
          <el-form-item label-width="0px" prop="title">
            <el-input v-model="insertEditForm.title" placeholder="填写公告标题" />
          </el-form-item>
          <el-form-item label-width="0px" prop="content"
            ><el-input
              v-model="insertEditForm.content"
              :autosize="{ minRows: 12, maxRows: 12 }"
              type="textarea"
              placeholder="填写公告内容"
            />
          </el-form-item>
          <el-form-item label="是否推送该公告" prop="type">
            <el-switch
              v-model="insertEditForm.type"
              active-value="2"
              inactive-value="1"
            />
          </el-form-item>
        </el-form>
      </span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="insertNoticeExitBefore(insertNoticeFormRef)">取消</el-button>
          <el-button type="primary" @click="insertNoticeSumbit(insertNoticeFormRef)"
            >添加</el-button
          >
        </span>
      </template>
    </el-dialog>

    <!-- 编辑公告对话框 -->
    <el-dialog
      v-model="updateNoticeVisible"
      width="50%"
      title="编辑公告"
      center
      :before-close="() => updateNoticeExitBefore(updateNoticeFormRef)"
    >
      <span>
        <el-form
          ref="updateNoticeFormRef"
          label-width="120px"
          :model="updateEditForm"
          :rules="noticeRules"
          status-icon
        >
          <el-form-item label-width="0px" prop="title">
            <el-input v-model="updateEditForm.title" placeholder="填写公告标题" />
          </el-form-item>
          <el-form-item label-width="0px" prop="content"
            ><el-input
              v-model="updateEditForm.content"
              :autosize="{ minRows: 12, maxRows: 12 }"
              type="textarea"
              placeholder="填写公告内容"
            />
          </el-form-item>
          <el-form-item label="是否推送该公告" prop="type">
            <el-switch
              v-model="updateEditForm.type"
              :active-value="2"
              :inactive-value="1"
            />
          </el-form-item>
        </el-form>
      </span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="updateNoticeExitBefore(updateNoticeFormRef)">取消</el-button>
          <el-button type="primary" @click="updateNoticeSumbit(updateNoticeFormRef)"
            >完成</el-button
          >
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.one-notice {
  margin-bottom: 10px;
}
.el-dialog-title {
  font-size: 20px;
}
.notice-add-button {
  margin-left: 20px;
}
.card-header {
  text-align: center;
}
.tips {
  margin-top: 15px;
  height: 15px;
}
.update-time {
  font-size: 13px;
  color: darkgrey;
}

.click-block {
  color: rgb(71, 116, 200);
}

.el-link {
  margin-right: 25px;
}
</style>
