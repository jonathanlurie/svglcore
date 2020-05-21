import uuid4 from 'uuid4'


class Mesh {
  constructor() {
    this._id = uuid4()
  }

  get id() {
    return this._id
  }
}

export default Mesh
