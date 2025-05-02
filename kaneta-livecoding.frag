precision highp float;

uniform vec2 resolution;
uniform float time;
uniform vec2 mouse;

float box(vec3 p, float s) {
	p = abs(p) - s;
	return max(max(p.x, p.y), p.z);
}

const float pi = acos(-1.);
const float pi2 = pi*2.;

mat2 rot(float a ) {
	float c = cos(a), s=sin(a);
	return mat2(c,s,-s,c);
}

vec2 pmod(vec2 p, float r) {
	float a = pi/r-atan(p.x, p.y);
	float n = pi2/r;
	a = floor(a/n)*n;
	return p*rot(a);
}

float ii;

float map(vec3 p) {
	p.y += sin(p.z * 0.1) * 4.;

	
	vec3 q = p;
	q.y = mod(q.y-5.0, 10.) - 5.;
	q.z = mod(q.z -30., 60.)-30.;
	q.xz = pmod(q.xz, 4.);
	
	float d=length(q) - 0.5;
	
	q.y -= 3.;
	q.z = mod(q.z - 2.5, 5.) - 2.5;
	q.x = abs(q.x ) - 10.;
	for(int i=0; i<7; i++) {
		q = abs(q) - vec3(0., 1.5, 1.5 + sin(time *float(i) - p.z * 0.1 - p.y * 0.02) * 0.8);
		q.xy *= rot(float(i) * pi * 0.125 + p.z * 0.05 + p.y*0.1);
		float b = box(q, 1.0 - float(i) * 0.1);
		if (b<d) {
			ii = float(i)/7.;
			d = b;
		}
	}

	d = min(d, p.y);
	return d;
}

vec3 hsv(float h, float s, float v) {
	vec3 a = fract(h+vec3(0.,2.,1.)/3.)*6.-3.;
	a = clamp(abs(a)-1.,0.,1.)-1.;
	a = a*s +1.;
	return a*v;
}

void main( void ) {

	vec2 p = ( gl_FragCoord.xy*2.-resolution.xy) / resolution.y;
	
	float zzz = time * 30.;
	vec3 ro = vec3(0., 14., -10.+zzz+cos(time) * 5.);
	ro.y += sin(time * 0.4) * 5.;
	vec3 ta = vec3(0. + sin(time), 18. + sin(time) + cos(time) * 0.5, 0.+zzz);
	vec3 fo = normalize(ta-ro);
	vec3 le = normalize(cross(vec3(0.,1.,0.), fo));
	vec3 up = normalize(cross(fo,le));
	vec3 ray = normalize(fo*((1.0-dot(p, p))*0.3 + 1.)+le*p.x+up*p.y);
	
	float t=0.01;

	vec3 col = vec3(0.);
	
	float ac = 0.0,gl = 0.0;
	vec3 pos;
    
    // inspired              https://www.shadertoy.com/view/4ddfDr by lsdlive
    // original Phantom Mode https://www.shadertoy.com/view/MtScWW by aiekick
	for(int i=0; i<99; i++) {
		pos = ro + ray *t;
		float d = map(pos);
		d = max(abs(d), 0.02 + 0.6 * (exp(3.*sin(time)) / exp(3.)));
		ac += exp(-d*3.);
		gl += step(0.7, ii) * 0.3;
		t += d * 0.5;
	}
	
	vec3 ggggg = hsv(pos.z * 0.001, 0.5, 1.);
	
	ac += gl*1.2;

	col = mix(vec3(2.5), vec3(0.2, 0.3,0.3), pow(abs(pos.x), 0.05));
	col += ac * 0.006 + gl * 0.006 * ggggg;
	col = (col-0.5) * 2.5 + 0.5;
	//col = vec3(ac * 0.01);
	//col = hsv(p.x, p.y, 1.);
	gl_FragColor = vec4( col, 1.0 );

}