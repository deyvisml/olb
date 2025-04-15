(function(window){

	var WORKER_PATH = '../js/ods-viewer/lib/recorderWorker.js';
	var encoderWorker = new Worker('../js/ods-viewer/lib/mp3Worker.js');
	var xhr;
	var Recorder = function(source, cfg){

		this.toDelete = false;
		var config = cfg || {};
		var bufferLen = config.bufferLen || 4096;
		this.context = source.context;
//    this.node = (this.context.createScriptProcessor ||
//                 this.context.createJavaScriptNode).call(this.context,
//                                                         bufferLen, 2, 2);
		if(!this.context.createScriptProcessor){
			this.node = this.context.createJavaScriptNode(bufferLen, 2, 2);
		} else {
			this.node = this.context.createScriptProcessor(bufferLen, 2, 2);
		}
		var worker = new Worker(config.workerPath || WORKER_PATH);
		worker.postMessage({
			command: 'init',
			config: {
				sampleRate: this.context.sampleRate
			}
		});
		var recording = false,
			currCallback;

		this.node.onaudioprocess = function(e){
			if (!recording) return;
			worker.postMessage({
				command: 'record',
				buffer: [
					e.inputBuffer.getChannelData(0),
					e.inputBuffer.getChannelData(1)
				]
			});
		};

		this.configure = function(cfg){
			for (var prop in cfg){
				if (cfg.hasOwnProperty(prop)){
					config[prop] = cfg[prop];
				}
			}
		};

		this.record = function(){
			recording = true;
		};

		this.stop = function(){
			recording = false;
		};

		this.clear = function(){
			worker.postMessage({ command: 'clear' });
		};

		this.getBuffer = function(cb) {
			currCallback = cb || config.callback;
			worker.postMessage({ command: 'getBuffer' })
		};

		this.exportWAV = function(cb, type){
			currCallback = cb || config.callback;
			type = type || config.type || 'audio/wav';
			if (!currCallback) throw new Error('Callback not set');
			worker.postMessage({
				command: 'exportWAV',
				type: type
			});
		};

		this.done = function(indicator,pageNum, saveTime, positionX, positionY, is_new, blob, checkInterval){
			return new Promise(function(resolve){
				var arrayBuffer;
				var fileReader = new FileReader();
				var saveTime = saveTime;
				fileReader.onload = function(){
					arrayBuffer = this.result;
					
					var buffer = new Uint8Array(arrayBuffer);
					let fileName = SyncDataS3.bookID + '_' + encodeURIComponent(recorderWV.saveTime+'.mp3');
					saveAudioFile(fileName, buffer)
					.then(function(){
						if($('.spinner[key-data = "'+saveTime+'"]').length!=0){
							$('.spinner[key-data = "'+saveTime+'"]')[0].parentElement.classList.remove('recordSyncing');
							$('.spinner[key-data = "'+saveTime+'"]')[0].parentElement.classList.remove('recordWrap');
							$('.spinner[key-data = "'+saveTime+'"]')[0].parentElement.classList.add('recordLocalWrap');
						}
						indicator.remove();
						
						//오디오 노트 로컬에 저장
						let localAudioData = {
								userId: Viewer.getUserID(),
								bid: SyncDataS3.bookID,
								id: recorderWV.saveTime,
								audioNote:{
									id: recorderWV.saveTime,
									page: pageNum,
									x: positionX,
									y: positionY,
									uploaded: false
								}
						}
						
						ipcRenderer.sendSync('viewer-audio-record-save',localAudioData);
						resolve();
					});
				};
				fileReader.readAsArrayBuffer(blob);
			});
		};
		
		//upload
		this.upload = function(indicator,pageNum, saveTime, positionX, positionY){

			fs.readFile(conf.audioPath(SyncDataS3.userEmail) + SyncDataS3.bookID+'_'+saveTime + '.mp3', function (err, data) {
				  var base64data = new Buffer(data, 'binary');
				  let setParams = {
						  Bucket: conf.Environment.OLB_SYNC_BUCKET_NAME,
						  Key: SyncDataS3.client + '/' + SyncDataS3.userEmail +'/audio_file/'+ SyncDataS3.bookID+'_'+saveTime + '.mp3',
						  Body: base64data
				  };
				  SyncDataS3.putS3Object(setParams)
				  .then(function(){
					  //
					  if($('.spinner[key-data = "'+saveTime+'"]').length!=0){
						  $('.spinner[key-data = "'+saveTime+'"]')[0].parentElement.classList.remove('recordSyncing');
						  $('.spinner[key-data = "'+saveTime+'"]')[0].parentElement.classList.remove('recordLocalWrap');
						  $('.spinner[key-data = "'+saveTime+'"]')[0].parentElement.classList.add('recordWrap');
						  indicator.remove();
					  }
					  ipcRenderer.sendSync('viewer-audio-record-upload', SyncDataS3.bookID, saveTime);
					  SyncDataS3.setAudioMemoUploaded(pageNum,saveTime,true); 
				  })
				  .catch(function(e){
					  if($('.spinner[key-data = "'+saveTime+'"]').length!=0){
						  $('.spinner[key-data = "'+saveTime+'"]')[0].parentElement.classList.remove('recordSyncing');
						  $('.spinner[key-data = "'+saveTime+'"]')[0].parentElement.classList.remove('recordWrap');
						  $('.spinner[key-data = "'+saveTime+'"]')[0].parentElement.classList.add('recordLocalWrap');
						  indicator.remove();
					  }
					  alert('Please check your internet connection and try again.');
				  });
			});
			
		};

		worker.onmessage = function(e){
			var blob = e.data;
			currCallback(blob);
		};

		function encode64(buffer) {
			var binary = '',
				bytes = new Uint8Array( buffer ),
				len = bytes.byteLength;

			for (var i = 0; i < len; i++) {
				binary += String.fromCharCode( bytes[ i ] );
			}
			return window.btoa( binary );
		}
		function parseWav(wav) {
			function readInt(i, bytes) {
				var ret = 0,
					shft = 0;

				while (bytes) {
					ret += wav[i] << shft;
					shft += 8;
					i++;
					bytes--;
				}
				return ret;
			}
			if (readInt(20, 2) != 1) throw 'Invalid compression code, not PCM';
			if (readInt(22, 2) != 1) throw 'Invalid number of channels, not 1';
			return {
				sampleRate: readInt(24, 4),
				bitsPerSample: readInt(34, 2),
				samples: wav.subarray(44)
			};
		}

		function Uint8ArrayToFloat32Array(u8a){
			var f32Buffer = new Float32Array(u8a.length/2);//모노일 경우 나누기 2
			for (var i = 0; i < u8a.length; i++) {
				var value = u8a[i<<1] + (u8a[(i<<1)+1]<<8);
				if (value >= 0x8000) value |= ~0x7FFF;
				f32Buffer[i] = value / 0x8000;
			}
			return f32Buffer;
		}

		source.connect(this.node);
		this.node.connect(this.context.destination);    //this should not be necessary
	};

	Recorder.forceDownload = function(blob, filename){
		var url = (window.URL || window.webkitURL).createObjectURL(blob);
		var link = window.document.createElement('a');
		link.href = url;
		link.download = filename || 'output.wav';
		var click = document.createEvent("Event");
		click.initEvent("click", true, true);
		link.dispatchEvent(click);
	}

	window.Recorder = Recorder;

})(window);

function base64toHEX(base64) {

	  var raw = atob(base64);

	  var HEX = '';

	  for ( i = 0; i < raw.length; i++ ) {

	    var _hex = raw.charCodeAt(i).toString(16)

	    HEX += (_hex.length==2?_hex:'0'+_hex);

	  }
	  return HEX.toUpperCase();

}

function parseHexString(str) { 
    var result = [];
    while (str.length >= 2) { 
        result.push(parseInt(str.substring(0, 2), 16));
        str = str.substring(2, str.length);
    }

    return result;
}

/**
 * 오디오 버퍼를 fileName에 저장한다.
 * @param fileName 저장될 오디오 파일 명 BID_saveTime.mp3
 * @param buffer 오디오 데이터 Buffer
 */
function saveAudioFile(fileName, buffer){
	return new Promise(function(resolve){
		let exPath = conf.audioPath(Viewer.getUserID()) + fileName;
		fs.writeFileSync(exPath, buffer);
		
		if(recorderWV.recorder.toDelete){
			fs.unlinkSync(exPath);
			recorderWV.recorder.toDelete = false;
		}
		resolve();
	});
}

