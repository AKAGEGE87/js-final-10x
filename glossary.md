# Glossary — 10X CRM Technical Terms

10 technical terms used in this project, with English definitions and Georgian explanations.

---

## 1. Authentication (n.)
**English:** The process of verifying that a user is who they claim to be, typically by checking credentials such as an email and password against stored records.

**ქართულად:** ავტორიზაცია — მომხმარებლის ვინაობის დადასტურების პროცესი. ჩვენს პროექტში ეს ნიშნავს email-ისა და პაროლის შედარებას `crm_users` მასივთან.

---

## 2. Session (n.)
**English:** A temporary record stored in the browser that keeps track of the currently logged-in user. In this project, stored as `crm_session` in `localStorage`.

**ქართულად:** სესია — დროებითი ჩანაწერი, რომელიც „ახსოვს" ბრაუზერს ვინ არის შესული სისტემაში. ლოგინისას იქმნება, ლოგაუთისას იშლება.

---

## 3. Validation (n.)
**English:** The process of checking that user input meets required rules (e.g., minimum length, correct format, uniqueness) before processing or saving the data.

**ქართულად:** ვალიდაცია — მომხმარებლის შეყვანილი მონაცემების სისწორის შემოწმება. მაგ: პაროლი მინ. 8 სიმბოლო, email-ში @ სიმბოლოს არსებობა.

---

## 4. Fetch (v. / n.)
**English:** A modern browser API (`fetch()`) used to make asynchronous HTTP requests to a server. Returns a Promise that resolves with the server's response.

**ქართულად:** `fetch()` — ბრაუზერის ჩაშენებული ფუნქცია, რომელიც გვეხმარება სერვერთან ასინქრონულ კომუნიკაციაში. ჩვენ ვიყენებთ DummyJSON-ის API-სთან GET, POST და DELETE ოპერაციებისთვის.

---

## 5. Endpoint (n.)
**English:** A specific URL on an API server that handles a particular type of request. For example, `https://dummyjson.com/users/add` is the endpoint for adding a new user.

**ქართულად:** ენდფოინთი — API-ს კონკრეტული მისამართი, რომელსაც გარკვეული მოქმედება შეუძლია. ყოველ ენდფოინთს განსხვავებული HTTP მეთოდი (GET, POST, DELETE) შეიძლება ჰქონდეს.

---

## 6. Request Method (n.)
**English:** The HTTP verb that tells the server what action to perform: `GET` (retrieve data), `POST` (create), `PUT` (update), `DELETE` (remove).

**ქართულად:** HTTP მეთოდი — სერვერთან ურთიერთობის ტიპი. GET = მოიტანე, POST = შექმენი, PUT = განაახლე, DELETE = წაშალე. ჩვენ ვიყენებთ GET, POST და DELETE-ს.

---

## 7. JSON (abbr.)
**English:** JavaScript Object Notation — a lightweight text format for storing and transmitting structured data. Used by APIs and `localStorage` to serialize objects.

**ქართულად:** JSON — JavaScript-ის ობიექტის ტექსტური ფორმატი. `JSON.stringify()` ობიექტს სტრიქონად გარდაქმნის (შენახვისთვის), `JSON.parse()` — სტრიქონს ობიექტად (წასაკითხად).

---

## 8. State (n.)
**English:** The current data held in memory by the application. In this project, `clientsState` is the array of Client objects that all rendering is based on. When state changes, the UI re-renders.

**ქართულად:** სტეიტი — აპლიკაციის მონაცემების მიმდინარე მდგომარეობა მეხსიერებაში. PRD-ის „ოქროს ციკლი": სტეიტი იცვლება → ინახება → ეკრანი თავიდან იხატება.

---

## 9. Event Listener (n.)
**English:** A function registered on a DOM element that waits for a specific event (e.g., `click`, `submit`, `input`) and runs a callback when that event occurs.

**ქართულად:** ივენთ ლისენერი — ფუნქცია, რომელიც „ელოდება" კონკრეტულ მოვლენას (ღილაკზე დაჭერა, ფორმის გაგზავნა) და მასზე პასუხობს. `addEventListener('click', handler)`.

---

## 10. Deployment (n.)
**English:** The process of publishing a finished web application to a hosting service (e.g., Vercel, Netlify) so it is accessible to users on the internet via a public URL.

**ქართულად:** დეპლოი — აპლიკაციის ინტერნეტში გამოქვეყნება, რომ ნებისმიერ ადამიანს შეეძლოს მისი გახსნა ბრაუზერში. ჩვენ ვიყენებთ Vercel ან Netlify-ს.

---

*Terms selected from actual code and concepts used in the 10X CRM project.*
