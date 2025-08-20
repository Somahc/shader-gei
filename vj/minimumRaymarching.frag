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

float distSphere(vec3 p, float r)
{
  return length(p) - r;
}

float distFunc(vec3 p)
{
  float sphere = distSphere(p, 1.);
  return sphere;
}

void main(void)
{
  vec2 p = out_texcoord;
  p -= 0.5;
  p /= vec2(v2Resolution.y / v2Resolution.x, 1.0);
  
  vec3 ro = vec3(0., 0., 8);
  vec3 rd = normalize(vec3(p, -3.));
  
  float d,t = 0.;
  
  for (int i = 0; i < 76; i++)
  {
    d = distFunc(ro + rd * t);
    if (d < 0.001) break;
    t += d;
  }
  
  vec3 rm_col = vec3(exp(-0.1 * t));

  out_color = vec4(rm_col, 1.);
}