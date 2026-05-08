# ClearPNG

격자 패턴 배경이 포함된 이미지에서 배경을 제거하고 실제 alpha channel이 있는 투명 PNG로 다운로드하는 Vue 앱입니다. 다운로드 시 Supabase에 결과 PNG를 24시간 동안 저장하고, QR 링크를 바로 표시합니다.

## Structure

- `frontend`: Vue 3, Vite, Composition API 기반 화면
- `backend`: Supabase Storage, PostgreSQL, Edge Function 설정

## Quick start

```sh
cd frontend
npm install
npm run dev
```

Supabase 공유 기능을 쓰려면 `frontend/.env.example`을 참고해 `frontend/.env.local`을 설정하고, `backend/README.md` 순서대로 Supabase SQL과 만료 파일 정리 함수를 적용하세요.
