# Signaling Server

Socket.IO 기반의 시그널링 서버로, 클라이언트와 SFU 서버 간의 WebRTC 협상을 중계합니다.

## 기술 스택

| 항목 | 기술 |
|------|------|
| HTTP 서버 | Express ^4.18.2 |
| WebSocket | Socket.IO ^4.7.2 |
| HTTP 클라이언트 | Axios ^1.6.0 |
| CORS | cors ^2.8.5 |

## 포트

- **3000** - Socket.IO WebSocket 서버

## 역할

- **방 관리**: 참여자 입장/퇴장 관리 (`rooms` Map)
- **SFU 프록시**: 클라이언트의 WebRTC 요청을 SFU 서버(`http://localhost:3001`)로 중계
- **피어 탐색**: 입장 시 기존 Producer 목록 조회 후 전달
- **이벤트 브로드캐스트**: 신규 참여자/퇴장 알림

## 프로젝트 구조

```
signaling-server/
├── server.js          # 메인 서버 (Socket.IO + SFU 프록시)
└── package.json
```

## Socket.IO 이벤트

### 클라이언트 → 서버

| 이벤트 | 설명 | 파라미터 |
|--------|------|----------|
| `join-room` | 방 입장 | `{ roomId }` |
| `create-web-rtc-transport` | Transport 생성 요청 | `{ direction }` |
| `connect-transport` | DTLS 연결 | `{ transportId, dtlsParameters }` |
| `produce` | 미디어 송출 | `{ transportId, kind, rtpParameters }` |
| `consume` | 미디어 수신 | `{ transportId, producerId, kind }` |
| `leave-room` | 방 퇴장 | `{ roomId }` |

### 서버 → 클라이언트

| 이벤트 | 설명 | 데이터 |
|--------|------|--------|
| `rtp-capabilities` | RTP 코덱 정보 | Router RTP Capabilities |
| `newConsumer` | 신규 피어 알림 | `{ producerId, id, kind }` |
| `peer-disconnected` | 피어 퇴장 알림 | `peerId` |

## 환경 설정

`server.js` 내 SFU 서버 주소:

```javascript
const SFU_SERVER = 'http://localhost:3001';
```

## 실행 방법

```bash
npm install
npm run start
```
