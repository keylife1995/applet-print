//app.js
import event from './event.js'
wx.event = event
App({
  onShow: function (params) {},
  onLaunch: function () {
    let that = this;
    wx.getSystemInfo({
      success: function (res) {
        // let clientHeight = res.windowHeight;
        // let clientWidth = res.windowWidth;
        console.log(res)
        // let ratio = 750 / clientWidth;
        // let height = clientHeight * ratio;
        that.globalData.statusBarHeight = res.statusBarHeight + 6 // 6是右上角胶囊的上边距
        that.globalData.windowHeight = res.windowHeight
        that.globalData.systemInfo = res
      }
    });
  },
  get: function (url, param, callback) {
    wx.request({
      url: this.globalData.baseUrl + url,
      data: param,
      method: 'get',
      header: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': this.globalData.token },
      success: function (e) {
        // console.log(e)
        if (e.data.code == 1 && e.data.msg == "未登录") {
          //登录过期
          wx.reLaunch({
            url: '/pages/index/index',
          })
        } else {
          callback(e.data)
        }
      },
      fail: function (err) {
        callback({
          code: 1,
          data: err,
          msg: "加载出错"
        })
      }
    })
  },
  post: function (url, param, callback) {
    wx.request({
      url: this.globalData.baseUrl + url,
      data: param,
      method: 'post',
      header: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': this.globalData.token },
      success: function (e) {
        // console.log(e)
        if (e.data.code == 1 && e.data.msg == "未登录") {
          //登录过期
          wx.reLaunch({
            url: '/pages/index/index',
          })
        } else {
          if (e.data.status == 500) {
            callback({
              code: 1,
              msg: "加载出错" + e.data.message
            })
          }
          callback(e.data)
        }
      },
      fail: function (err) {
        callback({
          code: 1,
          data: err,
          msg: "加载出错"
        })
      }
    })
  },
  uploadFile: function (url, filePath, param, callback) {
    wx.uploadFile({
      url: this.globalData.baseUrl + url,
      filePath: filePath,
      name: 'file',
      header: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cookie': this.globalData.token },
      formData: param,
      success(e) {
        let data = JSON.parse(e.data)
        // console.log(e)
        if (data.code == 1 && data.msg == "未登录") {
          //登录过期
          wx.reLaunch({
            url: '/pages/index/index',
          })
        } else {
          if (data.status == 500) {
            callback({
              code: 1,
              msg: "加载出错" + data.message
            })
          }
          callback(data)
        }
      }
    })
  },
  //获取头像等信息
  toLogin: function(callback){
    //调整登录,获取用户头像信息，然后调转登录
    wx.getUserProfile({
      desc: '用于登录云打印', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: (res) => {
        this.tempData.wechatInfo = res.userInfo
        callback(true)
      },
      fail: (e) => {
        wx.showToast({
          icon: 'none',
          title: '获取用户信息失败',
        })
        callback(false)
      }
    })
  },
  globalData: {
    systemInfo: {},
    windowHeight: 600,
    userInfo: {},
    token: null,
    statusBarHeight: 0,
    // baseUrl: 'https://app.kdslow.com/api'
    baseUrl: 'http://192.168.8.15:8083'
  },
  tempData: {
    loginTmp: {},//小程序登录临时数据
  }
})