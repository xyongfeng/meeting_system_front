<script setup>
import { ref, reactive, onBeforeMount } from "vue";
import { useRoute, onBeforeRouteUpdate, useRouter } from "vue-router";
import axios from "../../../js/axios";
import store from "../../../js/store";
import {
  addImagePath,
  myLocalInfo,
  getUserFormRule,
  convetFormNull,
  beforeAvatarUpload,
  avatarUploadReq,
  logout,
} from "../../../utils/myUtils";

const captchaRef = ref();
const route = useRoute();
const router = useRouter();
const userId = ref(route.params.uid);
const readonly = ref(true);
const activeName = ref("base");
const userInfo = reactive({
  id: null,
  name: "",
  username: "",
  telephone: "",
  email: "",
  headImage: "",
  faceImage: "",
});
// 修改基本信息
const formRulesRef = ref();
const userRules = reactive(getUserFormRule());
const editForm = reactive({
  id: "",
  name: "",
  email: "",
  telephone: "",
});

// 修改头像对话框展示
const updateHeadImgVisible = ref(false);

// 修改头像文件
const updateImgFile = ref(null);

// 修改头像框对象
const updateHeadImageRef = ref(null);

const headImgAfterUpdate = () => {
  updateHeadImgVisible.value = false;
  getUserInfo();
};
// 去更新头像表单
const toUpdateHeadImg = () => {
  updateHeadImgVisible.value = true;
  updateHeadImageRef.value.toUpdateHeadImg(userInfo.id, userInfo.headImage);
};

const updateBaseInfo = async () => {
  await formRulesRef.value.validate(async (valid, fields) => {
    if (valid) {
      // convetFormNull(editForm, ["email", "telephone"]);
      await axios.put("/users/info", editForm).then((res) => {
        if (res.code == 200) {
          AtoB(editForm, userInfo);
        }
      });
    }
  });
};
// 修改信息
const updatePassRulesRef = ref();
// const updatePassRules = reactive(getUserFormRule());
const updatePassForm = reactive({
  id: "",
  oldpass: "",
  newpass: "",
  code: "",
});

const toLogout = () => {
  logout();
};

const updatePass = async () => {
  await formRulesRef.value.validate(async (valid, fields) => {
    if (valid) {
      updatePassForm.id = userInfo.id;
      await axios.put("/users/info/password", updatePassForm).then((res) => {
        if (res.code == 500) {
          updateCaptcha();
          return;
        }
        updatePassRulesRef.value.resetFields();
        toLogout();
      });
    }
  });
};

const AtoB = (a, b) => {
  b.id = a.id;
  b.name = a.name;
  b.email = a.email;
  b.telephone = a.telephone;
};

const getUserInfo = async () => {
  await axios.get(`/users/info/${userId.value}/byId`).then((res) => {
    if (res.code == 200) {
      userInfo.id = res.data.id;
      userInfo.name = res.data.name;
      userInfo.username = res.data.username;
      userInfo.telephone = res.data.telephone;
      userInfo.email = res.data.email;
      userInfo.headImage = addImagePath(res.data.headImage);
      userInfo.faceImage = addImagePath(res.data.faceImage);
      // 是否为本人的个人中心，不是则只可读
      if (userInfo.id == myLocalInfo().id) {
        // 这里为本人的情况
        readonly.value = false;
        AtoB(userInfo, editForm);
      }
    } else {
      router.replace("/404");
    }
  });
};
const updateCaptcha = () => captchaRef.value.updateCaptcha();

const clearCode = () => {
  updatePassForm.code = "";
};
// 通过验证之后
const handleAvatarSuccess = (file, fileList) => {
  // updateEditForm.headImage = URL.createObjectURL(file.raw);
  // console.log(file.raw);
  // 失败返回
  // console.log(uploadAccess.value);
  if (!faceAccess.value) return;
  avatarUploadReq(file.raw, `/users/info/faceImg`).then(() => {
    // updateImgFile.value = null;
    getUserInfo();
  });
};
const takePhotoRef = ref(null);
const takePhotoVisible = ref(false);
const takePhotoUpload = async () => {
  await axios
    .post(`/users/info/faceImg`, { imgBase64: takePhotoRef.value.getImgBase64() })
    .then(() => {
      takePhotoRef.value.stopLoading();
      getUserInfo();
      // takePhotoVisible.value = false;
      takePhotoRef.value.beforeClose();
    });
};

// 申请好友
const applyFriend = async () => {
  await axios.post(`/users/friend/application/${userInfo.id}`);
};
// 删除好友
const deleteFriend = async () => {
  await axios.delete(`/users/friend/${userInfo.id}`).then(() => {
    getFriends();
    // 更新好友列表
    store.dispatch("getFriendsAndChats", { current: 0 });
  });
};

