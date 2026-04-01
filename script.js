
'use strict';


const State = {
  transactions: [],
  role: 'admin',       // 'admin' | 'user'
  theme: 'dark',
  filters: {
    category: '',
    type: '',
    dateFrom: '',
    dateTo: '',
    search: '',
  },
  _deleteTargetId: null,

  save() {
    localStorage.setItem('fv_transactions', JSON.stringify(this.transactions));
    localStorage.setItem('fv_role', this.role);
    localStorage.setItem('fv_theme', this.theme);
  },

  load() {
    const tx = localStorage.getItem('fv_transactions');
    const role = localStorage.getItem('fv_role');
    const theme = localStorage.getItem('fv_theme');
    if (tx) this.transactions = JSON.parse(tx);
    if (role) this.role = role;
    if (theme) this.theme = theme;
  },
};

 
  //  SAMPLE DATA 
const SAMPLE_TRANSACTIONS = [
  { id: uid(), desc: 'Monthly Salary',       amount: 5200, type: 'income',  category: 'Salary',        date: thisMonthDate(1),  notes: '' },
  { id: uid(), desc: 'Freelance Project',    amount: 1200, type: 'income',  category: 'Investment',    date: thisMonthDate(5),  notes: 'Web design gig' },
  { id: uid(), desc: 'Grocery Shopping',     amount: 230,  type: 'expense', category: 'Food',          date: thisMonthDate(3),  notes: 'Weekly groceries' },
  { id: uid(), desc: 'Netflix Subscription', amount: 18,   type: 'expense', category: 'Entertainment', date: thisMonthDate(4),  notes: '' },
  { id: uid(), desc: 'Uber Ride',            amount: 45,   type: 'expense', category: 'Transport',     date: thisMonthDate(6),  notes: 'Airport trip' },
  { id: uid(), desc: 'Amazon Purchase',      amount: 120,  type: 'expense', category: 'Shopping',      date: thisMonthDate(8),  notes: 'Headphones' },
  { id: uid(), desc: 'Doctor Appointment',   amount: 80,   type: 'expense', category: 'Health',        date: thisMonthDate(9),  notes: '' },
  { id: uid(), desc: 'Restaurant Dinner',    amount: 95,   type: 'expense', category: 'Food',          date: thisMonthDate(11), notes: 'Birthday dinner' },
  { id: uid(), desc: 'Stock Dividend',       amount: 340,  type: 'income',  category: 'Investment',    date: lastMonthDate(15), notes: '' },
  { id: uid(), desc: 'Last Month Salary',    amount: 5200, type: 'income',  category: 'Salary',        date: lastMonthDate(1),  notes: '' },
  { id: uid(), desc: 'Electricity Bill',     amount: 110,  type: 'expense', category: 'Other',         date: lastMonthDate(10), notes: '' },
  { id: uid(), desc: 'Gym Membership',       amount: 55,   type: 'expense', category: 'Health',        date: lastMonthDate(5),  notes: '' },
  { id: uid(), desc: 'Spotify Premium',      amount: 10,   type: 'expense', category: 'Entertainment', date: lastMonthDate(4),  notes: '' },
  { id: uid(), desc: 'Bus Pass',             amount: 40,   type: 'expense', category: 'Transport',     date: lastMonthDate(2),  notes: '' },
  { id: uid(), desc: 'Clothing Shopping',    amount: 210,  type: 'expense', category: 'Shopping',      date: lastMonthDate(20), notes: 'Winter sale' },
];


function uid() {
  return Math.random().toString(36).slice(2,10) + Date.now().toString(36);
}

