# **スキル定義：self\_organizing\_metabolism**

## **1\. 概要**

* **スキル名:** self\_organizing\_metabolism（自己組織化・代謝スキル）  
* **説明:** ユーザーから入力された非構造的なテキスト（ノイズ）から特徴量とベクトルを抽出し、MongoDB Atlasに保存。既存の記憶痕跡とVector Searchでマッチングを行い、自律的に関係性エッジ（related\_links）を相互接続させ、古い記憶を要約・圧縮（代謝）する。

## **2\. インプット（Input Parameters）**

{  
  "type": "object",  
  "properties": {  
    "content": {  
      "type": "string",  
      "description": "ユーザーから入力された思考、殴り書き、または音声書き起こしテキスト（ノイズ）"  
    },  
    "raw\_input\_type": {  
      "type": "string",  
      "enum": \["text", "voice"\],  
      "default": "text",  
      "description": "入力形式"  
    }  
  },  
  "required": \["content"\]  
}

## **3\. アウトプット（Output Schema）**

{  
  "type": "object",  
  "properties": {  
    "status": { "type": "string", "example": "metabolized" },  
    "created\_engram\_id": { "type": "string" },  
    "linked\_nodes\_count": { "type": "integer" },  
    "thought\_trace": { "type": "string", "description": "自己組織化の実行プロセスと推論の軌跡（Markdown）" }  
  }  
}

## **4\. 実行ロジック（タスク実行フロー）**

Antigravityエージェントは、本スキルが呼び出された際、以下のステップを自律的に（Pythonコード実行とMCP呼び出しを組み合わせて）完遂しなければならない。

### **Step 1: 構造化とメタデータ抽出 (code\_execution)**

入力された content を解析するPythonコードを実行し、以下の要素を抽出する。

* scope: GLOBAL（普遍的真理）, REGIONAL（技術スタック）, LOCAL（プロジェクト仕様）, PERSONAL（個人の思いつき）の4段階から判定。  
* tags: 関連キーワード配列。  
* entropy\_score: 文章の散らかり具合、曖昧さを 0.0〜1.0 で数値化。

### **Step 2: ベクトル埋め込み（Gemini Embeddings）の生成**

サンドボックス環境内の最新の Google Gen AI SDK (`google-genai`) を用い、最新の Gemini Embedding 2 API (モデル指定子: `gemini-embedding-2-preview`) を呼び出して、content の多次元ベクトル (デフォルト 3,072次元、または次元削減した値) を生成する。

Pythonコード実行例:
```python
from google import genai
client = genai.Client()
response = client.models.embed_content(
    model="gemini-embedding-2-preview",
    contents=content
)
embedding = response.embeddings[0].values
```

### **Step 3: MongoDB MCP による新規登録（合成）**

mongodb-atlas-mcp の insert\_document ツールを呼び出し、Step 1, 2 で得たデータ、及び空の related\_links を含むドキュメントを engrams コレクションに書き込む。新規ID（ObjectId）を確保する。

### **Step 4: ベクトル類似検索と関係性の紡ぎ（自己組織化）**

MongoDB MCP の aggregate ツールを叩き、$vectorSearch（またはプログラムによる近傍計算）を実行。類似度スコアが 0.75 以上の過去ドキュメント（最大3件）を抽出。

抽出したターゲットに対し：

1. なぜこれが繋がるのかの「意味のあいだ（理由）」をGeminiが推論。  
2. 新規ドキュメント、および過去ドキュメント双方の related\_links 配列に、お互いの ObjectId、類似度スコア、理由（reason\_of\_connection）を書き込む（update\_document）。

### **Step 5: 古いエントロピーの代謝（ターンオーバー）**

全ドキュメントをスキャンし、最終更新から時間が経過し、かつ entropy\_score が高い（曖昧なまま放置された）Engramを発見した場合、それらを「1つの要約ドキュメント」へと再構成・圧縮してDBをクリーンアップし、システムのエントロピーを自律的に削減する。