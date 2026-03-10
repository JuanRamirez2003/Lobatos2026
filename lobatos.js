document.addEventListener("DOMContentLoaded", async () => {

  // 1️⃣ Inicializar Supabase
  const supabaseUrl = "https://srnycqsijrepspklffwz.supabase.co";
  const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNybnljcXNpanJlcHNwa2xmZnd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5OTQ4MjMsImV4cCI6MjA4ODU3MDgyM30.17O7f6bg-GXZ5uLr9UpyvAoA9QfLvqrIDZ6OaHl-Amk"; // reemplazá por tu anon key
  const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

  // 2️⃣ Referencias DOM
  const form = document.getElementById("formLobato");
  const tablaBody = document.querySelector("#tablaLobatos tbody");
  const modal = document.getElementById("modalLobato");
  const btnAgregar = document.getElementById("btnAgregar");
  const btnCerrar = document.getElementById("cerrarModal");
  const selectSeisena = document.getElementById("seisena");
  let editarId = null;

  // 3️⃣ Calcular edad
  function calcularEdad(fecha) {
    const hoy = new Date();
    const nacimiento = new Date(fecha);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return edad;
  }

  // 4️⃣ Mostrar / cerrar modal
  btnAgregar.onclick = () => { editarId = null; form.reset(); modal.style.display = "block"; };
  btnCerrar.onclick = () => modal.style.display = "none";

  // 5️⃣ Cargar seisenas dinámicamente
  async function cargarSeisenas() {
    const { data, error } = await supabaseClient.from("seisenas").select("*").order("id");
    if (error) return console.error(error);
    selectSeisena.innerHTML = "";
    data.forEach(s => {
      const option = document.createElement("option");
      option.value = s.id;
      option.textContent = s.nombre;
      selectSeisena.appendChild(option);
    });
  }
  await cargarSeisenas();

  // 6️⃣ Mostrar lobatos en tabla
  async function mostrarLobatos() {
    const { data, error } = await supabaseClient.from("lobatos").select("*").order("id");
    if (error) return console.error(error);
    tablaBody.innerHTML = "";
    data.forEach(l => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${l.nombre} ${l.apellido}</td>
        <td>${l.apodo_scout || ""}</td>
        <td>${l.fecha_nacimiento ? calcularEdad(l.fecha_nacimiento) : ""}</td>
        <td>${l.sexo || ""}</td>
        <td>${l.seisena_id || ""}</td>
        <td>${l.estado || ""}</td>
        <td>
          <button onclick="editarLobato(${l.id})">Editar</button>
          <button onclick="eliminarLobato(${l.id})">Eliminar</button>
        </td>
      `;
      tablaBody.appendChild(row);
    });
  }
  mostrarLobatos();

  // 7️⃣ Guardar lobato
  form.onsubmit = async e => {
  e.preventDefault();
  try {
    // 1️⃣ Datos del lobato
    const lobatoData = {
      nombre: document.getElementById('nombre').value,
      apellido: document.getElementById('apellido').value,
      apodo_scout: document.getElementById('apodo').value,
      fecha_nacimiento: document.getElementById('fechaNacimiento').value,
      fecha_ingreso: document.getElementById('fechaIngreso').value,
      sexo: document.getElementById('sexo').value,
      seisena_id: document.getElementById('seisena').value || null,
      estado: document.getElementById('estado').value,
      foto: document.getElementById('foto').value
    };

    let lobato_id;

    if (editarId) {
      // Editar lobato
      const { error } = await supabaseClient
        .from('lobatos')
        .update(lobatoData)
        .eq('id', editarId);
      if (error) throw error;
      lobato_id = editarId;
    } else {
      // Crear nuevo lobato
      const { data, error } = await supabaseClient
        .from('lobatos')
        .insert([lobatoData])
        .select();
      if (error) throw error;
      lobato_id = data[0].id;
    }

    // 2️⃣ Datos familiares
    const padresData = {
      lobato_id,
      nombre_padre: document.getElementById('padre').value,
      nombre_madre: document.getElementById('madre').value,
      telefono: document.getElementById('telefono').value,
      email: document.getElementById('email').value,
      direccion: document.getElementById('direccion').value,
      contacto_emergencia: document.getElementById('contactoEmergencia').value
    };

    if (editarId) {
      await supabaseClient
        .from('padres_contacto')
        .update(padresData)
        .eq('lobato_id', lobato_id);
    } else {
      await supabaseClient.from('padres_contacto').insert([padresData]);
    }

    // 3️⃣ Datos médicos
    const medicoData = {
      lobato_id,
      alergias: document.getElementById('alergias').value,
      medicacion: document.getElementById('medicacion').value,
      restricciones_alimentarias: document.getElementById('restricciones').value,
      seguro_medico: document.getElementById('seguro').value,
      observaciones: ''
    };

    if (editarId) {
      await supabaseClient
        .from('datos_medicos')
        .update(medicoData)
        .eq('lobato_id', lobato_id);
    } else {
      await supabaseClient.from('datos_medicos').insert([medicoData]);
    }

    alert('Lobato guardado correctamente!');
    form.reset();
    modal.style.display = 'none';
    mostrarLobatos();

  } catch (err) {
    console.error('Error al guardar:', err);
    alert('Error al guardar el lobato. Revisa la consola.');
  }
};

  // 8️⃣ Eliminar / editar
  window.eliminarLobato = async id => {
    if (!confirm("¿Seguro que quieres eliminar este lobato?")) return;
    await supabaseClient.from("lobatos").delete().eq("id", id);
    mostrarLobatos();
  };

  window.editarLobato = async id => {
    const { data, error } = await supabaseClient.from("lobatos").select("*").eq("id", id);
    if (error) return console.error(error);
    const l = data[0];
    editarId = id;

    document.getElementById("nombre").value = l.nombre;
    document.getElementById("apellido").value = l.apellido;
    document.getElementById("apodo").value = l.apodo_scout;
    document.getElementById("fechaNacimiento").value = l.fecha_nacimiento || "";
    document.getElementById("fechaIngreso").value = l.fecha_ingreso || "";
    document.getElementById("sexo").value = l.sexo || "";
    selectSeisena.value = l.seisena_id || "";
    document.getElementById("estado").value = l.estado || "";
    document.getElementById("foto").value = l.foto || "";

    // Cargar datos familiares
    const { data: padres } = await supabaseClient.from("padres_contacto").select("*").eq("lobato_id", id);
    if(padres.length){
      document.getElementById("padre").value = padres[0].nombre_padre || "";
      document.getElementById("madre").value = padres[0].nombre_madre || "";
      document.getElementById("telefono").value = padres[0].telefono || "";
      document.getElementById("email").value = padres[0].email || "";
      document.getElementById("direccion").value = padres[0].direccion || "";
      document.getElementById("contactoEmergencia").value = padres[0].contacto_emergencia || "";
    }

    // Cargar datos médicos
    const { data: medicos } = await supabaseClient.from("datos_medicos").select("*").eq("lobato_id", id);
    if(medicos.length){
      document.getElementById("alergias").value = medicos[0].alergias || "";
      document.getElementById("medicacion").value = medicos[0].medicacion || "";
      document.getElementById("restricciones").value = medicos[0].restricciones_alimentarias || "";
      document.getElementById("seguro").value = medicos[0].seguro_medico || "";
    }

    modal.style.display = "block";
  };

});