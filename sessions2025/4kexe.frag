#iChannel0 "self"

// コメントアウトでパストレを有効に
#define DEBUG
// Blossomではコメントアウトする
#define IS_IN_VSCODE

#define MAT_UNDEFINED -1
#define MAT_FLOOR 0
#define MAT_LIGHT 1
#define MAT_WALL 2
#define MAT_METAL 3
#define MAT_CEILING_LIGHT 4
#define MAT_VERTICAL_LIGHT 5

#define sat(x) clamp(x,0.,1.)

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
    return vec3(4.0);
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
    float tubeWall       = sdBox(pos - vec3(0.0, 0.0, 0.0), vec3(5.0, 50.0, 10.0), 0.0);
    float roomFrontInner = sdBox(pos - vec3(0.0, 0.0, -6.0), vec3(3.5, 30.0, 5.9), 0.0);
    float tubeFarLight   = sdCappedCylinder(pos - vec3(0.0, 0.0, 7.0), 2.0, 2.5);
    float ceilingLight = sdBox(pos - vec3(0.0, 25.5, -4.0), vec3(10.5 * 1.1, 8.6, 3.9), 0.0);
    float verticalFaceLight = sdBox(pos - vec3(0.0,0.0,-10.0), vec3(10.0,10.0,0.1), 0.0);

    // Z 軸方向に長い立体 − 外側円柱（トンネルの空間）
    d = max(tubeWall, -tubeOuter);

    // 手前側をくり抜いて空間を作る
    d = max(d, -roomFrontInner);

    // 天井の面光源
    info.index = (ceilingLight < d) ? MAT_CEILING_LIGHT : info.index;
    d = min(d, ceilingLight);

    // ファンの前の面光源
    info.index = (verticalFaceLight < d) ? MAT_VERTICAL_LIGHT : info.index;
    d = min(d, verticalFaceLight);

    // ライト用の奥の円柱
    info.index = (tubeFarLight < d) ? MAT_LIGHT : info.index;
    d = min(d, tubeFarLight);

    // 床
    float floorD = sdBox(pos - vec3(0.0, -2.3, 5.9), vec3(5.0, 0.6, 6.0), 0.0);
    // ↓がファン下のアーティファクトの原因だったのでコメントアウト
    // info.index = (floorD < d) ? MAT_FLOOR : info.index;
    d = min(d, floorD);

    // 床（手前）
    float floorFrontD = sdBox(pos - vec3(0.0, -3.25, 2.0), vec3(5.0, 0.6, 15.0), 0.0);
    info.index = (floorFrontD < d) ? MAT_FLOOR : info.index;
    d = min(d, floorFrontD);

    // 壁の柱 (left)
    float hashiraLeftD = sdBox(pos - vec3(-4.3, 0.0, -2.0), vec3(1.0, 20.0, 0.4), 0.0);
    info.index = (hashiraLeftD < d) ? MAT_WALL : info.index;
    d = min(d, hashiraLeftD);

    hashiraLeftD = sdBox(pos - vec3(-4.3, 0.0, -5.5), vec3(1.0, 20.0, 0.4), 0.0);
    info.index = (hashiraLeftD < d) ? MAT_WALL : info.index;
    d = min(d, hashiraLeftD);

    // 壁の柱 (right)
    float hashiraRightD = sdBox(pos - vec3(4.3, 0.0, -3.5), vec3(1.0, 20.0, 0.4), 0.0);
    info.index = (hashiraRightD < d) ? MAT_WALL : info.index;
    d = min(d, hashiraRightD);

    hashiraRightD = sdBox(pos - vec3(4.3, 0.0, -7.5), vec3(1.0, 20.0, 0.4), 0.0);
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
        // qq.xz *= rot(.125 * TAU); // bladeをひねらせる(これやるとshadowの計算おかしくなるので一旦やめ)

        // 2Dで形作ってextrude
        float blade2D = sdUnevenCapsule(qq.xy, .03, .35, 1.35);
        vec2 w = vec2(blade2D, abs(qq.z) - 0.12);
        float blade = min(max(w.x,w.y),0.0) + length(max(w,0.0));
        info.index = (blade < d) ? MAT_METAL : info.index;
        d = min(d, blade);
    }

    /* ////////
    BUMP MAP
    */ ////////
    if(info.index == MAT_WALL) {
        // See: https://www.shadertoy.com/view/cltcWM
        float bump=sat(dot(vec3(0,1,0),smoothstep(.02,.0,abs(fract(pos*1.) - 0.5))))*.01;

        d+=bump;
    }

    return d;
}

