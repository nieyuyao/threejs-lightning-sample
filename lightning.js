import { Color, Object3D, Vector2 } from 'three'
import { Line2 } from 'three/examples/jsm/lines/Line2'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial'

class Bolt {
  start = new Vector2()

  end = new Vector2()

  width = 2

  isBranch = false

  opacity = 1

  constructor(start, end, width, opacity, isBranch) {
    this.start.copy(start)
    this.end.copy(end)
    this.width = width
    this.opacity = opacity
    this.isBranch = isBranch
  }
}

const clamp = (min, max) => {
  return min + (max - min) * Math.random()
}

// calculate vertex color
const calcVertexColor = (v) => {
  // TODO:
}

export class Lightning extends Object3D {
  bolts = []

  generations = 5

  segments = []

  /**
   * @param {Vector2} start
   * @param {Vector2} start
   * @param {number} generations
   * @param {number} amplitude
   */
  constructor(start, end, generations, amplitude) {
    super()
    this.start = new Vector2(start.x, start.y)
    this.end = new Vector2(end.x, end.y)
    this.generations = generations
    this.amplitude = amplitude
    this.bolts = [new Bolt(this.start, this.end)]
    this.createLightBolts()
    this.createSegments()
  }

  createLightBolts() {
    let offsetAmount = this.amplitude
    const startEndLength = this.start.distanceTo(this.end)
    for (let i = 0; i < this.generations; i++) {
      const newBolts = []
      const boltsAmount = this.bolts.length
      const mainWidth = 2
      for (let j = 0; j < boltsAmount; j++) {
        const { start, end } = this.bolts[j]
        const dir = end.clone().sub(start)
        const nor = new Vector2(-dir.y, dir.x).normalize()
        const offset = nor.multiplyScalar(clamp(-offsetAmount, offsetAmount))
        const midPoint = start.clone().add(dir.clone().multiplyScalar(0.5)).add(offset)
        newBolts.push(new Bolt(start, midPoint, mainWidth, 1, false))
        // generate branch
        const distance = midPoint.distanceTo(this.end)
        const probability = distance / startEndLength
        if (Math.random() < (probability * (boltsAmount - j)) / boltsAmount) {
          const branch = midPoint.clone().sub(start)
          const crossed = branch.cross(end.clone().sub(midPoint)) >= 0 ? -1 : 1
          const angle = Math.random() * probability * crossed
          const branchEndPoint = branch.multiplyScalar(probability * 2.4).add(midPoint)
          branchEndPoint.rotateAround(midPoint, angle)
          const widthScale = 1 - Math.pow(i / this.generations, 4)
          // set minimum opacity to 0.4
          const opacity = Math.max(0.4, 1 - i / this.generations)
          newBolts.push(new Bolt(midPoint, branchEndPoint, mainWidth * widthScale, opacity, true))
        }
        newBolts.push(new Bolt(midPoint, end, mainWidth, 1, false))
      }
      offsetAmount /= 2
      this.bolts = newBolts
    }
  }

  createSegments() {
    this.bolts.forEach((bolt) => {
      const points = []
      points.push(bolt.start.x, bolt.start.y, 0)
      points.push(bolt.end.x, bolt.end.y, 0)
      const geo = new LineGeometry()
      const material = new LineMaterial({
        linewidth: bolt.width,
        opacity: bolt.opacity,
        transparent: true,
        color: new Color(1, 1, 1)
      })
      geo.setPositions(points)
      const segment = new Line2(geo, material)
      this.add(segment)
      this.segments.push(segment)
    })
  }

  update() {
    // TODO:
  }
}
