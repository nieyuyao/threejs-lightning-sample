import { Mesh, ShaderMaterial, Vector2, Matrix4 } from 'three'
import { FullScreenGeometry } from './full-screen-geometry'

// generate halation from lighting backbone
export class Halation extends Mesh {
  constructor() {
    const geometry = new FullScreenGeometry()
    const material = new ShaderMaterial({
      transparent: true,
      uniforms: {
        backbone: { value: [] },
        cameraWorldMat: { value: new Matrix4() }
      },
      vertexShader: `
        varying vec2 vUv;
        varying mat4 projectionMat;
        void main() {
          vUv = uv;
          projectionMat = projectionMatrix;
          gl_Position = vec4(position.xy, 1.0, 1.0);
        }
      `,
      fragmentShader: `
        #define EFFECT_MAX_DISTANCE 600.0

        uniform vec2 backbone[512];
        uniform mat4 cameraWorldMat;
        varying vec2 vUv;
        varying mat4 projectionMat;

        vec3 unProjectPoint(vec3 pos) {
					vec4 p = cameraWorldMat * inverse(projectionMat) * vec4(pos.xyz, 1.0);
					return p.xyz / p.w;
				}

        float getMinDistance(vec2 p) {
          float minDistance = 10000000.0;
          for (int i = 0; i < 512; i += 2) {
            vec2 start = backbone[i];
            vec2 end = backbone[i + 1];
            vec2 e1 = start - p;
            vec2 e2 = end - p;
            vec2 line = start - end;
            float d1 = length(e1);
            float d2 = length(e2);
            vec3 nor = vec3(-line.y, line.x, 0.0);
            if (
              dot(cross(nor, vec3(e1, 0.0)), cross(nor, vec3(e2, 0.0))) > 0.
            ) {
              minDistance = min(minDistance, min(d1, d2));
              continue;
            }
            vec3 dir = vec3(normalize(line).xy, 0.);
            minDistance = min(minDistance, length(cross(vec3(e1, 0.), dir)));
          }
          return minDistance;
        }
        void main() {
          vec2 uv = vec2(vUv);
          uv -= 0.5;
          uv /= 0.5;
          vec3 fragPos = unProjectPoint(vec3(uv, 1.0));
          vec3 color = vec3(0.26, 0.3, 0.82);
          float d = getMinDistance(fragPos.xy);
          float a = smoothstep(0., 1.0, max(0.0, (EFFECT_MAX_DISTANCE - d) / EFFECT_MAX_DISTANCE) * 0.4);
          gl_FragColor = vec4(color, a);
        }
      `
    })

    super(geometry, material)

    this.onBeforeRender = (_, __, camera) => {
      material.uniforms.cameraWorldMat.value = camera.matrixWorld
    }
  }

  updateByLightningBackbone(backbone) {
    const vectors = backbone.reduce((prev, bolt) => {
      prev.push(bolt.start)
      prev.push(bolt.end)
      return prev
    }, [])
    this.material.uniforms.backbone.value = vectors
    this.backbone = vectors
  }

  minDistance(x, y) {
    const p = new Vector2(x, y)
    const { backbone } = this
    for (let i = 0; i < 512; i += 2) {
      const start = backbone[i]
      const end = backbone[i + 1]
      const e1 = start.clone().sub(p)
      const e2 = end.clone().sub(p)
      const e3 = start.clone().sub(end)
      const d1 = e1.length()
      const d2 = e2.length()
      if (e1.dot(e3) < 0 || e2.dot(e3) < 0) {
        return Math.min(d1, d2)
      }
      const e3Dir = e3.normalize()

      return Math.abs(e3Dir.cross(e1))
    }
  }
}
