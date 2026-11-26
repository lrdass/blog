
class Matrix4 {
  constructor() {
    this.body = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]
  }

  multV(vector) {
    let matrix = this.body
    let vec = [vector.x, vector.y, vector.z, vector.w]
    if (!vector.w) vec[3] = 1
    let result = []

    for (let i = 0; i < matrix.length; i++) {
      let pos = 0
      for (let j = 0; j < matrix[i].length; j++) {
        pos += matrix[i][j] * vec[j]
      }
      result[i] = pos
    }
    return new Vector4f(result[0], result[1], result[2], result[3])
  }

  multM(matrix) {
    let prevMatrix = this.body;
    let result = new Matrix4()

    for (let i = 0; i < prevMatrix.length; i++) {
      for (let j = 0; j < prevMatrix.length; j++) {
        for (let k = 0; k < prevMatrix.length; k++) {
          result.body[i][j] += prevMatrix[i][k] * matrix.body[k][j]
        }
      }
    }
    this.body = result.body
    return this
  }

  Translate(translation) {
    const { x, y, z } = translation
    this.body = [
      [1, 0, 0, x],
      [0, 1, 0, y],
      [0, 0, 1, z],
      [0, 0, 0, 1],
    ]
    return this
  }

  Scale(scale) {
    const { x, y, z } = scale
    this.body = [
      [x, 0, 0, 0],
      [0, y, 0, 0],
      [0, 0, z, 0],
      [0, 0, 0, 1],
    ]
    return this
  }

  RotateY(rotationVector) {
    const { y: angle } = rotationVector

    this.body = [
      [Math.cos(angle), 0, Math.sin(angle), 0],
      [0, 1, 0, 0],
      [-Math.sin(angle), 0, Math.cos(angle), 0],
      [0, 0, 0, 1],
    ]
    return this
  }

  Projection(planeDistance) {
    this.body = [
      [planeDistance, 0, 0, 0],
      [0, planeDistance, 0, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
    ]
    return this
  }

  Transpose(){
    for(let i = 0; i < 4; i++){
      for (let j = 0; j < 4; j++) {
        this.body[i][j] = this.body[j][i]
      }
    }

    return this
  }



}
// Matrix4.Projection(plane_distance).mult(vector)
//

class Vector {

  constructor(x, y, z, w) {
    this.x = x
    this.y = y
    this.z = z
    this.w = w
  }


  sub(vector) {
    return new Vector3f(this.x - vector.x,
      this.y - vector.y,
      this.z - vector.z)
  }

  add(vector){
    return new Vector3f(this.x + vector.x,
      this.y + vector.y,
      this.z + vector.z)
  }

  dot(vector) {
    return this.x * vector.x +
      this.y * vector.y +
      this.z * vector.z
  }

  cross(vector) {
    return new Vector3f(
      this.y * vector.z - this.z * vector.y,
      this.z * vector.x - this.x * vector.z,
      this.x * vector.y - this.y * vector.x
    )
  }

  prod(scalar){
    return new Vector3f(this.x * scalar, this.y * scalar, this.z * scalar)
  }

  div(scalar) {
    return new Vector3f(this.x / scalar, this.y / scalar, this.z / scalar)
  }

  unit() {
    return new Vector3f(0, 0, 0)
  }

  magnitude() {
    return Math.sqrt(
      this.x * this.x +
      this.y * this.y +
      this.z * this.z);
  }

  normalize() {
    return this.div(this.magnitude())
  }
}

class Vector2f extends Vector {

  super(x, y) {
    this.x = x
    this.y = y
  }
}

class Vector3f extends Vector {

  super(x, y, z) {
    this.x = x
    this.y = y
    this.z = z
  }
}
class Vector4f extends Vector {
  super(x, y, z, w) {
    this.x = x
    this.y = y
    this.z = z
    this.w = w
  }

  toVector3f() {
    return new Vector3f(this.x / this.w, this.y / this.w, this.z)
  }
  toVector2f() {
    return new Vector2f(this.x / this.w, this.y / this.w,)
  }

}



const RED = { r: 255, g: 0, b: 0, a: 255 };
const BLUE = { r: 0, g: 0, b: 255, a: 255 };
const GREEN = { r: 0, g: 255, b: 0, a: 255 };
const YELLOW = { r: 225, g: 225, b: 0, a: 255 };
const PINK = { r: 255, g: 0, b: 255, a: 255 };
const CYAN = { r: 0, g: 255, b: 255, a: 255 };

