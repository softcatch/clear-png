# ClearPNG Supabase 설정 순서

이 백엔드는 로그인 없이 PNG 결과물을 24시간 동안 공유하기 위한 Supabase 구성입니다. 사용자 정보는 저장하지 않고, 원본 파일 경로와 결과 PNG 경로, 공유 토큰, 만료 시각만 `conversions` 테이블에 기록합니다.

## 1. Supabase 프로젝트 만들기

1. Supabase Dashboard에서 새 프로젝트를 만듭니다.
2. Project Settings > API에서 Project URL과 anon/public key를 복사합니다.
3. `frontend/.env.local`에 아래 값을 넣습니다.

```sh
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
VITE_SUPABASE_ORIGINAL_BUCKET=original-images
VITE_SUPABASE_PROCESSED_BUCKET=processed-images
VITE_SUPABASE_CONVERSIONS_TABLE=conversions
```

## 2. 테이블과 Storage 버킷 만들기

Supabase Dashboard > SQL Editor에서 `backend/supabase/migrations/0001_init_clearpng.sql` 전체를 실행합니다.

이 SQL은 아래 리소스를 만듭니다.

- `public.conversions`: 공유 토큰과 24시간 만료 시각 저장
- `original-images`: 원본 이미지 저장용 private bucket
- `processed-images`: QR 링크에서 결과 PNG를 바로 보여주기 위한 public bucket
- anon 사용자가 업로드할 수 있는 RLS 정책
- `get_shared_conversion(token)`: QR 토큰으로만 활성 공유 파일을 조회하는 RPC

## 3. 프론트에서 동작하는 흐름

1. 사용자가 PNG 또는 JPG를 업로드합니다.
2. 브라우저 Canvas가 격자 패턴 배경을 제거한 PNG Blob을 만듭니다.
3. 사용자가 `PNG 다운로드하기`를 누릅니다.
4. 즉시 로컬 PNG 다운로드가 시작됩니다.
5. 같은 결과 PNG가 Supabase Storage에 저장되고 `conversions`에 24시간 만료 공유 토큰이 저장됩니다.
6. QR 코드가 화면에 바로 표시됩니다.
7. QR을 찍으면 `/share/:token` 페이지에서 결과 PNG를 보고 저장할 수 있습니다.

## 4. 24시간 후 실제 파일 삭제 설정

공유 페이지는 `expires_at`이 지난 링크를 차단합니다. 하지만 public bucket URL을 이미 알고 있는 사람까지 막으려면 Storage 파일도 삭제해야 하므로 `cleanup-expired` Edge Function을 배포하고 주기 실행을 켭니다.

Supabase CLI를 로그인 및 프로젝트 연결까지 마친 뒤 실행합니다.

```sh
supabase functions deploy cleanup-expired
```

Dashboard > Integrations > Cron에서 새 Job을 만들고, 1시간마다 아래 HTTP POST를 실행하게 설정합니다.

```txt
POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/cleanup-expired
Authorization: Bearer YOUR_ANON_KEY
Content-Type: application/json
```

무료 플랜에서도 Edge Function에는 기본적으로 `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`가 제공됩니다. `SUPABASE_SERVICE_ROLE_KEY`는 브라우저에 절대 넣지 말고 Edge Function 내부에서만 사용합니다.

## 5. 로컬 실행

```sh
cd frontend
npm install
npm run dev
```

브라우저에서 업로드 후 `PNG 다운로드하기`를 누르면 다운로드와 QR 생성이 함께 실행됩니다.
