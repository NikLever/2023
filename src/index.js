import { SPWorld } from './SimplePhysics/SPWorld.js';
import { SPBody } from './SimplePhysics/SPBody.js';
import { SPSphereCollider, SPPlaneCollider, SPAABBCollider } from './SimplePhysics/SPCollider.js';
import { OrbitControls } from './OrbitControls.js';
import { CanvasUI } from './CanvasUI.js';
import ballSfx from "../assets/ball.wav";
import clickSfx from "../assets/click.wav";

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

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        
        this.initScene();
        this.initPhysics();
        
        window.addEventListener('resize', this.resize.bind(this) );

        document.addEventListener('keydown', (event) => {
            const name = event.key;
            const code = event.code;
            //console.log(`Key pressed ${name} \r\n Key code value: ${code}`);
            switch(event.code){
                case 'ArrowUp':
                    this.ball.position.y -= 0.1;
                    break;
                case 'ArrowDown':
                    this.ball.position.y += 0.1;
                    break;
                case 'ArrowLeft':
                    this.ball.position.x -= 0.1;
                    break;
                case 'ArrowRight':
                    this.ball.position.x += 0.1;
                    break;
                case 'KeyI':
                    this.ball.position.z -= 0.1;
                    break;
                case 'KeyO':
                    this.ball.position.z += 0.1;
                    break;
                case 'KeyS':
                    if (this.world) this.world.step(this.fixedStep);
                    break;
            }
            this.ball.mesh.position.copy(this.ball.position);
          }, false);
        
        this.state = 'initialising';
        const btn = document.getElementById('startBtn');
        btn.addEventListener('click', this.startGame.bind(this));

        this.renderer.setAnimationLoop( this.render.bind(this) );
	}	
    
    startGame(){
        this.state = 'game';

        this.ballcount = 1;
        this.interval = setInterval( () => {
            this.createBall();
            this.ballcount++;
            if (this.ballcount>50) clearInterval(this.interval);
        }, 1000);

        this.sfx.click.play();
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

		const grid = new THREE.GridHelper( 200, 40, 0x000000, 0x000000 );
		grid.material.opacity = 0.2;
		grid.material.transparent = true;
		this.scene.add( grid );

        this.createDot();

        const listener = new THREE.AudioListener();
        this.camera.add( listener );

        this.sfx = {};
        this.sfx.click = this.loadSound(clickSfx, listener);
        this.sfx.ball = this.loadSound(ballSfx, listener, 0.1);

        this.createUI();
    } 

    createUI(){
        //clipPath created using https://yqnn.github.io/svg-path-editor/
        const config = {
            body: { clipPath: "M 258.3888 5.4432 C 126.9744 5.4432 20.4432 81.8424 20.4432 164.4624 C 20.4432 229.1976 86.3448 284.2128 178.1016 304.8192 C 183.5448 357.696 173.2416 444.204 146.8032 476.6688 C 186.6552 431.9568 229.2288 356.5296 244.7808 313.3728 C 249.252 313.3728 253.9176 313.7616 258.3888 313.7616 C 389.8032 313.7616 496.14 246.888 496.14 164.4624 S 389.8032 5.4432 258.3888 5.4432 Z", backgroundColor: "#ddd", fontColor: "#000", fontFamily: "Gochi Hand" },
            speech: { type: "text", position: { left: 50, top: 80 }, fontSize: 45, fontColor: "#000", width: 400, height: 250 },
            opacity: 1
        }
        const speech = "A custom shaped panel. How about that?";
        const content = {
            speech
        }
        const ui = new CanvasUI( content, config );
        ui.mesh.position.set( 0, 1.5, 2 );
        this.scene.add( this.camera );
        this.camera.attach( ui.mesh );
        
        this.ui = ui;
    }
    
    loadSound( snd, listener, vol=0.5, loop=false ){
        // create a global audio source
        const sound = new THREE.Audio( listener );

        // load a sound and set it as the Audio object's buffer
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load( snd, ( buffer ) => {  
            sound.setBuffer( buffer );
            sound.setLoop(loop);
            sound.setVolume(vol);
        });

        return sound;
    }

    createDot(){
        const geometry = new THREE.SphereGeometry( 0.1 );
        const material = new THREE.MeshPhongMaterial( { color: 0x0000FF, depthTest: true });
        const dot = new THREE.Mesh( geometry, material );
        this.scene.add( dot );
        this.dot = dot;
    }

    createAABB(pos){
        const width = 3;
        const height = 1;
        const depth = 3;
        const geometry = new THREE.BoxGeometry( width, height, depth );
        const material = new THREE.MeshPhongMaterial( { color: 0x00FF00 });
        const edges = new THREE.EdgesGeometry( geometry );
        const lines = new THREE.LineSegments( edges, new THREE.LineBasicMaterial( { color: 0x000000, linewidth: 2 } ) );

        const box = new THREE.Mesh( geometry, material );
        box.position.set( 0, height/2, 0 ).add(pos);
        lines.position.copy( box.position );
        this.scene.add( box );
        this.scene.add( lines );

        const body = new SPBody( box, new SPAABBCollider(new THREE.Vector3(-width/2, -height/2, -depth/2), 
                                        new THREE.Vector3(width/2, height/2, depth/2) )); 
        this.world.addBody( body );
        return body;
    }

    createBall(){
        const geometry = new THREE.SphereGeometry( 0.5, 20, 12 );
        const material = new THREE.MeshPhongMaterial( { color: 0xFF0000 });
        const ball = new THREE.Mesh( geometry, material );
        ball.position.set( this.random(-2, 2), 4, this.random(-2, 2) );
        this.scene.add( ball );
        const body = new SPBody( ball, new SPSphereCollider(0.5), 1 ); 
        this.world.addBody( body );
        return body;
    }

    initPhysics(){
        this.world = new SPWorld();
        const pos = new THREE.Vector3();
        this.aabb = this.createAABB(pos);
        for(let x=-5; x<=5; x+=5){
            for(let z=-5; z<=5; z+=5){
                if (x==0 && z==0) continue;
                pos.set(x, 0, z);
                this.createAABB(pos);
            }
        }
        this.ball = this.createBall();
        this.ball.sfx = this.sfx.ball;
        this.fixedStep = 1/60;
    }

    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize( window.innerWidth, window.innerHeight );  
    }
    
    positionDot(){
        const pt = this.aabb.collider.closestPoint( this.ball.position, this.aabb.position );
        if (pt){
            this.dot.position.copy(pt);
            this.dot.visible = true;
        }else{
            this.dot.visible = false;
        }
        const normal = pt.clone().sub(this.ball.position);
        if (normal.length()<this.ball.collider.radius){
            normal.normalize().negate().multiplyScalar(this.ball.collider.radius);
            this.ball.position = pt.clone().add(normal);
        }
    }

	render( ) {  
        const dt = this.clock.getDelta();
        if (this.world && this.state=='game') this.world.step(this.fixedStep);
        if (this.dot) this.positionDot();
        this.renderer.render( this.scene, this.camera );
    }
}

window.app = new App();  