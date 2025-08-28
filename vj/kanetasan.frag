#version 300 es
precision highp float;
out vec4 o;
uniform vec2 resolution;
uniform float time;
uniform float bpm;

const float pi = acos(-1.);
const float pi2 = pi * 2.;

float dSphere(vec3 p, float r)
{
  return length(p) - r;
}

float dBox(vec3 p, float a)
{
  p = abs(p) - a;
  return max(p.x, max(p.y, p.z));
}

mat2 rot(float a ) {
	float c = cos(a), s=sin(a);
	return mat2(c,s,-s,c);
}

float map(vec3 p)
{
  float d = length(p) - .5;

  vec3 q = p;
  q.y -= 3.;
  q.x = abs(q.x) - 10.;
  float k = 2.5;
  q.z = mod(q.z, k) - k / 2.;
  for(int i = 0; i < 7; i++)
    {
      q = abs(q) - vec3(0.,1.5, 1.5);
      q.xy *= rot(float(i) - pi * 0.125);
      float b = dBox(q, 1.);
      d = min(d, b);
    }
      d = min(d, p.y);
  

  return d;
}


void main()
{
  vec2 uv=(gl_FragCoord.xy-0.5*resolution)/resolution.y;
  vec3 ro = vec3(0, 5, 10. * time * 30.);
  vec3 ta = vec3(0., 3, 1.);
  vec3 fo = normalize(ta - ro);
  vec3 le = normalize(cross(vec3(0,1,0), fo));
  vec3 up = normalize(cross(fo, le));
  
  
  vec3 ray = normalize(fo + le * uv.x + up * uv.y);

  float t = .01;

  vec3 col = vec3(0.);

  for (int i = 0; i < 99; i++)
  {
    vec3 pos = ro + ray * t;
    float d = map(pos);
    if (d < .0001) {
      col = vec3(1. - float(i) / 99.);
      break;
    };
    t += d;
  }
  
  o=vec4(col,1.);
}