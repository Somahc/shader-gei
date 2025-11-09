// http://www.jcgt.org/published/0009/03/02/
uvec3 pcg3d(uvec3 v) {
    v = v * 1664525u + 1013904223u;

    v.x += v.y * v.z;
    v.y += v.z * v.x;
    v.z += v.x * v.y;

    v ^= v >> 16u;

    v.x += v.y * v.z;
    v.y += v.z * v.x;
    v.z += v.x * v.y;

    return v;
}

vec3 pcg3df( vec3 s ) {
    uvec3 r = pcg3d( floatBitsToUint( s ) );
    return vec3( r ) / float( 0xffffffffu );
}

struct SubdivResult {
    vec3 size;
    vec3 cell;
    vec3 hash;
};

SubdivResult subdivision( vec3 p ) {
    SubdivResult result;

    // cellサイズの初期値
    result.size = vec3( 0.5 );

    for (int i = 0; i < 5; i++ ) {
        // 各セルの中央座標
        result.cell = ( floor( p / result.size ) + 0.5 ) * result.size;

        // 各セルのhash値
        result.hash = pcg3df(result.cell);

        // さらに細分化するか？
        if (result.hash.x < 0.5) {
            break;
        } else {
            result.size *= 0.5;
        }
    }
    return result;
}

void mainImage(  out vec4 fragColor, in vec2 fragCoord ) {
    vec2 uv = fragCoord / iResolution.xy;
    vec2 p = uv * 2. - 1.;
    p.x *= iResolution.x / iResolution.y;

    float z = 1.;

    vec3 col = vec3(0.);

    SubdivResult subdiv = subdivision(vec3(p,z));
    // col = subdiv.hash;
    col = mix(vec3(0.), vec3(1.), subdiv.hash.x);


    fragColor = vec4(col, 1.);
}