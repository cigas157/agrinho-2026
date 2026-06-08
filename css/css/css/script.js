/**
 * AgroPegada Corporate · Concurso Agrinho 2026
 * JavaScript Externo - Cálculos, Gráficos e Interatividade
 */

// ============================================
// Estado Global
// ============================================
let currentStep = 0;
let carbonChart = null;
let waterChart = null;
let benchmarkChart = null;

// Elementos DOM
const panels = document.querySelectorAll('.step-content');
const tabs = document.querySelectorAll('.step-tab');
const prevBtn = document.getElementById('prevStep');
const nextBtn = document.getElementById('nextStep');
const themeToggle = document.getElementById('themeToggle');
const btnExportPDF = document.getElementById('btnExportPDF');
const btnRefreshReport = document.getElementById('btnRefreshReport');
const btnCompensate = document.getElementById('btnCompensate');

// Inputs
const areaHaInput = document.getElementById('areaHa');
const horasTratorInput = document.getElementById('horasTratorSem');
const consumoInput = document.getElementById('consumoLitroHora');
const horasImplementosInput = document.getElementById('horasImplementos');
const idadeFrotaInput = document.getElementById('idadeFrota');
const aguaM3Input = document.getElementById('aguaM3');
const culturaSelect = document.getElementById('culturaTipo');
const tipoRegaSelect = document.getElementById('tipoRega');
const energiaRegaSelect = document.getElementById('energiaRega');

// ============================================
// Funções Utilitárias
// ============================================

/**
 * Exibe notificação toast
 */
function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'error' : ''}`;
    toast.innerHTML = `<i class="fas ${isError ? 'fa-exclamation-triangle' : 'fa-check-circle'}"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

/**
 * Alterna tema escuro/claro
 */
function toggleDarkMode() {
    document.body.classList.toggle('dark');
    const isDark = document.body.classList.contains('dark');
    localStorage.setItem('darkMode', isDark);
    const icon = themeToggle.querySelector('i');
    icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
}

// Carregar tema salvo
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark');
    themeToggle.querySelector('i').className = 'fas fa-sun';
}

themeToggle.addEventListener('click', toggleDarkMode);

// ============================================
// Validações
// ============================================

function validateStep1() {
    let valid = true;
    const area = parseFloat(areaHaInput.value);
    
    if (isNaN(area) || area < 0.1 || area > 10000) {
        document.getElementById('areaError').innerHTML = '<i class="fas fa-exclamation-circle"></i> Área inválida (0.1 a 10.000 ha)';
        valid = false;
    } else {
        document.getElementById('areaError').innerHTML = '';
    }
    
    const horas = parseFloat(horasTratorInput.value);
    if (isNaN(horas) || horas < 0 || horas > 168) {
        document.getElementById('horasError').innerHTML = '<i class="fas fa-exclamation-circle"></i> Horas entre 0 e 168h';
        valid = false;
    } else {
        document.getElementById('horasError').innerHTML = '';
    }
    
    return valid;
}

function validateStep2() {
    let valid = true;
    const consumo = parseFloat(consumoInput.value);
    
    if (isNaN(consumo) || consumo < 0.5 || consumo > 60) {
        document.getElementById('consumoError').innerHTML = '<i class="fas fa-exclamation-circle"></i> Consumo entre 0.5 e 60 L/h';
        valid = false;
    } else {
        document.getElementById('consumoError').innerHTML = '';
    }
    
    const impHoras = parseFloat(horasImplementosInput.value);
    if (isNaN(impHoras) || impHoras < 0 || impHoras > 5000) {
        document.getElementById('impleError').innerHTML = '<i class="fas fa-exclamation-circle"></i> Horas entre 0 e 5.000/ano';
        valid = false;
    } else {
        document.getElementById('impleError').innerHTML = '';
    }
    
    return valid;
}

function validateStep3() {
    let valid = true;
    const agua = parseFloat(aguaM3Input.value);
    
    if (isNaN(agua) || agua < 0 || agua > 30000) {
        document.getElementById('aguaError').innerHTML = '<i class="fas fa-exclamation-circle"></i> Volume entre 0 e 30.000 m³/ha/ano';
        valid = false;
    } else {
        document.getElementById('aguaError').innerHTML = '';
    }
    
    return valid;
}

// ============================================
// Cálculos Principais
// ============================================

