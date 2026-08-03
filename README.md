# 말해봄 프론트엔드

말해봄은 어린이를 위한 AI 영어 말하기 학습 서비스입니다.

AI가 영어 질문을 들려주면 어린이가 마이크 버튼을 누르고 답변하고, 음성 인식과 AI 채점을 거쳐 친근한 피드백을 받을 수 있습니다. 보호자는 별도의 학습 기록 화면에서 학습 횟수, 정답률, 학습 시간과 오답 표현을 확인할 수 있습니다.

## 주요 기능

- 보호자 회원가입, 로그인 및 로그아웃
- 액세스 토큰 인증과 토큰 자동 재발급
- 어린이 프로필 조회, 생성 및 선택
- 학습 주제, 난이도, 문제 수와 문제 유형 설정
- Push-to-Talk 방식의 음성 녹음
- 음성 파일 업로드 및 STT 변환
- 답변 제출과 AI 채점 피드백
- 문제 음성, 힌트 및 피드백 음성 재생
- 학습 결과, 정답률 및 학습 시간 표시
- 보호자용 학습 기록, 통계 및 오답 조회
- 데스크톱과 모바일에 대응하는 반응형 UI

## 기술 스택

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS 4
- Web MediaRecorder API

## 시작하기

### 1. 요구 사항

- Node.js 20 이상
- npm
- 말해봄 백엔드 API 서버

### 2. 패키지 설치

```bash
npm install
```

### 3. 환경변수 설정

프로젝트 루트에서 `.env.example`을 복사하여 `.env.local` 파일을 만듭니다.

```bash
cp .env.example .env.local
```

백엔드 서버 주소에 맞게 다음 값을 수정합니다.

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
```

프론트엔드와 백엔드가 같은 도메인에서 동작하고 백엔드가 `/api/v1` 경로를 사용한다면 이 환경변수를 생략할 수 있습니다.

개발 환경에서는 로그인 화면의 **체험용 로그인** 버튼으로 백엔드 없이 전체 UI 흐름을 확인할 수 있습니다. 체험 모드에서는 프로필, 학습 설정, 문제, 음성 인식 결과, AI 피드백, 학습 결과와 보호자 통계를 브라우저의 샘플 데이터로 제공합니다. 현재 프론트엔드 단독 배포를 위해 `.env.production`에도 다음 공개 플래그가 설정되어 있습니다.

```env
NEXT_PUBLIC_ENABLE_DEMO_LOGIN=true
```

백엔드 인증을 연결한 운영 환경에서는 배포 서비스의 환경변수를 `false`로 변경하세요. `NEXT_PUBLIC_` 변수는 빌드할 때 브라우저 번들에 포함되므로 변경 후 다시 배포해야 합니다.

브라우저 음성 합성은 밝고 또렷한 여성 음성을 자동으로 우선 선택합니다. 테스트할 컴퓨터에 설치된 특정 음성을 사용하려면 음성 이름의 일부를 지정할 수 있습니다.

```env
NEXT_PUBLIC_TTS_VOICE_NAME=Samantha
```

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인합니다.

## 주요 화면

| 경로 | 화면 |
| --- | --- |
| `/` | 서비스 홈 |
| `/signup` | 보호자 회원가입 |
| `/login` | 보호자 로그인 |
| `/profiles` | 어린이 프로필 선택 및 생성 |
| `/setup` | 학습 주제와 난이도 설정 |
| `/quiz` | 문제 확인, 음성 녹음 및 답변 제출 |
| `/feedback` | AI 채점 결과와 피드백 |
| `/results` | 학습 완료 결과 |
| `/records` | 보호자용 학습 기록 |

## API 연결 구조

API의 기본 경로는 `/api/v1`이며 인증이 필요한 요청에는 다음 헤더가 포함됩니다.

```http
Authorization: Bearer {accessToken}
```

일반 요청은 JSON을 사용하고 음성 및 이미지 업로드에는 `multipart/form-data`를 사용합니다.

주요 API 관련 코드는 다음 위치에 있습니다.

```text
lib/api/client.ts   공통 요청, 인증, 토큰 재발급 및 API 메서드
lib/api/types.ts    요청과 응답 TypeScript 타입
lib/api/session.ts  선택한 프로필과 현재 학습 상태 관리
```

액세스 토큰이 만료되어 `401` 응답을 받으면 토큰 재발급을 한 번 시도한 후 원래 요청을 다시 실행합니다. 재발급에도 실패하면 저장된 인증 정보를 제거합니다.

세션에 배정된 문제를 식별할 때는 원본 문제 ID인 `questionId`와 세션 문제 ID인 `sessionQuestionId`를 구분합니다. 음성 업로드, 답변 제출, 추가 질문에는 `sessionQuestionId`를 사용하고 힌트, 정답 설명, 문제 TTS에는 `questionId`를 사용합니다.

## 음성 학습 흐름

```text
학습 세션 생성
→ 다음 문제 조회
→ 마이크 녹음
→ 음성 파일 업로드 및 STT 변환
→ 변환된 답변 제출
→ AI 채점과 피드백
→ 다음 문제 또는 세션 완료
→ 학습 결과 저장
```

마이크 녹음은 브라우저의 `MediaRecorder` API를 사용하므로 HTTPS 환경 또는 `localhost`에서 실행해야 합니다. 사용자가 브라우저의 마이크 접근 권한을 허용해야 합니다.

## 명령어

```bash
# 개발 서버 실행
npm run dev

# ESLint 검사
npm run lint

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm run start
```

## 현재 제약 사항

- 학습 문제 건너뛰기 API가 없어 건너뛰기 버튼은 비활성화되어 있습니다.
- 오답은 `attemptNo`, `canRetry`, `remainingAttempts` 응답을 기준으로 문제당 최대 2회까지 제출합니다.
- OAuth 콜백 API는 백엔드 명세가 확정된 뒤 로그인 화면에 연결해야 합니다.
- 실제 학습 데이터 표시에는 실행 중인 백엔드 API가 필요합니다.
