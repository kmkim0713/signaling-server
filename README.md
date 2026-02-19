# WebRTC 시그널링 서버

TypeScript 기반의 고성능 WebRTC 시그널링 서버입니다.
클라이언트와 SFU(Selective Forwarding Unit) 서버 간의 WebRTC 협상을 중계합니다.

## 개요

이 시그널링 서버는 다음 기능만 담당합니다:

- **SDP Offer/Answer 중계**: 피어 간 세션 설명 교환
- **ICE Candidate 릴레이**: NAT 통과를 위한 후보 전달
- **방 관리**: 참여자 추적 및 생명주기 관리
- **피어 연결 조율**: 신규 피어 알림 및 기존 Producer 목록 제공

**담당하지 않는 역할**:
- 미디어 라우팅 (SFU가 담당)
- RTP 포워딩 (SFU가 담당)
- 미디어 처리 (SFU가 담당)

## 기술 스택

| 항목 | 기술 |
|------|------|
| 언어 | TypeScript 5.3 |
| HTTP 서버 | Express 4.18.2 |
| WebSocket | Socket.IO 4.7.2 |
| HTTP 클라이언트 | Axios 1.6.0 |
| CORS | cors 2.8.5 |
| 테스트 | Jest 29.7.0 |

## 프로젝트 구조

```
signaling-server/
├── src/
│   ├── server.ts                    # 진입점 (Express + Socket.IO)
│   ├── types/
│   │   └── index.ts                 # 타입 정의
│   ├── utils/
│   │   ├── logger.ts                # 구조화 로깅
│   │   └── validator.ts             # 입력 유효성 검사
│   ├── rooms/
│   │   └── room-manager.ts          # 방 및 피어 관리
│   ├── handlers/
│   │   └── socket-handler.ts        # Socket.IO 이벤트 핸들러
│   └── signaling/
│       └── sfu-proxy.ts             # SFU 서버 HTTP 프록시
├── tests/
│   ├── room-manager.test.ts
│   ├── validator.test.ts
│   └── socket-handler.test.ts
├── tsconfig.json                    # TypeScript 설정
├── jest.config.js                   # Jest 설정
└── package.json
```

## 설치 및 실행

### 개발 모드

```bash
npm install
npm run dev
```

### 프로덕션 빌드

```bash
npm install
npm run build
npm start
```

### 테스트

```bash
npm test
```

### 빌드 검증

```bash
npm run build
```

## 환경 변수

`.env` 파일에서 다음 변수를 설정할 수 있습니다:

```env
PORT=3000                           # 서버 포트 (기본값: 3000)
SFU_SERVER=http://localhost:3001    # SFU 서버 주소 (기본값: http://localhost:3001)
```

## Socket.IO 이벤트

### 클라이언트 → 서버

| 이벤트 | 설명 | 파라미터 |
|--------|------|----------|
| `join-room` | 방 입장 | `{ roomId: string }` |
| `create-web-rtc-transport` | Transport 생성 | `{}` |
| `connect-transport` | DTLS 핸드셰이크 | `{ transportId: string, dtlsParameters: object }` |
| `produce` | 미디어 송출 | `{ transportId: string, kind: "audio"\|"video", rtpParameters: object }` |
| `consume` | 미디어 수신 | `{ transportId: string, producerId: string, kind: "audio"\|"video" }` |
| `leave-room` | 방 퇴장 | 없음 |

### 서버 → 클라이언트

| 이벤트 | 설명 | 데이터 |
|--------|------|--------|
| `rtp-capabilities` | RTP 코덱 정보 | RtpCapabilitiesResponse |
| `newConsumer` | 신규 피어 알림 | `{ producerId: string, id: string, kind: string }` |
| `peer-disconnected` | 피어 퇴장 알림 | `string` (peerId) |

## API 엔드포인트

### GET `/health`

서버 상태 확인

**응답:**
```json
{
  "status": "ok",
  "message": "Signaling server is running"
}
```

## 타입 안전성

모든 메시지는 TypeScript 인터페이스로 정의되어 있습니다:

- `JoinRoomPayload`: 방 입장 페이로드
- `ConnectTransportPayload`: Transport 연결 페이로드
- `ProducePayload`: 미디어 송출 페이로드
- `ConsumePayload`: 미디어 수신 페이로드
- `ErrorMessage`: 에러 응답

## 에러 처리

모든 에러는 다음 형식의 구조화된 메시지로 반환됩니다:

```json
{
  "type": "error",
  "code": "ERROR_CODE",
  "message": "설명"
}
```

**에러 코드:**
- `INVALID_ROOM_ID`: 유효하지 않은 방 ID
- `INVALID_TRANSPORT_ID`: 유효하지 않은 Transport ID
- `INVALID_KIND`: 유효하지 않은 미디어 종류
- `INVALID_DTLS_PARAMETERS`: 유효하지 않은 DTLS 파라미터
- `RTP_CAPABILITIES_ERROR`: RTP Capabilities 조회 실패
- `CREATE_TRANSPORT_ERROR`: Transport 생성 실패
- `CONNECT_TRANSPORT_ERROR`: Transport 연결 실패
- `PRODUCE_ERROR`: 미디어 송출 실패
- `CONSUME_ERROR`: 미디어 수신 실패

## 로깅

구조화된 로깅을 사용하며, 다음 정보를 기록합니다:

- 클라이언트 연결/이탈
- 방 입장/퇴장
- 에러 발생
- 디버그 정보

로그 형식:
```
[ISO_TIMESTAMP] [LEVEL] message { data }
```

**로그 레벨:**
- `info`: 일반 정보
- `warn`: 경고
- `error`: 에러
- `debug`: 디버그 정보

## 개발 가이드

### 새로운 Socket.IO 이벤트 추가

1. `src/types/index.ts`에 타입 정의 추가
2. `src/handlers/socket-handler.ts`에 핸들러 메서드 추가
3. `tests/socket-handler.test.ts`에 테스트 추가

### 검증 규칙 추가

1. `src/utils/validator.ts`에 검증 함수 추가
2. `tests/validator.test.ts`에 테스트 추가
3. 핸들러에서 검증 적용

### 테스트 작성

```bash
npm test                    # 모든 테스트 실행
npm test -- --watch        # 감시 모드
npm test -- --coverage     # 커버리지 리포트
```

## 성능 고려사항

- 가볍고 빠른 시그널링에 최적화
- 동기 작업 최소화 (이벤트 루프 블로킹 방지)
- 불필요한 JSON 직렬화 제거

## 메모리 관리

- 피어 연결 해제 시 즉시 정리
- 빈 방 자동 삭제
- 메모리 누수 방지
