// camera.js — 플레이어 추적 카메라 (탑다운)

const Cam = { x: 0, y: 0 };

function updateCamera(target) {
    // 줌 적용 시 화면에 보이는 월드 폭/높이는 CW/ZOOM, CH/ZOOM
    const tx = target.x - (CW / ZOOM) / 2, ty = target.y - (CH / ZOOM) / 2;
    Cam.x += (tx - Cam.x) * 0.12;
    Cam.y += (ty - Cam.y) * 0.12;
}
