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
      #electrode_data_panel {
        transition: transform 0.3s ease-in-out;
      }
      .panel-visible {
        transform: translateX(0);
      }
      .panel-hidden {
        transform: translateX(-100%);
      }
      #main_title_bar {
        position: relative;
        z-index: 2100;
        text-align: center;
        transition: margin-left 0.3s;
      }
      body.panel-open #main_title_bar {
        margin-left: 600px;
        text-align: left;
      }
    "))
  ),
  
  # Centered title that shifts right when panel is open
  div(
    id = "main_title_bar",
    h2("Interactive 3D Brain Model - 32 Channel System")
  ),
  
  # Side panel on LEFT
  absolutePanel(
    id = "electrode_data_panel",
    class = "panel-hidden",
    top = 0, bottom = 0, left = 0, width = 600,
    style = "background-color: white; z-index: 2000; padding: 20px; border-right: 1px solid #ddd; box-shadow: 2px 0 10px rgba(0,0,0,0.1); overflow-y: auto;",
    
    div(
      style = "display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;",
      h3(textOutput("panel_title"), style = "margin:0;"),
      actionButton("close_panel", "✕", class = "btn-sm btn-default")
    ),
    uiOutput("data_content")
  ),
  
  sidebarLayout(
    sidebarPanel(
      h4("Controls"),
      
      p(strong("Mouse Controls:")),
      tags$ul(
        tags$li("Left click + drag: Rotate"),
        tags$li("Right click + drag: Pan"),
        tags$li(strong("Click electrode: Toggle selection (multiple allowed)"))
      ),
      hr(),
      
      # Modality selector (EEG / fNIRS)
      wellPanel(
        style = "background: #f0f8ff;",
        h5(strong("Recording Modality")),
        selectInput(
          "modality",
          NULL,
          choices = c("EEG" = "EEG", "fNIRS" = "fNIRS"),
          selected = "EEG"
        )
      ),
      
      # Data type selector (ERP / PSD / MI)
      wellPanel(
        style = "background: #f9f9f9;",
        h5(strong("Data Type")),
        selectInput(
          "data_type",
          NULL,
          choices = c(
            "ERP (Event-Related Potential)" = "ERP",
            "PSD (Power Spectral Density)"  = "PSD",
            "Motor Imagery"                 = "MI"
          ),
          selected = "ERP"
        )
      ),
      
      checkboxInput(
        "plot_together",
        "Plot selected sensors on one graph",
        value = FALSE
      ),
      
      fileInput(
        "sync_file",
        "Upload synchrony / condition CSV (optional):",
        accept = c(".csv")
      ),
      helpText("CSV should at least contain a 'Condition' column (and optionally Channel/electrode info)."),
      
      checkboxInput(
        "two_brain_mode",
        "Two-brain mode (interbrain / two-condition view)",
        value = FALSE
      ),
      
      conditionalPanel(
        condition = "input.two_brain_mode == true",
        wellPanel(
          style = "background:#f5f5f5;",
          h5(strong("Two-brain conditions")),
          selectInput(
            "left_condition",
            "Left brain condition",
            choices = NULL
          ),
          selectInput(
            "right_condition",
            "Right brain condition",
            choices = NULL
          ),
          helpText("Conditions come from the uploaded synchrony CSV if provided; otherwise from the simulated data.")
        )
      ),
      
      conditionalPanel(
        condition = "input.data_type == 'PSD'",
        wellPanel(
          style = "background: #fff8dc;",
          h5(strong("Frequency Bands")),
          checkboxGroupInput(
            "freq_bands",
            NULL,
            choices = c(
              "All (0.5-50 Hz)"    = "all",
              "Delta (0.5-4 Hz)"   = "delta",
              "Theta (4-8 Hz)"     = "theta",
              "Alpha (8-13 Hz)"    = "alpha",
              "Beta (13-30 Hz)"    = "beta",
              "Gamma (30-50 Hz)"   = "gamma"
            ),
            selected = "all"
          )
        )
      ),
      
      conditionalPanel(
        condition = "input.data_type == 'MI'",
        wellPanel(
          style = "background: #e8f4f8;",
          h5(strong("Motor Imagery Condition")),
          selectInput(
            "mi_task",
            NULL,
            choices = c(
              "Real Movement"                = "real",
              "Imagined Movement"            = "imagined",
              "Difference (Real - Imagined)" = "diff"
            ),
            selected = "real"
          )
        )
      ),
      
      hr(),
      actionButton("reset_view", "Reset View", class = "btn-primary"),
      hr(),
      
      fileInput(
        "brain_file",
        "Upload Different Brain Model (optional):",
        accept = c(".glb", ".gltf")
      ),
      helpText("Accepts 3D brain models in .glb or .gltf format.")
    ),
    
    mainPanel(
      tags$div(
        id = "canvas-container",
        style = "width: 100%; height: 600px; background-color: #f0f0f0; border: 1px solid #ccc; position: relative;",
        tags$canvas(id = "brain-canvas"),
        tags$div(
          id = "loading-message",
          style = "position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: none;",
          h4("Loading model...")
        )
      ),
      uiOutput("legend_output")
    )
  ),
  
  # JS 
  tags$script(HTML("
    var scene, camera, renderer, controls, animationId;
    var brain, brainRight; 
    var leftGroup, rightGroup; // Groups to hold brain + electrodes
    
    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();
    var mouseDownPos = new THREE.Vector2();
    var isDragging = false;
    var previousMousePosition = { x: 0, y: 0 };
    
    var eegSpheres = [];
    var eegLabels  = [];
    var eegSpheresRight = [];
    var eegLabelsRight  = [];
    var brodmannMeshes = [];
    var brainCenter = new THREE.Vector3(0, 0, 0);
    var brainBBox = null;
    var brainLoaded = false;

    var currentDataType = 'ERP';
    var currentTask = 'real';
    var currentModality = 'EEG';
    var electrodePValues = {};
    var electrodePowerValues = {};

    var twoBrainMode = false;
    var leftCondition = null;
    var rightCondition = null;
    var brainSeparation = 7.0;   // distance between left and right brains

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

    function initScene() {
      var container = document.getElementById('canvas-container');
      var canvas = document.getElementById('brain-canvas');
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf0f0f0);
      
      // Initialize groups
      leftGroup = new THREE.Group();
      rightGroup = new THREE.Group();
      scene.add(leftGroup);
      scene.add(rightGroup);

      camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
      camera.position.set(0, -6, 0);
      camera.up.set(0, 0, 1);
      camera.lookAt(0, 0, 0);

      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.outputEncoding = THREE.sRGBEncoding;

      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.enableZoom = false; // ZOOM DISABLED
      controls.target.set(0, 0, 0);
      controls.update();

      canvas.addEventListener('wheel', function(e) {
        e.preventDefault();
      }, { passive: false });

      var hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7);
      hemiLight.position.set(0, 0, 5);
      scene.add(hemiLight);

      var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
      dirLight.position.set(5, -5, 5);
      scene.add(dirLight);

      // Event Listeners
      canvas.addEventListener('pointerdown', onPointerDown, false);
      canvas.addEventListener('pointerup', onPointerUp, false);
      canvas.addEventListener('pointerleave', onPointerUp, false); // Handle mouse leaving canvas
      canvas.addEventListener('pointermove', onPointerMove, false);
      canvas.addEventListener('click', onMouseClick, false);
      window.addEventListener('resize', onWindowResize, false);

      animate();
    }

    function onPointerDown(event) {
      mouseDownPos.x = event.clientX;
      mouseDownPos.y = event.clientY;
      
      // For custom rotation logic
      if(twoBrainMode && event.button === 0) {
          isDragging = true;
          previousMousePosition = { x: event.clientX, y: event.clientY };
      }
    }

    function onPointerUp(event) {
        isDragging = false;
    }

    function onPointerMove(event) {
      // Raycasting for hover cursor
      var allSpheres = eegSpheres.concat(eegSpheresRight);
      if (allSpheres.length) {
          var rect = renderer.domElement.getBoundingClientRect();
          mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
          raycaster.setFromCamera(mouse, camera);
          var intersects = raycaster.intersectObjects(allSpheres);
          document.body.style.cursor = (intersects.length > 0) ? 'pointer' : 'default';
      }

      // Custom Rotation Logic for Two Brain Mode
      if (twoBrainMode && isDragging) {
        var deltaMove = {
            x: event.clientX - previousMousePosition.x,
            y: event.clientY - previousMousePosition.y
        };

        // Increased sensitivity to match single brain mode feel
        var rotateSpeed = 0.012;
        
        // Rotate Left Group
        leftGroup.rotation.z -= deltaMove.x * rotateSpeed;
        leftGroup.rotation.x -= deltaMove.y * rotateSpeed;
        
        // Rotate Right Group identically
        rightGroup.rotation.z -= deltaMove.x * rotateSpeed;
        rightGroup.rotation.x -= deltaMove.y * rotateSpeed;

        previousMousePosition = { x: event.clientX, y: event.clientY };
      }
    }

    function onMouseClick(event) {
      var dx = event.clientX - mouseDownPos.x;
      var dy = event.clientY - mouseDownPos.y;
      var dist = Math.sqrt(dx*dx + dy*dy);
      if (dist > 5) return; // It was a drag, not a click

      var allSpheres = eegSpheres.concat(eegSpheresRight);
      if (!allSpheres.length) return;

      var rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      var intersects = raycaster.intersectObjects(allSpheres);
      if (intersects.length > 0) {
        var obj = intersects[0].object;
        if (obj.userData && obj.userData.label) {
          var label = obj.userData.label;
          obj.material.emissive.setHex(0xffffff);
          setTimeout(function() { obj.material.emissive.setHex(0x000000); }, 200);
          if (typeof Shiny !== 'undefined') {
            Shiny.setInputValue('clicked_electrode', label, {priority: 'event'});
          }
        }
      }
    }

    function makeTextSprite(message) {
      var canvas = document.createElement('canvas');
      var size = 512;
      canvas.width = size;
      canvas.height = size;
      var ctx = canvas.getContext('2d');
      ctx.font = 'bold 200px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.lineWidth = 12;
      ctx.strokeText(message, size / 2, size / 2);
      ctx.fillStyle = 'white';
      ctx.fillText(message, size / 2, size / 2);
      var texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      var material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        depthWrite: false
      });
      var sprite = new THREE.Sprite(material);
      sprite.scale.set(0.35, 0.35, 1.0);
      return sprite;
    }

    function clearEEGElectrodes() {
      for (var i = 0; i < eegSpheres.length; i++) { 
          leftGroup.remove(eegSpheres[i]); 
          // also safely remove from scene if it was there (legacy)
          scene.remove(eegSpheres[i]);
      }
      for (var j = 0; j < eegLabels.length; j++)  { 
          leftGroup.remove(eegLabels[j]); 
          scene.remove(eegLabels[j]);
      }
      eegSpheres = [];
      eegLabels  = [];

      for (var i2 = 0; i2 < eegSpheresRight.length; i2++) { 
          rightGroup.remove(eegSpheresRight[i2]); 
          scene.remove(eegSpheresRight[i2]);
      }
      for (var j2 = 0; j2 < eegLabelsRight.length; j2++)  { 
          rightGroup.remove(eegLabelsRight[j2]); 
          scene.remove(eegLabelsRight[j2]);
      }
      eegSpheresRight = [];
      eegLabelsRight  = [];
    }

    function asaToSurfacePosition(asaX, asaY, asaZ) {
      if (!brainBBox) return new THREE.Vector3(0, 0, 0);
      var asaVec = new THREE.Vector3(asaX, asaY, asaZ);
      asaVec.normalize();
      var brainX = asaVec.y;
      var brainY = asaVec.x;
      var brainZ = asaVec.z;
      var dir = new THREE.Vector3(brainX, brainY, brainZ);
      dir.normalize();
      var size = brainBBox.getSize(new THREE.Vector3());
      // We calculate relative to the brain center, which is 0,0,0 inside the Group usually
      var surfacePos = new THREE.Vector3(
        dir.x * size.x / 2 * 1.1,
        dir.y * size.y / 2 * 1.1,
        dir.z * size.z / 2 * 1.1
      );
      return surfacePos.add(brainCenter);
    }

    // Gradient interpolation for Mean Amplitude (Purple to Yellow)
    function getGradientColor(t) {
      // Clamp t between 0 and 1
      t = Math.max(0, Math.min(1, t));
      
      // Enhanced Gradient: Deep Purple -> Teal -> Bright Yellow
      var r, g, b;
      
      if (t < 0.5) {
        // Interpolate Purple (#440154) to Teal (#21918c)
        var nt = t * 2; // normalize 0..0.5 to 0..1
        r = Math.floor(0x44 + (0x21 - 0x44) * nt);
        g = Math.floor(0x01 + (0x91 - 0x01) * nt);
        b = Math.floor(0x54 + (0x8c - 0x54) * nt);
      } else {
        // Interpolate Teal (#21918c) to Yellow (#fde725)
        var nt = (t - 0.5) * 2; // normalize 0.5..1 to 0..1
        r = Math.floor(0x21 + (0xfd - 0x21) * nt);
        g = Math.floor(0x91 + (0xe7 - 0x91) * nt);
        b = Math.floor(0x8c + (0x25 - 0x8c) * nt);
      }
      return (r << 16) | (g << 8) | b;
    }

    function powerToColor(power, minPower, maxPower) {
      if (maxPower <= minPower) return 0x0000ff;
      var t = (power - minPower) / (maxPower - minPower);
      t = Math.max(0, Math.min(1, t));
      var r = Math.floor(255 * t);
      var g = 0;
      var b = Math.floor(255 * (1 - t));
      return (r << 16) | (g << 8) | b;
    }

    function updateLabelVisibility() {
      var allLabels = eegLabels.concat(eegLabelsRight);
      if (!allLabels.length) return;
      var camPos = camera.position.clone();
      
      // This is tricky with groups. We need world positions.
      allLabels.forEach(function(sprite) {
        var worldPos = new THREE.Vector3();
        sprite.getWorldPosition(worldPos);
        
        // Find the center of the specific brain this label belongs to
        var parentGroup = sprite.parent;
        var centerPos = new THREE.Vector3();
        if(parentGroup) parentGroup.getWorldPosition(centerPos);
        
        var toCamera = camPos.clone().sub(centerPos).normalize();
        var toLabel = worldPos.clone().sub(centerPos).normalize();
        
        var dot = toLabel.dot(toCamera);
        sprite.visible = (dot > 0);
      });
    }

    function updateVisuals() {
      var allSpheres = eegSpheres.concat(eegSpheresRight);
      if (allSpheres.length === 0) return;

      var activeSet = [];
      if (currentDataType === 'MI') {
        if (currentTask === 'real')     activeSet = ['C3', 'CP3', 'FC3'];
        if (currentTask === 'imagined') activeSet = ['C3', 'FCz', 'Cz'];
        if (currentTask === 'diff')     activeSet = ['FCz', 'Cz'];
      }

      var minPower = Infinity;
      var maxPower = -Infinity;
      if (currentDataType === 'PSD') {
        for (var label in electrodePowerValues) {
          var p = electrodePowerValues[label];
          if (p < minPower) minPower = p;
          if (p > maxPower) maxPower = p;
        }
      }

      allSpheres.forEach(function(sphere) {
        var label = sphere.userData.label;
        var brainSide = sphere.userData.brainSide; // Get brain side tag
        sphere.scale.set(1, 1, 1);
        sphere.material.transparent = false;

        // --- NEW LOGIC FOR 2-BRAIN MODE (Mean Amplitudes) ---
        // Separate logic for 2-Brain Mode to prevent Single Brain logic from overriding colors
        if (twoBrainMode) {
           
           // ERP LOGIC
           if (currentDataType === 'ERP' && electrodePValues && electrodePValues.mode === '2brain_means') {
             var val;
             
             // ROBUST CHECK: Check userData.brainSide
             if (brainSide === 'left') { 
                 if(electrodePValues.left) val = electrodePValues.left[label];
             } else if (brainSide === 'right') {
                 if(electrodePValues.right) val = electrodePValues.right[label];
             }
             
             if (val !== undefined) {
               // Use FIXED SCALE for robust visual comparison
               // Range: -5 uV to +10 uV
               var min = -5;
               var max = 10;
               var range = max - min;
               
               var t = (val - min) / range;
               var colorHex = getGradientColor(t);
               
               sphere.material.color.setHex(colorHex);
               sphere.material.opacity = 1.0;
             } else {
               sphere.material.color.setHex(0xcccccc);
             }
             sphere.material.emissive.setHex(0x000000);
             return;
           
           // PSD LOGIC
           } else if (currentDataType === 'PSD' && electrodePowerValues && electrodePowerValues.mode === '2brain_means') {
             var val;
             if (brainSide === 'left') { 
                 if(electrodePowerValues.left) val = electrodePowerValues.left[label];
             } else if (brainSide === 'right') {
                 if(electrodePowerValues.right) val = electrodePowerValues.right[label];
             }
             
             if (val !== undefined && electrodePowerValues.min !== undefined) {
               // Use standard powerToColor (Blue to Red) for PSD
               var colorHex = powerToColor(val, electrodePowerValues.min, electrodePowerValues.max);
               sphere.material.color.setHex(colorHex);
               sphere.material.opacity = 1.0;
             } else {
               sphere.material.color.setHex(0xcccccc);
             }
             sphere.material.emissive.setHex(0x000000);
             return;
           } else {
             // Fallback for 2-brain mode if data missing
             sphere.material.color.setHex(0xcccccc);
             sphere.material.opacity = 1.0;
             sphere.material.emissive.setHex(0x000000);
             return; 
           }
        }
        
        // --- STANDARD SINGLE BRAIN LOGIC (Runs only if !twoBrainMode) ---

        if (currentDataType === 'ERP') {
          var pval = electrodePValues[label];
          if (pval !== undefined && pval <= 0.05) {
            var intensity = pval / 0.05;
            if (intensity < 0) intensity = 0;
            sphere.material.color.setRGB(1.0, intensity, intensity);
            sphere.material.opacity = 1.0;
          } else {
            sphere.material.color.setHex(0xcccccc);
            sphere.material.opacity = 1.0;
          }
          sphere.material.emissive.setHex(0x000000);
        } else if (currentDataType === 'PSD') {
          var power = electrodePowerValues[label];
          if (power !== undefined && isFinite(minPower) && isFinite(maxPower)) {
            var colorHex = powerToColor(power, minPower, maxPower);
            sphere.material.color.setHex(colorHex);
            sphere.material.opacity = 1.0;
          } else {
            sphere.material.color.setHex(0x888888);
            sphere.material.opacity = 0.5;
            sphere.material.transparent = true;
          }
          sphere.material.emissive.setHex(0x000000);
        } else if (currentDataType === 'MI') {
          if (activeSet.includes(label)) {
            sphere.material.color.setHex(0xFF4500);
            sphere.material.opacity = 1.0;
            sphere.material.emissive.setHex(0x330000);
          } else {
            sphere.material.color.setHex(0x888888);
            sphere.material.opacity = 0.5;
            sphere.material.transparent = true;
            sphere.material.emissive.setHex(0x000000);
          }
        }
      });
    }

    function createEEGElectrodes(config) {
      clearEEGElectrodes();
      if (!brainLoaded || !brain || !brainBBox) return;
      var list = electrodes_32;
      var sensorSize = 0.15;
      
      // Create LEFT electrodes
      for (var i = 0; i < list.length; i++) {
        var elec = list[i];
        
        // Get World Position first
        var pos  = asaToSurfacePosition(elec.x, elec.y, elec.z);
        
        // CRITICAL FIX: Convert World Position to Local Position of leftGroup
        // This ensures proper placement regardless of where leftGroup is positioned
        leftGroup.worldToLocal(pos);

        var geom, mat;
        if (currentModality === 'EEG') {
          geom = new THREE.SphereGeometry(sensorSize, 32, 32);
          mat  = new THREE.MeshStandardMaterial({
            color: 0xcccccc, metalness: 0.2, roughness: 0.2
          });
        } else {
          geom = new THREE.CylinderGeometry(sensorSize * 0.8, sensorSize * 0.8, sensorSize * 1.5, 32);
          mat  = new THREE.MeshStandardMaterial({
            color: 0xcc0000, metalness: 0.3, roughness: 0.3
          });
        }

        var sphere = new THREE.Mesh(geom, mat);
        sphere.position.copy(pos);
        sphere.userData = { label: elec.label, brainSide: 'left' }; // Tag as LEFT
        eegSpheres.push(sphere);
        // Add to LEFT group
        leftGroup.add(sphere);

        var labelSprite = makeTextSprite(elec.label);
        labelSprite.position.copy(pos);
        eegLabels.push(labelSprite);
        leftGroup.add(labelSprite);
      }

      if (twoBrainMode) {
        duplicateRightElectrodes();
      }

      updateVisuals();
    }

    function clearBrodmann() {
      for (var i = 0; i < brodmannMeshes.length; i++) {
        leftGroup.remove(brodmannMeshes[i]);
      }
      brodmannMeshes = [];
    }

    function createBrodmannOverlays() {
      clearBrodmann();
      if (!brainLoaded || !brainBBox) return;
      var size = brainBBox.getSize(new THREE.Vector3());
      var r = Math.max(size.x, size.y, size.z) * 0.25;
      var defs = [
        {name:'BA17', color:0x4b9cd3, pos:new THREE.Vector3(-size.x*0.3, 0, 0)},
        {name:'BA4',  color:0xe67e22, pos:new THREE.Vector3(0, 0, size.z*0.3)},
        {name:'BA10', color:0x9b59b6, pos:new THREE.Vector3(size.x*0.35, 0, 0)}
      ];
      defs.forEach(function(d) {
        var geom = new THREE.SphereGeometry(r, 32, 32);
        var mat  = new THREE.MeshStandardMaterial({ color: d.color, transparent: true, opacity: 0.25 });
        var mesh = new THREE.Mesh(geom, mat);
        mesh.position.copy(d.pos.clone().add(brainCenter));
        brodmannMeshes.push(mesh);
        // Add to LEFT group
        leftGroup.add(mesh);
      });
    }

    function duplicateRightElectrodes() {
      // Clear existing right stuff
      for (var i2 = 0; i2 < eegSpheresRight.length; i2++) { rightGroup.remove(eegSpheresRight[i2]); }
      for (var j2 = 0; j2 < eegLabelsRight.length; j2++)  { rightGroup.remove(eegLabelsRight[j2]); }
      eegSpheresRight = [];
      eegLabelsRight  = [];

      // We don't need an offset anymore because the GROUP has the offset!
      // We just clone positions from the left spheres into the right group.
      
      for (var i = 0; i < eegSpheres.length; i++) {
        var orig = eegSpheres[i];
        var clone = orig.clone();
        // Position relative to group is same as left brain
        clone.position.copy(orig.position);
        
        // CRITICAL FIX: Clone material so it has its own color state
        clone.material = orig.material.clone(); 
        
        clone.userData = { label: orig.userData.label, brainSide: 'right' }; // Tag as RIGHT
        eegSpheresRight.push(clone);
        rightGroup.add(clone);
      }

      for (var j = 0; j < eegLabels.length; j++) {
        var origL = eegLabels[j];
        var cloneL = origL.clone();
        cloneL.position.copy(origL.position);
        eegLabelsRight.push(cloneL);
        rightGroup.add(cloneL);
      }

      updateVisuals();
    }

    // Arrange one vs two brains
    function arrangeBrains() {
      if (!brainLoaded || !brain) return;

      if (!twoBrainMode) {
        // Single-brain mode
        if (brainRight) {
            rightGroup.remove(brainRight);
            brainRight = null;
        }
        
        // Ensure Controls are ROTATING camera
        controls.enableRotate = true;
        
        // Reset Group Rotations
        leftGroup.rotation.set(0,0,0);
        rightGroup.rotation.set(0,0,0);

        // Center Left Group
        leftGroup.position.set(0,0,0);
        leftGroup.scale.set(1, 1, 1); // Reset group scale
        leftGroup.updateMatrixWorld(true); // Force update before BBox calc
        
        brainBBox   = new THREE.Box3().setFromObject(brain);
        brainCenter = brainBBox.getCenter(new THREE.Vector3());

        createEEGElectrodes('32');

        camera.position.set(0, -6, 0);
        camera.up.set(0, 0, 1);
        camera.lookAt(0, 0, 0);
        controls.target.set(0, 0, 0);
        controls.update();
        return;
      }

      // Two-brain mode
      // Disable orbit rotation so we can manual rotate objects
      controls.enableRotate = false;
      
      // Reset Group Rotations initially so they face forward
      leftGroup.rotation.set(0,0,0);
      rightGroup.rotation.set(0,0,0);

      // Position and Scale Groups (make them bigger in 2-brain mode)
      leftGroup.position.set(-brainSeparation/2.0, 0, 0);
      rightGroup.position.set(brainSeparation/2.0, 0, 0);
      leftGroup.scale.set(1.4, 1.4, 1.4); 
      rightGroup.scale.set(1.4, 1.4, 1.4);
      
      leftGroup.updateMatrixWorld(true);
      rightGroup.updateMatrixWorld(true);

      if (!brainRight) {
        brainRight = brain.clone();
        rightGroup.add(brainRight);
      }

      brainBBox   = new THREE.Box3().setFromObject(brain);
      brainCenter = brainBBox.getCenter(new THREE.Vector3());

      // Rebuild electrodes
      createEEGElectrodes('32');

      // Camera Position
      var centerZ = 0; 
      camera.position.set(0, -12, 5); // Pull back and up slightly
      camera.up.set(0, 0, 1);
      camera.lookAt(0, 0, 0);
      controls.target.set(0, 0, 0);
      controls.update();
    }

    function loadModel(fileDataUrl) {
      document.getElementById('loading-message').style.display = 'block';
      
      // Cleanup previous
      if (brain) { leftGroup.remove(brain); brain = null; }
      if (brainRight) { rightGroup.remove(brainRight); brainRight = null; }
      brainLoaded = false;
      clearEEGElectrodes();
      clearBrodmann();

      var loader = new THREE.GLTFLoader();
      loader.load(
        fileDataUrl,
        function(gltf) {
          brain = gltf.scene;
          brain.traverse(function(child) {
            if (child.isMesh) {
              if (child.geometry && child.geometry.computeVertexNormals) {
                child.geometry.computeVertexNormals();
              }
              child.material = new THREE.MeshStandardMaterial({
                color: 0xeeeeee, metalness: 0.1, roughness: 0.5, side: THREE.DoubleSide
              });
            }
          });

          // Center brain relative to itself before adding to Group
          var box   = new THREE.Box3().setFromObject(brain);
          var center = box.getCenter(new THREE.Vector3());
          var size   = box.getSize(new THREE.Vector3());
          var maxDim = Math.max(size.x, size.y, size.z);
          
          // REVERTED SCALE FACTOR for Single Brain (smaller)
          var scale  = 4.0 / maxDim; 
          
          brain.scale.multiplyScalar(scale);
          brain.position.sub(center.multiplyScalar(scale));
          brain.rotation.z = Math.PI; // Initial orientation
          
          brain.updateMatrixWorld();
          brainBBox   = new THREE.Box3().setFromObject(brain);
          brainCenter = brainBBox.getCenter(new THREE.Vector3());
          brainLoaded = true;
          
          // Add to Left Group
          leftGroup.add(brain);

          document.getElementById('loading-message').style.display = 'none';

          arrangeBrains();
        },
        undefined,
        function(error) { console.error('Error:', error); }
      );
    }

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

    function resetView() {
      // Reset rotations
      leftGroup.rotation.set(0,0,0);
      rightGroup.rotation.set(0,0,0);
      
      if (!twoBrainMode) {
        camera.position.set(0, -6, 0);
        camera.lookAt(0, 0, 0);
        controls.target.set(0, 0, 0);
      } else {
        camera.position.set(0, -12, 5);
        camera.lookAt(0, 0, 0);
        controls.target.set(0, 0, 0);
      }
      camera.up.set(0, 0, 1);
      controls.update();
    }

    document.addEventListener('DOMContentLoaded', function() { initScene(); });

    if (typeof Shiny !== 'undefined') {
      Shiny.addCustomMessageHandler('loadModel', function(message) { loadModel(message); });
      Shiny.addCustomMessageHandler('resetView', function(message) { resetView(); });
      Shiny.addCustomMessageHandler('setEEG', function(message) {
        var cfg = (message && message.n) ? message.n : 'none';
        createEEGElectrodes(cfg);
      });
      Shiny.addCustomMessageHandler('setBrodmannVisible', function(message) {
        var show = !!(message && message.show);
        if (show) { createBrodmannOverlays(); } else { clearBrodmann(); }
      });
      Shiny.addCustomMessageHandler('setDataType', function(message) {
        currentDataType = message.type;
        updateVisuals();
      });
      Shiny.addCustomMessageHandler('setMITask', function(message) {
        currentTask = message.task;
        updateVisuals();
      });
      Shiny.addCustomMessageHandler('updateElectrodeColors', function(message) {
        electrodePValues = message;
        updateVisuals();
      });
      Shiny.addCustomMessageHandler('updateElectrodePower', function(message) {
        electrodePowerValues = message;
        updateVisuals();
      });
      Shiny.addCustomMessageHandler('setModality', function(message) {
        currentModality = message.modality || 'EEG';
        createEEGElectrodes('32');
      });

      Shiny.addCustomMessageHandler('setTwoBrainMode', function(message) {
        twoBrainMode = !!(message && message.enabled);
        arrangeBrains();
        // Force refresh visual state to switch colors
        updateVisuals();
      });

      Shiny.addCustomMessageHandler('setBrainConditions', function(message) {
        leftCondition  = message && message.left  ? message.left  : null;
        rightCondition = message && message.right ? message.right : null;
        console.log('Brain conditions:', leftCondition, rightCondition);
      });

      Shiny.addCustomMessageHandler('shiny-run-js', function(code) {
        eval(code);
      });
    }
  "))
)

