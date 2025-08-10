// Ring Neck Egg Weight Control Application - CORRIGIDO

// Initial data from provided JSON
const initialData = {
  ovos_iniciais: [
    {
      id: "B1",
      data_postura: "2025-07-30",
      peso_inicial: 9.1,
      entrada_chocadeira: "2025-08-03",
      peso_5_dias: 8.8
    },
    {
      id: "B2", 
      data_postura: "2025-07-31",
      peso_inicial: 8.8,
      entrada_chocadeira: "2025-08-03",
      peso_5_dias: 8.5
    },
    {
      id: "B3",
      data_postura: "2025-08-03", 
      peso_inicial: 9.4,
      entrada_chocadeira: "2025-08-03",
      peso_5_dias: 9.2
    },
    {
      id: "B4",
      data_postura: "2025-08-04",
      peso_inicial: 10.0,
      entrada_chocadeira: "2025-08-04"
    },
    {
      id: "B5",
      data_postura: "2025-08-06",
      peso_inicial: 9.3,
      entrada_chocadeira: "2025-08-06"
    }
  ],
  faixas_ideais: {
    "5_dias": {"min": 1.5, "max": 3.5},
    "10_dias": {"min": 4.0, "max": 6.0},
    "15_dias": {"min": 6.5, "max": 8.5},
    "20_dias": {"min": 9.0, "max": 11.0}
  },
  curva_ideal: [
    {"dia": 0, "peso_pct": 100, "limite_sup": 100, "limite_inf": 100},
    {"dia": 5, "peso_pct": 97.5, "limite_sup": 98.5, "limite_inf": 96.5},
    {"dia": 10, "peso_pct": 95.0, "limite_sup": 96.0, "limite_inf": 94.0},
    {"dia": 15, "peso_pct": 92.5, "limite_sup": 93.5, "limite_inf": 91.5},
    {"dia": 20, "peso_pct": 90.0, "limite_sup": 91.0, "limite_inf": 89.0},
    {"dia": 23, "peso_pct": 88.0, "limite_sup": 89.0, "limite_inf": 87.0}
  ]
};

// Global variables
let eggs = [];
let chart = null;

// Initialize application
document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM loaded, initializing application...");
    loadEggs(); // Load eggs from localStorage or initial data
    setupEventListeners();
    renderTable();
    
    // Initialize chart with a longer delay to ensure DOM is ready
    setTimeout(() => {
        initializeChart();
    }, 500);
});

// Load eggs from localStorage or initial data
function loadEggs() {
    const storedEggs = localStorage.getItem("ringNeckEggs");
    if (storedEggs) {
        eggs = JSON.parse(storedEggs);
        console.log("Eggs loaded from localStorage:", eggs);
    } else {
        eggs = initialData.ovos_iniciais.map(egg => ({
            id: egg.id,
            data_postura: egg.data_postura,
            peso_inicial: egg.peso_inicial,
            entrada_chocadeira: egg.entrada_chocadeira,
            peso_5_dias: egg.peso_5_dias || "",
            peso_10_dias: "",
            peso_15_dias: "",
            peso_20_dias: "",
            data_eclosao: "",
            observacoes: ""
        }));
        console.log("Eggs initialized from initial data:", eggs);
    }
}

// Save eggs to localStorage
function saveEggs() {
    localStorage.setItem("ringNeckEggs", JSON.stringify(eggs));
    console.log("Eggs saved to localStorage.");
}

// Setup event listeners
function setupEventListeners() {
    console.log("Setting up event listeners...");
    
    const addBtn = document.getElementById("addEggBtn");
    const downloadBtn = document.getElementById("downloadBtn");
    const saveBtn = document.getElementById("saveBtn");
    const closeModal = document.getElementById("closeModal");
    const cancelBtn = document.getElementById("cancelBtn");
    const addForm = document.getElementById("addEggForm");
    const modal = document.getElementById("addEggModal");
    
    if (addBtn) {
        addBtn.addEventListener("click", showAddEggModal);
        console.log("Add button listener added");
    }
    
    if (downloadBtn) {
        downloadBtn.addEventListener("click", downloadCSV);
        console.log("Download button listener added");
    }
    
    if (saveBtn) {
        saveBtn.addEventListener("click", function() {
            saveEggs();
            alert("Dados salvos com sucesso!");
        });
        console.log("Save button listener added");
    }
    
    if (closeModal) {
        closeModal.addEventListener("click", hideAddEggModal);
    }
    
    if (cancelBtn) {
        cancelBtn.addEventListener("click", hideAddEggModal);
    }
    
    if (addForm) {
        addForm.addEventListener("submit", handleAddEgg);
    }
    
    if (modal) {
        modal.addEventListener("click", function(e) {
            if (e.target === this) {
                hideAddEggModal();
            }
        });
    }
}

