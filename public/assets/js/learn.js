// Learning Roadmap JavaScript
// Handles the interactive nuclear energy learning path visualization

// Helper to check if we're in development
const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Console log wrapper that only logs in development
const devLog = (...args) => {
  if (isDev) {
    console.log(...args);
  }
};

// State management
const appState = {
    completedNodes: JSON.parse(localStorage.getItem('completedNodes') || '[]'),
    currentNode: null,
    hoveredNode: null,
    roadmapData: null
};

// Load roadmap data from data.json
async function loadRoadmapData() {
    try {
        const response = await fetch('../assets/data.json');
        const data = await response.json();
        appState.roadmapData = {
            nodes: data.roadmapNodes,
            connections: data.roadmapConnections
        };
        return true;
    } catch (error) {
        devLog('Failed to load roadmap data:', error);
        return false;
    }
}

// Render nodes
function renderRoadmap() {
    const roadmap = document.getElementById('roadmap');
    const roadmapNodes = appState.roadmapData.nodes;
    
    roadmapNodes.forEach(node => {
        const nodeElement = document.createElement('div');
        nodeElement.className = `roadmap-node node-${node.type}`;
        if (appState.completedNodes.includes(node.id)) {
            nodeElement.classList.add('completed');
        }
        nodeElement.style.left = node.position.x;
        nodeElement.style.top = node.position.y;
        nodeElement.dataset.nodeId = node.id;
        
        nodeElement.innerHTML = `
            <div class="node-title">${node.title}</div>
            <div class="node-meta">
                <span class="node-difficulty">${node.difficulty}</span>
                <span class="node-time">${node.time}</span>
            </div>
            <div class="node-description">${node.description}</div>
        `;
        
        // Add click handler
        nodeElement.addEventListener('click', () => {
            showNodeDetails(node);
        });
        
        // Add hover handlers for connection highlighting
        nodeElement.addEventListener('mouseenter', () => {
            highlightConnections(node.id);
            showTooltip(nodeElement, node);
        });
        
        nodeElement.addEventListener('mouseleave', () => {
            unhighlightConnections();
            hideTooltip();
        });
        
        // Add right-click handler for quick complete
        nodeElement.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            toggleNodeCompletion(node.id);
        });
        
        roadmap.appendChild(nodeElement);
    });
    
    // Draw connections
    drawConnections();
    updateProgress();
}

function drawConnections() {
    const connections = appState.roadmapData.connections;
    const svg = document.getElementById('connections-svg');
    svg.innerHTML = ''; // Clear existing connections
    
    connections.forEach(conn => {
        const fromNode = document.querySelector(`[data-node-id="${conn.from}"]`);
        const toNode = document.querySelector(`[data-node-id="${conn.to}"]`);
        
        if (fromNode && toNode) {
            const fromRect = fromNode.getBoundingClientRect();
            const toRect = toNode.getBoundingClientRect();
            const containerRect = svg.getBoundingClientRect();
            
            // Calculate positions relative to container
            const x1 = fromRect.left - containerRect.left + fromRect.width / 2;
            const y1 = fromRect.top - containerRect.top + fromRect.height / 2;
            const x2 = toRect.left - containerRect.left + toRect.width / 2;
            const y2 = toRect.top - containerRect.top + toRect.height / 2;
            
            // Create curved path
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const midY = (y1 + y2) / 2;
            const controlOffset = Math.abs(x2 - x1) * 0.3;
            
            path.setAttribute('d', `M ${x1} ${y1} Q ${x1} ${midY} ${x2} ${y2}`);
            path.setAttribute('class', `connection-path ${conn.type}`);
            path.setAttribute('data-from', conn.from);
            path.setAttribute('data-to', conn.to);
            
            svg.appendChild(path);
        }
    });
}

