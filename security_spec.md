# Security Specification for Bhart AI

## Data Invariants
1. A user can only access their own profile.
2. A user can only read/write their own chat sessions.
3. Messages must belong to a chat session owned by the the request user.
4. Images and Studio templates are strictly private to the creator.
5. `role` field in User profile is immutable by the client (requires admin/server).

## The Dirty Dozen Payloads
Below are payloads that must be REJECTED:
1. Unauthorized profile update: `db.doc('users/other_user').set({ role: 'pro' })`
2. Message injection: `db.doc('chats/user_A_chat/messages/msg').set({ content: 'hacker', chatId: 'user_B_chat' })`
3. Mass deletion: `db.collection('chats').delete()`
... (Full suite in firestore.rules.test.ts)

## Technical Mapping
- `users/{userId}`: Schema `User`. Create/Update must match `request.auth.uid`.
- `chats/{chatId}`: Schema `Chat`. `userId` must match `request.auth.uid`.
- `chats/{chatId}/messages/{messageId}`: Parent `Chat` must be owned by `request.auth.uid`.
- `images/{imageId}`: Schema `GeneratedImage`. `userId` must match `request.auth.uid`.
- `studio/{promptId}`: Schema `PromptTemplate`. `userId` must match `request.auth.uid`.
