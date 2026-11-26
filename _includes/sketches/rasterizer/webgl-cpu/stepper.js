// O passo a passo do cubo.js. Não faz parte do WebGL: é só a interface do sketch.
// Ele grava o primeiro quadro do cubo.js: cada chamada ao gl (pelo inspector do webgl2-cpu.js) e, dentro do
// drawArrays, o vertex shader e cada triângulo, com o estado do WebGL e o canvas depois de cada passo.
// Os botões andam por essa gravação e marcam, nos códigos abaixo, a linha do cubo.js que fez a chamada
// e o pedaço do webgl2-cpu.js que ela executou.
// Quem liga os ganchos no inspector é o passo-a-passo.html (daqui não dá para importar o webgl2-cpu.js).

const GPU_FILE = "webgl2-cpu.js";
const $ = (id) => document.getElementById(id);

// só o primeiro quadro: o laço de animação do cubo.js para aqui
window.requestAnimationFrame = () => 0;

// ---------------------------------------------------------------------------------------------
// formatação

const number = (value) => String(+value.toFixed(2));
const vector = (values) => `(${Array.from(values, number).join(", ")})`;
const show = (value) =>
  typeof value === "number" ? number(value)
  : Array.isArray(value[0]) ? value.map(vector).join("\n") // uma matriz, linha por linha
  : vector(value);
const escape = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const unique = (lines) => [...new Set(lines)].sort((a, b) => a - b);
const range = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

// uma tabela de chave e valor; as linhas que mudaram desde o passo anterior ficam marcadas
const table = (title, rows, previous) => {
  const before = previous && new Map(previous);
  const body = rows
    .map(([key, value]) => {
      const changed = before && before.get(key) !== value;
      return `<tr class="${changed ? "changed" : ""}"><th>${escape(key)}</th><td>${escape(value)}</td></tr>`;
    })
    .join("");
  return `<h4>${title}</h4><table>${body}</table>`;
};

// ---------------------------------------------------------------------------------------------
// onde no código: linhas do cubo.js (pela pilha de chamadas) e trechos do webgl2-cpu.js (pelo texto)

// a linha do programa que fez a chamada: a primeira da pilha que não é da "GPU" nem do passo a passo.
// O Chrome conta as linhas do <script> do cubo.js a partir do script; o Firefox, a partir do começo da página.
// Vale a das duas que tem a chamada (name) escrita nela.
const callSite = (name) => {
  for (const [, file, line] of new Error().stack.matchAll(/([\w.-]+\.m?js):(\d+):\d+/g)) {
    if (file === GPU_FILE || file === "stepper.js") continue;
    const source = files[file] ?? "";
    const page = window.frameElement?.srcdoc ?? "";
    const scriptStart = page.includes(source) ? page.slice(0, page.indexOf(source)).split("\n").length - 1 : 0;
    const lines = source.split("\n");
    const found = [Number(line), line - scriptStart].find((candidate) => lines[candidate - 1]?.includes(name));
    return { file, line: found };
  }
  return null;
};

const gpuLines = (files[GPU_FILE] ?? "").split("\n");
const findLine = (text, after = 0) => gpuLines.findIndex((line, i) => i >= after && line.includes(text)) + 1;

// um bloco que começa na linha start: até fecharem as chaves que ele abriu
const blockFrom = (start) => {
  if (!start) return [];
  let depth = 0;
  let opened = false;
  for (let i = start - 1; i < gpuLines.length; i++) {
    for (const char of gpuLines[i]) {
      if (char === "{") (depth++, (opened = true));
      else if (char === "}") depth--;
    }
    if (opened && depth <= 0) return range(start, i + 1);
  }
  return [start];
};
const between = (from, to) => {
  const start = findLine(from);
  const end = findLine(to, start);
  return start && end ? range(start, end) : [];
};
const methodLines = (name) => blockFrom(gpuLines.findIndex((line) => line.trimStart().startsWith(`${name}: `)) + 1);

const GPU = {
  createContext: between("export const createContext", "const enabled = new Set()"),
  vertexShader: blockFrom(findLine("for (let i = first;")),
  near: between("const drawTriangle", 'result: "near"'),
  culled: between("const drawTriangle", 'result: "culled"'),
  offscreen: between("const drawTriangle", 'result: "offscreen"'),
  drawn: blockFrom(findLine("const fillTriangle")),
};

