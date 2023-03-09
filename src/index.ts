/**
 * Movement and rotation by keyboard and mouse
 *
 * @packageDocumentation
 */
import * as THREE from "three";

const DEFAULT_ROTATE_SPEED = 1;
const DEFAULT_MOVE_SPEED = 2;
const MIN_DIFF = 20;
const DEFAULT_INTERVAL_SEC = 1 / 60; // 60fps

class Tmps {
  vec: THREE.Vector3;
  vec1: THREE.Vector3;
  vec2: THREE.Vector3;
  quat: THREE.Quaternion;
  spi: THREE.Spherical;
  constructor() {
    this.vec = new THREE.Vector3();
    this.vec1 = new THREE.Vector3();
    this.vec2 = new THREE.Vector3();
    this.quat = new THREE.Quaternion();
    this.spi = new THREE.Spherical();
  }
}
let _tmps: Tmps;

export interface MoveControllerOptions {
  /**
   * Movement speed. Default is 2.
   */
  moveSpeed?: number;
  /**
   * Rotation speed. Default is 1
   */
  rotationSpeed?: number;
  /**
   * Minimum radian angle of vertical rotation. Default is undefined (unlimited).
   */
  minVerticalRotation?: number;
  /**
   * Maximum radian angle of vertical rotation. Default is undefined (unlimited).
   */
  maxVerticalRotation?: number;
  /**
   * Processing frequency of tick(). Default is 1 / 60 (60fps).
   */
  intervalSec?: number;
}

/**
 * Movement and rotation by keyboard and mouse
 */
export class MoveController {
  /**
   * Object to move
   */
  moveTarget: THREE.Object3D;
  /**
   * Objects to be rotated horizontally
   */
  horizontalRotationTarget: THREE.Object3D;
  /**
   * Objects to be rotated vertically
   */
  verticalRotationTarget?: THREE.Object3D;
  /**
   * When set to false, Will not respond to rotation controls. Default is true.
   */
  rotationEnabled = true;
  /**
   * When set to false, Will not respond to movement controls. Default is true.
   */
  moveEnabled = true;
  /**
   * When set to false, Will not respond to vertical rotation controls. Default is true.
   */
  verticalRotationEnabled = true;
  /**
   * Movement speed. Default is 2.
   */
  moveSpeed: number;
  /**
   * Rotation speed. Default is 1
   */
  rotationSpeed: number;
  private _isMove = false;
  private _isRotation = false;
  private _moveDirection: THREE.Vector3;
  private _rotationStartX = 0;
  private _rotationStartY = 0;
  private _rotationAxis: THREE.Vector3;
  private _enabled = true;
  private _minVerticalRotation?: number;
  private _maxVerticalRotation?: number;
  private _intervalSec = 0;
  private _sec = 0;