// Calculate weight loss percentage
function calculateWeightLoss(initialWeight, currentWeight) {
    if (!initialWeight || !currentWeight || currentWeight === "") return "";
    const initial = parseFloat(initialWeight);
    const current = parseFloat(currentWeight);
    if (isNaN(initial) || isNaN(current)) return "";
    const loss = ((initial - current) / initial) * 100;
    return loss.toFixed(1);
}

// Determine status based on weight loss percentage
function getStatus(lossPercentage, day) {
    if (!lossPercentage || lossPercentage === "") return "";
    
    const loss = parseFloat(lossPercentage);
    if (isNaN(loss)) return "";
    
    const ranges = initialData.faixas_ideais;
    let range;
    
    switch(day) {
        case 5: range = ranges["5_dias"]; break;
        case 10: range = ranges["10_dias"]; break;
        case 15: range = ranges["15_dias"]; break;
        case 20: range = ranges["20_dias"]; break;
        default: return "";
    }
    
    if (loss >= range.min && loss <= range.max) {
        return "IDEAL";
    } else if (loss < range.min) {
        return "BAIXO";
    } else {
        return "ALTO";
    }
}

// Get status CSS class
function getStatusClass(status) {
    if (status === "IDEAL") return "status--ideal";
    if (status === "BAIXO") return "status--baixo";
    if (status === "ALTO") return "status--alto";
    return "";
}

// Create table row
function createTableRow(egg, index) {
    const row = document.createElement("tr");
    
    // Calculate percentages and statuses
    const loss5 = calculateWeightLoss(egg.peso_inicial, egg.peso_5_dias);
    const loss10 = calculateWeightLoss(egg.peso_inicial, egg.peso_10_dias);
    const loss15 = calculateWeightLoss(egg.peso_inicial, egg.peso_15_dias);
    const loss20 = calculateWeightLoss(egg.peso_inicial, egg.peso_20_dias);
    
    const status5 = getStatus(loss5, 5);
    const status10 = getStatus(loss10, 10);
    const status15 = getStatus(loss15, 15);
    const status20 = getStatus(loss20, 20);
    
    row.innerHTML = `
        <td><input type="text" class="readonly" value="${egg.id}" readonly></td>
        <td><input type="date" class="date-input" value="${egg.data_postura}" onchange="updateEgg(${index}, 'data_postura', this.value)"></td>
        <td><input type="number" class="weight-input" step="0.1" value="${egg.peso_inicial}" onchange="updateEgg(${index}, 'peso_inicial', this.value)"></td>
        <td><input type="date" class="date-input" value="${egg.entrada_chocadeira}" onchange="updateEgg(${index}, 'entrada_chocadeira', this.value)"></td>
        <td><input type="number" class="weight-input" step="0.1" value="${egg.peso_5_dias}" onchange="updateEgg(${index}, 'peso_5_dias', this.value)" placeholder="0.0"></td>
        <td><input type="text" class="readonly" value="${loss5}" readonly></td>
        <td class="status-cell"><span class="status ${getStatusClass(status5)}">${status5}</span></td>
        <td><input type="number" class="weight-input" step="0.1" value="${egg.peso_10_dias}" onchange="updateEgg(${index}, 'peso_10_dias', this.value)" placeholder="0.0"></td>
        <td><input type="text" class="readonly" value="${loss10}" readonly></td>
        <td class="status-cell"><span class="status ${getStatusClass(status10)}">${status10}</span></td>
        <td><input type="number" class="weight-input" step="0.1" value="${egg.peso_15_dias}" onchange="updateEgg(${index}, 'peso_15_dias', this.value)" placeholder="0.0"></td>
        <td><input type="text" class="readonly" value="${loss15}" readonly></td>
        <td class="status-cell"><span class="status ${getStatusClass(status15)}">${status15}</span></td>
        <td><input type="number" class="weight-input" step="0.1" value="${egg.peso_20_dias}" onchange="updateEgg(${index}, 'peso_20_dias', this.value)" placeholder="0.0"></td>
        <td><input type="text" class="readonly" value="${loss20}" readonly></td>
        <td class="status-cell"><span class="status ${getStatusClass(status20)}">${status20}</span></td>
        <td><input type="date" class="date-input" value="${egg.data_eclosao}" onchange="updateEgg(${index}, 'data_eclosao', this.value)"></td>
        <td><input type="text" class="notes-input" value="${egg.observacoes}" onchange="updateEgg(${index}, 'observacoes', this.value)" placeholder="Observações..."></td>
    `;
    
    return row;
}

// Update egg data
function updateEgg(index, field, value) {
    console.log(`Updating egg ${index}, field ${field}, value ${value}`);
    eggs[index][field] = value;
    saveEggs(); // Save changes to localStorage
    renderTable();
    updateChart();
}

