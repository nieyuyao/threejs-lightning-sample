import { Object3D, Vector2, Vector3 } from 'three'
import { Line2 } from 'three/examples/jsm/lines/Line2'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial'
import { Halation } from './halation'

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

export class Lightning extends Object3D {
  bolts = []

  generations = 5

  segments = []

  ideallyLength = 1

  halation = new Halation()

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
    this.halation.updateByLightningBackbone(this.getBackbone())
    this.add(this.halation)
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
        let amplitude = offsetAmount / 2 + (offsetAmount / 2) * Math.random()
        amplitude *= Math.random() > 0.5 ? 1 : -1
        const offset = nor.multiplyScalar(amplitude)
        const midPoint = start.clone().add(dir.clone().multiplyScalar(0.5)).add(offset)
        newBolts.push(new Bolt(start, midPoint, parentBolt.width, 1, parentBolt.isBranch))
        // generate branch
        const distanceToEnd = midPoint.distanceTo(this.end)
        const distanceToStart = midPoint.distanceTo(this.start)
        const probability = distanceToEnd / this.ideallyLength
        if (distanceToStart > 40 && Math.random() < (probability * (boltsAmount - j)) / boltsAmount) {
          const branch = midPoint.clone().sub(start)
          const crossed = branch.cross(end.clone().sub(midPoint)) >= 0 ? -1 : 1
          const angle = Math.random() * probability * crossed * 1.1
          const branchEndPoint = branch.multiplyScalar(probability * 2.6).add(midPoint)
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
    const startColor = new Vector3(0.02, 0.16, 0.53)
    const endColor = new Vector3(0.30, 0.5, 0.82)
    this.bolts.forEach((bolt) => {
      if (bolt.width < 1) {
        return
      }
      const geo = new LineGeometry()
      const material = new LineMaterial({
        linewidth: bolt.width,
        opacity: bolt.opacity,
        transparent: true,
        vertexColors: true,
      })
      geo.setPositions([bolt.start.x, bolt.start.y, 0, bolt.end.x, bolt.end.y, 0])
      // calculate vertex color
      const startColorInterp = bolt.isBranch
        ? Math.pow((bolt.start.distanceTo(lightingStart) / ideallyLength * 0.8) * (2 / bolt.opacity), 2)
        : Math.pow(bolt.start.distanceTo(lightingStart) / ideallyLength * 0.8, 2)
      const endColorInterp = bolt.isBranch
        ? Math.pow((bolt.end.distanceTo(lightingStart) / ideallyLength * 0.8) * (2 / bolt.opacity), 2)
        : Math.pow(bolt.end.distanceTo(lightingStart) / ideallyLength * 0.8, 2)

      const startC = startColor
        .clone()
        .sub(endColor)
        .multiplyScalar(Math.min(1, startColorInterp))
        .add(endColor)
      const endC = startColor
        .clone()
        .sub(endColor)
        .multiplyScalar(Math.min(1, endColorInterp))
        .add(endColor)

      geo.setColors([...startC.toArray(), ...endC.toArray()])
      const segment = new Line2(geo, material)
      this.add(segment)
      this.segments.push(segment)
    })
  }

  getBackbone() {
    return this.bolts.filter((bolt) => !bolt.isBranch)
  }

  update(elapsed) {
    const identity = Math.max(0, 1 - elapsed / 2)
    if (identity <= 0.2) {
      this.dispatchEvent({ type: 'die' })
      return
    }
    this.segments.forEach((segment) => {
      segment.material.opacity *= identity
    })
  }

  dispose() {
    this.segments.forEach((segment) => {
      segment.geometry.dispose()
      segment.material.dispose()
    })
    this.halation.dispose()
  }
}