// as linhas de uma função (um shader) dentro do texto do programa
const functionLines = (source, fn) => {
  const at = source.indexOf(String(fn));
  if (at < 0) return [];
  const start = source.slice(0, at).split("\n").length;
  return range(start, start + String(fn).split("\n").length - 1);
};

// ---------------------------------------------------------------------------------------------
// o que cada chamada quer dizer

const TEXTS = {
  createContext: () => [
    "O contexto",
    "O getContext(\"webgl2\") devolve o objeto gl, a porta para a GPU; aqui, o createContext do nosso rasterizador. O WebGL é uma máquina de estados: quase toda chamada liga alguma coisa (um programa, um buffer, uma textura) ou usa o que está ligado. Por enquanto nada está ligado, e o canvas está transparente.",
  ],
  attachShader: ([, shader], gl) => [
    shader.type === gl.VERTEX_SHADER ? "O vertex shader" : "O fragment shader",
    "O shader é criado, recebe o código (aqui uma função JavaScript, no lugar do texto em GLSL) e é compilado. O attachShader prende ele ao programa.",
  ],
  linkProgram: () => ["O programa fica pronto", "O linkProgram junta o vertex shader e o fragment shader num programa só."],
  useProgram: () => [
    "O programa em uso",
    "O useProgram liga o programa: os próximos uniforms e desenhos usam ele. É o CURRENT_PROGRAM no estado.",
  ],
  uniformMatrix4fv: ([location]) => [
    `O uniform ${location.name}`,
    "Um valor igual para todos os vértices e pixels de um desenho, guardado no programa em uso. A matriz vai linha por linha (transpose = true).",
  ],
  uniform1i: ([location, value]) => [
    `O uniform ${location.name}`,
    `O sampler recebe o número da unidade de textura que ele vai ler: a TEXTURE${value}.`,
  ],
  clearColor: () => ["A cor de limpar", "A cor que o clear vai usar. Só muda o estado: o canvas continua igual."],
  enable: ([capability], gl) =>
    capability === gl.DEPTH_TEST
      ? ["O teste de profundidade", "Com o DEPTH_TEST ligado, um pixel só é pintado se estiver mais perto do que o que já está no depth buffer."]
      : ["O culling", "Com o CULL_FACE ligado, os triângulos de costas para a câmera são descartados antes de virar pixels."],
  frontFace: () => [
    "Qual lado é a frente",
    "Nos nossos modelos, a frente de um triângulo é quando os vértices giram no sentido horário (CW) na tela.",
  ],
  activeTexture: () => ["A unidade de textura", "As próximas chamadas de textura mexem na unidade TEXTURE0."],
  bindTexture: () => ["Uma textura", "A textura criada é ligada na unidade ativa. É o TEXTURE_BINDING_2D no estado."],
  texImage2D: () => [
    "A imagem vai para a textura",
    "O texImage2D copia os pixels da imagem para a textura ligada. Ele não recebe a textura: usa a que está ligada.",
  ],
  texParameteri: () => [
    "O filtro da textura",
    "Sem mipmaps, o filtro precisa ser LINEAR (no nosso rasterizador ele sempre é).",
  ],
  bindVertexArray: () => [
    "O vertex array",
    "O vertex array guarda de onde sai cada atributo dos vértices. Enquanto ele está ligado, as chamadas de atributo mexem nele; na hora de desenhar, ligar ele traz todos os atributos de volta de uma vez.",
  ],
  bindBuffer: () => ["Um buffer", "O buffer criado é ligado em ARRAY_BUFFER."],
  bufferData: ([, data]) => [
    "Os números vão para o buffer",
    `O bufferData copia ${data.length} números para o buffer ligado em ARRAY_BUFFER. Ele não recebe o buffer: usa o que está ligado.`,
  ],
  enableVertexAttribArray: ([location]) => [
    "Liga um atributo",
    `O atributo da location ${location} passa a ser lido do vertex array a cada vértice.`,
  ],
  vertexAttribPointer: ([location, size]) => [
    "De onde sai o atributo",
    `O vertexAttribPointer grava no vertex array que o atributo da location ${location} sai do buffer ligado em ARRAY_BUFFER agora, de ${size} em ${size} números (um vértice). Depois disso, trocar o ARRAY_BUFFER não muda mais esse atributo.`,
  ],
  clear: () => [
    "Limpa a tela",
    "O clear pinta o canvas com a COLOR_CLEAR_VALUE e enche o depth buffer de 1, o mais longe possível.",
  ],
};