// 是否为好友
const isFriend = ref(false);
const getFriends = async () => {
  isFriend.value = false;
  await axios.get(`/users/friend/0/-1`).then(({ data }) => {
    data.records.forEach((item) => {
      if (item.uid == userInfo.id) {
        isFriend.value = true;
      }
    });
    // console.log(isFriend.value);
  });
};

const meetingScreenshotList = ref([]);
const meetingList = ref([]);
const screenshotList = ref([]);
const selectList = ref([]);
const meetingSelect = ref();
// 会议截屏
const getMeetingScreenshot = async () => {
  await axios.get(`/meetingScreenshot`).then((res) => {
    meetingScreenshotList.value = res.data;
    var meetingIds = new Set();
    res.data.forEach(
      (item) => {
        item["path"] = addImagePath(item["path"]);
        // console.log(meetingIds.has(item.meeting.id), item.meeting.id, item);
        if (meetingIds.has(item.meeting.id)) return;
        meetingIds.add(item.meeting.id);
        meetingList.value.push({ label: item.meeting.name, value: item.meeting.id });
      }
      // meetingIds.add({ label: item.meeting.name, value: item.meeting.id })
    );
    // meetingSelect.value = meetingIds.values()[0];
    // console.log(meetingList.value);
  });
};
const onMeetingSelectChange = (meetingId) => {
  screenshotList.value = [];
  meetingScreenshotList.value.forEach((item) => {
    if (item.meeting.id == meetingId) {
      screenshotList.value.push(item);
    }
  });
};
const delScreenshotById = async (id) => {
  await axios.delete(`/meetingScreenshot/${id}`).then((res) => {
    if (res.code == 200) {
      meetingScreenshotList.value = meetingScreenshotList.value.filter(
        (item) => item.id != id
      );
      screenshotList.value = screenshotList.value.filter((item) => item.id != id);
    }
  });
};

const beforeMountAction = () => {
  getUserInfo().then(() => {
    getFriends();
    // 如果第一次上传则不用验证
    faceAccess.value = userInfo.faceImage === "";
  });
};
// 同一个路由，还是会保留数据，所以要对数据进行更新
onBeforeRouteUpdate((to, from) => {
  userId.value = to.params.uid;
  beforeMountAction();
});

const sumbitFaceTake = () => {
  if (faceAccess.value) {
    takePhotoVisible.value = true;
  } else {
    ElMessage.warning("请先完成身份验证");
  }
};

var uploadAccess = ref(false);
// 只能做提示挡不住
const beforeUpload = (raw) => {
  if (!faceAccess.value) {
    ElMessage.warning("请先完成身份验证");
    uploadAccess.value = false;
    return false;
  } else {
    uploadAccess.value = beforeAvatarUpload(raw);
    return uploadAccess.value;
  }
};
// 身份验证
const faceVerificationRef = ref();
const faceAccess = ref(false);
const setFaceVerificationVisible = (x) =>
  faceVerificationRef.value.setFaceVerificationVisible(x);
const successAction = () => {
  faceAccess.value = true;
};

onBeforeMount(() => {
  beforeMountAction();
  getMeetingScreenshot();
});
</script>

