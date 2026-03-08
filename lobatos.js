document.addEventListener('DOMContentLoaded', () => {

  // -----------------------------
  // 1️⃣ Inicializar Supabase
  // -----------------------------
  const supabaseUrl = 'https://srnycqsijrepspklffwz.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNybnljcXNpanJlcHNwa2xmZnd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5OTQ4MjMsImV4cCI6MjA4ODU3MDgyM30.17O7f6bg-GXZ5uLr9UpyvAoA9QfLvqrIDZ6OaHl-Amk';
  const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

  // -----------------------------
  // 2️⃣ Referencias DOM
  // -----------------------------
  const form = document.getElementById('formLobato');
  const tablaBody = document.querySelector('#tablaLobatos tbody');
  const modal = document.getElementById('modalLobato');
  const btnAgregar = document.getElementById('btnAgregar');
  const btnCerrar = document.getElementById('cerrarModal');
  let editarId = null; // Guardar ID al editar

  // -----------------------------
  // 3️⃣ Calcular edad
  // -----------------------------
  function calcularEdad(fecha) {
    const hoy = new Date();
    const nacimiento = new Date(fecha);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return edad;
  }

  // -----------------------------
  // 4️⃣ Mostrar / cerrar modal
  // -----------------------------
  btnAgregar.onclick = () => {
    editarId = null;
    form.reset();
    modal.style.display = 'block';
  };
  btnCerrar.onclick = () => modal.style.display = 'none';

  // -----------------------------
  // 5️⃣ Guardar lobato
  // -----------------------------
  form.onsubmit = async e => {
    e.preventDefault();
    try {
      const lobatoData = {
        nombre_completo: document.getElementById('nombre').value,
        apodo_scout: document.getElementById('apodo').value,
        fecha_nacimiento: document.getElementById('fechaNacimiento').value,
        fecha_ingreso: document.getElementById('fechaIngreso').value,
        sexo: document.getElementById('sexo').value,
        seisena_id: document.getElementById('seisena').value || 1,
        estado: document.getElementById('estado').value,
        foto: document.getElementById('foto').value
      };

      let lobato_id;

      if (editarId) {
        // Editar existente
        const { error } = await supabaseClient.from('lobatos').update(lobatoData).eq('id', editarId);
        if (error) throw error;
        lobato_id = editarId;
      } else {
        // Crear nuevo
        const { data, error } = await supabaseClient.from('lobatos').insert([lobatoData]).select();
        if (error) throw error;
        lobato_id = data[0].id;
      }

      // Datos familiares
      const padresData = {
        lobato_id,
        nombre_padre: document.getElementById('padre').value,
        nombre_madre: document.getElementById('madre').value,
        telefono: document.getElementById('telefono').value,
        email: document.getElementById('email').value,
        direccion: document.getElementById('direccion').value,
        contacto_emergencia: document.getElementById('contactoEmergencia').value
      };
      await supabaseClient.from('padres_contacto').upsert([padresData], { onConflict: ['lobato_id'] });

      // Datos médicos
      const medicoData = {
        lobato_id,
        alergias: document.getElementById('alergias').value,
        medicacion: document.getElementById('medicacion').value,
        restricciones_alimentarias: document.getElementById('restricciones').value,
        seguro_medico: document.getElementById('seguro').value,
        observaciones: ''
      };
      await supabaseClient.from('datos_medicos').upsert([medicoData], { onConflict: ['lobato_id'] });

      alert('Lobato guardado correctamente!');
      form.reset();
      modal.style.display = 'none';
      mostrarLobatos();

    } catch (err) {
      console.error(err);
      alert('Error al guardar el lobato. Revisa la consola.');
    }
  };

  // -----------------------------
  // 6️⃣ Mostrar lobatos en tabla
  // -----------------------------
  async function mostrarLobatos() {
    const { data, error } = await supabaseClient.from('lobatos').select('*').order('id', { ascending: true });
    if (error) return console.error(error);

    tablaBody.innerHTML = '';
    data.forEach(l => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${l.nombre_completo}</td>
        <td>${l.apodo_scout || ''}</td>
        <td>${calcularEdad(l.fecha_nacimiento)}</td>
        <td>${l.sexo}</td>
        <td>${l.seisena_id}</td>
        <td>${l.estado}</td>
        <td>
          <button onclick="editarLobato(${l.id})">Editar</button>
          <button onclick="eliminarLobato(${l.id})">Eliminar</button>
        </td>
      `;
      tablaBody.appendChild(row);
    });
  }

  mostrarLobatos();

  // -----------------------------
  // 7️⃣ Funciones eliminar y editar global
  // -----------------------------
  window.eliminarLobato = async id => {
    if (!confirm('¿Seguro que quieres eliminar este lobato?')) return;
    await supabaseClient.from('lobatos').delete().eq('id', id);
    await supabaseClient.from('padres_contacto').delete().eq('lobato_id', id);
    await supabaseClient.from('datos_medicos').delete().eq('lobato_id', id);
    mostrarLobatos();
  };

  window.editarLobato = async id => {
    const { data, error } = await supabaseClient.from('lobatos').select('*').eq('id', id);
    if (error) return console.error(error);
    const l = data[0];
    editarId = id;

    document.getElementById('nombre').value = l.nombre_completo;
    document.getElementById('apodo').value = l.apodo_scout;
    document.getElementById('fechaNacimiento').value = l.fecha_nacimiento;
    document.getElementById('fechaIngreso').value = l.fecha_ingreso;
    document.getElementById('sexo').value = l.sexo;
    document.getElementById('seisena').value = l.seisena_id;
    document.getElementById('estado').value = l.estado;
    document.getElementById('foto').value = l.foto || '';
    modal.style.display = 'block';
  };

});