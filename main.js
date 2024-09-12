import { WebGLRenderer, OrthographicCamera, Scene, Color, SRGBColorSpace, Clock, Vector2 } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Lightning } from './lightning'

const renderer = new WebGLRenderer({
  antialias: true,
  alpha: true,
  canvas: undefined
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

const lightning = new Lightning(new Vector2(-20, 300), new Vector2(20, -300), 8, 100)

scene.add(lightning)

const orbit = new OrbitControls(camera, renderer.domElement)

const clock = new Clock()

const update = () => {
  const time = clock.getElapsedTime()
  renderer.clear()
  renderer.render(scene, camera)
  orbit.update()
  requestAnimationFrame(update)
}

update()
