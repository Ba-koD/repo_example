# REPO_B_SERVICE_SPEC.md

## 1. Use Of This Document

이 문서는 `idea`에 등록해서 배포할 별도 Git 저장소, 즉 `레포 B`를 구현하기 위한 직접 지시서다.  
이 문서를 읽는 구현자나 AI는 `idea` 저장소를 모른다고 가정해도 된다.

즉 이 문서의 목적은 아래 하나다.

- 이 문서만 보고 `frontend + backend + db` 구조의 배포 가능한 서비스 레포를 만들 수 있어야 한다

---

## 2. Final Goal

구현 대상 레포는 아래 조건을 만족해야 한다.

- 별도 Git 저장소로 독립 운영 가능
- 로컬에서는 `docker-compose`로 실행 가능
- 배포 시에는 Kubernetes 리소스로 변환 가능한 구조여야 함
- 외부 공개는 하나의 hostname으로만 진입
- frontend는 same-origin `/api`로 backend 호출
- backend는 DB를 내부 서비스명으로 연결
- DB는 외부 공개 대상이 아님
- prod는 blue/green 배포와 호환 가능해야 함

이 문서의 기본 권장 모델은 아래다.

- `frontend`
- `backend`
- `db`

`single web + db`도 가능하지만, 기본 구현 지시는 `frontend + backend + db` 기준으로 한다.

---

## 3. Required Deliverables

이 레포에는 최소한 아래가 있어야 한다.

- `frontend` 애플리케이션
- `backend` 애플리케이션
- `db`용 기본 구성
- 서비스별 Dockerfile
- 루트 `docker-compose.yml`
- 루트 `.env.example`
- 실행 방법과 env 설명이 있는 `README.md`

권장 디렉터리 구조:

```text
repo-b/
  frontend/
  backend/
  db/
  docker-compose.yml
  .env.example
  README.md
```

---

## 4. Runtime Architecture

배포 환경에서는 아래 구조를 전제로 한다.

### test
- `test.<base_domain> -> cloudflared -> platform Caddy -> frontend`
- `test.<base_domain>/api -> platform Caddy -> backend`
- `backend -> db`

### stage
- `stage.<base_domain> -> cloudflared -> platform Caddy -> frontend`
- `stage.<base_domain>/api -> platform Caddy -> backend`
- `backend -> db`

### prod
- `prod.<base_domain> -> cloudflared -> platform Caddy -> active frontend slot`
- `prod.<base_domain>/api -> platform Caddy -> active backend slot`
- `backend -> prod db`

이 구조에서 중요한 점은 아래다.

- 외부 hostname은 환경별 하나다
- frontend와 backend는 같은 origin 아래서 동작한다
- backend는 `/api` path로만 외부에 노출된다
- DB는 외부 hostname에 연결되지 않는다

---

## 5. Public Routing Contract

이 레포는 외부 edge 라우팅을 직접 구현하지 않는다.  
외부 라우팅은 배포 플랫폼의 `platform Caddy`가 담당한다.

이 레포가 맞춰야 할 계약은 아래다.

- `/`는 `frontend`가 처리 가능해야 한다
- `/api`는 `backend`가 처리 가능해야 한다
- frontend는 backend 주소를 절대 URL로 고정하지 않고 상대 경로 `/api`를 기본값으로 사용해야 한다

권장 기본값:

```env
PUBLIC_API_BASE_URL=/api
```

즉 frontend는 배포 후 `http://localhost:8080` 같은 주소를 직접 알 필요가 없어야 한다.

---

## 6. Internal Networking Contract

배포 환경에서 내부 통신은 `localhost`가 아니라 서비스 이름을 사용한다.

### Required
- frontend -> backend: `/api`
- backend -> db: `db:5432` 또는 동등한 내부 서비스명
- backend -> redis/mq: 내부 서비스명 기반

### Forbidden
- frontend가 배포 후에도 `localhost:8080` 직접 호출
- backend가 배포 후에도 `localhost:5432`로 DB 연결
- DB를 public port로 열어서 앱이 거기로 붙는 구조

권장 예시:

