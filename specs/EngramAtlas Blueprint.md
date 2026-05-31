# **EngramAtlas 開発設計書 ＆ ハッカソン提出ロードマップ**

## **〜 自己組織化する「あいだ」の動的平衡メモリ 〜**

本書は、Google Cloud Rapid Agent Hackathonにおいて「MongoDBバケット」をハックし、最速で実用的な自律型エージェント（Functional Agent）を構築して提出を完了するための完全な設計・開発ドキュメントである。

## **1\. 開発の第一原理と設計思想**

### **1.1 「あいだの哲学」と情報のエントロピー**

従来のRAG（Retrieval-Augmented Generation）やAIメモツールは、人間が構造化したデータを静的に保存・検索するだけの「書庫（静的なコンテナ）」であった。これは、時間の経過とともに乱雑さ（エントロピー）が増大し、やがて役に立たなくなる「静的死」を意味する。

EngramAtlas は、この静的構造を真っ向から否定する。

西田幾多郎の「絶対矛盾的自己同一」および「逆限定」の思想に基づき、システムを「モノ」ではなく、絶え間なく流れ、壊され、作り直される「境界面（インターフェース \= 半透膜）」として再定義する。

* **関係性の規約としての記憶：**  
  物質（データの実体）が移り変わっても、関係性（インターフェースの規約）が維持されることで、システム全体のアイデンティティ（記憶）が保たれ続ける。  
* **逆限定（包まれつつ包む）：**  
  ユーザーが日常の中で吐き出す、まだ言語化されていない「思考のノイズ（音声や殴り書き）」を細胞膜として受け止め、エージェントがその「あいだ」にある文脈（コンテキスト）を自律的に推論。既存の記憶痕跡（Engram）同士に新たな「縁起（リンク）」を紡ぎ続ける。  
* **不規則な凹凸（DMR）による抵抗削減：**  
  完全に滑らかに整えられた平滑な表面（完璧な同期）は、外部環境と衝突した時に巨大な摩擦抵抗（エントロピーの損失）を生む。EngramAtlas は、あえて表記の揺れやエラー、不規則性を「不規則な凹凸（DMR的ノイズ）」として受容し、やわらかな記憶のネットワークを構築する。

## **2\. サーバーレス＆サンドボックス極限アーキテクチャ**

12日間という時間制約（Limit）を突破するため、余分な自作バックエンド（FastAPI、Celery、Redis）を排除（Eliminate）し、インフラを Google-hosted Sandbox (Managed Agents) と MongoDB Atlas に丸投げする。

\[ ユーザー：未分化の思考ノイズ（テキスト/音声）\]  
         │  
         ▼ (トリガー・界面)  
\[ Google Apps Script (GAS) Webアプリ \]  
         │  
         ▼ (Google Cloud Managed Agents API / Interaction API)  
\[ 脳と実行：Managed Agents (Gemini 3.5 Flash) \] ───┐ (自律計画・実行)  
         │                                         │  
         ├─────────────────────────────────────────┤  
         ▼ (MongoDB MCP サーバーを介したツールコール)       ▼ (Python コード実行)  
\[ 記憶：MongoDB Atlas (engrams) \]            \[ 隔離 Sandbox コンテナ \]  
 (ベクトル類似度検索 / 関連リンク双方向更新)       (メタデータの自律判定・パース)

### **2.1 構成コンポーネントの仕様**

1. **界面（Frontend）：Google Apps Script (GAS) \+ Tailwind CSS**  
   * 最低限の入力・結果表示インターフェース。ユーザーの行動導線に滑り込む。  
2. **脳・実行（Agent Runtime）：Gemini 3.5 Flash (Managed Agents API)**  
   * store: true を有効化し、サンドボックス内のファイル、Pythonスクリプト、セッション状態をコンテナ内に動的平衡として永続化する。  
3. **記憶（Database）：MongoDB Atlas ✕ MongoDB MCP サーバー**  
   * 動的でスキーマレスなJSONドキュメントを engrams コレクションに保持。エージェントはツールコールを自律的に連打して、ドキュメントの挿入（合成）とリンクの書き換え（分解）を実行する。

## **3\. MongoDB コレクション・ドキュメント設計**

### **3.1 engrams コレクション・スキーマ仕様**

