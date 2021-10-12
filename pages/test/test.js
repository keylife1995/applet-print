// pages/test/test.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    orders: []
  },
  bindclose: function(){
    console.log('print-view close')
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let order = {
      number: '10671011',
      takeAddress: '体育馆顺丰',
      takeCode: 'A-5016',
      receiveAddress: '翠竹一',
      receiveName: '李赵蚊',
      title: '由快点云打印提供技术支持',
      adstr: '点外卖：微信搜索合顺堂，校内商家好吃不贵'
    }
    let orders = this.data.orders
    orders[orders.length] = order
    orders[orders.length] = order
    this.setData({
      orders: orders
    })
  },

})