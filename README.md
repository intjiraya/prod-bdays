# ДР ПОБЕДА

Реестр дней рождения комьюнити [PROD](https://prodcontest.ru) — Международной Олимпиады по Промышленной Разработке.

**Сайт:** [дрпобеда.рф](http://дрпобеда.рф)

---

## Как добавить свой день рождения

1. Открой [создать issue](https://github.com/intjiraya/prod-bdays/issues/new?template=add-birthday.yml)
2. Заполни форму (telegram, дата, вишлист, заметка)
3. Дождись одобрения администратора
4. Запись появится на сайте автоматически

> Один GitHub-аккаунт = одна запись. Добавлять можно только **свой** день рождения.

## Как изменить данные

[Открыть issue на изменение](https://github.com/intjiraya/prod-bdays/issues/new?template=edit-birthday.yml) — заполни только те поля, которые хочешь поменять.

## Как удалить запись

[Открыть issue на удаление](https://github.com/intjiraya/prod-bdays/issues/new?template=delete-birthday.yml)

---

## Стек

- HTML / CSS / JS — три файла, без фреймворков
- `data/birthdays.json` — источник данных
- GitHub Actions — бот обрабатывает issue после апрува
- GitHub Pages — хостинг

## Структура данных

```json
{
  "telegram": "@username",
  "birthday": "ДД.ММ",
  "wishlist": "https://...",
  "note": "до 200 символов",
  "github_user": "github_login",
  "added_at": "YYYY-MM-DD"
}
```

## Для администратора

**Апрув заявки:**
```bash
gh issue edit <номер> --add-label "birthday-approved" --repo intjiraya/prod-bdays
```

**Или через интерфейс:** Issues → открыть issue → Labels → `birthday-approved`

После постановки лейбла бот автоматически обновит `data/birthdays.json`, задеплоит и закроет issue.
