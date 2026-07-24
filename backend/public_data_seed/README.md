# 공공데이터 업체 후보 seed 도구

승인된 JSONL 파일을 운영 DB나 공개 사이트에 넣지 않고 비공개 검수 bundle로 바꾸는 로컬 dry-run 도구다.

## 안전 경계

- 네트워크와 데이터베이스를 사용하지 않는다.
- `backend/data`와 기존 NAVER 자료를 읽지 않는다.
- `dryRun=true`, D-23 승인 원천, PM이 고정한 registry hash만 허용한다.
- 사업자번호·개인 연락처·NAVER lineage·허용되지 않은 필드는 차단 또는 격리한다.
- 결과는 `published`, `verified`, `inquiryEnabled`를 만들지 않는다.
- 기존 출력은 덮어쓰지 않으며 같은 입력은 immutable bundle을 재사용한다.

## 실행

```powershell
python backend/public_data_seed/seed_tool.py `
  --workspace-root C:\isolated\sonpum-seed `
  --manifest manifest.json `
  --expected-registry-sha256 <PM이 전달한 64자리 SHA-256>
```

`workspace-root`에는 승인 registry·schema, manifest, 입력 JSONL, 빈 output 디렉터리만 둔다. 실제 배치는 QA-019와 별도 사용자 승인을 통과하기 전 실행하지 않는다.

## 테스트

```powershell
python -m unittest backend.public_data_seed.test_seed_tool
python -m compileall -q backend/public_data_seed
```

테스트는 운영 자료가 아닌 임시 synthetic 데이터만 만든다.
