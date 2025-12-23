/* ARQUIVO: engine.js - Lógica Central V9 */

// Helpers
const BRL = v => v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const cleanName = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '');
const getDim = (name) => { const m = name.match(/\d+x\d+/i); return m ? m[0].toLowerCase() : null; };
const isDigitalProduct = (n) => cleanName(n).includes('arquivo') || cleanName(n).includes('digital');
const isPrintProduct = (n) => cleanName(n).includes('foto') || cleanName(n).includes('revel');
const isFrameProduct = (n) => cleanName(n).includes('porta') || cleanName(n).includes('moldura');

// Estrutura HTML Base (Injetada via JS)
const BASE_HTML = `
<div id="view-start" class="full-screen-overlay">
    <div style="max-width:400px; margin:40px auto; text-align:center">
        <h2 style="color:var(--brand); margin-bottom:5px">Bem-vindo!</h2>
        <p style="color:#57606a; margin-bottom:30px">Escolha como deseja prosseguir.</p>
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
        <div class="photo-area">
            <button class="nav-btn nav-left" onclick="app.nav(-1)">❮</button>
            <img id="imgMain" src="">
            <button class="nav-btn nav-right" onclick="app.nav(1)">❯</button>
            <div style="position:absolute; bottom:15px; background:rgba(255,255,255,0.9); padding:4px 10px; border-radius:20px; font-size:12px; font-weight:bold" id="imgName"></div>
        </div>
        <div class="sidebar">
            <div style="text-align:center; font-size:12px; color:#57606a; margin-bottom:10px" id="counter"></div>
            <div id="dynamicProds"></div>
            <button id="btnFinish" class="btn hidden" style="background:#24292f; margin-top:20px" onclick="app.finish()">✅ Finalizar Seleção</button>
        </div>
    </div>
</div>

<div id="stickyFooter" class="sticky-footer hidden">
    <div style="font-size:12px; color:#57606a"><span id="stickQtd" style="font-weight:bold; color:#000; font-size:14px">0</span> itens</div>
    <div class="total-price" id="stickTotal">R$ 0,00</div>
</div>

<div id="view-summary" class="full-screen-overlay hidden">
    <div style="max-width:500px; margin:20px auto">
        <h2>Resumo do Pedido</h2>
        <div class="card-box" id="summaryContent"></div>
        <div style="text-align:right; font-size:20px; font-weight:bold; margin-bottom:20px" id="finalTotal"></div>
        <a id="btnWhats" target="_blank" class="btn btn-whats">Enviar Pedido no WhatsApp</a>
        <button class="btn btn-sec" onclick="location.reload()">Voltar</button>
    </div>
</div>
`;

const app = {
    idx: 0,
    sel: [],
    mode: 'avulso',

    init() {
        // 1. Injeta HTML
        document.body.innerHTML = BASE_HTML;

        // 2. Valida Dados Globais (Vindos do index.html do cliente)
        if(typeof CLIENT_DATA === 'undefined') return alert("Erro: Dados do cliente não encontrados.");
        
        this.fotos = CLIENT_DATA.fotos;
        this.produtos = CLIENT_DATA.produtos;
        this.creditos = CLIENT_DATA.creditos || [];
        this.entrada = CLIENT_DATA.entrada || 0;

        if(!this.fotos.length) return alert("Galeria Vazia");
        this.sel = this.fotos.map(()=>({ extras: {} }));
        
        // 3. Configura Tela Inicial
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

    nav(d) {
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

    chg(name, d) {
        const extras = this.sel[this.idx].extras;
        const cur = extras[name] || 0;
        let next = Math.max(0, cur + d);
        if(isDigitalProduct(name)) next = Math.min(next, 1);
        if(next === 0) delete extras[name];
        else extras[name] = next;
        this.updateLogic();
    },

    updateLogic() {
        const extras = this.sel[this.idx].extras;
        const hasPrint = Object.keys(extras).some(k => isPrintProduct(k) && extras[k] > 0);

        this.produtos.forEach(p => {
            const safe = p.nome.replace(/\s/g,'');
            const row = document.getElementById(`row_${safe}`);
            const stepper = document.getElementById(`stp_${safe}`);
            const valSpan = document.getElementById(`val_${safe}`);
            if(!row) return;

            let val = extras[p.nome] || 0;

            // Lógica Porta Retrato
            if(isFrameProduct(p.nome)) {
                const dim = getDim(p.nome);
                const matching = Object.keys(extras).some(k => isPrintProduct(k) && getDim(k) === dim && extras[k] > 0);
                if(matching) {
                    row.classList.remove('hidden-item');
                    row.classList.add('highlight');
                } else {
                    row.classList.add('hidden-item');
                    if(val > 0) { delete extras[p.nome]; val = 0; }
                }
            }
            // Lógica Digital
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
            Object.entries(s.extras).forEach(([nm, qtd]) => {
                let prd = this.produtos.find(p=>p.nome===nm);
                if(prd) {
                    total += prd.preco * qtd;
                    itemsCount += qtd;
                    summary[nm] = (summary[nm]||0) + qtd;
                }
            });
        });
        this.creditos.forEach(c => {
            if(summary[c.nome]) {
                let free = Math.min(summary[c.nome], c.qtd);
                let prd = this.produtos.find(p=>p.nome===c.nome);
                if(prd) total -= (free * prd.preco);
            }
        });
        return { total, itemsCount, summary };
    },

    updateSticky() {
        const data = this.calcTotal();
        const final = data.total - this.entrada;
        document.getElementById('stickQtd').innerText = data.itemsCount;
        const elTotal = document.getElementById('stickTotal');
        if(final < 0) elTotal.innerHTML = `Crédito: <span style="color:var(--brand)">${BRL(Math.abs(final))}</span>`;
        else elTotal.innerHTML = `Total: ${BRL(final)}`;
    },

    finish() {
        const data = this.calcTotal();
        const final = data.total - this.entrada;
        let html = '';
        let txtWhats = "*Novo Pedido Studio NBV*\n\n";
        
        Object.entries(data.summary).forEach(([nm, qtd]) => {
            html += `<div style="display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px dashed #eee"><span>${qtd}x ${nm}</span></div>`;
            txtWhats += `${qtd}x ${nm}\n`;
        });
        
        if(this.entrada > 0) {
            html += `<div style="color:var(--brand); margin-top:10px">Entrada Paga: -${BRL(this.entrada)}</div>`;
            txtWhats += `\nEntrada já paga: -${BRL(this.entrada)}`;
        }
        
        txtWhats += `\n*TOTAL FINAL: ${BRL(final)}*`;
        
        document.getElementById('view-gallery').classList.add('hidden');
        document.getElementById('stickyFooter').classList.add('hidden');
        document.getElementById('view-summary').classList.remove('hidden');
        document.getElementById('summaryContent').innerHTML = html || "Nada selecionado.";
        document.getElementById('finalTotal').innerText = final < 0 ? "Crédito: " + BRL(Math.abs(final)) : "A Pagar: " + BRL(final);
        document.getElementById('btnWhats').href = `https://wa.me/5542998370150?text=${encodeURIComponent(txtWhats)}`;
    }
};

// Inicia
window.onload = () => app.init();