```env
PORT=8080
DATABASE_URL=postgres://app:password@db:5432/app
PUBLIC_API_BASE_URL=/api
```

---

## 7. Local Development Contract

로컬 개발에서는 `docker-compose`를 사용할 수 있다.  
하지만 로컬 개발 편의와 배포 구조가 완전히 달라지면 안 된다.

### Required
- `docker-compose up`으로 `frontend`, `backend`, `db`가 함께 실행 가능해야 한다
- frontend는 로컬에서도 가능하면 `/api` 경로 기반으로 backend를 호출해야 한다
- backend는 compose 네트워크 안에서 `db` 서비스명으로 DB에 붙을 수 있어야 한다

### Allowed
- 로컬에서 브라우저 접근용으로 `localhost:3000`, `localhost:8080` 포트 노출
- frontend dev server 사용
- hot reload 사용

### Not Recommended
- 로컬에서는 `/api` 없이 동작하고 배포에서만 `/api`를 붙이는 구조
- 로컬에서만 `localhost` 직접 호출에 강하게 묶인 구조

가장 좋은 로컬 구조는 아래다.

- 브라우저는 `localhost:3000` 접속
- frontend dev server가 `/api`를 backend로 프록시
- backend는 `db`로 연결

이렇게 하면 배포 구조와 개념이 가장 비슷해진다.

---

## 8. Compose Contract

루트 `docker-compose.yml`은 반드시 포함한다.  
다만 이 파일은 두 목적을 동시에 만족해야 한다.

- 로컬 개발 실행
- 배포 플랫폼이 서비스 구조를 읽을 수 있는 입력 원본

### Compose Must Clearly Expose
- `frontend` 서비스
- `backend` 서비스
- `db` 서비스
- 각 서비스 이미지 또는 build 정보
- 내부 포트
- 필수 env 이름
- 서비스 간 의존성

### Compose Should Avoid
- `network_mode: host`
- bind mount 전제 운영 구조
- Docker 전용 서비스 discovery에 과도하게 의존하는 구조
- 앱 외부 라우팅을 내부 Caddy 하나에 몰아넣는 구조

### Compose Runtime Notes
- 로컬에서는 `docker-compose up` 실행 가능해야 함
- 운영 서버에서는 compose를 직접 실행하지 않는다고 가정한다
- 배포 플랫폼은 compose를 읽고 Kubernetes 리소스로 변환할 수 있어야 한다
- build 경로, routing, target, env, hostname은 웹 UI 런타임 입력이 우선한다

### Delivery Integration Notes
- 이 레포의 실제 배포는 `docker-compose` 실행이 아니라 container image + GitOps manifest 갱신으로 이뤄진다
- 따라서 `frontend`와 `backend`는 각각 독립 이미지로 빌드 가능해야 한다
- 새 버전 배포는 보통 아래 순서로 진행된다
  - `repo B` push
  - 플랫폼 build 계층 또는 CI가 image build / push
  - GitOps manifest가 새 image tag 또는 digest로 갱신
  - Argo CD가 manifest 변경을 감지해 sync
- 이 레포는 `새 image tag/digest를 manifest에 꽂아 넣으면 바로 배포 가능한 상태`를 목표로 해야 한다

### Optional Repo Metadata
- repo 내부 선언 파일은 있어도 된다
- 하지만 build 경로, routing, healthcheck, hook, env, target은 웹 UI `Project State`가 우선한다
- 즉 repo 내부 메타데이터는 필수요건이 아니라 import 보조 입력이다

---

## 9. App-Level Reverse Proxy Policy

이 레포 내부에 `Caddy`, `Nginx`, `Traefik` 같은 프록시를 꼭 둘 필요는 없다.  
기본 권장은 `두지 않는 것`이다.

### Recommended
- frontend는 정적 파일 또는 자체 dev server로 제공
- backend는 API 서버만 담당
- 외부 hostname 라우팅은 플랫폼이 담당

### Allowed
- frontend 정적 파일 서빙만 위한 간단한 웹 서버
- 프레임워크 특성상 필요한 최소 웹 서버

### Not Recommended
- 외부 진입점과 `/api` 라우팅을 앱 내부 Caddy에 강하게 의존하는 구조
- prod blue/green 전환을 앱 내부 프록시가 담당하는 구조