function fmt(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function fmtDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function thisMonthDate(day) {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

function lastMonthDate(day) {
  const now = new Date();
  let m = now.getMonth(); let y = now.getFullYear();
  if (m === 0) { m = 12; y--; } 
  return `${y}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

const CATEGORY_EMOJI = {
  Food: '🍔', Transport: '🚗', Shopping: '🛍️', Entertainment: '🎬',
  Health: '💊', Salary: '💼', Investment: '📈', Other: '📦',
};

const CATEGORY_COLORS = {
  Food: '#ff9640', Transport: '#4d8fff', Shopping: '#a78bfa',
  Entertainment: '#ff4d6d', Health: '#00e5a0', Salary: '#00e5a0',
  Investment: '#22d3ee', Other: '#8890b0',
};

function catClass(cat) {
  return 'cat-' + (cat || 'other').toLowerCase();
}


document.addEventListener('DOMContentLoaded', () => {
  State.load();
  if (State.transactions.length === 0) {
    State.transactions = SAMPLE_TRANSACTIONS;
    State.save();
  }
  applyTheme();
  applyRole();
  renderAll();
  bindEvents();
  // Set today as default date in modal
  document.getElementById('tx-date').value = new Date().toISOString().split('T')[0];
});


function applyTheme() {
  document.documentElement.setAttribute('data-theme', State.theme);
}

function toggleTheme() {
  State.theme = State.theme === 'dark' ? 'light' : 'dark';
  applyTheme();
  State.save();
}


function applyRole() {
  document.body.classList.toggle('role-admin', State.role === 'admin');
  document.body.classList.toggle('role-user',  State.role === 'user');

  // Update sidebar role buttons
  document.querySelectorAll('.role-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.role === State.role);
  });

  // Update badge
  document.getElementById('role-text').textContent =
    State.role === 'admin' ? 'Administrator' : 'Viewer';
  document.getElementById('nav-avatar').textContent =
    State.role === 'admin' ? 'A' : 'U';
}

function switchRole(role) {
  State.role = role;
  applyRole();
  State.save();
  renderTransactions();
  showToast(`Switched to ${role === 'admin' ? 'Administrator' : 'Viewer'} mode`, 'info');
}


  //  NAVIGATION

const SECTION_META = {
  overview:     { title: 'Overview',      subtitle: 'Financial summary' },
  transactions: { title: 'Transactions',  subtitle: 'Manage your money flow' },
  insights:     { title: 'Insights',      subtitle: 'Smart analytics' },
};

function navigateTo(section) {
  // Deactivate old
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));

  // Activate new
  const navItem = document.querySelector(`.nav-item[data-section="${section}"]`);
  const sectionEl = document.getElementById(`section-${section}`);
  if (navItem) navItem.classList.add('active');
  if (sectionEl) sectionEl.classList.add('active');

  const meta = SECTION_META[section] || {};
  document.getElementById('page-title').textContent = meta.title || '';
  document.getElementById('page-subtitle').textContent = meta.subtitle || '';

  // Re-render section-specific content
  if (section === 'overview') renderOverview();
  if (section === 'insights') renderInsights();

  // Close sidebar on mobile
  closeSidebar();
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
}

function renderAll() {
  renderOverview();
  renderTransactions();
  renderInsights();
}

function renderOverview() {
  const txs = State.transactions;
  const income  = txs.filter(t => t.type === 'income').reduce((s,t) => s + t.amount, 0);
  const expense = txs.filter(t => t.type === 'expense').reduce((s,t) => s + t.amount, 0);
  const balance = income - expense;
  const count   = txs.length;

  animateValue('total-income',  income,  fmt);
  animateValue('total-expense', expense, fmt);
  animateValue('net-balance',   balance, fmt);
  document.getElementById('tx-count').textContent = count;

  // Bars
  const maxVal = Math.max(income, expense, 1);
  setTimeout(() => {
    document.getElementById('income-bar').style.width  = `${Math.min(100,(income/maxVal)*100)}%`;
    document.getElementById('expense-bar').style.width = `${Math.min(100,(expense/maxVal)*100)}%`;
    document.getElementById('balance-bar').style.width = `${Math.min(100,(Math.abs(balance)/maxVal)*100)}%`;
    document.getElementById('tx-bar').style.width      = `${Math.min(100, count * 5)}%`;
  }, 100);

  // Balance color
  const balEl = document.getElementById('net-balance');
  balEl.style.color = balance >= 0 ? 'var(--accent-green)' : 'var(--accent-red)';

  // Recent list
  renderRecent();
  // Monthly chart
  renderMonthlyChart();
}

function animateValue(id, target, formatter) {
  const el = document.getElementById(id);
  const start = 0;
  const duration = 700;
  const startTime = performance.now();
  function tick(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = start + (target - start) * eased;
    el.textContent = formatter(current);
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function renderRecent() {
  const list = document.getElementById('recent-list');
  const recent = [...State.transactions]
    .sort((a,b) => new Date(b.date) - new Date(a.date))
    .slice(0, 6);

  if (recent.length === 0) {
    list.innerHTML = '<li class="empty-state" style="padding:30px"><p>No recent activity</p></li>';
    return;
  }

  list.innerHTML = recent.map(tx => `
    <li class="recent-item">
      <div class="recent-cat-icon ${catClass(tx.category)}">${CATEGORY_EMOJI[tx.category] || '📦'}</div>
      <div class="recent-info">
        <div class="recent-desc">${escHtml(tx.desc)}</div>
        <div class="recent-meta">${tx.category} · ${fmtDate(tx.date)}</div>
      </div>
      <div class="recent-amount ${tx.type}">
        ${tx.type === 'expense' ? '-' : '+'}${fmt(tx.amount)}
      </div>
    </li>
  `).join('');
}


  //  MONTHLY BAR CHART (Canvas)

function renderMonthlyChart() {
  const canvas = document.getElementById('monthly-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const wrap = canvas.parentElement;
  canvas.width = wrap.clientWidth || 500;
  canvas.height = wrap.clientHeight || 240;

  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  const months = getLast6Months();
  const data = months.map(m => {
    const txs = State.transactions.filter(t => t.date.startsWith(m.key));
    return {
      label: m.label,
      income:  txs.filter(t => t.type === 'income').reduce((s,t) => s + t.amount, 0),
      expense: txs.filter(t => t.type === 'expense').reduce((s,t) => s + t.amount, 0),
    };
  });

  const maxVal = Math.max(...data.map(d => Math.max(d.income, d.expense)), 100);
  const isDark = State.theme === 'dark';

  const padL = 10, padR = 10, padT = 16, padB = 36;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const groupW = chartW / data.length;
  const barW   = Math.min(28, groupW * 0.32);
  const gap    = 4;

  // Grid lines
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padT + chartH - (chartH * i / 4);
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(W - padR, y);
    ctx.stroke();
  }

  // Draw bars with animation stored state
  if (!canvas._animProgress) canvas._animProgress = 0;
  const animProgress = 1; // full

  data.forEach((d, i) => {
    const cx = padL + groupW * i + groupW / 2;

    // Income bar
    const incH = (d.income / maxVal) * chartH * animProgress;
    const incX = cx - barW - gap / 2;
    const incY = padT + chartH - incH;
    const grad1 = ctx.createLinearGradient(0, incY, 0, padT + chartH);
    grad1.addColorStop(0, '#00e5a0');
    grad1.addColorStop(1, 'rgba(0,229,160,0.2)');
    ctx.fillStyle = grad1;
    roundRect(ctx, incX, incY, barW, incH, 5);
    ctx.fill();

    // Expense bar
    const expH = (d.expense / maxVal) * chartH * animProgress;
    const expX = cx + gap / 2;
    const expY = padT + chartH - expH;
    const grad2 = ctx.createLinearGradient(0, expY, 0, padT + chartH);
    grad2.addColorStop(0, '#ff4d6d');
    grad2.addColorStop(1, 'rgba(255,77,109,0.2)');
    ctx.fillStyle = grad2;
    roundRect(ctx, expX, expY, barW, expH, 5);
    ctx.fill();

    // Label
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
    ctx.font = `500 11px DM Sans, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(d.label, cx, H - 8);
  });
}

