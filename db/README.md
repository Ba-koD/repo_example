# DB Notes

이 디렉터리는 현재 로컬 PostgreSQL 관련 메모만 둔다.

- 이 샘플 앱은 별도 bootstrap SQL 없이도 실행된다
- backend는 PostgreSQL 연결 후 `select now()`로 DB 상태를 확인한다
- 배포 환경에서는 `idea` 플랫폼이 주입한 runtime secret과 내부 service name으로 DB에 연결한다
