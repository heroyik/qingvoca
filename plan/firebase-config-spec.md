# Firebase Auth & Firestore Configuration Spec — qingvoca-app

## Overview

qingvoca는 현재 kamivoca-app Firebase 프로젝트의 설정을 공유하고 있습니다.
새로운 **qingvoca-app** 전용 Firebase 프로젝트를 생성하고, 모든 설정을 분리하여 독립적으로 운영합니다.

---

## 1. Goal

kamivoca-app Firebase 설정을 qingvoca-app 전용 Firebase 프로젝트로 완전히 분리한다.

- Firebase Auth (Google 로그인)
- Firestore (단어 데이터, 관리자 설정, 사용자 진행률)
- 로컬 환경 및 CI/CD 환경 모두 qingvoca-app으로 전환

---

## 2. Current State

| 항목 | 현재 값 | 비고 |
|------|---------|------|
| `.firebaserc` | `kamivoca-app` | 기본 프로젝트 |
| `.env.example` | kamivoca-app 값 하드코딩 | template |
| `.env.local` | kamivoca-app 값 사용 | 로컬 개발 |
| GitHub Actions Secrets | kamivoca-app 값 | CI/CD 배포 |
| localStorage 키 프리픽스 | `kamivoca:zh:*` | 프론트엔드 로컬 스토리지 |
| 검증 스크립트 | `kamivoca-app` 하드코딩 | `validate_firebase_auth_connection.mjs` |
| Firestore 컬렉션 | `zhVocabEntries`, `zhFullVocaEntries`, `zhDatasetMeta`, `zhLeaderboard`, `zhAdminOverrides`, `adminVocabOverrides`, `adminDeletedWords`, `users` | 문서 컬렉션 |

---

## 3. Target State

| 항목 | 변경 값 | 비고 |
|------|---------|------|
| `.firebaserc` | `qingvoca-app` | 기본 프로젝트 변경 |
| `.env.example` | qingvoca-app placeholder | template 업데이트 |
| `.env.local` | qingvoca-app 설정값 | Firebase Console에서 복사 |
| GitHub Actions Secrets | qingvoca-app 값 | CI/CD Secrets 변경 |
| localStorage 키 프리픽스 | `qingvoca:zh:*` | 로컬 스토리지 키 변경 |
| 검증 스크립트 | `qingvoca-app` 검증 | 스크립트 업데이트 |
| Firestore 컬렉션 | 동일 (이름 유지) | 새 프로젝트에 복사 |

---

## 4. Firebase Project Setup

### 4.1. Firebase Console에서 프로젝트 생성