<template>
  <div class="u-user-center">
    <el-container>
      <el-aside width="200px"
        ><div class="head-image">
          <el-avatar shape="circle" :size="100" fit="fill" :src="userInfo.headImage" />
        </div>
        <div class="name">{{ userInfo.name }}</div>
        <div class="aside-button">
          <el-button v-if="readonly && !isFriend" type="primary" @click="applyFriend"
            >申请为好友</el-button
          >
          <el-popconfirm
            v-else-if="isFriend"
            title="是否确认删除？"
            @confirm="deleteFriend"
          >
            <template #reference>
              <el-button type="danger">删除好友</el-button>
            </template>
          </el-popconfirm>

          <el-button v-else-if="!readonly" type="primary" @click="toUpdateHeadImg"
            >修改头像</el-button
          >
        </div>
      </el-aside>
      <el-main>
        <div class="main_read_only" v-if="readonly">
          <user-basic-info :userInfo="userInfo" />
        </div>
        <div class="main_edit" v-else>
          <el-tabs v-model="activeName" class="demo-tabs" tabPosition="left">
            <el-tab-pane label="基本信息" name="base">
              <el-form
                ref="formRulesRef"
                :model="editForm"
                :rules="userRules"
                status-icon
                label-width="120px"
              >
                <el-form-item label="名称" prop="name">
                  <el-input v-model="editForm.name" />
                </el-form-item>
                <el-form-item label="邮箱" prop="email">
                  <el-input v-model="editForm.email" />
                </el-form-item>
                <el-form-item label="手机" prop="telephone">
                  <el-input v-model="editForm.telephone" />
                </el-form-item>
                <div style="margin-left: 120px">
                  <el-button type="primary" @click="updateBaseInfo" style="width: 30vh"
                    >修改</el-button
                  >
                </div>
              </el-form>
            </el-tab-pane>
            <el-tab-pane label="面部照片" name="faceImage">
              <div class="face-image-block">
                <el-container>
                  <el-aside width="400px"
                    ><img class="face-img" :src="userInfo.faceImage"
                  /></el-aside>
                  <el-main>
                    <div class="face-upload-block">
                      <el-button
                        style="width: 30vh"
                        type="primary"
                        @click="setFaceVerificationVisible(true)"
                        :disabled="faceAccess"
                        >身份验证</el-button
                      ><br />
                      <el-button
                        style="margin-top: 5vh; width: 30vh"
                        type="primary"
                        @click="sumbitFaceTake"
                        :disabled="!faceAccess"
                        >拍照上传</el-button
                      ><br />
                      <el-upload
                        :show-file-list="false"
                        :on-change="handleAvatarSuccess"
                        :before-upload="beforeUpload"
                        :http-request="(item) => (updateImgFile = item.file)"
                        :disabled="!faceAccess"
                        ><el-button
                          style="margin-top: 5vh; width: 30vh"
                          type="primary"
                          :disabled="!faceAccess"
                          >本地上传</el-button
                        ></el-upload
                      >
                    </div>
                  </el-main>
                </el-container>
              </div>
            </el-tab-pane>
            <el-tab-pane label="会议截屏" name="meetingScreenshot">
              <!-- <div v-for="(item, index) in meetingScreenshotList" :key="index">
                {{ item.meeting.name }}
              </div> -->

              <el-select
                v-model="meetingSelect"
                placeholder="选择会议"
                @change="onMeetingSelectChange"
              >
                <el-option
                  v-for="item in meetingList"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </el-select>
              <el-scrollbar max-height="350px" class="box-super">
                <el-card
                  class="box-card"
                  v-for="(item, index) in screenshotList"
                  :key="index"
                >
                  <el-image
                    style="width: 100%; display: block"
                    :src="item.path"
                    :zoom-rate="1.2"
                    fit="cover"
                    :preview-src-list="[item.path]"
                  />
                  <div class="box-card-button">
                    <!-- <el-button type="success">推荐给好友</el-button> -->
                    <el-button type="danger" @click="delScreenshotById(item.id)"
                      >删除</el-button
                    >
                  </div>
                </el-card>
              </el-scrollbar>
            </el-tab-pane>

            <el-tab-pane label="修改密码" name="password">
              <el-form
                ref="updatePassRulesRef"
                :model="updatePassForm"
                :rules="userRules"
                status-icon
                label-width="120px"
              >
                <el-form-item label="当前密码" prop="oldpass">
                  <el-input v-model="updatePassForm.oldpass" show-password />
                </el-form-item>
                <el-form-item label="新密码" prop="newpass">
                  <el-input v-model="updatePassForm.newpass" show-password />
                </el-form-item>
                <el-form-item label="验证码" prop="code">
                  <el-input
                    v-model="updatePassForm.code"
                    style="width: 15vh; margin-right: 5px"
                  />
                  <captcha ref="captchaRef" :clearCode="clearCode" />
                </el-form-item>
                <div style="margin-left: 120px">
                  <el-button type="primary" @click="updatePass" style="width: 30vh"
                    >修改</el-button
                  >
                </div>
              </el-form>
            </el-tab-pane>
          </el-tabs>
        </div>
        <update-head-image
          ref="updateHeadImageRef"
          v-model="updateHeadImgVisible"
          :closeView="() => (updateHeadImgVisible = false)"
          :afterUpdate="headImgAfterUpdate"
        />
        <take-photo
          ref="takePhotoRef"
          v-if="takePhotoVisible"
          title="照片上传"
          :sendAction="takePhotoUpload"
          :closeView="() => (takePhotoVisible = false)"
        />

        <!-- 人脸验证 -->
        <face-verification ref="faceVerificationRef" :successAction="successAction" />
      </el-main>
    </el-container>
  </div>
</template>

<style scoped>
.box-card-button {
  text-align: center;
  margin-top: 3px;
}
.box-super {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
}
.box-card {
  display: inline-block;
  width: 50vh;
  /* margin-left: 2%; */
  margin-left: 5px;
}
.face-upload-block {
  /* margin: auto auto; */
  /* left: 50%; */
  /* top: 50%; */
  margin: 6vh 6vh;
}
.face-img {
  height: 300px;
  width: 300px;
}

.face-image-block {
  margin-top: 5vh;
  height: 50vh;
}

.el-tabs {
  height: 50vh;
}
.name {
  margin-top: 2vh;
  /* text-align: center; */
  font-size: larger;
}

.aside-button {
  margin-top: 2vh;
}
.head-image {
  margin-top: 2vh;
  /* text-align: center; */
}
.u-user-center {
  height: 60vh;
}
.main {
  margin-left: 15vh;
}
.el-container {
  height: 100%;
}
.el-aside {
  text-align: center;
  /* background-color: aquamarine; */
}
.main_edit .el-input {
  width: 30vh;
}
</style>
