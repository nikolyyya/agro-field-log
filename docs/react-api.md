# API журнала для React

## Адрес и авторизация

Все маршруты начинаются с `/api/` и заканчиваются косой чертой. При локальной
разработке настрой прокси React-сервера для `/api` на `http://127.0.0.1:8000`.
При развёртывании относительные URL рассчитаны на один origin для React и API.

| Метод и маршрут | Тело запроса | Успешный ответ |
| --- | --- | --- |
| `GET /api/health/` | — | `200` и `{"status":"ok"}` |
| `POST /api/auth/token/` | `{"username":"…","password":"…"}` | `200` и `{"token":"…"}` |

Передавай `Authorization: Token <токен>` во всех остальных запросах.
Для JSON-тела указывай `Content-Type: application/json`. Агроном и
руководитель могут читать журнал и его справочники. Записи меняет агроном,
а отчёт доступен руководителю.

## Справочники

У каждого ресурса есть список и отдельная карточка, например
`GET /api/fields/1/`. Список возвращает JSON-массив, карточка возвращает объект.

| Маршрут списка | Поля объекта |
| --- | --- |
| `GET /api/fields/` | `id`, `name`, `area_ha` |
| `GET /api/seasons/` | `id`, `name`, `start_date`, `end_date` |
| `GET /api/plantings/` | `id`, `field`, `crop`, `crop_name`, `season`, `planted_on` |

Идентификаторы приходят числами. Даты приходят строками `YYYY-MM-DD`,
площадь приходит строкой с двумя знаками после точки.

## Записи журнала

| Метод и маршрут | Действие | Успешный ответ |
| --- | --- | --- |
| `GET /api/work-entries/` | Получить список | `200` и массив записей |
| `POST /api/work-entries/` | Создать запись | `201` и запись |
| `GET /api/work-entries/{id}/` | Получить запись | `200` и запись |
| `PUT /api/work-entries/{id}/` | Передать все обязательные поля записи | `200` и запись |
| `PATCH /api/work-entries/{id}/` | Передать только изменённые поля | `200` и запись |
| `DELETE /api/work-entries/{id}/` | Удалить запись | `204` с пустым телом |

Для списка можно передать один или оба фильтра `field` и `season`, например
`/api/work-entries/?field=1&season=2`. Записи отсортированы от новых дат к старым.

Пример тела запроса на создание.

```json
{
  "planting": 3,
  "work_date": "2026-06-10",
  "title": "Подкормка",
  "cost": "3500.00",
  "notes": ""
}
```

Обязательны `planting`, `work_date`, `title` и `cost`. Примечания можно
опустить. Дата работы должна попасть в сезон выбранного посева включительно.
Затраты в рублях могут быть нулевыми. Передавай суммы десятичными строками
с точностью до копеек. Ответ возвращает все поля из примера и дополнительно
`id`, `field` и `season`. Сервер вычисляет `field` и `season` по посеву.

## Отчёт по затратам

`GET /api/reports/costs/?season=2&field=1` возвращает `200` и JSON-массив.
Оба фильтра необязательны. Каждая строка соответствует паре «поле и сезон»,
для которой есть хотя бы один посев. Отчёт складывает затраты всех работ
по всем её посевам и делит сумму на текущую площадь поля. Затраты на гектар
округляются до копеек, половина копейки округляется вверх. Если посевы есть,
а работ пока нет, обе суммы равны `"0.00"`. Если подходящих посевов нет,
ответ содержит пустой массив.

```json
[
  {
    "field": 1,
    "field_name": "Демо — Северное",
    "season": 2,
    "season_name": "Демо — 2026",
    "area_ha": "12.50",
    "total_cost": "12500.00",
    "cost_per_ha": "1000.00"
  }
]
```

## Обработка ответов

| Статус | Что обработать в интерфейсе |
| --- | --- |
| `400` | Ошибки полей валидации. Ключ объекта соответствует полю, значение содержит список сообщений. Ошибка входа может прийти под ключом `non_field_errors` |
| `401` | В защищённом запросе отсутствует действительный токен |
| `403` | Учётная запись не имеет нужного права |
| `404` | Запись или карточка с указанным ID не найдена |
| `429` | Достигнут лимит попыток входа. Повтори запрос после интервала из `Retry-After` |

Пример чтения отчёта из React с обработкой ошибок через статус ответа.

```ts
export type CostRow = {
  field: number;
  field_name: string;
  season: number;
  season_name: string;
  area_ha: string;
  total_cost: string;
  cost_per_ha: string;
};

export async function getCostReport(
  token: string,
  filters: { field?: number; season?: number } = {},
): Promise<CostRow[]> {
  const query = new URLSearchParams();
  if (filters.field !== undefined) query.set("field", String(filters.field));
  if (filters.season !== undefined) query.set("season", String(filters.season));
  const url = new URL("/api/reports/costs/", window.location.origin);
  url.search = query.toString();

  const response = await fetch(url, {
    headers: { Accept: "application/json", Authorization: `Token ${token}` },
  });
  if (!response.ok) throw response;
  return response.json();
}
```

После удаления проверяй `response.status === 204` перед чтением JSON.
