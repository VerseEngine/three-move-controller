# three-move-controller &middot; [![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/VerseEngine/three-move-controller/blob/main/LICENSE)  [![npm version](https://img.shields.io/npm/v/@verseengine%2Fthree-move-controller.svg?style=flat)](https://www.npmjs.com/package/@verseengine%2Fthree-move-controller)  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/VerseEngine/three-move-controller/pulls)
 
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

## Installation
### npm
```bash
npm install @verseengine/three-move-controller
```

### CDN (ES Mobules)
```html
<script
      async
      src="https://cdn.jsdelivr.net/npm/es-module-shims@1.6.2/dist/es-module-shims.min.js"
    ></script>
<script type="importmap">
  {
    "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@0.137.0/build/three.module.js",
      "three-move-controller": "https://cdn.jsdelivr.net/npm/@verseengine/three-move-controller@1.0.1/dist/esm/index.js"
    }
  }
</script>
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
