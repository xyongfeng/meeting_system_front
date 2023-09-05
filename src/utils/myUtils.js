
import axios from "../js/axios";

  // 将其中为空串的字段赋值为null，不然后端也会进行验证
export const convetFormNull = (form, arr) => {
  arr.forEach((value, index, arr) => {
    if (form[value] == "") form[value] = null;
  });
};

export const addImagePath = (path) => {
  if(path === '' || path == null) return '';
  return "/api/static/" + path
};

export const myLocalInfo = ()=>{
    
  return JSON.parse(window.localStorage.getItem('user'))
}

export const reqReadChat = async (uid)=>{
  await axios.put(`/users/friend/${uid}/chat`)
}

// 给时间添个0
const timeTo2 = (x) => {
  return x < 10 ? "0" + x : x;
};

export const getTime = () => {
  var date = new Date();
  return `${timeTo2(date.getHours())}:${timeTo2(date.getMinutes())}`;
};

export const getUserFormRule = ()=>{
  return {
    username: [
      { required: true, message: "用户名不能为空" },
      { max: 20, message: "用户名长度不能大于20" },
    ],
    password: [
      { required: true, message: "密码不能为空" },
      { max: 20, message: "密码长度不能大于20" },
    ],
    oldpass: [
      { required: true, message: "当前密码不能为空" },
      { max: 20, message: "密码长度不能大于20" },
    ],
    newpass: [
      { required: true, message: "新密码不能为空" },
      { max: 20, message: "密码长度不能大于20" },
    ],
    name: [
      { required: true, message: "名称不能为空" },
      { max: 10, message: "名称长度不能大于10" },
    ],
    code: [
      {
        required: true,
        message: "请输入验证码",
      },
    ],
    email: [{ type: "email", message: "请输入正确的邮箱地址" }],
    telephone: [
      {
        message: "请输入正确的手机号",
        pattern: /^[1][3,4,5,6,7,8,9][0-9]{9}$/,
      },
    ],
  }
}

export const updateLocalUserInfo = async ()=>{
  // console.log("1")
  // 获取登录用户信息并保存到本地local
  let {data:res} = await axios.get("/users/info")
  saveLocalUserInfo(res)
  return res
}

export const saveLocalUserInfo = (info)=>{
  // 为头像路径添加前缀
  info.headImage = addImagePath(info.headImage)
  window.localStorage.setItem('user',JSON.stringify(info))
}

// 上传图片前的验证
export const beforeAvatarUpload = (rawFile) => {
  
  if (rawFile.type !== "image/jpeg" && rawFile.type !== "image/png") {
    ElMessage.error("图片格式仅支持jpeg,png");
    return false;
  } else if (rawFile.size / 1024 / 1024 > 5) {
    ElMessage.error("图片大小不能超过5MB!");
    return false;
  }
  
  return true;
};

export const avatarUploadReq = async (updateImgFile,url)=>{
  var formdata = new FormData();
  formdata.append("file", updateImgFile);
  await axios.put(url, formdata, {
    "content-type": "multipart/form-data",
  });
}

// 退出登录
export const logout = async ()=>{
  await axios.post("users/logout");
  window.localStorage.removeItem("adminlogin");
  window.localStorage.removeItem("user");
  location.reload();
}


// 申请好友
export const applyFriend = async (uid) => {
  await axios.post(`/users/friend/application/${uid}`);
};

export const isExistMeeting = async (mid,uid)=>{
  let res = await axios.get(`/users/meeting/${mid}/existUser`);

  if (res.code != 200) {
    return;
  }
  let flag = false;
  res.data.forEach((item) => {
    if (item.id == uid) {
      flag = true;
    }
  });
  return flag;
}

export const getNowTime = (x)=>{
  
  var now = new Date()
  if(x) now = x

  var year =now.getFullYear();//得到年份
  var month = now.getMonth()+1;//得到月份
  var date = now.getDate();//得到日期
  var hour= now.getHours();//得到小时数
  var minute= now.getMinutes();//得到分钟数
  var second= now.getSeconds();//得到秒数

  return `${year}-${month}-${date} ${hour}:${minute}:${second}`
}

// 将该条进程睡眠之后再执行
export const sleep = (time) => {
  return new Promise((resolve) => setTimeout(resolve, time));
};


// 对分钟处理一下
export const showExistMinute = (minute) => {
  if (minute <= 60) return minute + " 分钟";
  let hour = parseInt(minute / 60);

  return hour + " 小时 " + (minute % 60) + " 分钟";
};