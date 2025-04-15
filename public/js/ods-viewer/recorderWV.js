/**
 * Created with JetBrains PhpStorm.
 * User: Jun
 * Date: 14. 12. 18.
 * Time: 오후 3:15
 * To change this template use File | Settings | File Templates.
 */

/*jslint node: true */
'use strict';

/**
 * Audio Recorder 초기화
 */
function initAudioRecorder(sourceNode) {

  const configs = {
    encoding: "mp3",
    options: {
      timeLimit: 120,
      mp3: {
        bitRate: 64
      }
    }
  };

  return new WebAudioRecorder(sourceNode, configs);
}

function initAudioRecorder1(sourceNode) {

  const configs = {
    encoding: "mp3",
    options: {
      timeLimit: 86400,
      mp3: {
        bitRate: 64
      }
    }
  };

  return new WebAudioRecorder(sourceNode, configs);
}

/**
 * 10이하의 값을 2자리 수로 패딩
 * @param n 레코딩 타임
 * @returns
 */
function minSecStr(n) {
  return (n < 10 ? "0" : "") + n;
}

/**
 * 레코딩 시간 업데이트
 */
function updateDateTime() {
  if (recorderWV.$recordBtn.hasClass('record_dark')) {
    recorderWV.$recordBtn.removeClass();
    recorderWV.$recordBtn.addClass('record_light');
  } else {
    recorderWV.$recordBtn.removeClass();
    recorderWV.$recordBtn.addClass('record_dark');
  }

  let recordingTime = recorderWV.audioRecorder.recordingTime() | 0;
  let now = 120 - recordingTime;
  recorderWV.$record_seek_seek.val(now);

  //goTime이 뭔지는 불분명하지만 이전 코드 호환성을 위해 추가
  recorderWV.$goTime.text("" + (now / 60 | 0) + ":" + (minSecStr(now % 60)));
  //실제 녹음 시간 업데이트
  recorderWV.$record_time[0].innerHTML = "" + (now / 60 | 0) + ":" + (minSecStr(now % 60));
}

function updateDateTime2() {
  if (recorderWV.$p_record.hasClass('record_dark')) {
    recorderWV.$p_record.removeClass('record_dark');
    recorderWV.$p_record.addClass('record_light');
  } else {
    recorderWV.$p_record.removeClass('record_light');
    recorderWV.$p_record.addClass('record_dark');
  }

  var recordingTime = recorderWV.audioRecorder1.recordingTime() | 0;
  var now = recordingTime;
  recorderWV.$p_seek.val(now);

  //goTime이 뭔지는 불분명하지만 이전 코드 호환성을 위해 추가
  recorderWV.$p_time.text("" + (now / 60 | 0) + ":" + (minSecStr(now % 60)));
  //실제 녹음 시간 업데이트
  recorderWV.$p_time[0].innerHTML = "" + (now / 60 | 0) + ":" + (minSecStr(now % 60));
}

