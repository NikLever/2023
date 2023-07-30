import { VRButton } from './VRButton.js';
import { SPWorld } from './SimplePhysics/SPWorld.js';
import { SPBody } from './SimplePhysics/SPBody.js';
import { SPSphereCollider, SPPlaneCollider, SPAABBCollider } from './SimplePhysics/SPCollider.js';

class App{
	constructor(){
		const container = document.createElement( 'div' );
		document.body.appendChild( container );
        
        this.clock = new THREE.Clock();
        
		this.camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 0.1, 200 );
		this.camera.position.set( 0, 1.6, 5 );
        
		this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color( 0x505050 );

		this.scene.add( new THREE.HemisphereLight( 0xffffff, 0x404040 ) );

        const light = new THREE.DirectionalLight( 0xffffff );
        light.position.set( 1, 1, 1 ).normalize();
		this.scene.add( light );
			
		this.renderer = new THREE.WebGLRenderer({ antialias: true } );
		this.renderer.setPixelRatio( window.devicePixelRatio );
		this.renderer.setSize( window.innerWidth, window.innerHeight );
        
		container.appendChild( this.renderer.domElement );
        
        this.raycaster = new THREE.Raycaster();
        this.workingMatrix = new THREE.Matrix4();
        this.workingVector = new THREE.Vector3();
        this.workingQuat = new THREE.Quaternion();
        this.origin = new THREE.Vector3();
        
        this.initScene();
        this.initPhysics();
        this.setupVR();
        
        window.addEventListener('resize', this.resize.bind(this) );
        
