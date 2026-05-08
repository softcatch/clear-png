# ClearPNG Frontend

Vue 3 Composition API와 Vite로 만든 ClearPNG 프론트엔드입니다. 이미지 처리는 브라우저 Canvas에서 수행하고, `PNG 다운로드하기` 버튼이 로컬 다운로드와 Supabase 24시간 QR 공유 저장을 함께 실행합니다.

## Project Setup

```sh
npm install
```

## Development

```sh
npm run dev
```

## Build

```sh
npm run build
```

## Supabase env

```sh
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_SUPABASE_ORIGINAL_BUCKET=original-images
VITE_SUPABASE_PROCESSED_BUCKET=processed-images
VITE_SUPABASE_CONVERSIONS_TABLE=conversions
```
