function createGraphManager() {
    // Encapsulated variables
    let scene = new THREE.Scene();
    let camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    let renderer = new THREE.WebGLRenderer();
    let controls = new THREE.OrbitControls(camera, renderer.domElement);
    let raycaster = new THREE.Raycaster();
    let mouse = new THREE.Vector2();
    let nodeObjects = []; // Track node objects
    let linkObjects = []; // Track link objects
    let INTERSECTED;
    let isRotating = false; // State variable to track rotation
    let showLabels = false;
    let radius =0;
    let z;// current camera pos
    // scene.background = new THREE.Color( 0xf0f0f0 );
    let currentCommunity = ''; // Track selected community
    let communityOptions = new Set();
    const light = new THREE.HemisphereLight(0xffffff, 0x888888, 3);
    light.position.set(0, 1, 0);
    scene.add(light);
    // scene.fog = new THREE.Fog(0x000000, 5, 15);  // Fog with near and far distances

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.querySelector('.canvas-graph').appendChild(renderer.domElement);

    // Position the camera
    camera.position.z = 30;

    // Animation loop
    function animate() {
        requestAnimationFrame(animate);

        if (isRotating) {
            // Rotate the camera around the origin (0, 0, 0)
            // console.log(" called");
            camera.position.x = z * Math.cos(Date.now() * 0.001);
            camera.position.z = z * Math.sin(Date.now() * 0.001);
            camera.lookAt(scene.position);
        }
        
        controls.update();

        // Update label positions
        updateLabelPositions();

        renderer.render(scene, camera);
    }
    console.log('animate')
    animate();

    // Tooltip setup
    const tooltip = document.querySelector('.tooltip');

    // const label_tooltip = document.querySelector('.tooltip');
    // Select all buttons with the class w3-button
    
    document.getElementById('rotateButton').addEventListener('click', () => {
        z = camera.position.z;
        isRotating = !isRotating;

        document.getElementById('rotateButton').textContent = isRotating ? 'Stop' : 'Rotate';
    });

    document.getElementById('labelButton').addEventListener('click', () => {
        
        showLabels = !showLabels;

        document.getElementById('labelButton').textContent = showLabels ? 'Hide Labels' : 'Show Labels';
        updateLabelPositions();
    });

    // Community Filter Event Listener
    // const communityClass = document.getElementsByClassName("o")
    document.getElementById('communityFilter').addEventListener('change', function () {
        currentCommunity = this.value;
        console.log(currentCommunity);
        filterNodesByCommunity(currentCommunity);
    });
    function updateLabelPositions() {
        nodeObjects.forEach(node => {
            if (showLabels && node.visible) {
                
                const vector = new THREE.Vector3();
                vector.setFromMatrixPosition(node.matrixWorld);
                vector.project(camera);
    
                const labelElement = node.userData.labelElement;
                const canvasBounds = renderer.domElement.getBoundingClientRect();
    
                const x = (vector.x * 0.5 + 0.5) * canvasBounds.width;
                const y = (vector.y * -0.5 + 0.5) * canvasBounds.height + 80;

                labelElement.style.left = `${x - labelElement.clientWidth / 2}px`;
                labelElement.style.top = `${y - labelElement.clientHeight / 2}px`;
            
                // console.log(x,y,vector.x,vector.y);

                labelElement.style.display = 'block';
            } else if (node.userData.labelElement) {
                node.userData.labelElement.style.display = 'none';
            }
        });
    }
    
    function filterNodesByCommunity(community) {
        nodeObjects.forEach(node => {
            node.visible = community === '' || node.community === community;
        });

        linkObjects.forEach(link => {
            link.visible = (community === '' || (link.source.community === community && link.target.community === community));
        });
    }
    // Search bar setup
    const searchInput = document.getElementById('nodeSearch');
    const searchResults = document.getElementById('searchResults');
    // console.log(searchInput);
    searchInput.addEventListener('input', function () {
        // console.log("input");
        const query = searchInput.value.toLowerCase();
        searchResults.innerHTML = ''; // Clear previous results

        if (query) {
            const results = Object.values(nodeObjects).filter(node => node.label.toLowerCase().includes(query));
            results.forEach(node => {
                const resultItem = document.createElement('div');
                resultItem.className = 'result-item';
                resultItem.textContent = node.label;

                resultItem.addEventListener('click', () => {
                    // Handle node click
                    // searchResults.innerHTML = '';
                    expose();
                    hide(node);
                    // camera.position.set(node.position.x, node.position.y, camera.position.z); // Adjust camera position
                    // controls.update();
                    tooltip.style.display = 'none'; // Hide tooltip on node selection
                });

                searchResults.appendChild(resultItem);
            });
        }
        else {
            // Clear search results if no query
            searchResults.innerHTML = '';
            expose(); // Ensure all nodes are visible when search query is cleared
        }
    });

    document.addEventListener('mousemove', onMouseMove, false);
    window.addEventListener('resize', onWindowResize, false);
    renderer.domElement.addEventListener('pointerdown', onMouseDown, false);

    function onWindowResize() {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function onMouseMove(event) {
        event.preventDefault();
        // console.log("hover");
        // Convert mouse position to normalized device coordinates (-1 to +1) for both components.


        // Get the bounding rectangle of the renderer's DOM element (the canvas)
        const canvasBounds = renderer.domElement.getBoundingClientRect();

        // Convert mouse position to normalized device coordinates (-1 to +1)
        mouse.x = ((event.clientX - canvasBounds.left) / canvasBounds.width) * 2 - 1;
        mouse.y = -((event.clientY - canvasBounds.top) / canvasBounds.height) * 2 + 1;


        // Update the raycaster with the camera and mouse position.
        raycaster.setFromCamera(mouse, camera);
        raycaster.ray.origin.copy(camera.position);
        raycaster.ray.direction.set(mouse.x, mouse.y, -1).unproject(camera).sub(raycaster.ray.origin).normalize();
        const intersects = raycaster.intersectObjects(nodeObjects);

        if (intersects.length > 0) {
            const intersectedObject = intersects[0].object;
            // const node = nodeObjects.find(n => n.id === intersectedObject.nodeId);
            // const node = intersectedObject.userData.node;
            // console.log(intersectedObject.nodeId);
            // console.log(mouse.x,mouse.y);
            if(intersectedObject.visible){
                // label_tooltip.style.display = 'none';
                tooltip.style.display = 'block';
                tooltip.style.left = `${event.clientX + 10}px`;
                tooltip.style.top = `${event.clientY + 10}px`;
                // tooltip.innerHTML = intersectedObject.label;
                tooltip.innerHTML = `
                <strong>Label:</strong> ${intersectedObject.label}<br>
                <strong>Name:</strong> ${intersectedObject.name}<br>
                <strong>Description:</strong> ${intersectedObject.description}<br>
                <strong>Degree:</strong> ${intersectedObject.size}
            `;
            }
            
            if (INTERSECTED != intersectedObject) {

                if (INTERSECTED) {
                    INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
                    highlight(INTERSECTED, false);
                    INTERSECTED.scale.set(1, 1, 1);  // Reset to original size
                }
                INTERSECTED = intersectedObject;
                // console.log("intersected");
                INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
                INTERSECTED.material.emissive.setHex(0xff0000);

                INTERSECTED.scale.set(1.5, 1.5, 1.5);

            }
            // Highlight links associated with the new intersected node
            highlight(INTERSECTED, true);

        }
        else {
            tooltip.style.display = 'none';

            if (INTERSECTED) {
                INTERSECTED.material.emissive.setHex(INTERSECTED.currentHex);
                highlight(INTERSECTED, false);
                INTERSECTED.scale.set(1, 1, 1);
                INTERSECTED = null;
            }
        }
    }

    function onMouseDown(event) {
        // console.log("clicked-1");
        event.preventDefault();
        // Get the bounding rectangle of the renderer's DOM element (the canvas)
        const canvasBounds = renderer.domElement.getBoundingClientRect();

        // Convert mouse position to normalized device coordinates (-1 to +1)
        mouse.x = ((event.clientX - canvasBounds.left) / canvasBounds.width) * 2 - 1;
        mouse.y = -((event.clientY - canvasBounds.top) / canvasBounds.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        raycaster.ray.origin.copy(camera.position);
        raycaster.ray.direction.set(mouse.x, mouse.y, -1).unproject(camera).sub(raycaster.ray.origin).normalize();

        const intersects = raycaster.intersectObjects(nodeObjects);

        if (intersects.length > 0) {
            const clickedNode = intersects[0].object;
            
            expose();
            hide(clickedNode)

        }
        else {
            expose();
        }
    }
    function expose() {
        nodeObjects.forEach(node => {
            node.visible = true;

        });

        // Optionally, hide links associated with hidden nodes
        linkObjects.forEach(link => {
            link.visible = true;

        });
    }
    function hide(clickedNode) {
        const nodesVisible = [clickedNode];

        linkObjects.forEach(link => {
            if (link.source.nodeId === clickedNode.nodeId) {
                nodesVisible.push(link.target);
            }
            if (link.target.nodeId === clickedNode.nodeId) {
                nodesVisible.push(link.source);
            }

        });
        nodeObjects.forEach(node => {

            node.visible = false;

        });
        // Hide all nodes except the clicked one
        nodesVisible.forEach(node => {
            node.visible = true;
        });

        // Optionally, hide links associated with hidden nodes
        linkObjects.forEach(link => {
            if (link.source !== clickedNode && link.target !== clickedNode) {
                link.visible = false;
            }
        });
    }
    function highlight(nodeObject, highlight) {
        // console.log(nodeObject.nodeId);
        const linksToHighlight = linkObjects.filter(link =>
            link.source.nodeId === nodeObject.nodeId ||
            link.target.nodeId === nodeObject.nodeId
        );
        const nodesToHighlight = [];
        linkObjects.forEach(link => {
            if (link.source.nodeId === nodeObject.nodeId)
                nodesToHighlight.push(link.target);
            if (link.target.nodeId === nodeObject.nodeId)
                nodesToHighlight.push(link.source);

        });
        // console.log(nodesToHighlight);
        linksToHighlight.forEach(link => {
            link.material.color.set(highlight ? 0xffffff : link.color); // Highlight or reset color
        });
        nodesToHighlight.forEach(node => {

            node.material.emissive.setHex(highlight ? 0xff0000 : node.color); // Highlight or reset color
        });
    }


    // Public methods
    return {
        loadNetworkGraph: function (networkName, def) {
            console.log('Loading graph for:', networkName, def);
            
            if (!def) {
                console.log("canvas removed")
                
                // document.body.removeChild(document.getElementsByTagName('canvas')[0]);
                // document.querySelector('.tooltip').removeChild(document.body.getElementsByClassName('tooltip')[0]);
                document.querySelector('.canvas-graph').removeChild(document.getElementsByTagName('canvas')[0]);

            }
            // Show loading screen
            const loadingScreen = document.getElementById('loadingScreen');
            const loadScreen = true;
            searchResults.innerHTML = ''; // Clear previous results
            searchInput.value = '';
            if (loadScreen) {
                loadingScreen.style.display = 'flex';
            }
            // Load the JSON file using D3.js with a cache-busting query parameter
            const timestamp = new Date().getTime(); // Get current timestamp
            d3.json(`${networkName}.json?${timestamp}`).then(data => {
                const nodes = data.nodes;
                const links = data.links;
                console.log('Loaded the JSON file using D3.js with a cache-busting query parameter');

                // Create node objects and add them to the scene
                nodes.forEach(node => {
                    // console.log(`Adding node: ${node.id}`);
                     
                    if (node.size>50){
                        radius = 0.2;
                    }
                    else{
                    radius = 0.05+0.025*Math.sqrt(node.size);
                    }
                    const nodeGeometry = new THREE.SphereGeometry(radius, 32 , 32 );
                    const nodeMaterial = new THREE.MeshPhongMaterial({ color: node.color, side: THREE.DoubleSide ,shininess: 50});
                    const nodeObject = new THREE.Mesh(nodeGeometry, nodeMaterial);
                    nodeObject.position.set(node.x, node.y, node.z);
                    nodeObject.nodeId = node.id;
                    nodeObject.label = node.label;
                    nodeObject.color = node.color;
                    nodeObject.size = node.size;
                    nodeObject.community = node.color;
                    communityOptions.add(node.color);
                    if (node.Name)
                        nodeObject.name = node.Name? node.Name : 'nil';
                    else 
                    nodeObject.name = node.name? node.name : 'nil';
                    if (node.Definition)
                        nodeObject.description = node.Definition? node.Definition : 'nil';
                    else if (node.description)
                        nodeObject.description = node.description? node.description : 'nil';
                    else if (node.Summary)
                        nodeObject.description = node.Summary? node.Summary : 'nil'
                    // Create label for each node
                    const nodeLabel = document.createElement('div');
                    nodeLabel.className = 'node-label';
                    nodeLabel.textContent = nodeObject.name;
                    nodeLabel.style.position = 'absolute';
                    nodeLabel.style.display = 'block'; // Initially hidden
                    document.body.appendChild(nodeLabel);
                    
                    // Store the label in userData for easy access
                    nodeObject.userData.labelElement = nodeLabel;
                    // console.log(nodeObject.userData.labelElement);

                    scene.add(nodeObject);
                    nodeObjects[node.id] = nodeObject; // Track node objects
                    // console.log(nodeObjects);
                });
                console.log(communityOptions);
                // Create link objects and add them to the scene
                links.forEach(link => {
                    // console.log(`Adding link from ${link.source} to ${link.target}`);
                    const source = nodeObjects[link.source];
                    const target = nodeObjects[link.target];
                    if (source && target) {
                        const linkMaterial = new THREE.LineBasicMaterial({ color: link.color,  linewidth: 1.5,transparent: true, opacity: 0.3 });
                        const linkGeometry = new THREE.BufferGeometry().setFromPoints([
                            source.position,
                            target.position
                        ]);
                        const linkObject = new THREE.Line(linkGeometry, linkMaterial);
                        linkObject.source = source;
                        linkObject.target = target;
                        linkObject.color = link.color;
                        scene.add(linkObject);
                        // console.log(linkObject);
                        linkObjects.push(linkObject); // Track link objects
                    } else {
                        console.warn(`Link not added: source or target node not found for link ${link.source} to ${link.target}`);
                    }
                });
                // Clear any existing options
                communityFilter.innerHTML = '<option value="">Communities</option>';
        
                // Populate dropdown with community options
                communityOptions.forEach(community => {
                    const option = document.createElement('option');
                    option.value = community;
                    option.textContent = community;
                    option.style.backgroundColor = community;
                    communityFilter.appendChild(option);
                });

                const loadScreen = false;
                // Hide loading screen once graph is loaded
                if (!loadScreen) {
                    console.log("hide loading screen")
                    loadingScreen.style.display = 'none';

                }
            }).catch(error => {
                console.error('Error loading JSON data:', error);
                // Hide loading screen once graph is loaded

            });

        }


    };

}