function getLast6Months() {
  const result = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      key: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`,
      label: d.toLocaleDateString('en-US', { month: 'short' }),
    });
  }
  return result;
}

function roundRect(ctx, x, y, w, h, r) {
  if (h <= 0) return;
  r = Math.min(r, h/2, w/2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

  //  TRANSACTIONS

function getFilteredTx() {
  const { category, type, dateFrom, dateTo, search } = State.filters;
  return State.transactions.filter(tx => {
    if (category && tx.category !== category) return false;
    if (type && tx.type !== type) return false;
    if (dateFrom && tx.date < dateFrom) return false;
    if (dateTo && tx.date > dateTo) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!tx.desc.toLowerCase().includes(q) &&
          !tx.category.toLowerCase().includes(q) &&
          !(tx.notes||'').toLowerCase().includes(q)) return false;
    }
    return true;
  }).sort((a,b) => new Date(b.date) - new Date(a.date));
}

function renderTransactions() {
  const txs = getFilteredTx();
  const container = document.getElementById('tx-list-container');
  const emptyState = document.getElementById('empty-state');
  const tableHeader = document.querySelector('.tx-table-header');

  // Show/hide admin column header
  const actionsHeader = tableHeader.querySelector('span:last-child');
  if (actionsHeader) actionsHeader.style.display = State.role === 'admin' ? '' : 'none';

  if (txs.length === 0) {
    container.innerHTML = '';
    emptyState.style.display = 'flex';
    return;
  }
  emptyState.style.display = 'none';

  container.innerHTML = txs.map((tx, idx) => `
    <div class="tx-row" style="animation-delay:${idx * 0.03}s">
      <div class="tx-desc-cell">
        <div class="tx-icon-box ${catClass(tx.category)}">${CATEGORY_EMOJI[tx.category] || '📦'}</div>
        <div>
          <div class="tx-desc-text">${escHtml(tx.desc)}</div>
          ${tx.notes ? `<div class="tx-notes-text">${escHtml(tx.notes)}</div>` : ''}
        </div>
      </div>
      <div>
        <span class="tx-cat-badge ${catClass(tx.category)}">${tx.category}</span>
      </div>
      <div style="color:var(--text-secondary);font-size:13px">${fmtDate(tx.date)}</div>
      <div class="tx-amount-cell ${tx.type}">
        ${tx.type === 'expense' ? '-' : '+'}${fmt(tx.amount)}
      </div>
      <div class="tx-actions admin-only">
        <button class="tx-action-btn edit" data-id="${tx.id}" title="Edit">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
        <button class="tx-action-btn delete" data-id="${tx.id}" title="Delete">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>
      </div>
    </div>
  `).join('');

  // Apply role visibility to newly rendered items
  applyRole();

  // Bind action buttons
  container.querySelectorAll('.tx-action-btn.edit').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.id));
  });
  container.querySelectorAll('.tx-action-btn.delete').forEach(btn => {
    btn.addEventListener('click', () => openConfirmDelete(btn.dataset.id));
  });
}


function renderInsights() {
  const txs = State.transactions;
  const expenses = txs.filter(t => t.type === 'expense');

  // Top category
  const catTotals = {};
  expenses.forEach(t => { catTotals[t.category] = (catTotals[t.category] || 0) + t.amount; });
  const sortedCats = Object.entries(catTotals).sort((a,b) => b[1] - a[1]);
  const topCat = sortedCats[0];

  if (topCat) {
    document.getElementById('insight-top-cat').textContent = CATEGORY_EMOJI[topCat[0]] + ' ' + topCat[0];
    document.getElementById('insight-top-cat-sub').textContent = `${fmt(topCat[1])} spent — highest among all categories`;
  } else {
    document.getElementById('insight-top-cat').textContent = '—';
    document.getElementById('insight-top-cat-sub').textContent = 'Add some transactions to see insights';
  }

  // Monthly comparison
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  const lastD = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonth = `${lastD.getFullYear()}-${String(lastD.getMonth()+1).padStart(2,'0')}`;

  const thisExp = expenses.filter(t => t.date.startsWith(thisMonth)).reduce((s,t) => s+t.amount, 0);
  const lastExp = expenses.filter(t => t.date.startsWith(lastMonth)).reduce((s,t) => s+t.amount, 0);

  if (lastExp > 0) {
    const diff = ((thisExp - lastExp) / lastExp * 100).toFixed(1);
    const sign = diff >= 0 ? '+' : '';
    document.getElementById('insight-month-diff').textContent = sign + diff + '%';
    document.getElementById('insight-month-sub').textContent =
      `${fmt(thisExp)} this month vs ${fmt(lastExp)} last month`;
    document.getElementById('insight-month-diff').style.color =
      diff > 0 ? 'var(--accent-red)' : 'var(--accent-green)';
  } else {
    document.getElementById('insight-month-diff').textContent = 'N/A';
    document.getElementById('insight-month-sub').textContent = 'Not enough data for comparison';
  }

  // Smart observation
  const totalIncome  = txs.filter(t => t.type==='income').reduce((s,t) => s+t.amount, 0);
  const totalExpense = txs.filter(t => t.type==='expense').reduce((s,t) => s+t.amount, 0);
  const savingsRate  = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100).toFixed(1) : 0;

  document.getElementById('insight-obs-val').textContent = savingsRate + '%';
  document.getElementById('insight-obs-val').style.color = savingsRate >= 20 ? 'var(--accent-green)' : 'var(--accent-orange)';

  if (savingsRate >= 20) {
    document.getElementById('insight-obs').textContent = `Great job! You're saving ${savingsRate}% of your income — above the recommended 20%.`;
  } else if (savingsRate > 0) {
    document.getElementById('insight-obs').textContent = `Your savings rate is ${savingsRate}%. Aim for 20%+ by reducing ${topCat ? topCat[0].toLowerCase() : 'spending'}.`;
  } else {
    document.getElementById('insight-obs').textContent = 'Your expenses exceed income. Consider reviewing your spending habits.';
  }

  renderDonutChart(sortedCats);
  renderInsightBarChart();
}

