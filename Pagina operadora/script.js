const SUPABASE_URL = 'https://rgxybkmglfdxrgluzfwc.supabase.co';

const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzIiwicmVmIjoicmd4eWJrbWdsZmR4cmdsdXpmd2MiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTc4ODIwNzczNiwiZXhwIjoyMTAzNzgzNzM2fQ.HhocvsjUxVuNW78sVTJmfNDJmrBb_TsU6KvIAscDsJI';

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


// ===============================
// ELEMENTOS DEL HTML
// ===============================

const form = document.getElementById('bookingForm');
const toast = document.getElementById('toast');

const creatorEmail = 'creador@nailsspa.com';

const appointmentsList =
  document.getElementById('appointmentsList');

const appointmentsCount =
  document.getElementById('appointmentsCount');

const exportAppointmentsBtn =
  document.getElementById('exportAppointments');

const registeredAppointmentsList =
  document.getElementById('registeredAppointmentsList');

const registeredAppointmentsCount =
  document.getElementById('registeredAppointmentsCount');

const availabilityForm =
  document.getElementById('availabilityForm');

const availabilityList =
  document.getElementById('availabilityList');

const calendarDays =
  document.getElementById('calendarDays');

const calendarMonthLabel =
  document.getElementById('calendarMonthLabel');

const slotOptions =
  document.getElementById('slotOptions');

const selectedDateInput =
  document.getElementById('selectedDate');

const selectedTimeInput =
  document.getElementById('selectedTime');

const prevMonthBtn =
  document.getElementById('prevMonth');

const nextMonthBtn =
  document.getElementById('nextMonth');

const ownerLoginForm =
  document.getElementById('ownerLoginForm');

const ownerSessionControls =
  document.getElementById('ownerSessionControls');

const logoutOwnerBtn =
  document.getElementById('logoutOwnerBtn');

const ownerLoginSection =
  document.getElementById('adminLoginSection');

const ownerOnlySections =
  document.querySelectorAll('.owner-only');


// ===============================
// DATOS DEL DUEÑO
// ===============================

const OWNER_NAME = 'Heaven Ulabarri';
const OWNER_PASSWORD = 'micielito1';
const OWNER_SESSION_KEY = 'nailsSpaOwnerSession';


// ===============================
// ESTADO
// ===============================

const state = {
  currentMonth: new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  ),

  selectedDate: '',
  selectedTime: ''
};


// ===============================
// LOGIN DEL DUEÑO
// ===============================

function isOwnerUnlocked() {

  const savedSession =
    localStorage.getItem(OWNER_SESSION_KEY);

  if (!savedSession) {
    return localStorage.getItem('nailsSpaOwner') === 'true';
  }

  try {

    const parsed = JSON.parse(savedSession);

    return (
      parsed.username === OWNER_NAME &&
      parsed.password === OWNER_PASSWORD
    );

  } catch (error) {

    return false;
  }
}


function setOwnerAccess(isUnlocked) {

  localStorage.setItem(
    'nailsSpaOwner',
    isUnlocked ? 'true' : 'false'
  );

  if (isUnlocked) {

    localStorage.setItem(
      OWNER_SESSION_KEY,
      JSON.stringify({
        username: OWNER_NAME,
        password: OWNER_PASSWORD
      })
    );

  } else {

    localStorage.removeItem(OWNER_SESSION_KEY);
  }


  ownerOnlySections.forEach((section) => {

    section.classList.toggle(
      'hidden',
      !isUnlocked
    );

  });


  if (ownerLoginForm) {

    ownerLoginForm.classList.toggle(
      'hidden',
      isUnlocked
    );

  }


  if (ownerSessionControls) {

    ownerSessionControls.classList.toggle(
      'hidden',
      !isUnlocked
    );

  }


  if (ownerLoginSection) {

    ownerLoginSection.classList.toggle(
      'hidden',
      isUnlocked
    );

  }
}


