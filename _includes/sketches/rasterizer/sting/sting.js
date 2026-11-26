// Sting, a espada do Bilbo, desenhada pelo nosso rasterizador do capítulo de texturas.
// É o mesmo código, com alguns acréscimos marcados com "novo:":
//   - um importador de .obj, que monta o modelo no mesmo formato do nosso cubo
//   - um material que junta várias texturas (cor base, oclusão, normal map, metálico, rugosidade...)
//   - o modo FLAT, além de GOURAD e PHONG
//   - um chão quadriculado e botões para andar pela cena
// Tudo roda na CPU, pixel a pixel, então só desenhamos de novo quando algo muda.

class Matrix4 {
  constructor() {
    this.body = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
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
      [0, 0, 0, 1],
    ];
    return this;
  }

  Scale(scale) {
    const { x, y, z } = scale;
    this.body = [
      [x, 0, 0, 0],
      [0, y, 0, 0],
      [0, 0, z, 0],
      [0, 0, 0, 1],
    ];
    return this;
  }

  RotateY(rotationVector) {
    const { y: angle } = rotationVector;

    this.body = [
      [Math.cos(angle), 0, Math.sin(angle), 0],
      [0, 1, 0, 0],
      [-Math.sin(angle), 0, Math.cos(angle), 0],
      [0, 0, 0, 1],
    ];
    return this;
  }

  Projection(planeDistance) {
    this.body = [
      [planeDistance, 0, 0, 0],
      [0, planeDistance, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
    ];
    return this;
  }

  Transpose() {
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        this.body[i][j] = this.body[j][i];
      }
    }

    return this;
  }
}
// Matrix4.Projection(plane_distance).mult(vector)
//

class Vector {
  constructor(x, y, z, w) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }

  sub(vector) {
    return new Vector3f(
      this.x - vector.x,
      this.y - vector.y,
      this.z - vector.z
    );
  }

  add(vector) {
    return new Vector3f(
      this.x + vector.x,
      this.y + vector.y,
      this.z + vector.z
    );
  }

  dot(vector) {
    return this.x * vector.x + this.y * vector.y + this.z * vector.z;
  }

  cross(vector) {
    return new Vector3f(
      this.y * vector.z - this.z * vector.y,
      this.z * vector.x - this.x * vector.z,
      this.x * vector.y - this.y * vector.x
    );
  }

  prod(scalar) {
    return new Vector3f(this.x * scalar, this.y * scalar, this.z * scalar);
  }

  div(scalar) {
    return new Vector3f(this.x / scalar, this.y / scalar, this.z / scalar);
  }

  unit() {
    return new Vector3f(0, 0, 0);
  }

  magnitude() {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  normalize() {
    return this.div(this.magnitude());
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
    return new Vector3f(this.x / this.w, this.y / this.w, this.z);
  }
  toVector2f() {
    return new Vector2f(this.x / this.w, this.y / this.w);
  }
}
const RED = { r: 255, g: 0, b: 0, a: 255 };
const BLUE = { r: 0, g: 0, b: 255, a: 255 };
const GREEN = { r: 0, g: 255, b: 0, a: 255 };
const YELLOW = { r: 225, g: 225, b: 0, a: 255 };
const PINK = { r: 255, g: 0, b: 255, a: 255 };
const CYAN = { r: 0, g: 255, b: 255, a: 255 };


var Texture = function(url) {
  if (!(this instanceof Texture)) { return new Texture(url); }

  this.url = url;

}



Texture.prototype.loadImage = function() {

  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => {
      this.image = image;  // Save the image to the object

      let iw = this.image.width;
      let ih = this.image.height;


      this.iw = iw;
      this.ih = ih;

      // Create a canvas and draw the image onto it
      this.canvas = document.createElement("canvas");
      this.canvas.width = iw;
      this.canvas.height = ih;

      let canvas2D = this.canvas.getContext('2d');
      canvas2D.drawImage(this.image, 0, 0, iw, ih);

      // Get pixel data from the canvas
      this.pixelData = canvas2D.getImageData(0, 0, iw, ih).data;

      resolve(this);  // Resolve with the texture object itself, not just the callback
    };

    image.onerror = (error) => {
      console.error('Error loading image:', error);
      reject(new Error('Image failed to load'));
    };

    // Initiate the loading by setting the source URL
    image.src = this.url;
    image.crossOrigin = "anonymous";
  });
};

