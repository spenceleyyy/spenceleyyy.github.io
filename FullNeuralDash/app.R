library(shiny)
library(base64enc)
library(ggplot2)
library(ggiraph)
library(dplyr)
library(readr)
library(gt)
library(png)
library(grid)
library(tibble)
library(shinyBS)
library(RColorBrewer)
library(viridisLite)

builtin_palettes <- list(
  "Brewer Set1"   = brewer.pal(8, "Set1"),
  "Brewer Dark2"  = brewer.pal(8, "Dark2"),
  "Brewer Accent" = brewer.pal(8, "Accent"),
  "Viridis"       = viridis(8),
  "Cividis"       = cividis(8),
  "Magma"         = magma(8)
)
default_palette_name <- names(builtin_palettes)[1]
default_motion_color <- builtin_palettes[[default_palette_name]][1]
default_nonmotion_color <- builtin_palettes[[default_palette_name]][2]

valid_hex <- function(x) {
  if (is.null(x) || !nzchar(x)) return(FALSE)
  grepl("^#([A-Fa-f0-9]{6})$", x)
}

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
      .capture-gallery {
        display:flex;
        flex-wrap:wrap;
        gap:18px;
        margin-top:16px;
        align-items:flex-start;
        justify-content:center;
      }
      .capture-card {
        width:420px;
        height:320px;
        border-radius:16px;
        overflow:hidden;
        border:1px solid rgba(0,0,0,0.12);
        position:relative;
        background:#fff;
        box-shadow:0 12px 24px rgba(0,0,0,0.08);
      }
      .capture-card img {
        width:100%;
        height:100%;
        object-fit:cover;
        display:block;
      }
      .capture-overlay {
        position:absolute;
        inset:0;
        background:rgba(0,0,0,0.55);
        opacity:0;
        transition:opacity 0.2s ease;
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:center;
        gap:6px;
      }
      .capture-card:hover .capture-overlay {
        opacity:1;
      }
      .capture-overlay .btn {
        width:120px;
        font-size:11px;
      }
    "))
  ),
  
  # Header
  div(id = "main_title_bar", h2("Interactive 3D Brain Model - 32 Channel System")),
  
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
                 div(class = "bs-collapse",
                     bsCollapse(
                       id = "analysis_sections",
                       open = c("analysis_data", "analysis_graphs"),
                       multiple = TRUE,
                       bsCollapsePanel(
                         "Data",
                         value = "analysis_data",
                         style = "primary",
                         wellPanel(style = "background: #f0f8ff;",
                                   h5(strong("Recording Modality")),
                                   selectInput("modality", NULL, choices = c("EEG" = "EEG", "fNIRS" = "fNIRS"), selected = "EEG")
                         ),
                         wellPanel(style = "background: #f9f9f9;",
                                   h5(strong("Data Type")),
                                   selectInput("data_type", NULL, 
                                               choices = c("ERP (Event-Related Potential)" = "ERP", 
                                                           "PSD (Power Spectral Density)" = "PSD", 
                                                           "Motor Imagery" = "MI",
                                                           "Hyperscanning Synchrony" = "Hyperscanning"), selected = "ERP")
                         ),
                         checkboxInput("plot_together", "Plot selected sensors on one graph", value = FALSE),
                         fileInput("sync_file", "Upload synchrony CSV (optional):", accept = c(".csv")),
                         fileInput("erp_file", "Upload ERP CSV (optional):", accept = c(".csv")),
                         uiOutput("erp_column_selectors"),
                         uiOutput("erp_condition_selector")
                       ),
                       bsCollapsePanel(
                         "Graphs",
                         value = "analysis_graphs",
                         style = "primary",
                         uiOutput("graph_control_panels")
                       )
                     ),
                     conditionalPanel(
                       condition = "input.data_type == 'Hyperscanning'",
                       tags$div(style = "margin-top:8px; padding:8px; border:1px dashed #888; border-radius:6px; background:#fdf6e3; color:#333;",
                                strong("Hyperscanning mode enforces the two-brain view."),
                                tags$br(),
                                "Please select left/right conditions and upload synchrony data (or rely on defaults)."
                       )
                     ))
        )
        ,
        tabPanel(
          "Settings",
          br(),
          h4("Analysis Settings"),
          fileInput("brain_file", "Upload .glb/.gltf Model (Optional)"),
          actionButton("start_region_select", "Select Region & Save PDF", class = "btn-info"),
          uiOutput("region_pdf_output"),
          checkboxInput("two_brain_mode", "Two-brain mode", value = FALSE),
          conditionalPanel(
            condition = "input.two_brain_mode == true",
            wellPanel(
              style = "background:#f5f5f5;",
              h5(strong("Conditions")),
              selectInput("left_condition", "Left Brain", choices = NULL),
              selectInput("right_condition", "Right Brain", choices = NULL)
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
                choices = c("All"="all", "Delta"="delta", "Theta"="theta", "Alpha"="alpha", "Beta"="beta", "Gamma"="gamma"),
                selected = "all"
              )
            )
          ),
          conditionalPanel(
            condition = "input.data_type == 'MI'",
            wellPanel(
              style = "background: #e8f4f8;",
              selectInput("mi_task", "MI Task", choices = c("Real"="real", "Imagined"="imagined", "Difference"="diff"), selected = "real")
            )
          )
        )
      ),
      
      hr(),
      actionButton("reset_view", "Reset Camera", class = "btn-primary")
    ),
    
    mainPanel(
      # Canvas Container
      tags$div(
        id = "canvas-container",
        style = "width: 100%; height: 600px; background-color: #f0f0f0; border: 1px solid #ccc; position: relative;",
        tags$canvas(id = "brain-canvas"),
        tags$div(id = "loading-message", 
                 style = "position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; display: none;", 
                 h4("Loading model...")),
        tags$div(
          style = "position:absolute; top:12px; right:12px; z-index:2100;",
          actionButton(
            "start_region_select_canvas",
            label = NULL,
            icon = icon("camera"),
            class = "btn-light btn-sm",
            style = "padding:6px 8px; border-radius:50%; box-shadow:0 2px 6px rgba(0,0,0,0.12);"
          )
        )
      ),
      uiOutput("legend_output")
      ,
      uiOutput("images_taken")
    )
  ),
  
  # --- JAVASCRIPT ---
  tags$script(HTML("
    var scene, camera, renderer, controls, brain, brainRight, animationId;
    var leftGroup, rightGroup;
    var clipPlanes = [
      new THREE.Plane(new THREE.Vector3(1, 0, 0), 1000),
      new THREE.Plane(new THREE.Vector3(0, 1, 0), 1000),
      new THREE.Plane(new THREE.Vector3(0, 0, 1), 1000)
    ];
    var crosshairGroup;
    var showCrosshair = true;
    var canvas;
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
    var brainSeparation = 7.0;
    var hyperscanLineSpecs = [];
    var hyperscanLines = [];
    var hyperscanHighlightInfo = {};
    var leftCondition = null;
    var rightCondition = null;
    var selectionMode = false;
    var selectionStart = null;
    var selectionOverlay = null;

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

    var pictureModeLocked = false;

    function lockControlsForPictureMode() {
      pictureModeLocked = true;
      controls.enableRotate = false;
      controls.enablePan = false;
      controls.enableZoom = false;
    }

    function restoreControlsAfterPictureMode() {
      pictureModeLocked = false;
      controls.enableRotate = !twoBrainMode;
      controls.enablePan = true;
      controls.enableZoom = false;
    }

    function initScene() {
      var container = document.getElementById('canvas-container');
      canvas = document.getElementById('brain-canvas');
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf0f0f0);

      leftGroup = new THREE.Group();
      rightGroup = new THREE.Group();
      scene.add(leftGroup);
      scene.add(rightGroup);

      createCrosshairs();

      camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
      camera.position.set(0, -6, 0);
      camera.up.set(0, 0, 1);
      camera.lookAt(0, 0, 0);

      renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.localClippingEnabled = true;
      renderer.outputEncoding = THREE.sRGBEncoding;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.enableZoom = false;

      var hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.75);
      hemiLight.position.set(0, 0, 5);
      scene.add(hemiLight);
      
      var dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
      dirLight.position.set(5, -5, 5);
      scene.add(dirLight);
      
      var backLight = new THREE.DirectionalLight(0xffffff, 0.6);
      backLight.position.set(-5, 5, -5);
      scene.add(backLight);

      var rimLight = new THREE.PointLight(0xffffff, 0.35, 20);
      rimLight.position.set(0, -10, 5);
      scene.add(rimLight);

      canvas.addEventListener('pointerdown', onPointerDown, false);
      canvas.addEventListener('pointerup', onPointerUp, false);
      canvas.addEventListener('pointerleave', onPointerUp, false);
      canvas.addEventListener('pointermove', onPointerMove, false);
      canvas.addEventListener('click', onMouseClick, false);
      window.addEventListener('resize', onWindowResize, false);

      animate();
    }

    function createCrosshairs() {
       crosshairGroup = new THREE.Group();
       var geoX = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-100,0,0), new THREE.Vector3(100,0,0)]);
       var geoY = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,-100,0), new THREE.Vector3(0,100,0)]);
       var geoZ = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0,0,-100), new THREE.Vector3(0,0,100)]);
       
       crosshairGroup.add(new THREE.Line(geoX, new THREE.LineBasicMaterial({ color: 0xff0000 })));
       crosshairGroup.add(new THREE.Line(geoY, new THREE.LineBasicMaterial({ color: 0x00ff00 })));
       crosshairGroup.add(new THREE.Line(geoZ, new THREE.LineBasicMaterial({ color: 0x0000ff })));
       
       crosshairGroup.visible = false;
       scene.add(crosshairGroup);
    }

    function moveCrosshairs(pos) {
       if(!showCrosshair) return;
       crosshairGroup.position.copy(pos);
       crosshairGroup.visible = true;
    }

    function onPointerDown(event) {
      mouseDownPos.x = event.clientX;
      mouseDownPos.y = event.clientY;
      if (twoBrainMode && event.button === 0) {
          isDragging = true;
          previousMousePosition = { x: event.clientX, y: event.clientY };
      }
      if (selectionMode) {
         var rect = renderer.domElement.getBoundingClientRect();
         selectionStart = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
         };
         setSelectionOverlayRect(selectionStart.x, selectionStart.y, 0, 0);
      }
    }
    
    function onPointerUp(event) {
      isDragging = false;
      if (!selectionMode) return;
      if (selectionStart) {
         var rect = renderer.domElement.getBoundingClientRect();
         var endX = event.clientX - rect.left;
         var endY = event.clientY - rect.top;
         finalizeRegionSelection(selectionStart.x, selectionStart.y, endX, endY);
      }
      selectionMode = false;
      selectionStart = null;
      setSelectionOverlayRect(0, 0, 0, 0);
      restoreControlsAfterPictureMode();
    }
    
    function onPointerMove(event) {
      var allSpheres = eegSpheres.concat(eegSpheresRight);
      if (allSpheres.length) {
          var rect = renderer.domElement.getBoundingClientRect();
          mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
          raycaster.setFromCamera(mouse, camera);
          var intersects = raycaster.intersectObjects(allSpheres);
          document.body.style.cursor = (intersects.length > 0) ? 'pointer' : 'default';
      }

      if (selectionMode && selectionStart) {
         var rect = renderer.domElement.getBoundingClientRect();
         var current = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
         };
         var left = Math.min(selectionStart.x, current.x);
         var top = Math.min(selectionStart.y, current.y);
         var width = Math.abs(current.x - selectionStart.x);
         var height = Math.abs(current.y - selectionStart.y);
         setSelectionOverlayRect(left, top, width, height);
      }

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

    function ensureSelectionOverlay() {
       if (selectionOverlay) return selectionOverlay;
       var overlay = document.createElement('div');
       overlay.style.position = 'absolute';
       overlay.style.border = '2px dashed #007bff';
       overlay.style.background = 'rgba(0, 123, 255, 0.15)';
       overlay.style.pointerEvents = 'none';
       overlay.style.zIndex = 2050;
       document.getElementById('canvas-container').appendChild(overlay);
       selectionOverlay = overlay;
       return overlay;
    }

    function setSelectionOverlayRect(left, top, width, height) {
       var overlay = ensureSelectionOverlay();
       overlay.style.left = Math.max(0, left) + 'px';
       overlay.style.top = Math.max(0, top) + 'px';
       overlay.style.width = Math.max(0, width) + 'px';
       overlay.style.height = Math.max(0, height) + 'px';
       overlay.style.display = (width > 2 && height > 2) ? 'block' : 'none';
    }

    function clamp(value, min, max) {
       return Math.max(min, Math.min(max, value));
    }

    function finalizeRegionSelection(x1, y1, x2, y2) {
       var left = Math.min(x1, x2);
       var top = Math.min(y1, y2);
       var width = Math.abs(x2 - x1);
       var height = Math.abs(y2 - y1);
       if (width < 4) width = 4;
       if (height < 4) height = 4;
       var rect = renderer.domElement.getBoundingClientRect();
       var scaleX = rect.width > 0 ? (canvas.width / rect.width) : 1;
       var scaleY = rect.height > 0 ? (canvas.height / rect.height) : 1;
       var srcLeft = clamp(Math.round(left * scaleX), 0, canvas.width);
       var srcTop = clamp(Math.round(top * scaleY), 0, canvas.height);
       var rawWidth = width * scaleX;
       var rawHeight = height * scaleY;
       var maxWidth = Math.max(1, canvas.width - srcLeft);
       var maxHeight = Math.max(1, canvas.height - srcTop);
       var srcWidth = Math.min(Math.max(1, Math.round(rawWidth)), maxWidth);
       var srcHeight = Math.min(Math.max(1, Math.round(rawHeight)), maxHeight);
       if (srcWidth <= 0 || srcHeight <= 0) return;
       var qualityScale = 2;
       var tempCanvas = document.createElement('canvas');
       tempCanvas.width = Math.round(srcWidth * qualityScale);
       tempCanvas.height = Math.round(srcHeight * qualityScale);
       var ctx = tempCanvas.getContext('2d');
       ctx.drawImage(
         canvas,
         srcLeft, srcTop, srcWidth, srcHeight,
         0, 0, tempCanvas.width, tempCanvas.height
       );
       var dataURL = tempCanvas.toDataURL('image/png');
       if (typeof Shiny !== 'undefined') {
         Shiny.setInputValue('selected_region_image', dataURL, {priority: 'event'});
       }
    }

    function makeTextSprite(message) {
      var ratio = Math.min(Math.max(window.devicePixelRatio || 1, 1), 3.5);
      var baseSize = 520;
      var canvas = document.createElement('canvas');
      canvas.width = baseSize * ratio;
      canvas.height = baseSize * ratio;
      var ctx = canvas.getContext('2d');
      ctx.scale(ratio, ratio);
      ctx.font = 'bold 170px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.95)';
      ctx.lineWidth = 14;
      ctx.lineJoin = 'round';
      ctx.miterLimit = 2;
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = 8;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.strokeText(message, baseSize / 2, baseSize / 2 + 4);
      ctx.fillStyle = '#fff3df';
      ctx.fillText(message, baseSize / 2, baseSize / 2 + 4);
      var texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.needsUpdate = true;
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
      eegSpheres.forEach(function(s) { leftGroup.remove(s); });
      eegLabels.forEach(function(l) { leftGroup.remove(l); });
      eegSpheresRight.forEach(function(s) { rightGroup.remove(s); });
      eegLabelsRight.forEach(function(l) { rightGroup.remove(l); });
      eegSpheres = [];
      eegLabels  = [];
      eegSpheresRight = [];
      eegLabelsRight = [];
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
      var surfacePos = new THREE.Vector3(
        dir.x * size.x / 2 * 1.1,
        dir.y * size.y / 2 * 1.1,
        dir.z * size.z / 2 * 1.1
      );
      return surfacePos.add(brainCenter);
    }

    // Hide labels on the back side of the brain (relative to camera)
    function updateLabelVisibility() {
      var labelSprites = eegLabels.concat(eegLabelsRight);
      if (!labelSprites.length) return;
      var camPos = camera.position.clone();
      var toCamera = camPos.clone().sub(brainCenter).normalize();
      labelSprites.forEach(function(sprite) {
        var worldPos = new THREE.Vector3();
        sprite.getWorldPosition(worldPos);
        var toLabel = worldPos.sub(brainCenter).normalize();
        var dot = toLabel.dot(toCamera);
        sprite.visible = (dot > 0); // only show labels facing camera
      });
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

       all.forEach(function(s) {
          var lbl = s.userData.label;
          var side = s.userData.brainSide;
          s.material.emissive.setHex(0x000000);
          s.material.opacity = 1.0; 
          s.material.transparent = false; 

          if(twoBrainMode && currentDataType === 'ERP' && electrodePValues.layout === '2brain_means') {
             var val = (side === 'left') ? (electrodePValues.left ? electrodePValues.left[lbl] : undefined) 
                                         : (electrodePValues.right ? electrodePValues.right[lbl] : undefined);
             if(val !== undefined) {
                var t = (val - (-5)) / (10 - (-5));
                s.material.color.setHex(getGradientColor(t));
             } else { s.material.color.setHex(0xcccccc); }
             return;
          }

          if(twoBrainMode && currentDataType === 'PSD' && electrodePowerValues.layout === '2brain_means') {
              var val = (side === 'left') ? (electrodePowerValues.left ? electrodePowerValues.left[lbl] : undefined) 
                                          : (electrodePowerValues.right ? electrodePowerValues.right[lbl] : undefined);
              if(val !== undefined && electrodePowerValues.min !== undefined) {
                 s.material.color.setHex(powerToColor(val, electrodePowerValues.min, electrodePowerValues.max));
              } else { s.material.color.setHex(0xcccccc); }
              return;
          }

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
          } else if (currentDataType === 'Hyperscanning') {
             s.material.color.setHex(0xbbbbbb);
             s.material.opacity = 1.0;
             s.material.transparent = false;
          }

          if (currentDataType === 'Hyperscanning') {
             var highlight = hyperscanHighlightInfo[lbl];
             if (highlight) {
                s.material.color.setHex(highlight.color);
                s.material.emissive.setHex(0x222222);
                s.scale.set(1.25, 1.25, 1.25);
             } else {
                s.scale.set(1, 1, 1);
                s.material.emissive.setHex(0x000000);
             }
          } else {
             s.scale.set(1, 1, 1);
          }
       });
    }

    function createEEGElectrodes(config) {
      clearEEGElectrodes();
      if (!brainLoaded) return;
      var list = electrodes_32;
      var sensorSize = 0.15;
      list.forEach(function(elec) {
        var pos = asaToSurfacePosition(elec.x, elec.y, elec.z);
        leftGroup.worldToLocal(pos);
        var mat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.2, roughness: 0.2 });
        if (currentModality !== 'EEG') mat.color.setHex(0xcc0000);
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
      rebuildHyperscanLines();
    }

    function duplicateRightElectrodes() {
      eegSpheresRight.forEach(function(s) { rightGroup.remove(s); });
      eegLabelsRight.forEach(function(l) { rightGroup.remove(l); });
      eegSpheresRight = [];
      eegLabelsRight = [];

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

    function findElectrodeSphere(label, side) {
       var list = (side === 'right') ? eegSpheresRight : eegSpheres;
       for(var i=0; i<list.length; i++) {
          if(list[i] && list[i].userData && list[i].userData.label === label) return list[i];
       }
       return null;
    }

    function clearHyperscanLines() {
       hyperscanLines.forEach(function(line) {
          if(line.geometry) line.geometry.dispose();
          scene.remove(line);
       });
       hyperscanLines = [];
    }

    function hyperscanColor(spec) {
       var strength = spec.strength !== undefined ? Math.min(1, Math.max(0, spec.strength)) : 0.25;
       var baseHue = (spec.difference >= 0) ? 0.58 : 0.02;
       var saturation = Math.min(1, 0.65 + 0.3 * strength);
       var lightness = Math.max(0.15, 0.7 - 0.45 * strength);
       var color = new THREE.Color();
       color.setHSL(baseHue, saturation, lightness);
       return color;
    }

    function hyperscanWidth(spec) {
       var strength = spec.strength !== undefined ? Math.min(1, Math.max(0, spec.strength)) : 0.25;
       return 1 + 3.5 * strength;
    }

    function refreshHyperscanHighlights() {
       hyperscanHighlightInfo = {};
       hyperscanLineSpecs.forEach(function(spec) {
          if(!spec.significant) return;
          var color = hyperscanColor(spec).getHex();
          hyperscanHighlightInfo[spec.label] = { color: color, width: hyperscanWidth(spec) };
       });
    }

    function rebuildHyperscanLines() {
       clearHyperscanLines();
       if(!twoBrainMode || !hyperscanLineSpecs.length) return;
       hyperscanLineSpecs.forEach(function(spec) {
          if(!spec.significant) return;
          var material = new THREE.LineBasicMaterial({
             color: hyperscanColor(spec),
             transparent: true,
             opacity: 0.9
          });
          material.linewidth = hyperscanWidth(spec);
          var geometry = new THREE.BufferGeometry();
          var line = new THREE.Line(geometry, material);
          line.userData = { label: spec.label, spec: spec };
          hyperscanLines.push(line);
          scene.add(line);
       });
       updateHyperscanLinePositions();
    }

    function updateHyperscanLinePositions() {
       if(!hyperscanLines.length) return;
       hyperscanLines.forEach(function(line) {
          var label = line.userData.label;
          var leftSphere = findElectrodeSphere(label, 'left');
          var rightSphere = findElectrodeSphere(label, 'right');
          if(!leftSphere || !rightSphere) {
             line.visible = false;
             return;
          }
          var start = new THREE.Vector3(); leftSphere.getWorldPosition(start);
          var end = new THREE.Vector3(); rightSphere.getWorldPosition(end);
          var mid = start.clone().lerp(end, 0.5);
          mid.z += 2.0;
          var curve = new THREE.CatmullRomCurve3([start, mid, end]);
          var points = curve.getPoints(60);
          if(line.geometry) line.geometry.dispose();
          line.geometry = new THREE.BufferGeometry().setFromPoints(points);
          line.visible = true;
       });
    }

    function setHyperscanLineSpecs(specs) {
       hyperscanLineSpecs = Array.isArray(specs) ? specs : [];
       refreshHyperscanHighlights();
       rebuildHyperscanLines();
    }

    function clearBrodmann() {
      for (var i = 0; i < brodmannMeshes.length; i++) {
        scene.remove(brodmannMeshes[i]);
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
        scene.add(mesh);
      });
    }

    function loadModel(fileDataUrl) {
      document.getElementById('loading-message').style.display = 'block';
      if (brain) {
        leftGroup.remove(brain);
        brain = null;
      }
      if (brainRight) {
        rightGroup.remove(brainRight);
        brainRight = null;
      }
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
                color: 0xeeeeee,
                metalness: 0.1,
                roughness: 0.5
              });
              child.material.side = THREE.DoubleSide;
            }
          });

          var box   = new THREE.Box3().setFromObject(brain);
          var center = box.getCenter(new THREE.Vector3());
          var size   = box.getSize(new THREE.Vector3());
          var maxDim = Math.max(size.x, size.y, size.z);
          var scale  = 4 / maxDim;
          brain.scale.multiplyScalar(scale);
          brain.position.sub(center.multiplyScalar(scale));
          brain.rotation.z = Math.PI;
          brain.updateMatrixWorld();

          brainBBox   = new THREE.Box3().setFromObject(brain);
          brainCenter = brainBBox.getCenter(new THREE.Vector3());
          brainLoaded = true;
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
      updateLabelVisibility(); // hide labels on back side
      updateHyperscanLinePositions();
      renderer.render(scene, camera);
    }

    function onWindowResize() {
      var container = document.getElementById('canvas-container');
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    }

    function resetView() {
      camera.position.set(0, -6, 0);
      camera.up.set(0, 0, 1);
      camera.lookAt(0, 0, 0);
      controls.update();
    }

    document.addEventListener('DOMContentLoaded', function() {
      initScene();
      var regionButton = document.getElementById('start_region_select');
      var regionButtonCanvas = document.getElementById('start_region_select_canvas');
      function engagePictureMode() {
        selectionMode = true;
        selectionStart = null;
        setSelectionOverlayRect(0, 0, 0, 0);
        lockControlsForPictureMode();
      }
      if (regionButton) {
        regionButton.addEventListener('click', engagePictureMode);
      }
      if (regionButtonCanvas) {
        regionButtonCanvas.addEventListener('click', engagePictureMode);
      }
    });

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
      Shiny.addCustomMessageHandler('updateElectrodePower', function(m) { electrodePowerValues = m; updateVisuals(); });
      Shiny.addCustomMessageHandler('setModality', function(m) {
        currentModality = (m && m.modality) ? m.modality : 'EEG';
        createEEGElectrodes();
      });
      Shiny.addCustomMessageHandler('setTwoBrainMode', function(m) {
        twoBrainMode = !!(m && m.enabled);
        arrangeBrains();
        updateVisuals();
      });
      Shiny.addCustomMessageHandler('setBrainConditions', function(m) {
        leftCondition = (m && m.left) ? m.left : null;
        rightCondition = (m && m.right) ? m.right : null;
      });
      Shiny.addCustomMessageHandler('updateHyperscanLinks', function(m) { setHyperscanLineSpecs(m && m.links ? m.links : []); });
      Shiny.addCustomMessageHandler('shiny-run-js', function(code) {
        eval(code);
      });
    }
  "))
)

