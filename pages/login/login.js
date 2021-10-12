// index.js
// 获取应用实例
const app = getApp()
Page({
  data: {
    phoneInfo: null, //本地回调获取的
    codeMap: null, //code红后台换取的数据
    wechatInfo: {},
    userInfo: {},
  },
  
  //修改用户信息
  updateInfo: function () {
    let _this = this
    let wechatUserInfo = app.tempData.wechatInfo
    _this.setData({
      isloading: true
    })
    app.post("/biz/app/user/edit",{nickname:wechatUserInfo.nickName,userImg:wechatUserInfo.avatarUrl},function(upres){
      _this.setData({
        isloading: false
      })
      if (upres.code == 0) {
        let userInfo =  app.globalData.userInfo
        userInfo.userImg = wechatUserInfo.avatarUrl
        userInfo.nickname = wechatUserInfo.nickName
        app.globalData.userInfo = userInfo
        wx.event.emit('loginStateChange')
        console.log(userInfo)
        wx.navigateBack({
          delta: 0,
        })
      } else {
        wx.showToast({
          icon: 'none',
          title: upres.msg,
        })
      }
    })
  },
  //获取用户信息
  getUserInfo: function(){
    var _this = this;
    this.setData({
      isloading: true
    })
    app.get('/biz/app/user/info', {}, function (res) {
      _this.setData({
        isloading: false
      })
      console.log(res)
      if (res.code == 0) {
        app.globalData.userInfo = res.data
        if(!res.data.userImg||res.data.userImg==''||!res.data.nickname||res.data.nickname==''){
          //如果为空设置，---后续可以修改为不一致 更新
          _this.updateInfo()
        }else{
          wx.event.emit('loginStateChange')
          wx.navigateBack({
            delta: 0,
          })
        }
      } else {
        wx.showToast({
          icon: 'none',
          title: res.msg,
        })
      }
    })
  },
  //注册并且登录
  registLogin: function () {
    let _this = this
    let data = {}
    data.encryptedData = this.data.phoneInfo.detail.encryptedData
    data.iv = this.data.phoneInfo.detail.iv
    data.sessionKey = this.data.codeMap.session_key
    console.log(data)
    // 发送到后台进行解密
    app.post('/biz/app/applet/decrypt', data, function (res) {
      console.log(res)
      _this.setData({
        isloading: false
      })
      if (res.code == 0) {
        //调用注册登录接口
        let registData = {}
        registData.openId = _this.data.codeMap.openid
        let json = JSON.parse(res.data)
        registData.mobile = json.purePhoneNumber
        console.log(json)
        if (!registData.mobile) {
          return
        }
        app.post('/biz/app/applet/regist', registData, function (registRes) {
          console.log(registRes)
          _this.setData({
            isloading: false
          })
          if (registRes.code == 0) {
            app.globalData.token = registRes.data;
            _this.setData({
              isLogined: true
            })
            _this.getUserInfo()
          } else {
            wx.showToast({
              icon: 'none',
              title: registRes.msg,
            })
          }
        })
      } else {
        wx.showToast({
          icon: 'none',
          title: res.msg,
        })
      }
    })
  },
  // 获取用户手机号
  getphonenumber: function (e) {
    this.setData({
      isloading: true
    })
    console.log('getphonenumber is success')
    console.log(e.detail.errMsg)
    console.log(e.detail.iv)
    console.log(e.detail.encryptedData)
    this.data.phoneInfo = e
    console.log('phonenumber to registLogin')
    this.registLogin()
  },
  // 小程序通过code登录---后续可能删除
  appltLogin: function () {
    var _this = this;
    this.setData({
      isloading: true
    })
    wx.login({
      success: res => {
        // 发送 res.code 到后台进行登录
        // 发送到后台进行解密
        app.post('/biz/app/applet/oauth/code', {
          code: res.code
        }, function (res) {
          console.log(res)
          _this.setData({
            isloading: false
          })
          if (res.code == 0) {
            //存储登录状态
            app.globalData.token = res.data;
            _this.setData({
              isLogined: true
            })
            _this.getUserInfo()
          } else if (res.code == 2) {
            //存储seesion_key openId等数据
            _this.data.codeMap = res.data;
            _this.setData({
              showlogin: true
            })
          } else {
            wx.showToast({
              icon: 'none',
              title: res.msg,
            })
          }
        })
      }
    })
  },
  onLoad() {
    // this.appltLogin()
    this.setData({
      codeMap: app.tempData.loginTmp
    })
  },
})
