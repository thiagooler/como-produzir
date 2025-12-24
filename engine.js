/* ARQUIVO: engine.js - Lógica Central V15 (Full Fix) */

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
        <p style="color:#57606a; margin-bottom:30px">Como deseja iniciar?</p>
        
        <div id="startInfo" class="card-box hidden" style="background:#fffbe6; border-color:#d4a72c; text-align:left">
            <h4 style="margin:0 0 10px 0; color:#9a6700">🎁 Seus Créditos:</h4>
            <ul id="startList" style="margin:0; padding-left:20px; font-size:13px; color:#333"></ul>
        </div>

        <div class="card-box start-card album" onclick="app.setMode('album')">
            <strong style="font-size:16px">📚 Montar Fotolivro</strong><br>
            <span style="font-size:13px; color:#57606a">Selecionar fotos para o álbum.</span>
        </div>

        <div class="card-box start-card avulso" onclick="app.setMode('avulso')">
            <strong style="font-size:16px">📸 Revelações Avulsas</strong><br>
            <span style="font-size:13px; color:#57606a">Fotos, quadros ou seleção individual.</span>
        </div>

        <div class="card-box start-card digital" onclick="app.checkAllDigital()">
            <strong style="font-size:16px">💾 Todas em Arquivo Digital</strong><br>
            <span style="font-size:13px; color:#57606a">Comprar todas as fotos em arquivo.</span>
        </div>
    </div>
</div>

<div id="view-gallery" class="main-container hidden">
    <div class="gallery-grid">
        <div class="photo-area" id="photoArea">
            <button class="nav-btn nav-left" onclick="app.nav(-1)">❮</button>
            <img id="imgMain" src="">
            <div id="statusOverlay" class="status-overlay"></div>
            <button class="nav-btn nav-right" onclick="app.nav(1)">❯</button>
            <div style="position:absolute; bottom:15px; background:rgba(255,255,255,0.9); padding:4px 10px; border-radius:20px; font-size:12px; font-weight:bold" id="imgName"></div>
        </div>
        
        <div class="sidebar">
            <div style="text-align:center; font-size:12px; color:#57606a; margin-bottom:10px" id="counter"></div>
            
            <div id="controlsAlbum" class="hidden">
                <div style="margin-bottom:15px; background:#f6f8fa; padding:10px; border-radius:8px; font-size:13px; text-align:center">
                    <div id="albumStatusText" style="font-weight:bold; margin-bottom:5px"></div>
                    <div id="albumPriceText" style="color:var(--brand)"></div>
                </div>
                <button id="btnInAlbum" class="btn-toggle-album yes" onclick="app.toggleInAlbum(true)">💚 NO FOTOLIVRO</button>
                <button id="btnOutAlbum" class="btn-toggle-album no" onclick="app.toggleInAlbum(false)">❌ NÃO QUERO</button>
            </div>

            <div id="controlsAvulso" class="hidden">
                <button id="btnDiscard" class="btn-toggle-album no" style="margin-bottom:15px" onclick="app.toggleDiscard()">🗑️ DESCARTAR FOTO</button>
                <div id="dynamicProds"></div>
            </div>

            <button id="btnFinish" class="btn hidden" style="margin-top:auto" onclick="app.finishStep()">✅ Concluir Etapa</button>
        </div>
    </div>
</div>

<div id="stickyFooter" class="sticky-footer hidden">
    <div style="font-size:12px; color:#57606a" id="footerText">Total</div>
    <div class="total-price" id="stickTotal">R$ 0,00</div>
</div>

<div id="modalDigitalWarn" class="modal-overlay hidden">
    <div class="card-box" style="text-align:center">
        <h2 style="color:#d4a72c">⚠️ Tem certeza?</h2>
        <p style="font-size:14px; text-align:left; line-height:1.5; color:#444">
            💡 <strong>DICA DO STUDIO:</strong><br><br>
            O arquivo digital avulso custa <span id="priceDig">R$ -</span>.<br>
            A Revelação 10x15 custa <span id="priceRev">R$ -</span> e <strong>você ganha o arquivo de brinde!</strong><br><br>
            Compensa mais fazer a revelação. Deseja mudar?
        </p>
        <button class="btn btn-primary" onclick="app.setMode('avulso'); document.getElementById('modalDigitalWarn').classList.add('hidden')">Mudar para Revelações</button>
        <button class="btn btn-sec" onclick="app.applyAllDigital()">Não, quero só os Arquivos</button>
    </div>
