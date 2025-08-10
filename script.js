const { Renderer, Program, Mesh, Color, Triangle, Camera, Plane, Texture, Transform } = OGL;
const { useEffect, useRef, useMemo, useCallback, useState } = React;

// --- FAULTY TERMINAL COMPONENT ---
const vertexShader = `
    attribute vec2 position;
    attribute vec2 uv;
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 0.0, 1.0);
    }
`;

const fragmentShader = `
    precision mediump float;
    varying vec2 vUv;
    uniform float iTime;
    uniform vec3  iResolution;
    uniform float uScale;
    uniform vec2  uGridMul;
    uniform float uDigitSize;
    uniform float uScanlineIntensity;
    uniform float uGlitchAmount;
    uniform float uFlickerAmount;
    uniform float uNoiseAmp;
    uniform float uChromaticAberration;
    uniform float uDither;
    uniform float uCurvature;
    uniform vec3  uTint;
    uniform vec2  uMouse;
    uniform float uMouseStrength;
    uniform float uUseMouse;
    uniform float uPageLoadProgress;
    uniform float uUsePageLoadAnimation;
    uniform float uBrightness;

    float time;

    float hash21(vec2 p){
      p = fract(p * 234.56);
      p += dot(p, p + 34.56);
      return fract(p.x * p.y);
    }

    float noise(vec2 p) {
      return sin(p.x * 10.0) * sin(p.y * (3.0 + sin(time * 0.090909))) + 0.2;
    }

    mat2 rotate(float angle) {
      float c = cos(angle);
      float s = sin(angle);
      return mat2(c, -s, s, c);
    }

    float fbm(vec2 p) {
      p *= 1.1;
      float f = 0.0;
      float amp = 0.5 * uNoiseAmp;
      mat2 modify0 = rotate(time * 0.02);
      f += amp * noise(p);
      p = modify0 * p * 2.0;
      amp *= 0.454545;
      mat2 modify1 = rotate(time * 0.02);
      f += amp * noise(p);
      p = modify1 * p * 2.0;
      amp *= 0.454545;
      mat2 modify2 = rotate(time * 0.08);
      f += amp * noise(p);
      return f;
    }

    float pattern(vec2 p, out vec2 q, out vec2 r) {
      vec2 offset1 = vec2(1.0);
      vec2 offset0 = vec2(0.0);
      mat2 rot01 = rotate(0.1 * time);
      mat2 rot1 = rotate(0.1);
      q = vec2(fbm(p + offset1), fbm(rot01 * p + offset1));
      r = vec2(fbm(rot1 * q + offset0), fbm(q + offset0));
      return fbm(p + r);
    }

    float digit(vec2 p){
        vec2 grid = uGridMul * 15.0;
        vec2 s = floor(p * grid) / grid;
        p = p * grid;
        vec2 q, r;
        float intensity = pattern(s * 0.1, q, r) * 1.3 - 0.03;

        if(uUseMouse > 0.5){
            vec2 mouseWorld = uMouse * uScale;
            float distToMouse = distance(s, mouseWorld);
            float mouseInfluence = exp(-distToMouse * 8.0) * uMouseStrength * 10.0;
            intensity += mouseInfluence;
            float ripple = sin(distToMouse * 20.0 - iTime * 5.0) * 0.1 * mouseInfluence;
            intensity += ripple;
        }

        if(uUsePageLoadAnimation > 0.5){
            float cellRandom = fract(sin(dot(s, vec2(12.9898, 78.233))) * 43758.5453);
            float cellDelay = cellRandom * 0.8;
            float cellProgress = clamp((uPageLoadProgress - cellDelay) / 0.2, 0.0, 1.0);
            float fadeAlpha = smoothstep(0.0, 1.0, cellProgress);
            intensity *= fadeAlpha;
        }

        p = fract(p);
        p *= uDigitSize;
        float px5 = p.x * 5.0;
        float py5 = (1.0 - p.y) * 5.0;
        float x = fract(px5);
        float y = fract(py5);
        float i = floor(py5) - 2.0;
        float j = floor(px5) - 2.0;
        float n = i * i + j * j;
        float f = n * 0.0625;
        float isOn = step(0.1, intensity - f);
        float brightness = isOn * (0.2 + y * 0.8) * (0.75 + x * 0.25);
        return step(0.0, p.x) * step(p.x, 1.0) * step(0.0, p.y) * step(p.y, 1.0) * brightness;
    }

    float onOff(float a, float b, float c) {
      return step(c, sin(iTime + a * cos(iTime * b))) * uFlickerAmount;
    }

    float displace(vec2 look) {
        float y = look.y - mod(iTime * 0.25, 1.0);
        float window = 1.0 / (1.0 + 50.0 * y * y);
        return sin(look.y * 20.0 + iTime) * 0.0125 * onOff(4.0, 2.0, 0.8) * (1.0 + cos(iTime * 60.0)) * window;
    }

    vec3 getColor(vec2 p){
        float bar = step(mod(p.y + time * 20.0, 1.0), 0.2) * 0.4 + 1.0;
        bar *= uScanlineIntensity;
        float displacement = displace(p);
        p.x += displacement;

        if (uGlitchAmount != 1.0) {
          float extra = displacement * (uGlitchAmount - 1.0);
          p.x += extra;
        }

        float middle = digit(p);
        const float off = 0.002;
        float sum = digit(p + vec2(-off, -off)) + digit(p + vec2(0.0, -off)) + digit(p + vec2(off, -off)) +
                    digit(p + vec2(-off, 0.0)) + digit(p + vec2(0.0, 0.0)) + digit(p + vec2(off, 0.0)) +
                    digit(p + vec2(-off, off)) + digit(p + vec2(0.0, off)) + digit(p + vec2(off, off));
        vec3 baseColor = vec3(0.9) * middle + sum * 0.1 * vec3(1.0) * bar;
        return baseColor;
    }

    vec2 barrel(vec2 uv){
      vec2 c = uv * 2.0 - 1.0;
      float r2 = dot(c, c);
      c *= 1.0 + uCurvature * r2;
      return c * 0.5 + 0.5;
    }

    void main() {
        time = iTime * 0.333333;
        vec2 uv = vUv;

        if(uCurvature != 0.0){
          uv = barrel(uv);
        }

        vec2 p = uv * uScale;
        vec3 col = getColor(p);

        if(uChromaticAberration != 0.0){
          vec2 ca = vec2(uChromaticAberration) / iResolution.xy;
          col.r = getColor(p + ca).r;
          col.b = getColor(p - ca).b;
        }

        col *= uTint;
        col *= uBrightness;

        if(uDither > 0.0){
          float rnd = hash21(gl_FragCoord.xy);
          col += (rnd - 0.5) * (uDither * 0.003922);
        }

        gl_FragColor = vec4(col, 1.0);
    }
`;

