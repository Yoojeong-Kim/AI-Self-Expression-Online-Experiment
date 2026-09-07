/**
 * Google Apps Script Web App (v4.0 - Bulletproof Direct Column Mapping)
 */

function doGet(e) {
  try {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = doc.getActiveSheet();
    var lastRow = sheet.getLastRow();
    var lastCol = sheet.getLastColumn();
    var sheetName = sheet.getName();
    var spreadsheetName = doc.getName();
    var lastRowData = lastRow > 0 ? sheet.getRange(lastRow, 1, 1, Math.min(lastCol, 20)).getValues()[0] : [];
    
    var info = {
      status: "Active",
      spreadsheetName: spreadsheetName,
      activeSheetTabName: sheetName,
      totalRows: lastRow,
      totalColumns: lastCol,
      lastRowSample: lastRowData
    };
    return ContentService
      .createTextOutput(JSON.stringify(info, null, 2))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput("Error: " + err.toString())
      .setMimeType(ContentService.MimeType.TEXT);
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = doc.getActiveSheet();
    var rawContents = e.postData ? e.postData.contents : "{}";
    var data = JSON.parse(rawContents);
    
    // 58개 전체 컬럼 정의 (고정 순서)
    var COLUMNS = [
      "timestamp", "participantId", "condition", "image_type", "timing", "language",
      "gender", "birthYear", "occupation",
      "total_chat_seconds", "chat_message_count", "full_chat_log",
      
      // M1. 지각된 통제감 (4문항)
      "m1_control_1", "m1_control_2", "m1_control_3", "m1_control_4",
      
      // M2. 자기투영 (3문항 + IOS 척도)
      "m2_self_1", "m2_self_2", "m2_self_3", "m2_ios_scale",
      
      // DVs (종속변수 19문항)
      "dv_advice_1", "dv_advice_2", "dv_advice_3",
      "dv_emo_1", "dv_emo_2", "dv_emo_3", "dv_emo_4",
      "dv_psi_1", "dv_psi_2", "dv_psi_3", "dv_psi_4", "dv_psi_5", "dv_psi_6",
      "dv_cog_1", "dv_cog_2", "dv_cog_3", "dv_cog_4", "dv_cog_5", "dv_cog_6",
      
      // 조작점검 (5문항)
      "mc_timing", "mc_staged_1", "mc_staged_2", "mc_staged_3", "mc_attention",
      
      // 통제변수 (7문항)
      "ctrl_sim_1", "ctrl_sim_2", "ctrl_exp_1", "ctrl_exp_2", "ctrl_exp_3", "ctrl_prior_1", "ctrl_prior_2",
      
      // 개인특성 (9문항)
      "trait_ai_freq", "trait_ai_emo_share", 
      "trait_lit_1", "trait_lit_2", "trait_lit_3", "trait_lit_4",
      "trait_lone_1", "trait_lone_2", "trait_lone_3"
    ];
    
    // 1. 만약 스프레드시트 1행이 비어있다면 1행에 정확한 58개 헤더 자동 기입
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(COLUMNS);
    }
    
    // 2. 58개 컬럼 순서대로 한 줄(Row)을 만들어 값 추출
    var row = [];
    for (var i = 0; i < COLUMNS.length; i++) {
      var colKey = COLUMNS[i];
      var val = data[colKey];
      
      // 키 이름 대체 매핑 지원 (예: gender_pre, birthYear_pre)
      if (val === undefined || val === null) {
        if (colKey === "gender") val = data["gender_pre"] || data["demo_gender"];
        else if (colKey === "birthYear") val = data["birthYear_pre"] || data["demo_age"];
        else if (colKey === "occupation") val = data["occupation_pre"];
      }
      
      row.push(val !== undefined && val !== null ? val : "");
    }
    
    // 3. 스프레드시트 맨 아래 행에 1줄 추가
    sheet.appendRow(row);
    
    return ContentService
      .createTextOutput(JSON.stringify({ "result": "success", "row": sheet.getLastRow(), "columnsCount": row.length }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ "result": "error", "error": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