var recorderWV = {
  //New Audio Record lib object
  audioRecorder: null,
  audioRecorder1: null,

  $container: null,//
  audioContext: null,//
  recorder: null,//
  analyserContext: null,
  analyserContext2: null,
  canvasWidth: null,
  canvasWidth2: null,
  canvasHeight: null,
  canvasHeight2: null,
  rafID: null,
  count: 0,
  analyserNode: null,
  inputPoint: null,
  record_status: false,
  time_interval: null,//
  record_interval: null,//
  time_count: 0,
  record_file: null,
  record_file1: null,
  record_duration: null,
  $recordBtn: null,
//	$timeCount : null,
  initValue: true,
  $record_play_btn: null,
  $record_seek: null,
  $status: null,
  $record_time: null,
  $goTime: null,
  $record_seek_seek: null,
  $total_time: null,
  $record_done: null,
  that: null,
  $trash: null,
  pageNum: null,
  memoObject: null,
  positionX: null,
  positionY: null,
  blob: null,
  mp3blob: null,
  saveTime: null,
  is_new: true,
  $bookContainer: null,
  $recordLoading: null,
  containerPositionX: null,
  containerPositionY: null,
  xhr: null,
  realAudioInput: null,
  audioInput: null,
  $audioClose: null,
  $msg_loading: null,
  timeout_check: null,
//	is_recording:false,

  $p_record: null,
  $p_play: null,
  $p_seek: null,
  $p_star_time: null,
  $p_end_time: null,
  $p_time: null,
  $p_status: null,
  $p_clsoe: null,
  connectCheck: null,
  online: true,
  recordingStatus: null,

  init: function () {
    this.$container = $('#audioRecorder');
    this.$recordBtn = $('#record_btn');
    this.$record_play_btn = $('#record_play_btn');
//		this.$timeCount = $('#audioRecorder .time');
    this.$record_seek = $('#record_seek');
    this.$status = $('#status');
    this.$record_time = $('#audioRecorder .time');
    this.$goTime = $('#goTime');
    this.$record_seek_seek = $('#record_seek .seek');
    this.$total_time = $('#recordTotalTime');
    this.$record_done = $('#audioRecorder .done');
    this.$trash = $('#audioRecorder .trash');
    this.$upload = $('#audioRecorder .upload');
    this.$recordLoading = $('#audioRecorder .loading');
    this.$audioClose = $('#audioRecorder .close');
    this.$msg_loading = $('#audioRecorder .msg_loading');

    //발음 녹음
    this.$p_play = $('#audioPlayer .play');
    this.$p_record = $('#audioPlayer .record');
    this.$p_seek = $('#audioPlayer .bottom_ui .seek');
    this.$p_star_time = $('#audioPlayer .bottom_ui .start');
    this.$p_end_time = $('#audioPlayer .bottom_ui .end');
    this.$p_time = $('#audioPlayer .bottom_ui .time');
    this.$p_status = $('#status2');
    this.$p_clsoe = $('#audioClose');

    this.eventInit();
  },
  getIsRecording: function () {
    if (this.audioRecorder) {
      return this.audioRecorder.isRecording();
    }
    return false;
  },
  getContainer: function () {
    return this.$container;
  },
  getMemoObject: function () {
    return this.memoObject;
  },

  openRecord: function (event, pageNum, memoObject, positionX, positionY, container) {
    if (this.initValue) {
      this.initAudio();
    }

    this.stopRecordAudio();

    $('.upload').hide();

    this.is_new = true;
    this.is_recording = true;

    this.pageNum = pageNum;
    this.memoObject = memoObject;
    this.positionX = positionX;
    this.positionY = positionY;
    this.$bookContainer = container;

    this.resetUI();

    this.containerPositionX = event.clientX;
    this.containerPositionY = event.clientY;

    var x = this.containerPositionX - 2;
    var y = this.containerPositionY - 3;

    this.$container.css({
      display: 'block',
      top: 270 + 'px',
      left: document.body.offsetWidth / 2 - 171 + 'px'
    });

    this.saveTime = new Date().getTime();
    SyncDataS3.addAudioMemo(this.pageNum, this.saveTime, this.positionX, this.positionY);
    SyncDataS3.setAudioMemoUploaded(this.pageNum, this.saveTime, false);
    this.memoObject.data('key', this.saveTime);
  },
  getXHR: function () {
    return;
    this.xhr;
  },
  reUpload: function () {
    var $indicator;
    var that = this;

    //indicator 띄움 landscape구분
    $indicator = $('<img src="../images/viewer/toolBox/record/recording_sync_prepare.png" class="spinner">');
    $indicator.css({
      position: 'relative',
      left: 6 + '%',
      top: -2 + '%',
      display: 'block',
      width: '90%'
    });
    $indicator.attr('key-data', that.saveTime);

    $indicator.on('click', function (e) {
      if (Viewer.getIsDragging() == true) {
        Viewer.setIsDragging(false);
        return;
      }

      messeageAlert.openAlert('Uploading to cloud', 'Your recording is being uploaded to the cloud.', 'Cancel', 'Continue', 'upload_cloud', that.saveTime, that.pageNum);
    });

    this.memoObject.append($indicator);

    this.recorder && this.recorder.done($indicator, this.pageNum, this.saveTime, this.positionX, this.positionY, this.is_new, this.blob);
  },
  openSaveRecord: function (event, pageNum, memoObject, url, key, container) {
    var that = this;
    if (that.audioRecorder !== null && that.audioRecorder.isRecording()) {
      return;
    }

    clearInterval(this.timeout_check);

    if (this.record_file) {
      this.record_file.pause();
    }
    if (SyncDataS3.getAudioOneMemo(pageNum, key).uploaded != undefined) {
      if (SyncDataS3.getAudioOneMemo(pageNum, key).uploaded == false) {
        this.pageNum = pageNum;
        this.memoObject = memoObject;
        this.saveTime = key;
        this.$bookContainer = container;

        return;
      }
    }

    clearTimeout(this.timeout_check);
    this.timeout_check = setTimeout(function () {
      that.$container.css('display', 'none');
      messeageAlert.openAlert("Oxford Learner's Bookshelf", 'Please check your internet connection and try again.', '', 'OK', 'audio_count_over');
    }, 20000);

    var that = this;
    this.is_new = false;
    this.playUI();
    this.$record_seek_seek.val(0);
    this.pageNum = pageNum;
    this.memoObject = memoObject;
    this.saveTime = key;
    this.containerPositionX = event.clientX;
    this.containerPositionY = event.clientY;
    this.$bookContainer = container;

    this.$container.css({
      display: 'block',
      top: 270 + 'px',
      left: document.body.offsetWidth / 2 - 171 + 'px'
    });

//		setTimeout(function(){
    SyncDataS3.existsAudio(that.saveTime);
//		},0);

    if (memoObject.children().length == 0) {
      this.record_file = new Audio(url);

      this.record_file.addEventListener('loadedmetadata', function () {
        that.record_duration = Math.floor(that.record_file.duration);

        that.$record_seek_seek.attr('max', that.record_duration);

        if (that.record_duration < 60) {
          if (that.record_duration < 10) {
            that.$total_time.text('0:0' + that.record_duration);
          } else {
            that.$total_time.text('0:' + that.record_duration);
          }

        } else {
          var minute = Math.floor(parseInt(that.record_duration) / 60);
          var second = parseInt(that.record_duration) % 60;

          if (second < 10) {
            that.$total_time.text(minute + ':0' + second);
          } else {
            that.$total_time.text(minute + ':' + second);
          }
        }

        //로딩이미지 없에고 시간표시
//				that.$recordLoading.css('display','none');
        clearInterval(that.timeout_check);
        that.$msg_loading.css('display', 'none');
        that.$record_play_btn.removeClass('save_record_loading');
        that.$record_play_btn.addClass('save_record_play_start');
        that.$record_seek.css('display', 'block');
      });

      this.record_file.addEventListener('timeupdate', function () {
        var now_mil = that.record_file.currentTime;
        var now = Math.floor(that.record_file.currentTime);

        that.$record_seek_seek.val(now_mil);

        if (now < 60) {
          if (now < 10) {
            that.$goTime.text('0:0' + now);
          } else {
            that.$goTime.text('0:' + now);
          }

        } else {
          var minute = Math.floor(parseInt(now) / 60);
          var second = parseInt(now) % 60;

          if (second < 10) {
            that.$goTime.text(minute + ':0' + second);
          } else {
            that.$goTime.text(minute + ':' + second);
          }

        }

        if (now >= that.record_duration) {
          that.$record_seek_seek.val(0);
          that.$record_play_btn.removeClass();
          if (that.is_new) {
            that.$record_play_btn.addClass('record_play_start');
            that.$record_done.removeClass('done_off');
            that.$record_done.addClass('done_on');
          } else {
            that.$record_play_btn.addClass('save_record_play_start');
            that.$audioClose.removeClass('close_off');
            that.$audioClose.addClass('close_on');
          }

          that.$trash.removeClass('trash_off');
          that.$trash.addClass('trash_on');

          that.$goTime.text('0:00');
        }
      });
    }
  },
  openLocalRecord: function (event, pageNum, memoObject, url, key, container) {

    if (this.initValue) {
      this.initAudio();
    }

    var that = this;
    if (this.audioRecorder && this.audioRecorder.isRecording()) {
      return;
    }

    if (this.record_file) {
      this.record_file.pause();
    }

//		if(this.is_new){
//			openAudioRecorder();
//		}
//		else{
//			openAudioPlayer();
//		}
    if (SyncDataS3.getAudioOneMemo(pageNum, key).uploaded === false) {
      $('.upload').removeClass('upload_off').addClass('upload_on');
      $('.upload').show();
    }
    else {
      $('.upload').removeClass('upload_on').addClass('upload_off');
      $('.upload').show();
    }
    this.pageNum = pageNum;
    this.memoObject = memoObject;
    this.saveTime = key;
    this.$bookContainer = container;

    this.is_new = false;
    this.playUI();
    this.$record_seek_seek.val(0);
    this.pageNum = pageNum;
    this.memoObject = memoObject;
    this.saveTime = key;
    this.containerPositionX = event.clientX;
    this.containerPositionY = event.clientY;
    this.$bookContainer = container;

    //
    this.$container.css({
      display: 'block',
      top: 270 + 'px',
      left: document.body.offsetWidth / 2 - 171 + 'px'
    });

//		if(memoObject.children().length==0){
    this.record_file = new Audio(url);
    //this.record_file = $("<audio src='"+url+"' autoplay>")[0];

    this.record_file.addEventListener('loadedmetadata', function () {
      that.record_duration = Math.floor(that.record_file.duration);

      that.$record_seek_seek.attr('max', that.record_duration);

      if (that.record_duration < 60) {
        if (that.record_duration < 10) {
          that.$total_time.text('0:0' + that.record_duration);
        } else {
          that.$total_time.text('0:' + that.record_duration);
        }

      } else {
        var minute = Math.floor(parseInt(that.record_duration) / 60);
        var second = parseInt(that.record_duration) % 60;

        if (second < 10) {
          that.$total_time.text(minute + ':0' + second);
        } else {
          that.$total_time.text(minute + ':' + second);
        }
      }

      //로딩이미지 없에고 시간표시
//				that.$recordLoading.css('display','none');
      clearInterval(that.timeout_check);
      that.$msg_loading.css('display', 'none');
      that.$record_play_btn.removeClass('save_record_loading');
      that.$record_play_btn.addClass('save_record_play_start');
      that.$record_seek.css('display', 'block');
    });

    this.record_file.addEventListener('timeupdate', function () {
      var now = Math.floor(that.record_file.currentTime);

      that.$record_seek_seek.val(now);

      if (now < 60) {
        if (now < 10) {
          that.$goTime.text('0:0' + now);
        } else {
          that.$goTime.text('0:' + now);
        }

      } else {
        var minute = Math.floor(parseInt(now) / 60);
        var second = parseInt(now) % 60;

        if (second < 10) {
          that.$goTime.text(minute + ':0' + second);
        } else {
          that.$goTime.text(minute + ':' + second);
        }

      }

      if (now >= that.record_duration) {
        that.$record_seek_seek.val(0);
        that.$record_play_btn.removeClass();
        if (that.is_new) {
          that.$record_play_btn.addClass('record_play_start');
          that.$record_done.removeClass('done_off');
          that.$record_done.addClass('done_on');
        } else {
          that.$record_play_btn.addClass('save_record_play_start');
          that.$audioClose.removeClass('close_off');
          that.$audioClose.addClass('close_on');
        }

        if (SyncDataS3.getAudioOneMemo(that.pageNum, that.saveTime).uploaded != undefined) {
          if (SyncDataS3.getAudioOneMemo(that.pageNum, that.saveTime).uploaded == false) {
            that.$upload.removeClass('upload_off');
            that.$upload.addClass('upload_on');
          }
        }

        that.$trash.removeClass('trash_off');
        that.$trash.addClass('trash_on');

        that.$goTime.text('0:00');
      }
    });
//		}
  },
  openPRecord: function (src) {
    this.$p_end_time.text('0:00');
    this.$p_play.removeClass('play_on');
    this.$p_play.addClass('play_off');

    var that = this;
    var srcArray = src.split('?')[0];
    var srcArray2 = srcArray.split('/');
    var length = srcArray2.length;
    var fileName = srcArray2[length - 1].replace('.mp3', '_record');
    //서버로부터 있는지 확인한다.
    var url = SyncDataS3.getRecordURL(fileName);

    this.record_file = new Audio(url);

    this.record_file.addEventListener('loadedmetadata', function () {
      that.$p_play.removeClass('play_off');
      that.$p_play.addClass('play_on');

      that.record_duration = Math.floor(that.record_file.duration);

      that.$p_seek.attr('max', that.record_duration);

      if (that.record_duration < 60) {
        if (that.record_duration < 10) {
          that.$p_end_time.text('0:0' + that.record_duration);
        } else {
          that.$p_end_time.text('0:' + that.record_duration);
        }

      } else {
        var minute = Math.floor(parseInt(that.record_duration) / 60);
        var second = parseInt(that.record_duration) % 60;

        if (second < 10) {
          that.$p_end_time.text(minute + ':0' + second);
        } else {
          that.$p_end_time.text(minute + ':' + second);
        }

      }
    });

    this.record_file.addEventListener('timeupdate', function () {
      var now_mil = that.record_file.currentTime;
      var now = Math.floor(that.record_file.currentTime)

      that.$p_seek.val(now_mil);

      if (now < 60) {
        if (now < 10) {
          that.$p_star_time.text('0:0' + now);
        } else {
          that.$p_star_time.text('0:' + now);
        }

      } else {
        var minute = Math.floor(parseInt(now) / 60);
        var second = parseInt(now) % 60;

        if (second < 10) {
          that.$p_star_time.text(minute + ':0' + second);
        } else {
          that.$p_star_time.text(minute + ':' + second);
        }

      }

      if (now >= that.record_duration) {
        that.$p_seek.val(0);
        that.$p_play.removeClass('play_pause');
        that.$p_play.addClass('play_on');

        that.$p_star_time.text('0:00');
      }
    });
  },

  initAudio: function () {
    this.initValue = false;
    var that = this;
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    window.URL = window.URL || window.webkitURL;
    if (!navigator.getUserMedia) {
      navigator.getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    }
    if (!navigator.cancelAnimationFrame) {
      navigator.cancelAnimationFrame = navigator.webkitCancelAnimationFrame || navigator.mozCancelAnimationFrame;
    }
    if (!navigator.requestAnimationFrame) {
      navigator.requestAnimationFrame = navigator.webkitRequestAnimationFrame || navigator.mozRequestAnimationFrame;
    }
    if (navigator.getUserMedia == undefined) {
      alert("getUserMedia not supported");
      return false;
    }
    navigator.getUserMedia({audio: true, video: false}, function (stream) {
      if(that.audioContext == null) {
      that.audioContext = new AudioContext();
      }

      that.inputPoint = that.audioContext.createGain();
//			window.source = that.audioContext.createMediaStreamSource(stream);
//			source.connect(that.audioContext.destination);
      that.realAudioInput = that.audioContext.createMediaStreamSource(stream);
      that.audioInput = that.realAudioInput;
      that.audioInput.connect(that.inputPoint);

      that.analyserNode = that.audioContext.createAnalyser();

      var input = that.audioContext.createMediaStreamSource(stream);
      input.connect(that.inputPoint);

      that.inputPoint.connect(that.analyserNode);

      that.recorder = new Recorder(input);
      that.audioRecorder = initAudioRecorder(input);
      that.audioRecorder1 = initAudioRecorder1(input);
    }, function (err) {
    });
  },

  resetUI: function () {
    this.$recordBtn.css('display', 'block');
    this.$recordBtn.removeClass().addClass('record_start');
    this.$record_play_btn.removeClass().addClass('record_play_start').css('display', 'none');
    this.$status.css('display', 'block');
    this.$record_seek.css('display', 'none');
    this.$record_time.css('display', 'block');
    this.$record_done.removeClass('done_on');
    this.$record_done.addClass('done_off');
    this.$trash.removeClass('trash_off');
    this.$trash.addClass('trash_on');

    if (this.is_new) {
      this.$msg_loading.css('display', 'none');
      this.$audioClose.css('display', 'none');
      this.$record_done.css('display', 'block');
    } else {
      this.$record_done.css('display', 'none');
      this.$audioClose.css('display', 'block');
    }

    if (this.analyserContext) {
      this.analyserContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    }
  },

  playUI: function () {
    this.$recordBtn.css('display', 'none');

    this.$record_play_btn.css('display', 'block');
    this.$record_play_btn.removeClass();
    this.$record_play_btn.addClass('save_record_play_start');
    this.$record_seek.css('display', 'none');

    this.$status.css('display', 'none');
    this.$record_time.css('display', 'none');

    if (this.is_new) {
      this.$record_done.removeClass('done_off');
      this.$record_done.addClass('done_on');
    } else {
      this.$record_play_btn.removeClass('save_record_play_start');
      this.$record_play_btn.addClass('save_record_loading');

      this.$record_done.css('display', 'none');
      this.$audioClose.css('display', 'block');
      this.$audioClose.removeClass('close_off');
      this.$audioClose.addClass('close_on');

      this.$record_seek.css('display', 'none');
      this.$msg_loading.css('display', 'block');
    }

    this.$trash.removeClass('trash_off');
    this.$trash.addClass('trash_on');

//		this.$total_time.css('display','none');
//		this.$recordLoading.css('display','block');

    this.$goTime.text('0:00');
  },
  getInitValue: function () {
    return this.initValue;
  },
  uploadAudio: function () {
    var $indicator;
    var that = this;

    this.memoObject.addClass('recordSyncing');
    that.$container.css('display', 'none');

    //indicator 띄움 landscape구분
    $indicator = $('<img src="../images/viewer/toolBox/record/recording_sync_prepare.png" class="spinner">');
    $indicator.css({
      position: 'relative',
      left: 6 + '%',
      top: -2 + '%',
      display: 'block',
      width: '90%'
    });
    $indicator.attr('key-data', that.saveTime);

    $indicator.off().on('click', function (e) {
      if (Viewer.getIsDragging() == true) {
        Viewer.setIsDragging(false);
        return;
      }

      messeageAlert.openAlert('Uploading to cloud', 'Your recording is being uploaded to the cloud.', 'Cancel', 'Continue', 'upload_cloud', that.saveTime, that.pageNum);
//				messeageAlert.openAlert('Cancel Sync','You have cancelled the upload. Are you sure?','Delete recording','Continue upload','upload',that.saveTime,that.pageNum);
    });

    this.memoObject.append($indicator);
    this.recorder && this.recorder.upload($indicator, this.pageNum, this.saveTime, this.positionX, this.positionY, this.is_new, this.blob);
  },
  deleteOK: function () {
    this.record_status = false;
    if (this.is_new) {
      this.recorder && this.recorder.stop();

      if (this.record_file) {
        this.record_file.pause();
      }

      if (this.recorder) {
        this.recorder.clear();
      }

      SyncDataS3.delAudioMemo(this.pageNum, this.saveTime);
      messeageAlert.closeAlert();

      //처음상태로 돌리후 감춘다.
      this.$recordBtn.removeClass().addClass('record_start');
      this.$record_play_btn.removeClass().addClass('record_play_start').css('display', 'none');
      this.$status.css('display', 'block');
      this.$record_seek.css('display', 'none');
      this.$record_time.css('display', 'block');
      this.$record_time.text('2:00');
      this.$record_done.removeClass('done_on');
      this.$record_done.removeClass('done_off');

      this.$container.css('display', 'none');
      this.memoObject.remove();
    } else {
      //녹음됐던 메모
      SyncDataS3.delAudioMemo(this.pageNum, this.saveTime);
      messeageAlert.closeAlert();
      this.$recordBtn.removeClass().addClass('record_start');
      this.$record_play_btn.removeClass().addClass('record_play_start').css('display', 'none');
      this.$status.css('display', 'block');
      this.$record_seek.css('display', 'none');
      this.$record_time.css('display', 'block');
      this.$record_time.text('2:00');
      this.$record_done.removeClass('done_on');
      this.$record_done.removeClass('done_off');

      this.$container.css('display', 'none');
      this.memoObject.remove();

      //s3에서도 삭제해야 한다.
      var result = SyncDataS3.delRecordfile(SyncDataS3.bookID + '_' + this.saveTime);
    }
  },
  stopRecordAudio: function () {
    if (this.record_file) {
      this.record_file.pause();
    }
  },

  eventInit: function () {
    var that = this;

    var updateAnalysers = function () {
      if (!(that.analyserContext)) {
        var canvas = document.getElementById("status");
        that.canvasWidth = canvas.width;
        that.canvasHeight = canvas.height;
        that.analyserContext = canvas.getContext('2d');
      }

      //반복하면서 그려줘야 한다.
      var SPACING = 4;
      var BAR_WIDTH = 3;
      var numBars = Math.round(that.canvasWidth / SPACING);
      var freqByteData = new Uint8Array(that.analyserNode.frequencyBinCount);
      that.analyserNode.getByteFrequencyData(freqByteData);
      that.analyserContext.clearRect(0, 0, that.canvasWidth, that.canvasHeight);
      that.analyserContext.fillStyle = '#F6D565';
      that.analyserContext.lineCap = 'round';
      var multiplier = that.analyserNode.frequencyBinCount / numBars;

      var magnitude = 0;
      for (var j = 0; j < multiplier; j++)
        magnitude += freqByteData[j];

      magnitude = magnitude / multiplier;

      that.analyserContext.fillStyle = "#00CCFF";

      var length = Math.floor(magnitude / 10);
      for (var i = 0; i < length; i++) {
        that.analyserContext.fillRect(i * SPACING, that.canvasHeight - 1, BAR_WIDTH, -6);
      }

      that.rafID = window.requestAnimationFrame(updateAnalysers);
    };

    var createURL = function () {
      that.recorder && that.recorder.exportWAV(function (blob) {
        that.blob = blob;
        var url = URL.createObjectURL(blob);

        that.record_file = new Audio(url);
        that.record_file.addEventListener('loadedmetadata', function () {
          that.record_duration = Math.floor(that.record_file.duration);
          if (that.record_duration > 120) that.record_duration = 120;
          that.$record_seek_seek.attr('max', that.record_duration);

          if (that.record_duration < 60) {
            if (that.record_duration < 10) {
              that.$total_time.text('0:0' + that.record_duration);
            } else {
              that.$total_time.text('0:' + that.record_duration);
            }

          } else {
            var minute = Math.floor(parseInt(that.record_duration) / 60);
            var second = parseInt(that.record_duration) % 60;

            if (second < 10) {
              that.$total_time.text(minute + ':0' + second);
            } else {
              that.$total_time.text(minute + ':' + second);
            }
          }

          //로딩표시 없에고 시간표시한다.
//					that.$recordLoading.css('display','none');
          that.$total_time.css('display', 'block');
        });

        that.record_file.addEventListener('timeupdate', function () {
          var now_mil = that.record_file.currentTime;
          var now = Math.floor(that.record_file.currentTime);
          that.$record_seek_seek.val(now_mil);

          if (now < 60) {
            if (now < 10) {
              that.$goTime.text('0:0' + now);
            } else {
              that.$goTime.text('0:' + now);
            }
          } else {
            var minute = Math.floor(parseInt(now) / 60);
            var second = parseInt(now) % 60;

            if (second < 10) {
              that.$goTime.text(minute + ':0' + second);
            } else {
              that.$goTime.text(minute + ':' + second);
            }

          }

          if (now >= that.record_duration) {
            that.$record_seek_seek.val(0);
            that.$record_play_btn.removeClass();
            that.$record_play_btn.addClass('record_play_start');
            that.$trash.removeClass('trash_off');
            that.$trash.addClass('trash_on');
            that.$record_done.removeClass('done_off');
            that.$record_done.addClass('done_on');
            that.$goTime.text('0:00');
          }
        });
      });
    };

    var changeRecordUI = function (isRecording) {
      if (isRecording) {
        that.$recordBtn.removeClass();
        that.$recordBtn.addClass('record_Restart');

        that.$record_play_btn.css('display', 'block');
        that.$record_play_btn.removeClass();
        that.$record_play_btn.addClass('record_play_start');
        that.$record_seek.css('display', 'block');

        that.$status.css('display', 'none');
        that.$record_time.css('display', 'none');
        that.$record_time.text('2:00');
        that.$goTime.text('0:00');
        that.$record_seek_seek.val(0);

        that.$record_done.removeClass('done_off');
        that.$record_done.addClass('done_on');

        that.$trash.removeClass('trash_off');
        that.$trash.addClass('trash_on');
      } else {
        that.$recordBtn.removeClass();
        that.$recordBtn.addClass('record_start');

        that.$record_play_btn.css('display', 'none');
        that.$record_seek.css('display', 'none');

        that.$status.css('display', 'block');
        that.$record_time.css('display', 'block');

        that.$record_done.removeClass('done_on');
        that.$record_done.addClass('done_off');

        that.$trash.removeClass('trash_on');
        that.$trash.addClass('trash_off');

//				that.$total_time.css('display','none');
//				that.$recordLoading.css('display','block');

        that.$record_seek_seek.val(0);
        if (that.record_file) {
          that.record_file.pause();
        }
      }
    };

    var startRecording = function () {
      that.audioRecorder.onTimeout = function (recorder) {
        clearInterval(recorderWV.record_interval);
        window.cancelAnimationFrame(that.rafID);
        that.rafID = null;
        recorder.finishRecording();
      };
      that.audioRecorder.onComplete = function (recorder, blob) {
        changeRecordUI(true);

        that.blob = blob;
        var url = URL.createObjectURL(blob);

        that.record_file = new Audio(url);
        that.record_file.addEventListener('loadedmetadata', function () {
          that.record_duration = Math.floor(that.record_file.duration);
          if (that.record_duration > 120) that.record_duration = 120;
          that.$record_seek_seek.attr('max', that.record_duration);

          if (that.record_duration < 60) {
            if (that.record_duration < 10) {
              that.$total_time.text('0:0' + that.record_duration);
            } else {
              that.$total_time.text('0:' + that.record_duration);
            }

          } else {
            var minute = Math.floor(parseInt(that.record_duration) / 60);
            var second = parseInt(that.record_duration) % 60;

            if (second < 10) {
              that.$total_time.text(minute + ':0' + second);
            } else {
              that.$total_time.text(minute + ':' + second);
            }
          }
          that.$total_time.css('display', 'block');
        });

        that.record_file.addEventListener('timeupdate', function () {
          var now = Math.floor(that.record_file.currentTime);
          that.$record_seek_seek.val(now);

          if (now < 60) {
            if (now < 10) {
              that.$goTime.text('0:0' + now);
            } else {
              that.$goTime.text('0:' + now);
            }
          } else {
            var minute = Math.floor(parseInt(now) / 60);
            var second = parseInt(now) % 60;

            if (second < 10) {
              that.$goTime.text(minute + ':0' + second);
            } else {
              that.$goTime.text(minute + ':' + second);
            }
          }

          if (now >= that.record_duration) {
            that.$record_seek_seek.val(0);
            that.$record_play_btn.removeClass();
            that.$record_play_btn.addClass('record_play_start');
            that.$trash.removeClass('trash_off');
            that.$trash.addClass('trash_on');
            that.$record_done.removeClass('done_off');
            that.$record_done.addClass('done_on');
            that.$goTime.text('0:00');
          }
        });
      };
      that.audioRecorder.startRecording();

      that.record_interval = setInterval(updateDateTime, 200);
      updateAnalysers();
    };

    var stopRecording = function (mode) {
      clearInterval(recorderWV.record_interval);
      that.audioRecorder.finishRecording();
      if (that.record_file) {
        that.record_file.pause();
      }
      window.cancelAnimationFrame(that.rafID);
      that.rafID = null;
    };

    var resetUI = function () {
      that.$recordBtn.removeClass().addClass('record_start');
      that.$record_play_btn.removeClass().addClass('record_play_start').css('display', 'none');
      that.$status.css('display', 'block');
      that.$record_seek.css('display', 'none');
      that.$record_time.css('display', 'block');
      that.$record_time.text('2:00');
      that.$record_done.removeClass('done_on');
      that.$record_done.removeClass('done_off');

      if (that.analyserContext) {
        that.analyserContext.clearRect(0, 0, that.canvasWidth, that.canvasHeight);
      }
    };

    this.$recordBtn.on('click', function () {
      if (that.audioContext == null) {
        alert('Problem recording audio\n' +
          'Please close the Oxford Learner\'s Bookshelf app, check your microphone and then open the app again.\n' +
          'Still having problems? Contact Customer Support at eltsupport@oup.com for help.');
        return;
      } else {
        if (that.audioRecorder1.isRecording()) {
          that.$p_record.trigger('click');
        }
        if (that.audioRecorder.isRecording()) {
          //ui변경
          stopRecording('done');
        } else {
          changeRecordUI(false);
          startRecording();
        }
      }

    });

    this.$record_seek_seek.on('change', function (e) {
      e.preventDefault();
      that.record_file.currentTime = that.$record_seek_seek[0].value;
    });

    this.$record_done.on('click', function () {
      if (that.$record_done.hasClass('done_on')) {
        if (that.record_status == true) {
          stopRecording('done');
          that.record_status = false;
        }

        if (that.blob == null) {
          that.$container.css('display', 'none');
          //그냥 지우면 안되지
          //저장안했을때 지우는건 맞는데 이미 저장된 데이터를 여는 것이라면 지우면 안된다.
          if (that.is_new) {
            that.memoObject.remove();
          }
          return;
        }

        var $indicator;

        $indicator = $('<img src="../images/viewer/toolBox/record/recording_sync_prepare.png" class="spinner">');
        $indicator.css({
          position: 'relative',
          left: 6 + '%',
          top: -2 + '%',
          display: 'block',
          width: '90%'
        });
        $indicator.attr('key-data', that.saveTime);

        $indicator.off().on('click', function (e) {
          if (Viewer.getIsDragging() === true) {
            Viewer.setIsDragging(false);
            return;
          }
          //offline save
          messeageAlert.openAlert('Saving your recording', 'Your recording is being saved.', 'Cancel', 'Continue', 'saveLocalAudio', that.saveTime, that.pageNum);
        });

//				that.memoObject = $('[data-key="'+that.saveTime+'"]');
        let list = $('.recordLocalWrap');
        let list2 = $('.recordWrap');

        for (let i in list2) {
          if (list2.hasOwnProperty(i)) {
            list.push(list2[i]);
          }
        }

        for (let i in list) {
          if (list.hasOwnProperty(i)) {
            if ($(list[i]).data('key') === that.saveTime) {
              that.memoObject = $(list[i]);
            }
          }
        }

        that.memoObject.append($indicator);
        that.memoObject.removeClass('recordLocalWrap');
        that.memoObject.addClass('recordSyncing');

        SyncDataS3.setAudioMemoUploaded(that.pageNum, that.saveTime, false);

        that.recorder && that.recorder.done($indicator, that.pageNum, that.saveTime, that.positionX, that.positionY, that.is_new, that.blob, null)
        .then(function () {
          that.memoObject.removeClass('recordSyncing');
          that.memoObject.addClass('recordLocalWrap');
          that.memoObject.data('key', that.saveTime);
          const url = conf.audioPath(Viewer.getUserID()) + Viewer.getBookID() + '_' + that.saveTime + '.mp3';
          that.openLocalRecord(event, that.pageNum, that.memoObject, url, that.saveTime, that.$container);
        });
//				that.is_recording=false;

//				resetUI();
        //that.$container.css('display','none');
//				changeRecordUI(false);
        //수정

        //key설정
      } else {
        return;
      }
    });

    this.$trash.on('click', function () {
      if (that.$trash.hasClass('trash_on')) {
        //경고 메시지
        clearInterval(that.timeout_check);
        if (that.is_new) {
          messeageAlert.openAlert("Delete", 'Are you sure you want to delete this note?', 'Cancel', 'OK', 'trash', that.saveTime, that.pageNum);
        } else {
          messeageAlert.openAlert("Delete", 'Are you sure you want to delete this note everywhere?', 'Cancel', 'OK', 'trash', that.saveTime, that.pageNum);
        }
      } else {
        return;
      }
    });
    this.$upload.on('click', function () {
      if (that.$upload.hasClass('upload_on')) {
        //경고 메시지
        clearInterval(that.timeout_check);
        messeageAlert.openAlert("Uploading to cloud", 'Are you sure you want to save this audio note to the Cloud?', 'Cancel', 'OK', 'upload', that.saveTime, that.pageNum);
      } else {
        return;
      }
    });

    this.$audioClose.on('click', function () {
      if ($(this).hasClass('close_off')) {
        return false;
      }
      clearInterval(that.timeout_check);
      that.$container.css('display', 'none');
    });

    this.$record_play_btn.on('click', function () {
      if (that.is_new) {
        if (that.$record_play_btn.hasClass('record_play_start')) {
          that.$record_play_btn.removeClass();
          that.$record_play_btn.addClass('record_play_pause');

          that.$trash.removeClass('trash_on');
          that.$trash.addClass('trash_off');
          that.$record_done.removeClass('done_on');
          that.$record_done.addClass('done_off');

          that.record_file.play();
        } else {
          that.$record_play_btn.removeClass();
          that.$record_play_btn.addClass('record_play_start');

          that.$trash.removeClass('trash_off');
          that.$trash.addClass('trash_on');
          that.$record_done.removeClass('done_off');
          that.$record_done.addClass('done_on');

          that.record_file.pause();
        }
      } else {
        if (that.$record_play_btn.hasClass('save_record_play_start')) {
          that.$record_play_btn.removeClass();
          that.$record_play_btn.addClass('save_record_play_pause');

          that.$trash.removeClass('trash_on');
          that.$trash.addClass('trash_off');
//					that.$record_done.removeClass('done_on');
//					that.$record_done.addClass('done_off');
          that.$audioClose.removeClass('close_on');
          that.$audioClose.addClass('close_off');
          that.$upload.removeClass('upload_on');
          that.$upload.addClass('upload_off');

          that.record_file.play();
        } else {
          that.$record_play_btn.removeClass();
          that.$record_play_btn.addClass('save_record_play_start');

          that.$trash.removeClass('trash_off');
          that.$trash.addClass('trash_on');
//					that.$record_done.removeClass('done_off');
//					that.$record_done.addClass('done_on');
          that.$audioClose.removeClass('close_off');
          that.$audioClose.addClass('close_on');

          if (SyncDataS3.getAudioOneMemo(that.pageNum, that.saveTime).uploaded != undefined) {
            if (SyncDataS3.getAudioOneMemo(that.pageNum, that.saveTime).uploaded == false) {
              that.$upload.removeClass('upload_off');
              that.$upload.addClass('upload_on');
            }
          }

          that.record_file.pause();
        }
      }
    });

    //--------------------------- 발음녹음 부분 ---------------------------//
    var updateAnalysers2 = function () {
      if (!(that.analyserContext2)) {
        var canvas = document.getElementById("status2");
        that.canvasWidth2 = canvas.width;
        that.canvasHeight2 = canvas.height;
        that.analyserContext2 = canvas.getContext('2d');
      }

      //반복하면서 그려줘야 한다.
      var SPACING = 4;
      var BAR_WIDTH = 3;
      var numBars = Math.round(that.canvasWidth2 / SPACING);
      var freqByteData = new Uint8Array(that.analyserNode.frequencyBinCount);

      that.analyserNode.getByteFrequencyData(freqByteData);

      that.analyserContext2.clearRect(0, 0, that.canvasWidth2, that.canvasHeight2);
      that.analyserContext2.fillStyle = '#F6D565';
      that.analyserContext2.lineCap = 'round';
      var multiplier = that.analyserNode.frequencyBinCount / numBars;

      var magnitude = 0;
      for (var j = 0; j < multiplier; j++)
        magnitude += freqByteData[j];

      magnitude = magnitude / multiplier;

      that.analyserContext2.fillStyle = "#00CCFF";

      var length = Math.floor(magnitude / 10);
      for (var i = 0; i < length; i++) {
        that.analyserContext2.fillRect(i * SPACING, that.canvasHeight2 - 1, BAR_WIDTH, -6);
      }

      that.rafID = window.requestAnimationFrame(updateAnalysers2);
    };

    var startRecording2 = function () {
      that.audioRecorder1.onTimeout = function (recorder) {
        clearInterval(recorderWV.record_interval);
        window.cancelAnimationFrame(that.rafID);
        that.rafID = null;
        recorder.finishRecording();
      };

      that.audioRecorder1.onComplete = function (recorder, blob) {
        changeRecordUI2(true);

        that.blob = blob;
        var url = URL.createObjectURL(blob);

        that.record_file1 = new Audio(url);
        that.record_file1.addEventListener('loadedmetadata', function () {
          that.time_count = Math.floor(that.record_file1.duration);
          if (that.time_count > 120) that.time_count = 120;
          that.$p_seek.attr('max', that.time_count);

          if (that.time_count < 60) {
            if (that.time_count < 10) {
              that.$p_end_time.text('0:0' + that.time_count);
            } else {
              that.$p_end_time.text('0:' + that.time_count);
            }

          } else {
            var minute = Math.floor(parseInt(that.time_count) / 60);
            var second = parseInt(that.time_count) % 60;

            if (second < 10) {
              that.$p_end_time.text(minute + ':0' + second);
            } else {
              that.$p_end_time.text(minute + ':' + second);
            }
          }

          //로딩표시 없애고 시간표시한다.
//						that.$recordLoading.css('display','none');
          that.$p_end_time.css('display', 'block');
        });

        that.record_file1.addEventListener('timeupdate', function () {
          var now_mil = that.record_file1.currentTime;
          var now = Math.floor(that.record_file1.currentTime);
          that.$p_seek.val(now_mil);

          if (now < 60) {
            if (now < 10) {
              that.$p_star_time.text('0:0' + now);
            } else {
              that.$p_star_time.text('0:' + now);
            }
          } else {
            var minute = Math.floor(parseInt(now) / 60);
            var second = parseInt(now) % 60;

            if (second < 10) {
              that.$p_star_time.text(minute + ':0' + second);
            } else {
              that.$p_star_time.text(minute + ':' + second);
            }
          }

          if ( now >= that.time_count ) {
            that.$p_seek.val(0);
            that.$p_play.removeClass('play_pause');
            that.$p_play.addClass('play_on');

            that.$p_star_time.text('0:00');
          }
        });
      };

      that.audioRecorder1.startRecording();

      that.record_interval = setInterval(updateDateTime2, 200);
      updateAnalysers2();
    };
    var stopRecording2 = function (mode) {
      clearInterval(that.record_interval);
      //that.recorder && that.recorder.stop();
      that.audioRecorder1.finishRecording();
      if (that.record_file1) {
        that.record_file1.pause();
      }
      // if (mode == 'done') {
      //   createURL2();
      // }

      window.cancelAnimationFrame(that.rafID);
      that.rafID = null;
      //clearInterval(that.time_interval);
      //clearInterval(that.record_interval);

      // create WAV download link using audio data blob
      //that.recorder.clear();
    };

    this.$p_seek.on('change', function (e) {
      e.preventDefault();
      if(that.record_file1 !== null) {
        that.record_file1.currentTime = that.$p_seek[0].value;
      } else {
        that.$p_seek.val(0);
      }
    });

    var changeRecordUI2 = function (isRecording) {
      if (isRecording) {
        that.$p_record.removeClass('record_light');
        that.$p_record.removeClass('record_dark');
        that.$p_record.removeClass('record_start');
        that.$p_record.addClass('record_start');
        that.$p_star_time.css('display', 'block');
        that.$p_end_time.css('display', 'block');

        that.$p_seek.css('display', 'block');

        that.$p_status.css('display', 'none');
        that.$p_time.css('display', 'none');
        that.$p_time.text('0:00');
        that.$p_star_time.text('0:00');
        that.$p_seek.val(0);
        that.$p_play.removeClass('play_pause').removeClass('play_off').addClass('play_on');

      } else {
        that.$p_record.removeClass('record_start');

        that.$p_seek.css('display', 'none');
        that.$p_star_time.css('display', 'none');
        that.$p_end_time.css('display', 'none');

        that.$p_status.css('display', 'block');
        that.$p_time.css('display', 'block');

        that.$p_seek.val(0);
        if (that.record_file1) {
          that.record_file1.pause();
        }
        that.$p_play.removeClass('play_pause').removeClass('play_on').addClass('play_off');
      }
    };

    this.$p_record.on('click', function () {
      if (that.audioContext == null) {
        alert('Problem recording audio\n' +
          'Please close the Oxford Learner\'s Bookshelf app, check your microphone and then open the app again.\n' +
          'Still having problems? Contact Customer Support at eltsupport@oup.com for help.');
        return;
      } else {
        if (that.audioRecorder.isRecording()) {
          that.$recordBtn.trigger('click');
        }

        if (that.audioRecorder1.isRecording()) {
          //ui변경
          //changeRecordUI2();
          stopRecording2('done');
        } else {
          changeRecordUI2(false);
          startRecording2();
        }
      }
    });

    this.$p_play.on('click', function () {
      if (that.$p_play.hasClass('play_on')) {
        //재생
        that.$p_play.removeClass('play_on');
        that.$p_play.addClass('play_pause');

        that.record_file1.play();
      } else if (that.$p_play.hasClass('play_pause')) {
        //멈춤
        that.$p_play.removeClass('play_pause');
        that.$p_play.addClass('play_on');

        that.record_file1.pause();
      }
    });

    this.$p_clsoe.on('click', function () {
      if (that.record_file1) {
        that.record_file1.pause();
      }

      that.$p_play.removeClass('play_on');
      that.$p_play.removeClass('play_pause');
      that.$p_play.addClass('play_off');

      that.$p_record.removeClass('record_light');
      that.$p_record.removeClass('record_dark');
      that.$p_record.removeClass('record_start');
      that.$p_record.addClass('record_start');
      that.$p_star_time.css('display', 'block');
      that.$p_end_time.css('display', 'block');

      that.$p_seek.css('display', 'block');

      that.$p_status.css('display', 'none');
      that.$p_time.css('display', 'none');
      that.$p_time.text('0:00');
      that.$p_star_time.text('0:00');
      that.$p_end_time.text('0:00');
      that.$p_seek.val(0);

      if(that.audioRecorder1) {
        if (that.audioRecorder1.isRecording()) {
          stopRecording2();
        }
      }
    });

  }
};