function showNodeDetails(node) {
    // Remove active class from all nodes
    document.querySelectorAll('.roadmap-node').forEach(n => n.classList.remove('active'));
    
    // Add active class to clicked node
    document.querySelector(`[data-node-id="${node.id}"]`).classList.add('active');
    
    // Update modal content
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modalTitle.textContent = node.title;
    
    let modalContent = `
        <div class="modal-section">
            <div class="modal-section-title">Overview</div>
            <div class="modal-section-content">${node.description}</div>
        </div>
        
        <div class="modal-section">
            <div class="modal-section-title">Details</div>
            <div class="modal-section-content">
                <strong>Difficulty:</strong> ${node.difficulty}<br>
                <strong>Estimated Time:</strong> ${node.time}<br>
                <strong>Topic Type:</strong> ${node.type.charAt(0).toUpperCase() + node.type.slice(1)}
            </div>
        </div>
    `;
    
    if (node.links && node.links.length > 0) {
        modalContent += `
            <div class="modal-section">
                <div class="modal-section-title">Related Resources</div>
                <ul class="resource-list">
                    ${node.links.map(link => `
                        <li class="resource-item">
                            <a href="../${link}" class="resource-link" target="_blank">
                                ${link.split('/').pop().replace('.md', '').replace(/-/g, ' ')}
                            </a>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }
    
    modalContent += `
        <div class="modal-section">
            <div class="modal-section-title">Actions</div>
            <button class="simulate-btn" style="width: auto; padding: 0.5rem 1.5rem; font-size: 0.875rem;" 
                    onclick="toggleNodeCompletion('${node.id}')">
                ${appState.completedNodes.includes(node.id) ? 'Mark as Incomplete' : 'Mark as Complete'}
            </button>
        </div>
    `;
    
    modalBody.innerHTML = modalContent;
    
    // Show modal
    document.getElementById('nodeModal').classList.add('active');
}

function closeModal() {
    document.getElementById('nodeModal').classList.remove('active');
    document.querySelectorAll('.roadmap-node').forEach(n => n.classList.remove('active'));
}

function toggleNodeCompletion(nodeId) {
    const index = appState.completedNodes.indexOf(nodeId);
    if (index > -1) {
        appState.completedNodes.splice(index, 1);
    } else {
        appState.completedNodes.push(nodeId);
    }
    
    // Save to localStorage
    localStorage.setItem('completedNodes', JSON.stringify(appState.completedNodes));
    
    // Update UI
    const nodeElement = document.querySelector(`[data-node-id="${nodeId}"]`);
    nodeElement.classList.toggle('completed');
    
    updateProgress();
    closeModal();
}

function updateProgress() {
    const total = appState.roadmapData.nodes.length;
    const completed = appState.completedNodes.length;
    const percentage = (completed / total) * 100;
    
    document.querySelector('.progress-fill').style.width = `${percentage}%`;
    document.querySelector('.progress-text').textContent = `${completed} of ${total} topics completed`;
}

function highlightConnections(nodeId) {
    document.querySelectorAll('.connection-path').forEach(path => {
        if (path.dataset.from === nodeId || path.dataset.to === nodeId) {
            path.classList.add('highlighted');
        }
    });
}

function unhighlightConnections() {
    document.querySelectorAll('.connection-path').forEach(path => {
        path.classList.remove('highlighted');
    });
}

function showTooltip(element, node) {
    const tooltip = document.getElementById('tooltip');
    const rect = element.getBoundingClientRect();
    
    tooltip.textContent = `${node.title} - ${node.time}`;
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.top = `${rect.top - 30}px`;
    tooltip.style.transform = 'translateX(-50%)';
    tooltip.classList.add('visible');
}

function hideTooltip() {
    document.getElementById('tooltip').classList.remove('visible');
}

// Initialize the roadmap
document.addEventListener('DOMContentLoaded', async () => {
    // Load data first
    const dataLoaded = await loadRoadmapData();
    if (!dataLoaded) {
        devLog('Failed to initialize roadmap');
        return;
    }
    
    // Render the roadmap
    renderRoadmap();
    
    // Add start indicator click handler
    document.querySelector('.start-indicator').addEventListener('click', () => {
        const firstNode = document.querySelector('[data-node-id="atomic-structure"]');
        if (firstNode) {
            firstNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
            showNodeDetails(appState.roadmapData.nodes[0]);
        }
    });
    
    // Close modal on overlay click
    document.getElementById('nodeModal').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            closeModal();
        }
    });
    
    // Redraw connections on window resize
    window.addEventListener('resize', () => {
        drawConnections();
    });
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
        if (e.key === 'r' && e.ctrlKey) {
            e.preventDefault();
            if (confirm('Reset all progress?')) {
                appState.completedNodes = [];
                localStorage.removeItem('completedNodes');
                location.reload();
            }
        }
    });
});

// Export functions for global access
window.closeModal = closeModal;
window.toggleNodeCompletion = toggleNodeCompletion;