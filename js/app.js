(() => {
  const form      = document.getElementById('attendanceForm');
  const submitBtn = document.getElementById('submitBtn');
  const toastEl   = document.getElementById('liveToast');
  const toast     = new bootstrap.Toast(toastEl);
  const tableBody = document.querySelector('#recordsTable tbody');
  let   recordCnt = 0;

  // ─── helpers ───────────────────────────────────────
  const badgeClass = (status) => ({
    Present: 'bg-success',
    Absent : 'bg-danger',
    Late   : 'bg-warning text-dark'
  }[status] || 'bg-secondary');

  const addRow = ({ id, employeeId, status, timestamp }) => {
    recordCnt += 1;
    const tr = document.createElement('tr');
    tr.dataset.id = id;                       // store DB id on the row

    tr.innerHTML = `
      <th scope="row">${recordCnt}</th>
      <td>${employeeId}</td>
      <td><span class="badge ${badgeClass(status)}">${status}</span></td>
      <td>${new Date(timestamp).toLocaleString('en-IN')}</td>
      <td><button class="btn btn-sm btn-outline-danger delete-btn">×</button></td>
    `;
    tableBody.prepend(tr);
  };

  // ─── load existing records on page load ────────────
  fetch('http://127.0.0.1:5000/attendance')
    .then((r) => r.json())
    .then((rows) => rows.reverse().forEach(addRow))
    .catch((err) => console.error('Load error:', err));

  // ─── enable/disable submit button ──────────────────
  form.addEventListener('input', () => {
    submitBtn.disabled = !form.checkValidity();
  });

  // ─── create new record ─────────────────────────────
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const employeeId = form.employeeId.value.trim();
    const status     = form.status.value;

    fetch('http://127.0.0.1:5000/attendance', {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body   : JSON.stringify({ employeeId, status })
    })
      .then((r) => r.json())
      .then((data) => {
        addRow({
          id: data.id,
          employeeId,
          status,
          timestamp: new Date().toISOString()
        });
        toast.show();
        form.reset();
        submitBtn.disabled = true;
      })
      .catch((err) => alert('Could not record attendance\n' + err));
  });

  // ─── delete record on button click ─────────────────
  tableBody.addEventListener('click', (e) => {
    if (!e.target.classList.contains('delete-btn')) return;

    const tr = e.target.closest('tr');
    const id = tr.dataset.id;

    fetch(`http://127.0.0.1:5000/attendance/${id}`, { method: 'DELETE' })
      .then((r) => {
        if (r.ok) {
          tr.remove();
          // renumber rows so the # column stays sequential
          recordCnt = 0;
          [...tableBody.rows].reverse().forEach(
            (row) => (row.firstElementChild.textContent = ++recordCnt)
          );
        } else {
          alert('Delete failed');
        }
      })
      .catch((err) => alert('Delete failed\n' + err));
  });
})();