        this.renderer.setAnimationLoop( this.render.bind(this) );
	}	
    
    random( min, max ){
        return Math.random() * (max-min) + min;
    }
    
    initScene(){

		this.scene.background = new THREE.Color( 0xa0a0a0 );
		this.scene.fog = new THREE.Fog( 0xa0a0a0, 50, 100 );

		// ground
		const ground = new THREE.Mesh( new THREE.PlaneGeometry( 200, 200 ), new THREE.MeshPhongMaterial( { color: 0x999999, depthWrite: true } ) );
		ground.rotation.x = - Math.PI / 2;
		this.scene.add( ground );
        this.ground = ground;

		var grid = new THREE.GridHelper( 200, 40, 0x000000, 0x000000 );
		grid.material.opacity = 0.2;
		grid.material.transparent = true;
		this.scene.add( grid );
        
        const geometry = new THREE.BoxGeometry(5, 5, 5);
        const material = new THREE.MeshPhongMaterial({ color:0xAAAA22 });
        const edges = new THREE.EdgesGeometry( geometry );
        const line = new THREE.LineSegments( edges, new THREE.LineBasicMaterial( { color: 0x000000, linewidth: 2 } ) );

        this.colliders = [];
        
        for (let x=-100; x<100; x+=10){
            for (let z=-100; z<100; z+=10){
                if (x==0 && z==0) continue;
                const box = new THREE.Mesh(geometry, material);
                box.position.set(x, 2.5, z);
                const edge = line.clone();
                edge.position.copy( box.position );
                this.scene.add(box);
                this.scene.add(edge);
                this.colliders.push(box);
            }
        }
    } 
    
    createWalls(){
        const width = 1;
        const height = 3;
        const depth = 3;
        const geometry = new THREE.BoxGeometry( width, height, depth );
        const material = new THREE.MeshPhongMaterial( { color: 0x00FF00 });

        const leftwall = new THREE.Mesh( geometry, material );
        leftwall.position.set( -3, height/2-1, 3 );
        this.scene.add( leftwall );
        const body1 = new SPBody( leftwall, new SPAABBCollider(new THREE.Vector3(-width/2, -height/2, -depth/2), 
                                        new THREE.Vector3(width/2, height/2, depth/2) )); 
        this.world.addBody( body1 );

        const rightwall = new THREE.Mesh( geometry, material );
        rightwall.position.set( 3, height/2-1, 3 );
        this.scene.add( rightwall );
        const body2 = new SPBody( rightwall, new SPAABBCollider(new THREE.Vector3(-width/2, -height/2, -depth/2), 
                                        new THREE.Vector3(width/2, height/2, depth/2) )); 
        this.world.addBody( body2 );

        const backwall = new THREE.Mesh( geometry, material );
        backwall.position.set( 0, height/2-1, 3-depth/2 );
        backwall.scale.set(1, 1, 2);
        backwall.rotateY( Math.PI/2 );
        this.scene.add( backwall );
        const body3 = new SPBody( backwall, new SPAABBCollider(new THREE.Vector3(-depth, -height/2, -width/2), 
                                        new THREE.Vector3(depth, height/2, width/2) ));  
        this.world.addBody( body3 );

        /*const floor = new THREE.Mesh( geometry, material );
        floor.position.set( 0, 0, 3);
        floor.rotateZ( Math.PI/2 );
        this.scene.add( floor );
        const body4 = new SPBody( floor, new SPAABBCollider(new THREE.Vector3(-depth/2, -0.5, -height/2), 
                                        new THREE.Vector3(depth/2, 0.5, height/2) ));  
        this.world.addBody( body4 );*/
    }

    createBall(){
        const geometry = new THREE.SphereGeometry( 0.5, 20, 12 );
        const material = new THREE.MeshPhongMaterial( { color: 0xFF0000 });
        const ball = new THREE.Mesh( geometry, material );
        //ball.position.set( Math.random()*2-1, 5, 3+Math.random()*2-1 );
        ball.position.set( 0, 4, 2 );
        this.scene.add( ball );
        const body = new SPBody( ball, new SPSphereCollider(0.5), 1 ); 
        //body.velocity.z = -2;
        this.world.addBody( body );
        this.ballcount++;
        if (this.ballcount==20) clearInterval(this.timeout);
    }

    initPhysics(){
        this.world = new SPWorld();
        //this.timeout = setInterval( this.createBall.bind(this), 1000);
        this.createBall();
        this.ballcount = 0;
        const ground = new SPBody( this.ground, new SPPlaneCollider( ) );
        this.world.addBody( ground );
        this.createWalls();
    }

    setupVR(){
        this.renderer.xr.enabled = true;
        
        const button = new VRButton( this.renderer );
        
        function onSelectStart() {
            
            this.userData.selectPressed = true;
        }

        function onSelectEnd() {

            this.userData.selectPressed = false;
            
        }

        function onSqueezeStart() {
            
            this.userData.squeezePressed = true;
        }

        function onSqueezeEnd() {

            this.userData.squeezePressed = false;
            
        }
        
        this.dolly = new THREE.Object3D();

        this.controllers = [];

        for (let i=0; i<=1; i++){
            const controller = this.renderer.xr.getController( i );
            controller.addEventListener( 'selectstart', onSelectStart );
            controller.addEventListener( 'selectend', onSelectEnd );
            controller.addEventListener( 'squeezestart', onSqueezeStart );
            controller.addEventListener( 'squeezeend', onSqueezeEnd );
            controller.addEventListener( 'connected', ( event ) => {
                const mesh = this.buildController(event.data, i);
                mesh.scale.z = 0;
                controller.add( mesh );
            } );
            controller.addEventListener( 'disconnected',  (controller) => {
                const grip = this.children[0];
                if (grip){
                    if (grip.children[0]) grip.children[0].dispose();
                    controller.remove( grip );
                }
                const index = this.controllers.findIndex( (obj) => obj.controller == controller );
                if (index>=0){
                    this.controllers[index] = null;
                }
            } );

            this.dolly.add( controller );

            const grip = this.renderer.xr.getControllerGrip( i );
            grip.add( this.buildGrip( ) );
            controller.add( grip );

            this.controllers.push({controller, grip});
        }
        
        this.dolly.position.z = 5;
        this.dolly.add( this.camera );
        this.scene.add( this.dolly );
        
        this.dummyCam = new THREE.Object3D();
        this.camera.add( this.dummyCam );

    }
    
    buildGrip(){
        const geometry = new THREE.CylinderGeometry(0.02, 0.015, 0.12, 16, 1);
        geometry.rotateX( -Math.PI/2 );
        const material = new THREE.MeshStandardMaterial( { color: 0xdddddd, roughness: 1 } );
        return new THREE.Mesh(geometry, material);
    }

    buildController( data ) {
        let geometry, material;
        
        switch ( data.targetRayMode ) {
            
            case 'tracked-pointer':

                geometry = new THREE.BufferGeometry();
                geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( [ 0, 0, 0, 0, 0, - 1 ], 3 ) );
                geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( [ 0.5, 0.5, 0.5, 0, 0, 0 ], 3 ) );

                material = new THREE.LineBasicMaterial( { vertexColors: true, blending: THREE.AdditiveBlending } );

                return new THREE.Line( geometry, material );

            case 'gaze':

                geometry = new THREE.RingBufferGeometry( 0.02, 0.04, 32 ).translate( 0, 0, - 1 );
                material = new THREE.MeshBasicMaterial( { opacity: 0.5, transparent: true } );
                return new THREE.Mesh( geometry, material );

        }

    }
    
    handleController( controller, dt ){
        if (controller.userData.selectPressed || controller.userData.squeezePressed){
            
            const wallLimit = 1.3;
            const speed = 2;
            let pos = this.dolly.position.clone();
            pos.y += 1;

            let dir = new THREE.Vector3();
            //Store original dolly rotation
            const quaternion = this.dolly.quaternion.clone();
            //Get rotation for movement from the headset pose
            this.dolly.quaternion.copy( this.dummyCam.getWorldQuaternion( this.workingQuat ) );
            this.dolly.getWorldDirection(dir);
            dir.negate();
            this.raycaster.set(pos, dir);

            let blocked = false;

            let intersect = this.raycaster.intersectObjects(this.colliders);
            if (intersect.length>0){
                if (intersect[0].distance < wallLimit) blocked = true;
            }

            if (!blocked){
                this.dolly.translateZ(-dt*speed);
                pos = this.dolly.getWorldPosition( this.origin );
            }

            //cast left
            dir.set(-1,0,0);
            dir.applyMatrix4(this.dolly.matrix);
            dir.normalize();
            this.raycaster.set(pos, dir);

            intersect = this.raycaster.intersectObjects(this.colliders);
            if (intersect.length>0){
                if (intersect[0].distance<wallLimit) this.dolly.translateX(wallLimit-intersect[0].distance);
            }

            //cast right
            dir.set(1,0,0);
            dir.applyMatrix4(this.dolly.matrix);
            dir.normalize();
            this.raycaster.set(pos, dir);

            intersect = this.raycaster.intersectObjects(this.colliders);
            if (intersect.length>0){
                if (intersect[0].distance<wallLimit) this.dolly.translateX(intersect[0].distance-wallLimit);
            }

            this.dolly.position.y = 0;

            //Restore the original rotation
            this.dolly.quaternion.copy( quaternion );
   
        }
    }
    
    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );  
    }
    
	render( ) {  
        const dt = this.clock.getDelta();
        if (this.controllers ) this.controllers.forEach( (obj) => this.handleController( obj.controller, dt ) );
        if (this.world) this.world.step(dt);
        this.renderer.render( this.scene, this.camera );
    }
}

window.app = new App();  