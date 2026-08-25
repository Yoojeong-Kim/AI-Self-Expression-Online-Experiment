/**
 * Google Apps Script Web App (v3.0 - Case-Insensitive Smart Sync)
 */

function doGet(e) {
  return ContentService
    .createTextOutput("✅ AI Experiment Webhook v3.0 is Active and Working Properly!")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  
  try {
    var doc = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = doc.getActiveSheet();
    var rawContents = e.postData ? e.postData.contents : "{}";
    var data = JSON.parse(rawContents);
    
    // 키 이름을 소문자 및 밑줄 제거한 사전(Lookup Map)으로 생성
    var dataMap = {};
    for (var k in data) {
      if (data.hasOwnProperty(k)) {
        var cleanKey = k.toLowerCase().replace(/[^a-z0-9]/g, "");
        dataMap[cleanKey] = data[k];
      }
    }
    
    // 1. 만약 시트가 비어있다면 1행 자동 생성
    if (sheet.getLastRow() === 0 || sheet.getLastColumn() === 0) {
      sheet.appendRow(Object.keys(data));
    }
    
    // 2. 스프레드시트 1행에 적힌 열 이름들을 읽어옴
    var lastCol = sheet.getLastColumn();
    var sheetHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    
    // 3. 열 이름과 일치하는 데이터 값을 대소문자 무관하게 1:1 매핑
    var row = sheetHeaders.map(function(headerName) {
      var rawName = String(headerName).trim();
      var cleanHeader = rawName.toLowerCase().replace(/[^a-z0-9]/g, "");
      
      if (data[rawName] !== undefined && data[rawName] !== null) {
        return data[rawName];
      }
      if (dataMap[cleanHeader] !== undefined && dataMap[cleanHeader] !== null) {
        return dataMap[cleanHeader];
      }
      return "";
    });
    
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