Texture.prototype.getTexel = function(u, v) {
  // bilinear filtering
  // fx = frac(tx)
  // fy = frac(ty)
  // tx = floor(tx)
  // ty = floor(ty)


  // TL = texture[tx][ty]
  // TR = texture[tx+1][ty]
  // BL = texture[tx][ty+1]
  // BR = texture[tx+1][ty+1]

  // CT = fx * TR + (1 - fx) * TL
  // CB = fx * BR + (1 - fx) * BL

  // return fy * CB + (1 - fy) * CT

  // var iu = (u*this.iw) | 0;
  // var iv = (v*this.ih) | 0;

  // var offset = (iv*this.iw*4 + iu*4);


  let tx = (u*this.iw);
  let ty = (v*this.ih);

  const fx = tx - Math.floor(tx)
  const fy = ty - Math.floor(ty)

  tx = Math.floor(tx)
  ty = Math.floor(ty)


  const TLoffset = (ty*this.iw*4 + tx*4)
  const TRoffset = (ty*this.iw*4 + (tx + 1)*4)
  const BLoffset = ((ty + 1)*this.iw*4 + tx*4)
  const BRoffset = ((ty + 1)*this.iw*4 + (tx + 1)*4)


  const pixelTL = new Vector3f(this.pixelData[TLoffset + 0], this.pixelData[TLoffset + 1], this.pixelData[TLoffset + 2])
  const pixelTR = new Vector3f(this.pixelData[TRoffset + 0], this.pixelData[TRoffset + 1], this.pixelData[TRoffset + 2])

  const pixelBL = new Vector3f(this.pixelData[BLoffset + 0], this.pixelData[BLoffset + 1], this.pixelData[BLoffset + 2])
  const pixelBR = new Vector3f(this.pixelData[BRoffset + 0], this.pixelData[BRoffset + 1], this.pixelData[BRoffset + 2])


  const CT = pixelTR.prod(fx).add(pixelTL.prod(1 - fx))
  const CB = pixelBR.prod(fx).add(pixelBL.prod(1 - fx))

  const result = CB.prod(fy).add(CT.prod(1-fy))

  return {
    r: result.x,
    g: result.y,
    b: result.z
  };
}


// novo: importador de .obj. Ele monta o modelo no mesmo formato do nosso cubo:
// { vertices: [...], meshes: [{ vertices: [i0, i1, i2], normals: [...], textureCoords: [...] }] }
//
// v  x y z      posição de um vértice
// vt u v        coordenada de textura
// vn x y z      normal
// f  a/b/c ...  uma face: para cada canto, os índices (começando em 1) de v, vt e vn
const parseOBJ = (text) => {
  const vertices = [];
  const uvs = [];
  const normals = [];
  const meshes = [];

  for (const line of text.split("\n")) {
    const [type, ...values] = line.trim().split(/\s+/);

    if (type === "v") {
      const [x, y, z] = values.map(Number);
      // o arquivo veio "deitado" (com z para cima); trocamos para y para cima
      vertices.push(new Vector3f(x, z, -y));
    } else if (type === "vt") {
      const [u, v] = values.map(Number);
      // no .obj o v cresce para cima; na imagem, para baixo
      uvs.push([u, 1 - v]);
    } else if (type === "vn") {
      const [x, y, z] = values.map(Number);
      normals.push(new Vector3f(x, z, -y));
    } else if (type === "f") {
      const corners = values.map((corner) =>
        corner.split("/").map((index) => parseInt(index, 10) - 1)
      );
      // uma face com mais de 3 cantos vira um leque de triângulos
      for (let i = 1; i + 1 < corners.length; i++) {
        const triangle = [corners[0], corners[i], corners[i + 1]];
        meshes.push({
          vertices: triangle.map((corner) => corner[0]),
          textureCoords: triangle.map((corner) => uvs[corner[1]]),
          normals: triangle.map((corner) => normals[corner[2]]),
        });
      }
    }
  }

  return { vertices, meshes };
};

// novo: o chão, um quadriculado de size x size casas no plano y = 0, no mesmo formato de modelo
const createGround = (size) => {
  const vertices = [];
  const meshes = [];
  const up = new Vector3f(0, 1, 0);

  for (let i = 0; i <= size; i++) {
    for (let j = 0; j <= size; j++) {
      vertices.push(new Vector3f(i - size / 2, 0, j - size / 2));
    }
  }

  const at = (i, j) => i * (size + 1) + j;
  const uv = (index) => [vertices[index].x, vertices[index].z];

  for (let i = 0; i < size; i++) {
    for (let j = 0; j < size; j++) {
      for (const triangle of [
        [at(i, j), at(i, j + 1), at(i + 1, j)],
        [at(i + 1, j), at(i, j + 1), at(i + 1, j + 1)],
      ]) {
        meshes.push({
          vertices: triangle,
          normals: [up, up, up],
          textureCoords: triangle.map(uv),
        });
      }
    }
  }

  return { vertices, meshes };
};

// novo: uma "textura" calculada para o chão, com o mesmo getTexel das texturas de imagem:
// casas claras e escuras, e as linhas da grade
const checkerTexture = {
  getTexel(u, v) {
    const fu = u - Math.floor(u);
    const fv = v - Math.floor(v);
    const isLine = Math.min(fu, 1 - fu, fv, 1 - fv) < 0.025;
    const isDark = (Math.floor(u) + Math.floor(v)) % 2 !== 0;
    const c = isLine ? 140 : isDark ? 200 : 232;
    return { r: c, g: c, b: c + 6 };
  },
};

const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

const width = canvas.width;
const height = canvas.height;

const canvasBuffer = context.getImageData(0, 0, width, height);

let RENDERING = "PHONG"; // novo: muda pelo seletor de iluminação: "FLAT", "GOURAD" ou "PHONG"

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
  // novo: o chão passa da borda da tela; fora do canvas o pixel cairia na linha vizinha
  if (x < 0 || x >= width || y < 0 || y >= height) return;
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
  blit();
};

const interpolate = (i0, i1, d0, d1) => {
  if (i0 === i1) {
    return [d0];
  }

  let values = [];
  let a = (d1 - d0) / (i1 - i0);
  let d = d0;
  for (let i = i0; i <= i1; i++) {
    values.push(d);
    d += a;
  }

  return values;
};

let zBuffer = Array(width * height).fill(0);

const zBufferAccess = (x, y) => {
  x = canvas.width / 2 + (x | 0);
  y = canvas.height / 2 - (y | 0) - 1;

  if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) {
    return false;
  }

  let offset = x + canvas.width * y;
  return zBuffer[Math.floor(offset)];
};