server <- function(input, output, session) {
  
  selected_electrodes <- reactiveVal(character(0))
  
  simulated_erp_data <- reactive({
    set.seed(42)
    times <- seq(-200, 800, by = 10)
    channels_list <- c(
      "Fp1", "Fpz", "Fp2", "F7", "F3", "Fz", "F4", "F8",
      "FC5", "FC1", "FC2", "FC6", "T7", "C3", "Cz", "C4",
      "T8", "CP5", "CP1", "CP2", "CP6", "P7", "P3", "Pz",
      "P4", "P8", "POz", "O1", "Oz", "O2", "AFz", "FCz"
    )
    conditions <- c("Motion", "Nonmotion")
    
    df_list <- list()
    count <- 1
    
    for (ch in channels_list) {
      for (cond in conditions) {
        noise  <- rnorm(length(times), 0, 0.5)
        signal <- 5 * exp(-((times - 350)^2) / (2 * 100^2))
        signal <- signal - 2 * exp(-((times - 200)^2) / (2 * 40^2))
        
        # Revert Single Brain P-value logic to original random
        effect_size <- runif(1, 0.4, 1.0)
        if (cond == "Nonmotion") signal <- signal * effect_size
        
        df_list[[count]] <- data.frame(
          Time_ms      = times,
          Channel      = ch,
          Condition    = cond,
          GrandVoltage = signal + noise
        )
        count <- count + 1
      }
    }
    do.call(rbind, df_list)
  })
  
  simulated_psd_data <- reactive({
    set.seed(123)
    channels_list <- c(
      "Fp1", "Fpz", "Fp2", "F7", "F3", "Fz", "F4", "F8",
      "FC5", "FC1", "FC2", "FC6", "T7", "C3", "Cz", "C4",
      "T8", "CP5", "CP1", "CP2", "CP6", "P7", "P3", "Pz",
      "P4", "P8", "POz", "O1", "Oz", "O2", "AFz", "FCz"
    )
    freqs <- seq(0.5, 50, by = 0.5)
    conditions <- c("Motion", "Nonmotion") # Added Conditions
    
    df_list <- list()
    count <- 1
    
    for (ch in channels_list) {
      for (cond in conditions) {
        base_power  <- rnorm(length(freqs), 10, 2)
        alpha_peak  <- 20 * exp(-((freqs - 10)^2) / (2 * 2^2))
        
        # Simulated Alpha desynchronization for Motion
        if (cond == "Motion") {
          alpha_peak <- alpha_peak * 0.5 
        }
        
        if (grepl("O|P", ch)) alpha_peak <- alpha_peak * 2
        theta_peak  <- 15 * exp(-((freqs - 6)^2) / (2 * 1.5^2))
        beta_power  <- 5 * exp(-((freqs - 20)^2) / (2 * 5^2))
        if (grepl("C|F", ch)) beta_power <- beta_power * 1.5
        
        power <- base_power + alpha_peak + theta_peak + beta_power
        power <- pmax(power, 1)
        
        df_list[[count]] <- data.frame(
          Frequency = freqs,
          Channel   = ch,
          Power     = power,
          Condition = cond
        )
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
      if ("Condition" %in% names(df)) {
        vals <- sort(unique(df$Condition))
        if (length(vals) > 0) return(vals)
      }
    }
    c("Motion", "Nonmotion")
  })
  
  observe({
    choices <- condition_choices()
    if (length(choices) == 0) return()
    
    updateSelectInput(
      session,
      "left_condition",
      choices = choices,
      selected = choices[1]
    )
    
    updateSelectInput(
      session,
      "right_condition",
      choices = choices,
      selected = ifelse(length(choices) > 1, choices[2], choices[1])
    )
  })
  
  observeEvent(input$two_brain_mode, {
    session$sendCustomMessage(
      "setTwoBrainMode",
      list(enabled = isTRUE(input$two_brain_mode))
    )
  })
  
  observe({
    if (!isTRUE(input$two_brain_mode)) return()
    if (is.null(input$left_condition) || is.null(input$right_condition)) return()
    
    session$sendCustomMessage(
      "setBrainConditions",
      list(
        left  = input$left_condition,
        right = input$right_condition
      )
    )
  })
  
  output$legend_output <- renderUI({
    if (input$data_type == "ERP") {
      # CHECK IF TWO BRAIN MODE IS ACTIVE
      if (isTRUE(input$two_brain_mode)) {
        # MEAN AMPLITUDE LEGEND (Purple to Yellow)
        tags$div(
          style = "margin-top: 10px; background: white; padding: 10px 15px; border-radius: 8px; border: 1px solid #ccc; box-shadow: 0 0 5px rgba(0,0,0,0.05); display: inline-block; text-align: center;",
          h5("Mean Amplitude (µV)", style = "margin: 0 0 10px 0; font-weight: bold;"),
          div(
            style = "display: flex; align-items: center; margin-bottom: 5px; justify-content: center;",
            # Gradient from Purple (#440154) to Teal (#21918c) to Yellow (#fde725)
            div(style = "width: 200px; height: 20px; background: linear-gradient(to right, #440154, #21918c, #fde725); border: 1px solid #ccc;")
          ),
          div(
            style = "display: flex; justify-content: space-between; width: 200px; margin: 0 auto;",
            span("Low (Neg)", style = "font-size: 11px;"),
            span("High (Pos)", style = "font-size: 11px;")
          )
        )
      } else {
        # STANDARD ERP LEGEND (P-value / Red)
        tags$div(
          style = "margin-top: 10px; background: white; padding: 10px 15px; border-radius: 8px; border: 1px solid #ccc; box-shadow: 0 0 5px rgba(0,0,0,0.05); display: flex; align-items: center; gap: 15px; flex-wrap: wrap; justify-content: center; text-align: center;",
          h5("Significance (P-Value)", style = "margin: 0; font-weight: bold;"),
          div(
            style = "display: flex; align-items: center;",
            span(style = "width: 20px; height: 20px; background: #ffffff; border: 1px solid #ccc; display: inline-block; margin-right: 6px;"),
            span("> 0.05 (Not Sig)")
          ),
          div(
            style = "display: flex; align-items: center;",
            span(style = "width: 20px; height: 20px; background: #ffcccc; border: 1px solid #ccc; display: inline-block; margin-right: 6px;"),
            span("< 0.05 (Sig)")
          ),
          div(
            style = "display: flex; align-items: center;",
            span(style = "width: 20px; height: 20px; background: linear-gradient(to bottom, #ff9999, #ff0000); border: 1px solid #ccc; display: inline-block; margin-right: 6px;"),
            span("< 0.001 (Highly Sig)")
          )
        )
      }
    } else if (input$data_type == "PSD") {
      tags$div(
        style = "margin-top: 10px; background: white; padding: 10px 15px; border-radius: 8px; border: 1px solid #ccc; box-shadow: 0 0 5px rgba(0,0,0,0.05); display: inline-block; text-align: center;",
        h5("Power Spectral Density", style = "margin: 0 0 10px 0; font-weight: bold;"),
        div(
          style = "display: flex; align-items: center; margin-bottom: 5px; justify-content: center;",
          div(style = "width: 200px; height: 20px; background: linear-gradient(to right, #0000ff, #ff0000); border: 1px solid #ccc;")
        ),
        div(
          style = "display: flex; justify-content: space-between; width: 200px; margin: 0 auto;",
          span("Low Power", style = "font-size: 11px;"),
          span("High Power", style = "font-size: 11px;")
        )
      )
    } else {
      NULL
    }
  })
  
  observe({
    req(input$data_type == "ERP")
    df_all   <- simulated_erp_data()
    channels <- unique(df_all$Channel)
    
    if (isTRUE(input$two_brain_mode)) {
      req(input$left_condition, input$right_condition)
      
      # --- TWO BRAIN MODE: CALCULATE MEAN AMPLITUDES (P300 window) ---
      left_cond  <- input$left_condition
      right_cond <- input$right_condition
      
      # 1. Filter for Left Condition & Time Window (e.g. 250-500ms)
      df_left  <- df_all %>% 
        filter(Condition == left_cond, Time_ms >= 250, Time_ms <= 500)
      
      means_left <- df_left %>%
        group_by(Channel) %>%
        summarise(m = mean(GrandVoltage, na.rm = TRUE), .groups = "drop")
      
      # 2. Filter for Right Condition & Time Window
      df_right <- df_all %>% 
        filter(Condition == right_cond, Time_ms >= 250, Time_ms <= 500)
      
      means_right <- df_right %>%
        group_by(Channel) %>%
        summarise(m = mean(GrandVoltage, na.rm = TRUE), .groups = "drop")
      
      # 3. Determine min/max across BOTH sets to normalize color scale
      all_vals <- c(means_left$m, means_right$m)
      val_min <- min(all_vals, na.rm = TRUE)
      val_max <- max(all_vals, na.rm = TRUE)
      
      # 4. Create named lists
      vals_left_list <- as.list(means_left$m)
      names(vals_left_list) <- means_left$Channel
      
      vals_right_list <- as.list(means_right$m)
      names(vals_right_list) <- means_right$Channel
      
      # 5. Send structured message to JS
      session$sendCustomMessage("updateElectrodeColors", list(
        mode = "2brain_means",
        left = vals_left_list,
        right = vals_right_list,
        min = val_min,
        max = val_max
      ))
      
    } else {
      # --- SINGLE BRAIN MODE: CALCULATE P-VALUES ---
      p_vals_list <- list()
      for (ch in channels) {
        elec_data <- df_all %>% filter(Channel == ch)
        p300_data <- elec_data %>% filter(Time_ms >= 250 & Time_ms <= 500)
        res <- tryCatch(
          {
            t.test(GrandVoltage ~ Condition, data = p300_data)$p.value
          },
          error = function(e) 1.0
        )
        p_vals_list[[ch]] <- res
      }
      session$sendCustomMessage("updateElectrodeColors", p_vals_list)
    }
  })
  
  observe({
    req(input$data_type == "PSD")
    req(length(input$freq_bands) > 0)
    
    df_all <- simulated_psd_data()
    channels <- unique(df_all$Channel)
    
    freq_ranges <- list()
    if ("all" %in% input$freq_bands) {
      freq_ranges <- list(c(0.5, 50))
    } else {
      if ("delta" %in% input$freq_bands) freq_ranges <- c(freq_ranges, list(c(0.5, 4)))
      if ("theta" %in% input$freq_bands) freq_ranges <- c(freq_ranges, list(c(4, 8)))
      if ("alpha" %in% input$freq_bands) freq_ranges <- c(freq_ranges, list(c(8, 13)))
      if ("beta" %in% input$freq_bands)  freq_ranges <- c(freq_ranges, list(c(13, 30)))
      if ("gamma" %in% input$freq_bands) freq_ranges <- c(freq_ranges, list(c(30, 50)))
    }
    
    if (isTRUE(input$two_brain_mode)) {
      req(input$left_condition, input$right_condition)
      
      # 1. Calc Left Means (Average power in selected bands for Left Condition)
      df_left  <- df_all %>% filter(Condition == input$left_condition)
      
      means_left <- list()
      for (ch in channels) {
        elec_data <- df_left %>% dplyr::filter(Channel == ch)
        total_power <- 0
        for (range in freq_ranges) {
          band_data <- elec_data %>%
            dplyr::filter(Frequency >= range[1] & Frequency <= range[2])
          total_power <- total_power + mean(band_data$Power, na.rm = TRUE)
        }
        means_left[[ch]] <- total_power / length(freq_ranges)
      }
      
      # 2. Calc Right Means
      df_right <- df_all %>% filter(Condition == input$right_condition)
      
      means_right <- list()
      for (ch in channels) {
        elec_data <- df_right %>% dplyr::filter(Channel == ch)
        total_power <- 0
        for (range in freq_ranges) {
          band_data <- elec_data %>%
            dplyr::filter(Frequency >= range[1] & Frequency <= range[2])
          total_power <- total_power + mean(band_data$Power, na.rm = TRUE)
        }
        means_right[[ch]] <- total_power / length(freq_ranges)
      }
      
      # 3. Min/Max for color scaling
      all_vals <- c(unlist(means_left), unlist(means_right))
      val_min <- min(all_vals, na.rm = TRUE)
      val_max <- max(all_vals, na.rm = TRUE)
      
      session$sendCustomMessage("updateElectrodePower", list(
        mode = "2brain_means",
        left = means_left,
        right = means_right,
        min = val_min,
        max = val_max
      ))
      
    } else {
      # STANDARD SINGLE BRAIN PSD LOGIC
      power_list <- list()
      for (ch in channels) {
        elec_data <- df_all %>% dplyr::filter(Channel == ch)
        total_power <- 0
        for (range in freq_ranges) {
          band_data <- elec_data %>%
            dplyr::filter(Frequency >= range[1] & Frequency <= range[2])
          total_power <- total_power + mean(band_data$Power, na.rm = TRUE)
        }
        power_list[[ch]] <- total_power / length(freq_ranges)
      }
      
      session$sendCustomMessage("updateElectrodePower", power_list)
    }
  })
  
  observeEvent(TRUE, {
    desktop_dir <- "~/Desktop"
    desktop_dir <- normalizePath(desktop_dir, winslash = "/", mustWork = FALSE)
    glb_files <- list.files(desktop_dir, pattern = "\\.glb$", full.names = TRUE)
    if (length(glb_files) == 0) {
      showNotification(
        paste("No .glb files found on Desktop at:", desktop_dir),
        type = "error"
      )
      return()
    }
    
    preferred <- grepl("Brain_MRI", basename(glb_files), ignore.case = TRUE)
    if (any(preferred)) {
      default_brain_path <- glb_files[which(preferred)[1]]
    } else {
      default_brain_path <- glb_files[1]
    }
    
    message("Using default brain model: ", default_brain_path)
    file_data   <- readBin(default_brain_path, "raw", file.info(default_brain_path)$size)
    file_base64 <- paste0(
      "data:model/gltf-binary;base64,",
      base64encode(file_data)
    )
    
    session$sendCustomMessage("loadModel", file_base64)
    session$sendCustomMessage("setBrodmannVisible", list(show = FALSE))
    session$sendCustomMessage("setDataType", list(type = "ERP"))
  }, once = TRUE)
  
  observeEvent(input$brain_file, {
    req(input$brain_file)
    tryCatch({
      file_path   <- input$brain_file$datapath
      file_data   <- readBin(file_path, "raw", file.info(file_path)$size)
      file_base64 <- paste0(
        "data:model/gltf-binary;base64,",
        base64encode(file_data)
      )
      session$sendCustomMessage("loadModel", file_base64)
    }, error = function(e) {
      showNotification(
        paste("Error loading file:", e$message),
        type = "error"
      )
    })
  })
  
  observeEvent(input$modality, {
    session$sendCustomMessage("setModality", list(modality = input$modality))
  })
  
  observeEvent(input$data_type, {
    session$sendCustomMessage("setDataType", list(type = input$data_type))
  })
  
  observeEvent(input$mi_task, {
    req(input$data_type == "MI")
    session$sendCustomMessage("setMITask", list(task = input$mi_task))
  })
  
  observeEvent(input$clicked_electrode, {
    cur <- selected_electrodes()
    lab <- input$clicked_electrode
    if (is.null(lab) || !nzchar(lab)) return()
    if (lab %in% cur) {
      cur <- setdiff(cur, lab)
    } else {
      cur <- c(cur, lab)
    }
    selected_electrodes(cur)
    
    if (length(cur) > 0) {
      runjs("document.getElementById('electrode_data_panel').classList.remove('panel-hidden');
             document.getElementById('electrode_data_panel').classList.add('panel-visible');
             document.body.classList.add('panel-open');")
    } else {
      runjs("document.getElementById('electrode_data_panel').classList.remove('panel-visible');
             document.getElementById('electrode_data_panel').classList.add('panel-hidden');
             document.body.classList.remove('panel-open');")
    }
  })
  
  observeEvent(input$close_panel, {
    selected_electrodes(character(0))
    runjs("document.getElementById('electrode_data_panel').classList.remove('panel-visible');
           document.getElementById('electrode_data_panel').classList.add('panel-hidden');
           document.body.classList.remove('panel-open');")
  })
  
  output$panel_title <- renderText({
    sels <- selected_electrodes()
    if (!length(sels)) return("No sensors selected")
    paste0(
      ifelse(input$modality == "EEG", "Selected electrodes (", "Selected optodes ("),
      length(sels), "): ",
      paste(sels, collapse = ", ")
    )
  })
  
  output$data_content <- renderUI({
    sels <- selected_electrodes()
    req(length(sels) > 0)
    
    if (input$data_type == "ERP") {
      if (!input$plot_together || length(sels) == 1) {
        tagList(
          lapply(sels, function(ch) {
            tagList(
              hr(),
              h4(paste("ERP Waveform - Channel:", ch)),
              girafeOutput(paste0("plot_erp_", ch), height = "400px"),
              p(em("Interact: Hover points to see values, drag to zoom, double-click to reset.")),
              hr(),
              gt_output(paste0("table_erp_", ch))
            )
          })
        )
      } else {
        tagList(
          hr(),
          h4("ERP Waveforms - Combined"),
          girafeOutput("plot_erp_multi", height = "400px"),
          p(em("Combined: each line is a Channel × Condition. Hover to inspect; drag to zoom; double-click to reset.")),
          lapply(sels, function(ch) {
            tagList(
              hr(),
              h4(paste("ERP Statistics - Channel:", ch)),
              gt_output(paste0("table_erp_", ch))
            )
          })
        )
      }
      
    } else if (input$data_type == "PSD") {
      if (!input$plot_together || length(sels) == 1) {
        tagList(
          lapply(sels, function(ch) {
            tagList(
              hr(),
              h4(paste("Power Spectral Density - Channel:", ch)),
              girafeOutput(paste0("plot_psd_", ch), height = "400px"),
              p(em("Interact: Hover to see values, double-click to reset zoom.")),
              hr(),
              gt_output(paste0("table_psd_", ch))
            )
          })
        )
      } else {
        tagList(
          hr(),
          h4("Power Spectral Density - Combined"),
          girafeOutput("plot_psd_multi", height = "400px"),
          p(em("Combined: each line is a Channel. Hover to inspect; double-click to reset.")),
          lapply(sels, function(ch) {
            tagList(
              hr(),
              h4(paste("Band Power - Channel:", ch)),
              gt_output(paste0("table_psd_", ch))
            )
          })
        )
      }
      
    } else {
      tagList(
        lapply(sels, function(ch) {
          tagList(
            hr(),
            h4(paste("Motor Imagery - Channel:", ch)),
            textOutput(paste0("mi_text_", ch))
          )
        })
      )
    }
  })
  
  observe({
    sels   <- selected_electrodes()
    df_erp <- simulated_erp_data()
    df_psd <- simulated_psd_data()
    if (!length(sels)) return()
    
    output$plot_erp_multi <- renderGirafe({
      req(input$data_type == "ERP")
      req(length(selected_electrodes()) > 0)
      sels_local <- selected_electrodes()
      df_multi <- df_erp %>% filter(Channel %in% sels_local)
      req(nrow(df_multi) > 0)
      
      y_max    <- max(abs(df_multi$GrandVoltage), na.rm = TRUE)
      y_limits <- c(-y_max, y_max)
      
      p <- ggplot(
        df_multi,
        aes(
          x      = Time_ms,
          y      = GrandVoltage,
          color  = Channel,
          linetype = Condition,
          group  = interaction(Channel, Condition)
        )
      ) +
        geom_hline(
          yintercept = 0,
          linetype   = "solid",
          color      = "gray50",
          linewidth  = 0.5,
          alpha      = 0.5
        ) +
        geom_vline(
          xintercept = 0,
          linetype   = "solid",
          color      = "black",
          linewidth  = 1
        ) +
        annotate(
          "text",
          x     = 0,
          y     = Inf,
          label = "Event",
          vjust = -0.5,
          hjust = 0.5,
          size  = 4,
          fontface = "bold",
          color    = "black"
        ) +
        geom_line_interactive(
          aes(
            tooltip = paste0(
              "Channel: ", Channel, '\n',
              "Condition: ", Condition
            ),
            data_id = paste(Channel, Condition)
          ),
          linewidth = 1.2
        ) +
        labs(
          title    = "ERP Waveforms - Combined",
          subtitle = "Lines: Channel × Condition",
          x        = "Time relative to event (ms)",
          y        = expression("Voltage (µV)")
        ) +
        scale_x_continuous(breaks = seq(-200, 800, 100)) +
        scale_y_continuous(limits = y_limits) +
        theme_classic(base_size = 14) +
        theme(
          plot.title    = element_text(hjust = 0.5, face = "bold"),
          plot.subtitle = element_text(hjust = 0.5, size = 10, color = "gray40"),
          axis.line     = element_line(color = "black"),
          axis.ticks    = element_line(color = "black"),
          axis.text     = element_text(color = "black"),
          panel.grid.major = element_blank(),
          panel.grid.minor = element_blank()
        )
      
      girafe(
        ggobj = p,
        width_svg  = 6,
        height_svg = 4,
        options = list(
          opts_hover(css = "stroke-width:4;"),
          opts_tooltip(zindex = 9999),
          opts_zoom(min = 0.5, max = 4),
          opts_sizing(rescale = TRUE, width = 1),
          opts_toolbar(saveaspng = TRUE)
        )
      )
    })
    
    output$plot_psd_multi <- renderGirafe({
      req(input$data_type == "PSD")
      req(length(selected_electrodes()) > 0)
      sels_local <- selected_electrodes()
      df_multi <- df_psd %>% filter(Channel %in% sels_local)
      req(nrow(df_multi) > 0)
      
      p <- ggplot(df_multi, aes(x = Frequency, y = Power, color = Channel, group = Channel)) +
        geom_line_interactive(
          aes(
            tooltip = paste0("Channel: ", Channel),
            data_id = Channel
          ),
          linewidth = 1.2
        ) +
        labs(
          title    = "Power Spectral Density - Combined",
          subtitle = "Lines: Channel",
          x        = "Frequency (Hz)",
          y        = "Power (µV²/Hz)"
        ) +
        scale_x_continuous(breaks = seq(0, 50, 5)) +
        theme_classic(base_size = 14) +
        theme(
          plot.title    = element_text(hjust = 0.5, face = "bold"),
          plot.subtitle = element_text(hjust = 0.5, size = 10, color = "gray40"),
          axis.line     = element_line(color = "black"),
          axis.ticks    = element_line(color = "black"),
          axis.text     = element_text(color = "black"),
          panel.grid.major.y = element_line(color = "gray90", linewidth = 0.3),
          panel.grid.minor   = element_blank()
        )
      
      girafe(
        ggobj = p,
        width_svg = 6,
        height_svg = 4,
        options = list(
          opts_hover(css = "stroke-width:4;"),
          opts_tooltip(zindex = 9999),
          opts_zoom(min = 0.5, max = 4),
          opts_sizing(rescale = TRUE, width = 1),
          opts_toolbar(saveaspng = TRUE)
        )
      )
    })
    
    for (ch in sels) {
      local({
        channel_name <- ch
        
        output[[paste0("plot_erp_", channel_name)]] <- renderGirafe({
          req(input$data_type == "ERP")
          df_channel <- df_erp %>% filter(Channel == channel_name)
          req(nrow(df_channel) > 0)
          y_max    <- max(abs(df_channel$GrandVoltage), na.rm = TRUE)
          y_limits <- c(-y_max, y_max)
          
          p <- ggplot(
            df_channel,
            aes(
              x     = Time_ms,
              y     = GrandVoltage,
              color = Condition,
              group = Condition
            )
          ) +
            geom_hline(
              yintercept = 0,
              linetype   = "solid",
              color      = "gray50",
              linewidth  = 0.5,
              alpha      = 0.5
            ) +
            geom_vline(
              xintercept = 0,
              linetype   = "solid",
              color      = "black",
              linewidth  = 1
            ) +
            annotate(
              "text",
              x     = 0,
              y     = Inf,
              label = "Event",
              vjust = -0.5,
              hjust = 0.5,
              size  = 4,
              fontface = "bold",
              color    = "black"
            ) +
            geom_line_interactive(
              aes(
                tooltip = paste0("Condition: ", Condition),
                data_id = Condition
              ),
              linewidth = 1.5
            ) +
            geom_point_interactive(
              aes(
                tooltip = paste0(
                  "Channel: ", channel_name, '\n',
                  "Condition: ", Condition, '\n',
                  "Time (ms): ", Time_ms, '\n',
                  "Voltage: ", sprintf('%.2f', GrandVoltage)
                ),
                data_id = paste(Condition, Time_ms)
              ),
              size  = 2,
              alpha = 0.7
            ) +
            labs(
              title    = paste("ERP Waveform - Channel:", channel_name),
              subtitle = "Hover over points to see values | Drag to zoom | Double-click to reset",
              x        = "Time relative to event (ms)",
              y        = expression("Voltage (µV)")
            ) +
            scale_x_continuous(breaks = seq(-200, 800, 100)) +
            scale_y_continuous(limits = y_limits) +
            scale_color_manual(
              values = c("Motion" = "#0072B2", "Nonmotion" = "#D55E00"),
              labels = c("Motion", "Nonmotion")
            ) +
            theme_classic(base_size = 14) +
            theme(
              plot.title    = element_text(hjust = 0.5, face = "bold"),
              plot.subtitle = element_text(hjust = 0.5, size = 10, color = "gray40"),
              legend.title  = element_blank(),
              legend.position = "top",
              axis.line     = element_line(color = "black"),
              axis.ticks    = element_line(color = "black"),
              axis.text     = element_text(color = "black"),
              panel.grid.major = element_blank(),
              panel.grid.minor = element_blank()
            )
          
          girafe(
            ggobj = p,
            width_svg  = 6,
            height_svg = 4,
            options = list(
              opts_hover(css = 'stroke-width:4;stroke:#FF5733;'),
              opts_tooltip(zindex = 9999),
              opts_zoom(min = 0.5, max = 4),
              opts_sizing(rescale = TRUE, width = 1),
              opts_toolbar(saveaspng = TRUE)
            )
          )
        })
        
        output[[paste0("table_erp_", channel_name)]] <- render_gt({
          req(input$data_type == "ERP")
          elec_data <- df_erp %>% filter(Channel == channel_name)
          
          n200_data <- elec_data %>%
            filter(Time_ms >= 150 & Time_ms <= 250)
          t_n200 <- t.test(GrandVoltage ~ Condition, data = n200_data)
          n200_means <- n200_data %>%
            group_by(Condition) %>%
            summarise(m = mean(GrandVoltage), .groups = "drop")
          
          p300_data <- elec_data %>%
            filter(Time_ms >= 250 & Time_ms <= 500)
          t_p300 <- t.test(GrandVoltage ~ Condition, data = p300_data)
          p300_means <- p300_data %>%
            group_by(Condition) %>%
            summarise(m = mean(GrandVoltage), .groups = "drop")
          
          stats_df <- data.frame(
            Component      = c("N200 (150-250ms)", "P300 (250-500ms)"),
            Motion.Mean    = c(
              n200_means$m[n200_means$Condition == "Motion"],
              p300_means$m[p300_means$Condition == "Motion"]
            ),
            Nonmotion.Mean = c(
              n200_means$m[n200_means$Condition == "Nonmotion"],
              p300_means$m[p300_means$Condition == "Nonmotion"]
            ),
            t_statistic    = c(t_n200$statistic, t_p300$statistic),
            p_value_raw    = c(t_n200$p.value,  t_p300$p.value)
          )
          
          stats_df$p_value_str <- ifelse(
            stats_df$p_value_raw < 0.001,
            "< 0.001",
            sprintf("%.3f", stats_df$p_value_raw)
          )
          
          motion_col    <- "#0072B2"
          nonmotion_col <- "#D55E00"
          
          stats_df %>%
            gt() %>%
            tab_header(
              title    = md(paste0("**Channel ", channel_name, " Statistics**")),
              subtitle = "Comparison of Mean Amplitudes (Welch's t-test)"
            ) %>%
            fmt_number(
              columns = c(Motion.Mean, Nonmotion.Mean, t_statistic),
              decimals = 3
            ) %>%
            tab_style(
              style = cell_text(color = motion_col, weight = "bold"),
              locations = cells_body(columns = Motion.Mean)
            ) %>%
            tab_style(
              style = cell_text(color = nonmotion_col, weight = "bold"),
              locations = cells_body(columns = Nonmotion.Mean)
            ) %>%
            tab_style(
              style = list(cell_text(color = "red", weight = "bold")),
              locations = cells_body(
                columns = p_value_str,
                rows    = p_value_raw < 0.05
              )
            ) %>%
            cols_label(
              Motion.Mean    = "Motion (µV)",
              Nonmotion.Mean = "Nonmotion (µV)",
              t_statistic    = "t-stat",
              p_value_str    = "p-value"
            ) %>%
            cols_hide(columns = p_value_raw) %>%
            cols_align(align = "center", columns = everything()) %>%
            tab_options(table.width = pct(100))
        })
        
        output[[paste0("table_psd_", channel_name)]] <- render_gt({
          req(input$data_type == "PSD")
          elec_data <- df_psd %>% dplyr::filter(Channel == channel_name)
          
          bands <- data.frame(
            Band     = c("Delta (0.5-4 Hz)", "Theta (4-8 Hz)", "Alpha (8-13 Hz)", 
                         "Beta (13-30 Hz)", "Gamma (30-50 Hz)"),
            Min_Freq = c(0.5, 4, 8, 13, 30),
            Max_Freq = c(4, 8, 13, 30, 50)
          )
          
          bands$Avg_Power <- sapply(1:nrow(bands), function(i) {
            band_data <- elec_data %>% 
              dplyr::filter(Frequency >= bands$Min_Freq[i] & Frequency <= bands$Max_Freq[i])
            mean(band_data$Power, na.rm = TRUE)
          })
          
          bands$Peak_Freq <- sapply(1:nrow(bands), function(i) {
            band_data <- elec_data %>% 
              dplyr::filter(Frequency >= bands$Min_Freq[i] & Frequency <= bands$Max_Freq[i])
            if (nrow(band_data) > 0) {
              band_data$Frequency[which.max(band_data$Power)]
            } else {
              NA
            }
          })
          
          bands %>%
            select(Band, Avg_Power, Peak_Freq) %>%
            gt() %>%
            tab_header(
              title = md(paste0("**Channel ", channel_name, " - Band Power**")),
              subtitle = "Average power in standard frequency bands"
            ) %>%
            fmt_number(
              columns = c(Avg_Power, Peak_Freq),
              decimals = 2
            ) %>%
            cols_label(
              Band      = "Frequency Band",
              Avg_Power = "Avg Power (µV²/Hz)",
              Peak_Freq = "Peak Frequency (Hz)"
            ) %>%
            cols_align(align = "center", columns = everything()) %>%
            tab_options(table.width = pct(100))
        })
        
        output[[paste0("mi_text_", channel_name)]] <- renderText({
          req(input$data_type == "MI")
          paste(
            "Motor imagery summary for",
            ifelse(input$modality == "EEG", "electrode", "optode"),
            channel_name,
            "under condition:",
            switch(input$mi_task,
                   real     = "Real Movement",
                   imagined = "Imagined Movement",
                   diff     = "Difference (Real - Imagined)",
                   input$mi_task)
          )
        })
      })
    }
  })
  
  observe({
    session$sendCustomMessage(
      "setBrodmannVisible",
      list(show = isTRUE(input$show_brodmann))
    )
  })
  
  observeEvent(input$reset_view, {
    session$sendCustomMessage("resetView", TRUE)
  })
}

runjs <- function(code) {
  session <- shiny::getDefaultReactiveDomain()
  session$sendCustomMessage("shiny-run-js", code)
}

shinyApp(ui = ui, server = server)