  /**
   * @param moveTarget - Object to move
   * @param horizontalRotationTarget - Objects to be rotated horizontally
   * @param verticalRotationTarget - Objects to be rotated vertically
   * @example
   * ```ts
   * this.moveController = new MoveController(
   *   person,
   *   person,
   *   cameraContainer,
   *   {
   *     minVerticalRotation: 1.2,
   *     maxVerticalRotation: 2.2,
   *   }
   *);
   * ```
   */
  constructor(
    moveTarget: THREE.Object3D,
    horizontalRotationTarget: THREE.Object3D,
    verticalRotationTarget?: THREE.Object3D,
    options?: MoveControllerOptions
  ) {
    if (!_tmps) {
      _tmps = new Tmps();
    }
    this.moveTarget = moveTarget;
    this.horizontalRotationTarget = horizontalRotationTarget;
    this.verticalRotationTarget = verticalRotationTarget;
    this._moveDirection = new THREE.Vector3();
    this._rotationAxis = new THREE.Vector3();

    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onMouseStart = this._onMouseStart.bind(this);
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseCancel = this._onMouseCancel.bind(this);
    this._onMouseEnd = this._onMouseEnd.bind(this);

    this.moveSpeed = options?.moveSpeed || DEFAULT_MOVE_SPEED;
    this.rotationSpeed = options?.rotationSpeed || DEFAULT_ROTATE_SPEED;
    this._minVerticalRotation = options?.minVerticalRotation;
    this._maxVerticalRotation = options?.maxVerticalRotation;
    this._intervalSec =
      options?.intervalSec || options?.intervalSec === 0
        ? options.intervalSec
        : DEFAULT_INTERVAL_SEC;

    if (this._enabled) {
      this._start();
    }
  }
  /**
   * When set to false, Will not respond to all controls. Default is true.
   */
  get enabled() {
    return this._enabled;
  }
  set enabled(v: boolean) {
    v = !!v; // convert to bolean
    if (this._enabled === v) {
      return;
    }
    this._enabled = v;
    if (this._enabled) {
      this._start();
    } else {
      this._stop();
    }
  }
  private _start() {
    this._addEventListeners();
  }
  private _stop() {
    this._removeEventListeners();
  }

