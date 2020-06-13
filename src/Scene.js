import Mesh from './Mesh'
import Light from './Light'

class Scene {
  constructor() {
    this._objects = []
    this._lights = []
  }


  add(mesh) {
    if (mesh instanceof Mesh) {
      this._objects.push(mesh)
    } else {
      throw new Error('The provided object is not a Mesh.')
    }

    return this
  }


  remove(meshId) {
    for (let i = this._objects.length - 1; i >= 0; i -= 1) {
      if (this._objects[i].id === meshId) {
        this._objects.splice(i, 1)
      }
    }
    return this
  }


  get(meshId) {
    return this._objects.filter(m => m.id === meshId)
  }


  getAll() {
    return this._objects
  }


  










  addLight(light) {
    if (light instanceof Light) {
      this._lights.push(light)
    } else {
      throw new Error('The provided object is not a Light.')
    }

    return this
  }


  removeLight(lightId) {
    for (let i = this._lights.length - 1; i >= 0; i -= 1) {
      if (this._lights[i].id === lightId) {
        this._lights.splice(i, 1)
      }
    }
    return this
  }


  getLight(lightId) {
    return this._lights.filter((l) => l.id === lightId)
  }


  getAllLights() {
    return this._lights
  }


  getLightsByType(lightType) {
    return this._lights.filter((l) => l.type === lightType)
  }
}

export default Scene
