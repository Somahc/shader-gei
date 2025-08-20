#version 410 core

uniform float fGlobalTime; // in seconds
uniform vec2 v2Resolution; // viewport resolution (in pixels)
uniform float fFrameTime; // duration of the last frame, in seconds

uniform sampler1D texFFT; // towards 0.0 is bass / lower freq, towards 1.0 is higher / treble freq
uniform sampler1D texFFTSmoothed; // this one has longer falloff and less harsh transients
uniform sampler1D texFFTIntegrated; // this is continually increasing
uniform sampler2D texPreviousFrame; // screenshot of the previous frame
uniform sampler2D texChecker;
uniform sampler2D texNoise;
uniform sampler2D texTex1;
uniform sampler2D texTex2;
uniform sampler2D texTex3;
uniform sampler2D texTex4;

uniform float BPM = 120;

in vec2 out_texcoord;
layout(location = 0) out vec4 out_color; // out_color must be written in order to see anything


float saturate(float x) { return clamp(x, 0, 1); }
vec2  saturate(vec2 x)  { return clamp(x, 0, 1); }
vec3  saturate(vec3 x)  { return clamp(x, 0, 1); }
vec4  saturate(vec4 x)  { return clamp(x, 0, 1); }

vec3 mix4(vec3 a, vec3 b, vec3 c, vec3 d, float t)
{
    t = fract(t / 4) * 4;
    vec3 acc = mix(a, b, saturate(t));
    acc = mix(acc, c, saturate(t - 1));
    acc = mix(acc, d, saturate(t - 2));
    acc = mix(acc, a, saturate(t - 3));
    return acc;
}

mat2 rot(float r)
{
  return mat2(cos(r),sin(r),-sin(r),cos(r));
}


float soundCircle(vec2 p)
{
  float r = max(length(p), 1e-3);
  float d = clamp(r, 0.0, 1.0);
  
  float fft = texture( texFFT, d ).r;
  fft = texture(texFFTSmoothed, d).r;
  
  fft *= 100.0;
  
  // fft = pow(fft, .5);
  
  return fft;
}

void main(void)
{
  vec2 p = out_texcoord;
  p -= 0.5;
  p /= vec2(v2Resolution.y / v2Resolution.x, 1.0);
  
  float beatLength = 60.0 / BPM;
  float beat = floor(fGlobalTime / beatLength);
  int scene = int(mod(beat, 4.0)); // scene ID
  
  p *= rot(fGlobalTime * .01);
  
  float k = 0.125;
  p = mod(p, 2*k) - k;
  
  float rotateLines = 0.002 / abs(p.x);
  float soundCircles = soundCircle(p);
  
  vec3 a = rotateLines * vec3(1,1,1);
  vec3 b = rotateLines*vec3(0,1,0);
  vec3 c = soundCircles*vec3(1,0,1);
  vec3 d = soundCircles*vec3(0,1,1);
  
  vec3 col = mix4(a, c, b, d, float(scene));

  out_color = vec4(col, 1.0);
}