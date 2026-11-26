// O cubo com textura do capítulo de texturas, agora pelo WebGL2 na CPU (o webgl2-cpu.js, na outra aba).
// O cubo, as instâncias da cena e o laço de desenho são os mesmos dos outros capítulos;
// o que muda é o render: em vez de preencher os triângulos, ele chama o WebGL.
// Sem luz: o vertex shader leva cada vértice para a tela e o fragment shader só lê a cor da textura.
import { createContext, texture } from "./webgl2-cpu.js";

class Matrix4 {
  // novo: a matriz pode nascer das suas linhas (é assim que o shader recebe um uniform mat4)
  constructor(
    body = [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]
  ) {
    this.body = body;
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

  // novo: a projeção do WebGL. É a nossa Projection, com duas mudanças:
  //  - x e y saem divididos pela metade do plano de projeção, então o que aparece na tela fica entre -1 e 1
  //  - z sai entre -1 (no near) e 1 (no far) depois da divisão por w, para o teste de profundidade
  // w continua sendo o z do ponto: a GPU divide x, y e z por ele
  Perspective(planeDistance, planeWidth, planeHeight, near, far) {
    this.body = [
      [(2 * planeDistance) / planeWidth, 0, 0, 0],
      [0, (2 * planeDistance) / planeHeight, 0, 0],
      [0, 0, (far + near) / (far - near), (-2 * far * near) / (far - near)],
      [0, 0, 1, 0],
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

class Vector3f extends Vector {}
class Vector4f extends Vector {}

// novo: no shader, um vec3 é uma lista de três números
const vec3 = ([x, y, z]) => new Vector3f(x, y, z);

// o cubo dos outros capítulos; cada triângulo diz de que parte da textura em cruz ele sai
const cube = {
  vertices: [
    { x: -1, y: 1, z: -1 }, // a 0
    { x: 1, y: 1, z: -1 }, // b 1
    { x: 1, y: -1, z: -1 }, // c 2
    { x: -1, y: -1, z: -1 }, // d 3
    { x: -1, y: 1, z: 1 }, // e 4
    { x: 1, y: 1, z: 1 }, // f 5
    { x: 1, y: -1, z: 1 }, // g 6
    { x: -1, y: -1, z: 1 }, // h 7
  ],
  meshes: [
    {
      // abd: frente
      vertices: [0, 1, 3],
      textureCoords: [
        [0.25, 0.333],
        [0.5, 0.333],
        [0.25, 0.666],
      ],
    },
    {
      // bcd
      vertices: [1, 2, 3],
      textureCoords: [
        [0.5, 0.333],
        [0.5, 0.666],
        [0.25, 0.666],
      ],
    },
    {
      // bgc: direita
      vertices: [1, 6, 2],
      textureCoords: [
        [0.5, 0.333],
        [0.75, 0.666],
        [0.5, 0.666],
      ],
    },
    {
      // bfg
      vertices: [1, 5, 6],
      textureCoords: [
        [0.5, 0.333],
        [0.75, 0.333],
        [0.75, 0.666],
      ],
    },
    {
      // eah: esquerda
      vertices: [4, 0, 7],
      textureCoords: [
        [0, 0.333],
        [0.25, 0.333],
        [0, 0.666],
      ],
    },
    {
      // adh
      vertices: [0, 3, 7],
      textureCoords: [
        [0.25, 0.333],
        [0.25, 0.666],
        [0, 0.666],
      ],
    },
    {
      // dch: baixo
      vertices: [3, 2, 7],
      textureCoords: [
        [0.25, 0.666],
        [0.5, 0.666],
        [0.25, 1],
      ],
    },
    {
      // hcg
      vertices: [7, 2, 6],
      textureCoords: [
        [0.25, 1],
        [0.5, 0.666],
        [0.5, 1],
      ],
    },
    {
      // aeb: cima
      vertices: [0, 4, 1],
      textureCoords: [
        [0.25, 0.333],
        [0.25, 0],
        [0.5, 0.333],
      ],
    },
    {
      // efb
      vertices: [4, 5, 1],
      textureCoords: [
        [0.25, 0],
        [0.5, 0],
        [0.5, 0.333],
      ],
    },
    {
      // feh: trás
      vertices: [5, 4, 7],
      textureCoords: [
        [0.75, 0.333],
        [1, 0.333],
        [1, 0.666],
      ],
    },
    {
      // fhg
      vertices: [5, 7, 6],
      textureCoords: [
        [0.75, 0.333],
        [1, 0.666],
        [0.75, 0.666],
      ],
    },
  ],
};

const instance = {
  model: cube,
  transform: {
    position: new Vector3f(0, -1.3, 7), // um pouco abaixo da câmera, para vermos a face de cima
    scale: new Vector3f(1, 1, 1),
    rotation: new Vector3f(0, 1, 0),
  },
};

let sceneInstances = [instance];

// ---------------------------------------------------------------------------------------------
// os shaders

const vertexShader = ({ aPosition, aTexCoord }, u) => {
  const position = new Matrix4(u.uModel).multV(vec3(aPosition)); // o vértice na cena
  const clip = new Matrix4(u.uProjection).multV(position);

  return {
    gl_Position: [clip.x, clip.y, clip.z, clip.w],
    vTexCoord: aTexCoord,
  };
};

const fragmentShader = ({ vTexCoord }, u) => texture(u.uTexture, vTexCoord);

// ---------------------------------------------------------------------------------------------
// daqui para baixo, só chamadas do WebGL

const canvas = document.getElementById("canvas");
const gl = createContext(canvas); // na GPU de verdade: canvas.getContext("webgl2")

const compileShader = (type, source) => {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
};

const program = gl.createProgram();
gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vertexShader));
gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fragmentShader));
gl.linkProgram(program);
gl.useProgram(program);

