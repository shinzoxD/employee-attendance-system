/* ────────────────────────────────────────────────────
   Front-end script that works both locally and on Netlify
   ──────────────────────────────────────────────────── */

const API_ROOT =
  window.location.hostname.includes('localhost')
    ? 'http://127.0.0.1:5000'                       // dev
    : 'https://jda-attendance-api.onrender.com';    // prod  ← already works
                // prod  ← change me

// ――― DOM refs
const form      = document.getElementById('attendanceForm');
const submitBtn = document.getElementById('submitBtn');
const toast     = new bootstrap.Toast(document.getElementById('liveToast'));
const tableBody = document.querySelector('#recordsTable tbody');
let   rowNo     = 0;

// ――― helpers
const badge = (s) =>
  ({ Present:'bg-success', Absent:'bg-danger', Late:'bg-warning text-dark' }[s]);

function addRow({ id, employeeId, status, timestamp }) {
  rowNo++;
  const tr = document.createElement('tr');
  tr.dataset.id = id;
  tr.innerHTML = `
    <th scope="row">${rowNo}</th>
    <td>${employeeId}</td>
    <td><span class="badge ${badge(status)}">${status}</span></td>
    <td>${new Date(timestamp).toLocaleString('en-IN')}</td>
    <td class="text-end"><button class="btn btn-sm btn-outline-danger delete-btn">×</button></td>
  `;
  tableBody.prepend(tr);
}

// ――― initial load
fetch(`${API_ROOT}/attendance`)
  .then(r => r.json())
  .then(rows => rows.reverse().forEach(addRow))
  .catch(console.error);

// ――― live form validation
form.addEventListener('input', () => (submitBtn.disabled = !form.checkValidity()));

// ――― submit
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const [employeeId, status] = [form.employeeId.value.trim(), form.status.value];

  fetch(`${API_ROOT}/attendance`, {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ employeeId, status })
  })
    .then(r => r.json())
    .then(d => {
      addRow({ ...d, employeeId, status, timestamp: new Date().toISOString() });
      toast.show(); form.reset(); submitBtn.disabled = true;
    })
    .catch(err => alert('Record failed\n' + err));
});

// ――― delete
tableBody.addEventListener('click', (e) => {
  if (!e.target.classList.contains('delete-btn')) return;
  const tr = e.target.closest('tr'); const id = tr.dataset.id;

  fetch(`${API_ROOT}/attendance/${id}`, { method:'DELETE' })
    .then(r => r.ok && tr.remove())
    .then(() => { rowNo = 0; [...tableBody.rows].reverse()
        .forEach(r => (r.firstElementChild.textContent = ++rowNo)); })
    .catch(err => alert('Delete failed\n' + err));
});