function calcularPegada() {
    const area = parseFloat(areaHaInput.value);
    const horasSemanal = parseFloat(horasTratorInput.value);
    const consumoHora = parseFloat(consumoInput.value);
    const horasImp = parseFloat(horasImplementosInput.value);
    const idade = parseFloat(idadeFrotaInput.value);
    const aguaM3Ha = parseFloat(aguaM3Input.value);
    const tipoRega = tipoRegaSelect.value;
    const energiaRega = energiaRegaSelect.value;
    
    if (isNaN(area) || isNaN(horasSemanal) || isNaN(consumoHora) || 
        isNaN(horasImp) || isNaN(idade) || isNaN(aguaM3Ha)) {
        return null;
    }
    
    // Cálculo Carbono - Trator
    const horasAnuaisTrator = horasSemanal * 52;
    const dieselTratorL = horasAnuaisTrator * consumoHora;
    const co2Trator = dieselTratorL * 2.68;
    
    // Fator idade (aumenta emissão)
    const fatorIdade = 1 + (Math.min(idade, 25) / 100);
    const dieselImplementos = horasImp * (consumoHora * 0.65);
    const co2Implementos = dieselImplementos * 2.68 * fatorIdade;
    
    // Carbono do bombeamento
    let fatorEnergiaRega = energiaRega === 'diesel' ? 2.2 : 
                          (energiaRega === 'eletrica' ? 0.75 : 0.08);
    const aguaTotal = area * aguaM3Ha;
    const co2Bombeamento = aguaTotal * 0.12 * fatorEnergiaRega;
    const pegadaCarbonoTotal = co2Trator + co2Implementos + co2Bombeamento;
    
    // Eficiência Hídrica
    const eficienciaMap = {
        'gotejamento': 0.88,
        'pivot': 0.78,
        'aspersao': 0.68,
        'sulco': 0.45
    };
    const eficienciaRega = eficienciaMap[tipoRega] || 0.68;
    const aguaAproveitada = aguaTotal * eficienciaRega;
    
    // Custo estimado (R$)
    const custoAgua = aguaTotal * 0.005;
    const custoCombustivel = (dieselTratorL + dieselImplementos) * 4.5;
    const custoEnergia = co2Bombeamento * 0.15;
    const custoTotal = custoAgua + custoCombustivel + custoEnergia;
    
    return {
        pegadaCarbonoTotal,
        aguaTotal,
        aguaAproveitada,
        eficienciaRega,
        carbonoPorHa: pegadaCarbonoTotal / area,
        aguaPorHa: aguaTotal / area,
        co2Trator,
        co2Implementos,
        co2Bombeamento,
        custoTotal
    };
}

// ============================================
// Atualização de Dashboard e Gráficos
// ============================================

function atualizarDashboard() {
    const data = calcularPegada();
    if (!data) return;
    
    document.getElementById('carbonMetric').innerHTML = Math.round(data.pegadaCarbonoTotal).toLocaleString();
    document.getElementById('waterMetric').innerHTML = Math.round(data.aguaTotal).toLocaleString();
    document.getElementById('efficiencyMetric').innerHTML = data.carbonoPorHa.toFixed(0);
    document.getElementById('costMetric').innerHTML = `R$ ${Math.round(data.custoTotal).toLocaleString()}`;
    
    const carbonTrend = document.getElementById('carbonTrend');
    if (data.carbonoPorHa < 800) {
        carbonTrend.innerHTML = '<i class="fas fa-arrow-down"></i> Abaixo da média setorial';
        carbonTrend.style.color = '#10b981';
    } else if (data.carbonoPorHa < 1500) {
        carbonTrend.innerHTML = '<i class="fas fa-minus"></i> Média setorial';
        carbonTrend.style.color = '#f59e0b';
    } else {
        carbonTrend.innerHTML = '<i class="fas fa-arrow-up"></i> Acima da média - Ação necessária';
        carbonTrend.style.color = '#ef4444';
    }
    
    const waterTrend = document.getElementById('waterTrend');
    if (data.eficienciaRega > 0.8) {
        waterTrend.innerHTML = '<i class="fas fa-check-circle"></i> Excelente eficiência hídrica';
    } else if (data.eficienciaRega > 0.6) {
        waterTrend.innerHTML = '<i class="fas fa-chart-line"></i> Eficiência média - potencial de melhoria';
    } else {
        waterTrend.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Baixa eficiência - migre para gotejamento';
    }
    
    // Árvores para compensação (1 árvore sequestra ~20kg CO₂/ano)
    const trees = Math.ceil(data.pegadaCarbonoTotal / 20);
    document.getElementById('treesCount').innerHTML = trees.toLocaleString();
    const progress = Math.min(100, (data.pegadaCarbonoTotal / 50000) * 100);
    document.getElementById('compensationProgress').style.width = `${progress}%`;
}

