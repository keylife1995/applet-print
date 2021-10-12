/**
 * Data: 2020/10/11
 * Auth: keylife@foxmial.com
 * Desc: 打印工具类 tspl 语法 标签打印机
 * 参考：微信小程序开发者论坛
 */
let u = {};

/**
 *  纸张大小 40mm * 30mm = 320dot * 240dot
 * @param {订单转tspl指令} order 
 */
// tspl 语法
u.orderToStr = function (order) {
	var str = '';
	str += 'SIZE 40 mm,30 mm\n';
	str += 'DENSITY 15\n';
	str += 'CLS\n';
	//左边距离 40 顶部距离 20  质量大小 8
	str += 'QRCODE 40,40,L,7,A,0,"' + order.number + '"\n';
	var line = 1;
	str += 'TEXT 100,10,"TSS16.BF2",0,1.5,1.5,"'+order.title+'"\n';
	str += 'TEXT 200,45,"TSS24.BF2",0,1.5,1.5,"' + order.takeAddress + '"\n';
	str += 'TEXT 200,' + (45 + (line) * 35) + ',"TSS24.BF2",0,1.5,1.5,"' + order.takeCode + '"\n';
	str += 'TEXT 200,' + (45 + (line + 1) * 35) + ',"TSS24.BF2",0,1.5,1.5,"' + order.receiveAddress + '"\n';
	str += 'TEXT 200,' + (45 + (line + 2) * 35) + ',"TSS24.BF2",0,1.5,1.5,"' + order.receiveName + '"\n';
	str += 'TEXT 30,200,"TSS16.BF2",0,1.5,1.5,"'+order.adstr+'"\n';
	str += 'PRINT 1\n'
	return str;
}
/**
 * 纸张往后退回一张
 */
u.backUpOne = function () {
	var str = 'BACKFEED ' + 30 * 8 + '\n';
	str += 'BACKUP ' + 30 * 8 + '\n';
	return str;
}

module.exports = u;