const zBufferWrite = (x, y, value) => {
  x = canvas.width / 2 + (x | 0);
  y = canvas.height / 2 - (y | 0) - 1;

  if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) {
    return false;
  }

  let offset = x + canvas.width * y;

  zBuffer[offset] = value;
};

const clamp = (value, min, max) => {
  return Math.max(min, Math.min(max, value));
};

const multiplyColorScalar = (color, scalar) => {
  return {
    r: clamp(color.r * scalar, 0, 255),
    g: clamp(color.g * scalar, 0, 255),
    b: clamp(color.b * scalar, 0, 255),
    a: 255,
  };
};

// novo: as mesmas luzes, mais fortes para esta cena
let lights = [
  {
    type: "POINT",
    position: new Vector3f(80, 2, -10),
    intensity: 0.45,
  },
  {
    type: "DIRECTIONAL",
    intensity: 0.4,
    direction: new Vector3f(3, 0, 1),
  },
  {
    type: "AMBIENT",
    intensity: 0.35,
  },
];

// novo: shininess e specularStrength vêm das texturas de rugosidade e metálico
const calculateLightIntensity = (point, worldPoint, vertexNormal, lights, shininess = 1000, specularStrength = 1) => {
  let totalLight = 0;
  let lightDirection;

  lights.forEach((light) => {
    if (light.type === "POINT") {
      const cameraOrientation = camera.orientation;
      const cameraPosition = camera.position;
      const cameraMatrix = cameraOrientation
        .Transpose()
        .multM(new Matrix4().Translate(cameraPosition.prod(-1)));
      const transformedLightPosition = cameraMatrix.multV(light.position);
      lightDirection = transformedLightPosition.sub(worldPoint);
    } else if (light.type === "DIRECTIONAL") {
      const cameraOrientation = camera.orientation;
      const cameraMatrix = cameraOrientation.Transpose();
      const transformedLightPosition = cameraMatrix.multV(light.direction);
      lightDirection = transformedLightPosition.sub(worldPoint);
    } else {
      totalLight += light.intensity;
    }

    const cos_alpha =
      lightDirection.dot(vertexNormal) /
      (lightDirection.magnitude() * vertexNormal.magnitude());

    const reflective = vertexNormal
      .prod(2 * vertexNormal.dot(lightDirection))
      .sub(lightDirection);

    const reflectiveFactor = Math.pow(
      reflective.dot(vertexNormal) /
        (reflective.magnitude() * vertexNormal.magnitude()),
      shininess
    );

    if (cos_alpha > 0) {
      totalLight += (cos_alpha + specularStrength * reflectiveFactor) * light.intensity;
    }

    // TODO: add reflective component
  });

  return totalLight;
};

// do flat-shading.js: a normal do triângulo, a partir dos seus três pontos
const calculateFaceNormal = (p0, p1, p2) => {
  let v = p1.sub(p0);
  let w = p2.sub(p0);

  const normal = v.cross(w);

  return normal.normalize();
};

// novo: soma duas cores (para a luz emitida)
const addColors = (color1, color2) => {
  return {
    r: clamp(color1.r + color2.r, 0, 255),
    g: clamp(color1.g + color2.g, 0, 255),
    b: clamp(color1.b + color2.b, 0, 255),
    a: 255,
  };
};

// novo: tangente e bitangente do triângulo: em que direção do espaço o u e o v da textura crescem.
// O normal map guarda a normal de cada pixel nessas direções (r: tangente, g: bitangente, b: normal)
const calculateTangents = (vertex0, vertex1, vertex2) => {
  const edge1 = vertex1.world.sub(vertex0.world);
  const edge2 = vertex2.world.sub(vertex0.world);
  const [u0, v0] = vertex0.textureCoodinates;
  const [u1, v1] = vertex1.textureCoodinates;
  const [u2, v2] = vertex2.textureCoodinates;

  const du1 = u1 - u0, dv1 = v1 - v0;
  const du2 = u2 - u0, dv2 = v2 - v0;
  const r = 1 / (du1 * dv2 - du2 * dv1);
  if (!isFinite(r)) return null;

  return {
    tangent: edge1.prod(dv2 * r).sub(edge2.prod(dv1 * r)).normalize(),
    bitangent: edge2.prod(du1 * r).sub(edge1.prod(du2 * r)).normalize(),
  };
};

const isBiggerEdgeAtLeftSide = (x02, x12) => {
  const midIndex = (x12.length / 2) | 0;
  return x02[midIndex] < x12[midIndex];
};

const buildInterpolatedEdgeValues = (i0, i1, i2, d0, d1, d2) => {
  const i12 = interpolate(i1, i2, d1, d2);
  const i01 = interpolate(i0, i1, d0, d1);
  const i02 = interpolate(i0, i2, d0, d2);

  i01.pop();
  const smaller = [...i01, ...i12];

  return {
    smallEdge: smaller,
    bigEdge: i02,
  };
};

const interpolateVector = (i0, i1, v0, v1) => {
  const v01x = interpolate(i0, i1, v0.x, v1.x);
  const v01y = interpolate(i0, i1, v0.y, v1.y);
  const v01z = interpolate(i0, i1, v0.z, v1.z);

  let resultVectors = [];

  for (let i = 0; i < v01x.length; i++) {
    resultVectors.push(new Vector3f(v01x[i], v01y[i], v01z[i]));
  }

  return resultVectors;
};