const generateSphere = (divs, color) => {
  let vertices = [];
  let meshes = [];

  let delta_angle = (2.0 * Math.PI) / divs;

  // Generate vertices and normals.
  for (let d = 0; d < divs + 1; d++) {
    let y = (2.0 / divs) * (d - divs / 2);
    let radius = Math.sqrt(1.0 - y * y);
    for (let i = 0; i < divs; i++) {
      const vertex = new Vector3f(
        radius * Math.cos(i * delta_angle),
        y,
        radius * Math.sin(i * delta_angle)
      );
      vertices.push(vertex);
    }
  }

  // Generate triangles.
  for (let d = 0; d < divs; d++) {
    for (let i = 0; i < divs; i++) {
      let i0 = d * divs + i;
      let i1 = (d + 1) * divs + ((i + 1) % divs);
      let i2 = divs * d + ((i + 1) % divs);
      let tri0 = [i0, i1, i2];
      let tri1 = [i0, i0 + divs, i1];

      meshes.push({
        vertices: tri0,
        normals: [vertices[tri0[0]], vertices[tri0[1]], vertices[tri0[2]]],
        color,
      });

      meshes.push({
        vertices: tri1,
        normals: [vertices[tri1[0]], vertices[tri1[1]], vertices[tri1[2]]],
        color,
      });
    }
  }

  return {
    vertices,
    meshes,
  };
};

const cube = {
  vertices: [
    { x: -1, y: 1, z: -1 }, // a  0
    { x: 1, y: 1, z: -1 }, // b  1
    { x: 1, y: -1, z: -1 }, // c  2
    { x: -1, y: -1, z: -1 }, // d 3
    { x: -1, y: 1, z: 1 }, // e 4
    { x: 1, y: 1, z: 1 }, // f   5
    { x: 1, y: -1, z: 1 }, // g   6
    { x: -1, y: -1, z: 1 }, //h   7
  ],
  meshes: [
    {
      // abd
      vertices: [0, 1, 3],
      color: CYAN,
      normals: [
        new Vector3f(0, 0, -1),
        new Vector3f(0, 0, -1),
        new Vector3f(0, 0, -1),
      ],
    },
    {
      //bcd
      vertices: [1, 2, 3],
      color: CYAN,
      normals: [
        new Vector3f(0, 0, -1),
        new Vector3f(0, 0, -1),
        new Vector3f(0, 0, -1),
      ],
    },
    {
      //bgc
      vertices: [1, 6, 2],
      color: PINK,
      normals: [
        new Vector3f(1, 0, 0),
        new Vector3f(1, 0, 0),
        new Vector3f(1, 0, 0),
      ],
    },
    {
      //bfg
      vertices: [1, 5, 6],
      color: PINK,
      normals: [
        new Vector3f(1, 0, 0),
        new Vector3f(1, 0, 0),
        new Vector3f(1, 0, 0),
      ],
    },
    {
      // eah
      vertices: [4, 0, 7],
      color: GREEN,
      normals: [
        new Vector3f(-1, 0, 0),
        new Vector3f(-1, 0, 0),
        new Vector3f(-1, 0, 0),
      ],
    },
    {
      // adh
      vertices: [0, 3, 7],
      color: GREEN,
      normals: [
        new Vector3f(-1, 0, 0),
        new Vector3f(-1, 0, 0),
        new Vector3f(-1, 0, 0),
      ],
    },
    {
      // dch
      vertices: [3, 2, 7],
      color: YELLOW,
      normals: [
        new Vector3f(0, -1, 0),
        new Vector3f(0, -1, 0),
        new Vector3f(0, -1, 0),
      ],
    },
    {
      // hcg
      vertices: [7, 2, 6],
      color: YELLOW,
      normals: [
        new Vector3f(0, -1, 0),
        new Vector3f(0, -1, 0),
        new Vector3f(0, -1, 0),
      ],
    },
    {
      // aeb
      vertices: [0, 4, 1],
      color: RED,
      normals: [
        new Vector3f(0, 1, 0),
        new Vector3f(0, 1, 0),
        new Vector3f(0, 1, 0),
      ],
    },
    {
      // efb
      vertices: [4, 5, 1],
      color: RED,
      normals: [
        new Vector3f(0, 1, 0),
        new Vector3f(0, 1, 0),
        new Vector3f(0, 1, 0),
      ],
    },
    {
      // feh
      vertices: [5, 4, 7],
      color: BLUE,
      normals: [
        new Vector3f(0, 0, 1),
        new Vector3f(0, 0, 1),
        new Vector3f(0, 0, 1),
      ],
    },
    {
      // fhg
      vertices: [5, 7, 6],
      color: BLUE,
      normals: [
        new Vector3f(0, 0, 1),
        new Vector3f(0, 0, 1),
        new Vector3f(0, 0, 1),
      ],
    },
  ],
};



