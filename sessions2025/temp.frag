const float PI = acos(-1.);
const float TAU = PI * 2.;

mat3 orthBas(vec3 z){
  z=normalize(z);
  vec3 up=abs(z.y)>.999?vec3(0,0,1):vec3(0,1,0);
  vec3 x=normalize(cross(up,z));
  return mat3(x,cross(z,x),z);
}

mat2 rot(float a) {
    float c = cos(a), s = sin(a);
    return mat2(c, s, -s, c);
}

vec2 pmod(vec2 p, float r) {
  float a = atan(p.x, p.y) + PI / r;
  float n = TAU / r;
  a = floor(a / n) * n;

  return p * rot(-a);
}


float sdBox( vec3 p, vec3 b, float r )
{
    vec3 q = abs(p) - b + r;
    return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - r;
}

// iq: 3D SDFs
float sdUnevenCapsule( vec2 p, float r1, float r2, float h )
{
    p.x = abs(p.x);
    float b = (r1-r2)/h;
    float a = sqrt(1.0-b*b);
    float k = dot(p,vec2(-b,a));
    if( k < 0.0 ) return length(p) - r1;
    if( k > a*h ) return length(p-vec2(0.0,h)) - r2;
    return dot(p, vec2(a,b) ) - r1;
}

// float sdRoundBox( vec3 p, vec3 b, float r )
// {
//   vec3 q = abs(p) - b + r;
//   return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - r;
// }

float sdCappedCylinder( vec3 p, float r, float h )
{
  vec2 d = abs(vec2(length(p.xy),p.z)) - vec2(r,h);
  return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}

float sdSphere(vec3 p, float r) {
    return length(p) - r;
}

struct RayHitInfo {
    float dist;
    vec3 normal;
    vec3 diffuse;
};

// ジオメトリを定義
float map(vec3 pos) {
    float d = 1e9;

    vec3 q = pos;
    // float fin = sdBox(q - vec3(0.,0., 0), vec3(0.2,0.65,0.1), 0.05);

    const int OBJ_NUM = 8;

    // for(int i=0;i<OBJ_NUM;i++) {
    //     float a = TAU * float(i) / float(OBJ_NUM);

    //     float fi = float(i);
    //     float theta = fi * TAU / float(OBJ_NUM);
    //     vec3 o = vec3(cos(theta), sin(theta), 0.);
    //     float r = 0.2;
    //     float blade = sdBox(q - o, vec3(0.2,0.65,0.1), 0.05);
    //     d = min(d, blade);
    //     // q.xy *= rot(iTime * .1);
    // }

    // q.xz *= rot(iTime);
    q.xy = pmod(q.xy, float(OBJ_NUM));
    float blade2D = sdUnevenCapsule(q.xy, .01, .2, .7);
    vec2 w = vec2(blade2D, abs(q.z) - 0.1);
    float blade = min(max(w.x,w.y),0.0) + length(max(w,0.0));
    d = min(d, blade);

    //return roomD;
    return d;
}

vec3 getNormal(vec3 pos) {
        vec3 EPS = vec3(0.001, 0., 0.);
        return normalize(vec3(
            map(pos + EPS.xyy) - map(pos - EPS.xyy),
            map(pos + EPS.yxy) - map(pos - EPS.yxy),
            map(pos + EPS.yyx) - map(pos - EPS.yyx)
        ));
}

struct SurfaceInfo {
    vec3 color;
    vec3 normal;
    vec3 position;
};

#define MAX_STEP 300
bool raymarching(vec3 ro, vec3 rd, inout SurfaceInfo info) {
    float dist;
    float sumDist;
    
    info.color = vec3(0.);
    info.normal = vec3(0.);
    
    for(int i=0; i<MAX_STEP; i++) {
        vec3 rPos = ro + rd * sumDist;
        dist = map(rPos);
        
        if (dist < 0.001){
            info.position = rPos;
            info.color = vec3(1.);
            info.normal = getNormal(info.position);
            return true;
        }
        sumDist += dist;
    }
    return false;
}


void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    vec2 uv = fragCoord/iResolution.xy;
    vec2 asp = iResolution.xy / min(iResolution.x, iResolution.y);
    vec2 suv = (uv * 2. - 1.) * asp;
    
    vec2 p = suv;
    
    vec3 ro = vec3(-1,-1.3,-4.);
    // fanにちかづく
    ro = vec3(0.,2.,-2.);

    // ro = vec3(-10, -1.3, -20.);
    vec3 ta = vec3(-2, -5, 0);
    ta = vec3(0., 0., 0.);
    vec3 fwd = normalize(ta - ro);
    vec3 up = vec3(0, 1, 0);
    vec3 side = normalize(cross(fwd, up));
    up = normalize(cross(side ,fwd));
    float fov = 1.;
    vec3 rd = normalize(p.x * side + p.y * up + fwd * fov);
    
    vec3 col = vec3(0.);
    
    
    SurfaceInfo info;
    if(raymarching(ro, rd, info)){
        // 衝突時
        col = info.normal * 0.5 + 0.5;
    } else {
        col = vec3(0.0);
    }
    
    

    // Output to screen
    fragColor = vec4(col, 1.0);
}