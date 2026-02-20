# CLAUDE.md

## 0. Overview

This project is a WebRTC signaling server.

The signaling server is responsible only for:
- SDP offer/answer exchange
- ICE candidate relay
- Room management
- Peer connection coordination

It MUST NOT handle:
- Media routing
- RTP forwarding
- SFU logic
- Media processing

Media flow is handled directly between peers or through an SFU server.


---

## 1. TypeScript Migration Rules (MANDATORY)

All new code MUST be written in TypeScript.

### 1.1 Strict Mode

TypeScript configuration MUST enable:

- "strict": true
- "noImplicitAny": true
- "strictNullChecks": true
- "noUnusedLocals": true
- "noUnusedParameters": true

Never use:
- any
- @ts-ignore
- @ts-nocheck

If a type is unknown, define an explicit interface or type.


### 1.2 Type Safety Rules

- All WebSocket message payloads MUST have defined interfaces.
- No untyped JSON parsing.
- Every signaling message MUST use a discriminated union pattern.

Example:

```ts
type SignalMessage =
  | { type: "join"; roomId: string; userId: string }
  | { type: "offer"; sdp: string; target: string }
  | { type: "answer"; sdp: string; target: string }
  | { type: "ice-candidate"; candidate: RTCIceCandidateInit; target: string }
  | { type: "leave"; userId: string };
```

All incoming messages must be validated before processing.


### 1.3 Project Structure

Do NOT keep logic in a single file.

Required structure:

- src/
  - server.ts
  - signaling/
  - types/
  - utils/
  - rooms/
  - handlers/
- tests/

Separation of concerns is mandatory.


---

## 2. WebRTC Signaling Server Requirements

### 2.1 Stateless Media Handling

This server MUST NOT:
- Store SDP long term
- Modify SDP
- Inspect media codecs
- Handle RTP packets

It only relays signaling data.


### 2.2 Room Management Rules

- Each room must track connected peers.
- On peer disconnect, cleanup must occur immediately.
- No memory leaks allowed.
- Dead sockets must be removed.

Room lifecycle must be deterministic.


### 2.3 Message Validation

Every signaling message must:

- Be validated structurally
- Reject malformed payloads
- Reject unknown message types
- Prevent JSON injection attacks

Never trust client input.


### 2.4 Concurrency Safety

- Multiple peers may join simultaneously.
- Race conditions must be handled.
- Room join/leave must be atomic.
- Use proper Map/Set usage.

Avoid shared mutable state without control.


### 2.5 Security Considerations

- Validate room IDs.
- Prevent room enumeration if authentication is added.
- Do not expose internal IDs.
- Rate limit signaling messages (anti-spam).


---

## 3. Logging Rules

- No console.log in production.
- Use structured logging.
- Log:
  - room joins
  - room leaves
  - disconnects
  - message type errors


---

## 4. Testing Rules (MANDATORY)

Every new logic MUST include tests.

No new feature without test coverage.

### 4.1 Required Test Types

- Unit tests for:
  - message validation
  - room management
  - peer lifecycle

- Integration tests for:
  - multiple peer join
  - offer/answer relay
  - disconnect cleanup


### 4.2 WebSocket Test Strategy

Use:
- ws client simulation
- supertest (if HTTP involved)
- mocked WebSocket instances

Test cases must include:

- malformed JSON
- unknown message type
- duplicate joins
- abrupt socket close


### 4.3 Coverage Requirement

Minimum:
- 80% statement coverage
- All critical flows covered


---

## 5. Code Quality Rules

- No business logic inside WebSocket event callback.
- Use handler functions.
- Keep functions small and deterministic.
- Avoid deeply nested conditionals.
- Prefer early returns.
- All async logic must use async/await (no raw Promise chains).


---

## 6. Performance Considerations

Signaling server should:

- Be lightweight
- Not block event loop
- Avoid heavy synchronous operations
- Avoid unnecessary JSON serialization

This server must remain CPU-light.


---

## 7. Error Handling Rules

- Never silently fail.
- Always send structured error responses to client.
- Define:

```ts
type ErrorMessage = {
  type: "error";
  code: string;
  message: string;
};
```

- Do not expose internal stack traces.


---

## 8. What CLAUDE Must Do

When modifying code, Claude must:

1. Maintain strict TypeScript compliance.
2. Not introduce any `any`.
3. Add or update tests for every new logic.
4. Preserve room lifecycle correctness.
5. Avoid changing signaling protocol unless explicitly requested.
6. Refactor if single file becomes too large.
7. Ensure no memory leaks.
8. Keep signaling logic separate from transport logic.



## 9. Repository Safety Rule

Claude MUST NOT perform git commits, pushes, rebases, or any repository-modifying VCS operations autonomously.

Specifically:

- Do NOT run `git commit`
- Do NOT run `git push`
- Do NOT run `git rebase`
- Do NOT run `git reset`
- Do NOT create branches
- Do NOT modify git history in any way

Claude may suggest commit messages or version control strategies,  
but must never execute repository write operations.

All commit actions must be explicitly performed by a human developer.


Always review this CLAUDE.md before making changes.
