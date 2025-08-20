const CONFIG = {
  precoEletricaM2: 78,
  taxaFixaInstalacao: 250,
  precoPorKm: 2.5,
  custoHoraViagem: 46.87,
  custoHoraTrabalho: 31.25,
  custoDiariaHotel: 300,
  custoHoraMunk: 200,
  impostoInstalacao: 1.18,
  precoAcmM2: 450,
  profundidadeTotemM: 0.10,
  bordaInternaTotemM: 0.04,
};

const vendedores = [
    { id: 'patricia', nome: 'Patricia Gomez', cargo: 'Consultora comercial - Via Painéis', fone: '(47) 93618-1267', email: 'vendas5@viapaineis.com.br' },
    { id: 'William', nome: 'William', cargo: 'Consultor Comercial', fone: '(47) 99722-1472', email: 'vendas1@viapaineis.com.br' },
    { id: 'Patric', nome: 'Patric', cargo: 'Consultor Comercial', fone: '(47) 99711-2059', email: 'vendas4@viapaineis.com.br' },
    { id: 'gerente', nome: 'Gerente Exemplo', cargo: 'Gerente Comercial', fone: '(47) 9999-0003', email: 'gerente.comercial@viapaineis.com.br' }
];

let painelSelecionado = null;
let ultimoResultado = null;

function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function carregarVendedores() {
    const select = document.getElementById('selectVendedor');
    if (!select) return;
    vendedores.forEach(v => {
    const option = document.createElement('option');
    option.value = v.id;
    option.textContent = v.nome;
    select.appendChild(option);
    });
}

function carregarModelos() {
  const select = document.getElementById("modeloPainel");
  if (!select) return;
  select.innerHTML = '<option value="">Selecionar modelo do painel</option>';
  produtosPainel.forEach(p => {
    const option = document.createElement('option');
    option.value = p.nome;
    let textoOpcao;
    if (p.dimensao === "0.32x0.16") {
    textoOpcao = `${p.nome} ${p.ambiente} sobmedida`;
    } else {
    const [larguraM, alturaM] = p.dimensao.split('x').map(Number);
    const larguraCm = Math.round(larguraM * 100);
    const alturaCm = Math.round(alturaM * 100);
    textoOpcao = `${p.nome} ${p.ambiente} ${larguraCm}x${alturaCm}cm`;
    }
    option.textContent = textoOpcao;
    select.appendChild(option);
  });
}

function atualizarPainelSelecionado() {
  const select = document.getElementById("modeloPainel");
  const valorUnitarioInput = document.getElementById("valorUnitario");
  if (!select || !valorUnitarioInput) return;
  const nomeSelecionado = select.value;
  painelSelecionado = produtosPainel.find(p => p.nome === nomeSelecionado) || null;
  if (painelSelecionado && painelSelecionado.valor === "MANUAL") {
    valorUnitarioInput.value = "";
    valorUnitarioInput.readOnly = false;
    valorUnitarioInput.placeholder = "Insira o valor unitário";
    valorUnitarioInput.focus();
  } else if (painelSelecionado) {
    valorUnitarioInput.value = painelSelecionado.valor;
    valorUnitarioInput.readOnly = true;
    valorUnitarioInput.placeholder = "";
  } else {
    valorUnitarioInput.value = "";
    valorUnitarioInput.readOnly = true;
    valorUnitarioInput.placeholder = "Valor Unitário (R$)";
  }
}

function calcularMedidaFinal(larguraInput, alturaInput) {
  if (!painelSelecionado) return { qtd: 0, medidaFinal: '0.00m x 0.00m', finalW: 0, finalH: 0 };
  const [modLarg, modAlt] = painelSelecionado.dimensao.split("x").map(Number);
  let qtd, medidaFinal, finalW, finalH;
  if (painelSelecionado.tipo === "gabinete") {
    const qtdLarg = Math.floor(larguraInput / modLarg);
    const qtdAlt = Math.floor(alturaInput / modAlt);
    qtd = qtdLarg * qtdAlt;
    finalW = qtdLarg * modLarg;
    finalH = qtdAlt * modAlt;
  } else {
    finalW = Math.floor(larguraInput / modLarg) * modLarg;
    finalH = Math.floor(alturaInput / modAlt) * modAlt;
    qtd = parseFloat((finalW * finalH).toFixed(4));
  }
  medidaFinal = `${finalW.toFixed(2)}m x ${finalH.toFixed(2)}m`;
  return { qtd, medidaFinal, finalW, finalH };
}