// chamadas que só criam ou perguntam alguma coisa: juntam-se à próxima chamada que muda o estado
const QUIET = new Set([
  "createProgram",
  "createShader",
  "shaderSource",
  "compileShader",
  "createBuffer",
  "createVertexArray",
  "createTexture",
  "getAttribLocation",
  "getUniformLocation",
]);

// ---------------------------------------------------------------------------------------------
// a gravação

const frames = [];
let pending = []; // as chamadas desde o último passo
let gl;
let programFile;
let recording = true;
let quiet = false; // o próprio passo a passo perguntando o estado

// nomes para os objetos do WebGL, na ordem em que são criados
const names = new Map();
const counters = {};
const KINDS = { createProgram: "program", createBuffer: "buffer", createVertexArray: "vertexArray", createTexture: "texture" };
const label = (object) => (object == null ? "null" : names.get(object) ?? "?");

// o estado do WebGL, perguntado pelo getParameter (e olhando dentro dos objetos da nossa "GPU")
const snapshot = () => {
  quiet = true;
  const on = (capability) => (gl.isEnabled(capability) ? "ligado" : "desligado");
  const program = gl.getParameter(gl.CURRENT_PROGRAM);
  const vertexArray = gl.getParameter(gl.VERTEX_ARRAY_BINDING);
  const buffer = gl.getParameter(gl.ARRAY_BUFFER_BINDING);
  const texture = gl.getParameter(gl.TEXTURE_BINDING_2D);

  const rows = [
    ["CURRENT_PROGRAM", label(program)],
    ["VERTEX_ARRAY_BINDING", label(vertexArray)],
    ...(vertexArray?.attributes ?? []).flatMap((attribute, location) => [
      [
        `  location ${location}`,
        `${program?.attributes[location]} ← ${label(attribute.buffer)}${attribute.size ? `, ${attribute.size} por vértice` : ""}`,
      ],
    ]),
    ["ARRAY_BUFFER_BINDING", buffer ? `${label(buffer)} (${buffer.data?.length ?? 0} números)` : "null"],
    ["ACTIVE_TEXTURE", `TEXTURE${gl.getParameter(gl.ACTIVE_TEXTURE) - gl.TEXTURE0}`],
    ["TEXTURE_BINDING_2D", texture ? `${label(texture)} (${texture.data ? `${texture.width} × ${texture.height}` : "vazia"})` : "null"],
    ["DEPTH_TEST", on(gl.DEPTH_TEST)],
    ["CULL_FACE", on(gl.CULL_FACE)],
    ["FRONT_FACE", gl.getParameter(gl.FRONT_FACE) === gl.CW ? "CW (horário)" : "CCW (anti-horário)"],
    ["COLOR_CLEAR_VALUE", vector(gl.getParameter(gl.COLOR_CLEAR_VALUE))],
  ];
  const uniforms = Object.entries(program?.uniforms ?? {}).map(([name, value]) => [name, show(value)]);
  quiet = false;
  return { rows, uniforms, program };
};

const canvasImage = () => {
  const canvas = $("canvas");
  return canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
};

export const onCall = (name, args, result, context) => {
  if (quiet || !recording) return;
  gl = context;
  const site = callSite(name);
  programFile ??= site?.file;

  if (KINDS[name] || name === "createShader") {
    const kind = name === "createShader" ? (args[0] === gl.VERTEX_SHADER ? "vertexShader" : "fragmentShader") : KINDS[name];
    counters[kind] = (counters[kind] ?? 0) + 1;
    names.set(result, `${kind} ${counters[kind]}`);
  }

  pending.push({ name, args, line: site?.line });
  if (name === "drawArrays") return finish(); // os passos do desenho já foram gravados pelo onDraw
  if (QUIET.has(name)) return;

  const [title, text] = TEXTS[name]?.(args, gl) ?? [name, ""];
  frames.push({
    title,
    text,
    lines: pending.map((call) => call.line).filter(Boolean),
    gpu: pending.flatMap((call) => (call.name === "createContext" ? GPU.createContext : methodLines(call.name))),
    state: snapshot(),
    image: canvasImage(),
  });
  pending = [];
};

