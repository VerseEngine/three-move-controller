# three-move-controller
 
Movement and rotation by keyboard and mouse

## Features
* Move with WASD and arrow keys
* Rotate by mouse dragging
* Individually set targets for vertical and horizontal rotation
* Enable movement and rotation individually
* Limit control of vertical rotation
* Vertical rotation On/Off

 ![preview](https://user-images.githubusercontent.com/20784450/212250950-dd7ff3b7-3b4b-4c65-a546-ce2af021a589.gif)


## Example
```bash
npm run example
```

## Usage
```javascript
import * as THREE from "three";
import { MoveController } from "three-move-controller";

const person:Object3D = ...;
const head:Object3D = ...;
const camera:THREE.PerspectiveCamera = ...;

person.add(head);
head.add(camera);
head.position.set(0.0, 1.7, 0.0);

const moveController = new MoveController(person, head, head, {
  minVerticalRotation: 0.65,
  maxVerticalRotation: 2.2,
});
moveController.rotationEnabled = true;
moveController.moveEnabled = true;
moveController.verticalRotationEnabled = true;

...

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = clock.getDelta();
  moveController.tick(dt);
});
```

# Reference

## API Reference
[Link](docs/three-move-controller.md)