const buildInterpolatedEdgeVectors = (i0, i1, i2, v0, v1, v2) => {
  const v12 = interpolateVector(i1, i2, v1, v2);
  const v01 = interpolateVector(i0, i1, v0, v1);
  const v02 = interpolateVector(i0, i2, v0, v2);

  v01.pop();
  const smaller = [...v01, ...v12];

  return {
    smallEdge: smaller,
    bigEdge: v02,
  };
};

// novo: o phong recebe a textura (o material) em vez de uma cor
const fillTriangleShadedPhong = (vertex0, vertex1, vertex2, texture, lights) => {
  [vertex0, vertex1, vertex2] = [vertex0, vertex1, vertex2].sort(
    (v1, v2) => v1.point.y - v2.point.y
  );

  const p0 = vertex0.point;
  const p1 = vertex1.point;
  const p2 = vertex2.point;

  // novo: coordenadas de textura, como no fillTriangleShaded
  const textureUV0 = vertex0.textureCoodinates
  const textureUV1 = vertex1.textureCoodinates
  const textureUV2 = vertex2.textureCoodinates

  // novo: para o normal map, as direções em que u e v crescem neste triângulo
  const tangents = calculateTangents(vertex0, vertex1, vertex2);

  const { bigEdge: x02, smallEdge: x12 } = buildInterpolatedEdgeValues(
    p0.y,
    p1.y,
    p2.y,
    p0.x,
    p1.x,
    p2.x
  );

  const { bigEdge: z02, smallEdge: z12 } = buildInterpolatedEdgeValues(
    p0.y,
    p1.y,
    p2.y,
    1.0 / p0.z,
    1.0 / p1.z,
    1.0 / p2.z
  );

  const { bigEdge: v02, smallEdge: v12 } = buildInterpolatedEdgeVectors(
    p0.y,
    p1.y,
    p2.y,
    vertex0.normal,
    vertex1.normal,
    vertex2.normal
  );

  // novo: u e v divididos por z, como no fillTriangleShaded
  const {bigEdge: texU02, smallEdge: texU12} = buildInterpolatedEdgeValues(
    p0.y,
    p1.y,
    p2.y,
    textureUV0[0] / p0.z,
    textureUV1[0] / p1.z,
    textureUV2[0] / p2.z,
  )

  const {bigEdge: texV02, smallEdge: texV12} = buildInterpolatedEdgeValues(
    p0.y,
    p1.y,
    p2.y,
    textureUV0[1] / p0.z,
    textureUV1[1] / p1.z,
    textureUV2[1] / p2.z,
  )

  // ordena os lados interpolados para iterar da esquerda para a direita
  let xLeft, xRight, zLeft, zRight, vecLeft, vecRight, texULeft, texURight, texVLeft, texVRight;
  if (isBiggerEdgeAtLeftSide(x02, x12)) {
    [xLeft, xRight] = [x02, x12];
    [zLeft, zRight] = [z02, z12];
    [vecLeft, vecRight] = [v02, v12];
    [texULeft, texURight] = [texU02, texU12];
    [texVLeft, texVRight] = [texV02, texV12];
  } else {
    [xLeft, xRight] = [x12, x02];
    [zLeft, zRight] = [z12, z02];
    [vecLeft, vecRight] = [v12, v02];
    [texULeft, texURight] = [texU12, texU02];
    [texVLeft, texVRight] = [texV12, texV02];
  }

  // para cada linha entre p0 e p2
  for (let y = p0.y; y <= p2.y; y++) {
    //  atual indice da linha
    let currentIndex = y - p0.y;

    let [xFloor, xCeiling] = [
      xLeft[currentIndex] | 0,
      xRight[currentIndex] | 0,
    ];

    let [vFloor, vCeiling] = [vecLeft[currentIndex], vecRight[currentIndex]];

    let [zl, zr] = [zLeft[currentIndex], zRight[currentIndex]];

    let zScan = interpolate(xFloor, xCeiling, zl, zr);
    let vectorScan = interpolateVector(xFloor, xCeiling, vFloor, vCeiling);

    // novo: textura
    let [ul, ur]  = [texULeft[currentIndex], texURight[currentIndex]]
    let [vl, vr]  = [texVLeft[currentIndex], texVRight[currentIndex]]
    let uScan = interpolate(xFloor, xCeiling, ul, ur)
    let vScan = interpolate(xFloor, xCeiling, vl, vr)

    for (let x = xFloor; x <= xCeiling; x++) {
      const currentPixel = Math.floor(x - xFloor);

      let currentZ = zScan[currentPixel];

      let oz = 1.0 / currentZ;

      const objX = (x * oz) / PLANE_DISTANCE;
      const objY = (y * oz) / PLANE_DISTANCE;
      const objZ = 1.0 / currentZ;

      const rx = (objX * PLANE_WIDTH) / width;
      const ry = (objY * PLANE_HEIGHT) / height;

      // novo: u e v deste pixel, e o que cada textura diz sobre ele
      const currentU = uScan[currentPixel] / currentZ;
      const currentV = vScan[currentPixel] / currentZ;
      const pixelColor = texture.getTexel(currentU, currentV);
      const specular = texture.getSpecular(currentU, currentV);
      const normal = texture.applyNormalMap(vectorScan[currentPixel], currentU, currentV, tangents);

      let currentLight = calculateLightIntensity(
        new Vector3f(rx, ry, oz),
        new Vector3f(rx, ry, oz),
        normal,
        lights,
        specular.shininess,
        specular.strength
      );

      if (zBufferAccess(x, y) <= currentZ) {
        putPixel(x, y, addColors(multiplyColorScalar(pixelColor, currentLight), texture.getEmissive(currentU, currentV)));
        zBufferWrite(x, y, currentZ);
      }
    }
  }
};

