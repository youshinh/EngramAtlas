# EngramAtlas
計算生命体進化エンジン 〜 自己組織化する「あいだ」の動的平衡メモリ 〜

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Google Cloud](https://img.shields.io/badge/Google%20Cloud-Hackathon%202026-4285F4?logo=google-cloud&logoColor=white)](https://cloud.google.com)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB%20Atlas-MCP%20Integrated-00ED64?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Gemini](https://img.shields.io/badge/Gemini-2.5%20Flash-8E75B2?logo=google&logoColor=white)](https://ai.google.dev)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)

> **Google Cloud Rapid Agent Hackathon 2026 — MongoDB Track 提出作品**

---

## Demo

| | |
|---|---|
| **Demo Video** | *(coming soon — 3-min walkthrough)* |
| **Devpost** | *(coming soon)* |

---

## 1. 思想と第一原理（Philosophy & First Principles）

従来のAIノートやRAG（Retrieval-Augmented Generation）システムは、人間が構造化したデータを「書庫」として静的に保存するだけのものでした。これは情報の死後硬直であり、エントロピーの増大に抗えず、いずれ陳腐化して役に立たなくなる「静的地獄」です。

**EngramAtlas** は、人間から吐き出される曖昧な「思考のノイズ（未分化の殴り書き、スケッチ、音声、Webリンクの断片）」を細胞膜（界面＝インターフェース）として受け止め、それらの「あいだ（関係性）」を自律的に推論し、ドキュメントデータベースの海（MongoDB Atlas）の中で動的なリンクを結びつけながら、自己組織化（代謝）していく計算生命体です。

- **物体ではなく「関係性の規約」**: 具体的なデータそのものではなく、それらがどう結びついているか（Edge）をデータベース内の動的JSONでプロットします。
- **「逆限定」の寄り添い**: 過去に作られた記憶（Engram）が明日の思考を逆限定し、新しいアイデアの創発を促します。
- **不規則な凹凸（ノイズ）の受容**: 微細な凹凸による流体抵抗削減（DMR）の哲学に基づき、あえてデータ内のゆらぎや一時的エラーを許容し、強固なルールで縛らない「やわらかな記憶」を構築します。

---

## 2. システムアーキテクチャ（System Architecture）

EngramAtlas は、Google Cloud が提供する最新の **Managed Agents API (Antigravity-preview)** と **MongoDB Atlas MCP サーバー** を統合し、フロントエンドに Google Apps Script (GAS) または極限の和モダンWeb界面を配した超軽量サーバーレス構成を採用しています。

```
[ 人間：殴り書き、カメラ写真、Webリンクの断片 ]
                │
                ▼ (Web界面 / GAS Web App)
[ 界面：極限の和モダン・ミニマル Serifs UI ]
                │
                ▼ (API呼び出し: /api/sendNoise)
[ 脳・推論：Managed Agents (Antigravity-preview) ] ────┐ (自律計画とPython実行)
                │                                       │
                ├───────────────────────────────────────┤
                ▼ (MongoDB MCP Server)                  ▼ (Code Execution)
[ 記憶：MongoDB Atlas (engrams コレクション) ]    [ サンドボックス内 Python ]
 (3,072次元ベクトル search & 自己組織化双方向リンク)     (セマンティクス翻訳・代謝)
```

---

## 3. 技術的独自性（Technical Edge）

### 3.1 Managed Agents & MongoDB MCP の自律結合（Move Beyond Chat）
単なる1回きりのQ&Aチャットボットを完全に超越しています。人間から入力が届くたびに、Managed Agentが「計画（Planning）➔ 実行（Managed Action）」を自律展開。MongoDB Atlas MCPを自律操作して、過去の記憶との類似性検索、新規ドキュメントの挿入（C）、および過去と新規ドキュメントの `related_links`（双方向の参照リンク）の書き換え（U）をマルチステップで実行し、データベース自体を代謝させます。

### 3.2 マルチモーダル代謝（画像・PDF・Webリンクの自律翻訳）
画像やファイルを直接ベクトル化して検索する手法では、画像とテキスト間の深いレベルでの「意味的共鳴」は得られません。
EngramAtlas は、添付されたカメラ写真やPDFを一度 **Gemini のマルチモーダル（Vision）理解力**に引き渡し、「画像に潜むアイデア、物理的な不均質特性（木目や反り）、未完のデザイン意図」を日本語または英語で1〜2段落の「思考ノイズ（構造化テキスト）」へと自律言語化（翻訳）します。
Webリンク（URL）についても、サーバーサイドでクリーンにフェッチした情報を要約代謝。
これらを元の殴り書きとマージした上で、最新の `gemini-embedding-2-preview` により **3,072次元のベクトル** へと射影。これにより、画像とテキストの意味的な結びつきを共通のベクトル空間で完璧に交差共鳴させます。

### 3.3 自律回復とトリアージ（Resilience & Self-Healing）
一時的なネットワークの瞬断やAPIのレート制限（429エラー）を検知した際、システムはエラーを即座に `TRANSIENT` として自律的にトリアージ分類します。
その後、段階的な **指数バックオフ付き自動リトライ（Exponential Backoff）** を起動し、実機通信の遅延を耐え抜いて自己修復（Self-Healing）を遂行。データ永続化とセマンティックマッピングの「動的平衡」を自律的に維持する、最高強度の信頼性を備えています。

### 3.4 静寂と呼吸の和モダンUI
絵文字を一切排除し、日本語「Noto Serif JP」と英語「Playfair Display」をブレンドした美しいセリフ体、極細の淡い境界線だけで構成されたプレミアム・ミニマリズムデザイン。右上の言語トグルにより、UIテキストだけでなくエージェントの推論プロンプト言語も動的に瞬時切り替え可能です。

---

## 4. クイックスタート（Quick Start）

### 4.1 環境変数の設定
プロジェクトのルートディレクトリに `.env` ファイルを作成し、以下を記述します。

```env
PORT=3000
GEMINI_API_KEY=your_gemini_api_key_here
MONGODB_URI=your_mongodb_atlas_connection_string_here
GEMINI_MODEL=gemini-2.5-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-2-preview
```

### 4.2 起動手順
Node.js (v18以降) がインストールされていることを確認し、以下を実行します。

```bash
# 依存関係のインストール
npm install

# ローカル開発サーバーの起動
npm start
```
起動後、ブラウザで [http://localhost:3000/](http://localhost:3000/) にアクセスしてください。

### 4.3 自動評価テスト (EDD: 評価駆動開発)
評価駆動開発（Evaluation Driven Development）の規約に従い、実機通信（Gemini & MongoDB Atlas）を叩いてアサーションを行う自動評価テストを同梱しています。以下のコマンドで実行し、GREEN（100点満点）になることを検証できます。

```bash
npm run eval
```

---

## 5. オープンソースライセンス
本プロジェクトは、Google Cloud ハッカソンのガードレールに完全適合した **Apache License, Version 2.0** のもとで公開されています。ライセンスの全文および規約は、ルート直下の `LICENSE` ファイルを参照してください。
