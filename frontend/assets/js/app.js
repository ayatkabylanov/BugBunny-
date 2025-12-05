/* assets/js/app.js
   DataHub frontend module (обновлён)
   - читает assets/data/universities.json или использует встроенный запасной список
   - публичные методы: fetchUniversities(opts), fetchUniversityById(id), renderUniversityCards(container, list), escapeHtml
   - автоматически корректно заполняет популярные вузы, даже если JSON отсутствует
*/

const DataHub = (function(){
  let _db = null;

  // встроенный запасной список (используется если нет внешнего JSON)
  const FALLBACK_DB = {
    universities: [
      {
        id: "kznu",
        name: "Казахский национальный университет им. аль-Фараби (КазНУ)",
        city: "Алматы",
        rating: 92,
        short_desc: "Крупнейший классический университет Казахстана, сильные программы в естественных и гуманитарных науках.",
        long_desc: "КазНУ — ведущий национальный университет с богатой историей и международными партнёрствами.",
        student_count: 20000,
        faculty_count: 2000,
        programs_count: 180,
        contact: { phone: "+7 (727) 377-33-33", email: "info@kaznu.edu.kz", address: "пр. Аль-Фараби, 71, Алматы" },
        gallery: ["assets/images/kaznu-1.jpg"],
        partners: [{ partner_name: "University of Cambridge", country: "UK" }],
        tour: ""
      },
      {
        id: "aues",
        name: "Алматинский университет энергетики и связи (АУЭС)",
        city: "Алматы",
        rating: 87,
        short_desc: "Университет с сильными программами в энергетике, телекомах и прикладных ИТ.",
        long_desc: "АУЭС готовит инженеров и специалистов для энергетической и телеком-индустрии.",
        student_count: 8000,
        faculty_count: 700,
        programs_count: 60,
        contact: { phone: "+7 (727) 323-11-75", email: "aues@aues.kz", address: "ул. Байтурсынова, 126/1, Алматы" },
        gallery: ["assets/images/aues-1.jpg"],
        partners: [{ partner_name: "Anhalt University", country: "Germany" }],
        tour: ""
      },
      {
        id: "kbtu",
        name: "Казахстанско-Британский технический университет (КБТУ)",
        city: "Алматы",
        rating: 90,
        short_desc: "Технический университет с англоязычными программами и тесными связями с индустрией.",
        long_desc: "КБТУ фокусируется на инженерии, нефти и газе, ИТ и менеджменте.",
        student_count: 5000,
        faculty_count: 400,
        programs_count: 50,
        contact: { phone: "+7 (727) 357-42-42", email: "info@kbtu.kz", address: "ул. Толе Би, 59, Алматы" },
        gallery: ["assets/images/kbtu-1.jpg"],
        partners: [{ partner_name: "London School of Economics", country: "UK" }],
        tour: ""
      },
      {
        id: "iitu",
        name: "Международный университет информационных технологий (МУИТ)",
        city: "Алматы",
        rating: 88,
        short_desc: "Университет с акцентом на ИТ-образование и международные программы.",
        long_desc: "МУИТ предлагает сильные программы по программной инженерии и кибербезопасности.",
        student_count: 6000,
        faculty_count: 500,
        programs_count: 40,
        contact: { phone: "+7 (727) 320-00-00", email: "reception@iitu.edu.kz", address: "ул. Манаса, 34/1, Алматы" },
        gallery: ["assets/images/iitu-1.jpg"],
        partners: [{ partner_name: "KAIST", country: "South Korea" }],
        tour: ""
      },
      {
        id: "aitu",
        name: "Astana IT University (АйТУ)",
        city: "Астана",
        rating: 85,
        short_desc: "Современный ИТ-вуз с фокусом на AI, Data Science и цифровые трансформации.",
        long_desc: "АйТУ готовит специалистов для индустрии ИТ и цифрового сектора.",
        student_count: 3000,
        faculty_count: 250,
        programs_count: 30,
        contact: { phone: "+7 (7172) 645-710", email: "info@astanait.edu.kz", address: "пр. Мәңгілік Ел, Астана" },
        gallery: ["assets/images/aitu-1.jpg"],
        partners: [{ partner_name: "SAP University Alliances", country: "Germany" }],
        tour: ""
      }
    ]
  };

  // helper: escape html
  function escapeHtml(s = '') {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Load DB: try window.UNIVERSITIES_DB -> fetch JSON -> FALLBACK_DB
  async function loadDb() {
    if (_db) return _db;
    if (window.UNIVERSITIES_DB && Array.isArray(window.UNIVERSITIES_DB.universities)) {
      _db = window.UNIVERSITIES_DB;
      return _db;
    }
    try {
      const resp = await fetch('assets/data/universities.json', { cache: 'no-cache' });
      if (resp.ok) {
        _db = await resp.json();
        if (!Array.isArray(_db.universities)) _db.universities = [];
        // если файл пуст, падать не будем — используем fallback дополнительно
        if (!_db.universities.length) {
          console.warn('DataHub: assets/data/universities.json пуст, используем запасной список.');
          _db = FALLBACK_DB;
        }
        return _db;
      } else {
        console.warn('DataHub: не найден assets/data/universities.json (status ' + resp.status + '), применяем запасной список.');
        _db = FALLBACK_DB;
        return _db;
      }
    } catch (err) {
      console.warn('DataHub: ошибка при fetch assets/data/universities.json — применяем запасной список.', err);
      _db = FALLBACK_DB;
      return _db;
    }
  }

  // public: получить список (опции: q, region, sort)
  async function fetchUniversities(opts = {}) {
    const db = await loadDb();
    let list = Array.isArray(db.universities) ? db.universities.slice() : [];

    // поиск по q
    if (opts.q) {
      const q = String(opts.q).trim().toLowerCase();
      if (q) {
        list = list.filter(u =>
          (u.name || '').toLowerCase().includes(q) ||
          (u.short_desc || '').toLowerCase().includes(q) ||
          (u.city || '').toLowerCase().includes(q)
        );
      }
    }

    // фильтр по region (частичный матч по city или region)
    if (opts.region) {
      const r = String(opts.region).trim().toLowerCase();
      if (r) list = list.filter(u => ((u.city||'') + ' ' + (u.region||'')).toLowerCase().includes(r));
    }

    // сортировка
    if (opts.sort === 'students') {
      list.sort((a, b) => (b.student_count || 0) - (a.student_count || 0));
    } else {
      // по рейтингу (по убыванию)
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return list;
  }

  // public: получить университет по id
  async function fetchUniversityById(id) {
    if (!id) return null;
    const db = await loadDb();
    return (db.universities || []).find(u => String(u.id) === String(id)) || null;
  }

  // рендер карточек в контейнер
  function renderUniversityCards(container, list) {
    if (!container) return;
    container.innerHTML = '';
    if (!Array.isArray(list) || list.length === 0) {
      container.innerHTML = '<p class="muted-note">По запросу ничего не найдено.</p>';
      return;
    }

    list.forEach(u => {
      const card = document.createElement('article');
      card.className = 'card uni-card';
      card.style.padding = '18px';
      card.style.borderRadius = '12px';
      card.style.display = 'flex';
      card.style.gap = '16px';
      card.style.alignItems = 'flex-start';

      const logo = document.createElement('div');
      logo.style.width = '110px';
      logo.style.height = '90px';
      logo.style.borderRadius = '10px';
      logo.style.background = '#f5f9ff';
      logo.style.display = 'flex';
      logo.style.alignItems = 'center';
      logo.style.justifyContent = 'center';
      logo.style.fontWeight = '700';
      logo.style.fontSize = '28px';
      logo.textContent = (u.name || 'U')[0]?.toUpperCase() || 'U';

      const body = document.createElement('div');
      body.style.flex = '1';

      const title = document.createElement('h4');
      title.style.margin = '0 0 8px 0';
      title.innerHTML = `<a href="university.html?id=${encodeURIComponent(u.id)}" style="color:var(--text);text-decoration:none;font-weight:700;">${escapeHtml(u.name)}</a>`;

      const short = document.createElement('div');
      short.className = 'muted-note';
      short.style.marginBottom = '10px';
      short.innerHTML = escapeHtml(u.short_desc || '');

      const meta = document.createElement('div');
      meta.className = 'muted-note';
      meta.style.marginBottom = '10px';
      meta.textContent = `${u.city || ''} · рейтинг: ${u.rating ?? '—'}`;

      const actions = document.createElement('div');
      actions.style.display = 'flex';
      actions.style.gap = '10px';
      actions.style.marginTop = '8px';

      const more = document.createElement('a');
      more.className = 'btn ghost';
      more.href = `university.html?id=${encodeURIComponent(u.id)}`;
      more.textContent = 'Подробнее';

      const apply = document.createElement('a');
      apply.className = 'btn primary';
      apply.href = `admission.html?uni=${encodeURIComponent(u.id)}`;
      apply.textContent = 'Подать заявление';

      actions.appendChild(more);
      actions.appendChild(apply);

      body.appendChild(title);
      body.appendChild(short);
      body.appendChild(meta);
      body.appendChild(actions);

      card.appendChild(logo);
      card.appendChild(body);
      container.appendChild(card);
    });
  }

  return {
    fetchUniversities,
    fetchUniversityById,
    renderUniversityCards,
    escapeHtml
  };
})();

// глобально доступно как window.DataHub (индекс.html вызывает DataHub.fetchUniversities())
window.DataHub = DataHub;
