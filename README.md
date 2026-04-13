# Dummy App Repo

이 디렉터리는 `idea` 플랫폼용 예제 앱 저장소다.  
그대로 별도 Git 저장소로 복사한 뒤, `idea` 웹 UI에서 런타임에 등록하는 용도로 만든다.

구성:

- `frontend`
  - 정적 웹 UI
  - 같은 origin의 `/api`로 backend 호출
- `backend`
  - Node.js API
  - PostgreSQL에 메시지 저장
  - `/api/healthz`, `/api/readyz` 제공
- `db`
  - PostgreSQL bootstrap SQL
- `docker-compose.yml`
  - 로컬 실행과 구조 파악용 입력 원본

## Directory Layout

```text
app/
  frontend/
  backend/
  db/
  docker-compose.yml
  .env.example
  .env.dev
  .env.stage
  .env.prod
  scripts/use-env.sh
  runtime-project-input.example.json
```

## Environment File Strategy

이 예제는 두 가지 방식으로 env를 관리한다.

1. 선택된 현재 환경
   - `.env.dev`, `.env.stage`, `.env.prod` 중 하나를 `.env`로 복사
   - 일반적인 `docker compose up --build`에 사용
2. 병렬 환경 실행
   - `docker compose --env-file .env.dev ...`
   - `docker compose --env-file .env.stage ...`
   - `docker compose --env-file .env.prod ...`

각 env 파일에는 다음이 들어 있다.

- `COMPOSE_PROJECT_NAME`
- `APP_ENV`
- `APP_DISPLAY_NAME`
- `PUBLIC_API_BASE_PATH`
- `APP_MESSAGE`
- host port
- PostgreSQL 계정/비밀번호

`stage`, `prod`는 서로 다른 host port를 써서 로컬에서도 동시에 띄울 수 있게 해뒀다.

중요한 점:

- 이 파일들은 로컬 개발용이다
- 실제 배포용 `dev / stage / prod` env와 secret은 `idea` 웹 UI에서 런타임에 입력한다
- 즉 배포 시스템은 `.env.dev`, `.env.stage`, `.env.prod`를 canonical source로 취급하지 않는다

## Local Run

현재 환경으로 실행:

```bash
./scripts/use-env.sh dev
docker compose up --build
```

다른 환경으로 바꾸려면:

```bash
./scripts/use-env.sh stage
docker compose up --build
```

병렬 실행 예시:

```bash
docker compose --env-file .env.dev up --build -d
docker compose --env-file .env.stage up --build -d
docker compose --env-file .env.prod up --build -d
```

접속 예시:

- dev frontend: `http://localhost:3000`
- stage frontend: `http://localhost:3100`
- prod frontend: `http://localhost:3200`

## Runtime Contract

- 외부 진입점은 frontend 하나라고 가정한다
- frontend는 `/api` 상대 경로로 backend를 호출한다
- backend는 `db` 서비스명으로 PostgreSQL에 붙는다
- DB는 외부 공개 대상이 아니다

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
- `dev / stage / prod` env / secret
- Argo CD project / destination / GitOps repo 정보
- AWS 또는 On-Prem target profile
- hostname / Caddy routing

예시는 [runtime-project-input.example.json](/mnt/c/Users/rudgh/idea/app/runtime-project-input.example.json:1)에 넣어뒀다.

## API Endpoints

- `GET /api/healthz`
- `GET /api/readyz`
- `GET /api/config`
- `GET /api/messages`
- `POST /api/messages`