/* Donut Chart */
function renderDonutChart(sortedCats) {
  const canvas = document.getElementById('donut-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = 220, H = 220;
  canvas.width = W; canvas.height = H;
  ctx.clearRect(0, 0, W, H);

  const legend = document.getElementById('donut-legend');
  legend.innerHTML = '';

  if (sortedCats.length === 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath();
    ctx.arc(W/2, H/2, 80, 0, Math.PI*2);
    ctx.fill();
    return;
  }

  const top5 = sortedCats.slice(0, 5);
  const total = top5.reduce((s,[,v]) => s+v, 0);
  const cx = W/2, cy = H/2, outerR = 90, innerR = 55;
  let angle = -Math.PI / 2;

  top5.forEach(([cat, val]) => {
    const slice = (val / total) * Math.PI * 2;
    const color = CATEGORY_COLORS[cat] || '#8890b0';

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, outerR, angle, angle + slice);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Gap
    angle += slice;
  });

  // Donut hole
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  const isDark = State.theme === 'dark';
  ctx.fillStyle = isDark ? '#181c28' : '#ffffff';
  ctx.fill();

  // Center text
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)';
  ctx.font = 'bold 13px DM Sans, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Expenses', cx, cy - 9);
  ctx.font = 'bold 15px Syne, sans-serif';
  ctx.fillStyle = isDark ? '#eef0f8' : '#1a1d2e';
  ctx.fillText(fmt(top5.reduce((s,[,v])=>s+v,0)), cx, cy + 10);

  // Legend
  top5.forEach(([cat, val]) => {
    const pct = ((val/total)*100).toFixed(1);
    const color = CATEGORY_COLORS[cat] || '#8890b0';
    const item = document.createElement('div');
    item.className = 'donut-legend-item';
    item.innerHTML = `
      <div class="donut-legend-dot" style="background:${color}"></div>
      <span class="donut-legend-label">${cat}</span>
      <span class="donut-legend-pct">${pct}%</span>
    `;
    legend.appendChild(item);
  });
}

