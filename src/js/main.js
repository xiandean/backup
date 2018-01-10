
var app = (function(app) {
    app.utils = {
        // 获取url中的get参数
        getQueryString: function(name) { 
            var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
            var url = window.location.search.replace(/&amp;(amp;)?/g,"&");
            var r = url.substr(1).match(reg);
            if (r != null) { 
                return unescape(r[2]); 
            }
            return null;
        },

        //取随机整数 
        getRandom: function(min, max) {
            return Math.floor(Math.random() * (max - min + 1) + min);
        },

        // 图片预加载
        loadImages: function(sources, config) {
            var loadData = {
                sources: sources,
                images: sources instanceof Array ? [] : {},
                config: config || {},
                loadedImages: 0,
                totalImages: 0,
                countTotalImages: function() {
                    this.totalImages = 0;
                    for (var src in this.sources) {    
                        this.totalImages += 1;    
                    }
                    return this.totalImages;  
                },
                load: function(src) {
                    this.images[src] = new Image();
                    //当一张图片加载完成时执行    
                    var _this = this;
                    this.images[src].onload = function() {
                        _this.loadedImages += 1;
                        var progress = Math.floor(_this.loadedImages / _this.totalImages * 100);
                        if(_this.config.onProgress) {
                            _this.config.onProgress(progress);
                        }
                        if(_this.loadedImages >= _this.totalImages) {
                            if(_this.config.onComplete) {
                                _this.config.onComplete(_this.images);
                            }
                            if(_this.config instanceof Function) {
                                _this.config(_this.images);
                            }
                        }
                    };  

                    //把sources中的图片信息导入images数组  
                    this.images[src].src = this.sources[src];    
                }
            };  

            loadData.countTotalImages();

            if (!loadData.totalImages) {  
                if(loadData.config.onComplete) {
                    loadData.config.onComplete(loadData.images); 
                }
                if(loadData.config instanceof Function) {
                    loadData.config(loadData.images);
                }
            }else {
                for (var src in loadData.sources) { 
                    loadData.load(src);
                }
            } 
        }
    };
    app.api = {
        flag: false,
        weixin: {
            user: {
                openid: "",
                nick: "",
                headUrl: ""
            },
            getConfig: function(callback) {
                $.ajax({
                    url:"http://news.gd.sina.com.cn/market/c/gd/wxjsapi/index.php",
                    data: {
                        url: location.href.split('#')[0]
                    },
                    dataType:"jsonp",
                    success:function(jsondata){
                        wx.config({
                            debug: false,
                            appId: jsondata.data.appId,
                            timestamp: jsondata.data.timestamp,
                            nonceStr: jsondata.data.nonceStr,
                            signature: jsondata.data.signature,
                            jsApiList: [
                                'onMenuShareTimeline', 'onMenuShareAppMessage','onMenuShareQQ'
                            ]
                        });
                        wx.ready(function () {
                            if(callback) {
                                callback();
                            }
                        });
                    }
                });
            },
            setShare: function(options) {
                wx.onMenuShareTimeline({
                    title: options.title, // 分享标题
                    link: options.link||location.href, // 分享链接
                    imgUrl: options.imgUrl, // 分享图标
                    success: function (res) {
                        if(options.callback) {
                            options.callback();
                        }
                    },
                    cancel: function (res) {

                    }
                });
                wx.onMenuShareAppMessage({
                    title: options.title, // 分享标题
                    desc: options.desc, // 分享描述
                    link: options.link||location.href, // 分享链接
                    imgUrl: options.imgUrl, // 分享图标
                    type: '', // 分享类型,music、video或link，不填默认为link
                    dataUrl: '', // 如果type是music或video，则要提供数据链接，默认为空
                    success: function () {
                        if(options.callback) {
                            options.callback();
                        }
                    },
                    cancel: function () {

                    }
                });
                wx.onMenuShareQQ({
                    title: options.title, // 分享标题
                    desc: options.desc, // 分享描述
                    link: options.link||location.href, // 分享链接
                    imgUrl: options.imgUrl, // 分享图标
                    success: function () { 
                        if(options.callback) {
                            options.callback();
                        }
                    },
                    cancel: function () { 
                       // 用户取消分享后执行的回调函数
                    }
                });
                wx.error(function(res) {
                    console.log(res);
                });
            },
            getOpenid: function(callback) {
                if(app.utils.getQueryString("openid")) {
                    this.user.openid = app.utils.getQueryString("openid");
                    localStorage.setItem("wx_openid", this.user.openid);
                } else if (localStorage.getItem("wx_openid") != null) {
                    this.user.openid = localStorage.getItem("wx_openid");
                } else {
                    if(app.utils.getQueryString("oid")){
                        window.location.href='http://interface.gd.sina.com.cn/gdif/gdwx/wxcode?oid='+app.utils.getQueryString("oid");
                    }else {
                        window.location.href='http://interface.gd.sina.com.cn/gdif/gdwx/wxcode';
                    }
                    return;
                }
                if(callback) {
                    callback();
                }
            },
            getUserInfo: function(callback) {
                var _this = this;
                $.ajax({
                    url:'http://interface.gd.sina.com.cn/gdif/gdwx/c_member/',
                    data : { openid : _this.user.openid},
                    type : 'get',
                    dataType : 'jsonp',
                    jsonp:'callback',
                    success: function(data) {
                        console.log(data);
                        if(data.error == 0) {
                            _this.user.nick = data.data.nickname;
                            _this.user.headUrl = data.data.headimgurl;
                            if(callback) {
                                callback();
                            }
                        }
                    },
                    error: function(error) {
                        console.log(error);
                    }
                });
            }
        },
        checkResign: function(identity, callback) {
            var _this = this;
            if(this.flag) {
                return;
            }
            this.flag = true;
            $.ajax({
                url:'http://interface.gd.sina.com.cn/gdif/chunyun2018/identitytype.html',
                data : {identity: identity},
                type : 'get',
                dataType : 'jsonp',
                jsonp:'callback',
                success: function(data) {
                    _this.flag = false;
                    console.log(data);
                    if(data.error === 0) {
                        if(callback) {
                            callback();
                        }
                    }else if(data.error === 10) {
                        alert('提交失败：身份证号码异常！');
                    }else if(data.error === 15) {
                        alert('提交失败：身份证' + identity + '已报过名！');
                    }else {
                        alert('提交失败！');
                    }
                },
                error: function(error) {
                    _this.flag = false;
                    console.log(error);
                }
            });
        },
        resign: function(data, callback) {
            if(this.flag) {
                return;
            }
            this.flag = true;
            $.ajax({
                url:'http://interface.gd.sina.com.cn/gdif/chunyun2018/bm.html',
                data : data,
                type : 'get',
                dataType : 'jsonp',
                jsonp:'callback',
                success: function(data) {
                    _this.flag = false;
                    console.log(data);
                    if(data.error === 0) {
                        if(callback) {
                            callback();
                        }
                    }else {
                        alert('提交失败：请重新填写！');
                    }
                },
                error: function(error) {
                    _this.flag = false;
                    console.log(error);
                }
            });
        }
    };
    return app;
}(app || {}));


// 微信分享
// app.api.weixin.getConfig(function() {
//     app.api.weixin.setShare({
//         // callback: "", //分享成功回调
//         // link: "", //分享链接
//         title: "", //分享标题
//         desc: "", //分享描述
//         imgUrl: "" //分享图标
//     });
// });

// app.api.checkResign('441781199306111716');

var resignData = {
    name: '李四',
    sex: '1',
    identity: '123456201801085556',
    mobile: '13011111111',
    address: '广东省广州市天河区天河路208号',
    profession: '1',
    destination: '1',
    is_courier: '1'
};