function desenharEsbocoTotem(wTotem, hTotem, wDisp, hDisp, posicao) {
  const canvas = document.getElementById("esbocoTotem");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const marginTop = 20, marginBottom = 20;
  const escala = (canvas.height - marginTop - marginBottom) / hTotem * 0.85;
  const tW = wTotem * escala, tH = hTotem * escala;
  const dW = wDisp * escala, dH = hDisp * escala;
  const cx = (canvas.width - tW) / 2, cy = marginTop;
  ctx.fillStyle = "#e0e0e0"; ctx.fillRect(cx, cy, tW, tH);
  ctx.strokeStyle = "#444"; ctx.lineWidth = 1; ctx.strokeRect(cx, cy, tW, tH);
  const bordaPx = CONFIG.bordaInternaTotemM * escala;
  let dispY;
  if (posicao === "cima") dispY = cy + bordaPx;
  else if (posicao === "baixo") dispY = cy + tH - dH - bordaPx;
  else dispY = cy + (tH - dH) / 2;
  ctx.fillStyle = "#111";
  ctx.fillRect(cx + (tW - dW) / 2, dispY, dW, dH);
}

function calcularCustoInstalacao(modulo) {
    const km = parseFloat(document.getElementById("kmLocal")?.value) || 0;
    const taxaFixa = CONFIG.taxaFixaInstalacao;
    const kmTotal = km * 2;
    const valorKM = kmTotal * CONFIG.precoPorKm;
    let tipoEntrega = 'instalacao';
    if (modulo === 'totem') {
    tipoEntrega = document.querySelector('input[name="tipoEntrega"]:checked').value;
    }
    if (tipoEntrega === 'frete') {
    const frete = (taxaFixa + valorKM);
    return { custoTotal: frete * CONFIG.impostoInstalacao, tipo: 'Frete' };
    }
    const tempoViagemHoras = parseFloat(document.getElementById("tempoViagem")?.value) || 0;
    const funcionarios = parseFloat(document.getElementById("funcionarios")?.value) || 0;
    const horasTrabalho = parseFloat(document.getElementById("tempoTrabalho")?.value) || 0;
    const munkHoras = parseFloat(document.getElementById("horasMunk")?.value) || 0;
    const horasDeslocamentoTotal = tempoViagemHoras * 2;
    const valorDeslocamento = horasDeslocamentoTotal * CONFIG.custoHoraViagem;
    const valorTrabalho = funcionarios * horasTrabalho * CONFIG.custoHoraTrabalho;
    const custoHotel = (kmTotal > 500) ? CONFIG.custoDiariaHotel : 0;
    let custoMunk = munkHoras * CONFIG.custoHoraMunk;
    if (modulo === 'parede' || modulo === 'vitrine') custoMunk = 0;
    const subtotal = taxaFixa + valorKM + valorDeslocamento + valorTrabalho + custoHotel + custoMunk;
    const custoTotal = subtotal * CONFIG.impostoInstalacao;
    return { custoTotal, tipo: 'Instalação' };
}

function getFormInputs(form) {
    const inputs = {};
    const elements = form.querySelectorAll('input, select');
    elements.forEach(el => {
    if (el.type === 'radio' && !el.checked) return;
    const key = el.id || el.name;
    if(key) inputs[key] = el.value;
    });
    return inputs;
}

function preencherFormulario(dados) {
    if (!dados || !dados.inputs) return;
    const inputs = dados.inputs;
    for (const key in inputs) {
    const element = document.getElementById(key) || document.querySelector(`[name="${key}"][value="${inputs[key]}"]`);
    if (element) {
    if (element.type === 'radio') {
    element.checked = true;
    } else {
    element.value = inputs[key];
    }
    }
    }
    document.getElementById('modeloPainel')?.dispatchEvent(new Event('change'));
    if (dados.modulo === 'pilar') document.getElementById('tipoPilar')?.dispatchEvent(new Event('change'));
    if (dados.modulo === 'totem') document.querySelector('input[name="tipoEntrega"]')?.dispatchEvent(new Event('change'));
}

