# **Evaluation Criteria: Day 15-18 セマンティック・メモリー・マップ可視化 (Semantic Memory Map)**

## **1. 概要**

本ドキュメントは、Evaluation Driven Development (EDD) の規約に従い、Day 15-18 セマンティック・メモリー・マップ（可視化ネットワーク）におけるシステムの成功基準を明確に言語化したものである。

---

## **2. 評価基準（Assertions & Grading）**

仕様書（`EngramAtlas Blueprint.md` / `AGENT.MD` / `implementation_plan.md`）に基づき、以下の9つの評価項目を定義する。
自動評価スクリプト（`run_eval.js`）は、これらのアサーションを自動検証し、スコアを算出する。

### **項目 1: UI 疎通と人間工学アフォーダンス（UI & Ergonomic Affordance）**
- **判定条件**: `http://localhost:3000/` に GET リクエストを送信した際、HTTP ステータスコード `200` が返り、レスポンスの HTML 内に `EngramAtlas`、`noiseInput`、人間工学的ボタンデザイン（`control-pill`、`ergonomic-btn`）が定義されており、さらに可視化ネットワーク用の Canvas 領域である `#memoryMapCanvas` が定義されていること。
- **配点**: 10点

### **項目 2: API 疎通と整合性（API Integrity）**
- **判定条件**: `/api/sendNoise` に対し、`userInput` を含む POST リクエストを送信した際、ステータス `200` で JSON レスポンスが返り、かつ `db_id` と `response` フィールドが含まれていること。
- **配点**: 10点

### **項目 3: データ永続化と推敲・更新（CRUD & Refine）**
- **判定条件**: 
  1. `/api/sendNoise` の実行後、MongoDB（またはモックDB）にドキュメントが新規挿入され、一意なドキュメントID (`db_id`) が返却されること。
  2. `/api/updateEngram` に対し、既存の `db_id` と更新された `userInput` などを POST された際、正常にデータが更新され、進化履歴（`evolution_history`）に `refine` アクションが追記されること。
- **配点**: 10点

### **項目 4: エージェント思考プロセス（Gemini Integration）**
- **判定条件**: レスポンスに含まれる `response`（思考の軌跡）テキストが空でなく、かつ Markdown 形式の構造を持っていること。
- **配点**: 10点

### **項目 5: 自己組織化と双方向リンク構築（Self-Organization & Metabolism）**
- **判定条件**: 
  1. 類似する2つの思考ノイズを連続で送信した際、2つ目の Engram ドキュメントの `related_links` 配列に、1つ目のドキュメントID、類似度スコア、接続理由（`reason_of_connection`）が自動で結線されていること。
  2. 1つ目の Engram ドキュメント側も自動更新され、その `related_links` に2つ目のドキュメントIDが登録されていること（双方向リンクの確立）。
- **配点**: 15点

### **項目 6: データの忘却と参照整合性（Forget & Semantic Integrity）**
- **判定条件**:
  1. `/api/forgetEngram` に対し、特定の `db_id` を指定した削除リクエストを送信した際、そのドキュメントがデータベースから完全に削除されること。
  2. 削除されたノードと繋がっていたもう一方の過去ノードの `related_links` から、削除されたノードへの無効な参照リンク情報が完全にちぎり取られて（`$pull`）消滅していること。
- **配点**: 15点

### **項目 7: マップデータ整合性（Map Data Integrity）**
- **判定条件**:
  1. `/api/getAllEngrams` に対し GET リクエストを送信した際、ステータス `200` で JSON 配列が返却されること。
  2. 返却された各オブジェクトが、マッピングに必要なスキーマ項目（`_id`、`content`、`metadata`、`related_links`）を正しく保持しており、データ構造に欠落がないこと。
- **配点**: 10点

### **項目 8: 自律回復とトリアージ（Resilience & Self-Healing）**
- **判定条件**:
  1. `/api/sendNoise` に対し、一時的エラーパラメータ `simulateError: "transient"` を付与してリクエストを送信した際、サーバーがエラーを検知し、即座にトリアージを行い、**指数バックオフ付き自動リトライ（Exponential Backoff）**を実行すること。
  2. 自動で自己修復（Self-Healing）され、HTTP ステータス `200` で正常なレスポンスが返ってくること。
- **配点**: 10点

### **項目 9: ライセンス適合（Hackathon Guardrail）**
- **判定条件**: プロジェクトルート直下に `LICENSE` ファイルが存在し、ファイル内に `Apache License` および `Version 2.0` の記述が含まれていること。
- **配点**: 10点

---

## **3. 総合評価スコア定義**

- **100点**: 完全適合（Green）。すべての要件を完璧に満たし、記憶の小宇宙ネットワーク（Canvasマップ）がバックエンドの全量ロード API と有機的に同期している状態。
- **80点以上**: 主要機能動作（要改善）。
- **80点未満**: 不適合（Fail / Red）。マッピング用 API のデータ構造不整合、または Canvas の不足、あるいは参照整合性の崩れや自律回復の失敗がある状態。
