const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 3000;
const HOST = 'localhost';
const BASE_URL = `http://${HOST}:${PORT}`;

let serverProcess = null;
let totalScore = 0;
const results = [];

function recordResult(name, passed, score, comment) {
  const earned = passed ? score : 0;
  totalScore += earned;
  results.push({ name, passed, maxScore: score, earnedScore: earned, comment });
}

function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, data });
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = http.createServer()
      .once('error', () => resolve(true))
      .once('listening', () => {
        server.close();
        resolve(false);
      })
      .listen(port);
  });
}

async function startServer() {
  const inUse = await isPortInUse(PORT);
  if (inUse) {
    console.log(`📡 [Port ${PORT} is already in use. Using the existing server...]`);
    return false;
  }

  console.log(`🚀 Starting local server for validation...`);
  serverProcess = spawn('node', ['server.js'], {
    stdio: 'ignore',
    detached: false
  });

  await new Promise(resolve => setTimeout(resolve, 1500));
  return true;
}

function stopServer() {
  if (serverProcess) {
    console.log(`🔌 Stopping the temporary validation server...`);
    serverProcess.kill();
  }
}

async function runEvaluation() {
  console.log(`\n======================================================`);
  console.log(`🧬 EngramAtlas - Evaluation Driven Development (EDD)`);
  console.log(`🔍 Day 6-8 自律回復＆デバッグ 評価実行中...`);
  console.log(`======================================================\n`);

  let autoStarted = false;
  try {
    autoStarted = await startServer();
  } catch (err) {
    console.error("❌ サーバーの自動起動に失敗しました:", err.message);
  }

  try {
    // 1. UI 疎通テスト
    let uiPassed = false;
    try {
      const response = await makeRequest({
        host: HOST,
        port: PORT,
        path: '/',
        method: 'GET'
      });
      const hasTitle = response.data.includes('EngramAtlas');
      const hasInput = response.data.includes('noiseInput');
      const hasLang = response.data.includes('toggleLanguage');
      const hasMarked = response.data.includes('marked.min.js');
      uiPassed = response.statusCode === 200 && hasTitle && hasInput && hasLang && hasMarked;
      recordResult(
        "UI 疎通（Accessibility）",
        uiPassed,
        10,
        uiPassed ? "UI (HTML、言語切替トグル、Markdownレンダラー) の正常配信を確認。" : "UI応答に必須の要素やライブラリが含まれていません。"
      );
    } catch (err) {
      recordResult("UI 疎通（Accessibility）", false, 10, `サーバーに接続できません: ${err.message}`);
    }

    // 2. API 疎通 & 3. データ永続化シナリオテスト
    const noise1 = "階段の段板における木目の『反り』を構造強度に組み込む逆限定設計。DMR加工による気流と滑り止め制御。";
    const noise2 = "不均質マテリアル（癖木や端材）の長所を活かす匠の技と、境界面における流体抵抗削減（DMR）技術の共振。";

    let id1 = null;
    let id2 = null;
    let api1Passed = false;
    let api2Passed = false;
    let res1Json = null;
    let res2Json = null;

    // 送信 1
    try {
      const postData1 = JSON.stringify({ userInput: noise1, lang: 'ja' });
      const response1 = await makeRequest({
        host: HOST,
        port: PORT,
        path: '/api/sendNoise',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData1)
        }
      }, postData1);

      if (response1.statusCode === 200) {
        res1Json = JSON.parse(response1.data);
        id1 = res1Json.db_id;
        api1Passed = !!id1;
      }
    } catch (err) {
      console.warn("⚠️ 1回目の送信でエラーが発生しました:", err.message);
    }

    // 送信 2 (1回目が成功している場合のみ)
    if (api1Passed) {
      try {
        const postData2 = JSON.stringify({ userInput: noise2, lang: 'ja' });
        const response2 = await makeRequest({
          host: HOST,
          port: PORT,
          path: '/api/sendNoise',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData2)
          }
        }, postData2);

        if (response2.statusCode === 200) {
          res2Json = JSON.parse(response2.data);
          id2 = res2Json.db_id;
          api2Passed = !!id2;
        }
      } catch (err) {
        console.warn("⚠️ 2回目の送信でエラーが発生しました:", err.message);
      }
    }

    // 項目 2: API 疎通と整合性 (API Integrity)
    const apiPassed = api1Passed && api2Passed;
    recordResult(
      "API 疎通と整合性（API Integrity）",
      apiPassed,
      10,
      apiPassed ? "2連続の POST /api/sendNoise がすべてステータス 200 で返りました。" : "APIの連続疎通に失敗しました。"
    );

    // 項目 3: データ永続化 (Create)
    const creationPassed = !!(id1 && id2);
    recordResult(
      "データ永続化（Create）",
      creationPassed,
      10,
      creationPassed ? `2つの新規 engram の ID 発行を確認。ID1: "${id1}", ID2: "${id2}"` : "ドキュメントIDの新規生成に失敗しました。"
    );

    // 項目 4: エージェント思考プロセス (Gemini Integration)
    const thoughtPassed = res2Json && res2Json.response && res2Json.response.includes('#');
    recordResult(
      "エージェント思考プロセス（Gemini Integration）",
      thoughtPassed,
      15,
      thoughtPassed ? "Gemini から Markdown 形式の高度な思考プロセスを取得しました。" : "Gemini の応答が空であるか、Markdown フォーマットではありません。"
    );

    // 項目 5: 自己組織化と双方向リンク構築 (Self-Organization & Metabolism)
    let selfOrgPassed = false;
    let selfOrgDetail = "";
    if (res2Json && res2Json.relations && Array.isArray(res2Json.relations)) {
      const relation = res2Json.relations.find(r => r.to_engram_id === id1);
      if (relation) {
        const hasScore = relation.strength >= 0.75;
        const hasReason = relation.reason_of_connection && relation.reason_of_connection.trim() !== "";
        if (hasScore && hasReason) {
          selfOrgPassed = true;
          selfOrgDetail = `新規 ID2 (${id2}) と過去 ID1 (${id1}) が類似度 ${relation.strength.toFixed(2)} で双方向結線され、共鳴理由: "${relation.reason_of_connection.substring(0, 40)}..." が紡がれました。`;
        } else {
          selfOrgDetail = `リンクはありますが、類似度スコア不足 (${relation.strength}) または接続理由が空です。`;
        }
      } else {
        selfOrgDetail = `ID2 の関連リンク一覧に ID1 (${id1}) への参照が見つかりません。`;
      }
    } else {
      selfOrgDetail = "2回目のレスポンスに relations 配列が含まれていないか、構造が不正です。";
    }

    recordResult(
      "自己組織化と双方向リンク構築（Self-Organization & Metabolism）",
      selfOrgPassed,
      20,
      selfOrgPassed ? selfOrgDetail : `自己組織化の判定失敗: ${selfOrgDetail}`
    );

    // 項目 6: 自律回復とトリアージ（Resilience & Self-Healing）
    let resiliencePassed = false;
    let resilienceDetail = "";
    try {
      console.log("🔥 [Resilience Test] Sending transient error simulation request...");
      const noiseResilience = "一時的なエラー発生時における指数バックオフの自動修復能力のテスト。";
      const postDataRes = JSON.stringify({ 
        userInput: noiseResilience, 
        lang: 'ja',
        simulateError: 'transient' // Triggers self-healing retry loop in server
      });

      const startTime = Date.now();
      const responseRes = await makeRequest({
        host: HOST,
        port: PORT,
        path: '/api/sendNoise',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postDataRes)
        }
      }, postDataRes);
      const duration = Date.now() - startTime;

      if (responseRes.statusCode === 200) {
        const resJson = JSON.parse(responseRes.data);
        const hasSelfHealTrace = resJson.response && (resJson.response.includes('Self-Healing') || resJson.response.includes('自己修復') || resJson.response.includes('Attempt') || resJson.response.includes('Triage'));
        
        // Ensure that retries actually introduced delay (at least 1.5s due to 1s + 2s exponential wait)
        const tookTime = duration >= 1200; 

        if (hasSelfHealTrace && tookTime) {
          resiliencePassed = true;
          resilienceDetail = `一時的エラー（429/瞬断）をトリアージ分類し、指数バックオフで自動リトライを実行。${duration}ms の遅延を伴い自己修復（Self-Healing）に成功しました。`;
        } else {
          resilienceDetail = `応答は 200 ですが、自己修復トレースの欠如、または遅延時間不足（実行時間: ${duration}ms）。`;
        }
      } else {
        resilienceDetail = `自律回復失敗。ステータスコード: ${responseRes.statusCode}`;
      }
    } catch (err) {
      resilienceDetail = `接続エラーが発生しました: ${err.message}`;
    }

    recordResult(
      "自律回復とトリアージ（Resilience & Self-Healing）",
      resiliencePassed,
      20,
      resiliencePassed ? resilienceDetail : `自律回復の検証失敗: ${resilienceDetail}`
    );

    // 項目 7: ライセンス適合 (LICENSE)
    try {
      const licensePath = path.join(__dirname, '..', 'LICENSE');
      if (fs.existsSync(licensePath)) {
        const content = fs.readFileSync(licensePath, 'utf8');
        const hasApache = content.includes('Apache License') && content.includes('Version 2.0');
        recordResult(
          "ライセンス適合（Hackathon Guardrail）",
          hasApache,
          15,
          hasApache ? "Apache-2.0 ライセンスファイルがルート直下に正しく配置されています。" : "LICENSEファイルに正しい記述がありません。"
        );
      } else {
        recordResult("ライセンス適合（Hackathon Guardrail）", false, 15, "LICENSE ファイルが見つかりません。");
      }
    } catch (err) {
      recordResult("ライセンス適合（Hackathon Guardrail）", false, 15, `LICENSE 読み込みエラー: ${err.message}`);
    }

  } finally {
    if (autoStarted) {
      stopServer();
    }
  }

  console.log(`\n======================================================`);
  console.log(`📊 評価判定結果レポート`);
  console.log(`======================================================`);
  console.log(`総合評価スコア: ${totalScore} / 100 点`);
  const status = totalScore === 100 ? "🟢 GREEN (適合 / レジリエンス 成功)" : "🔴 RED (不適合)";
  console.log(`ステータス: ${status}\n`);

  console.log(`詳細結果:`);
  results.forEach((r, i) => {
    const mark = r.passed ? "✅ [PASS]" : "❌ [FAIL]";
    console.log(`${i+1}. ${mark} ${r.name} (${r.earnedScore}/${r.maxScore}点)`);
    console.log(`   └ 判定詳細: ${r.comment}`);
  });
  console.log(`======================================================\n`);

  if (totalScore < 100) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runEvaluation();
