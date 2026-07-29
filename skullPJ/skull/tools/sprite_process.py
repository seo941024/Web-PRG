#!/usr/bin/env python3
"""
sprite_process.py — 큰 PNG 일러스트를 게임용 작은 도트 스프라이트로 후처리.

처리 순서:
  1) RGBA 로드
  2) (옵션) 흰 배경 -> 투명 처리
  3) 내용(불투명 픽셀) 기준 자동 크롭  -- 빈 여백 제거
  4) 비율 유지하며 목표 크기 안에 리사이즈 후 가운데 배치(투명 패딩)
  5) 색상 수 제한(팔레트 양자화)
  6) (옵션) 알파 임계화 -- 반투명 외곽을 깔끔하게

사용 예:
  pip install pillow
  python sprite_process.py input.png -o out.png
  python sprite_process.py input.png -o out.png --size 28x40 --colors 16
  python sprite_process.py input.png -o out.png --filter nearest --no-white-key
"""

import argparse
import sys

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow가 필요합니다.  설치:  pip install pillow")


def parse_size(s):
    try:
        w, h = s.lower().split("x")
        return int(w), int(h)
    except Exception:
        raise argparse.ArgumentTypeError("크기는 WxH 형식 (예: 28x40)")


def white_to_alpha(img, threshold):
    """near-white(밝고 채도 낮은) 픽셀을 투명으로."""
    img = img.convert("RGBA")
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            if r >= threshold and g >= threshold and b >= threshold:
                px[x, y] = (r, g, b, 0)
    return img


def autocrop(img):
    """불투명 영역의 bounding box로 크롭. 전부 투명이면 원본 반환."""
    alpha = img.split()[-1]
    bbox = alpha.getbbox()
    return img.crop(bbox) if bbox else img


def fit_into(img, target, resample):
    """비율 유지하며 target(W,H) 안에 들어가게 리사이즈 + 투명 가운데 패딩."""
    tw, th = target
    sw, sh = img.size
    scale = min(tw / sw, th / sh)
    nw, nh = max(1, round(sw * scale)), max(1, round(sh * scale))
    resized = img.resize((nw, nh), resample)
    canvas = Image.new("RGBA", target, (0, 0, 0, 0))
    canvas.paste(resized, ((tw - nw) // 2, (th - nh) // 2), resized)
    return canvas


def quantize_keep_alpha(img, colors):
    """알파를 보존하면서 RGB만 N색으로 양자화."""
    rgb = img.convert("RGB")
    pal = rgb.quantize(colors=colors, method=Image.MEDIANCUT)
    out = pal.convert("RGBA")
    out.putalpha(img.split()[-1])
    return out


def threshold_alpha(img, cut):
    """반투명 외곽 정리: 알파 < cut 이면 0, 아니면 255."""
    r, g, b, a = img.split()
    a = a.point(lambda v: 255 if v >= cut else 0)
    return Image.merge("RGBA", (r, g, b, a))


def main():
    ap = argparse.ArgumentParser(description="PNG -> 게임용 도트 스프라이트 후처리")
    ap.add_argument("input", help="원본 PNG 경로")
    ap.add_argument("-o", "--output", required=True, help="결과 PNG 경로")
    ap.add_argument("--size", type=parse_size, default=(28, 40),
                    help="목표 크기 WxH (기본 28x40)")
    ap.add_argument("--colors", type=int, default=16,
                    help="최대 색상 수 (기본 16, 0이면 양자화 생략)")
    ap.add_argument("--filter", choices=["lanczos", "nearest", "bilinear"],
                    default="lanczos",
                    help="리사이즈 필터 (기본 lanczos: 큰그림 축소시 가장 깔끔. "
                         "nearest: 픽셀 보존이지만 디테일 많은 원본은 지저분해질 수 있음)")
    ap.add_argument("--white-threshold", type=int, default=245,
                    help="이 값 이상 밝기의 흰 배경을 투명 처리 (기본 245)")
    ap.add_argument("--no-white-key", action="store_true",
                    help="흰 배경 투명 처리 생략 (이미 투명 PNG일 때)")
    ap.add_argument("--no-crop", action="store_true",
                    help="자동 크롭 생략")
    ap.add_argument("--alpha-cut", type=int, default=128,
                    help="알파 임계값(0~255). 0이면 임계화 안 함 (기본 128)")
    args = ap.parse_args()

    resample = {
        "lanczos": Image.LANCZOS,
        "nearest": Image.NEAREST,
        "bilinear": Image.BILINEAR,
    }[args.filter]

    img = Image.open(args.input).convert("RGBA")

    if not args.no_white_key:
        img = white_to_alpha(img, args.white_threshold)

    if not args.no_crop:
        img = autocrop(img)

    img = fit_into(img, args.size, resample)

    if args.colors and args.colors > 0:
        img = quantize_keep_alpha(img, args.colors)

    if args.alpha_cut and args.alpha_cut > 0:
        img = threshold_alpha(img, args.alpha_cut)

    img.save(args.output)
    print(f"완료: {args.output}  ({args.size[0]}x{args.size[1]}, "
          f"색상<= {args.colors}, 필터={args.filter})")


if __name__ == "__main__":
    main()