/* Insight Bar Chart (6-month income vs expense) */
function renderInsightBarChart() {
  const canvas = document.getElementById('insight-bar-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const wrap = canvas.parentElement;
  canvas.width = wrap.clientWidth || 400;
  canvas.height = 300;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const W = canvas.width, H = canvas.height;
  const months = getLast6Months();
  const data = months.map(m => {
    const txs = State.transactions.filter(t => t.date.startsWith(m.key));
    return {
      label: m.label,
      income:  txs.filter(t => t.type==='income').reduce((s,t)=>s+t.amount,0),
      expense: txs.filter(t => t.type==='expense').reduce((s,t)=>s+t.amount,0),
    };
  });

  const maxVal = Math.max(...data.map(d => Math.max(d.income, d.expense)), 100);
  const isDark = State.theme === 'dark';
  const padL = 10, padR = 10, padT = 16, padB = 36;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const groupW = chartW / data.length;
  const barW = Math.min(22, groupW * 0.28);
  const gap = 4;

  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padT + chartH - (chartH * i / 4);
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W-padR, y); ctx.stroke();
  }

  data.forEach((d, i) => {
    const cx = padL + groupW * i + groupW / 2;
    const incH = (d.income / maxVal) * chartH;
    const incX = cx - barW - gap/2;
    const incY = padT + chartH - incH;
    const g1 = ctx.createLinearGradient(0, incY, 0, padT + chartH);
    g1.addColorStop(0, '#00e5a0'); g1.addColorStop(1, 'rgba(0,229,160,0.1)');
    ctx.fillStyle = g1;
    roundRect(ctx, incX, incY, barW, incH, 4); ctx.fill();

    const expH = (d.expense / maxVal) * chartH;
    const expX = cx + gap/2;
    const expY = padT + chartH - expH;
    const g2 = ctx.createLinearGradient(0, expY, 0, padT + chartH);
    g2.addColorStop(0, '#ff4d6d'); g2.addColorStop(1, 'rgba(255,77,109,0.1)');
    ctx.fillStyle = g2;
    roundRect(ctx, expX, expY, barW, expH, 4); ctx.fill();

    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
    ctx.font = '500 11px DM Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(d.label, cx, H - 8);
  });
}


