import { db } from './firebaseConfig.js';
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const getParticipacion = async () => {
    const params      = new URLSearchParams(window.location.search);
    const idRaw       = params.get('id') || 'Nacional';
    const partes      = idRaw.split(',');
    const ambito      = partes[0].charAt(0).toUpperCase() + partes[0].slice(1).toLowerCase();
    const departamento= partes[1]?.trim() || null;
    const provincia   = partes[2]?.trim() || null;
    const distrito    = partes[3]?.trim() || null;

    const esExtranjero  = ambito === 'Extranjero';
    const labelProv     = esExtranjero ? 'País'   : 'Provincia';
    const labelDistrito = esExtranjero ? 'Ciudad' : 'Distrito';

    let datos = [], tituloColumna = '';

    if (distrito) {
        tituloColumna = labelDistrito;
        const q = query(collection(db, 'participacion_distrito'),
            where('Departamento', '==', departamento),
            where('Provincia',    '==', provincia),
            where('DPD',          '==', distrito));
        datos = (await getDocs(q)).docs.map(d => d.data());

    } else if (provincia) {
        tituloColumna = labelDistrito;
        const q = query(collection(db, 'participacion_distrito'),
            where('Departamento', '==', departamento),
            where('Provincia',    '==', provincia));
        datos = (await getDocs(q)).docs.map(d => d.data());

    } else if (departamento) {
        tituloColumna = labelProv;
        const q = query(collection(db, 'participacion_provincia'),
            where('Departamento', '==', departamento));
        datos = (await getDocs(q)).docs.map(d => d.data());

    } else {
        tituloColumna = esExtranjero ? 'CONTINENTE' : 'DEPARTAMENTO';
        const q = query(collection(db, 'participacion_departamento'),
            where('ID', '==', ambito));
        datos = (await getDocs(q)).docs.map(d => d.data());
    }

    const infoAmbito = document.getElementById('info-ambito');
    if (infoAmbito) {
        let txt = `Ámbito: ${ambito}`;
        if (departamento) txt += `<br>${esExtranjero ? 'Continente' : 'Departamento'}: ${departamento}`;
        if (provincia)    txt += `<br>${esExtranjero ? 'País'       : 'Provincia'}: ${provincia}`;
        if (distrito)     txt += `<br>${esExtranjero ? 'Ciudad'     : 'Distrito'}: ${distrito}`;
        infoAmbito.innerHTML = txt;
    }

    if (datos.length === 0) {
        const res = document.getElementById('resultados');
        if (res) res.innerHTML = `<tr><td colspan="6" style="text-align:center">No hay datos en Firebase para esta selección</td></tr>`;
        return;
    }

    datos.sort((a, b) => (a.DPD || '').localeCompare(b.DPD || ''));
    const toInt = v => parseInt(String(v || '0').replace(/,/g, '')) || 0;
    const TV = datos.reduce((s, d) => s + toInt(d.TV), 0);
    const TA = datos.reduce((s, d) => s + toInt(d.TA), 0);
    const EH = datos.reduce((s, d) => s + toInt(d.EH), 0);
    const pTV = EH > 0 ? ((TV * 100) / EH).toFixed(3) : '0.000';
    const pTA = EH > 0 ? ((TA * 100) / EH).toFixed(3) : '0.000';

    const subtitle = document.querySelector('.subtitle');
    if (subtitle) subtitle.innerText = `ELECTORES HÁBILES ${EH.toLocaleString()}`;

    const celdas = document.querySelectorAll('.table09_2 td');
    if (celdas.length >= 4) {
        celdas[0].innerText = `TOTAL: ${TV.toLocaleString()}`;
        celdas[1].innerText = `TOTAL: ${TA.toLocaleString()}`;
        celdas[2].innerText = `% TOTAL: ${pTV}%`;
        celdas[3].innerText = `% TOTAL: ${pTA}%`;
    }

    const seccionDetalle = document.getElementById('seccion-detalle');
    if (distrito) {
        if (seccionDetalle) seccionDetalle.style.display = 'none';
        return;
    }
    if (seccionDetalle) seccionDetalle.style.display = '';

    const ruta   = ambito.toLowerCase();
    const nextId = dpd => {
        if (departamento && provincia) return `${ruta},${departamento},${provincia},${dpd}`;
        if (departamento)              return `${ruta},${departamento},${dpd}`;
        return `${ruta},${dpd}`;
    };

    const html = `
        <tr class="titulo_tabla">
            <td>${tituloColumna}</td><td>TOTAL ASISTENTES</td><td>% TOTAL ASISTENTES</td>
            <td>TOTAL AUSENTES</td><td>% TOTAL AUSENTES</td><td>ELECTORES HÁBILES</td>
        </tr>
        ${datos.map(d => `
            <tr onclick="location.href='./participacion_total.html?id=${nextId(d.DPD)}'" style="cursor:pointer">
                <td>${d.DPD}</td><td>${d.TV}</td><td>${d.PTV}</td>
                <td>${d.TA}</td><td>${d.PTA}</td><td>${d.EH}</td>
            </tr>
        `).join('')}
        <tr class="fila_total" style="font-weight:bold;background:#eee">
            <td>TOTALES</td><td>${TV.toLocaleString()}</td><td>${pTV}%</td>
            <td>${TA.toLocaleString()}</td><td>${pTA}%</td><td>${EH.toLocaleString()}</td>
        </tr>
    `;

    const tabla = document.getElementById('resultados');
    if (tabla) tabla.innerHTML = html;
};

getParticipacion();