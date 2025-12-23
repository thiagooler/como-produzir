/* ARQUIVO: engine.js - Lógica Central V12 (Fluxo Obrigatório & Relatório Compacto) */

const BRL = v => v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const cleanName = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '');
const getDim = (name) => { const m = name.match(/\d+x\d+/i); return m ? m[0].toLowerCase() : null; };
const isDigitalProduct = (n) => cleanName(n).includes('arquivo') || cleanName(n).includes('digital');
const isPrintProduct = (n) => cleanName(n).includes('foto') || cleanName(n).includes('revel');
const isFrameProduct = (n) => cleanName(n).includes('porta') || cleanName(n).includes('moldura');

const BASE_HTML = `
<div id="view-start" class="full-screen-overlay">
    <div style="max-width:400px; margin:40px auto; text-align:center">
        <h2 style="color:var(--brand); margin-bottom:5px">Bem-vindo!</h2>
        <p style="color:#57606a; margin-bottom:30px">Vamos selecionar suas fotos.</p>
        <div id="startInfo" class="card-box hidden" style="background:#fffbe6; border-color:#d4a72c; text-align:left">
            <h4 style="margin:0 0 10px 0; color:#9a6700">🎁 Seus Créditos:</h4>
            <ul id="startList" style="margin:0; padding-left:20px; font-size:13px; color:#333"></ul>
        </div>
        <div class="card-box" onclick="app.setMode('album')" style="cursor:pointer; border-left:4px solid var(--brand); text-align:left">
            <strong style="font-size:16px">📚 Montar Fotolivro</strong><br><span style="font-size:13px; color:#57606a">Selecionar fotos para o álbum.</span>
        </div>
        <div class="card-box" onclick="app.setMode('avulso')" style="cursor:pointer; border-left:4px solid var(--accent); text-align:left">
            <strong style="font-size:16px">📸 Revelações Avulsas</strong><br><span style="font-size:13px; color:#57606a">Apenas fotos, quadros ou arquivos.</span>
        </div>
    </div>
</div>

<div id="view-gallery" class="main-container hidden">
    <div class="gallery-grid">
        <div class="photo-area" id="photoArea">
            <button class="nav-btn nav-left" onclick="app.nav(-1)">❮</button>
            <img id="imgMain" src="">
            <div class="discard-overlay">DESCARTADA</div>
            <button class="nav-btn nav-right" onclick="app.nav(1)">❯</button>
            <div style="position:absolute; bottom:15px; background:rgba(255,255,255,0.9); padding:4px 10px; border-radius:20px; font-size:12px; font-weight:bold" id="imgName"></div>
        </div>
        <div class="sidebar">
            <div style="text-align:center; font-size:12px; color:#57606a; margin-bottom:10px" id="counter"></div>
            
            <button id="btnDiscard" class="btn btn-discard" onclick="app.toggleDiscard()">🗑️ Não quero esta foto</button>
            <div style="margin-bottom:15px; border-bottom:1px solid #eee"></div>

            <div id="dynamicProds"></div>
            <button id="btnFinish" class="btn hidden" onclick="app.finish()">✅ Finalizar Seleção</button>
        </div>
    </div>
</div>

<div id="stickyFooter" class="sticky-footer hidden">
    <div style="font-size:12px; color:#57606a"><span id="stickQtd" style="font-weight:bold; color:#000; font-size:14px">0</span> itens</div>
    <div class="total-price" id="stickTotal">R$ 0,00</div>
</div>

<div id="view-summary" class="full-screen-overlay hidden">
    <div style="max-width:500px; margin:20px auto">
        <h2 style="text-align:center">Resumo do Pedido</h2>
        <div class="card-box" id="summaryContent"></div>
        <a id="btnWhats" target="_blank" class="btn btn-whats">Enviar Pedido no WhatsApp</a>
        <button class="btn btn-sec" onclick="location.reload()">Voltar</button>
    </div>
</div>
`;