channel_list <- c("Fp1", "Fpz", "Fp2", "F7", "F3", "Fz", "F4", "F8",
                  "FC5", "FC1", "FC2", "FC6", "T7", "C3", "Cz", "C4", "T8",
                  "CP5", "CP1", "CP2", "CP6", "P7", "P3", "Pz", "P4", "P8",
                  "POz", "O1", "Oz", "O2", "AFz", "FCz")
default_sync_conditions <- c("Motion", "Nonmotion")

server <- function(input, output, session) {
  
  # --- Analysis Logic ---
  
  detect_column <- function(df, candidates) {
    for (cand in candidates) {
      if (cand %in% names(df)) return(cand)
    }
    NULL
  }
  
  selected_electrodes <- reactiveVal(character(0))
  region_pdf_info <- reactiveVal(list(path = NULL, name = NULL))
  region_png_info <- reactiveVal(list(path = NULL, name = NULL))
  photos_list <- reactiveVal(list())
  photo_observer_ids <- reactiveVal(character(0))
  gallery_selected_download <- reactiveVal(NULL)
  
  output$region_pdf_output <- renderUI({
    tags$div(style = "padding:8px 0; font-size:14px; color:#555;",
             "Captured images appear below the brain. Hover over each to view, download, or remove it.")
  })
  
  get_capture_by_id <- function(id) {
    if (is.null(id)) return(NULL)
    photos <- photos_list()
    for (entry in photos) {
      if (!is.null(entry$id) && entry$id == id) return(entry)
    }
    NULL
  }
  
  output$gallery_download_pdf <- downloadHandler(
    filename = function() {
      entry <- get_capture_by_id(gallery_selected_download())
      req(entry)
      if (!is.null(entry$pdf_name)) entry$pdf_name else paste0(entry$id, ".pdf")
    },
    content = function(file) {
      entry <- get_capture_by_id(gallery_selected_download())
      req(entry, entry$pdf_path)
      file.copy(entry$pdf_path, file, overwrite = TRUE)
    }
  )
  
  output$gallery_download_png <- downloadHandler(
    filename = function() {
      entry <- get_capture_by_id(gallery_selected_download())
      req(entry)
      if (!is.null(entry$png_name)) entry$png_name else paste0(entry$id, ".png")
    },
    content = function(file) {
      entry <- get_capture_by_id(gallery_selected_download())
      req(entry, entry$png_path)
      file.copy(entry$png_path, file, overwrite = TRUE)
    }
  )
  palette_state <- reactiveValues(
    palette = default_palette_name,
    motion = default_motion_color,
    nonmotion = default_nonmotion_color
  )
  
  run_selected_test <- function(data, method) {
    if (n_distinct(data$Condition) < 2 || nrow(data) < 4) return(NA_real_)
    method <- if (is.null(method)) "wilcox" else method
    tryCatch({
      switch(
        method,
        wilcox   = wilcox.test(GrandVoltage ~ Condition, data = data)$p.value,
        kruskal  = kruskal.test(GrandVoltage ~ Condition, data = data)$p.value,
        student_t = t.test(GrandVoltage ~ Condition, data = data, var.equal = TRUE)$p.value,
        welch_t   = t.test(GrandVoltage ~ Condition, data = data, var.equal = FALSE)$p.value,
        anova_f   = {
          fit <- aov(GrandVoltage ~ Condition, data = data)
          summary(fit)[[1]][["Pr(>F)"]][1]
        },
        NA_real_
      )
    }, error = function(e) NA_real_)
  }
  
  erp_colors <- reactive({
    if (isTRUE(input$erp_custom_colors)) {
      motion <- input$erp_color_motion
      nonmotion <- input$erp_color_nonmotion
    } else {
      motion <- palette_state$motion
      nonmotion <- palette_state$nonmotion
    }
    if (!valid_hex(motion)) motion <- default_motion_color
    if (!valid_hex(nonmotion)) nonmotion <- default_nonmotion_color
    c(Motion = motion, Nonmotion = nonmotion)
  })
  
  erp_highlight_range <- reactive({
    start <- suppressWarnings(as.numeric(input$erp_highlight_start))
    end   <- suppressWarnings(as.numeric(input$erp_highlight_end))
    if (any(is.na(c(start, end)))) return(NULL)
    if (!is.finite(start) || !is.finite(end) || start >= end) return(NULL)
    c(start, end)
  })
  
  observeEvent(input$erp_palette_choice, {
    pal <- builtin_palettes[[input$erp_palette_choice]]
    if (is.null(pal) || !length(pal)) return()
    palette_state$palette <- input$erp_palette_choice
    palette_state$motion <- pal[1]
    palette_state$nonmotion <- pal[min(2, length(pal))]
  }, ignoreInit = TRUE)
  
  observeEvent(input$erp_motion_choice, {
    req(!isTRUE(input$erp_custom_colors))
    pal <- builtin_palettes[[palette_state$palette]]
    if (is.null(pal) || !length(pal)) pal <- unlist(builtin_palettes, use.names = FALSE)
    palette_state$motion <- input$erp_motion_choice
    allowed <- pal[pal != input$erp_motion_choice]
    if (!length(allowed)) allowed <- pal
    if (!palette_state$nonmotion %in% allowed) palette_state$nonmotion <- allowed[1]
  }, ignoreInit = TRUE)
  
  observeEvent(input$erp_nonmotion_choice, {
    req(!isTRUE(input$erp_custom_colors))
    pal <- builtin_palettes[[palette_state$palette]]
    if (is.null(pal) || !length(pal)) pal <- unlist(builtin_palettes, use.names = FALSE)
    allowed <- pal[pal != palette_state$motion]
    if (!length(allowed)) allowed <- pal
    if (input$erp_nonmotion_choice %in% allowed) palette_state$nonmotion <- input$erp_nonmotion_choice
  }, ignoreInit = TRUE)
  
  output$erp_palette_swatches <- renderUI({
    pal <- builtin_palettes[[palette_state$palette]]
    if (is.null(pal) || !length(pal)) pal <- unlist(builtin_palettes, use.names = FALSE)
    pal <- unique(pal)
    current_motion <- palette_state$motion
    if (is.null(current_motion) || !current_motion %in% pal) current_motion <- pal[1]
    allowed_non <- pal[pal != current_motion]
    if (!length(allowed_non)) allowed_non <- pal
    current_non <- palette_state$nonmotion
    if (is.null(current_non) || !current_non %in% allowed_non) current_non <- allowed_non[1]
    
    motion_swatches <- lapply(pal, function(col) {
      classes <- "swatch-tile"
      if (identical(col, current_motion)) classes <- paste(classes, "swatch-selected")
      tags$div(
        class = classes,
        style = paste0("background:", col, ";"),
        title = col,
        onclick = sprintf("Shiny.setInputValue('%s','%s',{priority:'event'})", "erp_motion_choice", col)
      )
    })
    
    non_swatches <- lapply(pal, function(col) {
      classes <- "swatch-tile"
      if (!col %in% allowed_non) classes <- paste(classes, "swatch-disabled")
      if (identical(col, current_non)) classes <- paste(classes, "swatch-selected")
      tags$div(
        class = classes,
        style = paste0("background:", col, ";"),
        title = col,
        onclick = sprintf("Shiny.setInputValue('%s','%s',{priority:'event'})", "erp_nonmotion_choice", col)
      )
    })
    
    tagList(
      tags$label("Palette (recommended)"),
      tags$div("Motion", style = "font-size:12px; color:#555; margin-top:4px;"),
      tags$div(class = "swatch-grid", motion_swatches),
      tags$div("Nonmotion", style = "font-size:12px; color:#555; margin-top:8px;"),
      tags$div(class = "swatch-grid", non_swatches)
    )
  })
  
  output$graph_control_panels <- renderUI({
    req(input$data_type)
    if (input$data_type == "ERP") {
      div(class = "bs-collapse",
          bsCollapse(
            id = "graph_sections",
            open = c("graph_time", "graph_annotations", "graph_colors"),
            multiple = TRUE,
            bsCollapsePanel(
              "Time Window (x-axis)",
              value = "graph_time",
              style = "info",
              uiOutput("erp_time_window")
            ),
            bsCollapsePanel(
              "Annotations",
              value = "graph_annotations",
              style = "info",
              checkboxInput("erp_show_vline", "Show reference (dashed) line", value = TRUE),
              numericInput("erp_vline_at", "Reference line at (ms)", value = 0, step = 10),
              fluidRow(
                column(6, numericInput("erp_highlight_start", "Highlight start (ms, optional)", value = NA, step = 10)),
                column(6, numericInput("erp_highlight_end", "Highlight end (ms, optional)", value = NA, step = 10))
              )
            ),
            bsCollapsePanel(
              "Colors",
              value = "graph_colors",
              style = "info",
              selectInput(
                "erp_palette_choice",
                "Built-in palette",
                choices = names(builtin_palettes),
                selected = default_palette_name,
                width = "220px"
              ),
              uiOutput("erp_palette_swatches"),
              tags$div(
                style = "margin-top:6px;",
                checkboxInput("erp_custom_colors", "More colors (override palette)", value = FALSE)
              ),
              conditionalPanel(
                condition = "input.erp_custom_colors == true",
                tags$div(
                  style = "display:flex; gap:10px; flex-wrap:wrap; margin-top:6px; align-items:flex-end;",
                  tags$div(
                    tags$label("Motion color"),
                    tags$input(id = "erp_color_motion", type = "color", value = default_motion_color, class = "form-control", style = "padding:0; height:38px; width:90px;")
                  ),
                  tags$div(
                    tags$label("Nonmotion color"),
                    tags$input(id = "erp_color_nonmotion", type = "color", value = default_nonmotion_color, class = "form-control", style = "padding:0; height:38px; width:90px;")
                  )
                )
              )
            )
          )
      )
    } else if (input$data_type == "Hyperscanning") {
      div(class = "bs-collapse",
          bsCollapse(
            id = "hyperscan_sections",
            open = c("hyperscan_filters", "hyperscan_display"),
            multiple = TRUE,
            bsCollapsePanel(
              "Hyperscanning thresholds",
              value = "hyperscan_filters",
              style = "info",
              sliderInput("hyperscan_diff_threshold", "Minimum absolute synchrony difference to show a link", min = 0, max = 0.5, value = 0.08, step = 0.01),
              sliderInput("hyperscan_p_threshold", "Maximum p-value for significance", min = 0, max = 0.2, value = 0.05, step = 0.005),
              selectInput("hyperscan_sort_links", "Order links by", choices = c("Absolute difference" = "abs", "Left mean" = "left", "Right mean" = "right"), selected = "abs")
            ),
            bsCollapsePanel(
              "Bar display",
              value = "hyperscan_display",
              style = "info",
              checkboxInput("hyperscan_only_significant", "Only draw links for significant channels", value = TRUE),
              checkboxInput("hyperscan_show_axis_labels", "Show axis labels on bar graphs", value = TRUE),
              checkboxInput("hyperscan_highlight_left", "Highlight left-favoring bars (blue)", value = TRUE)
            )
          )
      )
    } else if (input$data_type == "PSD") {
      wellPanel(
        style = "background:#f6f4ff; border-radius:6px;",
        h5("PSD controls"),
        sliderInput("psd_freq_focus", "Frequency focus (Hz)", min = 0.5, max = 50, value = c(1, 30), step = 0.5),
        checkboxInput("psd_show_grid", "Show grid", value = TRUE)
      )
    } else if (input$data_type == "MI") {
      wellPanel(
        style = "background:#f1fbf7; border-radius:6px;",
        h5("Motor Imagery options"),
        checkboxInput("mi_show_activation", "Highlight motor electrodes", value = TRUE),
        selectInput("mi_plot_style", "Plot style", choices = c("Lines"="line", "Dots"="point"), selected = "line")
      )
    } else {
      tags$div(style = "padding:10px; background:#fff;", "Graph controls appear once a data type is selected.")
    }
  })
  
  # Helpers to guess columns from incoming data
  guess_col <- function(patterns, cols) {
    found <- cols[tolower(cols) %in% tolower(patterns)]
    if (length(found)) return(found[1])
    hits <- sapply(patterns, function(p) {
      m <- grep(p, cols, ignore.case = TRUE, value = TRUE)
      if (length(m)) return(m[1])
      return(NA_character_)
    })
    hits <- hits[!is.na(hits)]
    if (length(hits)) hits[1] else cols[1]
  }
  
  # ERP data ingestion
  erp_data_raw <- reactive({
    if (!is.null(input$erp_file)) {
      tryCatch(
        read_csv(input$erp_file$datapath, show_col_types = FALSE),
        error = function(e) {
          showNotification(paste("Error reading CSV:", e$message), type = "error")
          return(tibble())
        }
      )
    } else {
      simulated_erp_data()
    }
  })
  
  output$erp_column_selectors <- renderUI({
    df <- erp_data_raw()
    cols <- names(df)
    req(length(cols) > 0)
    
    defaults <- list(
      time     = guess_col(c("Time_ms", "Time", "ms"), cols),
      channel  = guess_col(c("Channel", "Electrode", "Ch"), cols),
      condition= guess_col(c("Condition", "Task", "Group"), cols),
      value    = guess_col(c("GrandVoltage", "Voltage", "Amplitude", "Value"), cols)
    )
    
    tagList(
      selectInput("erp_time_col", "Time column", choices = cols, selected = defaults$time),
      selectInput("erp_channel_col", "Channel column", choices = cols, selected = defaults$channel),
      selectInput("erp_condition_col", "Condition column", choices = cols, selected = defaults$condition),
      selectInput("erp_value_col", "Amplitude column", choices = cols, selected = defaults$value)
    )
  })
  
  erp_data_mapped <- reactive({
    df <- erp_data_raw()
    req(nrow(df) > 0, input$erp_time_col, input$erp_channel_col, input$erp_condition_col, input$erp_value_col)
    
    df %>%
      rename(
        Time_ms      = all_of(input$erp_time_col),
        Channel      = all_of(input$erp_channel_col),
        Condition    = all_of(input$erp_condition_col),
        GrandVoltage = all_of(input$erp_value_col)
      ) %>%
      mutate(
        Time_ms      = as.numeric(Time_ms),
        GrandVoltage = as.numeric(GrandVoltage),
        Channel      = as.character(Channel),
        Condition    = as.character(Condition)
      ) %>%
      filter(!is.na(Time_ms), !is.na(GrandVoltage))
  })
  
  output$erp_time_window <- renderUI({
    df <- erp_data_mapped()
    req(nrow(df) > 0)
    rng <- range(df$Time_ms, na.rm = TRUE)
    if (!all(is.finite(rng))) return(NULL)
    step_val <- max(1, round(diff(rng) / 100))
    min_val <- floor(rng[1])
    max_val <- ceiling(rng[2])
    tagList(
      sliderInput(
        "erp_time_limits",
        "Time window (ms)",
        min   = min_val,
        max   = max_val,
        value = c(min_val, max_val),
        step  = step_val
      ),
      fluidRow(
        column(
          6,
          numericInput("erp_time_min_input", "Start (ms)", value = min_val, step = step_val)
        ),
        column(
          6,
          numericInput("erp_time_max_input", "End (ms)", value = max_val, step = step_val)
        )
      )
    )
  })
  
  output$erp_condition_selector <- renderUI({
    df <- erp_data_mapped()
    req(nrow(df) > 0)
    conds <- sort(unique(df$Condition))
    selectInput(
      "erp_condition_filter",
      "Conditions to plot",
      choices  = conds,
      selected = conds,
      multiple = TRUE
    )
  })
  
  # Keep slider and numeric inputs in sync
  observeEvent(input$erp_time_limits, {
    req(length(input$erp_time_limits) == 2)
    updateNumericInput(session, "erp_time_min_input", value = input$erp_time_limits[1])
    updateNumericInput(session, "erp_time_max_input", value = input$erp_time_limits[2])
  })
  
  observeEvent(
    {
      input$erp_time_min_input
      input$erp_time_max_input
    },
    {
      if (is.null(input$erp_time_min_input) || is.null(input$erp_time_max_input)) return()
      if (!is.finite(input$erp_time_min_input) || !is.finite(input$erp_time_max_input)) return()
      if (input$erp_time_min_input >= input$erp_time_max_input) return()
      updateSliderInput(
        session,
        "erp_time_limits",
        value = c(input$erp_time_min_input, input$erp_time_max_input)
      )
    }
  )
  
  erp_filtered_data <- reactive({
    df <- erp_data_mapped()
    if (!is.null(input$erp_condition_filter)) {
      df <- df %>% filter(Condition %in% input$erp_condition_filter)
    }
    if (!is.null(input$erp_time_limits)) {
      df <- df %>% filter(
        Time_ms >= input$erp_time_limits[1],
        Time_ms <= input$erp_time_limits[2]
      )
    }
    df
  })
  
  # Data Generators
  triggerPictureModeNotification <- function() {
    showNotification("Drag on the brain view to select the export region. Release to save as PDF.", type = "message", duration = 4)
  }
  observeEvent(input$start_region_select, triggerPictureModeNotification)
  observeEvent(input$start_region_select_canvas, triggerPictureModeNotification)
  
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
  
  observeEvent(input$selected_region_image, {
    data_url <- input$selected_region_image
    if (!nzchar(data_url)) return()
    base64data <- sub("^data:image/png;base64,", "", data_url)
    raw_img <- tryCatch(
      base64enc::base64decode(base64data),
      error = function(e) {
        showNotification(paste("Error decoding selection:", e$message), type = "error")
        NULL
      }
    )
    req(!is.null(raw_img))
    if (!length(raw_img)) {
      showNotification("Captured image appears empty; please try again.", type = "error")
      return()
    }
    
    img <- tryCatch({
      png::readPNG(raw_img)
    }, error = function(e) {
      showNotification(paste("Error reading cropped PNG:", e$message), type = "error")
      NULL
    })
    req(!is.null(img))
    
    width <- dim(img)[2]
    height <- dim(img)[1]
    timestamp <- format(Sys.time(), "%Y%m%d_%H%M%S")
    base_name <- paste0("region_capture_", timestamp)
    png_path <- file.path(tempdir(), paste0(base_name, ".png"))
    pdf_path <- file.path(tempdir(), paste0(base_name, ".pdf"))
    success <- FALSE
    tryCatch({
      writeBin(raw_img, png_path)
      pdf(pdf_path, width = max(1, width / 72), height = max(1, height / 72))
      grid::grid.raster(img, interpolate = FALSE)
      success <- TRUE
      region_pdf_info(list(path = pdf_path, name = paste0(base_name, ".pdf")))
      region_png_info(list(path = png_path, name = paste0(base_name, ".png")))
      photos_list(append(
        photos_list(),
        list(list(
          id = base_name,
          pdf_path = pdf_path,
          png_path = png_path,
          data_url = data_url,
          name = paste0(base_name, ".pdf"),
          pdf_name = paste0(base_name, ".pdf"),
          png_name = paste0(base_name, ".png")
        ))
      ))
      showNotification("Region saved as PDF. Download below when ready.", type = "message", duration = 4)
    }, error = function(e) {
      showNotification(paste("Failed to write PDF:", e$message), type = "error")
    }, finally = {
      if (dev.cur() > 1) dev.off()
      if (!success && file.exists(pdf_path)) unlink(pdf_path)
      if (!success && file.exists(png_path)) unlink(png_path)
    })
  }, ignoreNULL = TRUE)
  
  sync_data <- reactive({
    req(input$sync_file)
    read_csv(input$sync_file$datapath, show_col_types = FALSE)
  })
  
  condition_choices <- reactive({
    df <- erp_data_mapped()
    if (nrow(df) > 0) {
      return(sort(unique(df$Condition)))
    } else if (!is.null(input$sync_file)) {
      df_sync <- sync_data()
      if ("Condition" %in% names(df_sync)) return(sort(unique(df_sync$Condition)))
    }
    c("Motion", "Nonmotion")
  })
  
  hyperscan_data <- reactive({
    df <- NULL
    if (!is.null(input$sync_file)) {
      raw <- sync_data()
      cond_col <- detect_column(raw, c("Condition", "condition", "Cond", "Group"))
      chan_col <- detect_column(raw, c("Channel", "channel", "Electrode", "electrode", "Sensor", "Node"))
      val_col  <- detect_column(raw, c("Synchrony", "synchrony", "Sync", "sync", "Value", "value", "Coherence", "coherence"))
      if (!is.null(cond_col) && !is.null(chan_col) && !is.null(val_col)) {
        names(raw)[names(raw) == cond_col] <- "Condition"
        names(raw)[names(raw) == chan_col] <- "Channel"
        names(raw)[names(raw) == val_col]  <- "Synchrony"
        raw <- raw %>% select(Channel, Condition, Synchrony)
        raw <- raw %>%
          mutate(Channel = as.character(Channel),
                 Condition = as.character(Condition),
                 Synchrony = as.numeric(Synchrony)) %>%
          filter(!is.na(Channel), !is.na(Condition), !is.na(Synchrony))
        if (nrow(raw) > 0) df <- raw
      }
    }
    if (is.null(df) || nrow(df) == 0) {
      conds <- condition_choices()
      if (length(conds) == 0) conds <- default_sync_conditions
      sims <- lapply(channel_list, function(ch) {
        do.call(rbind, lapply(conds, function(cond) {
          base <- if (grepl("motion", cond, ignore.case = TRUE)) 0.75 else 0.55
          values <- rnorm(12, base + runif(1, -0.05, 0.05), 0.08)
          data.frame(Channel = ch, Condition = cond, Synchrony = pmin(pmax(values, 0), 1))
        }))
      })
      df <- do.call(rbind, sims)
    }
    df
  })
  
  hyperscan_summary <- reactive({
    hyperscan_data() %>%
      group_by(Channel, Condition) %>%
      summarise(Synchrony = mean(Synchrony, na.rm = TRUE), .groups = "drop")
  })
  
  hyperscan_diff_threshold <- reactive(ifelse(is.null(input$hyperscan_diff_threshold) || !is.numeric(input$hyperscan_diff_threshold), 0.08, input$hyperscan_diff_threshold))
  hyperscan_p_threshold <- reactive(ifelse(is.null(input$hyperscan_p_threshold) || !is.numeric(input$hyperscan_p_threshold), 0.05, input$hyperscan_p_threshold))
  hyperscan_only_significant <- reactive(isTRUE(input$hyperscan_only_significant))
  
  observe({
    choices <- condition_choices()
    if (length(choices) > 0) {
      updateSelectInput(session, "left_condition", choices = choices, selected = choices[1])
      updateSelectInput(session, "right_condition", choices = choices, selected = ifelse(length(choices) > 1, choices[2], choices[1]))
    }
  })
  
  observeEvent(input$two_brain_mode, {
    if (input$data_type == "Hyperscanning" && !isTRUE(input$two_brain_mode)) {
      updateCheckboxInput(session, "two_brain_mode", value = TRUE)
      return()
    }
    session$sendCustomMessage("setTwoBrainMode", list(enabled = isTRUE(input$two_brain_mode)))
  })
  
  observeEvent(input$data_type, {
    if (input$data_type == "Hyperscanning" && !isTRUE(input$two_brain_mode)) {
      updateCheckboxInput(session, "two_brain_mode", value = TRUE)
    }
  })
  
  observe({
    if (isTRUE(input$two_brain_mode) && !is.null(input$left_condition) && !is.null(input$right_condition)) {
      session$sendCustomMessage("setBrainConditions", list(left = input$left_condition, right = input$right_condition))
    }
  })
  
  observe({
    req(input$data_type == "Hyperscanning", input$left_condition, input$right_condition)
    df <- hyperscan_data() %>% filter(Condition %in% c(input$left_condition, input$right_condition))
    req(nrow(df) > 0)
    records <- list()
    unique_channels <- unique(df$Channel)
    for (ch in unique_channels) {
      left_vals <- df %>% filter(Channel == ch, Condition == input$left_condition) %>% pull(Synchrony)
      right_vals <- df %>% filter(Channel == ch, Condition == input$right_condition) %>% pull(Synchrony)
      if (length(left_vals) == 0 || length(right_vals) == 0) next
      left_mean <- mean(left_vals, na.rm = TRUE)
      right_mean <- mean(right_vals, na.rm = TRUE)
      diff_val <- left_mean - right_mean
      p_val <- NA_real_
      if (length(left_vals) > 1 && length(right_vals) > 1) {
        p_val <- tryCatch(t.test(left_vals, right_vals)$p.value, error = function(e) NA_real_)
      }
      significant <- if (!is.na(p_val)) { p_val <= hyperscan_p_threshold() } else { abs(diff_val) >= hyperscan_diff_threshold() }
      records[[length(records) + 1]] <- list(
        label = ch,
        left_mean = left_mean,
        right_mean = right_mean,
        difference = diff_val,
        p_value = p_val,
        strength = (left_mean + right_mean) / 2,
        significant = significant
      )
    }
    if (!length(records)) {
      session$sendCustomMessage("updateHyperscanLinks", list(links = list()))
      return()
    }
    links_df <- bind_rows(records)
    if (hyperscan_only_significant()) {
      links_df <- links_df %>% filter(significant)
    }
    if (!nrow(links_df)) {
      session$sendCustomMessage("updateHyperscanLinks", list(links = list()))
      return()
    }
    sort_choice <- input$hyperscan_sort_links
    if (identical(sort_choice, "left")) {
      links_df <- links_df %>% arrange(desc(left_mean))
    } else if (identical(sort_choice, "right")) {
      links_df <- links_df %>% arrange(desc(right_mean))
    } else {
      links_df <- links_df %>% arrange(desc(abs(difference)))
    }
    links <- lapply(seq_len(nrow(links_df)), function(i) {
      row <- links_df[i,]
      list(
        label = row$label,
        left_mean = row$left_mean,
        right_mean = row$right_mean,
        difference = row$difference,
        p_value = row$p_value,
        strength = row$strength,
        significant = row$significant
      )
    })
    session$sendCustomMessage("updateHyperscanLinks", list(links = links))
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
        tagList(
          div(style = "margin-top: 10px; background: white; padding: 10px; border-radius: 8px; display:flex; justify-content:center; gap: 15px; align-items:center;",
              h5("P-Value:"),
              div(span(style="width:20px;height:20px;background:#ffffff;border:1px solid #ccc;display:inline-block;"), " > 0.05"),
              div(span(style="width:20px;height:20px;background:#ffcccc;border:1px solid #ccc;display:inline-block;"), " < 0.05")
          ),
          div(
            style = "margin-top: 8px; width: 100%; display: flex; justify-content: center;",
            selectInput(
              "erp_test_method",
              "Statistical test",
              choices = c(
                "Wilcoxon rank-sum (non-parametric)" = "wilcox",
                "Kruskal-Wallis (non-parametric)"    = "kruskal",
                "Student t-test (two-sample)"        = "student_t",
                "Welch t-test (unequal variance)"    = "welch_t",
                "One-way ANOVA (F-test)"             = "anova_f"
              ),
              selected = "wilcox",
              width = "220px"
            )
          )
        )
      }
    } else if (input$data_type == "Hyperscanning") {
      tags$div(style = "margin-top: 10px; background: white; padding: 12px; border-radius: 8px;",
               h5("Hyperscanning"),
               p("Curved lines appear between left/right electrodes when the synchrony difference between the selected conditions is statistically significant (or large). Bar charts show average synchrony per condition."),
               div(style = "display:flex; justify-content:center; gap:12px; flex-wrap:wrap; align-items:center;",
                   tags$span(style="display:flex; gap:6px; align-items:center;", tags$div(style="width:16px;height:16px;background:#66ccff;border-radius:4px;"), "Left condition dominant"),
                   tags$span(style="display:flex; gap:6px; align-items:center;", tags$div(style="width:16px;height:16px;background:#ff9fb1;border-radius:4px;"), "Right condition dominant")
               )
      )
    } else NULL
  })
  
  output$images_taken <- renderUI({
    photos <- photos_list()
    if (!length(photos)) {
      return(tags$div(style = "margin-top:12px; font-size:13px; color:#666;",
                      "No captures yet. Click the camera button above the brain to take a photo."))
    }
    tagList(
      tags$h5("Images Taken"),
      tags$div(
        class = "capture-gallery",
        lapply(photos, function(entry) {
          tags$div(
            class = "capture-card",
            tags$img(src = entry$data_url, alt = entry$name),
            tags$div(
              class = "capture-overlay",
              actionButton(paste0("fullscreen_", entry$id), "Fullscreen", class = "btn btn-light btn-sm"),
              actionButton(paste0("download_options_", entry$id), "Download", class = "btn btn-light btn-sm"),
              actionButton(paste0("remove_", entry$id), "Remove", class = "btn btn-danger btn-sm")
            )
          )
        })
      )
    )
  })
  
  observe({
    photos <- photos_list()
    new_ids <- setdiff(vapply(photos, function(x) x$id, character(1)), photo_observer_ids())
    if (!length(new_ids)) return()
    for (id in new_ids) {
      local({
        this_id <- id
        observeEvent(input[[paste0("remove_", this_id)]], {
          entry <- get_capture_by_id(this_id)
          if (!is.null(entry)) {
            unlink(c(entry$pdf_path, entry$png_path), force = TRUE)
          }
          photos_list(Filter(function(x) x$id != this_id, photos_list()))
        }, ignoreInit = TRUE)
        observeEvent(input[[paste0("fullscreen_", this_id)]], {
          entry <- get_capture_by_id(this_id)
          req(entry, entry$data_url)
          showModal(modalDialog(
            title = entry$name,
            tags$img(src = entry$data_url, style = "width:100%; height:auto;"),
            footer = modalButton("Back"),
            easyClose = TRUE,
            size = "l"
          ))
        }, ignoreInit = TRUE)
        observeEvent(input[[paste0("download_options_", this_id)]], {
          gallery_selected_download(this_id)
          showModal(modalDialog(
            title = "Download capture",
            downloadButton("gallery_download_pdf", "Download PDF"),
            downloadButton("gallery_download_png", "Download PNG", style = "margin-left:8px;"),
            footer = modalButton("Close"),
            easyClose = TRUE
          ))
        }, ignoreInit = TRUE)
      })
    }
    photo_observer_ids(c(photo_observer_ids(), new_ids))
  })
  
  # Update Visuals
  observe({
    req(input$data_type == "ERP")
    df_all <- erp_filtered_data()
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
      
      session$sendCustomMessage("updateElectrodeColors", list(layout = "2brain_means", left = l_list, right = r_list))
    } else {
      p_vals <- list()
      for (ch in channels) {
        d <- df_all %>% filter(Channel == ch, Time_ms >= 250, Time_ms <= 500)
        p_vals[[ch]] <- run_selected_test(d, input$erp_test_method)
      }
      session$sendCustomMessage("updateElectrodeColors", p_vals)
    }
  })
  
  # Loading logic
  observeEvent(TRUE, {
    # Try to load the built-in model from www/ first, else fallback to Desktop
    app_dir <- getwd()
    www_dir <- file.path(app_dir, "www")
    default_glb <- character(0)
    if (dir.exists(www_dir)) {
      default_glb <- list.files(www_dir, pattern = "\\.glb$", full.names = TRUE)
    }
    if (!length(default_glb)) {
      desktop_dir <- normalizePath("~/Desktop", winslash = "/", mustWork = FALSE)
      if (dir.exists(desktop_dir)) {
        default_glb <- list.files(desktop_dir, pattern = "\\.glb$", full.names = TRUE)
      }
    }
    if (length(default_glb) > 0) {
      f <- default_glb[1]
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
    } else if (input$data_type == "Hyperscanning") {
      tagList(
        lapply(sels, function(ch) {
          tagList(
            hr(), h4(paste("Hyperscanning Synchrony - Channel:", ch)),
            girafeOutput(paste0("plot_sync_", ch), height = "340px"),
            p(em("Bar height = mean synchrony per condition; hover to compare.")),
            hr(), gt_output(paste0("table_sync_", ch))
          )
        })
      )
    } else {
      tagList(lapply(sels, function(ch) { tagList(hr(), h4(paste("Motor Imagery - Channel:", ch)), textOutput(paste0("mi_text_", ch))) }))
    }
  })
  
  # --- PLOTTING LOGIC (RESTORED) ---
  observe({
    # ensure palette changes re-render plots
    pal_dep <- erp_colors()
    
    sels <- selected_electrodes()
    df_erp <- erp_filtered_data()
    df_psd <- simulated_psd_data()
    if (!length(sels)) return()
    
    # 1. Multi ERP
    output$plot_erp_multi <- renderGirafe({
      req(input$data_type == "ERP", length(sels) > 0)
      df_multi <- df_erp %>% filter(Channel %in% sels)
      req(nrow(df_multi) > 0)
      
      x_limits <- if (!is.null(input$erp_time_limits) && length(input$erp_time_limits) == 2) {
        input$erp_time_limits
      } else {
        range(df_multi$Time_ms, na.rm = TRUE)
      }
      vline_at <- if (isTRUE(input$erp_show_vline) && is.finite(input$erp_vline_at)) input$erp_vline_at else NA
      highlight <- erp_highlight_range()
      
      # Order legend by where lines end (descending end-point amplitude)
      end_pts <- df_multi %>%
        group_by(Channel, Condition) %>%
        arrange(Time_ms) %>%
        slice_tail(n = 1) %>%
        group_by(Channel) %>%
        summarise(end_mean = mean(GrandVoltage, na.rm = TRUE), .groups = "drop") %>%
        arrange(desc(end_mean))
      channel_order <- end_pts$Channel
      if (!length(channel_order)) channel_order <- unique(df_multi$Channel)
      df_multi <- df_multi %>%
        mutate(Channel = factor(Channel, levels = channel_order))
      
      y_max <- max(abs(df_multi$GrandVoltage), na.rm = TRUE)
      if (!is.finite(y_max) || y_max == 0) y_max <- 1
      p <- ggplot(df_multi, aes(x = Time_ms, y = GrandVoltage, color = Condition, linetype = Channel, group = interaction(Channel, Condition))) +
        { if (!is.null(highlight)) annotate("rect", xmin = highlight[1], xmax = highlight[2], ymin = -Inf, ymax = Inf, fill = "#f1f5fb", alpha = 0.25, color = NA) } +
        geom_hline(yintercept = 0, color = "black", linewidth = 0.8) +
        { if (!is.na(vline_at)) geom_vline(xintercept = vline_at, color = "black", linewidth = 0.8, linetype = "dashed") } +
        geom_line_interactive(
          aes(
            tooltip = sprintf(
              "Channel: %s\nCondition: %s\nTime: %.0f ms\nAmplitude: %.2f µV",
              Channel, Condition, Time_ms, GrandVoltage
            ),
            data_id = paste(Channel, Condition, sep = "_")
          ),
          linewidth=1.2
        ) +
        geom_point_interactive(
          aes(
            tooltip = sprintf(
              "Channel: %s\nCondition: %s\nTime: %.0f ms\nAmplitude: %.2f µV",
              Channel, Condition, Time_ms, GrandVoltage
            ),
            data_id = paste(Channel, Condition, Time_ms, sep = "_")
          ),
          size = 2,
          alpha = 0
        ) +
        theme_classic(base_size = 13) +
        scale_y_continuous(limits=c(-y_max, y_max)) +
        scale_x_continuous(limits = x_limits, breaks = pretty(x_limits, n = 8), expand = c(0, 0)) +
        scale_color_manual(
          values = erp_colors(),
          breaks = c("Motion", "Nonmotion"),
          limits = c("Motion", "Nonmotion"),
          drop = FALSE
        ) +
        scale_linetype_discrete(drop = FALSE, limits = channel_order, labels = channel_order) +
        theme(legend.position = "right") +
        labs(title = "ERP Waveforms - Combined", x = "Time (ms)", y = "Amplitude (µV)", subtitle = "Hover to inspect | Drag to zoom | Double-click to reset", color = "Condition", linetype = "Channel")
      girafe(ggobj=p, width_svg=7, height_svg=4.5, options=list(
        opts_hover(css=""),
        opts_tooltip(css="background-color:white;color:black;padding:8px;border-radius:4px;border:1px solid #666;font-size:12px;", zindex=9999),
        opts_zoom(min=0.5, max=4),
        opts_sizing(rescale=TRUE, width=1),
        opts_toolbar(saveaspng=TRUE)
      ))
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
          if (!is.finite(y_max) || y_max == 0) y_max <- 1
          y_limits <- c(-y_max, y_max)
          y_break <- max(1, ceiling(y_max / 3))
          x_limits <- if (!is.null(input$erp_time_limits) && length(input$erp_time_limits) == 2) {
            input$erp_time_limits
          } else {
            range(df_ch$Time_ms, na.rm = TRUE)
          }
          vline_at <- if (isTRUE(input$erp_show_vline) && is.finite(input$erp_vline_at)) input$erp_vline_at else NA
          highlight <- erp_highlight_range()
          
          # order legend by end-point amplitude (descending)
          end_order <- df_ch %>%
            group_by(Condition) %>%
            arrange(Time_ms) %>%
            slice_tail(n = 1) %>%
            arrange(desc(GrandVoltage)) %>%
            pull(Condition)
          if (!length(end_order)) end_order <- unique(df_ch$Condition)
          df_ch <- df_ch %>% mutate(Condition = factor(Condition, levels = end_order))
          
          p <- ggplot(
            df_ch,
            aes(
              x     = Time_ms,
              y     = GrandVoltage,
              color = Condition,
              group = Condition
            )
          ) +
            { if (!is.null(highlight)) annotate("rect", xmin = highlight[1], xmax = highlight[2], ymin = -Inf, ymax = Inf, fill = "#f1f5fb", alpha = 0.25, color = NA) } +
            geom_hline(
              yintercept = 0,
              linetype   = "solid",
              color      = "black",
              linewidth  = 0.8
            ) +
            { if (!is.na(vline_at)) geom_vline(xintercept = vline_at, linetype = "dashed", color = "black", linewidth = 0.8) } +
            geom_line_interactive(
              aes(
                tooltip = paste0(
                  "Condition: ", Condition,
                  "\nTime: ", Time_ms, " ms",
                  "\nAmplitude: ", sprintf('%.2f', GrandVoltage), " µV"
                ),
                data_id = paste(Condition, Time_ms)
              ),
              linewidth = 1.2
            ) +
            geom_point_interactive(
              aes(
                tooltip = paste0(
                  "Channel: ", channel_name, "\n",
                  "Condition: ", Condition, "\n",
                  "Time: ", Time_ms, " ms\n",
                  "Amplitude: ", sprintf('%.2f', GrandVoltage), " µV"
                ),
                data_id = paste(Condition, Time_ms)
              ),
              size  = 3,
              alpha = 0
            ) +
            labs(
              title    = paste("Event-Related Potential - Channel", channel_name),
              subtitle = "Hover over points | Drag to zoom | Double-click to reset",
              x        = "Time (ms)",
              y        = "Amplitude (µV)"
            ) +
            scale_x_continuous(
              limits = x_limits,
              breaks = pretty(x_limits, n = 8),
              expand = c(0, 0)
            ) +
            scale_y_continuous(
              limits = y_limits,
              breaks = seq(-ceiling(y_max), ceiling(y_max), by = y_break)
            ) +
            scale_color_manual(
              values = erp_colors(),
              labels = c(Motion = "Motion", Nonmotion = "Nonmotion")[end_order],
              breaks = end_order
            ) +
            theme_classic(base_size = 13) +
            theme(
              plot.title    = element_text(hjust = 0.5, face = "bold", size = 14),
              plot.subtitle = element_text(hjust = 0.5, size = 9, color = "gray40",
                                           margin = margin(b = 10)),
              legend.title  = element_blank(),
              legend.position = "right",
              legend.text   = element_text(size = 11),
              axis.line     = element_line(color = "black", linewidth = 0.6),
              axis.ticks    = element_line(color = "black", linewidth = 0.5),
              axis.ticks.length = unit(0.15, "cm"),
              axis.text     = element_text(color = "black", size = 10),
              axis.title    = element_text(size = 11, face = "bold"),
              axis.title.x  = element_text(margin = margin(t = 8)),
              axis.title.y  = element_text(margin = margin(r = 8)),
              panel.grid.major = element_blank(),
              panel.grid.minor = element_blank(),
              panel.background = element_rect(fill = "white", color = NA),
              plot.background  = element_rect(fill = "white", color = NA)
            )
          
          girafe(
            ggobj = p,
            width_svg  = 7,
            height_svg = 4.5,
            options = list(
              opts_hover(css = ""),
              opts_tooltip(
                css = "background-color:white;color:black;padding:8px;border-radius:4px;border:1px solid #666;font-size:12px;",
                zindex = 9999
              ),
              opts_zoom(min = 0.5, max = 4),
              opts_sizing(rescale = TRUE, width = 1),
              opts_toolbar(saveaspng = TRUE)
            )
          )
        })
        
        # Individual ERP Table
        output[[paste0("table_erp_", channel_name)]] <- render_gt({
          req(input$data_type == "ERP")
          df_ch <- df_erp %>% filter(Channel == channel_name)
          
          n200_data <- df_ch %>% filter(Time_ms >= 150 & Time_ms <= 250)
          p300_data <- df_ch %>% filter(Time_ms >= 250 & Time_ms <= 500)
          t_n200 <- run_selected_test(n200_data, input$erp_test_method)
          t_p300 <- run_selected_test(p300_data, input$erp_test_method)
          
          n200_means <- n200_data %>%
            group_by(Condition) %>%
            summarise(m = mean(GrandVoltage), .groups = "drop")
          
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
            p_value_raw    = c(t_n200, t_p300)
          )
          
          stats_df$p_value_str <- ifelse(
            is.na(stats_df$p_value_raw),
            "NA",
            ifelse(
              stats_df$p_value_raw < 0.001,
              "< 0.001",
              sprintf("%.3f", stats_df$p_value_raw)
            )
          )
          
          cols <- erp_colors()
          motion_col    <- cols["Motion"]
          nonmotion_col <- cols["Nonmotion"]
          
          stats_df %>%
            gt() %>%
            tab_header(
              title    = md(paste0("**Channel ", channel_name, " Statistics**")),
              subtitle = paste("Comparison of Mean Amplitudes (", input$erp_test_method, ")", sep = "")
            ) %>%
            fmt_number(
              columns = c(Motion.Mean, Nonmotion.Mean),
              decimals = 3
            ) %>%
            tab_style(
              style = cell_text(color = motion_col, weight = "bold"),
              locations = cells_body(columns = Motion.Mean)
            ) %>%
            tab_style(
              style = cell_text(color = motion_col, weight = "bold"),
              locations = cells_column_labels(columns = Motion.Mean)
            ) %>%
            tab_style(
              style = cell_text(color = nonmotion_col, weight = "bold"),
              locations = cells_body(columns = Nonmotion.Mean)
            ) %>%
            tab_style(
              style = cell_text(color = nonmotion_col, weight = "bold"),
              locations = cells_column_labels(columns = Nonmotion.Mean)
            ) %>%
            tab_style(
              style = list(cell_text(color = "red", weight = "bold")),
              locations = cells_body(
                columns = p_value_str,
                rows    = ifelse(is.na(p_value_raw), FALSE, p_value_raw < 0.05)
              )
            ) %>%
            cols_label(
              Motion.Mean    = "Motion (µV)",
              Nonmotion.Mean = "Nonmotion (µV)",
              p_value_str    = "p-value"
            ) %>%
            cols_hide(columns = c(p_value_raw)) %>%
            cols_align(align = "center", columns = everything()) %>%
            tab_options(table.width = pct(100))
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
        
        output[[paste0("plot_sync_", channel_name)]] <- renderGirafe({
          req(input$data_type == "Hyperscanning")
          df_sync <- hyperscan_summary() %>% filter(Channel == channel_name)
          req(nrow(df_sync) > 0)
          cond_levels <- condition_choices()
          if (!length(cond_levels)) cond_levels <- unique(df_sync$Condition)
          max_sync <- max(df_sync$Synchrony, na.rm = TRUE)
          if (!is.finite(max_sync)) max_sync <- 1
          y_limit <- max(1, max_sync)
          df_sync$Condition <- factor(df_sync$Condition, levels = cond_levels)
          
          highlight_left <- isTRUE(input$hyperscan_highlight_left)
          left_cond <- input$left_condition
          right_cond <- input$right_condition
          fill_scale <- if (highlight_left && !is.null(left_cond) && !is.null(right_cond)) {
            palette <- setNames(rep("#bdbdbd", length(cond_levels)), cond_levels)
            if (left_cond %in% cond_levels) palette[left_cond] <- "#66b2ff"
            if (right_cond %in% cond_levels) palette[right_cond] <- "#ff9fb1"
            scale_fill_manual(values = palette)
          } else {
            scale_fill_brewer(palette="Set2")
          }
          
          axis_theme <- if (isTRUE(input$hyperscan_show_axis_labels)) {
            theme(
              axis.title = element_text(size = 11, face = "bold"),
              axis.text = element_text(color = "black")
            )
          } else {
            theme(
              axis.title = element_blank(),
              axis.text = element_blank(),
              axis.ticks = element_blank()
            )
          }
          
          p <- ggplot(df_sync, aes(x=Condition, y=Synchrony, fill=Condition)) +
            geom_col_interactive(
              aes(tooltip=paste0(Condition, ": ", round(Synchrony, 3)), data_id=Condition),
              width=0.65
            ) +
            theme_classic() +
            scale_y_continuous(expand=c(0,0), limits=c(0, y_limit)) +
            fill_scale +
            axis_theme
          
          girafe(
            ggobj=p,
            width_svg=5,
            height_svg=3.5,
            options=list(
              opts_hover(css="stroke-width:2;opacity:0.9;"),
              opts_tooltip(css="font-size:12px;padding:5px;")
            )
          )
        })
        
        output[[paste0("table_sync_", channel_name)]] <- render_gt({
          req(input$data_type == "Hyperscanning")
          stats <- hyperscan_summary() %>% filter(Channel == channel_name) %>%
            mutate(Synchrony = round(Synchrony, 3))
          gt(stats) %>% tab_header(title=paste("Synchrony by Condition -", channel_name))
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