// Render table
function renderTable() {
    const tbody = document.getElementById("eggTableBody");
    if (!tbody) {
        console.error("Table body not found");
        return;
    }
    
    tbody.innerHTML = "";
    
    eggs.forEach((egg, index) => {
        tbody.appendChild(createTableRow(egg, index));
    });
    
    console.log("Table rendered with", eggs.length, "eggs");
}

// Show add egg modal
function showAddEggModal() {
    console.log("Showing add egg modal");
    const modal = document.getElementById("addEggModal");
    if (modal) {
        modal.classList.remove("hidden");
        const eggIdInput = document.getElementById("eggId");
        if (eggIdInput) {
            eggIdInput.focus();
        }
    }
}

// Hide add egg modal
function hideAddEggModal() {
    console.log("Hiding add egg modal");
    const modal = document.getElementById("addEggModal");
    if (modal) {
        modal.classList.add("hidden");
    }
    const form = document.getElementById("addEggForm");
    if (form) {
        form.reset();
    }
}

// Handle add new egg
function handleAddEgg(e) {
    e.preventDefault();
    console.log("Adding new egg");
    
    const newEgg = {
        id: document.getElementById("eggId").value,
        data_postura: document.getElementById("layDate").value,
        peso_inicial: parseFloat(document.getElementById("initialWeight").value),
        entrada_chocadeira: document.getElementById("incubatorDate").value,
        peso_5_dias: "",
        peso_10_dias: "",
        peso_15_dias: "",
        peso_20_dias: "",
        data_eclosao: "",
        observacoes: ""
    };
    
    eggs.push(newEgg);
    saveEggs(); // Save changes to localStorage
    renderTable();
    updateChart();
    hideAddEggModal();
    console.log("New egg added:", newEgg);
}

