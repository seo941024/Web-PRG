"""GIF 스프라이트 애니메이션을 개별 PNG 프레임으로 추출.
sprites/raw/<class>/anim/<anim>/<dir>/ 안의 모든 .gif를 찾아
같은 폴더에 frame_00.png, frame_01.png ... 로 저장 (원본 GIF는 유지).
투명 배경(RGBA) 보존.
"""
import glob
import os
from PIL import Image, ImageSequence

def extract(gif_path):
    folder = os.path.dirname(gif_path)
    im = Image.open(gif_path)
    n = 0
    for i, frame in enumerate(ImageSequence.Iterator(im)):
        rgba = frame.convert("RGBA")
        out = os.path.join(folder, f"frame_{i:02d}.png")
        rgba.save(out)
        n += 1
    print(f"{gif_path} -> {n} frames")

if __name__ == "__main__":
    gifs = glob.glob("sprites/raw/*/anim/*/*/*.gif")
    if not gifs:
        print("gif 없음 — sprites/raw/<class>/anim/<anim>/<dir>/ 에 넣었는지 확인")
    for g in gifs:
        extract(g)