function unlockOwnerAccess(username, password) {

  if (
    username === OWNER_NAME &&
    password === OWNER_PASSWORD
  ) {

    setOwnerAccess(true);

    showToast('Bienvenido, Heaven.');

    return true;
  }

  showToast('Usuario o contraseña incorrectos.');

  return false;
}


function lockOwnerAccess() {

  setOwnerAccess(false);

  showToast('Sesión cerrada.');
}


// ===============================
// UTILIDADES
// ===============================

function escapeHtml(value) {

  return String(value)

    .replace(/&/g, '&amp;')

    .replace(/</g, '&lt;')

    .replace(/>/g, '&gt;')

    .replace(/"/g, '&quot;')

    .replace(/'/g, '&#039;');
}


function showToast(message) {

  if (!toast) return;

  toast.textContent = message;

  toast.classList.add('show');

  clearTimeout(showToast.timeoutId);

  showToast.timeoutId = setTimeout(() => {

    toast.classList.remove('show');

  }, 2600);
}


// ===============================
// CITAS - SUPABASE
// ===============================

async function getAppointments() {

  const {
    data,
    error
  } = await supabaseClient

    .from('appointments')

    .select('*')

    .order('created_at', {
      ascending: true
    });


  if (error) {

    console.error(
      'Error obteniendo citas:',
      error
    );

    return [];
  }


  return data || [];
}


// ===============================
// AGENDAS ATENDIDAS
// ===============================

async function getRegisteredAppointments() {

  const {
    data,
    error
  } = await supabaseClient

    .from('registered_appointments')

    .select('*')

    .order('created_at', {
      ascending: true
    });


  if (error) {

    console.error(
      'Error obteniendo agendas atendidas:',
      error
    );

    return [];
  }


  return data || [];
}


// ===============================
// DISPONIBILIDAD - SUPABASE
// ===============================

async function getAvailability() {

  const {
    data,
    error
  } = await supabaseClient

    .from('availability')

    .select('*')

    .order('date', {
      ascending: true
    })

    .order('time', {
      ascending: true
    });


  if (error) {

    console.error(
      'Error obteniendo disponibilidad:',
      error
    );

    return [];
  }


  return data || [];
}


// ===============================
// FECHAS
// ===============================

function toDateKey(date) {

  const localDate =
    new Date(
      date.getTime() -
      date.getTimezoneOffset() * 60000
    );

  return localDate
    .toISOString()
    .slice(0, 10);
}


function formatDate(dateString) {

  if (!dateString) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat(
    'es-MX',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }
  ).format(
    new Date(`${dateString}T12:00:00`)
  );
}


function formatTimeLabel(timeString) {

  if (!timeString) {
    return 'Sin hora';
  }

  const [hours, minutes] =
    timeString.split(':');

  const date = new Date();

  date.setHours(
    Number(hours),
    Number(minutes),
    0,
    0
  );

  return new Intl.DateTimeFormat(
    'es-MX',
    {
      hour: 'numeric',
      minute: '2-digit'
    }
  ).format(date);
}


// ===============================
// HORARIOS OCUPADOS
// ===============================

async function getBookedSlots() {

  const appointments =
    await getAppointments();


  return new Set(

    appointments.map(
      (appointment) =>
        `${appointment.date}|${appointment.time}`
    )

  );
}


// ===============================
// HORARIOS DISPONIBLES
// ===============================

async function getAvailableSlots() {

  const booked =
    await getBookedSlots();

  const availability =
    await getAvailability();


  return availability

    .filter(
      (slot) =>
        !booked.has(
          `${slot.date}|${slot.time}`
        )
    )

    .sort(
      (a, b) =>
        `${a.date} ${a.time}`.localeCompare(
          `${b.date} ${b.time}`
        )
    );
}


// ===============================
// MOSTRAR CITAS
// ===============================

async function renderAppointments() {

  const appointments =
    await getAppointments();


  if (appointmentsCount) {

    appointmentsCount.textContent =
      `${appointments.length} cita${
        appointments.length === 1
          ? ''
          : 's'
      }`;
  }


  if (!appointments.length) {

    if (appointmentsList) {

      appointmentsList.innerHTML =
        '<p class="empty-state">No hay citas agendadas todavía.</p>';

    }

    return;
  }


  if (!appointmentsList) return;


  appointmentsList.innerHTML =
    appointments

      .map(
        (appointment) => `

        <article class="appointment-card">

          <div>

            <h3>
              ${escapeHtml(appointment.name)}
            </h3>

            <div class="appointment-details">

              <span>
                <strong>Tel:</strong>
                ${escapeHtml(appointment.phone)}
              </span>

              <span>
                <strong>Servicio:</strong>
                ${escapeHtml(appointment.service)}
              </span>

              <span>
                <strong>Fecha:</strong>
                ${escapeHtml(
                  formatDate(appointment.date)
                )}
              </span>

              <span>
                <strong>Hora:</strong>
                ${escapeHtml(
                  formatTimeLabel(
                    appointment.time
                  )
                )}
              </span>

              <span>
                <strong>Notas:</strong>
                ${escapeHtml(
                  appointment.notes ||
                  'Sin detalles'
                )}
              </span>

            </div>

          </div>


          <div class="appointment-actions">

            <button
              type="button"
              class="cancel-btn"
              data-id="${appointment.id}"
            >
              Cancelar
            </button>


            <button
              type="button"
              class="attended-btn"
              data-id="${appointment.id}"
            >
              Agenda atendida
            </button>

          </div>

        </article>

      `
      )

      .join('');
}


// ===============================
// MOSTRAR HISTORIAL
// ===============================

async function renderRegisteredAppointments() {

  const registeredAppointments =
    await getRegisteredAppointments();


  if (registeredAppointmentsCount) {

    registeredAppointmentsCount.textContent =
      `${registeredAppointments.length} agenda${
        registeredAppointments.length === 1
          ? ''
          : 's'
      }`;
  }


  if (!registeredAppointmentsList) {
    return;
  }


  if (!registeredAppointments.length) {

    registeredAppointmentsList.innerHTML =
      '<p class="empty-state">Aún no hay agendas atendidas.</p>';

    return;
  }


  registeredAppointmentsList.innerHTML =
    registeredAppointments

      .map(
        (appointment) => `

        <article class="appointment-card">

          <div>

            <h3>
              ${escapeHtml(appointment.name)}
            </h3>

            <div class="appointment-details">

              <span>
                <strong>Tel:</strong>
                ${escapeHtml(appointment.phone)}
              </span>

              <span>
                <strong>Servicio:</strong>
                ${escapeHtml(appointment.service)}
              </span>

              <span>
                <strong>Fecha:</strong>
                ${escapeHtml(
                  formatDate(appointment.date)
                )}
              </span>

              <span>
                <strong>Hora:</strong>
                ${escapeHtml(
                  formatTimeLabel(
                    appointment.time
                  )
                )}
              </span>

              <span>
                <strong>Notas:</strong>
                ${escapeHtml(
                  appointment.notes ||
                  'Sin detalles'
                )}
              </span>

            </div>

          </div>

        </article>

      `
      )

      .join('');
}


// ===============================
// MOSTRAR DISPONIBILIDAD
// ===============================

async function renderAvailabilityList() {

  const availability =
    await getAvailableSlots();


  if (!availabilityList) return;


  if (!availability.length) {

    availabilityList.innerHTML =
      '<p class="empty-state">No hay horarios disponibles por el momento.</p>';

    return;
  }


  availabilityList.innerHTML =
    availability

      .map(
        (slot) => `

        <div class="availability-pill">

          <span>

            ${escapeHtml(
              formatDate(slot.date)
            )}

            ·

            ${escapeHtml(
              formatTimeLabel(slot.time)
            )}

          </span>


          <button
            type="button"
            class="remove-slot-btn"
            data-slot-id="${slot.id}"
            aria-label="Eliminar horario"
          >
            ×
          </button>

        </div>

      `
      )

      .join('');
}


// ===============================
// CALENDARIO
// ===============================

async function renderCalendar() {

  const monthStart =
    new Date(
      state.currentMonth.getFullYear(),
      state.currentMonth.getMonth(),
      1
    );


  const monthLabel =
    monthStart.toLocaleString(
      'es-MX',
      {
        month: 'long',
        year: 'numeric'
      }
    );


  if (calendarMonthLabel) {

    calendarMonthLabel.textContent =
      monthLabel.charAt(0).toUpperCase() +
      monthLabel.slice(1);

  }


  const firstDay =
    new Date(monthStart);

  firstDay.setDate(
    1 - monthStart.getDay()
  );


  const days = [];


  for (
    let index = 0;
    index < 42;
    index++
  ) {

    const date =
      new Date(firstDay);

    date.setDate(
      firstDay.getDate() + index
    );

    days.push(date);
  }


  const availableSlots =
    await getAvailableSlots();


  const availableDates =
    new Set(
      availableSlots.map(
        (slot) => slot.date
      )
    );


  const calendarMarkup =
    days

      .map((date) => {

        const dateKey =
          toDateKey(date);

        const isCurrentMonth =
          date.getMonth() ===
          monthStart.getMonth();

        const isSelected =
          state.selectedDate ===
          dateKey;

        const hasSlots =
          availableDates.has(dateKey);

        const classes =
          ['calendar-day'];


        if (!isCurrentMonth) {

          classes.push(
            'outside-month'
          );

        }


        if (hasSlots) {

          classes.push(
            'has-slots'
          );

        }


        if (isSelected) {

          classes.push(
            'selected'
          );

        }


        return `

          <button
            type="button"
            class="${classes.join(' ')}"
            data-date="${dateKey}"
            ${!isCurrentMonth ? 'disabled' : ''}
          >
            ${date.getDate()}
          </button>

        `;

      })

      .join('');


  if (calendarDays) {

    calendarDays.innerHTML =
      calendarMarkup;

  }
}


// ===============================
// HORARIOS DEL DÍA
// ===============================

async function renderSlotOptions(dateKey) {

  if (!slotOptions) return;


  const availableSlots =
    await getAvailableSlots();


  const slots =
    availableSlots.filter(
      (slot) =>
        slot.date === dateKey
    );


  slotOptions.innerHTML = '';


  if (!slots.length) {

    slotOptions.innerHTML =
      '<button type="button" class="slot-btn empty" disabled>No hay horarios disponibles</button>';

    state.selectedTime = '';

    if (selectedTimeInput) {
      selectedTimeInput.value = '';
    }

    return;
  }


  slots.forEach((slot) => {

    const button =
      document.createElement(
        'button'
      );


    button.type = 'button';

    button.className =
      `slot-btn${
        state.selectedTime ===
        slot.time
          ? ' selected'
          : ''
      }`;

    button.textContent =
      formatTimeLabel(
        slot.time
      );

    button.dataset.date =
      slot.date;

    button.dataset.time =
      slot.time;


    slotOptions.appendChild(
      button
    );

  });


  if (
    !slots.some(
      (slot) =>
        slot.time ===
        state.selectedTime
    )
  ) {

    state.selectedTime =
      slots[0].time;
  }


  if (selectedTimeInput) {

    selectedTimeInput.value =
      state.selectedTime;

  }


  Array.from(
    slotOptions.querySelectorAll(
      '.slot-btn'
    )
  ).forEach((button) => {

    button.classList.toggle(
      'selected',
      button.dataset.time ===
      state.selectedTime
    );

  });
}


// ===============================
// SELECCIONAR FECHA
// ===============================

async function updateSelectedDate(dateKey) {

  state.selectedDate =
    dateKey;


  if (selectedDateInput) {

    selectedDateInput.value =
      dateKey;

  }


  const availableSlots =
    await getAvailableSlots();


  const slots =
    availableSlots.filter(
      (slot) =>
        slot.date === dateKey
    );


  state.selectedTime =
    slots.length
      ? slots[0].time
      : '';


  if (selectedTimeInput) {

    selectedTimeInput.value =
      state.selectedTime;

  }


  await renderCalendar();

  await renderSlotOptions(
    dateKey
  );
}


// ===============================
// CORREO
// ===============================

function buildAppointmentMessage(
  appointment,
  action = 'Nueva cita agendada'
) {

  const lines = [

    `${action} en Nails SPA.`,

    '',

    'Nombre completo: ' +
      appointment.name,

    'Teléfono: ' +
      appointment.phone,

    'Servicio: ' +
      appointment.service,

    'Fecha: ' +
      appointment.date,

    'Hora: ' +
      appointment.time,

    'Detalles: ' +
      (
        appointment.notes ||
        'Sin detalles adicionales'
      ),

    '',

    'Creado: ' +
      new Date(
        appointment.created_at ||
        Date.now()
      ).toLocaleString('es-MX'),

    'Gracias.'

  ];


  return lines.join('\n');
}


function sendEmail(subject, body) {

  const mailtoUrl =
    `mailto:${creatorEmail}` +
    `?subject=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body)}`;


  window.location.href =
    mailtoUrl;
}


// ===============================
// AGREGAR CITA
// ===============================

async function addAppointment(
  appointment
) {

  const {
    data,
    error
  } = await supabaseClient

    .from('appointments')

    .insert({

      name: appointment.name,

      phone: appointment.phone,

      service: appointment.service,

      date: appointment.date,

      time: appointment.time,

      notes: appointment.notes || ''

    })

    .select()

    .single();


  if (error) {

    console.error(
      'Error guardando cita:',
      error
    );

    showToast(
      'No se pudo guardar la cita.'
    );

    return false;
  }


  console.log(
    'Cita guardada en Supabase:',
    data
  );


  await renderAppointments();

  await renderAvailabilityList();

  await renderCalendar();


  if (state.selectedDate) {

    await renderSlotOptions(
      state.selectedDate
    );

  }


  return true;
}


// ===============================
// CANCELAR CITA
// ===============================

async function cancelAppointment(
  appointmentId
) {

  const {
    data: appointment,
    error: findError
  } = await supabaseClient

    .from('appointments')

    .select('*')

    .eq('id', appointmentId)

    .single();


  if (
    findError ||
    !appointment
  ) {

    console.error(
      'Error buscando cita:',
      findError
    );

    showToast(
      'No se encontró la cita.'
    );

    return;
  }


  const {
    error
  } = await supabaseClient

    .from('appointments')

    .delete()

    .eq('id', appointmentId);


  if (error) {

    console.error(
      'Error cancelando cita:',
      error
    );

    showToast(
      'No se pudo cancelar la cita.'
    );

    return;
  }


  await renderAppointments();

  await renderAvailabilityList();

  await renderCalendar();


  if (state.selectedDate) {

    await renderSlotOptions(
      state.selectedDate
    );

  }


  sendEmail(

    `Cita cancelada - ${appointment.name}`,

    buildAppointmentMessage(
      appointment,
      'Se canceló la cita'
    )

  );


  showToast(
    `La cita de ${appointment.name} fue cancelada.`
  );
}


// ===============================
// MARCAR CITA COMO ATENDIDA
// ===============================

async function markAppointmentAsHandled(
  appointmentId
) {

  const {
    data: appointment,
    error: getError
  } = await supabaseClient

    .from('appointments')

    .select('*')

    .eq('id', appointmentId)

    .single();


  if (
    getError ||
    !appointment
  ) {

    console.error(
      'Error buscando la cita:',
      getError
    );

    showToast(
      'No se pudo encontrar la cita.'
    );

    return;
  }


  const {
    error: insertError
  } = await supabaseClient

    .from('registered_appointments')

    .insert({

      name: appointment.name,

      phone: appointment.phone,

      service: appointment.service,

      date: appointment.date,

      time: appointment.time,

      notes: appointment.notes || ''

    });


  if (insertError) {

    console.error(
      'Error registrando la agenda:',
      insertError
    );

    showToast(
      'No se pudo registrar la agenda.'
    );

    return;
  }


  const {
    error: deleteError
  } = await supabaseClient

    .from('appointments')

    .delete()

    .eq('id', appointmentId);


  if (deleteError) {

    console.error(
      'Error eliminando la cita:',
      deleteError
    );

    showToast(
      'La agenda se registró, pero no se pudo quitar de citas.'
    );

    return;
  }


  await renderAppointments();

  await renderRegisteredAppointments();

  await renderAvailabilityList();

  await renderCalendar();


  if (state.selectedDate) {

    await renderSlotOptions(
      state.selectedDate
    );

  }


  showToast(
    `La agenda de ${appointment.name} se registró como atendida.`
  );
}


// ===============================
// EXPORTAR CITAS
// ===============================

async function exportAppointments() {

  const appointments =
    await getAppointments();


  if (!appointments.length) {

    showToast(
      'No hay citas para exportar.'
    );

    return;
  }


  const text =
    appointments

      .map(
        (appointment, index) => {

          return [

            `Cita ${index + 1}`,

            'Nombre: ' +
              appointment.name,

            'Teléfono: ' +
              appointment.phone,

            'Servicio: ' +
              appointment.service,

            'Fecha: ' +
              appointment.date,

            'Hora: ' +
              appointment.time,

            'Notas: ' +
              (
                appointment.notes ||
                'Sin detalles'
              ),

            ''

          ].join('\n');

        }
      )

      .join('\n');


  sendEmail(

    'Resumen de citas agendadas',

    'Estas son las citas activas:\n\n' +
      text

  );
}


// ===============================
// AGREGAR DISPONIBILIDAD
// ===============================

async function addAvailability(
  date,
  time
) {

  const {
    data: existing,
    error: checkError
  } = await supabaseClient

    .from('availability')

    .select('id')

    .eq('date', date)

    .eq('time', time)

    .maybeSingle();


  if (checkError) {

    console.error(
      'Error comprobando horario:',
      checkError
    );

    showToast(
      'No se pudo comprobar el horario.'
    );

    return;
  }


  if (existing) {

    showToast(
      'Ese horario ya está disponible.'
    );

    return;
  }


  const {
    error
  } = await supabaseClient

    .from('availability')

    .insert({

      id: `${date}-${time}`,

      date: date,

      time: time

    });


  if (error) {

    console.error(
      'Error agregando disponibilidad:',
      error
    );

    showToast(
      'No se pudo agregar el horario.'
    );

    return;
  }


  await renderAvailabilityList();

  await renderCalendar();


  if (
    state.selectedDate ===
    date
  ) {

    await renderSlotOptions(
      date
    );

  }


  showToast(
    'Horario agregado correctamente.'
  );
}


// ===============================
// ELIMINAR DISPONIBILIDAD
// ===============================

async function removeAvailability(
  slotId
) {

  const {
    error
  } = await supabaseClient

    .from('availability')

    .delete()

    .eq('id', slotId);


  if (error) {

    console.error(
      'Error eliminando horario:',
      error
    );

    showToast(
      'No se pudo eliminar el horario.'
    );

    return;
  }


  await renderAvailabilityList();

  await renderCalendar();


  if (state.selectedDate) {

    await renderSlotOptions(
      state.selectedDate
    );

  }


  showToast(
    'Horario eliminado correctamente.'
  );
}


// ===============================
// FORMULARIO DISPONIBILIDAD
// ===============================

if (availabilityForm) {

  availabilityForm.addEventListener(
    'submit',
    async (event) => {

      event.preventDefault();


      const formData =
        new FormData(
          availabilityForm
        );


      const date =
        String(
          formData.get('slotDate') ||
          ''
        ).trim();


      const time =
        String(
          formData.get('slotTime') ||
          ''
        ).trim();


      if (!date || !time) {

        showToast(
          'Agrega una fecha y una hora válida.'
        );

        return;
      }


      await addAvailability(
        date,
        time
      );


      availabilityForm.reset();

    }
  );

}


// ===============================
// FORMULARIO DE CITAS
// ===============================

if (form) {

  form.addEventListener(
    'submit',
    async (event) => {

      event.preventDefault();


      const formData =
        new FormData(form);


      const name =
        formData.get('name')
          ?.toString()
          .trim() ||
        'Cliente';


      const phone =
        formData.get('phone')
          ?.toString()
          .trim() ||
        'Sin teléfono';


      const service =
        formData.get('service')
          ?.toString()
          .trim() ||
        'servicio';


      const date =
        String(
          formData.get('date') ||
          ''
        ).trim() ||
        state.selectedDate;


      const time =
        String(
          formData.get('time') ||
          ''
        ).trim() ||
        state.selectedTime;


      const notes =
        formData.get('notes')
          ?.toString()
          .trim() ||
        '';


      if (!date || !time) {

        showToast(
          'Selecciona un día y una hora disponible.'
        );

        return;
      }


      const availability =
        await getAvailableSlots();


      const slotExists =
        availability.some(
          (slot) =>
            slot.date === date &&
            slot.time === time
        );


      if (!slotExists) {

        showToast(
          'Ese horario ya no está disponible. Elige otro.'
        );

        await renderSlotOptions(
          date
        );

        return;
      }


      const appointment = {

        name,

        phone,

        service,

        date,

        time,

        notes

      };


      const saved =
        await addAppointment(
          appointment
        );


      if (!saved) {

        return;
      }


      sendEmail(

        `Nueva cita agendada - ${appointment.name}`,

        buildAppointmentMessage(
          appointment,
          'Se ha agendado una nueva cita'
        )

      );


      form.reset();


      state.selectedDate =
        '';

      state.selectedTime =
        '';


      if (selectedDateInput) {

        selectedDateInput.value =
          '';

      }


      if (selectedTimeInput) {

        selectedTimeInput.value =
          '';

      }


      await renderCalendar();


      const nextSlot =
        (
          await getAvailableSlots()
        )[0];


      if (nextSlot) {

        state.selectedDate =
          nextSlot.date;

        state.selectedTime =
          nextSlot.time;


        if (selectedDateInput) {

          selectedDateInput.value =
            nextSlot.date;

        }


        if (selectedTimeInput) {

          selectedTimeInput.value =
            nextSlot.time;

        }


        await renderSlotOptions(
          nextSlot.date
        );

      } else {

        if (slotOptions) {

          slotOptions.innerHTML =
            '<button type="button" class="slot-btn empty" disabled>No hay horarios disponibles</button>';

        }

      }


      showToast(
        `¡Gracias ${name}! Tu cita para ${service} quedó agendada.`
      );

    }
  );

}


// ===============================
// CLICS
// ===============================

document.addEventListener(
  'click',
  async (event) => {


    const cancelButton =
      event.target.closest(
        '.cancel-btn'
      );


    if (cancelButton) {

      await cancelAppointment(
        cancelButton.dataset.id
      );

      return;
    }


    const attendedButton =
      event.target.closest(
        '.attended-btn'
      );


    if (attendedButton) {

      await markAppointmentAsHandled(
        attendedButton.dataset.id
      );

      return;
    }


    const removeSlotButton =
      event.target.closest(
        '.remove-slot-btn'
      );


    if (removeSlotButton) {

      await removeAvailability(
        removeSlotButton.dataset.slotId
      );

      return;
    }


    const calendarDay =
      event.target.closest(
        '.calendar-day'
      );


    if (calendarDay) {

      const dateKey =
        calendarDay.dataset.date;


      if (dateKey) {

        await updateSelectedDate(
          dateKey
        );

      }

      return;
    }


    const slotButton =
      event.target.closest(
        '.slot-btn'
      );


    if (
      slotButton &&
      !slotButton.disabled &&
      !slotButton.classList.contains(
        'empty'
      )
    ) {

      state.selectedTime =
        slotButton.dataset.time;


      if (selectedTimeInput) {

        selectedTimeInput.value =
          state.selectedTime;

      }


      await renderSlotOptions(
        state.selectedDate
      );

    }

  }
);


// ===============================
// CAMBIAR MES
// ===============================

if (prevMonthBtn) {

  prevMonthBtn.addEventListener(
    'click',
    async () => {

      state.currentMonth =
        new Date(
          state.currentMonth.getFullYear(),
          state.currentMonth.getMonth() - 1,
          1
        );


      await renderCalendar();

    }
  );

}


if (nextMonthBtn) {

  nextMonthBtn.addEventListener(
    'click',
    async () => {

      state.currentMonth =
        new Date(
          state.currentMonth.getFullYear(),
          state.currentMonth.getMonth() + 1,
          1
        );


      await renderCalendar();

    }
  );

}


// ===============================
// EXPORTAR
// ===============================

if (exportAppointmentsBtn) {

  exportAppointmentsBtn.addEventListener(
    'click',
    exportAppointments
  );

}


// ===============================
// LOGIN
// ===============================

if (ownerLoginForm) {

  ownerLoginForm.addEventListener(
    'submit',
    (event) => {

      event.preventDefault();


      const formData =
        new FormData(
          ownerLoginForm
        );


      const username =
        (
          formData.get(
            'username'
          ) || ''
        )
          .toString()
          .trim();


      const password =
        (
          formData.get(
            'password'
          ) || ''
        )
          .toString();


      if (
        !username ||
        !password
      ) {

        showToast(
          'Ingresa usuario y contraseña.'
        );

        return;
      }


      const success =
        unlockOwnerAccess(
          username,
          password
        );


      if (success) {

        ownerLoginForm.reset();

      }

    }
  );

}


if (logoutOwnerBtn) {

  logoutOwnerBtn.addEventListener(
    'click',
    lockOwnerAccess
  );

}


// ===============================
// INICIO
// ===============================

async function init() {

  console.log(
    'Conectando con Supabase...'
  );


  const {
    data,
    error
  } = await supabaseClient

    .from('appointments')

    .select('id')

    .limit(1);


  if (error) {

    console.error(
      'Error conectando con Supabase:',
      error
    );

    showToast(
      'Error conectando con la base de datos.'
    );

  } else {

    console.log(
      'Supabase conectado correctamente:',
      data
    );

  }


  setOwnerAccess(
    isOwnerUnlocked()
  );


  const availableSlots =
    await getAvailableSlots();


  if (availableSlots.length) {

    state.selectedDate =
      availableSlots[0].date;

    state.selectedTime =
      availableSlots[0].time;


    if (selectedDateInput) {

      selectedDateInput.value =
        state.selectedDate;

    }


    if (selectedTimeInput) {

      selectedTimeInput.value =
        state.selectedTime;

    }

  }


  await renderAppointments();

  await renderRegisteredAppointments();

  await renderAvailabilityList();

  await renderCalendar();


  if (state.selectedDate) {

    await renderSlotOptions(
      state.selectedDate
    );

  } else if (slotOptions) {

    slotOptions.innerHTML =
      '<button type="button" class="slot-btn empty" disabled>Selecciona un día</button>';

  }

}


init();