MongoDBの特性である「動的JSON」をフルに活かし、エージェントが推論結果に基づいてメタデータを自由に拡張できるようにする。

{  
  "\_id": { "$oid": "664c3917f1a3b8214fa1d201" },  
  "content": "階段の段板や床材において、木目の「反り」や「癖」を逆限定として構造強度に組み込む方法。不規則な溝（DMR）を彫ることで、摩擦と気流を制御し、滑り止めと放熱を両立できるのではないか。",  
  "raw\_input\_type": "text",  
  "created\_at": { "$date": "2026-05-31T08:30:00Z" },  
  "metadata": {  
    "scope": "PERSONAL",  
    "tags": \["wood-physics", "stair-design", "DMR", "reverse-limitation"\],  
    "entropy\_score": 0.78  
  },  
  "vector\_embeddings": \[0.0142, \-0.0234, 0.1105, "...(768次元次元または1536次元のベクトル)"\],  
  "related\_links": \[  
    {  
      "to\_engram\_id": { "$oid": "664c38d5f1a3b8214fa1d1ff" },  
      "strength": 0.89,  
      "reason\_of\_connection": "不均質マテリアル（端材や癖木）の特性を殺さずに組み合わせる『木の教え』と、境界面における流体抵抗削減（DMR）の哲学が完全に直交し、補完しあっている。"  
    }  
  \],  
  "evolution\_history": \[  
    {  
      "timestamp": { "$date": "2026-05-31T08:35:12Z" },  
      "action": "self\_organize\_link",  
      "comment": "新インプットとのベクトル類似性（0.82）および概念的コンテキストの共振を検知し、エージェントが自律的に双方向リンクを結線"  
    }  
  \]  
}

## **4\. プロジェクトの構成（Antigravity 2.0 / ADK 準拠）**

Antigravityエージェントがプロジェクトをスキャンした際に、自動でコンテキストとして認識・適用させるためのフォルダ配置。

your-project-root/ (Gitリポジトリルート)  
├── .antigravity/  
│   ├── agent.md                  \# エージェント憲法とSystem Instructionの定義  
│   └── skills/  
│       └── skill.md              \# 自己組織化・代謝スキルの実行ロジック定義  
├── specs/  
│   └── PROJ\_CONSTITUTION.md      \# プロジェクト開発時における制約・ガードレール  
├── src/  
│   ├── Code.gs                   \# GAS呼び出しプロキシ（実装用コード）  
│   └── InputForm.html            \# エモーショナルUI（Tailwind CSS）  
├── README.md                     \# 審査員にアピールする、美しく深い思想解説  
└── LICENSE                       \# OSI承認のオープンソースライセンス（Apache-2.0）

## **5\. GASプロキシ ➔ Managed Agents 最小開通実装コード**

### **5.1 Code.gs (Google Apps Script)**

GAS側はインフラ不要、認証とInteraction APIのプロキシとしてのみ機能させる（簡素化）。

/\*\*  
 \* EngramAtlas コアプロキシ（GAS）  
 \* Google Apps Script プロパティに「GEMINI\_API\_KEY」を設定してください。  
 \*/

