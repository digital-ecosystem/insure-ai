import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass';

const SimpleVisualizer = ({ AudioFreq, width = 400, height = 400 }) => {
  const mountRef = useRef(null);
  const freqRef = useRef(0.0);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const meshRef = useRef(null);
  const cameraRef = useRef(null);
  const animationFrameRef = useRef(null);
  const composerRef = useRef(null);
  const mouseXRef = useRef(0);
  const mouseYRef = useRef(0);

  useEffect(() => {
    freqRef.current = AudioFreq;
  }, [AudioFreq]);

  useEffect(() => {
    // Store the current mount element to avoid ref issues in cleanup
    const currentMount = mountRef.current;
    
    // Create renderer with transparent background
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true, // Enable transparency
      premultipliedAlpha: false
    });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0); // Completely transparent background
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;
    
    if (currentMount) {
      currentMount.appendChild(renderer.domElement);
    }

    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      45,
      width / height,
      0.9,
      1000
    );
    camera.position.set(0, -2, 14);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Bloom parameters
    const params = {
      threshold: 0.24,
      strength: 0.75,
      radius: 0.22,
    };

    // Post-processing setup with transparent background
    const renderScene = new RenderPass(scene, camera);
    renderScene.clear = true;
    renderScene.clearColor = new THREE.Color(0x000000);
    renderScene.clearAlpha = 0;
    
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height));
    bloomPass.threshold = params.threshold;
    bloomPass.strength = params.strength;
    bloomPass.radius = params.radius;

    const bloomComposer = new EffectComposer(renderer);
    bloomComposer.addPass(renderScene);
    bloomComposer.addPass(bloomPass);

    const outputPass = new OutputPass();
    bloomComposer.addPass(outputPass);
    composerRef.current = bloomComposer;

    // Force the composer to use transparent rendering
    bloomComposer.renderTarget1.texture.format = THREE.RGBAFormat;
    bloomComposer.renderTarget2.texture.format = THREE.RGBAFormat;

    // Shader uniforms
    const uniforms = {
      u_time: { value: 0.0 },
      u_frequency: { value: 0.0 },

      u_red: { value: 0.2 },
      u_green: { value: 0.3 },
      u_blue: { value: 0.2 },

      u_red2: { value: 0.0 },
      u_green2: { value: 0.5 },
      u_blue2: { value: 0.9 },

      y_len: { value: 1.0 },
    };

    // Original complex vertex shader with Perlin noise
    const vertexShader = `
      uniform float u_time;

      vec3 mod289(vec3 x)
      {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
      }

      vec4 mod289(vec4 x)
      {
        return x - floor(x * (1.0 / 289.0)) * 289.0;
      }

      vec4 permute(vec4 x)
      {
        return mod289(((x*34.0)+10.0)*x);
      }

      vec4 taylorInvSqrt(vec4 r)
      {
        return 1.79284291400159 - 0.85373472095314 * r;
      }

      vec3 fade(vec3 t) {
        return t*t*t*(t*(t*6.0-15.0)+10.0);
      }

      float pnoise(vec3 P, vec3 rep)
      {
        vec3 Pi0 = mod(floor(P), rep);
        vec3 Pi1 = mod(Pi0 + vec3(1.0), rep);
        Pi0 = mod289(Pi0);
        Pi1 = mod289(Pi1);
        vec3 Pf0 = fract(P);
        vec3 Pf1 = Pf0 - vec3(1.0);
        vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
        vec4 iy = vec4(Pi0.yy, Pi1.yy);
        vec4 iz0 = Pi0.zzzz;
        vec4 iz1 = Pi1.zzzz;

        vec4 ixy = permute(permute(ix) + iy);
        vec4 ixy0 = permute(ixy + iz0);
        vec4 ixy1 = permute(ixy + iz1);

        vec4 gx0 = ixy0 * (1.0 / 7.0);
        vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
        gx0 = fract(gx0);
        vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
        vec4 sz0 = step(gz0, vec4(0.0));
        gx0 -= sz0 * (step(0.0, gx0) - 0.5);
        gy0 -= sz0 * (step(0.0, gy0) - 0.5);

        vec4 gx1 = ixy1 * (1.0 / 7.0);
        vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
        gx1 = fract(gx1);
        vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
        vec4 sz1 = step(gz1, vec4(0.0));
        gx1 -= sz1 * (step(0.0, gx1) - 0.5);
        gy1 -= sz1 * (step(0.0, gy1) - 0.5);

        vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
        vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
        vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
        vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
        vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
        vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
        vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
        vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

        vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
        g000 *= norm0.x;
        g010 *= norm0.y;
        g100 *= norm0.z;
        g110 *= norm0.w;
        vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
        g001 *= norm1.x;
        g011 *= norm1.y;
        g101 *= norm1.z;
        g111 *= norm1.w;

        float n000 = dot(g000, Pf0);
        float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
        float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
        float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
        float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
        float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
        float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
        float n111 = dot(g111, Pf1);

        vec3 fade_xyz = fade(Pf0);
        vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
        vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
        float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
        return 2.2 * n_xyz;
      }

      uniform float u_frequency;

      void main() {
          float noise = 3.0 * pnoise(position + u_time, vec3(10.0));
          float displacement = u_frequency * noise;
          vec3 newPosition = position + normal * displacement;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
      }
    `;

    // Enhanced fragment shader with built-in glow
    const fragmentShader = `
      uniform float u_red;
      uniform float u_blue;
      uniform float u_green;
      uniform float u_red2;
      uniform float u_blue2;
      uniform float u_green2;
      uniform float y_len;
      uniform float u_frequency;
      float y_rel;
      void main() {
          y_rel = max(0.0,min(1.0, (gl_FragCoord.y) / y_len *1.8 - 0.3 ));
          vec3 c1 = vec3(u_red, u_green , u_blue);
          vec3 c2 = vec3(u_red2, u_green2 , u_blue2);
          vec3 c3 = mix(c1,c2, y_rel);
          
          // Add frequency-based brightness boost for glow effect
          float brightness = 1.0 + (u_frequency * 2.0);
          c3 *= brightness;
          
          gl_FragColor = vec4(c3 , 0.8 );
      }
    `;

    // Create material with enhanced glow effect
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      wireframe: true,
      transparent: true,
      blending: THREE.AdditiveBlending, // This creates a glow-like effect
      depthWrite: false
    });

    // Create geometry (same as original)
    const geometry = new THREE.IcosahedronGeometry(4, 15);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    meshRef.current = mesh;

    // Mouse interaction (scaled to container size)
    const handleMouseMove = (e) => {
      const rect = currentMount.getBoundingClientRect();
      const windowHalfX = width / 2;
      const windowHalfY = height / 2;
      const mouseX = ((e.clientX - rect.left) - windowHalfX) / 100;
      const mouseY = ((e.clientY - rect.top) - windowHalfY) / 100;
      mouseXRef.current = mouseX;
      mouseYRef.current = mouseY;
    };

    if (currentMount) {
      currentMount.addEventListener('mousemove', handleMouseMove);
    }

    // Animation loop with regular renderer (no bloom composer)
    const clock = new THREE.Clock();
    function animate() {
      if (meshRef.current && sceneRef.current && cameraRef.current && rendererRef.current) {
        // Mouse interaction
        camera.position.x += (mouseXRef.current - camera.position.x) * 0.05;
        camera.position.y += (-mouseYRef.current - camera.position.y) * 0.5;
        camera.lookAt(scene.position);
        
        // Update uniforms
        meshRef.current.material.uniforms.u_time.value = clock.getElapsedTime();
        meshRef.current.material.uniforms.u_frequency.value = freqRef.current;
        meshRef.current.material.uniforms.y_len.value = height;
        
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    }
    animate();

    // Cleanup function
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (currentMount) {
        currentMount.removeEventListener('mousemove', handleMouseMove);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (currentMount && rendererRef.current.domElement) {
          currentMount.removeChild(rendererRef.current.domElement);
        }
      }
      if (meshRef.current) {
        if (meshRef.current.geometry) meshRef.current.geometry.dispose();
        if (meshRef.current.material) meshRef.current.material.dispose();
      }
    };
  }, [width, height]);

  return (
    <div 
      ref={mountRef} 
      style={{ 
        width: `${width}px`, 
        height: `${height}px`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    />
  );
};

export default SimpleVisualizer;