function hexToRgb(hex) {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const num = parseInt(h, 16);
  return [((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255];
}

function FaultyTerminal({
  scale = 1, gridMul = [2, 1], digitSize = 1.5, timeScale = 0.3, pause = false,
  scanlineIntensity = 0.1, glitchAmount = 1.2, flickerAmount = 0.3, noiseAmp = 0.1,
  chromaticAberration = 0.02, dither = 0.1, curvature = 0.1, tint = "#00e5ff",
  mouseReact = true, mouseStrength = 0.1, dpr = Math.min(window.devicePixelRatio || 1, 2),
  pageLoadAnimation = true, brightness = 0.7, className, style, ...rest
}) {
  const containerRef = useRef(null);
  const programRef = useRef(null);
  const rendererRef = useRef(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const smoothMouseRef = useRef({ x: 0.5, y: 0.5 });
  const frozenTimeRef = useRef(0);
  const rafRef = useRef(0);
  const loadAnimationStartRef = useRef(0);
  const timeOffsetRef = useRef(Math.random() * 100);

  const tintVec = useMemo(() => hexToRgb(tint), [tint]);
  const ditherValue = useMemo(() => (typeof dither === "boolean" ? (dither ? 1 : 0) : dither), [dither]);

  const handleMouseMove = useCallback((e) => {
    const ctn = containerRef.current;
    if (!ctn) return;
    const rect = ctn.getBoundingClientRect();
    mouseRef.current = { x: (e.clientX - rect.left) / rect.width, y: 1 - (e.clientY - rect.top) / rect.height };
  }, []);

  useEffect(() => {
    const ctn = containerRef.current;
    if (!ctn) return;

    const renderer = new Renderer({ dpr });
    rendererRef.current = renderer;
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 1);

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: vertexShader, fragment: fragmentShader,
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new Color(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height) },
        uScale: { value: scale },
        uGridMul: { value: new Float32Array(gridMul) },
        uDigitSize: { value: digitSize },
        uScanlineIntensity: { value: scanlineIntensity },
        uGlitchAmount: { value: glitchAmount },
        uFlickerAmount: { value: flickerAmount },
        uNoiseAmp: { value: noiseAmp },
        uChromaticAberration: { value: chromaticAberration },
        uDither: { value: ditherValue },
        uCurvature: { value: curvature },
        uTint: { value: new Color(tintVec[0], tintVec[1], tintVec[2]) },
        uMouse: { value: new Float32Array([smoothMouseRef.current.x, smoothMouseRef.current.y]) },
        uMouseStrength: { value: mouseStrength },
        uUseMouse: { value: mouseReact ? 1 : 0 },
        uPageLoadProgress: { value: pageLoadAnimation ? 0 : 1 },
        uUsePageLoadAnimation: { value: pageLoadAnimation ? 1 : 0 },
        uBrightness: { value: brightness },
      },
    });
    programRef.current = program;
    const mesh = new Mesh(gl, { geometry, program });

    function resize() {
      if (!ctn || !renderer) return;
      renderer.setSize(ctn.offsetWidth, ctn.offsetHeight);
      program.uniforms.iResolution.value = new Color(gl.canvas.width, gl.canvas.height, gl.canvas.width / gl.canvas.height);
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(ctn);
    resize();

    const update = (t) => {
      rafRef.current = requestAnimationFrame(update);
      if (pageLoadAnimation && loadAnimationStartRef.current === 0) loadAnimationStartRef.current = t;
      if (!pause) {
        const elapsed = (t * 0.001 + timeOffsetRef.current) * timeScale;
        program.uniforms.iTime.value = elapsed;
        frozenTimeRef.current = elapsed;
      } else {
        program.uniforms.iTime.value = frozenTimeRef.current;
      }
      if (pageLoadAnimation && loadAnimationStartRef.current > 0) {
        const animationDuration = 2000;
        const animationElapsed = t - loadAnimationStartRef.current;
        program.uniforms.uPageLoadProgress.value = Math.min(animationElapsed / animationDuration, 1);
      }
      if (mouseReact) {
        const dampingFactor = 0.08;
        const smoothMouse = smoothMouseRef.current;
        const mouse = mouseRef.current;
        smoothMouse.x += (mouse.x - smoothMouse.x) * dampingFactor;
        smoothMouse.y += (mouse.y - smoothMouse.y) * dampingFactor;
        const mouseUniform = program.uniforms.uMouse.value;
        mouseUniform[0] = smoothMouse.x;
        mouseUniform[1] = smoothMouse.y;
      }
      renderer.render({ scene: mesh });
    };
    rafRef.current = requestAnimationFrame(update);
    ctn.appendChild(gl.canvas);
    if (mouseReact) ctn.addEventListener("mousemove", handleMouseMove);

    return () => {
      cancelAnimationFrame(rafRef.current);
      resizeObserver.disconnect();
      if (mouseReact && ctn) ctn.removeEventListener("mousemove", handleMouseMove);
      if (gl.canvas.parentElement === ctn) ctn.removeChild(gl.canvas);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      loadAnimationStartRef.current = 0;
      timeOffsetRef.current = Math.random() * 100;
    };
  }, [
    dpr, pause, timeScale, scale, gridMul, digitSize, scanlineIntensity, glitchAmount, flickerAmount,
    noiseAmp, chromaticAberration, ditherValue, curvature, tintVec, mouseReact, mouseStrength,
    pageLoadAnimation, brightness, handleMouseMove,
  ]);

  return <div ref={containerRef} className={`faulty-terminal-container ${className || ''}`} style={style} {...rest} />;
}