---

## 10. Environment Variable Contract

루트 `.env.example`에는 최소한 아래 범주의 값이 정리되어 있어야 한다.

### Frontend
- `PUBLIC_BASE_URL`
- `PUBLIC_API_BASE_URL`

### Backend
- `APP_ENV`
- `PORT`
- `DATABASE_URL`
- `LOG_LEVEL`
- `JWT_SECRET`
- `SESSION_SECRET`

### Database
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`

중요한 점:

- 운영용 `dev / stage / prod` 값은 repo에 저장하지 않는다
- 실제 배포 env와 secret은 `idea` 웹 UI에서 런타임에 입력하고 저장한다
- repo의 `.env.example`은 키 구조와 로컬 실행 예시만 제공한다

---

## 11. What Must Be Entered In idea UI At Runtime

아래 값은 이 repo가 아니라 `idea` 웹 UI에서 입력해야 한다.

- app repo URL / ref / repo access secret
- frontend / backend build context와 Dockerfile path
- Argo CD project / destination / GitOps repo 연결 정보
- `dev / stage / prod` env 값
- `dev / stage / prod` secret 값
- AWS 또는 On-Prem target profile
- Caddy hostname
- `entry_service_name`
- `backend_service_name`
- `backend_base_path`
- `test/stage/admin` allowlist
- prod blue-green 정책

즉 이 repo는 앱 코드와 로컬 실행 계약만 제공하고, 실제 배포 입력은 웹 UI가 canonical source가 된다.

권장 예시:

```env
PUBLIC_BASE_URL=http://localhost:3000
PUBLIC_API_BASE_URL=/api

APP_ENV=local
PORT=8080
DATABASE_URL=postgres://app:password@db:5432/app
LOG_LEVEL=info
JWT_SECRET=replace-me
SESSION_SECRET=replace-me

