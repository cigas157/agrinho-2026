/**
 * AgroPegada · Concurso Agrinho 2026
 * JavaScript Externo - Sem inline/internal JS
 * Calculadora de Eficiência Hídrica e Carbónica
 */

// ============================================
// Estado da Aplicação
// ============================================
let currentStep = 0;
const panels = [
    document.getElementById('step1'),
    document.getElementById('step2'),
    document.getElementById('step3'),
    document.getElementById('step4')
];
const badges = document.querySelectorAll('.step-badge');

// ============================================
// Elementos DOM
// ============================================
const areaHaInput = document.getElementById('areaHa');
const horasTratorInput = document.getElementById('horasTratorSem');
const consumoInput = document.getElementById('consumoLitroHora');
const horasImplementosInput = document.getElementById('horasImplementos');
const idadeFrotaInput = document.getElementById('idadeFrota');
const aguaM3Input = document.getElementById('aguaM3');
const culturaSelect = document.getElementById('culturaTipo');
const tipoRegaSelect = document.getElementById('tipoRega');
const energiaRegaSelect = document.getElementById('energiaRega');

// Elementos de erro
const areaError = document.getElementById('areaError');
const horasError = document.getElementById('horasError');
const consumoError = document.getElementById('consumoError');
const impleError = document.getElementById('impleError');
const aguaError = document.getElementById('aguaError');

// Botões
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const btnRecalcular = document.getElementById('btnRecalcular');

// ============================================
// Funções Utilitárias
// ============================================

/**
 * Exibe uma notificação toast
 * @param {string} message - Mensagem a ser exibida
 * @param {boolean} isError - Se é erro ou sucesso
 */
function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'error' : ''}`;
    toast.innerHTML = `<i class="fas ${isError ? 'fa-exclamation-triangle' : 'fa-check-circle'}"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ============================================
// Validações
// ============================================

/**
 * Valida os dados do passo 1 (Área e Horas)
 * @returns {boolean} - true se válido, false caso contrário
 */
function validateStep1() {
    let valid = true;
    const area = parseFloat(areaHaInput.value);
    
    if (isNaN(area) || area < 0.1 || area > 500) {
        areaError.innerHTML = '<i class="fas fa-exclamation-circle"></i> Área inválida (0.1 a 500 hectares)';
        valid = false;
    } else {
        areaError.innerHTML = '';
    }
    
    const horas = parseFloat(horasTratorInput.value);
    if (isNaN(horas) || horas < 0 || horas > 168) {
        horasError.innerHTML = '<i class="fas fa-exclamation-circle"></i> Horas por semana entre 0 e 168h';
        valid = false;
    } else {
        horasError.innerHTML = '';
    }
    
    return valid;
}

/**
 * Valida os dados do passo 2 (Consumo e Implementos)
 * @returns {boolean} - true se válido, false caso contrário
 */
function validateStep2() {
    let valid = true;
    const consumo = parseFloat(consumoInput.value);
    
    if (isNaN(consumo) || consumo < 0.5 || consumo > 50) {
        consumoError.innerHTML = '<i class="fas fa-exclamation-circle"></i> Consumo realista: 0.5 a 50 L/h';
        valid = false;
    } else {
        consumoError.innerHTML = '';
    }
    
    const impHoras = parseFloat(horasImplementosInput.value);
    if (isNaN(impHoras) || impHoras < 0 || impHoras > 3000) {
        impleError.innerHTML = '<i class="fas fa-exclamation-circle"></i> Horas anuais de 0 a 3000h';
        valid = false;
    } else {
        const idade = parseFloat(idadeFrotaInput.value);
        if (isNaN(idade) || idade < 0 || idade > 40) {
            impleError.innerHTML = '<i class="fas fa-exclamation-circle"></i> Idade entre 0 e 40 anos';
            valid = false;
        } else {
            impleError.innerHTML = '';
        }
    }
    
    return valid;
}

/**
 * Valida os dados do passo 3 (Água aplicada)
 * @returns {boolean} - true se válido, false caso contrário
 */
function validateStep3() {
    let valid = true;
    const agua = parseFloat(aguaM3Input.value);
    
    if (isNaN(agua) || agua < 0 || agua > 25000) {
        aguaError.innerHTML = '<i class="fas fa-exclamation-circle"></i> Volume por hectare/ano: 0 a 25.000 m³';
        valid = false;
    } else {
        aguaError.innerHTML = '';
    }
    
    return valid;
}

// ============================================
// Cálculos e Relatório
// ============================================

/**
 * Calcula a pegada de carbono total
 * @returns {Object} - Resultados dos cálculos
 */