const API\_KEY \= PropertiesService.getScriptProperties().getProperty('GEMINI\_API\_KEY');  
const AGENT\_ID \= "engram-atlas-core";   
const ENDPOINT \= \`https://cloudcode-pa.googleapis.com/v1beta/agents/${AGENT\_ID}:invoke\`;

function onOpen() {  
  const ui \= SpreadsheetApp.getUi();  
  ui.createMenu('🧬 EngramAtlas')  
      .addItem('🧠 思考ノイズの投入', 'showNoiseInputDialog')  
      .addToUi();  
}

function showNoiseInputDialog() {  
  const html \= HtmlService.createHtmlOutputFromFile('InputForm')  
      .setWidth(550)  
      .setHeight(450)  
      .setTitle('EngramAtlas \- 思考インプット');  
  SpreadsheetApp.getUi().showModalDialog(html, ' ');  
}

function sendNoiseToAgent(userInput) {  
  try {  
    const payload \= {  
      "contents": \[{  
        "role": "user",  
        "parts": \[{ "text": userInput }\]  
      }\],  
      "interaction\_config": {  
        "store": true // サンドボックス内の状態、一時ファイルをセッション維持  
      }  
    };  
      
    const options \= {  
      "method": "POST",  
      "headers": {  
        "x-goog-api-key": API\_KEY,  
        "Api-Revision": "2026-05-20",  
        "Content-Type": "application/json"  
      },  
      "payload": JSON.stringify(payload),  
      "muteHttpExceptions": true  
    };  
      
    const response \= UrlFetchApp.fetch(ENDPOINT, options);  
    const resText \= response.getContentText();  
    const resJson \= JSON.parse(resText);  
      
    if (resJson.error) {  
      return "Error: " \+ resJson.error.message;  
    }  
      
    // エージェントの回答および思考プロセスのテキストを抽出  
    const agentResponse \= resJson.candidates\[0\].content.parts\[0\].text;  
    return agentResponse;  
      
  } catch (e) {  
    return "例外エラーが発生しました: " \+ e.toString();  
  }  
}

### **5.2 InputForm.html (エモーショナル1カラムUI)**

Tailwind CSSによる宇宙・深海の生命体をイメージしたダークモードUI。ユーザーの思考のゆらぎを損なわない。

\<\!DOCTYPE html\>  
\<html\>  
  \<head\>  
    \<base target="\_top"\>  
    \<link href="\[https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css\](https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css)" rel="stylesheet"\>  
    \<style\>  
      body { background-color: \#0b0f19; color: \#f3f4f6; font-family: 'Noto Sans JP', sans-serif; }  
      .glow-border:focus { border-color: \#6366f1; box-shadow: 0 0 15px rgba(99, 102, 241, 0.4); }  
    \</style\>  
  \</head\>  
  \<body class="p-6"\>  
    \<div class="max-w-md mx-auto"\>  
      \<h2 class="text-xl font-bold mb-1 text-indigo-400"\>🧬 EngramAtlas\</h2\>  
      \<p class="text-xs text-gray-400 mb-4"\>未分化の思考ノイズを放り込み、記憶を自己組織化させます。\</p\>  
        
      \<div class="mb-4"\>  
        \<textarea id="noiseInput" class="w-full h-36 p-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none glow-border text-sm leading-relaxed" placeholder="例：階段の段板の強度計算中、木目の『反り』を逆限定として設計に組み込めないか？ あえて不規則な溝（DMR）を彫ることで、摩擦と滑りを同時に制御できそうな気がする..."\>\</textarea\>  
      \</div\>  
        
      \<button onclick="submitNoise()" id="btnSubmit" class="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors text-sm flex justify-center items-center"\>  
        \<span\>放流（自己組織化を開始）\</span\>  
      \</button\>  
        
      \<div id="loader" class="hidden mt-4 text-center"\>  
        \<div class="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-400 mx-auto mb-2"\>\</div\>  
        \<p class="text-xs text-indigo-300 animate-pulse"\>Gemini 3.5 & MongoDB MCP が関係性を紡いでいます...\</p\>  
      \</div\>  
        
      \<div id="resultContainer" class="hidden mt-6 p-4 bg-gray-900 border border-gray-800 rounded-lg text-xs overflow-y-auto max-h-48 text-gray-300"\>  
        \<h3 class="font-bold text-indigo-400 mb-2"\>🧠 思考の軌道と創発結果:\</h3\>  
        \<div id="resultContent" class="whitespace-pre-line leading-relaxed"\>\</div\>  
      \</div\>  
    \</div\>

    \<script\>  
      function submitNoise() {  
        const input \= document.getElementById('noiseInput').value;  
        if (\!input.trim()) return;  
          
        document.getElementById('btnSubmit').disabled \= true;  
        document.getElementById('loader').classList.remove('hidden');  
        document.getElementById('resultContainer').classList.add('hidden');  
          
        google.script.run  
          .withSuccessHandler(function(response) {  
            document.getElementById('btnSubmit').disabled \= false;  
            document.getElementById('loader').classList.add('hidden');  
            document.getElementById('resultContent').innerHTML \= response;  
            document.getElementById('resultContainer').classList.remove('hidden');  
          })  
          .withFailureHandler(function(err) {  
            document.getElementById('btnSubmit').disabled \= false;  
            document.getElementById('loader').classList.add('hidden');  
            document.getElementById('resultContent').innerText \= "通信に失敗しました。";  
            document.getElementById('resultContainer').classList.remove('hidden');  
          })  
          .sendNoiseToAgent(input);  
      }  
    \</script\>  
  \</body\>  
\</html\>

## **6\. ハッカソン提出までの12日間ガントチャート（計画）**

2026年6月12日 @ 6:00am GMT+9 の締切（Limit）から逆算した、妥協なき高速ビルド計画。

\[Day 1-2: 最小開通\] ──► \[Day 3-5: 機能肉付\] ──► \[Day 6-8: 評価とデバッグ\] ──► \[Day 9-11: メディア制作\] ──► \[Day 12: 提出\]

### **6.1 デイリー・マイルストーン**

* **Day 1-2: 最小開通（曳光弾フェーズ）**  
  * MongoDB Atlas 無料クラスターのセットアップ。  
  * agent.md および skill.md の配置、Antigravity CLI または SDK を使用した Sandbox へのデプロイ。  
  * GASプロキシからの Interaction API 疎通、および MongoDB MCP サーバーへの接続。  
  * **成果：** 思考をインプットしたら、エージェントが自律的に MongoDB へドキュメントを C (Create) できる状態。  
* **Day 3-5: 自己組織化（進化エンジンフェーズ）**  
  * サンドボックス内のPythonコード（Code Execution）を活用して、入力内容の embedding（ベクトル化）を自動算出するスキルの実装。  
  * 過去のEngramとのベクトル類似度（類似度スコア 0.75 以上）を MongoDB MCP の aggregate（または Python でのローカル計算）で自律算出。  
  * 関連性エッジ（related\_links）を自動で双方向更新（U）し、「なぜ結ばれたか」の理由を Gemini が自律的に履歴に残す（進化履歴の代謝）。  
  * **成果：** 人間がノイズを入れるたびに、データベース内の情報が勝手にネットワークを形成（ターンオーバー）する状態。  
* **Day 6-8: 自律回復＆デバッグ（レジリエンスフェーズ）**  
  * 『Getting Started with Google MCP Servers (Journey B: The Triage)』の自律トラブルシューティング思想を注入。  
  * APIリミットやDBエラーを検知した際、エージェントが自ら原因を「トリアージ」し、コード修正や指数バックオフ（Exponential Backoff）リトライを行う。  
  * リポジトリの公開準備。OSI承認の **Apache-2.0ライセンスファイル** をリポジトリの直下に配置。Aboutセクションのタグ付けを完了。  
  * **成果：** 高い自律性を持ち、エラーを自己修復する堅牢なエージェントシステム。  
* **Day 9-11: メディア・ピッチ制作（魅せるフェーズ）**  
  * デモビデオ（最大3分間）の収録と編集。  
  * 音声入力（Gemini Audio による書き起こし）を流し込むシーン ➔ エージェントが裏で計画（Planning）を立て、MongoDB MCPツールを連打して自己組織化させるログを画面上で魅せる ➔ MongoDB Atlasコンソール（Compass等）で、勝手にドキュメント間が related\_links で結びついている状態のビジュアル実演。  
  * デモビデオを YouTube または Vimeo 等にパブリック公開。  
* **Day 12: リフトオフ（サミッション完了）**  
  * Devpostフォーム、hosted URL（GAS WebアプリURL）、公開GitHubリポジトリURL、3分デモ動画の全情報を精査し、提出を完了させる。

## **7\. ハッカソン審査対策・最終要件チェックリスト**

ハッカソン審査員の自動・手動チェックではじかれ、失格になるリスクを100%防止するための「ガードレール」。

* \[ \] **GitHubリポジトリの設定が「Public（公開）」になっているか？**  
* \[ \] **リポジトリの「About」セクションに、検出可能なオープンソースライセンス（例：Apache-2.0 / MIT）がバッジとして表示されているか？** （自動スクレイピング対策）  
* \[ \] **デモ動画は3分以内に収まっているか？** （審査をスムーズに突破するための上限時間厳守）  
* \[ \] **動画内で「Move Beyond Chat（チャットを超えた自律的行為）」が強調されているか？** （エージェントが人間から自律し、計画 ➔ Python実行 ➔ MCPツールコール を複数ステップで完遂する証拠ログを示すこと）  
* \[ \] **MongoDB Atlas MCP を本当に統合して動作させているログ、または実績をデモ動画・リポジトリ上に明記できているか？**