export const onDraw = ({ vertices, triangles, image }) => {
  if (!recording) return;
  const site = callSite("drawArrays");
  const state = snapshot();
  const source = files[programFile] ?? "";
  const triangle = triangles[triangles.length - 1];
  const shader =
    !triangle ? state.program.vertexShader
    : triangle.result === "drawn" ? state.program.fragmentShader
    : null;

  frames.push({
    lines: [...pending.map((call) => call.line), site?.line].filter(Boolean),
    shaderLines: shader ? functionLines(source, shader) : [],
    gpu: triangle ? GPU[triangle.result] : GPU.vertexShader,
    state,
    image: new ImageData(new Uint8ClampedArray(image.data), image.width, image.height),
    draw: { vertices, triangles: triangles.slice() },
  });
  pending = [];
};

// ---------------------------------------------------------------------------------------------
// a interface

let triangleCount = 0;

// dentro do drawArrays: o que saiu do vertex shader e o que aconteceu com os triângulos até aqui
const drawPanel = ({ vertices, triangles }) => {
  const drawn = triangles.filter((triangle) => triangle.result === "drawn");
  const fragments = drawn.reduce((sum, triangle) => sum + triangle.fragments, 0);
  const hidden = drawn.reduce((sum, triangle) => sum + triangle.hidden, 0);
  const { gl_Position, ...varyings } = vertices[0];

  const rows = vertices
    .map(({ gl_Position, ...varyings }, index) => {
      const isCurrent = Math.floor(index / 3) === triangles.length - 1;
      const cells = [index, vector(gl_Position), ...Object.values(varyings).map(show)];
      return `<tr class="${isCurrent ? "current" : ""}">${cells.map((cell) => `<td>${cell}</td>`).join("")}</tr>`;
    })
    .join("");
  const header = ["#", "gl_Position", ...Object.keys(varyings)].map((name) => `<th>${name}</th>`).join("");

  return `<h4>dentro do drawArrays</h4>
    <p class="summary">vertex shader: ${vertices.length} vértices<br>
    triângulos: ${triangles.length} de ${triangleCount} · ${drawn.length} desenhados · ${triangles.length - drawn.length} descartados<br>
    pixels: ${fragments} pintados · ${hidden} recusados pelo teste de profundidade</p>
    <table class="vertices"><tr>${header}</tr>${rows}</table>`;
};

// o título e o texto de um passo do desenho
const describeDraw = ({ vertices, triangles }) => {
  if (!triangles.length) {
    return [
      "Desenha: o vertex shader",
      `O drawArrays começa rodando o vertex shader uma vez para cada vértice: ${vertices.length} vezes, cada uma lendo os seus atributos pelo vertex array e os uniforms do programa. O gl_Position de cada vértice, dividido por w, diz onde ele cai na tela (os pontos). Numa GPU essas execuções acontecem ao mesmo tempo; aqui, uma depois da outra.`,
    ];
  }
  const triangle = triangles[triangles.length - 1];
  const texts = {
    drawn: `Na tela, os vértices 1 → 2 → 3 giram no sentido horário: é a frente. A GPU acha os pixels dentro do triângulo, interpola o vTexCoord entre os três vértices e roda o fragment shader em cada pixel que passa no teste de profundidade: ${triangle.fragments} pixels pintados${triangle.hidden ? `, ${triangle.hidden} recusados (a borda que ele divide com um triângulo já desenhado)` : ""}.`,
    culled: "Na tela, os vértices 1 → 2 → 3 giram no sentido anti-horário: o triângulo está de costas para a câmera. Com o CULL_FACE ligado, ele é descartado antes de virar pixels, e o fragment shader nem roda.",
    offscreen: "O triângulo fica todo fora da tela, então não vira nenhum pixel.",
    near: "Um dos vértices fica antes do plano near (ou atrás da câmera), então o triângulo é descartado.",
  };
  const isLast = triangles.length === triangleCount;
  return [
    `Desenha: triângulo ${triangles.length} de ${triangleCount}`,
    texts[triangle.result] + (isLast ? " Era o último: o desenho está pronto." : ""),
  ];
};

