# Research Note — DummyJSON API

## Source

**URL:** https://dummyjson.com/docs/users  
**Type:** Official API Documentation

---

## How I Found It

**Search keywords used:** `free fake REST API users JSON`, `mock api with real user data`, `dummyjson users endpoint`

I found DummyJSON through a Google search for free test APIs. The PRD mentioned it by name, so I then read its official documentation to understand how the response is structured before writing the data-mapping code.

---

## Key Points from the Documentation

1. **Base URL:** `https://dummyjson.com` — no API key or registration needed.

2. **GET /users?limit=30** returns an object with a `users` array (not a direct array). This is important:
   ```javascript
   const data = await response.json();
   const users = data.users; // ← must access .users property
   ```
   If you try to `.map()` directly on `data`, you get an error because `data` is an object, not an array.

3. **Company name** is nested: `user.company.name` (not `user.company`). This is a common mistake — the PRD explicitly warned about this.

4. **POST /users/add** and **DELETE /users/{id}** are *simulated* — the API returns a valid success response but does not actually persist the data in its database. This is by design for a test API and is why `localStorage` is the real source of truth in this project.

5. **User image** field: `user.image` contains a full URL (e.g., `https://dummyjson.com/icon/emilys/128`). This is used directly as the client avatar.

---

## ქართული რეზიუმე (5-6 წინადადება)

DummyJSON არის უფასო სატესტო REST API, რომელიც რეალისტური გამოგონილი მონაცემებს გვაძლევს — მომხმარებლებს, პროდუქტებს, კომენტარებს და ა.შ. ამ პროექტში ვიყენებთ `/users?limit=30` ენდფოინთს, რომელიც 30 მომხმარებელს გვიბრუნებს `data.users` მასივის სახით. POST და DELETE ოპერაციები API-ს მხარეს არარეალია — სერვერი პასუხს იძლევა, მაგრამ ფაქტობრივად ბაზაში არაფერს ინახავს. ამიტომ ჩვენი `localStorage` არის ყველა ცვლილების ჭეშმარიტი საცავი. ამ API-ის გამოყენება საშუალებას მაძლევს ვიმუშაო ასინქრონულ fetch/async/await ლოგიკასთან და GET/POST/DELETE HTTP მეთოდებთან, რომლებიც რეალურ პროდუქტებში ყოველდღიურად გამოიყენება.

---

*This note documents genuine research done while building 10X CRM.*
