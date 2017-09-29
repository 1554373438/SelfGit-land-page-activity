$(function() {

  var ua = navigator.userAgent;
  var am_id = util.getSearch()['am_id'] || util.getSearch()['utm_source'] || '';
  var approach = util.getSearch()['approach'] || util.getSearch()['utm_term'] || '';
  var approach2 = util.getSearch()['approach2'] || util.getSearch()['utm_content'] || '';
  var approach3 = util.getSearch()['approach3'] || util.getSearch()['utm_campaign'] || '';
  var landing_page = util.getSearch()['landing_page'] || 'nonobank';
  var recommender = util.getSearch()['recommender'];

  var type = util.getSearch()['type'];



  var regSessionId, codeImgSessionId, curUrl = window.location.href,
    phonePassSuccess = false;
  var toastr = {
    active: false,
    info: function(msg) {
      var _this = this;
      if (_this.active) {
        return;
      }
      _this.active = true;
      vm.toastrInfo = msg;
      setTimeout(function() {
        vm.toastrInfo = '';
        _this.active = false;
      }, 3000);
    }
  };



  var vm = new Vue({
    el: 'body',
    data: {
      showLoading: false,
      toastrInfo: '',
      showSuccess: false,
      account: '',
      regData: {
        phone: '',
        codeImgPath: '',
        safeCode: '',
        smsCode: '',
        pwd: ''
      },
      countdown: {
        initTime: 61,
        time: 61,
        text: '发送验证码',
        active: false
      },
      error: {
        info: {
          phone: '',
          pwd: '',
          safeCode: '',
          smsCode: ''
        },
        phone: false,
        pwd: false,
        safeCode: false,
        smsCode: false
      }
    },
    methods: {

      init: function() {
        this.getCodeImg();
      },
      getCodeImg: function() {
        var _this = this;
        $.ajax({
          url: HOST + '/msapi/user/getSessionId',
          type: 'GET',
          dataType: 'json',
          success: function(res) {
            if (res.flag != 1) {
              toastr.info(res.msg);
              return;
            }
            codeImgSessionId = res.data && res.data.session_id;
            _this.regData.codeImgPath = HOST + '/msapi/randomImage?sessionId=' + codeImgSessionId;
          }
        });
      },

      validatePhone: function() {
        if (!this.regData.phone) {
          this.error.phone = true;
          this.error.info.phone = '请输入手机号';
          return false;
        }
        if (!/^1\d{10}/.test(this.regData.phone)) {
          this.error.phone = true;
          this.error.info.phone = '手机号码格式不正确';
          return false;
        }
        this.error.phone = false;
        this.error.info.phone = '';
        return true;

      },
      validatePwd: function() {
        if (!this.regData.pwd) {
          this.error.pwd = true;
          this.error.info.pwd = '请输入密码';
          return false;
        }
        if (!/^(?!\d+$|[a-zA-Z]+$|[\W-_]+$)[\s\S]{6,16}$/.test(this.regData.pwd)) {
          this.error.pwd = true;
          this.error.info.pwd = '请设置6-16位数字和字母组成的密码';
          return false;
        }
        this.error.pwd = false;
        this.error.info.pwd = '';
        return true;

      },
      validateSafeCode: function() {

        if (!this.regData.safeCode) {
          this.error.safeCode = true;
          this.error.info.safeCode = '安全码不能为空';
          return false;
        }
        this.error.safeCode = false;
        this.error.info.safeCode = '';
        return true;

      },
      validateSmsCode: function() {
        if (!this.regData.smsCode) {
          this.error.smsCode = true;
          this.error.info.smsCode = '验证码不能为空';
          return false;
        }
        this.error.smsCode = false;
        this.error.info.smsCode = '';
        return true;
      },
      sendMessage: function() {
        _czc.push(["_trackEvent","注册页","点击","获取验证码","","btnSendCode"]);
        var _this = this;
        if (!this.validatePhone()) {
          return;
        }
        if (!this.validateSafeCode()) {
          return;
        }

        if (this.countdown.active) {
          return;
        }

        var params = {
          'sessionId': regSessionId || codeImgSessionId,
          'validateCode': this.regData.safeCode,
          'phone': this.regData.phone,
          'approach': '',
          'am_id': '',
          'referer': curUrl,
          'activity_name': '落地页'
        };

        $.ajax({
          url: HOST + '/msapi/user/sendMessageByValidateCode',
          type: 'POST',
          data: params,
          dataType: 'json',
          success: function(res) {
            if (res.flag != 1) { //失败
              toastr.info(res.msg);

              if (res.flag == 23) {
                _this.getCodeImg();
                _this.regData.safeCode = '';

              }
              return;
            }
            var data = res.data;
            regSessionId = data['session_id'];

            startCountDown();

          }

        });

        function startCountDown() {
          _this.countdown.time--;
          if (_this.countdown.time >= 0) {
            _this.countdown.active = true;
            setTimeout(startCountDown, 1000);

          } else {
            _this.countdown.active = false;
            _this.countdown.text = '重新获取';
            _this.countdown.time = _this.countdown.initTime;

          }
        }
      },
      regSubmit: function() {
        _czc.push(["_trackEvent", "注册页", "点击", "立即注册", "", "btnReg"]);
        var _this = this;
        if (!this.validatePhone()) {
          return;
        }
        if (!this.validatePwd()) {
          return;
        }
        if (!this.validateSafeCode()) {
          return;
        }
        if (!this.validateSmsCode()) {
          return;
        }

        var tokenId = localStorage.getItem('tongdun_token');
        var params = {
          'validatemobile': this.regData.smsCode,
          'password': md5(this.regData.pwd),
          'mobile': this.regData.phone,
          'sessionId': regSessionId,
          'borrowtype': '理财',
          'terminal': 3,
          'am_id': am_id,
          'approach': approach,
          'approach2': approach2,
          'approach3': approach3,
          'landing_page': landing_page,
          'recommender': recommender,
          'tokenId': tokenId
        };
        var vMd5 = util.getAuthorization();
        $.ajax({
          url: HOST + '/msapi/user/register',
          type: 'POST',
          data: params,
          dataType: 'json',
          headers: {
            'ComeFrom': 'MaiZI',
            'Authorization': vMd5
          },
          success: function(res) {
            if (res.flag != 1) {
              toastr.info(res.msg);
              return;
            }
            if (type == 'gonewsite') {
              _this.showSuccess = false;
              if (am_id == 2104) {
                var phoneVal = md5(_this.regData.phone);
                var img = new Image();
                img.height = 0;
                img.width = 0;
                img.src = 'https://conversion.pro.cn/arrive/enter?accountID=85d644269157dba60983&conversionID=8b5d4aee1fb4af8db0ab6157e0d93860&info=' + phoneVal;
                document.body.appendChild(img);

              }
              window.location.href = HOST + '/nono-newbie/#/home?showPop&am_id=' + am_id;
            } else {
              _this.showSuccess = true;
            }
          }
        });
      },
      scrollTop: function() {
        window.scrollTo(0, 0);
        _czc.push(["_trackEvent", "注册页", "点击", "立即领取", "", "btnGet"]);
      },
      downApp: function() {
        _czc.push(["_trackEvent", "跳转页", "点击", "立即下载app", "", "btnDownload"]);
        window.location.href = "https://m.nonobank.com/nono/land-page/download.html";
      }

    }
  });

  vm.init();


})