function openAddModal() {
  document.getElementById('modal-title').textContent = 'Add Transaction';
  document.getElementById('edit-id').value = '';
  document.getElementById('tx-desc').value = '';
  document.getElementById('tx-amount').value = '';
  document.getElementById('tx-type').value = 'expense';
  document.getElementById('tx-category').value = 'Food';
  document.getElementById('tx-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('tx-notes').value = '';
  openModal('modal-overlay');
}

function openEditModal(id) {
  const tx = State.transactions.find(t => t.id === id);
  if (!tx) return;
  document.getElementById('modal-title').textContent = 'Edit Transaction';
  document.getElementById('edit-id').value = tx.id;
  document.getElementById('tx-desc').value = tx.desc;
  document.getElementById('tx-amount').value = tx.amount;
  document.getElementById('tx-type').value = tx.type;
  document.getElementById('tx-category').value = tx.category;
  document.getElementById('tx-date').value = tx.date;
  document.getElementById('tx-notes').value = tx.notes || '';
  openModal('modal-overlay');
}

function saveTransaction() {
  const id       = document.getElementById('edit-id').value;
  const desc     = document.getElementById('tx-desc').value.trim();
  const amount   = parseFloat(document.getElementById('tx-amount').value);
  const type     = document.getElementById('tx-type').value;
  const category = document.getElementById('tx-category').value;
  const date     = document.getElementById('tx-date').value;
  const notes    = document.getElementById('tx-notes').value.trim();

  if (!desc) { showToast('Please enter a description', 'error'); return; }
  if (!amount || amount <= 0) { showToast('Please enter a valid amount', 'error'); return; }
  if (!date) { showToast('Please select a date', 'error'); return; }

  if (id) {
    // Edit
    const idx = State.transactions.findIndex(t => t.id === id);
    if (idx !== -1) {
      State.transactions[idx] = { id, desc, amount, type, category, date, notes };
      showToast('Transaction updated!', 'success');
    }
  } else {
    // Add
    State.transactions.unshift({ id: uid(), desc, amount, type, category, date, notes });
    showToast('Transaction added!', 'success');
  }

  State.save();
  closeModal('modal-overlay');
  renderAll();
}


function openConfirmDelete(id) {
  State._deleteTargetId = id;
  openModal('confirm-overlay');
}

function confirmDelete() {
  const id = State._deleteTargetId;
  if (!id) return;
  State.transactions = State.transactions.filter(t => t.id !== id);
  State.save();
  closeModal('confirm-overlay');
  renderAll();
  showToast('Transaction deleted', 'error');
  State._deleteTargetId = null;
}


function openModal(id) {
  document.getElementById(id).classList.add('open');
}
function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}


