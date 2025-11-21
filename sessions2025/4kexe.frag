const float PI = acos(-1.);
const float TAU = PI * 2.;

uint seed;
uint PCGHash()
{
    seed = seed * 747796405u + 2891336453u;
    uint state = seed;
    uint word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
    return (word >> 22u) ^ word;
}

float rnd1()
{
    return float(PCGHash()) / float(0xFFFFFFFFU);    
}

vec2 rnd2(){
    return vec2(rnd1(),rnd1());
}

mat3 orthBas(vec3 z){
  z=normalize(z);
  vec3 up=abs(z.y)>.999?vec3(0,0,1):vec3(0,1,0);
  vec3 x=normalize(cross(up,z));
  return mat3(x,cross(z,x),z);
}

void tangentSpaceBasis(vec3 normal,inout vec3 tangent,inout vec3 binormal){
    vec3 d = vec3(0,1,0);
    if(abs(normal.y) > 0.99) d = vec3(0,0,1);
    tangent = normalize(cross(normal,d));
    binormal = normalize(cross(tangent,normal));
}

vec3 worldToLocal(vec3 tangent,vec3 normal,vec3 binormal,vec3 world){
    return vec3(dot(world,tangent),dot(world,normal),dot(world,binormal));
}

vec3 localToWorld(vec3 tangent,vec3 normal,vec3 binormal,vec3 local){
    return tangent * local.x + binormal * local.z + normal * local.y;
}

vec3 hemisphereSampling(vec2 uv){
    float theta = acos(uv.x);
    float phi = 2.0 * PI * uv.y;
    return vec3(sin(theta) * cos(phi),cos(theta),sin(theta) * sin(phi));
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

// 最も近いSDFの情報を入れる　マテリアル識別用
struct SDFInfo {
    int index;
};

// ジオメトリを定義
float map(vec3 pos, inout SDFInfo info) {
    float d;
    info.index = 0;
    
    float tubeOuter = sdCappedCylinder(pos + vec3(0,0,0.0), 1.8, 2.5);
    
    float tubeWall = sdBox(pos - vec3(0,0,0), vec3(5, 5, 5.), 0.);
    
    float roomFrontInner = sdBox(pos - vec3(0,2,-2.), vec3(3.5,4.0,1.9), 0.);
    
    // Z軸に長い立体から、奥行き1.5の円柱をくりぬく
    d = max(tubeWall, -tubeOuter);

    
    // 上でできた立体から手前側を別の立体でくり抜いて空間作る
    d = max(d, -roomFrontInner);

    // 床面を合成
    float floorD = sdBox(pos - vec3(0,-2.3,-2.), vec3(5., .6, 6.), 0.);

    info.index = (floorD < d) ? 1 : info.index;

    d = min(d, floorD);

    // ファン
    float fanCenter = sdCappedCylinder(pos - vec3(0,0,.8), 0.35, .3);
    info.index = (fanCenter < d) ? 0 : info.index;
    d = min(d, fanCenter);
    // return d;

    vec3 q = pos;
    const int OBJ_NUM = 7;

    q -= vec3(0., 0., .7); // ファンの位置

    q.xy *= rot(0.18); // ちょっとbladeたちを回しとく

    for(int i=0; i<OBJ_NUM; i++) {
        q.xy *= rot(0.9);
        vec3 qq = q;
        // qq.xz *= rot(.1 * TAU); // bladeをひねらせる(これやるとshadowの計算おかしくなるので一旦やめ)

        // 2Dで形作ってextrude
        float blade2D = sdUnevenCapsule(qq.xy, .03, .35, 1.4);
        vec2 w = vec2(blade2D, abs(qq.z) - 0.1);
        float blade = min(max(w.x,w.y),0.0) + length(max(w,0.0));
        info.index = (blade < d) ? 0 : info.index;
        d = min(d, blade);
    }


    return d;
}

vec3 getNormal(vec3 pos) {
        vec3 EPS = vec3(0.001, 0., 0.);
        SDFInfo dummy;
        return normalize(vec3(
            map(pos + EPS.xyy, dummy) - map(pos - EPS.xyy, dummy),
            map(pos + EPS.yxy, dummy) - map(pos - EPS.yxy, dummy),
            map(pos + EPS.yyx, dummy) - map(pos - EPS.yyx, dummy)
        ));
}

struct SurfaceInfo {
    vec3 color;
    vec3 normal;
    vec3 position;
    float rayDist;
};

#define NUM_MAT 2
const vec3 color[NUM_MAT] = vec3[NUM_MAT](vec3(1.0), vec3(1.0));

#define MAX_STEP 300
bool raymarching(vec3 ro, vec3 rd, inout SurfaceInfo info) {
    float dist;
    float sumDist = 0.;
    
    info.color = vec3(0.);
    info.normal = vec3(0.);

    SDFInfo sdf_info;
    
    for(int i=0; i<MAX_STEP; i++) {
        vec3 rPos = ro + rd * sumDist;
        dist = map(rPos, sdf_info);
        
        if (dist < 0.001){
            info.position = rPos;
            // info.color = vec3(1.);
            info.color = color[sdf_info.index];
            info.normal = getNormal(info.position);
            info.rayDist = sumDist;
            return true;
        }
        sumDist += dist;
    }
    return false;
}

#define LIGHT_DIR normalize(vec3(0.5, 1.0, -0.6))
#define RTAO_NUM 16 // AO
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    seed = uint(uint(iFrame+1) * uint(fragCoord.x + iResolution.x * fragCoord.y));
    //vec2 uv = (fragCoord + rnd2()) / iResolution.xy; //アンチエイリアス
    vec2 uv = (fragCoord)/iResolution.xy;
    vec2 asp = iResolution.xy / min(iResolution.x, iResolution.y);
    vec2 suv = (uv * 2. - 1.) * asp;
    
    vec2 p = suv;
    
    vec3 ro = vec3(-1,-1.3,-3.8);
    // fanにちかづく
    // ro = vec3(-1,-1.3,-1.5);

    // ro = vec3(0.0,1.0 * sin(iTime),-10.5);
    vec3 ta = vec3(-2, -5, 0);
    ta = vec3(0);
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
        
        vec3 shadow_dir = LIGHT_DIR;
        vec3 shadow_ori = info.position + shadow_dir * 0.02;
        SurfaceInfo shadow_info;
        bool hit = raymarching(shadow_ori, shadow_dir, shadow_info);
        float shadow = 1.0 - float(hit);

        vec3 tangent, binormal;
        tangentSpaceBasis(info.normal, tangent, binormal);

        float RTAO = 0.0;
        for(int i=0; i < RTAO_NUM; i++) {
            vec3 dir = hemisphereSampling(rnd2());
            dir = localToWorld(tangent, info.normal, binormal, dir);
            vec3 ori = info.position + dir * 0.02;
            SurfaceInfo rtaoInfo;
            bool hit = raymarching(ori, dir, rtaoInfo);

            if(rtaoInfo.rayDist < 1.0) {
                RTAO += float(hit);
            }
        }
        RTAO = (1.0 - RTAO / float(RTAO_NUM));

        col = info.color * (max(dot(info.normal, LIGHT_DIR), 0.) * shadow + 0.2) * RTAO;

        // col = info.color * (max(dot(info.normal, LIGHT_DIR), 0.) * shadow + 0.2) * 1.;
    } else {
        col = vec3(0.0);
    }
    
    

    // Output to screen
    fragColor = vec4(col, 1.0);
}