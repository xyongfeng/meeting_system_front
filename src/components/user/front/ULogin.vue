<script setup>
import {UserOutlined, LockOutlined} from "@ant-design/icons-vue";
import {
  ref,
  reactive,
  onBeforeMount,
  render,
  inject,
  onUnmounted,
  onMounted,
} from "vue";
import axios from "../../../js/axios";
import {useRouter} from "vue-router";
import store from "../../../js/store";
import {updateLocalUserInfo} from "../../../utils/myUtils";
import RecordFooter from "../../global/RecordFooter.vue";

const captchaRef = ref();
const router = useRouter();
// 如果是线上就禁用拍照登录和注册 primary or info
const photoLoginType = ref("primary");
const registerType = ref("primary");

// const captchaUrl = ref("/api/captcha?date=" + new Date());

const formRulesRef = ref("");
const user = reactive({
  username: "",
  password: "",
  code: "",
});

const userRules = reactive({
  username: [
    {
      required: true,
      message: "请输入用户名",
      trigger: "blur",
    },
  ],
  password: [
    {
      required: true,
      message: "请输入密码",
      trigger: "blur",
    },
  ],
  code: [
    {
      required: true,
      message: "请输入验证码",
      trigger: "blur",
    },
  ],
});

const updateCaptcha = () => captchaRef.value.updateCaptcha();
const clearCode = () => {
  user.code = "";
};
const socket = inject("socket");

const loginSuccess = (res) => {
  window.localStorage.setItem("adminlogin", res.data.tokenHead + " " + res.data.token);
  // 获取用户消息
  updateLocalUserInfo().then(() => {
    // 上传用户连接信息
    socket.emit("info", store.getters.userInfo);

    var nextAdmin = window.localStorage.getItem("nextAdmin");

    window.localStorage.removeItem("nextAdmin");

    if (nextAdmin || store.getters.userInfo.username == "root") {
      if (!store.getters.userInfo.isAdmin || store.getters.userInfo.perms.length <= 1) {
        router.replace("/");
        return;
      }

      router.replace("/admin");
    } else {
      router.replace("/");
    }
  });
};

const login = async () => {
  await formRulesRef.value.validate(async (valid, fields) => {
    if (valid) {
      const res = await axios.post("/users/login", user);
      // console.log(res);
      if (res.code === 500) {
        updateCaptcha();
        return;
      }
      loginSuccess(res);
    } else {
      updateCaptcha();
    }
  });
};
const register = () => {
  if (photoLoginType.value === "info") {
    ElMessage.warning("为了防止系统被滥用，注册功能已被禁用，请联系管理员获取账号")
  } else {
    router.push("/register");
  }
};

// 拍照可视化
const takePhotoVisible = ref(false);

const onPhotoLogin = () => {
  if (photoLoginType.value === "info") {
    ElMessage.warning("拍照登录已被禁用")
  } else {
    takePhotoVisible.value = true;
  }
}

// 拍照组件对象，可以读取拍照图片的base64
const takePhotoRef = ref(null);
const takePhotoLogin = async () => {
  await axios
      .post(`/users/loginWithFace`, {imgBase64: takePhotoRef.value.getImgBase64()})
      .then((res) => {
        takePhotoRef.value.stopLoading();
        if (res.code == 500) return;
        loginSuccess(res);

        takePhotoRef.value.beforeClose();
      });
};
</script>

<template>
  <div class="u-login">
    <el-form class="loginContainer" :rules="userRules" ref="formRulesRef" :model="user">
      <!-- <h4>基于Vue&Springboot&Tensorflow框架的音视频会议系统</h4> -->
      <h3 class="loginTitle">音视频会议系统</h3>

      <div class="photoLogin">
        <el-link :underline="false" :type="photoLoginType" @click="onPhotoLogin"
        >拍照登录
        </el-link
        >
      </div>

      <el-form-item prop="username">
        <el-input
            :prefix-icon="UserOutlined"
            v-model="user.username"
            @keyup.enter="login"
            placeholder="请输入用户名"
        />
      </el-form-item>
      <el-form-item prop="password">
        <el-input
            :prefix-icon="LockOutlined"
            v-model="user.password"
            @keyup.enter="login"
            placeholder="请输入密码"
            show-password
        />
      </el-form-item>
      <el-form-item prop="code">
        <el-input
            v-model="user.code"
            @keyup.enter="login"
            placeholder="请输入验证码"
            style="width: 230px; margin-right: 5px"
        ></el-input>
        <!-- <img :src="captchaUrl" @click="updateCaptcha" /> -->
        <captcha ref="captchaRef" :clearCode="clearCode"/>
      </el-form-item>
      <div>
        <el-button type="primary" @click="login" style="width: 100%">登录</el-button>
      </div>
      <div style="margin-top: 10px">
        <el-button :type="registerType" @click="register" style="width: 100%">注册</el-button>
      </div>

    </el-form>
    <take-photo
        ref="takePhotoRef"
        v-if="takePhotoVisible"
        title="拍照登录"
        :sendAction="takePhotoLogin"
        :closeView="() => (takePhotoVisible = false)"
    />
    <record-footer/>
  </div>

</template>

<style>
.loginContainer {
  background-clip: padding-box;
  margin: 20vh auto;
  width: 350px;
  padding: 15px 35px 15px 35px;
  background: #fff;
  border: 1px solid #eaeaea;
  box-shadow: 0 0 25px #cac6c6;
}

.loginTitle {
  text-align: center;
  margin: 8px auto 30px auto;
}

.photoLogin {
  text-align: center;
  margin-bottom: 5px;
}


</style>