function exportCSV() {
  const headers = ['ID', 'Description', 'Amount', 'Type', 'Category', 'Date', 'Notes'];
  const rows = State.transactions.map(t =>
    [t.id, `"${t.desc}"`, t.amount, t.type, t.category, t.date, `"${t.notes||''}"`].join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  downloadFile(csv, 'finvault_transactions.csv', 'text/csv');
  showToast('Exported as CSV!', 'success');
  closeModal('export-overlay');
}

function exportJSON() {
  const json = JSON.stringify(State.transactions, null, 2);
  downloadFile(json, 'finvault_transactions.json', 'application/json');
  showToast('Exported as JSON!', 'success');
  closeModal('export-overlay');
}

function downloadFile(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}


function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<div class="toast-dot"></div><div class="toast-text">${escHtml(message)}</div>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

function bindEvents() {

// Navigation 
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(item.dataset.section);
    });
  });

  document.querySelectorAll('.see-all[data-target]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(link.dataset.target);
    });
  });

  /* ── Theme ── */
  document.getElementById('theme-toggle').addEventListener('click', () => {
    toggleTheme();
    setTimeout(renderAll, 50); // Re-render charts with new theme
  });

  /* ── Sidebar (mobile) ── */
  document.getElementById('menu-toggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebar-overlay').classList.toggle('open');
  });
  document.getElementById('sidebar-overlay').addEventListener('click', closeSidebar);

  /* ── Role switcher ── */
  document.querySelectorAll('.role-btn').forEach(btn => {
    btn.addEventListener('click', () => switchRole(btn.dataset.role));
  });

  /* ── Add transaction ── */
  document.getElementById('add-tx-btn').addEventListener('click', openAddModal);
  document.getElementById('modal-save').addEventListener('click', saveTransaction);
  document.getElementById('modal-close').addEventListener('click', () => closeModal('modal-overlay'));
  document.getElementById('modal-cancel').addEventListener('click', () => closeModal('modal-overlay'));

  /* ── Delete confirm ── */
  document.getElementById('confirm-delete').addEventListener('click', confirmDelete);
  document.getElementById('confirm-cancel').addEventListener('click', () => closeModal('confirm-overlay'));

  /* ── Export ── */
  document.getElementById('export-btn').addEventListener('click', () => openModal('export-overlay'));
  document.getElementById('export-close').addEventListener('click', () => closeModal('export-overlay'));
  document.getElementById('export-csv').addEventListener('click', exportCSV);
  document.getElementById('export-json').addEventListener('click', exportJSON);

  /* ── Filters ── */
  document.getElementById('filter-category').addEventListener('change', e => {
    State.filters.category = e.target.value;
    renderTransactions();
  });
  document.getElementById('filter-type').addEventListener('change', e => {
    State.filters.type = e.target.value;
    renderTransactions();
  });
  document.getElementById('filter-date-from').addEventListener('change', e => {
    State.filters.dateFrom = e.target.value;
    renderTransactions();
  });
  document.getElementById('filter-date-to').addEventListener('change', e => {
    State.filters.dateTo = e.target.value;
    renderTransactions();
  });
  document.getElementById('clear-filters').addEventListener('click', () => {
    State.filters = { category:'', type:'', dateFrom:'', dateTo:'', search:'' };
    document.getElementById('filter-category').value = '';
    document.getElementById('filter-type').value = '';
    document.getElementById('filter-date-from').value = '';
    document.getElementById('filter-date-to').value = '';
    document.getElementById('global-search').value = '';
    renderTransactions();
    showToast('Filters cleared', 'info');
  });

  /* ── Global Search ── */
  let searchDebounce;
  document.getElementById('global-search').addEventListener('input', e => {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      State.filters.search = e.target.value.trim();
      renderTransactions();
      // Auto-navigate to transactions if on another section
      const txSection = document.getElementById('section-transactions');
      if (!txSection.classList.contains('active') && State.filters.search) {
        navigateTo('transactions');
      }
    }, 250);
  });

  /* ── Modal overlay click to close ── */
  document.getElementById('modal-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal('modal-overlay');
  });
  document.getElementById('confirm-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal('confirm-overlay');
  });
  document.getElementById('export-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal('export-overlay');
  });

  /* ── Keyboard ── */
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeModal('modal-overlay');
      closeModal('confirm-overlay');
      closeModal('export-overlay');
    }
    // Ctrl/Cmd + K → focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      document.getElementById('global-search').focus();
    }
  });

  /* ── Enter to save modal ── */
  document.getElementById('tx-modal').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveTransaction();
    }
  });

  /* ── Resize: re-render charts ── */
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const activeSection = document.querySelector('.section.active');
      if (activeSection) {
        if (activeSection.id === 'section-overview') renderMonthlyChart();
        if (activeSection.id === 'section-insights') { renderDonutChart(getExpenseSortedCats()); renderInsightBarChart(); }
      }
    }, 150);
  });
}

function getExpenseSortedCats() {
  const catTotals = {};
  State.transactions.filter(t => t.type === 'expense').forEach(t => {
    catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
  });
  return Object.entries(catTotals).sort((a,b) => b[1]-a[1]);
}
