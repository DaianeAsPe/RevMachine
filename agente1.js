import { clonarAmbiente, imprimirMatriz } from './ambiente.js';
import { registrarAcao, adicionarPontuacao } from './gerencia.js';

const agente = {
    x: 0,
    y: 0,
    movimento: true,
    pausado: false,
    ambienteOriginal: null, // Stores the original environment
    ambienteAtual: [], // Current environment state
    intervalo: null,
    pontuacao: 0,
    codigoColetado: false,
    jogoAtivo: true,
    balaDisponivel: true
};

// Execution control
let execucoes = 0;
const TOTAL_EXECUCOES = 3;
let pontuacoes = [];

// ==============================================
// EXISTING FUNCTIONS (maintained as-is)
// ==============================================

export function renderizarAgente(x, y) {
    const celula = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
    if (celula) {
        celula.innerHTML += '<img src="hacker.png" alt="Agente Hacker">';
        celula.classList.add('agente');
    }
}

function atirarNoMonstro() {
    if (!agente.balaDisponivel) return;
    
    agente.pontuacao -= 50;
    agente.balaDisponivel = false;
    registrarAcao('Ação', 'Atirou no monstro (-50 pontos)');
    
    const direcoes = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (let [dx, dy] of direcoes) {
        const nx = agente.x + dx;
        const ny = agente.y + dy;
        
        if (nx >= 0 && nx < agente.ambienteAtual.length && 
            ny >= 0 && ny < agente.ambienteAtual[0].length) {
            if (agente.ambienteAtual[nx][ny].includes('M')) {
                agente.ambienteAtual[nx][ny] = agente.ambienteAtual[nx][ny].replace('M', '');
                agente.pontuacao += 1000;
                registrarAcao('Sucesso', 'Máquina destruída (+1000 pontos)');
            }
        }
    }
    
    atualizarPontuacao();
}

// ==============================================
// MODIFIED FUNCTIONS
// ==============================================

export function iniciarJogo(ambiente) {
    // Store original environment on first run
    if (execucoes === 0) {
        agente.ambienteOriginal = clonarAmbiente(ambiente);
        pontuacoes = []; // Reset scores for new game
    }

    iniciarNovaExecucao();
}

function iniciarNovaExecucao() {
    if (execucoes >= TOTAL_EXECUCOES) {
        registrarAcao('Final', `Todas as ${TOTAL_EXECUCOES} execuções concluídas`);
        return;
    }

    execucoes++;
    registrarAcao('Execução', `Iniciando execução ${execucoes}/${TOTAL_EXECUCOES}`);

    // Reset agent state
    agente.ambienteAtual = clonarAmbiente(agente.ambienteOriginal);
    agente.x = 0;
    agente.y = 0;
    agente.pontuacao = 0;
    agente.codigoColetado = false;
    agente.jogoAtivo = true;
    agente.balaDisponivel = true;
    agente.movimento = true;
    agente.pausado = false;

    // Render initial state
    imprimirMatriz(agente.ambienteAtual, [{
        x: agente.x,
        y: agente.y,
        tipo: 'agente',
        classe: 'agente-ativo'
    }]);

    iniciarMovimentoAleatorio();
    atualizarPontuacao();
}

function moverAleatorio() {
    if (!agente.movimento || agente.pausado || !agente.jogoAtivo) return;

    const direcoes = ['up', 'down', 'left', 'right'];
    const direcaoEscolhida = direcoes[Math.floor(Math.random() * direcoes.length)];

    let novoX = agente.x;
    let novoY = agente.y;

    switch (direcaoEscolhida) {
        case 'up': novoX = Math.max(0, agente.x - 1); break;
        case 'down': novoX = Math.min(agente.ambienteAtual.length - 1, agente.x + 1); break;
        case 'left': novoY = Math.max(0, agente.y - 1); break;
        case 'right': novoY = Math.min(agente.ambienteAtual[0].length - 1, agente.y + 1); break;
    }

    // Update agent position
    const celulaAnterior = document.querySelector(`.cell[data-x="${agente.x}"][data-y="${agente.y}"]`);
    if (celulaAnterior) {
        celulaAnterior.classList.remove('agente');
        const imagemAgente = celulaAnterior.querySelector('img[alt="Agente Hacker"]');
        if (imagemAgente) celulaAnterior.removeChild(imagemAgente);
    }

    agente.x = novoX;
    agente.y = novoY;
    registrarAcao('Movimento', `Para (${novoX}, ${novoY})`);

    // Check cell content
    const conteudoCelula = agente.ambienteAtual[novoX][novoY];
    if (conteudoCelula.includes('E')) {
        agente.pontuacao -= 10;
        registrarAcao('Percepção', 'Escombros encontrados (-10 pontos)');
    }
    if (conteudoCelula.includes('M')) {
        finalizarExecucao('Máquina assassina encontrada');
        return;
    }
    if (conteudoCelula.includes('C') && !agente.codigoColetado) {
        agente.pontuacao += 2000;
        agente.codigoColetado = true;
        registrarAcao('Sucesso', 'Código coletado (+2000 pontos)');
    }
    if (agente.codigoColetado && novoX === 0 && novoY === 0) {
        finalizarExecucao('Missão cumprida!');
        return;
    }
    if (conteudoCelula.includes('R') && agente.balaDisponivel) {
        atirarNoMonstro();
    }

    atualizarPontuacao();
    
    // Render updated state
    imprimirMatriz(agente.ambienteAtual, [{
        x: agente.x,
        y: agente.y,
        tipo: 'agente',
        classe: 'agente-ativo'
    }]);
}

// ==============================================
// HELPER FUNCTIONS (maintained as-is)
// ==============================================

function iniciarMovimentoAleatorio() {
    if (agente.intervalo) clearInterval(agente.intervalo);
    agente.intervalo = setInterval(moverAleatorio, 500);
}

function atualizarPontuacao() {
    const elementoPontuacao = document.getElementById('pontuacao');
    if (elementoPontuacao) {
        elementoPontuacao.textContent = `Pontuação: ${agente.pontuacao} [Execução ${execucoes}/${TOTAL_EXECUCOES}]`;
    }
}

function finalizarExecucao(mensagem) {
    agente.jogoAtivo = false;
    clearInterval(agente.intervalo);
    
    // Store score
    pontuacoes.push(agente.pontuacao);
    adicionarPontuacao(execucoes, agente.pontuacao);
    
    registrarAcao('Resultado', `${mensagem} Pontuação: ${agente.pontuacao}`);

    // Start next execution or finish
    if (execucoes < TOTAL_EXECUCOES) {
        setTimeout(iniciarNovaExecucao, 1500); // Delay before next run
    } else {
        registrarAcao('Relatório', `Pontuações finais: ${pontuacoes.join(', ')}`);
    }
}

// ==============================================
// EXPORTED OBJECT (maintained as-is)
// ==============================================

export default {
    iniciarJogo,
    pausarJogo: function() {
        agente.pausado = true;
        clearInterval(agente.intervalo);
        registrarAcao('Jogo', 'Pausado');
    },
    retomarJogo: function() {
        agente.pausado = false;
        iniciarMovimentoAleatorio();
        registrarAcao('Jogo', 'Retomado');
    },
    pararJogo: function() {
        agente.jogoAtivo = false;
        clearInterval(agente.intervalo);
        registrarAcao('Jogo', 'Parado');
    }
};