const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");

const width = canvas.width;
const height = canvas.height;

const canvasBuffer = context.getImageData(0, 0, width, height);

const RENDERING = "PHONG";

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
    a: color.a,
  };
};

let lights = [
  {
    type: "POINT",
    position: new Vector3f(80, 2, -10),
    intensity: 0.1,
  },
  {
    type: "DIRECTIONAL",
    intensity: 0.2,
    direction: new Vector3f(3, 0, 1),
  },
  {
    type: "AMBIENT",
    intensity: 0.2,
  },
];

const calculateLightIntensity = (point, worldPoint, vertexNormal, lights) => {
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
      1000
    );

    if (cos_alpha > 0) {
      totalLight += (cos_alpha + reflectiveFactor) * light.intensity;
    }

    // TODO: add reflective component
  });

  return totalLight;
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

const fillTriangleShadedPhong = (vertex0, vertex1, vertex2, color, lights) => {
  [vertex0, vertex1, vertex2] = [vertex0, vertex1, vertex2].sort(
    (v1, v2) => v1.point.y - v2.point.y
  );

  const p0 = vertex0.point;
  const p1 = vertex1.point;
  const p2 = vertex2.point;

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

  // ordena os lados interpolados para iterar da esquerda para a direita
  let xLeft, xRight, zLeft, zRight, vecLeft, vecRight;
  if (isBiggerEdgeAtLeftSide(x02, x12)) {
    [xLeft, xRight] = [x02, x12];
    [zLeft, zRight] = [z02, z12];
    [vecLeft, vecRight] = [v02, v12];
  } else {
    [xLeft, xRight] = [x12, x02];
    [zLeft, zRight] = [z12, z02];
    [vecLeft, vecRight] = [v12, v02];
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

    for (let x = xFloor; x <= xCeiling; x++) {
      const currentPixel = Math.floor(x - xFloor);

      let currentZ = zScan[currentPixel];

      let oz = 1.0 / currentZ;

      const objX = (x * oz) / PLANE_DISTANCE;
      const objY = (y * oz) / PLANE_DISTANCE;
      const objZ = 1.0 / currentZ;

      const rx = (objX * PLANE_WIDTH) / width;
      const ry = (objY * PLANE_HEIGHT) / height;

      let currentLight = calculateLightIntensity(
        new Vector3f(rx, ry, oz),
        new Vector3f(rx, ry, oz),
        vectorScan[currentPixel],
        lights
      );

      if (zBufferAccess(x, y) <= currentZ) {
        putPixel(x, y, multiplyColorScalar(color, currentLight));
        zBufferWrite(x, y, currentZ);
      }
    }
  }
};

