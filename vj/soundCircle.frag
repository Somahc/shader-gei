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

in vec2 out_texcoord;
layout(location = 0) out vec4 out_color; // out_color must be written in order to see anything

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
  
  float col = soundCircle(p);

  out_color = vec4(vec3(1,1,1) * col, 1.);
}