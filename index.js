(function () {
    'use strict';
    
    // --- НАЛАШТУВАННЯ ---
    const API_KEY = '4dac8d33b5f9ef7b7c69d94b3f9cd56b'; // !! ЗАМІНІТЬ НА СВІЙ КЛЮЧ TMDB !!
    const BASE_URL = 'https://api.themoviedb.org/3';
    const POPULAR_MOVIES_URL = `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=uk-UA&page=1`;
    const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w300';

    class TmdbPlugin {
        
        // Використовуємо компонент Store, який краще підходить для сторінок зі списками
        constructor() {
            // Створюємо контейнер для нашого компонента
            this.app = new Lampa.Component.Store('tmdb_popular_movies');
            this.component = this.app.render();
            
            this.page = 1;
            this.loaded_items = []; // Зберігатимемо завантажені фільми
            
            this.build();
        }

        /** * Отримує дані про популярні фільми з TMDB 
         */
        async getMovies() {
            try {
                // Виконуємо HTTP-запит
                const response = await fetch(POPULAR_MOVIES_URL);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                
                // Зберігаємо результати
                this.loaded_items = data.results;
                
                // Готуємо дані для Lampa, конвертуючи їх у потрібний формат
                return this.convertToLampaFormat(this.loaded_items);
            } catch (error) {
                console.error('Помилка завантаження фільмів з TMDB:', error);
                // Повертаємо порожній масив у разі помилки
                return [];
            }
        }

        /**
         * Конвертує об'єкти TMDB у формат, зрозумілий для компонента PosterWall Lampa.
         */
        convertToLampaFormat(items) {
            return items.map(item => {
                return {
                    // ID має бути унікальним
                    id: item.id,
                    // Тип контенту (фільм)
                    title: item.title,
                    original_title: item.original_title,
                    // Повний URL постера
                    poster: item.poster_path ? IMAGE_BASE_URL + item.poster_path : './img/no_poster.png',
                    // Додаткові дані, які Lampa може використати для сторінки деталей
                    movie: item
                };
            });
        }
        
        /**
         * Будує інтерфейс плагіна
         */
        async build() {
            // 1. Створюємо заголовок
            const title = Lampa.Template.js('title', {
                title: 'Популярні фільми (TMDB)'
            });
            this.component.appendChild(title);
            
            // 2. Завантажуємо дані
            const items = await this.getMovies();
            
            if (items.length === 0) {
                this.component.innerHTML += '<p style="padding: 2em; text-align: center;">Неможливо завантажити дані. Перевірте API-ключ або підключення.</p>';
                return;
            }

            // 3. Створюємо сітку постерів (PosterWall)
            // Lampa.Component.PosterWall - це компонент, який автоматично відображає сітку і обробляє навігацію
            this.wall = new Lampa.Component.PosterWall();
            
            // Встановлюємо дані
            this.wall.render({
                items: items,
                // Налаштовуємо колонки, щоб вмістити більше постерів
                auto_scroll: false,
                empty: true
            });
            
            // 4. Додаємо стіну постерів до нашого компонента
            this.component.appendChild(this.wall.render());
            
            // 5. Встановлюємо контролер (фокус)
            Lampa.Controller.add('content', {
                selector: this.component,
                link: this.wall.render(), // Навігація буде працювати всередині PosterWall
                onBack: () => {
                    // Вихід із плагіна
                    Lampa.Controller.toggle('content');
                }
            });

            // 6. Фокусуємося на першому елементі PosterWall
            Lampa.Controller.set
        }

        // ... (Методи start() і destroy() з попереднього прикладу) ...
        
        start() {
            Lampa.Controller.add('content', this.component);
            Lampa.Controller.toggle('content');
            // Якщо є PosterWall, встановлюємо фокус на нього
            if (this.wall) {
                this.wall.controller.focus();
            }
        }

        destroy() {
            // Знищуємо і PosterWall, і основний компонент
            if (this.wall) this.wall.destroy();
            this.app.destroy();
        }
    }

    // Реєстрація плагіна
    Lampa.Utils.add({
        name: 'TmdbPlugin', // Унікальна назва
        component: TmdbPlugin,
        type: 'all' 
    });

})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {};
}

    // ... (початок класу TmdbPlugin) ...

        /**
         * Обробляє вибір фільму у сітці
         * @param {object} element - Об'єкт Lampa, що містить дані про фільм (item.movie)
         */
        onMovieSelect(element) {
            // 1. Отримуємо сирі дані фільму, збережені під час конвертації
            const item_data = element.movie; 
            
            // 2. Створюємо компонент деталей
            // Lampa.Component.Details - це стандартна сторінка деталей
            Lampa.Component.Details.call((details) => {
                
                // details.render() приймає об'єкт з даними фільму. 
                // Ми передаємо йому наш об'єкт TMDB.
                details.render(item_data); 
                
                // 3. Додаємо сторінку деталей до навігації Lampa
                Lampa.Controller.add('content', {
                    selector: details.render(),
                    onBack: () => {
                        // При натисканні "Назад" закриваємо деталі
                        details.destroy();
                        // Повертаємо фокус на наш плагін (сітку постерів)
                        Lampa.Controller.toggle('content'); 
                    }
                });

                // 4. Перемикаємо фокус на сторінку деталей
                Lampa.Controller.toggle('content');
                
            }, item_data); // другий аргумент - об'єкт, який передається в конструктор Details
        }
    
        // ... (продовження класу TmdbPlugin) ...


// ... (всередині класу TmdbPlugin, оновлюємо метод build) ...

        async build() {
            // ... (частина з заголовком і завантаженням даних залишається) ...
            
            const items = await this.getMovies();
            
            // ... (перевірка на помилку залишається) ...

            this.wall = new Lampa.Component.PosterWall();
            
            this.wall.render({
                items: items,
                auto_scroll: false,
                empty: true
            });
            
            // *** НОВИЙ КОД: ОБРОБНИК ВИБОРУ ***
            this.wall.onSelect = (element) => {
                // Викликаємо функцію обробки при виборі елемента
                this.onMovieSelect(element);
            };
            // **********************************
            
            this.component.appendChild(this.wall.render());
            
            Lampa.Controller.add('content', {
                selector: this.component,
                link: this.wall.render(),
                onBack: () => {
                    Lampa.Controller.toggle('content');
                }
            });

            Lampa.Controller.set(this.wall.render()); // Встановлюємо фокус на сітку

            // ... (кінець методу build) ...
        }

// ... (кінець класу TmdbPlugin) ...


// ...
movie: item // Зберігаємо тут оригінальний об'єкт TMDB
// ...
