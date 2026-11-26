// WebGL2 na CPU: um pedaço da API do WebGL2, mas quem desenha é o nosso rasterizador.
// O programa não desenha nada: ele manda dados (buffers, texturas, uniforms) e escolhe os shaders,
// que aqui são funções JavaScript no lugar do texto em GLSL. O resto do caminho é fixo:
//
//   atributos → vertex shader → descarte → divisão por w → viewport → culling →
//   rasterização (interpolando as varyings) → teste de profundidade → fragment shader → pixel
//
// Para usar a GPU de verdade, troca-se createContext(canvas) por canvas.getContext("webgl2")
// e as funções dos shaders por GLSL.

// as mesmas constantes (e os mesmos números) do WebGL2
const GL = {
  DEPTH_BUFFER_BIT: 0x0100,
  COLOR_BUFFER_BIT: 0x4000,
  TRIANGLES: 0x0004,
  CW: 0x0900,
  CCW: 0x0901,
  CULL_FACE: 0x0b44,
  DEPTH_TEST: 0x0b71,
  TEXTURE_2D: 0x0de1,
  TEXTURE0: 0x84c0,
  TEXTURE_MIN_FILTER: 0x2801,
  LINEAR: 0x2601,
  RGBA: 0x1908,
  UNSIGNED_BYTE: 0x1401,
  FLOAT: 0x1406,
  ARRAY_BUFFER: 0x8892,
  STATIC_DRAW: 0x88e4,
  FRAGMENT_SHADER: 0x8b30,
  VERTEX_SHADER: 0x8b31,
  // nomes do estado, para o getParameter
  CURRENT_PROGRAM: 0x8b8d,
  VERTEX_ARRAY_BINDING: 0x85b5,
  ARRAY_BUFFER_BINDING: 0x8894,
  ACTIVE_TEXTURE: 0x84e0,
  TEXTURE_BINDING_2D: 0x8069,
  COLOR_CLEAR_VALUE: 0x0c22,
  FRONT_FACE: 0x0b46,
};

// ---------------------------------------------------------------------------------------------
// o nosso rasterizador, igual ao dos capítulos anteriores

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

// ---------------------------------------------------------------------------------------------
// texturas: cada unidade (TEXTURE0, TEXTURE1...) guarda a textura ligada a ela.
// ponytail: uma GPU por página; as unidades ficam aqui para o texture() dos shaders enxergar

const units = [];
const wrap = (i, size) => ((i % size) + size) % size; // REPEAT: a coordenada dá a volta

// o texture() do GLSL: o getTexel da Sting (filtro bilinear), devolvendo [r, g, b, a] de 0 a 1.
// No shader, um sampler2D é só o número da unidade
export const texture = (unit, [u, v]) => {
  const image = units[unit];
  if (!image?.data) return [0, 0, 0, 1]; // como no WebGL: textura vazia é preta

  const { width: iw, height: ih, data } = image;
  let tx = u * iw;
  let ty = v * ih;
  const fx = tx - Math.floor(tx);
  const fy = ty - Math.floor(ty);
  tx = Math.floor(tx);
  ty = Math.floor(ty);

  const texel = (x, y) => (wrap(y, ih) * iw + wrap(x, iw)) * 4;
  const [TL, TR, BL, BR] = [texel(tx, ty), texel(tx + 1, ty), texel(tx, ty + 1), texel(tx + 1, ty + 1)];

  const color = [];
  for (let i = 0; i < 4; i++) {
    const CT = fx * data[TR + i] + (1 - fx) * data[TL + i];
    const CB = fx * data[BR + i] + (1 - fx) * data[BL + i];
    color.push((fy * CB + (1 - fy) * CT) / 255);
  }
  return color;
};

// ---------------------------------------------------------------------------------------------
// não existe no WebGL: é por aqui que o passo a passo olha a "GPU" trabalhando, como uma ferramenta
// de depuração. onCall roda depois de cada chamada do gl; onDraw roda dentro do drawArrays,
// depois do vertex shader e depois de cada triângulo

export const inspector = { onCall: null, onDraw: null };

// ---------------------------------------------------------------------------------------------
// o contexto: o objeto "gl"

