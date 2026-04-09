import { db } from './firebaseConfig.js';
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const COLECCION = 'actas';
const ESTADO_ACTA = { 1: 'ACTA ELECTORAL NORMAL', 2: 'ACTA ELECTORAL OBSERVADA', 3: 'SIN PROCESAR' };

let mesasActuales = [];

const $ = id => document.getElementById(id);
const resetSelect = id => { $(id).innerHTML = '<option value="">--SELECCIONE--</option>'; $(id).disabled = true; };
const fillSelect  = (id, vals) => { $(id).innerHTML = '<option value="">--SELECCIONE--</option>' + vals.map(v => `<option value="${v}">${v}</option>`).join(''); $(id).disabled = false; };
const show = id => { const e = $(id); if (e) e.style.display = ''; };
const hide = id => { const e = $(id); if (e) e.style.display = 'none'; };
const uniq = arr => [...new Set(arr)].filter(Boolean).sort();

const getDatos = async (ambito) => {
    const key = `onpe_actas_${ambito}`;
    const ts  = localStorage.getItem(key + '_ts');
    const raw = localStorage.getItem(key);
    if (raw && ts && (Date.now() - Number(ts)) / 3600000 < 24) return JSON.parse(raw);
    const snap  = await getDocs(query(collection(db, COLECCION), where('ID', '==', ambito)));
    const datos = snap.docs.map(d => d.data());
    try { localStorage.setItem(key, JSON.stringify(datos)); localStorage.setItem(key + '_ts', Date.now()); } catch {}
    return datos;
};

const cargarDepartamentos = async (ambito) => {
    ['cdgoDep','cdgoProv','cdgoDist','cdgoLocal'].forEach(resetSelect);
    hide('seccion-mesas'); hide('seccion-detalle');
    if (!ambito) return;
    const ext = ambito === 'Extranjero';
    $('lbl-dep').textContent  = ext ? 'Continente:' : 'Departamento:';
    $('lbl-prov').textContent = ext ? 'País:'        : 'Provincia:';
    $('lbl-dist').textContent = ext ? 'Ciudad:'      : 'Distrito:';
    const datos = await getDatos(ambito);
    fillSelect('cdgoDep', uniq(datos.map(d => d.Departamento)));
};

const cargarProvincias = async () => {
    ['cdgoProv','cdgoDist','cdgoLocal'].forEach(resetSelect);
    hide('seccion-mesas'); hide('seccion-detalle');
    const ambito = $('cdgoAmbito').value, depto = $('cdgoDep').value;
    if (!depto) return;
    const datos = await getDatos(ambito);
    fillSelect('cdgoProv', uniq(datos.filter(d => d.Departamento === depto).map(d => d.Provincia)));
};

const cargarDistritos = async () => {
    ['cdgoDist','cdgoLocal'].forEach(resetSelect);
    hide('seccion-mesas'); hide('seccion-detalle');
    const ambito = $('cdgoAmbito').value, depto = $('cdgoDep').value, prov = $('cdgoProv').value;
    if (!prov) return;
    const datos = await getDatos(ambito);
    fillSelect('cdgoDist', uniq(datos.filter(d => d.Departamento === depto && d.Provincia === prov).map(d => d.Distrito)));
};

const cargarLocales = async () => {
    resetSelect('cdgoLocal');
    hide('seccion-mesas'); hide('seccion-detalle');
    const ambito = $('cdgoAmbito').value, depto = $('cdgoDep').value, prov = $('cdgoProv').value, dist = $('cdgoDist').value;
    if (!dist) return;
    const datos = await getDatos(ambito);
    fillSelect('cdgoLocal', uniq(datos.filter(d => d.Departamento === depto && d.Provincia === prov && d.Distrito === dist).map(d => d.LocalVotacion)));
};

const cargarMesas = async () => {
    hide('seccion-mesas'); hide('seccion-detalle');
    const ambito = $('cdgoAmbito').value, depto = $('cdgoDep').value, prov = $('cdgoProv').value;
    const dist = $('cdgoDist').value, local = $('cdgoLocal').value;
    if (!local) return;
    const datos = await getDatos(ambito);
    mesasActuales = datos
        .filter(d => d.Departamento === depto && d.Provincia === prov && d.Distrito === dist && d.LocalVotacion === local)
        .sort((a, b) => String(a.idGrupoVotacion).localeCompare(String(b.idGrupoVotacion)));

    $('listado-mesas').innerHTML = mesasActuales.length === 0
        ? '<tr><td colspan="10" style="text-align:center;padding:10px">No hay mesas para esta selección.</td></tr>'
        : Array.from({ length: Math.ceil(mesasActuales.length / 10) }, (_, i) =>
            `<tr>${mesasActuales.slice(i * 10, i * 10 + 10).map((m, j) =>
                `<td bgcolor="#C1C1C1" data-idx="${i*10+j}" style="cursor:pointer"><a href="#">${String(m.idGrupoVotacion).padStart(6,'0')}</a></td>`
            ).join('')}</tr>`
          ).join('');

    $('total-mesas').textContent = `Total de mesas: ${mesasActuales.length}`;
    show('seccion-mesas');
};

const verDetalle = (idx) => {
    const a = mesasActuales[idx];
    if (!a) return;
    $('det-mesa').textContent         = String(a.idGrupoVotacion).padStart(6, '0');
    $('det-copia').textContent        = a.nCopia           || '-';
    $('det-departamento').textContent = a.Departamento     || '-';
    $('det-provincia').textContent    = a.Provincia        || '-';
    $('det-distrito').textContent     = a.Distrito         || '-';
    $('det-local').textContent        = a.LocalVotacion    || '-';
    $('det-direccion').textContent    = a.Direccion        || '-';
    $('det-electores').textContent    = a.ElectoresHabiles ?? '-';
    $('det-total').textContent        = a.TotalVotantes    ?? '-';
    $('det-estado').textContent       = ESTADO_ACTA[a.idEstadoActa] || 'DESCONOCIDO';
    $('det-p1').textContent           = a.P1               ?? '-';
    $('det-p2').textContent           = a.P2               ?? '-';
    $('det-blancos').textContent      = a.VotosBlancos     ?? '-';
    $('det-nulos').textContent        = a.VotosNulos       ?? '-';
    $('det-impugnados').textContent   = a.VotosImpugnados  ?? '-';
    $('det-emitidos').textContent     = a.TotalVotantes    ?? '-';
    hide('seccion-mesas'); show('seccion-detalle');
};

$('cdgoAmbito').addEventListener('change',  e => cargarDepartamentos(e.target.value));
$('cdgoDep').addEventListener('change',     () => cargarProvincias());
$('cdgoProv').addEventListener('change',    () => cargarDistritos());
$('cdgoDist').addEventListener('change',    () => cargarLocales());
$('cdgoLocal').addEventListener('change',   () => cargarMesas());
$('listado-mesas').addEventListener('click', e => {
    const td = e.target.closest('td[data-idx]');
    if (td) { e.preventDefault(); verDetalle(Number(td.dataset.idx)); }
});
$('seccion-detalle').addEventListener('click', e => {
    if (e.target.closest('.btn-regresar')) { hide('seccion-detalle'); show('seccion-mesas'); }
});

cargarDepartamentos('Peru');
