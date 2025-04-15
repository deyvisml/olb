/**
 * 국가별 언어로 된 메시지 처리 프로그램
 * 메세지가 많지 않아 현재는 하나의 프로그램에서 관리. 메세지가 많아져 이 파일에서 관리가 어려울 경우, 국가별 js 파일을 별도로 만들어 처리.
 * User: kmaeng@iportfolio.co.kr
 * Date: 14. 6. 30.
 */

/*jslint node: true */
'use strict';

var Message = function() {
	var supportLang = ['EN', 'KR']; //지원언어
	var lang = 'EN'; //사용언어

	//책을 볼 수 없는, 프로그램을 종료시켜야 하는 심각한 오류코드 (1001~2000)
	var ERROR_CODES = ['1001', '1002', '1003'];

	//책을 보는데 지장은 없지만 특정기능이 작동 안될 수 있는, 경고정도 수준의 코드 또는, 사용자에게 알림을 제공해주는 코드 (2001~3000)
	//TODO 4000 번대 코드는 프로그램 개발을 통해 없애야 하는 코드이다!
	var ALERT_CODES = ['4001', '4002', '4003', '2001', '2002', '2003', '2004', '2005', '2006'];

	//Text로 표시되는 코드 (3001~4000)
	var NOTICE_CODES = ['3001', '3002', '3003', '3004', '3005', '3006', '3007', '3008', '3009','3010'];

	var ERROR_CODE = {
		EN: {
			1001: 'There is a problem with this book. Please email Customer Support at <a href="mailto:eltsupport@oup.com">eltsupport@oup.com</a>'
			,1002: 'Cannot extract book data. Please send any inquiries to <a href="mailto:eltsupport@oup.com">eltsupport@oup.com</a>'
			,1003: 'Access denied.'

		},

		KR: {
			1001: '책 정보를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.'
			,1002: '책 정보를 추출중에 에러가 발생하였습니다. <a href="mailto:eltsupport@oup.com">eltsupport@oup.com</a> 로 이메일 문의 바랍니다.'
			,1003: '접속이 거부되었습니다.'

		}
	};

	var ALERT_CODE = {
		EN: {
			2001: 'under development'
			,2002: 'Saved!'
			,2003: 'An error occurred while saving.'
			,2004: 'Failed to load the data.'
			,2005: 'Failed to save the data.'
			,2006: 'Cannot extract sync data. Please send any inquiries to eltsupport@oup.com.'
			,4001: 'You have reached the first page'
			,4002: 'You have reached the last page'
			,4003: 'This page does not exist.'
		},
		KR: {
			2001: '개발중'
			,2002: '저장완료!'
			,2003: '스크린캡쳐 저장도중 에러가 발생하였습니다.'
			,2004: '동기화 데이터 로드중 에러가 발생하였습니다.'
			,2005: '동기화 데이터 저장중 에러가 발생하였습니다.'
			,2006: '동기화 데이터 추출도중 에러가 발생하였습니다. eltsupport@oup.com 로 이메일 문의 바랍니다.'
			,4001: '첫 페이지 입니다.'
			,4002: '마지막 페이지 입니다.'
			,4003: '해당 페이지는 존재하지 않습니다.'
		}
	};

	var NOTICE_CODE = {
		EN: {
			3001: 'No results matching your search were found.'
			,3002: 'saving in OneDrive...'
			,3003: "Do you want to save your changes?\nPlease click the ‘Save and Close’ button to save your changes.\nIf you close this window, any changes you have made to your book could be lost."
			,3004: 'Did you know that your internet browser is out of date?'
			,3005: 'Your browser is out of date, and is not compatible with our website. A list of the most popular web browsers can be found below.'
			,3006: 'Just click on the icons to go to the download page.'
			,3007: 'By closing this window you acknowledge that your experience on this website may be degraded.'
			,3008: 'Close this window'
			,3009: 'This title can only be read on an Apple device (iPad or iPad mini)'
			,3010: 'This title can only be read on tablet devices (iOS and Android)'
		},

		KR: {
			3001: '검색결과가 없습니다.'
			,3002: 'OneDrive에 저장중입니다. 잠시만 기다려주세요.'
			,3003: '현재 책을 닫으시겠습니까?'
			,3004: '현재 접속하신 브라우져는 이 웹어플리케이션에 최적화된 브라우져가 아닙니다.'
			,3005: '아래의 웹브라우져 리스트중에서 하나를 다운 받아 이용해주세요.'
			,3006: '클릭하시면 다운로드 페이지로 이동합니다.'
			,3007: '이 창을 닫으시면 이 웹 어플리케이션은 정상작동 하지 않을 수 있습니다.'
			,3008: '창 닫기'
			,3009 : '해당 책은 모바일 기기에서 이용 가능합니다.'
			,3010 : '해당 책은 모바일 기기에서 이용 가능합니다.'
		}
	};

	return {
		/**
		 * 언어 셋팅
		 * @param isoCode
		 */
		setLang: function(isoCode) {
			if ( supportLang.indexOf(isoCode) > -1 ) {
				lang = isoCode;
			}
			else {
				lang = 'EN'; //default value
			}
		},

		/**
		 * 에러메세지를 출력한다. (에러는 프로그램이 돌아갈수 없는 상황으로 인식하여 document.write 로 처리한다.)
		 * @param error_code
		 */
		showErrorMsg: function(error_code) {
			if ( ERROR_CODES.indexOf(error_code) > -1 ) {
				document.write( ERROR_CODE[lang][error_code] );
			}
			else {
			}

		},

		/**
		 * 경고메세지를 출력한다. (경고는 프로그램이 돌아갈 수는 있지만 특정 기능이 돌아가지 않을수 도 있는 상황으로 인식하여 alert 로 처리한다.)
		 * @param alert_code
		 */
		showAlertMsg: function(alert_code) {
			if ( ALERT_CODES.indexOf(alert_code) > -1 ) {
				alert( ALERT_CODE[lang][alert_code] );
			}
			else {
			}
		},

		/**
		 * 알림메세지 (공지나, 단순 텍스트 등등)를 가져온다.
		 * @param notice_code
		 * @returns {string}
		 */
		getNoticeMsg: function(notice_code) {
			var result = '';

			if ( NOTICE_CODES.indexOf(notice_code) > -1 ) {
				result = NOTICE_CODE[lang][notice_code];
			}
			else {
			}

			return result;
		}
	};
}();