const fillTriangleShaded = (vertex0, vertex1, vertex2, texture,  lights) => {
  [vertex0, vertex1, vertex2] = [vertex0, vertex1, vertex2].sort(
    (v1, v2) => v1.point.y - v2.point.y
  );

  const specular0 = texture.getSpecular(...vertex0.textureCoodinates); // novo
  const lightIntensityP0 = calculateLightIntensity(
    vertex0.point,
    vertex0.world,
    vertex0.normal,
    lights,
    specular0.shininess,
    specular0.strength
  );
  const specular1 = texture.getSpecular(...vertex1.textureCoodinates); // novo
  const lightIntensityP1 = calculateLightIntensity(
    vertex1.point,
    vertex1.world,
    vertex1.normal,
    lights,
    specular1.shininess,
    specular1.strength
  );
  const specular2 = texture.getSpecular(...vertex2.textureCoodinates); // novo
  const lightIntensityP2 = calculateLightIntensity(
    vertex2.point,
    vertex2.world,
    vertex2.normal,
    lights,
    specular2.shininess,
    specular2.strength
  );

  const p0 = vertex0.point;
  const p1 = vertex1.point;
  const p2 = vertex2.point;

  const textureUV0 = vertex0.textureCoodinates
  const textureUV1 = vertex1.textureCoodinates
  const textureUV2 = vertex2.textureCoodinates

  const { bigEdge: x02, smallEdge: x12 } = buildInterpolatedEdgeValues(
    p0.y,
    p1.y,
    p2.y,
    p0.x,
    p1.x,
    p2.x
  );

  const { bigEdge: z02, smallEdge: z12 } = buildInterpolatedEdgeValues(
    p0.y,
    p1.y,
    p2.y,
    1.0 / p0.z,
    1.0 / p1.z,
    1.0 / p2.z
  );

  const { bigEdge: light02, smallEdge: light12 } = buildInterpolatedEdgeValues(
    p0.y,
    p1.y,
    p2.y,
    lightIntensityP0,
    lightIntensityP1,
    lightIntensityP2
  );

  const {bigEdge: texU02, smallEdge: texU12} = buildInterpolatedEdgeValues(
    p0.y,
    p1.y,
    p2.y,
    textureUV0[0] / p0.z,
    textureUV1[0] / p1.z,
    textureUV2[0] / p2.z,
  )

  const {bigEdge: texV02, smallEdge: texV12} = buildInterpolatedEdgeValues(
    p0.y,
    p1.y,
    p2.y,
    textureUV0[1] / p0.z,
    textureUV1[1] / p1.z,
    textureUV2[1] / p2.z,
  )

  // ordena os lados interpolados para iterar da esquerda para a direita
  let xLeft, xRight, zLeft, zRight, lightLeft, lightRight, texULeft, texURight, texVLeft, texVRight;
  if (isBiggerEdgeAtLeftSide(x02, x12)) {
    [xLeft, xRight] = [x02, x12];
    [zLeft, zRight] = [z02, z12];
    // light
    [lightLeft, lightRight] = [light02, light12];
    // uv coordinates
    [texULeft, texURight] = [texU02, texU12];
    [texVLeft, texVRight] = [texV02, texV12];
  } else {
    [xLeft, xRight] = [x12, x02];
    [zLeft, zRight] = [z12, z02];
    //light
    [lightLeft, lightRight] = [light12, light02];
    // uv coordinates texture
    [texULeft, texURight] = [ texU12, texU02];
    [texVLeft, texVRight] = [ texV12, texV02,];
  }

  // para cada linha entre p0 e p2
  for (let y = p0.y; y <= p2.y; y++) {
    //  atual indice da linha
    let currentIndex = y - p0.y;

    // let {lineBegin: minX, lineEnd: maxY} = triangleEdgePointsByLineIndex()
    // let {lineBegin: minLight, lineEnd: maxLight} = triangleEdgePointsByLineIndex()

    let [xFloor, xCeiling] = [
      xLeft[currentIndex] | 0,
      xRight[currentIndex] | 0,
    ];

    let [lightFloor, lightCeiling] = [
      lightLeft[currentIndex],
      lightRight[currentIndex],
    ];

    let [zl, zr] = [zLeft[currentIndex], zRight[currentIndex]];
    // texture
    let [ul, ur]  = [texULeft[currentIndex], texURight[currentIndex]]
    let [vl, vr]  = [texVLeft[currentIndex], texVRight[currentIndex]]

    let zScan = interpolate(xFloor, xCeiling, zl, zr);
    let lightScan = interpolate(xFloor, xCeiling, lightFloor, lightCeiling);


    let uScan = interpolate(xFloor, xCeiling, ul, ur)
    let vScan = interpolate(xFloor, xCeiling, vl, vr)

    for (let x = xFloor; x <= xCeiling; x++) {
      const currentPixel = Math.floor(x - xFloor);

      let currentZ = zScan[currentPixel];
      let currentLight = lightScan[currentPixel];

      // textura u[0, 1] v[0, 1]
      let currentU = uScan[currentPixel]
      let currentV = vScan[currentPixel]


      let pixelColor = texture.getTexel(currentU / currentZ, currentV / currentZ);

      if (zBufferAccess(x, y) <= currentZ) {
        // novo: a luz emitida (emissivo) soma depois da iluminação
        putPixel(x, y, addColors(multiplyColorScalar(pixelColor, currentLight), texture.getEmissive(currentU / currentZ, currentV / currentZ)));
        zBufferWrite(x, y, currentZ);
      }
    }
  }
};