POSTGRES_DB=app
POSTGRES_USER=app
POSTGRES_PASSWORD=replace-me
```

### Required Rules
- 민감값은 실제 운영값으로 커밋하지 않는다
- `.env.example`은 키 목록과 예시값만 제공한다
- backend는 `DATABASE_URL` 하나로도 동작 가능하게 만드는 것을 권장한다

---

## 11. HTTP Contract

backend는 최소한 아래 endpoint를 제공해야 한다.

### Required
- `GET /api/healthz`
- `GET /api/readyz` 또는 동등한 readiness endpoint

### Recommended
- `GET /api/version`
- `GET /api` 기본 응답 또는 API 정보 응답

이유는 아래와 같다.

- 로컬 개발 확인
- 배포 후 smoke test
- prod blue/green 전환 전 health check

frontend도 최소한 `/`에서 정상 응답이 가능해야 한다.

### Hook Compatibility
- migration이 필요하면 컨테이너 안에서 비대화식으로 실행 가능한 명령이어야 한다
- smoke test가 필요하면 별도 `Job`으로 실행 가능한 명령이어야 한다
- 플랫폼이 host SSH나 임의 shell을 실행해 줄 것이라고 가정하지 않는다

---

## 12. Database Contract

DB는 기본적으로 PostgreSQL을 권장한다.

### Required
- backend는 DB 연결 실패 시 명확한 로그를 남겨야 한다
- DB schema 초기화 방식이 있어야 한다
- local compose에서 DB가 같이 올라와야 한다

### Recommended
- migration 도구 사용
- 앱 시작 시 destructive auto-reset 금지
- prod에서도 이전 버전과 신규 버전이 잠시 함께 붙어도 버틸 수 있는 migration 전략

### Important
- prod는 blue/green이어도 DB는 보통 하나를 공유한다
- 따라서 schema 변경은 backward compatible이 기본 원칙이다

---

## 13. Prod Blue-Green Compatibility

이 레포는 prod blue/green 배포와 호환되어야 한다.

이를 위해 아래 조건을 만족해야 한다.

- frontend와 backend가 슬롯 단위로 분리 배포 가능해야 한다
- health check가 안정적으로 동작해야 한다
- 새 버전과 이전 버전이 짧은 시간 동시에 존재해도 문제 없어야 한다
- DB migration은 이전 슬롯과 신규 슬롯의 공존을 고려해야 한다

권장 슬롯 예시:

- `prod-blue-frontend`
- `prod-blue-backend`
- `prod-green-frontend`
- `prod-green-backend`
- `prod-db`

---

## 14. Recommended Implementation Choices

기술 스택은 자유지만 아래 성질은 유지해야 한다.

### Frontend
- SPA 또는 SSR 모두 가능
- API 호출 경로를 env로 주입 가능해야 함
- 기본값은 `/api`

### Backend
- stateless API 서버 권장
- readiness/health endpoint 제공
- reverse proxy 뒤 동작 고려

### Database
- PostgreSQL 권장
- 개발용 compose와 배포용 Kubernetes 모두에서 일관된 연결 방식 유지

---

## 15. Minimal Acceptance Criteria

이 문서를 기준으로 구현된 레포는 최소한 아래를 통과해야 한다.

### Local
- `docker-compose up`으로 전체 서비스 기동
- 브라우저에서 frontend 접근 가능
- frontend가 `/api`를 통해 backend 호출 가능
- backend가 DB에 연결 가능
- `/api/healthz` 응답 가능

### Deployment Readiness
- frontend, backend, db가 논리적으로 분리되어 있음
- `localhost` 고정 주소 없이 env로 동작 가능
- `.env.example`이 존재함
- Dockerfile이 존재함
- frontend와 backend가 독립 이미지로 빌드 가능함
- 새 image tag/digest를 GitOps manifest에 반영하면 배포 가능함
- migration이 있다면 비대화식 명령으로 분리 가능함
- prod blue/green과 충돌하는 단일 인스턴스 전제가 없음

---

## 16. Explicit Non-Goals

이 문서를 기준으로 만들 레포는 아래를 목표로 하지 않는다.

- 운영 서버에서 `docker-compose up`으로 직접 배포되는 구조
- 앱 내부 프록시가 외부 edge 라우팅까지 전부 담당하는 구조
- frontend가 배포 후에도 backend 절대 주소를 직접 아는 구조
- DB를 외부에 공개하는 구조
- `localhost` 중심 개발 구조를 운영 구조로 그대로 가져가는 방식

---

## 17. Direct Build Instruction

이 문서를 보고 구현할 때는 아래 요구를 그대로 따른다.

1. 별도 Git 저장소를 생성한다.
2. `frontend + backend + db` 구조로 프로젝트를 만든다.
3. 루트에 `docker-compose.yml`, `.env.example`, `README.md`를 둔다.
4. repo 내부 선언 파일이 필요하면 추가할 수 있지만, 실제 배포에서는 웹 UI `Project State`가 우선한다.
5. frontend는 기본적으로 `/api`로 backend를 호출하게 만든다.
6. backend는 `DATABASE_URL`로 DB에 붙게 만든다.
7. DB 연결 기본 호스트는 `db` 서비스명으로 가정한다.
8. backend에 `/api/healthz`와 `/api/readyz`를 만든다.
9. 로컬에서 `docker-compose up`으로 바로 확인 가능하게 만든다.
10. 앱 내부 Caddy는 넣지 않는 것을 기본값으로 한다.
11. `frontend`와 `backend`는 각각 독립 이미지로 빌드 가능하게 만든다.
12. migration이 있다면 컨테이너 안에서 비대화식으로 실행 가능한 명령으로 정리한다.
13. 새 image tag/digest가 GitOps manifest에 반영되면 바로 배포 가능한 구조로 만든다.
14. 나중에 Kubernetes로 변환돼도 구조가 유지되도록 만든다.

---

## 18. One-Sentence Summary

이 레포는 `frontend + backend + db` 구조의 독립 서비스 저장소로 구현하며, 로컬에서는 `docker-compose`로 실행 가능하고, 배포 시에는 외부 라우팅을 플랫폼이 담당하는 same-origin `/api` 구조와 내부 서비스명 기반 네트워크를 유지한 채, 독립 이미지와 GitOps manifest 갱신만으로 Argo CD 배포가 가능해야 한다.
