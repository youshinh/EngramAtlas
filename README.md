# EngramAtlas

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Google Cloud](https://img.shields.io/badge/Google%20Cloud-Hackathon%202026-4285F4?logo=google-cloud&logoColor=white)](https://cloud.google.com)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB%20Atlas-MCP%20Integrated-00ED64?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Gemini](https://img.shields.io/badge/Gemini-3.5%20Flash-8E75B2?logo=google&logoColor=white)](https://ai.google.dev)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)

> **Google Cloud Rapid Hackathon 2026 — MongoDB Track**
> 計算生命体進化エンジン 〜 自己組織化する「あいだ」の動的平衡メモリ 〜

---

## Demo

| Source / Resource | Link |
|---|---|
| **Demo Video** | *(coming soon)* |
| **Devpost Submission** | *(coming soon)* |

---

## Overview

EngramAtlas は、音声、画像、PDF、参考Webリンク、および殴り書きテキストといった、人間から吐き出される曖昧な「思考のノイズ」を細胞膜（境界面＝インターフェース）として受け止め、それらの「あいだ（関係性）」を自律的に推論し、MongoDB Atlas 内で動的リンクを結びつけながら自己組織化（代謝）していく、計算生命体型ナレッジエンジンです。

静的なフォルダ構造への分類ではなく、すべての入力を動的な関係性ネットワークのノードとして扱い、Gemini 3.5 Flash を通じたコグニティブ理解と、3,072次元のベクトル類似度検索を用いて、自律的に交差共鳴する双方向リンクを紡ぎ出します。

---

## Architecture

```
[ User Input: text / image / PDF / URL / audio ]
                 │
                 ▼  POST /api/sendNoise
 [ Node.js + Express (server.js) ] 
                 │
         ┌───────┴────────┐
         ▼                ▼
  [ Gemini API ]    [ MongoDB Atlas ]
    - Text Generation   - engrams collection
    - Embeddings        - Vector similarity search
    - Multimodal Vision - Bidirectional related_links
    - Audio Transcription - Evolution history log
```

**Key design decisions:**
- **エージェントの自律計画と実行**: 外部の重量級オーケストレーションフレームワークを排除し、Node.js 上で Managed Agent 相当の自律的な思考・結線ループを構成。
- **MongoDB Atlas MCP 統合**: MongoDB を単なるドキュメントストアとしてだけでなく、セマンティック・グラフ・データベースの動的バックボーンとして活用。
- **動的平衡とフォールバック**: MongoDB Atlas が未設定の場合は、メモリ内のインメモリ・擬似データストアにシームレスにフォールバックし、ローカルやCI環境でも依存なしで即座に動作。

---

## Features

### 🎙️ マルチモーダル・コンテキスト自律代謝 (Multimodal Ingestion)
テキストだけでなく、手書きスケッチ（画像）、ドキュメント（PDF）、Webリンク (URL)、およびマイク等による音声入力 (Audio) をサポート。
- **画像・PDF**: Gemini のマルチモーダルビジョン理解により、描かれている物理的特性（木目の反りや不規則な凹凸などの DMR 哲学）や文脈を自律翻訳・言語化。
- **Webリンク**: SSRF 保護と Redirect 追跡、認証ページの自動回避を施したセーフクローラを介して要約。
- **音声**: Gemini Audio による文字起こしと言語化。
すべての入力は、一度「純粋な思考テキスト」へと自律翻訳され、共通の 3,072次元ベクトル空間へと射影されます。

### 🧬 セマンティック自己組織化 (Semantic Self-Organization)
新規ノイズが投入されると、`gemini-embedding-2-preview` を介してベクトルを生成。MongoDB 内の既存ノードとコサイン類似度（閾値: `0.55`）を測定。
類似する過去の記憶と結びつき、双方向の `related_links` を自動構築。さらに、Gemini が「なぜこの2つの思考が繋がるのか」の文脈的共鳴理由 (`reason_of_connection`) を知的に推論してログに記録します。

### 📊 記憶共鳴空間の動的 3D 可視化 (Semantic Memory Map)
HTML5 Canvas (`#memoryMapCanvas`) 上に、力学モデル（Force-Directed Engine）に基づく美しい 3D ネットワークマップを描画。
- **3D カメラコントロール**: マウスドラッグによる回転（Yaw/Pitch）、パン、ホイールによるズーム。
- **人間工学的インタラクション**: ノードのドラッグ操作、ダブルクリックによる推敲フォームの自動呼び出し。
- **セマンティック検索**: 入力キーワードをリアルタイムにベクトル化し、関連度の高いノードを強烈に引き寄せて可視化。

### 🧹 対話による自律忘却 (Autonomous Forget & Semantic Integrity)
入力テキストに忘却の意図（例: 「forget」, 「delete」, 「忘却」）を検知すると、エージェントは自律忘却フローを開始。最もセマンティックに類似するターゲットノードを特定・削除するとともに、相手側ノードの `related_links` からも無効な参照を完全にちぎり取って（`$pull`）消滅させ、参照整合性を維持します。

### 🛡️ 指数バックオフ付き自律回復トリアージ (Resilience & Self-Healing)
ネットワークの瞬断や API レートリミット（429エラー）を検知すると、エラーを `TRANSIENT`（一時的）か `FATAL`（致命的）か自律的にトリアージ分類。一時的エラーの場合は、最大3回（初期 500ms、以降倍増）の **指数バックオフ付き自動リトライ (Exponential Backoff)** を実行し、自己修復（Self-Healing Trace）のログを出力して処理を成功させます。

---

## Document Schema

`engrams` コレクションの柔軟な JSON スキーマ設計：

```json
{
  "_id": "ObjectId",
  "content": "The merged and translated text representation of the input",
  "raw_input_type": "text | image | pdf | audio | url | mixed",
  "created_at": "ISODate",
  "metadata": {
    "scope": "PERSONAL",
    "tags": ["architecture", "wood-physics", "DMR"],
    "entropy_score": 0.5,
    "attachment": { "name": "sketch.png", "mimeType": "image/png" },
    "linkUrl": "https://..."
  },
  "vector_embeddings": [0.012, -0.045, "...(3072 values)"],
  "related_links": [
    {
      "to_engram_id": "ObjectId",
      "strength": 0.82,
      "reason_of_connection": "AI-generated explanation of context"
    }
  ],
  "evolution_history": [
    {
      "timestamp": "ISODate",
      "action": "create | self_organize_link | self_heal_success | refine",
      "comment": "..."
    }
  ]
}
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Serves the responsive web UI |
| `POST` | `/api/sendNoise` | Ingest a new thought, trigger self-organization / forget |
| `POST` | `/api/updateEngram` | Refine/update an existing engram, recalculating edges |
| `POST` | `/api/forgetEngram` | Manually delete an engram and cleanup other nodes' links |
| `GET` | `/api/getAllEngrams` | Retrieve all engrams (optimized with vector removal for map performance) |
| `GET` | `/api/getEngram` | Retrieve single engram with resolved related titles (N+1 query optimized) |
| `GET` | `/api/search` | Perform Gemini-powered semantic vector search across engrams |
| `DELETE` | `/api/resetDatabase` | Clear all engrams from MongoDB or mock memory |

## Troubleshooting & DB Migration (ベクトルのマイグレーション)

以前に `GEMINI_API_KEY` を設定せずに（Mockモードで）追加したデータが MongoDB Atlas に存在する場合、それらのベクトルは `Mock Embedding`（文字コードベースの疑似ランダムベクトル）で保存されています。
この状態で `GEMINI_API_KEY` を設定して起動すると、検索クエリには「本物の Gemini Embedding ベクトル」が生成されるため、ベクトルの種類（空間）の不一致が原因で「意味検索がヒットしない」または「新しく本物で登録された一部のノードにしかヒットしない」という現象が発生します。

これを解消するための診断・修復用のユーティリティスクリプトが `scratch` ディレクトリに用意されています。

*   **`scratch/check_db.js`**: データベース内のドキュメント数やベクトルの次元数・格納状態をチェックします。
*   **`scratch/verify_mock_db.js`**: 保存されているベクトルが Mock ベクトルであるかを自動検証します。
*   **`scratch/migrate_embeddings.js`**: データベース内のすべての既存 Mock ベクトルを、現在の API キーを用いて本物の Gemini Embedding（`gemini-embedding-2-preview`）に一括再生成して更新するマイグレーションスクリプトです。

**移行コマンドの実行:**
```bash
node scratch/migrate_embeddings.js
```

---

## Quick Start

### 1. Configure environment variables

`.env.example` を `.env` にコピーし、APIキー等の環境変数を入力します。

```env
PORT=3000
GEMINI_API_KEY=your_gemini_api_key_here
MONGODB_URI=your_mongodb_atlas_connection_string_here
GEMINI_MODEL=gemini-2.5-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-2-preview
```

*※ MongoDB URI が空欄の場合、インメモリ擬似ストアが自動で有効化されるため、環境変数なしでも即座に起動できます。*

### 2. Install and run

Node.js v18 以上が必要です。

```bash
npm install
npm start
```

サーバーは [http://localhost:3000](http://localhost:3000) で稼働します。

### 3. Run the evaluation suite (EDD)

本プロジェクトは **Evaluation Driven Development (EDD: 評価駆動開発)** を採用しています。ハッカソンの提出ガードレールおよびシステム仕様に基づき、全9項目のアサーション評価を自動実行します。

```bash
npm run eval
```

スコアが `100/100` 点（GREEN）であれば、すべての自律結線、トリアージ、および参照整合性の仕様を満たしています。

---

## License

Apache License, Version 2.0. 詳細は [LICENSE](./LICENSE) を参照してください。
