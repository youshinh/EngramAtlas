/**
 * EngramAtlas コアプロキシ（GAS）
 * Google Apps Script プロパティに「GEMINI_API_KEY」を設定してください。
 */

const API_KEY = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
const AGENT_ID = "engram-atlas-core"; 
const ENDPOINT = `https://cloudcode-pa.googleapis.com/v1beta/agents/${AGENT_ID}:invoke`;

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🧬 EngramAtlas')
      .addItem('🧠 思考ノイズの投入', 'showNoiseInputDialog')
      .addToUi();
}

function showNoiseInputDialog() {
  const html = HtmlService.createHtmlOutputFromFile('InputForm')
      .setWidth(550)
      .setHeight(450)
      .setTitle('EngramAtlas - 思考インプット');
  SpreadsheetApp.getUi().showModalDialog(html, ' ');
}

function sendNoiseToAgent(userInput) {
  try {
    const payload = {
      "contents": [{
        "role": "user",
        "parts": [{ "text": userInput }]
      }],
      "interaction_config": {
        "store": true // サンドボックス内の状態、一時ファイルをセッション維持
      }
    };
      
    const options = {
      "method": "POST",
      "headers": {
        "x-goog-api-key": API_KEY,
        "Api-Revision": "2026-05-20",
        "Content-Type": "application/json"
      },
      "payload": JSON.stringify(payload),
      "muteHttpExceptions": true
    };
      
    const response = UrlFetchApp.fetch(ENDPOINT, options);
    const resText = response.getContentText();
    const resJson = JSON.parse(resText);
      
    if (resJson.error) {
      return "Error: " + resJson.error.message;
    }
      
    // エージェントの回答および思考プロセスのテキストを抽出
    const agentResponse = resJson.candidates[0].content.parts[0].text;
    return agentResponse;
      
  } catch (e) {
    return "例外エラーが発生しました: " + e.toString();
  }
}
