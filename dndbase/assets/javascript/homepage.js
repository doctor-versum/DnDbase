fetch('index.json')
    .then(response => response.json())
    .then(data => {
      const contentTable = document.getElementById('content');

      // Durch jede Kategorie gehen
      Object.keys(data).forEach(category => {
        // Zeile für Kategorie-Überschrift
        const categoryRow = document.createElement('tr');
        const categoryCell = document.createElement('td');
        categoryCell.className = 'category';
        categoryCell.colSpan = 2; // Für die volle Breite
        const categoryTitle = document.createElement('h2');
        categoryTitle.textContent = category.charAt(0).toUpperCase() + category.slice(1); // Erster Buchstabe groß
        categoryCell.appendChild(categoryTitle);
        categoryRow.appendChild(categoryCell);
        contentTable.appendChild(categoryRow);

        // Zeile für Links
        const linksRow = document.createElement('tr');
        const linksCell = document.createElement('td');
        linksCell.className = 'links';
        linksCell.colSpan = 2; // Für die volle Breite

        Object.entries(data[category]).forEach(([pageName, pagePath]) => {
          const link = document.createElement('a');
          link.href = `#${pagePath}`;
          link.textContent = pageName;
          link.style.display = 'block'; // Jeder Link in einer neuen Zeile
          link.addEventListener('click', function (e) {
            e.preventDefault(); // Standardverhalten verhindern
            if (window.parent && window.parent !== window) {
              window.parent.location.hash = pagePath; // Hash im übergeordneten Fenster setzen
            } else {
              window.location.hash = pagePath; // Fallback
            }
          });
          linksCell.appendChild(link);
        });

        linksRow.appendChild(linksCell);
        contentTable.appendChild(linksRow);
      });

      // Suchfunktion
      document.getElementById('search-bar').addEventListener('input', function () {
        const searchTerm = this.value.toLowerCase();
        const rows = contentTable.querySelectorAll('tr');

        rows.forEach(row => {
          if (row.querySelector('.links')) {
            const links = row.querySelectorAll('.links a');
            let hasMatch = false;

            links.forEach(link => {
              const pageName = link.textContent.toLowerCase();
              if (pageName.includes(searchTerm)) {
                link.style.display = 'block';
                hasMatch = true;
              } else {
                link.style.display = 'none';
              }
            });

            row.style.display = hasMatch ? '' : 'none';
          }
        });
      });
    });