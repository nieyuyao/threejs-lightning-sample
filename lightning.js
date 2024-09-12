import { Color, Object3D, Vector2, Vector3 } from 'three'
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

export class Lightning extends Object3D {
  bolts = []

  generations = 5

  segments = []

  ideallyLength = 1

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
    this.ideallyLength = this.start.distanceTo(this.end)
    this.generations = generations
    this.amplitude = amplitude
    this.bolts = [new Bolt(this.start, this.end, 4, 1, false)]
    this.createLightBolts()
    this.createSegments()
  }

  createLightBolts() {
    let offsetAmount = this.amplitude

    for (let i = 0; i < this.generations; i++) {
      const newBolts = []
      const boltsAmount = this.bolts.length
      for (let j = 0; j < boltsAmount; j++) {
        const parentBolt = this.bolts[j]
        const { start, end } = this.bolts[j]
        const dir = end.clone().sub(start)
        const nor = new Vector2(-dir.y, dir.x).normalize()
        const offset = nor.multiplyScalar(clamp(-offsetAmount, offsetAmount))
        const midPoint = start.clone().add(dir.clone().multiplyScalar(0.5)).add(offset)
        newBolts.push(new Bolt(start, midPoint, parentBolt.width, 1, parentBolt.isBranch))
        // generate branch
        const distanceToEnd = midPoint.distanceTo(this.end)
        const distanceToStart = midPoint.distanceTo(this.start)
        const probability = distanceToEnd / this.ideallyLength
        if (distanceToStart > 40 && Math.random() < (probability * (boltsAmount - j)) / boltsAmount) {
          const branch = midPoint.clone().sub(start)
          const crossed = branch.cross(end.clone().sub(midPoint)) >= 0 ? -1 : 1
          const angle = Math.random() * probability * crossed
          const branchEndPoint = branch.multiplyScalar(probability * 2.4).add(midPoint)
          branchEndPoint.rotateAround(midPoint, angle)
          newBolts.push(new Bolt(midPoint, branchEndPoint, parentBolt.width * 0.6, parentBolt.opacity * 0.8, true))
        }
        newBolts.push(new Bolt(midPoint, end, parentBolt.width, 1, parentBolt.isBranch))
      }
      offsetAmount /= 2
      this.bolts = newBolts
    }
  }

  createSegments() {
    const { start: lightingStart, ideallyLength } = this
    this.bolts.forEach((bolt) => {
      if (bolt.width < 0.3) {
        return
      }
      const geo = new LineGeometry()
      const material = new LineMaterial({
        linewidth: bolt.width,
        opacity: bolt.opacity,
        transparent: true,
        vertexColors: true
      })
      geo.setPositions([bolt.start.x, bolt.start.y, 0, bolt.end.x, bolt.end.y, 0])
      // calculate vertex color
      // rgb(1, 1, 1) => rgb(0.26, 0.3, 0.82)
      const scalar = bolt.isBranch
        ? Math.pow((bolt.start.distanceTo(lightingStart) / ideallyLength) * (2 / bolt.opacity), 2)
        : Math.pow((bolt.start.distanceTo(lightingStart) / ideallyLength), 2)
      const c = new Vector3(0.1, 0.1, 0.93).sub(new Vector3(1, 1, 1)).multiplyScalar(Math.min(1, scalar)).add(new Vector3(1, 1, 1))

      geo.setColors([...c.toArray(), ...c.toArray()])
      const segment = new Line2(geo, material)
      this.add(segment)
      this.segments.push(segment)
    })
  }

  update() {
    // TODO:
  }
}