const fillTriangleShaded = (vertex0, vertex1, vertex2, color, lights) => {
  [vertex0, vertex1, vertex2] = [vertex0, vertex1, vertex2].sort(
    (v1, v2) => v1.point.y - v2.point.y
  );

  const lightIntensityP0 = calculateLightIntensity(
    vertex0.point,
    vertex0.world,
    vertex0.normal,
    lights
  );
  const lightIntensityP1 = calculateLightIntensity(
    vertex1.point,
    vertex1.world,
    vertex1.normal,
    lights
  );
  const lightIntensityP2 = calculateLightIntensity(
    vertex2.point,
    vertex2.world,
    vertex2.normal,
    lights
  );

  const p0 = vertex0.point;
  const p1 = vertex1.point;
  const p2 = vertex2.point;

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

  // ordena os lados interpolados para iterar da esquerda para a direita
  let xLeft, xRight, zLeft, zRight, lightLeft, lightRight;
  if (isBiggerEdgeAtLeftSide(x02, x12)) {
    [xLeft, xRight] = [x02, x12];
    [zLeft, zRight] = [z02, z12];
    [lightLeft, lightRight] = [light02, light12];
  } else {
    [xLeft, xRight] = [x12, x02];
    [zLeft, zRight] = [z12, z02];
    [lightLeft, lightRight] = [light12, light02];
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

    let zScan = interpolate(xFloor, xCeiling, zl, zr);
    let lightScan = interpolate(xFloor, xCeiling, lightFloor, lightCeiling);

    for (let x = xFloor; x <= xCeiling; x++) {
      const currentPixel = Math.floor(x - xFloor);

      let currentZ = zScan[currentPixel];
      let currentLight = lightScan[currentPixel];

      if (zBufferAccess(x, y) <= currentZ) {
        putPixel(x, y, multiplyColorScalar(color, currentLight));
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

/*
const drawTriangle = (p1, p2, p3, color) => {
  drawLine(p1, p2, color);
  drawLine(p2, p3, color);
  drawLine(p3, p1, color);
};
 */

const PLANE_DISTANCE = 1;
const PLANE_WIDTH = 1;
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

const sphere = generateSphere(16, GREEN);

const instance = {
  model: sphere,
  transform: {
    position: new Vector3f(1.75, 0, 7),
    scale: new Vector3f(1, 1, 1),
    rotation: new Vector3f(0, 1, 0),
  },
};

// const instance2 = {
//   model: cube,
//   transform: {
//     position: new Vector3f(-1, -1, 4),
//     scale: new Vector3f(0.5, 0.5, 0.5),
//     rotation: new Vector3f(0, 2.5, 0),
//   },
// };

let sceneInstances = [instance];

let camera = {
  position: new Vector3f(0, 0, 0),
  orientation: new Matrix4().RotateY(new Vector3f(0, 0, 0)),
};

const render = () => {
  sceneInstances.forEach((instance) => {
    const projectedVertices = [];
    const worldVertices = [];
    const { meshes } = instance.model;

    instance.model.vertices.forEach((vertex) => {
      const { position, scale, rotation } = instance.transform;
      const scaling = new Matrix4().Scale(scale);
      const rotating = new Matrix4().RotateY(rotation);
      const translating = new Matrix4().Translate(position);
      const projecting = new Matrix4().Projection(PLANE_DISTANCE);

      // estou usando no culling os pontos ja projetados
      // deveria usar os pontos tridimensionais e nao os
      const worldCoordinates = translating
        .multM(rotating.multM(scaling))
        .multV(vertex);
      worldVertices.push(worldCoordinates);

      const projectedVertex = projecting.multV(worldCoordinates);

      projectedVertices.push(projectedVertex.toVector3f());
    });

    const culledMesh = cullTriangles(meshes, worldVertices, camera.position);

    culledMesh.forEach((mesh) => {
      if (RENDERING === "PHONG") {
        fillTriangleShadedPhong(
          {
            point: viewPortToCanvas({
              x: projectedVertices[mesh.vertices[0]].x,
              y: projectedVertices[mesh.vertices[0]].y,
              z: projectedVertices[mesh.vertices[0]].z,
            }),
            world: worldVertices[mesh.vertices[0]],
            normal: mesh.normals[0],
          },
          {
            point: viewPortToCanvas({
              x: projectedVertices[mesh.vertices[1]].x,
              y: projectedVertices[mesh.vertices[1]].y,
              z: projectedVertices[mesh.vertices[1]].z,
            }),
            world: worldVertices[mesh.vertices[1]],
            normal: mesh.normals[1],
          },
          {
            point: viewPortToCanvas({
              x: projectedVertices[mesh.vertices[2]].x,
              y: projectedVertices[mesh.vertices[2]].y,
              z: projectedVertices[mesh.vertices[2]].z,
            }),
            world: worldVertices[mesh.vertices[2]],
            normal: mesh.normals[2],
          },
          mesh.color,
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
            normal: mesh.normals[0],
          },
          {
            point: viewPortToCanvas({
              x: projectedVertices[mesh.vertices[1]].x,
              y: projectedVertices[mesh.vertices[1]].y,
              z: projectedVertices[mesh.vertices[1]].z,
            }),
            world: worldVertices[mesh.vertices[1]],
            normal: mesh.normals[1],
          },
          {
            point: viewPortToCanvas({
              x: projectedVertices[mesh.vertices[2]].x,
              y: projectedVertices[mesh.vertices[2]].y,
              z: projectedVertices[mesh.vertices[2]].z,
            }),
            world: worldVertices[mesh.vertices[2]],
            normal: mesh.normals[2],
          },
          mesh.color,
          lights
        );
      }
    });
  });
};

/*
let i = 0;
let last = null;
let second = null;
let rendered = 0;
  const draw = (now) => {
  if (!last) {
    last = now;
  }

  if (now - second > 1000) {
    rendered = 0;
    second = now;
  }

  if (now - last > 30) {
    clear();
    render();
    blit();

    i += 0.01;
    rendered += 1;

    instance.transform.rotation = new Vector3f(0, i, 0);
    instance2.transform.rotation = new Vector3f(0, -1.3 * i, 0);
    last = now;
  }

  requestAnimationFrame(draw);
};

draw();

*/

clear();
render();
blit();
