import { gerarAmbiente, imprimirMatriz } from './ambiente.js';
import agente1 from './agente1.js';
import agente2 from './agente2.js';
import agente3 from './agente3.js';

// Função para ajustar o layout baseado no tamanho da matriz
function ajustarLayoutParaMatriz(tamanho) {
    const gameArea = document.getElementById('gameArea');
    const matrizContainer = document.getElementById('matrizContainer');
    const matrizDiv = document.getElementById('matriz');
    const leftPanel = document.querySelector('.left-panel');
    const rightPanel = document.querySelector('.right-panel');
    const tabelaPontuacoes = document.getElementById('tabela-pontuacoes');
    const agenteInfo = document.getElementById('agente-info');
    const toggleButton = document.getElementById('toggle-agente-info');
    const actionLog = document.getElementById('action-log');

    matrizContainer.appendChild(toggleButton);

    if (tamanho > 9) {
        gameArea.classList.add('matriz-grande-layout');
        matrizContainer.classList.add('matriz-grande-container');
        matrizDiv.classList.add('matriz-grande');
        
        const tabelasContainer = document.createElement('div');
        tabelasContainer.className = 'tabelas-ajustadas';
        tabelasContainer.appendChild(tabelaPontuacoes);
        tabelasContainer.appendChild(agenteInfo);
        tabelasContainer.appendChild(actionLog);
        
        leftPanel.appendChild(tabelasContainer);
    } else {
        gameArea.classList.remove('matriz-grande-layout');
        matrizContainer.classList.remove('matriz-grande-container');
        matrizDiv.classList.remove('matriz-grande');
        
        leftPanel.insertBefore(tabelaPontuacoes, leftPanel.children[1]);
        rightPanel.insertBefore(agenteInfo, rightPanel.children[0]);
        rightPanel.insertBefore(actionLog, rightPanel.children[1]);
        
        const tabelasAjustadas = document.querySelector('.tabelas-ajustadas');
        if (tabelasAjustadas) {
            tabelasAjustadas.remove();
        }
    }
}

function atualizarInfoAgente(versaoAgente) {
    const infoDiv = document.getElementById('agente-info');
    let infoTexto = '';
    
    switch(versaoAgente) {
        case '1':
            infoTexto = 'Agente Aleatório: Move-se aleatoriamente pelo ambiente.';
            break;
        case '2':
            infoTexto = 'Agente Reativo: Reage a percepções do ambiente.';
            break;
        case '3':
            infoTexto = 'Agente com Algoritmo Genético: Usa aprendizado para melhorar performance.';
            break;
        default:
            infoTexto = 'Nenhum agente selecionado.';
    }
    
    infoDiv.querySelector('p').textContent = infoTexto;
}

let agenteSelecionado = null;
let ambiente = null;
let ultimaExecucao = 0;

export function registrarAcao(acao, detalhes = '') {
    const actionLog = document.getElementById('action-log-body');
    const novaLinha = document.createElement('tr');
    
    const celulaExecucao = document.createElement('td');
    celulaExecucao.textContent = ultimaExecucao;
    
    const celulaAcao = document.createElement('td');
    celulaAcao.textContent = acao;
    
    const celulaDetalhes = document.createElement('td');
    celulaDetalhes.textContent = detalhes;
    
    novaLinha.appendChild(celulaExecucao);
    novaLinha.appendChild(celulaAcao);
    novaLinha.appendChild(celulaDetalhes);
    
    actionLog.appendChild(novaLinha);
    actionLog.scrollTop = actionLog.scrollHeight;
}

function atualizarVisualizacaoAgente(x, y) {
    document.querySelectorAll('.cell').forEach(cell => {
        cell.classList.remove('agente');
    });
    
    const cell = document.querySelector(`.cell[data-x="${x}"][data-y="${y}"]`);
    if (cell) {
        cell.classList.add('agente');
    }
}

document.getElementById('gerarAmbiente').addEventListener('click', () => {
    const versaoAgente = document.getElementById('versaoAgente').value;
    const tamanho = parseInt(document.getElementById('tamanho').value);
    
    document.getElementById('action-log-body').innerHTML = '';
    ultimaExecucao++;
    
    ajustarLayoutParaMatriz(tamanho);
    
    ambiente = gerarAmbiente(tamanho, 0.20, 1, 1);
    imprimirMatriz(ambiente);
    registrarAcao('Ambiente gerado', `Tamanho: ${tamanho}x${tamanho}`);

    if (agenteSelecionado && agenteSelecionado.pararJogo) {
        agenteSelecionado.pararJogo();
    }

    switch (versaoAgente) {
        case '1':
            agenteSelecionado = agente1;
            registrarAcao('Agente iniciado', 'Aleatório');
            agenteSelecionado.iniciarJogo(ambiente);
            break;
        case '2':
            agenteSelecionado = agente2;
            registrarAcao('Agente iniciado', 'Reativo');
            agenteSelecionado.iniciarJogo(ambiente);
            break;
        case '3':
            agenteSelecionado = agente3;
            registrarAcao('Agente iniciado', 'Algoritmo Genético');
            agenteSelecionado.iniciarJogo(ambiente);
            break;
        default:
            alert('Agente não reconhecido');
    }

    atualizarVisualizacaoAgente(0, 0);
    atualizarInfoAgente(versaoAgente);
});

document.getElementById('parar').addEventListener('click', function() {
    if (agenteSelecionado && agenteSelecionado.pararJogo) {
        agenteSelecionado.pararJogo();
        registrarAcao('Jogo', 'Parado');
    }
});

document.getElementById('toggle-agente-info').addEventListener('click', function() {
    const infoDiv = document.getElementById('agente-info');
    infoDiv.style.display = infoDiv.style.display === 'none' ? 'block' : 'none';
});

export function adicionarPontuacao(execucao, pontuacao) {
    const corpoTabela = document.getElementById('corpo-tabela');
    const novaLinha = document.createElement('tr');
    
    const celulaExecucao = document.createElement('td');
    celulaExecucao.textContent = execucao;
    
    const celulaPontuacao = document.createElement('td');
    celulaPontuacao.textContent = pontuacao;
    
    novaLinha.appendChild(celulaExecucao);
    novaLinha.appendChild(celulaPontuacao);
    corpoTabela.appendChild(novaLinha);
    
    novaLinha.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

ajustarLayoutParaMatriz(4);