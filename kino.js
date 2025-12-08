(function () {
    'use strict';
    
    // --- КОНФІГУРАЦІЯ ---
    const API_KEY = '4dac8d33b5f9ef7b7c69d94b3f9cd56b'; // Ваш TMDB ключ
    const BASE_URL = 'https://api.themoviedb.org/3';
    const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w300';
    const URL_POPULAR = `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=uk-UA&page=1`;

    class TmdbPlugin {
        constructor() {
            this.app = new Lampa.Component.Store('tmdb_popular_movies');
            this.component = this.app.render();
            this.wall = null;
            this.build();
        }

        async fetchMovies() {
            try {
                const response = await fetch(URL_POPULAR);
                const data = await response.json();
                return data.results.map(item => ({
                    id: item.id,
                    title: item.title,
                    poster: item.poster_path ? IMAGE_BASE_URL + item.poster_path : './img/no_poster.png',
                    movie: item // Зберігаємо для сторінки деталей
                }));
            } catch (error) {
                console.error('TMDB Fetch Error:', error);
                return [];
            }
        }

        onSelect(element) {
            const item_data = element.movie;
            Lampa.Component.Details.call((details) => {
                details.render(item_data);
                Lampa.Controller.add('content', {
                    selector: details.render(),
                    onBack: () => {
                        details.destroy();
                        Lampa.Controller.toggle('content');
                    }
                });
                Lampa.Controller.toggle('content');
            }, item_data);
        }

        async build() {
            this.component.appendChild(Lampa.Template.js('title', { title: 'Популярні фільми (TMDB)' }));
            
            const items = await this.fetchMovies();
            
            if (items.length === 0) {
                this.component.innerHTML += '<p style="padding: 2em; text-align: center;">Помилка: Немає даних.</p>';
                return;
            }

            this.wall = new Lampa.Component.PosterWall();
            this.wall.render({ items: items, auto_scroll: false, empty: true });
            
            // Самореєстрація функції вибору
            this.wall.onSelect = (element) => this.onSelect(element);
            
            this.component.appendChild(this.wall.render());
            
            Lampa.Controller.add('content', {
                selector: this.component,
                link: this.wall.render(),
                onBack: () => Lampa.Controller.toggle('content')
            });
            Lampa.Controller.set(this.wall.render());
        }
        
        start() {
            Lampa.Controller.add('content', this.component);
            Lampa.Controller.toggle('content');
            if (this.wall) this.wall.controller.focus();
        }

        destroy() {
            if (this.wall) this.wall.destroy();
            this.app.destroy();
        }
    }

    // --- САМОРЕЄСТРАЦІЯ (ЗАМІНЮЄ info.json) ---
    Lampa.Utils.add({
        name: 'TmdbPlugin',        // Ім'я, яке відображатиметься в меню
        component: TmdbPlugin,     // Клас плагіна
        type: 'all'                // Розміщення в меню (усі)
    });

})();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {};
}