export const createContext = (canvas) => {
  const context = canvas.getContext("2d");
  const { width, height } = canvas;
  const canvasBuffer = context.createImageData(width, height); // começa transparente, como no WebGL
  const zBuffer = Array(width * height).fill(1); // o depth buffer: 0 é o near, 1 é o far
  units.length = 0; // um contexto novo começa sem texturas

  const blit = () => {
    context.putImageData(canvasBuffer, 0, 0);
  };
  blit();

  // o índice de um pixel, com a origem no centro do canvas como no nosso putPixel; -1 se cair fora
  const pixelIndex = (x, y) => {
    const canvasX = (width / 2 + x) | 0;
    const canvasY = (height / 2 - y) | 0;
    if (canvasX < 0 || canvasX >= width || canvasY < 0 || canvasY >= height) return -1;
    return canvasX + canvasY * width;
  };

  // o estado do WebGL: o que está ligado agora
  let program = null;
  const defaultVertexArray = { attributes: [] }; // o WebGL2 já começa com um vertex array
  let vertexArray = defaultVertexArray;
  let arrayBuffer = null;
  let activeUnit = 0;
  let clearColor = [0, 0, 0, 0];
  let frontFace = GL.CCW;
  const enabled = new Set();

  // o nosso fillTriangle (o do Phong), para qualquer lista de valores: cada vértice traz a
  // profundidade, 1/w e cada componente de cada varying dividido por w (como u/z e v/z nas texturas)
  const fillTriangle = (vertices, layout) => {
    const [p0, p1, p2] = vertices.sort((a, b) => a.y - b.y);

    const { bigEdge: x02, smallEdge: x12 } = buildInterpolatedEdgeValues(p0.y, p1.y, p2.y, p0.x, p1.x, p2.x);
    const edges = p0.values.map((_, k) =>
      buildInterpolatedEdgeValues(p0.y, p1.y, p2.y, p0.values[k], p1.values[k], p2.values[k])
    );

    // ordena os lados interpolados para iterar da esquerda para a direita
    const bigAtLeft = isBiggerEdgeAtLeftSide(x02, x12);
    const [xLeft, xRight] = bigAtLeft ? [x02, x12] : [x12, x02];
    const valuesLeft = edges.map((edge) => (bigAtLeft ? edge.bigEdge : edge.smallEdge));
    const valuesRight = edges.map((edge) => (bigAtLeft ? edge.smallEdge : edge.bigEdge));

    let fragments = 0; // pixels pintados
    let hidden = 0; // pixels que perderam no teste de profundidade
    for (let y = p0.y; y <= p2.y; y++) {
      const row = y - p0.y;
      const [xFloor, xCeiling] = [xLeft[row] | 0, xRight[row] | 0];
      const scans = valuesLeft.map((left, k) => interpolate(xFloor, xCeiling, left[row], valuesRight[k][row]));

      for (let x = xFloor; x <= xCeiling; x++) {
        const index = pixelIndex(x, y);
        if (index < 0) continue;
        const i = x - xFloor;
        const depth = scans[0][i];

        // o teste de profundidade vem antes do fragment shader: a GPU também adianta ele quando
        // o shader não mexe na profundidade, e assim não calculamos a luz de um pixel escondido
        if (enabled.has(GL.DEPTH_TEST) && !(depth < zBuffer[index])) {
          hidden++;
          continue;
        }

        // de v/w de volta para v: divide por 1/w
        const oneOverW = scans[1][i];
        const varyings = {};
        let k = 2;
        for (const [name, size] of layout) {
          const components = scans.slice(k, k + (size || 1)).map((scan) => scan[i] / oneOverW);
          varyings[name] = size ? components : components[0];
          k += size || 1;
        }

        const [r, g, b] = program.fragmentShader(varyings, program.uniforms);
        canvasBuffer.data.set([r * 255, g * 255, b * 255, 255], index * 4);
        if (enabled.has(GL.DEPTH_TEST)) zBuffer[index] = depth;
        fragments++;
      }
    }
    return { fragments, hidden };
  };

  // devolve o que aconteceu com o triângulo (para o inspector)
  const drawTriangle = (triangle) => {
    // ponytail: sem recorte de verdade ainda. Como na Sting, um vértice antes do near (ou atrás da
    // câmera) descarta o triângulo inteiro; o recorte contra os planos fica para o capítulo de clipping
    if (triangle.some(({ gl_Position: [, , z, w] }) => z < -w)) return { result: "near" };

    // culling: o mesmo produto vetorial do nosso culling, mas com os pontos já na tela.
    // Pela ordem dos vértices na tela (horário ou anti-horário) sabemos para que lado o triângulo olha
    const ndc = triangle.map(({ gl_Position: [x, y, , w] }) => [x / w, y / w]);
    const [a, b, c] = ndc;
    const area = (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]);
    const isFront = frontFace === GL.CCW ? area > 0 : area < 0;
    if (enabled.has(GL.CULL_FACE) && !isFront) return { result: "culled", ndc };

    // divide por w e leva de -1..1 para os pixels do canvas (o viewport). A profundidade vai de -1..1 para 0..1
    const vertices = triangle.map(({ gl_Position: [x, y, z, w], ...varyings }) => ({
      x: Math.floor((x / w) * (width / 2)),
      y: Math.floor((y / w) * (height / 2)),
      values: [
        (z / w + 1) / 2,
        1 / w,
        ...Object.values(varyings).flatMap((value) =>
          (typeof value === "number" ? [value] : Array.from(value)).map((component) => component / w)
        ),
      ],
    }));

    // como na Sting: um triângulo todo fora da tela não precisa ser preenchido
    if (
      vertices.every((p) => p.x < -width / 2) ||
      vertices.every((p) => p.x > width / 2) ||
      vertices.every((p) => p.y < -height / 2) ||
      vertices.every((p) => p.y > height / 2)
    ) return { result: "offscreen", ndc };

    // o nome e o tamanho de cada varying (0 para um número), para montar de volta no fragment shader
    const { gl_Position, ...varyings } = triangle[0];
    const layout = Object.entries(varyings).map(([name, value]) => [name, typeof value === "number" ? 0 : value.length]);

    return { result: "drawn", ndc, ...fillTriangle(vertices, layout) };
  };

  const gl = {
    ...GL,

    // shaders e programas: no lugar do texto em GLSL, uma função
    createShader: (type) => ({ type }),
    shaderSource: (shader, source) => {
      shader.source = source;
    },
    compileShader: () => {}, // nada para compilar: a função já está pronta
    createProgram: () => ({ attributes: [], uniforms: {} }),
    attachShader: (program, shader) => {
      program[shader.type === GL.VERTEX_SHADER ? "vertexShader" : "fragmentShader"] = shader.source;
    },
    linkProgram: () => {},
    useProgram: (newProgram) => {
      program = newProgram;
    },

    // atributos: um número (location) para cada nome
    getAttribLocation: (program, name) => {
      if (!program.attributes.includes(name)) program.attributes.push(name);
      return program.attributes.indexOf(name);
    },

    // uniforms: um valor por nome, o mesmo para todos os vértices e pixels de um desenho
    getUniformLocation: (program, name) => ({ program, name }),
    uniform1i: ({ program, name }, value) => {
      program.uniforms[name] = value;
    },
    uniform1f: ({ program, name }, value) => {
      program.uniforms[name] = value;
    },
    uniform3fv: ({ program, name }, values) => {
      program.uniforms[name] = Array.from(values);
    },
    // o WebGL recebe a matriz coluna por coluna; transpose = true diz que ela vem linha por linha.
    // O shader recebe as quatro linhas, como o body da nossa Matrix4
    uniformMatrix4fv: ({ program, name }, transpose, values) => {
      program.uniforms[name] = [0, 1, 2, 3].map((i) =>
        [0, 1, 2, 3].map((j) => (transpose ? values[i * 4 + j] : values[j * 4 + i]))
      );
    },

    // buffers: listas de números que ficam na "GPU"
    createBuffer: () => ({}),
    bindBuffer: (target, buffer) => {
      arrayBuffer = buffer;
    },
    bufferData: (target, data) => {
      arrayBuffer.data = data;
    },

    // vertex array: de qual buffer (e como) cada atributo é lido
    createVertexArray: () => ({ attributes: [] }),
    bindVertexArray: (newVertexArray) => {
      vertexArray = newVertexArray ?? defaultVertexArray;
    },
    enableVertexAttribArray: (location) => {
      (vertexArray.attributes[location] ??= {}).enabled = true;
    },
    // stride e offset em bytes, como no WebGL (um FLOAT tem 4 bytes)
    vertexAttribPointer: (location, size, type, normalized, stride, offset) => {
      Object.assign((vertexArray.attributes[location] ??= {}), {
        buffer: arrayBuffer,
        size,
        stride: stride / 4 || size,
        offset: offset / 4,
      });
    },

    // texturas
    createTexture: () => ({}),
    activeTexture: (unit) => {
      activeUnit = unit - GL.TEXTURE0;
    },
    bindTexture: (target, texture) => {
      units[activeUnit] = texture;
    },
    // como o Texture.loadImage: desenha a imagem num canvas para ler os pixels
    texImage2D: (target, level, internalFormat, format, type, image) => {
      const imageCanvas = document.createElement("canvas");
      imageCanvas.width = image.width;
      imageCanvas.height = image.height;
      const imageContext = imageCanvas.getContext("2d");
      imageContext.drawImage(image, 0, 0);
      Object.assign(units[activeUnit], {
        width: image.width,
        height: image.height,
        data: imageContext.getImageData(0, 0, image.width, image.height).data,
      });
    },
    texParameteri: () => {}, // ponytail: o filtro é sempre LINEAR e as bordas sempre REPEAT

    // estado
    enable: (capability) => enabled.add(capability),
    disable: (capability) => enabled.delete(capability),
    frontFace: (mode) => {
      frontFace = mode;
    },
    clearColor: (r, g, b, a) => {
      clearColor = [r, g, b, a];
    },
    clear: (mask) => {
      if (mask & GL.COLOR_BUFFER_BIT) {
        const color = clearColor.map((c) => c * 255);
        for (let i = 0; i < width * height * 4; i += 4) canvasBuffer.data.set(color, i);
      }
      if (mask & GL.DEPTH_BUFFER_BIT) zBuffer.fill(1);
      blit();
    },

    // desenhar: roda o vertex shader em cada vértice e preenche um triângulo a cada três.
    // A GPU de verdade mostra o quadro quando o JavaScript termina; aqui mostramos a cada desenho
    drawArrays: (mode, first, count) => {
      const vertices = [];
      for (let i = first; i < first + count; i++) {
        const attributes = {};
        vertexArray.attributes.forEach((attribute, location) => {
          if (!attribute.enabled) return;
          const start = attribute.offset + i * attribute.stride;
          attributes[program.attributes[location]] = attribute.buffer.data.subarray(start, start + attribute.size);
        });
        vertices.push(program.vertexShader(attributes, program.uniforms));
      }

      const triangles = [];
      inspector.onDraw?.({ vertices, triangles, image: canvasBuffer });
      for (let i = 0; i + 2 < vertices.length; i += 3) {
        triangles.push(drawTriangle([vertices[i], vertices[i + 1], vertices[i + 2]]));
        inspector.onDraw?.({ vertices, triangles, image: canvasBuffer });
      }
      blit();
    },

    // perguntar o estado: o WebGL é uma máquina de estados, e o getParameter diz o que está ligado agora
    getParameter: (name) =>
      ({
        [GL.CURRENT_PROGRAM]: program,
        [GL.VERTEX_ARRAY_BINDING]: vertexArray === defaultVertexArray ? null : vertexArray,
        [GL.ARRAY_BUFFER_BINDING]: arrayBuffer,
        [GL.ACTIVE_TEXTURE]: GL.TEXTURE0 + activeUnit,
        [GL.TEXTURE_BINDING_2D]: units[activeUnit] ?? null,
        [GL.COLOR_CLEAR_VALUE]: clearColor,
        [GL.FRONT_FACE]: frontFace,
      })[name],
    isEnabled: (capability) => enabled.has(capability),
  };

  // com o inspector ligado, cada chamada do gl avisa o passo a passo
  if (inspector.onCall) {
    for (const [name, method] of Object.entries(gl)) {
      if (typeof method !== "function") continue;
      gl[name] = (...args) => {
        const result = method(...args);
        inspector.onCall(name, args, result, gl);
        return result;
      };
    }
    inspector.onCall("createContext", [canvas], gl, gl);
  }

  return gl;
};