// Initialize chart - CORRIGIDO com faixa sombreada visível
function initializeChart() {
    console.log("Initializing chart...");
    const canvas = document.getElementById("weightChart");
    if (!canvas) {
        console.error("Chart canvas not found");
        return;
    }
    
    const ctx = canvas.getContext("2d");
    
    // Prepare data from curva_ideal with limits - CORRECTED APPROACH
    const limiteSuperiorData = initialData.curva_ideal.map(point => ({
        x: point.dia,
        y: point.limite_sup
    }));
    
    const limiteInferiorData = initialData.curva_ideal.map(point => ({
        x: point.dia,
        y: point.limite_inf
    }));
    
    const idealLineData = initialData.curva_ideal.map(point => ({
        x: point.dia,
        y: point.peso_pct
    }));
    
    try {
        chart = new Chart(ctx, {
            type: "line",
            data: {
                datasets: [
                    // Dataset 1: Limite Superior (will be filled to next dataset)
                    {
                        label: "Faixa Ideal",
                        data: limiteSuperiorData,
                        borderColor: "rgba(31, 184, 205, 0.6)",
                        backgroundColor: "rgba(31, 184, 205, 0.2)",
                        borderWidth: 1,
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        fill: "+1",
                        tension: 0.2,
                        order: 1
                    },
                    // Dataset 2: Limite Inferior (target for fill)
                    {
                        label: "Limite Inferior",
                        data: limiteInferiorData,
                        borderColor: "rgba(31, 184, 205, 0.6)",
                        backgroundColor: "transparent",
                        borderWidth: 1,
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        fill: false,
                        tension: 0.2,
                        order: 2
                    },
                    // Dataset 3: Linha Ideal central
                    {
                        label: "Peso Ideal",
                        data: idealLineData,
                        borderColor: "#1FB8CD",
                        backgroundColor: "transparent",
                        borderWidth: 3,
                        pointRadius: 5,
                        pointBackgroundColor: "#1FB8CD",
                        pointBorderColor: "#ffffff",
                        pointBorderWidth: 2,
                        fill: false,
                        tension: 0.2,
                        order: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: "Curva Ideal de Perda de Peso - Ovos Ring Neck",
                        font: {
                            size: 16,
                            weight: "bold"
                        }
                    },
                    legend: {
                        display: true,
                        position: "top",
                        labels: {
                            filter: function(legendItem, chartData) {
                                // Hide "Limite Inferior" from legend
                                return legendItem.text !== "Limite Inferior";
                            }
                        }
                    },
                    filler: {
                        propagate: false
                    }
                },
                scales: {
                    x: {
                        type: "linear",
                        position: "bottom",
                        title: {
                            display: true,
                            text: "Dias de Incubação",
                            font: {
                                size: 14,
                                weight: "bold"
                            }
                        },
                        min: 0,
                        max: 23,
                        ticks: {
                            stepSize: 5
                        },
                        grid: {
                            color: "rgba(0, 0, 0, 0.1)"
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: "Peso (% do inicial)",
                            font: {
                                size: 14,
                                weight: "bold"
                            }
                        },
                        min: 85,
                        max: 101,
                        ticks: {
                            stepSize: 2,
                            callback: function(value) {
                                return value + "%";
                            }
                        },
                        grid: {
                            color: "rgba(0, 0, 0, 0.1)"
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: "index"
                }
            }
        });
        
        updateChart();
        console.log("Chart initialized successfully with shaded ideal range");
    } catch (error) {
        console.error("Error initializing chart:", error);
    }
}

// Update chart with egg data
function updateChart() {
    if (!chart) {
        console.log("Chart not initialized yet");
        return;
    }
    
    console.log("Updating chart...");
    
    // Remove existing egg datasets, keep the first 3 (upper limit, lower limit, ideal line)
    while (chart.data.datasets.length > 3) {
        chart.data.datasets.pop();
    }
    
    // Add datasets for each egg with distinct colors
    const colors = ["#FFC185", "#B4413C", "#ECEBD5", "#5D878F", "#DB4545", "#D2BA4C", "#964325", "#944454", "#13343B"];
    
    eggs.forEach((egg, index) => {
        const eggData = [
            { x: 0, y: 100 }
        ];
        
        if (egg.peso_5_dias && egg.peso_5_dias !== "") {
            const pct5 = (parseFloat(egg.peso_5_dias) / parseFloat(egg.peso_inicial)) * 100;
            eggData.push({ x: 5, y: pct5 });
        }
        if (egg.peso_10_dias && egg.peso_10_dias !== "") {
            const pct10 = (parseFloat(egg.peso_10_dias) / parseFloat(egg.peso_inicial)) * 100;
            eggData.push({ x: 10, y: pct10 });
        }
        if (egg.peso_15_dias && egg.peso_15_dias !== "") {
            const pct15 = (parseFloat(egg.peso_15_dias) / parseFloat(egg.peso_inicial)) * 100;
            eggData.push({ x: 15, y: pct15 });
        }
        if (egg.peso_20_dias && egg.peso_20_dias !== "") {
            const pct20 = (parseFloat(egg.peso_20_dias) / parseFloat(egg.peso_inicial)) * 100;
            eggData.push({ x: 20, y: pct20 });
        }

        chart.data.datasets.push({
            label: `Peso ${egg.id}`,
            data: eggData,
            borderColor: colors[index % colors.length],
            backgroundColor: "transparent",
            borderWidth: 2,
            pointRadius: 4,
            pointBackgroundColor: colors[index % colors.length],
            pointBorderColor: "#ffffff",
            pointBorderWidth: 1,
            fill: false,
            tension: 0.2,
            order: 0 // Ensure egg lines are drawn on top
        });
    });
    
    chart.update();
    console.log("Chart updated with egg data.");
}

// Download CSV
function downloadCSV() {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Headers
    const headers = [
        "Ovo", "Data Postura", "Peso Inicial (g)", "Entrada Chocadeira",
        "Peso 5 Dias (g)", "Perda 5 Dias (%)", "Status 5 Dias",
        "Peso 10 Dias (g)", "Perda 10 Dias (%)", "Status 10 Dias",
        "Peso 15 Dias (g)", "Perda 15 Dias (%)", "Status 15 Dias",
        "Peso 20 Dias (g)", "Perda 20 Dias (%)", "Status 20 Dias",
        "Data Eclosão", "Observações"
    ];
    csvContent += headers.join(";") + "\n";
    
    // Data rows
    eggs.forEach(egg => {
        const loss5 = calculateWeightLoss(egg.peso_inicial, egg.peso_5_dias);
        const status5 = getStatus(loss5, 5);
        const loss10 = calculateWeightLoss(egg.peso_inicial, egg.peso_10_dias);
        const status10 = getStatus(loss10, 10);
        const loss15 = calculateWeightLoss(egg.peso_inicial, egg.peso_15_dias);
        const status15 = getStatus(loss15, 15);
        const loss20 = calculateWeightLoss(egg.peso_inicial, egg.peso_20_dias);
        const status20 = getStatus(loss20, 20);

        const row = [
            egg.id,
            egg.data_postura,
            egg.peso_inicial,
            egg.entrada_chocadeira,
            egg.peso_5_dias,
            loss5,
            status5,
            egg.peso_10_dias,
            loss10,
            status10,
            egg.peso_15_dias,
            loss15,
            status15,
            egg.peso_20_dias,
            loss20,
            status20,
            egg.data_eclosao,
            egg.observacoes
        ];
        csvContent += row.join(";") + "\n";
    });
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "controle_ovos_ring_neck.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    console.log("CSV download initiated.");
}

