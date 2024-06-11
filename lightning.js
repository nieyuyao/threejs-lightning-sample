import { Color, Object3D, Vector2 } from 'three'
import { Line2 } from 'three/examples/jsm/lines/Line2'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial'

class Bolt {
  start = new Vector2()

  end = new Vector2()

  constructor(start, end) {
    this.start.copy(start)
    this.end.copy(end)
  }
}

const clamp = (min, max) => {
  return min + (max - min) * Math.random()
}

export class Lightning extends Object3D {
  bolts = []

  generations = 5

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
    this.draLightBolts()
  }

  createLightBolts() {
    let offsetAmount = this.amplitude
    const startEndLength = this.start.distanceTo(this.end)
    for (let i = 0; i < this.generations; i++) {
      const newBolts = []
      for (let j = 0; j < this.bolts.length; j++) {
        const { start, end } = this.bolts[j]
        const dir = end.clone().sub(start)
        const nor = new Vector2(-dir.y, dir.x).normalize()
        const offset = nor.multiplyScalar(clamp(-offsetAmount, offsetAmount))
        const midPoint = start.clone().add(dir.clone().multiplyScalar(0.5)).add(offset)
        newBolts.push(new Bolt(start, midPoint))
        // generate branch
        const midDistance = midPoint.distanceTo(this.end)
        const probability = midDistance / startEndLength
        if (Math.random() < probability) {
          const branchEndPoint = midPoint
            .clone()
            .sub(start)
            .multiplyScalar(probability * 2)
            .add(midPoint)
            .rotateAround(midPoint, (Math.random() - 0.5) / 0.5 * probability * 1.1)
          newBolts.push(new Bolt(midPoint, branchEndPoint), new Bolt(midPoint, end))
        }
        newBolts.push(new Bolt(midPoint, end))
      }
      offsetAmount /= 2
      this.bolts = newBolts
    }
  }

  draLightBolts() {
    const points = []
    this.bolts.forEach((bolt) => {
      points.push(bolt.start.x, bolt.start.y, 0)
      points.push(bolt.end.x, bolt.end.y, 0)
    })
    const material = new LineMaterial({
      linewidth: 2,
      color: new Color(1, 1, 1)
    })
    const geo = new LineGeometry()
    geo.setPositions(points)
    this.add(new Line2(geo, material))
  }

  update() {
    // TODO:
  }
}
