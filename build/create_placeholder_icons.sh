#!/bin/bash

# 플레이스홀더 아이콘 생성 스크립트
# ImageMagick이 필요합니다: sudo apt-get install imagemagick

echo "==================================="
echo "플레이스홀더 아이콘 생성 중..."
echo "==================================="

# 임시 1024x1024 PNG 생성 (책 이모지 스타일)
convert -size 1024x1024 xc:white \
  -font "DejaVu-Sans" -pointsize 600 \
  -fill "#4F46E5" -gravity center \
  -annotate +0+0 "📚" \
  icon-1024.png

echo "✓ 기본 이미지 생성 완료: icon-1024.png"

# Windows .ico 생성
convert icon-1024.png \
  -define icon:auto-resize=256,128,64,48,32,16 \
  icon.ico

echo "✓ Windows 아이콘 생성 완료: icon.ico"

# Linux .png 생성 (512x512)
convert icon-1024.png -resize 512x512 icon.png

echo "✓ Linux 아이콘 생성 완료: icon.png"

echo ""
echo "==================================="
echo "완료!"
echo "==================================="
echo ""
echo "생성된 파일:"
echo "  - icon-1024.png (원본)"
echo "  - icon.ico (Windows)"
echo "  - icon.png (Linux)"
echo ""
echo "macOS .icns 파일은 macOS에서만 생성 가능합니다."
echo ""
echo "더 나은 아이콘을 원하시면 ICON_GUIDE.md를 참고하세요!"
