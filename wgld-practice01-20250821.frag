precision mediump float;
uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

// See: https://wgld.org/d/glsl/g004.html
void main(void) {
  vec2 p = (gl_FragCoord.xy * 2.0 - resolution) / min(resolution.x, resolution.y);

  float circle = 0.02 / abs(sin(time * 0.1) * 0.5 + 0.5 - length(p));

  vec2 v = vec2(0., 1.);
  float t = dot(p,v) / (length(p) * length(v));

  // flower
  float u = sin((atan(p.y, p.x) + time * .25) * 20.0) * .01;

  t = .01 / abs(0.5 + u - length(p));

  // fan
  u = abs(sin((atan(p.y, p.x) - length(p) + time * .1) *  10.) * .5) + .3;
  t = .01 / abs(u - length(p));

  gl_FragColor = vec4(vec3(t), 1.0);
}