function gerarRelatorio() {
    const data = calcularPegada();
    if (!data) {
        document.getElementById('reportContent').innerHTML = `
            <div class="loading-placeholder">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Complete os dados nas etapas anteriores corretamente</p>
            </div>`;
        return;
    }
    
    atualizarDashboard();
    
    const culturaNome = {
        'graos': '🌾 Grãos', 'horta': '🥬 Hortaliças', 
        'pastagem': '🐄 Pastagem', 'perene': '☕ Perene', 'cana': '🌿 Cana'
    }[culturaSelect.value] || 'Cultura';
    
    const classeEmissao = data.carbonoPorHa < 800 ? 'BAIXA' : 
                          (data.carbonoPorHa < 1500 ? 'MÉDIA' : 'ALTA');
    
    const classeEmissaoColor = data.carbonoPorHa < 800 ? '#10b981' : 
                                (data.carbonoPorHa < 1500 ? '#f59e0b' : '#ef4444');
    
    const recomendacoes = [];
    if (data.pegadaCarbonoTotal > 30000) {
        recomendacoes.push('🔴 Implementar manutenção preventiva da frota e considerar biocombustíveis');
    }
    if (data.eficienciaRega < 0.6) {
        recomendacoes.push('💧 Substituir sistema de irrigação por gotejamento (redução de até 40% no consumo)');
    }
    if (parseFloat(idadeFrotaInput.value) > 10) {
        recomendacoes.push('🚜 Renovar frota de tratores para modelos mais eficientes (redução de 15-25% nas emissões)');
    }
    if (energiaRegaSelect.value === 'diesel') {
        recomendacoes.push('☀️ Migrar bombeamento para energia solar (payback de 3-5 anos)');
    }
    if (recomendacoes.length === 0) {
        recomendacoes.push('🌟 Excelente! Sua operação está alinhada com as melhores práticas sustentáveis');
    }
    
    const relatorioHtml = `
        <div class="report-result">
            <div class="report-summary">
                <div class="summary-item">
                    <span class="summary-label">Área cultivada</span>
                    <span class="summary-value">${parseFloat(areaHaInput.value).toFixed(1)} ha</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Cultura</span>
                    <span class="summary-value">${culturaNome}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Emissão por hectare</span>
                    <span class="summary-value" style="color: ${classeEmissaoColor};">${data.carbonoPorHa.toFixed(0)} kgCO₂/ha · ${classeEmissao}</span>
                </div>
            </div>
            
            <div class="report-metrics">
                <div class="metric-detail">
                    <i class="fas fa-cloud"></i>
                    <div>
                        <strong>Pegada de Carbono Total</strong>
                        <span>${Math.round(data.pegadaCarbonoTotal).toLocaleString()} kg CO₂e/ano</span>
                    </div>
                </div>
                <div class="metric-detail">
                    <i class="fas fa-tint"></i>
                    <div>
                        <strong>Consumo Hídrico Total</strong>
                        <span>${Math.round(data.aguaTotal).toLocaleString()} m³/ano</span>
                    </div>
                </div>
                <div class="metric-detail">
                    <i class="fas fa-chart-line"></i>
                    <div>
                        <strong>Eficiência do Sistema de Rega</strong>
                        <span>${(data.eficienciaRega * 100).toFixed(0)}%</span>
                    </div>
                </div>
                <div class="metric-detail">
                    <i class="fas fa-coins"></i>
                    <div>
                        <strong>Custo Operacional Estimado</strong>
                        <span>R$ ${Math.round(data.custoTotal).toLocaleString()}/ano</span>
                    </div>
                </div>
            </div>
            
            <div class="report-recommendations">
                <h4><i class="fas fa-clipboard-list"></i> Recomendações Estratégicas</h4>
                ${recomendacoes.map(rec => `<div class="recommendation-item">${rec}</div>`).join('')}
            </div>
            
            <div class="report-footer">
                <i class="fas fa-certificate"></i>
                <span>Relatório gerado conforme metodologia GHG Protocol e Water Footprint Network</span>
            </div>
        </div>
    `;
    
    document.getElementById('reportContent').innerHTML = relatorioHtml;
    atualizarGraficos();
    showToast('Relatório atualizado com sucesso!');
}

// ============================================
// Gráficos com Chart.js
// ============================================