// --- CIRCULAR GALLERY COMPONENT ---
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function lerp(p1, p2, t) { return p1 + (p2 - p1) * t; }

function autoBind(instance) {
  const proto = Object.getPrototypeOf(instance);
  Object.getOwnPropertyNames(proto).forEach((key) => {
    if (key !== "constructor" && typeof instance[key] === "function") {
      instance[key] = instance[key].bind(instance);
    }
  });
}

function createTextTexture(gl, text, font = "bold 30px monospace", color = "black") {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  context.font = font;
  const metrics = context.measureText(text);
  const textWidth = Math.ceil(metrics.width);
  const textHeight = Math.ceil(parseInt(font, 10) * 1.2);
  canvas.width = textWidth + 20;
  canvas.height = textHeight + 20;
  context.font = font;
  context.fillStyle = color;
  context.textBaseline = "middle";
  context.textAlign = "center";
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new Texture(gl, { generateMipmaps: false });
  texture.image = canvas;
  return { texture, width: canvas.width, height: canvas.height };
}

class Title {
  constructor({ gl, plane, renderer, text, textColor = "#545050", font = "30px sans-serif" }) {
    autoBind(this);
    this.gl = gl; this.plane = plane; this.renderer = renderer; this.text = text;
    this.textColor = textColor; this.font = font;
    this.createMesh();
  }
  createMesh() {
    const { texture, width, height } = createTextTexture(this.gl, this.text, this.font, this.textColor);
    const geometry = new Plane(this.gl);
    const program = new Program(this.gl, {
      vertex: `attribute vec3 position; attribute vec2 uv; uniform mat4 modelViewMatrix; uniform mat4 projectionMatrix; varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragment: `precision highp float; uniform sampler2D tMap; varying vec2 vUv; void main() { vec4 color = texture2D(tMap, vUv); if (color.a < 0.1) discard; gl_FragColor = color; }`,
      uniforms: { tMap: { value: texture } }, transparent: true,
    });
    this.mesh = new Mesh(this.gl, { geometry, program });
    const aspect = width / height;
    const textHeight = this.plane.scale.y * 0.15;
    const textWidth = textHeight * aspect;
    this.mesh.scale.set(textWidth, textHeight, 1);
    this.mesh.position.y = -this.plane.scale.y * 0.5 - textHeight * 0.5 - 0.05;
    this.mesh.setParent(this.plane);
  }
}

class Media {
  constructor({ geometry, gl, image, index, length, renderer, scene, screen, text, viewport, bend, textColor, borderRadius = 0, font }) {
    this.extra = 0; this.geometry = geometry; this.gl = gl; this.image = image; this.index = index;
    this.length = length; this.renderer = renderer; this.scene = scene; this.screen = screen;
    this.text = text; this.viewport = viewport; this.bend = bend; this.textColor = textColor;
    this.borderRadius = borderRadius; this.font = font;
    this.createShader(); this.createMesh(); this.createTitle(); this.onResize();
  }
  createShader() {
    const texture = new Texture(this.gl, { generateMipmaps: false });
    this.program = new Program(this.gl, {
      depthTest: false, depthWrite: false,
      vertex: `precision highp float; attribute vec3 position; attribute vec2 uv; uniform mat4 modelViewMatrix; uniform mat4 projectionMatrix; uniform float uTime; uniform float uSpeed; varying vec2 vUv; void main() { vUv = uv; vec3 p = position; p.z = (sin(p.x * 4.0 + uTime) * 1.5 + cos(p.y * 2.0 + uTime) * 1.5) * (0.1 + uSpeed * 0.5); gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`,
      fragment: `precision highp float; uniform vec2 uImageSizes; uniform vec2 uPlaneSizes; uniform sampler2D tMap; uniform float uBorderRadius; varying vec2 vUv; float roundedBoxSDF(vec2 p, vec2 b, float r) { vec2 d = abs(p) - b; return length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0) - r; } void main() { vec2 ratio = vec2(min((uPlaneSizes.x / uPlaneSizes.y) / (uImageSizes.x / uImageSizes.y), 1.0), min((uPlaneSizes.y / uPlaneSizes.x) / (uImageSizes.y / uImageSizes.x), 1.0)); vec2 uv = vec2(vUv.x * ratio.x + (1.0 - ratio.x) * 0.5, vUv.y * ratio.y + (1.0 - ratio.y) * 0.5); vec4 color = texture2D(tMap, uv); float d = roundedBoxSDF(vUv - 0.5, vec2(0.5 - uBorderRadius), uBorderRadius); if(d > 0.0) { discard; } gl_FragColor = vec4(color.rgb, 1.0); }`,
      uniforms: {
        tMap: { value: texture }, uPlaneSizes: { value: [0, 0] }, uImageSizes: { value: [0, 0] },
        uSpeed: { value: 0 }, uTime: { value: 100 * Math.random() }, uBorderRadius: { value: this.borderRadius },
      }, transparent: true,
    });
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = this.image;
    img.onload = () => {
      texture.image = img;
      this.program.uniforms.uImageSizes.value = [img.naturalWidth, img.naturalHeight];
    };
  }
  createMesh() { this.plane = new Mesh(this.gl, { geometry: this.geometry, program: this.program }); this.plane.setParent(this.scene); }
  createTitle() { this.title = new Title({ gl: this.gl, plane: this.plane, renderer: this.renderer, text: this.text, textColor: this.textColor, font: this.font }); }
  update(scroll, direction) {
    this.plane.position.x = this.x - scroll.current - this.extra;
    const x = this.plane.position.x;
    const H = this.viewport.width / 2;
    if (this.bend === 0) { this.plane.position.y = 0; this.plane.rotation.z = 0; }
    else {
      const B_abs = Math.abs(this.bend);
      const R = (H * H + B_abs * B_abs) / (2 * B_abs);
      const effectiveX = Math.min(Math.abs(x), H);
      const arc = R - Math.sqrt(R * R - effectiveX * effectiveX);
      if (this.bend > 0) { this.plane.position.y = -arc; this.plane.rotation.z = -Math.sign(x) * Math.asin(effectiveX / R); }
      else { this.plane.position.y = arc; this.plane.rotation.z = Math.sign(x) * Math.asin(effectiveX / R); }
    }
    this.speed = scroll.current - scroll.last;
    this.program.uniforms.uTime.value += 0.04;
    this.program.uniforms.uSpeed.value = this.speed;
    const planeOffset = this.plane.scale.x / 2;
    const viewportOffset = this.viewport.width / 2;
    this.isBefore = this.plane.position.x + planeOffset < -viewportOffset;
    this.isAfter = this.plane.position.x - planeOffset > viewportOffset;
    if (direction === "right" && this.isBefore) { this.extra -= this.widthTotal; this.isBefore = this.isAfter = false; }
    if (direction === "left" && this.isAfter) { this.extra += this.widthTotal; this.isBefore = this.isAfter = false; }
  }
  onResize({ screen, viewport } = {}) {
    if (screen) this.screen = screen;
    if (viewport) {
      this.viewport = viewport;
      if (this.plane.program.uniforms.uViewportSizes) {
        this.plane.program.uniforms.uViewportSizes.value = [this.viewport.width, this.viewport.height];
      }
    }
    this.scale = this.screen.height / 1500;
    this.plane.scale.y = (this.viewport.height * (900 * this.scale)) / this.screen.height;
    this.plane.scale.x = (this.viewport.width * (700 * this.scale)) / this.screen.width;
    this.plane.program.uniforms.uPlaneSizes.value = [this.plane.scale.x, this.plane.scale.y];
    this.padding = 2;
    this.width = this.plane.scale.x + this.padding;
    this.widthTotal = this.width * this.length;
    this.x = this.width * this.index;
  }
}

class CircularGalleryApp {
  constructor(container, { items, bend, textColor, borderRadius, font, scrollSpeed, scrollEase }) {
    this.container = container; this.scrollSpeed = scrollSpeed;
    this.scroll = { ease: scrollEase, current: 0, target: 0, last: 0 };
    this.onCheckDebounce = debounce(this.onCheck, 200);
    this.createRenderer(); this.createCamera(); this.createScene(); this.onResize();
    this.createGeometry(); this.createMedias(items, bend, textColor, borderRadius, font);
    this.update(); this.addEventListeners();
  }
  createRenderer() { this.renderer = new Renderer({ alpha: true }); this.gl = this.renderer.gl; this.gl.clearColor(0, 0, 0, 0); this.container.appendChild(this.gl.canvas); }
  createCamera() { this.camera = new Camera(this.gl); this.camera.fov = 45; this.camera.position.z = 20; }
  createScene() { this.scene = new Transform(); }
  createGeometry() { this.planeGeometry = new Plane(this.gl, { heightSegments: 50, widthSegments: 100 }); }
  createMedias(items, bend = 1, textColor, borderRadius, font) {
    const defaultItems = [
      { image: `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80`, text: "Abstract Flow" },
      { image: `https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?w=800&q=80`, text: "Neon Rider" },
      { image: `https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&q=80`, text: "Tech Desk" },
      { image: `https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80`, text: "Urban Matrix" },
      { image: `https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&q=80`, text: "Code Lines" },
      { image: `https://images.unsplash.com/photo-1605379399642-870262d3d051?w=800&q=80`, text: "Dev Environment" },
      { image: `https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80`, text: "Team Collab" },
      { image: `https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80`, text: "Circuit Board" },
    ];
    const galleryItems = items && items.length ? items : defaultItems;
    this.mediasImages = galleryItems.concat(galleryItems);
    this.medias = this.mediasImages.map((data, index) => new Media({
      geometry: this.planeGeometry, gl: this.gl, image: data.image, index, length: this.mediasImages.length,
      renderer: this.renderer, scene: this.scene, screen: this.screen, text: data.text,
      viewport: this.viewport, bend, textColor, borderRadius, font,
    }));
  }
  onTouchDown(e) { this.isDown = true; this.scroll.position = this.scroll.current; this.start = e.touches ? e.touches[0].clientX : e.clientX; }
  onTouchMove(e) { if (!this.isDown) return; const x = e.touches ? e.touches[0].clientX : e.clientX; const distance = (this.start - x) * (this.scrollSpeed * 0.025); this.scroll.target = this.scroll.position + distance; }
  onTouchUp() { this.isDown = false; this.onCheck(); }
  onWheel(e) { const delta = e.deltaY || e.wheelDelta || e.detail; this.scroll.target += (delta > 0 ? this.scrollSpeed : -this.scrollSpeed) * 0.2; this.onCheckDebounce(); }
  onCheck() { if (!this.medias || !this.medias[0]) return; const width = this.medias[0].width; const itemIndex = Math.round(Math.abs(this.scroll.target) / width); const item = width * itemIndex; this.scroll.target = this.scroll.target < 0 ? -item : item; }
  onResize() {
    this.screen = { width: this.container.clientWidth, height: this.container.clientHeight };
    this.renderer.setSize(this.screen.width, this.screen.height);
    this.camera.perspective({ aspect: this.screen.width / this.screen.height });
    const fov = (this.camera.fov * Math.PI) / 180;
    const height = 2 * Math.tan(fov / 2) * this.camera.position.z;
    const width = height * this.camera.aspect;
    this.viewport = { width, height };
    if (this.medias) { this.medias.forEach((media) => media.onResize({ screen: this.screen, viewport: this.viewport })); }
  }
  update() {
    this.scroll.current = lerp(this.scroll.current, this.scroll.target, this.scroll.ease);
    const direction = this.scroll.current > this.scroll.last ? "right" : "left";
    if (this.medias) { this.medias.forEach((media) => media.update(this.scroll, direction)); }
    this.renderer.render({ scene: this.scene, camera: this.camera });
    this.scroll.last = this.scroll.current;
    this.raf = window.requestAnimationFrame(this.update.bind(this));
  }
  addEventListeners() {
    this.boundOnResize = this.onResize.bind(this);
    this.boundOnWheel = this.onWheel.bind(this);
    this.boundOnTouchDown = this.onTouchDown.bind(this);
    this.boundOnTouchMove = this.onTouchMove.bind(this);
    this.boundOnTouchUp = this.onTouchUp.bind(this);
    window.addEventListener("resize", this.boundOnResize);
    this.container.addEventListener("mousewheel", this.boundOnWheel);
    this.container.addEventListener("wheel", this.boundOnWheel);
    this.container.addEventListener("mousedown", this.boundOnTouchDown);
    this.container.addEventListener("mousemove", this.boundOnTouchMove);
    this.container.addEventListener("mouseup", this.boundOnTouchUp);
    this.container.addEventListener("touchstart", this.boundOnTouchDown, { passive: true });
    this.container.addEventListener("touchmove", this.boundOnTouchMove, { passive: true });
    this.container.addEventListener("touchend", this.boundOnTouchUp);
  }
  destroy() {
    window.cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.boundOnResize);
    this.container.removeEventListener("mousewheel", this.boundOnWheel);
    this.container.removeEventListener("wheel", this.boundOnWheel);
    this.container.removeEventListener("mousedown", this.boundOnTouchDown);
    this.container.removeEventListener("mousemove", this.boundOnTouchMove);
    this.container.removeEventListener("mouseup", this.boundOnTouchUp);
    this.container.removeEventListener("touchstart", this.boundOnTouchDown);
    this.container.removeEventListener("touchmove", this.boundOnTouchMove);
    this.container.removeEventListener("touchend", this.boundOnTouchUp);
    if (this.renderer && this.renderer.gl && this.renderer.gl.canvas.parentNode) {
      this.renderer.gl.canvas.parentNode.removeChild(this.renderer.gl.canvas);
    }
  }
}

