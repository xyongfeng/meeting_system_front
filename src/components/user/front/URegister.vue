<script setup>
import { UserOutlined, LockOutlined } from "@ant-design/icons-vue";
import { ref, reactive } from "vue";
import axios from "../../../js/axios";
import { useRouter } from "vue-router";
import { convetFormNull, getUserFormRule } from "../../../utils/myUtils";
// const flag = ref(false);
const captchaRef = ref();
const router = useRouter();

const formRulesRef = ref("");
const user = reactive({
  id: "",
  username: "",
  password: "",
  name: "",
  email: "",
  headImage: "",
  telephone: "",
  code: "",
});

const userRules = reactive(getUserFormRule());
const updateCaptcha = () => captchaRef.value.updateCaptcha();

const clearCode = () => {
  user.code = "";
};
const register = async () => {
  await formRulesRef.value.validate(async (valid, fields) => {
    if (valid) {
      convetFormNull(user, ["email", "telephone"]);
      const res = await axios.post("/users/register", user);
      if (res.code == 500) {
        updateCaptcha();
        return;
      }

      router.push("/login");
    } else {
      updateCaptcha();
    }
  });
};
</script>

<template>
  <div class="u-register">
    <el-form
      class="loginContainer"
      :rules="userRules"
      ref="formRulesRef"
      :model="user"
      label-width="80px"
    >
      <h3 class="loginTitle">注册</h3>
      <el-form-item label="用户名" prop="username">
        <el-input v-model="user.username" />
      </el-form-item>
      <el-form-item label="密码" prop="password">
        <el-input v-model="user.password" show-password />
      </el-form-item>
      <el-form-item label="名称" prop="name">
        <el-input v-model="user.name" />
      </el-form-item>
      <el-form-item label="邮箱" prop="email">
        <el-input v-model="user.email" />
      </el-form-item>
      <el-form-item label="手机号" prop="telephone">
        <el-input v-model="user.telephone" />
      </el-form-item>
      <el-form-item prop="code" label="验证码">
        <el-input
          v-model="user.code"
          @keyup.enter="register"
          style="width: 155px; margin-right: 5px"
        ></el-input>
        <captcha ref="captchaRef" :clearCode="clearCode" />
      </el-form-item>

      <el-button type="primary" @click="register" style="width: 100%">注册</el-button>
    </el-form>
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
</style>