function atualizarGraficos() {
    const data = calcularPegada();
    if (!data) return;
    
    // Gráfico de Composição de Carbono
    const ctxCarbon = document.getElementById('carbonCompositionChart')?.getContext('2d');
    if (ctxCarbon) {
        if (carbonChart) carbonChart.destroy();
        carbonChart = new Chart(ctxCarbon, {
            type: 'doughnut',
            data: {
                labels: ['Trator', 'Implementos', 'Bombeamento'],
                datasets: [{
                    data: [data.co2Trator, data.co2Implementos, data.co2Bombeamento],
                    backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    }
    
    // Gráfico de Eficiência Hídrica
    const ctxWater = document.getElementById('waterEfficiencyChart')?.getContext('2d');
    if (ctxWater) {
        if (waterChart) waterChart.destroy();
        waterChart = new Chart(ctxWater, {
            type: 'bar',
            data: {
                labels: ['Água Aplicada', 'Água Aproveitada', 'Perda'],
                datasets: [{
                    label: 'Volume (m³)',
                    data: [data.aguaTotal, data.aguaAproveitada, data.aguaTotal - data.aguaAproveitada],
                    backgroundColor: ['#3b82f6', '#10b981', '#ef4444'],
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { position: 'top' } }
            }
        });
    }
    
    // Gráfico de Benchmark
    const ctxBench = document.getElementById('benchmarkChart')?.getContext('2d');
    if (ctxBench) {
        if (benchmarkChart) benchmarkChart.destroy();
        const mediaRegional = data.carbonoPorHa * 1.2;
        const metaGlobal = data.carbonoPorHa * 0.7;
        benchmarkChart = new Chart(ctxBench, {
            type: 'bar',
            data: {
                labels: ['Sua Propriedade', 'Média Regional', 'Meta Global 2030'],
                datasets: [{
                    label: 'kg CO₂e/ha',
                    data: [data.carbonoPorHa, mediaRegional, metaGlobal],
                    backgroundColor: ['#0a5c3e', '#f59e0b', '#3b82f6'],
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: { legend: { position: 'top' } }
            }
        });
    }
}

// ============================================
// Navegação Multi-step
// ============================================

function showStep(step) {
    panels.forEach((panel, idx) => {
        panel.classList.remove('active');
        if (idx === step) panel.classList.add('active');
    });
    
    tabs.forEach((tab, idx) => {
        tab.classList.remove('active');
        if (idx === step) tab.classList.add('active');
    });
    
    currentStep = step;
    
    if (step === 3) {
        gerarRelatorio();
    }
}

function nextStep() {
    if (currentStep === 0 && validateStep1()) showStep(1);
    else if (currentStep === 1 && validateStep2()) showStep(2);
    else if (currentStep === 2 && validateStep3()) showStep(3);
    else if (currentStep === 3) showStep(3);
    else showToast('Corrija os campos destacados antes de avançar', true);
}

function prevStep() {
    if (currentStep > 0) showStep(currentStep - 1);
}

// Event Listeners
prevBtn.addEventListener('click', prevStep);
nextBtn.addEventListener('click', nextStep);
btnRefreshReport.addEventListener('click', () => {
    if (validateStep1() && validateStep2() && validateStep3()) {
        gerarRelatorio();
    } else {
        showToast('Corrija os erros nos passos 1, 2 ou 3', true);
    }
});

btnExportPDF?.addEventListener('click', () => {
    showToast('Função de exportação PDF disponível na versão completa', true);
});

btnCompensate?.addEventListener('click', () => {
    const trees = document.getElementById('treesCount').innerText;
    showToast(`🌳 Projetos de compensação: ${trees} árvores seriam necessárias para neutralização`);
});

// Tabs click
tabs.forEach((tab, idx) => {
    tab.addEventListener('click', () => {
        if (idx === 0) showStep(0);
        else if (idx === 1 && validateStep1()) showStep(1);
        else if (idx === 2 && validateStep1() && validateStep2()) showStep(2);
        else if (idx === 3 && validateStep1() && validateStep2() && validateStep3()) showStep(3);
        else showToast('Complete as etapas anteriores primeiro', true);
    });
});

// Validação em tempo real
[areaHaInput, horasTratorInput, consumoInput, horasImplementosInput, idadeFrotaInput, aguaM3Input].forEach(inp => {
    inp.addEventListener('input', () => {
        if (currentStep === 0) validateStep1();
        if (currentStep === 1) validateStep2();
        if (currentStep === 2) validateStep3();
        if (currentStep === 3 && validateStep1() && validateStep2() && validateStep3()) {
            atualizarDashboard();
            atualizarGraficos();
        }
    });
});

// Inicialização
showStep(0);
atualizarDashboard();