// Thanks Shane - https://www.shadertoy.com/view/lstGRB
float noise(vec3 p) {
	const vec3 s = vec3(7.0, 157.0, 113.0);
	vec3 ip = floor(p);
    vec4 h = vec4(0.0, s.yz, s.y + s.z) + dot(ip, s);
	p -= ip;
	
    h = mix(fract(sin(h) * 43758.5453), fract(sin(h + s.x) * 43758.5453), p.x);
	
    h.xy = mix(h.xz, h.yw, p.y);
    return mix(h.x, h.y, p.z);
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

// See: https://www.shadertoy.com/view/WllfzB
vec3 getConcreteMaterial(vec3 p, float dist, float id) {
    vec3 mat;
    vec3 tp =  p + vec3(0.32, 0.40, 1.2) * mod(id, 10.0);
    
    // Mix a couple of shades of grey.
    float baseColor = smoothstep(0.0, 0.5, noise(tp));
    mat = mix(vec3(0.18, 0.17, 0.17), vec3(0.20, 0.19, 0.19), baseColor);

    // Surface roughness.
    dist = 1.0 - smoothstep(0.0, 1.0, dist / 14.0);
    float rough = noise(tp * 60.0) * 0.005 // Base
         		  + step(0.2, noise(tp * 26.666)) * 0.0033; // Pits/dents.
    mat += rough * 24.0;
    
    // Fade surface roughness(/deflection) out with distance to prevent screen noise.
    // return rough * dist;
    return mat;
}

void materialize(inout SurfaceInfo info, in SDFInfo sdf_info) {
    vec3 dPos = info.position;
    vec3 diff = info.color;
    if (sdf_info.index == MAT_UNDEFINED) diff = vec3(1.0, 0.0, 1.0);
    if(sdf_info.index == MAT_FLOOR) {
        diff = vec3(0,0,0);
        vec2 st = vec2(info.position.x, info.position.z); //床だからx,z座標をUVとして渡す
        diff = getConcreteMaterial(info.position, info.rayDist, 0.0);
    }
    if (sdf_info.index == MAT_WALL) {
        diff = vec3(0,0,0);
        vec2 st = vec2(info.position.y, info.position.z); //床だからx,z座標をUVとして渡す
        diff = getConcreteMaterial(info.position, info.rayDist, 0.0);
    };
    if (sdf_info.index == MAT_METAL) diff = vec3(0.3922, 0.3922, 0.3922);
    if (sdf_info.index == MAT_LIGHT) diff = vec3(1,1,0);

    info.color = diff;
}

#define NUM_MAT 6
const vec3 color[NUM_MAT] = vec3[NUM_MAT](vec3(1.0),vec3(1.0),vec3(1.0),vec3(1.0),vec3(1.0),vec3(1.0));
const vec3 emission[NUM_MAT] = vec3[NUM_MAT](vec3(0.0),vec3(1.0),vec3(0.0),vec3(0.0),vec3(10.0),vec3(0.1));

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
    // const bool DEBUG = true;
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
    ro = vec3(-5.0 * cos(mousex), mousey - 3.5, -5.0 * sin(mousex));
    vec3 camPos = ro;
    vec3 ta = vec3(0.0, -0.3, -1.5);
    // ta = vec3(0.0, -0.3, -4.5);
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
    #ifdef DEBUG
        SurfaceInfo info;
        if (raymarching(ro, rd, info)) {
            col = info.color * (max(dot(info.normal,LIGHT_DIR),0.0) + 0.2);
            if (DEBUG_NORMAL) col = info.normal * 0.5 + 0.5;
        } else {
            col = vec3(0.0);
        }
    #else
        // パストレーシング
        vec3 end = vec3(1e9);
        for(int b=0; b<MAX_DEPTH; b++) {
            SurfaceInfo info;

            float russian_p = clamp(max(max(throughput.x, throughput.y), throughput.z), 0.0, 1.0);
            if (russian_p < rnd1()) {
                break;
            }
            throughput /= russian_p;

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
        vec3 lightDir = vec3(0., 0.1, 0.8);
        float toAdd = 0.005 / float(GODRAY_SAMPLES);

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

        // VSCODE上なら自分でaccumulationする
        #ifdef IS_IN_VSCODE
            vec3 prev = vec3(0.0);
            if (iFrame > 0) {
                prev = texture(iChannel0, uv).rgb;
            }
            float frame = float(iFrame + 1);
            // saturationチェック
            col = sat(LTE.rgb);
            // ガンマ補正
            col = pow(col, vec3(1.0 / 2.2));
            vec3 accum = (prev * (frame - 1.0) + col.rgb) / frame;
            col = accum;
        #else
            col = LTE;
        #endif

    #endif
    // Output to screen
    fragColor = vec4(col, 1.0);
}