</div>

<div id="modalAlbumRec" class="modal-overlay hidden">
    <div class="card-box" style="width:100%">
        <h2 style="text-align:center">Sugestões de Álbum</h2>
        <p style="text-align:center; font-size:13px; color:#666; margin-bottom:20px">Calculamos o melhor custo-benefício:</p>
        <div id="recOptions"></div>
        <button class="btn btn-sec" onclick="document.getElementById('modalAlbumRec').classList.add('hidden')">Voltar</button>
    </div>
</div>

<div id="modalUpsell" class="modal-overlay hidden">
    <div class="card-box" style="text-align:center">
        <h2 style="color:var(--brand)">Álbum Definido! 🎉</h2>
        <p>Deseja adicionar <strong>Quadros</strong> ou <strong>Revelações Avulsas</strong>?</p>
        <button class="btn btn-primary" onclick="app.switchToAvulso()">Sim, ver produtos</button>
        <button class="btn btn-sec" onclick="app.goToSummary()">Não, finalizar</button>
    </div>
</div>

<div id="view-summary" class="full-screen-overlay hidden">
    <div style="max-width:500px; margin:20px auto">
        <h2 style="text-align:center">Resumo Final</h2>
        <div class="card-box" id="summaryContent"></div>
        <a id="btnWhats" target="_blank" class="btn btn-whats">Enviar no WhatsApp</a>
        <button class="btn btn-sec" onclick="location.reload()">Voltar</button>
    </div>
