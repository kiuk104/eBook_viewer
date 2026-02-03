# 📐 앱 아이콘 생성 가이드

Electron 앱 빌드를 위한 아이콘 생성 방법을 안내합니다.

## 📁 필요한 아이콘 파일

```
build/
├── icon.ico     # Windows (256x256)
├── icon.icns    # macOS (512x512 or 1024x1024)
└── icon.png     # Linux (512x512)
```

## 🎨 아이콘 디자인 권장사항

### 크기 및 형식
- **기본 이미지**: 1024x1024 픽셀 PNG (투명 배경)
- **단순한 디자인**: 작은 크기에서도 인식 가능하도록
- **색상**: 명확한 색상 대비
- **여백**: 가장자리에 10% 여백 권장

### 디자인 아이디어
- 📚 책 아이콘
- 📖 열린 책
- 📝 텍스트 문서
- 👓 독서용 안경
- 🔖 북마크

## 🛠️ 아이콘 생성 방법

### 방법 1: 온라인 도구 사용 (가장 쉬움)

#### Step 1: PNG 이미지 준비
1. 1024x1024 픽셀 PNG 이미지 준비
2. 무료 아이콘: [Flaticon](https://www.flaticon.com/), [Icons8](https://icons8.com/)

#### Step 2: 변환
**Windows (.ico)**
- 사이트: https://convertico.com/
- 업로드 → 256x256 선택 → 다운로드

**macOS (.icns)**
- 사이트: https://cloudconvert.com/png-to-icns
- 업로드 → 변환 → 다운로드

**Linux (.png)**
- 사이트: https://www.iloveimg.com/resize-image
- 512x512로 리사이즈

### 방법 2: 명령줄 도구 (개발자용)

#### Windows (.ico) - ImageMagick 사용
```bash
# ImageMagick 설치 필요
magick convert icon-1024.png -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

#### macOS (.icns) - iconutil 사용
```bash
# icon.iconset 폴더 생성
mkdir icon.iconset

# 여러 크기로 변환
sips -z 16 16     icon-1024.png --out icon.iconset/icon_16x16.png
sips -z 32 32     icon-1024.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     icon-1024.png --out icon.iconset/icon_32x32.png
sips -z 64 64     icon-1024.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   icon-1024.png --out icon.iconset/icon_128x128.png
sips -z 256 256   icon-1024.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   icon-1024.png --out icon.iconset/icon_256x256.png
sips -z 512 512   icon-1024.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   icon-1024.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 icon-1024.png --out icon.iconset/icon_512x512@2x.png

# .icns 생성
iconutil -c icns icon.iconset
```

#### Linux (.png) - 단순 복사
```bash
cp icon-1024.png build/icon.png
# 또는 리사이즈
convert icon-1024.png -resize 512x512 build/icon.png
```

## 📥 무료 아이콘 리소스

### 아이콘 다운로드 사이트
1. **Flaticon** - https://www.flaticon.com/
   - 무료/프리미엄 아이콘
   - PNG, SVG 다운로드
   - 라이선스 확인 필요

2. **Icons8** - https://icons8.com/
   - 무료 아이콘 (크레딧 표시 필요)
   - 여러 스타일 제공

3. **The Noun Project** - https://thenounproject.com/
   - 무료/프리미엄 아이콘
   - SVG 형식

4. **Material Icons** - https://fonts.google.com/icons
   - Google 무료 아이콘
   - SVG, PNG 다운로드

### 검색 키워드
- "book icon"
- "ebook reader icon"
- "text file icon"
- "document reader icon"
- "library icon"

## 🎯 추천 워크플로우

### 초보자용 (가장 빠름)
1. Flaticon에서 "book" 검색
2. 마음에 드는 아이콘 선택
3. 1024x1024 PNG 다운로드
4. https://convertico.com/ 에서 .ico 생성
5. https://cloudconvert.com/png-to-icns 에서 .icns 생성
6. 512x512로 리사이즈하여 .png 저장

### 디자이너용
1. Figma/Illustrator에서 1024x1024 디자인
2. PNG 내보내기 (투명 배경)
3. 온라인 도구로 변환

### 개발자용
1. PNG 준비
2. ImageMagick/iconutil로 일괄 변환
3. 빌드 스크립트에 통합

## ✅ 확인 사항

파일을 생성한 후 확인:
- [ ] `build/icon.ico` (Windows)
- [ ] `build/icon.icns` (macOS)
- [ ] `build/icon.png` (Linux)

크기 확인:
- [ ] icon.ico: 최소 256x256 포함
- [ ] icon.icns: 최소 512x512 포함
- [ ] icon.png: 512x512 권장

## 🚀 빌드 전 테스트

```bash
# 아이콘 파일 확인
ls -l build/

# Windows 빌드 테스트
npm run build:win

# 결과 확인
# dist 폴더에서 생성된 실행 파일 아이콘 확인
```

## 💡 팁

1. **간단한 디자인**: 복잡한 디자인은 작은 크기에서 잘 보이지 않음
2. **명확한 윤곽**: 배경과 대비되는 색상 사용
3. **일관성**: 브랜드 아이덴티티와 일치하도록
4. **테스트**: 여러 배경색에서 테스트

## 🆘 문제 해결

### 아이콘이 표시되지 않음
- 파일 경로 확인: `build/icon.*`
- 파일 권한 확인
- 캐시 삭제 후 재빌드

### 아이콘 품질이 나쁨
- 원본 이미지 해상도 확인 (1024x1024 권장)
- 벡터 이미지(SVG)에서 변환
- 더 높은 품질로 내보내기

### 빌드 오류
```bash
# electron-builder 재설치
npm install electron-builder --save-dev

# 캐시 정리
npm cache clean --force
```

---

아이콘 준비가 완료되면 `npm run build` 명령으로 앱을 빌드할 수 있습니다!
