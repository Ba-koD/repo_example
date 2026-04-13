# DB Bootstrap

이 디렉터리는 로컬 `docker-compose` 실행용 PostgreSQL bootstrap SQL을 담는다.

- `init/001-app.sql`
  - 첫 초기화 시 `messages` 테이블과 기본 row를 만든다

배포 환경에서는 앱 migration hook가 같은 schema를 다시 idempotent하게 맞춘다.

