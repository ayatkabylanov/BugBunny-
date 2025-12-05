// university.js — загрузка данных из статического файла assets/data/universities.json

(function(){
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id") || "kaznu"; // по умолчанию kaznu

  fetch('assets/data/universities.json')
    .then(res => {
      if (!res.ok) throw new Error('Не удалось загрузить данные университетов');
      return res.json();
    })
    .then(db => {
      const data = db.universities.find(u => u.id === id);
      if (!data) {
        document.querySelector('main').innerHTML = '<p>Университет не найден.</p>';
        return;
      }

      // базовые поля
      const qs = s => document.querySelector(s);
      if (qs('.university-name')) qs('.university-name').textContent = data.name;
      if (qs('.university-city')) qs('.university-city').textContent = data.city;
      if (qs('.university-rating')) qs('.university-rating').textContent = `⭐ ${data.rating}`;
      if (qs('.short-desc')) qs('.short-desc').textContent = data.short_desc;
      if (qs('.long-desc')) qs('.long-desc').textContent = data.long_desc;

      // контакты
      if (qs('.contact-phone')) qs('.contact-phone').textContent = data.contact.phone;
      if (qs('.contact-email')) qs('.contact-email').textContent = data.contact.email;
      if (qs('.contact-address')) qs('.contact-address').textContent = data.contact.address;

      // статистика
      if (qs('.programs-count')) qs('.programs-count').textContent = data.programs_count;
      if (qs('.students-count')) qs('.students-count').textContent = data.student_count;
      if (qs('.faculty-count')) qs('.faculty-count').textContent = data.faculty_count;

      // галерея
      const gallery = qs('.university-gallery');
      if (gallery) {
        gallery.innerHTML = '';
        if (Array.isArray(data.gallery) && data.gallery.length) {
          data.gallery.forEach(src => {
            const img = document.createElement('img');
            img.src = src;
            img.alt = data.name;
            img.className = 'gallery-img';
            gallery.appendChild(img);
          });
        } else {
          gallery.innerHTML = '<p>Нет изображений.</p>';
        }
      }

      // партнёры
      const partners = qs('.university-partners');
      if (partners) {
        partners.innerHTML = '';
        if (Array.isArray(data.partners) && data.partners.length) {
          data.partners.forEach(p => {
            const li = document.createElement('li');
            li.textContent = `${p.partner_name} (${p.country})`;
            partners.appendChild(li);
          });
        } else {
          partners.innerHTML = '<li>Партнёры не указаны.</li>';
        }
      }

      // 3D-тур (если есть)
      const tourEl = qs('.university-tour');
      if (tourEl) {
        if (data.tour && data.tour.length) {
          tourEl.innerHTML = `<a href="${data.tour}" target="_blank">Посмотреть 3D-тур</a>`;
        } else {
          tourEl.innerHTML = '3D-тур не доступен';
        }
      }

      // динамические ссылки на другие вузы (опционально)
      const other = qs('.other-unis');
      if (other) {
        other.innerHTML = `
          <strong>Другие университеты:</strong>
          <a href="university.html?id=kaznu">КазНУ</a> |
          <a href="university.html?id=aues">АУЭС</a> |
          <a href="university.html?id=kbtu">КБТУ</a> |
          <a href="university.html?id=iitu">МУИТ</a> |
          <a href="university.html?id=aitu">АйТУ</a>
        `;
      }
    })
    .catch(err => {
      console.error(err);
      document.querySelector('main').innerHTML = `<p>Ошибка: ${err.message}</p>`;
    });
})();