const cullTriangles = (meshes, worldVertices, renderedCamera) => {
  return meshes.filter((mesh) => {
    let triangle = {
      a: new Vector3f(
        worldVertices[mesh.vertices[0]].x,
        worldVertices[mesh.vertices[0]].y,
        worldVertices[mesh.vertices[0]].z
      ),
      b: new Vector3f(
        worldVertices[mesh.vertices[1]].x,
        worldVertices[mesh.vertices[1]].y,
        worldVertices[mesh.vertices[1]].z
      ),
      c: new Vector3f(
        worldVertices[mesh.vertices[2]].x,
        worldVertices[mesh.vertices[2]].y,
        worldVertices[mesh.vertices[2]].z
      ),
    };

    let AB = triangle.b.sub(triangle.a);
    let AC = triangle.c.sub(triangle.a);

    let triangleNormal = AB.cross(AC);

    let ABtoCamera = renderedCamera.sub(triangle.a);

    let angleWithCamera = ABtoCamera.dot(triangleNormal);

    if (angleWithCamera > 0) {
      return mesh;
    }
  });
};


const PLANE_DISTANCE = 1;
const PLANE_WIDTH = width / height; // novo: o canvas não é quadrado
const PLANE_HEIGHT = 1;

const viewPortToCanvas = ({ x, y, z }) => {
  return {
    x: Math.floor(x * (width / PLANE_WIDTH)),
    y: Math.floor(y * (height / PLANE_HEIGHT)),
    z: z,
  };
};

/**
 * TODO:
 * Migrate this cube object definition to a separate file, where this can be instantiated as it wills.
 * Also, it should create a sphere so gourad for spheres with proper normals could be properly rendered
 */


// novo: a cena é preenchida quando o modelo e as texturas terminam de carregar (no fim do arquivo)
let sceneInstances = [];

let camera = {
  position: new Vector3f(0, 0, 0),
  orientation: new Matrix4().RotateY(new Vector3f(0, 0, 0)),
};

const render =  (texture) => {
  sceneInstances.forEach((instance) => {
    const projectedVertices = [];
    const worldVertices = [];
    const { meshes } = instance.model;
    // novo: as normais giram junto com o modelo
    const normalRotation = new Matrix4().RotateY(instance.transform.rotation);

    instance.model.vertices.forEach((vertex) => {
      const { position, scale, rotation } = instance.transform;
      const scaling = new Matrix4().Scale(scale);
      const rotating = new Matrix4().RotateY(rotation);
      const translating = new Matrix4().Translate(position);
      const projecting = new Matrix4().Projection(PLANE_DISTANCE);

      const worldCoordinates = translating
        .multM(rotating.multM(scaling))
        .multV(vertex);
      worldVertices.push(worldCoordinates);

      const projectedVertex = projecting.multV(worldCoordinates);

      projectedVertices.push(projectedVertex.toVector3f());
    });

    const culledMesh = cullTriangles(meshes, worldVertices, camera.position);

    culledMesh.forEach((mesh) => {
      // novo: a câmera não enxerga nada atrás dela; um triângulo que passa por trás seria projetado errado
      const isBehindCamera = mesh.vertices.some((index) => worldVertices[index].z < NEAR);
      if (isBehindCamera) return;

      // novo: um triângulo todo fora da tela (como as casas do chão embaixo da câmera) não precisa ser preenchido
      const canvasPoints = mesh.vertices.map((index) => viewPortToCanvas(projectedVertices[index]));
      const isLeftOfCanvas = canvasPoints.every((point) => point.x < -width / 2);
      const isRightOfCanvas = canvasPoints.every((point) => point.x > width / 2);
      const isBelowCanvas = canvasPoints.every((point) => point.y < -height / 2);
      const isAboveCanvas = canvasPoints.every((point) => point.y > height / 2);
      if (isLeftOfCanvas || isRightOfCanvas || isBelowCanvas || isAboveCanvas) return;

      // novo: no FLAT, os três vértices usam a normal da face (como no flat-shading.js),
      // então a luz é a mesma no triângulo inteiro
      const faceNormal = calculateFaceNormal(
        worldVertices[mesh.vertices[0]],
        worldVertices[mesh.vertices[1]],
        worldVertices[mesh.vertices[2]]
      );
      const vertexNormal = (corner) =>
        RENDERING === "FLAT" ? faceNormal : normalRotation.multV(mesh.normals[corner]);

      if (RENDERING === "PHONG") {
        fillTriangleShadedPhong(
          {
            point: viewPortToCanvas({
              x: projectedVertices[mesh.vertices[0]].x,
              y: projectedVertices[mesh.vertices[0]].y,
              z: projectedVertices[mesh.vertices[0]].z,
            }),
            world: worldVertices[mesh.vertices[0]],
            normal: vertexNormal(0),
            textureCoodinates: mesh.textureCoords[0]
          },
          {
            point: viewPortToCanvas({
              x: projectedVertices[mesh.vertices[1]].x,
              y: projectedVertices[mesh.vertices[1]].y,
              z: projectedVertices[mesh.vertices[1]].z,
            }),
            world: worldVertices[mesh.vertices[1]],
            normal: vertexNormal(1),
            textureCoodinates: mesh.textureCoords[1]
          },
          {
            point: viewPortToCanvas({
              x: projectedVertices[mesh.vertices[2]].x,
              y: projectedVertices[mesh.vertices[2]].y,
              z: projectedVertices[mesh.vertices[2]].z,
            }),
            world: worldVertices[mesh.vertices[2]],
            normal: vertexNormal(2),
            textureCoodinates: mesh.textureCoords[2]
          },
          instance.texture,
          lights
        );
      } else {
        fillTriangleShaded(
          {
            point: viewPortToCanvas({
              x: projectedVertices[mesh.vertices[0]].x,
              y: projectedVertices[mesh.vertices[0]].y,
              z: projectedVertices[mesh.vertices[0]].z,
            }),
            world: worldVertices[mesh.vertices[0]],
            normal: vertexNormal(0),
            textureCoodinates: mesh.textureCoords[0]
          },
          {
            point: viewPortToCanvas({
              x: projectedVertices[mesh.vertices[1]].x,
              y: projectedVertices[mesh.vertices[1]].y,
              z: projectedVertices[mesh.vertices[1]].z,
            }),
            world: worldVertices[mesh.vertices[1]],
            normal: vertexNormal(1),
            textureCoodinates: mesh.textureCoords[1]
          },
          {
            point: viewPortToCanvas({
              x: projectedVertices[mesh.vertices[2]].x,
              y: projectedVertices[mesh.vertices[2]].y,
              z: projectedVertices[mesh.vertices[2]].z,
            }),
            world: worldVertices[mesh.vertices[2]],
            normal: vertexNormal(2),
            textureCoodinates: mesh.textureCoords[2]
          },
          instance.texture,
          lights
        );
      }
    });
  });
};