function CircularGallery({ items, bend = 3, textColor = "#e2e8f0", borderRadius = 0.05, font = "bold 24px Inter", scrollSpeed = 2, scrollEase = 0.05 }) {
  const containerRef = useRef(null);
  useEffect(() => {
    const app = new CircularGalleryApp(containerRef.current, { items, bend, textColor, borderRadius, font, scrollSpeed, scrollEase });
    return () => app.destroy();
  }, [items, bend, textColor, borderRadius, font, scrollSpeed, scrollEase]);
  return <div className="circular-gallery" ref={containerRef} />;
}

// --- MAGNET LINES COMPONENT ---
function MagnetLines({
  rows = 9, columns = 9, containerSize = "30vmin", lineColor = "#334155",
  lineWidth = "0.5vmin", lineHeight = "4vmin", baseAngle = -10, className = "", style = {}
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const items = container.querySelectorAll("span");
    const onPointerMove = (pointer) => {
      items.forEach((item) => {
        const rect = item.getBoundingClientRect();
        const centerX = rect.x + rect.width / 2;
        const centerY = rect.y + rect.height / 2;
        const b = pointer.x - centerX;
        const a = pointer.y - centerY;
        const c = Math.sqrt(a * a + b * b) || 1;
        const r = (Math.acos(b / c) * 180) / Math.PI * (pointer.y > centerY ? 1 : -1);
        item.style.setProperty("--rotate", `${r}deg`);
      });
    };
    window.addEventListener("pointermove", onPointerMove);
    if (items.length) {
      const middleIndex = Math.floor(items.length / 2);
      const rect = items[middleIndex].getBoundingClientRect();
      onPointerMove({ x: rect.x, y: rect.y });
    }
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, []);

  const spans = Array.from({ length: rows * columns }, (_, i) => (
    <span key={i} style={{ '--rotate': `${baseAngle}deg`, backgroundColor: lineColor, width: lineWidth, height: lineHeight }} />
  ));

  return (
    <div ref={containerRef} className={`magnetLines-container ${className}`} style={{
      gridTemplateColumns: `repeat(${columns}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)`,
      width: containerSize, height: containerSize, ...style
    }}>
      {spans}
    </div>
  );
}

