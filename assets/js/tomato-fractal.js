// Tomato fractal behind the sidebar: the cartoon zoom from cartoon.html, as several small blooms.
// The sidebar is tiled with a honeycomb; every cell runs its own zoom, at its own pace, into its own seeds.
// The logo keeps a clear disc behind it; everything is tinted toward the sidebar's red.
(() => {
const cvs = document.querySelector('.sidebar-fractal');
if (!cvs) return;
const gl = cvs.getContext('webgl2', { premultipliedAlpha: true });
if (!gl) return;

const FS = `
uniform vec2  uRes;
uniform float uTime;
uniform float uCell;                 // honeycomb spacing, canvas pixels
uniform vec4  uLogo;                 // logo centre (canvas pixels), radius kept clear, fade length
uniform sampler2D uSdf;              // R: distance to the cavities, G: to the pale core (tomato radii, negative inside), see fieldAt()
out vec4 fragColor;

const float PI  = 3.14159265;
const float SUF = .04;               // seed unit / tomato radius: a real seed is ~.084 of the radius. zoom per loop = 1/SUF
const float INKPX = 1.1;             // ink half-width in canvas pixels

const vec3 INK = vec3(.09, .06, .05);
const vec3 SEED = vec3(1., .80, .30), LIME = vec3(.62, .80, .32), ORANGE = vec3(.99, .60, .14), RED = vec3(.91, .22, .16);
const vec3 LEAF = vec3(.38, .70, .27), LEAF_D = vec3(.17, .43, .19);
const vec3 SKIN = vec3(.66, .10, .12), FLESH = vec3(.88, .28, .24), FLESH_L = vec3(.95, .43, .34);
const vec3 PALE = vec3(.99, .86, .61), PALE_D = vec3(.97, .63, .47);
const vec3 LOC = vec3(.80, .17, .10), LOC_D = vec3(.58, .08, .07), LOC_L = vec3(1., .62, .50);

const int NS = 25;
const vec4 SEEDS[NS] = vec4[NS](
  vec4(-0.005, -0.696, 0.100, 0.150),
  vec4(0.129, -0.675, 0.280, 0.162),
  vec4(-0.188, -0.667, -0.117, 0.159),
  vec4(0.241, -0.670, 0.089, 0.169),
  vec4(-0.305, -0.642, -0.311, 0.143),
  vec4(-0.518, -0.277, -0.634, 0.158),
  vec4(-0.650, -0.241, -0.538, 0.207),
  vec4(0.698, -0.318, 0.750, 0.189),
  vec4(0.697, -0.190, 1.512, 0.124),
  vec4(-0.733, -0.145, -1.329, 0.208),
  vec4(0.741, -0.087, 1.397, 0.156),
  vec4(0.662, 0.052, 2.376, 0.107),
  vec4(-0.733, -0.021, -1.566, 0.185),
  vec4(-0.667, 0.094, -1.647, 0.155),
  vec4(-0.577, 0.183, -1.783, 0.108),
  vec4(0.700, 0.161, 1.707, 0.168),
  vec4(-0.691, 0.203, -2.019, 0.214),
  vec4(-0.603, 0.295, -1.865, 0.153),
  vec4(-0.500, 0.387, -1.990, 0.092),
  vec4(0.667, 0.286, 1.631, 0.145),
  vec4(-0.451, 0.509, -2.885, 0.148),
  vec4(-0.576, 0.484, -2.378, 0.206),
  vec4(-0.006, 0.686, -2.393, 0.164),
  vec4(0.283, 0.661, 2.375, 0.126),
  vec4(0.112, 0.700, -3.372, 0.140));

mat2  rot(float a) { float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }
float hash(float n) { return fract(sin(n*12.9898 + 78.233)*43758.5453); }
float cv(float d, float px) { return 1. - smoothstep(-.6*px, .6*px, d); }     // coverage from signed distance
float seg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; return length(pa - ba*clamp(dot(pa, ba)/dot(ba, ba), 0., 1.)); }

float egg(vec2 p, float ra, float rb) {          // iq's egg
  const float k = 1.7320508;
  p.x = abs(p.x);
  float r = ra - rb;
  return ((p.y < 0.)          ? length(p) - r :
          (k*(p.x + r) < p.y) ? length(vec2(p.x, p.y - k*r)) :
                                length(vec2(p.x + r, p.y)) - 2.*r) - rb;
}

// seed (g=0) -> tomato (g=1); unit = one tomato radius at g=1. a little hand-drawn wobble on the tomato
float shape(vec2 q, float g) {
  vec2 p = vec2(q.x*mix(1.8, 1., g), (q.y + mix(.2, 0., g))/mix(1., .975, g));
  float a = atan(q.y + 1e-5, q.x);
  return egg(p, mix(.85, 1., g), mix(.3, 1., g)) - g*(.005*cos(4.*a) + .004*sin(3.*a + 1.));
}

// 5 sepals + curling stem: (ink+leaf coverage, leaf coverage, light tone)
vec3 calyx(vec2 q, float g, float hw, float px) {
  float sc = smoothstep(.55, .95, g);
  if (sc <= 0.) return vec3(0.);
  vec2 s = q - vec2(0., .9 + .5*(1. - g)), e = s*vec2(1., 2.2);
  float star = (length(e) - sc*(.07 + .5*pow(max(.5 + .5*cos(5.*(atan(e.y, e.x + 1e-5) - PI/2.)), 0.), 1.1)))*.55;
  vec2 a = vec2(.03, .13)*sc, b = vec2(.11, .21)*sc, c = vec2(.19, .17)*sc;
  float d = min(star, min(seg(s, vec2(0.), a), min(seg(s, a, b), seg(s, b, c))) - .05*sc);
  return vec3(cv(d - hw, px), cv(d + hw, px), cv(star + .05, px));
}

// seed or tomato, inked and cel-shaded; returns (rgb, coverage)
vec4 drawObj(vec2 q, float g, float px) {
  float ang = atan(q.y + 1e-5, q.x);                                             // ink is thicker on the shadow side, thinner toward the light
  float hw = INKPX*px*mix(.32, 1., smoothstep(.1, .8, g))*(1. + .28*(cos(ang) - sin(ang)));   // same width on screen at every zoom
  float d = shape(q, g), outer = cv(d - hw, px);
  vec3 cy = g > .55 ? calyx(q, g, hw, px) : vec3(0.);
  if (max(outer, cy.x) <= 0.) return vec4(0.);
  vec3 base = mix(SEED, LIME, smoothstep(0., .35, g));                           // golden seed -> green -> orange -> red
  base = mix(base, ORANGE, smoothstep(.45, .7, g));
  base = mix(base, RED, smoothstep(.7, 1., g));
  float lit = cv(shape(q - vec2(-.16, .18)*mix(.5, 1., g), g) + hw, px);         // the body shifted toward the light; what it misses is the shade
  vec3 col = mix(base*vec3(.8, .62, .6), base, lit);
  col = mix(col, vec3(1.), max(cv(seg(q, vec2(-.62, .3), vec2(-.4, .58)) - .06, px), cv(length(q - vec2(-.25, .72)) - .045, px))*smoothstep(.6, .95, g));   // glint
  col = mix(col, INK, cv(seg(q, vec2(0., -.55), vec2(0., .5)) - .5*hw, px)*(1. - smoothstep(0., .3, g)));   // seed vein
  col = mix(INK, col, cv(d + hw, px));                                           // ink outline
  vec3 leaf = mix(INK, mix(LEAF_D, LEAF, cy.z), cy.y);
  float A = cy.x + (1. - cy.x)*outer;
  return vec4((cy.x*leaf + (1. - cy.x)*outer*col)/max(A, 1e-4), A);
}

// distance (tomato radii, negative inside) to the slice's cavities (x) and to its pale core (y)
vec2 fieldAt(vec2 f) { return (textureLod(uSdf, vec2(f.x, -f.y)/2.12 + .5, 0.).rg*2. - 1.)*.12; }

// a tomato's insides, inked. f in tomato radii. skip = the chosen seed, left out
vec4 face(vec2 f, float px, int skip) {
  float ang = atan(f.y + 1e-5, f.x);
  float hw = INKPX*px*(1. + .28*(cos(ang) - sin(ang)));
  float db = shape(f, 1.), cov = cv(db - hw, px);
  if (cov <= 0.) return vec4(0.);
  vec2 fd = fieldAt(f);
  float dc = fd.x, dp = fd.y;
  vec3 col = INK;
  col = mix(col, SKIN, cv(db + hw, px));
  col = mix(col, mix(FLESH, FLESH_L, cv(dc - .045, px)), cv(db + hw + .05, px));   // wall, lighter next to the cavities
  col = mix(col, PALE_D, cv(dp - .022, px));                                       // the pale core, with a pink rim
  col = mix(col, PALE, cv(dp, px));
  col = mix(col, INK, cv(dc - .5*hw, px));                                         // cavities: ink, shade, gel
  col = mix(col, LOC_D, cv(dc + .5*hw, px));
  col = mix(col, LOC, cv(dc + .5*hw + .028, px));
  vec2 n = vec2(fieldAt(f + vec2(.012, 0.)).x - dc, fieldAt(f + vec2(0., .012)).x - dc);   // outward normal of the cavity edge
  float facing = smoothstep(.1, .6, dot(n/(length(n) + 1e-5), vec2(-.55, .83)));
  col = mix(col, LOC_L, .9*facing*cv(abs(dc + .05) - .3*hw, px)*cv(dc + .5*hw + .02, px));   // gloss on the edges that face the light
  for (int k = 0; k < NS; k++) {
    if (k == skip) continue;
    vec4 sd = SEEDS[k];                                                            // x, y, tilt, distance to the pale core
    vec2 d2 = f - sd.xy;
    if (dot(d2, d2) > (sd.w + .07)*(sd.w + .07)) continue;
    vec2 u = vec2(-sin(sd.z), cos(sd.z));                                          // the seed's tip: it points at the pale core
    col = mix(col, PALE_D, cv(seg(f, sd.xy + u*.05, sd.xy + u*(sd.w + .005)) - .5*hw, px));   // the strand that holds it
    vec2 qs = rot(-sd.z)*d2/SUF;
    // growth 0, written as min(uTime, 0.) so the compiler can't see it is a constant -- see NB in cartoon.html
    if (dot(qs, qs) < 4.) { vec4 s = drawObj(qs, min(uTime, 0.), px/SUF); col = mix(col, s.rgb, s.a); }
  }
  return vec4(col, cov);
}

const vec3 TINT = vec3(.79, .24, .21);   // the sidebar's red

vec4 over(vec4 acc, vec3 c, float a) { return vec4(c*a + acc.rgb*(1. - a), a + acc.a*(1. - a)); }   // premultiplied

// honeycomb: centres one unit apart. returns (offset from the cell's centre, cell id)
vec4 hexCell(vec2 p) {
  const vec2 s = vec2(1., 1.7320508);
  vec4 c = floor(vec4(p, p - vec2(.5, 1.))/s.xyxy) + .5;
  vec4 h = vec4(p - c.xy*s, p - (c.zw + .5)*s);
  return dot(h.xy, h.xy) < dot(h.zw, h.zw) ? vec4(h.xy, c.xy) : vec4(h.zw, c.zw + .5);
}
const float RT = .25;                // tomato radius, fraction of the cell spacing

// one cell's endless zoom: a tomato opens, the camera dives into a seed, the seed ripens into the next tomato.
// every cell keeps its own pace and start, and picks a new seed each loop. premultiplied rgba
vec4 bloom(vec2 h, vec2 id, float cellPx) {
  float i = dot(id, vec2(7.13, 31.7));
  float T = 15. + 7.*hash(i*7.31);
  float t = uTime + T*hash(i*3.17 + .5);
  float cyc = floor(t/T), tau = fract(t/T);

  float jr = .13*sqrt(hash(i + cyc*5.3 + .1)), ja = 2.*PI*hash(i + cyc*5.3 + .2);
  h -= jr*vec2(cos(ja), sin(ja));                                 // a new random spot every loop, never far enough to touch a neighbour
  vec2 P = h/RT;
  float px = 1./(RT*cellPx);
  float lnZ = -log(SUF);
  float z = exp(lnZ*tau);
  float w = tau + .5*lnZ*tau*(tau - 1.);
  float open = smoothstep(.04, .30, tau), grow = smoothstep(.30, .82, tau);
  float parent = 1. - grow;
  float zero = min(uTime, 0.);                                    // see NB in cartoon.html: never a literal growth

  int k = int(hash(i + cyc*3.71)*float(NS));                      // new seed every loop; the loop point is a bare tomato, so the switch is invisible
  vec2 C = SEEDS[k].xy;
  float psi = SEEDS[k].z;
  vec2 W = C*(1. - (1. - w)/z) + rot(psi*tau)*P/z;
  vec2 q = rot(-psi)*(W - C)/SUF;

  vec4 acc = vec4(0.);
  if (parent > 0.) {
    vec4 A = face(W, px/z, k);
    acc = over(acc, A.rgb, A.a*smoothstep(0., .03, open)*parent);
  }
  vec4 O = drawObj(q, grow, px/(z*SUF));
  acc = over(acc, O.rgb, O.a);
  if (open < 1.) {
    vec4 S = drawObj(W, 1. + zero, px/z);
    acc = over(acc, S.rgb, S.a*(1. - smoothstep(0., .23, 1.85*open - length(W - C))));
  }
  float env = smoothstep(0., .04, tau)*(1. - smoothstep(.95, 1., tau));   // a quick fade hides the move at the loop point
  return acc*env*(1. - smoothstep(.27, .36, length(h)));          // a round window per cell, plain gradient between them
}

void main() {
  vec4 hc = hexCell(gl_FragCoord.xy/uCell);
  vec4 acc = bloom(hc.xy, hc.zw, uCell);
  if (acc.a <= 0.) { fragColor = vec4(0.); return; }
  vec3 col = acc.rgb/acc.a;
  float lum = dot(col, vec3(.299, .587, .114));
  col = mix(col, TINT*(.45 + .8*lum), .6);                       // pull everything toward the sidebar red
  float a = acc.a*.55;                                            // and let the gradient show through
  a *= smoothstep(uLogo.z, uLogo.z + uLogo.w, length(gl_FragCoord.xy - uLogo.xy));   // a clear disc behind the logo
  fragColor = vec4(col*a, a);
}`;

const sh = (type, src) => {
  const s = gl.createShader(type);
  gl.shaderSource(s, '#version 300 es\nprecision highp float;\n' + src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw gl.getShaderInfoLog(s);
  return s;
};
const pr = gl.createProgram();   // fullscreen triangle from gl_VertexID, no buffers
gl.attachShader(pr, sh(gl.VERTEX_SHADER, 'void main(){gl_Position=vec4(float((gl_VertexID<<1)&2)*2.-1.,float(gl_VertexID&2)*2.-1.,0,1);}'));
gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
gl.linkProgram(pr);
gl.useProgram(pr);
const uRes = gl.getUniformLocation(pr, 'uRes'), uTime = gl.getUniformLocation(pr, 'uTime'), uCell = gl.getUniformLocation(pr, 'uCell'), uLogo = gl.getUniformLocation(pr, 'uLogo');
const logo = document.querySelector('#sidebar .site-title img');

function frame(t) {
  const k = Math.min(devicePixelRatio, 1.5);
  const w = Math.round(cvs.clientWidth * k), h = Math.round(cvs.clientHeight * k);
  if (cvs.width != w || cvs.height != h) { cvs.width = w; cvs.height = h; }
  const c = cvs.getBoundingClientRect(), l = logo ? logo.getBoundingClientRect() : { left: 0, top: 0, width: 0, height: 0 };
  gl.viewport(0, 0, w, h);
  gl.uniform2f(uRes, w, h);
  gl.uniform1f(uTime, t);
  gl.uniform1f(uCell, 165 * k);
  gl.uniform4f(uLogo, (l.left - c.left + l.width / 2) * k, h - (l.top - c.top + l.height / 2) * k,   // GL's y points up
    .3 * Math.max(l.width, l.height) * k, 110 * k);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

// every visit starts somewhere else in time, so the layout differs per page load.
// ?t=7.5 freezes on that second; reduced motion shows one still frame
const freeze = new URLSearchParams(location.search).get('t');
const start = freeze !== null ? +freeze || 0 : Math.random() * 10000;
const still = freeze !== null || matchMedia('(prefers-reduced-motion: reduce)').matches;
const t0 = performance.now() / 1000 - start;
function loop(now) {
  frame(still ? start : now / 1000 - t0);
  if (!still) requestAnimationFrame(loop);
}

const img = new Image();   // the distance fields must be on the GPU before the first frame
img.onload = () => {
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  for (const [p, v] of [[gl.TEXTURE_MIN_FILTER, gl.LINEAR], [gl.TEXTURE_MAG_FILTER, gl.LINEAR], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, p, v);
  gl.uniform1i(gl.getUniformLocation(pr, 'uSdf'), 0);
  requestAnimationFrame(loop);
};
img.src = cvs.dataset.sdf;
})();