const NEAR = 0.3; // novo: distância mínima da câmera para um vértice ser desenhado

// ---------------------------------------------------------------------------------------------
// novo: material. Junta as texturas do modelo; cada uma muda uma parte da cor de um pixel.
// Ele tem o mesmo getTexel de uma textura, então o fillTriangleShaded o usa sem mudar nada.

const TEXTURES = [
  { key: "base", file: "Sting_Base_Color.png", label: "Cor base" },
  { key: "ao", file: "Sting_Mixed_AO.png", label: "Oclusão de ambiente" },
  { key: "normal", file: "Sting_Normal.png", label: "Normal map", note: "OpenGL, só no Phong" },
  { key: "normalDX", file: "Sting_Normal_DirectX.png", label: "Normal map", note: "DirectX, só no Phong" },
  { key: "metallic", file: "Sting_Metallic.png", label: "Metálico" },
  { key: "roughness", file: "Sting_Roughness.png", label: "Rugosidade" },
  { key: "height", file: "Sting_Height.png", label: "Altura", note: "cavidades" },
  { key: "emissive", file: "Sting_Emissive.png", label: "Emissivo", note: "brilho élfico" },
];

// quais texturas estão ligadas (os checkboxes mudam isso)
const enabledTextures = {
  base: true,
  ao: true,
  normal: true,
  normalDX: false,
  metallic: true,
  roughness: true,
  height: false,
  emissive: false,
};

const GRAY = { r: 180, g: 180, b: 180, a: 255 };
const BLACK = { r: 0, g: 0, b: 0, a: 255 };

class Material {
  constructor(textures, followsCheckboxes = true) {
    this.textures = textures; // { base, ao, normal, ... }: as texturas que este material tem
    this.followsCheckboxes = followsCheckboxes; // o chão não segue os checkboxes da espada
  }

  isOn(key) {
    const isEnabled = this.followsCheckboxes ? enabledTextures[key] : true;
    return this.textures[key] && isEnabled;
  }

  // a cor da superfície: a cor base, escurecida pela oclusão de ambiente e pelas cavidades
  getTexel(u, v) {
    let color = this.isOn("base") ? this.textures.base.getTexel(u, v) : GRAY;
    if (this.isOn("ao")) {
      color = multiplyColorScalar(color, this.textures.ao.getTexel(u, v).r / 255);
    }
    if (this.isOn("height")) {
      color = multiplyColorScalar(color, 0.55 + (0.45 * this.textures.height.getTexel(u, v).r) / 255);
    }
    return color;
  }

  // a luz que a própria superfície emite (as runas da Sting)
  getEmissive(u, v) {
    return this.isOn("emissive") ? this.textures.emissive.getTexel(u, v) : BLACK;
  }

  // rugosidade espalha o reflexo (expoente menor); metálico deixa o reflexo mais forte
  getSpecular(u, v) {
    const roughness = this.isOn("roughness") ? this.textures.roughness.getTexel(u, v).r / 255 : 0.5;
    const metallic = this.isOn("metallic") ? this.textures.metallic.getTexel(u, v).r / 255 : 0;
    return {
      shininess: 4 + (1 - roughness) * (1 - roughness) * 400,
      strength: 0.3 + 1.5 * metallic,
    };
  }