1. Firebase Console (https://console.firebase.google.com) 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름: `qingvoca-app`
4. Google Analytics: 선택 사항 (기존 kamivoca와 동일하게 설정)
5. 프로젝트 생성 완료

### 4.2. Web App 등록

1. Firebase Console → qingvoca-app 프로젝트
2. 웹 앱 아이콘 클릭 (`</>` Web)
3. 앱 이름: `qingvoca-web`
4. "Firebase 호스팅 설정 사용 안 함" 선택 (GitHub Pages 사용)
5. `firebaseConfig` 값 확인:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

### 4.3. Authentication 설정

1. Firebase Console → Authentication → Get started
2. Sign-in method → Google 활성화
3. 프로젝트 지원 이메일 주소 설정
4. 동일한 Google Auth 방식 유지 (추가 인증 방법 없음)

### 4.4. Firestore 설정

1. Firebase Console → Firestore Database → Create database
2. 위치 선택 (kamivoca-app과 동일 리전 권장: `asia-northeast3` 또는 기존 리전)
3. 보안 규칙: 시작 시 테스트 모드로 설정 후, 기존 규칙 복사
4. Firestore 인덱스: 기존 인덱스 내보내기 후 새 프로젝트에 배포

---

## 5. Firestore Data Migration

### 5.1. 복사 대상 컬렉션

| 컬렉션 | 설명 | 복사 여부 |
|--------|------|----------|
| `zhVocabEntries` | 중국어 단어 데이터 (636건) | ✅ 복사 |
| `zhFullVocaEntries` | 전체 단어 상세 데이터 | ✅ 복사 |
| `zhDatasetMeta` | 데이터셋 메타데이터 | ✅ 복사 |
| `adminVocabOverrides` | 관리자 단어 수정 설정 | ✅ 복사 |
| `adminDeletedWords` | 관리자 삭제 단어 목록 | ✅ 복사 |
| `users` | 사용자 진행률 데이터 | ⚠️ 초기화 (UID가 다르므로 복사 불가) |
| `zhLeaderboard` | 리더보드 데이터 | ⚠️ 초기화 (새 프로젝트 시작) |

### 5.2. 데이터 복사 스크립트

`scripts/migrate-firestore-to-qingvoca.mjs` 생성:

```
기능:
- kamivoca-app Firestore에서 단어 컬렉션 읽기
- qingvoca-app Firestore에 단어 컬렉션 쓰기
- 관리자 설정 컬렉션 복사
- users 컬렉션은 건너뜀 (초기화)
- 복사 후 검증 (문서 수, 필수 필드 존재 확인)

사용법:
  node scripts/migrate-firestore-to-qingvoca.mjs --dry-run
  node scripts/migrate-firestore-to-qingvoca.mjs --execute
```

### 5.3. Firestore 인덱스 마이그레이션

```bash
# kamivoca-app에서 인덱스 내보내기
firebase firestore:indexes --project kamivoca-app > firestore.indexes.json

# qingvoca-app에 인덱스 배포
firebase deploy --only firestore:indexes --project qingvoca-app
```

### 5.4. Firestore 보안 규칙 마이그레이션

```bash
# kamivoca-app에서 규칙 내보내기
firebase firestore:rules --project kamivoca-app > firestore.rules

# qingvoca-app에 규칙 배포
firebase deploy --only firestore:rules --project qingvoca-app
```

---

## 6. Configuration File Changes

### 6.1. `.firebaserc`

```json
{
  "projects": {
    "default": "qingvoca-app"
  }
}
```

### 6.2. `.env.example`

```env
[TEMPLATE]
# Firebase Web SDK config for QingVoca.
# Copy this file to .env.local and replace values with your Firebase Web app config.
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=qingvoca-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=qingvoca-app
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=qingvoca-app.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=1:your-app-id:web:your-app-hash
```

### 6.3. `.env.local`

Firebase Console에서 복사한 qingvoca-app 설정값 입력.
`.gitignore`에 포함되어 있으므로 커밋하지 않음.

### 6.4. GitHub Actions Secrets

Repository Settings → Secrets and variables → Actions에서 다음 Secrets 업데이트:

| Secret Name | 새 값 |
|-------------|-------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | qingvoca-app API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | qingvoca-app.firebaseapp.com |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | qingvoca-app |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | qingvoca-app.firebasestorage.app |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | qingvoca-app Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | qingvoca-app App ID |

`.github/workflows/deploy-pages.yml`은 변경 불필요 (이미 환경 변수 참조 구조).

---

## 7. localStorage Key Migration

### 7.1. 키 변경 매핑

| 기존 키 | 새 키 |
|---------|-------|
| `kamivoca:zh:progress` | `qingvoca:zh:progress` |
| `kamivoca:zh:review` | `qingvoca:zh:review` |
| `kamivoca:zh:score` | `qingvoca:zh:score` |
| `kamivoca:zh:rank` | `qingvoca:zh:rank` |
| `kamivoca:zh:locale` | `qingvoca:zh:locale` |
| `kamivoca:zh:vocab-overrides` | `qingvoca:zh:vocab-overrides` |
| `kamivoca:zh:deleted-word-keys` | `qingvoca:zh:deleted-word-keys` |

### 7.2. 코드 변경 위치

| 파일 | 변경 내용 |
|------|----------|
| `src/utils/gamification.ts` | `PROGRESS_STORAGE_KEY`, `REVIEW_STORAGE_KEY`, `SCORE_STORAGE_KEY`, `RANK_STORAGE_KEY` 상수 변경 |
| `src/types/chinese-vocab.ts` | `LOCALE_STORAGE_KEY` 상수 변경 |
| `src/contexts/GamificationContext.tsx` | `STORAGE_KEY`, `OVERRIDES_STORAGE_KEY`, `DELETED_STORAGE_KEY` 상수 변경 |
| `scripts/validate_step6_gamification.mjs` | 검증 스크립트의 키 참조 업데이트 |
| `scripts/validate_frontend_step5_gamification.mjs` | 검증 스크립트의 키 참조 업데이트 |

### 7.3. 로컬 데이터 마이그레이션 스크립트

`scripts/migrate-localstorage-keys.mjs` 생성 (선택 사항):

- 기존 `kamivoca:zh:*` 키를 `qingvoca:zh:*`로 이름 변경
- 브라우저 개발 도구 콘솔에서 실행 가능한 스크립트 제공

---

## 8. Validation Scripts Update

### 8.1. `scripts/validate_firebase_auth_connection.mjs`

```javascript
// 변경: kamivoca-app → qingvoca-app
if (config.projects?.default !== "qingvoca-app") {
  errors.push(".firebaserc default project must be qingvoca-app");
}
```

### 8.2. `scripts/validate_frontend_step6_firebase.mjs`

변경 불필요 (환경 변수 키 이름만 사용, 값 검증 안 함).

### 8.3. 검증 커맨드

```bash
# Firebase Auth 연결 검증
npm run validate:firebase:auth

# Firestore 싱크 검증
npm run validate:step9

# 프론트엔드 Firebase 검증
npm run validate:frontend:step6
```

---

## 9. Firestore Sync Script Update

### 9.1. `scripts/sync-firestore-chinese-vocab.mjs`

현재 dry-run 스크립트. qingvoca-app 프로젝트로 싱크:

```bash
# dry-run
node scripts/sync-firestore-chinese-vocab.mjs src/data/vocab.json dist/firestore/chinese-vocab-payload.json

# 실제 싱크 (Firebase Admin SDK 필요 시 별도 스크립트 생성)
node scripts/push-firestore-qingvoca.mjs dist/firestore/chinese-vocab-payload.json
```

---

## 10. Execution Checklist

### Phase 1: Firebase 프로젝트 생성
- [x] Firebase Console에서 qingvoca-app 프로젝트 생성
- [x] Web App 등록 및 firebaseConfig 값 확인
- [x] Authentication → Google 로그인 활성화
- [x] Firestore Database 생성 (테스트 모드)

### Phase 2: 로컬 설정 변경
- [x] `.firebaserc` → `qingvoca-app`으로 변경
- [x] `.env.example` → qingvoca-app placeholder로 업데이트
- [x] `.env.local` → qingvoca-app 설정값 입력
- [x] `npm run validate:firebase:auth` 실행하여 검증

### Phase 3: 코드 변경
- [x] localStorage 키 프리픽스를 `qingvoca:zh:*`로 변경
- [x] 검증 스크립트에서 `kamivoca-app` 참조를 `qingvoca-app`으로 변경
- [x] `npm run test` 실행하여 검증

### Phase 4: Firestore 데이터 마이그레이션
- [x] Firestore 보안 규칙 내보내기 및 배포
- [x] Firestore 인덱스 내보내기 및 배포
- [ ] 단어 데이터 컬렉션 복사 (kamivoca-app에 데이터 없음)
- [x] 관리자 설정 컬렉션 복사 (adminVocabOverrides: 1건, adminDeletedWords: 231건)
- [x] 데이터 복사 검증 (문서 수, 필드 확인)

### Phase 5: CI/CD 설정
- [x] GitHub Actions Secrets 업데이트 (6개 값)
- [ ] `npm run build` 로컬에서 빌드 테스트
- [ ] GitHub에 푸시하여 배포 테스트
- [ ] 프로덕션 URL에서 Firebase 연결 확인

### Phase 6: 검증
- [ ] Google 로그인 동작 확인
- [ ] 사용자 진행률 저장/로드 확인
- [ ] 리더보드 표시 확인 (초기 상태)
- [ ] 관리자 설정 동기화 확인
- [ ] 오프라인 모드 동작 확인

---

## 11. Rollback Plan

만약 새 프로젝트로 전환 후 문제가 발생하면:

1. `.firebaserc`를 `kamivoca-app`으로 되돌리기
2. `.env.local`을 기존 kamivoca-app 값으로 되돌리기
3. localStorage 키를 `kamivoca:zh:*`로 되돌리기
4. GitHub Secrets을 기존 값으로 되돌리기

---

## 12. Notes

- Firebase 프로젝트 ID `qingvoca-app`은 동일 Google 계정에서 생성
- GitHub Pages 배포 방식은 변경 없이 유지
- Firestore 컬렉션 이름은 변경 없이 유지 (복사 편의성)
- Leaderboard는 새 프로젝트에서 초기화 (데이터 없이 시작)
- 사용자(users) 컬렉션은 초기화 (UID가 다르므로 기존 데이터 복사 불가)
