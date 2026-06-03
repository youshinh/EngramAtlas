## 2024-06-02 - Fixed N+1 Query in Express Backend
**Learning:** Found an N+1 query issue inside a `for` loop waiting on `findOne` commands for DB resolutions on related nodes. Also, when modifying documents using `$pull` for IDs, ensure the ID format (ObjectId vs String) precisely matches the target array's schema; mismatched formats can cause `$pull` statements to fail silently.
**Action:** Use batch `$in` operations across arrays to drastically reduce DB roundtrips. When performing `$pull` operations, actively check if `toString()` needs to be called on an `ObjectId` reference to match the string schemas used in the array payload.

## 2024-06-03 - Optimized In-Memory Vector Search Fetching
**Learning:** Found that the MongoDB `find()` queries inside the similarity scanning loop in `server.js` were fetching entire documents (including potentially large `metadata`, `evolution_history`, and unused fields) just to perform a cosine similarity match against `vector_embeddings` and `content`.
**Action:** Use query projection (`{ projection: { _id: 1, vector_embeddings: 1, content: 1 } }`) to drastically reduce data transfer and memory overhead during full memory scans.