function calcularOrcamento(modulo) {
  const resultadoDiv = document.getElementById("resultado");
  if (!painelSelecionado) { alert("Selecione um modelo de painel."); return; }
  let largura, altura;
  if (modulo === 'totem') {
    largura = parseFloat(document.getElementById("larguraDisplay").value);
    altura = parseFloat(document.getElementById("alturaDisplay").value);
  } else {
    largura = parseFloat(document.getElementById("larguraPainel").value);
    altura = parseFloat(document.getElementById("alturaPainel").value);
  }
  if (isNaN(largura) || isNaN(altura) || largura <= 0 || altura <= 0) { alert("Preencha as dimensões com valores válidos."); return; }
  const valorUnitario = parseFloat(document.getElementById("valorUnitario").value);
  if (isNaN(valorUnitario) || valorUnitario <= 0) { alert("Por favor, insira um valor unitário válido."); return; }
  const { qtd, medidaFinal, finalW, finalH } = calcularMedidaFinal(largura, altura);
  const selectControladora = document.getElementById("controladora");
  const optionSelecionadaCtrl = selectControladora.options[selectControladora.selectedIndex];
  const vendedorId = document.getElementById('selectVendedor').value;
  let custoPainel = qtd * valorUnitario;
  let custoControladora = parseFloat(optionSelecionadaCtrl.dataset.valor) || 0;
  let custoEstrutura = 0, custoEletrica = 0, custoInstalacao = 0;
  let custoPilar = 0, custoSapata = 0, custoACM = 0, totalACM = 0;
  let tipoEntrega = 'Instalação';
  let valorPorMetroQuadrado = 0;
  const inst = calcularCustoInstalacao(modulo);
  custoInstalacao = inst.custoTotal;
  tipoEntrega = inst.tipo;
  let quantidadeDeEstruturas = 0;
  if (painelSelecionado.tipo === 'm2') {
    quantidadeDeEstruturas = qtd;
    valorPorMetroQuadrado = valorUnitario;
  } else {
    const areaGabinete = parseFloat(painelSelecionado.dimensao.split('x')[0]) * parseFloat(painelSelecionado.dimensao.split('x')[1]);
    if(areaGabinete > 0) valorPorMetroQuadrado = valorUnitario / areaGabinete;
    switch (painelSelecionado.dimensao) {
    case '0.96x0.96': quantidadeDeEstruturas = qtd; break;
    case '0.50x1.00': quantidadeDeEstruturas = qtd / 2; break;
    case '0.50x0.50': quantidadeDeEstruturas = qtd / 4; break;
    default: quantidadeDeEstruturas = qtd;
    }
  }
  const valorEstruturaManual = parseFloat(document.getElementById("valorEstrutura")?.value) || 0;
  const custoEstruturaBase = quantidadeDeEstruturas * valorEstruturaManual;
  switch (modulo) {
    case 'fachada': case 'pilar': case 'totem': case 'vitrine':
    custoEstrutura = custoEstruturaBase;
    custoEletrica = qtd * CONFIG.precoEletricaM2;
    break;
    case 'parede': break;
  }
  if (modulo === 'pilar') {
    const tipoPilarSelect = document.getElementById('tipoPilar');
    const pilarOption = tipoPilarSelect.options[tipoPilarSelect.selectedIndex];
    const isCalandrado = pilarOption.dataset.calandrado === 'true';
    let valorPilarManual = parseFloat(document.getElementById('valorPilarManual').value) || 0;
    if (isCalandrado) {
    const qtdPilar = parseFloat(document.getElementById('qtdPilarCalandrado').value) || 1;
    custoPilar = valorPilarManual * qtdPilar;
    } else {
    custoPilar = valorPilarManual;
    }
    const modeloSapataValor = parseFloat(document.getElementById("modeloSapata").value) || 0;
    const qtdSapatas = parseInt(document.getElementById("qtdSapatas").value) || 0;
    custoSapata = modeloSapataValor * qtdSapatas;
  } else if (modulo === 'totem') {
    const wTotem = parseFloat(document.getElementById("larguraTotem").value);
    const hTotem = parseFloat(document.getElementById("alturaTotem").value);
    if (isNaN(wTotem) || isNaN(hTotem)) { alert("Preencha as dimensões do totem."); return; }
    const areaTotem = wTotem * hTotem;
    const frente = areaTotem - (finalW * finalH);
    const lateral = hTotem * CONFIG.profundidadeTotemM * 2;
    totalACM = frente + areaTotem + lateral;
    custoACM = totalACM * CONFIG.precoAcmM2;
    const posicao = document.getElementById("posicaoDisplay").value;
    desenharEsbocoTotem(wTotem, hTotem, finalW, finalH, posicao);
  }
  const tipoFace = document.querySelector('input[name="tipoFace"]:checked').value;
  const isDuplaFace = tipoFace === 'dupla';
  if (isDuplaFace) {
    custoPainel *= 2;
    custoEletrica *= 2;
    custoControladora *= 2;
  }
  const total = custoPainel + custoControladora + custoEstrutura + custoEletrica + custoInstalacao + custoPilar + custoSapata + custoACM;
  let totalArredondado = total;
let diferenca = totalArredondado - total;
custoInstalacao += diferenca;
  ultimoResultado = { total, medidaFinal, painel: painelSelecionado, qtd, valorUnitario, custoPainel, custoControladora, custoEstrutura, custoEletrica, custoInstalacao, custoPilar, custoSapata, custoACM, totalACM, tipoEntrega, isDuplaFace, controladoraTexto: optionSelecionadaCtrl.text, vendedorId, modulo, inputs: getFormInputs(document.getElementById('orcamento-form')), valorPorMetroQuadrado };
  let resultadoHTML = `<h3 class="text-lg font-semibold mb-2">Resumo do Orçamento</h3><ul class="space-y-1">`;
  if (isDuplaFace) resultadoHTML += `<li><strong>Tipo:</strong> Dupla Face</li>`;
  resultadoHTML += `<li><strong>Painel:</strong> ${formatCurrency(custoPainel)} (${medidaFinal})</li>`;
  if (custoEstrutura > 0) resultadoHTML += `<li><strong>Estrutura:</strong> ${formatCurrency(custoEstrutura)}</li>`;
  if (custoEletrica > 0) resultadoHTML += `<li><strong>Elétrica:</strong> ${formatCurrency(custoEletrica)}</li>`;
  if (custoACM > 0) resultadoHTML += `<li><strong>Revestimento ACM (${totalACM.toFixed(2)} m²):</strong> ${formatCurrency(custoACM)}</li>`;
  if (custoPilar > 0) resultadoHTML += `<li><strong>Pilar:</strong> ${formatCurrency(custoPilar)}</li>`;
  if (custoSapata > 0) resultadoHTML += `<li><strong>Sapata:</strong> ${formatCurrency(custoSapata)}</li>`;
  resultadoHTML += `<li><strong>${tipoEntrega}:</strong> ${formatCurrency(custoInstalacao)}</li>`;
  resultadoHTML += `<li><strong>Controladora:</strong> ${formatCurrency(custoControladora)}</li>`;
  resultadoHTML += `</ul><p class="mt-4 pt-2 border-t text-lg font-bold text-indigo-700">TOTAL: ${formatCurrency(total)}</p>`;
  resultadoDiv.innerHTML = resultadoHTML;
  resultadoDiv.classList.remove('hidden');
  document.getElementById('container-gerar-proposta')?.classList.remove('hidden');
}

