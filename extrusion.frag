// Extrusionの最小実装

// 2Dの円のSDF
// See: https://iquilezles.org/articles/distfunctions2d/
float sdCircle(vec2 p, float r) {
    return length(p) - r;
}

// sdfはexrudeしたい図形のSDF、hはExtrudeする高さ
float opExtrusion(in vec3 p, in float sdf, in float h) {
    vec2 w = vec2(sdf, abs(p.z) - h);
    return min(max(w.x, w.y), 0.) + length(max(w, 0.));
}

// SDFのExtrude
// See: https://iquilezles.org/articles/distfunctions/
float map(vec3 p) {
    float d = 1e10;

    d = opExtrusion(p, sdCircle(p.xy, .5), .55);

    return d;
}

// See: https://iquilezles.org/articles/normalsSDF/
vec3 calcNormal( in vec3 p ) // for function f(p)
{
    const float eps = 0.0001; // or some other value
    const vec2 h = vec2(eps,0);
    return normalize( vec3(map(p+h.xyy) - map(p-h.xyy),
                           map(p+h.yxy) - map(p-h.yxy),
                           map(p+h.yyx) - map(p-h.yyx) ) );
}

void mainImage(  out vec4 fragColor, in vec2 fragCoord ) {
    vec2 uv = fragCoord / iResolution.xy;
    vec2 p = uv * 2. - 1.;
    p.x *= iResolution.x / iResolution.y;

    vec3 ro = vec3(2., 1., 10.);
    vec3 rd = normalize(vec3(p, -2.));

    float d, t = 0.;
    vec3 col = vec3(0.);

    for (int i = 0; i < 100; i++) {
        d = map(ro + rd * t);
        if (d<.001) {
            //col = vec3(1.);
            col = calcNormal(ro + rd * t);
            break;
        };
        t += d;
    }

    fragColor = vec4(col, 1.);
}