#define MAT_UNDEFINED -1
#define MAT_FLOOR 0
#define MAT_LIGHT 1
#define MAT_WALL 2
#define MAT_METAL 3

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

// #define saturate(x) clamp(x, 0.0, 1.0)

// 視点マウス操作用の制限
float remap(float val, float inMin, float inMax, float outMin, float outMax)
{
    return clamp(outMin + (val - inMin) * (outMax - outMin) / (inMax - inMin), outMin, outMax);
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

vec3 cosineSampling(vec2 uv,inout float pdf){
    float theta = acos(1.0 - 2.0f * uv.x) * 0.5;
    float phi = 2.0 * PI * uv.y;
    pdf = cos(theta) / PI;
    return vec3(sin(theta) * cos(phi),cos(theta),sin(theta) * sin(phi));
}

vec3 IBL(vec3 dir){
    return vec3(0.0);
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

float sdStandWithFence(vec3 pos, vec3 standPos) {
    float d = 1e10;
    // float  fanFrontStandD = sdBox(pos - float3(0,-1.72,-0.15), float3(0.14,0.02,0.1), 0.0);
    float fanFrontStandD = sdBox(pos - standPos, vec3(0.14,0.02,0.1), 0.0);
    d = min(d, fanFrontStandD);
    float tesuriD = sdBox(pos - vec3(standPos.x,standPos.y + 0.06,standPos.z -0.07), vec3(0.11,0.05,0.005), 0.0);
    float tesuriHallD = sdBox(pos - vec3(standPos.x,standPos.y + 0.06,standPos.z -0.07), vec3(0.1,0.04,0.1), 0.0);
    tesuriD = max(tesuriD, -tesuriHallD);
    d = min(d, tesuriD);
    return d;
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
    info.index = MAT_WALL;
    float tubeOuter      = sdCappedCylinder(pos + vec3(0.0, 0.0, 0.0), 1.8, 5.0);
    float tubeWall       = sdBox(pos - vec3(0.0, 0.0, 0.0), vec3(5.0, 5.0, 10.0), 0.0);
    float roomFrontInner = sdBox(pos - vec3(0.0, 0.0, -4.0), vec3(3.5, 4.0, 3.9), 0.0);
    float tubeFarLight   = sdCappedCylinder(pos - vec3(0.0, 0.0, 7.0), 2.0, 2.5);

    // Z 軸方向に長い立体 − 外側円柱（トンネルの空間）
    d = max(tubeWall, -tubeOuter);

    // 手前側をくり抜いて空間を作る
    d = max(d, -roomFrontInner);

    // ライト用の奥の円柱
    info.index = (tubeFarLight < d) ? MAT_LIGHT : info.index;
    d = min(d, tubeFarLight);

    // 床
    float floorD = sdBox(pos - vec3(0.0, -2.3, 5.9), vec3(5.0, 0.6, 6.0), 0.0);
    info.index = (floorD < d) ? MAT_FLOOR : info.index;
    d = min(d, floorD);

    // 床（手前）
    float floorFrontD = sdBox(pos - vec3(0.0, -3.25, 2.0), vec3(5.0, 0.6, 10.0), 0.0);
    info.index = (floorFrontD < d) ? MAT_FLOOR : info.index;
    d = min(d, floorFrontD);

    // 壁の柱 (left)
    float hashiraLeftD = sdBox(pos - vec3(-4.3, 0.0, -2.0), vec3(1.0, 10.0, 0.4), 0.0);
    info.index = (hashiraLeftD < d) ? MAT_WALL : info.index;
    d = min(d, hashiraLeftD);

    hashiraLeftD = sdBox(pos - vec3(-4.3, 0.0, -5.5), vec3(1.0, 10.0, 0.4), 0.0);
    info.index = (hashiraLeftD < d) ? MAT_WALL : info.index;
    d = min(d, hashiraLeftD);

    // 壁の柱 (right)
    float hashiraRightD = sdBox(pos - vec3(4.3, 0.0, -2.0), vec3(1.0, 10.0, 0.4), 0.0);
    info.index = (hashiraRightD < d) ? MAT_WALL : info.index;
    d = min(d, hashiraRightD);

    hashiraRightD = sdBox(pos - vec3(4.3, 0.0, -5.5), vec3(1.0, 10.0, 0.4), 0.0);
    info.index = (hashiraRightD < d) ? MAT_WALL : info.index;
    d = min(d, hashiraRightD);

    // ファンの前の台
    for (int i = 0; i < 5; i++) {
        float fanFrontStandD = sdStandWithFence(pos, vec3(-0.5 + float(i) * 0.25, -1.72, -0.15));
        info.index = (fanFrontStandD < d) ? MAT_METAL : info.index;
        d = min(d, fanFrontStandD);
    }

    // はしご
    float ladderStandD = sdBox(pos - vec3(0.65, -1.72, -0.15), vec3(0.14, 0.02, 0.1), 0.0);
    info.index = (ladderStandD < d) ? MAT_METAL : info.index;
    d = min(d, ladderStandD);

    // 縦棒
    vec3 posForLadder = pos;
    posForLadder.yz *= rot(TAU * 1.25);
    float ladderD = sdCappedCylinder(posForLadder - vec3(0.68, -0.27, 2.2), 0.0003, 0.5);
    info.index = (ladderD < d) ? MAT_METAL : info.index;
    d = min(d, ladderD);
    ladderD = sdCappedCylinder(posForLadder - vec3(0.75, -0.27, 2.2), 0.0003, 0.5);
    info.index = (ladderD < d) ? MAT_METAL : info.index;
    d = min(d, ladderD);

    // 横棒
    vec3 posForLadderH = pos;
    posForLadderH.xz *= rot(TAU * 1.25);
    for (int i = 0; i < 20; i++) {
        ladderD = sdCappedCylinder(
            posForLadderH - vec3(-0.27, -1.8 + float(i) * -0.05, -0.717),
            0.0003,
            0.033
        );
        info.index = (ladderD < d) ? MAT_METAL : info.index;
        d = min(d, ladderD);
    }

    // ファン
    float fanCenter = sdCappedCylinder(pos - vec3(0,0,.8), 0.35, .3);
    info.index = (fanCenter < d) ? MAT_METAL : info.index;
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
        float blade2D = sdUnevenCapsule(qq.xy, .03, .35, 1.35);
        vec2 w = vec2(blade2D, abs(qq.z) - 0.1);
        float blade = min(max(w.x,w.y),0.0) + length(max(w,0.0));
        info.index = (blade < d) ? MAT_METAL : info.index;
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
    vec3 emission;
};

void materialize(inout SurfaceInfo info, in SDFInfo sdf_info) {
    vec3 dPos = info.position;
    vec3 diff = info.color;
    if (sdf_info.index == MAT_UNDEFINED) diff = vec3(1.0, 0.0, 1.0);
    // キャットウォーク下がおかしくなる 上向きの部分だけ床マテリアルになるよう法線での指定も(それでも完全には直らない)
    if(sdf_info.index == MAT_FLOOR && info.normal.y > 0.9) {
        diff = vec3(1,0,0);
    }
    if (sdf_info.index == MAT_WALL)  diff = vec3(0,1,0);
    if (sdf_info.index == MAT_METAL) diff = vec3(0,0,1);
    if (sdf_info.index == MAT_LIGHT) diff = vec3(1,1,0);

    info.color = diff;
}

#define NUM_MAT 4
const vec3 color[NUM_MAT] = vec3[NUM_MAT](vec3(1.0),vec3(1.0),vec3(1.0),vec3(1.0));
const vec3 emission[NUM_MAT] = vec3[NUM_MAT](vec3(0.0),vec3(0.5),vec3(0.0),vec3(0.0));

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
            info.color = color[sdf_info.index];
            info.normal = getNormal(info.position);
            info.rayDist = sumDist;
            info.emission = emission[sdf_info.index];

            materialize(info, sdf_info);

            return true;
        }
        sumDist += dist;
    }
    return false;
}

