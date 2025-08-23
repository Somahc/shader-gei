precision mediump float;
uniform float time;
uniform vec2 mouse;
uniform vec2 resolution;

vec3 hash31(vec3 p3) {
    p3 = fract(p3 * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.xxy + p3.yzz) * p3.zyx);
}

// Based on LiveCoding VJ 2023-11-04  by Renard
// See: https://www.shadertoy.com/view/cltcWM
void main(void) {
  vec2 asp = resolution / min(resolution.x, resolution.y);
  // vec2 uv = (gl_FragCoord.xy * 2. - resolution.xy) / min(resolution.x, resolution.y);
vec2 fc = gl_FragCoord.xy;
vec2 uv = fc / resolution;
vec2 suv = (uv * 2. - 1.) * asp;

float bpm = 240. / 140.;
float alt  = time / bpm;
float lt = alt;


  vec3 col = vec3(suv.x, suv.y, 1.);

  col = vec3(.0);

  vec2 ruv = suv*8.;
  vec2 auv = abs(fract(ruv)-.5);

  col = vec3(auv.x, auv.y, 1.);

  col = col - col;

  // CROSS MARK
  float crossMark = float( any(lessThan(auv, vec2(.02))) && all(lessThan(auv, vec2(.3))) );
  // col += crossMark;
  // if (hash31(ceil(vec3(ruv, alt*1.))).x < .1) col += crossMark;



  // BOITTOM STRIPE
  float bandHeight = step(abs(uv.y-0.1), .03);
  float bandWidth = step(abs(uv.x - .5), .5 * fract(alt));
  // bandWidth = step(abs(suv.x), .5* fract(alt));
  float stripePattern = step(fract(dot(vec2(1), suv) * 20. + 0. * alt), .5);
  // stripePattern = fract(dot(vec2(1), suv));

  col += vec3(1) * bandWidth * bandHeight * stripePattern;

   // col += vec3(1,1,1) * 1. * 1. * stripePattern;

   // col += bandWidth * vec3(1.);



  gl_FragColor = vec4(col, 1.);
}
