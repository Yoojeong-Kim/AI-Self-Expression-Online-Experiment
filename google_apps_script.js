/**
 * Google Apps Script for Online Experiment Data Collection
 * AI 챗봇의 시각적 자기표현 연구 (Study on Visual Self-Presentation of AI Chatbots)
 * 
 * [설정 방법]
 * 1. 구글 스프레드시트 상단 메뉴 [확장 프로그램] -> [Apps Script] 클릭
 * 2. 기존 코드를 모두 지우고 이 파일의 내용을 붙여넣기
 * 3. 우측 상단 [배포] -> [새 배포 관리] 또는 [새 배포] -> [웹 앱]
 *    - 다음 사용자로 실행: '나(내 계정)'
 *    - 액세스 권한: '모든 사용자(Anyone)'
 * 4. [배포] 후 생성된 웹 앱 URL을 복사하여 .env.local의 GOOGLE_SHEETS_WEBAPP_URL에 넣으시면 됩니다.
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = doc.getActiveSheet();
    
    // 전체 문항 및 데이터 헤더 정의
    var headers = [
      "timestamp", "participantId", "condition", "image_type", "timing", "language", 
      "total_chat_seconds", "chat_message_count", "full_chat_log",
      
      // 2. M1. 지각된 통제감
      "m1_control_1", "m1_control_2", "m1_control_3", "m1_control_4",
      
      // 3. M2. 자기투영 (3-1 자기일치 & 3-2 IOS 척도)
      "m2_self_1", "m2_self_2", "m2_self_3", "m2_ios_scale",
      
      // 4. DVs
      // 4-1 조언 이행 의도
      "dv_advice_1", "dv_advice_2", "dv_advice_3",
      // 4-2 정서적 의존
      "dv_emo_1", "dv_emo_2", "dv_emo_3", "dv_emo_4",
      // 4-3 준사회적 상호작용 경험
      "dv_psi_1", "dv_psi_2", "dv_psi_3", "dv_psi_4", "dv_psi_5", "dv_psi_6",
      // 4-4 인지적 의존
      "dv_cog_1", "dv_cog_2", "dv_cog_3", "dv_cog_4", "dv_cog_5", "dv_cog_6",
      
      // 5. 조작 점검
      "mc_timing", "mc_staged_1", "mc_staged_2", "mc_staged_3", "mc_attention",
      
      // 6. 통제 변수
      "ctrl_sim_1", "ctrl_sim_2", "ctrl_exp_1", "ctrl_exp_2", "ctrl_exp_3", "ctrl_prior_1", "ctrl_prior_2",
      
      // 7. 개인 특성 및 인구통계
      "trait_ai_freq", "trait_ai_emo_share", 
      "trait_lit_1", "trait_lit_2", "trait_lit_3", "trait_lit_4",
      "trait_lone_1", "trait_lone_2", "trait_lone_3",
      "demo_age", "demo_gender", "demo_country"
    ];
    
    // 시트가 비어있다면 헤더 추가
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
    }
    
    var data = JSON.parse(e.postData.contents);
    
    // 헤더 순서대로 행 데이터 매핑
    var row = [];
    for (var i = 0; i < headers.length; i++) {
      var key = headers[i];
      row.push(data[key] !== undefined ? data[key] : "");
    }
    
    sheet.appendRow(row);
    
    return ContentService
      .createTextOutput(JSON.stringify({ "result": "success", "row": sheet.getLastRow() }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ "result": "error", "error": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
