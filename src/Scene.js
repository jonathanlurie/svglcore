import Mesh from './Mesh'

class Scene {
  constructor() {
    this._objects = []
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
}

export default Scene