</div>
`;

const app = {
    idx: 0,
    sel: [],
    mode: 'avulso',
    selectedAlbum: null,

    init() {
        document.body.innerHTML = BASE_HTML;
        if(typeof CLIENT_DATA === 'undefined') return alert("Erro de Dados.");
        
        this.fotos = CLIENT_DATA.fotos;
        this.produtos = CLIENT_DATA.produtos;
        this.creditos = CLIENT_DATA.creditos || [];
        this.entrada = CLIENT_DATA.entrada || 0;
        this.albumConfig = CLIENT_DATA.albumConfig || { incluso: 0, extra: 0 };
        this.calculoConfig = CLIENT_DATA.calculoConfig || { regras:{}, tabela:[] };

        // Inicializa com isRemoved false e extras vazio
        this.sel = this.fotos.map(()=>({ inAlbum: false, extras: {}, isRemoved: false }));
        
        if(this.albumConfig.incluso > 0) {
            this.setMode('album');
        } else {
            this.updateStartInfo();
        }
    },

    updateStartInfo() {
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
        
        if(m === 'album') {
            document.getElementById('controlsAlbum').classList.remove('hidden');
            document.getElementById('controlsAvulso').classList.add('hidden');
            document.getElementById('footerText').innerText = "Resumo Álbum";
        } else {
            document.getElementById('controlsAlbum').classList.add('hidden');
            document.getElementById('controlsAvulso').classList.remove('hidden');
            document.getElementById('footerText').innerText = "Total Extras";
            this.renderSidebarAvulso(); // Renderiza controles
        }
        this.load();
    },

    // --- FUNÇÕES DIGITAL (TODAS EM ARQUIVO) ---
    checkAllDigital() {
        const dig = this.produtos.find(p => isDigitalProduct(p.nome));
        const rev = this.produtos.find(p => p.nome.includes('10x15'));
        
        if(!dig) return alert("Produto 'Arquivo Digital' não cadastrado no painel.");
        
        document.getElementById('priceDig').innerText = BRL(dig.preco);
        if(rev) document.getElementById('priceRev').innerText = BRL(rev.preco);
        
        document.getElementById('modalDigitalWarn').classList.remove('hidden');
    },

    applyAllDigital() {
        const dig = this.produtos.find(p => isDigitalProduct(p.nome));
        
        // Aplica a todos os itens
        this.sel.forEach(s => {
            s.isRemoved = false;
            s.inAlbum = false;
            s.extras = {}; 
            s.extras[dig.nome] = 1;
        });

        document.getElementById('modalDigitalWarn').classList.add('hidden');
        this.mode = 'avulso'; // Define modo para cálculos corretos
        this.goToSummary(); // Pula para o final
    },

    nav(d) {
        const s = this.sel[this.idx];
        if (d === 1 && this.mode === 'avulso') {
            const hasProd = Object.values(s.extras).reduce((a,b)=>a+b,0) > 0;
            // Se não tem produto e não está descartada, bloqueia
            if (!hasProd && !s.isRemoved) {
                return alert("⚠️ Decida sobre esta foto:\nEscolha um produto ou clique em 'Descartar'.");
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
        this.updateUI();
        
        const isLast = this.idx === this.fotos.length - 1;
        if(isLast) document.getElementById('btnFinish').classList.remove('hidden');
        else document.getElementById('btnFinish').classList.add('hidden');
    },

    toggleInAlbum(status) {
        this.sel[this.idx].inAlbum = status;
        if(status) this.sel[this.idx].isRemoved = false;
        this.updateUI();
    },

    toggleDiscard() {
        const s = this.sel[this.idx];
        s.isRemoved = !s.isRemoved;
        if(s.isRemoved) { s.extras = {}; s.inAlbum = false; }
        this.updateUI();
    },

    chg(name, d) {
        const s = this.sel[this.idx];
        if(d > 0) s.isRemoved = false;
        const cur = s.extras[name] || 0;
        let next = Math.max(0, cur + d);
        if(isDigitalProduct(name)) next = Math.min(next, 1);
        if(next === 0) delete s.extras[name];
        else s.extras[name] = next;
        this.updateUI();
    },

    updateUI() {
        const s = this.sel[this.idx];
        const overlay = document.getElementById('statusOverlay');
        const photoArea = document.getElementById('photoArea');

        overlay.className = 'status-overlay';
        overlay.innerText = '';
        photoArea.classList.remove('discarded');

        if(this.mode === 'album') {
            const btnYes = document.getElementById('btnInAlbum');
            const btnNo = document.getElementById('btnOutAlbum');
            if(s.inAlbum) {
                btnYes.classList.add('active'); btnNo.classList.remove('active');
                overlay.innerText = "NO ÁLBUM"; overlay.classList.add('in-album');
            } else {
                btnYes.classList.remove('active'); btnNo.classList.add('active');
            }
            this.updateAlbumStats();
        } 
        else { 
            const btnDisc = document.getElementById('btnDiscard');
            if(s.isRemoved) {
                btnDisc.classList.add('active'); btnDisc.innerText = "Recuperar Foto";
                photoArea.classList.add('discarded');
                overlay.innerText = "DESCARTADA"; overlay.classList.add('out-album');
            } else {
                btnDisc.classList.remove('active'); btnDisc.innerText = "🗑️ Descartar Foto";
            }
            this.updateSidebarAvulso();
            this.updateStickyAvulso();
        }
    },

    updateAlbumStats() {
        const count = this.sel.filter(x=>x.inAlbum).length;
        document.getElementById('albumStatusText').innerText = this.albumConfig.incluso > 0 ? `${count}/${this.albumConfig.incluso} selecionadas` : `${count} fotos`;
        document.getElementById('stickTotal').innerText = BRL(0);
    },

    updateStickyAvulso() {
        let total = 0;
        this.sel.forEach(s => {
            if(s.isRemoved) return;
            Object.entries(s.extras).forEach(([n,q]) => {
                let p = this.produtos.find(x=>x.nome===n);
                if(p) total += p.preco * q;
            });
        });
        document.getElementById('stickTotal').innerText = BRL(total);
    },

    renderSidebarAvulso() {
        const container = document.getElementById('dynamicProds');
        if(container.innerHTML === '') { 
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
                    // Importante: adicionado onclick para feedback visual
                    html += `<div class="prod-item" id="row_${safe}"><div class="prod-info"><div>${p.nome} ${badge}</div><div>${BRL(p.preco)}</div></div><div class="stepper" id="stp_${safe}"><button onclick="app.chg('${p.nome}', -1)">−</button><span id="val_${safe}">0</span><button onclick="app.chg('${p.nome}', 1)">+</button></div></div>`;
                });
                container.innerHTML += html + `</div>`;
            };
            mkGroup('Revelações', grps['Revelações']);
            mkGroup('Molduras', grps['Porta Retratos']);
            mkGroup('Outros', grps['Outros']);
        }
        
        const s = this.sel[this.idx];
        const extras = s.extras;
        const hasPrint = Object.keys(extras).some(k => isPrintProduct(k) && extras[k] > 0);

        this.produtos.forEach(p => {
            const safe = p.nome.replace(/\s/g,'');
            const el = document.getElementById(`val_${safe}`);
            const row = document.getElementById(`row_${safe}`);
            
            if(el && row) {
                el.innerText = extras[p.nome] || 0;
                
                // --- CORREÇÃO DE CLIQUE: Só desabilita se DESCARTADA ---
                if(s.isRemoved) {
                    row.classList.add('disabled');
                } else {
                    row.classList.remove('disabled');
                    
                    // Lógica Digital
                    if(isDigitalProduct(p.nome) && hasPrint) row.classList.add('hidden-item');
                    else if(isDigitalProduct(p.nome)) row.classList.remove('hidden-item');
                    
                    // Lógica Frame
                    if(isFrameProduct(p.nome)) {
                        const dim = getDim(p.nome);
                        const match = Object.keys(extras).some(k => isPrintProduct(k) && getDim(k) === dim && extras[k] > 0);
                        if(match) { row.classList.remove('hidden-item'); row.classList.add('highlight'); }
                        else row.classList.add('hidden-item');
                    }
                }
            }
        });
    },

    finishStep() {
        if(this.mode === 'album') {
            const count = this.sel.filter(x=>x.inAlbum).length;
            if(count === 0) return alert("Selecione fotos para o álbum.");
            if(this.albumConfig.incluso > 0) this.showUpsellModal();
            else this.showRecommendationModal(count);
        } else {
            this.goToSummary();
        }
    },

    showRecommendationModal(count) {
        const modal = document.getElementById('modalAlbumRec');
        const container = document.getElementById('recOptions');
        container.innerHTML = '';
        
        const opts = [];
        const sizes = [...new Set(this.calculoConfig.tabela.map(x=>x.size))];
        
        sizes.forEach(sz => {
            const rules = this.calculoConfig.regras || {}; 
            const photosPerPage = rules[sz] || 4; 
            const neededPages = Math.ceil(count / photosPerPage);
            
            const matches = this.calculoConfig.tabela.filter(t => t.size === sz && t.pages >= neededPages);
            matches.sort((a,b) => a.price - b.price);
            
            if(matches.length > 0) {
                const best = matches[0];
                const total = (best.price + this.calculoConfig.custoFixo) * this.calculoConfig.markup;
                const totalBox = (best.priceBox + this.calculoConfig.custoFixo) * this.calculoConfig.markup;
                opts.push({ name: `Fotolivro ${sz}`, desc: `${best.pages} págs`, price: total, boxPrice: totalBox });
            }
        });

        opts.forEach((o, i) => {
            container.innerHTML += `
            <div class="card-box" style="margin-bottom:10px; cursor:pointer" onclick="app.selectRec(${i})">
                <div style="font-weight:bold">${o.name} (${o.desc})</div>
                <div class="rec-price">${BRL(o.price)}</div>
            </div>`;
        });
        
        app.tempRecOptions = opts;
        modal.classList.remove('hidden');
    },

    selectRec(idx) {
        this.selectedAlbum = app.tempRecOptions[idx];
        document.getElementById('modalAlbumRec').classList.add('hidden');
        this.showUpsellModal();
    },
    
    showUpsellModal() { document.getElementById('modalUpsell').classList.remove('hidden'); },
    switchToAvulso() { document.getElementById('modalUpsell').classList.add('hidden'); this.setMode('avulso'); this.idx=0; this.load(); },
    
    goToSummary() {
        // --- CÁLCULO FINAL ---
        const avulsoData = this.calcTotalAvulso();
        let albumTotal = 0;
        let albumName = "";

        // 1. Prepara Álbum
        if(this.albumConfig.incluso > 0) {
            const albumCount = this.sel.filter(x=>x.inAlbum).length;
            const extra = Math.max(0, albumCount - this.albumConfig.incluso);
            albumTotal = extra * this.albumConfig.extra;
            albumName = `Fotolivro (Pacote)`;
            if(extra > 0) albumName += ` + ${extra} fotos extras`;
        } else if(this.selectedAlbum) {
            albumTotal = this.selectedAlbum.price;
            albumName = this.selectedAlbum.name;
        }

        const subtotal = avulsoData.total + albumTotal - avulsoData.discount;
        const final = subtotal - this.entrada;

        // --- RENDER HTML ---
        let html = '';
        
        if(albumName) {
            html += `<div class="receipt-line"><div><strong>${albumName}</strong></div><div>${BRL(albumTotal)}</div></div>`;
        }

        Object.entries(avulsoData.summary).forEach(([nm, qtd]) => {
            let prd = this.produtos.find(p=>p.nome===nm);
            let unit = prd ? prd.preco : 0;
            html += `<div class="receipt-line"><div><strong>${qtd}x ${nm}</strong><div style="font-size:11px;color:#666">${BRL(unit)} un.</div></div><div>${BRL(unit*qtd)}</div></div>`;
        });

        if(avulsoData.discount > 0) {
            html += `<div class="receipt-line" style="color:var(--brand)"><strong>Desconto (Créditos)</strong><strong>-${BRL(avulsoData.discount)}</strong></div>`;
        }

        if(this.entrada > 0) {
            html += `<div class="receipt-line receipt-entry"><span>Entrada Paga:</span> <span>-${BRL(this.entrada)}</span></div>`;
        }

        let labelFinal = final < 0 ? "CRÉDITO SOBRANDO:" : "TOTAL A PAGAR:";
        let valFinal = final < 0 ? BRL(Math.abs(final)) : BRL(final);
        let colorFinal = final < 0 ? "var(--brand)" : "#000";

        html += `<div style="text-align:right; font-size:22px; margin-top:15px; color:${colorFinal}; border-top:2px solid #333; padding-top:10px"><small style="font-size:12px; color:#666; display:block">${labelFinal}</small>${valFinal}</div>`;

        // --- GERA WHATSAPP ---
        let txt = `*📝 PEDIDO STUDIO NBV*\n----------------------------------\n`;
        
        if(albumName) txt += `📚 *${albumName}*: ${BRL(albumTotal)}\n\n`;

        // Lista Produtos Agrupados
        let report = {};
        this.sel.forEach((s, i) => {
            if(s.isRemoved) return;
            let fname = this.fotos[i].split('/').pop();
            Object.entries(s.extras).forEach(([prodName, qtd]) => {
                if(qtd > 0) {
                    report[prodName] = report[prodName] || [];
                    report[prodName].push(qtd > 1 ? `${fname}(${qtd}x)` : fname);
                }
            });
        });

        for (let [prodName, fileList] of Object.entries(report)) {
            let totalQtd = avulsoData.summary[prodName] || 0;
            txt += `*📌 ${prodName} (${totalQtd} un)*\n${fileList.join(', ')}\n\n`;
        }

        txt += `----------------------------------\n`;
        txt += `*💰 FINANCEIRO*\n`;
        txt += `Total Geral: ${BRL(subtotal + this.entrada)}\n`; // Valor Cheio
        if(avulsoData.discount > 0) txt += `Descontos: -${BRL(avulsoData.discount)}\n`;
        if(this.entrada > 0) txt += `Entrada Paga: -${BRL(this.entrada)}\n`;
        
        txt += `\n*${final < 0 ? "CRÉDITO: " : "A PAGAR: "} ${BRL(Math.abs(final))}*`;

        // Exibe
        document.getElementById('view-gallery').classList.add('hidden');
        document.getElementById('stickyFooter').classList.add('hidden');
        document.getElementById('modalUpsell').classList.add('hidden');
        document.getElementById('view-summary').classList.remove('hidden');
        document.getElementById('summaryContent').innerHTML = html;
        document.getElementById('btnWhats').href = `https://wa.me/5542998370150?text=${encodeURIComponent(txt)}`;
    },

    calcTotalAvulso() {
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
    }
};

window.onload = () => app.init();
