const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

const width = canvas.width;
const height = canvas.height;

const canvasBuffer = context.getImageData(0, 0, width, height);

const blit = () => {
  context.putImageData(canvasBuffer, 0, 0);
};

const canvasPixel = (x, y, r, g, b, a) => {
  x = Math.floor(x);
  y = Math.floor(y);
  const index = (x + y * width) * 4;
  canvasBuffer.data[index + 0] = r;
  canvasBuffer.data[index + 1] = g;
  canvasBuffer.data[index + 2] = b;
  canvasBuffer.data[index + 3] = a;
};

const putPixel = (x, y, color) => {
  let canvasX = width / 2 + x;
  let canvasY = height / 2 - y;

  canvasPixel(canvasX, canvasY, color.r, color.g, color.b, color.a);
};

const drawLine = (p0, p1, color) => {
  let dx = p1.x - p0.x;
  let dy = p1.y - p0.y;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (p0.x > p1.x) {
      let copy = p1;
      p1 = p0;
      p0 = copy;
    }
    const a = dy / dx;
    let y = p0.y;

    for (let x = p0.x; x < p1.x; x++) {
      putPixel(x, y, color);
      y = y + a;
    }
  } else {
    if (p0.y > p1.y) {
      let copy = p1;
      p1 = p0;
      p0 = copy;
    }
    const a = dx / dy;
    let x = p0.x;

    for (let y = p0.y; y < p1.y; y++) {
      putPixel(x, y, color);
      x = x + a;
    }
  }
};

let initialPoint = { x: 10, y: -80 };
let finalPoint = { x: -110, y: 130 };
let redColor = { r: 255, g: 0, b: 0, a: 255 };

drawLine(initialPoint, finalPoint, redColor);

blit();
