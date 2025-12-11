library(shiny)
library(base64enc)
library(ggplot2)
library(ggiraph)
library(dplyr)
library(readr)
library(gt)

ui <- fluidPage(
  tags$head(
    tags$script(src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"),
    tags$script(src = "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"),
    tags$script(src = "https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"),
    tags$style(HTML("
      /* UI Transitions */
      #electrode_data_panel { transition: transform 0.3s ease-in-out; }
      .panel-visible { transform: translateX(0); }
      .panel-hidden { transform: translateX(-100%); }
      
      /* Title Bar */
      #main_title_bar { position: relative; z-index: 2100; text-align: center; transition: margin-left 0.3s; color: #333; }
      body.panel-open #main_title_bar { margin-left: 600px; text-align: left; }
      
      /* Dark Mode Tweaks for Canvas Container to match MRIcron */
      #canvas-container { 
        background-color: #000 !important; 
        border: 1px solid #444;
      }
    "))
  ),
  
  # Header
  div(id = "main_title_bar", h2("Interactive 3D Brain - MRIcron Style")),
  
  # Hidden Data Panel (Slide-out)
  absolutePanel(
    id = "electrode_data_panel", class = "panel-hidden",
    top = 0, bottom = 0, left = 0, width = 600,
    style = "background-color: white; z-index: 2000; padding: 20px; border-right: 1px solid #ddd; box-shadow: 2px 0 10px rgba(0,0,0,0.1); overflow-y: auto;",
    div(style = "display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;",
        h3(textOutput("panel_title"), style = "margin:0;"),
        actionButton("close_panel", "✕", class = "btn-sm btn-default")
    ),
    uiOutput("data_content")
  ),
  
  sidebarLayout(
    sidebarPanel(
      tabsetPanel(
        # --- TAB 1: ORIGINAL ANALYSIS CONTROLS ---
        tabPanel("Analysis",
                 br(),
                 h4("Study Controls"),
                 
                 # Modality
                 wellPanel(style = "background: #f0f8ff;",
                           h5(strong("Recording Modality")),
                           selectInput("modality", NULL, choices = c("EEG" = "EEG", "fNIRS" = "fNIRS"), selected = "EEG")
                 ),
                 
                 # Data Type
                 wellPanel(style = "background: #f9f9f9;",
                           h5(strong("Data Type")),
                           selectInput("data_type", NULL, 
                                       choices = c("ERP (Event-Related Potential)" = "ERP", 
                                                   "PSD (Power Spectral Density)" = "PSD", 
                                                   "Motor Imagery" = "MI"), selected = "ERP")
                 ),
                 
                 checkboxInput("plot_together", "Plot selected sensors on one graph", value = FALSE),
                 fileInput("sync_file", "Upload synchrony CSV (optional):", accept = c(".csv")),
                 
                 # Two Brain Mode
                 checkboxInput("two_brain_mode", "Two-brain mode", value = FALSE),
                 conditionalPanel(
                   condition = "input.two_brain_mode == true",
                   wellPanel(style = "background:#f5f5f5;",
                             h5(strong("Conditions")),
                             selectInput("left_condition", "Left Brain", choices = NULL),
                             selectInput("right_condition", "Right Brain", choices = NULL))
                 ),
                 
                 # PSD Specific
                 conditionalPanel(
                   condition = "input.data_type == 'PSD'",
                   wellPanel(style = "background: #fff8dc;",
                             h5(strong("Frequency Bands")),
                             checkboxGroupInput("freq_bands", NULL, 
                                                choices = c("All"="all", "Delta"="delta", "Theta"="theta", "Alpha"="alpha", "Beta"="beta", "Gamma"="gamma"), 
                                                selected = "all"))
                 ),
                 
                 # MI Specific
                 conditionalPanel(
                   condition = "input.data_type == 'MI'",
                   wellPanel(style = "background: #e8f4f8;",
                             selectInput("mi_task", "MI Task", choices = c("Real"="real", "Imagined"="imagined", "Difference"="diff"), selected = "real"))
                 )
        ),
        
        # --- TAB 2: NEW MRICRON TOOLS ---
        tabPanel("MRIcron Tools",
                 br(),
                 h4("Visualization Controls"),
                 p("Adjust slicing and transparency to inspect anatomy."),
                 
                 # Transparency
                 wellPanel(style = "background: #e6e6fa;",
                           h5(strong("X-Ray Mode (Opacity)")),
                           sliderInput("brain_opacity", NULL, min = 0, max = 1, value = 1.0, step = 0.1)
                 ),
                 
                 # Clipping Planes
                 wellPanel(style = "background: #2c3e50; color: white;",
                           h5(strong("Orthogonal Slicing")),
                           sliderInput("clip_x", "Sagittal (X)", min = -100, max = 100, value = 100, step = 1),
                           sliderInput("clip_y", "Coronal (Y)",  min = -100, max = 100, value = 100, step = 1),
                           sliderInput("clip_z", "Axial (Z)",    min = -100, max = 100, value = 100, step = 1),
                           actionButton("reset_clip", "Reset Slices", class = "btn-xs btn-warning")
                 ),
                 
                 # Crosshairs
                 wellPanel(
                   h5(strong("Stereotaxic")),
                   checkboxInput("show_crosshair", "Show Crosshairs on Click", value = TRUE),
                   h6("Coordinates:"),
                   verbatimTextOutput("cursor_coords")
                 )
        )
      ),
      
      hr(),
      fileInput("brain_file", "Upload .glb/.gltf Model (Optional)"),
      actionButton("reset_view", "Reset Camera", class = "btn-primary")
    ),
    
    mainPanel(
      # Canvas Container (Black Background)
      tags$div(
        id = "canvas-container",
        style = "width: 100%; height: 600px; background-color: #000; border: 1px solid #333; position: relative;",
        tags$canvas(id = "brain-canvas"),
        tags$div(id = "loading-message", 
                 style = "position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; display: none;", 
                 h4("Loading model..."))
      ),
      uiOutput("legend_output")
    )
  ),
  
  # --- JAVASCRIPT ---
  tags$script(HTML("
    var scene, camera, renderer, controls, animationId;
    var brain, brainRight; 
    var leftGroup, rightGroup; 
    
    // --- MRIcron Features ---
    var clipPlanes = [
      new THREE.Plane(new THREE.Vector3(1, 0, 0), 1000), // X Plane
      new THREE.Plane(new THREE.Vector3(0, 1, 0), 1000), // Y Plane
      new THREE.Plane(new THREE.Vector3(0, 0, 1), 1000)  // Z Plane
    ];
    var crosshairGroup;
    var showCrosshair = true;

    // --- Standard Interactions ---
    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();
    var mouseDownPos = new THREE.Vector2();
    var isDragging = false;
    var previousMousePosition = { x: 0, y: 0 };
    
    // --- Data Objects ---
    var eegSpheres = [];
    var eegLabels  = [];
    var eegSpheresRight = [];
    var eegLabelsRight  = [];
    var brodmannMeshes = [];
    var brainCenter = new THREE.Vector3(0, 0, 0);
    var brainBBox = null;
    var brainLoaded = false;

    // --- State ---
    var currentDataType = 'ERP';
    var currentTask = 'real';
    var currentModality = 'EEG';
    var electrodePValues = {};
    var electrodePowerValues = {};
    var twoBrainMode = false;
    var brainSeparation = 7.0;

    // Electrode Coordinates (10-20 System approximation)
    const electrodes_32 = [
      {label:'Fp1',x:-27,y:83,z:-3}, {label:'Fpz',x:0,y:87,z:-3}, {label:'Fp2',x:27,y:83,z:-3},
      {label:'F7',x:-71,y:51,z:-3},  {label:'F3',x:-52,y:52,z:47}, {label:'Fz',x:0,y:63,z:61}, {label:'F4',x:52,y:52,z:47}, {label:'F8',x:71,y:51,z:-3},
      {label:'FC5',x:-78,y:25,z:31}, {label:'FC1',x:-25,y:43,z:72}, {label:'FC2',x:25,y:43,z:72}, {label:'FC6',x:78,y:25,z:31},
      {label:'T7',x:-87,y:0,z:-3},   {label:'C3',x:-63,y:0,z:61},  {label:'Cz',x:0,y:0,z:88},  {label:'C4',x:63,y:0,z:61},  {label:'T8',x:87,y:0,z:-3},
      {label:'CP5',x:-78,y:-25,z:31},{label:'CP1',x:-24,y:-24,z:81},{label:'CP2',x:24,y:-24,z:81},{label:'CP6',x:78,y:-25,z:31},
      {label:'P7',x:-71,y:-51,z:-3}, {label:'P3',x:-52,y:-52,z:47}, {label:'Pz',x:0,y:-63,z:61}, {label:'P4',x:52,y:-52,z:47}, {label:'P8',x:71,y:-51,z:-3},
      {label:'POz',x:0,y:-82,z:31},  {label:'O1',x:-27,y:-83,z:-3}, {label:'Oz',x:0,y:-87,z:-3}, {label:'O2',x:27,y:-83,z:-3},
      {label:'AFz',x:0,y:82,z:31},   {label:'FCz',x:0,y:34,z:81}
    ];

    // --- INITIALIZATION ---
    function initScene() {
      var container = document.getElementById('canvas-container');
      var canvas = document.getElementById('brain-canvas');
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000); // Black background
      
      leftGroup = new THREE.Group();
      rightGroup = new THREE.Group();
      scene.add(leftGroup);
      scene.add(rightGroup);

      createCrosshairs();

      camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
      camera.position.set(0, -20, 10);
      camera.up.set(0, 0, 1);
      
      // Render with Clipping Enabled
      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.localClippingEnabled = true; 
      renderer.outputEncoding = THREE.sRGBEncoding;

      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;

      // Lights
      var hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7);
      hemiLight.position.set(0, 0, 5);
      scene.add(hemiLight);
      
      var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
      dirLight.position.set(5, -5, 5);
      scene.add(dirLight);
      
      var backLight = new THREE.DirectionalLight(0xffffff, 0.5);
      backLight.position.set(-5, 5, -5);
      scene.add(backLight);

      // Events
      canvas.addEventListener('pointerdown', onPointerDown, false);
      canvas.addEventListener('pointerup', onPointerUp, false);
      canvas.addEventListener('pointerleave', onPointerUp, false);
      canvas.addEventListener('pointermove', onPointerMove, false);
      canvas.addEventListener('click', onMouseClick, false);
      window.addEventListener('resize', onWindowResize, false);

      animate();
    }

    // --- CROSSHAIR LOGIC ---
    function createCrosshairs() {
       crosshairGroup = new THREE.Group();
       // RGB Axes
       var geoX = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-100,0,0), new THREE.Vector3(100,0,0)]);
       var geoY = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,-100,0), new THREE.Vector3(0,100,0)]);
       var geoZ = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,-100), new THREE.Vector3(0,0,100)]);
       
       crosshairGroup.add(new THREE.Line(geoX, new THREE.LineBasicMaterial({ color: 0xff0000 }))); // X = Red
       crosshairGroup.add(new THREE.Line(geoY, new THREE.LineBasicMaterial({ color: 0x00ff00 }))); // Y = Green
       crosshairGroup.add(new THREE.Line(geoZ, new THREE.LineBasicMaterial({ color: 0x0000ff }))); // Z = Blue
       
       crosshairGroup.visible = false;
       scene.add(crosshairGroup);
    }

    function moveCrosshairs(pos) {
       if(!showCrosshair) return;
       crosshairGroup.position.copy(pos);
       crosshairGroup.visible = true;
    }

    // --- MOUSE HANDLERS ---
    function onPointerDown(event) {
      mouseDownPos.x = event.clientX;
      mouseDownPos.y = event.clientY;
      if(twoBrainMode && event.button === 0) {
          isDragging = true;
          previousMousePosition = { x: event.clientX, y: event.clientY };
      }
    }
    
    function onPointerUp(event) { isDragging = false; }
    
    function onPointerMove(event) {
      // Cursor Hover Logic
      var allSpheres = eegSpheres.concat(eegSpheresRight);
      if (allSpheres.length) {
          var rect = renderer.domElement.getBoundingClientRect();
          mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
          raycaster.setFromCamera(mouse, camera);
          var intersects = raycaster.intersectObjects(allSpheres);
          document.body.style.cursor = (intersects.length > 0) ? 'pointer' : 'default';
      }

      // 2-Brain Rotation Logic
      if (twoBrainMode && isDragging) {
        var deltaMove = { x: event.clientX - previousMousePosition.x, y: event.clientY - previousMousePosition.y };
        var rotateSpeed = 0.012;
        leftGroup.rotation.z -= deltaMove.x * rotateSpeed;
        leftGroup.rotation.x -= deltaMove.y * rotateSpeed;
        rightGroup.rotation.z -= deltaMove.x * rotateSpeed;
        rightGroup.rotation.x -= deltaMove.y * rotateSpeed;
        previousMousePosition = { x: event.clientX, y: event.clientY };
      }
    }

    function onMouseClick(event) {
      var dx = event.clientX - mouseDownPos.x;
      var dy = event.clientY - mouseDownPos.y;
      if (Math.sqrt(dx*dx + dy*dy) > 5) return; 

      var rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      // 1. Check Electrodes
      var allSpheres = eegSpheres.concat(eegSpheresRight);
      var intersectsElec = raycaster.intersectObjects(allSpheres);
      if (intersectsElec.length > 0) {
        var obj = intersectsElec[0].object;
        if (obj.userData && obj.userData.label) {
          var label = obj.userData.label;
          obj.material.emissive.setHex(0xffffff);
          setTimeout(function() { obj.material.emissive.setHex(0x000000); }, 200);
          if (typeof Shiny !== 'undefined') {
            Shiny.setInputValue('clicked_electrode', label, {priority: 'event'});
          }
        }
        return; 
      }
      
      // 2. Check Brain (for Crosshairs)
      if (brain && showCrosshair) {
          var intersectsBrain = raycaster.intersectObjects(scene.children, true);
          for(var i=0; i<intersectsBrain.length; i++) {
              if (intersectsBrain[i].object !== crosshairGroup && !intersectsBrain[i].object.userData.label) {
                  var p = intersectsBrain[i].point;
                  moveCrosshairs(p);
                  if(typeof Shiny !== 'undefined') {
                    Shiny.setInputValue('cursor_pos', {x: p.x, y: p.y, z: p.z}, {priority: 'event'});
                  }
                  break;
              }
          }
      }
    }

    // --- MODEL LOADING & MATERIAL ---
    function loadModel(fileDataUrl) {
      document.getElementById('loading-message').style.display = 'block';
      if (brain) { leftGroup.remove(brain); brain = null; }
      if (brainRight) { rightGroup.remove(brainRight); brainRight = null; }
      brainLoaded = false;
      clearEEGElectrodes();
      clearBrodmann();

      var loader = new THREE.GLTFLoader();
      loader.load(fileDataUrl, function(gltf) {
          brain = gltf.scene;
          brain.traverse(function(child) {
            if (child.isMesh) {
              if (child.geometry && child.geometry.computeVertexNormals) {
                child.geometry.computeVertexNormals();
              }
              // MATERIAL SETUP: CLIPPING & TRANSPARENCY
              child.material = new THREE.MeshStandardMaterial({
                color: 0xeeeeee, 
                metalness: 0.1, 
                roughness: 0.5, 
                side: THREE.DoubleSide,
                clippingPlanes: clipPlanes, // Attached here
                clipShadows: true,
                transparent: true,
                opacity: 1.0
              });
            }
          });

          // Center and Scale
          var box = new THREE.Box3().setFromObject(brain);
          var size = box.getSize(new THREE.Vector3());
          var maxDim = Math.max(size.x, size.y, size.z);
          var scale = 4.0 / maxDim; 
          
          var center = box.getCenter(new THREE.Vector3());
          brain.scale.multiplyScalar(scale);
          brain.position.sub(center.multiplyScalar(scale));
          brain.rotation.z = Math.PI; 
          
          brain.updateMatrixWorld();
          brainBBox = new THREE.Box3().setFromObject(brain);
          brainCenter = brainBBox.getCenter(new THREE.Vector3());
          brainLoaded = true;
          
          leftGroup.add(brain);
          document.getElementById('loading-message').style.display = 'none';
          
          arrangeBrains(); // Restore mode
          
      }, undefined, function(e) { console.error(e); });
    }

    // --- DYNAMIC UPDATES ---
    function updateMaterialProperties(opacity) {
        var update = function(obj) {
            obj.traverse(function(child) {
                if(child.isMesh) {
                    child.material.opacity = opacity;
                    child.material.transparent = (opacity < 1.0);
                    child.material.needsUpdate = true;
                }
            });
        };
        if(brain) update(brain);
        if(brainRight) update(brainRight);
    }

    function updateClippingPlanes(settings) {
        var scale = 0.05; 
        clipPlanes[0].constant = settings.x * scale;
        clipPlanes[1].constant = settings.y * scale;
        clipPlanes[2].constant = settings.z * scale;
    }

    // --- ELECTRODE LOGIC (Original features maintained) ---
    
    function asaToSurfacePosition(asaX, asaY, asaZ) {
      if (!brainBBox) return new THREE.Vector3(0, 0, 0);
      var asaVec = new THREE.Vector3(asaX, asaY, asaZ).normalize();
      var dir = new THREE.Vector3(asaVec.y, asaVec.x, asaVec.z).normalize();
      var size = brainBBox.getSize(new THREE.Vector3());
      var surfacePos = new THREE.Vector3(
        dir.x * size.x / 2 * 1.1,
        dir.y * size.y / 2 * 1.1,
        dir.z * size.z / 2 * 1.1
      );
      return surfacePos.add(brainCenter);
    }
    
    function makeTextSprite(message) {
      var canvas = document.createElement('canvas');
      canvas.width = 512; canvas.height = 512;
      var ctx = canvas.getContext('2d');
      ctx.font = 'bold 200px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 12;
      ctx.strokeText(message, 256, 256);
      ctx.fillStyle = 'white'; ctx.fillText(message, 256, 256);
      var mat = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, depthTest: false });
      var s = new THREE.Sprite(mat); s.scale.set(0.35,0.35,1);
      return s;
    }

    function clearEEGElectrodes() {
       eegSpheres.forEach(s => leftGroup.remove(s));
       eegLabels.forEach(l => leftGroup.remove(l));
       eegSpheresRight.forEach(s => rightGroup.remove(s));
       eegLabelsRight.forEach(l => rightGroup.remove(l));
       eegSpheres = []; eegLabels = []; eegSpheresRight = []; eegLabelsRight = [];
    }
    
    function clearBrodmann() {
       brodmannMeshes.forEach(m => leftGroup.remove(m));
       brodmannMeshes = [];
    }

    function createEEGElectrodes(config) {
      clearEEGElectrodes();
      if (!brainLoaded) return;
      var list = electrodes_32;
      var sensorSize = 0.15;
      
      list.forEach(function(elec) {
        var pos = asaToSurfacePosition(elec.x, elec.y, elec.z);
        leftGroup.worldToLocal(pos); // Align to group

        var mat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.2, roughness: 0.2 });
        if(currentModality !== 'EEG') mat.color.setHex(0xcc0000); // fNIRS red

        var sphere = new THREE.Mesh(new THREE.SphereGeometry(sensorSize, 32, 32), mat);
        sphere.position.copy(pos);
        sphere.userData = { label: elec.label, brainSide: 'left' };
        eegSpheres.push(sphere);
        leftGroup.add(sphere);

        var lbl = makeTextSprite(elec.label);
        lbl.position.copy(pos);
        eegLabels.push(lbl);
        leftGroup.add(lbl);
      });

      if (twoBrainMode) duplicateRightElectrodes();
      updateVisuals();
    }

    function duplicateRightElectrodes() {
      // Cleanup right
      eegSpheresRight.forEach(s => rightGroup.remove(s));
      eegLabelsRight.forEach(l => rightGroup.remove(l));
      eegSpheresRight = []; eegLabelsRight = [];

      eegSpheres.forEach(function(orig) {
         var clone = orig.clone();
         clone.position.copy(orig.position);
         clone.material = orig.material.clone();
         clone.userData = { label: orig.userData.label, brainSide: 'right' };
         eegSpheresRight.push(clone);
         rightGroup.add(clone);
      });
      eegLabels.forEach(function(orig) {
         var clone = orig.clone();
         clone.position.copy(orig.position);
         eegLabelsRight.push(clone);
         rightGroup.add(clone);
      });
      updateVisuals();
    }

    function arrangeBrains() {
       if(!brainLoaded) return;
       if(!twoBrainMode) {
          if(brainRight) { rightGroup.remove(brainRight); brainRight = null; }
          controls.enableRotate = true;
          leftGroup.position.set(0,0,0); leftGroup.scale.set(1,1,1); leftGroup.rotation.set(0,0,0);
          createEEGElectrodes();
          camera.position.set(0,-6,0);
       } else {
          controls.enableRotate = false;
          leftGroup.position.set(-brainSeparation/2,0,0); leftGroup.scale.set(1.4,1.4,1.4); leftGroup.rotation.set(0,0,0);
          rightGroup.position.set(brainSeparation/2,0,0); rightGroup.scale.set(1.4,1.4,1.4); rightGroup.rotation.set(0,0,0);
          if(!brainRight && brain) {
             brainRight = brain.clone();
             rightGroup.add(brainRight);
          }
          createEEGElectrodes();
          camera.position.set(0,-12,5);
       }
       controls.target.set(0,0,0);
       controls.update();
    }

    // --- VISUAL UPDATES (COLOR LOGIC) ---
    function getGradientColor(t) {
       t = Math.max(0, Math.min(1,t));
       var r,g,b;
       if(t<0.5) { var nt=t*2; r=Math.floor(0x44+(0x21-0x44)*nt); g=Math.floor(0x01+(0x91-0x01)*nt); b=Math.floor(0x54+(0x8c-0x54)*nt); }
       else { var nt=(t-0.5)*2; r=Math.floor(0x21+(0xfd-0x21)*nt); g=Math.floor(0x91+(0xe7-0x91)*nt); b=Math.floor(0x8c+(0x25-0x8c)*nt); }
       return (r<<16)|(g<<8)|b;
    }
    
    function powerToColor(p, min, max) {
       if(max<=min) return 0x0000ff;
       var t = Math.max(0, Math.min(1, (p-min)/(max-min)));
       var r=Math.floor(255*t); var b=Math.floor(255*(1-t));
       return (r<<16)|b;
    }

    function updateVisuals() {
       var all = eegSpheres.concat(eegSpheresRight);
       if(!all.length) return;
       
       var minP = Infinity, maxP = -Infinity;
       if(currentDataType === 'PSD') {
          for(var k in electrodePowerValues) {
             var v = electrodePowerValues[k];
             if(v<minP) minP=v; if(v>maxP) maxP=v;
          }
       }

       all.forEach(function(s) {
          var lbl = s.userData.label;
          var side = s.userData.brainSide;
          s.material.emissive.setHex(0x000000);
          s.material.opacity = 1.0; 
          s.material.transparent = false; 

          // 1. Two Brain Mean Amplitude Logic
          if(twoBrainMode && currentDataType === 'ERP' && electrodePValues.mode === '2brain_means') {
             var val = (side === 'left') ? (electrodePValues.left ? electrodePValues.left[lbl] : undefined) 
                                         : (electrodePValues.right ? electrodePValues.right[lbl] : undefined);
             if(val !== undefined) {
                // Fixed scale -5 to 10
                var t = (val - (-5)) / (10 - (-5));
                s.material.color.setHex(getGradientColor(t));
             } else { s.material.color.setHex(0xcccccc); }
             return;
          }

          // 2. Two Brain PSD Logic
          if(twoBrainMode && currentDataType === 'PSD' && electrodePowerValues.mode === '2brain_means') {
              var val = (side === 'left') ? (electrodePowerValues.left ? electrodePowerValues.left[lbl] : undefined) 
                                          : (electrodePowerValues.right ? electrodePowerValues.right[lbl] : undefined);
              if(val !== undefined && electrodePowerValues.min !== undefined) {
                 s.material.color.setHex(powerToColor(val, electrodePowerValues.min, electrodePowerValues.max));
              } else { s.material.color.setHex(0xcccccc); }
              return;
          }

          // 3. Single Brain Logic
          if(currentDataType === 'ERP') {
             var p = electrodePValues[lbl];
             if(p !== undefined && p <= 0.05) {
                var i = p/0.05;
                s.material.color.setRGB(1.0, i, i);
             } else { s.material.color.setHex(0xcccccc); }
          } else if (currentDataType === 'PSD') {
             var p = electrodePowerValues[lbl];
             if(p !== undefined && isFinite(minP)) {
                s.material.color.setHex(powerToColor(p, minP, maxP));
             } else { 
                s.material.color.setHex(0x888888); s.material.opacity = 0.5; s.material.transparent = true; 
             }
          } else if (currentDataType === 'MI') {
             var active = [];
             if(currentTask === 'real') active=['C3','CP3','FC3'];
             else if(currentTask === 'imagined') active=['C3','FCz','Cz'];
             else active=['FCz','Cz'];
             if(active.includes(lbl)) { s.material.color.setHex(0xFF4500); s.material.emissive.setHex(0x330000); }
             else { s.material.color.setHex(0x888888); s.material.opacity = 0.5; s.material.transparent = true; }
          }
       });
    }

    function updateLabelVisibility() {
       var all = eegLabels.concat(eegLabelsRight);
       if(!all.length) return;
       var camPos = camera.position.clone();
       all.forEach(function(s) {
          var wPos = new THREE.Vector3(); s.getWorldPosition(wPos);
          var cPos = new THREE.Vector3(); if(s.parent) s.parent.getWorldPosition(cPos);
          var toCam = camPos.clone().sub(cPos).normalize();
          var toLbl = wPos.clone().sub(cPos).normalize();
          s.visible = (toLbl.dot(toCam) > 0);
       });
    }

    // --- ANIMATION ---
    function animate() {
      animationId = requestAnimationFrame(animate);
      controls.update();
      updateLabelVisibility();
      renderer.render(scene, camera);
    }
    
    function onWindowResize() {
      var container = document.getElementById('canvas-container');
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }

    document.addEventListener('DOMContentLoaded', function() { initScene(); });

    // --- SHINY HANDLERS ---
    if (typeof Shiny !== 'undefined') {
      Shiny.addCustomMessageHandler('loadModel', loadModel);
      Shiny.addCustomMessageHandler('resetView', function(m) { 
         // Reset Group Rotations
         leftGroup.rotation.set(0,0,0); rightGroup.rotation.set(0,0,0);
         arrangeBrains(); // Reset camera position based on mode
      });
      Shiny.addCustomMessageHandler('setEEG', function(m) { createEEGElectrodes((m&&m.n)?m.n:'none'); });
      Shiny.addCustomMessageHandler('setBrodmannVisible', function(m) { if(m.show) createBrodmannOverlays(); else clearBrodmann(); });
      Shiny.addCustomMessageHandler('setDataType', function(m) { currentDataType=m.type; updateVisuals(); });
      Shiny.addCustomMessageHandler('setMITask', function(m) { currentTask=m.task; updateVisuals(); });
      Shiny.addCustomMessageHandler('updateElectrodeColors', function(m) { electrodePValues=m; updateVisuals(); });
      Shiny.addCustomMessageHandler('updateElectrodePower', function(m) { electrodePowerValues=m; updateVisuals(); });
      Shiny.addCustomMessageHandler('setModality', function(m) { currentModality=m.modality||'EEG'; createEEGElectrodes('32'); });
      Shiny.addCustomMessageHandler('setTwoBrainMode', function(m) { twoBrainMode=!!(m&&m.enabled); arrangeBrains(); updateVisuals(); });
      Shiny.addCustomMessageHandler('setBrainConditions', function(m) { leftCondition=(m?m.left:null); rightCondition=(m?m.right:null); });
      Shiny.addCustomMessageHandler('shiny-run-js', function(c) { eval(c); });
      
      // NEW HANDLERS
      Shiny.addCustomMessageHandler('updateOpacity', function(m) { updateMaterialProperties(m.opacity); });
      Shiny.addCustomMessageHandler('updateClipping', function(m) { updateClippingPlanes(m); });
      Shiny.addCustomMessageHandler('toggleCrosshair', function(m) { showCrosshair=m.show; if(!showCrosshair) crosshairGroup.visible=false; });
    }
  "))
)

