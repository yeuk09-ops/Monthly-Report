# Archive 폴더

**생성일**: 2026년 2월 10일
**목적**: 작업 과정에서 생성된 임시 파일 및 구버전 파일 보관

---

## 📁 폴더 구조

### 1. `temp_files/` (68개 파일)
**설명**: Claude 작업 중 생성된 임시 작업 디렉토리 파일들
- `tmpclaude-*-cwd`: Claude 세션별 임시 작업 디렉토리
- `nul`: 임시 파일

**보관 이유**: 향후 작업 이력 추적 및 참고용

---

### 2. `python_scripts/` (30개 파일)
**설명**: 데이터 검증 및 추출용 Python 스크립트들

#### 주요 스크립트:
- **Snowflake 쿼리 스크립트**:
  - `snowflake_*.py`: Snowflake 데이터 조회
  - `snowflake_nov_*.py`: 11월 데이터 전용 쿼리

- **중국/홍콩 데이터 분석**:
  - `china_ar_*.py`: 중국 매출채권 분석
  - `china_hk_*.py`: 중국/홍콩 데이터 상세 분석
  - `final_china_hk.py`: 최종 통합 스크립트

- **검증 스크립트**:
  - `verify_*.py`: 각종 데이터 검증 (AR, 매출, 재고 등)
  - `credit_verify_*.py`: 여신 검증
  - `inventory_verify.py`: 재고 검증
  - `check_units.py`: 단위 확인

- **매출 분석**:
  - `export_sales.py`: 수출 매출 분석
  - `final_summary*.py`: 최종 요약 리포트

**보관 이유**: 데이터 검증 로직 참고 및 재사용 가능성

---

### 3. `old_html_files/` (4개 파일)
**설명**: 구버전 HTML 대시보드 파일들

#### 파일 목록:
- `FNF_재무제표_(2512)대시보드.html`: 25년 12월 버전
- `FNF_재무제표_대시보드_v3.html`: v3 버전
- `FNF_재무제표_대시보드_v6.html`: v6 버전 (최종)
- `index.html`: 초기 버전

**보관 이유**:
- React/Next.js 마이그레이션 전 원본 보존
- UI/UX 디자인 참고용
- 롤백 필요 시 참고

**현재 버전**: `fnf-dashboard_v2/` (React + Next.js + Vercel)

---

### 4. `old_docs/` (4개 파일)
**설명**: 구버전 가이드 문서들

#### 파일 목록:
- `FNF_Dashboard_API_Project_Guide.md`: API 프로젝트 초기 가이드
- `FNF_Dashboard_Monthly_Update_Guide.md`: 월간 업데이트 가이드 v1/v2
- `FNF_재무제표_대시보드_작업정리_v4.md`: 작업 정리 문서 v4
- `IMPLEMENTATION_PLAN_TEMP.md`: 임시 구현 계획

**보관 이유**: 작업 히스토리 및 의사결정 과정 참고

**현재 버전**:
- `../FNF_Dashboard_Monthly_Update_Guide_v3.md` (루트)
- `../Monthly_Report_Guides/` (최신 가이드 모음)

---

## 🗂️ 현재 활성 폴더 (루트)

### 필수 파일:
- `F&F 월별재무제표(26.01).csv`: 26년 1월 재무상태표 데이터
- `FNF_Dashboard_Monthly_Update_Guide_v3.md`: 최신 업데이트 가이드

### 프로젝트 폴더:
- `fnf-dashboard_v2/`: **메인 대시보드 프로젝트** (React + Next.js)
- `fnf-dashboard/`: 구버전 (삭제 예정)
- `Monthly_Report_Guides/`: 최신 분석 가이드 모음

### Git 관련:
- `.git/`: Git 저장소
- `.gitignore`: Git 제외 설정
- `.vercel/`: Vercel 배포 설정

---

## ⚠️ 주의사항

1. **삭제 금지**: 이 폴더의 파일들은 참고용으로 보관됩니다.
2. **재사용 시**: Python 스크립트 재사용 시 날짜/기준월 변수 확인 필수
3. **HTML 파일**: 단순 참고용, 배포 금지

---

## 📝 정리 이력

| 날짜 | 작업 | 파일 수 |
|:---|:---|:---:|
| 2026-02-10 | 초기 정리 | 102개 |
| | - 임시 파일 | 68개 |
| | - Python 스크립트 | 30개 |
| | - HTML 파일 | 4개 |
| | - 문서 파일 | 4개 |

---

**정리자**: Claude AI
**마지막 업데이트**: 2026년 2월 10일
