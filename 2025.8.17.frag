precision highp float;
uniform vec2 resolution;
uniform vec2 mouse;
uniform float time;
uniform sampler2D backbuffer;

mat2 rot(float r)
{
  return mat2(cos(r),sin(r),-sin(r),cos(r));
}

void main()
{
  vec2 r=resolution;
  vec2 p=(gl_FragCoord.xy*2.-r)/min(r.x,r.y);
  
  p = mod(p, .5) - .25;
  for(int i = 0; i < 5; i++)
  {
    p = abs(p) - .1;
    p *= rot(time * .5);
    p -= .15;
  }
  float c = 0.005 / abs(p.x);
  float d = 0.005 / abs(p.y);
  // vec3 color = c * vec3(0,1,1);
  gl_FragColor=vec4(c * vec3(0,1,1) + d * vec3(1,1,0),1);
}