function calcularPegada() {
    const area = parseFloat(areaHaInput.value);
    const horasSemanal = parseFloat(horasTratorInput.value);
    const consumoHora = parseFloat(consumoInput.value);
    const horasImp = parseFloat(horasImplementosInput.value);
    const idade = parseFloat(idadeFrotaInput.value);
    const aguaM3Ha = parseFloat(aguaM3Input.value);
    const tipoRega = tipoRegaSelect.value;
    const energiaRega = energiaRegaSelect.value;
    
    // Verificação de NaN
    if (isNaN(area) || isNaN(horasSemanal) || isNaN(consumoHora) || 
        isNaN(horasImp) || isNaN(idade) || isNaN(aguaM3Ha)) {
        return null;
    }
    
    // Cálculo Carbono - Trator
    const horasAnuaisTrator = horasSemanal * 52;
    const dieselTratorL = horasAnuaisTrator * consumoHora;
    const co2Trator = dieselTratorL * 2.68;
    
    // Fator idade (quanto mais antigo, maior emissão)
    const fatorIdade = 1 + (Math.min(idade, 25) / 100);
    const dieselImplementos = horasImp * (consumoHora * 0.7);
    const co2Implementos = dieselImplementos * 2.68 * fatorIdade;
    
    // Cálculo Carbono - Bombeamento
    let fatorEnergiaRega = 1;
    if (energiaRega === 'diesel') {
        fatorEnergiaRega = 2.2;
    } else if (energiaRega === 'eletrica') {
        fatorEnergiaRega = 0.8;
    } else if (energiaRega === 'solar') {
        fatorEnergiaRega = 0.05;
    }
    
    const aguaTotal = area * aguaM3Ha;
    const co2Bombeamento = aguaTotal * 0.15 * fatorEnergiaRega;
    const pegadaCarbonoTotal = co2Trator + co2Implementos + co2Bombeamento;
    
    // Eficiência Hídrica por tipo de irrigação
    const eficienciaMap = {
        'gotejamento': 0.88,
        'pivot': 0.78,
        'aspersao': 0.68,
        'sulco': 0.45
    };
    const eficienciaRega = eficienciaMap[tipoRega] || 0.68;
    const aguaEfetiva = aguaTotal * eficienciaRega;
    const aguaDesperdicada = aguaTotal - aguaEfetiva;
    
    return {
        pegadaCarbonoTotal,
        aguaTotal,
        aguaEfetiva,
        aguaDesperdicada,
        eficienciaRega,
        carbonoPorHa: pegadaCarbonoTotal / area,
        aguaPorHa: aguaTotal / area,
        co2Trator,
        co2Implementos,
        co2Bombeamento
    };
}

/**
 * Gera o relatório completo com conselhos práticos
 */
function gerarRelatorio() {
    const data = calcularPegada();
    const cultura = culturaSelect.value;
    const tipoRega = tipoRegaSelect.value;
    
    if (!data) {
        document.getElementById('relatorioConteudo').innerHTML = 
            '<div style="text-align:center; padding:20px;">' +
            '<i class="fas fa-exclamation-triangle" style="font-size:2rem; color:#e74c3c;"></i>' +
            '<p style="margin-top:10px;">Complete os três primeiros passos com dados válidos.</p></div>';
        return;
    }
    
    // Conselhos dinâmicos
    let conselhoCarbono = '';
    if (data.pegadaCarbonoTotal > 12000) {
        conselhoCarbono = '🚜 <strong>ALTA pegada!</strong> Reduza uso de trator, opte por biodiesel ou plantio direto.';
    } else if (data.pegadaCarbonoTotal > 5000) {
        conselhoCarbono = '🌿 <strong>Emissões médias.</strong> Manutenção correta reduz combustível.';
    } else {
        conselhoCarbono = '✅ <strong>Pegada baixa!</strong> Parabéns, mantenha boas práticas.';
    }
    
    let conselhoAgua = '';
    if (data.aguaDesperdicada > 3000) {
        conselhoAgua = '💦 <strong>Perda hídrica elevada</strong> → migre para gotejamento e use sensores.';
    } else if (tipoRega === 'sulco') {
        conselhoAgua = '🌾 <strong>Irrigação por sulco é ineficiente</strong>; considere pivô ou gotejamento.';
    } else if (data.eficienciaRega > 0.8) {
        conselhoAgua = '💧 <strong>Excelente eficiência!</strong> Monitore vazamentos e faça cobertura morta.';
    } else {
        conselhoAgua = '🔧 <strong>Melhore a irrigação:</strong> setorize e faça manutenção dos filtros.';
    }
    
    // Estratégia por cultura
    const culturaMap = {
        'horta': '🥬 Hortaliças precisam precisão → timer automático e mulch.',
        'perene': '☕ Cultivo perene: árvores sequestram carbono extra.',
        'pastagem': '🐄 Pastagem rotacionada reduz metano.',
        'graos': '🌽 Grãos: rotação de culturas diminui pegada.'
    };
    const extraCultura = culturaMap[cultura] || '🌱 Pratique manejo integrado para melhores resultados.';
    
    const classeEmissao = data.carbonoPorHa < 800 ? '🟢 BAIXA' : 
                          (data.carbonoPorHa < 1800 ? '🟡 MÉDIA' : '🔴 ALTA');
    
    const area = parseFloat(areaHaInput.value);
    
    const relatorioHtml = `
        <div style="background:white; border-radius:20px; padding:18px;">
            <div style="display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-bottom:16px;">
                <span class="metric-card"><i class="fas fa-ruler-combined"></i> ${area.toFixed(1)} ha</span>
                <span class="metric-card"><i class="fas fa-seed