function hideResultOnInputChange() {
    document.getElementById('resultado')?.classList.add('hidden');
    document.getElementById('container-gerar-proposta')?.classList.add('hidden');
}

function atualizarCamposPilar() {
    const select = document.getElementById('tipoPilar');
    if (!select) return;
    const valorInput = document.getElementById('valorPilarManual');
    const qtdContainer = document.getElementById('container-qtd-calandrado');
    const selectedOption = select.options[select.selectedIndex];
    const precoPadrao = selectedOption.value;
    const isCalandrado = selectedOption.dataset.calandrado === 'true';
    valorInput.value = precoPadrao;
    if (isCalandrado) qtdContainer.classList.remove('hidden');
    else qtdContainer.classList.add('hidden');
}

function toggleInstalacaoFields() {
    if (document.body.dataset.modulo !== 'totem') return;
    const tipoEntrega = document.querySelector('input[name="tipoEntrega"]:checked').value;
    document.querySelectorAll('.campo-completo').forEach(c => c.style.display = tipoEntrega === 'frete' ? 'none' : 'block');
}

function preencherProposta() {
    const dados = JSON.parse(localStorage.getItem('dadosProposta'));
    if (dados) {
    let totalArredondado = Math.ceil(dados.total / 100) * 100;
    let diferenca = totalArredondado - dados.total;
    dados.custoInstalacao += diferenca;
    dados.total = totalArredondado;
}

    if (!dados) {
    document.body.innerHTML = '<h1>Dados da proposta não encontrados.</h1>';
    return;
    }

    const vendedor = vendedores.find(v => v.id === dados.vendedorId);
    const totalEquipamentos = dados.custoPainel + dados.custoControladora;
    const totalInstalacao = dados.custoEstrutura + dados.custoEletrica + dados.custoInstalacao + dados.custoPilar + dados.custoSapata + dados.custoACM;

    // Número da proposta
    let contador = parseInt(localStorage.getItem('propostaContador')) || 0;
    contador++;
    localStorage.setItem('propostaContador', contador);
    const numeroProposta = contador.toString().padStart(2, '0');

    // Título + A/c
    const tituloContainer = document.querySelector('h1');
    if (tituloContainer) {
    tituloContainer.textContent = 'Proposta Comercial';
    }

    // A/c (cliente)
    const clienteNomeElement = document.getElementById('cliente-nome');
    if (clienteNomeElement) {
    clienteNomeElement.textContent = dados.inputs?.clienteNome || '-';
    }

    // Medidas em cm
    const medidasCm = dados.medidaFinal
    .replace(/m/g, '') // remove 'm'
    .split('x')
    .map(v => (parseFloat(v.trim()) * 100).toFixed(0) + 'cm')
    .join('x');

    // OBJETO
    document.getElementById('objeto-proposta').textContent =
    `Painel LED ${dados.painel.resolucao} ${dados.painel.ambiente} ${medidasCm}`;

    // Equipamentos
    let equipamentosHTML = "";

    // Painel
    const unidadesPainel = dados.isDuplaFace ? dados.qtd * 2 : dados.qtd;
    const dimCm = dados.painel.dimensao.split('x').map(v => `${(parseFloat(v) * 100).toFixed(0)}cm`).join('x');
    equipamentosHTML += `
    <div class="line-item text-sm">
    <span class="label">✓ ${unidadesPainel} ${dados.painel.tipo === 'm2' ? 'm² de' : 'gabinetes de'} LED ${dados.painel.resolucao} – ${dimCm} – ${dados.painel.ambiente}</span>
    <span class="dots"></span>
    <span class="price">${formatCurrency(dados.custoPainel)}</span>
    </div>
    <div class="text-xs text-gray-500 pl-4">
    (Valor por metro quadrado: ${formatCurrency(dados.valorPorMetroQuadrado)} – Lâmpada Kinglight – Resolução 2112x1152px)
    </div>
    `;

    // Controladora
    equipamentosHTML += `
    <div class="line-item text-sm">
    <span class="label">✓ ${dados.controladoraTexto}</span>
    <span class="dots"></span>
    <span class="price">${formatCurrency(dados.custoControladora)}</span>
    </div>
    `;

    document.getElementById('tabela-equipamentos').innerHTML = equipamentosHTML;
    document.getElementById('total-equipamentos').textContent = formatCurrency(totalEquipamentos);

    // Itens de instalação
    let instalacaoHTML = "";
    if (dados.custoEstrutura > 0) instalacaoHTML += `<li class="line-item"><span class="label">✓ Estrutura metálica superior de sustentação dos gabinetes de LED;</span><span class="dots"></span><span class="price">${formatCurrency(dados.custoEstrutura)}</span></li>`;
    if (dados.custoEletrica > 0) instalacaoHTML += `<li class="line-item"><span class="label">✓ Elétrica de instalação interna;</span><span class="dots"></span><span class="price">${formatCurrency(dados.custoEletrica)}</span></li>`;
    if (dados.custoPilar > 0) instalacaoHTML += `<li class="line-item"><span class="label">✓ Pilar de ferro;</span><span class="dots"></span><span class="price">${formatCurrency(dados.custoPilar)}</span></li>`;
    if (dados.custoSapata > 0) instalacaoHTML += `<li class="line-item"><span class="label">✓ Sapata de concreto;</span><span class="dots"></span><span class="price">${formatCurrency(dados.custoSapata)}</span></li>`;
    if (dados.custoACM > 0) instalacaoHTML += `<li class="line-item"><span class="label">✓ Revestimento em ACM (${dados.totalACM.toFixed(2)} m²);</span><span class="dots"></span><span class="price">${formatCurrency(dados.custoACM)}</span></li>`;
    if (dados.custoInstalacao > 0) instalacaoHTML += `<li class="line-item"><span class="label">✓ ${dados.tipoEntrega} / configuração e fixação no local;</span><span class="dots"></span><span class="price">${formatCurrency(dados.custoInstalacao)}</span></li>`;

    document.getElementById('lista-instalacao').innerHTML = instalacaoHTML;
    document.getElementById('total-instalacao').textContent = formatCurrency(totalInstalacao);

    // Totais
    document.getElementById('total-geral').textContent = formatCurrency(dados.total);

    const totalProjeto = dados.total;
    const condicoesContainer = document.getElementById('lista-condicoes');

    // Opção 1: À vista com 5% de desconto (1+1)
    const valorComDesconto = totalProjeto * 0.95;
    const parcelaAVista = valorComDesconto / 2;
    const condicao1 = `A vista 5% desconto (1+1): ${formatCurrency(parcelaAVista)} + 1 de ${formatCurrency(parcelaAVista)}`;

    // Opção 2: 40% de entrada + 6x
    const entrada40 = totalProjeto * 0.40;
    const saldo6x = totalProjeto * 0.60;
    const parcela6x = saldo6x / 6;
    const condicao2 = `40% de entrada e saldo em 6x (boleto ou cartão) sem juros: ${formatCurrency(entrada40)} + 6x ${formatCurrency(parcela6x)}`;

    // Opção 3: 12x no cartão com 8% de juros
    const valorComJuros = totalProjeto * 1.12;
    const parcela12x = valorComJuros / 12;
    const condicao3 = `12x de ${formatCurrency(parcela12x)} no cartão de crédito`;

    condicoesContainer.innerHTML = `
    <li>${condicao1};</li>
    <li>${condicao2};</li>
    <li>${condicao3};</li>
    `;

    // Vendedor
    if (vendedor) {
    document.getElementById('vendedor-nome').textContent = vendedor.nome;
    document.getElementById('vendedor-cargo').textContent = vendedor.cargo;
    document.getElementById('vendedor-fone').textContent = vendedor.fone;
    document.getElementById('vendedor-email').textContent = vendedor.email;
    }

    // Data
    const hoje = new Date();
    const dataFormatada = hoje.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    document.getElementById('data-emissao').textContent = `Porto Belo, ${dataFormatada}`;
}