  // a normal do normal map está nas direções da textura (tangente, bitangente, normal);
  // passamos ela para o espaço da cena
  applyNormalMap(normal, u, v, tangents) {
    const key = this.isOn("normal") ? "normal" : this.isOn("normalDX") ? "normalDX" : null;
    if (!key || !tangents) return normal;

    const texel = this.textures[key].getTexel(u, v);
    const x = texel.r / 127.5 - 1;
    // o v da imagem cresce para baixo; no padrão OpenGL o verde aponta para cima, no DirectX para baixo
    const y = (texel.g / 127.5 - 1) * (key === "normal" ? -1 : 1);
    const z = texel.b / 127.5 - 1;

    const n = new Vector3f(normal.x, normal.y, normal.z).normalize();
    return tangents.tangent.prod(x).add(tangents.bitangent.prod(y)).add(n.prod(z)).normalize();
  }
}

// ---------------------------------------------------------------------------------------------
// novo: interface. A câmera fica sempre na origem olhando para +z (como em todos os capítulos):
// andar é mover a cena no sentido contrário, e girar é girar a espada e o chão em volta da espada.

const ASSETS = "/assets/3d_objs/sting-sword/";
const statusLabel = document.getElementById("status");
const STEP = 0.35;
const TURN = Math.PI / 12;
let sword, ground, pending;

const draw = () => {
  if (!sword) return;
  statusLabel.textContent = "renderizando…";
  clearTimeout(pending);
  // espera um instante para o "renderizando…" aparecer antes de a CPU ficar ocupada
  pending = setTimeout(() => {
    const renderStart = performance.now();
    zBuffer.fill(0); // o z-buffer começa vazio a cada quadro
    clear();
    render();
    blit();
    const renderTime = Math.round(performance.now() - renderStart);
    const renderingName = { FLAT: "Flat", GOURAD: "Gouraud", PHONG: "Phong" }[RENDERING];
    statusLabel.textContent = `${renderingName} · ${renderTime} ms`;
  }, 30);
};

const move = (dx, dz) => {
  for (const instance of sceneInstances) {
    instance.transform.position = instance.transform.position.add(new Vector3f(dx, 0, dz));
  }
  draw();
};

const MOVES = {
  forward: () => move(0, -STEP),
  back: () => move(0, STEP),
  left: () => move(STEP, 0),
  right: () => move(-STEP, 0),
};

const turn = (sign) => {
  for (const instance of sceneInstances) {
    instance.transform.rotation = new Vector3f(0, instance.transform.rotation.y + sign * TURN, 0);
  }
  draw();
};

const resetScene = () => {
  sword.transform = {
    position: new Vector3f(0, -0.15, 3.3),
    scale: new Vector3f(0.04, 0.04, 0.04), // a espada tem ~60 unidades no arquivo
    rotation: new Vector3f(0, 0.7, 0),
  };
  ground.transform = {
    position: new Vector3f(0, -1.25, 3.3), // o chão fica centrado embaixo da espada
    scale: new Vector3f(1, 1, 1),
    rotation: new Vector3f(0, 0.7, 0),
  };
  draw();
};

document.querySelectorAll("[data-move]").forEach((button) => {
  button.onclick = MOVES[button.dataset.move];
});
document.querySelectorAll("[data-turn]").forEach((button) => {
  button.onclick = () => turn(Number(button.dataset.turn));
});
document.getElementById("reset").onclick = resetScene;
document.getElementById("shading").onchange = (event) => {
  RENDERING = event.target.value;
  draw();
};
document.getElementById("panel-toggle").onclick = () => {
  document.getElementById("panel").classList.toggle("open");
};

addEventListener("keydown", (event) => {
  const keys = { w: "forward", arrowup: "forward", s: "back", arrowdown: "back", a: "left", arrowleft: "left", d: "right", arrowright: "right" };
  const key = event.key.toLowerCase();
  if (keys[key]) MOVES[keys[key]]();
  else if (key === "q") turn(-1);
  else if (key === "e") turn(1);
  else return;
  event.preventDefault();
});

// um checkbox por textura; os dois normal maps são a mesma coisa em padrões diferentes, então só um por vez
const textureList = document.getElementById("textures");
for (const texture of TEXTURES) {
  const label = document.createElement("label");
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = enabledTextures[texture.key];
  checkbox.dataset.key = texture.key;
  checkbox.onchange = () => {
    enabledTextures[texture.key] = checkbox.checked;
    const other = { normal: "normalDX", normalDX: "normal" }[texture.key];
    if (other && checkbox.checked) {
      enabledTextures[other] = false;
      textureList.querySelector(`[data-key="${other}"]`).checked = false;
    }
    draw();
  };
  label.append(checkbox, ` ${texture.label} `);
  if (texture.note) {
    const note = document.createElement("small");
    note.textContent = `(${texture.note})`;
    label.append(note);
  }
  textureList.append(label);
}

// carrega o modelo e as texturas (versões de 512px em web/), monta a cena e desenha
Promise.all([
  fetch(ASSETS + "Sting-Sword-lowpoly.obj").then((response) => response.text()),
  ...TEXTURES.map((texture) =>
    new Texture(ASSETS + "web/" + texture.file).loadImage().then((loaded) => [texture.key, loaded])
  ),
])
  .then(([obj, ...loadedTextures]) => {
    const model = parseOBJ(obj);
    console.log(`Sting: ${model.vertices.length} vértices, ${model.meshes.length} triângulos`);

    sword = { model, texture: new Material(Object.fromEntries(loadedTextures)) };
    ground = { model: createGround(14), texture: new Material({ base: checkerTexture }, false) };
    sceneInstances = [ground, sword];
    resetScene();
  })
  .catch((error) => {
    statusLabel.textContent = "erro ao carregar";
    console.error(error);
  });
