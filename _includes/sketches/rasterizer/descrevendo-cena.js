class Matrix4 {
  constructor() {
    this.body = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ];
  }

  multV(vector) {
    let matrix = this.body;
    let vec = [vector.x, vector.y, vector.z, vector.w];
    if (!vector.w) vec[3] = 1;
    let result = [];

    for (let i = 0; i < matrix.length; i++) {
      let pos = 0;
      for (let j = 0; j < matrix[i].length; j++) {
        pos += matrix[i][j] * vec[j];
      }
      result[i] = pos;
    }
    return new Vector4f(result[0], result[1], result[2], result[3]);
  }

  multM(matrix) {
    let prevMatrix = this.body;
    let result = new Matrix4();

    for (let i = 0; i < prevMatrix.length; i++) {
      for (let j = 0; j < prevMatrix.length; j++) {
        for (let k = 0; k < prevMatrix.length; k++) {
          result.body[i][j] += prevMatrix[i][k] * matrix.body[k][j];
        }
      }
    }
    this.body = result.body;
    return this;
  }

  Translate(translation) {
    const { x, y, z } = translation;
    this.body = [
      [1, 0, 0, x],
      [0, 1, 0, y],
      [0, 0, 1, z],
      [0, 0, 0, 1]
    ];
    return this;
  }

  Scale(scale) {
    const { x, y, z } = scale;
    this.body = [
      [x, 0, 0, 0],
      [0, y, 0, 0],
      [0, 0, z, 0],
      [0, 0, 0, 1]
    ];
    return this;
  }

  RotateY(rotationVector) {
    const { y: angle } = rotationVector;

    this.body = [
      [Math.cos(angle), 0, Math.sin(angle), 0],
      [0, 1, 0, 0],
      [-Math.sin(angle), 0, Math.cos(angle), 0],
      [0, 0, 0, 1]
    ];
    return this;
  }

  Projection(planeDistance) {
    this.body = [
      [planeDistance, 0, 0, 0],
      [0, planeDistance, 0, 0],
      [0, 0, planeDistance, 0],
      [0, 0, 1, 0]
    ];
    return this;
  }
}

class Vector {
  constructor(x, y, z, w) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }
}

class Vector2f extends Vector {
  super(x, y) {
    this.x = x;
    this.y = y;
  }
}

class Vector3f extends Vector {
  super(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
}
class Vector4f extends Vector {
  super(x, y, z, w) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }

  toVector3f() {
    return new Vector3f(this.x / this.w, this.y / this.w, this.z / this.w);
  }
  toVector2f() {
    return new Vector2f(this.x / this.w, this.y / this.w);
  }
}

const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

const width = canvas.width;
const height = canvas.height;

const canvasBuffer = context.getImageData(0, 0, width, height);

const blit = () => {
  context.putImageData(canvasBuffer, 0, 0);
};

const clear = () => {
  for (let i = 0; i < width * height * 4; i++) {
    canvasBuffer.data[i + 0] = 255;
    canvasBuffer.data[i + 1] = 255;
    canvasBuffer.data[i + 2] = 255;
    canvasBuffer.data[i + 3] = 255;
  }
  blit();
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
    let b = p0.y - a * p0.x;

    for (let x = p0.x; x < p1.x; x++) {
      let y = a * x + b;
      putPixel(x, y, color);
    }
  } else {
    if (p0.y > p1.y) {
      let copy = p1;
      p1 = p0;
      p0 = copy;
    }

    const a = dx / dy;
    const b = p0.x - a * p0.y;

    for (let y = p0.y; y < p1.y; y++) {
      let x = a * y + b;
      putPixel(x, y, color);
      // x = x + a;
    }
  }
};


const RED = { r: 255, g: 0, b: 0, a: 255 };
const BLUE = { r: 0, g: 0, b: 255, a: 255 };
const GREEN = { r: 0, g: 255, b: 0, a: 255 };
const YELLOW = { r: 225, g: 225, b: 0, a: 255 };
const CYAN = { r: 255, g: 0, b: 255, a: 255 };
const PURPLE = { r: 0, g: 255, b: 255, a: 255 }


const drawTriangle = (p1, p2, p3, color) => {
  drawLine(p1, p2, color);
  drawLine(p2, p3, color);
  drawLine(p3, p1, color);
};

const PLANE_DISTANCE = 1;

const PLANE_WIDTH = 1;
const PLANE_HEIGHT = 1;
const viewPortToCanvas = ({ x, y }) => {
  return { x: x * (width / PLANE_WIDTH), y: y * (height / PLANE_HEIGHT) };
};

const cube = {
  vertices: [
    { x: -1, y: 1, z: -1 }, // a  0
    { x: 1, y: 1, z: -1 },  // b  1
    { x: 1, y: -1, z: -1 }, // c  2
    { x: -1, y: -1, z: -1 }, // d 3
    { x: -1, y: 1, z: 1 },   // e 4
    { x: 1, y: 1, z: 1 },  // f   5
    { x: 1, y: -1, z: 1 }, // g   6
    { x: -1, y: -1, z: 1 }, //h   7
  ],
  meshes: [
    [0, 1, 3, RED], //abd
    [1, 2, 3, RED], // bcd [1, 2, 5], // bfc
    [1, 6, 2, BLUE], // bgc
    [1, 5, 6, BLUE], // bfg
    [0, 7, 3, GREEN], // ahd
    [0, 4, 7, GREEN], //  aeh
    [2, 7, 6, YELLOW],//chg
    [2, 3, 7, YELLOW],// cdh
    [4, 1, 5, PURPLE], //ebf
    [4, 1, 0, PURPLE], //eba
    [4, 7, 6, CYAN], // ehg
    [4, 6, 5, CYAN],// egf
  ]
}

let instance = {
  model: cube,
  transform: {
    position: new Vector3f(0, 0, 4),
    scale: new Vector3f(0.5, 0.5, 0.5),
    rotation: new Vector3f(0, -Math.PI / 4, 0)
  }
};

let sceneInstances = [instance];
const render = () => {
  sceneInstances.forEach((instance) => {
    const projectedVertices = [];
    instance.model.vertices.forEach((vertex) => {
      const { position, scale, rotation } = instance.transform;
      const scaling = new Matrix4().Scale(scale);
      const rotating = new Matrix4().RotateY(rotation);
      const translating = new Matrix4().Translate(position);
      const projecting = new Matrix4().Projection(PLANE_DISTANCE);

      const projectedVertex = projecting
        .multM(translating.multM(rotating.multM(scaling)))
        .multV(vertex);

      projectedVertices.push(projectedVertex.toVector2f());
    });

    instance.model.meshes.forEach((mesh) => {
      drawTriangle(
        viewPortToCanvas({
          x: projectedVertices[mesh[0]].x,
          y: projectedVertices[mesh[0]].y
        }),
        viewPortToCanvas({
          x: projectedVertices[mesh[1]].x,
          y: projectedVertices[mesh[1]].y
        }),
        viewPortToCanvas({
          x: projectedVertices[mesh[2]].x,
          y: projectedVertices[mesh[2]].y
        }),
        mesh[3]
      );
    });
  });
};

render();
blit()

let i = 0;
const draw = (last) => {
  const now = new Date().getTime();
  if (now - last > 3000) {
    clear();
    render();
    blit();
    i += 0.01;
    instance.transform.rotation = new Vector3f(0, i, 0);

  }

  requestAnimationFrame(draw);
};

draw();