const PLANE_DISTANCE = 1;
const PLANE_WIDTH = canvas.width / canvas.height;
const PLANE_HEIGHT = 1;
const NEAR = 0.3;
const FAR = 100;
const projection = new Matrix4().Perspective(PLANE_DISTANCE, PLANE_WIDTH, PLANE_HEIGHT, NEAR, FAR);

gl.uniformMatrix4fv(gl.getUniformLocation(program, "uProjection"), true, projection.body.flat()); // true: linha por linha
gl.uniform1i(gl.getUniformLocation(program, "uTexture"), 0); // o sampler lê a unidade de textura 0

gl.clearColor(1, 1, 1, 1);
gl.enable(gl.DEPTH_TEST);
gl.enable(gl.CULL_FACE);
gl.frontFace(gl.CW); // nos nossos modelos, a frente do triângulo tem os vértices em sentido horário na tela

// os triângulos do modelo viram listas de números, uma por atributo, com três vértices por triângulo,
// e o vertex array diz de qual buffer sai cada atributo
const uploadModel = (instance) => {
  const positions = [];
  const texCoords = [];
  for (const mesh of instance.model.meshes) {
    for (let i = 0; i < 3; i++) {
      const vertex = instance.model.vertices[mesh.vertices[i]];
      positions.push(vertex.x, vertex.y, vertex.z);
      texCoords.push(...mesh.textureCoords[i]);
    }
  }

  instance.vertexArray = gl.createVertexArray();
  gl.bindVertexArray(instance.vertexArray);

  const attribute = (name, values, size) => {
    const location = gl.getAttribLocation(program, name);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(values), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
  };
  attribute("aPosition", positions, 3);
  attribute("aTexCoord", texCoords, 2);
};

// o render de sempre: cada instância com a sua matriz (escala, rotação e posição)
const render = () => {
  sceneInstances.forEach((instance) => {
    const { position, scale, rotation } = instance.transform;
    const scaling = new Matrix4().Scale(scale);
    const rotating = new Matrix4().RotateY(rotation);
    const translating = new Matrix4().Translate(position);
    const model = translating.multM(rotating.multM(scaling));

    gl.uniformMatrix4fv(gl.getUniformLocation(program, "uModel"), true, model.body.flat());
    gl.bindVertexArray(instance.vertexArray);
    gl.drawArrays(gl.TRIANGLES, 0, instance.model.meshes.length * 3);
  });
};

let i = 1;
const draw = () => {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  render();
  i += 0.01;
  instance.transform.rotation = new Vector3f(0, i, 0);

  requestAnimationFrame(draw);
};

const image = new Image();
image.onload = () => {
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); // sem mipmaps
  sceneInstances.forEach(uploadModel);
  draw();
};
image.src = "/images/rasterizer/texturing/texture-target.png";