async function gerarPDF() {
    const elementoParaImprimir = document.getElementById('conteudo-proposta');
    const paginas = elementoParaImprimir.querySelectorAll('section.print-page');
    const docDefinition = {
    pageSize: 'A4',
    pageMargins: [0, 0, 0, 0],
    content: []
    };
    for (let i = 0; i < paginas.length; i++) {
    const canvas = await html2canvas(paginas[i], { scale: 2 });
    const imgData = canvas.toDataURL('image/jpeg', 0.9);
    if (i > 0) {
    docDefinition.content.push({ text: '', pageBreak: 'before' });
    }
    docDefinition.content.push({ image: imgData, width: 595.28 });
    }
    pdfMake.createPdf(docDefinition).download('proposta.pdf');
}

function gerarWord() {
    if (!window.docx) {
    alert("Biblioteca docx não carregada. Tente atualizar a página.");
    return;
    }

    const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableCell, TableRow, WidthType, BorderStyle } = window.docx;

    const dados = JSON.parse(localStorage.getItem('dadosProposta'));
    if (!dados) {
    alert("Dados da proposta não encontrados.");
    return;
    }

    const vendedor = vendedores.find(v => v.id === dados.vendedorId) || {};
    let contador = parseInt(localStorage.getItem('propostaContador')) || 0;
    contador++;
    localStorage.setItem('propostaContador', contador);
    const numeroProposta = contador.toString().padStart(2, '0');
    const nomeVendedor = vendedor.nome ? vendedor.nome.split(' ')[0].toLowerCase() : 'proposta';
    const nomeFicheiro = `proposta comercial ${numeroProposta} - ${nomeVendedor}.docx`;

    const totalEquipamentos = dados.custoPainel + dados.custoControladora;
    const totalInstalacao = dados.custoEstrutura + dados.custoEletrica + dados.custoInstalacao + dados.custoPilar + dados.custoSapata + dados.custoACM;

    // Helper para criar uma linha da tabela
    const createLineItemRow = (label, price) => {
    return new TableRow({
    children: [
    new TableCell({
    children: [new Paragraph({ children: [new TextRun(label)] })],
    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
    }),
    new TableCell({
    children: [new Paragraph({ text: price, alignment: AlignmentType.RIGHT })],
    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
    }),
    ],
    });
    };

    const doc = new Document({
    sections: [{
    children: [
    new Paragraph({ text: "Proposta comercial", heading: HeadingLevel.HEADING_1, spacing: { after: 400 } }),
    new Paragraph({ text: `1 – OBJETO: Painel LED ${dados.painel.resolucao} ${dados.painel.ambiente} ${dados.medidaFinal}`, spacing: { after: 200 } }),
    new Paragraph({ text: "Itens inclusos (Equipamentos):", style: "strong", spacing: { after: 200 } }),
    new Table({
    columnWidths: [8000, 2000],
    rows: [
    createLineItemRow(`✓ ${dados.isDuplaFace ? dados.qtd * 2 : dados.qtd} Gabinetes LED ${dados.painel.resolucao} - ${dados.painel.dimensao.replace('x','x')}cm - ${dados.painel.ambiente}`, formatCurrency(dados.custoPainel)),
    createLineItemRow(`✓ ${dados.isDuplaFace ? '2' : '1'} ${dados.controladoraTexto}`, formatCurrency(dados.custoControladora)),
    createLineItemRow('Valor equipamentos', formatCurrency(totalEquipamentos)),
    ],
    }),
    new Paragraph({ text: "\nItens opcionais complementares (Estrutura/ mão de obra):", style: "strong", spacing: { after: 200 } }),
    new Table({
    columnWidths: [8000, 2000],
    rows: [
    createLineItemRow('Valor materiais / instalação', formatCurrency(totalInstalacao)),
    ],
    }),
    new Paragraph({ text: "", spacing: { after: 400 } }),
    new Table({
    columnWidths: [8000, 2000],
    rows: [
    createLineItemRow('Valor total do projeto', formatCurrency(dados.total)),
    ],
    }),
    ],
    }],
    styles: {
    paragraph: { run: { size: "22pt" } }, // 11pt
    strong: { run: { bold: true, size: "22pt" } },
    }
    });

    Packer.toBlob(doc).then(blob => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = nomeFicheiro;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    });
}

