import { Mesh, ShaderMaterial, Vector2, Matrix4 } from 'three'
import { FullScreenGeometry } from './full-screen-geometry'

// generate halation from lighting backbone
export class Halation extends Mesh {
  name = 'Halation'
  
  constructor() {
    const geometry = new FullScreenGeometry()
    const material = new ShaderMaterial({
      transparent: true,
      uniforms: {
        backbone: { value: [] },
        backboneLength: { value: 512 },
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

        uniform int backboneLength;
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
          for (int i = 0; i < backboneLength; i += 2) {
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
    if (backbone.length <= 256) {
      this.material.uniforms.backbone.value = backbone.reduce((prev, bolt) => {
        prev.push(bolt.start)
        prev.push(bolt.end)
        return prev
      }, [])
      this.material.uniforms.backboneLength.value = backbone.length * 2
      // padding to 256
      for (let i = 0; i < 256 - backbone.length; i++) {
        this.material.uniforms.backbone.value.push(new Vector2())
        this.material.uniforms.backbone.value.push(new Vector2())
      }
    } else {
      const interval = Math.ceil(backbone.length / 256)
      this.material.uniforms.backbone.value = backbone.reduce((prev, bolt, i) => {
        if (i % interval !== 0) {
          return prev
        }
        prev.push(bolt.start)
        prev.push(bolt.end)
        return prev
      }, [])
      this.material.uniforms.backboneLength.value = 512
    }
  }

  dispose() {
    this.geometry.dispose()
    this.material.dispose()
  }
}
