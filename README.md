# Idea Time Sample

이 저장소는 `idea` 플랫폼용 최소 예제 앱 저장소다.  
frontend와 backend를 분리하고, backend가 PostgreSQL 연결과 health check를 제공하는 가장 단순한 구조를 보여준다.

구성:

- `frontend`
  - 정적 웹 UI
  - runtime config로 받은 `PUBLIC_API_BASE_URL`로 backend 호출
- `backend`
  - Node.js API
  - PostgreSQL의 현재 시간과 DB 이름 반환
  - `/api/healthz`, `/api/readyz`, `/api/time` 제공
- `docker-compose.yml`
  - 로컬 실행과 구조 파악용 입력 원본

## Directory Layout

```text
repo_example/
  frontend/
  backend/
  docker-compose.yml
  .env.example
  runtime-project-input.example.json
```

## Environment File Strategy

- repo에는 `.env.example`만 둔다
- 실제 `.env`는 로컬에서만 생성한다
- 실제 `dev / stage / prod` 값은 `idea` 웹 UI에서 런타임에 입력한다
- 즉 배포 시스템은 repo의 env 파일을 canonical source로 취급하지 않는다

## Local Run

`.env.example`를 `.env`로 복사하고 실행한다.

```bash
cp .env.example .env
docker compose up --build
```

기본 접속:

- frontend: `http://localhost:3000`
- backend health: `http://localhost:8080/api/healthz`
- backend time: `http://localhost:8080/api/time`

## Runtime Contract

- 외부 진입점은 frontend 하나라고 가정한다
- frontend는 injected `PUBLIC_API_BASE_URL`로 backend를 호출한다
- backend는 `db` 서비스명으로 PostgreSQL에 붙는다
- DB는 외부 공개 대상이 아니다
- app 내부 nginx는 정적 파일 서빙만 담당한다
- 외부 hostname과 `/api` 라우팅은 플랫폼 `Caddy`가 맡는 것을 기본으로 한다

## Register In idea UI

1. 이 `app/` 디렉터리 내용을 새 Git 저장소 루트로 복사한다.
2. 새 repo에 push한다.
3. `idea` 웹 UI에서 아래 값을 런타임에 입력한다.

- app repo URL
- git ref
- repo access secret
- frontend build context: `frontend`
- frontend Dockerfile path: `frontend/Dockerfile`
- backend build context: `backend`
- backend Dockerfile path: `backend/Dockerfile`
- Cloudflare API secret
- Ncloud access key / secret key
- `dev / stage / prod` env / secret
- Argo CD project / destination / GitOps repo 정보
- Ncloud 또는 On-Prem target profile
- hostname / Caddy routing

예시는 [runtime-project-input.example.json](./runtime-project-input.example.json)에 넣어뒀다.

## API Endpoints

- `GET /api/healthz`
- `GET /api/readyz`
- `GET /api/time`