async function carregarHistorico() {
    try {
    const response = await fetch('http://localhost:3000/propostas', {
    headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Falha ao carregar o histórico.');
    const propostas = await response.json();
    const container = document.getElementById('lista-historico');
    if (!container) return;
    if (propostas.length === 0) {
    container.innerHTML = '<p>Nenhuma proposta salva ainda.</p>';
    return;
    }
    container.innerHTML = propostas.map(p => `
    <div class="bg-white p-4 rounded shadow cursor-pointer hover:bg-gray-100" data-proposta='${JSON.stringify(p.data)}'>
    <p class="font-semibold">${p.title}</p>
    <p class="text-xs text-gray-500">Criada em: ${new Date(p.createdAt).toLocaleDateString('pt-BR')}</p>
    </div>
    `).join('');

    container.querySelectorAll('[data-proposta]').forEach(item => {
    item.addEventListener('click', (e) => {
    const dadosProposta = JSON.parse(e.currentTarget.dataset.proposta);
    localStorage.setItem('propostaParaCarregar', JSON.stringify(dadosProposta));
    window.location.href = `./${dadosProposta.modulo}/${dadosProposta.modulo}.html`;
    });
    });
    } catch (error) {
    if(document.getElementById('lista-historico')) document.getElementById('lista-historico').innerHTML = `<p class="text-red-500">${error.message}</p>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
  const body = document.body;
  const moduloAtual = body.dataset.modulo;
  if (!moduloAtual) return;

  if (moduloAtual === 'proposta') {
    preencherProposta();
    const btnSalvarPDF = document.getElementById('btnSalvarPDF');
    const btnSalvarWord = document.getElementById('btnSalvarWord');
    if (btnSalvarPDF) btnSalvarPDF.addEventListener('click', gerarPDF);
    if (btnSalvarWord) btnSalvarWord.addEventListener('click', gerarWord);
  } 
  else if (moduloAtual === 'register') {
    const form = document.getElementById('register-form');
    if (form) {
    form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const name = form.name.value;
    const email = form.email.value;
    const password = form.password.value;
    try {
    const response = await fetch('http://localhost:3000/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
    });
    const message = await response.text();
    alert(message);
    if (response.ok) form.reset();
    } catch (error) {
    alert('Erro ao conectar com o servidor.');
    }
    });
    }
  }
  else if (moduloAtual === 'login') {
    const form = document.getElementById('login-form');
    if (form) {
    form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const email = form.email.value;
    const password = form.password.value;
    try {
    const response = await fetch('http://localhost:3000/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
    });
    if (response.ok) {
    const data = await response.json();
    localStorage.setItem('authToken', data.token);
    alert('Login bem-sucedido!');
    window.location.href = 'index.html';
    } else {
    const message = await response.text();
    alert(`Falha no login: ${message}`);
    }
    } catch (error) {
    alert('Erro ao conectar com o servidor.');
    }
    });
    }
  }
  else if (moduloAtual === 'historico') {
    carregarHistorico();
  }
  else { // Lógica das páginas de cálculo
    carregarModelos();
    carregarVendedores();
    const dadosParaCarregar = JSON.parse(localStorage.getItem('propostaParaCarregar'));
    if (dadosParaCarregar && dadosParaCarregar.modulo === moduloAtual) {
    preencherFormulario(dadosParaCarregar);
    localStorage.removeItem('propostaParaCarregar');
    setTimeout(() => {
    calcularOrcamento(moduloAtual);
    }, 200);
    }
    const form = document.getElementById('orcamento-form');
    const selectModelo = document.getElementById('modeloPainel');
    if (selectModelo) selectModelo.addEventListener('change', atualizarPainelSelecionado);
    if (moduloAtual === 'totem') {
    const radiosEntrega = document.querySelectorAll('input[name="tipoEntrega"]');
    radiosEntrega.forEach(radio => radio.addEventListener('change', toggleInstalacaoFields));
    toggleInstalacaoFields(); 
    }
    if (moduloAtual === 'pilar') {
    const tipoPilarSelect = document.getElementById('tipoPilar');
    if (tipoPilarSelect) {
    tipoPilarSelect.addEventListener('change', atualizarCamposPilar);
    atualizarCamposPilar();
    }
    }
    if (form) {
    form.addEventListener('submit', (event) => {
    event.preventDefault();
    calcularOrcamento(moduloAtual);
    });
    const formInputs = form.querySelectorAll('input, select');
    formInputs.forEach(input => input.addEventListener('change', hideResultOnInputChange));
    const btnGerarProposta = document.getElementById('btnGerarProposta');
    if (btnGerarProposta) {
    btnGerarProposta.addEventListener('click', async () => {
    if (!ultimoResultado) {
    alert("Calcule um orçamento antes de gerar a proposta.");
    return;
    }
    const token = localStorage.getItem('authToken');
    if (!token) {
    alert("Sessão expirada. Por favor, faça login novamente.");
    window.location.href = 'login.html';
    return;
    }
    const vendedor = vendedores.find(v => v.id === ultimoResultado.vendedorId);
    const tituloProposta = `Proposta Comercial - ${vendedor ? vendedor.nome : 'Geral'}`;

    try {
    const response = await fetch('http://localhost:3000/propostas', {
    method: 'POST',
    headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ title: tituloProposta, data: ultimoResultado })
    });
    if (!response.ok) throw new Error('Falha ao salvar a proposta.');
    
    localStorage.setItem('dadosProposta', JSON.stringify(ultimoResultado));
    window.open('../proposta.html', '_blank');
    } catch (error) {
    alert(error.message);
    }
    });
    }
    }
  }
});