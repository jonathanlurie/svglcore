(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.svglcore = factory());
}(this, (function () { 'use strict';

  /**
   * Common utilities
   * @module glMatrix
   */
  // Configuration Constants
  var EPSILON = 0.000001;
  var ARRAY_TYPE = typeof Float32Array !== 'undefined' ? Float32Array : Array;
  if (!Math.hypot) Math.hypot = function () {
    var y = 0,
        i = arguments.length;

    while (i--) {
      y += arguments[i] * arguments[i];
    }

    return Math.sqrt(y);
  };

  /**
   * 3x3 Matrix
   * @module mat3
   */

  /**
   * Creates a new identity mat3
   *
   * @returns {mat3} a new 3x3 matrix
   */

  function create() {
    var out = new ARRAY_TYPE(9);

    if (ARRAY_TYPE != Float32Array) {
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[5] = 0;
      out[6] = 0;
      out[7] = 0;
    }

    out[0] = 1;
    out[4] = 1;
    out[8] = 1;
    return out;
  }
  /**
   * Copies the upper-left 3x3 values into the given mat3.
   *
   * @param {mat3} out the receiving 3x3 matrix
   * @param {ReadonlyMat4} a   the source 4x4 matrix
   * @returns {mat3} out
   */

  function fromMat4(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    out[3] = a[4];
    out[4] = a[5];
    out[5] = a[6];
    out[6] = a[8];
    out[7] = a[9];
    out[8] = a[10];
    return out;
  }

  /**
   * 4x4 Matrix<br>Format: column-major, when typed out it looks like row-major<br>The matrices are being post multiplied.
   * @module mat4
   */

  /**
   * Creates a new identity mat4
   *
   * @returns {mat4} a new 4x4 matrix
   */

  function create$1() {
    var out = new ARRAY_TYPE(16);

    if (ARRAY_TYPE != Float32Array) {
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[4] = 0;
      out[6] = 0;
      out[7] = 0;
      out[8] = 0;
      out[9] = 0;
      out[11] = 0;
      out[12] = 0;
      out[13] = 0;
      out[14] = 0;
    }

    out[0] = 1;
    out[5] = 1;
    out[10] = 1;
    out[15] = 1;
    return out;
  }
  /**
   * Set a mat4 to the identity matrix
   *
   * @param {mat4} out the receiving matrix
   * @returns {mat4} out
   */

  function identity(out) {
    out[0] = 1;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = 1;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[10] = 1;
    out[11] = 0;
    out[12] = 0;
    out[13] = 0;
    out[14] = 0;
    out[15] = 1;
    return out;
  }
  /**
   * Inverts a mat4
   *
   * @param {mat4} out the receiving matrix
   * @param {ReadonlyMat4} a the source matrix
   * @returns {mat4} out
   */

  function invert(out, a) {
    var a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a03 = a[3];
    var a10 = a[4],
        a11 = a[5],
        a12 = a[6],
        a13 = a[7];
    var a20 = a[8],
        a21 = a[9],
        a22 = a[10],
        a23 = a[11];
    var a30 = a[12],
        a31 = a[13],
        a32 = a[14],
        a33 = a[15];
    var b00 = a00 * a11 - a01 * a10;
    var b01 = a00 * a12 - a02 * a10;
    var b02 = a00 * a13 - a03 * a10;
    var b03 = a01 * a12 - a02 * a11;
    var b04 = a01 * a13 - a03 * a11;
    var b05 = a02 * a13 - a03 * a12;
    var b06 = a20 * a31 - a21 * a30;
    var b07 = a20 * a32 - a22 * a30;
    var b08 = a20 * a33 - a23 * a30;
    var b09 = a21 * a32 - a22 * a31;
    var b10 = a21 * a33 - a23 * a31;
    var b11 = a22 * a33 - a23 * a32; // Calculate the determinant

    var det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

    if (!det) {
      return null;
    }

    det = 1.0 / det;
    out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
    out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
    out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
    out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
    out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
    out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
    out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
    out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
    out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
    out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
    out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
    out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
    out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
    return out;
  }
  /**
   * Multiplies two mat4s
   *
   * @param {mat4} out the receiving matrix
   * @param {ReadonlyMat4} a the first operand
   * @param {ReadonlyMat4} b the second operand
   * @returns {mat4} out
   */

  function multiply(out, a, b) {
    var a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a03 = a[3];
    var a10 = a[4],
        a11 = a[5],
        a12 = a[6],
        a13 = a[7];
    var a20 = a[8],
        a21 = a[9],
        a22 = a[10],
        a23 = a[11];
    var a30 = a[12],
        a31 = a[13],
        a32 = a[14],
        a33 = a[15]; // Cache only the current line of the second matrix

    var b0 = b[0],
        b1 = b[1],
        b2 = b[2],
        b3 = b[3];
    out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = b[4];
    b1 = b[5];
    b2 = b[6];
    b3 = b[7];
    out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = b[8];
    b1 = b[9];
    b2 = b[10];
    b3 = b[11];
    out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    b0 = b[12];
    b1 = b[13];
    b2 = b[14];
    b3 = b[15];
    out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30;
    out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31;
    out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32;
    out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33;
    return out;
  }
  /**
   * Translate a mat4 by the given vector
   *
   * @param {mat4} out the receiving matrix
   * @param {ReadonlyMat4} a the matrix to translate
   * @param {ReadonlyVec3} v vector to translate by
   * @returns {mat4} out
   */

  function translate(out, a, v) {
    var x = v[0],
        y = v[1],
        z = v[2];
    var a00, a01, a02, a03;
    var a10, a11, a12, a13;
    var a20, a21, a22, a23;

    if (a === out) {
      out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
      out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
      out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
      out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
    } else {
      a00 = a[0];
      a01 = a[1];
      a02 = a[2];
      a03 = a[3];
      a10 = a[4];
      a11 = a[5];
      a12 = a[6];
      a13 = a[7];
      a20 = a[8];
      a21 = a[9];
      a22 = a[10];
      a23 = a[11];
      out[0] = a00;
      out[1] = a01;
      out[2] = a02;
      out[3] = a03;
      out[4] = a10;
      out[5] = a11;
      out[6] = a12;
      out[7] = a13;
      out[8] = a20;
      out[9] = a21;
      out[10] = a22;
      out[11] = a23;
      out[12] = a00 * x + a10 * y + a20 * z + a[12];
      out[13] = a01 * x + a11 * y + a21 * z + a[13];
      out[14] = a02 * x + a12 * y + a22 * z + a[14];
      out[15] = a03 * x + a13 * y + a23 * z + a[15];
    }

    return out;
  }
  /**
   * Creates a matrix from a quaternion rotation and vector translation
   * This is equivalent to (but much faster than):
   *
   *     mat4.identity(dest);
   *     mat4.translate(dest, vec);
   *     let quatMat = mat4.create();
   *     quat4.toMat4(quat, quatMat);
   *     mat4.multiply(dest, quatMat);
   *
   * @param {mat4} out mat4 receiving operation result
   * @param {quat4} q Rotation quaternion
   * @param {ReadonlyVec3} v Translation vector
   * @returns {mat4} out
   */

  function fromRotationTranslation(out, q, v) {
    // Quaternion math
    var x = q[0],
        y = q[1],
        z = q[2],
        w = q[3];
    var x2 = x + x;
    var y2 = y + y;
    var z2 = z + z;
    var xx = x * x2;
    var xy = x * y2;
    var xz = x * z2;
    var yy = y * y2;
    var yz = y * z2;
    var zz = z * z2;
    var wx = w * x2;
    var wy = w * y2;
    var wz = w * z2;
    out[0] = 1 - (yy + zz);
    out[1] = xy + wz;
    out[2] = xz - wy;
    out[3] = 0;
    out[4] = xy - wz;
    out[5] = 1 - (xx + zz);
    out[6] = yz + wx;
    out[7] = 0;
    out[8] = xz + wy;
    out[9] = yz - wx;
    out[10] = 1 - (xx + yy);
    out[11] = 0;
    out[12] = v[0];
    out[13] = v[1];
    out[14] = v[2];
    out[15] = 1;
    return out;
  }
  /**
   * Creates a matrix from a quaternion rotation, vector translation and vector scale
   * This is equivalent to (but much faster than):
   *
   *     mat4.identity(dest);
   *     mat4.translate(dest, vec);
   *     let quatMat = mat4.create();
   *     quat4.toMat4(quat, quatMat);
   *     mat4.multiply(dest, quatMat);
   *     mat4.scale(dest, scale)
   *
   * @param {mat4} out mat4 receiving operation result
   * @param {quat4} q Rotation quaternion
   * @param {ReadonlyVec3} v Translation vector
   * @param {ReadonlyVec3} s Scaling vector
   * @returns {mat4} out
   */

  function fromRotationTranslationScale(out, q, v, s) {
    // Quaternion math
    var x = q[0],
        y = q[1],
        z = q[2],
        w = q[3];
    var x2 = x + x;
    var y2 = y + y;
    var z2 = z + z;
    var xx = x * x2;
    var xy = x * y2;
    var xz = x * z2;
    var yy = y * y2;
    var yz = y * z2;
    var zz = z * z2;
    var wx = w * x2;
    var wy = w * y2;
    var wz = w * z2;
    var sx = s[0];
    var sy = s[1];
    var sz = s[2];
    out[0] = (1 - (yy + zz)) * sx;
    out[1] = (xy + wz) * sx;
    out[2] = (xz - wy) * sx;
    out[3] = 0;
    out[4] = (xy - wz) * sy;
    out[5] = (1 - (xx + zz)) * sy;
    out[6] = (yz + wx) * sy;
    out[7] = 0;
    out[8] = (xz + wy) * sz;
    out[9] = (yz - wx) * sz;
    out[10] = (1 - (xx + yy)) * sz;
    out[11] = 0;
    out[12] = v[0];
    out[13] = v[1];
    out[14] = v[2];
    out[15] = 1;
    return out;
  }
  /**
   * Generates a perspective projection matrix with the given bounds.
   * Passing null/undefined/no value for far will generate infinite projection matrix.
   *
   * @param {mat4} out mat4 frustum matrix will be written into
   * @param {number} fovy Vertical field of view in radians
   * @param {number} aspect Aspect ratio. typically viewport width/height
   * @param {number} near Near bound of the frustum
   * @param {number} far Far bound of the frustum, can be null or Infinity
   * @returns {mat4} out
   */

  function perspective(out, fovy, aspect, near, far) {
    var f = 1.0 / Math.tan(fovy / 2),
        nf;
    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;
    out[8] = 0;
    out[9] = 0;
    out[11] = -1;
    out[12] = 0;
    out[13] = 0;
    out[15] = 0;

    if (far != null && far !== Infinity) {
      nf = 1 / (near - far);
      out[10] = (far + near) * nf;
      out[14] = 2 * far * near * nf;
    } else {
      out[10] = -1;
      out[14] = -2 * near;
    }

    return out;
  }
  /**
   * Generates a look-at matrix with the given eye position, focal point, and up axis.
   * If you want a matrix that actually makes an object look at another object, you should use targetTo instead.
   *
   * @param {mat4} out mat4 frustum matrix will be written into
   * @param {ReadonlyVec3} eye Position of the viewer
   * @param {ReadonlyVec3} center Point the viewer is looking at
   * @param {ReadonlyVec3} up vec3 pointing up
   * @returns {mat4} out
   */

  function lookAt(out, eye, center, up) {
    var x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
    var eyex = eye[0];
    var eyey = eye[1];
    var eyez = eye[2];
    var upx = up[0];
    var upy = up[1];
    var upz = up[2];
    var centerx = center[0];
    var centery = center[1];
    var centerz = center[2];

    if (Math.abs(eyex - centerx) < EPSILON && Math.abs(eyey - centery) < EPSILON && Math.abs(eyez - centerz) < EPSILON) {
      return identity(out);
    }

    z0 = eyex - centerx;
    z1 = eyey - centery;
    z2 = eyez - centerz;
    len = 1 / Math.hypot(z0, z1, z2);
    z0 *= len;
    z1 *= len;
    z2 *= len;
    x0 = upy * z2 - upz * z1;
    x1 = upz * z0 - upx * z2;
    x2 = upx * z1 - upy * z0;
    len = Math.hypot(x0, x1, x2);

    if (!len) {
      x0 = 0;
      x1 = 0;
      x2 = 0;
    } else {
      len = 1 / len;
      x0 *= len;
      x1 *= len;
      x2 *= len;
    }

    y0 = z1 * x2 - z2 * x1;
    y1 = z2 * x0 - z0 * x2;
    y2 = z0 * x1 - z1 * x0;
    len = Math.hypot(y0, y1, y2);

    if (!len) {
      y0 = 0;
      y1 = 0;
      y2 = 0;
    } else {
      len = 1 / len;
      y0 *= len;
      y1 *= len;
      y2 *= len;
    }

    out[0] = x0;
    out[1] = y0;
    out[2] = z0;
    out[3] = 0;
    out[4] = x1;
    out[5] = y1;
    out[6] = z1;
    out[7] = 0;
    out[8] = x2;
    out[9] = y2;
    out[10] = z2;
    out[11] = 0;
    out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
    out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
    out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
    out[15] = 1;
    return out;
  }

  /**
   * 3 Dimensional Vector
   * @module vec3
   */

  /**
   * Creates a new, empty vec3
   *
   * @returns {vec3} a new 3D vector
   */

  function create$2() {
    var out = new ARRAY_TYPE(3);

    if (ARRAY_TYPE != Float32Array) {
      out[0] = 0;
      out[1] = 0;
      out[2] = 0;
    }

    return out;
  }
  /**
   * Calculates the length of a vec3
   *
   * @param {ReadonlyVec3} a vector to calculate length of
   * @returns {Number} length of a
   */

  function length(a) {
    var x = a[0];
    var y = a[1];
    var z = a[2];
    return Math.hypot(x, y, z);
  }
  /**
   * Creates a new vec3 initialized with the given values
   *
   * @param {Number} x X component
   * @param {Number} y Y component
   * @param {Number} z Z component
   * @returns {vec3} a new 3D vector
   */

  function fromValues(x, y, z) {
    var out = new ARRAY_TYPE(3);
    out[0] = x;
    out[1] = y;
    out[2] = z;
    return out;
  }
  /**
   * Copy the values from one vec3 to another
   *
   * @param {vec3} out the receiving vector
   * @param {ReadonlyVec3} a the source vector
   * @returns {vec3} out
   */

  function copy(out, a) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
    return out;
  }
  /**
   * Adds two vec3's
   *
   * @param {vec3} out the receiving vector
   * @param {ReadonlyVec3} a the first operand
   * @param {ReadonlyVec3} b the second operand
   * @returns {vec3} out
   */

  function add(out, a, b) {
    out[0] = a[0] + b[0];
    out[1] = a[1] + b[1];
    out[2] = a[2] + b[2];
    return out;
  }
  /**
   * Calculates the euclidian distance between two vec3's
   *
   * @param {ReadonlyVec3} a the first operand
   * @param {ReadonlyVec3} b the second operand
   * @returns {Number} distance between a and b
   */

  function distance(a, b) {
    var x = b[0] - a[0];
    var y = b[1] - a[1];
    var z = b[2] - a[2];
    return Math.hypot(x, y, z);
  }
  /**
   * Negates the components of a vec3
   *
   * @param {vec3} out the receiving vector
   * @param {ReadonlyVec3} a vector to negate
   * @returns {vec3} out
   */

  function negate(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    return out;
  }
  /**
   * Normalize a vec3
   *
   * @param {vec3} out the receiving vector
   * @param {ReadonlyVec3} a vector to normalize
   * @returns {vec3} out
   */

  function normalize(out, a) {
    var x = a[0];
    var y = a[1];
    var z = a[2];
    var len = x * x + y * y + z * z;

    if (len > 0) {
      //TODO: evaluate use of glm_invsqrt here?
      len = 1 / Math.sqrt(len);
    }

    out[0] = a[0] * len;
    out[1] = a[1] * len;
    out[2] = a[2] * len;
    return out;
  }
  /**
   * Calculates the dot product of two vec3's
   *
   * @param {ReadonlyVec3} a the first operand
   * @param {ReadonlyVec3} b the second operand
   * @returns {Number} dot product of a and b
   */

  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
  /**
   * Computes the cross product of two vec3's
   *
   * @param {vec3} out the receiving vector
   * @param {ReadonlyVec3} a the first operand
   * @param {ReadonlyVec3} b the second operand
   * @returns {vec3} out
   */

  function cross(out, a, b) {
    var ax = a[0],
        ay = a[1],
        az = a[2];
    var bx = b[0],
        by = b[1],
        bz = b[2];
    out[0] = ay * bz - az * by;
    out[1] = az * bx - ax * bz;
    out[2] = ax * by - ay * bx;
    return out;
  }
  /**
   * Transforms the vec3 with a mat4.
   * 4th vector component is implicitly '1'
   *
   * @param {vec3} out the receiving vector
   * @param {ReadonlyVec3} a the vector to transform
   * @param {ReadonlyMat4} m matrix to transform with
   * @returns {vec3} out
   */

  function transformMat4(out, a, m) {
    var x = a[0],
        y = a[1],
        z = a[2];
    var w = m[3] * x + m[7] * y + m[11] * z + m[15];
    w = w || 1.0;
    out[0] = (m[0] * x + m[4] * y + m[8] * z + m[12]) / w;
    out[1] = (m[1] * x + m[5] * y + m[9] * z + m[13]) / w;
    out[2] = (m[2] * x + m[6] * y + m[10] * z + m[14]) / w;
    return out;
  }
  /**
   * Transforms the vec3 with a quat
   * Can also be used for dual quaternions. (Multiply it with the real part)
   *
   * @param {vec3} out the receiving vector
   * @param {ReadonlyVec3} a the vector to transform
   * @param {ReadonlyQuat} q quaternion to transform with
   * @returns {vec3} out
   */

  function transformQuat(out, a, q) {
    // benchmarks: https://jsperf.com/quaternion-transform-vec3-implementations-fixed
    var qx = q[0],
        qy = q[1],
        qz = q[2],
        qw = q[3];
    var x = a[0],
        y = a[1],
        z = a[2]; // var qvec = [qx, qy, qz];
    // var uv = vec3.cross([], qvec, a);

    var uvx = qy * z - qz * y,
        uvy = qz * x - qx * z,
        uvz = qx * y - qy * x; // var uuv = vec3.cross([], qvec, uv);

    var uuvx = qy * uvz - qz * uvy,
        uuvy = qz * uvx - qx * uvz,
        uuvz = qx * uvy - qy * uvx; // vec3.scale(uv, uv, 2 * w);

    var w2 = qw * 2;
    uvx *= w2;
    uvy *= w2;
    uvz *= w2; // vec3.scale(uuv, uuv, 2);

    uuvx *= 2;
    uuvy *= 2;
    uuvz *= 2; // return vec3.add(out, a, vec3.add(out, uv, uuv));

    out[0] = x + uvx + uuvx;
    out[1] = y + uvy + uuvy;
    out[2] = z + uvz + uuvz;
    return out;
  }
  /**
   * Alias for {@link vec3.length}
   * @function
   */

  var len = length;
  /**
   * Perform some operation over an array of vec3s.
   *
   * @param {Array} a the array of vectors to iterate over
   * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
   * @param {Number} offset Number of elements to skip at the beginning of the array
   * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
   * @param {Function} fn Function to call for each vector in the array
   * @param {Object} [arg] additional argument to pass to fn
   * @returns {Array} a
   * @function
   */

  var forEach = function () {
    var vec = create$2();
    return function (a, stride, offset, count, fn, arg) {
      var i, l;

      if (!stride) {
        stride = 3;
      }

      if (!offset) {
        offset = 0;
      }

      if (count) {
        l = Math.min(count * stride + offset, a.length);
      } else {
        l = a.length;
      }

      for (i = offset; i < l; i += stride) {
        vec[0] = a[i];
        vec[1] = a[i + 1];
        vec[2] = a[i + 2];
        fn(vec, vec, arg);
        a[i] = vec[0];
        a[i + 1] = vec[1];
        a[i + 2] = vec[2];
      }

      return a;
    };
  }();

  /**
   * 4 Dimensional Vector
   * @module vec4
   */

  /**
   * Creates a new, empty vec4
   *
   * @returns {vec4} a new 4D vector
   */

  function create$3() {
    var out = new ARRAY_TYPE(4);

    if (ARRAY_TYPE != Float32Array) {
      out[0] = 0;
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
    }

    return out;
  }
  /**
   * Calculates the length of a vec4
   *
   * @param {ReadonlyVec4} a vector to calculate length of
   * @returns {Number} length of a
   */

  function length$1(a) {
    var x = a[0];
    var y = a[1];
    var z = a[2];
    var w = a[3];
    return Math.hypot(x, y, z, w);
  }
  /**
   * Normalize a vec4
   *
   * @param {vec4} out the receiving vector
   * @param {ReadonlyVec4} a vector to normalize
   * @returns {vec4} out
   */

  function normalize$1(out, a) {
    var x = a[0];
    var y = a[1];
    var z = a[2];
    var w = a[3];
    var len = x * x + y * y + z * z + w * w;

    if (len > 0) {
      len = 1 / Math.sqrt(len);
    }

    out[0] = x * len;
    out[1] = y * len;
    out[2] = z * len;
    out[3] = w * len;
    return out;
  }
  /**
   * Perform some operation over an array of vec4s.
   *
   * @param {Array} a the array of vectors to iterate over
   * @param {Number} stride Number of elements between the start of each vec4. If 0 assumes tightly packed
   * @param {Number} offset Number of elements to skip at the beginning of the array
   * @param {Number} count Number of vec4s to iterate over. If 0 iterates over entire array
   * @param {Function} fn Function to call for each vector in the array
   * @param {Object} [arg] additional argument to pass to fn
   * @returns {Array} a
   * @function
   */

  var forEach$1 = function () {
    var vec = create$3();
    return function (a, stride, offset, count, fn, arg) {
      var i, l;

      if (!stride) {
        stride = 4;
      }

      if (!offset) {
        offset = 0;
      }

      if (count) {
        l = Math.min(count * stride + offset, a.length);
      } else {
        l = a.length;
      }

      for (i = offset; i < l; i += stride) {
        vec[0] = a[i];
        vec[1] = a[i + 1];
        vec[2] = a[i + 2];
        vec[3] = a[i + 3];
        fn(vec, vec, arg);
        a[i] = vec[0];
        a[i + 1] = vec[1];
        a[i + 2] = vec[2];
        a[i + 3] = vec[3];
      }

      return a;
    };
  }();

  /**
   * Quaternion
   * @module quat
   */

  /**
   * Creates a new identity quat
   *
   * @returns {quat} a new quaternion
   */

  function create$4() {
    var out = new ARRAY_TYPE(4);

    if (ARRAY_TYPE != Float32Array) {
      out[0] = 0;
      out[1] = 0;
      out[2] = 0;
    }

    out[3] = 1;
    return out;
  }
  /**
   * Sets a quat from the given angle and rotation axis,
   * then returns it.
   *
   * @param {quat} out the receiving quaternion
   * @param {ReadonlyVec3} axis the axis around which to rotate
   * @param {Number} rad the angle in radians
   * @returns {quat} out
   **/

  function setAxisAngle(out, axis, rad) {
    rad = rad * 0.5;
    var s = Math.sin(rad);
    out[0] = s * axis[0];
    out[1] = s * axis[1];
    out[2] = s * axis[2];
    out[3] = Math.cos(rad);
    return out;
  }
  /**
   * Multiplies two quat's
   *
   * @param {quat} out the receiving quaternion
   * @param {ReadonlyQuat} a the first operand
   * @param {ReadonlyQuat} b the second operand
   * @returns {quat} out
   */

  function multiply$1(out, a, b) {
    var ax = a[0],
        ay = a[1],
        az = a[2],
        aw = a[3];
    var bx = b[0],
        by = b[1],
        bz = b[2],
        bw = b[3];
    out[0] = ax * bw + aw * bx + ay * bz - az * by;
    out[1] = ay * bw + aw * by + az * bx - ax * bz;
    out[2] = az * bw + aw * bz + ax * by - ay * bx;
    out[3] = aw * bw - ax * bx - ay * by - az * bz;
    return out;
  }
  /**
   * Performs a spherical linear interpolation between two quat
   *
   * @param {quat} out the receiving quaternion
   * @param {ReadonlyQuat} a the first operand
   * @param {ReadonlyQuat} b the second operand
   * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
   * @returns {quat} out
   */

  function slerp(out, a, b, t) {
    // benchmarks:
    //    http://jsperf.com/quaternion-slerp-implementations
    var ax = a[0],
        ay = a[1],
        az = a[2],
        aw = a[3];
    var bx = b[0],
        by = b[1],
        bz = b[2],
        bw = b[3];
    var omega, cosom, sinom, scale0, scale1; // calc cosine

    cosom = ax * bx + ay * by + az * bz + aw * bw; // adjust signs (if necessary)

    if (cosom < 0.0) {
      cosom = -cosom;
      bx = -bx;
      by = -by;
      bz = -bz;
      bw = -bw;
    } // calculate coefficients


    if (1.0 - cosom > EPSILON) {
      // standard case (slerp)
      omega = Math.acos(cosom);
      sinom = Math.sin(omega);
      scale0 = Math.sin((1.0 - t) * omega) / sinom;
      scale1 = Math.sin(t * omega) / sinom;
    } else {
      // "from" and "to" quaternions are very close
      //  ... so we can do a linear interpolation
      scale0 = 1.0 - t;
      scale1 = t;
    } // calculate final values


    out[0] = scale0 * ax + scale1 * bx;
    out[1] = scale0 * ay + scale1 * by;
    out[2] = scale0 * az + scale1 * bz;
    out[3] = scale0 * aw + scale1 * bw;
    return out;
  }
  /**
   * Calculates the inverse of a quat
   *
   * @param {quat} out the receiving quaternion
   * @param {ReadonlyQuat} a quat to calculate inverse of
   * @returns {quat} out
   */

  function invert$1(out, a) {
    var a0 = a[0],
        a1 = a[1],
        a2 = a[2],
        a3 = a[3];
    var dot = a0 * a0 + a1 * a1 + a2 * a2 + a3 * a3;
    var invDot = dot ? 1.0 / dot : 0; // TODO: Would be faster to return [0,0,0,0] immediately if dot == 0

    out[0] = -a0 * invDot;
    out[1] = -a1 * invDot;
    out[2] = -a2 * invDot;
    out[3] = a3 * invDot;
    return out;
  }
  /**
   * Calculates the conjugate of a quat
   * If the quaternion is normalized, this function is faster than quat.inverse and produces the same result.
   *
   * @param {quat} out the receiving quaternion
   * @param {ReadonlyQuat} a quat to calculate conjugate of
   * @returns {quat} out
   */

  function conjugate(out, a) {
    out[0] = -a[0];
    out[1] = -a[1];
    out[2] = -a[2];
    out[3] = a[3];
    return out;
  }
  /**
   * Creates a quaternion from the given 3x3 rotation matrix.
   *
   * NOTE: The resultant quaternion is not normalized, so you should be sure
   * to renormalize the quaternion yourself where necessary.
   *
   * @param {quat} out the receiving quaternion
   * @param {ReadonlyMat3} m rotation matrix
   * @returns {quat} out
   * @function
   */

  function fromMat3(out, m) {
    // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
    // article "Quaternion Calculus and Fast Animation".
    var fTrace = m[0] + m[4] + m[8];
    var fRoot;

    if (fTrace > 0.0) {
      // |w| > 1/2, may as well choose w > 1/2
      fRoot = Math.sqrt(fTrace + 1.0); // 2w

      out[3] = 0.5 * fRoot;
      fRoot = 0.5 / fRoot; // 1/(4w)

      out[0] = (m[5] - m[7]) * fRoot;
      out[1] = (m[6] - m[2]) * fRoot;
      out[2] = (m[1] - m[3]) * fRoot;
    } else {
      // |w| <= 1/2
      var i = 0;
      if (m[4] > m[0]) i = 1;
      if (m[8] > m[i * 3 + i]) i = 2;
      var j = (i + 1) % 3;
      var k = (i + 2) % 3;
      fRoot = Math.sqrt(m[i * 3 + i] - m[j * 3 + j] - m[k * 3 + k] + 1.0);
      out[i] = 0.5 * fRoot;
      fRoot = 0.5 / fRoot;
      out[3] = (m[j * 3 + k] - m[k * 3 + j]) * fRoot;
      out[j] = (m[j * 3 + i] + m[i * 3 + j]) * fRoot;
      out[k] = (m[k * 3 + i] + m[i * 3 + k]) * fRoot;
    }

    return out;
  }
  /**
   * Creates a quaternion from the given euler angle x, y, z.
   *
   * @param {quat} out the receiving quaternion
   * @param {x} Angle to rotate around X axis in degrees.
   * @param {y} Angle to rotate around Y axis in degrees.
   * @param {z} Angle to rotate around Z axis in degrees.
   * @returns {quat} out
   * @function
   */

  function fromEuler(out, x, y, z) {
    var halfToRad = 0.5 * Math.PI / 180.0;
    x *= halfToRad;
    y *= halfToRad;
    z *= halfToRad;
    var sx = Math.sin(x);
    var cx = Math.cos(x);
    var sy = Math.sin(y);
    var cy = Math.cos(y);
    var sz = Math.sin(z);
    var cz = Math.cos(z);
    out[0] = sx * cy * cz - cx * sy * sz;
    out[1] = cx * sy * cz + sx * cy * sz;
    out[2] = cx * cy * sz - sx * sy * cz;
    out[3] = cx * cy * cz + sx * sy * sz;
    return out;
  }
  /**
   * Calculates the length of a quat
   *
   * @param {ReadonlyQuat} a vector to calculate length of
   * @returns {Number} length of a
   */

  var length$2 = length$1;
  /**
   * Normalize a quat
   *
   * @param {quat} out the receiving quaternion
   * @param {ReadonlyQuat} a quaternion to normalize
   * @returns {quat} out
   * @function
   */

  var normalize$2 = normalize$1;
  /**
   * Sets a quaternion to represent the shortest rotation from one
   * vector to another.
   *
   * Both vectors are assumed to be unit length.
   *
   * @param {quat} out the receiving quaternion.
   * @param {ReadonlyVec3} a the initial vector
   * @param {ReadonlyVec3} b the destination vector
   * @returns {quat} out
   */

  var rotationTo = function () {
    var tmpvec3 = create$2();
    var xUnitVec3 = fromValues(1, 0, 0);
    var yUnitVec3 = fromValues(0, 1, 0);
    return function (out, a, b) {
      var dot$1 = dot(a, b);

      if (dot$1 < -0.999999) {
        cross(tmpvec3, xUnitVec3, a);
        if (len(tmpvec3) < 0.000001) cross(tmpvec3, yUnitVec3, a);
        normalize(tmpvec3, tmpvec3);
        setAxisAngle(out, tmpvec3, Math.PI);
        return out;
      } else if (dot$1 > 0.999999) {
        out[0] = 0;
        out[1] = 0;
        out[2] = 0;
        out[3] = 1;
        return out;
      } else {
        cross(tmpvec3, a, b);
        out[0] = tmpvec3[0];
        out[1] = tmpvec3[1];
        out[2] = tmpvec3[2];
        out[3] = 1 + dot$1;
        return normalize$2(out, out);
      }
    };
  }();
  /**
   * Performs a spherical linear interpolation with two control points
   *
   * @param {quat} out the receiving quaternion
   * @param {ReadonlyQuat} a the first operand
   * @param {ReadonlyQuat} b the second operand
   * @param {ReadonlyQuat} c the third operand
   * @param {ReadonlyQuat} d the fourth operand
   * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
   * @returns {quat} out
   */

  var sqlerp = function () {
    var temp1 = create$4();
    var temp2 = create$4();
    return function (out, a, b, c, d, t) {
      slerp(temp1, a, d, t);
      slerp(temp2, b, c, t);
      slerp(out, temp1, temp2, 2 * t * (1 - t));
      return out;
    };
  }();
  /**
   * Sets the specified quaternion with values corresponding to the given
   * axes. Each axis is a vec3 and is expected to be unit length and
   * perpendicular to all other specified axes.
   *
   * @param {ReadonlyVec3} view  the vector representing the viewing direction
   * @param {ReadonlyVec3} right the vector representing the local "right" direction
   * @param {ReadonlyVec3} up    the vector representing the local "up" direction
   * @returns {quat} out
   */

  var setAxes = function () {
    var matr = create();
    return function (out, view, right, up) {
      matr[0] = right[0];
      matr[3] = right[1];
      matr[6] = right[2];
      matr[1] = up[0];
      matr[4] = up[1];
      matr[7] = up[2];
      matr[2] = -view[0];
      matr[5] = -view[1];
      matr[8] = -view[2];
      return normalize$2(out, fromMat3(out, matr));
    };
  }();

  /* eslint-disable no-mixed-operators */
  /* eslint-disable no-bitwise */
  class Tools {
    static uuidv4() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16)
      });
    }
  }

  var RENDER_MODES = {
    POINT_CLOUD: 0,
    POLYLINE: 1,
    TRIANGLE_WIREFRAME: 2,
  };

  var CONSTANTS = {
    SVG_NAMESPACE: 'http://www.w3.org/2000/svg',
  };

  /* eslint-disable no-undef */

  /**
   * A MeshView is a rendered SVG version of a given Mesh.
   * Each Mesh is associated to a MeshView
   */
  class MeshView {
    constructor(mesh) {
      this._mesh = mesh;

      this._view = document.createElementNS(CONSTANTS.SVG_NAMESPACE, 'g');
      this._view.setAttributeNS(null, 'id', mesh.id);

      this._circlePool = [];
      this._circlePoolCounter = 0;

      this._linePool = [];
      this._linePoolCounter = 0;
    }


    get mesh() {
      return this._mesh
    }


    get view() {
      return this._view
    }


    reset() {
      // TODO: compare which is best
      this._view.innerHTML = '';
      // while (this._view.firstChild) {
      //   this._view.removeChild(this._view.firstChild)
      // }
      this._circlePoolCounter = 0;
      this._linePoolCounter = 0;
    }


    /**
     *
     * @param {*} x
     * @param {*} y
     * @param {*} radius
     */
    addCircle(x, y, radius) {
      let circle = null;

      // the pool is not large enough, we create a new circle
      if (this._circlePool.length < this._circlePoolCounter + 1) {
        circle = document.createElementNS(CONSTANTS.SVG_NAMESPACE, 'circle');
        this._circlePool.push(circle);
      } else {
      // The pool is large enough, we borrow a circle from the pool
        circle = this._circlePool[this._circlePoolCounter];
      }

      this._circlePoolCounter += 1;

      circle.setAttributeNS(null, 'cx', x);
      circle.setAttributeNS(null, 'cy', y);
      circle.setAttributeNS(null, 'r', radius);
      // circle.setAttributeNS(null, 'id', this._mesh.id)
      circle.setAttributeNS(null, 'style', `fill: ${this._mesh.color}; opacity: ${this._mesh.opacity}; stroke-width: 0;`);

      this._view.appendChild(circle);
    }


    addLine(xA, yA, xB, yB, thickness) {
      let line = null;

      // the pool is not large enough, we create a new line
      if (this._linePool.length < this._linePoolCounter + 1) {
        line = document.createElementNS(CONSTANTS.SVG_NAMESPACE, 'line');
        this._linePool.push(line);
      } else {
      // The pool is large enough, we borrow a circle from the pool
        line = this._linePool[this._linePoolCounter];
      }

      this._linePoolCounter += 1;
      line.setAttributeNS(null, 'x1', xA);
      line.setAttributeNS(null, 'y1', yA);
      line.setAttributeNS(null, 'x2', xB);
      line.setAttributeNS(null, 'y2', yB);
      // line.setAttributeNS(null, 'id', this._mesh.id)
      line.setAttributeNS(null, 'style', `fill: none; opacity: ${this._mesh.opacity}; stroke-width: ${thickness}; stroke: ${this._mesh.color}`);
      this._view.appendChild(line);
    }
  }

  class Mesh {
    constructor() {
      this._id = Tools.uuidv4();
      this._meshView = new MeshView(this);

      // if visible is false, this mesh will not be rendered
      this._visible = true;

      // geometry data
      this._vertices = null;
      this._worldVertices = null;
      this._faces = null;
      this._uniqueEdges = null;
      this._verticesPerFace = 3;
      this._boundingBox = {
        min: fromValues(0, 0, 0),
        max: fromValues(0, 0, 0),
        center: fromValues(0, 0, 0),
      };
      this._boundingBoxNeedsUpdate = true;

      this._scale = fromValues(1, 1, 1);
      this._quaternion = create$4();
      this._position = create$2();

      // material data
      this._renderMode = RENDER_MODES.POINT_CLOUD;
      this._color = '#000';
      this._opacity = 1;
      this._lineThickness = 1;
      this._radius = 1;

      this._matrix = create$1();
      this._worldVerticesNeedsUpdate = true;
    }


    get id() {
      return this._id
    }


    set renderMode(rm) {
      if (Object.values(RENDER_MODES).includes(rm)) {
        this._renderMode = rm;
      } else {
        throw new Error('The render mode is incorrect.')
      }
    }


    get renderMode() {
      return this._renderMode
    }


    set lineThickness(t) {
      this._lineThickness = t;
    }


    get lineThickness() {
      return this._lineThickness
    }


    set radius(r) {
      this._radius = r;
    }


    get radius() {
      return this._radius
    }


    set vertices(v) {
      if (v.length % 3 !== 0) {
        throw new Error('The vertice array length must be multiple of 3.')
      }

      this._vertices = v;
      this._worldVertices = new v.constructor(v.length);
      this._boundingBoxNeedsUpdate = true;
      return this
    }


    get vertices() {
      return this._vertices
    }


    get nbVertices() {
      if (this._vertices === null) {
        return 0
      } else {
        return this._vertices.length / 3
      }
    }


    get worldVertices() {
      if (this._worldVerticesNeedsUpdate) {
        this._computeWorldVertices();
      }
      return this._worldVertices
    }


    _computeWorldVertices() {
      const mat = this.modelMatrix;
      const tmpVec3 = create$2();
      const vert = this._vertices;

      for (let i = 0; i < this._worldVertices.length; i += 3) {
        tmpVec3[0] = vert[i];
        tmpVec3[1] = vert[i + 1];
        tmpVec3[2] = vert[i + 2];

        transformMat4(tmpVec3, tmpVec3, mat);
        this._worldVertices[i] = tmpVec3[0];
        this._worldVertices[i + 1] = tmpVec3[1];
        this._worldVertices[i + 2] = tmpVec3[2];
      }

      this._worldVerticesNeedsUpdate = false;
    }


    set faces(f) {
      this._faces = f;
    }


    get faces() {
      return this._faces
    }


    set color(c) {
      this._color = c;
    }


    get color() {
      return this._color
    }


    set opacity(o) {
      this._opacity = o;
    }


    get opacity() {
      return this._opacity
    }


    set verticesPerFace(vpf) {
      this._verticesPerFace = vpf;
    }


    get verticesPerFace() {
      return this._verticesPerFace
    }

    get visible() {
      return this._visible
    }


    set visible(v) {
      this._visible = v;
    }


    /**
     * Note: the bounding box is in world coordinates
     */
    _computeBoundingBox() {
      if (this._vertices === null) {
        throw new Error('This mesh does not have any vertex.')
      }

      if (this._worldVerticesNeedsUpdate) {
        this._computeWorldVertices();
      }

      let minx = +Infinity;
      let miny = +Infinity;
      let minz = +Infinity;
      let maxx = -Infinity;
      let maxy = -Infinity;
      let maxz = -Infinity;

      for (let i = 0; i < this._worldVertices.length; i += 3) {
        minx = Math.min(minx, this._worldVertices[i]);
        miny = Math.min(miny, this._worldVertices[i + 1]);
        minz = Math.min(minz, this._worldVertices[i + 2]);
        maxx = Math.max(maxx, this._worldVertices[i]);
        maxy = Math.max(maxy, this._worldVertices[i + 1]);
        maxz = Math.max(maxz, this._worldVertices[i + 2]);
      }

      this._boundingBox.min[0] = minx;
      this._boundingBox.min[1] = miny;
      this._boundingBox.min[2] = minz;
      this._boundingBox.max[0] = maxx;
      this._boundingBox.max[1] = maxy;
      this._boundingBox.max[2] = maxz;

      this._boundingBox.center[0] = (this._boundingBox.min[0] + this._boundingBox.max[0]) / 2;
      this._boundingBox.center[1] = (this._boundingBox.min[1] + this._boundingBox.max[1]) / 2;
      this._boundingBox.center[2] = (this._boundingBox.min[2] + this._boundingBox.max[2]) / 2;

      this._boundingBoxNeedsUpdate = false;
    }


    get boundingBox() {
      if (this._boundingBoxNeedsUpdate) {
        this._computeBoundingBox();
      }
      return this._boundingBox
    }


    get modelMatrix() {
      return this._matrix
    }


    get meshView() {
      return this._meshView
    }


    set position(p) {
      this._position[0] = p[0];
      this._position[1] = p[1];
      this._position[2] = p[2];
      this.updateMatrix();
    }


    get position() {
      return this._position.slice()
    }


    set quaternion(q) {
      this._quaternion[0] = q[0];
      this._quaternion[1] = q[1];
      this._quaternion[2] = q[2];
      this._quaternion[3] = q[3];
      this.updateMatrix();
    }


    get quaternion() {
      return this._quaternion.slice()
    }


    set scale(s) {
      this._scale[0] = s[0];
      this._scale[1] = s[1];
      this._scale[2] = s[2];
      this.updateMatrix();
    }

    get scale() {
      return this._scale.slice()
    }

    get uniqueEdges() {
      if (!this._uniqueEdges) {
        this._computeUniqueEdges();
      }
      return this._uniqueEdges
    }


    updateMatrix() {
      fromRotationTranslationScale(this._matrix, this._quaternion, this._position, this._scale);
      this._worldVerticesNeedsUpdate = true;
      this._boundingBoxNeedsUpdate = true;
    }


    setRotationFromEulerDegree(x, y, z) {
      fromEuler(this._quaternion, x, y, z);
      this.updateMatrix();
    }


    _computeUniqueEdges() {
      if (this._faces === null) {
        throw new Error('The faces must be set before computing unique edges.')
      }

      const f = this._faces;
      const vpf = this._verticesPerFace;

      const verticePairs = {};

      for (let i = 0; i < f.length; i += vpf) {
        for (let j = 1; j < vpf; j += 1) {
          const verticeA = f[i + j - 1];
          const verticeB = f[i + j];
          let verticeLowerIndex = null;
          let verticeHigherIndex = null;

          if (verticeA < verticeB) {
            verticeLowerIndex = verticeA;
            verticeHigherIndex = verticeB;
          } else {
            verticeLowerIndex = verticeB;
            verticeHigherIndex = verticeA;
          }

          if (!(verticeLowerIndex in verticePairs)) {
            verticePairs[verticeLowerIndex] = new Set();
          }

          verticePairs[verticeLowerIndex].add(verticeHigherIndex);
        }
      }

      const tmp = [];
      const allFirtVertices = Object.keys(verticePairs).map((index) => parseInt(index, 10));

      for (let i = 0; i < allFirtVertices.length; i += 1) {
        const firstVertex = allFirtVertices[i];
        const it = verticePairs[firstVertex].entries();
        // eslint-disable-next-line no-restricted-syntax
        for (let secondVertex of it) {
          tmp.push(firstVertex, secondVertex[0]);
        }
      }

      this._uniqueEdges = new Uint32Array(tmp);
    }


    /**
     * Create a clone of this mesh with no shared structure. Can downsample the number of vertices
     * @param {*} nbVertices
     */
    clone() {
      const cpMesh = new Mesh();
      cpMesh.renderMode = this.renderMode;
      cpMesh.position = this.position;
      cpMesh.quaternion = this.quaternion;
      cpMesh.scale = this.scale;
      cpMesh.verticesPerFace = this.verticesPerFace;
      cpMesh.color = this.color;
      cpMesh.opacity = this.opacity;
      cpMesh.radius = this.radius;
      cpMesh.lineThickness = this.lineThickness;

      cpMesh.vertices = this._vertices ? this._vertices.slice() : null;
      cpMesh.faces = this._faces ? this._faces.slice() : null;

      return cpMesh
    }



  }

  class Scene {
    constructor() {
      this._objects = [];
    }


    add(mesh) {
      if (mesh instanceof Mesh) {
        this._objects.push(mesh);
      } else {
        throw new Error('The provided object is not a Mesh.')
      }

      return this
    }


    remove(meshId) {
      for (let i = this._objects.length - 1; i >= 0; i -= 1) {
        if (this._objects[i].id === meshId) {
          this._objects.splice(i, 1);
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

  // inspired by:
  // https://github.com/mikolalysenko/orbit-camera/blob/master/orbit.js

  function quatFromVec(out, da) {
    const x = da[0];
    const y = da[1];
    const z = da[2];
    let s = x * x + y * y;

    if (s > 1.0) {
      s = 1.0;
    }
    out[0] = -da[0];
    out[1] = da[1];
    out[2] = da[2] || Math.sqrt(1.0 - s);
    out[3] = 0.0;
  }


  let scratch0 = new Float32Array(16);
  let scratch1 = new Float32Array(16);


  class PerspectiveCamera {
    constructor(options = {}) {
      this._rotation = create$4();
      this._center = create$2();
      this._distance = 10;

      // necessary for the projection matrix
      this._fovy = Math.PI / 4;
      this._aspectRatio = 16 / 9; // typically width / height
      this._near = 0.01;
      this._far = Infinity;

      if ('eye' in options && 'center' in options && 'up' in options) {
        this.lookAt(options.eye, options.center, options.up);
      }
    }

    lookAt(eye, center, up) {
      lookAt(scratch0, eye, center, up);
      fromMat4(scratch0, scratch0);
      fromMat3(this._rotation, scratch0);
      copy(this._center, center);
      this._distance = distance(eye, center);
    }

    get matrix() {
      let m = create$1();
      invert(m, this.viewMatrix);
      return m
    }

    get position() {
      const m = this.matrix;
      return fromValues(m[12], m[13], m[14])
    }

    get viewMatrix() {
      const out = create$1();
      scratch1[0] = 0;
      scratch1[1] = 0;
      scratch1[2] = -this._distance;
      fromRotationTranslation(
        out,
        conjugate(scratch0, this._rotation),
        scratch1,
      );
      translate(out, out, negate(scratch0, this._center));
      return out
    }


    translate(vec) {
      const d = this._distance;
      scratch0[0] = -d * (vec[0] || 0);
      scratch0[1] = d * (vec[1] || 0);
      scratch0[2] = d * (vec[2] || 0);
      transformQuat(scratch0, scratch0, this._rotation);
      add(this._center, this._center, scratch0);
    }


    dolly(d) {
      this._distance += d;
      if (this._distance < 0.0) {
        this._distance = 0.0;
      }
    }


    rotate(db) { // TODO: simplify this
      quatFromVec(scratch0, [0, 0]);
      quatFromVec(scratch1, db);
      invert$1(scratch1, scratch1);
      multiply$1(scratch0, scratch0, scratch1);
      if (length$2(scratch0) < 1e-6) {
        return
      }
      multiply$1(this._rotation, this._rotation, scratch0);
      normalize$2(this._rotation, this._rotation);
    }


    get projMatrix() {
      const pm = create$1();
      perspective(pm, this._fovy, this._aspectRatio, this._near, this._far);
      return pm
    }


    set aspectRatio(ar) {
      this._aspectRatio = ar;
    }


    get apectRatio() {
      return this._aspectRatio
    }


    /**
     * Vertical field of view in radian
     */
    set fieldOfView(fov) {
      this._fovy = fov;
    }

    get fieldOfView() {
      return this._fovy
    }


    set near(n) {
      this._near = n;
    }


    get near() {
      return this._near
    }


    set far(f) {
      this._far = f;
    }


    get far() {
      return this._far
    }

  }

  /* eslint-disable no-continue */

  class Renderer {
    constructor(parentDiv, options) {
      this._width = 'width' in options ? options.width : window.innerWidth;
      this._height = 'height' in options ? options.height : window.innerHeight;
      this._parentDiv = parentDiv;

      this._canvas = document.createElementNS(CONSTANTS.SVG_NAMESPACE, 'svg');
      this._canvas.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      this._canvas.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
      this._canvas.setAttribute('height', `${this._height}`);
      this._canvas.setAttribute('width', `${this._width}`);
      this._canvas.setAttribute('viewBox', `0 0 ${this._width} ${this._height}`);
      this._parentDiv.appendChild(this._canvas);

      this._scene = null;
      this._camera = null;

      if ('scene' in options) {
        this.scene = options.scene;
      }

      if ('camera' in options) {
        this.camera = options.camera;
      }

    }


    set scene(s) {
      if (s instanceof Scene) {
        this._scene = s;
      } else {
        throw new Error('Invalid Scene object.')
      }
    }


    set camera(c) {
      if (c instanceof PerspectiveCamera) {
        this._camera = c;
      } else {
        throw new Error('Invalid Camera Object.')
      }
    }


    resetCanvas() {
      this._canvas.innerHTML = '';
      // while (this._canvas.firstChild) {
      //   this._canvas.removeChild(this._canvas.firstChild)
      // }
    }


    render() {
      if (this._camera === null) {
        throw new Error('A Camera must be set.')
      }

      if (this._scene === null) {
        throw new Error('A Scene must be set.')
      }

      this.resetCanvas();

      const meshes = this._scene.getAll();
      const viewMat = this._camera.viewMatrix;
      const projMat = this._camera.projMatrix;

      meshes.forEach((mesh) => {
        if (!mesh.visible) {
          return
        }

        // dealing with matrices
        const modelMat = mesh.modelMatrix;
        const modelViewMat = create$1();
        const modelViewProjMat = create$1();
        // glmatrix.mat4.multiply(modelViewMat, modelMat, viewMat)
        // glmatrix.mat4.multiply(modelViewProjMat, modelViewMat, projMat)

        multiply(modelViewMat, viewMat, modelMat);
        multiply(modelViewProjMat, projMat, modelViewMat);

        switch (mesh.renderMode) {
          case RENDER_MODES.POINT_CLOUD:
            this._renderPointCloud(mesh, modelViewProjMat);
            break
          case RENDER_MODES.TRIANGLE_WIREFRAME:
            this._renderEdges(mesh, modelViewProjMat);
            break
          default: throw new Error('Only point cloud rendering is implemented for the moment.')
        }
      });
    }


    /**
     * transform a 2D unit position [-1, 1] into an actual canvas position
     * that has origin on top left.
     */
    _unit2DPositionToCanvasPosition(unitPos) {
      return [
        (unitPos[0] * this._width + this._width) * 0.5,
        this._height - (unitPos[1] * this._height + this._height) * 0.5,
      ]
    }


    _renderPointCloud(mesh, mvpMat) {
      const meshView = mesh.meshView;
      const vertices = mesh.worldVertices;
      const camPosition = this._camera.position;

      meshView.reset();
      const tmpVector = create$2();

      for (let i = 0; i < vertices.length; i += 3) {
        // computing the position of the center of the circle to add
        transformMat4(tmpVector, [vertices[i], vertices[i + 1], vertices[i + 2]], mvpMat);

        // No rendering if outside of projection  canonical/frustrum box
        if (tmpVector[0] >= 1
        || tmpVector[0] <= -1
        || tmpVector[1] >= 1
        || tmpVector[1] <= -1
        || tmpVector[2] >= 1
        || tmpVector[2] <= -1) {
          continue
        }

        const canvasPos = this._unit2DPositionToCanvasPosition(tmpVector);

        // computing the cirlce radius
        const mesh2camDistance = ((vertices[i] - camPosition[0]) ** 2 + (vertices[i + 1] - camPosition[1]) ** 2 + (vertices[i + 2] - camPosition[2]) ** 2) ** 0.5;
        const radius = (mesh.radius / (Math.tan(this._camera.fieldOfView / 2) * mesh2camDistance)) * (this._height / 2);
        meshView.addCircle(canvasPos[0], canvasPos[1], radius);
      }

      this._canvas.appendChild(meshView.view);
    }





    _renderEdges(mesh, mvpMat) {
      const meshView = mesh.meshView;
      const vertices = mesh.worldVertices;
      const uniqueEdges = mesh.uniqueEdges;
      const camPosition = this._camera.position;

      meshView.reset();
      const tmpVectorA = create$2();
      const tmpVectorB = create$2();

      for (let i = 0; i < uniqueEdges.length; i += 2) {
        const vertIndexA = uniqueEdges[i];
        const vertIndexB = uniqueEdges[i + 1];

        transformMat4(tmpVectorA, [vertices[3 * vertIndexA], vertices[3 * vertIndexA + 1], vertices[3 * vertIndexA + 2]], mvpMat);
        transformMat4(tmpVectorB, [vertices[3 * vertIndexB], vertices[3 * vertIndexB + 1], vertices[3 * vertIndexB + 2]], mvpMat);

        // No rendering if the two points are outside of projection  canonical/frustrum box
        if ((tmpVectorA[0] >= 1
        || tmpVectorA[0] <= -1
        || tmpVectorA[1] >= 1
        || tmpVectorA[1] <= -1
        || tmpVectorA[2] >= 1
        || tmpVectorA[2] <= -1)
        && (tmpVectorB[0] >= 1
        || tmpVectorB[0] <= -1
        || tmpVectorB[1] >= 1
        || tmpVectorB[1] <= -1
        || tmpVectorB[2] >= 1
        || tmpVectorB[2] <= -1)) {
          continue
        }

        const middlePoint = [
          (tmpVectorA[0] + tmpVectorB[0]) / 2,
          (tmpVectorA[1] + tmpVectorB[1]) / 2,
          (tmpVectorA[2] + tmpVectorB[2]) / 2,
        ];

        const mesh2camDistance = ((middlePoint[0] - camPosition[0]) ** 2 + (middlePoint[1] - camPosition[1]) ** 2 + (middlePoint[2] - camPosition[2]) ** 2) ** 0.5;
        const thickness = (mesh.lineThickness / (Math.tan(this._camera.fieldOfView / 2) * mesh2camDistance)) * (this._height / 2);
        const canvasPosA = this._unit2DPositionToCanvasPosition(tmpVectorA);
        const canvasPosB = this._unit2DPositionToCanvasPosition(tmpVectorB);

        meshView.addLine(canvasPosA[0], canvasPosA[1], canvasPosB[0], canvasPosB[1], thickness);
      }

      this._canvas.appendChild(meshView.view);
    }
  }

  var wavefrontObjParser = ParseWavefrontObj;

  // Map .obj vertex info line names to our returned property names
  var vertexInfoNameMap = {v: 'vertexPositions', vt: 'vertexUVs', vn: 'vertexNormals'};

  function ParseWavefrontObj (wavefrontString) {

    var parsedJSON = {vertexNormals: [], vertexUVs: [], vertexPositions: [], vertexNormalIndices: [], vertexUVIndices: [], vertexPositionIndices: []};

    var linesInWavefrontObj = wavefrontString.split('\n');

    var currentLine, currentLineTokens, vertexInfoType, i, k;

    // Loop through and parse every line in our .obj file
    for (i = 0; i < linesInWavefrontObj.length; i++) {
      currentLine = linesInWavefrontObj[i];
      // Tokenize our current line
      currentLineTokens = currentLine.trim().split(/\s+/);
      // vertex position, vertex texture, or vertex normal
      vertexInfoType = vertexInfoNameMap[currentLineTokens[0]];

      if (vertexInfoType) {
        for (k = 1; k < currentLineTokens.length; k++) {
          parsedJSON[vertexInfoType].push(parseFloat(currentLineTokens[k]));
        }
        continue
      }

      if (currentLineTokens[0] === 'f') {
        // Get our 4 sets of vertex, uv, and normal indices for this face
        for (k = 1; k < 5; k++) {
          // If there is no fourth face entry then this is specifying a triangle
          // in this case we push `-1`
          // Consumers of this module should check for `-1` before expanding face data
          if (k === 4 && !currentLineTokens[4]) {
            parsedJSON.vertexPositionIndices.push(-1);
            parsedJSON.vertexUVIndices.push(-1);
            parsedJSON.vertexNormalIndices.push(-1);
          } else {
            var indices = currentLineTokens[k].split('/');
            parsedJSON.vertexPositionIndices.push(parseInt(indices[0], 10) - 1); // We zero index
            parsedJSON.vertexUVIndices.push(parseInt(indices[1], 10) - 1); // our face indices
            parsedJSON.vertexNormalIndices.push(parseInt(indices[2], 10) - 1); // by subtracting 1
          }
        }
      }
    }

    return parsedJSON
  }

  class ObjParser {
    static parse(objStr) {
      const meshData = wavefrontObjParser(objStr);
      const faces = new Uint32Array(meshData.vertexPositionIndices.filter((v) => v >= 0)); // the lib leaves room for 4-vertices faces by adding -1
      const vertices = new Float32Array(meshData.vertexPositions);
      const normals = new Float32Array(meshData.vertexNormals);

      return {
        vertices,
        faces,
        normals,
      }
    }
  }

  var index = ({
    Scene,
    PerspectiveCamera,
    Mesh,
    Renderer,
    ObjParser,
    RENDER_MODES,
  });

  return index;

})));
//# sourceMappingURL=svglcore.umd.js.map