// --- MAIN APP COMPONENT ---
function App() {
    return (
        <div className="relative w-screen h-screen bg-black">
            <FaultyTerminal
                className="absolute inset-0 z-0"
                tint="#0099ff"
                brightness={0.4}
                noiseAmp={0.05}
                glitchAmount={1.1}
                scanlineIntensity={0.05}
            />

            <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
                <header className="absolute top-0 w-full p-8 text-center text-white">
                    <h1 className="text-4xl md:text-5xl font-bold tracking-wider" style={{fontFamily: "'Space Mono', monospace"}}>CYBERNETIC VISIONS</h1>
                    <p className="mt-2 text-lg text-slate-400">An Interactive Component Showcase</p>
                </header>

                <div className="w-full h-full flex items-center justify-center">
                    <CircularGallery bend={2.5} scrollSpeed={1.5} />
                </div>

                <footer className="absolute bottom-0 w-full p-8 flex justify-between items-center">
                    <MagnetLines containerSize="15vmin" lineColor="#475569" />
                    <p className="text-slate-500 text-sm" style={{fontFamily: "'Space Mono', monospace"}}>
                        Scroll / Drag to Explore
                    </p>
                    <MagnetLines containerSize="15vmin" lineColor="#475569" />
                </footer>
            </div>
        </div>
    );
}

ReactDOM.render(<App />, document.getElementById('root'));
