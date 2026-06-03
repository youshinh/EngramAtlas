const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 3000;
const HOST = '127.0.0.1';
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
    stdio: 'pipe',
    detached: false
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`[Server STDOUT] ${data.toString().trim()}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`[Server STDERR] ${data.toString().trim()}`);
  });

  await new Promise(resolve => setTimeout(resolve, 3000));
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
  console.log(`🔍 Day 15-18 自律対話代謝 ＆ 可視化マップ 評価実行中...`);
  console.log(`======================================================\n`);

  let autoStarted = false;
  try {
    autoStarted = await startServer();
  } catch (err) {
    console.error("❌ サーバーの自動起動に失敗しました:", err.message);
  }

  try {
    // 🧹 テスト開始前にデータベースをリセットしてクリーンな状態にする
    try {
      await makeRequest({
        host: HOST,
        port: PORT,
        path: '/api/resetDatabase',
        method: 'DELETE'
      });
      console.log("🧹 テスト開始前にデータベースをクリーンアップしました。");
    } catch (resetErr) {
      console.warn("⚠️ テスト開始前のデータベースクリアに失敗しました:", resetErr.message);
    }

    // 1. UI 疎通と人間工学アフォーダンス (アプローチB 含む)
    let uiPassed = false;
    let uiDetail = "";
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
      
      const hasPill = response.data.includes('control-pill');
      const hasErgoBtn = response.data.includes('ergonomic-btn');
      
      // アプローチBの極細セリフ体リンクとアンダーライン表記の存在確認
      const hasForgetLink = response.data.includes('btnForgetAction');
      const hasRefineLink = response.data.includes('btnRefineAction');
      
      // 可視化ネットワーク用の Canvas 領域の検証
      const hasMapCanvas = response.data.includes('memoryMapCanvas');

      uiPassed = response.statusCode === 200 && hasTitle && hasInput && hasLang && hasMarked && hasPill && hasErgoBtn && hasForgetLink && hasRefineLink && hasMapCanvas;
      if (uiPassed) {
        uiDetail = "UI (極細トグル、人間工学ボタン、極細セリフリンク、および 可視化Canvas memoryMapCanvas) の正常配信を確認。";
      } else {
        uiDetail = `必須要素の不足: Title=${hasTitle}, Input=${hasInput}, Canvas=${hasMapCanvas}, ForgetLink=${hasForgetLink}, RefineLink=${hasRefineLink}`;
      }
      recordResult("UI 疎通と人間工学アフォーダンス（UI & Ergonomic Affordance）", uiPassed, 10, uiDetail);
    } catch (err) {
      recordResult("UI 疎通と人間工学アフォーダンス（UI & Ergonomic Affordance）", false, 10, `サーバーに接続できません: ${err.message}`);
    }

    // 2. API 疎通 & 3. データ永続化・推敲シナリオテスト
    const noise1 = "階段の段板における木目の『反り』を構造強度に組み込む逆限定設計。DMR加工による気流と滑り止め制御。";
    const noise2 = "不均質マテリアル（癖木や端材）の長所を活かす匠の技と、境界面における流体抵抗削減（DMR）技術の共振。";

    let id1 = null;
    let id2 = null;
    let apiPassed = false;
    let creationPassed = false;
    let thoughtPassed = false;
    let selfOrgPassed = false;
    let forgetPassed = false;
    let refinePassed = false;
    let mapDataPassed = false;
    
    let res1Json = null;
    let res2Json = null;

    // 送信 1 (Create)
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
        apiPassed = !!id1;
        creationPassed = !!id1;
      }
    } catch (err) {
      console.warn("⚠️ 1回目の送信でエラーが発生しました:", err.message);
    }

    // 送信 1の推敲 (Refine / Update)
    if (creationPassed && id1) {
      try {
        const refinedNoise = "推敲された新しい思考テキスト。階段の段板における木目の『反り』の構造力学を再構築し、DMR気流摩擦制御と完全統合。";
        const updateData = JSON.stringify({
          db_id: id1,
          userInput: refinedNoise,
          lang: 'ja'
        });

        const responseUpdate = await makeRequest({
          host: HOST,
          port: PORT,
          path: '/api/updateEngram',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(updateData)
          }
        }, updateData);

        if (responseUpdate.statusCode === 200) {
          const updateJson = JSON.parse(responseUpdate.data);
          
          // ドキュメントを直接取得して検証
          const responseGet = await makeRequest({
            host: HOST,
            port: PORT,
            path: `/api/getEngram?id=${id1}`,
            method: 'GET'
          });
          
          if (responseGet.statusCode === 200) {
            const engramData = JSON.parse(responseGet.data);
            const isContentUpdated = engramData.content === refinedNoise;
            const hasRefineHistory = engramData.evolution_history && engramData.evolution_history.some(h => h.action === 'refine');
            
            refinePassed = isContentUpdated && hasRefineHistory;
          }
        }
      } catch (err) {
        console.warn("⚠️ 推敲（編集）処理でエラーが発生しました:", err.message);
      }
    }

    // 項目 2: API 疎通と整合性
    recordResult(
      "API 疎通と整合性（API Integrity）",
      apiPassed,
      10,
      apiPassed ? "POST /api/sendNoise が正常にステータス 200 で返りました。" : "APIの疎通に失敗しました。"
    );

    // 項目 3: データ永続化と推敲・更新 (CRUD & Refine)
    const crudRefineStatus = creationPassed && refinePassed;
    recordResult(
      "データ永続化と推敲・更新（CRUD & Refine）",
      crudRefineStatus,
      10,
      crudRefineStatus 
        ? `新規 engram の ID 発行を確認 (ID: "${id1}")。さらに、内容の推敲更新および進化履歴への "refine" アクションの自動刻印を確認。` 
        : `検証失敗。永続化=${creationPassed}, 推敲更新=${refinePassed}`
    );

    // 送信 2 (自己組織化の結線確認用)
    if (crudRefineStatus) {
      try {
        const postData2 = JSON.stringify({ 
          userInput: noise2, 
          lang: 'ja',
          linkUrl: 'https://example.com/philosophy/dynamic-equilibrium',
          attachment: {
            data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            mimeType: 'image/png',
            name: 'stair_tread_sketch.png'
          }
        });
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
        }
      } catch (err) {
        console.warn("⚠️ 2回目の送信でエラーが発生しました:", err.message);
      }
    }

    // 項目 4: エージェント思考プロセス（Gemini Integration）
    thoughtPassed = res2Json && res2Json.response && res2Json.response.includes('#');
    recordResult(
      "エージェント思考プロセス（Gemini Integration）",
      thoughtPassed,
      10,
      thoughtPassed ? "Gemini から Markdown 形式の高度な思考プロセスを取得しました。" : "Gemini の応答が空であるか、Markdown フォーマットではありません。"
    );

    // 項目 5: 自己組織化と双方向リンク構築（Self-Organization & Metabolism）
    let selfOrgDetail = "";
    if (res2Json && res2Json.relations && Array.isArray(res2Json.relations)) {
      const relation = res2Json.relations.find(r => r.to_engram_id === id1);
      if (relation) {
        const hasScore = relation.strength >= 0.50;
        const hasReason = relation.reason_of_connection && relation.reason_of_connection.trim() !== "";
        
        let biDirectionalPassed = false;
        try {
          const responseGet1 = await makeRequest({
            host: HOST,
            port: PORT,
            path: `/api/getEngram?id=${id1}`,
            method: 'GET'
          });
          if (responseGet1.statusCode === 200) {
            const engram1 = JSON.parse(responseGet1.data);
            biDirectionalPassed = engram1.related_links && engram1.related_links.some(link => link.to_engram_id === id2);
          }
        } catch (e) {
          console.warn("相手側ドキュメントの双方向リンク検証に失敗:", e.message);
        }

        if (hasScore && hasReason && biDirectionalPassed) {
          selfOrgPassed = true;
          selfOrgDetail = `新規 ID2 (${id2}) と過去 ID1 (${id1}) が双方向で完璧に結線され、共鳴理由が生成されました。`;
        } else {
          selfOrgDetail = `リンクはありますが、スコア不足 (${relation.strength})、接続理由が空、あるいは双方向リンク未確立 (${biDirectionalPassed}) です。`;
        }
      } else {
        selfOrgDetail = `ID2 の関連リンクに ID1 (${id1}) が存在しません。`;
      }
    } else {
      selfOrgDetail = "レスポンスに relations 配列が含まれていません。";
    }

    recordResult(
      "自己組織化と双方向リンク構築（Self-Organization & Metabolism）",
      selfOrgPassed,
      15,
      selfOrgPassed ? selfOrgDetail : `自己組織化の判定失敗: ${selfOrgDetail}`
    );

    // 7. マップデータ整合性 (Map Data Integrity)
    let mapDataDetail = "";
    if (selfOrgPassed && id1 && id2) {
      try {
        const responseAll = await makeRequest({
          host: HOST,
          port: PORT,
          path: '/api/getAllEngrams',
          method: 'GET'
        });

        if (responseAll.statusCode === 200) {
          const engramsList = JSON.parse(responseAll.data);
          const isArray = Array.isArray(engramsList);
          const hasMinimumSize = engramsList.length >= 2;
          
          const sample = engramsList.find(e => e._id === id1 || e._id.toString() === id1);
          const hasContent = sample && sample.content;
          const hasMetadata = sample && sample.metadata;
          const hasLinks = sample && Array.isArray(sample.related_links);

          if (isArray && hasMinimumSize && hasContent && hasMetadata && hasLinks) {
            mapDataPassed = true;
            mapDataDetail = `全量データ取得 API /api/getAllEngrams から ${engramsList.length} 件のエングラムを正常ロード。 Canvas 可視化用軽量スキーマを確認。`;
          } else {
            mapDataDetail = `スキーマ不整合: Array=${isArray}, Size=${engramsList.length}, content=${!!hasContent}, links=${!!hasLinks}`;
          }
        } else {
          mapDataDetail = `APIがステータス ${responseAll.statusCode} を返しました。`;
        }
      } catch (err) {
        mapDataDetail = `マップデータ整合性テスト中にエラーが発生しました: ${err.message}`;
      }
    } else {
      mapDataDetail = "自己組織化検証が失敗したため、マップデータ整合性テストをスキップしました。";
    }

    recordResult(
      "マップデータ整合性（Map Data Integrity）",
      mapDataPassed,
      10,
      mapDataPassed ? mapDataDetail : `マップデータ整合性の検証失敗: ${mapDataDetail}`
    );

    // 6. データの忘却と参照整合性（Forget & Semantic Integrity） - アプローチA（対話による自律忘却）で検証！
    let forgetDetail = "";
    if (mapDataPassed && id1 && id2) {
      try {
        console.log("🗣️ [Approach A Test] Sending autonomous forget request via dialogue...");
        
        // ユーザーが自然なチャット形式で「不均質マテリアル（ID2のテキスト）のアイデアを忘れて」と指示する
        const dialogForgetNoise = "さっき送信した『不均質マテリアル（癖木や端材）の長所を活かす匠の技と、境界面における流体抵抗削減（DMR）技術の共振。』という思考ノイズは、やっぱり間違いだったので忘却して消去してください。";
        const postDataDialog = JSON.stringify({ userInput: dialogForgetNoise, lang: 'ja' });
        
        const responseForget = await makeRequest({
          host: HOST,
          port: PORT,
          path: '/api/sendNoise', // 送信 API で自律判断させる
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postDataDialog)
          }
        }, postDataDialog);

        if (responseForget.statusCode === 200) {
          const forgetJson = JSON.parse(responseForget.data);
          
          // 意図の自律判定完了のコグニティブテキストが含まれているか検証
          const hasCognitiveResponse = forgetJson.response && (
            forgetJson.response.includes('忘却') || 
            forgetJson.response.includes('消去') || 
            forgetJson.response.includes('記憶の海') || 
            forgetJson.response.includes('Metabolism') ||
            forgetJson.response.includes('forgotten')
          );

          // ID2 が消えていることを検証
          const responseGet2 = await makeRequest({
            host: HOST,
            port: PORT,
            path: `/api/getEngram?id=${id2}`,
            method: 'GET'
          });
          
          const isDeleted = responseGet2.statusCode === 404;

          // 相手側(ID1)の related_links から ID2 への参照が完全にちぎり取られて消滅しているか検証
          let relationCleared = false;
          const responseGet1 = await makeRequest({
            host: HOST,
            port: PORT,
            path: `/api/getEngram?id=${id1}`,
            method: 'GET'
          });
          
          if (responseGet1.statusCode === 200) {
            const engram1 = JSON.parse(responseGet1.data);
            const hasLinkToId2 = engram1.related_links && engram1.related_links.some(link => link.to_engram_id === id2);
            relationCleared = !hasLinkToId2;
          }

          if (isDeleted && relationCleared && hasCognitiveResponse) {
            forgetPassed = true;
            forgetDetail = `対話による自律忘却 (FORGET 意図分類) の成功を確認。ID2 (${id2}) の自動特定・完全消去を確認。さらに ID1 (${id1}) の関連リンクからID2への参照が自律的にプル（参照整合性維持）され、エージェントからの完了報告を確認。`;
          } else {
            forgetDetail = `自律忘却ステータス: 削除済=${isDeleted}, リンク消滅=${relationCleared}, 完了報告=${!!hasCognitiveResponse}`;
          }
        } else {
          forgetDetail = `自律忘却APIがステータス ${responseForget.statusCode} を返しました。`;
        }
      } catch (err) {
        forgetDetail = `自律忘却テスト中にエラーが発生しました: ${err.message}`;
      }
    } else {
      forgetDetail = "自己組織化またはマップデータ検証が失敗したため、自律忘却テストをスキップしました。";
    }

    recordResult(
      "データの忘却と参照整合性（Forget & Semantic Integrity）",
      forgetPassed,
      15,
      forgetPassed ? forgetDetail : `忘却と参照整合性の検証失敗: ${forgetDetail}`
    );

    // 8. 自律回復とトリアージ（Resilience & Self-Healing）
    let resiliencePassed = false;
    let resilienceDetail = "";
    try {
      console.log("🔥 [Resilience Test] Sending transient error simulation request...");
      const noiseResilience = "一時的なエラー発生時における指数バックオフの自動修復能力のテスト。";
      const postDataRes = JSON.stringify({ 
        userInput: noiseResilience, 
        lang: 'ja',
        simulateError: 'transient'
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
      10,
      resiliencePassed ? resilienceDetail : `自律回復の検証失敗: ${resilienceDetail}`
    );

    // 9. ライセンス適合 (LICENSE)
    try {
      const licensePath = path.join(__dirname, '..', 'LICENSE');
      if (fs.existsSync(licensePath)) {
        const content = fs.readFileSync(licensePath, 'utf8');
        const hasApache = content.includes('Apache License') && content.includes('Version 2.0');
        recordResult(
          "ライセンス適合（Hackathon Guardrail）",
          hasApache,
          10,
          hasApache ? "Apache-2.0 ライセンスファイルがルート直下に正しく配置されています。" : "LICENSEファイルに正しい記述がありません。"
        );
      } else {
        recordResult("ライセンス適合（Hackathon Guardrail）", false, 10, "LICENSE ファイルが見つかりません。");
      }
    } catch (err) {
      recordResult("ライセンス適合（Hackathon Guardrail）", false, 10, `LICENSE 読み込みエラー: ${err.message}`);
    }

  } finally {
    // 🧹 テスト終了後にデータベースをクリーンアップして残骸を残さないようにする
    try {
      await makeRequest({
        host: HOST,
        port: PORT,
        path: '/api/resetDatabase',
        method: 'DELETE'
      });
      console.log("🧹 テスト終了後にデータベースをクリーンアップしました。");
    } catch (resetErr) {
      console.warn("⚠️ テスト終了後のデータベースクリーンアップに失敗しました:", resetErr.message);
    }

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