#define LIGHT_DIR normalize(vec3(0.5, 1.0, -0.6))
#define MAX_DEPTH 10 // パストレのバウンス最大
#define GODRAY_SAMPLES 8 // ゴッドレイのサンプル数
void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    const bool DEBUG = true;
    const bool DEBUG_NORMAL = false;

    seed = uint(uint(iFrame+1) * uint(fragCoord.x + iResolution.x * fragCoord.y));
    // vec2 uv = (fragCoord + rnd2()) / iResolution.xy; //アンチエイリアス
    vec2 uv = (fragCoord)/iResolution.xy;
    vec2 asp = iResolution.xy / min(iResolution.x, iResolution.y);
    vec2 suv = (uv * 2. - 1.) * asp;
    
    vec2 p = suv;
    
    vec3 ro = vec3(-1,-1.3,-3.8);
    // fanにちかづく
    // ro = vec3(-1,-1.3,-1.5);

    // ro = vec3(1,-2.3,-0.8);

    // マウスで視点動かせるように
    float mousex = 1.0*iMouse.x/iResolution.x + 0.75;
    float mousey = remap(iMouse.y/iResolution.y, 0.0, 1.0, 1.5, 10.0);
    ro = vec3(-5.0 * cos(mousex), mousey - 5., -5.0 * sin(mousex));
    vec3 camPos = ro;
    vec3 ta = vec3(-2, -5, 0);
    ta = vec3(0, -1.0,0 );
    vec3 fwd = normalize(ta - ro);
    vec3 up = vec3(0, 1, 0);
    vec3 side = normalize(cross(fwd, up));
    up = normalize(cross(side ,fwd));
    float fov = 1.;
    vec3 rd = normalize(p.x * side + p.y * up + fwd * fov);

    vec3 LTE = vec3(0.0); // 最終結果
    vec3 throughput = vec3(1.0); // 反射率
    
    vec3 col = vec3(0.);

    // デバッグ用
    if(DEBUG) {
        SurfaceInfo info;
        if (raymarching(ro, rd, info)) {
            col = info.color * (max(dot(info.normal,LIGHT_DIR),0.0) + 0.2);
            if (DEBUG_NORMAL) col = info.normal * 0.5 + 0.5;
        } else {
            col = vec3(0.0);
        }
    } else {

        vec3 end = vec3(1e9);
        for(int b=0; b<MAX_DEPTH; b++) {
            SurfaceInfo info;
            if(!raymarching(ro, rd, info)) {
                // 衝突しなかったらその時点でのLTE加算をしてbreak
                LTE += throughput * IBL(rd);
                break;
            }

            if(b == 0) {
                end = info.position; // 最初のレイ衝突地点
            }

            if(length(info.emission) > 0.0){
                //光源に衝突した場合
                LTE += throughput * info.emission;
                break;
            }

            // 衝突時
            
            vec3 tangent, binormal;
            tangentSpaceBasis(info.normal, tangent, binormal);
            vec3 normal = info.normal;

            vec3 localWo = worldToLocal(tangent, normal, binormal, -rd);

            // 方向サンプリング
            float pdf;
            vec3 local_wi = cosineSampling(rnd2(), pdf);

            vec3 wi = localToWorld(tangent, normal, binormal, local_wi);

            // BSDFの計算
            vec3 bsdf = info.color / PI; // Lambert
            float cosine = dot(wi, normal);

            // throughputの更新
            throughput *= bsdf * cosine / pdf;

            // レイの更新
            rd = wi;
            ro = info.position + rd * 0.01;
        }

        // ゴッドレイ・ボリュームレンダリング
        vec3 lightDir = vec3(0., 0.2, 0.8);
        float toAdd = 0.15 / float(GODRAY_SAMPLES);

        if(length(end) < 1e8) {
            for(int i=0; i<GODRAY_SAMPLES; i++) {
                vec3 p = mix(camPos, end, rnd1());
                SurfaceInfo godray_info;
                if(raymarching(p, lightDir, godray_info)) {
                    if (length(godray_info.emission) > 0.0) {
                        LTE += godray_info.emission * toAdd;
                    }
                }
            }
        }
        
        col = LTE;

    }
    // Output to screen
    fragColor = vec4(col, 1.0);
}