  /**
   * Releases all resources allocated by this instance.
   */
  dispose() {
    this.enabled = false;
  }
  private _addEventListeners() {
    window.addEventListener("keyup", this._onKeyUp);
    window.addEventListener("keydown", this._onKeyDown);

    window.addEventListener("mousedown", this._onMouseStart);
    window.addEventListener("mouseup", this._onMouseEnd);
    window.addEventListener("mousecancel", this._onMouseCancel);
    window.addEventListener("mousemove", this._onMouseMove);
    document.body.addEventListener("contextmenu", this._onMouseCancel);
  }
  private _removeEventListeners() {
    window.removeEventListener("keyup", this._onKeyUp);
    window.removeEventListener("keydown", this._onKeyDown);

    window.removeEventListener("mousedown", this._onMouseStart);
    window.removeEventListener("mouseup", this._onMouseEnd);
    window.removeEventListener("mousecancel", this._onMouseCancel);
    window.removeEventListener("mousemove", this._onMouseMove);
    document.body.removeEventListener("contextmenu", this._onMouseCancel);
  }
  /**
   * Must be called periodically.
   *
   * @param deltaTime - `THREE.Clock.getDelta()`
   *
   * @example
   * ```ts
   * const clock = new THREE.Clock();
   * renderer.setAnimationLoop(() => {
   *   const dt = clock.getDelta();
   *   moveController.tick(dt);
   * });
   * ```
   * or
   * ```ts
   * const clock = new THREE.Clock();
   * setInterval(() => {
   *   const dt = clock.getDelta();
   *   moveController.tick(dt);
   * }, anything);
   * ```
   */
  tick(deltaTime: number) {
    if (!this._enabled) {
      return;
    }
    this._sec += deltaTime;
    if (this._sec < this._intervalSec) {
      return;
    }
    const dt = this._sec;
    this._sec = 0;

    const moveSpeed = this.moveSpeed;
    const rotationSpeed = this.rotationSpeed;

    if (this._isRotation && this.rotationEnabled) {
      if (this._rotationAxis.x !== 0) {
        if (this._rotationAxis.x > 0) {
          this.horizontalRotationTarget.rotation.y =
            (this.horizontalRotationTarget.rotation.y - rotationSpeed * dt) %
            (Math.PI * 2);
        } else {
          this.horizontalRotationTarget.rotation.y =
            (this.horizontalRotationTarget.rotation.y + rotationSpeed * dt) %
            (Math.PI * 2);
        }
      } else if (this._rotationAxis.y !== 0 && this.verticalRotationEnabled) {
        const rotationTarget = this.verticalRotationTarget;
        if (rotationTarget) {
          const rad = dt * rotationSpeed;
          const direction = _tmps.vec.set(0, 0, 1);
          const sin = Math.sin(rad * this._rotationAxis.y);
          const cos = Math.cos(rad * this._rotationAxis.y);
          direction.set(
            0,
            direction.y * cos - direction.z * sin,
            direction.y * sin + direction.z * cos
          );
          const targetQuat = rotationTarget.getWorldQuaternion(_tmps.quat);
          rotationTarget
            .getWorldPosition(_tmps.vec1)
            .add(direction.applyQuaternion(targetQuat).multiplyScalar(1));

          const spi = _tmps.spi.setFromVector3(
            _tmps.vec
              .copy(_tmps.vec1)
              .sub(rotationTarget.getWorldPosition(_tmps.vec2))
          );

          if (
            (this._minVerticalRotation === undefined ||
              this._minVerticalRotation <= spi.phi) &&
            (this._maxVerticalRotation === undefined ||
              spi.phi <= this._maxVerticalRotation)
          ) {
            rotationTarget.lookAt(_tmps.vec1);
          }
        }
      }
    }
    if (this._isMove && this.moveEnabled) {
      const direction = _tmps.vec.copy(this._moveDirection);
      const targetQuat = this.horizontalRotationTarget.getWorldQuaternion(
        _tmps.quat
      );
      targetQuat.x = 0;
      targetQuat.z = 0;
      direction.applyQuaternion(targetQuat);
      const power = 1.0;
      this.moveTarget.position.x += moveSpeed * direction.x * dt * power;
      // this.moveTarget.position.y += moveSpeed * direction.y * dt * power;
      this.moveTarget.position.z += moveSpeed * direction.z * dt * power;
    }
  }
  private _onKeyDown(e: KeyboardEvent) {
    // e.preventDefault();
    switch (e.code) {
      case "ArrowUp":
      case "KeyW":
        this._moveDirection.set(0, 0, -1);
        break;
      case "ArrowDown":
      case "KeyS":
        this._moveDirection.set(0, 0, 1);
        break;
      case "ArrowLeft":
      case "KeyA":
        this._moveDirection.set(-1, 0, 0);
        break;
      case "ArrowRight":
      case "KeyD":
        this._moveDirection.set(1, 0, 0);
        break;
      default:
        return;
    }
    this._isMove = true;
  }
  private _onKeyUp(_e: KeyboardEvent) {
    this._clear();
  }
  private _onMouseStart(e: MouseEvent) {
    if ((e.target as HTMLElement).tagName !== "CANVAS") {
      return;
    }
    this._isRotation = true;
    if (e.clientX === undefined) {
      return;
    }
    this._rotationStartX = e.clientX;
    this._rotationStartY = e.clientY;
  }
  private _onMouseMove(e: MouseEvent) {
    if (!this._isRotation) {
      return;
    }
    const diffX = Math.abs(this._rotationStartX - e.clientX);
    const diffY = Math.abs(this._rotationStartY - e.clientY);
    if (diffX > diffY) {
      if (diffX > MIN_DIFF) {
        if (this._rotationAxis.y !== 0) {
          this._rotationAxis.y = 0;
        }
        if (this._rotationStartX < e.clientX) {
          this._rotationAxis.x = 1;
        } else {
          this._rotationAxis.x = -1;
        }
      }
    } else {
      if (diffY > MIN_DIFF) {
        if (this._rotationAxis.x !== 0) {
          this._rotationAxis.x = 0;
        }
        if (this._rotationStartY < e.clientY) {
          this._rotationAxis.y = -1;
        } else {
          this._rotationAxis.y = 1;
        }
      }
    }
  }
  private _onMouseEnd(_e: Event) {
    this._clear();
  }
  private _onMouseCancel(_e: Event) {
    this._clear();
  }
  private _clear() {
    this._isMove = false;
    this._isRotation = false;
    this._moveDirection.set(0, 0, 0);
    this._rotationAxis.set(0, 0, 0);
  }
}