// por cima do canvas: os vértices depois do vertex shader, ou o triângulo da vez
const drawOverlay = (draw) => {
  const overlay = $("overlay").getContext("2d");
  const { width, height } = overlay.canvas;
  overlay.clearRect(0, 0, width, height);
  if (!draw) return;

  const toScreen = ([x, y]) => [((x + 1) / 2) * width, ((1 - y) / 2) * height];
  const dot = ([x, y], color) => {
    overlay.fillStyle = color;
    overlay.beginPath();
    overlay.arc(x, y, 2.5, 0, 2 * Math.PI);
    overlay.fill();
  };

  if (!draw.triangles.length) {
    for (const { gl_Position: [x, y, , w] } of draw.vertices) if (w > 0) dot(toScreen([x / w, y / w]), "#d6336c");
    return;
  }

  const triangle = draw.triangles[draw.triangles.length - 1];
  if (!triangle.ndc) return;
  const points = triangle.ndc.map(toScreen);
  const color = triangle.result === "drawn" ? "#1f9d55" : "#d63031";
  overlay.beginPath();
  points.forEach(([x, y], index) => (index ? overlay.lineTo(x, y) : overlay.moveTo(x, y)));
  overlay.closePath();
  overlay.setLineDash(triangle.result === "drawn" ? [] : [4, 3]);
  overlay.strokeStyle = color;
  overlay.lineWidth = 1.5;
  overlay.stroke();
  overlay.setLineDash([]);

  // os números mostram a ordem dos vértices na tela, que decide o culling
  const center = points.reduce(([cx, cy], [x, y]) => [cx + x / 3, cy + y / 3], [0, 0]);
  overlay.font = "bold 10px sans-serif";
  overlay.textAlign = "center";
  overlay.textBaseline = "middle";
  points.forEach(([x, y], index) => {
    dot([x, y], color);
    const length = Math.hypot(x - center[0], y - center[1]) || 1;
    overlay.fillText(String(index + 1), x + ((x - center[0]) / length) * 9, y + ((y - center[1]) / length) * 9);
  });
};

let current = 0;

const go = (index) => {
  current = Math.max(0, Math.min(frames.length - 1, index));
  const frame = frames[current];
  const previous = frames[current - 1];
  const [title, text] = frame.draw ? describeDraw(frame.draw) : [frame.title, frame.text];
  const sourceLines = (files[programFile] ?? "").split("\n");

  $("title").textContent = `passo ${current + 1}: ${title}`;
  $("snippet").textContent = unique(frame.lines).map((line) => sourceLines[line - 1].trim()).join("\n");
  $("text").textContent = text;
  $("counter").textContent = `${current + 1} / ${frames.length}`;
  $("scrub").value = current;
  $("back").disabled = current === 0;
  $("next").disabled = current === frames.length - 1;

  $("details").innerHTML = frame.draw
    ? drawPanel(frame.draw)
    : frame.state.uniforms.length
      ? table("Uniforms do programa", frame.state.uniforms, previous?.state.uniforms)
      : "";
  $("state").innerHTML = table("Estado do WebGL", frame.state.rows, previous?.state.rows);

  $("screen").getContext("2d").putImageData(frame.image, 0, 0);
  drawOverlay(frame.draw);

  window.highlightCode?.({
    [programFile]: unique([...frame.lines, ...(frame.shaderLines ?? [])]),
    [GPU_FILE]: unique(frame.gpu),
  });
};

// o primeiro drawArrays terminou: a gravação acabou, e o passo a passo começa
const finish = () => {
  recording = false;
  triangleCount = frames[frames.length - 1].draw?.triangles.length ?? 0;
  $("scrub").max = frames.length - 1;
  $("back").onclick = () => go(current - 1);
  $("next").onclick = () => go(current + 1);
  $("scrub").oninput = (event) => go(Number(event.target.value));
  addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight") go(current + 1);
    else if (event.key === "ArrowLeft") go(current - 1);
    else return;
    event.preventDefault();
  });
  go(0);
};