server <- function(input, output, session) {
  
  # --- 1. NEW MRIcron Logic ---
  
  # Opacity
  observeEvent(input$brain_opacity, {
    session$sendCustomMessage("updateOpacity", list(opacity = input$brain_opacity))
  })
  
  # Clipping Planes
  observe({
    req(input$clip_x, input$clip_y, input$clip_z)
    session$sendCustomMessage("updateClipping", list(
      x = input$clip_x,
      y = input$clip_y,
      z = input$clip_z
    ))
  })
  
  # Reset Clipping
  observeEvent(input$reset_clip, {
    updateSliderInput(session, "clip_x", value = 100)
    updateSliderInput(session, "clip_y", value = 100)
    updateSliderInput(session, "clip_z", value = 100)
  })
  
  # Toggle Crosshair
  observeEvent(input$show_crosshair, {
    session$sendCustomMessage("toggleCrosshair", list(show = input$show_crosshair))
  })
  
  # Display Coordinates
  output$cursor_coords <- renderText({
    req(input$cursor_pos)
    paste0("X: ", round(input$cursor_pos$x, 2), 
           "\nY: ", round(input$cursor_pos$y, 2), 
           "\nZ: ", round(input$cursor_pos$z, 2))
  })
  
  # --- 2. EXISTING ANALYSIS LOGIC (RESTORED) ---
  
  selected_electrodes <- reactiveVal(character(0))
  
  # Data Generators
  simulated_erp_data <- reactive({
    set.seed(42)
    times <- seq(-200, 800, by = 10)
    channels_list <- c("Fp1", "Fpz", "Fp2", "F7", "F3", "Fz", "F4", "F8",
                       "FC5", "FC1", "FC2", "FC6", "T7", "C3", "Cz", "C4", "T8", 
                       "CP5", "CP1", "CP2", "CP6", "P7", "P3", "Pz", "P4", "P8", 
                       "POz", "O1", "Oz", "O2", "AFz", "FCz")
    conditions <- c("Motion", "Nonmotion")
    df_list <- list()
    count <- 1
    for (ch in channels_list) {
      for (cond in conditions) {
        noise  <- rnorm(length(times), 0, 0.5)
        signal <- 5 * exp(-((times - 350)^2) / (2 * 100^2)) - 2 * exp(-((times - 200)^2) / (2 * 40^2))
        if (cond == "Nonmotion") signal <- signal * runif(1, 0.4, 1.0)
        df_list[[count]] <- data.frame(Time_ms = times, Channel = ch, Condition = cond, GrandVoltage = signal + noise)
        count <- count + 1
      }
    }
    do.call(rbind, df_list)
  })
  
  simulated_psd_data <- reactive({
    set.seed(123)
    channels_list <- c("Fp1", "Fpz", "Fp2", "F7", "F3", "Fz", "F4", "F8",
                       "FC5", "FC1", "FC2", "FC6", "T7", "C3", "Cz", "C4", "T8", 
                       "CP5", "CP1", "CP2", "CP6", "P7", "P3", "Pz", "P4", "P8", 
                       "POz", "O1", "Oz", "O2", "AFz", "FCz")
    freqs <- seq(0.5, 50, by = 0.5)
    conditions <- c("Motion", "Nonmotion")
    df_list <- list()
    count <- 1
    for (ch in channels_list) {
      for (cond in conditions) {
        base <- rnorm(length(freqs), 10, 2)
        alpha <- 20 * exp(-((freqs - 10)^2) / (2 * 2^2))
        if (cond == "Motion") alpha <- alpha * 0.5 
        power <- base + alpha + (15 * exp(-((freqs - 6)^2) / (2 * 1.5^2)))
        df_list[[count]] <- data.frame(Frequency = freqs, Channel = ch, Power = pmax(power, 1), Condition = cond)
        count <- count + 1
      }
    }
    do.call(rbind, df_list)
  })
  
  sync_data <- reactive({
    req(input$sync_file)
    read_csv(input$sync_file$datapath, show_col_types = FALSE)
  })
  
  condition_choices <- reactive({
    if (!is.null(input$sync_file)) {
      df <- sync_data()
      if ("Condition" %in% names(df)) return(sort(unique(df$Condition)))
    }
    c("Motion", "Nonmotion")
  })
  
  observe({
    choices <- condition_choices()
    if (length(choices) > 0) {
      updateSelectInput(session, "left_condition", choices = choices, selected = choices[1])
      updateSelectInput(session, "right_condition", choices = choices, selected = ifelse(length(choices) > 1, choices[2], choices[1]))
    }
  })
  
  observeEvent(input$two_brain_mode, {
    session$sendCustomMessage("setTwoBrainMode", list(enabled = isTRUE(input$two_brain_mode)))
  })
  
  observe({
    if (isTRUE(input$two_brain_mode) && !is.null(input$left_condition) && !is.null(input$right_condition)) {
      session$sendCustomMessage("setBrainConditions", list(left = input$left_condition, right = input$right_condition))
    }
  })
  
  # --- Legends & Plots ---
  output$legend_output <- renderUI({
    if (input$data_type == "ERP") {
      if (isTRUE(input$two_brain_mode)) {
        tags$div(style = "margin-top: 10px; background: white; padding: 10px; border-radius: 8px; text-align: center;",
                 h5("Mean Amplitude (µV)"),
                 div(style = "width: 200px; height: 20px; background: linear-gradient(to right, #440154, #21918c, #fde725); border: 1px solid #ccc; margin: 0 auto;"),
                 div(style = "display: flex; justify-content: space-between; width: 200px; margin: 0 auto;", span("Low"), span("High"))
        )
      } else {
        tags$div(style = "margin-top: 10px; background: white; padding: 10px; border-radius: 8px; display: flex; gap: 15px; justify-content: center;",
                 h5("P-Value:"),
                 div(span(style="width:20px;height:20px;background:#ffffff;border:1px solid #ccc;display:inline-block;"), " > 0.05"),
                 div(span(style="width:20px;height:20px;background:#ffcccc;border:1px solid #ccc;display:inline-block;"), " < 0.05")
        )
      }
    } else NULL
  })
  
  # Update Visuals
  observe({
    req(input$data_type == "ERP")
    df_all <- simulated_erp_data()
    channels <- unique(df_all$Channel)
    
    if (isTRUE(input$two_brain_mode)) {
      req(input$left_condition, input$right_condition)
      get_means <- function(cond) {
        df_all %>% filter(Condition == cond, Time_ms >= 250, Time_ms <= 500) %>%
          group_by(Channel) %>% summarise(m = mean(GrandVoltage), .groups="drop")
      }
      m_left <- get_means(input$left_condition)
      m_right <- get_means(input$right_condition)
      
      l_list <- as.list(m_left$m); names(l_list) <- m_left$Channel
      r_list <- as.list(m_right$m); names(r_list) <- m_right$Channel
      
      session$sendCustomMessage("updateElectrodeColors", list(mode = "2brain_means", left = l_list, right = r_list))
    } else {
      p_vals <- list()
      for (ch in channels) {
        d <- df_all %>% filter(Channel == ch, Time_ms >= 250, Time_ms <= 500)
        p_vals[[ch]] <- tryCatch(t.test(GrandVoltage ~ Condition, data = d)$p.value, error = function(e) 1.0)
      }
      session$sendCustomMessage("updateElectrodeColors", p_vals)
    }
  })
  
  # Loading logic
  observeEvent(TRUE, {
    # Try to load a file from Desktop if present, else wait for upload
    desktop_dir <- normalizePath("~/Desktop", winslash = "/", mustWork = FALSE)
    glb_files <- list.files(desktop_dir, pattern = "\\.glb$", full.names = TRUE)
    
    if (length(glb_files) > 0) {
      f <- glb_files[1]
      message("Loading default: ", f)
      file_data <- readBin(f, "raw", file.info(f)$size)
      b64 <- paste0("data:model/gltf-binary;base64,", base64encode(file_data))
      session$sendCustomMessage("loadModel", b64)
      session$sendCustomMessage("setDataType", list(type = "ERP"))
    }
  }, once = TRUE)
  
  observeEvent(input$brain_file, {
    req(input$brain_file)
    f <- input$brain_file$datapath
    file_data <- readBin(f, "raw", file.info(f)$size)
    b64 <- paste0("data:model/gltf-binary;base64,", base64encode(file_data))
    session$sendCustomMessage("loadModel", b64)
  })
  
  # Interactions
  observeEvent(input$clicked_electrode, {
    cur <- selected_electrodes()
    lab <- input$clicked_electrode
    if (lab %in% cur) cur <- setdiff(cur, lab) else cur <- c(cur, lab)
    selected_electrodes(cur)
    
    if(length(cur) > 0) {
      session$sendCustomMessage("shiny-run-js", "document.getElementById('electrode_data_panel').classList.remove('panel-hidden'); document.getElementById('electrode_data_panel').classList.add('panel-visible'); document.body.classList.add('panel-open');")
    } else {
      session$sendCustomMessage("shiny-run-js", "document.getElementById('electrode_data_panel').classList.remove('panel-visible'); document.getElementById('electrode_data_panel').classList.add('panel-hidden'); document.body.classList.remove('panel-open');")
    }
  })
  
  observeEvent(input$close_panel, {
    selected_electrodes(character(0))
    session$sendCustomMessage("shiny-run-js", "document.getElementById('electrode_data_panel').classList.remove('panel-visible'); document.getElementById('electrode_data_panel').classList.add('panel-hidden'); document.body.classList.remove('panel-open');")
  })
  
  output$panel_title <- renderText({
    paste("Selected:", paste(selected_electrodes(), collapse=", "))
  })
  
  output$data_content <- renderUI({
    sels <- selected_electrodes()
    req(length(sels) > 0)
    
    if (input$data_type == "ERP") {
      if (!input$plot_together || length(sels) == 1) {
        tagList(
          lapply(sels, function(ch) {
            tagList(
              hr(), h4(paste("ERP Waveform - Channel:", ch)),
              girafeOutput(paste0("plot_erp_", ch), height = "400px"),
              p(em("Interact: Hover points to see values, drag to zoom, double-click to reset.")),
              hr(), gt_output(paste0("table_erp_", ch))
            )
          })
        )
      } else {
        tagList(
          hr(), h4("ERP Waveforms - Combined"),
          girafeOutput("plot_erp_multi", height = "400px"),
          p(em("Combined: each line is a Channel x Condition. Hover to inspect; drag to zoom; double-click to reset.")),
          lapply(sels, function(ch) {
            tagList(hr(), h4(paste("ERP Statistics - Channel:", ch)), gt_output(paste0("table_erp_", ch)))
          })
        )
      }
    } else if (input$data_type == "PSD") {
      # ... (similar logic for PSD)
      if (!input$plot_together || length(sels) == 1) {
        tagList(
          lapply(sels, function(ch) {
            tagList(
              hr(), h4(paste("Power Spectral Density - Channel:", ch)),
              girafeOutput(paste0("plot_psd_", ch), height = "400px"),
              p(em("Interact: Hover to see values, double-click to reset zoom.")),
              hr(), gt_output(paste0("table_psd_", ch))
            )
          })
        )
      } else {
        tagList(
          hr(), h4("Power Spectral Density - Combined"),
          girafeOutput("plot_psd_multi", height = "400px"),
          p(em("Combined: each line is a Channel. Hover to inspect; double-click to reset.")),
          lapply(sels, function(ch) {
            tagList(hr(), h4(paste("Band Power - Channel:", ch)), gt_output(paste0("table_psd_", ch)))
          })
        )
      }
    } else {
      tagList(lapply(sels, function(ch) { tagList(hr(), h4(paste("Motor Imagery - Channel:", ch)), textOutput(paste0("mi_text_", ch))) }))
    }
  })
  
  # --- PLOTTING LOGIC (RESTORED) ---
  observe({
    sels <- selected_electrodes()
    df_erp <- simulated_erp_data()
    df_psd <- simulated_psd_data()
    if (!length(sels)) return()
    
    # 1. Multi ERP
    output$plot_erp_multi <- renderGirafe({
      req(input$data_type == "ERP", length(sels) > 0)
      df_multi <- df_erp %>% filter(Channel %in% sels)
      req(nrow(df_multi) > 0)
      y_max <- max(abs(df_multi$GrandVoltage), na.rm=TRUE)
      p <- ggplot(df_multi, aes(x=Time_ms, y=GrandVoltage, color=Channel, linetype=Condition, group=interaction(Channel,Condition))) +
        geom_hline(yintercept=0, color="gray50") + geom_vline(xintercept=0) +
        geom_line_interactive(aes(tooltip=paste(Channel,Condition), data_id=paste(Channel,Condition)), linewidth=1.2) +
        theme_classic() + scale_y_continuous(limits=c(-y_max, y_max))
      girafe(ggobj=p, width_svg=6, height_svg=4, options=list(opts_hover(css="stroke-width:4;"), opts_zoom(max=4)))
    })
    
    # 2. Multi PSD
    output$plot_psd_multi <- renderGirafe({
      req(input$data_type == "PSD", length(sels) > 0)
      df_multi <- df_psd %>% filter(Channel %in% sels)
      req(nrow(df_multi) > 0)
      p <- ggplot(df_multi, aes(x=Frequency, y=Power, color=Channel, group=Channel)) +
        geom_line_interactive(aes(tooltip=Channel, data_id=Channel), linewidth=1.2) +
        theme_classic()
      girafe(ggobj=p, width_svg=6, height_svg=4, options=list(opts_hover(css="stroke-width:4;"), opts_zoom(max=4)))
    })
    
    # 3. Individual Loops
    for (ch in sels) {
      local({
        channel_name <- ch
        # Individual ERP
        output[[paste0("plot_erp_", channel_name)]] <- renderGirafe({
          req(input$data_type == "ERP")
          df_ch <- df_erp %>% filter(Channel == channel_name)
          y_max <- max(abs(df_ch$GrandVoltage), na.rm=TRUE)
          p <- ggplot(df_ch, aes(x=Time_ms, y=GrandVoltage, color=Condition, group=Condition)) +
            geom_hline(yintercept=0, color="gray50") + geom_vline(xintercept=0) +
            geom_line_interactive(aes(tooltip=Condition, data_id=Condition), linewidth=1.5) +
            theme_classic() + scale_y_continuous(limits=c(-y_max, y_max))
          girafe(ggobj=p, width_svg=6, height_svg=4, options=list(opts_hover(css="stroke-width:4;"), opts_zoom(max=4)))
        })
        
        # Individual ERP Table
        output[[paste0("table_erp_", channel_name)]] <- render_gt({
          req(input$data_type == "ERP")
          df_ch <- df_erp %>% filter(Channel == channel_name)
          # Simple stats generation for display
          stats <- df_ch %>% group_by(Condition) %>% summarise(Mean=mean(GrandVoltage), .groups='drop')
          gt(stats) %>% tab_header(title=paste("Channel", channel_name))
        })
        
        # Individual PSD
        output[[paste0("plot_psd_", channel_name)]] <- renderGirafe({
          req(input$data_type == "PSD")
          df_ch <- df_psd %>% filter(Channel == channel_name)
          p <- ggplot(df_ch, aes(x=Frequency, y=Power, color=Condition, group=Condition)) +
            geom_line_interactive(aes(tooltip=Condition, data_id=Condition), linewidth=1.5) +
            theme_classic()
          girafe(ggobj=p, width_svg=6, height_svg=4, options=list(opts_hover(css="stroke-width:4;"), opts_zoom(max=4)))
        })
        
        # Individual PSD Table
        output[[paste0("table_psd_", channel_name)]] <- render_gt({
          req(input$data_type == "PSD")
          df_ch <- df_psd %>% filter(Channel == channel_name)
          stats <- df_ch %>% group_by(Condition) %>% summarise(MeanPower=mean(Power), .groups='drop')
          gt(stats) %>% tab_header(title=paste("Channel", channel_name))
        })
      })
    }
  })
  
  observeEvent(input$reset_view, { session$sendCustomMessage("resetView", TRUE) })
  observeEvent(input$modality, { session$sendCustomMessage("setModality", list(modality = input$modality)) })
  observeEvent(input$data_type, { session$sendCustomMessage("setDataType", list(type = input$data_type)) })
  observeEvent(input$mi_task, { req(input$data_type == "MI"); session$sendCustomMessage("setMITask", list(task = input$mi_task)) })
  
}

shinyApp(ui = ui, server = server)