const app = {
    idx: 0,
    sel: [], // Agora contém { extras: {}, isRemoved: bool }
    mode: 'avulso',

    init() {
        document.body.innerHTML = BASE_HTML;
        if(typeof CLIENT_DATA === 'undefined') return alert("Erro: Dados do cliente não encontrados.");
        
        this.fotos = CLIENT_DATA.fotos;
        this.produtos = CLIENT_DATA.produtos;
        this.creditos = CLIENT_DATA.creditos || [];
        this.entrada = CLIENT_DATA.entrada || 0;

        if(!this.fotos.length) return alert("Galeria Vazia");
        // Inicializa estado com isRemoved: false
        this.sel = this.fotos.map(()=>({ extras: {}, isRemoved: false }));
        
        if(this.fotos.length < 20) {
            this.setMode('avulso');
            return;
        }

        if(this.entrada > 0 || this.creditos.length > 0) {
            document.getElementById('startInfo').classList.remove('hidden');
            const list = document.getElementById('startList');
            if(this.entrada > 0) list.innerHTML += `<li>✅ Entrada Paga: <strong>${BRL(this.entrada)}</strong></li>`;
            this.creditos.forEach(c => list.innerHTML += `<li>🎁 Crédito: <strong>${c.qtd}x ${c.nome}</strong></li>`);
        }
    },

    setMode(m) {
        this.mode = m;
        document.getElementById('view-start').classList.add('hidden');
        document.getElementById('view-gallery').classList.remove('hidden');
        document.getElementById('stickyFooter').classList.remove('hidden');
        this.renderSidebar();
        this.load();
    },

    // --- BLOQUEIO DE NAVEGAÇÃO ---
    nav(d) {
        // Se estiver tentando avançar (d=1)
        if (d === 1) {
            const current = this.sel[this.idx];
            const hasProducts = Object.values(current.extras).reduce((a,b)=>a+b, 0) > 0;
            const isRemoved = current.isRemoved;

            if (!hasProducts && !isRemoved) {
                alert("⚠️ ATENÇÃO:\n\nVocê precisa decidir sobre esta foto antes de continuar.\n\nSelecione um produto OU clique em 'Não quero esta foto'.");
                return;
            }
        }

        this.idx = (this.idx + d + this.fotos.length) % this.fotos.length;
        this.load();
    },

    load() {
        const url = this.fotos[this.idx];
        document.getElementById('imgMain').src = url;
        document.getElementById('imgName').innerText = url.split('/').pop();
        document.getElementById('counter').innerText = `${this.idx + 1} / ${this.fotos.length}`;
        
        this.updateLogic();
        
        if(this.idx === this.fotos.length - 1) document.getElementById('btnFinish').classList.remove('hidden');
        else document.getElementById('btnFinish').classList.add('hidden');
    },

    renderSidebar() {
        const container = document.getElementById('dynamicProds');
        container.innerHTML = '';
        const grps = { 'Revelações': [], 'Porta Retratos': [], 'Outros': [] };
        
        this.produtos.forEach(p => {
            if(isFrameProduct(p.nome)) grps['Porta Retratos'].push(p);
            else if(isPrintProduct(p.nome)) grps['Revelações'].push(p);
            else grps['Outros'].push(p);
        });

        const mkGroup = (title, items) => {
            if(!items.length) return;
            let html = `<div class="prod-group"><div class="prod-title">${title}</div>`;
            items.forEach(p => {
                const safe = p.nome.replace(/\s/g,'');
                const cred = this.creditos.find(c=>c.nome===p.nome);
                let badge = cred ? `<span class="digital-badge">${cred.qtd} un. crédito</span>` : '';
                html += `
                <div class="prod-item" id="row_${safe}" data-name="${p.nome}">
                    <div class="prod-info">
                        <div>${p.nome} ${badge}</div>
                        <div>${BRL(p.preco)}</div>
                    </div>
                    <div class="stepper" id="stp_${safe}">
                        <button onclick="app.chg('${p.nome}', -1)">−</button>
                        <span id="val_${safe}">0</span>
                        <button onclick="app.chg('${p.nome}', 1)">+</button>
                    </div>
                </div>`;
            });
            html += `</div>`;
            container.innerHTML += html;
        };

        mkGroup('Revelações', grps['Revelações']);
        mkGroup('Molduras & Porta Retratos', grps['Porta Retratos']);
        mkGroup('Arquivos & Outros', grps['Outros']);
    },

    // --- AÇÃO: DISPENSAR FOTO ---
    toggleDiscard() {
        const s = this.sel[this.idx];
        s.isRemoved = !s.isRemoved;
        if(s.isRemoved) s.extras = {}; // Zera produtos se descartar
        this.updateLogic();
        
        // Se descartou, avança automático (opcional, melhora fluxo)
        if(s.isRemoved && this.idx < this.fotos.length -1) {
             setTimeout(() => this.nav(1), 300);
        }
    },

    chg(name, d) {
        const s = this.sel[this.idx];
        
        // Se adicionou algo, remove o flag de "Descartada"
        if(d > 0) s.isRemoved = false;

        const cur = s.extras[name] || 0;
        let next = Math.max(0, cur + d);
        
        if(isDigitalProduct(name)) next = Math.min(next, 1);
        if(next === 0) delete s.extras[name];
        else s.extras[name] = next;
        
        this.updateLogic();
    },

    updateLogic() {
        const s = this.sel[this.idx];
        const extras = s.extras;
        const hasPrint = Object.keys(extras).some(k => isPrintProduct(k) && extras[k] > 0);

        // UI do Descarte
        const btnDisc = document.getElementById('btnDiscard');
        const photoArea = document.getElementById('photoArea');
        
        if(s.isRemoved) {
            btnDisc.classList.add('active');
            btnDisc.innerText = "❌ FOTO DESCARTADA (Clique para recuperar)";
            photoArea.classList.add('discarded');
        } else {
            btnDisc.classList.remove('active');
            btnDisc.innerText = "🗑️ Não quero esta foto";
            photoArea.classList.remove('discarded');
        }

        // UI dos Produtos
        this.produtos.forEach(p => {
            const safe = p.nome.replace(/\s/g,'');
            const row = document.getElementById(`row_${safe}`);
            const stepper = document.getElementById(`stp_${safe}`);
            const valSpan = document.getElementById(`val_${safe}`);
            if(!row) return;

            // Se descartada, desabilita steppers visualmente
            if(s.isRemoved) {
                stepper.style.opacity = '0.3';
                stepper.style.pointerEvents = 'none';
            } else {
                stepper.style.opacity = '1';
                stepper.style.pointerEvents = 'auto';
            }

            let val = extras[p.nome] || 0;

            if(isFrameProduct(p.nome)) {
                const dim = getDim(p.nome);
                const matching = Object.keys(extras).some(k => isPrintProduct(k) && getDim(k) === dim && extras[k] > 0);
                if(matching && !s.isRemoved) {
                    row.classList.remove('hidden-item');
                    row.classList.add('highlight');
                } else {
                    row.classList.add('hidden-item');
                    if(val > 0) { delete extras[p.nome]; val = 0; }
                }
            }
            if(isDigitalProduct(p.nome)) {
                if(hasPrint) {
                    row.classList.add('hidden-item');
                    if(val > 0) { delete extras[p.nome]; val = 0; }
                } else {
                    row.classList.remove('hidden-item');
                }
            }

            valSpan.innerText = val;
            if(val > 0) stepper.classList.add('active'); else stepper.classList.remove('active');
        });
        this.updateSticky();
    },

    calcTotal() {
        let total = 0, itemsCount = 0, summary = {};
        
        this.sel.forEach(s => {
            if(s.isRemoved) return;
            Object.entries(s.extras).forEach(([nm, qtd]) => {
                let prd = this.produtos.find(p=>p.nome===nm);
                if(prd) {
                    total += prd.preco * qtd;
                    itemsCount += qtd;
                    summary[nm] = (summary[nm]||0) + qtd;
                }
            });
        });

        let discount = 0;
        this.creditos.forEach(c => {
            if(summary[c.nome]) {
                let free = Math.min(summary[c.nome], c.qtd);
                let prd = this.produtos.find(p=>p.nome===c.nome);
                if(prd && free > 0) discount += (free * prd.preco);
            }
        });

        return { total, discount, itemsCount, summary };
    },

    updateSticky() {
        const data = this.calcTotal();
        const final = (data.total - data.discount) - this.entrada;
        document.getElementById('stickQtd').innerText = data.itemsCount;
        const elTotal = document.getElementById('stickTotal');
        if(final < 0) elTotal.innerHTML = `Crédito: <span style="color:var(--brand)">${BRL(Math.abs(final))}</span>`;
        else elTotal.innerHTML = `Total: ${BRL(final)}`;
    },

    finish() {
        const data = this.calcTotal();
        const subtotal = data.total - data.discount;
        const final = subtotal - this.entrada;
        
        let html = '';
        
        Object.entries(data.summary).forEach(([nm, qtd]) => {
            let prd = this.produtos.find(p=>p.nome===nm);
            let unit = prd ? prd.preco : 0;
            html += `<div class="receipt-line"><div><strong>${qtd}x ${nm}</strong><div class="receipt-sub">${BRL(unit)} un.</div></div><div>${BRL(unit*qtd)}</div></div>`;
        });
        if(data.discount > 0) html += `<div class="receipt-line" style="color:var(--brand)"><strong>Desconto (Créditos)</strong><strong>-${BRL(data.discount)}</strong></div>`;
        html += `<div class="receipt-total-row"><span>Subtotal:</span> <span>${BRL(subtotal)}</span></div>`;
        if(this.entrada > 0) html += `<div class="receipt-line receipt-entry"><span>Entrada Paga:</span> <span>-${BRL(this.entrada)}</span></div>`;
        
        let valFinal = final < 0 ? BRL(Math.abs(final)) : BRL(final);
        let labelFinal = final < 0 ? "CRÉDITO RESTANTE:" : "TOTAL A PAGAR:";
        let colorFinal = final < 0 ? "var(--brand)" : "#000";
        html += `<div style="text-align:right; font-size:22px; margin-top:10px; color:${colorFinal}"><small style="font-size:12px; color:#666; display:block">${labelFinal}</small>${valFinal}</div>`;

        // --- RELATÓRIO COMPACTO WHATSAPP ---
        // Estrutura: { "Foto 10x15": ["img1", "img2"], "REMOVIDAS": ["img5", "img9"] }
        let report = {};
        let removedList = [];

        this.sel.forEach((s, i) => {
            // Pega só o nome do arquivo, sem caminho
            let fname = this.fotos[i].split('/').pop();
            
            if(s.isRemoved) {
                removedList.push(fname);
            } else {
                Object.entries(s.extras).forEach(([prodName, qtd]) => {
                    if(qtd > 0) {
                        report[prodName] = report[prodName] || [];
                        // Se for 1, só nome. Se >1, nome(2x)
                        report[prodName].push(qtd > 1 ? `${fname}(${qtd}x)` : fname);
                    }
                });
            }
        });

        let txt = `*📝 PEDIDO STUDIO NBV*\n----------------------------------\n`;
        
        // Lista Produtos
        for (let [prodName, fileList] of Object.entries(report)) {
            let totalQtd = data.summary[prodName] || 0;
            txt += `*📌 ${prodName} (${totalQtd} un)*\n`;
            txt += fileList.join(', ') + "\n\n";
        }

        // Lista Removidas (Opcional, mas útil)
        if(removedList.length > 0) {
            txt += `*🗑️ DESCARTADAS (${removedList.length} un)*\n`;
            txt += removedList.join(', ') + "\n\n";
        }

        txt += `----------------------------------\n`;
        txt += `*💰 FINANCEIRO*\n`;
        txt += `Itens: ${BRL(data.total)}\n`;
        if(data.discount > 0) txt += `Descontos: -${BRL(data.discount)}\n`;
        if(this.entrada > 0) txt += `Entrada: -${BRL(this.entrada)}\n`;
        txt += `\n*${final < 0 ? "CRÉDITO: " : "A PAGAR: "} ${BRL(Math.abs(final))}*`;

        document.getElementById('view-gallery').classList.add('hidden');
        document.getElementById('stickyFooter').classList.add('hidden');
        document.getElementById('view-summary').classList.remove('hidden');
        document.getElementById('summaryContent').innerHTML = html || "Nada selecionado.";
        document.getElementById('btnWhats').href = `https://wa.me/5542998370150?text=${encodeURIComponent(txt)}`;
    }
};

window.onload = () => app.init();
