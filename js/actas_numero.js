import { db } from './firebaseConfig.js';
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

const COLECCION  = 'actas';
const ESTADO_ACTA = { 1: 'ACTA ELECTORAL NORMAL', 2: 'ACTA ELECTORAL OBSERVADA', 3: 'SIN PROCESAR' };

const $ = id => document.getElementById(id);

const buscarActa = async () => {
    const raw = $('nroMesa').value.trim();
    if (!raw) return;

    const numero = raw.padStart(6, '0');
    $('divDetalle').style.display = 'none';
    $('msg-error').style.display  = 'none';

    const snap = await getDocs(query(collection(db, COLECCION), where('idGrupoVotacion', '==', numero)));

    if (snap.empty) {
        $('msg-error').style.display = '';
        return;
    }

    const a = snap.docs[0].data();

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

    $('divDetalle').style.display = '';
};

$('btn-buscar').addEventListener('click', buscarActa);
$('nroMesa').addEventListener('keydown', e => { if (e.key === 'Enter') buscarActa(); });
