// pages/print/keylife-printview.js
/**
 * author keylife
 * email: keylife@foxmail.com
 * createtime: 2021-10-11
 */
const BLEprint = require('./utils/hardware/PrintUtil.js');
const BleUtil = require('./utils/hardware/BleUtil.js');
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    orderData: {
      type: Array,
      value: []
    }
  },

  /**
   * 组件的初始数据
   */
  data: {
    devices: [], //可用的蓝牙设备
    bindDevice: null, //当前连接的设备
    chs: [], //当前连接设备的特征值
    discoveryStarted: false, //是否在搜索蓝牙
  },
  /**
   * 组件的方法列表
   */
  methods: {
    bindclose: function () {
      this.triggerEvent('bindclose')
    },
    /**
     * 判断指定数组里面是否已经存在指定的数据项，通过指定的key判断
     * @param {指定数组} arr 
     * @param {指定的key} key 
     * @param {查找的key的值} val 
     */
    inArray: function (arr, key, val) {
      for (let i = 0; i < arr.length; i++) {
        if (arr[i][key] === val) {
          return i;
        }
      }
      return -1;
    },
    //初始化蓝牙模块
    openBluetoothAdapter() {
      let _this = this
      wx.showLoading({
        title: '初始化蓝牙',
      })
      wx.openBluetoothAdapter({
        success: (res) => {
          wx.hideLoading()
          console.log('openBluetoothAdapter success', res)
          _this.startBluetoothDevicesDiscovery()
        },
        fail: (res) => {
          wx.hideLoading()
          if (res.errCode === 10001) {
            wx.showToast({
              icon: 'none',
              title: '请开启蓝牙后重试',
            })
            wx.onBluetoothAdapterStateChange(function (res) {
              if (res.available) {
                _this.startBluetoothDevicesDiscovery()
              }
            })
          }
        }
      })
    },
    //关闭蓝牙模块
    closeBluetoothAdapter() {
      wx.closeBluetoothAdapter()
      this.setData({
        discoveryStarted: false
      })
    },
    //搜索蓝牙设备
    startBluetoothDevicesDiscovery() {
      if (this.data.discoveryStarted) {
        return
      }
      this.setData({
        discoveryStarted: true
      })
      let _this = this
      wx.startBluetoothDevicesDiscovery({
        allowDuplicatesKey: true,
        success: (res) => {
          _this.onBluetoothDeviceFound() //开启监听
        },
        fail(res) {
          wx.showToast({
            icon: 'none',
            title: '搜索蓝牙设备失败' + JSON.stringify(res),
          })
        }
      })
    },
    //停止蓝牙搜索
    stopBluetoothDevicesDiscovery() {
      wx.stopBluetoothDevicesDiscovery()
      this.setData({
        discoveryStarted: false
      })
    },
    //监听搜索到新的蓝牙设备
    onBluetoothDeviceFound() {
      let _this = this
      wx.onBluetoothDeviceFound((res) => {
        res.devices.forEach(device => {
          if (device.name || device.localName) {
            let devices = _this.data.devices
            let idx = _this.inArray(devices, 'deviceId', device.deviceId)
            if (idx === -1) {
              devices[devices.length] = device
            } else {
              devices[idx] = device
            }
            _this.setData({
              devices: devices
            })
          }
        })
      })
    },
    //创建和指定蓝牙设备的连接
    createBLEConnection(e) {
      let device = e.currentTarget.dataset.device
      if(device.advertisServiceUUIDs.length<1){
        wx.showToast({
          icon: 'none',
          title: '没有可用的service',
        })
        return
      }
      wx.showLoading({
        title: '连接中',
      })
      let _this = this
      console.log("clck device is : ",device)
      device.canWrite = false
      let deviceId = device.deviceId
      wx.createBLEConnection({
        deviceId,
        success: (res) => {
          wx.hideLoading()
          _this.setData({
            bindDevice: device,
          })
          _this.getBLEDeviceServices(deviceId) //获取蓝牙低功耗设备所有服务
        },
        fail(res) {
          wx.showToast({
            icon: 'none',
            title: '打印机连接失败：' + JSON.stringify(res),
          })
        }
      })
    },
    //断开与当前连接设备的连接
    closeBLEConnection() {
      if (!this.data.bindDevice) return
      wx.closeBLEConnection({
        deviceId: this.data.bindDevice.deviceId
      })
      this.setData({
        bindDevice: null
      })
      this.openBluetoothAdapter()
    },
    //获取蓝牙低功耗设备所有服务
    getBLEDeviceServices(deviceId) {
      let _this = this
      wx.showLoading({
        title: '获取蓝牙低功耗服务',
      })
      wx.getBLEDeviceServices({
        deviceId,
        success: (res) => {
          wx.hideLoading()
          var curBLEDeviceUUID = null
          for (let i = 0; i < res.services.length; i++) {
            if (res.services[i].isPrimary) { //查找到设备的主服务
              curBLEDeviceUUID = res.services[i].uuid
              break
            }
          }
          if (curBLEDeviceUUID) {
            _this.getBLEDeviceCharacteristics(deviceId, curBLEDeviceUUID) //获取设备主服务的特征 -- 输入流
          } else {
            wx.showToast({
              icon: 'none',
              title: '蓝牙低功耗服务获取失败：未找到主服务',
            })
          }
        },
        fail: (res) => {
          wx.hideLoading()
          wx.showToast({
            icon: 'none',
            title: '蓝牙低功耗服务获取失败' + JSON.stringify(res),
          })
        }
      })
    },
    getBLEDeviceCharacteristics(deviceId, serviceId) {
      let _this = this
      wx.showLoading({
        title: '获取特征值',
      })
      wx.getBLEDeviceCharacteristics({
        deviceId,
        serviceId,
        success: (res) => {
          wx.hideLoading()
          console.log('getBLEDeviceCharacteristics success', res.characteristics)
          for (let i = 0; i < res.characteristics.length; i++) {
            let item = res.characteristics[i]
            if (item.properties.read) {
              wx.readBLECharacteristicValue({
                deviceId,
                serviceId,
                characteristicId: item.uuid,
              })
            }
            if (item.properties.write) {
              _this.data.bindDevice.canWrite = true
              _this.data.bindDevice.serviceId = serviceId
              _this.data.bindDevice.characteristicId = item.uuid
              _this.setData({
                bindDevice: _this.data.bindDevice
              })
              // _this.writeBLECharacteristicValue() // 测试打印
              _this.stopBluetoothDevicesDiscovery() //停止蓝牙搜索
            }
            //如果可以监听，添加监听
            if (item.properties.notify || item.properties.indicate) {
              wx.notifyBLECharacteristicValueChange({
                deviceId,
                serviceId,
                characteristicId: item.uuid,
                state: true,
              })
            }
          }
        },
        fail(res) {
          wx.hideLoading()
          console.error('getBLEDeviceCharacteristics', res)
          wx.showToast({
            icon: 'none',
            title: '获取特征值失败：' + JSON.stringify(res),
          })
        }
      })
      // 操作之前先监听，保证第一时间获取数据
      wx.onBLECharacteristicValueChange((characteristic) => {
        const idx = inArray(this.data.chs, 'uuid', characteristic.characteristicId)
        if (idx === -1) {
          this.data.chs[this.data.chs.length] = {
            uuid: characteristic.characteristicId,
            value: ab2hex(characteristic.value)
          }
        } else {
          this.data.chs[idx] = {
            uuid: characteristic.characteristicId,
            value: ab2hex(characteristic.value)
          }
        }
        this.setData({
          chs: this.data.chs
        })
      })
    },
    /******************写数据部分******************* */
    writeBLECharacteristicValue() {
      let _this = this
      wx.showLoading({
        title: '正在打印...',
      })
      // let str = BLEprint.backUpOne()//退回一张纸
      for (let i = 0; i < this.properties.orderData.length; i++) {
        let order = this.properties.orderData[i]
        let str = BLEprint.orderToStr(order)
        var dataArr = this.subPackage(BleUtil.str2ab(str));
        dataArr.forEach(function (item, index) {
          _this.write(item)
        })
      }
      wx.hideLoading();
    },
    //数据大小分包
    subPackage: function (arrBuffer) {
      var valueArr = [];
      if (arrBuffer.byteLength <= 20) {
        valueArr.push(arrBuffer);
      } else {
        var index = 0;
        do {
          var length = arrBuffer.byteLength - index > 20 ? 20 : arrBuffer.byteLength - index;
          var newAb = new ArrayBuffer(length);
          newAb = arrBuffer.slice(index, index + length);
          valueArr.push(newAb);
          index += length;
        } while (index < arrBuffer.byteLength);
      }
      console.log(valueArr);
      return valueArr;
    },
    write: function (buffer) {
      wx.writeBLECharacteristicValue({
        deviceId: this.data.bindDevice.deviceId,
        serviceId: this.data.bindDevice.serviceId,
        characteristicId: this.data.bindDevice.characteristicId,
        value: buffer,
        success(res) {
          console.log('writeBLECharacteristicValue success', res)
        },
        fail(res) {
          console.log('writeBLECharacteristicValue fail', res)
        },
      })
    },
  },
  lifetimes: {
    // 生命周期函数，可以为函数，或一个在methods段中定义的方法名
    attached: function () {
      this.openBluetoothAdapter() //初始化蓝牙模块，开始搜索蓝牙设备
    },
    moved: function () {},
    detached: function () {
      this.stopBluetoothDevicesDiscovery() //停止蓝牙搜索
    },
  },
})