## 2024-06-02 - Fixed N+1 Query in Express Backend
**Learning:** Found an N+1 query issue inside a `for` loop waiting on `findOne` commands for DB resolutions on related nodes. Also, when modifying documents using `$pull` for IDs, ensure the ID format (ObjectId vs String) precisely matches the target array's schema; mismatched formats can cause `$pull` statements to fail silently.
**Action:** Use batch `$in` operations across arrays to drastically reduce DB roundtrips. When performing `$pull` operations, actively check if `toString()` needs to be called on an `ObjectId` reference to match the string schemas used in the array payload.

## 2024-06-03 - Optimized In-Memory Vector Search Fetching
**Learning:** Found that the MongoDB `find()` queries inside the similarity scanning loop in `server.js` were fetching entire documents (including potentially large `metadata`, `evolution_history`, and unused fields) just to perform a cosine similarity match against `vector_embeddings` and `content`.
**Action:** Use query projection (`{ projection: { _id: 1, vector_embeddings: 1, content: 1 } }`) to drastically reduce data transfer and memory overhead during full memory scans.

## 2026-06-04 - Global MongoDB Connection Pooling
**Learning:** Initializing `MongoClient` per-request via `new MongoClient(mongoUri)` and immediately awaiting `.connect()` is highly inefficient, establishing new TCP connections repeatedly and blocking the event loop.
**Action:** Implemented a global connection pool using `let globalMongoClient = new MongoClient(mongoUri)`. Furthermore, assigning `db = globalMongoClient.db('...')` synchronously without explicitly awaiting `.connect()` leverages the Node.js MongoDB driver's internal queueing and buffering system, ensuring safe query execution while offloading the connection latency from the critical path of individual requests. Also ensured we do not close the `dbClient` using `dbClient.close()` after each connection ends, so that the connections persist and the driver's connection pool remains intact across the application lifecycle.

## 2024-06-05 - Graph Edge Creation Optimization
**Learning:** Found N+1 sequential DB reads/writes occurring inside `for...of` loops during graph edge creation in both `/api/sendNoise` and `/api/updateEngram` routes. Additionally, external AI calls (`generateReasonOfConnection`) within these loops were executing sequentially. This causes latency to scale linearly `N * (API Latency + 2 * DB Latency)`.
**Action:** Utilized `Promise.all` combined with `.map` to batch and parallelize the external AI API reasoning calls, and packed the resulting MongoDB operations into a unified array passed to `collection.bulkWrite()`. This compresses up to 10 serial DB updates into a single roundtrip and executes the external API generation in parallel.
