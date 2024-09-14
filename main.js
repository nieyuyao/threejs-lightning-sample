import { WebGLRenderer, 
  OrthographicCamera, 
  Scene, 
  Color, 
  SRGBColorSpace,
  Clock,
  Vector2,
  MeshBasicMaterial,
  ShaderMaterial,
} from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass'
import { Lightning } from './lightning'

const renderer = new WebGLRenderer({
  antialias: true,
  alpha: true,
  canvas: undefined,
})
const getSize = () => ({
  width: window.innerWidth,
  height: window.innerHeight
})
const { width, height } = getSize()
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(width, height)
renderer.setClearColor('#000')
renderer.outputColorSpace = SRGBColorSpace
document.body.appendChild(renderer.domElement)

const scene = new Scene()
scene.background = new Color(0, 0, 0)

const camera = new OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, -10, 1000)
scene.add(camera)

const clock = new Clock()

const lightningEmitter = {
  lightnings: [],

  generateLightning() {
    const lightning = new Lightning(new Vector2(-20, height / 2), new Vector2(20, -height / 2), 8, 100)
    scene.add(lightning)
    const listener = () => {
      lightning.removeFromParent()
      const idx = this.lightnings.findIndex((lg) => lg === lightning)
      if (idx > -1) {
        this.lightnings.splice(idx, 1)
      }
      clock.start()
      this.generateLightning()
    }
    lightning.addEventListener('die', listener)
    this.lightnings.push(lightning)
  },

  tickUpdate(time) {
    this.lightnings.forEach((lg) => lg.update(time))
  }
}

lightningEmitter.generateLightning()

const bloomParams = {
  threshold: 0.2,
  strength: 1.2,
  radius: 0.02
}

const renderScene = new RenderPass(scene, camera)
const bloomComposer = new EffectComposer(renderer)
const bloomPass = new UnrealBloomPass(
  new Vector2(renderer.domElement.clientWidth, renderer.domElement.clientHeight),
  bloomParams.strength,
  bloomParams.radius,
  bloomParams.threshold
)
bloomComposer.renderToScreen = false
bloomComposer.addPass(renderScene)
bloomComposer.addPass(bloomPass)

const darkTransparentMaterial = new MeshBasicMaterial({
  color: 'black',
  opacity: 0.0,
  transparent: true
})

const materials = {}

const darkenNonBloomed = (obj) => {
  const object = obj
  if (object.name === 'Halation') {
    materials[object.uuid] = object.material
    object.material = darkTransparentMaterial
  }
}

const restoreMaterial = (obj) => {
  const object = obj
  if (materials[object.uuid]) {
    object.material = materials[object.uuid]
    delete materials[object.uuid]
  }
}

const finalPass = new ShaderPass(
  new ShaderMaterial({
    uniforms: {
      baseTexture: { value: null },
      bloomTexture: { value: bloomComposer.renderTarget2.texture }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
      }
    `,
    fragmentShader: `
      uniform sampler2D baseTexture;
      uniform sampler2D bloomTexture;
      varying vec2 vUv;
      void main() {
        gl_FragColor = texture2D(baseTexture, vUv) + vec4(1.0) * texture2D(bloomTexture, vUv);
      }
    `,
    defines: {}
  }),
  'baseTexture'
)
finalPass.needsSwap = true
const finalComposer = new EffectComposer(renderer)
finalComposer.addPass(renderScene)
finalComposer.addPass(finalPass)

const renderBloom = () => {
  scene.traverse(darkenNonBloomed)
  bloomComposer.render()
  scene.traverse(restoreMaterial)
}

const renderWithBloom = () => {
  renderBloom()
  finalComposer.render()
}

const update = () => {
  const time = clock.getElapsedTime()
  lightningEmitter.tickUpdate(time)
  renderWithBloom()
  requestAnimationFrame(update)
}

update()
