# GasVision Трекер

Командный таск-трекер в стиле Kaiten: канбан-доска с drag-and-drop,
календарь и роадмап (диаграмма Ганта) — все три вида читают одни и те же
задачи.

- **Доска** — колонки (по умолчанию Новое / В работе / Завершено /
  Отменено, можно добавлять свои), перетаскивание задач и колонок,
  быстрое создание задачи по заголовку.
- **Карточка задачи** — исполнитель, важность, критичность, срок, тэги,
  описание. Одна и та же модалка открывается с доски, из календаря и из
  роадмапа.
- **Календарь** — задачи на датах начала/срока, клик открывает карточку.
- **Роадмап** — диаграмма Ганта, полоски можно двигать мышью — меняются
  даты задачи.
- **Авторизация** — email + пароль, свой аккаунт для каждого участника
  команды.

## Стек

Next.js 16 (App Router) + TypeScript · Prisma 7 + SQLite ·
Auth.js (NextAuth v5) · dnd-kit · react-big-calendar · gantt-task-react ·
shadcn/ui + Tailwind v4

## Быстрый старт (локально)

Требуется Node.js 20.9+ (в разработке использовался Node 22).

```bash
npm install
cp .env.example .env   # заполнить AUTH_SECRET, см. ниже
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Открыть [http://localhost:3000](http://localhost:3000), зарегистрировать
первого пользователя на `/register`.

### Переменные окружения (`.env`)

| Переменная | Обязательна | Назначение |
| --- | --- | --- |
| `DATABASE_URL` | да | Путь к SQLite-файлу, по умолчанию `file:./dev.db` |
| `AUTH_SECRET` | да | Ключ для подписи сессий. Сгенерировать: `openssl rand -base64 32` |

## Запуск в Docker

Для развёртывания на сервере / раздачи команде без локальной настройки —
см. **[DOCKER.md](./DOCKER.md)**: там про переменные окружения для
Docker, персистентность SQLite в volume, применение миграций,
бэкап/восстановление базы и типичные проблемы.

Коротко:

```bash
cp .env.docker.example .env
docker compose up -d --build
```

## Полезные команды

| Команда | Что делает |
| --- | --- |
| `npm run dev` | Локальный dev-сервер с hot reload |
| `npm run build` / `npm run start` | Продакшен-сборка и запуск |
| `npm run lint` | ESLint |
| `npx prisma migrate dev --name <имя>` | Создать и применить новую миграцию схемы после правок `prisma/schema.prisma` |
| `npx prisma studio` | GUI для просмотра/правки данных в БД |
| `npm run docker:up` / `docker:down` / `docker:logs` | Управление Docker-контейнером |

## Структура проекта

```
src/
  app/                    страницы (App Router) и API route handlers
    (app)/                защищённые страницы: доска, календарь, роадмап
    api/                  REST-эндпоинты (tasks, columns, tags, users, auth)
    login/, register/     страницы авторизации
  components/
    board/                канбан-доска, колонки, карточки
    calendar/              вью календаря
    roadmap/               вью диаграммы Ганта
    task/                  модалка задачи, общая для всех трёх вью
    ui/                    shadcn/ui компоненты
  hooks/                  SWR-хуки для данных (задачи, колонки, тэги, юзеры)
  lib/                    Prisma-клиент, zod-схемы, общие типы
  auth.ts, proxy.ts       конфигурация Auth.js и защита роутов
prisma/                   схема БД, миграции, сид системных колонок
```

## Разработка со схемой БД

Правки `prisma/schema.prisma` → `npx prisma migrate dev --name <имя>` →
закоммитить новую папку в `prisma/migrations/`. На сервере (в том числе
в Docker) миграции применяются командой `prisma migrate deploy` —
подробности в [DOCKER.md](./DOCKER.md).
